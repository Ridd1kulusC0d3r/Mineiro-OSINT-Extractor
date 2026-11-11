import { useState } from 'react';
import { ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import { ScanResult } from '../types';
import { PlatformFavicon } from './PlatformFavicon';
import { CATEGORY_BADGES, PALETTE } from '../theme/palette';

interface PlatformTableProps {
  results: ScanResult[];
}

export function PlatformTable({ results }: PlatformTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (results.length === 0) {
    return (
      <div className="py-20 text-center space-y-3 font-mono border border-rule bg-paper-2 rounded-md">
        <div className="w-12 h-12 mx-auto border border-dashed border-ink-3 flex items-center justify-center text-ink-2">
          ?
        </div>
        <p className="text-ink text-sm font-bold tracking-wider">NO PLATFORMS MATCH CURRENT FILTER</p>
        <p className="text-ink-2 text-xs">Adjust filter settings or run a reconnaissance scan above.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-rule bg-paper-2 overflow-hidden shadow-sm overflow-x-auto">
      <table className="w-full table-fixed text-left text-xs font-mono">
        <colgroup>
          <col className="w-[130px]" />
          <col className="w-[180px]" />
          <col className="w-[130px]" />
          <col className="w-auto" />
          <col className="w-[90px]" />
          <col className="w-[90px]" />
          <col className="w-[90px]" />
          <col className="w-[85px]" />
        </colgroup>
        <thead className="border-b border-rule bg-paper text-ink-2 uppercase text-[11px] tracking-wider">
          <tr>
            <th className="py-3 px-4 font-semibold">Status</th>
            <th className="py-3 px-4 font-semibold">Platform</th>
            <th className="py-3 px-4 font-semibold">Category</th>
            <th className="py-3 px-4 font-semibold">Direct URL</th>
            <th className="py-3 px-4 font-semibold text-right">Confidence</th>
            <th className="py-3 px-4 font-semibold text-right">Detector</th>
            <th className="py-3 px-4 font-semibold text-right">Latency</th>
            <th className="py-3 px-4 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
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
              <tr
                key={item.id}
                className={`transition-colors relative overflow-hidden ${
                  isFound
                    ? 'bg-paper-2 hover:bg-card text-ink'
                    : isUncertain
                    ? 'bg-paper/80 hover:bg-paper-2 text-ink-2'
                    : isScanning
                    ? 'bg-paper-2 border-b border-ink/40 text-ink'
                    : 'text-ink-2 hover:bg-paper/50'
                }`}
              >
                <td className="py-2.5 px-4 whitespace-nowrap">
                  {isFound && (
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-signal text-signal-ink font-bold border border-signal text-[10px] tracking-wider uppercase">
                      HIT // 200
                    </span>
                  )}
                  {isUncertain && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-ink-3 border-dashed bg-paper text-ink-2 text-[10px] font-medium uppercase">
                      <AlertTriangle className="w-2.5 h-2.5 text-ink-2" />
                      UNCERTAIN
                    </span>
                  )}
                  {isNotFound && (
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-paper border border-rule text-ink-3 text-[10px]">
                      404 ABSENT
                    </span>
                  )}
                  {isScanning && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-signal bg-paper text-ink text-[10px] font-semibold animate-pulse shadow-[0_0_10px_color-mix(in_srgb,var(--ink)_20%,transparent)]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-signal"></span>
                      </span>
                      SCANNING
                    </span>
                  )}
                  {isRateLimited && (
                    <span className="px-1.5 py-0.5 rounded-sm bg-paper text-ink-2 border border-rule text-[10px]">
                      RATE_LMT
                    </span>
                  )}
                  {isError && (
                    <span title={item.uncertainReason || 'The probe failed before a verdict'} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-paper text-ink-3 border border-dotted border-ink-3 text-[10px]">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      ERROR
                    </span>
                  )}
                  {isPending && (
                    <span className="text-ink-3 text-[10px] px-1.5 py-0.5">QUEUED</span>
                  )}
                </td>

                <td className="py-2.5 px-4 font-medium whitespace-nowrap text-ink">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PlatformFavicon
                      url={item.url}
                      platformId={item.platformId}
                      platformName={item.platformName}
                      category={item.category}
                      size="sm"
                    />
                    <span className="truncate font-semibold">{item.platformName}</span>
                    {isScanning && (
                      <span className="text-[9px] font-normal text-ink font-mono tracking-wider animate-pulse shrink-0">
                        [PROBING]
                      </span>
                    )}
                  </div>
                </td>

                <td className="py-2.5 px-4 uppercase text-[10px] whitespace-nowrap">
                  <span 
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border ${badgeConfig.border} ${badgeConfig.bg} ${badgeConfig.text}`}
                  >
                    <span 
                      className="w-1.5 h-1.5 rounded-full inline-block" 
                      style={{ backgroundColor: isFound ? PALETTE.ink : PALETTE.ink2 }} 
                    />
                    {item.category}
                  </span>
                  {item.siteType && (
                    <div className="mt-1 text-[9px] text-ink-3 lowercase truncate" title={item.siteType}>
                      {item.siteType.replace(/_/g, ' ')}
                    </div>
                  )}
                </td>

                <td className="py-2.5 px-4 truncate text-ink-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline hover:text-ink text-ink transition-colors block truncate"
                    title={decodeURI(item.url)}
                  >
                    {decodeURI(item.url)}
                  </a>
                  {item.uncertainReason && (
                    <div className="text-[10px] text-ink-2 truncate" title={item.uncertainReason}>
                      {item.uncertainReason}
                    </div>
                  )}
                </td>

                <td className="py-2.5 px-4 whitespace-nowrap text-ink text-[11px] text-right tabular-nums">
                  {item.confidenceScore ? `${item.confidenceScore}%` : '—'}
                </td>

                <td className="py-2.5 px-4 whitespace-nowrap text-ink-2 text-[11px] text-right tabular-nums">
                  {item.detectorReliability !== undefined ? `${item.detectorReliability}%` : '—'}
                  {item.evidenceChecksTotal ? (
                    <div className="text-[9px] text-ink-3">{item.evidenceChecksPassed ?? 0}/{item.evidenceChecksTotal} checks</div>
                  ) : null}
                </td>

                <td className="py-2.5 px-4 whitespace-nowrap text-ink-2 text-right tabular-nums">
                  {item.responseTimeMs !== undefined ? `${item.responseTimeMs}ms` : '—'}
                </td>

                <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.url, item.id)}
                    className="p-1.5 rounded-sm border border-rule bg-paper text-ink-2 hover:text-ink hover:border-ink-3 transition-colors inline-block"
                    title="Copy Target URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-ink inline" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 inline" />
                    )}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-sm border border-rule bg-paper text-ink-2 hover:text-ink hover:border-ink-3 transition-colors inline-block"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5 inline" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
