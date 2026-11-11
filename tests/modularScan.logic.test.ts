import { describe, expect, it } from 'vitest';
import { estimateScanDuration } from '../src/components/ModularScanModal/modularScan.logic';

describe('modular scan modal logic', () => {
  it('estimates the duration from batches of concurrent probes', () => {
    expect(estimateScanDuration({ platformScope: 'none', concurrency: 8, wafInspectionMode: 'fast' }, 100)).toBe('< 1s');
    expect(estimateScanDuration({ platformScope: 'all', concurrency: 8, wafInspectionMode: 'fast' }, 100)).toBe('~4.6s'); // 13 x 0.35
    expect(estimateScanDuration({ platformScope: 'all', concurrency: 10, wafInspectionMode: 'deep' }, 100)).toBe('~6.5s');
    expect(estimateScanDuration({ platformScope: 'top20', concurrency: 24, wafInspectionMode: 'fast' }, 20)).toBe('~1s');
  });
});
