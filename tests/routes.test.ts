// Route tests: createApp() on an ephemeral 127.0.0.1 port, called with the built-in fetch.
// Outbound traffic is stubbed: the undici fetch used by safeFetch is replaced, and DNS plus any non-loopback
// global fetch throw, so no test can reach the real network.
import dns from 'node:dns';
import fs from 'node:fs';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const outbound = vi.hoisted(() => ({
  handler: null as null | ((url: string, init: any) => Promise<Response>),
  calls: [] as Array<{ url: string; method: string; redirect: string }>,
}));

vi.mock('undici', async (importOriginal) => {
  const actual = await importOriginal<typeof import('undici')>();
  return {
    ...actual,
    fetch: async (input: any, init: any = {}) => {
      const url = String(input);
      outbound.calls.push({ url, method: init.method || 'GET', redirect: init.redirect });
      if (!outbound.handler) throw new Error(`unexpected outbound request to ${url}`);
      return outbound.handler(url, init);
    },
  };
});

const realFetch = globalThis.fetch;
const VERSION = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;

let createApp: typeof import('../server/app').createApp;
let registry: typeof import('../src/registry/registry');
let net: typeof import('../src/core/net');

interface Running { base: string; close: () => Promise<void> }

async function start(): Promise<Running> {
  const server: http.Server = await new Promise((resolve) => {
    const s = createApp().listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(() => resolve())) };
}

let app: Running;

function call(path: string, init: { method?: string; body?: unknown; raw?: string; headers?: Record<string, string> } = {}) {
  const hasBody = init.body !== undefined || init.raw !== undefined;
  return realFetch(app.base + path, {
    method: init.method || (hasBody ? 'POST' : 'GET'),
    headers: { ...(hasBody ? { 'content-type': 'application/json' } : {}), ...init.headers },
    body: init.raw ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });
}

async function json(path: string, init?: Parameters<typeof call>[1]) {
  const response = await call(path, init);
  const type = response.headers.get('content-type') || '';
  return { status: response.status, headers: response.headers, type, body: type.includes('json') ? await response.json() : await response.text() };
}

beforeAll(async () => {
  process.env.MINEIRO_DB = ':memory:';
  delete process.env.GEMINI_API_KEY;
  delete process.env.MINEIRO_PUBLIC;
  delete process.env.MINEIRO_ENABLE_LEGACY_PROFILE;
  delete process.env.MINEIRO_USER_AGENT;

  // listen() resolves its own host; everything else is refused.
  const realLookup = dns.lookup;
  vi.spyOn(dns, 'lookup').mockImplementation(((host: string, ...rest: any[]) => {
    if (host === '127.0.0.1') return (realLookup as any)(host, ...rest);
    throw new Error(`unexpected DNS lookup for ${host}`);
  }) as any);
  vi.spyOn(dns.promises, 'resolveMx').mockImplementation(async (host: string) => { throw new Error(`unexpected MX lookup for ${host}`); });
  vi.stubGlobal('fetch', async (input: any, init?: any) => {
    const url = new URL(String(input instanceof Request ? input.url : input));
    if (url.hostname !== '127.0.0.1') throw new Error(`unexpected outbound request to ${url.href}`);
    return realFetch(input, init);
  });

  ({ createApp } = await import('../server/app'));
  registry = await import('../src/registry/registry');
  net = await import('../src/core/net');
  app = await start();
});

afterAll(async () => {
  await app?.close();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  outbound.handler = null;
  outbound.calls = [];
});

describe('GET /api/health', () => {
  it('reports the package version and the security headers', async () => {
    const res = await json('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', version: VERSION, geminiConfigured: false, publicMode: false });
    expect(typeof res.body.timestamp).toBe('string');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    expect(res.headers.get('x-powered-by')).toBeNull();
  });
});

describe('registry routes', () => {
  it('GET /api/registry/stats matches getRegistryStats()', async () => {
    const res = await json('/api/registry/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(JSON.parse(JSON.stringify(registry.getRegistryStats())));
    expect(res.body.totalDetectors).toBe(registry.MINEIRO_REGISTRY.length);
  });

  it('GET /api/registry/detectors lists everything, or filters by category and tier', async () => {
    const all = await json('/api/registry/detectors');
    expect(all.status).toBe(200);
    expect(all.body.count).toBe(registry.MINEIRO_REGISTRY.length);
    expect(all.body.detectors).toHaveLength(all.body.count);

    const filtered = await json('/api/registry/detectors?category=security&tier=medium');
    expect(filtered.body.count).toBe(filtered.body.detectors.length);
    expect(filtered.body.count).toBeLessThan(all.body.count);
    for (const detector of filtered.body.detectors) {
      expect(detector.category).toBe('security');
      expect(detector.reliabilityTier).toBe('medium');
    }
  });

  it('POST /api/registry/benchmark keeps only known detector ids and caps observations', async () => {
    const ok = await json('/api/registry/benchmark', { body: { detectorIds: ['github', 'gitlab', 'not-a-detector'] } });
    expect(ok.status).toBe(200);
    expect(ok.body).toMatchObject({ detectors: 2, observations: 0 });

    const tooMany = await json('/api/registry/benchmark', { body: { observations: new Array(10001).fill({}) } });
    expect(tooMany.status).toBe(400);
    expect(tooMany.body.error).toMatch(/10,000/);
  });
});

describe('GET /api/intelligence/copilot/status', () => {
  it('is not configured without a key', async () => {
    const res = await json('/api/intelligence/copilot/status');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ configured: false, source: 'none', provider: 'Google Gemini' });
    expect(res.body.supportedModels).toContain(res.body.defaultModel);
  });

  it('reports a personal key sent in the header without calling the provider', async () => {
    const res = await json('/api/intelligence/copilot/status', { headers: { 'x-gemini-api-key': 'dummy-key-not-real-0000' } });
    expect(res.body).toMatchObject({ configured: true, source: 'personal' });
    expect(outbound.calls).toHaveLength(0);
  });
});

