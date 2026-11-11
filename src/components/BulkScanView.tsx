import { useI18n } from '../utils/i18n';
import { useState } from 'react';
import { 
  FileSpreadsheet, 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  AtSign, 
  Mail, 
  Activity, 
  Layers,
  ArrowRight,
  Eye,
  Trash2
} from 'lucide-react';
import { BulkBatchState, BulkTargetItem } from '../types';
import { exportBatchToCsv, exportBatchToJson } from '../utils/csvParser';

interface BulkScanViewProps {
  batch: BulkBatchState | null;
  onPauseBatch: () => void;
  onResumeBatch: () => void;
  onSkipTarget: () => void;
  onAbortBatch: () => void;
  onOpenImport: () => void;
  onInspectTarget: (targetItem: BulkTargetItem) => void;
  onRemoveQueuedItem: (id: string) => void;
  isScanning: boolean;
}

export function BulkScanView({
  batch,
  onPauseBatch,
  onResumeBatch,
  onSkipTarget,
  onAbortBatch,
  onOpenImport,
  onInspectTarget,
  onRemoveQueuedItem,
  isScanning,
}: BulkScanViewProps) {
  const { tr } = useI18n();
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  if (!batch || batch.items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4 font-mono max-w-lg mx-auto">
        <div className="w-14 h-14 mx-auto border border-dashed border-rule bg-paper-2 flex items-center justify-center text-ink-3">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-ink font-bold text-sm tracking-wider uppercase">
            NO BATCH INVESTIGATION QUEUED
          </h3>
          <p className="text-ink-3 text-xs leading-relaxed">
            Import a list of target usernames or emails from a local CSV file or paste raw identifiers to start automated bulk reconnaissance.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenImport}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-signal hover:bg-ink text-signal-ink font-bold text-xs uppercase border border-signal tracking-wider transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          Import Targets CSV
        </button>
      </div>
    );
  }

  const completedItems = batch.items.filter((i) => i.status === 'completed');
  const activeItem = batch.items.find((i) => i.status === 'scanning');
  const queuedItems = batch.items.filter((i) => i.status === 'queued');
  const totalHits = batch.items.reduce((acc, i) => acc + (i.foundCount || 0), 0);
  const totalScannedPlatforms = batch.items.reduce((acc, i) => acc + (i.totalScanned || 0), 0);

  const percentComplete = batch.items.length > 0 
    ? Math.round((completedItems.length / batch.items.length) * 100) 
    : 0;

  const handleExport = () => {
    if (exportFormat === 'csv') {
      exportBatchToCsv(batch);
    } else {
      exportBatchToJson(batch);
    }
  };

  return (
    <div className="space-y-6 text-sm">
      {/* Top Banner & Batch Controls */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-4">
          <div className="space-y-1">
            <span className="eyebrow">{tr('batch.eyebrow')}</span>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{batch.name}</h2>
            <p className="text-ink-2 text-sm max-w-2xl">{tr('batch.subtitle')}</p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {batch.isActive && !batch.isPaused ? (
              <button
                type="button"
                onClick={onPauseBatch}
                className="px-3 py-2 border border-rule bg-rule-2 text-ink hover:text-ink flex items-center gap-1.5 uppercase transition-colors"
                title="Pause batch execution"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause
              </button>
            ) : batch.isActive && batch.isPaused ? (
              <button
                type="button"
                onClick={onResumeBatch}
                className="px-3 py-2 border border-signal bg-signal text-signal-ink font-bold flex items-center gap-1.5 uppercase transition-colors"
                title="Resume batch execution"
              >
                <Play className="w-3.5 h-3.5 fill-paper" />
                Resume
              </button>
            ) : null}

            {batch.isActive && (
              <>
                <button
                  type="button"
                  onClick={onSkipTarget}
                  className="px-3 py-2 border border-rule bg-paper text-ink-3 hover:text-ink flex items-center gap-1.5 uppercase transition-colors"
                  title="Skip current target"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Skip Target
                </button>
                <button
                  type="button"
                  onClick={onAbortBatch}
                  className="px-3 py-2 border border-rule bg-paper text-ink-3 hover:text-ink-3 flex items-center gap-1.5 uppercase transition-colors"
                  title="Abort all remaining targets in batch"
                >
                  <Square className="w-3.5 h-3.5" />
                  Abort Batch
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onOpenImport}
              className="px-3 py-2 border border-rule bg-paper text-ink-2 hover:text-ink flex items-center gap-1.5 uppercase transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Add Targets
            </button>

            {/* Consolidated Batch Export */}
            <div className="flex items-center border border-rule bg-paper">
              <button
                type="button"
                onClick={handleExport}
                className="px-3 py-2 text-ink font-bold flex items-center gap-1.5 uppercase hover:bg-rule-2 transition-colors"
                title="Export consolidated results of all targets in batch"
              >
                <Download className="w-3.5 h-3.5" />
                Export Batch ({exportFormat.toUpperCase()})
              </button>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="bg-paper-2 text-ink-3 border-l border-rule px-2 py-2 text-[10px] focus:outline-none"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Batch Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-ink-3 text-xs">
            <span className="text-ink tabular-nums">
              {tr('batch.progress', { done: completedItems.length, total: batch.items.length, percent: percentComplete })}
            </span>
            <span className={`chip ${batch.isActive && !batch.isPaused ? 'chip-signal' : 'chip-quiet'}`}>
              {batch.isActive ? (batch.isPaused ? tr('batch.statusPaused') : tr('batch.statusRunning')) : tr('batch.statusDone')}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-paper-2 border border-rule-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentComplete}>
            <div
              className="h-full rounded-full bg-signal"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="card p-4 space-y-1.5">
            <div className="label-mono text-ink-3">Total Targets</div>
            <div className="stat-num">{batch.items.length}</div>
            <div className="text-[10px] text-ink-3">
              {queuedItems.length} Queued • {completedItems.length} Done
            </div>
          </div>

          <div className="card p-4 space-y-1.5">
            <div className="label-mono text-ink-3">Cumulative Hits</div>
            <div className="stat-num">{totalHits}</div>
            <div className="text-[10px] text-ink-3">
              Discovered profiles
            </div>
          </div>

          <div className="card p-4 space-y-1.5">
            <div className="label-mono text-ink-3">Platform Probes</div>
            <div className="stat-num">{totalScannedPlatforms}</div>
            <div className="text-[10px] text-ink-3">
              {tr('batch.scopeLabel', { scope: batch.platformScope ?? '—', category: batch.selectedCategory })}
            </div>
          </div>

          <div className="card p-4 space-y-1.5">
            <div className="label-mono text-ink-3">Batch State</div>
            <div className="stat-num">
              {batch.isActive ? (batch.isPaused ? 'PAUSED' : 'ACTIVE') : 'DONE'}
            </div>
            <div className="text-[10px] text-ink-3">
              Concurrency: {batch.concurrency}
            </div>
          </div>
        </div>
      </div>

      {/* Active Target Radar Spotlight */}
      {activeItem && (
        <div className="p-4 border border-ink-3/60 bg-paper-2/20 space-y-3 relative overflow-hidden shadow-[0_0_20px_color-mix(in_srgb,var(--ink)_8%,transparent)]">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-ink-3/40 to-transparent animate-[radarSweepVertical_2.4s_linear_infinite]" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="mast-dot" />
              </span>
              <div>
                <span className="text-[10px] uppercase text-ink-3 tracking-wider block font-bold">
                  {tr('batch.activeNow')}
                </span>
                <h3 className="text-base font-bold text-ink flex items-center gap-2">
                  <span>{activeItem.type === 'username' ? `@${activeItem.target}` : activeItem.target}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.2 border border-ink-3/60 text-ink-2">
                    {activeItem.type}
                  </span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-ink-3">DISCOVERED HITS: </span>
                <span className="text-ink-2 font-bold text-sm bg-paper px-2 py-0.5 border border-ink-3/60">
                  {activeItem.foundCount}
                </span>
              </div>
              <div>
                <span className="text-ink-3">PROBES: </span>
                <span className="text-ink font-bold">{activeItem.totalScanned}</span>
              </div>
              <button
                type="button"
                onClick={onSkipTarget}
                className="px-2.5 py-1 border border-rule bg-paper text-ink-2 hover:text-ink uppercase text-[10px]"
              >
                Skip Target →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Queue Table */}
      <div className="tbl-wrap">
        <div className="p-4 border-b border-rule-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-ink" />
            <h3 className="card-title">{tr('batch.queueTitle', { count: batch.items.length })}</h3>
          </div>
          <span className="text-ink-3 text-[11px]">
            {tr('batch.queueHint')}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th className="py-2.5 px-4 w-12">#</th>
                <th className="py-2.5 px-4">Target Identifier</th>
                <th className="py-2.5 px-4 w-24">Type</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Verified Hits</th>
                <th className="py-2.5 px-4">Uncertain (WAF)</th>
                <th className="py-2.5 px-4">Notes</th>
                <th className="py-2.5 px-4 text-right">Dossier Actions</th>
              </tr>
            </thead>
            <tbody>
              {batch.items.map((item, idx) => {
                const isScanning = item.status === 'scanning';
                const isCompleted = item.status === 'completed';
                const isQueued = item.status === 'queued';
                const isFailed = item.status === 'failed';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isScanning
                        ? 'bg-paper-2/30 border-l-2 border-ink-3 text-ink'
                        : isCompleted
                        ? 'hover:bg-rule-2/40 text-ink'
                        : 'text-ink-3 hover:bg-rule-2/20'
                    }`}
                  >
                    <td className="py-2.5 px-4 text-ink-3 text-[10px]">{idx + 1}</td>

                    <td className="py-2.5 px-4 font-semibold text-ink whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{item.type === 'username' ? `@${item.target}` : item.target}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] uppercase border font-bold ${
                          item.type === 'email'
                            ? 'border-rule/80 bg-paper-2/40 text-ink-2'
                            : 'border-rule bg-rule-2 text-ink-2'
                        }`}
                      >
                        {item.type === 'email' ? (
                          <Mail className="w-2.5 h-2.5" />
                        ) : (
                          <AtSign className="w-2.5 h-2.5" />
                        )}
                        {item.type}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {isScanning && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-ink-3/60 bg-paper-2/80 text-ink-2 text-[10px] font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-ink-3 animate-ping" />
                          PROBING...
                        </span>
                      )}
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rule-2 border border-rule text-ink text-[10px] font-bold uppercase">
                          <CheckCircle2 className="w-3 h-3 text-ink-3" />
                          COMPLETED
                        </span>
                      )}
                      {isQueued && (
                        <span className="inline-flex items-center gap-1 text-ink-3 text-[10px] uppercase">
                          <Clock className="w-2.5 h-2.5" />
                          QUEUED
                        </span>
                      )}
                      {isFailed && (
                        <span className="text-ink-3 text-[10px] uppercase">FAILED</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {isCompleted || isScanning ? (
                        <span
                          className={`font-bold px-2 py-0.5 text-xs ${
                            item.foundCount > 0
                              ? 'bg-signal text-signal-ink font-mono'
                              : 'text-ink-3'
                          }`}
                        >
                          {item.foundCount} hits
                        </span>
                      ) : (
                        <span className="text-ink-3">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-ink-3 whitespace-nowrap">
                      {item.uncertainCount > 0 ? (
                        <span className="text-ink-3">{item.uncertainCount}</span>
                      ) : (
                        '0'
                      )}
                    </td>

                    <td className="py-2.5 px-4 text-ink-3 text-[11px] truncate max-w-[140px]">
                      {item.notes || '—'}
                    </td>

                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={() => onInspectTarget(item)}
                            className="px-2.5 py-1 border border-rule bg-rule-2 text-ink hover:bg-signal hover:text-signal-ink transition-colors text-[10px] uppercase flex items-center gap-1 font-bold"
                            title="Inspect full forensic dossier and analytics for this target"
                          >
                            <Eye className="w-3 h-3" />
                            Inspect Dossier
                          </button>
                        )}
                        {isQueued && (
                          <button
                            type="button"
                            onClick={() => onRemoveQueuedItem(item.id)}
                            className="p-1 text-ink-3 hover:text-ink-3 transition-colors"
                            title="Remove from queue"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
