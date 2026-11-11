import { describe, expect, it } from 'vitest';
import {
  computeCategoryMetrics,
  filterAndSortCategories,
  pickActiveCategory,
} from '../src/components/CategoryHeatMap/categoryHeatMap.logic';
import { CATEGORY_THREAT_WEIGHTS } from '../src/data/categoryThreatWeights';
import { email, result } from './helpers/scanFixtures';

const results = [
  result({ platformId: 'github', category: 'developer', responseTimeMs: 200, metadata: { bio: 'x', displayName: 'y' } as never }),
  result({ platformId: 'gitlab', category: 'developer', status: 'not_found', responseTimeMs: 400 }),
  result({ platformId: 'steam', category: 'gaming', status: 'uncertain' }),
  result({ platformId: 'reddit', category: 'social', status: 'not_found' }),
];

describe('category heat map logic', () => {
  it('computes presence, completeness, latency and composite intensity per category', () => {
    const rows = computeCategoryMetrics(results, null, null);
    const dev = rows.find((r) => r.category === 'developer')!;
    expect(dev).toMatchObject({ label: 'Developer', totalPlatforms: 2, foundCount: 1, notFoundCount: 1, avgResponseMs: 300 });
    expect(dev.presenceDensity).toBe(50);
    expect(dev.profileCompleteness).toBe(45); // bio 25 + displayName 20
    expect(dev.responseSpeedScore).toBe(70);
    expect(dev.exposureThreatScore).toBe(Math.round(CATEGORY_THREAT_WEIGHTS.developer * 0.6 + 8));
    expect(dev.linkageCorrelation).toBe(60);
    expect(dev.compositeIntensity).toBe(Math.round(50 * 0.35 + 45 * 0.15 + 70 * 0.15 + dev.exposureThreatScore * 0.2 + 60 * 0.15));

    const gaming = rows.find((r) => r.category === 'gaming')!;
    expect(gaming).toMatchObject({ foundCount: 0, uncertainCount: 1, compositeIntensity: 18, responseSpeedScore: 10 });
    expect(rows.find((r) => r.category === 'social')!.compositeIntensity).toBe(0);
  });

  it('adds an e-mail row when e-mail recon found a Gravatar or MX records', () => {
    expect(computeCategoryMetrics(results, email({ mxRecordsFound: false, gravatarExists: false }), null).some((r) => r.category === 'email')).toBe(false);
    const mail = computeCategoryMetrics(results, email({ gravatarExists: true }), null).find((r) => r.category === 'email')!;
    expect(mail).toMatchObject({ totalPlatforms: 2, foundCount: 2, presenceDensity: 100 });
  });

  it('filters to active rows and sorts by the chosen order', () => {
    const rows = computeCategoryMetrics(results, null, null);
    expect(filterAndSortCategories(rows, true, 'intensity').map((r) => r.category)).toEqual(['developer', 'gaming']);
    expect(filterAndSortCategories(rows, false, 'alphabetical').map((r) => r.label)).toEqual(['Developer', 'Gaming', 'Social']);
    expect(filterAndSortCategories(rows, false, 'found')[0].category).toBe('developer');
    expect(rows).toHaveLength(3); // sorting works on a copy
  });

  it('picks the selected category when it is drawn, else the first row', () => {
    const rows = filterAndSortCategories(computeCategoryMetrics(results, null, null), true, 'intensity');
    expect(pickActiveCategory(null, rows)?.category).toBe('developer');
    expect(pickActiveCategory('gaming', rows)?.category).toBe('gaming');
    expect(pickActiveCategory('social', rows)?.category).toBe('developer');
    expect(pickActiveCategory(null, [])).toBeNull();
  });
});
