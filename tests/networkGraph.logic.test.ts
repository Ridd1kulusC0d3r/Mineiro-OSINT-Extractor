import { describe, expect, it } from 'vitest';
import { buildGraph, computeAiMetrics, nodeRadius } from '../src/components/NetworkRelationshipGraph/networkGraph.logic';
import { generateAccountLinkageDossier } from '../src/data/accountLinkage';
import { email, result } from './helpers/scanFixtures';

const results = [
  result({ platformId: 'github', category: 'developer', confidenceScore: 90 }),
  result({ platformId: 'gitlab', category: 'developer', confidenceScore: 80 }),
  result({ platformId: 'steam', category: 'gaming', status: 'uncertain' }),
  result({ platformId: 'reddit', category: 'social', status: 'not_found' }),
];

describe('force graph logic', () => {
  it('scores the target from the results when there is no AI profile', () => {
    const metrics = computeAiMetrics(results, null, null);
    expect(metrics.targetCompleteness).toBe(Math.min(85, 20 + 2 * 6));
    expect(metrics.targetDensity).toBe(Math.min(85, Math.round((2 / 4) * 120 + 15)));
    expect(metrics.targetFactors).toEqual(['2 confirmed digital presences discovered', '4 probes scanned']);
    expect(Object.keys(metrics.categoryMetrics).sort()).toEqual(['developer', 'gaming', 'social']);
    expect(metrics.categoryMetrics.developer.factors[0]).toBe('2 confirmed platform accounts');
  });

  it('adds an e-mail category when e-mail recon ran', () => {
    const metrics = computeAiMetrics(results, null, email({ isCommonProvider: false }));
    expect(metrics.categoryMetrics.email).toMatchObject({ completeness: 85, density: 80 });
  });

  it('sizes nodes by the sizing mode', () => {
    expect(nodeRadius('uniform', 'target', undefined, 0, 0, undefined)).toBe(22);
    expect(nodeRadius('uniform', 'platform', 'found', 0, 0, undefined)).toBe(9);
    expect(nodeRadius('completeness', 'target', undefined, 100, 0, undefined)).toBe(38);
    expect(nodeRadius('density', 'category', undefined, 100, 0, undefined)).toBe(13);
    expect(nodeRadius('completeness', 'platform', 'rate_limited', 50, 50, undefined)).toBe(6.5);
    expect(nodeRadius('completeness', 'linkage', undefined, 0, 0, undefined)).toBe(Math.round(6 + 0.5 * 5));
  });

  it('builds the hub-and-spoke graph and honours the filter', () => {
    const linkageReport = generateAccountLinkageDossier('mineiro', results, null);
    const aiMetrics = computeAiMetrics(results, null, null);
    const input = { results, target: 'mineiro', emailData: null, linkageReport, aiMetrics, sizingMode: 'completeness' as const };

    const all = buildGraph({ ...input, filterMode: 'all' });
    expect(all.nodes[0]).toMatchObject({ id: 'target-mineiro', label: '@mineiro', type: 'target' });
    expect(all.nodes.filter((n) => n.type === 'category').map((n) => n.id).sort()).toEqual(['hub-developer', 'hub-gaming', 'hub-social']);
    expect(all.nodes.filter((n) => n.type === 'platform')).toHaveLength(4);
    // the two found developer accounts share a metadata-cluster link
    expect(all.links.filter((l) => l.type === 'metadata-cluster')).toEqual([
      { source: 'platform-github', target: 'platform-gitlab', value: 1.2, type: 'metadata-cluster' },
    ]);

    const hits = buildGraph({ ...input, filterMode: 'found_only' });
    expect(hits.nodes.filter((n) => n.type === 'platform').map((n) => n.status)).toEqual(['found', 'found']);
    expect(hits.nodes.some((n) => n.type === 'linkage')).toBe(false);
  });
});
