import { Database, Download, Sparkles } from 'lucide-react';
import { UNIFIED_DATABASES } from '../../data/platforms';

interface DashboardBannerProps {
  target: string;
  targetType: 'username' | 'email';
  scannedTotal: number;
  onOpenExport: () => void;
  onViewProfile: () => void;
}

/** Ledger title, export and AI buttons, and the registry module strip. */
export function DashboardBanner({ target, targetType, scannedTotal, onOpenExport, onViewProfile }: DashboardBannerProps) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-ink-2 uppercase tracking-widest">OSINT INVESTIGATION LEDGER:</span>
            <span className="text-lg font-bold text-ink tracking-wider">@{target}</span>
            <span className="text-[10px] uppercase px-2 py-0.5 border border-rule bg-paper text-ink rounded-sm font-semibold">
              {targetType}
            </span>
          </div>
          <p className="text-xs text-ink-2">
            Evidence-oriented synthesis across the local Mineiro Registry and optional analysis modules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dashboard-export-btn"
            type="button"
            onClick={onOpenExport}
            disabled={scannedTotal === 0}
            className="px-3.5 py-2 bg-signal text-signal-ink font-mono font-bold text-xs uppercase hover:bg-ink/90 border border-signal tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 rounded-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download Dossier
          </button>
          <button
            id="dashboard-ai-btn"
            type="button"
            onClick={onViewProfile}
            className="px-3 py-2 border border-rule bg-paper text-ink hover:text-ink hover:border-ink-3 text-xs uppercase flex items-center gap-1.5 transition-colors rounded-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-ink" />
            AI Profile
          </button>
        </div>
      </div>

      {/* Unified Database Sources Badge Strip */}
      <div className="space-y-2">
        <div className="text-[10px] text-ink-2 uppercase tracking-widest flex items-center gap-1.5">
          <Database className="w-3 h-3 text-ink" />
          Mineiro Registry & Analysis Modules
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {UNIFIED_DATABASES.map((db) => (
            <div
              key={db.id}
              className="p-2.5 border border-rule bg-paper rounded-sm flex flex-col justify-between text-[11px]"
            >
              <div className="flex items-center justify-between">
                <strong className="text-ink font-bold">{db.name}</strong>
                <span className="text-[9px] px-1 py-0.2 border border-rule bg-paper-2 text-ink-2 rounded-sm">
                  {db.count}
                </span>
              </div>
              <div className="text-[10px] text-ink-2 mt-1 truncate" title={db.focus}>
                {db.focus}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
