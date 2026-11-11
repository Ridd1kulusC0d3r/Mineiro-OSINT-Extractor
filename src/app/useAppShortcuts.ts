import { useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import type { Modals } from '../hooks/useModals';
import type { Scan } from '../hooks/useScan';
import type { AddLog } from '../hooks/useScanLog';
import type { AppView } from './views';

interface AppShortcutsOptions {
  scan: Scan;
  modals: Modals;
  addLog: AddLog;
  setActiveView: (view: AppView) => void;
  searchFilter: string;
  setSearchFilter: (value: string) => void;
}

/** Wires the global keyboard shortcuts and returns the handler for rows clicked in the shortcuts sheet. */
export function useAppShortcuts({ scan, modals, addLog, setActiveView, searchFilter, setSearchFilter }: AppShortcutsOptions) {
  // Global Keyboard Shortcuts Manager (⌘K, Esc, /, 1-7, ⌘Enter, ⌘E, ⌘B, ⌘H, ⌘M, ?)
  useGlobalShortcuts({
    onStartScan: () => {
      if (!scan.isScanning && scan.target.trim()) {
        scan.startScan();
      }
    },
    onResetWorkspace: scan.reset,
    onToggleShortcutsModal: () => modals.toggle('shortcuts'),
    onOpenExport: () => modals.open('export'),
    onOpenBulkImport: () => modals.open('bulk'),
    onOpenHistory: () => modals.open('history'),
    onOpenModular: () => modals.open('modular'),
    onToggleScanDepth: scan.flipScanDepth,
    onCloseActiveModal: modals.closeTopmost,
    onChangeView: (view) => {
      setActiveView(view);
      addLog(`[SHORTCUT] Switched view to: ${view.toUpperCase()}`, 'info');
    },
    isScanning: scan.isScanning,
    target: scan.target,
    setTarget: scan.setTarget,
    searchFilter,
    setSearchFilter,
  });

  return (actionId: string) => {
    switch (actionId) {
      case 'focus-target': {
        const el = document.getElementById('target-input') as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
        break;
      }
      case 'start-scan':
        if (scan.target.trim() && !scan.isScanning) {
          scan.startScan();
        }
        break;
      case 'esc-clear':
        scan.setTarget('');
        break;
      case 'focus-filter': {
        const el = document.getElementById('filter-search-input') as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
        break;
      }
      case 'view-dashboard':
        setActiveView('intelligence');
        break;
      case 'view-grid':
        setActiveView('grid');
        break;
      case 'view-table':
        setActiveView('table');
        break;
      case 'view-profile':
        setActiveView('ai');
        break;
      case 'view-linkage':
        setActiveView('linkage');
        break;
      case 'view-terminal':
        setActiveView('terminal');
        break;
      case 'open-export':
        modals.open('export');
        break;
      case 'open-bulk':
        modals.open('bulk');
        break;
      case 'open-history':
        modals.open('history');
        break;
      case 'open-modular':
        modals.open('modular');
        break;
      case 'toggle-depth':
        scan.flipScanDepth();
        break;
      case 'toggle-help':
        modals.toggle('shortcuts');
        break;
    }
  };
}
