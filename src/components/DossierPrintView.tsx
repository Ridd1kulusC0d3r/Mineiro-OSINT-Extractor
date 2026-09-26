import type { AiProfileReport, EmailReconData, ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';

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
  const report = buildIntelligenceAssessment(results, target || 'target');

  return (
    <div className="hidden print:block bg-white text-black p-8 max-w-5xl mx-auto font-sans text-xs space-y-7">
      <header className="border-b-2 border-black pb-5">
        <div className="font-mono text-[10px] tracking-[0.18em]">MINEIRO · OPEN-SOURCE INTELLIGENCE ASSESSMENT</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Public evidence, analytical gaps and next actions.</h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><div className="text-[9px] uppercase text-neutral-500">Target</div><b>@{target}</b></div>
          <div><div className="text-[9px] uppercase text-neutral-500">Mode</div><b>{targetType}</b></div>
          <div><div className="text-[9px] uppercase text-neutral-500">Assessment</div><b>{report.assessmentConfidence}</b></div>
          <div><div className="text-[9px] uppercase text-neutral-500">Coverage</div><b>{report.collection.effectiveCoveragePercent}%</b></div>
        </div>
      </header>

      <section>
        <div className="font-mono text-[10px] font-bold">01 · EXECUTIVE ASSESSMENT</div>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div><b>KNOWN</b>{report.knownAssessedUnknown.known.slice(0,5).map((x,i)=><p key={i} className="mt-2">{x}</p>)}</div>
          <div><b>ASSESSED</b>{report.knownAssessedUnknown.assessed.slice(0,5).map((x,i)=><p key={i} className="mt-2">{x}</p>)}</div>
          <div><b>UNKNOWN</b>{report.knownAssessedUnknown.unknown.slice(0,5).map((x,i)=><p key={i} className="mt-2">{x}</p>)}</div>
        </div>
      </section>

      <section className="border-t border-black pt-5">
        <div className="font-mono text-[10px] font-bold">02 · KEY INTELLIGENCE JUDGMENTS</div>
        <div className="mt-3 space-y-3">
          {report.judgments.map((j)=><div key={j.id}><b>{j.id} · {j.confidence}</b><p>{j.text}</p><p className="text-neutral-600">Basis: {j.basis}</p></div>)}
        </div>
      </section>

      <section className="border-t border-black pt-5">
        <div className="font-mono text-[10px] font-bold">03 · EVIDENCE MATRIX</div>
        <table className="mt-3 w-full border-collapse border border-black text-[9px]">
          <thead><tr><th className="border border-black p-1 text-left">Finding</th><th className="border border-black p-1">Status</th><th className="border border-black p-1">Detector</th><th className="border border-black p-1">Observation</th><th className="border border-black p-1">Correlation</th><th className="border border-black p-1">Source</th><th className="border border-black p-1">IPS</th></tr></thead>
          <tbody>{report.evidence.slice(0,40).map((e)=><tr key={e.id}><td className="border border-black p-1">{e.platformName}</td><td className="border border-black p-1 text-center">{e.status}</td><td className="border border-black p-1 text-center">{e.detectorConfidence}</td><td className="border border-black p-1 text-center">{e.observationConfidence}</td><td className="border border-black p-1 text-center">{e.correlationConfidence}</td><td className="border border-black p-1 text-center">{e.sourceQuality}</td><td className="border border-black p-1 text-center">{e.intelligencePriorityScore}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="border-t border-black pt-5">
        <div className="font-mono text-[10px] font-bold">04 · HYPOTHESES & CONTRADICTIONS</div>
        <div className="mt-3 grid grid-cols-2 gap-5">
          <div>{report.hypotheses.map((h)=><div key={h.id} className="mb-3"><b>{h.id} · {h.confidence}{h.alternative?' · ALTERNATIVE':''}</b><p>{h.statement}</p><p className="text-neutral-600">{h.caveat}</p></div>)}</div>
          <div><b>EVIDENCE AGAINST CORRELATION</b>{(report.contradictoryEvidence.length?report.contradictoryEvidence:['No explicit contradiction observed; this is not confirmation.']).map((x,i)=><p key={i} className="mt-2">• {x}</p>)}</div>
        </div>
      </section>

      <section className="border-t border-black pt-5">
        <div className="font-mono text-[10px] font-bold">05 · GAPS & NEXT COLLECTION PLAN</div>
        <div className="mt-3 grid grid-cols-2 gap-5">
          <div>{report.gaps.map((g)=><div key={g.id} className="mb-3"><b>{g.id} · {g.severity}</b><p>{g.question}</p><p className="text-neutral-600">{g.reason}</p></div>)}</div>
          <div><ol className="list-decimal pl-4">{report.collectionPlan.map((x,i)=><li key={i} className="mb-2">{x}</li>)}</ol><p className="mt-3"><b>STOP CONDITION:</b> {report.stopCondition}</p></div>
        </div>
      </section>

      <footer className="border-t-2 border-black pt-4 text-[9px] text-neutral-600">
        Generated locally by Mineiro. Same-handle observations are leads, not identity proof. AI synthesis is excluded from this print assessment by default.
      </footer>
    </div>
  );
}
