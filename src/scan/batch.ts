// Batch runner: scans the targets of a BulkBatchState one after another with the scan engine. No React: the caller
// owns the batch control object and receives a fresh batch snapshot whenever an item starts or finishes.
// Moved unchanged from App.tsx's handleStartBulkScan.
import type { BulkBatchState, BulkTargetItem, ModularScanConfig } from '../types';
import type { ParsedTarget } from '../utils/csvParser';
import type { ScanLogLevel, ScanOutcome, ScanTargetType } from './engine';

/** What the operator changes while the batch runs: pause, skip the current target, abort the rest. */
export interface BatchControl {
  paused: boolean;
  skipRequested: boolean;
  /** Aborted by `abort()`; also stops the item being scanned before its next chunk. */
  readonly signal: AbortSignal;
  abort: () => void;
}

export function createBatchControl(): BatchControl {
  const controller = new AbortController();
  return { paused: false, skipRequested: false, signal: controller.signal, abort: () => controller.abort() };
}

/** The engine controls for one batch item: stop on abort (silently), wait while paused, stop when skipped. */
export function batchScanControl(control: BatchControl) {
  return {
    signal: control.signal,
    isPaused: () => control.paused,
    isSkipped: () => control.skipRequested,
    announceAbort: false,
  };
}

export interface BatchOptions {
  category: string;
  concurrency: number;
}

export interface BatchDeps {
  control: BatchControl;
  /** Scans one item; the caller wires it to runScan with this batch's control (see useBulkBatch). */
  scanItem: (item: BulkTargetItem, config: ModularScanConfig) => Promise<ScanOutcome>;
  onUpdate: (batch: BulkBatchState) => void;
  /** Called when an item starts, before it is scanned. */
  onItemStart?: (item: BulkTargetItem, index: number) => void;
  onLog?: (message: string, level: ScanLogLevel) => void;
  /** Wall-clock label for startedAt/completedAt; defaults to the local time string. */
  timeLabel?: () => string;
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export function createBatch(
  targets: Array<Pick<ParsedTarget, 'id' | 'target' | 'type' | 'notes'>>,
  options: BatchOptions,
  baseConfig: ModularScanConfig,
  timeLabel: () => string = () => new Date().toLocaleTimeString(),
  random: () => number = Math.random,
): BulkBatchState {
  return {
    batchId: random().toString(36).substring(2, 8).toUpperCase(),
    name: `Batch Ingestion (${targets.length} targets)`,
    items: targets.map((t) => ({
      id: t.id,
      target: t.target,
      type: t.type as ScanTargetType,
      status: 'queued',
      foundCount: 0,
      uncertainCount: 0,
      totalScanned: 0,
      notes: t.notes,
    })),
    currentIndex: 0,
    isActive: true,
    isPaused: false,
    autoAiProfile: false,
    selectedCategory: options.category,
    platformScope: baseConfig.platformScope,
    concurrency: options.concurrency,
    startedAt: timeLabel(),
  };
}

/** The configuration each batch item runs with: the active one, with the batch's category and concurrency. */
export function batchItemConfig(baseConfig: ModularScanConfig, options: BatchOptions): ModularScanConfig {
  return {
    ...baseConfig,
    selectedCategory: options.category,
    concurrency: options.concurrency,
    enableAutoAiProfile: false,
  };
}

export async function runBatch(
  batch: BulkBatchState,
  options: BatchOptions,
  baseConfig: ModularScanConfig,
  deps: BatchDeps,
): Promise<BulkBatchState> {
  const { control } = deps;
  const log = deps.onLog ?? (() => undefined);
  const timeLabel = deps.timeLabel ?? (() => new Date().toLocaleTimeString());
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  log(`=== INITIALIZING BATCH RECONNAISSANCE: ${batch.items.length} TARGETS ===`, 'info');
  log(`Batch ID: ${batch.batchId} | Scope: ${options.category.toUpperCase()} | Concurrency: ${options.concurrency}`, 'info');

  for (let idx = 0; idx < batch.items.length; idx++) {
    if (control.signal.aborted) {
      log(`[BATCH] Investigation halted by analyst command.`, 'warn');
      break;
    }
    while (control.paused) {
      await sleep(400);
      if (control.signal.aborted) break;
    }
    if (control.signal.aborted) break;

    control.skipRequested = false;
    const item = batch.items[idx];
    item.status = 'scanning';
    item.startedAt = timeLabel();
    deps.onItemStart?.(item, idx);
    deps.onUpdate({ ...batch, currentIndex: idx });

    log(`>>> [BATCH ${idx + 1}/${batch.items.length}] Initiating probe for: ${item.target} (${item.type})`, 'info');

    const outcome = await deps.scanItem(item, batchItemConfig(baseConfig, options));

    item.results = outcome.results;
    item.emailData = outcome.emailData;
    item.foundCount = outcome.foundCount;
    item.uncertainCount = outcome.uncertainCount;
    item.totalScanned = outcome.totalScanned;
    item.completedAt = timeLabel();
    item.status = control.skipRequested ? 'skipped' : 'completed';

    // Legacy automatic profiling is disabled in v1.4.1.
    // Analysts can use the evidence-bounded Copilot after inspecting the target.

    deps.onUpdate({ ...batch, currentIndex: idx });
    log(`<<< [BATCH ${idx + 1}/${batch.items.length}] Target @${item.target} completed: ${item.foundCount} hits located.`, 'success');
  }

  batch.isActive = false;
  batch.completedAt = timeLabel();
  deps.onUpdate({ ...batch });
  const totalHits = batch.items.reduce((acc, i) => acc + (i.foundCount || 0), 0);
  log(`=== BATCH RECONNAISSANCE CONCLUDED: ${batch.items.length} TARGETS PROCESSED (${totalHits} CUMULATIVE HITS) ===`, 'success');
  return batch;
}
