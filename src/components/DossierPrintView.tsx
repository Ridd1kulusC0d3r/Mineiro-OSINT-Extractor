import type { AiProfileReport, EmailReconData, ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';
import { useI18n } from '../utils/i18n';

interface DossierPrintViewProps {
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  aiProfile: AiProfileReport | null;
  emailData: EmailReconData | null;
}

export function DossierPrintView({
  target,
  targetType,
  results,
}: DossierPrintViewProps) {
  const { language } = useI18n();
  const report = buildIntelligenceAssessment(results, target || 'target', 'account_correlation', language);

  return (
    <div className="dossier-print hidden print:block bg-paper text-ink p-8 max-w-5xl mx-auto font-sans text-[11px] leading-relaxed space-y-7">
      <header className="border-b-2 border-ink pb-5">
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-signal"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-ink" aria-hidden="true" />Mineiro Username Intelligence · Open-source intelligence assessment</div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-ink">Public evidence, analytical gaps and next actions.</h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">Target</div><b>@{target}</b></div>
          <div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">Mode</div><b>{targetType}</b></div>
          <div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">Assessment</div><b>{report.assessmentConfidence}</b></div>
          <div><div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">Coverage</div><b>{report.collection.effectiveCoveragePercent}%</b></div>
        </div>
      </header>

      <section>
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-signal">01 · EXECUTIVE ASSESSMENT</div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div><b>KNOWN</b>{report.knownAssessedUnknown.known.slice(0,5).map((x,i)=><p key={i} className="mt-2">{x}</p>)}</div>
          <div><b>ASSESSED</b>{report.knownAssessedUnknown.assessed.slice(0,5).map((x,i)=><p key={i} className="mt-2">{x}</p>)}</div>
          <div><b>UNKNOWN</b>{report.knownAssessedUnknown.unknown.slice(0,5).map((x,i)=><p key={i} className="mt-2">{x}</p>)}</div>
        </div>
      </section>

      <section className="border-t border-rule pt-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-signal">02 · KEY INTELLIGENCE JUDGMENTS</div>
        <div className="mt-3 space-y-3">
          {report.judgments.map((j)=><div key={j.id}><b>{j.id} · {j.confidence}</b><p>{j.text}</p><p className="text-ink-2">Basis: {j.basis}</p></div>)}
        </div>
      </section>

      <section className="border-t border-rule pt-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-signal">03 · EVIDENCE MATRIX</div>
        <table className="mt-3 w-full border-collapse border border-rule text-[9px]">
          <thead className="bg-paper-2 font-mono uppercase tracking-[0.06em] text-ink-2"><tr><th className="border border-rule p-1 text-left">Finding</th><th className="border border-rule p-1">Status</th><th className="border border-rule p-1">Detector</th><th className="border border-rule p-1">Observation</th><th className="border border-rule p-1">Correlation</th><th className="border border-rule p-1">Source</th><th className="border border-rule p-1">IPS</th></tr></thead>
          <tbody>{report.evidence.slice(0,40).map((e)=><tr key={e.id}><td className="border border-rule p-1">{e.platformName}</td><td className="border border-rule p-1 text-center">{e.status}</td><td className="border border-rule p-1 text-center">{e.detectorConfidence}</td><td className="border border-rule p-1 text-center">{e.observationConfidence}</td><td className="border border-rule p-1 text-center">{e.correlationConfidence}</td><td className="border border-rule p-1 text-center">{e.sourceQuality}</td><td className="border border-rule p-1 text-center">{e.intelligencePriorityScore}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="border-t border-rule pt-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-signal">04 · HYPOTHESES & CONTRADICTIONS</div>
        <div className="mt-3 grid grid-cols-2 gap-5">
          <div>{report.hypotheses.map((h)=><div key={h.id} className="mb-3"><b>{h.id} · {h.confidence}{h.alternative?' · ALTERNATIVE':''}</b><p>{h.statement}</p><p className="text-ink-2">{h.caveat}</p></div>)}</div>
          <div><b>EVIDENCE AGAINST CORRELATION</b>{(report.contradictoryEvidence.length?report.contradictoryEvidence:['No explicit contradiction observed; this is not confirmation.']).map((x,i)=><p key={i} className="mt-2">• {x}</p>)}</div>
        </div>
      </section>

      <section className="border-t border-rule pt-5">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-signal">05 · GAPS & NEXT COLLECTION PLAN</div>
        <div className="mt-3 grid grid-cols-2 gap-5">
          <div>{report.gaps.map((g)=><div key={g.id} className="mb-3"><b>{g.id} · {g.severity}</b><p>{g.question}</p><p className="text-ink-2">{g.reason}</p></div>)}</div>
          <div><ol className="list-decimal pl-4">{report.collectionPlan.map((x,i)=><li key={i} className="mb-2">{x}</li>)}</ol><p className="mt-3"><b>STOP CONDITION:</b> {report.stopCondition}</p></div>
        </div>
      </section>

      <footer className="border-t-2 border-ink pt-4 text-[9px] text-ink-2">
        Generated locally by Mineiro. Same-handle observations are leads, not identity proof. AI synthesis is excluded from this print assessment by default.
      </footer>
    </div>
  );
}
