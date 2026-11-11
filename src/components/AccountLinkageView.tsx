import { useMemo, useState } from 'react';
import { Check, Copy, GitFork, Search } from 'lucide-react';
import type { EmailReconData, ScanResult } from '../types';
import { generateAccountLinkageDossier } from '../data/accountLinkage';
import type { GraphPivotInvestigation } from '../graph/types';
import { useI18n } from '../utils/i18n';

interface AccountLinkageViewProps {
  target: string;
  results: ScanResult[];
  emailData: EmailReconData | null;
  onPivotScan: (newTarget: string) => Promise<GraphPivotInvestigation>;
}

export function AccountLinkageView({
  target,
  results,
  emailData,
  onPivotScan,
}: AccountLinkageViewProps) {
  const { tr } = useI18n();
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [scanningHandle, setScanningHandle] = useState<string | null>(null);
  const [pivotSummary, setPivotSummary] = useState<Record<string, GraphPivotInvestigation>>({});
  const dossier = useMemo(
    () => generateAccountLinkageDossier(target, results, emailData),
    [target, results, emailData]
  );

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedHandle(text);
    setTimeout(() => setCopiedHandle(null), 1500);
  };

  const found = results.filter((r) => r.status === 'found').length;

  return (
    <section className="space-y-6">
      <div className="rounded-[22px] border border-rule bg-paper-2 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
              <GitFork className="h-4 w-4" />
              Username Linkage
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-ink">
              {tr('linkage.heading')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-3">
              {tr('linkage.desc')}
            </p>
          </div>
          <div className="rounded-xl border border-rule px-3 py-2 text-xs text-ink-2">
            stem <span className="font-mono text-ink">{dossier.canonicalStem}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[16px] border border-rule p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-3">{tr('linkage.observed')}</div>
            <div className="mt-2 text-2xl font-semibold text-ink">{found}</div>
          </div>
          <div className="rounded-[16px] border border-rule p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-3">{tr('linkage.candidates')}</div>
            <div className="mt-2 text-2xl font-semibold text-ink">{dossier.permutations.length}</div>
          </div>
          <div className="rounded-[16px] border border-rule p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-3">{tr('linkage.promotion')}</div>
            <div className="mt-2 text-sm text-ink-3">{tr('linkage.promotionValue')}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dossier.permutations.map((item) => (
          <article key={item.id} className="rounded-[18px] border border-rule bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {item.mutationType}
                </div>
                <h3 className="mt-2 truncate text-lg font-medium text-ink" title={item.label}>
                  {item.label}
                </h3>
              </div>
              <div className="rounded-lg border border-rule px-2.5 py-1 font-mono text-xs text-ink">
                {item.similarityScore}%
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-3">{item.reason}</p>
            <p className="mt-3 border-l border-rule pl-3 text-xs leading-relaxed text-ink-3">
              {item.hypothesis}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
              <button
                type="button"
                onClick={() => handleCopy(item.label)}
                className="inline-flex items-center gap-2 rounded-lg border border-rule px-3 py-2 text-xs text-ink-3 hover:text-ink"
              >
                {copiedHandle === item.label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHandle === item.label ? tr('linkage.copied') : tr('linkage.copy')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const handle = item.pivotHandle || item.label;
                  setScanningHandle(handle);
                  try {
                    const result = await onPivotScan(handle);
                    setPivotSummary((current) => ({ ...current, [handle]: result }));
                  } finally {
                    setScanningHandle(null);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-3 bg-rule-2 px-3 py-2 text-xs font-medium text-ink hover:bg-rule-2"
              >
                <Search className="h-3.5 w-3.5" />
                Pivot scan
              </button>
            </div>
            {pivotSummary[item.pivotHandle || item.label] ? (
              <div className="mt-3 rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-[10px] text-ink-3">
                {pivotSummary[item.pivotHandle || item.label].foundCount} found · {pivotSummary[item.pivotHandle || item.label].totalScanned} checked
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="rounded-[18px] border border-rule bg-card p-5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-ink-3">{tr('linkage.method')}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {dossier.behavioralHypotheses.map((note, index) => (
            <p key={index} className="text-sm leading-relaxed text-ink-3">{note}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
