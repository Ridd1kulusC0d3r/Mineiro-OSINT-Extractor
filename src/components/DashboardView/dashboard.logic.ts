// Pure computation of the legacy dashboard's figures. No React, no DOM. Tested in tests/dashboard.logic.test.ts.
import type { ScanResult } from '../../types';
import { EXPOSURE_COLORS } from '../../theme/palette';

export type CategoryStats = Record<string, { total: number; found: number; weighted: number; detectorSum: number }>;

export interface FootprintCluster {
  category: string;
  found: number;
  total: number;
  score: number;
  avgDetector: number;
}

/** Mean response time of the results that have one, rounded; 0 when none has. */
export function averageLatency(results: ScanResult[]): number {
  const checked = results.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
  if (!checked.length) return 0;
  const sum = checked.reduce((acc, curr) => acc + (curr.responseTimeMs || 0), 0);
  return Math.round(sum / checked.length);
}

/** Counts per category plus the reliability-weighted sum of found results (confidence x detector reliability). */
export function computeCategoryStats(results: ScanResult[]): CategoryStats {
  const counts: Record<string, { total: number; found: number; weighted: number; detectorSum: number }> = {};
  results.forEach((r) => {
    if (!counts[r.category]) {
      counts[r.category] = { total: 0, found: 0, weighted: 0, detectorSum: 0 };
    }
    counts[r.category].total += 1;
    counts[r.category].detectorSum += r.detectorReliability ?? 60;
    if (r.status === 'found') {
      counts[r.category].found += 1;
      const confidence = (r.confidenceScore ?? 50) / 100;
      const detector = (r.detectorReliability ?? 60) / 100;
      counts[r.category].weighted += confidence * detector;
    }
  });
  return counts;
}

/** Categories with at least one hit, scored by the weighted sum over their total, best first. */
export function computeFootprintProfile(categoryStats: CategoryStats): FootprintCluster[] {
  return Object.entries(categoryStats)
    .map(([category, stat]) => ({
      category,
      found: stat.found,
      total: stat.total,
      score: stat.total > 0 ? Math.round((stat.weighted / stat.total) * 100) : 0,
      avgDetector: stat.total > 0 ? Math.round(stat.detectorSum / stat.total) : 0,
    }))
    .filter((item) => item.found > 0)
    .sort((a, b) => b.score - a.score || b.found - a.found);
}

/** Exposure label and badge classes for a number of confirmed hits. */
export function exposureLevel(count: number): { label: string; color: string } {
  if (count === 0) return { label: 'MINIMAL', color: EXPOSURE_COLORS.MINIMAL.badge };
  if (count <= 3) return { label: 'LOW', color: EXPOSURE_COLORS.LOW.badge };
  if (count <= 8) return { label: 'MODERATE', color: EXPOSURE_COLORS.MODERATE.badge };
  if (count <= 15) return { label: 'ELEVATED', color: EXPOSURE_COLORS.ELEVATED.badge };
  return { label: 'SEVERE', color: EXPOSURE_COLORS.SEVERE.badge };
}

// Parcela conclusiva: encontrado ou ausência explícita sobre o total já verificado. É uma contagem, não uma
// taxa de falso positivo (o painel antigo mostrava um "índice" inventado entre 85% e 99,8%; defeito 24).
export function conclusiveShare(results: ScanResult[], scannedTotal: number): number {
  if (scannedTotal === 0) return 0;
  const conclusive = results.filter((r) => r.status === 'found' || r.status === 'not_found').length;
  return Math.round((conclusive / scannedTotal) * 100);
}
