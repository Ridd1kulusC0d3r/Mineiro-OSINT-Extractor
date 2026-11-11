import { Check, Globe, Shield, Zap } from 'lucide-react';
import type { ModularScanConfig, PlatformScope } from '../../types';
import { CATALOG_STATS, CATEGORY_LABELS, countPlatformsForScope } from '../../data/platforms';
import { useI18n } from '../../utils/i18n';

interface ProbeModulesProps {
  localConfig: ModularScanConfig;
  setLocalConfig: (config: ModularScanConfig) => void;
  targetType: 'username' | 'email';
}

/** Modules 1 (probe scope), 2 (WAF heuristics) and 2B (evidence engine). */
export function ProbeModules({ localConfig, setLocalConfig, targetType }: ProbeModulesProps) {
  const { tr } = useI18n();
  return (
    <>
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
    </>
  );
}
