import { describe, expect, it } from 'vitest';
import {
  averageLatency,
  computeCategoryStats,
  computeFootprintProfile,
  conclusiveShare,
  exposureLevel,
} from '../src/components/DashboardView/dashboard.logic';
import { result } from './helpers/scanFixtures';

const results = [
  result({ platformId: 'github', category: 'developer', responseTimeMs: 100, confidenceScore: 90, detectorReliability: 80 }),
  result({ platformId: 'gitlab', category: 'developer', status: 'not_found', responseTimeMs: 300, detectorReliability: 70 }),
  result({ platformId: 'steam', category: 'gaming', status: 'uncertain' }),
  result({ platformId: 'x', category: 'social', status: 'pending' }),
];

describe('legacy dashboard logic', () => {
  it('averages the latency of results that have one', () => {
    expect(averageLatency(results)).toBe(200);
    expect(averageLatency([])).toBe(0);
  });

  it('weights found results by confidence and detector reliability', () => {
    const stats = computeCategoryStats(results);
    expect(stats.developer).toEqual({ total: 2, found: 1, weighted: 0.9 * 0.8, detectorSum: 150 });
    expect(stats.gaming).toEqual({ total: 1, found: 0, weighted: 0, detectorSum: 60 });
    expect(computeFootprintProfile(stats)).toEqual([
      { category: 'developer', found: 1, total: 2, score: Math.round((0.72 / 2) * 100), avgDetector: 75 },
    ]);
  });

  it('labels exposure by the number of hits', () => {
    expect([0, 3, 8, 15, 16].map((n) => exposureLevel(n).label)).toEqual(['MINIMAL', 'LOW', 'MODERATE', 'ELEVATED', 'SEVERE']);
  });

  it('counts found and explicit absence over the checked total', () => {
    expect(conclusiveShare(results, 3)).toBe(67);
    expect(conclusiveShare(results, 0)).toBe(0);
  });
});
