import type React from 'react';
import {
  AtSign,
  FileSpreadsheet,
  Mail,
  Play,
  Settings2,
  Square,
} from 'lucide-react';
import { getPlatformsForScope } from '../data/platforms';
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

const presetMeta: Array<[ScanPreset, 'target.quick' | 'target.standard' | 'target.full', string]> = [
  ['quick', 'target.quick', '20'],
  ['standard', 'target.standard', '50'],
  ['deep', 'target.full', '985'],
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
    <section className="border-b border-[#23282d] bg-[#0d1012]">
      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[auto_1fr_auto_auto] lg:items-center">
          <div className="flex h-12 rounded-xl border border-[#2d3339] bg-[#111518] p-1">
            <button
              type="button"
              onClick={() => setTargetType('username')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 text-xs font-medium transition ${
                targetType === 'username'
                  ? 'bg-[#eef0f2] text-[#0b0e10]'
                  : 'text-[#9299a2] hover:text-white'
              }`}
            >
              <AtSign className="h-3.5 w-3.5" />
              Username
            </button>
            <button
              type="button"
              onClick={() => setTargetType('email')}
              className={`inline-flex items-center gap-2 rounded-lg px-3 text-xs font-medium transition ${
                targetType === 'email'
                  ? 'bg-[#eef0f2] text-[#0b0e10]'
                  : 'text-[#9299a2] hover:text-white'
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Email
            </button>
          </div>

          <div className="relative flex h-12 items-center rounded-xl border border-[#32383e] bg-[#111518] px-4 focus-within:border-[#69717a]">
            <span className="mr-2 font-mono text-xs text-[#68717a]">
              {targetType === 'username' ? '@' : 'mail:'}
            </span>
            <input
              id="target-input"
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={targetType === 'username' ? tr('target.usernamePlaceholder') : tr('target.emailPlaceholder')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="h-full w-full bg-transparent text-[15px] text-[#f2f3f4] outline-none placeholder:text-[#5f676f]"
            />
            {target && (
              <button
                type="button"
                onClick={() => setTarget('')}
                className="rounded-lg px-2 py-1 text-xs text-[#777f88] hover:bg-[#1c2125] hover:text-white"
              >
                limpar
              </button>
            )}
          </div>

          <div className="flex h-12 items-center gap-1 rounded-xl border border-[#2d3339] bg-[#111518] p-1">
            {presetMeta.map(([preset, label, count]) => (
              <button
                key={preset}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`rounded-lg px-3 py-2 text-xs transition ${
                  scanConfig.preset === preset
                    ? 'bg-[#20252a] text-[#f2f3f4] shadow-sm'
                    : 'text-[#868e97] hover:text-white'
                }`}
                title={preset === 'deep' ? 'Full progressive scan' : `${label} scan`}
              >
                <span className="font-medium">{tr(label)}</span>
                <span className="ml-1 text-[#69717a]">{count}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={onOpenModularConfig}
              className={`rounded-lg p-2.5 transition ${
                scanConfig.preset === 'custom'
                  ? 'bg-[#eef0f2] text-[#0b0e10]'
                  : 'text-[#858d96] hover:bg-[#1c2125] hover:text-white'
              }`}
              title={tr('target.settings')}
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>

          <button
            type="submit"
            disabled={!target.trim()}
            className={`inline-flex h-12 min-w-[132px] items-center justify-center gap-2 rounded-xl border px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
              isScanning
                ? 'border-[#5a4545] bg-[#1c1515] text-[#d9c4c4]'
                : 'border-[#d9dde1] bg-[#eef0f2] text-[#0b0e10] hover:bg-white'
            }`}
          >
            {isScanning ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isScanning ? tr('target.stop') : tr('target.run')}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#747c85]">
          <div className="flex flex-wrap items-center gap-2">
            <span>{activePlatforms.length} {tr('target.detectorsScope')}</span>
            <span className="text-[#3e454c]">·</span>
            <span>{scanConfig.concurrency}x {tr('target.baseConcurrency')}</span>
            <span className="text-[#3e454c]">·</span>
            <span>{scanConfig.enableEvidenceChecks ? tr('target.evidenceOn') : tr('target.evidenceDemand')}</span>
            {isProgressiveFull && (
              <>
                <span className="text-[#3e454c]">·</span>
                <span className="text-[#b2b7bd]">{tr('target.fullProgressive')}</span>
              </>
            )}
          </div>

          {onOpenBulkImport && (
            <button
              type="button"
              onClick={onOpenBulkImport}
              className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[#8d959e] hover:bg-[#15191c] hover:text-white"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Batch CSV
              {bulkBatchCount > 0 && <span className="text-[#c7ccd1]">{bulkBatchCount}</span>}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
