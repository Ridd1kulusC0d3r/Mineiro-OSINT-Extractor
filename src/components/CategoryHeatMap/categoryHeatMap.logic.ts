// Pure computation of the category heat map: per-category metrics, filter and sort, active category.
// No React, no DOM. Tested in tests/categoryHeatMap.logic.test.ts.
import type { AiProfileReport, EmailReconData, ScanResult } from '../../types';
import { CATEGORY_THREAT_WEIGHTS } from '../../data/categoryThreatWeights';

// Category forensic profile representation
export interface CategoryMetrics {
  category: string;
  label: string;
  totalPlatforms: number;
  foundCount: number;
  uncertainCount: number;
  notFoundCount: number;
  avgResponseMs: number;
  // Intensity facets (0 to 100)
  presenceDensity: number;      // % of category platforms verified
  profileCompleteness: number;  // AI / metadata richness
  responseSpeedScore: number;   // Server latency / responsiveness index
  exposureThreatScore: number;  // Privacy and attack-surface weight
  linkageCorrelation: number;   // Cross-service handle correlation
  compositeIntensity: number;   // Weighted composite relative activity intensity (0 - 100)
  foundPlatforms: ScanResult[];
}

export type HeatmapViewMode = 'matrix' | 'platforms';
export type HeatmapSortMode = 'intensity' | 'found' | 'latency' | 'alphabetical';

/** The cell under the pointer, shown in the status bar. */
export interface HoveredCell {
  category: string;
  dimension: string;
  value: number;
  description: string;
}

/** One row of metrics per category present in the results (plus 'email' when e-mail recon found something). */
export function computeCategoryMetrics(
  results: ScanResult[],
  emailData: EmailReconData | null,
  aiProfile: AiProfileReport | null | undefined,
): CategoryMetrics[] {
  // Unique list of categories in results + email
  const catMap = new Map<string, ScanResult[]>();
  results.forEach((r) => {
    const list = catMap.get(r.category) || [];
    list.push(r);
    catMap.set(r.category, list);
  });

  // If email recon data exists, add email category if not present
  if (emailData && (emailData.gravatarExists || emailData.mxRecordsFound)) {
    if (!catMap.has('email')) {
      catMap.set('email', []);
    }
  }

  const items: CategoryMetrics[] = [];

  catMap.forEach((categoryResults, catKey) => {
    const total = categoryResults.length || (catKey === 'email' ? 2 : 1);
    const foundList = categoryResults.filter((r) => r.status === 'found');
    const uncertainList = categoryResults.filter((r) => r.status === 'uncertain');
    const notFoundList = categoryResults.filter((r) => r.status === 'not_found');

    // Email integration bonus
    let effectiveFoundCount = foundList.length;
    if (catKey === 'email' && emailData) {
      if (emailData.gravatarExists) effectiveFoundCount += 1;
      if (emailData.mxRecordsFound) effectiveFoundCount += 1;
    }

    // Latency calculation
    const withLatency = categoryResults.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
    const avgLatency = withLatency.length > 0
      ? Math.round(withLatency.reduce((acc, curr) => acc + (curr.responseTimeMs || 0), 0) / withLatency.length)
      : (effectiveFoundCount > 0 ? 160 : 350);

    // 1. Presence density: (effectiveFound / total) scaled
    const presenceDensity = total > 0 ? Math.round(Math.min(100, (effectiveFoundCount / Math.max(1, total)) * 100)) : 0;

    // 2. Profile completeness: presence + metadata points
    let metaScore = 0;
    foundList.forEach((r) => {
      if (r.metadata?.bio) metaScore += 25;
      if (r.metadata?.displayName) metaScore += 20;
      if (r.metadata?.location) metaScore += 20;
      if (r.metadata?.extractedLinks?.length) metaScore += 20;
      if (r.metadata?.avatarUrl) metaScore += 15;
    });
    const avgMeta = foundList.length > 0 ? Math.min(100, Math.round(metaScore / foundList.length)) : (effectiveFoundCount > 0 ? 55 : 0);

    // 3. Response speed score (fast = high, slow = lower)
    const responseSpeedScore = effectiveFoundCount > 0
      ? Math.max(15, Math.min(100, Math.round(100 - (avgLatency / 10))))
      : 10;

    // 4. Exposure threat score (category weight modulated by presence)
    const baseWeight = CATEGORY_THREAT_WEIGHTS[catKey] || 35;
    const exposureThreatScore = effectiveFoundCount > 0
      ? Math.min(100, Math.round(baseWeight * 0.6 + (effectiveFoundCount * 8)))
      : 5;

    // 5. Linkage correlation
    let linkageCorrelation = 0;
    if (effectiveFoundCount > 0) {
      // High correlation if found on developer + security + email
      linkageCorrelation = Math.min(100, Math.round(50 + (effectiveFoundCount * 10)));
      if (aiProfile?.archetype && catKey === 'developer') linkageCorrelation = Math.min(100, linkageCorrelation + 15);
    }

    // 6. Composite Activity & Threat Intensity (Weighted Formula)
    const compositeIntensity = effectiveFoundCount > 0
      ? Math.min(100, Math.round(
          presenceDensity * 0.35 +
          avgMeta * 0.15 +
          responseSpeedScore * 0.15 +
          exposureThreatScore * 0.20 +
          linkageCorrelation * 0.15
        ))
      : (uncertainList.length > 0 ? 18 : 0);

    const label = catKey.charAt(0).toUpperCase() + catKey.slice(1);

    items.push({
      category: catKey,
      label,
      totalPlatforms: total,
      foundCount: effectiveFoundCount,
      uncertainCount: uncertainList.length,
      notFoundCount: notFoundList.length,
      avgResponseMs: avgLatency,
      presenceDensity,
      profileCompleteness: avgMeta,
      responseSpeedScore,
      exposureThreatScore,
      linkageCorrelation,
      compositeIntensity,
      foundPlatforms: foundList,
    });
  });

  return items;
}

/** Rows to draw: only categories with a hit or an uncertain probe when `activeOnly`, in the chosen order. */
export function filterAndSortCategories(categoriesData: CategoryMetrics[], filterActiveOnly: boolean, sortMode: HeatmapSortMode): CategoryMetrics[] {
  let list = [...categoriesData];

  if (filterActiveOnly) {
    list = list.filter((c) => c.foundCount > 0 || c.uncertainCount > 0);
  }

  switch (sortMode) {
    case 'intensity':
      list.sort((a, b) => b.compositeIntensity - a.compositeIntensity);
      break;
    case 'found':
      list.sort((a, b) => b.foundCount - a.foundCount || b.compositeIntensity - a.compositeIntensity);
      break;
    case 'latency':
      list.sort((a, b) => a.avgResponseMs - b.avgResponseMs);
      break;
    case 'alphabetical':
      list.sort((a, b) => a.label.localeCompare(b.label));
      break;
  }

  return list;
}

/** Category the drill-down shows: the selected one when it is drawn, else the first row. */
export function pickActiveCategory(selectedCategory: string | null, rows: CategoryMetrics[]): CategoryMetrics | null {
  if (!selectedCategory) return rows[0] || null;
  return rows.find((c) => c.category === selectedCategory) || rows[0] || null;
}
