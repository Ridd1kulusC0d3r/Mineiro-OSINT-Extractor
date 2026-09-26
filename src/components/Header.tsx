import { useState, useEffect } from 'react';
import { Shield, Download, Info, Zap, RefreshCw, LayoutDashboard, Key, Sparkles, FileSpreadsheet, History, Contrast, Keyboard } from 'lucide-react';
import { ThemeMode, getSavedTheme, applyTheme } from '../utils/theme';
import { useI18n } from '../utils/i18n';
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
  onOpenShortcuts,
  cachedScansCount = 0,
  bulkBatchCount = 0,
  hasPersonalKey,
  selectedModel,
  foundCount,
  totalScanned,
  isScanning,
}: HeaderProps) {
  const { t } = useI18n();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>(getSavedTheme);

  // Synchronize theme on mount and listen to system preference changes
  useEffect(() => {
    applyTheme(theme);

    const mediaQuery = window.matchMedia ? window.matchMedia('(prefers-contrast: more)') : null;
    const handleChange = () => {
      // If user hasn't explicitly customized localStorage, track system preference
      if (!window.localStorage.getItem('mineiro_theme_preference')) {
        const autoTheme: ThemeMode = mediaQuery?.matches ? 'high-contrast' : 'dark';
        setTheme(autoTheme);
        applyTheme(autoTheme);
      }
    };

    mediaQuery?.addEventListener?.('change', handleChange);
    return () => mediaQuery?.removeEventListener?.('change', handleChange);
  }, []);

  const toggleTheme = () => {
    let nextTheme: ThemeMode = 'dark';
    if (theme === 'dark') nextTheme = 'bone';
    else if (theme === 'bone') nextTheme = 'high-contrast';
    else nextTheme = 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <header className="border-b border-[#2A2A2A] bg-[#050505]/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 bg-[#FFFFFF] flex items-center justify-center border border-[#2A2A2A] overflow-hidden">
            <img src="/mineiro-logo.png" alt="Mineiro Username Extractor" className="w-full h-full object-contain grayscale" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#FFFFFF] border border-[#050505]" title="Mineiro Username Extractor Active Signal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-2xl tracking-wider text-[#FFFFFF]">Mineiro Username Extractor</span>
              <span className="text-[10px] font-mono uppercase bg-[#0A0A0A] text-[#F5F5F5] px-1.5 py-0.5 border border-[#2A2A2A]">
                OSINT RECON
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#A3A3A3]">
                <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-[#FFFFFF] animate-ping' : 'bg-[#737373]'}`} />
                {isScanning ? (
                  <span className="text-[#FFFFFF] font-semibold">{t.liveScan}</span>
                ) : (
                  <span>{t.standby}</span>
                )}
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3] font-mono tracking-tight hidden sm:block">
              {t.appSubtitle || 'Unified OSINT Intelligence & Reconnaissance Suite'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Language Selector (EN / PT / ES) with localStorage persistence */}
          <LanguageSelector />

          {totalScanned > 0 && (
            <div className="hidden md:flex items-center gap-2.5 text-xs font-mono text-[#A3A3A3] px-3 h-8.5 rounded-md bg-[#0A0A0A] border border-[#2A2A2A] shadow-sm">
              <span className="flex items-center gap-1">{t.hits} <strong className="text-[#FFFFFF] font-semibold">{foundCount}</strong></span>
              <span className="text-[#2A2A2A]">|</span>
              <span className="flex items-center gap-1">{t.scanned} <strong className="text-[#F5F5F5] font-semibold">{totalScanned}</strong></span>
            </div>
          )}

          {/* History Button (Local Cache) */}
          {onOpenHistory && (
            <button
              id="header-history-btn"
              type="button"
              onClick={onOpenHistory}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 text-xs font-mono uppercase rounded-md border transition-all ${
                cachedScansCount > 0
                  ? 'border-[#2A2A2A] bg-[#0A0A0A] text-[#F5F5F5] hover:border-[#FFFFFF]'
                  : 'border-[#2A2A2A] bg-[#050505] text-[#737373] hover:text-[#A3A3A3]'
              }`}
              title={t.historyTitle}
            >
              <History className="w-3.5 h-3.5 text-[#A3A3A3]" />
              <span className="hidden sm:inline">{t.history}</span>
              {cachedScansCount > 0 && (
                <span className="text-[10px] bg-[#0A0A0A] text-[#FFFFFF] border border-[#2A2A2A] font-semibold px-1.5 py-0.2 rounded">
                  {cachedScansCount}/5
                </span>
              )}
            </button>
          )}

          {/* Theme Mode Toggle (Dark Ink / Bone Laudo / High Contrast) */}
          <button
            id="header-theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 text-xs font-mono uppercase rounded-md border transition-all ${
              theme === 'bone'
                ? 'border-[#A3A3A3] bg-[#FAFAFA] text-[#050505] font-semibold'
                : theme === 'high-contrast'
                ? 'border-[#FFFFFF] bg-[#0A0A0A] text-[#FFFFFF] font-semibold'
                : 'border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#737373]'
            }`}
            title={`Tema: ${theme === 'bone' ? t.themeBone : theme === 'high-contrast' ? t.themeHighContrast : t.themeDark} — Clique para alternar`}
          >
            <Contrast className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">
              {theme === 'bone' ? t.themeBone : theme === 'high-contrast' ? t.themeHighContrast : t.themeDark}
            </span>
          </button>


          {/* Gemini AI Key Config Button */}
          {onOpenGeminiConfig && (
            <button
              id="gemini-config-btn"
              type="button"
              onClick={onOpenGeminiConfig}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 text-xs font-mono uppercase rounded-md border transition-all ${
                hasPersonalKey
                  ? 'border-neutral-500/60 bg-neutral-950/40 text-neutral-300 hover:bg-neutral-900/40'
                  : 'border-neutral-800/80 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
              title="Configure Personal Gemini AI Key"
            >
              {hasPersonalKey ? (
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <Key className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span className="hidden sm:inline">AI Config</span>
              {hasPersonalKey && <span className="text-[9px] bg-neutral-900/70 border border-neutral-500/40 text-neutral-200 px-1 py-0.2 rounded font-mono">ON</span>}
            </button>
          )}

          {/* Bulk CSV Import Button */}
          {onOpenBulkImport && (
            <button
              id="header-bulk-btn"
              type="button"
              onClick={onOpenBulkImport}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 text-xs font-mono uppercase rounded-md border border-neutral-800/80 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-all"
              title="Bulk Target CSV Ingestion"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Bulk CSV</span>
              {bulkBatchCount > 0 && (
                <span className="text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700 font-semibold px-1.5 py-0.2 rounded">
                  {bulkBatchCount}
                </span>
              )}
            </button>
          )}

          {onGoToDashboard && totalScanned > 0 && (
            <button
              id="header-dashboard-btn"
              type="button"
              onClick={onGoToDashboard}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 text-xs font-mono uppercase rounded-md border border-neutral-800/80 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-neutral-300" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          )}

          <button
            id="export-dossier-btn"
            type="button"
            onClick={onOpenExport}
            disabled={totalScanned === 0}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 h-8.5 text-xs font-mono uppercase rounded-md border border-neutral-800/80 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span> Dossier
          </button>

          <button
            id="reset-scan-btn"
            type="button"
            onClick={onReset}
            className="p-2 sm:px-2.5 h-8.5 text-xs font-mono rounded-md border border-neutral-800/80 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center"
            title="Reset Workspace"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Global Keyboard Shortcuts Modal Trigger */}
          {onOpenShortcuts && (
            <button
              id="header-shortcuts-btn"
              type="button"
              onClick={onOpenShortcuts}
              className="p-2 sm:px-2.5 h-8.5 text-xs font-mono rounded-md border border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#FFFFFF]/60 transition-all flex items-center justify-center gap-1.5"
              title={`${t.shortcutsTitle || 'Keyboard Shortcuts'} (⌘K / ?)`}
            >
              <Keyboard className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <kbd className="hidden lg:inline-flex text-[10px] bg-[#050505] border border-[#2A2A2A] px-1 rounded text-[#A3A3A3]">
                ⌘K
              </kbd>
            </button>
          )}

          <button
            id="info-modal-btn"
            type="button"
            onClick={() => setShowInfoModal(true)}
            className="p-2 sm:px-2.5 h-8.5 text-xs font-mono rounded-md border border-neutral-800/80 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all flex items-center justify-center"
            title="About Mineiro Username Extractor Unified Engine"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-700 max-w-lg w-full p-6 space-y-4 font-mono text-xs text-neutral-300 shadow-2xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wider">
                <Shield className="w-4 h-4 text-white" />
                ABOUT MINEIRO UNIFIED OSINT ENGINE
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-neutral-500 hover:text-white px-2 py-0.5 border border-neutral-800"
              >
                ESC
              </button>
            </div>

            <p className="leading-relaxed">
              <strong className="text-white">Mineiro Username Extractor</strong> is a unified open-source intelligence framework designed to bring together the most potent capabilities of the OSINT ecosystem:
            </p>

            <div className="border border-neutral-800 bg-black p-3 space-y-2">
              <div className="text-[#FFFFFF] font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                MINEIRO OSINT CORE CAPABILITIES:
              </div>
              <ul className="list-disc pl-4 space-y-1.5 text-neutral-400">
                <li><strong className="text-neutral-200">High-Concurrency Probes (large local platform catalog):</strong> Fast, multi-threaded verified reconnaissance across social, developer, security, gaming, and finance sites.</li>
                <li><strong className="text-neutral-200">Anti-Bot & WAF Detection:</strong> Accurately isolates Cloudflare challenges and TLS rate limits with specialized Uncertain status triage.</li>
                <li><strong className="text-neutral-200">Email & DNS Intelligence:</strong> Autonomous MX record corroboration and linked identity verification.</li>
                <li><strong className="text-neutral-200">Cryptographic Investigation Snapshots:</strong> Timestamped SHA-256 signatures ensuring verifiable chain of custody in all forensic exports.</li>
                <li><strong className="text-neutral-200">AI Threat Profiling:</strong> Autonomous archetype classification, cross-account correlation, and threat assessment.</li>
              </ul>
            </div>

            <div className="text-[11px] text-neutral-500 border-t border-neutral-800 pt-3 flex justify-between items-center">
              <span>Pure Monochrome Minimalist Aesthetic</span>
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-3 py-1 bg-white text-black font-bold uppercase hover:bg-neutral-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
