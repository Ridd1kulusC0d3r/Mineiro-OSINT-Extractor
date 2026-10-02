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
        description: 'Quickly filters platform results by name or URL (Evidence and Platforms tabs).',
        icon: Search,
      },
      {
        id: 'toggle-depth',
        category: 'recon',
        keys: ['D'],
        actionId: 'toggle-depth',
        label: t.shortcutToggleDepth || 'Toggle Scan Depth (Fast ⚡ / Deep 🛡️)',
        description: 'Switches the probe timeout between Fast (2.5 s) and Deep (6.5 s). Blocked sites stay UNCERTAIN: no retries, no bypass.',
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
        description: 'AI Analyst Copilot: optional, evidence-bounded synthesis (needs a Gemini key).',
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
        description: 'Build the report: HTML, JSON, Markdown or CSV, each with a SHA-256 integrity manifest.',
        icon: Download,
      },
      {
        id: 'bulk-import',
        category: 'modals',
        keys: [modKey, 'B'],
        actionId: 'open-bulk',
        label: t.shortcutBulk || 'Open Bulk Target CSV Ingestion',
        description: 'Import a CSV/TXT list and scan the targets one after another.',
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
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden font-mono text-xs flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#2A2A2A] bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#111111] border border-[#2A2A2A] flex items-center justify-center text-[#FFFFFF]">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-bold text-[#F5F5F5] tracking-wide flex items-center gap-2">
                {t.shortcutsTitle || 'Keyboard Shortcuts'}
                <span className="text-[10px] bg-[#2A2A2A] text-[#FFFFFF] px-1.5 py-0.2 rounded font-mono">
                  HOTKEYS
                </span>
              </h2>
              <p className="text-[11px] text-[#A3A3A3]">
                {t.shortcutsSubtitle || 'Speed up OSINT investigations with rapid command keys'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="shortcuts-close-btn"
            onClick={onClose}
            aria-label={t.close || 'Close'}
            className="p-1.5 text-[#A3A3A3] hover:text-[#F5F5F5] rounded hover:bg-[#111111] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter bar inside modal */}
        <div className="px-4 py-2.5 border-b border-[#2A2A2A] bg-[#0A0A0A]/90 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-[#A3A3A3]" />
          <input
            id="shortcuts-filter-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search shortcuts (e.g., target, scan, export, 1)..."
            className="w-full bg-transparent border-none outline-none text-xs text-[#F5F5F5] placeholder:text-[#737373]"
            autoFocus
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="text-[#A3A3A3] hover:text-[#F5F5F5] text-xs px-1"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] text-[#737373] shrink-0 font-mono hidden sm:inline">
            Press <kbd className="px-1 py-0.2 bg-[#050505] border border-[#2A2A2A] rounded text-[#A3A3A3]">Esc</kbd> to exit
          </span>
        </div>

        {/* Shortcuts List Content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-[#A3A3A3]">
              No shortcuts found matching &quot;{filterQuery}&quot;
            </div>
          ) : (
            categories.map((cat) => {
              const items = filteredShortcuts.filter((s) => s.category === cat.id);
              if (items.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#FFFFFF] flex items-center gap-1.5 border-b border-[#2A2A2A]/60 pb-1">
                    <span>{cat.label}</span>
                    <span className="text-[10px] text-[#A3A3A3]">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleExecuteAction(item.actionId)}
                          className="group flex items-center justify-between p-2 rounded-md bg-[#050505] border border-[#2A2A2A] hover:border-[#FFFFFF]/60 hover:bg-[#111111] transition-all cursor-pointer"
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
                            <div className="w-6 h-6 rounded bg-[#0A0A0A] border border-[#2A2A2A] flex items-center justify-center text-[#A3A3A3] group-hover:text-[#FFFFFF] group-hover:border-[#FFFFFF]/40 shrink-0 transition-colors">
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#F5F5F5] group-hover:text-[#FFFFFF] flex items-center gap-1.5 transition-colors">
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="text-[10px] text-[#A3A3A3] truncate hidden sm:block">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          {/* Key badges */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.keys.map((k, idx) => (
                              <React.Fragment key={idx}>
                                <kbd className="min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center text-[11px] font-bold text-[#F5F5F5] bg-[#0A0A0A] border border-[#2A2A2A] group-hover:border-[#FFFFFF]/50 rounded shadow-sm">
                                  {k}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className="text-[10px] text-[#737373] font-sans">+</span>
                                )}
                              </React.Fragment>
                            ))}
                            <ArrowRight className="w-3 h-3 text-[#737373] group-hover:text-[#FFFFFF] opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 hidden sm:inline" />
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
        <div className="px-4 py-2.5 bg-[#050505] border-t border-[#2A2A2A] flex flex-wrap items-center justify-between text-[11px] text-[#A3A3A3] gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse"></span>
            <span>Tip: Click any shortcut row above to test or trigger it directly.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-[#0A0A0A] border border-[#2A2A2A] hover:border-[#737373] rounded text-xs text-[#F5F5F5] transition-colors"
          >
            {t.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
