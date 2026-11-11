import { useEffect } from 'react';
import { matchShortcut, type ShortcutAction } from '../app/shortcuts';

export interface GlobalShortcutsOptions {
  /** Runs the action of a matched shortcut (src/app/shortcuts.ts). Escape is handled here and never dispatched. */
  onAction: (action: ShortcutAction) => void;
  onCloseActiveModal?: () => boolean; // Returns true if a modal was closed
  target?: string;
  setTarget?: (val: string) => void;
  searchFilter?: string;
  setSearchFilter?: (val: string) => void;
}

function focusInput(id: string) {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el) {
    el.focus();
    el.select();
    // Smooth scroll if off screen
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

export const focusTargetInput = () => focusInput('target-input');
export const focusFilterInput = () => focusInput('filter-search-input');

/** Listens for the shortcuts of src/app/shortcuts.ts on the window. */
export function useGlobalShortcuts(options: GlobalShortcutsOptions) {
  const { onAction, onCloseActiveModal, target = '', setTarget, searchFilter = '', setSearchFilter } = options;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputFocused = Boolean(
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable)
      );

      const shortcut = matchShortcut(e, isInputFocused);
      if (!shortcut) return;

      // Escape: hierarchical clear / dismiss / close
      if (shortcut.action === 'esc-clear') {
        e.preventDefault();
        e.stopPropagation();

        // Level 1: Close active modal if any is open
        if (onCloseActiveModal && onCloseActiveModal()) return;

        // Level 2: Clear active input or blur
        if (isInputFocused && activeEl) {
          if (activeEl.id === 'target-input' && target) {
            if (setTarget) setTarget('');
            return;
          }
          if (activeEl.id === 'filter-search-input' && searchFilter) {
            if (setSearchFilter) setSearchFilter('');
            return;
          }
          activeEl.blur();
          return;
        }

        // Level 3: If target has text outside input focus, clear it
        if (target && setTarget) {
          setTarget('');
          return;
        }

        // Level 4: Clear search filter if active
        if (searchFilter && setSearchFilter) setSearchFilter('');
        return;
      }

      e.preventDefault();
      if (shortcut.mod) e.stopPropagation();
      onAction(shortcut.action);
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onAction, onCloseActiveModal, target, setTarget, searchFilter, setSearchFilter]);
}
