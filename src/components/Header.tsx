import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Contrast,
  Download,
  FileSpreadsheet,
  History,
  Keyboard,
  LayoutDashboard,
  RefreshCw,
} from 'lucide-react';
import { ThemeMode, getSavedTheme, applyTheme, nextTheme } from '../theme/theme';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from '../utils/i18n';

interface HeaderProps {
  onReset: () => void;
  onOpenExport: () => void;
  onGoToDashboard?: () => void;
  onOpenAiWorkspace?: () => void;
  onOpenBulkImport?: () => void;
  onOpenHistory?: () => void;
  onOpenShortcuts?: () => void;
  cachedScansCount?: number;
  bulkBatchCount?: number;
  hasPersonalKey?: boolean;
  selectedModel?: string;
  foundCount: number;
  totalScanned: number;
  isScanning: boolean;
}

export function Header({
  onReset,
  onOpenExport,
  onGoToDashboard,
  onOpenAiWorkspace,
  onOpenBulkImport,
  onOpenHistory,
  onOpenShortcuts,
  cachedScansCount = 0,
  bulkBatchCount = 0,
  hasPersonalKey = false,
  foundCount,
  totalScanned,
  isScanning,
}: HeaderProps) {
  const [theme, setTheme] = useState<ThemeMode>(getSavedTheme);
  const { tr } = useI18n();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: ThemeMode = nextTheme(theme);
    setTheme(next);
    applyTheme(next);
  };

  const navButton = 'tab';

  return (
    <header className="mast-glass sticky top-0 z-50 border-b border-rule">
      <div className="mx-auto flex min-h-[68px] max-w-[1400px] items-center gap-5 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onGoToDashboard}
          className="flex min-w-0 items-center gap-3 rounded-xl text-left"
          title={tr('header.openReport')}
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-rule bg-ink">
            <img src="/mineiro-logo.png" alt="" className="h-full w-full object-contain grayscale" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-[15px] font-semibold leading-tight tracking-[-0.01em] text-ink">
              Mineiro Username Intelligence
            </div>
            <div className="mt-1 flex items-center gap-2 truncate font-mono text-[10.5px] font-semibold uppercase leading-none tracking-[0.14em] text-ink-3">
              <span className="mast-dot" aria-hidden="true" />
              <span className="truncate">OSINT Investigation Workbench</span>
            </div>
          </div>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label={tr('header.navigation')}>
          {onGoToDashboard && (
            <button type="button" onClick={onGoToDashboard} className={navButton}>
              <LayoutDashboard className="h-3.5 w-3.5" />
              {tr('header.report')}
            </button>
          )}
          {onOpenHistory && (
            <button type="button" onClick={onOpenHistory} className={navButton}>
              <History className="h-3.5 w-3.5" />
              {tr('header.cases')}
              {cachedScansCount > 0 && <span className="tab-count">{cachedScansCount}</span>}
            </button>
          )}
          {onOpenBulkImport && (
            <button type="button" onClick={onOpenBulkImport} className={navButton}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {tr('header.batch')}
              {bulkBatchCount > 0 && <span className="tab-count">{bulkBatchCount}</span>}
            </button>
          )}
          {onOpenAiWorkspace && (
            <button type="button" onClick={onOpenAiWorkspace} className={navButton}>
              <BrainCircuit className="h-3.5 w-3.5" />
              {tr('header.ai')}
              {hasPersonalKey && <span className="mast-dot !h-1.5 !w-1.5" aria-label={tr('ai.configured')} />}
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {totalScanned > 0 && (
            <div className="chip hidden !py-1.5 xl:inline-flex" aria-live="polite">
              <span className="text-ink">{foundCount}</span> {tr('header.found')}
              <span className="text-ink-3" aria-hidden="true">·</span>
              <span className="text-ink">{totalScanned}</span> {tr('header.checked')}
              {isScanning && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />}
            </div>
          )}

          <LanguageSelector />

          <button type="button" onClick={toggleTheme} className="btn btn-icon md:px-3.5" title={tr('header.theme')}>
            <Contrast className="h-4 w-4" />
            <span className="hidden md:inline">{tr('header.theme')}</span>
          </button>

          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="btn btn-icon"
              title={tr('header.shortcuts')}
              aria-label={tr('header.shortcuts')}
              aria-keyshortcuts="Shift+?"
            >
              <Keyboard className="h-4 w-4" />
            </button>
          )}

          <button type="button" onClick={onOpenExport} disabled={totalScanned === 0} className="btn md:px-3.5">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{tr('header.export')}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="btn btn-icon"
            title={tr('header.reset')}
            aria-label={tr('header.reset')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
