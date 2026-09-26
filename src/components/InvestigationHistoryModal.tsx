import { 
  History, 
  X, 
  Trash2, 
  ArrowRight, 
  Check, 
  AtSign, 
  Mail, 
  Sparkles, 
  HardDrive, 
  Clock, 
  Zap, 
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { CachedInvestigation } from '../types';

interface InvestigationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedScans: CachedInvestigation[];
  currentTarget: string;
  currentTargetType: 'username' | 'email';
  onLoadInvestigation: (scan: CachedInvestigation) => void;
  onDeleteInvestigation: (id: string) => void;
  onClearAllHistory: () => void;
}

export function InvestigationHistoryModal({
  isOpen,
  onClose,
  cachedScans,
  currentTarget,
  currentTargetType,
  onLoadInvestigation,
  onDeleteInvestigation,
  onClearAllHistory,
}: InvestigationHistoryModalProps) {
  if (!isOpen) return null;

  const MAX_SLOTS = 5;
  const usedSlots = cachedScans.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-950 border border-neutral-700 max-w-2xl w-full p-5 sm:p-6 space-y-4 font-mono text-neutral-200 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-white text-black flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wider flex items-center gap-2">
                CACHED INVESTIGATION HISTORY
                <span className="text-[10px] font-normal px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800">
                  LOCALSTORAGE
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Last 5 scans cached locally in browser storage — revisit reports instantly without re-scanning.
              </p>
            </div>
          </div>
          <button
            id="close-history-modal-btn"
            type="button"
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1.5 border border-neutral-800 hover:border-neutral-600 transition-colors"
            title="Close (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Storage Slot Meter */}
        <div className="flex items-center justify-between text-xs bg-neutral-900/80 border border-neutral-800 p-2.5 px-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-neutral-400" />
            <span className="text-neutral-400">Storage Capacity:</span>
            <div className="flex items-center gap-1 font-bold">
              {[...Array(MAX_SLOTS)].map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 inline-block ${
                    i < usedSlots
                      ? 'bg-neutral-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'
                      : 'bg-neutral-800 border border-neutral-700'
                  }`}
                  title={i < usedSlots ? `Slot ${i + 1} occupied` : `Slot ${i + 1} empty`}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-neutral-300">
            <span className="text-white font-bold">{usedSlots}</span> of {MAX_SLOTS} slots occupied
          </div>
        </div>

        {/* Scan List or Empty State */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {cachedScans.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-neutral-800 bg-black/40 space-y-3">
              <Clock className="w-8 h-8 text-neutral-600 mx-auto" />
              <p className="text-neutral-300 font-bold text-xs uppercase tracking-wide">
                No investigations cached in local storage
              </p>
              <p className="text-neutral-500 text-[11px] max-w-md mx-auto leading-relaxed">
                Once you execute any successful scan, complete intelligence results (verified hits, latency benchmarks, AI dossier, and email recon) are automatically cached here for instant restoration.
              </p>
            </div>
          ) : (
            cachedScans.map((item, index) => {
              const isActive =
                item.target.toLowerCase() === currentTarget.toLowerCase() &&
                item.targetType === currentTargetType;

              return (
                <div
                  key={item.id}
                  id={`cached-investigation-${item.id}`}
                  className={`p-3.5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'border-neutral-500/80 bg-neutral-950/20'
                      : 'border-neutral-800 bg-black hover:border-neutral-600'
                  }`}
                >
                  {/* Left Column: Target info & metrics */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-neutral-500 font-bold w-4">
                        #{index + 1}
                      </span>

                      {/* Target type icon */}
                      <span className="p-1 bg-neutral-900 border border-neutral-800 text-neutral-300">
                        {item.targetType === 'username' ? (
                          <AtSign className="w-3.5 h-3.5" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                      </span>

                      {/* Target Name */}
                      <span className="font-bold text-white text-sm tracking-wide truncate max-w-[200px] sm:max-w-[260px]">
                        {item.target}
                      </span>

                      {/* Active in workspace badge */}
                      {isActive && (
                        <span className="text-[10px] bg-neutral-500 text-black px-1.5 py-0.2 font-bold tracking-wider uppercase flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Active in Workspace
                        </span>
                      )}

                      {/* Preset badge */}
                      <span className="text-[10px] px-1.5 py-0.5 border border-neutral-800 bg-neutral-900 text-neutral-300 uppercase">
                        {item.preset === 'quick' && '⚡ QUICK'}
                        {item.preset === 'standard' && '⚖️ STANDARD'}
                        {item.preset === 'deep' && '🌐 DEEP'}
                        {item.preset === 'email_only' && '📧 EMAIL'}
                        {item.preset === 'custom' && '⚙️ MODULAR'}
                      </span>
                    </div>

                    {/* Meta stats row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
                      <span className="flex items-center gap-1 text-neutral-400 font-semibold">
                        <strong>{item.foundCount}</strong> verified hits
                      </span>
                      {item.uncertainCount > 0 && (
                        <span className="text-neutral-400">
                          {item.uncertainCount} uncertain (WAF)
                        </span>
                      )}
                      <span>
                        {item.totalScanned} platforms
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        {item.formattedTime}
                      </span>

                      {item.aiProfile && (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1 bg-neutral-950/40 border border-neutral-800/60 px-1.5 py-0.2">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI Dossier Cached
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      id={`load-cached-${item.id}`}
                      onClick={() => {
                        onLoadInvestigation(item);
                        onClose();
                      }}
                      className={`px-3 py-1.5 text-xs font-mono font-bold flex items-center gap-1.5 transition-all uppercase tracking-wider ${
                        isActive
                          ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                          : 'bg-white text-black hover:bg-neutral-200'
                      }`}
                      title="Load this investigation into workspace without re-scanning"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>{isActive ? 'Reload' : 'Load'}</span>
                    </button>

                    <button
                      type="button"
                      id={`delete-cached-${item.id}`}
                      onClick={() => onDeleteInvestigation(item.id)}
                      className="p-1.5 text-neutral-500 hover:text-neutral-400 border border-neutral-800 hover:border-neutral-900/60 hover:bg-neutral-950/20 transition-colors"
                      title="Remove from local cache"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-800 text-xs text-neutral-500">
          <div>
            {cachedScans.length > 0 && (
              <button
                type="button"
                id="clear-all-history-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all 5 saved investigations from local cache?')) {
                    onClearAllHistory();
                  }
                }}
                className="text-neutral-500 hover:text-neutral-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-500 hidden sm:inline">
              Browser-isolated local persistence
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-neutral-800 bg-black text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors uppercase text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
