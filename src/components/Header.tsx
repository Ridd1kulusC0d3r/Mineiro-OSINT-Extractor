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
import { ThemeMode, getSavedTheme, applyTheme } from '../utils/theme';
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
    const next: ThemeMode = theme === 'dark' ? 'bone' : theme === 'bone' ? 'high-contrast' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#37332B] bg-[#131210]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onGoToDashboard}
          className="flex min-w-0 items-center gap-3 text-left"
          title="Abrir Intelligence Report"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#4A453A] bg-[#F3F0E8]">
            <img src="/mineiro-logo.png" alt="" className="h-full w-full object-contain grayscale" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#ECE8DD]">
              Mineiro Username Intelligence
            </div>
            <div className="truncate text-[11px] text-[#908B7D]">OSINT Investigation Workbench</div>
          </div>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#A19C8E] hover:bg-[#221F1A] hover:text-[#ECE8DD]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Report
            </button>
          )}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#A19C8E] hover:bg-[#221F1A] hover:text-[#ECE8DD]"
            >
              <History className="h-3.5 w-3.5" />
              Cases
              {cachedScansCount > 0 && (
                <span className="rounded-md border border-[#4A453A] px-1.5 text-[10px] text-[#D6D1C3]">{cachedScansCount}</span>
              )}
            </button>
          )}
          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#A19C8E] hover:bg-[#221F1A] hover:text-[#ECE8DD]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Batch
              {bulkBatchCount > 0 && (
                <span className="rounded-md border border-[#4A453A] px-1.5 text-[10px] text-[#D6D1C3]">{bulkBatchCount}</span>
              )}
            </button>
          )}
          {onOpenAiWorkspace && (
            <button
              type="button"
              onClick={onOpenAiWorkspace}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#A19C8E] hover:bg-[#221F1A] hover:text-[#ECE8DD]"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              AI
              {hasPersonalKey && <span className="h-1.5 w-1.5 rounded-full bg-[#ECE8DD]" />}
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {totalScanned > 0 && (
            <div className="hidden xl:flex items-center gap-2 rounded-xl border border-[#37332B] px-3 py-2 text-xs text-[#908B7D]">
              <span>{foundCount} {tr('header.found')}</span>
              <span className="text-[#4A453A]">·</span>
              <span>{totalScanned} {tr('header.checked')}</span>
              {isScanning && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#F0885A]" />}
            </div>
          )}

          <LanguageSelector />

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-[#37332B] bg-[#221F1A] px-3.5 py-2.5 text-sm text-[#D6D1C3] hover:border-[#6F6A5E] hover:text-white"
            title={tr('header.theme')}
          >
            <Contrast className="h-4 w-4" />
            <span className="hidden md:inline">{tr('header.theme')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            disabled={totalScanned === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[#4A453A] bg-[#27241E] px-3.5 py-2.5 text-sm font-medium text-[#F3F0E8] hover:bg-[#27241E] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{tr('header.export')}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[#37332B] p-2.5 text-[#A19C8E] hover:border-[#6F6A5E] hover:text-white"
            title={tr('header.reset')}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
