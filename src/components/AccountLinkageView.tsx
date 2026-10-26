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
      <div className="rounded-[22px] border border-[#37332B] bg-[#1B1915] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#908B7D]">
              <GitFork className="h-4 w-4" />
              Username Linkage
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#F3F0E8]">
              {tr('linkage.heading')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#A19C8E]">
              {tr('linkage.desc')}
            </p>
          </div>
          <div className="rounded-xl border border-[#4A453A] px-3 py-2 text-xs text-[#B9B4A6]">
            stem <span className="font-mono text-white">{dossier.canonicalStem}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[16px] border border-[#37332B] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{tr('linkage.observed')}</div>
            <div className="mt-2 text-2xl font-semibold text-[#ECE8DD]">{found}</div>
          </div>
          <div className="rounded-[16px] border border-[#37332B] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{tr('linkage.candidates')}</div>
            <div className="mt-2 text-2xl font-semibold text-[#ECE8DD]">{dossier.permutations.length}</div>
          </div>
          <div className="rounded-[16px] border border-[#37332B] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{tr('linkage.promotion')}</div>
            <div className="mt-2 text-sm text-[#A19C8E]">{tr('linkage.promotionValue')}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dossier.permutations.map((item) => (
          <article key={item.id} className="rounded-[18px] border border-[#37332B] bg-[#221F1A] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">
                  {item.mutationType}
                </div>
                <h3 className="mt-2 truncate text-lg font-medium text-[#ECE8DD]" title={item.label}>
                  {item.label}
                </h3>
              </div>
              <div className="rounded-lg border border-[#4A453A] px-2.5 py-1 font-mono text-xs text-[#ECE8DD]">
                {item.similarityScore}%
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#908B7D]">{item.reason}</p>
            <p className="mt-3 border-l border-[#4A453A] pl-3 text-xs leading-relaxed text-[#908B7D]">
              {item.hypothesis}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-[#37332B] pt-4">
              <button
                type="button"
                onClick={() => handleCopy(item.label)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#37332B] px-3 py-2 text-xs text-[#A19C8E] hover:text-white"
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
                className="inline-flex items-center gap-2 rounded-lg border border-[#6F6A5E] bg-[#27241E] px-3 py-2 text-xs font-medium text-[#ECE8DD] hover:bg-[#27241E]"
              >
                <Search className="h-3.5 w-3.5" />
                Pivot scan
              </button>
            </div>
            {pivotSummary[item.pivotHandle || item.label] ? (
              <div className="mt-3 rounded-lg border border-[#37332B] bg-[#131210] px-3 py-2 font-mono text-[10px] text-[#908B7D]">
                {pivotSummary[item.pivotHandle || item.label].foundCount} found · {pivotSummary[item.pivotHandle || item.label].totalScanned} checked
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="rounded-[18px] border border-[#37332B] bg-[#221F1A] p-5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#908B7D]">{tr('linkage.method')}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {dossier.behavioralHypotheses.map((note, index) => (
            <p key={index} className="text-sm leading-relaxed text-[#908B7D]">{note}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
