import { useState } from 'react';
import { Clock, HelpCircle, Play, Settings2, Sliders, X } from 'lucide-react';
import { ModularScanConfig, ScanPreset } from '../../types';
import { DEFAULT_SCAN_CONFIGS, getPlatformsForScope } from '../../data/platforms';
import { useI18n } from '../../utils/i18n';
import { estimateScanDuration } from './modularScan.logic';
import { PresetSelector } from './PresetSelector';
import { ProbeModules } from './ProbeModules';
import { ServiceModules } from './ServiceModules';

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
  const estimateSeconds = (): string => estimateScanDuration(localConfig, platformCount);

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
          <PresetSelector localConfig={localConfig} targetType={targetType} handleApplyPreset={handleApplyPreset} />

          {/* Granular Module Configuration Cards */}
          <div className="border border-rule bg-paper/40 divide-y divide-rule">
            <ProbeModules localConfig={localConfig} setLocalConfig={setLocalConfig} targetType={targetType} />

            <ServiceModules localConfig={localConfig} setLocalConfig={setLocalConfig} />
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
