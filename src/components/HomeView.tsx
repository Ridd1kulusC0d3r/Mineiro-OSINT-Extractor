import { useEffect, useMemo, useRef, useState } from 'react';
import { FileCheck2, GitMerge, History, Layers, ListChecks, Play, Search, ShieldCheck, Upload } from 'lucide-react';
import type { MineiroCase } from '../cases/types';
import { analyzeTarget, type TargetMode } from '../core/target';
import { PLATFORMS_DATABASE } from '../data/platforms';
import type { ScanPreset } from '../types';
import { useI18n, type UiMessageKey } from '../utils/i18n';

interface HomeViewProps {
  target: string;
  setTarget: (value: string) => void;
  targetType: TargetMode;
  setTargetType: (mode: TargetMode) => void;
  activePreset: ScanPreset;
  onSelectPreset: (preset: ScanPreset) => void;
  onStartScan: () => void;
  recentCases: MineiroCase[];
  onOpenCase: (item: MineiroCase) => void;
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

interface HealthInfo {
  version?: string;
  publicMode?: boolean;
  geminiConfigured?: boolean;
}

const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-3';

/** First screen: shown until the first scan starts, instead of an empty 22-section report. */
export function HomeView({
  target, setTarget, targetType, setTargetType, activePreset, onSelectPreset, onStartScan,
  recentCases, onOpenCase, onOpenBatch, onOpenCases, casesCount,
}: HomeViewProps) {
  const { tr, language } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [health, setHealth] = useState<HealthInfo | null>(null);

  // Focus the search on desktop only: on touch devices it would pop the keyboard over the page.
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus({ preventScroll: true }); // never scroll the headline away
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/health', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setHealth(data))
      .catch(() => undefined); // status is decorative: stay silent when offline
    return () => controller.abort();
  }, []);

  const analysis = useMemo(() => analyzeTarget(target, targetType, PLATFORMS_DATABASE), [target, targetType]);
  const activeMode = MODES.find((mode) => mode.preset === activePreset);

  const applySuggestion = () => {
    if (!analysis.suggestion) return;
    if (analysis.issue === 'looks_like_email') setTargetType('email');
    setTarget(analysis.suggestion);
    inputRef.current?.focus();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!target.trim()) return;
    // A fixable input is corrected first (one more Enter runs it): never scan something we know is wrong.
    if (analysis.issue && analysis.suggestion) {
      applySuggestion();
      return;
    }
    onStartScan();
  };

  const relativeTime = (iso: string) => {
    const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
    const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
    const abs = Math.abs(minutes);
    if (abs < 60) return rtf.format(minutes, 'minute');
    if (abs < 60 * 24) return rtf.format(Math.round(minutes / 60), 'hour');
    return rtf.format(Math.round(minutes / (60 * 24)), 'day');
  };

  const issueText: Record<string, { message: string; action?: string }> = {
    looks_like_email: { message: tr('home.issueEmail'), action: tr('home.issueEmailAction') },
    profile_url: { message: tr('home.issueUrl', { handle: analysis.suggestion ?? '' }), action: tr('home.issueUrlAction', { handle: analysis.suggestion ?? '' }) },
    has_spaces: { message: tr('home.issueSpaces'), action: tr('home.issueSpacesAction', { handle: analysis.suggestion ?? '' }) },
    invalid_email: { message: tr('home.issueInvalidEmail') },
  };
  const issue = analysis.issue ? issueText[analysis.issue] : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-14" data-testid="home-view">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.4fr_.6fr] lg:items-start">
        <div>
          <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-3">{tr('home.eyebrow')}</div>
          <h1 className="mt-5 text-[clamp(2.3rem,5vw,4.4rem)] font-semibold leading-[1] tracking-[-0.05em] text-ink">{tr('home.title')}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{tr('home.lead')}</p>

          {/* Search lives where the eyes are, not only in the top bar. */}
          <form onSubmit={handleSubmit} className="mt-8 rounded-[22px] border border-rule bg-card p-3 sm:p-4" role="search">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex h-12 shrink-0 rounded-xl border border-rule bg-paper p-1" role="group" aria-label={tr('home.eyebrow')}>
                {(['username', 'email'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={targetType === mode}
                    onClick={() => setTargetType(mode)}
                    className={`rounded-lg px-4 text-sm transition ${focusRing} ${
                      targetType === mode ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {tr(mode === 'username' ? 'target.username' : 'target.email')}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-ink-3" aria-hidden="true">
                  {targetType === 'username' ? '@' : '✉'}
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(targetType === 'username' ? e.target.value.replace(/^@+/, '') : e.target.value)}
                  placeholder={tr(targetType === 'username' ? 'target.usernamePlaceholder' : 'target.emailPlaceholder')}
                  aria-label={tr(targetType === 'username' ? 'target.usernamePlaceholder' : 'target.emailPlaceholder')}
                  aria-invalid={Boolean(issue)}
                  aria-describedby="home-input-hint"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode={targetType === 'email' ? 'email' : 'text'}
                  className={`h-12 w-full rounded-xl border border-rule bg-paper pl-10 pr-4 font-mono text-base text-ink placeholder:text-ink-3 ${focusRing}`}
                />
              </div>
              <button
                type="submit"
                disabled={!target.trim()}
                className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-semibold text-paper transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
              >
                <Play className="h-4 w-4" aria-hidden="true" /> {tr('target.run')}
              </button>
            </div>

            <div id="home-input-hint" className="mt-3 px-1 text-xs leading-relaxed text-ink-3" aria-live="polite">
              {issue ? (
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
                  <span>{issue.message}</span>
                  {issue.action && (
                    <button type="button" onClick={applySuggestion} className={`rounded-md border border-rule px-2 py-0.5 font-mono text-ink hover:border-ink-3 ${focusRing}`}>
                      {issue.action}
                    </button>
                  )}
                </span>
              ) : (
                <span>
                  {activeMode && <>{tr(activeMode.name)} · {activeMode.count} {tr('target.detectorsScope')} · </>}
                  {tr('home.searchHint')}
                </span>
              )}
            </div>
          </form>

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-[0.17em] text-ink-3">{tr('home.exampleLabel')}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {EXAMPLES.map((handle) => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => {
                    setTargetType('username');
                    setTarget(handle);
                    inputRef.current?.focus();
                  }}
                  className={`rounded-full border border-rule bg-card px-4 py-2 font-mono text-sm text-ink transition hover:border-ink-3 hover:bg-paper-2 ${focusRing}`}
                >
                  @{handle}
                </button>
              ))}
            </div>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-3">{tr('home.exampleNote')}</p>
          </div>
        </div>

        {/* Verdict legend: teaches how to read results before the first scan */}
        <aside className="rounded-[22px] border border-rule bg-card p-6" aria-label={tr('home.verdictTitle')}>
          <div className="text-[11px] uppercase tracking-[0.17em] text-ink-3">{tr('home.verdictTitle')}</div>
          <ul className="mt-5 space-y-5">
            {VERDICTS.map(({ label, desc, dashed }) => (
              <li key={label} className="flex items-start gap-4">
                <span className={`mt-0.5 shrink-0 rounded-md border px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-ink ${dashed ? 'border-dashed border-ink-3' : 'border-rule'}`}>
                  {label}
                </span>
                <span className="text-sm leading-relaxed text-ink-2">{tr(desc)}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Continue where you left off */}
      {recentCases.length > 0 && (
        <section className="mt-12" aria-labelledby="home-recent">
          <h2 id="home-recent" className="text-[11px] uppercase tracking-[0.17em] text-ink-3">{tr('home.recentTitle')}</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {recentCases.map((item) => {
              const latest = [...item.collections].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCase(item)}
                    className={`w-full rounded-[18px] border border-rule bg-card p-5 text-left transition hover:border-rule hover:bg-paper-2 ${focusRing}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-mono text-base text-ink">{item.primaryTargetType === 'username' ? '@' : ''}{item.primaryTarget}</span>
                      <span className="shrink-0 text-xs text-ink-3">{relativeTime(item.updatedAt)}</span>
                    </div>
                    {latest && (
                      <div className="mt-2 text-sm text-ink-2">{tr('home.recentSummary', { found: latest.foundCount, total: latest.totalScanned })}</div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Modes */}
      <section className="mt-12" aria-labelledby="home-modes">
        <h2 id="home-modes" className="text-[11px] uppercase tracking-[0.17em] text-ink-3">{tr('home.modesTitle')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MODES.map(({ preset, name, desc, count, recommended }) => {
            const selected = activePreset === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectPreset(preset)}
                className={`group rounded-[22px] border p-6 text-left transition ${focusRing} ${
                  selected ? 'border-ink bg-paper-2' : 'border-rule bg-card hover:border-rule'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-semibold tracking-[-0.02em] text-ink">{tr(name)}</span>
                  <span className="font-mono text-sm text-ink-3">{count}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{tr(desc)}</p>
                <div className="mt-5 flex min-h-[26px] items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {selected && <span className="rounded border border-ink-3 px-2 py-1 text-ink">{tr('home.selected')}</span>}
                  {recommended && !selected && <span className="rounded border border-dashed border-rule px-2 py-1">{tr('home.recommended')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12" aria-labelledby="home-steps">
        <h2 id="home-steps" className="text-[11px] uppercase tracking-[0.17em] text-ink-3">{tr('home.stepsTitle')}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, desc, Icon }, index) => (
            <li key={title} className="rounded-[22px] border border-rule bg-card p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-ink-2" aria-hidden="true" />
                <span className="font-mono text-xs text-ink-3">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="mt-5 text-lg font-semibold tracking-[-0.02em] text-ink">{tr(title)}</div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{tr(desc)}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust strip + secondary actions */}
      <section className="mt-12 flex flex-col gap-6 border-t border-rule pt-8 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-ink-2">
          {(['home.trust1', 'home.trust2', 'home.trust3'] as const).map((key, i) => (
            <li key={key} className="flex items-center gap-2">
              {i === 2 ? <Layers className="h-4 w-4" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {tr(key)}
            </li>
          ))}
        </ul>
        <div className="flex shrink-0 flex-wrap gap-3 md:flex-nowrap">
          <button type="button" onClick={onOpenBatch} className={`inline-flex items-center gap-2 rounded-xl border border-rule px-4 py-2.5 text-sm text-ink-2 transition hover:border-rule hover:bg-paper-2 ${focusRing}`}>
            <Upload className="h-4 w-4" aria-hidden="true" /> {tr('home.batch')}
          </button>
          <button type="button" onClick={onOpenCases} className={`inline-flex items-center gap-2 rounded-xl border border-rule px-4 py-2.5 text-sm text-ink-2 transition hover:border-rule hover:bg-paper-2 ${focusRing}`}>
            <History className="h-4 w-4" aria-hidden="true" /> {tr('home.cases')}
            {casesCount > 0 && <span className="rounded-md border border-rule px-1.5 font-mono text-xs">{casesCount}</span>}
          </button>
        </div>
      </section>

      {/* System status: decorative, silent when the API is unreachable */}
      {health?.version && (
        <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-ink-3" data-testid="home-status">
          <span>{tr(health.publicMode ? 'home.statusPublic' : 'home.statusLocal', { version: health.version })}</span>
          <span>{tr(health.geminiConfigured ? 'home.aiOn' : 'home.aiOff')}</span>
        </p>
      )}
    </div>
  );
}
