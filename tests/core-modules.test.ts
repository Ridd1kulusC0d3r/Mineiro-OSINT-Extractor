import { describe, expect, it } from 'vitest';
import { isValidCnpj, summarizeBrasilApiCnpj } from '../src/core/br';
import { evaluateMatchers, validateDeclarativeDetector, type DeclarativeDetector } from '../src/core/matchers';
import { avatarSimilarity, dHash, hammingDistance } from '../src/core/phash';
import { extractPivots, planPivots } from '../src/core/pivots';
import { buildStixBundle } from '../src/core/stix';
import { generateUsernameVariants, jaroWinkler } from '../src/core/variants';
import { summarizeCdx } from '../src/core/wayback';

describe('variants', () => {
  it('scores similarity and ranks closest variants first', () => {
    const variants = generateUsernameVariants('Pascho.Dev');
    expect(variants.length).toBeGreaterThan(5);
    expect(variants.map((v) => v.value)).toContain('pascho_dev');
    expect(variants[0].similarity).toBeGreaterThanOrEqual(variants[variants.length - 1].similarity);
    expect(variants.every((v) => v.value !== 'Pascho.Dev')).toBe(true);
  });
  it('jaroWinkler basics', () => {
    expect(jaroWinkler('martha', 'marhta')).toBeCloseTo(0.961, 2);
    expect(jaroWinkler('abc', 'xyz')).toBe(0);
  });
  it('rejects absurd input', () => expect(generateUsernameVariants('a')).toEqual([]));
});

describe('pivots', () => {
  const text = 'Contato: dev@pascho.com.br, site https://pascho.com.br/blog, github https://github.com/pascho e @pascho_dev no X';
  it('extracts emails, domains, platform urls and handles', () => {
    const types = extractPivots(text, 'devto').map((p) => `${p.type}:${p.value}`);
    expect(types).toContain('email:dev@pascho.com.br');
    expect(types).toContain('domain:pascho.com.br');
    expect(types).toContain('url:https://github.com/pascho');
    expect(types).toContain('handle:pascho_dev');
  });
  it('honors depth, budget and seen set', () => {
    const pivots = extractPivots(text, 'x');
    const seen = new Set(['email:dev@pascho.com.br']);
    const plan = planPivots([...pivots, { type: 'handle', value: 'deep', origin: 'x', depth: 3 }], { maxDepth: 2, budget: 2, seen });
    expect(plan.accepted).toHaveLength(2);
    expect(plan.skipped.map((s) => s.reason)).toEqual(expect.arrayContaining(['seen', 'depth', 'budget']));
  });
});

describe('phash', () => {
  const image = (fn: (x: number, y: number) => number, size = 32) => {
    const px = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const v = fn(x, y); const i = (y * size + x) * 4;
      px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255;
    }
    return px;
  };
  it('is stable under rescale and distinct for other images', () => {
    const gradient = (x: number, y: number) => (x * 7 + y * 2) % 256;
    const a = dHash(image(gradient, 32), 32, 32);
    const b = dHash(image((x, y) => gradient(x * 2, y * 2), 16), 16, 16);
    const other = dHash(image((x, y) => ((x * y * 13) % 2 ? 255 : 0), 32), 32, 32);
    expect(a).toHaveLength(16);
    expect(hammingDistance(a, a)).toBe(0);
    expect(avatarSimilarity(a, b)).toBeGreaterThan(avatarSimilarity(a, other));
  });
});

describe('wayback', () => {
  it('summarizes CDX rows', () => {
    const rows = [['timestamp', 'statuscode', 'original', 'digest'],
      ['20240101120000', '200', 'https://x.com/a', 'd1'], ['20200615010101', '200', 'https://x.com/a', 'd2'], ['20230101000000', '404', 'https://x.com/a', 'd3']];
    const s = summarizeCdx(rows);
    expect(s.snapshots).toBe(3);
    expect(s.firstSeen).toBe('2020-06-15T01:01:01Z');
    expect(s.lastSeen).toBe('2024-01-01T12:00:00Z');
    expect(s.statusCodes).toEqual({ '200': 2, '404': 1 });
    expect(summarizeCdx([])).toMatchObject({ snapshots: 0, firstSeen: null });
  });
});

describe('br', () => {
  it('validates CNPJ check digits', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-82')).toBe(false);
    expect(isValidCnpj('00000000000000')).toBe(false);
  });
  it('drops partner names from the summary', () => {
    const out = summarizeBrasilApiCnpj({ cnpj: '1', razao_social: 'ACME', qsa: [{ nome_socio: 'FULANO' }, { nome_socio: 'BELTRANO' }] });
    expect(out.partnerCount).toBe(2);
    expect(JSON.stringify(out)).not.toContain('FULANO');
  });
});

describe('declarative matchers', () => {
  const det: DeclarativeDetector = {
    id: 't', lastVerified: '2026-10-02', source: 'test',
    present: [{ type: 'status', codes: [200] }, { type: 'body_regex', pattern: '<title>[^<]+\\| Site' }],
    absent: [{ type: 'status', codes: [404] }, { type: 'body_contains', values: ['no such user'] }],
  };
  it('absent beats present; present needs every matcher', () => {
    expect(evaluateMatchers(det, { status: 200, finalUrl: 'https://s/u', body: '<title>u | Site</title>' }).verdict).toBe('present');
    expect(evaluateMatchers(det, { status: 200, finalUrl: 'https://s/u', body: '<title>u | Site</title> No such user' }).verdict).toBe('absent');
    expect(evaluateMatchers(det, { status: 200, finalUrl: 'https://s/u', body: 'hello' }).verdict).toBe('inconclusive');
    expect(evaluateMatchers(det, { status: 404, finalUrl: 'https://s/u', body: '' }).verdict).toBe('absent');
  });
  it('validates structure', () => {
    expect(validateDeclarativeDetector(det)).toEqual([]);
    expect(validateDeclarativeDetector({ id: 'x', present: [{ type: 'body_regex', pattern: '(' }], absent: [], lastVerified: 'x', source: '' }).length).toBeGreaterThan(2);
  });
});

describe('stix export', () => {
  it('emits stable, well-formed objects only for found accounts', () => {
    const obs = [
      { detectorId: 'devto', platform: 'DEV', url: 'https://dev.to/ben', username: 'ben', status: 'found' as const, confidence: 88, collectedAt: '2026-10-02T00:00:00Z', evidenceHash: 'abc' },
      { detectorId: 'x', platform: 'X', url: 'https://x.com/ben', username: 'ben', status: 'not_found' as const, confidence: 90, collectedAt: '2026-10-02T00:00:00Z' },
    ];
    const bundle = buildStixBundle('ben', obs, '2026-10-02T00:00:00Z');
    const again = buildStixBundle('ben', obs, '2026-10-02T00:00:00Z');
    expect(bundle).toEqual(again);
    expect(bundle.objects.map((o: any) => o.type).sort()).toEqual(['identity', 'observed-data', 'url', 'user-account']);
    for (const o of bundle.objects) expect(o.id).toMatch(/^[a-z-]+--[0-9a-f-]{36}$/);
    expect(bundle.objects.find((o: any) => o.type === 'observed-data').x_mineiro_evidence_hash).toBe('abc');
  });
});
