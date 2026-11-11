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
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner & Batch Controls */}
      <div className="border border-rule bg-paper-2 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-signal inline-block shadow-[0_0_8px_color-mix(in_srgb,var(--ink)_80%,transparent)]" />
              <h2 className="text-sm sm:text-base font-bold text-ink uppercase tracking-wider">
                BULK TARGET INVESTIGATION QUEUE // {batch.name.toUpperCase()}
              </h2>
            </div>
            <p className="text-ink-3 text-xs">
              Sequential multi-target OSINT reconnaissance engine with automated forensic hit aggregation.
            </p>
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
            <span className="flex items-center gap-2">
              <span>BATCH PROGRESS:</span>
              <strong className="text-ink">
                {completedItems.length} / {batch.items.length} TARGETS COMPLETED ({percentComplete}%)
              </strong>
            </span>
            <span>
              STATUS: <strong className="text-ink">{batch.isActive ? (batch.isPaused ? 'PAUSED' : 'SCANNING BATCH') : 'COMPLETED'}</strong>
            </span>
          </div>
          <div className="w-full bg-paper h-2.5 border border-rule overflow-hidden">
            <div
              className={`h-full bg-signal transition-all duration-300 ${batch.isActive && !batch.isPaused ? 'animate-pulse' : ''}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        {/* Aggregate KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 border border-rule bg-paper space-y-1">
            <div className="text-[10px] text-ink-3 uppercase">Total Targets</div>
            <div className="text-2xl font-black text-ink">{batch.items.length}</div>
            <div className="text-[10px] text-ink-3">
              {queuedItems.length} Queued • {completedItems.length} Done
            </div>
          </div>

          <div className="p-3 border border-rule bg-paper space-y-1">
            <div className="text-[10px] text-ink-3 uppercase">Cumulative Hits</div>
            <div className="text-2xl font-black text-ink">{totalHits}</div>
            <div className="text-[10px] text-ink-3">
              Discovered profiles
            </div>
          </div>

          <div className="p-3 border border-rule bg-paper space-y-1">
            <div className="text-[10px] text-ink-3 uppercase">Platform Probes</div>
            <div className="text-2xl font-black text-ink">{totalScannedPlatforms}</div>
            <div className="text-[10px] text-ink-3">
              Scope: {batch.selectedCategory.toUpperCase()}
            </div>
          </div>

          <div className="p-3 border border-rule bg-paper space-y-1">
            <div className="text-[10px] text-ink-3 uppercase">Batch State</div>
            <div className="text-2xl font-black text-ink">
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ink-3 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-ink-3"></span>
              </span>
              <div>
                <span className="text-[10px] uppercase text-ink-3 tracking-wider block font-bold">
                  ACTIVE RECONNAISSANCE IN PROGRESS
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
      <div className="border border-rule bg-paper-2 space-y-2">
        <div className="p-4 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-ink" />
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              BATCH TARGET RECONNAISSANCE QUEUE ({batch.items.length})
            </h3>
          </div>
          <span className="text-ink-3 text-[11px]">
            Click "Inspect Dossier" on any target to view detailed analytics & D3 graphs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-paper border-b border-rule text-ink-3 text-[10px] uppercase">
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
            <tbody className="divide-y divide-rule font-mono">
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
