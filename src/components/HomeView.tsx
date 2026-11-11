import { useEffect, useMemo, useRef, useState } from 'react';
import { FileCheck2, GitMerge, History, Layers, ListChecks, Play, Search, ShieldCheck, Upload } from 'lucide-react';
import type { MineiroCase } from '../cases/types';
import { analyzeTarget, type TargetMode } from '../core/target';
import { PLATFORMS_DATABASE, countPlatformsForPreset } from '../data/platforms';
import { StatusBadge } from './StatusBadge';
import type { ScanPreset } from '../types';
import { useI18n, type UiMessageKey } from '../utils/i18n';
import { api } from '../api/client';

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

// A contagem de cada modo vem do escopo real (countPlatformsForPreset), não de um rótulo fixo (defeito 18).
const MODES: Array<{ preset: ScanPreset; name: UiMessageKey; desc: UiMessageKey; recommended?: boolean }> = [
  { preset: 'quick', name: 'home.modeQuickName', desc: 'home.modeQuickDesc' },
  { preset: 'standard', name: 'home.modeStandardName', desc: 'home.modeStandardDesc', recommended: true },
  { preset: 'deep', name: 'home.modeFullName', desc: 'home.modeFullDesc' },
];

const STEPS: Array<{ title: UiMessageKey; desc: UiMessageKey; Icon: typeof Search }> = [
  { title: 'home.stepCollectTitle', desc: 'home.stepCollectDesc', Icon: Search },
  { title: 'home.stepEvidenceTitle', desc: 'home.stepEvidenceDesc', Icon: FileCheck2 },
  { title: 'home.stepCorrelateTitle', desc: 'home.stepCorrelateDesc', Icon: GitMerge },
  { title: 'home.stepAssessTitle', desc: 'home.stepAssessDesc', Icon: ListChecks },
];

const VERDICTS: Array<{ status: 'found' | 'not_found' | 'uncertain'; desc: UiMessageKey }> = [
  { status: 'found', desc: 'home.verdictFound' },
  { status: 'not_found', desc: 'home.verdictAbsent' },
  { status: 'uncertain', desc: 'home.verdictUncertain' },
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
    api.health({ signal: controller.signal })
      .then((data) => setHealth(data))
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
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10 md:py-12" data-testid="home-view">
      {/* Hero */}
      <section className="grid gap-10 lg:grid-cols-[1.4fr_.6fr] lg:items-start">
        <div>
          <span className="eyebrow">{tr('home.eyebrow')}</span>
          <h1 className="mt-4 text-[clamp(2.3rem,5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-ink">{tr('home.title')}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">{tr('home.lead')}</p>

          {/* Search lives where the eyes are, not only in the top bar. */}
          <form onSubmit={handleSubmit} className="card mt-8 p-3 sm:p-4 !shadow-[var(--shadow-2)]" role="search">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="tabs tabs-seg h-12 shrink-0 !shadow-none" role="group" aria-label={tr('target.mode')}>
                {(['username', 'email'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={targetType === mode}
                    onClick={() => setTargetType(mode)}
                    className="tab"
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
                  className="field h-12 w-full pl-10 pr-4 font-mono !text-base placeholder:font-sans"
                />
              </div>
              <button
                type="submit"
                disabled={!target.trim()}
                className="btn-primary h-12 !px-6 !text-sm"
              >
                <Play className="h-4 w-4" aria-hidden="true" /> {tr('target.run')}
              </button>
            </div>

            <div id="home-input-hint" className="mt-3 px-1 text-xs leading-relaxed text-ink-3" aria-live="polite">
              {issue ? (
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-2">
                  <span>{issue.message}</span>
                  {issue.action && (
                    <button type="button" onClick={applySuggestion} className="chip hover:!border-signal hover:!text-signal">
                      {issue.action}
                    </button>
                  )}
                </span>
              ) : (
                <span>
                  {activeMode && <>{tr(activeMode.name)} · {countPlatformsForPreset(activeMode.preset, targetType)} {tr('target.detectorsScope')} · </>}
                  {tr('home.searchHint')}
                </span>
              )}
            </div>
          </form>

          <div className="mt-6">
            <div className="label-mono">{tr('home.exampleLabel')}</div>
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
                  className="btn font-mono !text-ink"
                >
                  @{handle}
                </button>
              ))}
            </div>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-3">{tr('home.exampleNote')}</p>
          </div>
        </div>

        {/* Verdict legend: teaches how to read results before the first scan */}
        <aside className="card card-accent p-6" aria-label={tr('home.verdictTitle')}>
          <div className="label-mono">{tr('home.verdictTitle')}</div>
          <ul className="mt-5 space-y-5">
            {VERDICTS.map(({ status, desc }) => (
              <li key={status} className="grid grid-cols-[110px_1fr] items-start gap-3">
                <span className="mt-0.5">
                  <StatusBadge status={status} />
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
          <h2 id="home-recent" className="label-mono">{tr('home.recentTitle')}</h2>
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {recentCases.map((item) => {
              const latest = [...item.collections].sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onOpenCase(item)}
                    className="card w-full p-5 text-left transition-[border-color,transform] hover:-translate-y-px hover:!border-rule"
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
        <h2 id="home-modes" className="label-mono">{tr('home.modesTitle')}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {MODES.map(({ preset, name, desc, recommended }) => {
            const selected = activePreset === preset;
            const count = countPlatformsForPreset(preset, targetType);
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelectPreset(preset)}
                className={`card group p-6 text-left transition-[border-color,transform] hover:-translate-y-px ${
                  selected ? 'card-accent !border-signal' : 'hover:!border-rule'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-bold tracking-[-0.02em] text-ink">{tr(name)}</span>
                  <span className="chip">{tr('modular.detectors', { count })}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{tr(desc, { count })}</p>
                <div className="mt-5 flex min-h-[26px] items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {selected && <span className="chip chip-signal">{tr('home.selected')}</span>}
                  {recommended && !selected && <span className="chip chip-quiet !border-dashed">{tr('home.recommended')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12" aria-labelledby="home-steps">
        <h2 id="home-steps" className="label-mono">{tr('home.stepsTitle')}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, desc, Icon }, index) => (
            <li key={title} className="card p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-signal" aria-hidden="true" />
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
          <button type="button" onClick={onOpenBatch} className="btn">
            <Upload className="h-4 w-4" aria-hidden="true" /> {tr('home.batch')}
          </button>
          <button type="button" onClick={onOpenCases} className="btn">
            <History className="h-4 w-4" aria-hidden="true" /> {tr('home.cases')}
            {casesCount > 0 && <span className="chip !px-1.5">{casesCount}</span>}
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
