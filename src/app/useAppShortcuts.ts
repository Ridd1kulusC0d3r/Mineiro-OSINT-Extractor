import { focusFilterInput, focusTargetInput, useGlobalShortcuts } from '../hooks/useGlobalShortcuts';
import type { Modals } from '../hooks/useModals';
import type { Scan } from '../hooks/useScan';
import type { AddLog } from '../hooks/useScanLog';
import type { ShortcutAction } from './shortcuts';
import type { AppView } from './views';

interface AppShortcutsOptions {
  scan: Scan;
  modals: Modals;
  addLog: AddLog;
  setActiveView: (view: AppView) => void;
  searchFilter: string;
  setSearchFilter: (value: string) => void;
}

/**
 * Runs shortcut actions (src/app/shortcuts.ts) for both the keyboard and the rows of the shortcuts sheet, and wires
 * the keyboard listener. Returns the runner for the sheet.
 */
export function useAppShortcuts({ scan, modals, addLog, setActiveView, searchFilter, setSearchFilter }: AppShortcutsOptions) {
  const runAction = (action: ShortcutAction) => {
    if (action.startsWith('view:')) {
      const view = action.slice('view:'.length) as AppView;
      setActiveView(view);
      addLog(`[SHORTCUT] Switched view to: ${view.toUpperCase()}`, 'info');
      return;
    }
    switch (action) {
      case 'focus-target':
        focusTargetInput();
        break;
      case 'start-scan':
        if (!scan.isScanning && scan.target.trim()) scan.startScan();
        break;
      case 'esc-clear': // from the sheet only: the Escape key itself is layered in useGlobalShortcuts
        scan.setTarget('');
        break;
      case 'focus-filter':
        focusFilterInput();
        break;
      case 'toggle-depth':
        scan.flipScanDepth();
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
      case 'toggle-help':
        modals.toggle('shortcuts');
        break;
    }
  };

  useGlobalShortcuts({
    onAction: runAction,
    onCloseActiveModal: modals.closeTopmost,
    target: scan.target,
    setTarget: scan.setTarget,
    searchFilter,
    setSearchFilter,
  });

  return runAction;
}
