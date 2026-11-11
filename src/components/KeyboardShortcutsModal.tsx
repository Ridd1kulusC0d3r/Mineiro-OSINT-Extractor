import React, { useState, useMemo } from 'react';
import { Keyboard, X, Search, ArrowRight } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import type { ShortcutAction, ShortcutDef } from '../app/shortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The shortcut list (src/app/shortcuts.ts): the same one the keyboard handler matches. */
  shortcuts: ShortcutDef[];
  onActionTrigger?: (action: ShortcutAction) => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
  shortcuts: definitions,
  onActionTrigger,
}: KeyboardShortcutsModalProps) {
  const { t } = useI18n();
  const [filterQuery, setFilterQuery] = useState('');

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = useMemo(
    () => definitions.map((item) => ({
      ...item,
      label: (t[item.labelKey] as string) || item.label,
      keys: item.caps.map((cap) => (cap === 'mod' ? modKey : cap)),
    })),
    [definitions, t, modKey]
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

  const handleExecuteAction = (action: ShortcutAction) => {
    onClose();
    if (onActionTrigger) {
      setTimeout(() => onActionTrigger(action), 50);
    }
  };

  return (
    <div
      id="keyboard-shortcuts-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog w-full max-w-2xl overflow-hidden text-[13px] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-rule bg-paper">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-card border border-rule flex items-center justify-center text-ink">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-sm font-bold text-ink tracking-wide flex items-center gap-2">
                {t.shortcutsTitle || 'Keyboard Shortcuts'}
                <span className="text-[10px] bg-rule-2 text-ink px-1.5 py-0.2 rounded font-mono">
                  HOTKEYS
                </span>
              </h2>
              <p className="text-[11px] text-ink-2">
                {t.shortcutsSubtitle || 'Speed up OSINT investigations with rapid command keys'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="shortcuts-close-btn"
            onClick={onClose}
            aria-label={t.close || 'Close'}
            className="p-1.5 text-ink-2 hover:text-ink rounded hover:bg-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search filter bar inside modal */}
        <div className="px-4 py-2.5 border-b border-rule bg-paper-2/90 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-ink-2" />
          <input
            id="shortcuts-filter-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search shortcuts (e.g., target, scan, export, 1)..."
            className="w-full bg-transparent border-none outline-none text-xs text-ink placeholder:text-ink-3"
            autoFocus
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="text-ink-2 hover:text-ink text-xs px-1"
            >
              ✕
            </button>
          )}
          <span className="text-[10px] text-ink-3 shrink-0 font-mono hidden sm:inline">
            Press <kbd className="px-1 py-0.2 bg-paper border border-rule rounded text-ink-2">Esc</kbd> to exit
          </span>
        </div>

        {/* Shortcuts List Content */}
        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-8 text-ink-2">
              No shortcuts found matching &quot;{filterQuery}&quot;
            </div>
          ) : (
            categories.map((cat) => {
              const items = filteredShortcuts.filter((s) => s.category === cat.id);
              if (items.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-ink flex items-center gap-1.5 border-b border-rule/60 pb-1">
                    <span>{cat.label}</span>
                    <span className="text-[10px] text-ink-2">({items.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleExecuteAction(item.action)}
                          className="group flex items-center justify-between p-2 rounded-md bg-paper border border-rule hover:border-ink/60 hover:bg-card transition-all cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleExecuteAction(item.action);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-3">
                            <div className="w-6 h-6 rounded bg-paper-2 border border-rule flex items-center justify-center text-ink-2 group-hover:text-ink group-hover:border-ink/40 shrink-0 transition-colors">
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-ink group-hover:text-ink flex items-center gap-1.5 transition-colors">
                                <span className="truncate">{item.label}</span>
                              </div>
                              <div className="text-[10px] text-ink-2 truncate hidden sm:block">
                                {item.description}
                              </div>
                            </div>
                          </div>

                          {/* Key badges */}
                          <div className="flex items-center gap-1 shrink-0">
                            {item.keys.map((k, idx) => (
                              <React.Fragment key={idx}>
                                <kbd className="min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center text-[11px] font-bold text-ink bg-paper-2 border border-rule group-hover:border-ink/50 rounded shadow-sm">
                                  {k}
                                </kbd>
                                {idx < item.keys.length - 1 && (
                                  <span className="text-[10px] text-ink-3 font-sans">+</span>
                                )}
                              </React.Fragment>
                            ))}
                            <ArrowRight className="w-3 h-3 text-ink-3 group-hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 hidden sm:inline" />
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
        <div className="px-4 py-2.5 bg-paper border-t border-rule flex flex-wrap items-center justify-between text-[11px] text-ink-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-signal animate-pulse"></span>
            <span>Tip: Click any shortcut row above to test or trigger it directly.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-paper-2 border border-rule hover:border-ink-3 rounded text-xs text-ink transition-colors"
          >
            {t.close || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
