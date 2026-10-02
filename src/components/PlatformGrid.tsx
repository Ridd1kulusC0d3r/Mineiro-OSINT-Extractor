import { useState } from 'react';
import { ExternalLink, Copy, Check, Clock, AlertTriangle } from 'lucide-react';
import { ScanResult } from '../types';
import { PlatformFavicon } from './PlatformFavicon';
import { CATEGORY_BADGES } from '../utils/themeColors';

interface PlatformGridProps {
  results: ScanResult[];
  target: string;
}

export function PlatformGrid({ results }: PlatformGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (results.length === 0) {
    return (
      <div className="py-20 text-center space-y-3 font-mono border border-[#2A2A2A] bg-[#0A0A0A] rounded-md">
        <div className="w-12 h-12 mx-auto border border-dashed border-[#737373] flex items-center justify-center text-[#A3A3A3]">
          ?
        </div>
        <p className="text-[#F5F5F5] text-sm font-bold tracking-wider">NO PLATFORMS MATCH CURRENT FILTER</p>
        <p className="text-[#A3A3A3] text-xs">Adjust filter settings or run a reconnaissance scan above.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {results.map((item) => {
        const isFound = item.status === 'found';
        const isUncertain = item.status === 'uncertain';
        const isScanning = item.status === 'scanning';
        const isRateLimited = item.status === 'rate_limited';
        const isError = item.status === 'error';
        const isNotFound = item.status === 'not_found';
        const isPending = item.status === 'pending';

        const badgeConfig = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.default;

        return (
          <div
            key={item.id}
            id={`platform-card-${item.platformId}`}
            className={`p-4 rounded-md border transition-all flex flex-col justify-between min-h-[180px] h-full relative overflow-hidden ${
              isFound
                ? 'bg-[#0A0A0A] border-[#FFFFFF]/60 shadow-[0_0_15px_rgba(255, 255, 255,0.08)] hover:border-[#FFFFFF]'
                : isUncertain
                ? 'bg-[#0A0A0A] border-[#737373] hover:border-[#A3A3A3]'
                : isScanning
                ? 'bg-[#0A0A0A] border-[#FFFFFF] shadow-[0_0_16px_rgba(255, 255, 255,0.18)]'
                : 'bg-[#0A0A0A] border-[#2A2A2A] hover:border-[#737373]'
            }`}
          >
            {/* Terminal Radar Scanning Overlay for Active Probes */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Horizontal sweep line moving down */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFFFFF]/60 to-transparent animate-[radarSweepVertical_2.4s_linear_infinite]" />
                {/* Vertical sweep line moving across */}
                <div className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#FFFFFF]/40 to-transparent animate-[radarSweepHorizontal_3.6s_linear_infinite]" />
                {/* Corner reticle targeting brackets */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#FFFFFF]" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#FFFFFF]" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-[#FFFFFF]" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#FFFFFF]" />
              </div>
            )}

            {/* Top Section */}
            <div className="space-y-3 relative z-10">
              {/* Header: Platform name, category & status badge */}
              <div className="flex items-start justify-between gap-2 min-h-[36px]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <PlatformFavicon
                    url={item.url}
                    platformId={item.platformId}
                    platformName={item.platformName}
                    category={item.category}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-mono font-bold text-[#F5F5F5] tracking-wide flex items-center gap-1.5 truncate">
                      <span className="truncate">{item.platformName}</span>
                      {isScanning && (
                        <span className="text-[10px] font-normal text-[#FFFFFF] font-mono tracking-wider animate-pulse shrink-0">
                          [PROBING]
                        </span>
                      )}
                    </h3>
                    <span 
                      className={`text-[10px] font-mono uppercase tracking-wider inline-block font-semibold px-1.5 py-0.2 rounded-sm border ${badgeConfig.border} ${badgeConfig.bg} ${badgeConfig.text}`}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>

                {/* Status Badge - Single-line, fixed sizing to prevent layout shift */}
                <div className="shrink-0">
                  {isFound && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm bg-[#FFFFFF] text-[#050505] border border-[#FFFFFF] tracking-wider whitespace-nowrap">
                      HIT // 200
                    </span>
                  )}
                  {isUncertain && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-sm text-[#A3A3A3] border border-[#737373] border-dashed bg-[#050505] flex items-center gap-1 whitespace-nowrap">
                      <AlertTriangle className="w-2.5 h-2.5 text-[#A3A3A3]" />
                      UNCERTAIN
                    </span>
                  )}
                  {isNotFound && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#737373] rounded-sm bg-[#050505] border border-[#2A2A2A] whitespace-nowrap">
                      404 ABSENT
                    </span>
                  )}
                  {isScanning && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#FFFFFF] border border-[#FFFFFF] bg-[#050505] rounded-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(255, 255, 255,0.25)] whitespace-nowrap">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFFFFF] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#FFFFFF]"></span>
                      </span>
                      <span className="tracking-wider font-semibold">SCANNING</span>
                    </span>
                  )}
                  {isRateLimited && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#A3A3A3] border border-[#2A2A2A] bg-[#050505] rounded-sm whitespace-nowrap">
                      RATE_LMT
                    </span>
                  )}
                  {isError && (
                    <span title={item.uncertainReason || 'The probe failed before a verdict'} className="px-2 py-0.5 text-[10px] font-mono text-[#A3A3A3] border border-dotted border-[#737373] bg-[#050505] rounded-sm whitespace-nowrap">
                      ERROR
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#737373] rounded-sm bg-[#050505] border border-[#2A2A2A] whitespace-nowrap">
                      QUEUED
                    </span>
                  )}
                </div>
              </div>

              {/* Target URL - stable height */}
              <div className="text-xs font-mono text-[#F5F5F5] truncate bg-[#050505] px-2.5 py-1.5 rounded-sm border border-[#2A2A2A] select-all h-8 flex items-center">
                <span className="truncate">{decodeURI(item.url)}</span>
              </div>

              {/* Mineiro Guard Uncertain Reason */}
              {isUncertain && item.uncertainReason && (
                <div className="text-[10px] font-mono text-[#A3A3A3] bg-[#050505] p-2 rounded-sm border border-[#737373] truncate" title={item.uncertainReason}>
                  {item.uncertainReason}
                </div>
              )}

              {/* Metadata details if present */}
              {item.metadata && (
                <div className="border-t border-[#2A2A2A] pt-2 text-[11px] font-mono text-[#A3A3A3] space-y-1">
                  {item.metadata.displayName && (
                    <div>Name: <span className="text-[#F5F5F5]">{item.metadata.displayName}</span></div>
                  )}
                  {item.metadata.bio && (
                    <div className="line-clamp-2 text-[#737373] italic">"{item.metadata.bio}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Diagnostics & Actions */}
            <div className="mt-3 pt-2.5 border-t border-[#2A2A2A] flex items-center justify-between text-xs font-mono relative z-10">
              <div className="flex items-center gap-2 text-[11px] text-[#A3A3A3]">
                {item.responseTimeMs !== undefined && (
                  <span className="flex items-center gap-1 text-[#A3A3A3] tabular-nums">
                    <Clock className="w-3 h-3 text-[#737373]" />
                    {item.responseTimeMs}ms
                  </span>
                )}
                {item.statusCode !== undefined && (
                  <span className="text-[#F5F5F5] bg-[#050505] px-1.5 py-0.5 rounded-sm border border-[#2A2A2A] text-[10px] tabular-nums">
                    {item.statusCode}
                  </span>
                )}
                {item.wafRetried && (
                  <span 
                    className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-semibold ${
                      item.retryResolved
                        ? 'border-[#FFFFFF]/60 bg-[#FFFFFF]/10 text-[#FFFFFF]'
                        : 'border-[#737373] bg-[#050505] text-[#A3A3A3]'
                    }`}
                    title={item.retryResolved ? 'WAF challenge resolved after adaptive retry' : 'WAF challenge confirmed after retry'}
                  >
                    {item.retryResolved ? 'WAF RETRY OK' : 'WAF CHALLENGE'}
                  </span>
                )}
                {item.confidenceScore !== undefined && item.confidenceScore > 0 && (
                  <span className="text-[#A3A3A3] tabular-nums">{item.confidenceScore}% conf</span>
                )}
                {item.detectorReliability !== undefined && (
                  <span className="text-[#737373] tabular-nums">{item.detectorReliability}% detector</span>
                )}
                {item.evidenceChecksTotal ? (
                  <span className="text-[#737373] tabular-nums">{item.evidenceChecksPassed ?? 0}/{item.evidenceChecksTotal} checks</span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(item.url, item.id)}
                  className="p-1.5 rounded-sm text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505] border border-transparent hover:border-[#2A2A2A] transition-colors"
                  title="Copy Profile URL"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-[#FFFFFF]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-1.5 rounded-sm flex items-center gap-1 text-xs hover:bg-[#050505] border border-transparent hover:border-[#2A2A2A] transition-colors ${
                    isFound
                      ? 'text-[#F5F5F5] hover:text-[#FFFFFF]'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                  }`}
                  title="Open Target Profile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
