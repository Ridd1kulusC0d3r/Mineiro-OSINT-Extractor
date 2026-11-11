import type React from 'react';
import {
  AtSign,
  FileSpreadsheet,
  Mail,
  Play,
  Settings2,
  Square,
} from 'lucide-react';
import { countPlatformsForPreset, getPlatformsForScope } from '../data/platforms';
import type { CachedInvestigation, ModularScanConfig, ScanPreset } from '../types';
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

const presetMeta: Array<[ScanPreset, 'target.quick' | 'target.standard' | 'target.full']> = [
  ['quick', 'target.quick'],
  ['standard', 'target.standard'],
  ['deep', 'target.full'],
];

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
  onOpenBulkImport,
  bulkBatchCount = 0,
}: TargetBarProps) {
  const { tr } = useI18n();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!target.trim()) return;
    if (isScanning) onStopScan();
    else onStartScan();
  };

  const activePlatforms = getPlatformsForScope(
    scanConfig.platformScope,
    scanConfig.selectedCategory,
    targetType
  );

  const isProgressiveFull = scanConfig.platformScope === 'all' && scanConfig.wafInspectionMode === 'deep';

  return (
    <section className="mast border-b border-rule">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
          <div className="tabs tabs-seg h-12 !shadow-none" role="group" aria-label={tr('target.mode')}>
            <button
              type="button"
              onClick={() => setTargetType('username')}
              aria-pressed={targetType === 'username'}
              className="tab"
            >
              <AtSign className="h-3.5 w-3.5" />
              {tr('target.username')}
            </button>
            <button
              type="button"
              onClick={() => setTargetType('email')}
              aria-pressed={targetType === 'email'}
              className="tab"
            >
              <Mail className="h-3.5 w-3.5" />
              {tr('target.email')}
            </button>
          </div>

          <div className="field relative flex h-12 items-center px-4">
            <span className="mr-2 font-mono text-xs text-ink-3" aria-hidden="true">
              {targetType === 'username' ? '@' : 'mail:'}
            </span>
            <input
              id="target-input"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={targetType === 'username' ? tr('target.usernamePlaceholder') : tr('target.emailPlaceholder')}
              aria-label={targetType === 'username' ? tr('target.usernamePlaceholder') : tr('target.emailPlaceholder')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="h-full w-full bg-transparent font-mono text-[15px] text-ink outline-none placeholder:font-sans placeholder:text-ink-3"
            />
            {target && (
              <button
                type="button"
                onClick={() => setTarget('')}
                className="rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3 hover:bg-paper-2 hover:text-ink"
              >
                {tr('target.clear')}
              </button>
            )}
          </div>

          <div className="tabs tabs-seg h-12 !shadow-none" role="group" aria-label={tr('target.depth')}>
            {presetMeta.map(([preset, label]) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectPreset(preset)}
                aria-pressed={scanConfig.preset === preset}
                className="tab"
                title={tr('target.presetTitle', { name: tr(label), count: countPlatformsForPreset(preset, targetType) })}
              >
                {tr(label)}
                <span className="tab-count">{countPlatformsForPreset(preset, targetType)}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenModularConfig}
              aria-pressed={scanConfig.preset === 'custom'}
              className="tab !px-3"
              title={tr('target.settings')}
              aria-label={tr('target.settings')}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!target.trim()}
            className={`${isScanning ? 'btn' : 'btn-primary'} h-12 min-w-[140px] !text-sm`}
          >
            {isScanning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isScanning ? tr('target.stop') : tr('target.run')}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 font-mono text-[11.5px] text-ink-3">
          <div className="flex flex-wrap items-center gap-2">
            <span><span className="text-ink">{activePlatforms.length}</span> {tr('target.detectorsScope')}</span>
            <span aria-hidden="true">·</span>
            <span><span className="text-ink">{scanConfig.concurrency}x</span> {tr('target.baseConcurrency')}</span>
            <span aria-hidden="true">·</span>
            <span>{scanConfig.enableEvidenceChecks ? tr('target.evidenceOn') : tr('target.evidenceDemand')}</span>
            {isProgressiveFull && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-ink-2">{tr('target.fullProgressive')}</span>
              </>
            )}
          </div>

          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-ink-3 hover:bg-paper-2 hover:text-ink"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {tr('target.batchCsv')}
              {bulkBatchCount > 0 && <span className="text-ink">{bulkBatchCount}</span>}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
