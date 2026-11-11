import { useState } from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import { ScanResult } from '../types';
import { PlatformFavicon } from './PlatformFavicon';
import { StatusBadge } from './StatusBadge';
import { useI18n } from '../utils/i18n';

interface PlatformTableProps {
  results: ScanResult[];
}

export function PlatformTable({ results }: PlatformTableProps) {
  const { tr } = useI18n();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (results.length === 0) {
    return (
      <div className="card space-y-2 py-16 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-ink-3 font-mono text-ink-2">
          ?
        </div>
        <p className="text-sm font-semibold text-ink">{tr('table.emptyTitle')}</p>
        <p className="text-[13px] text-ink-3">{tr('table.emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl table-fixed text-[13px]">
        <colgroup>
          <col className="w-[150px]" />
          <col className="w-[190px]" />
          <col className="w-[150px]" />
          <col className="w-auto" />
          <col className="w-[96px]" />
          <col className="w-[96px]" />
          <col className="w-[86px]" />
          <col className="w-[92px]" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{tr('table.status')}</th>
            <th scope="col">{tr('table.platform')}</th>
            <th scope="col">{tr('table.category')}</th>
            <th scope="col">{tr('table.url')}</th>
            <th scope="col" className="!text-right">{tr('table.confidence')}</th>
            <th scope="col" className="!text-right">{tr('table.detector')}</th>
            <th scope="col" className="!text-right">{tr('table.latency')}</th>
            <th scope="col" className="!text-right">{tr('table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item) => {
            const isFound = item.status === 'found';
            const isScanning = item.status === 'scanning';

            return (
              <tr key={item.id} className={isFound ? 'text-ink' : 'text-ink-2'}>
                <td className="whitespace-nowrap">
                  <StatusBadge
                    status={item.status}
                    code={item.statusCode}
                    title={item.status === 'error' ? item.uncertainReason || tr('table.errorHint') : undefined}
                  />
                </td>

                <td className="whitespace-nowrap">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PlatformFavicon
                      url={item.url}
                      platformId={item.platformId}
                      platformName={item.platformName}
                      category={item.category}
                      size="sm"
                    />
                    <span className={`truncate font-semibold ${isFound ? 'text-ink' : 'text-ink-2'}`}>{item.platformName}</span>
                    {isScanning && <span className="sr-only">{tr('status.scanning')}</span>}
                  </div>
                </td>

                <td className="whitespace-nowrap">
                  <span className="chip chip-quiet">{item.category}</span>
                  {item.siteType && (
                    <div className="mt-1 truncate font-mono text-[10.5px] text-ink-3" title={item.siteType}>
                      {item.siteType.replace(/_/g, ' ')}
                    </div>
                  )}
                </td>

                <td className="truncate">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-mono text-[12px] text-ink underline decoration-rule underline-offset-[3px] transition-colors hover:text-signal hover:decoration-signal"
                    title={decodeURI(item.url)}
                  >
                    {decodeURI(item.url)}
                  </a>
                  {item.uncertainReason && (
                    <div className="truncate text-[12px] text-ink-3" title={item.uncertainReason}>
                      {item.uncertainReason}
                    </div>
                  )}
                </td>

                <td className="num text-ink">{item.confidenceScore ? `${item.confidenceScore}%` : '—'}</td>

                <td className="num text-ink-2">
                  {item.detectorReliability !== undefined ? `${item.detectorReliability}%` : '—'}
                  {item.evidenceChecksTotal ? (
                    <div className="text-[10.5px] text-ink-3">
                      {tr('table.checks', { passed: item.evidenceChecksPassed ?? 0, total: item.evidenceChecksTotal })}
                    </div>
                  ) : null}
                </td>

                <td className="num text-ink-2">{item.responseTimeMs !== undefined ? `${item.responseTimeMs}ms` : '—'}</td>

                <td className="whitespace-nowrap text-right">
                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.url, item.id)}
                      className="btn btn-icon !p-1.5"
                      title={tr('table.copyUrl')}
                      aria-label={`${tr('table.copyUrl')}: ${item.platformName}`}
                    >
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-icon !p-1.5"
                      title={tr('table.openTab')}
                      aria-label={`${tr('table.openTab')}: ${item.platformName}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
