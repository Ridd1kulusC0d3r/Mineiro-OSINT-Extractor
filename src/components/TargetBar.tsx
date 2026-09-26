import React, { useState } from 'react';
import { 
  Search, 
  AtSign, 
  Mail, 
  Play, 
  Square, 
  SlidersHorizontal, 
  FileSpreadsheet,
  Zap,
  Shield,
  Globe,
  Layers,
  Settings,
  Clock,
  Sparkles,
  History
} from 'lucide-react';
import { DEMO_PRESETS, CATEGORY_LABELS, getPlatformsForScope, PLATFORMS_DATABASE } from '../data/platforms';
import { Category, ModularScanConfig, ScanPreset, CachedInvestigation } from '../types';
import { useI18n } from '../utils/i18n';

interface TargetBarProps {
  target: string;
  setTarget: (val: string) => void;
  targetType: 'username' | 'email';
  setTargetType: (type: 'username' | 'email') => void;
  isScanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
  scanConfig: ModularScanConfig;
  onSelectPreset: (preset: ScanPreset) => void;
  onOpenModularConfig: () => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  concurrency: number;
  setConcurrency: (val: number) => void;
  onOpenBulkImport?: () => void;
  bulkBatchCount?: number;
  cachedScans?: CachedInvestigation[];
  onLoadCachedInvestigation?: (scan: CachedInvestigation) => void;
  onOpenHistoryModal?: () => void;
  scanDepth?: 'fast' | 'deep';
  onToggleScanDepth?: (depth: 'fast' | 'deep') => void;
}

