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
    <span className="inline-flex items-center rounded-full border border-[#34383d] px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-[#d9dce0]">
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
    <section id={id} className="scroll-mt-36 border-b border-[#20252a] py-14">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end">
        <div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8f969f]">
            {index}
          </div>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-[-0.035em] text-[#f4f5f6]">
            {title}
          </h2>
        </div>
        <p className="max-w-xl text-sm md:text-base text-[#8e959e] lg:justify-self-end">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <div className="rounded-[22px] border border-[#2b3035] bg-[#111417] px-6 py-6 min-h-[148px] flex flex-col justify-between">
      <div className="text-[11px] uppercase tracking-[0.17em] text-[#8b929b]">{label}</div>
      <div>
        <div className="text-4xl font-semibold tracking-[-0.045em] text-[#f4f5f6]">{value}</div>
        <div className="mt-2 text-sm text-[#8f969f]">{detail}</div>
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
      <div className="sticky top-[76px] z-30 -mx-4 sm:-mx-6 lg:-mx-8 border-b border-[#252a2f] bg-[#0b0e10]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1">
            {navigation.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-[#9299a2] hover:bg-[#13171a] hover:text-white">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={onViewTable} className="rounded-xl border border-[#2d3339] px-3 py-2 text-xs text-[#c8ccd1] hover:text-white">
              {tr('report.auditTable')}
            </button>
            <button type="button" onClick={onOpenExport} className="inline-flex items-center gap-2 rounded-xl border border-[#394047] bg-[#15191c] px-3 py-2 text-xs font-medium text-[#f2f3f4]">
              <Download className="h-3.5 w-3.5" />
              {tr('header.export')}
            </button>
          </div>
        </div>
      </div>

      <header className="pt-16 md:pt-24 pb-12 border-b border-[#20252a]">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-[#9aa1aa]">
          Mineiro · Open-source intelligence assessment
        </div>
        <h1 className="mt-5 max-w-5xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.97] font-semibold tracking-[-0.06em] text-[#f7f7f8]">
          {tr('report.heroTitle')}
        </h1>
        <p className="mt-6 max-w-4xl text-lg md:text-2xl leading-relaxed text-[#989fa8]">
          {tr('report.heroLead')}
        </p>
        <div className="mt-7 flex flex-wrap gap-3 text-sm text-[#8d949d]">
          <Band value={`ASSESSMENT ${report.assessmentConfidence}`} />
          <Band value={report.intelligenceRequirementLabel.toUpperCase()} />
          <span>@{target || 'target'}</span>
          <span className="text-[#41474d]">·</span>
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
              className={`rounded-[18px] border p-5 text-left transition ${requirement === key ? 'border-[#6a727b] bg-[#171b1f]' : 'border-[#292f34] bg-[#101316] hover:border-[#454c54]'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[#edf0f2]">{label}</span>
                {requirement === key && <CheckCircle2 className="h-4 w-4 text-[#e4e7e9]" />}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section id="intel-assessment" index="02 · EXECUTIVE ASSESSMENT" title={tr('report.executive')} description={tr('report.executiveDesc')}>
        <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#858c95]">Known · Assessed · Unknown</div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {[
                ['KNOWN', report.knownAssessedUnknown.known],
                ['ASSESSED', report.knownAssessedUnknown.assessed],
                ['UNKNOWN', report.knownAssessedUnknown.unknown],
              ].map(([label, items]) => (
                <div key={label as string} className="min-w-0">
                  <div className="font-mono text-[10px] tracking-[0.14em] text-[#7d858e]">{label as string}</div>
                  <div className="mt-3 space-y-3">
                    {(items as string[]).slice(0, 6).map((item, i) => (
                      <p key={i} className="text-sm leading-relaxed text-[#abb0b7] [overflow-wrap:anywhere]">{item}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#858c95]">Collection health</div>
            <div className="mt-6 space-y-4">
              {[
                ['Found', report.collection.found],
                ['Absent', report.collection.absent],
                ['Uncertain', report.collection.uncertain],
                ['Rate limited', report.collection.rateLimited],
                ['Errors', report.collection.errors],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between border-b border-[#262b30] pb-3 text-sm">
                  <span className="text-[#989fa8]">{label as string}</span>
                  <span className="tabular-nums text-[#f0f1f2]">{value as number}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="intel-judgments" index="03 · KEY INTELLIGENCE JUDGMENTS" title={tr('report.keyJudgments')} description={tr('report.keyJudgmentsDesc')}>
        <div className="space-y-4">
          {report.judgments.map((j) => (
            <div key={j.id} className="grid gap-4 rounded-[22px] border border-[#2b3035] bg-[#101316] p-6 md:grid-cols-[120px_1fr]">
              <div><Band value={j.confidence} /><div className="mt-2 font-mono text-[10px] text-[#6f7780]">{j.id}</div></div>
              <div><p className="text-lg text-[#f1f2f3]">{j.text}</p><p className="mt-2 text-sm text-[#8e959e]">{j.basis}</p></div>
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
            <button key={e.id} type="button" onClick={() => setSelectedEvidenceId(e.id)} className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-5 text-left hover:border-[#505861]">
              <div className="flex items-center justify-between gap-3"><span className="font-medium text-[#f0f1f2]">{e.platformName}</span><Band value={`IPS ${e.intelligencePriorityScore}`} /></div>
              <div className="mt-3 text-xs text-[#7f8790]">Source {e.sourceQuality} · detector {e.detectorConfidence} · observation {e.observationConfidence} · correlation {e.correlationConfidence}</div>
              <p className="mt-3 text-sm leading-relaxed text-[#9da3ab]">{e.whyItMatters}</p>
            </button>
          ))}
          {!report.highConfidenceFindings.length && <p className="text-sm text-[#7f8790]">Nenhum finding atingiu o limiar HIGH.</p>}
        </div>
      </Section>

      <Section id="intel-evidence" index="06 · EVIDENCE MATRIX" title={tr('report.evidenceMatrix')} description={tr('report.evidenceMatrixDesc')}>
        <div className="overflow-hidden rounded-[22px] border border-[#2b3035] bg-[#101316]">
          <div className="hidden md:grid grid-cols-[1.25fr_repeat(5,.62fr)] gap-3 border-b border-[#292f34] px-5 py-4 text-[10px] uppercase tracking-[0.12em] text-[#757d86]">
            <span>Finding</span><span>Detector</span><span>Observation</span><span>Correlation</span><span>Source</span><span>IPS</span>
          </div>
          {report.evidence.slice(0, 30).map((e) => (
            <button key={e.id} type="button" onClick={() => setSelectedEvidenceId(e.id)} className="grid w-full gap-3 border-b border-[#252a2f] px-5 py-4 text-left last:border-0 md:grid-cols-[1.25fr_repeat(5,.62fr)] md:items-center hover:bg-[#14181b]">
              <div><span className="text-sm font-medium text-[#edf0f2]">{e.platformName}</span><div className="mt-1 text-xs text-[#747c85]">{e.id} · {e.category} · {e.status} · {e.provenance}</div></div>
              <span className="text-sm tabular-nums text-[#cdd1d5]">{e.detectorConfidence}</span>
              <span className="text-sm tabular-nums text-[#cdd1d5]">{e.observationConfidence}</span>
              <span className="text-sm tabular-nums text-[#cdd1d5]">{e.correlationConfidence}</span>
              <span><Band value={e.sourceQuality} /></span>
              <span className="text-sm tabular-nums text-[#f0f1f2]">{e.intelligencePriorityScore}</span>
            </button>
          ))}
        </div>
        {selectedEvidence && (
          <div className="mt-5 rounded-[22px] border border-[#4a5159] bg-[#121619] p-6">
            <div className="flex items-start justify-between gap-4">
              <div><div className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#828a93]">Evidence detail · {selectedEvidence.id}</div><h3 className="mt-2 text-xl text-[#f2f3f4]">{selectedEvidence.platformName}</h3></div>
              <button type="button" onClick={() => setSelectedEvidenceId(null)} className="text-xs text-[#8e959e] hover:text-white">close</button>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div><div className="text-xs text-[#747c85]">Source URL</div><a href={selectedEvidence.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-sm text-[#d8dce0] hover:underline">{selectedEvidence.url}</a></div>
              <div><div className="text-xs text-[#747c85]">Observed</div><div className="mt-1 text-sm text-[#d8dce0]">{selectedEvidence.observedAt || 'scan timestamp unavailable'}</div></div>
              <div><div className="text-xs text-[#747c85]">HTTP evidence</div><div className="mt-1 text-sm text-[#d8dce0]">status {selectedEvidence.statusCode ?? '—'} · latency {selectedEvidence.responseTimeMs ?? '—'}ms</div></div>
              <div><div className="text-xs text-[#747c85]">Detector / observation / correlation</div><div className="mt-1 text-sm text-[#d8dce0]">{selectedEvidence.detectorConfidence} / {selectedEvidence.observationConfidence} / {selectedEvidence.correlationConfidence}</div></div>
              <div><div className="text-xs text-[#747c85]">Evidence signals</div><div className="mt-1 flex flex-wrap gap-1.5">{selectedEvidence.evidenceSignals.length ? selectedEvidence.evidenceSignals.map((signal) => <span key={signal} className="rounded-md border border-[#30363c] px-2 py-1 font-mono text-[10px] text-[#9da4ac]">{signal}</span>) : <span className="text-sm text-[#747c85]">none recorded</span>}</div></div>
              <div><div className="text-xs text-[#747c85]">Captured public metadata</div><pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-[#0b0e10] p-3 text-[10px] text-[#969da6]">{selectedEvidence.capturedMetadata ? JSON.stringify(selectedEvidence.capturedMetadata, null, 2) : 'none recorded'}</pre></div>
              <div><div className="text-xs text-[#747c85]">Why it matters</div><div className="mt-1 text-sm text-[#a3a9b0]">{selectedEvidence.whyItMatters}</div></div>
              <div><div className="text-xs text-[#747c85]">Recommended pivot</div><div className="mt-1 text-sm text-[#a3a9b0]">{selectedEvidence.recommendedPivot}</div></div>
            </div>
          </div>
        )}
      </Section>

      <Section id="intel-clusters" index="07 · DIGITAL FOOTPRINT CLUSTERS" title={tr('report.clusters')} description={tr('report.clustersDesc')}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {report.clusters.map((c) => (
            <div key={c.category} className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-5">
              <div className="flex items-center justify-between"><span className="font-medium capitalize text-[#f0f1f2]">{c.category}</span><Band value={String(c.weightedScore)} /></div>
              <div className="mt-4 text-sm text-[#9097a0]">{c.findings} findings · {c.strongFindings} strong</div>
              {c.overlaps.length > 0 && <div className="mt-4 border-t border-[#282d32] pt-4"><div className="text-[10px] uppercase tracking-[0.12em] text-[#737b84]">Cross-cluster overlap</div>{c.overlaps.map((o) => <div key={o.withCategory} className="mt-2 text-xs text-[#a1a7af]">{c.category} ↔ {o.withCategory}: {o.sharedSignals.join(', ')}</div>)}</div>}
            </div>
          ))}
        </div>
      </Section>

      <Section id="intel-correlation" index="08 · CORRELATION GRAPH" title={tr('report.correlationGraph')} description={tr('report.correlationGraphDesc')}>
        <div className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6">
          <div className="flex items-center gap-2 text-sm text-[#e6e8ea]"><GitBranch className="h-4 w-4" /> {report.graph.nodes.length} nodes · {report.graph.edges.length} edges</div>
          <div className="mt-5 grid gap-3">
            {report.graph.edges.slice(0, 24).map((edge) => {
              const source = report.graph.nodes.find((n) => n.id === edge.source)?.label || edge.source;
              const dest = report.graph.nodes.find((n) => n.id === edge.target)?.label || edge.target;
              return <div key={edge.id} className="grid gap-2 rounded-xl border border-[#282e33] px-4 py-3 text-sm md:grid-cols-[1fr_auto_1fr]"><span className="truncate text-[#dce0e3]">{source}</span><span className="font-mono text-[10px] text-[#747c85]">{edge.relationship} · {edge.confidence}</span><span className="truncate md:text-right text-[#dce0e3]">{dest}</span></div>;
            })}
          </div>
        </div>
      </Section>

      <Section id="intel-hypotheses" index="09 · IDENTITY HYPOTHESES" title={tr('report.hypotheses')} description={tr('report.hypothesesDesc')}>
        <div className="grid gap-4 lg:grid-cols-3">
          {report.hypotheses.map((h) => <div key={h.id} className={`rounded-[20px] border p-5 ${h.alternative ? 'border-[#4b4540] bg-[#151310]' : 'border-[#2b3035] bg-[#101316]'}`}><div className="flex items-center justify-between"><span className="font-mono text-xs text-[#858d96]">{h.id}{h.alternative ? ' · ALTERNATIVE' : ''}</span><Band value={h.confidence} /></div><p className="mt-4 text-lg text-[#f0f1f2]">{h.statement}</p><p className="mt-3 text-sm text-[#8d949d]">{h.caveat}</p></div>)}
        </div>
      </Section>

      <Section id="intel-support" index="10 · SUPPORTING EVIDENCE" title={tr('report.supporting')} description={tr('report.supportingDesc')}>
        <div className="space-y-4">
          {report.analyticLedger.map((entry) => <div key={entry.id} className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs text-[#858d96]">{entry.id}</span><Band value={entry.confidence} /></div><p className="mt-3 text-base text-[#eef0f2]">{entry.claim}</p><div className="mt-4 flex flex-wrap gap-2">{entry.supportingEvidenceIds.map((id) => <button key={id} type="button" onClick={() => { setSelectedEvidenceId(id); document.getElementById('intel-evidence')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-lg border border-[#343a40] px-2.5 py-1.5 font-mono text-[10px] text-[#b6bbc1] hover:text-white">{id}</button>)}</div></div>)}
        </div>
      </Section>

      <Section id="intel-contradictions" index="11 · CONTRADICTORY EVIDENCE" title={tr('report.contradictions')} description={tr('report.contradictionsDesc')}>
        <div className="rounded-[22px] border border-[#3a3434] bg-[#131111] p-6">
          {report.contradictoryEvidence.length ? report.contradictoryEvidence.map((x, i) => <div key={i} className="flex gap-3 border-b border-[#2e2929] py-3 last:border-0"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#aaa0a0]" /><p className="text-sm text-[#b6afb0]">{x}</p></div>) : <p className="text-sm text-[#8c949d]">Nenhuma contradição explícita foi observada. Isso não equivale a confirmação.</p>}
        </div>
      </Section>

      <Section id="intel-unresolved" index="12 · UNCERTAIN / UNRESOLVED FINDINGS" title={tr('report.unresolvedTitle')} description={tr('report.unresolvedDesc')}>
        <div className="grid gap-3 md:grid-cols-2">
          {report.unresolvedFindings.map((e) => <div key={e.id} className="rounded-[18px] border border-[#2b3035] bg-[#101316] p-4"><div className="flex items-center justify-between"><span className="text-sm text-[#edf0f2]">{e.platformName}</span><Band value={e.status.toUpperCase()} /></div><div className="mt-2 text-xs text-[#7d858e]">{e.whyItMatters}</div></div>)}
          {!report.unresolvedFindings.length && <p className="text-sm text-[#7f8790]">Nenhum finding inconclusivo no conjunto atual.</p>}
        </div>
      </Section>

      <Section id="intel-gaps" index="13 · INTELLIGENCE GAPS" title={tr('report.gapsTitle')} description={tr('report.gapsDesc')}>
        <div className="grid gap-4 md:grid-cols-2">
          {report.gaps.map((g) => <div key={g.id} className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-5"><div className="flex items-center justify-between"><span className="font-mono text-xs text-[#858d96]">{g.id}</span><Band value={g.severity} /></div><p className="mt-4 text-lg text-[#eef0f2]">{g.question}</p><p className="mt-2 text-sm text-[#8e959e]">{g.reason}</p></div>)}
        </div>
      </Section>

      <Section id="intel-timeline" index="14 · TIMELINE" title={tr('report.timeline')} description={tr('report.timelineDesc')}>
        <div className="space-y-3">
          {report.timeline.slice(-24).map((event) => <div key={event.id} className="grid gap-3 rounded-xl border border-[#282e33] bg-[#101316] px-4 py-3 md:grid-cols-[180px_150px_1fr]"><span className="font-mono text-[11px] text-[#7d858e]">{event.observedAt}</span><span className="font-mono text-[10px] text-[#969da6]">{event.timestampKind}</span><span className="text-sm text-[#dce0e3]">{event.platformName} · {event.label}</span></div>)}
        </div>
      </Section>

      <Section id="intel-pivots" index="15 · HIGH-VALUE PIVOTS" title={tr('report.pivots')} description={tr('report.pivotsDesc')}>
        <div className="space-y-4">
          {report.pivots.map((p) => <div key={p.id} className="group rounded-[20px] border border-[#2b3035] bg-[#101316] p-5 hover:border-[#4b535b]"><div className="grid gap-4 md:grid-cols-[100px_1fr_auto] md:items-center"><Band value={`${p.priority} · ${p.priorityScore}`} /><div><div className="text-xs text-[#7e8690]">{p.signal}</div><div className="mt-2 text-base text-[#edf0f2]">{p.action}</div><div className="mt-2 text-sm text-[#8e959e]">{p.reason}</div></div><ArrowUpRight className="h-4 w-4 text-[#777f88] group-hover:text-white" /></div></div>)}
        </div>
      </Section>

      <Section id="intel-plan" index="16 · NEXT COLLECTION PLAN" title={tr('report.plan')} description={tr('report.planDesc')}>
        <ol className="space-y-3">
          {report.collectionPlan.map((item, i) => <li key={i} className="rounded-[16px] border border-[#2b3035] bg-[#101316] p-4 text-sm text-[#afb4ba]"><span className="mr-3 font-mono text-[#6f7780]">{String(i + 1).padStart(2, '0')}</span>{item}</li>)}
        </ol>
        <div className="mt-5 rounded-[18px] border border-[#41474d] bg-[#0e1113] p-5"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#858d96]">Stop condition</div><p className="mt-3 text-sm text-[#a2a8af]">{report.stopCondition}</p></div>
      </Section>

      <Section id="intel-reliability" index="17 · SOURCE & DETECTOR RELIABILITY" title={tr('report.reliability')} description={tr('report.reliabilityDesc')}>
        <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
          <div className="overflow-hidden rounded-[20px] border border-[#2b3035] bg-[#101316]"><table className="w-full text-sm"><thead className="text-left text-[10px] uppercase tracking-[0.12em] text-[#737b84]"><tr><th className="p-4">Cluster</th><th>High</th><th>Medium</th><th>Low</th></tr></thead><tbody className="divide-y divide-[#282d32]">{report.reliabilityHeatmap.map((x) => <tr key={x.category}><td className="p-4 capitalize text-[#dce0e3]">{x.category}</td><td>{x.high}</td><td>{x.medium}</td><td>{x.low}</td></tr>)}</tbody></table></div>
          <div className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-5 space-y-3">{report.sourceQualityNotes.map((x, i) => <p key={i} className="text-sm leading-relaxed text-[#979ea7]">{x}</p>)}</div>
        </div>
      </Section>

      <Section id="intel-method" index="18 · METHODOLOGY" title={tr('report.methodology')} description={tr('report.methodologyDesc')}>
        <div className="grid gap-4 md:grid-cols-4">
          {[['COLLECTION','O que o scanner conseguiu observar.'],['EVIDENCE','Como cada resposta sustenta ou não um finding.'],['CORRELATION','Como evidências podem se relacionar sem provar identidade.'],['ASSESSMENT','Julgamentos, hipóteses, contradições, gaps e pivôs.']].map(([a,b]) => <div key={a} className="rounded-[18px] border border-[#2b3035] bg-[#101316] p-5"><div className="font-mono text-xs text-[#dce0e3]">{a}</div><p className="mt-3 text-sm text-[#8e959e]">{b}</p></div>)}
        </div>
      </Section>

      <Section id="intel-provenance" index="19 · PROVENANCE" title={tr('report.provenance')} description={tr('report.provenanceDesc')}>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-5"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#7c848d]">Provenance graph</div><div className="mt-4 text-sm text-[#a2a8af]">{report.provenanceGraph.nodes.length} nodes · {report.provenanceGraph.edges.length} derivation edges</div><div className="mt-4 space-y-2">{report.provenanceGraph.edges.slice(0, 16).map((e, i) => <div key={i} className="font-mono text-[10px] text-[#7f8790]">{e.source} → {e.relation} → {e.target}</div>)}</div></div>
          <div className="grid gap-3">{['PRIMARY','DERIVED','EXTERNAL','AI_SYNTHESIZED'].map((x) => <div key={x} className="rounded-[16px] border border-[#2b3035] bg-[#101316] p-4"><div className="font-mono text-xs text-[#dce0e3]">{x}</div><div className="mt-2 text-xs text-[#858d96]">{x === 'PRIMARY' ? 'Observed directly by Mineiro.' : x === 'DERIVED' ? 'Deterministically calculated from evidence.' : x === 'EXTERNAL' ? 'Imported from an external attributed source.' : 'Generated by AI and never allowed to raise factual confidence alone.'}</div></div>)}</div>
        </div>
      </Section>

      <Section id="intel-appendix" index="20 · TECHNICAL APPENDIX" title={tr('report.appendix')} description={tr('report.appendixDesc')}>
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Detectors" value={report.technicalAppendix.detectorCount} detail="resultados no assessment" />
          <Metric label="Evidence checks" value={report.technicalAppendix.evidenceChecksAvailable} detail="checks lógicos registrados" />
          <Metric label="Graph" value={report.graph.nodes.length + report.graph.edges.length} detail="nodes + edges" />
        </div>
      </Section>

      <Section id="intel-integrity" index="21 · INTEGRITY SNAPSHOT" title={tr('report.integrityTitle')} description={tr('report.integrityDesc')}>
        <div className="rounded-[20px] border border-[#3b4249] bg-[#101316] p-6">
          <div className="flex items-center gap-2 text-sm text-[#edf0f2]"><FileKey2 className="h-4 w-4" /> SHA-256</div>
          <code className="mt-4 block break-all rounded-xl bg-[#0b0e10] p-4 text-xs text-[#b9bec4]">{snapshotHash}</code>
          <div className="mt-4 text-xs text-[#747c85]">Target: {target || 'target'} · Requirement: {report.intelligenceRequirementLabel} · {tr('report.generatedLocal')}</div>
        </div>
      </Section>

      <Section id="intel-manifest" index="22 · EXPORT MANIFEST" title={tr('report.manifest')} description={tr('report.manifestDesc')}>
        <div className="rounded-[20px] border border-[#2b3035] bg-[#101316] p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <div><div className="text-[10px] uppercase tracking-[0.14em] text-[#737b84]">Default included</div><p className="mt-2 text-sm text-[#abb1b8]">Assessment, judgments, coverage, evidence, clusters, graph, hypotheses, contradictions, gaps, timeline, pivots, plan, reliability, methodology, provenance, appendix and integrity.</p></div>
            <div><div className="text-[10px] uppercase tracking-[0.14em] text-[#737b84]">Optional</div><p className="mt-2 text-sm text-[#abb1b8]">Raw results and AI synthesis remain explicitly selectable.</p></div>
            <div><div className="text-[10px] uppercase tracking-[0.14em] text-[#737b84]">Integrity</div><p className="mt-2 text-sm text-[#abb1b8]">Every exported payload receives its own SHA-256 manifest.</p></div>
          </div>
          <button type="button" onClick={onOpenExport} className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#4a5159] px-4 py-2.5 text-sm text-[#eef0f2] hover:bg-[#171b1f]"><Download className="h-4 w-4" /> {tr('report.openExport')}</button>
        </div>
      </Section>

      <section className="py-14">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#858d96]"><FileSearch className="h-4 w-4" /> AI ASSIST · OPTIONAL</div>
        <div className="mt-6"><AiAnalystPanel target={target} results={results} apiKey={aiApiKey} model={aiModel} requirement={requirement} /></div>
        <button type="button" onClick={onViewTable} className="mt-8 inline-flex items-center gap-2 text-sm text-[#c5cad0] hover:text-white">Abrir trilha completa de evidências <ChevronRight className="h-4 w-4" /></button>
      </section>
    </article>
  );
}
