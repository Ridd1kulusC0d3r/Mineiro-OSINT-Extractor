import { useEffect, useState } from 'react';
import {
  BrainCircuit,
  Contrast,
  Download,
  FileSpreadsheet,
  History,
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

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-paper/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onGoToDashboard}
          className="flex min-w-0 items-center gap-3 text-left"
          title="Abrir Intelligence Report"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-rule bg-ink">
            <img src="/mineiro-logo.png" alt="" className="h-full w-full object-contain grayscale" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-[15px] font-semibold tracking-[-0.02em] text-ink">
              Mineiro Username Intelligence
            </div>
            <div className="truncate text-[11px] text-ink-3">OSINT Investigation Workbench</div>
          </div>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3 hover:bg-card hover:text-ink"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Report
            </button>
          )}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3 hover:bg-card hover:text-ink"
            >
              <History className="h-3.5 w-3.5" />
              Cases
              {cachedScansCount > 0 && (
                <span className="rounded-md border border-rule px-1.5 text-[10px] text-ink">{cachedScansCount}</span>
              )}
            </button>
          )}
          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3 hover:bg-card hover:text-ink"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Batch
              {bulkBatchCount > 0 && (
                <span className="rounded-md border border-rule px-1.5 text-[10px] text-ink">{bulkBatchCount}</span>
              )}
            </button>
          )}
          {onOpenAiWorkspace && (
            <button
              type="button"
              onClick={onOpenAiWorkspace}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-3 hover:bg-card hover:text-ink"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              AI
              {hasPersonalKey && <span className="h-1.5 w-1.5 rounded-full bg-ink" />}
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {totalScanned > 0 && (
            <div className="hidden xl:flex items-center gap-2 rounded-xl border border-rule px-3 py-2 text-xs text-ink-3">
              <span>{foundCount} {tr('header.found')}</span>
              <span className="text-ink-3">·</span>
              <span>{totalScanned} {tr('header.checked')}</span>
              {isScanning && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" />}
            </div>
          )}

          <LanguageSelector />

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-rule bg-card px-3.5 py-2.5 text-sm text-ink hover:border-ink-3 hover:text-ink"
            title={tr('header.theme')}
          >
            <Contrast className="h-4 w-4" />
            <span className="hidden md:inline">{tr('header.theme')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            disabled={totalScanned === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-rule bg-rule-2 px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-rule-2 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{tr('header.export')}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-rule p-2.5 text-ink-3 hover:border-ink-3 hover:text-ink"
            title={tr('header.reset')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
