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

interface HeaderProps {
  onReset: () => void;
  onOpenExport: () => void;
  onGoToDashboard?: () => void;
  onOpenGeminiConfig?: () => void;
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
  onOpenGeminiConfig,
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

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: ThemeMode = theme === 'dark' ? 'bone' : theme === 'bone' ? 'high-contrast' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#252a2f] bg-[#0b0e10]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[76px] max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onGoToDashboard}
          className="flex min-w-0 items-center gap-3 text-left"
          title="Abrir Intelligence Report"
        >
          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#3a4046] bg-[#f3f4f5]">
            <img src="/mineiro-logo.png" alt="" className="h-full w-full object-contain grayscale" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-[17px] font-semibold tracking-[-0.02em] text-[#f2f3f4]">
              Mineiro Intel
            </div>
            <div className="truncate text-xs text-[#888f98]">OSINT Intelligence Workbench</div>
          </div>
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#9aa1aa] hover:bg-[#14181b] hover:text-[#f2f3f4]"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Report
            </button>
          )}
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#9aa1aa] hover:bg-[#14181b] hover:text-[#f2f3f4]"
            >
              <History className="h-3.5 w-3.5" />
              Cases
              {cachedScansCount > 0 && (
                <span className="rounded-md border border-[#343a40] px-1.5 text-[10px] text-[#c5cad0]">{cachedScansCount}</span>
              )}
            </button>
          )}
          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#9aa1aa] hover:bg-[#14181b] hover:text-[#f2f3f4]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Batch
              {bulkBatchCount > 0 && (
                <span className="rounded-md border border-[#343a40] px-1.5 text-[10px] text-[#c5cad0]">{bulkBatchCount}</span>
              )}
            </button>
          )}
          {onOpenGeminiConfig && (
            <button
              type="button"
              onClick={onOpenGeminiConfig}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[#9aa1aa] hover:bg-[#14181b] hover:text-[#f2f3f4]"
            >
              <BrainCircuit className="h-3.5 w-3.5" />
              AI
              {hasPersonalKey && <span className="h-1.5 w-1.5 rounded-full bg-[#e5e7e9]" />}
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {totalScanned > 0 && (
            <div className="hidden xl:flex items-center gap-2 rounded-xl border border-[#2c3237] px-3 py-2 text-xs text-[#89919a]">
              <span>{foundCount} found</span>
              <span className="text-[#3f464d]">·</span>
              <span>{totalScanned} checked</span>
              {isScanning && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />}
            </div>
          )}

          <LanguageSelector />

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2d3339] bg-[#111518] px-3.5 py-2.5 text-sm text-[#c9cdd2] hover:border-[#525961] hover:text-white"
            title="Alternar tema"
          >
            <Contrast className="h-4 w-4" />
            <span className="hidden md:inline">Tema</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            disabled={totalScanned === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-[#394047] bg-[#15191c] px-3.5 py-2.5 text-sm font-medium text-[#f0f1f2] hover:bg-[#1b2024] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-[#2d3339] p-2.5 text-[#9098a1] hover:border-[#525961] hover:text-white"
            title="Limpar workspace"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
