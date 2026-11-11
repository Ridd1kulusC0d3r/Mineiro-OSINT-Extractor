import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  Download,
  FileKey2,
  FileSearch,
  GitBranch,
  TriangleAlert,
} from 'lucide-react';
import type { ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';
import {
  INTELLIGENCE_REQUIREMENT_LABELS,
  type IntelligenceRequirement,
} from '../intelligence/types';
import { computeSha256 } from '../utils/scanStorage';
import { AiAnalystPanel } from './AiAnalystPanel';
import { useI18n } from '../utils/i18n';
import { StatusBadge } from './StatusBadge';
import { requirementLabel } from '../intelligence/localization';

interface IntelligenceReportViewProps {
  target: string;
  results: ScanResult[];
  onOpenExport: () => void;
  onViewTable: () => void;
  aiApiKey?: string;
  aiModel?: string;
  requirement?: IntelligenceRequirement;
  onRequirementChange?: (requirement: IntelligenceRequirement) => void;
}

const requirementKeys = Object.keys(INTELLIGENCE_REQUIREMENT_LABELS) as IntelligenceRequirement[];

function Band({ value }: { value: string }) {
  return (
    <span className="chip !text-ink">
      {value}
    </span>
  );
}

function Section({
  id,
  index,
  title,
  description,
  children,
}: {
  id: string;
  index: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-40 border-b border-rule-2 py-12">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <span className="eyebrow">{index}</span>
          <h2 className="mt-3 text-2xl md:text-[28px] font-bold tracking-[-0.02em] text-ink">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-[14px] leading-relaxed text-ink-3 lg:justify-self-end">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="card card-accent flex min-h-[132px] flex-col justify-between px-5 py-5">
      <div className="label-mono">{label}</div>
      <div>
        <div className="stat-num">{value}</div>
        <div className="mt-2 text-[13px] text-ink-3">{detail}</div>
      </div>
    </div>
  );
}

export function IntelligenceReportView({
  target,
  results,
  onOpenExport,
  onViewTable,
  aiApiKey,
  aiModel,
  requirement = 'account_correlation',
  onRequirementChange,
}: IntelligenceReportViewProps) {
  const { language, tr } = useI18n();
  const requirements = requirementKeys.map((key) => [key, requirementLabel(language, key)] as const);
  const report = useMemo(
    () => buildIntelligenceAssessment(results, target || 'target', requirement, language),
    [results, target, requirement, language]
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [snapshotHash, setSnapshotHash] = useState<string>('calculating…');

  const selectedEvidence = report.evidence.find((e) => e.id === selectedEvidenceId) || null;

  useEffect(() => {
    let cancelled = false;
    const canonical = JSON.stringify({
      target,
      requirement,
      generatedFrom: results
        .map((r) => ({
          platformId: r.platformId,
          status: r.status,
          statusCode: r.statusCode,
          url: r.url,
          checkedAt: r.checkedAt,
          confidenceScore: r.confidenceScore,
          detectorReliability: r.detectorReliability,
          evidenceSignals: r.evidenceSignals || [],
        }))
        .sort((a, b) => a.platformId.localeCompare(b.platformId)),
    });
    computeSha256(canonical)
      .then((hash) => { if (!cancelled) setSnapshotHash(hash); })
      .catch(() => { if (!cancelled) setSnapshotHash('unavailable'); });
    return () => { cancelled = true; };
  }, [target, requirement, results]);

  const navigation = [
    ['intel-requirement', tr('report.requirement')],
    ['intel-assessment', tr('report.assessment')],
    ['intel-evidence', tr('report.evidence')],
    ['intel-correlation', tr('report.correlation')],
    ['intel-gaps', tr('report.gaps')],
    ['intel-integrity', tr('report.integrity')],
  ];

  return (
    <article className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 pb-24">
      <div className="sticky top-[76px] z-30">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3">
          <nav className="tabs mast-glass min-w-0 !shadow-[var(--shadow-2)]" aria-label={tr('report.sections')}>
            {navigation.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="tab">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onViewTable} className="btn">
              {tr('report.auditTable')}
            </button>
            <button type="button" onClick={onOpenExport} className="btn-primary">
              <Download className="h-3.5 w-3.5" />
              {tr('header.export')}
            </button>
          </div>
        </div>
      </div>

      <header className="pt-12 md:pt-16 pb-12 border-b border-rule-2">
        <span className="eyebrow">{tr('report.eyebrow')}</span>
        <h1 className="mt-4 max-w-5xl text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02] font-extrabold tracking-[-0.035em] text-ink">
          {tr('report.heroTitle')}
        </h1>
        <p className="mt-5 max-w-3xl text-[18px] leading-relaxed text-ink-2">
          {tr('report.heroLead')}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3 font-mono text-[12px] text-ink-3">
          <Band value={`${tr('report.assessment')} ${report.assessmentConfidence}`} />
          <Band value={report.intelligenceRequirementLabel.toUpperCase()} />
          <span>@{target || 'target'}</span>
          <span className="text-ink-3">·</span>
          <span>{tr('report.generatedLocal')}</span>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label={tr('report.highValue')} value={report.highConfidenceFindings.length} detail={tr('report.highValueDetail')} />
          <Metric label={tr('report.coverage')} value={`${report.collection.effectiveCoveragePercent}%`} detail={`${report.collection.completed}/${report.collection.requested} ${tr('report.completed')}`} />
          <Metric label={tr('report.unresolved')} value={report.unresolvedFindings.length + report.collection.errors} detail={tr('report.unresolvedDetail')} />
          <Metric label={tr('report.analyticalGaps')} value={report.gaps.length} detail={tr('report.gapsDetail')} />
        </div>
      </header>

      <Section id="intel-requirement" index="01 · INTELLIGENCE REQUIREMENT" title={tr('report.requirementTitle')} description={tr('report.requirementDesc')}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {requirements.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onRequirementChange?.(key)}
              aria-pressed={requirement === key}
              className={`card p-5 text-left transition-[border-color,transform] hover:-translate-y-px ${requirement === key ? 'card-accent !border-signal' : 'hover:!border-rule'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{label}</span>
                {requirement === key && <CheckCircle2 className="h-4 w-4 text-signal" />}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section id="intel-assessment" index="02 · EXECUTIVE ASSESSMENT" title={tr('report.executive')} description={tr('report.executiveDesc')}>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="card p-6">
            <div className="card-title">{tr('report.knownAssessedUnknown')}</div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                [tr('report.known'), report.knownAssessedUnknown.known],
                [tr('report.assessed'), report.knownAssessedUnknown.assessed],
                [tr('report.unknown'), report.knownAssessedUnknown.unknown],
              ].map(([label, items]) => (
                <div key={label as string} className="min-w-0">
                  <div className="label-mono">{label as string}</div>
                  <div className="mt-3 space-y-3">
                    {(items as string[]).slice(0, 6).map((item, i) => (
                      <p key={i} className="text-sm leading-relaxed text-ink-2 [overflow-wrap:anywhere]">{item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <div className="card-title">{tr('report.collectionHealth')}</div>
            <div className="mt-6 space-y-4">
              {[
                [tr('status.found'), report.collection.found],
                [tr('status.absent'), report.collection.absent],
                [tr('status.uncertain'), report.collection.uncertain],
                [tr('status.rateLimited'), report.collection.rateLimited],
                [tr('report.errors'), report.collection.errors],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-rule-2 pb-3 text-sm">
                  <span className="text-ink-3">{label as string}</span>
                  <span className="tabular-nums text-[15px] font-semibold text-ink">{value as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="intel-judgments" index="03 · KEY INTELLIGENCE JUDGMENTS" title={tr('report.keyJudgments')} description={tr('report.keyJudgmentsDesc')}>
        <div className="space-y-4">
          {report.judgments.map((j) => (
            <div key={j.id} className="grid gap-4 card p-6 md:grid-cols-[120px_1fr]">
              <div><Band value={j.confidence} /><div className="mt-2 font-mono text-[10px] text-ink-3">{j.id}</div></div>
              <div><p className="text-lg text-ink">{j.text}</p><p className="mt-2 text-sm text-ink-3">{j.basis}</p></div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="intel-coverage" index="04 · COLLECTION COVERAGE" title={tr('report.collectionCoverage')} description={tr('report.collectionCoverageDesc')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label={tr('report.requested')} value={report.collection.requested} detail={tr('report.requestedDetail')} />
          <Metric label={tr('report.completedLabel')} value={report.collection.completed} detail={tr('report.completedDetail')} />
          <Metric label={tr('report.conclusive')} value={report.collection.found + report.collection.absent} detail={tr('report.conclusiveDetail')} />
          <Metric label={tr('report.blocked')} value={report.collection.blockedOrInconclusive} detail={tr('report.blockedDetail')} />
        </div>
      </Section>

      <Section id="intel-high" index="05 · HIGH-CONFIDENCE FINDINGS" title={tr('report.highConfidence')} description={tr('report.highConfidenceDesc')}>
        <div className="grid gap-4 md:grid-cols-2">
          {report.highConfidenceFindings.slice(0, 10).map((e) => (
            <button key={e.id} type="button" onClick={() => setSelectedEvidenceId(e.id)} className="card p-5 text-left transition-[border-color,transform] hover:-translate-y-px hover:!border-rule">
              <div className="flex items-center justify-between gap-3"><span className="font-medium text-ink">{e.platformName}</span><Band value={`IPS ${e.intelligencePriorityScore}`} /></div>
              <div className="mt-3 font-mono text-[11.5px] text-ink-3">{tr('report.findingScores', { source: e.sourceQuality, detector: e.detectorConfidence, observation: e.observationConfidence, correlation: e.correlationConfidence })}</div>
              <p className="mt-3 text-sm leading-relaxed text-ink-3">{e.whyItMatters}</p>
            </button>
          ))}
          {!report.highConfidenceFindings.length && <p className="text-sm text-ink-3">{tr('report.noHigh')}</p>}
        </div>
      </Section>

      <Section id="intel-evidence" index="06 · EVIDENCE MATRIX" title={tr('report.evidenceMatrix')} description={tr('report.evidenceMatrixDesc')}>
        <div className="tbl-wrap">
          <div className="hidden md:grid grid-cols-[1.25fr_repeat(5,.62fr)] gap-3 border-b border-rule px-5 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            <span>{tr('report.colFinding')}</span><span>{tr('table.detector')}</span><span>{tr('report.colObservation')}</span><span>{tr('report.correlation')}</span><span>{tr('report.colSource')}</span><span>IPS</span>
          </div>
          {report.evidence.slice(0, 30).map((e) => (
            <button key={e.id} type="button" onClick={() => setSelectedEvidenceId(e.id)} className="grid w-full gap-3 border-b border-rule-2 px-5 py-3.5 text-left last:border-0 md:grid-cols-[1.25fr_repeat(5,.62fr)] md:items-center hover:bg-paper-2">
              <div><span className="text-sm font-medium text-ink">{e.platformName}</span><div className="mt-1 font-mono text-[11px] text-ink-3">{e.id} · {e.category} · {e.status} · {e.provenance}</div></div>
              <span className="font-mono text-[13px] tabular-nums text-ink">{e.detectorConfidence}</span>
              <span className="font-mono text-[13px] tabular-nums text-ink">{e.observationConfidence}</span>
              <span className="font-mono text-[13px] tabular-nums text-ink">{e.correlationConfidence}</span>
              <span><Band value={e.sourceQuality} /></span>
              <span className="font-mono text-[13px] tabular-nums text-ink">{e.intelligencePriorityScore}</span>
            </button>
          ))}
        </div>
        {selectedEvidence && (
          <div className="mt-5 card p-6">
            <div className="flex items-start justify-between gap-4">
              <div><span className="eyebrow">{tr('report.evidenceDetail')} · {selectedEvidence.id}</span><h3 className="mt-2 text-xl text-ink">{selectedEvidence.platformName}</h3></div>
              <button type="button" onClick={() => setSelectedEvidenceId(null)} className="btn !px-3 !py-1.5 !text-xs">{tr('report.close')}</button>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div><div className="label-mono">Source URL</div><a href={selectedEvidence.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-ink hover:underline">{selectedEvidence.url}</a></div>
              <div><div className="label-mono">Observed</div><div className="mt-1 text-sm text-ink">{selectedEvidence.observedAt || 'scan timestamp unavailable'}</div></div>
              <div><div className="label-mono">HTTP evidence</div><div className="mt-1 text-sm text-ink">status {selectedEvidence.statusCode ?? '—'} · latency {selectedEvidence.responseTimeMs ?? '—'}ms</div></div>
              <div><div className="label-mono">Detector / observation / correlation</div><div className="mt-1 text-sm text-ink">{selectedEvidence.detectorConfidence} / {selectedEvidence.observationConfidence} / {selectedEvidence.correlationConfidence}</div></div>
              <div><div className="label-mono">Evidence signals</div><div className="mt-1 flex flex-wrap gap-1.5">{selectedEvidence.evidenceSignals.length ? selectedEvidence.evidenceSignals.map((signal) => <span key={signal} className="chip chip-quiet !normal-case">{signal}</span>) : <span className="text-sm text-ink-3">none recorded</span>}</div></div>
              <div><div className="label-mono">Captured public metadata</div><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-paper p-3 text-[10px] text-ink-3">{selectedEvidence.capturedMetadata ? JSON.stringify(selectedEvidence.capturedMetadata, null, 2) : 'none recorded'}</pre></div>
              <div><div className="label-mono">Why it matters</div><div className="mt-1 text-sm text-ink-3">{selectedEvidence.whyItMatters}</div></div>
              <div><div className="label-mono">Recommended pivot</div><div className="mt-1 text-sm text-ink-3">{selectedEvidence.recommendedPivot}</div></div>
            </div>
          </div>
        )}
      </Section>

      <Section id="intel-clusters" index="07 · DIGITAL FOOTPRINT CLUSTERS" title={tr('report.clusters')} description={tr('report.clustersDesc')}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.clusters.map((c) => (
            <div key={c.category} className="card p-5">
              <div className="flex items-center justify-between"><span className="font-medium capitalize text-ink">{c.category}</span><Band value={String(c.weightedScore)} /></div>
              <div className="mt-4 font-mono text-[12.5px] text-ink-3">{tr('report.clusterCount', { findings: c.findings, strong: c.strongFindings })}</div>
              {c.overlaps.length > 0 && <div className="mt-4 border-t border-rule pt-4"><div className="label-mono">{tr('report.overlap')}</div>{c.overlaps.map((o) => <div key={o.withCategory} className="mt-2 text-xs text-ink-3">{c.category} ↔ {o.withCategory}: {o.sharedSignals.join(', ')}</div>)}</div>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="intel-correlation" index="08 · CORRELATION GRAPH" title={tr('report.correlationGraph')} description={tr('report.correlationGraphDesc')}>
        <div className="card p-6">
          <div className="flex items-center gap-2 font-mono text-[12.5px] text-ink"><GitBranch className="h-4 w-4" /> {tr('report.graphCount', { nodes: report.graph.nodes.length, edges: report.graph.edges.length })}</div>
          <div className="mt-5 grid gap-3">
            {report.graph.edges.slice(0, 24).map((edge) => {
              const source = report.graph.nodes.find((n) => n.id === edge.source)?.label || edge.source;
              const dest = report.graph.nodes.find((n) => n.id === edge.target)?.label || edge.target;
              return <div key={edge.id} className="grid gap-2 card !rounded-[var(--radius-sm)] px-4 py-3 text-sm md:grid-cols-[1fr_auto_1fr]"><span className="truncate text-ink">{source}</span><span className="font-mono text-[10px] text-ink-3">{edge.relationship} · {edge.confidence}</span><span className="truncate md:text-right text-ink">{dest}</span></div>;
            })}
          </div>
        </div>
      </Section>

      <Section id="intel-hypotheses" index="09 · IDENTITY HYPOTHESES" title={tr('report.hypotheses')} description={tr('report.hypothesesDesc')}>
        <div className="grid gap-4 lg:grid-cols-3">
          {report.hypotheses.map((h) => <div key={h.id} className={`card p-5 ${h.alternative ? '!border-dashed !border-ink-3' : ''}`}><div className="flex items-center justify-between"><span className="font-mono text-xs text-ink-3">{h.id}{h.alternative ? ` · ${tr('report.alternative')}` : ''}</span><Band value={h.confidence} /></div><p className="mt-4 text-lg text-ink">{h.statement}</p><p className="mt-3 text-sm text-ink-3">{h.caveat}</p></div>)}
        </div>
      </Section>

      <Section id="intel-support" index="10 · SUPPORTING EVIDENCE" title={tr('report.supporting')} description={tr('report.supportingDesc')}>
        <div className="space-y-4">
          {report.analyticLedger.map((entry) => <div key={entry.id} className="card p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs text-ink-3">{entry.id}</span><Band value={entry.confidence} /></div><p className="mt-3 text-base text-ink">{entry.claim}</p><div className="mt-4 flex flex-wrap gap-2">{entry.supportingEvidenceIds.map((id) => <button key={id} type="button" onClick={() => { setSelectedEvidenceId(id); document.getElementById('intel-evidence')?.scrollIntoView({ behavior: 'smooth' }); }} className="chip hover:!border-signal hover:!text-signal">{id}</button>)}</div></div>)}
        </div>
      </Section>

      <Section id="intel-contradictions" index="11 · CONTRADICTORY EVIDENCE" title={tr('report.contradictions')} description={tr('report.contradictionsDesc')}>
        <div className="card p-6">
          {report.contradictoryEvidence.length ? report.contradictoryEvidence.map((x, i) => <div key={i} className="flex gap-3 border-b border-rule py-3 last:border-0"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" /><p className="text-sm text-ink-2">{x}</p></div>) : <p className="text-sm text-ink-3">{tr('report.noContradiction')}</p>}
        </div>
      </Section>

      <Section id="intel-unresolved" index="12 · UNCERTAIN / UNRESOLVED FINDINGS" title={tr('report.unresolvedTitle')} description={tr('report.unresolvedDesc')}>
        <div className="grid gap-3 md:grid-cols-2">
          {report.unresolvedFindings.map((e) => <div key={e.id} className="card p-4"><div className="flex items-center justify-between"><span className="text-sm text-ink">{e.platformName}</span><StatusBadge status={e.status as ScanResult['status']} /></div><div className="mt-2 text-xs text-ink-3">{e.whyItMatters}</div></div>)}
          {!report.unresolvedFindings.length && <p className="text-sm text-ink-3">{tr('report.noUnresolved')}</p>}
        </div>
      </Section>

      <Section id="intel-gaps" index="13 · INTELLIGENCE GAPS" title={tr('report.gapsTitle')} description={tr('report.gapsDesc')}>
        <div className="grid gap-4 md:grid-cols-2">
          {report.gaps.map((g) => <div key={g.id} className="card p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs text-ink-3">{g.id}</span><Band value={g.severity} /></div><p className="mt-4 text-lg text-ink">{g.question}</p><p className="mt-2 text-sm text-ink-3">{g.reason}</p></div>)}
        </div>
      </Section>

      <Section id="intel-timeline" index="14 · TIMELINE" title={tr('report.timeline')} description={tr('report.timelineDesc')}>
        <div className="space-y-3">
          {report.timeline.slice(-24).map((event) => <div key={event.id} className="grid gap-3 card !rounded-[var(--radius-sm)] px-4 py-3 md:grid-cols-[180px_150px_1fr]"><span className="font-mono text-[11px] text-ink-3">{event.observedAt}</span><span className="font-mono text-[10px] text-ink-3">{event.timestampKind}</span><span className="text-sm text-ink">{event.platformName} · {event.label}</span></div>)}
        </div>
      </Section>

      <Section id="intel-pivots" index="15 · HIGH-VALUE PIVOTS" title={tr('report.pivots')} description={tr('report.pivotsDesc')}>
        <div className="space-y-4">
          {report.pivots.map((p) => <div key={p.id} className="group card p-5 hover:border-rule"><div className="grid gap-4 md:grid-cols-[100px_1fr_auto] md:items-center"><Band value={`${p.priority} · ${p.priorityScore}`} /><div><div className="text-xs text-ink-3">{p.signal}</div><div className="mt-2 text-base text-ink">{p.action}</div><div className="mt-2 text-sm text-ink-3">{p.reason}</div></div><ArrowUpRight className="h-4 w-4 text-ink-3 group-hover:text-ink" /></div></div>)}
        </div>
      </Section>

      <Section id="intel-plan" index="16 · NEXT COLLECTION PLAN" title={tr('report.plan')} description={tr('report.planDesc')}>
        <ol className="space-y-3">
          {report.collectionPlan.map((item, i) => <li key={i} className="card p-4 text-sm text-ink-2"><span className="mr-3 font-mono text-ink-3">{String(i + 1).padStart(2, '0')}</span>{item}</li>)}
        </ol>
        <div className="mt-5 card card-accent p-5"><div className="card-title">{tr('report.stopCondition')}</div><p className="mt-3 text-sm text-ink-3">{report.stopCondition}</p></div>
      </Section>

      <Section id="intel-reliability" index="17 · SOURCE & DETECTOR RELIABILITY" title={tr('report.reliability')} description={tr('report.reliabilityDesc')}>
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th scope="col">{tr('report.colCluster')}</th><th scope="col" className="!text-right">{tr('report.high')}</th><th scope="col" className="!text-right">{tr('report.medium')}</th><th scope="col" className="!text-right">{tr('report.low')}</th></tr></thead><tbody>{report.reliabilityHeatmap.map((x) => <tr key={x.category}><td className="capitalize text-ink">{x.category}</td><td className="num">{x.high}</td><td className="num">{x.medium}</td><td className="num">{x.low}</td></tr>)}</tbody></table></div>
          <div className="card p-5 space-y-3">{report.sourceQualityNotes.map((x, i) => <p key={i} className="text-sm leading-relaxed text-ink-3">{x}</p>)}</div>
        </div>
      </Section>

      <Section id="intel-method" index="18 · METHODOLOGY" title={tr('report.methodology')} description={tr('report.methodologyDesc')}>
        <div className="grid gap-4 md:grid-cols-4">
          {[['COLLECTION',tr('report.methodCollection')],['EVIDENCE',tr('report.methodEvidence')],['CORRELATION',tr('report.methodCorrelation')],['ASSESSMENT',tr('report.methodAssessment')]].map(([a,b]) => <div key={a} className="card p-5"><div className="chip">{a}</div><p className="mt-3 text-sm text-ink-3">{b}</p></div>)}
        </div>
      </Section>

      <Section id="intel-provenance" index="19 · PROVENANCE" title={tr('report.provenance')} description={tr('report.provenanceDesc')}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-5"><div className="card-title">{tr('report.provenanceGraph')}</div><div className="mt-4 font-mono text-[12px] text-ink-3">{tr('report.provenanceCount', { nodes: report.provenanceGraph.nodes.length, edges: report.provenanceGraph.edges.length })}</div><div className="mt-4 space-y-2">{report.provenanceGraph.edges.slice(0, 16).map((e, i) => <div key={i} className="font-mono text-[10px] text-ink-3">{e.source} → {e.relation} → {e.target}</div>)}</div></div>
          <div className="grid gap-3">{['PRIMARY','DERIVED','EXTERNAL','AI_SYNTHESIZED'].map((x) => <div key={x} className="card p-4"><div className="chip">{x}</div><div className="mt-2 text-[13px] text-ink-3">{x === 'PRIMARY' ? tr('report.provPrimary') : x === 'DERIVED' ? tr('report.provDerived') : x === 'EXTERNAL' ? tr('report.provExternal') : tr('report.provAi')}</div></div>)}</div>
        </div>
      </Section>

      <Section id="intel-appendix" index="20 · TECHNICAL APPENDIX" title={tr('report.appendix')} description={tr('report.appendixDesc')}>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label={tr('report.appDetectors')} value={report.technicalAppendix.detectorCount} detail={tr('report.appDetectorsDetail')} />
          <Metric label={tr('report.appChecks')} value={report.technicalAppendix.evidenceChecksAvailable} detail={tr('report.appChecksDetail')} />
          <Metric label={tr('report.appGraph')} value={report.graph.nodes.length + report.graph.edges.length} detail={tr('report.appGraphDetail')} />
        </div>
      </Section>

      <Section id="intel-integrity" index="21 · INTEGRITY SNAPSHOT" title={tr('report.integrityTitle')} description={tr('report.integrityDesc')}>
        <div className="card p-6">
          <div className="flex items-center gap-2 text-sm text-ink"><FileKey2 className="h-4 w-4" /> SHA-256</div>
          <code className="mt-4 block break-all rounded-[var(--radius-sm)] border border-rule-2 bg-paper-2 p-4 text-xs text-ink-2">{snapshotHash}</code>
          <div className="mt-4 font-mono text-[12px] text-ink-3">{tr('report.integrityMeta', { target: target || 'target', requirement: report.intelligenceRequirementLabel })} · {tr('report.generatedLocal')}</div>
        </div>
      </Section>

      <Section id="intel-manifest" index="22 · EXPORT MANIFEST" title={tr('report.manifest')} description={tr('report.manifestDesc')}>
        <div className="card p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div><div className="label-mono">{tr('report.manDefault')}</div><p className="mt-2 text-sm text-ink-2">{tr('report.manDefaultDesc')}</p></div>
            <div><div className="label-mono">{tr('report.manOptional')}</div><p className="mt-2 text-sm text-ink-2">{tr('report.manOptionalDesc')}</p></div>
            <div><div className="label-mono">{tr('report.integrity')}</div><p className="mt-2 text-sm text-ink-2">{tr('report.manIntegrityDesc')}</p></div>
          </div>
          <button type="button" onClick={onOpenExport} className="btn-primary mt-6"><Download className="h-4 w-4" /> {tr('report.openExport')}</button>
        </div>
      </Section>

      <section className="py-14">
        <span className="eyebrow inline-flex items-center gap-2"><FileSearch className="h-3.5 w-3.5" /> {tr('report.aiOptional')}</span>
        <div className="mt-6"><AiAnalystPanel target={target} results={results} apiKey={aiApiKey} model={aiModel} requirement={requirement} /></div>
        <button type="button" onClick={onViewTable} className="btn mt-8">{tr('report.openTrail')} <ChevronRight className="h-4 w-4" /></button>
      </section>
    </article>
  );
}
