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
      <div className="py-20 text-center space-y-3 font-mono border border-[#37332B] bg-[#1B1915] rounded-md">
        <div className="w-12 h-12 mx-auto border border-dashed border-[#908B7D] flex items-center justify-center text-[#B9B4A6]">
          ?
        </div>
        <p className="text-[#ECE8DD] text-sm font-bold tracking-wider">NO PLATFORMS MATCH CURRENT FILTER</p>
        <p className="text-[#B9B4A6] text-xs">Adjust filter settings or run a reconnaissance scan above.</p>
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
        const isNotFound = item.status === 'not_found';
        const isPending = item.status === 'pending';

        const badgeConfig = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.default;

        return (
          <div
            key={item.id}
            id={`platform-card-${item.platformId}`}
            className={`p-4 rounded-md border transition-all flex flex-col justify-between min-h-[180px] h-full relative overflow-hidden ${
              isFound
                ? 'bg-[#1B1915] border-[#ECE8DD]/60 shadow-[0_0_15px_rgba(236,232,221,0.08)] hover:border-[#F0885A]'
                : isUncertain
                ? 'bg-[#1B1915] border-[#908B7D] hover:border-[#B9B4A6]'
                : isScanning
                ? 'bg-[#1B1915] border-[#F0885A] shadow-[0_0_16px_rgba(236,232,221,0.18)]'
                : 'bg-[#1B1915] border-[#37332B] hover:border-[#908B7D]'
            }`}
          >
            {/* Terminal Radar Scanning Overlay for Active Probes */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Horizontal sweep line moving down */}
                <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#ECE8DD]/60 to-transparent animate-[radarSweepVertical_2.4s_linear_infinite]" />
                {/* Vertical sweep line moving across */}
                <div className="absolute inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-[#ECE8DD]/40 to-transparent animate-[radarSweepHorizontal_3.6s_linear_infinite]" />
                {/* Corner reticle targeting brackets */}
                <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-[#F0885A]" />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-[#F0885A]" />
                <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-[#F0885A]" />
                <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-[#F0885A]" />
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
                    <h3 className="text-sm font-mono font-bold text-[#ECE8DD] tracking-wide flex items-center gap-1.5 truncate">
                      <span className="truncate">{item.platformName}</span>
                      {isScanning && (
                        <span className="text-[10px] font-normal text-[#ECE8DD] font-mono tracking-wider animate-pulse shrink-0">
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
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm bg-[#F0885A] text-[#131210] border border-[#F0885A] tracking-wider whitespace-nowrap">
                      HIT // 200
                    </span>
                  )}
                  {isUncertain && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-sm text-[#B9B4A6] border border-[#908B7D] border-dashed bg-[#131210] flex items-center gap-1 whitespace-nowrap">
                      <AlertTriangle className="w-2.5 h-2.5 text-[#B9B4A6]" />
                      UNCERTAIN
                    </span>
                  )}
                  {isNotFound && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#908B7D] rounded-sm bg-[#131210] border border-[#37332B] whitespace-nowrap">
                      404 ABSENT
                    </span>
                  )}
                  {isScanning && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#ECE8DD] border border-[#F0885A] bg-[#131210] rounded-sm flex items-center gap-1.5 shadow-[0_0_12px_rgba(236,232,221,0.25)] whitespace-nowrap">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0885A] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F0885A]"></span>
                      </span>
                      <span className="tracking-wider font-semibold">SCANNING</span>
                    </span>
                  )}
                  {isRateLimited && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#B9B4A6] border border-[#37332B] bg-[#131210] rounded-sm whitespace-nowrap">
                      RATE_LMT
                    </span>
                  )}
                  {isPending && (
                    <span className="px-2 py-0.5 text-[10px] font-mono text-[#908B7D] rounded-sm bg-[#131210] border border-[#37332B] whitespace-nowrap">
                      QUEUED
                    </span>
                  )}
                </div>
              </div>

              {/* Target URL - stable height */}
              <div className="text-xs font-mono text-[#ECE8DD] truncate bg-[#131210] px-2.5 py-1.5 rounded-sm border border-[#37332B] select-all h-8 flex items-center">
                <span className="truncate">{decodeURI(item.url)}</span>
              </div>

              {/* Mineiro Guard Uncertain Reason */}
              {isUncertain && item.uncertainReason && (
                <div className="text-[10px] font-mono text-[#B9B4A6] bg-[#131210] p-2 rounded-sm border border-[#908B7D] truncate" title={item.uncertainReason}>
                  {item.uncertainReason}
                </div>
              )}

              {/* Metadata details if present */}
              {item.metadata && (
                <div className="border-t border-[#37332B] pt-2 text-[11px] font-mono text-[#B9B4A6] space-y-1">
                  {item.metadata.displayName && (
                    <div>Name: <span className="text-[#ECE8DD]">{item.metadata.displayName}</span></div>
                  )}
                  {item.metadata.bio && (
                    <div className="line-clamp-2 text-[#908B7D] italic">"{item.metadata.bio}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Diagnostics & Actions */}
            <div className="mt-3 pt-2.5 border-t border-[#37332B] flex items-center justify-between text-xs font-mono relative z-10">
              <div className="flex items-center gap-2 text-[11px] text-[#B9B4A6]">
                {item.responseTimeMs !== undefined && (
                  <span className="flex items-center gap-1 text-[#B9B4A6] tabular-nums">
                    <Clock className="w-3 h-3 text-[#908B7D]" />
                    {item.responseTimeMs}ms
                  </span>
                )}
                {item.statusCode !== undefined && (
                  <span className="text-[#ECE8DD] bg-[#131210] px-1.5 py-0.5 rounded-sm border border-[#37332B] text-[10px] tabular-nums">
                    {item.statusCode}
                  </span>
                )}
                {item.wafRetried && (
                  <span 
                    className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-semibold ${
                      item.retryResolved
                        ? 'border-[#ECE8DD]/60 bg-[#ECE8DD]/10 text-[#ECE8DD]'
                        : 'border-[#908B7D] bg-[#131210] text-[#B9B4A6]'
                    }`}
                    title={item.retryResolved ? 'WAF challenge resolved after adaptive retry' : 'WAF challenge confirmed after retry'}
                  >
                    {item.retryResolved ? 'WAF RETRY OK' : 'WAF CHALLENGE'}
                  </span>
                )}
                {item.confidenceScore !== undefined && item.confidenceScore > 0 && (
                  <span className="text-[#B9B4A6] tabular-nums">{item.confidenceScore}% conf</span>
                )}
                {item.detectorReliability !== undefined && (
                  <span className="text-[#908B7D] tabular-nums">{item.detectorReliability}% detector</span>
                )}
                {item.evidenceChecksTotal ? (
                  <span className="text-[#908B7D] tabular-nums">{item.evidenceChecksPassed ?? 0}/{item.evidenceChecksTotal} checks</span>
                ) : null}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleCopy(item.url, item.id)}
                  className="p-1.5 rounded-sm text-[#B9B4A6] hover:text-[#ECE8DD] hover:bg-[#131210] border border-transparent hover:border-[#37332B] transition-colors"
                  title="Copy Profile URL"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-[#ECE8DD]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-1.5 rounded-sm flex items-center gap-1 text-xs hover:bg-[#131210] border border-transparent hover:border-[#37332B] transition-colors ${
                    isFound
                      ? 'text-[#ECE8DD] hover:text-[#ECE8DD]'
                      : 'text-[#B9B4A6] hover:text-[#ECE8DD]'
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
