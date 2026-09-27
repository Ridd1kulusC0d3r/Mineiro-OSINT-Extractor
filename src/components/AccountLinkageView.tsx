import { useMemo, useState } from 'react';
import { Check, Copy, GitFork, Search } from 'lucide-react';
import type { EmailReconData, ScanResult } from '../types';
import { generateAccountLinkageDossier } from '../data/accountLinkage';
import { useI18n } from '../utils/i18n';

interface AccountLinkageViewProps {
  target: string;
  results: ScanResult[];
  emailData: EmailReconData | null;
  onPivotScan: (newTarget: string) => void;
}

export function AccountLinkageView({
  target,
  results,
  emailData,
  onPivotScan,
}: AccountLinkageViewProps) {
  const { tr } = useI18n();
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
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
      <div className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8d949d]">
              <GitFork className="h-4 w-4" />
              Username Linkage
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#f3f4f5]">
              {tr('linkage.heading')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#9097a0]">
              {tr('linkage.desc')}
            </p>
          </div>
          <div className="rounded-xl border border-[#343a40] px-3 py-2 text-xs text-[#b5bbc2]">
            stem <span className="font-mono text-white">{dossier.canonicalStem}</span>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[16px] border border-[#282e33] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">{tr('linkage.observed')}</div>
            <div className="mt-2 text-2xl font-semibold text-[#f2f3f4]">{found}</div>
          </div>
          <div className="rounded-[16px] border border-[#282e33] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">{tr('linkage.candidates')}</div>
            <div className="mt-2 text-2xl font-semibold text-[#f2f3f4]">{dossier.permutations.length}</div>
          </div>
          <div className="rounded-[16px] border border-[#282e33] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">{tr('linkage.promotion')}</div>
            <div className="mt-2 text-sm text-[#a5abb2]">{tr('linkage.promotionValue')}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dossier.permutations.map((item) => (
          <article key={item.id} className="rounded-[18px] border border-[#292f34] bg-[#0f1214] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#747c85]">
                  {item.mutationType}
                </div>
                <h3 className="mt-2 truncate text-lg font-medium text-[#f1f2f3]" title={item.label}>
                  {item.label}
                </h3>
              </div>
              <div className="rounded-lg border border-[#3b4249] px-2.5 py-1 font-mono text-xs text-[#d7dade]">
                {item.similarityScore}%
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[#9299a2]">{item.reason}</p>
            <p className="mt-3 border-l border-[#343a40] pl-3 text-xs leading-relaxed text-[#7f8790]">
              {item.hypothesis}
            </p>

            <div className="mt-5 flex items-center justify-between border-t border-[#252a2f] pt-4">
              <button
                type="button"
                onClick={() => handleCopy(item.label)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#9da4ac] hover:text-white"
              >
                {copiedHandle === item.label ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedHandle === item.label ? tr('linkage.copied') : tr('linkage.copy')}
              </button>
              <button
                type="button"
                onClick={() => onPivotScan(item.pivotHandle || item.label)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#505861] bg-[#171b1f] px-3 py-2 text-xs font-medium text-[#eef0f2] hover:bg-[#1d2226]"
              >
                <Search className="h-3.5 w-3.5" />
                Pivot scan
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-[18px] border border-[#292f34] bg-[#0f1214] p-5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">{tr('linkage.method')}</div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {dossier.behavioralHypotheses.map((note, index) => (
            <p key={index} className="text-sm leading-relaxed text-[#9299a2]">{note}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
