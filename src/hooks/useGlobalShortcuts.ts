import { useEffect, useCallback } from 'react';

export interface GlobalShortcutsOptions {
  onFocusTarget?: () => void;
  onFocusFilter?: () => void;
  onStartScan?: () => void;
  onResetWorkspace?: () => void;
  onToggleShortcutsModal?: () => void;
  onOpenExport?: () => void;
  onOpenBulkImport?: () => void;
  onOpenHistory?: () => void;
  onOpenModular?: () => void;
  onToggleScanDepth?: () => void;
  onCloseActiveModal?: () => boolean; // Returns true if a modal was closed
  onChangeView?: (view: 'dashboard' | 'grid' | 'table' | 'profile' | 'linkage' | 'terminal' | 'batch') => void;
  isScanning?: boolean;
  target?: string;
  setTarget?: (val: string) => void;
  searchFilter?: string;
  setSearchFilter?: (val: string) => void;
}

export function useGlobalShortcuts(options: GlobalShortcutsOptions) {
  const {
    onFocusTarget,
    onFocusFilter,
    onStartScan,
    onResetWorkspace,
    onToggleShortcutsModal,
    onOpenExport,
    onOpenBulkImport,
    onOpenHistory,
    onOpenModular,
    onToggleScanDepth,
    onCloseActiveModal,
    onChangeView,
    isScanning,
    target = '',
    setTarget,
    searchFilter = '',
    setSearchFilter,
  } = options;

  const focusTargetInput = useCallback(() => {
    const el = document.getElementById('target-input') as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
      // Smooth scroll if off screen
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (onFocusTarget) onFocusTarget();
  }, [onFocusTarget]);

  const focusFilterInput = useCallback(() => {
    const el = document.getElementById('filter-search-input') as HTMLInputElement | null;
    if (el) {
      el.focus();
      el.select();
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    if (onFocusFilter) onFocusFilter();
  }, [onFocusFilter]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeEl = document.activeElement as HTMLElement | null;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.tagName === 'SELECT' ||
          activeEl.isContentEditable);

      const isModifier = e.metaKey || e.ctrlKey;

      // 1. Cmd+K / Ctrl+K: Focus target input from anywhere
      if (isModifier && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        focusTargetInput();
        return;
      }

      // 2. Cmd+Enter / Ctrl+Enter: Trigger scan immediately
      if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (!isScanning && target.trim() && onStartScan) {
          onStartScan();
        }
        return;
      }

      // 3. Escape: Hierarchical clear / dismiss / close
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();

        // Level 1: Close active modal if any is open
        if (onCloseActiveModal && onCloseActiveModal()) {
          return;
        }

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
        if (searchFilter && setSearchFilter) {
          setSearchFilter('');
          return;
        }

        return;
      }

      // 4. Cmd+E / Ctrl+E: Export modal
      if (isModifier && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenExport) onOpenExport();
        return;
      }

      // 5. Cmd+B / Ctrl+B: Bulk Target Ingestion modal
      if (isModifier && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenBulkImport) onOpenBulkImport();
        return;
      }

      // 6. Cmd+H / Ctrl+H: History modal
      if (isModifier && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenHistory) onOpenHistory();
        return;
      }

      // 7. Cmd+M / Ctrl+M: Modular Scan config modal
      if (isModifier && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenModular) onOpenModular();
        return;
      }

      // ------------------------------------------------------------------
      // Non-modifier shortcuts (ONLY when NOT actively typing in an input)
      // ------------------------------------------------------------------
      if (!isInputFocused && !isModifier && !e.altKey) {
        // Jump to Filter search with '/'
        if (e.key === '/') {
          e.preventDefault();
          focusFilterInput();
          return;
        }

        // Toggle Keyboard Shortcuts Help Modal with '?' (Shift + /)
        if (e.key === '?' || (e.shiftKey && e.key === '/')) {
          e.preventDefault();
          if (onToggleShortcutsModal) onToggleShortcutsModal();
          return;
        }

        // Toggle Scan Depth with 'd' or 'D'
        if ((e.key === 'd' || e.key === 'D') && onToggleScanDepth) {
          e.preventDefault();
          onToggleScanDepth();
          return;
        }

        // View Tabs switching with 1-7
        if (onChangeView) {
          switch (e.key) {
            case '1':
              e.preventDefault();
              onChangeView('dashboard');
              break;
            case '2':
              e.preventDefault();
              onChangeView('grid');
              break;
            case '3':
              e.preventDefault();
              onChangeView('table');
              break;
            case '4':
              e.preventDefault();
              onChangeView('profile');
              break;
            case '5':
              e.preventDefault();
              onChangeView('linkage');
              break;
            case '6':
              e.preventDefault();
              onChangeView('terminal');
              break;
            case '7':
              e.preventDefault();
              onChangeView('batch');
              break;
            default:
              break;
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    focusTargetInput,
    focusFilterInput,
    onStartScan,
    onResetWorkspace,
    onToggleShortcutsModal,
    onOpenExport,
    onOpenBulkImport,
    onOpenHistory,
    onOpenModular,
    onToggleScanDepth,
    onCloseActiveModal,
    onChangeView,
    isScanning,
    target,
    setTarget,
    searchFilter,
    setSearchFilter,
  ]);

  return {
    focusTargetInput,
    focusFilterInput,
  };
}
