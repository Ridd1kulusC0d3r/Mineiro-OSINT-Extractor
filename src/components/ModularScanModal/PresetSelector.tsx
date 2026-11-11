import { Gauge } from 'lucide-react';
import type { ModularScanConfig, ScanPreset } from '../../types';
import { DEFAULT_SCAN_CONFIGS, countPlatformsForPreset } from '../../data/platforms';
import { useI18n } from '../../utils/i18n';
import { PRESET_CARDS } from './presetCards';

interface PresetSelectorProps {
  localConfig: ModularScanConfig;
  targetType: 'username' | 'email';
  handleApplyPreset: (presetKey: ScanPreset) => void;
}

/** The four preset cards. */
export function PresetSelector({ localConfig, targetType, handleApplyPreset }: PresetSelectorProps) {
  const { tr } = useI18n();
  return (
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
  );
}
