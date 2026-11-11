import { useState } from 'react';
import { ExternalLink, Copy, Check, Clock } from 'lucide-react';
import { ScanResult } from '../types';
import { PlatformFavicon } from './PlatformFavicon';
import { StatusBadge } from './StatusBadge';
import { useI18n } from '../utils/i18n';

interface PlatformGridProps {
  results: ScanResult[];
  target: string;
}

export function PlatformGrid({ results }: PlatformGridProps) {
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {results.map((item) => {
        const isFound = item.status === 'found';
        const isUncertain = item.status === 'uncertain';
        const isScanning = item.status === 'scanning';

        return (
          <article
            key={item.id}
            id={`platform-card-${item.platformId}`}
            className={`card relative flex h-full min-h-[180px] flex-col justify-between p-4 transition-[border-color,transform] hover:-translate-y-px ${
              isFound ? 'card-accent !border-rule' : isScanning ? '!border-signal' : 'hover:!border-rule'
            } ${isUncertain ? '!border-dashed !border-ink-3' : ''}`}
          >
            <div className="relative z-10 space-y-3">
              <div className="flex min-h-[36px] items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <PlatformFavicon
                    url={item.url}
                    platformId={item.platformId}
                    platformName={item.platformName}
                    category={item.category}
                    size="md"
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-ink">{item.platformName}</h3>
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">{item.category}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge
                    status={item.status}
                    title={item.status === 'error' ? item.uncertainReason || tr('table.errorHint') : undefined}
                  />
                </div>
              </div>

              <div className="flex h-8 select-all items-center truncate rounded-lg border border-rule-2 bg-paper-2 px-2.5 font-mono text-[12px] text-ink">
                <span className="truncate">{decodeURI(item.url)}</span>
              </div>

              {isUncertain && item.uncertainReason && (
                <div className="truncate rounded-lg border border-dashed border-ink-3 p-2 text-[12px] text-ink-2" title={item.uncertainReason}>
                  {item.uncertainReason}
                </div>
              )}

              {item.metadata && (
                <div className="space-y-1 border-t border-rule-2 pt-2 text-[12.5px] text-ink-2">
                  {item.metadata.displayName && (
                    <div>
                      {tr('grid.name')}: <span className="text-ink">{item.metadata.displayName}</span>
                    </div>
                  )}
                  {item.metadata.bio && <div className="line-clamp-2 italic text-ink-3">"{item.metadata.bio}"</div>}
                </div>
              )}
            </div>

            <div className="relative z-10 mt-3 flex items-center justify-between gap-2 border-t border-rule-2 pt-2.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] text-ink-2">
                {item.responseTimeMs !== undefined && (
                  <span className="flex items-center gap-1 tabular-nums">
                    <Clock className="h-3 w-3 text-ink-3" aria-hidden="true" />
                    {item.responseTimeMs}ms
                  </span>
                )}
                {item.statusCode !== undefined && <span className="chip chip-quiet !px-1.5 tabular-nums">HTTP {item.statusCode}</span>}
                {item.wafRetried && (
                  <span
                    className={`chip !px-1.5 ${item.retryResolved ? '' : 'chip-quiet !border-dashed'}`}
                    title={item.retryResolved ? tr('grid.wafResolvedHint') : tr('grid.wafChallengeHint')}
                  >
                    {item.retryResolved ? tr('grid.wafResolved') : tr('grid.wafChallenge')}
                  </span>
                )}
                {item.confidenceScore !== undefined && item.confidenceScore > 0 && (
                  <span className="tabular-nums">{tr('grid.confidence', { value: item.confidenceScore })}</span>
                )}
                {item.evidenceChecksTotal ? (
                  <span className="tabular-nums text-ink-3">
                    {tr('table.checks', { passed: item.evidenceChecksPassed ?? 0, total: item.evidenceChecksTotal })}
                  </span>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-1">
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
            </div>
          </article>
        );
      })}
    </div>
  );
}
