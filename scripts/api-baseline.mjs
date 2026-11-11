// API baseline: calls every route that answers without network access or an API key and stores the normalized
// replies under tests/fixtures/api-baseline/. Etapa 3 of docs/REFACTOR_PLAN.md moves the routes out of server.ts
// and must produce identical replies.
//   npm run api:baseline            rewrite the fixtures from the current build
//   npm run api:baseline -- --check compare with the stored fixtures, exit 1 on any difference
// Builds first when dist/ is missing. The server runs on 127.0.0.1 with an in-memory SQLite store, no Gemini key
// and MINEIRO_PUBLIC unset (see scripts/lib/local-server.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, startServer } from './lib/local-server.mjs';

const OUT = path.join(ROOT, 'tests', 'fixtures', 'api-baseline');
const CHECK = process.argv.includes('--check');

// Fields whose value changes on every call. Their presence is kept, the value is replaced.
const VOLATILE_KEYS = new Set(['timestamp', 'uptime', 'generatedAt', 'collectedAt', 'responseTimeMs']);
// Response headers that are part of the contract (security headers, content type). Date, ETag, Keep-Alive... are not.
const KEPT_HEADERS = [
  'content-type', 'content-security-policy', 'x-content-type-options', 'x-frame-options', 'referrer-policy',
  'cross-origin-opener-policy', 'permissions-policy', 'content-disposition', 'retry-after',
];

const json = (body) => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
const minimalAssessment = { evidence: [], findings: [], gaps: [] };

/** name -> request. Names become file names; keep them stable. */
const CASES = {
  'get-health': { method: 'GET', path: '/api/health' },
  'get-registry-stats': { method: 'GET', path: '/api/registry/stats' },
  'get-registry-detectors': { method: 'GET', path: '/api/registry/detectors' },
  'get-registry-detectors-filtered': { method: 'GET', path: '/api/registry/detectors?category=security&tier=medium' },
  'post-registry-benchmark-empty': { method: 'POST', path: '/api/registry/benchmark', ...json({ detectorIds: ['github', 'gitlab', 'not-a-detector'] }) },
  'post-registry-benchmark-observations': {
    method: 'POST', path: '/api/registry/benchmark',
    ...json({
      detectorIds: ['github'],
      observations: [
        { detectorId: 'github', expected: 'present', observed: 'found' },
        { detectorId: 'github', expected: 'absent', observed: 'not_found' },
      ],
    }),
  },
  'post-registry-benchmark-too-many': { method: 'POST', path: '/api/registry/benchmark', ...json({ observations: new Array(10001).fill({}) }) },
  'get-copilot-status': { method: 'GET', path: '/api/intelligence/copilot/status' },
  'get-copilot-status-personal-key': { method: 'GET', path: '/api/intelligence/copilot/status', headers: { 'x-gemini-api-key': 'dummy-key-not-real-0000' } },
  'post-copilot-no-assessment': { method: 'POST', path: '/api/intelligence/copilot', ...json({}) },
  'post-copilot-too-much-evidence': { method: 'POST', path: '/api/intelligence/copilot', ...json({ assessment: { evidence: new Array(101).fill({ id: 'e' }) } }) },
  'post-copilot-not-configured': { method: 'POST', path: '/api/intelligence/copilot', ...json({ assessment: minimalAssessment }) },
  'post-gemini-validate-no-key': { method: 'POST', path: '/api/osint/gemini-validate', ...json({}) },
  'post-profile-legacy-disabled': { method: 'POST', path: '/api/osint/profile', ...json({ target: 'example' }) },
  'post-email-recon-missing': { method: 'POST', path: '/api/osint/email-recon', ...json({}) },
  'post-email-recon-invalid': { method: 'POST', path: '/api/osint/email-recon', ...json({ email: 'not-an-email' }) },
  'post-verify-missing-fields': { method: 'POST', path: '/api/osint/verify', ...json({}) },
  'post-verify-unknown-detector': { method: 'POST', path: '/api/osint/verify', ...json({ platformId: 'not-a-detector', url: 'https://example.com/x' }) },
  'post-verify-url-mismatch': { method: 'POST', path: '/api/osint/verify', ...json({ platformId: 'github', url: 'https://example.com/someone' }) },
  'post-verify-malformed-json': { method: 'POST', path: '/api/osint/verify', headers: { 'content-type': 'application/json' }, body: '{not json' },
  'post-variants': { method: 'POST', path: '/api/osint/variants', ...json({ username: 'mineiro', max: 12 }) },
  'post-variants-empty': { method: 'POST', path: '/api/osint/variants', ...json({}) },
  'post-pivots': {
    method: 'POST', path: '/api/osint/pivots',
    ...json({ sources: [{ text: 'site https://github.com/example-org and contact team@example.org', origin: 'fixture', depth: 1 }] }),
  },
  'post-avatar-hash-missing': { method: 'POST', path: '/api/osint/avatar-hash', ...json({}) },
  'post-wayback-missing': { method: 'POST', path: '/api/osint/wayback', ...json({}) },
  'get-cnpj-invalid': { method: 'GET', path: '/api/osint/br/cnpj/123' },
  'post-store-observations-invalid': { method: 'POST', path: '/api/store/observations', ...json({ observations: [{ entity: { type: 'nope' } }] }) },
  'post-store-observations-too-many': { method: 'POST', path: '/api/store/observations', ...json({ observations: new Array(2001).fill({}) }) },
  'post-store-claims-invalid': { method: 'POST', path: '/api/store/claims', ...json({}) },
  'get-store-timeline-missing': { method: 'GET', path: '/api/store/timeline' },
  'get-store-timeline-empty': { method: 'GET', path: '/api/store/timeline?type=username&value=example' },
  'get-store-stix-missing': { method: 'GET', path: '/api/store/export/stix' },
  'get-unknown-api-route': { method: 'GET', path: '/api/does-not-exist' },
};

