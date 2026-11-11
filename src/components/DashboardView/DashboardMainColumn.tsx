import { ArrowRight, Check, Clock, Copy, ExternalLink, Fingerprint, Layers, ShieldCheck, Sparkles, BrainCircuit } from 'lucide-react';
import type { AiProfileReport, ScanResult } from '../../types';
import { CATEGORY_LABELS } from '../../data/platforms';
import { CATEGORY_COLORS, PALETTE } from '../../theme/palette';
import { useI18n } from '../../utils/i18n';
import { PlatformFavicon } from '../PlatformFavicon';
import type { CategoryStats, FootprintCluster } from './dashboard.logic';

interface DashboardMainColumnProps {
  results: ScanResult[];
  foundResults: ScanResult[];
  aiProfile: AiProfileReport | null;
  isScanning: boolean;
  isAiLoading: boolean;
  onRequestAiProfile?: () => void;
  onViewProfile: () => void;
  onViewTable: () => void;
  categoryStats: CategoryStats;
  footprintProfile: FootprintCluster[];
  copiedUrl: string | null;
  copyToClipboard: (url: string) => void;
}

/** Left two columns: AI dossier brief, presence by category, footprint profile, confirmed profiles. */
export function DashboardMainColumn({
  results, foundResults, aiProfile, isScanning, isAiLoading, onRequestAiProfile, onViewProfile, onViewTable,
  categoryStats, footprintProfile, copiedUrl, copyToClipboard,
}: DashboardMainColumnProps) {
  const { tr } = useI18n();
  return (
  <div className="lg:col-span-2 space-y-6">
    {/* AI Intelligence Dossier Brief if available, or on-demand trigger */}
    {aiProfile ? (
      <div className="card p-5 space-y-3 font-mono rounded-md">
        <div className="flex items-center justify-between border-b border-rule-2 pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-ink" />
            <span className="card-title">
              AI Intelligence Dossier Summary
            </span>
            <span className="text-[10px] chip">
              {aiProfile.modelUsed || 'Gemini'}
            </span>
          </div>
          <button
            type="button"
            onClick={onViewProfile}
            className="text-[11px] text-ink hover:underline flex items-center gap-1"
          >
            Full Dossier <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <p className="text-xs text-ink leading-relaxed">
          {aiProfile.summary}
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
          <span className="chip">
            Archetype: <strong className="text-ink">{aiProfile.archetype}</strong>
          </span>
          <span className="chip">
            Exposure: <strong className="text-ink">{aiProfile.threatLevel}</strong>
          </span>
          <span className="chip">
            Surface Score: <strong className="text-ink">{aiProfile.footprintScore} / 100</strong>
          </span>
        </div>
      </div>
    ) : results.some((r) => r.status === 'found') && !isScanning && onRequestAiProfile ? (
      <div className="card p-4 font-mono space-y-2.5 rounded-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 border border-rule bg-paper flex items-center justify-center shrink-0 rounded-sm">
              <Sparkles className="w-4 h-4 text-ink" />
            </div>
            <div>
              <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                Psychological & OpSec AI Dossier (On-Demand Mode)
              </span>
              <span className="text-[11px] text-ink-2">
                Scan completed. Would you like to synthesize behavioral analysis and exposure risk now?
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRequestAiProfile}
            disabled={isAiLoading}
            className="px-3.5 py-1.5 bg-signal text-signal-ink font-bold border border-signal hover:bg-ink/90 text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 uppercase rounded-sm"
          >
            {isAiLoading ? (
              <>
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-paper" />
                <span>Generate AI Dossier</span>
              </>
            )}
          </button>
        </div>
      </div>
    ) : null}

    {/* Category Footprint Breakdown */}
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rule-2 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-ink" />
          <span className="card-title">
            Presence by Category & Attack Vector
          </span>
        </div>
        <span className="text-[11px] text-ink-2 uppercase">
          {Object.keys(categoryStats).length} Active Categories
        </span>
      </div>

      <div className="space-y-3 pt-1">
        {Object.entries(CATEGORY_LABELS)
          .filter(([cat]) => cat !== 'all')
          .map(([catKey, info]) => {
            const stat = categoryStats[catKey] || { total: info.count, found: 0 };
            const percent = stat.total > 0 ? Math.round((stat.found / stat.total) * 100) : 0;

            return (
              <div key={catKey} className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-ink font-semibold flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full inline-block shrink-0" 
                      style={{ backgroundColor: CATEGORY_COLORS[catKey] || PALETTE.ink }} 
                    />
                    {info.label}
                  </span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-ink-2">{info.desc}</span>
                    <span className="text-ink font-bold font-mono tabular-nums">
                      {stat.found} / {stat.total}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-paper h-2 border border-rule rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ 
                      width: `${stat.found > 0 ? Math.max(percent, 8) : 0}%`,
                      backgroundColor: stat.found > 0 ? PALETTE.ink : PALETTE.rule
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>


    {/* Reliability-weighted Digital Footprint Profile */}
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rule-2 pb-3">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-ink" />
          <span className="card-title">
            Digital Footprint Profile
          </span>
        </div>
        <span className="text-[10px] text-ink-3 uppercase">
          reliability-weighted
        </span>
      </div>
      <p className="text-[11px] text-ink-2 leading-relaxed">
        {tr('dash.footprintNote')}
      </p>
      {footprintProfile.length === 0 ? (
        <div className="border border-dashed border-rule p-4 text-[11px] text-ink-3">
          {tr('dash.noCluster')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {footprintProfile.slice(0, 3).map((item, index) => (
            <div key={item.category} className="border border-rule bg-paper p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-ink-3 uppercase">#{index + 1} cluster</span>
                <span className="text-xs text-ink font-bold tabular-nums">{item.score}%</span>
              </div>
              <div className="text-xs text-ink font-bold uppercase">
                {CATEGORY_LABELS[item.category]?.label || item.category}
              </div>
              <div className="text-[10px] text-ink-2">
                {tr('dash.clusterDetail', { found: item.found, detector: item.avgDetector })}
              </div>
              <div className="h-1.5 bg-card border border-rule overflow-hidden">
                <div className="h-full bg-signal" style={{ width: `${Math.max(4, item.score)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Top Confirmed Discoveries Quick Feed */}
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-rule-2 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-ink" />
          <span className="card-title">
            Confirmed Target Profiles ({foundResults.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onViewTable}
          className="text-[11px] text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
        >
          Inspect in Audit Table <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {foundResults.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-rule bg-paper rounded-sm text-ink-2 text-xs min-h-[140px] flex items-center justify-center">
          {isScanning
            ? 'Reconnaissance in progress. Probing targets across platforms...'
            : 'No confirmed profiles located in this scan scope. Target may use handle variations.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
          {foundResults.map((item) => (
            <div
              key={item.id}
              className="p-3 border border-rule bg-paper rounded-sm flex items-center justify-between hover:border-ink-3 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <PlatformFavicon
                  url={item.url}
                  platformId={item.platformId}
                  platformName={item.platformName}
                  category={item.category}
                  size="sm"
                />
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-ink font-bold text-xs truncate">{item.platformName}</span>
                    <span className="text-[9px] uppercase px-1 py-0.2 border border-rule text-ink-2 rounded-sm">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-[10px] text-ink-2 truncate">{item.url}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => copyToClipboard(item.url)}
                  className="p-1.5 border border-rule bg-paper-2 text-ink-2 hover:text-ink hover:border-ink-3 rounded-sm transition-colors"
                  title="Copy profile link"
                >
                  {copiedUrl === item.url ? (
                    <Check className="w-3 h-3 text-ink" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 border border-rule bg-paper-2 text-ink-2 hover:text-ink hover:border-ink-3 rounded-sm transition-colors"
                  title="Open external profile"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );
}