describe('input validation of POST routes', () => {
  const cases: Array<[string, unknown, number, RegExp | Record<string, unknown>]> = [
    ['/api/osint/email-recon', {}, 400, /Valid email/],
    ['/api/osint/email-recon', { email: 'not-an-email' }, 400, /Valid email/],
    ['/api/osint/gemini-validate', {}, 200, { valid: false, isConfigured: false }],
    ['/api/intelligence/copilot', {}, 400, /assessment is required/],
    ['/api/intelligence/copilot', { assessment: { evidence: new Array(101).fill({ id: 'e' }) } }, 400, /at most 100/],
    ['/api/intelligence/copilot', { assessment: { evidence: [], findings: [], gaps: [] } }, 503, { errorType: 'not_configured' }],
    ['/api/osint/profile', { target: 'example' }, 410, { replacement: '/api/intelligence/copilot' }],
    ['/api/osint/verify', {}, 400, /platformId and url are required/],
    ['/api/osint/verify', { platformId: 'not-a-detector', url: 'https://example.com/x' }, 400, /Unknown or non-scannable/],
    ['/api/osint/verify', { platformId: 'github', url: 'https://example.com/someone' }, 400, /does not match/],
    ['/api/osint/variants', {}, 200, { variants: [] }],
    ['/api/osint/pivots', {}, 200, {}],
    ['/api/osint/avatar-hash', {}, 400, /avatarUrl required/],
    ['/api/osint/avatar-hash', { avatarUrl: 'http://169.254.169.254/latest/meta-data' }, 400, /Non-public address/],
    ['/api/osint/wayback', {}, 400, /platformId and a matching profile url/],
    ['/api/store/observations', { observations: [{ entity: { type: 'nope' } }] }, 400, /Invalid observation shape/],
    ['/api/store/observations', { observations: new Array(2001).fill({}) }, 400, /At most 2000/],
  ];

  it.each(cases)('POST %s %j -> %i', async (path, body, status, expected) => {
    const res = await json(path, { body });
    expect(res.status).toBe(status);
    expect(res.type).toContain('application/json');
    if (expected instanceof RegExp) expect(res.body.error).toMatch(expected);
    else expect(res.body).toMatchObject(expected);
    expect(outbound.calls).toHaveLength(0);
  });

  it('GET /api/osint/br/cnpj rejects an invalid CNPJ without calling BrasilAPI', async () => {
    const res = await json('/api/osint/br/cnpj/123');
    expect(res.status).toBe(400);
    expect(outbound.calls).toHaveLength(0);
  });
});

describe('POST /api/osint/verify with stubbed outbound fetch', () => {
  const profileUrl = (handle: string) => net.buildDetectorUrl(registry.getRegistryDetector('github')!.urlPattern, handle);
  const verify = (handle: string, extra: Record<string, unknown> = {}) =>
    json('/api/osint/verify', { body: { platformId: 'github', url: profileUrl(handle), username: handle, scanDepth: 'fast', ...extra } });

  it('probes exactly the detector URL with manual redirects and reports found on 200', async () => {
    outbound.handler = async () => new Response('<html>octo</html>', { status: 200, headers: { 'content-type': 'text/html' } });
    const res = await verify('routes-found');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ platformId: 'github', status: 'found', statusCode: 200, scanDepth: 'fast' });
    expect(outbound.calls).toEqual([{ url: profileUrl('routes-found'), method: 'GET', redirect: 'manual' }]);
  });

  it('reports not_found on 404', async () => {
    outbound.handler = async () => new Response('nope', { status: 404 });
    const res = await verify('routes-missing');
    expect(res.body).toMatchObject({ status: 'not_found', statusCode: 404, evidenceLevel: 'absent' });
  });

  it('reports uncertain on 403 in fast mode, without a retry', async () => {
    outbound.handler = async () => new Response('blocked', { status: 403 });
    const res = await verify('routes-blocked');
    expect(res.body).toMatchObject({ status: 'uncertain', statusCode: 403, wafRetried: false });
    expect(outbound.calls).toHaveLength(1);
  });

  it('reports error when the request fails', async () => {
    outbound.handler = async () => { throw new TypeError('fetch failed', { cause: new Error('connect ECONNREFUSED') }); };
    const res = await verify('routes-error');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'error', statusCode: 0, error: 'connect ECONNREFUSED' });
  });

  it('refuses to follow a redirect to a non-public address', async () => {
    outbound.handler = async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } });
    const res = await verify('routes-redirect');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Non-public address/);
    expect(outbound.calls).toHaveLength(1);
  });

  it('serves a repeated found result from the cache without a second probe', async () => {
    outbound.handler = async () => new Response('ok', { status: 200 });
    await verify('routes-cached');
    const again = await verify('routes-cached');
    expect(again.body).toMatchObject({ status: 'found', cached: true });
    expect(outbound.calls).toHaveLength(1);
  });
});