function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, VOLATILE_KEYS.has(key) ? '<volatile>' : normalize(item)]));
  }
  return value;
}

async function call(baseUrl, request) {
  const response = await fetch(baseUrl + request.path, { method: request.method, headers: request.headers, body: request.body });
  const type = response.headers.get('content-type') || '';
  const text = await response.text();
  let body;
  if (type.includes('application/json')) body = normalize(JSON.parse(text));
  else if (type.includes('text/html') && text.includes('<div id="root">')) body = '<spa index.html>'; // asset hashes change per build
  else body = text;
  const headers = Object.fromEntries(KEPT_HEADERS.filter((name) => response.headers.has(name)).map((name) => [name, response.headers.get(name)]));
  const shownBody = request.body && request.body.length > 2000 ? `<${request.body.length} bytes>` : request.body;
  return {
    request: { method: request.method, path: request.path, ...(request.headers ? { headers: request.headers } : {}), ...(shownBody ? { body: shownBody } : {}) },
    status: response.status,
    headers,
    body,
  };
}

const server = await startServer();
let differences = 0;
try {
  if (!CHECK) {
    fs.rmSync(OUT, { recursive: true, force: true });
    fs.mkdirSync(OUT, { recursive: true });
  }
  for (const [name, request] of Object.entries(CASES)) {
    const result = `${JSON.stringify(await call(server.url, request), null, 2)}\n`;
    const file = path.join(OUT, `${name}.json`);
    if (CHECK) {
      const stored = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
      if (stored !== result) {
        differences++;
        console.log(`[diff] ${name}${stored === null ? ' (no stored fixture)' : ''}`);
      }
    } else {
      fs.writeFileSync(file, result);
      const { status } = JSON.parse(result);
      console.log(`[api] ${String(status).padEnd(3)} ${request.method.padEnd(4)} ${request.path}  -> ${name}.json`);
    }
  }
} finally {
  await server.stop();
}

if (CHECK) {
  console.log(differences ? `${differences} route(s) differ from tests/fixtures/api-baseline` : `All ${Object.keys(CASES).length} routes match the baseline.`);
  process.exit(differences ? 1 : 0);
}
console.log(`\n${Object.keys(CASES).length} fixture(s) written to ${path.relative(ROOT, OUT)}`);
