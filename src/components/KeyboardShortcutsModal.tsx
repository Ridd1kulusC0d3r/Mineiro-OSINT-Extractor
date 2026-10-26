import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  X,
  Search,
  Zap,
  Target,
  FileSpreadsheet,
  Download,
  History,
  Sliders,
  Terminal,
  LayoutDashboard,
  Grid,
  Table,
  Sparkles,
  Network,
  CornerDownLeft,
  ArrowRight,
} from 'lucide-react';
import { useI18n } from '../utils/i18n';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActionTrigger?: (action: string) => void;
}

interface ShortcutItem {
  id: string;
  category: 'recon' | 'views' | 'modals';
  keys: string[];
  actionId: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  onActionTrigger,
}: KeyboardShortcutsModalProps) {
  const { t } = useI18n();
  const [filterQuery, setFilterQuery] = useState('');

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts: ShortcutItem[] = useMemo(
    () => [
      // Recon & Execution
      {
        id: 'focus-target',
        category: 'recon',
        keys: [modKey, 'K'],
        actionId: 'focus-target',
        label: t.shortcutFocusTarget || 'Focus / Select Target Input',
        description: 'Immediately jumps cursor to target handle/email field and highlights contents.',
        icon: Target,
      },
      {
        id: 'start-scan',
        category: 'recon',
        keys: [modKey, 'Enter'],
        actionId: 'start-scan',
        label: t.shortcutStartScan || 'Execute Recon Scan Immediately',
        description: 'Launches full active reconnaissance on the current target with selected configuration.',
        icon: Zap,
      },
      {
        id: 'esc-clear',
        category: 'recon',
        keys: ['Esc'],
        actionId: 'esc-clear',
        label: t.shortcutEsc || 'Clear Target / Dismiss / Close Active Modal',
        description: 'Closes open overlays, dismisses menus, clears input field text, or blurs focus.',
        icon: CornerDownLeft,
      },
      {
        id: 'filter-search',
        category: 'recon',
        keys: ['/'],
        actionId: 'focus-filter',
        label: t.shortcutFilterSearch || 'Jump to Platform Filter Search',
        description: 'Quickly filters platform results by name, URL, category, or status.',
        icon: Search,
      },
      {
        id: 'toggle-depth',
        category: 'recon',
        keys: ['D'],
        actionId: 'toggle-depth',
        label: t.shortcutToggleDepth || 'Toggle Scan Depth (Fast ⚡ / Deep 🛡️)',
        description: 'Switches between Fast (2.5s, single-pass) and Deep (6.5s, adaptive retry with browser-like headers).',
        icon: Zap,
      },

      // Navigation & Views
      {
        id: 'view-1',
        category: 'views',
        keys: ['1'],
        actionId: 'view-dashboard',
        label: t.shortcutViewDashboard || 'Switch to Executive Dashboard',
        description: 'High-level metrics, verified hits, dominant category distribution, and WAF watchlists.',
        icon: LayoutDashboard,
      },
      {
        id: 'view-2',
        category: 'views',
        keys: ['2'],
        actionId: 'view-grid',
        label: t.shortcutViewGrid || 'Switch to Profile Matrix Grid',
        description: 'Visual cards showing verified endpoints, direct links, and status tags.',
        icon: Grid,
      },
      {
        id: 'view-3',
        category: 'views',
        keys: ['3'],
        actionId: 'view-table',
        label: t.shortcutViewTable || 'Switch to Forensic Audit Table',
        description: 'Dense, forensic table format for rapid analytical audits and URL copying.',
        icon: Table,
      },
      {
        id: 'view-4',
        category: 'views',
        keys: ['4'],
        actionId: 'view-profile',
        label: t.shortcutViewDossier || 'Switch to Autonomous AI Dossier',
        description: 'Deep behavioral archetypes, psychological indicators, and risk synthesis.',
        icon: Sparkles,
      },
      {
        id: 'view-5',
        category: 'views',
        keys: ['5'],
        actionId: 'view-linkage',
        label: t.shortcutViewLinkages || 'Switch to Permutations & Linkages',
        description: 'Discovered cross-profile correlations, permuted handles, and pivot vectors.',
        icon: Network,
      },
      {
        id: 'view-6',
        category: 'views',
        keys: ['6'],
        actionId: 'view-terminal',
        label: t.shortcutViewConsole || 'Switch to Live CLI Terminal Console',
        description: 'Real-time telemetry stream, raw HTTP probe logs, and WAF challenge events.',
        icon: Terminal,
      },

      // Modals & Workflows
      {
        id: 'export-dossier',
        category: 'modals',
        keys: [modKey, 'E'],
        actionId: 'open-export',
        label: t.shortcutExport || 'Export Forensic Dossier',
        description: 'Generate JSON, CSV, PDF, and cryptographically signed SHA-256 evidence packages.',
        icon: Download,
      },
      {
        id: 'bulk-import',
        category: 'modals',
        keys: [modKey, 'B'],
        actionId: 'open-bulk',
        label: t.shortcutBulk || 'Open Bulk Target CSV Ingestion',
        description: 'Batch process up to 100 targets sequentially with automatic pacing.',
        icon: FileSpreadsheet,
      },
      {
        id: 'history-cache',
        category: 'modals',
        keys: [modKey, 'H'],
        actionId: 'open-history',
        label: t.shortcutHistory || 'Open Local Investigation History',
        description: 'Browse, compare, and instantly restore the last 5 cached investigations.',
        icon: History,
      },
      {
        id: 'modular-config',
        category: 'modals',
        keys: [modKey, 'M'],
        actionId: 'open-modular',
        label: t.shortcutModular || 'Open Modular Presets & WAF Config',
        description: 'Customize platform scopes, anti-bot response handling, and concurrent probe limits.',
        icon: Sliders,
      },
      {
        id: 'help-toggle',
        category: 'modals',
        keys: ['?'],
        actionId: 'toggle-help',
        label: t.shortcutHelp || 'Toggle Keyboard Shortcuts Cheat Sheet',
        description: 'Quick reference overlay accessible anytime across the application.',
        icon: Keyboard,
      },
    ],
    [t, modKey]
  );

  const filteredShortcuts = useMemo(() => {
    if (!filterQuery.trim()) return shortcuts;
    const q = filterQuery.toLowerCase();
    return shortcuts.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.keys.join(' ').toLowerCase().includes(q)
    );
  }, [shortcuts, filterQuery]);

  if (!isOpen) return null;

  const categories = [
    { id: 'recon', label: t.shortcutCatRecon || 'Recon & Target Execution' },
    { id: 'views', label: t.shortcutCatViews || 'Navigation & Analysis Views' },
    { id: 'modals', label: t.shortcutCatModals || 'Workflows & Modals' },
  ] as const;

  const handleExecuteAction = (actionId: string) => {
    onClose();
    if (onActionTrigger) {
      setTimeout(() => onActionTrigger(actionId), 50);
    }
  };

  return (
    <div
      id="keyboard-shortcuts-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1B1915] border border-[#37332B] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#37332B] bg-[#131210]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#221F1A] border border-[#37332B] flex items-center justify-center text-[#ECE8DD]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-bold text-[#ECE8DD] tracking-wide flex items-center gap-2">
                {t.shortcutsTitle || 'Keyboard Shortcuts'}
                <span className="text-[10px] bg-[#37332B] text-[#ECE8DD] px-1.5 py-0.2 rounded font-mono">
                  HOTKEYS
                </span>
              </h2>
              <p className="text-[11px] text-[#B9B4A6]">
                {t.shortcutsSubtitle || 'Speed up OSINT investigations with rapid command keys'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="shortcuts-close-btn"
            onClick={onClose}
            aria-label={t.close || 'Close'}
            className="p-1.5 text-[#B9B4A6] hover:text-[#ECE8DD] rounded hover:bg-[#221F1A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter bar inside modal */}
        <div className="px-4 py-2.5 border-b border-[#37332B] bg-[#1B1915]/90 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#B9B4A6]" />
          <input
            id="shortcuts-filter-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search shortcuts (e.g., target, scan, export, 1)..."
            className="w-full bg-transparent border-none outline-none text-xs text-[#ECE8DD] placeholder:text-[#908B7D]"
            autoFocus
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="text-[#B9B4A6] hover:text-[#ECE8DD] text-xs px-1"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] text-[#908B7D] shrink-0 font-mono hidden sm:inline">
            Press <kbd className="px-1 py-0.2 bg-[#131210] border border-[#37332B] rounded text-[#B9B4A6]">Esc</kbd> to exit
          </span>
        </div>

        {/* Shortcuts List Content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-[#B9B4A6]">
              No shortcuts found matching &quot;{filterQuery}&quot;
            </div>
          ) : (
            categories.map((cat) => {
              const items = filteredShortcuts.filter((s) => s.category === cat.id);
              if (items.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#ECE8DD] flex items-center gap-1.5 border-b border-[#37332B]/60 pb-1">
                    <span>{cat.label}</span>
                    <span className="text-[10px] text-[#B9B4A6]">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleExecuteAction(item.actionId)}
                          className="group flex items-center justify-between p-2 rounded-md bg-[#131210] border border-[#37332B] hover:border-[#ECE8DD]/60 hover:bg-[#221F1A] transition-all cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleExecuteAction(item.actionId);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <div className="w-6 h-6 rounded bg-[#1B1915] border border-[#37332B] flex items-center justify-center text-[#B9B4A6] group-hover:text-[#ECE8DD] group-hover:border-[#ECE8DD]/40 shrink-0 transition-colors">
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#ECE8DD] group-hover:text-[#ECE8DD] flex items-center gap-1.5 transition-colors">
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="text-[10px] text-[#B9B4A6] truncate hidden sm:block">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          {/* Key badges */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.keys.map((k, idx) => (
                              <React.Fragment key={idx}>
                                <kbd className="min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center text-[11px] font-bold text-[#ECE8DD] bg-[#1B1915] border border-[#37332B] group-hover:border-[#ECE8DD]/50 rounded shadow-sm">
                                  {k}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className="text-[10px] text-[#908B7D] font-sans">+</span>
                                )}
                              </React.Fragment>
                            ))}
                            <ArrowRight className="w-3 h-3 text-[#908B7D] group-hover:text-[#ECE8DD] opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 hidden sm:inline" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#131210] border-t border-[#37332B] flex flex-wrap items-center justify-between text-[11px] text-[#B9B4A6] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F0885A] animate-pulse"></span>
            <span>Tip: Click any shortcut row above to test or trigger it directly.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#1B1915] border border-[#37332B] hover:border-[#908B7D] rounded text-xs text-[#ECE8DD] transition-colors"
          >
            {t.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