describe('unknown API routes', () => {
  it.each([
    ['GET', '/api/does-not-exist'],
    ['POST', '/api/osint/nope'],
    ['GET', '/api/osint/verify'], // exists only as POST
    ['GET', '/api'],
  ])('%s %s -> JSON 404, not the SPA (defect 6)', async (method, path) => {
    const res = await json(path, { method, ...(method === 'POST' ? { body: {} } : {}) });
    expect(res.status).toBe(404);
    expect(res.type).toContain('application/json');
    expect(res.body).toEqual({ error: 'Unknown API route', method, path });
  });
});

describe('POST /api/store/claims (SQLite in memory)', () => {
  const claim = (observationIds: unknown, extra: Record<string, unknown> = {}) => ({
    subject: { type: 'username', value: 'routes-a' }, predicate: 'linked_to',
    object: { type: 'username', value: 'routes-b' }, confidence: 70, observationIds, ...extra,
  });

  it('rejects an empty body with a validation message, not an internal error (defect 8)', async () => {
    const res = await json('/api/store/claims', { body: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/^Invalid claim: subject must be/);
    expect(res.body.error).toMatch(/observationIds must be an array/);
    expect(res.body.error).not.toMatch(/Cannot read properties|undefined/);
  });

  it.each([
    ['a bad predicate', claim([1], { predicate: 'is' }), /predicate must be one of/],
    ['a non-numeric confidence', claim([1], { confidence: 'high' }), /confidence must be a number/],
    ['non-integer observation ids', claim(['1']), /observationIds must be an array/],
    ['an object as note', claim([1], { note: { x: 1 } }), /note must be a string/],
    ['too many observation ids', claim(Array.from({ length: 501 }, (_, i) => i + 1)), /at most 500/],
    ['no observations', claim([]), /^A claim must reference at least one observation\.$/],
    ['unknown observations', claim([999999]), /^Claim references unknown observations\.$/],
  ])('rejects %s with 400', async (_label, body, message) => {
    const res = await json('/api/store/claims', { body });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(message);
  });

  it('stores a claim that cites a stored observation', async () => {
    const stored = await json('/api/store/observations', {
      body: { observations: [{ entity: { type: 'username', value: 'routes-b' }, source: 'GitHub', status: 'found' }] },
    });
    expect(stored.status).toBe(200);
    const res = await json('/api/store/claims', { body: claim(stored.body.ids) });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeGreaterThan(0);
  });
});

describe('error handling', () => {
  const leaks = /SyntaxError|Unexpected token|at .+\(|node_modules|Cannot destructure|req\.body/;

  it('answers malformed JSON with a JSON 400 (defect 7)', async () => {
    const res = await call('/api/osint/verify', { raw: '{not json' });
    const text = await res.text();
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    expect(JSON.parse(text)).toEqual({ error: 'Malformed JSON body' });
    expect(text).not.toMatch(leaks);
  });

  it('answers an oversized body with a JSON 413', async () => {
    const res = await call('/api/osint/pivots', { raw: JSON.stringify({ sources: [{ text: 'x'.repeat(2.2 * 1024 * 1024) }] }) });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: 'Request body too large' });
  });

  it('turns an unexpected exception into a generic JSON 500 without the internal message', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      // No content-type: req.body stays undefined and the route throws while destructuring it.
      const res = await realFetch(`${app.base}/api/osint/email-recon`, { method: 'POST' });
      const text = await res.text();
      expect(res.status).toBe(500);
      expect(res.headers.get('content-type')).toContain('application/json');
      expect(JSON.parse(text)).toEqual({ error: 'Internal server error' });
      expect(text).not.toMatch(leaks);
      expect(quiet).toHaveBeenCalled();
    } finally {
      quiet.mockRestore();
    }
  });
});

describe('rate limiting', () => {
  it('answers 429 with Retry-After once the ai bucket (60/min outside public mode) is empty', async () => {
    const isolated = await start();
    try {
      const hit = () => realFetch(`${isolated.base}/api/intelligence/copilot/status`);
      for (let i = 0; i < 60; i++) expect((await hit()).status).toBe(200);
      const limited = await hit();
      expect(limited.status).toBe(429);
      expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0);
      expect(await limited.json()).toEqual({ error: 'Rate limit exceeded', limit: 'ai' });
      // Buckets are per limiter: the extras routes still answer.
      const variants = await realFetch(`${isolated.base}/api/osint/variants`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
      expect(variants.status).toBe(200);
    } finally {
      await isolated.close();
    }
  });
});