export function TargetBar({
  target,
  setTarget,
  targetType,
  setTargetType,
  isScanning,
  onStartScan,
  onStopScan,
  scanConfig,
  onSelectPreset,
  onOpenModularConfig,
  selectedCategory,
  setSelectedCategory,
  concurrency,
  setConcurrency,
  onOpenBulkImport,
  bulkBatchCount = 0,
  cachedScans = [],
  onLoadCachedInvestigation,
  onOpenHistoryModal,
  scanDepth,
  onToggleScanDepth,
}: TargetBarProps) {
  const { t } = useI18n();
  const [showFilters, setShowFilters] = useState(false);

  const currentDepth: 'fast' | 'deep' = scanDepth || scanConfig.wafInspectionMode || 'fast';

  const handleDepthSelect = (depth: 'fast' | 'deep') => {
    if (onToggleScanDepth) {
      onToggleScanDepth(depth);
    } else {
      onSelectPreset(depth === 'deep' ? 'deep' : 'quick');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;
    if (isScanning) {
      onStopScan();
    } else {
      onStartScan();
    }
  };

  const handleSelectPreset = (presetTarget: string, type: 'username' | 'email') => {
    setTargetType(type);
    setTarget(presetTarget);
  };

  const activePlatforms = getPlatformsForScope(scanConfig.platformScope, scanConfig.selectedCategory, targetType);

  return (
    <div className="bg-[#0A0A0A] border-b border-[#2A2A2A] py-4 sm:py-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">

        {/* Modular Scan Preset Bar - Direct One-Click Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 text-xs font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-neutral-500 text-[11px] uppercase tracking-wider font-semibold shrink-0 mr-1">
              Modo de Scan:
            </span>

            {/* Quick Fast Scan */}
            <div className="relative group">
              <button
                type="button"
                id="preset-quick-btn"
                onClick={() => onSelectPreset('quick')}
                className={`h-8 px-3 text-xs font-mono flex items-center gap-1.5 rounded-md border transition-all shrink-0 ${
                  scanConfig.preset === 'quick'
                    ? 'border-neutral-500/80 bg-neutral-950/40 text-neutral-300 font-semibold shadow-sm'
                    : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-neutral-400" />
                <span>Quick (20)</span>
                <span className="text-[10px] text-neutral-500 hidden md:inline">~1.5s</span>
              </button>
              {/* Novice OSINT Tooltip */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-neutral-950 border border-neutral-700 rounded-md text-left shadow-2xl pointer-events-none font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-white border-b border-neutral-800 pb-1 mb-1.5">
                  <span className="text-neutral-400">⚡ QUICK RECON</span>
                  <span className="text-neutral-400">20 Top Platforms</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">SPEED</span>
                    <span className="text-neutral-400 font-bold">~1.5s Ultra Fast</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">STEALTH</span>
                    <span className="text-neutral-400 font-bold">95% Safe</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-300 font-sans leading-relaxed">
                  Probes top authoritative networks (GitHub, Twitter, Reddit, Steam). Lowest network footprint and lowest risk of anti-bot captcha detection.
                </p>
              </div>
            </div>

            {/* Standard Scan */}
            <div className="relative group">
              <button
                type="button"
                id="preset-standard-btn"
                onClick={() => onSelectPreset('standard')}
                className={`h-8 px-3 text-xs font-mono flex items-center gap-1.5 rounded-md border transition-all shrink-0 ${
                  scanConfig.preset === 'standard'
                    ? 'border-neutral-500/80 bg-neutral-950/40 text-neutral-300 font-semibold shadow-sm'
                    : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-neutral-400" />
                <span>Standard (50)</span>
              </button>
              {/* Novice OSINT Tooltip */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-neutral-950 border border-neutral-700 rounded-md text-left shadow-2xl pointer-events-none font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-white border-b border-neutral-800 pb-1 mb-1.5">
                  <span className="text-neutral-400">⚖️ STANDARD RECON</span>
                  <span className="text-neutral-400">50 Platforms</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">SPEED</span>
                    <span className="text-neutral-400 font-bold">~5-7s Balanced</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">STEALTH</span>
                    <span className="text-neutral-400 font-bold">85% Moderate</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-300 font-sans leading-relaxed">
                  Optimal balance for daily investigations. Covers developer, social, financial, and gaming ecosystems with AI heuristics and WAF corroboration.
                </p>
              </div>
            </div>

            {/* Deep Full Matrix */}
            <div className="relative group">
              <button
                type="button"
                id="preset-deep-btn"
                onClick={() => onSelectPreset('deep')}
                className={`h-8 px-3 text-xs font-mono flex items-center gap-1.5 rounded-md border transition-all shrink-0 ${
                  scanConfig.preset === 'deep'
                    ? 'border-[#FFFFFF] bg-[#0A0A0A] text-[#FFFFFF] font-semibold shadow-sm'
                    : 'border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#737373]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#FFFFFF]" />
                <span>Full ({PLATFORMS_DATABASE.length}+)</span>
              </button>
              {/* Novice OSINT Tooltip */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-left shadow-2xl pointer-events-none font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#F5F5F5] border-b border-[#2A2A2A] pb-1 mb-1.5">
                  <span className="text-[#FFFFFF]">🌐 EXHAUSTIVE MATRIX</span>
                  <span className="text-[#A3A3A3]">{PLATFORMS_DATABASE.length}+ Databases</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">SPEED</span>
                    <span className="text-neutral-400 font-bold">~15-25s Deep</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">STEALTH</span>
                    <span className="text-neutral-400 font-bold">Broad Traffic</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-300 font-sans leading-relaxed">
                  Sends probes across all local platform definitions. Uncovers niche forums and paste sites.
                </p>
              </div>
            </div>

            {/* Email Recon Only */}
            <div className="relative group">
              <button
                type="button"
                id="preset-email-btn"
                onClick={() => {
                  onSelectPreset('email_only');
                  setTargetType('email');
                }}
                className={`h-8 px-3 text-xs font-mono flex items-center gap-1.5 rounded-md border transition-all shrink-0 ${
                  scanConfig.preset === 'email_only'
                    ? 'border-neutral-500/80 bg-neutral-950/40 text-neutral-300 font-semibold shadow-sm'
                    : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                }`}
              >
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>Email Only</span>
              </button>
              {/* Novice OSINT Tooltip */}
              <div className="absolute left-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-neutral-950 border border-neutral-700 rounded-md text-left shadow-2xl pointer-events-none font-mono">
                <div className="flex items-center justify-between text-[11px] font-bold text-white border-b border-neutral-800 pb-1 mb-1.5">
                  <span className="text-neutral-400">📧 EMAIL INFRASTRUCTURE</span>
                  <span className="text-neutral-400">DNS & Gravatar</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">SPEED</span>
                    <span className="text-neutral-400 font-bold">~0.8s Instant</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span className="text-neutral-500 block text-[9px]">STEALTH</span>
                    <span className="text-neutral-400 font-bold">100% Passive</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-300 font-sans leading-relaxed">
                  Interrogates apex MX records and Gravatar MD5 avatar hashes without touching platform account endpoints. Complete passive stealth.
                </p>
              </div>
            </div>

            {/* Modular Config Modal Trigger */}
            <button
              type="button"
              id="open-modular-config-btn"
              onClick={onOpenModularConfig}
              className={`h-8 px-3 text-xs font-mono border rounded-md flex items-center gap-1.5 transition-all shrink-0 ${
                scanConfig.preset === 'custom'
                  ? 'border-neutral-400 bg-neutral-800 text-white font-semibold'
                  : 'border-neutral-800/80 bg-neutral-900/60 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
              title="Open granular modular reconnaissance settings"
            >
              <Settings className="w-3.5 h-3.5 text-neutral-400" />
              <span>Modules</span>
              {scanConfig.preset === 'custom' && (
                <span className="text-[10px] bg-neutral-700 text-white px-1 rounded font-bold">Active</span>
              )}
            </button>
          </div>

          {/* Active Config Status Badge */}
          <div 
            onClick={onOpenModularConfig}
            className="h-8 flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900/70 px-3 rounded-md border border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors shrink-0"
            title="Click to customize modular architecture"
          >
            <span className="flex items-center gap-1 text-white font-semibold uppercase">
              {scanConfig.preset === 'quick' && <span className="text-neutral-400">QUICK</span>}
              {scanConfig.preset === 'standard' && <span className="text-neutral-400">STANDARD</span>}
              {scanConfig.preset === 'deep' && <span className="text-neutral-400">FULL</span>}
              {scanConfig.preset === 'email_only' && <span className="text-neutral-400">EMAIL</span>}
              {scanConfig.preset === 'custom' && <span className="text-white">MODULAR</span>}
              :
            </span>
            <span>{activePlatforms.length} platforms</span>
            <span className="text-neutral-700">•</span>
            <span>{scanConfig.concurrency}x concurrency</span>
            <span className="text-neutral-700">•</span>
            <span className={currentDepth === 'deep' ? 'text-[#FFFFFF]' : 'text-neutral-400'}>
              {currentDepth === 'deep' ? 'Deep (6.5s WAF Retry)' : 'Fast (2.5s)'}
            </span>
            <span className="text-neutral-700">•</span>
            <span className={scanConfig.enableAutoAiProfile ? 'text-neutral-400' : 'text-neutral-500'}>
              {scanConfig.enableAutoAiProfile ? 'Auto AI' : 'On-Demand AI'}
            </span>
          </div>
        </div>

        {/* Mode & Target Bar */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col md:flex-row items-stretch gap-2.5">
          {/* Target Type Selector */}
          <div className="flex border border-[#2A2A2A] bg-[#0A0A0A] p-1 rounded-md shrink-0 h-11">
            <button
              type="button"
              id="mode-username-btn"
              onClick={() => setTargetType('username')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded transition-all ${
                targetType === 'username'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <AtSign className="w-3.5 h-3.5" />
              Username
            </button>
            <button
              type="button"
              id="mode-email-btn"
              onClick={() => setTargetType('email')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded transition-all ${
                targetType === 'email'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
          </div>

          {/* Main Input Field Container */}
          <div className="relative flex-1 flex items-center bg-[#0A0A0A] border border-[#2A2A2A] focus-within:border-[#FFFFFF] rounded-md px-3.5 h-11 transition-all shadow-inner">
            <span className="text-xs font-mono text-[#737373] font-semibold shrink-0 select-none mr-2">
              {targetType === 'username' ? 'target@id:' : 'target@mail:'}
            </span>
            <input
              id="target-input"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder={
                targetType === 'username'
                  ? 'Insira o handle para rastrear (ex: satoshi, deivsec)...'
                  : 'Insira o e-mail para investigar (ex: alvo@dominio.com)...'
              }
              className="w-full bg-transparent border-none outline-none text-sm font-mono text-[#F5F5F5] placeholder:text-[#737373] tracking-wide pr-2"
            />
            {target ? (
              <button
                type="button"
                onClick={() => setTarget('')}
                className="shrink-0 text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-mono px-1.5 py-0.5 rounded hover:bg-[#2A2A2A] transition-colors"
                title="Limpar campo (Esc)"
              >
                ✕
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1 shrink-0 select-none pointer-events-none">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[#050505] border border-[#2A2A2A] rounded text-[#A3A3A3]">
                  ⌘K
                </kbd>
              </div>
            )}
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Scan Depth: Fast vs Deep Toggle */}
            <div 
              id="scan-depth-toggle" 
              className="relative flex items-center bg-[#0A0A0A] border border-[#2A2A2A] p-1 rounded-md shrink-0 h-11 group"
            >
              <button
                type="button"
                id="scan-depth-fast-btn"
                onClick={() => handleDepthSelect('fast')}
                className={`h-full px-2.5 sm:px-3 text-xs font-mono flex items-center gap-1.5 rounded transition-all select-none ${
                  currentDepth === 'fast'
                    ? 'bg-neutral-500/20 text-neutral-300 font-bold border border-neutral-500/50 shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] border border-transparent'
                }`}
                title="Fast: 2,500ms timeout threshold, single-pass probe, zero WAF retries"
              >
                <Zap className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>{t.scanDepthFast || 'Fast'}</span>
                <span className="text-[10px] text-neutral-400/80 font-normal hidden lg:inline">2.5s</span>
              </button>

              <button
                type="button"
                id="scan-depth-deep-btn"
                onClick={() => handleDepthSelect('deep')}
                className={`h-full px-2.5 sm:px-3 text-xs font-mono flex items-center gap-1.5 rounded transition-all select-none ${
                  currentDepth === 'deep'
                    ? 'bg-[#FFFFFF]/20 text-[#FFFFFF] font-bold border border-[#FFFFFF]/50 shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] border border-transparent'
                }`}
                title="Deep: 6,500ms timeout threshold, adaptive retry strategy with browser-like headers"
              >
                <Shield className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0" />
                <span>{t.scanDepthDeep || 'Deep'}</span>
                <span className="text-[10px] text-[#FFFFFF]/80 font-normal hidden lg:inline">6.5s WAF</span>
              </button>

              {/* Informative Hover Card detailing timeout threshold and WAF retry strategy */}
              <div className="absolute right-0 top-full mt-2 hidden group-hover:flex flex-col z-50 w-72 p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-md text-left shadow-2xl pointer-events-none font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-1.5 mb-2 font-bold">
                  <span className={currentDepth === 'fast' ? 'text-neutral-400' : 'text-[#FFFFFF]'}>
                    {currentDepth === 'fast' ? '⚡ FAST DEPTH ACTIVE' : '🛡️ DEEP DEPTH ACTIVE'}
                  </span>
                  <span className="text-[#A3A3A3] text-[10px] uppercase">
                    {currentDepth === 'fast' ? 'Low Latency' : 'High Fidelity'}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between bg-[#050505] px-2 py-1 rounded border border-[#2A2A2A]">
                    <span className="text-[#A3A3A3]">{t.scanDepthTimeout || 'Timeout'}:</span>
                    <span className="font-bold text-[#F5F5F5]">{scanConfig.timeoutMs || (currentDepth === 'fast' ? 2500 : 6500)} ms</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#050505] px-2 py-1 rounded border border-[#2A2A2A]">
                    <span className="text-[#A3A3A3]">{t.scanDepthWafStrategy || 'WAF Strategy'}:</span>
                    <span className="font-bold text-[#F5F5F5]">
                      {currentDepth === 'fast' ? 'Fail-Fast (0 Retries)' : 'Adaptive + Browser Spoof'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-[#A3A3A3] leading-relaxed">
                  {currentDepth === 'fast'
                    ? t.scanDepthFastDesc || '2,500ms timeout threshold, single-pass probe, zero WAF retries'
                    : t.scanDepthDeepDesc || '6,500ms timeout threshold, adaptive retry strategy with browser-like headers'}
                </p>
              </div>
            </div>

            {onOpenBulkImport && (
              <button
                type="button"
                id="bulk-import-btn"
                onClick={onOpenBulkImport}
                className="h-11 px-3.5 border border-[#2A2A2A] bg-[#0A0A0A] rounded-md text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#737373] flex items-center gap-1.5 text-xs font-mono uppercase transition-all"
                title="Importar alvos em lote (CSV / Lista)"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#FFFFFF]" />
                <span className="hidden sm:inline">Lote</span>
                {bulkBatchCount > 0 && (
                  <span className="text-[10px] bg-[#2A2A2A] text-[#FFFFFF] border border-[#2A2A2A] font-semibold px-1.5 py-0.2 rounded">
                    {bulkBatchCount}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              id="toggle-filters-btn"
              onClick={() => setShowFilters(!showFilters)}
              className={`h-11 px-3.5 border rounded-md flex items-center gap-1.5 text-xs font-mono uppercase transition-all ${
                showFilters || selectedCategory !== 'all'
                  ? 'border-[#FFFFFF] bg-[#0A0A0A] text-[#FFFFFF] font-semibold'
                  : 'border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#737373]'
              }`}
              title="Filtrar por Categoria"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Categorias</span>
            </button>

            {isScanning ? (
              <button
                type="button"
                id="stop-scan-btn"
                onClick={onStopScan}
                className="h-11 px-6 bg-[#0A0A0A] hover:bg-[#737373]/20 text-[#737373] font-mono font-bold text-xs uppercase flex items-center gap-2 border border-[#737373] rounded-md tracking-wider transition-all"
              >
                <Square className="w-4 h-4 fill-[#737373] text-[#737373]" />
                {t.btnStopRecon}
              </button>
            ) : (
              <button
                type="submit"
                id="start-scan-btn"
                disabled={!target.trim()}
                className="h-11 px-6 font-mono font-bold text-xs uppercase flex items-center gap-2 rounded-md tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-[#050505] border border-[#FFFFFF] shadow-[0_0_12px_rgba(255, 255, 255,0.2)]"
              >
                <Play className="w-4 h-4 fill-[#050505]" />
                {t.btnStartRecon}
              </button>
            )}
          </div>
        </form>

        {/* Dynamic Classification Indicator */}
        {targetType === 'email' && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#FFFFFF] bg-[#0A0A0A] px-3 py-1.5 border border-[#2A2A2A] rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
            <span>
              <strong>CLASSIFICAÇÃO DE ALVO ATIVA:</strong> Filtrando {activePlatforms.length} bases compatíveis com e-mail (evita disparar 960+ probes inválidos de username).
            </span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs font-mono">
          <span className="text-neutral-500 text-[11px] uppercase tracking-wider shrink-0 mr-1">Targets:</span>
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.target}
              id={`preset-${preset.target}`}
              type="button"
              onClick={() => handleSelectPreset(preset.target, preset.type)}
              className={`px-2.5 py-1 border rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                target.toLowerCase() === preset.target.toLowerCase()
                  ? 'border-neutral-500 bg-neutral-800 text-white font-semibold'
                  : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              <span>@{preset.target}</span>
              <span className="text-[10px] text-neutral-500">{preset.tag}</span>
            </button>
          ))}
        </div>

        {/* LocalStorage Cached Investigations Quick Row (Last 5 scans) */}
        {cachedScans && cachedScans.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-900 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              <span className="text-neutral-400 text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1 shrink-0 mr-1">
                <History className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cached ({cachedScans.length}/5):</span>
              </span>
              {cachedScans.map((cached) => {
                const isActive =
                  target.toLowerCase() === cached.target.toLowerCase() &&
                  targetType === cached.targetType;

                return (
                  <button
                    key={cached.id}
                    id={`cached-quick-${cached.id}`}
                    type="button"
                    onClick={() => onLoadCachedInvestigation && onLoadCachedInvestigation(cached)}
                    className={`px-2.5 py-1 border rounded-md text-[11px] font-mono transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'border-neutral-500/70 bg-neutral-950/40 text-neutral-300 font-semibold'
                        : 'border-neutral-800/80 bg-neutral-900/40 text-neutral-300 hover:text-white hover:border-neutral-700'
                    }`}
                    title={`Load cached investigation for "${cached.target}" (${cached.foundCount} hits, scanned at ${cached.formattedTime}) without re-scanning`}
                  >
                    <span className="text-neutral-500">{cached.targetType === 'username' ? '@' : '✉'}</span>
                    <span>{cached.target}</span>
                    <span className="text-[10px] bg-neutral-800 text-neutral-400 border border-neutral-700 px-1 py-0.2 rounded font-semibold">
                      {cached.foundCount} hits
                    </span>
                  </button>
                );
              })}
            </div>
            {onOpenHistoryModal && (
              <button
                type="button"
                id="open-history-link-btn"
                onClick={onOpenHistoryModal}
                className="text-[11px] text-neutral-400 hover:text-white px-2 py-1 rounded hover:bg-neutral-900 transition-colors shrink-0 self-end sm:self-center"
              >
                Gerenciar Histórico →
              </button>
            )}
          </div>
        )}

        {/* Advanced Filters Drawer */}
        {showFilters && (
          <div className="p-4 border border-neutral-800 bg-black space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              {/* Category selector */}
              <div className="space-y-1.5 flex-1">
                <label className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                  Filter Scope by Specific Category
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
                    <button
                      key={catKey}
                      id={`filter-cat-${catKey}`}
                      type="button"
                      onClick={() => setSelectedCategory(catKey)}
                      className={`px-2 py-1 text-xs font-mono border transition-colors ${
                        selectedCategory === catKey
                          ? 'bg-white text-black font-bold border-white'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600'
                      }`}
                    >
                      {info.label} ({info.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Concurrency Selector */}
              <div className="space-y-1.5 shrink-0 border-t sm:border-t-0 sm:border-l border-neutral-800 pt-3 sm:pt-0 sm:pl-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] text-neutral-400 uppercase tracking-wider block">
                    Network Concurrency
                  </label>
                  <span className="text-[10px] text-neutral-500 font-mono">Speed vs. Stealth</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { 
                      label: 'STEALTH (4)', 
                      val: 4,
                      speed: '🐢 Slow (~18-25s)',
                      stealth: '🛡️ 95% Stealth',
                      desc: '4 workers. Minimizes risk of IP rate-limiting, Akamai/Cloudflare captchas, or transient 429 locks. Recommended for sensitive investigations.'
                    },
                    { 
                      label: 'DEFAULT (8)', 
                      val: 8,
                      speed: '⚖️ Balanced (~8-12s)',
                      stealth: '🛡️ 80% Stealth',
                      desc: '8 workers. Balanced probe throughput for daily reconnaissance. Minimal risk of trigger on modern broadband and proxy pipelines.'
                    },
                    { 
                      label: 'TURBO (16)', 
                      val: 16,
                      speed: '⚡ Fast (~4-7s)',
                      stealth: '⚠️ 60% Stealth',
                      desc: '16 workers. Fast parallel queries. Some high-sensitivity sites (like Keybase or Steam) may trigger transient WAF challenge states.'
                    },
                    { 
                      label: 'HYPER (24)', 
                      val: 24,
                      speed: '🚀 Max (~2-4s)',
                      stealth: '🚨 40% Aggressive',
                      desc: '24 workers. Aggressive socket bursts. Fastest possible sweeps, but highest chance of encountering HTTP 429 Too Many Requests.'
                    }
                  ].map((rate) => (
                    <div key={rate.val} className="relative group">
                      <button
                        type="button"
                        onClick={() => setConcurrency(rate.val)}
                        className={`px-2 py-1 text-xs font-mono border transition-colors ${
                          concurrency === rate.val
                            ? 'bg-white text-black font-bold border-white'
                            : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        {rate.label}
                      </button>
                      {/* Operator Tooltip */}
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col z-50 w-64 p-2.5 bg-neutral-950 border border-neutral-700 text-left shadow-2xl pointer-events-none font-mono">
                        <div className="flex items-center justify-between text-[11px] font-bold text-white border-b border-neutral-800 pb-1 mb-1.5">
                          <span>{rate.label}</span>
                          <span className="text-neutral-400">{rate.val} Parallel Threads</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px] mb-1.5">
                          <div className="bg-neutral-900 p-1 border border-neutral-800">
                            <span className="text-neutral-500 block">SPEED</span>
                            <span className="text-white font-bold">{rate.speed}</span>
                          </div>
                          <div className="bg-neutral-900 p-1 border border-neutral-800">
                            <span className="text-neutral-500 block">STEALTH</span>
                            <span className="text-white font-bold">{rate.stealth}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-neutral-300 font-sans leading-relaxed">
                          {rate.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
