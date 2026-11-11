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
  countPlatformsForPreset,
  countPlatformsForScope,
  CATALOG_STATS,
} from '../data/platforms';
import { useI18n, type UiMessageKey } from '../utils/i18n';

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

const PRESET_CARDS: Array<{ preset: ScanPreset; icon: typeof Zap; name: UiMessageKey; desc: UiMessageKey }> = [
  { preset: 'quick', icon: Zap, name: 'modular.quickName', desc: 'modular.quickDesc' },
  { preset: 'standard', icon: Layers, name: 'modular.standardName', desc: 'modular.standardDesc' },
  { preset: 'deep', icon: Globe, name: 'modular.fullName', desc: 'modular.fullDesc' },
  { preset: 'email_only', icon: Mail, name: 'modular.emailName', desc: 'modular.emailDesc' },
];

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
  const { tr } = useI18n();
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
    <div role="dialog" aria-modal="true" aria-labelledby="modular-scan-title" className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="dialog w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mast p-4 sm:p-5 border-b border-rule flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 border border-rule bg-rule-2 flex items-center justify-center text-ink">
              <Sliders className="w-5 h-5 text-ink-3" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="modular-scan-title" className="text-lg font-bold text-ink">
                  Modular Reconnaissance Architecture
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-paper-2/60 border border-rule/80 text-ink-3 uppercase">
                  Customizable
                </span>
              </div>
              <p className="text-[13px] text-ink-3">
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
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-[13px]">
          
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
              {PRESET_CARDS.map(({ preset, icon: Icon, name, desc }) => {
                const cfg = DEFAULT_SCAN_CONFIGS[preset];
                const count = countPlatformsForPreset(preset, targetType);
                const active = localConfig.preset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    aria-pressed={active}
                    className={`card p-3.5 text-left flex flex-col justify-between transition-[border-color,transform] hover:-translate-y-px ${
                      active ? 'card-accent !border-signal' : 'hover:!border-rule'
                    }`}
                  >
                    <div>
                      <span className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                        <Icon className={`w-3.5 h-3.5 ${active ? 'text-signal' : 'text-ink-3'}`} />
                        {tr(name)}
                      </span>
                      <p className="mt-1.5 text-[12.5px] text-ink-3 leading-relaxed">{tr(desc)}</p>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="chip">{tr('modular.detectors', { count })}</span>
                      {preset !== 'email_only' && <span className="chip chip-quiet">{cfg.concurrency}x</span>}
                      {cfg.enableEvidenceChecks && <span className="chip chip-quiet">Evidence Engine</span>}
                    </div>
                  </button>
                );
              })}
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
                <div className="tabs tabs-sm tabs-seg flex-wrap" role="group" aria-label={tr('modular.scope')}>
                  {[
                    { id: 'top20', label: tr('modular.scopeTop', { count: countPlatformsForScope('top20', 'all', targetType) }) },
                    { id: 'top50', label: tr('modular.scopeTop', { count: countPlatformsForScope('top50', 'all', targetType) }) },
                    { id: 'category', label: tr('modular.scopeCategory') },
                    { id: 'all', label: tr('modular.scopeAll', { count: countPlatformsForScope('all', 'all', targetType) }) },
                    { id: 'none', label: tr('modular.scopeNone') },
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
                      aria-pressed={localConfig.platformScope === scope.id}
                      className="tab"
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
                    {tr('modular.pickCategory')}
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
                        aria-pressed={localConfig.selectedCategory === catKey}
                        className={`chip ${localConfig.selectedCategory === catKey ? '!bg-ink !text-paper !border-ink' : 'hover:!text-ink'}`}
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
                    Fast Mode (Direct HTTP)
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
                    Deep Mode (Mineiro Guard WAF Heuristics)
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

                <div className="tabs tabs-sm tabs-seg" role="group" aria-label={tr('modular.concurrency')}>
                  {[4, 6, 8, 10, 16, 24].map((val) => ({ label: `${val}x`, val })).map((item) => (
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
                      aria-pressed={localConfig.concurrency === item.val}
                      className="tab"
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
                  {tr('modular.detectors', { count: platformCount })}
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
                <span className="text-ink-3">{tr('modular.aiOnDemand')}</span>
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
              className="btn flex-1 sm:flex-initial"
            >
              Save Configuration
            </button>

            {target && target.trim() && onStartScanWithConfig && (
              <button
                type="button"
                onClick={handleStartNow}
                disabled={isScanning}
                className="btn-primary flex-1 sm:flex-initial"
              >
                <Play className="w-3.5 h-3.5" />
                Start Scan Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
