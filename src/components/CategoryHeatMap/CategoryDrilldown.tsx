import { Check, Copy, ExternalLink } from 'lucide-react';
import { CATEGORY_COLORS, PALETTE } from '../../theme/palette';
import type { CategoryMetrics } from './categoryHeatMap.logic';

interface CategoryDrilldownProps {
  activeCategoryObj: CategoryMetrics;
  target: string;
  copiedUrl: string | null;
  copyPlatformUrl: (url: string) => void;
}

/** Selected sector: latency, intensity and the confirmed accounts in it. */
export function CategoryDrilldown({ activeCategoryObj, target, copiedUrl, copyPlatformUrl }: CategoryDrilldownProps) {
  return (
    <div className="border border-rule bg-paper p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="w-3 h-3 rounded-none inline-block"
            style={{ backgroundColor: CATEGORY_COLORS[activeCategoryObj.category] || PALETTE.ink }}
          />
          <div>
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              Forensic Sector: {activeCategoryObj.label}
              <span className="px-2 py-0.5 text-[10px] border border-rule bg-rule-2 text-ink-2">
                {activeCategoryObj.foundCount} Confirmed Accounts
              </span>
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-ink-3">
            Average Latency: <strong className="text-ink">{activeCategoryObj.avgResponseMs} ms</strong>
          </span>
          <span className="text-ink-3">
            Relative Intensity: <strong className="text-ink">{activeCategoryObj.compositeIntensity}%</strong>
          </span>
          <div
            className="px-2 py-0.5 text-[10px] font-bold uppercase border border-rule bg-rule-2 text-ink"
          >
            {activeCategoryObj.compositeIntensity >= 75 ? 'HIGH IMPACT' : activeCategoryObj.compositeIntensity >= 40 ? 'MODERATE' : 'LOW'}
          </div>
        </div>
      </div>

      {/* Found Platforms in This Category */}
      {activeCategoryObj.foundPlatforms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {activeCategoryObj.foundPlatforms.map((p) => (
            <div
              key={p.id}
              className="p-3 border border-rule bg-paper-2 hover:border-rule transition-colors flex flex-col justify-between gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink block truncate">
                    {p.platformName}
                  </span>
                  <span className="text-[10px] text-ink-3 block truncate font-mono">
                    {p.url}
                  </span>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] bg-rule-2 text-ink border border-rule shrink-0 font-bold">
                  HIT
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 text-[10px] text-ink-3 pt-2 border-t border-rule">
                <span>{p.responseTimeMs ? `${p.responseTimeMs}ms` : 'Status 200'}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyPlatformUrl(p.url)}
                    className="p-1 hover:text-ink border border-rule bg-paper"
                    title="Copy URL"
                  >
                    {copiedUrl === p.url ? <Check className="w-3 h-3 text-ink" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:text-ink border border-rule bg-paper flex items-center gap-1"
                    title="Open external profile"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-ink-3 font-mono">
          No verified accounts with status 200 found in this category for target @{target}.
          {activeCategoryObj.uncertainCount > 0 && (
            <p className="text-ink-3 mt-1">
              Identified {activeCategoryObj.uncertainCount} probes with WAF/Cloudflare mitigation (uncertain status).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
