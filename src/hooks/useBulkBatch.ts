import { useRef, useState } from 'react';
import { batchScanControl, createBatch, createBatchControl, runBatch, type BatchControl, type BatchOptions } from '../scan/batch';
import type { BulkBatchState } from '../types';
import type { ParsedTarget } from '../utils/csvParser';
import type { AppView } from '../app/views';
import type { AddLog } from './useScanLog';
import type { Scan } from './useScan';

interface UseBulkBatchOptions {
  addLog: AddLog;
  scan: Scan;
  navigate: (view: AppView) => void;
}

/** The batch queue (BulkScanView): one batch at a time, run by src/scan/batch.ts with the scan engine. */
export function useBulkBatch({ addLog, scan, navigate }: UseBulkBatchOptions) {
  const [bulkBatch, setBulkBatch] = useState<BulkBatchState | null>(null);
  const controlRef = useRef<BatchControl>(createBatchControl());

  // Execute Bulk Target Batch Reconnaissance
  const startBatch = async (importedTargets: ParsedTarget[], options: BatchOptions & { autoAiProfile: boolean }) => {
    if (importedTargets.length === 0) return;

    const batch = createBatch(importedTargets, options, scan.scanConfig);
    const control = createBatchControl();
    controlRef.current = control;
    setBulkBatch(batch);

    navigate('batch');
    scan.setIsScanning(true);

    await runBatch(batch, options, scan.scanConfig, {
      control,
      onLog: addLog,
      onUpdate: setBulkBatch,
      onItemStart: (item) => {
        scan.setTarget(item.target);
        scan.setTargetType(item.type);
      },
      scanItem: (item, config) => scan.execute(
        { target: item.target, targetType: item.type, config },
        { publish: true, control: batchScanControl(control) }
      ),
    }).finally(() => scan.setIsScanning(false));
  };

  const pauseBatch = () => {
    controlRef.current.paused = true;
    if (bulkBatch) setBulkBatch({ ...bulkBatch, isPaused: true });
    addLog('[BATCH] Batch execution paused by analyst.', 'warn');
  };

  const resumeBatch = () => {
    controlRef.current.paused = false;
    if (bulkBatch) setBulkBatch({ ...bulkBatch, isPaused: false });
    addLog('[BATCH] Resuming batch target queue.', 'info');
  };

  const skipTarget = () => {
    controlRef.current.skipRequested = true;
    addLog('[BATCH] Skip target signal dispatched.', 'warn');
  };

  const abortBatch = () => {
    controlRef.current.abort();
    scan.abortSingleScan();
    controlRef.current.paused = false;
    scan.setIsScanning(false);
    if (bulkBatch) {
      const updatedItems = bulkBatch.items.map((it) =>
        it.status === 'queued' || it.status === 'scanning' ? { ...it, status: 'skipped' as const } : it
      );
      setBulkBatch({ ...bulkBatch, items: updatedItems, isActive: false });
    }
    addLog('[BATCH] Batch aborted. Remaining targets cancelled.', 'warn');
  };

  const removeQueuedItem = (id: string) => {
    if (!bulkBatch) return;
    setBulkBatch({ ...bulkBatch, items: bulkBatch.items.filter((item) => item.id !== id) });
    addLog(`Removed target from batch queue.`, 'info');
  };

  return { bulkBatch, startBatch, pauseBatch, resumeBatch, skipTarget, abortBatch, removeQueuedItem };
}
