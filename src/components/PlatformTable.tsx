import { useState } from 'react';
import { ExternalLink, Copy, Check, AlertTriangle } from 'lucide-react';
import { ScanResult } from '../types';
import { PlatformFavicon } from './PlatformFavicon';
import { CATEGORY_BADGES } from '../utils/themeColors';

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
    <div className="rounded-md border border-[#37332B] bg-[#1B1915] overflow-hidden shadow-sm overflow-x-auto">
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
        <thead className="border-b border-[#37332B] bg-[#131210] text-[#B9B4A6] uppercase text-[11px] tracking-wider">
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
        <tbody className="divide-y divide-[#37332B]">
          {results.map((item) => {
            const isFound = item.status === 'found';
            const isUncertain = item.status === 'uncertain';
            const isScanning = item.status === 'scanning';
            const isRateLimited = item.status === 'rate_limited';
            const isNotFound = item.status === 'not_found';
            const isPending = item.status === 'pending';

            const badgeConfig = CATEGORY_BADGES[item.category] || CATEGORY_BADGES.default;

            return (
              <tr
                key={item.id}
                className={`transition-colors relative overflow-hidden ${
                  isFound
                    ? 'bg-[#1B1915] hover:bg-[#221F1A] text-[#ECE8DD]'
                    : isUncertain
                    ? 'bg-[#131210]/80 hover:bg-[#1B1915] text-[#B9B4A6]'
                    : isScanning
                    ? 'bg-[#1B1915] border-b border-[#ECE8DD]/40 text-[#ECE8DD]'
                    : 'text-[#B9B4A6] hover:bg-[#131210]/50'
                }`}
              >
                <td className="py-2.5 px-4 whitespace-nowrap">
                  {isFound && (
                    <span className="inline-block px-2 py-0.5 rounded-sm bg-[#F0885A] text-[#131210] font-bold border border-[#F0885A] text-[10px] tracking-wider uppercase">
                      HIT // 200
                    </span>
                  )}
                  {isUncertain && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-[#908B7D] border-dashed bg-[#131210] text-[#B9B4A6] text-[10px] font-medium uppercase">
                      <AlertTriangle className="w-2.5 h-2.5 text-[#B9B4A6]" />
                      UNCERTAIN
                    </span>
                  )}
                  {isNotFound && (
                    <span className="inline-block px-1.5 py-0.5 rounded-sm bg-[#131210] border border-[#37332B] text-[#908B7D] text-[10px]">
                      404 ABSENT
                    </span>
                  )}
                  {isScanning && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-[#F0885A] bg-[#131210] text-[#ECE8DD] text-[10px] font-semibold animate-pulse shadow-[0_0_10px_rgba(236,232,221,0.2)]">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F0885A] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#F0885A]"></span>
                      </span>
                      SCANNING
                    </span>
                  )}
                  {isRateLimited && (
                    <span className="px-1.5 py-0.5 rounded-sm bg-[#131210] text-[#B9B4A6] border border-[#37332B] text-[10px]">
                      RATE_LMT
                    </span>
                  )}
                  {isPending && (
                    <span className="text-[#908B7D] text-[10px] px-1.5 py-0.5">QUEUED</span>
                  )}
                </td>

                <td className="py-2.5 px-4 font-medium whitespace-nowrap text-[#ECE8DD]">
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
                      <span className="text-[9px] font-normal text-[#ECE8DD] font-mono tracking-wider animate-pulse shrink-0">
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
                      style={{ backgroundColor: isFound ? '#ECE8DD' : '#B9B4A6' }} 
                    />
                    {item.category}
                  </span>
                  {item.siteType && (
                    <div className="mt-1 text-[9px] text-[#908B7D] lowercase truncate" title={item.siteType}>
                      {item.siteType.replace(/_/g, ' ')}
                    </div>
                  )}
                </td>

                <td className="py-2.5 px-4 truncate text-[#B9B4A6]">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline hover:text-[#ECE8DD] text-[#ECE8DD] transition-colors block truncate"
                    title={decodeURI(item.url)}
                  >
                    {decodeURI(item.url)}
                  </a>
                  {item.uncertainReason && (
                    <div className="text-[10px] text-[#B9B4A6] truncate" title={item.uncertainReason}>
                      {item.uncertainReason}
                    </div>
                  )}
                </td>

                <td className="py-2.5 px-4 whitespace-nowrap text-[#ECE8DD] text-[11px] text-right tabular-nums">
                  {item.confidenceScore ? `${item.confidenceScore}%` : '—'}
                </td>

                <td className="py-2.5 px-4 whitespace-nowrap text-[#B9B4A6] text-[11px] text-right tabular-nums">
                  {item.detectorReliability !== undefined ? `${item.detectorReliability}%` : '—'}
                  {item.evidenceChecksTotal ? (
                    <div className="text-[9px] text-[#908B7D]">{item.evidenceChecksPassed ?? 0}/{item.evidenceChecksTotal} checks</div>
                  ) : null}
                </td>

                <td className="py-2.5 px-4 whitespace-nowrap text-[#B9B4A6] text-right tabular-nums">
                  {item.responseTimeMs !== undefined ? `${item.responseTimeMs}ms` : '—'}
                </td>

                <td className="py-2.5 px-4 text-right whitespace-nowrap space-x-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.url, item.id)}
                    className="p-1.5 rounded-sm border border-[#37332B] bg-[#131210] text-[#B9B4A6] hover:text-[#ECE8DD] hover:border-[#908B7D] transition-colors inline-block"
                    title="Copy Target URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-[#ECE8DD] inline" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 inline" />
                    )}
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-sm border border-[#37332B] bg-[#131210] text-[#B9B4A6] hover:text-[#ECE8DD] hover:border-[#908B7D] transition-colors inline-block"
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
