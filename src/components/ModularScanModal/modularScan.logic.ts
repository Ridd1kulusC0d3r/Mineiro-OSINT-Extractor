// Pure computation of the modular scan modal. No React, no DOM. Tested in tests/modularScan.logic.test.ts.
import type { ModularScanConfig } from '../../types';

/** Concurrency choices offered by module 5. */
export const CONCURRENCY_OPTIONS = [4, 6, 8, 10, 16, 24];

/** Rough duration label: batches of `concurrency` probes at 0.35 s (fast) or 0.65 s (deep) each, at least 1 s. */
export function estimateScanDuration(
  localConfig: Pick<ModularScanConfig, 'platformScope' | 'concurrency' | 'wafInspectionMode'>,
  platformCount: number,
): string {
  if (localConfig.platformScope === 'none') return '< 1s';
  const batches = Math.ceil(platformCount / localConfig.concurrency);
  const avgBatchDuration = localConfig.wafInspectionMode === 'fast' ? 0.35 : 0.65;
  const est = Math.max(1, Math.round(batches * avgBatchDuration * 10) / 10);
  return `~${est}s`;
}
