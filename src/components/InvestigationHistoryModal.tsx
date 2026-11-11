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
import type { MineiroCase } from '../cases/types';
import { useI18n } from '../utils/i18n';

interface InvestigationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cachedScans: CachedInvestigation[];
  currentTarget: string;
  currentTargetType: 'username' | 'email';
  onLoadInvestigation: (scan: CachedInvestigation) => void;
  onDeleteInvestigation: (id: string) => void;
  onClearAllHistory: () => void;
  persistentCases?: MineiroCase[];
  currentCaseId?: string | null;
  onLoadCase?: (caseFile: MineiroCase) => void;
  onDeleteCase?: (caseId: string) => Promise<void> | void;
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
  persistentCases = [],
  currentCaseId = null,
  onLoadCase,
  onDeleteCase,
}: InvestigationHistoryModalProps) {
  const { language } = useI18n();
  const caseCopy = {
    en: {
      title: 'Persistent Cases',
      desc: 'Long-lived investigation memory stored locally in IndexedDB.',
      collections: 'collections',
      pivots: 'pivots',
      active: 'Active case',
      open: 'Open case',
      delete: 'Delete case',
      recent: 'Recent scan cache',
    },
    pt: {
      title: 'Casos persistentes',
      desc: 'Memória de investigação de longo prazo armazenada localmente em IndexedDB.',
      collections: 'coletas',
      pivots: 'pivôs',
      active: 'Caso ativo',
      open: 'Abrir caso',
      delete: 'Excluir caso',
      recent: 'Cache de scans recentes',
    },
    es: {
      title: 'Casos persistentes',
      desc: 'Memoria de investigación de largo plazo almacenada localmente en IndexedDB.',
      collections: 'recolecciones',
      pivots: 'pivotes',
      active: 'Caso activo',
      open: 'Abrir caso',
      delete: 'Eliminar caso',
      recent: 'Caché de escaneos recientes',
    },
  }[language];
  if (!isOpen) return null;

  const MAX_SLOTS = 5;
  const usedSlots = cachedScans.length;

  return (
    <div className="fixed inset-0 z-50 bg-paper/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper-2 border border-rule max-w-2xl w-full p-5 sm:p-6 space-y-4 font-mono text-ink shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-signal text-signal-ink flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink tracking-wider flex items-center gap-2">
                CACHED INVESTIGATION HISTORY
                <span className="text-[10px] font-normal px-2 py-0.5 bg-rule-2 text-ink-3 border border-rule">
                  LOCALSTORAGE
                </span>
              </h2>
              <p className="text-[11px] text-ink-3">
                Last 5 scans cached locally in browser storage — revisit reports instantly without re-scanning.
              </p>
            </div>
          </div>
          <button
            id="close-history-modal-btn"
            type="button"
            onClick={onClose}
            className="text-ink-3 hover:text-ink p-1.5 border border-rule hover:border-ink-3 transition-colors"
            title="Close (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <section className="space-y-3 border border-rule bg-paper/40 p-3.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink">{caseCopy.title}</div>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-3">{caseCopy.desc}</p>
            </div>
            <span className="rounded border border-rule px-2 py-1 text-[10px] text-ink-3">
              IndexedDB · {persistentCases.length}
            </span>
          </div>

          {persistentCases.length === 0 ? (
            <div className="rounded border border-dashed border-rule p-4 text-center text-[11px] text-ink-3">
              No persistent cases yet. Complete a scan to create one automatically.
            </div>
          ) : (
            <div className="max-h-[260px] space-y-2 overflow-y-auto pr-1">
              {persistentCases.map((caseFile) => {
                const active = caseFile.id === currentCaseId;
                return (
                  <div
                    key={caseFile.id}
                    className={`flex flex-col gap-3 border p-3 sm:flex-row sm:items-center sm:justify-between ${active ? 'border-ink-3 bg-rule-2/70' : 'border-rule bg-paper-2'}`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-ink">{caseFile.name}</span>
                        {active && (
                          <span className="border border-ink-3 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-ink-2">
                            {caseCopy.active}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-3">
                        <span>{caseFile.collections.length} {caseCopy.collections}</span>
                        <span>{caseFile.pivotInvestigations.length} {caseCopy.pivots}</span>
                        <span>{new Date(caseFile.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="mt-1 truncate font-mono text-[9px] text-ink-3">{caseFile.id}</div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {onLoadCase && (
                        <button
                          type="button"
                          onClick={() => {
                            onLoadCase(caseFile);
                            onClose();
                          }}
                          className="inline-flex items-center gap-1.5 bg-signal px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-signal-ink hover:bg-ink"
                        >
                          <ArrowRight className="h-3 w-3" />
                          {caseCopy.open}
                        </button>
                      )}
                      {onDeleteCase && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete persistent case "${caseFile.name}"? This does not delete the separate recent-scan cache.`)) {
                              onDeleteCase(caseFile.id);
                            }
                          }}
                          className="border border-rule p-1.5 text-ink-3 hover:border-ink-3 hover:text-ink"
                          title={caseCopy.delete}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">{caseCopy.recent}</div>

        {/* Storage Slot Meter */}
        <div className="flex items-center justify-between text-xs bg-rule-2/80 border border-rule p-2.5 px-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-ink-3" />
            <span className="text-ink-3">Storage Capacity:</span>
            <div className="flex items-center gap-1 font-bold">
              {[...Array(MAX_SLOTS)].map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 inline-block ${
                    i < usedSlots
                      ? 'bg-ink-3 shadow-[0_0_8px_color-mix(in_srgb,var(--ink-3)_40%,transparent)]'
                      : 'bg-rule border border-rule'
                  }`}
                  title={i < usedSlots ? `Slot ${i + 1} occupied` : `Slot ${i + 1} empty`}
                />
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-ink-2">
            <span className="text-ink font-bold">{usedSlots}</span> of {MAX_SLOTS} slots occupied
          </div>
        </div>

        {/* Scan List or Empty State */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {cachedScans.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-rule bg-paper/40 space-y-3">
              <Clock className="w-8 h-8 text-ink-3 mx-auto" />
              <p className="text-ink-2 font-bold text-xs uppercase tracking-wide">
                No investigations cached in local storage
              </p>
              <p className="text-ink-3 text-[11px] max-w-md mx-auto leading-relaxed">
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
                      ? 'border-ink-3/80 bg-paper-2/20'
                      : 'border-rule bg-paper hover:border-ink-3'
                  }`}
                >
                  {/* Left Column: Target info & metrics */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-ink-3 font-bold w-4">
                        #{index + 1}
                      </span>

                      {/* Target type icon */}
                      <span className="p-1 bg-rule-2 border border-rule text-ink-2">
                        {item.targetType === 'username' ? (
                          <AtSign className="w-3.5 h-3.5" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                      </span>

                      {/* Target Name */}
                      <span className="font-bold text-ink text-sm tracking-wide truncate max-w-[200px] sm:max-w-[260px]">
                        {item.target}
                      </span>

                      {/* Active in workspace badge */}
                      {isActive && (
                        <span className="text-[10px] bg-ink-3 text-paper px-1.5 py-0.2 font-bold tracking-wider uppercase flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          Active in Workspace
                        </span>
                      )}

                      {/* Preset badge */}
                      <span className="text-[10px] px-1.5 py-0.5 border border-rule bg-rule-2 text-ink-2 uppercase">
                        {item.preset === 'quick' && '⚡ QUICK'}
                        {item.preset === 'standard' && '⚖️ STANDARD'}
                        {item.preset === 'deep' && '🌐 DEEP'}
                        {item.preset === 'email_only' && '📧 EMAIL'}
                        {item.preset === 'custom' && '⚙️ MODULAR'}
                      </span>
                    </div>

                    {/* Meta stats row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                      <span className="flex items-center gap-1 text-ink-3 font-semibold">
                        <strong>{item.foundCount}</strong> verified hits
                      </span>
                      {item.uncertainCount > 0 && (
                        <span className="text-ink-3">
                          {item.uncertainCount} uncertain (WAF)
                        </span>
                      )}
                      <span>
                        {item.totalScanned} platforms
                      </span>
                      <span className="text-ink-3">•</span>
                      <span className="text-ink-3 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-3" />
                        {item.formattedTime}
                      </span>

                      {item.aiProfile && (
                        <span className="text-[10px] text-ink-3 flex items-center gap-1 bg-paper-2/40 border border-rule/60 px-1.5 py-0.2">
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
                          ? 'bg-rule-2 text-ink-2 hover:bg-rule-2'
                          : 'bg-signal text-signal-ink hover:bg-ink'
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
                      className="p-1.5 text-ink-3 hover:text-ink-3 border border-rule hover:border-rule/60 hover:bg-paper-2/20 transition-colors"
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
        <div className="flex items-center justify-between pt-3 border-t border-rule text-xs text-ink-3">
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
                className="text-ink-3 hover:text-ink-3 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-ink-3 hidden sm:inline">
              Browser-isolated local persistence
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-rule bg-paper text-ink-2 hover:text-ink hover:border-ink-3 transition-colors uppercase text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
