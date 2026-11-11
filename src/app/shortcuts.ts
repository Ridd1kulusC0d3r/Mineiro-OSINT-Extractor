// The one list of keyboard shortcuts. The keydown handler (src/hooks/useGlobalShortcuts.ts) matches keys against it
// and the shortcuts sheet (KeyboardShortcutsModal) renders it, and both run the same action through
// src/app/useAppShortcuts.ts, so a row in the sheet always does what its key does.
import type { ComponentType } from 'react';
import {
  CornerDownLeft,
  Download,
  FileSpreadsheet,
  Grid,
  History,
  Keyboard,
  LayoutDashboard,
  Layers,
  Network,
  Search,
  Sliders,
  Sparkles,
  Table,
  Target,
  Terminal,
  Zap,
} from 'lucide-react';
import type { Translations } from '../utils/i18n';
import type { AppView } from './views';

export type ShortcutAction =
  | 'focus-target'
  | 'start-scan'
  | 'esc-clear'
  | 'focus-filter'
  | 'toggle-depth'
  | 'open-export'
  | 'open-bulk'
  | 'open-history'
  | 'open-modular'
  | 'toggle-help'
  | `view:${AppView}`;

export interface ShortcutDef {
  id: string;
  category: 'recon' | 'views' | 'modals';
  action: ShortcutAction;
  /**
   * `KeyboardEvent.key` values that trigger it (case-insensitive for letters). With `mod`, Cmd (macOS) or Ctrl must
   * be held and the shortcut also works while typing in a field; without it, the shortcut is ignored while a field
   * has focus or a modifier is held.
   */
  keys: string[];
  mod?: boolean;
  /** What the sheet shows on the key caps; 'mod' is drawn as ⌘ or Ctrl. */
  caps: string[];
  labelKey: keyof Translations;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const view = (
  id: string, key: string, target: AppView, labelKey: keyof Translations, label: string, description: string,
  icon: ShortcutDef['icon'],
): ShortcutDef => ({ id, category: 'views', action: `view:${target}`, keys: [key], caps: [key], labelKey, label, description, icon });

export const SHORTCUTS: ShortcutDef[] = [
  // Recon & Execution
  {
    id: 'focus-target', category: 'recon', action: 'focus-target', keys: ['k'], mod: true, caps: ['mod', 'K'],
    labelKey: 'shortcutFocusTarget', label: 'Focus / Select Target Input',
    description: 'Immediately jumps cursor to target handle/email field and highlights contents.', icon: Target,
  },
  {
    id: 'start-scan', category: 'recon', action: 'start-scan', keys: ['Enter'], mod: true, caps: ['mod', 'Enter'],
    labelKey: 'shortcutStartScan', label: 'Execute Recon Scan Immediately',
    description: 'Launches full active reconnaissance on the current target with selected configuration.', icon: Zap,
  },
  {
    id: 'esc-clear', category: 'recon', action: 'esc-clear', keys: ['Escape'], caps: ['Esc'],
    labelKey: 'shortcutEsc', label: 'Clear Target / Dismiss / Close Active Modal',
    description: 'Closes open overlays, dismisses menus, clears input field text, or blurs focus.', icon: CornerDownLeft,
  },
  {
    id: 'filter-search', category: 'recon', action: 'focus-filter', keys: ['/'], caps: ['/'],
    labelKey: 'shortcutFilterSearch', label: 'Jump to Platform Filter Search',
    description: 'Quickly filters platform results by name or URL (Evidence and Platforms tabs).', icon: Search,
  },
  {
    id: 'toggle-depth', category: 'recon', action: 'toggle-depth', keys: ['d'], caps: ['D'],
    labelKey: 'shortcutToggleDepth', label: 'Toggle Scan Depth (Fast ⚡ / Deep 🛡️)',
    description: 'Switches the probe timeout between Fast (2.5 s) and Deep (6.5 s). Blocked sites stay UNCERTAIN: no retries, no bypass.',
    icon: Zap,
  },

  // Navigation & Views
  view('view-1', '1', 'dashboard', 'shortcutViewDashboard', 'Switch to Legacy Dashboard',
    'The previous dashboard (no tab): registry metrics, relationship graph, map and risk matrix.', LayoutDashboard),
  view('view-2', '2', 'grid', 'shortcutViewGrid', 'Switch to Profile Matrix Grid',
    'Visual cards showing verified endpoints, direct links, and status tags.', Grid),
  view('view-3', '3', 'table', 'shortcutViewTable', 'Switch to Forensic Audit Table',
    'Dense, forensic table format for rapid analytical audits and URL copying.', Table),
  view('view-4', '4', 'ai', 'shortcutViewDossier', 'Switch to Autonomous AI Dossier',
    'AI Analyst Copilot: optional, evidence-bounded synthesis (needs a Gemini key).', Sparkles),
  view('view-5', '5', 'linkage', 'shortcutViewLinkages', 'Switch to Permutations & Linkages',
    'Discovered cross-profile correlations, permuted handles, and pivot vectors.', Network),
  view('view-6', '6', 'terminal', 'shortcutViewConsole', 'Switch to Live CLI Terminal Console',
    'Real-time telemetry stream, raw HTTP probe logs, and WAF challenge events.', Terminal),
  view('view-7', '7', 'batch', 'shortcutViewBatch', 'Switch to Bulk Batch Ingestion Queue',
    'The batch queue: progress, the target being scanned and each finished target.', Layers),

  // Modals & Workflows
  {
    id: 'export-dossier', category: 'modals', action: 'open-export', keys: ['e'], mod: true, caps: ['mod', 'E'],
    labelKey: 'shortcutExport', label: 'Export Forensic Dossier',
    description: 'Build the report: HTML, JSON, Markdown or CSV, each with a SHA-256 integrity manifest.', icon: Download,
  },
  {
    id: 'bulk-import', category: 'modals', action: 'open-bulk', keys: ['b'], mod: true, caps: ['mod', 'B'],
    labelKey: 'shortcutBulk', label: 'Open Bulk Target CSV Ingestion',
    description: 'Import a CSV/TXT list and scan the targets one after another.', icon: FileSpreadsheet,
  },
  {
    id: 'history-cache', category: 'modals', action: 'open-history', keys: ['h'], mod: true, caps: ['mod', 'H'],
    labelKey: 'shortcutHistory', label: 'Open Local Investigation History',
    description: 'Browse, compare, and instantly restore the last 5 cached investigations.', icon: History,
  },
  {
    id: 'modular-config', category: 'modals', action: 'open-modular', keys: ['m'], mod: true, caps: ['mod', 'M'],
    labelKey: 'shortcutModular', label: 'Open Modular Presets & WAF Config',
    description: 'Customize platform scopes, anti-bot response handling, and concurrent probe limits.', icon: Sliders,
  },
  {
    id: 'help-toggle', category: 'modals', action: 'toggle-help', keys: ['?'], caps: ['?'],
    labelKey: 'shortcutHelp', label: 'Toggle Keyboard Shortcuts Cheat Sheet',
    description: 'Quick reference overlay accessible anytime across the application.', icon: Keyboard,
  },
];

/** The shortcut a keydown triggers, if any. Escape is matched here too; its layered behaviour is the handler's. */
export function matchShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>,
  isTyping: boolean,
): ShortcutDef | undefined {
  const mod = event.metaKey || event.ctrlKey;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return SHORTCUTS.find((s) => {
    if (s.action === 'esc-clear') return event.key === 'Escape';
    if (s.mod) return mod && s.keys.includes(key);
    if (isTyping || mod || event.altKey) return false;
    // '?' is Shift+'/' on most layouts; accept both reports of it.
    if (s.action === 'toggle-help') return key === '?' || (event.shiftKey && key === '/');
    return s.keys.includes(key);
  });
}
