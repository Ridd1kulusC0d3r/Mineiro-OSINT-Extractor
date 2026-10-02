import { Layers, ListChecks, Search, ShieldCheck, Upload, History, GitMerge, FileCheck2 } from 'lucide-react';
import type { ScanPreset } from '../types';
import { useI18n, type UiMessageKey } from '../utils/i18n';

interface HomeViewProps {
  activePreset: ScanPreset;
  onSelectPreset: (preset: ScanPreset) => void;
  onPickExample: (handle: string) => void;
  onOpenBatch: () => void;
  onOpenCases: () => void;
  casesCount: number;
}

// Public open-source organisations only: never a private individual.
const EXAMPLES = ['forgejo', 'nodejs', 'rust-lang'];

const MODES: Array<{ preset: ScanPreset; name: UiMessageKey; desc: UiMessageKey; count: string; recommended?: boolean }> = [
  { preset: 'quick', name: 'home.modeQuickName', desc: 'home.modeQuickDesc', count: '20' },
  { preset: 'standard', name: 'home.modeStandardName', desc: 'home.modeStandardDesc', count: '50', recommended: true },
  { preset: 'deep', name: 'home.modeFullName', desc: 'home.modeFullDesc', count: '985' },
];

const STEPS: Array<{ title: UiMessageKey; desc: UiMessageKey; Icon: typeof Search }> = [
  { title: 'home.stepCollectTitle', desc: 'home.stepCollectDesc', Icon: Search },
  { title: 'home.stepEvidenceTitle', desc: 'home.stepEvidenceDesc', Icon: FileCheck2 },
  { title: 'home.stepCorrelateTitle', desc: 'home.stepCorrelateDesc', Icon: GitMerge },
  { title: 'home.stepAssessTitle', desc: 'home.stepAssessDesc', Icon: ListChecks },
];

const VERDICTS: Array<{ label: string; desc: UiMessageKey; dashed?: boolean }> = [
  { label: 'FOUND', desc: 'home.verdictFound' },
  { label: 'ABSENT', desc: 'home.verdictAbsent' },
  { label: 'UNCERTAIN', desc: 'home.verdictUncertain', dashed: true },
];

/** First screen: shown until the first scan starts, instead of an empty 22-section report. */
export function HomeView({ activePreset, onSelectPreset, onPickExample, onOpenBatch, onOpenCases, casesCount }: HomeViewProps) {
  const { tr } = useI18n();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-16" data-testid="home-view">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.35fr_.65fr] lg:items-start">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b929b]">{tr('home.eyebrow')}</div>
          <h1 className="mt-5 text-[clamp(2.4rem,5.2vw,4.6rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#f7f7f8]">
            {tr('home.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#989fa8]">{tr('home.lead')}</p>

          <div className="mt-8">
            <div className="text-[11px] uppercase tracking-[0.17em] text-[#8b929b]">{tr('home.exampleLabel')}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((handle) => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => onPickExample(handle)}
                  className="rounded-full border border-[#3a4046] bg-[#0d1013] px-4 py-2 font-mono text-sm text-[#e8eaec] transition hover:border-[#6f7780] hover:bg-[#14181b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1a9]"
                >
                  @{handle}
                </button>
              ))}
            </div>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#6f7780]">{tr('home.exampleNote')}</p>
          </div>
        </div>

        {/* Verdict legend: teaches how to read results before the first scan */}
        <aside className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6" aria-label={tr('home.verdictTitle')}>
          <div className="text-[11px] uppercase tracking-[0.17em] text-[#8b929b]">{tr('home.verdictTitle')}</div>
          <ul className="mt-5 space-y-5">
            {VERDICTS.map(({ label, desc, dashed }) => (
              <li key={label} className="flex items-start gap-4">
                <span
                  className={`mt-0.5 shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-[#e8eaec] ${
                    dashed ? 'border-dashed border-[#6f7780]' : 'border-[#4a5057]'
                  }`}
                >
                  {label}
                </span>
                <span className="text-sm leading-relaxed text-[#abb0b7]">{tr(desc)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Modes */}
      <section className="mt-14" aria-labelledby="home-modes">
        <h2 id="home-modes" className="text-[11px] uppercase tracking-[0.17em] text-[#8b929b]">{tr('home.modesTitle')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MODES.map(({ preset, name, desc, count, recommended }) => {
            const selected = activePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectPreset(preset)}
                className={`group rounded-[22px] border p-6 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1a9] ${
                  selected ? 'border-[#e8eaec] bg-[#14181b]' : 'border-[#2b3035] bg-[#101316] hover:border-[#4a5057]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-semibold tracking-[-0.02em] text-[#f4f5f6]">{tr(name)}</span>
                  <span className="font-mono text-sm text-[#8b929b]">{count}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#989fa8]">{tr(desc)}</p>
                <div className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8b929b]">
                  {selected && <span className="rounded border border-[#6f7780] px-2 py-1 text-[#e8eaec]">{tr('home.selected')}</span>}
                  {recommended && !selected && <span className="rounded border border-dashed border-[#4a5057] px-2 py-1">{tr('home.recommended')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14" aria-labelledby="home-steps">
        <h2 id="home-steps" className="text-[11px] uppercase tracking-[0.17em] text-[#8b929b]">{tr('home.stepsTitle')}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, desc, Icon }, index) => (
            <li key={title} className="rounded-[22px] border border-[#2b3035] bg-[#0d1013] p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-[#c3c7cc]" aria-hidden="true" />
                <span className="font-mono text-xs text-[#6f7780]">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="mt-5 text-lg font-semibold tracking-[-0.02em] text-[#f4f5f6]">{tr(title)}</div>
              <p className="mt-2 text-sm leading-relaxed text-[#989fa8]">{tr(desc)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust strip + secondary actions */}
      <section className="mt-14 flex flex-col gap-6 border-t border-[#22272b] pt-8 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#989fa8]">
          {(['home.trust1', 'home.trust2', 'home.trust3'] as const).map((key, i) => (
            <li key={key} className="flex items-center gap-2">
              {i === 2 ? <Layers className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {tr(key)}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onOpenBatch}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2d3339] px-4 py-2.5 text-sm text-[#d6d9dc] transition hover:border-[#4a5057] hover:bg-[#14181b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1a9]"
          >
            <Upload className="h-4 w-4" aria-hidden="true" /> {tr('home.batch')}
          </button>
          <button
            type="button"
            onClick={onOpenCases}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2d3339] px-4 py-2.5 text-sm text-[#d6d9dc] transition hover:border-[#4a5057] hover:bg-[#14181b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9aa1a9]"
          >
            <History className="h-4 w-4" aria-hidden="true" /> {tr('home.cases')}
            {casesCount > 0 && <span className="rounded-md border border-[#3a4046] px-1.5 font-mono text-xs">{casesCount}</span>}
          </button>
        </div>
      </section>
    </div>
  );
}
