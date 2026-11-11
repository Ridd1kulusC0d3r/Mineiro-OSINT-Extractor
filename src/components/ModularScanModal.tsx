import { useState } from 'react';
import { 
  Sliders, 
  Zap, 
  Shield, 
  Globe, 
  Mail, 
  Cpu, 
  Layers, 
  Check, 
  X, 
  Sparkles, 
  Clock, 
  Gauge, 
  Settings2,
  HelpCircle,
  Play
} from 'lucide-react';
import { 
  ModularScanConfig, 
  ScanPreset, 
  PlatformScope, 
  Category 
} from '../types';
import { 
  DEFAULT_SCAN_CONFIGS, 
  CATEGORY_LABELS, 
  getPlatformsForScope,
  PLATFORMS_DATABASE,
  CATALOG_STATS
} from '../data/platforms';

interface ModularScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModularScanConfig;
  onSaveConfig: (newConfig: ModularScanConfig) => void;
  onStartScanWithConfig?: (newConfig: ModularScanConfig) => void;
  target?: string;
  targetType?: 'username' | 'email';
  isScanning?: boolean;
}

export function ModularScanModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onStartScanWithConfig,
  target,
  targetType = 'username',
  isScanning = false
}: ModularScanModalProps) {
  const [localConfig, setLocalConfig] = useState<ModularScanConfig>(config);

  if (!isOpen) return null;

  const currentPlatforms = getPlatformsForScope(
    localConfig.platformScope, 
    localConfig.selectedCategory,
    targetType
  );
  const platformCount = currentPlatforms.length;

  // Calculate estimated completion time
  const estimateSeconds = (): string => {
    if (localConfig.platformScope === 'none') return '< 1s';
    const batches = Math.ceil(platformCount / localConfig.concurrency);
    const avgBatchDuration = localConfig.wafInspectionMode === 'fast' ? 0.35 : 0.65;
    const est = Math.max(1, Math.round(batches * avgBatchDuration * 10) / 10);
    return `~${est}s`;
  };

  const handleApplyPreset = (presetKey: ScanPreset) => {
    const presetConfig = DEFAULT_SCAN_CONFIGS[presetKey];
    setLocalConfig({ ...presetConfig });
  };

  const handleSave = () => {
    onSaveConfig({ ...localConfig, enableAutoAiProfile: false });
    onClose();
  };

  const handleStartNow = () => {
    onSaveConfig(localConfig);
    if (onStartScanWithConfig) {
      onStartScanWithConfig({ ...localConfig, enableAutoAiProfile: false });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-paper/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-paper-2 border border-rule w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rule flex items-center justify-between bg-paper/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-rule bg-rule-2 flex items-center justify-center text-ink">
              <Sliders className="w-5 h-5 text-ink-3" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-mono font-bold text-ink tracking-wider uppercase">
                  Modular Reconnaissance Architecture
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-paper-2/60 border border-rule/80 text-ink-3 uppercase">
                  Customizable
                </span>
              </div>
              <p className="text-xs font-mono text-ink-3">
                Enable or disable individual modules to accelerate simple scans or conduct deep forensic investigations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 border border-rule hover:border-ink-3 text-ink-3 hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs font-mono">
          
          {/* Quick Presets Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-ink-3 text-[11px] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Gauge className="w-3.5 h-3.5 text-ink" />
                Fast Preset Selector
              </span>
              <span className="text-[11px] text-ink-3">
                Select an operational profile to adjust all scanning modules automatically
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Preset: Quick */}
              <button
                type="button"
                onClick={() => handleApplyPreset('quick')}
                className={`p-3 border text-left flex flex-col justify-between transition-all ${
                  localConfig.preset === 'quick'
                    ? 'border-ink-3 bg-paper-2/20 text-ink shadow-sm ring-1 ring-ink-3/50'
                    : 'border-rule bg-paper/60 text-ink-3 hover:border-rule hover:text-ink'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-ink-3 text-xs">
                      <Zap className="w-3.5 h-3.5" />
                      ⚡ Quick Scan
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-rule-2 border border-rule text-ink-2">
                      ~1-2s
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-3 leading-relaxed">
                    Top 20 essential platforms (GitHub, X, Reddit, Telegram, etc). Ultra-fast mode for quick presence checks.
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-ink-3 flex items-center gap-2">
                  <span>20 targets</span> • <span>Turbo (16x)</span> • <span>On-Demand AI</span>
                </div>
              </button>

              {/* Preset: Standard */}
              <button
                type="button"
                onClick={() => handleApplyPreset('standard')}
                className={`p-3 border text-left flex flex-col justify-between transition-all ${
                  localConfig.preset === 'standard'
                    ? 'border-ink-3 bg-paper-2/20 text-ink ring-1 ring-ink-3/50'
                    : 'border-rule bg-paper/60 text-ink-3 hover:border-rule hover:text-ink'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-ink-3 text-xs">
                      <Layers className="w-3.5 h-3.5" />
                      ⚖️ Balanced Standard
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-rule-2 border border-rule text-ink-2">
                      ~5s
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-3 leading-relaxed">
                    Top 50 platforms with Mineiro Guard WAF heuristic checks and automatic AI synthesis.
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-ink-3 flex items-center gap-2">
                  <span>50 targets</span> • <span>WAF Deep</span> • <span>Auto AI</span>
                </div>
              </button>

              {/* Preset: Deep Full Matrix */}
              <button
                type="button"
                onClick={() => handleApplyPreset('deep')}
                className={`p-3 border text-left flex flex-col justify-between transition-all ${
                  localConfig.preset === 'deep'
                    ? 'border-ink-3 bg-paper-2/20 text-ink ring-1 ring-ink-3/50'
                    : 'border-rule bg-paper/60 text-ink-3 hover:border-rule hover:text-ink'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-ink-3 text-xs">
                      <Globe className="w-3.5 h-3.5" />
                      🌐 Full Matrix Deep
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-paper-2 border border-rule text-ink">
                      Deep
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-2 leading-relaxed">
                    Catálogo completo com {PLATFORMS_DATABASE.length} endpoints e evidence engine opcional.
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-ink-3 flex items-center gap-2">
                  <span>{PLATFORMS_DATABASE.length} alvos</span> • <span>{CATALOG_STATS.optionalEvidenceChecks.toLocaleString()} checks lógicos</span> • <span>Exaustivo</span>
                </div>
              </button>

              {/* Preset: Email Recon Only */}
              <button
                type="button"
                onClick={() => handleApplyPreset('email_only')}
                className={`p-3 border text-left flex flex-col justify-between transition-all ${
                  localConfig.preset === 'email_only'
                    ? 'border-ink-3 bg-paper-2/20 text-ink ring-1 ring-ink-3/50'
                    : 'border-rule bg-paper/60 text-ink-3 hover:border-rule hover:text-ink'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold flex items-center gap-1.5 text-ink-3 text-xs">
                      <Mail className="w-3.5 h-3.5" />
                      📧 Email & DNS Only
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-rule-2 border border-rule text-ink-2">
                      &lt;1s
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-3 leading-relaxed">
                    Only MX records, DNS servers, and Gravatar profile. Skips platform username probes.
                  </p>
                </div>
                <div className="mt-2 text-[10px] text-ink-3 flex items-center gap-2">
                  <span>0 platforms</span> • <span>Direct DNS</span> • <span>Gravatar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Granular Module Configuration Cards */}
          <div className="border border-rule bg-paper/40 divide-y divide-rule">
            
            {/* Module 1: Platform Probes Scope */}
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-ink-3" />
                      Module 1: Platform Presence Probes
                    </span>
                    <span className="text-[11px] text-ink-3">
                      Configure the depth and scope of username probes across the web
                    </span>
                  </div>
                </div>

                {/* Scope selector tabs */}
                <div className="flex flex-wrap items-center gap-1 bg-paper-2 p-1 border border-rule">
                  {[
                    { id: 'top20', label: '⚡ Top 20 (Rápido)', count: '20' },
                    { id: 'top50', label: 'Top 50 (Popular)', count: '50' },
                    { id: 'category', label: 'Por Categoria', count: 'Filtro' },
                    { id: 'all', label: `🌐 Todas (${PLATFORMS_DATABASE.length}+)`, count: `${PLATFORMS_DATABASE.length}` },
                    { id: 'none', label: 'Desativado', count: '0' },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => {
                        setLocalConfig({
                          ...localConfig,
                          preset: 'custom',
                          platformScope: scope.id as PlatformScope,
                        });
                      }}
                      className={`px-2 py-1 text-[11px] font-mono transition-colors ${
                        localConfig.platformScope === scope.id
                          ? 'bg-signal text-signal-ink font-bold'
                          : 'text-ink-3 hover:text-ink'
                      }`}
                    >
                      {scope.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category sub-selector if 'category' is active */}
              {localConfig.platformScope === 'category' && (
                <div className="pt-2 border-t border-rule/80 space-y-1.5">
                  <span className="text-[10px] text-ink-3 uppercase">
                    Select target forensic category:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => {
                          setLocalConfig({
                            ...localConfig,
                            preset: 'custom',
                            selectedCategory: catKey,
                          });
                        }}
                        className={`px-2 py-1 text-[11px] border transition-colors ${
                          localConfig.selectedCategory === catKey
                            ? 'bg-signal text-signal-ink font-bold border-signal'
                            : 'bg-rule-2 border-rule text-ink-3 hover:text-ink'
                        }`}
                      >
                        {info.label} ({info.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Module 2: Anti-False-Positive & WAF Inspection (Mineiro Guard Heuristics) */}
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-ink-3" />
                      Module 2: Anti-False-Positive & Mineiro Guard WAF Heuristics
                    </span>
                    <span className="text-[11px] text-ink-3">
                      Fast HTTP status checking vs deep Cloudflare WAF and anti-bot signature analysis
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-paper-2 p-1 border border-rule">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalConfig({
                        ...localConfig,
                        preset: 'custom',
                        wafInspectionMode: 'fast',
                        timeoutMs: 2500,
                      });
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono transition-colors flex items-center gap-1 ${
                      localConfig.wafInspectionMode === 'fast'
                        ? 'bg-ink-3 text-paper font-bold'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    ⚡ Fast Mode (Direct HTTP)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalConfig({
                        ...localConfig,
                        preset: 'custom',
                        wafInspectionMode: 'deep',
                        timeoutMs: 5000,
                      });
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono transition-colors flex items-center gap-1 ${
                      localConfig.wafInspectionMode === 'deep'
                        ? 'bg-ink-3 text-paper font-bold'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    <Shield className="w-3 h-3" />
                    🛡️ Deep Mode (Mineiro Guard WAF Heuristics)
                  </button>
                </div>
              </div>
            </div>


            {/* Module 2B: Multi-signal Evidence Engine */}
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-[10px]">
                    2B
                  </div>
                  <div>
                    <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-ink-2" />
                      Evidence Engine
                    </span>
                    <span className="text-[11px] text-ink-3">
                      Up to {CATALOG_STATS.optionalEvidenceChecks.toLocaleString()} optional evidence checks across {CATALOG_STATS.sites} catalogued endpoints
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalConfig({
                    ...localConfig,
                    preset: 'custom',
                    enableEvidenceChecks: !localConfig.enableEvidenceChecks,
                  })}
                  className={`px-3 py-1.5 text-[11px] border uppercase font-bold ${
                    localConfig.enableEvidenceChecks
                      ? 'bg-signal text-signal-ink border-signal'
                      : 'bg-paper-2 text-ink-3 border-rule hover:text-ink'
                  }`}
                >
                  {localConfig.enableEvidenceChecks ? 'Enabled' : 'Optional'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                {[
                  ['8', 'signals / site'],
                  [CATALOG_STATS.sites.toString(), 'catalogued sites'],
                  [CATALOG_STATS.highReliability.toString(), 'high reliability'],
                  [CATALOG_STATS.optionalEvidenceChecks.toLocaleString(), 'max checks'],
                ].map(([value, label]) => (
                  <div key={label} className="border border-rule bg-paper-2 p-2">
                    <div className="text-ink font-bold text-sm">{value}</div>
                    <div className="text-ink-3 uppercase">{label}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-ink-3 leading-relaxed">
                These are logical evidence checks extracted from each response, not thousands of extra network requests.
                The engine evaluates status, redirects, username continuity, body evidence, canonical URL, soft-404 hints and edge protection.
              </p>
            </div>

            {/* Module 3: Email Reconnaissance & DNS MX */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
                  3
                </div>
                <div>
                  <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-ink-3" />
                    Module 3: Email Reconnaissance & DNS MX Records
                  </span>
                  <p className="text-[11px] text-ink-3">
                    Performs DNS MX queries for email domains and checks for Gravatar profile/avatar.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={localConfig.enableEmailRecon}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      preset: 'custom',
                      enableEmailRecon: e.target.checked,
                    });
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-rule peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-signal after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-signal after:border-ink-2 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-signal"></div>
              </label>
            </div>

            {/* Module 4: Gemini AI Intelligence Dossier Profiler */}
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
                  4
                </div>
                <div>
                  <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-ink-3" />
                    Module 4: AI Intelligence Dossier (Gemini)
                  </span>
                  <p className="text-[11px] text-ink-3">
                    <strong className="text-ink-2">Disable to accelerate quick scans!</strong> When disabled, the AI dossier can still be generated on-demand anytime from the dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setLocalConfig({
                      ...localConfig,
                      preset: 'custom',
                      enableAutoAiProfile: !localConfig.enableAutoAiProfile,
                    });
                  }}
                  className={`px-2.5 py-1 text-[11px] border transition-colors ${
                    localConfig.enableAutoAiProfile
                      ? 'bg-paper-2 border-ink-3 text-ink'
                      : 'bg-rule-2 border-rule text-ink-3 hover:text-ink'
                  }`}
                >
                  'AI Copilot · On demand'
                </button>
              </div>
            </div>

            {/* Module 5: Concurrency & Performance Engine */}
            <div className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
                    5
                  </div>
                  <div>
                    <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-ink-3" />
                      Module 5: Network Concurrency & Latency Engine
                    </span>
                    <span className="text-[11px] text-ink-3">
                      Adjust network concurrency to balance speed and rate-limiting stealth
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'Stealth (4x)', val: 4 },
                    { label: 'Default (8x)', val: 8 },
                    { label: '⚡ Turbo (16x)', val: 16 },
                    { label: '🚀 Hyper (24x)', val: 24 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        setLocalConfig({
                          ...localConfig,
                          preset: 'custom',
                          concurrency: item.val,
                        });
                      }}
                      className={`px-2 py-1 text-[11px] border transition-colors ${
                        localConfig.concurrency === item.val
                          ? 'bg-signal text-signal-ink font-bold border-signal'
                          : 'bg-rule-2 border-rule text-ink-3 hover:text-ink'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Summary Box */}
          <div className="p-3.5 border border-rule bg-paper-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-ink-3">Queued Targets:</span>
                <span className="font-bold text-ink bg-rule-2 px-1.5 py-0.5 border border-rule">
                  {platformCount} platforms
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-ink-3">Estimated:</span>
                <span className="font-bold text-ink-3 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {estimateSeconds()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-ink-3">AI:</span>
                <span className={localConfig.enableAutoAiProfile ? 'text-ink-3' : 'text-ink-3'}>
                  'Copilot on demand'
                </span>
              </div>
            </div>

            <div className="text-[11px] text-ink-3 flex items-center gap-1">
              <Settings2 className="w-3.5 h-3.5 text-ink-3" />
              <span>Mode: <strong className="text-ink uppercase">{localConfig.preset}</strong></span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-rule bg-paper/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono text-ink-3 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-ink-3" />
            <span>Configuration is persisted for subsequent investigations.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-4 py-2 border border-rule bg-rule-2 hover:bg-rule-2 text-ink font-mono text-xs uppercase transition-colors"
            >
              Save Configuration
            </button>

            {target && target.trim() && onStartScanWithConfig && (
              <button
                type="button"
                onClick={handleStartNow}
                disabled={isScanning}
                className="flex-1 sm:flex-initial px-5 py-2 bg-signal hover:bg-ink text-signal-ink font-mono font-bold text-xs uppercase flex items-center justify-center gap-1.5 border border-signal transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-paper" />
                Start Scan Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
