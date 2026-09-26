import { useMemo } from 'react';
import {
  ArrowUpRight,
  ChevronRight,
  CircleDot,
  Download,
  FileText,
  Gauge,
  Layers3,
  SearchCheck,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import type { ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';
import { AiAnalystPanel } from './AiAnalystPanel';

interface IntelligenceReportViewProps {
  target: string;
  results: ScanResult[];
  onOpenExport: () => void;
  onViewTable: () => void;
  aiApiKey?: string;
  aiModel?: string;
}

const sectionLinks = [
  ['assessment', 'Assessment'],
  ['evidence', 'Evidence'],
  ['correlation', 'Correlation'],
  ['hypotheses', 'Hypotheses'],
  ['pivots', 'Pivots'],
  ['gaps', 'Gaps'],
  ['method', 'Method'],
] as const;

function Band({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#34383d] px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-[#d9dce0]">
      {value}
    </span>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[#2b3035] bg-[#111417] px-6 py-6 min-h-[150px] flex flex-col justify-between">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#9299a2]">{label}</div>
      <div>
        <div className="text-4xl font-semibold tracking-[-0.04em] text-[#f4f5f6]">{value}</div>
        <div className="mt-2 text-sm text-[#949aa3]">{detail}</div>
      </div>
    </div>
  );
}

function SectionHeading({
  index,
  eyebrow,
  title,
  description,
}: {
  index: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end">
      <div>
        <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9ca3ad]">
          {index} · {eyebrow}
        </div>
        <h2 className="mt-2 text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-[#f5f6f7]">{title}</h2>
      </div>
      <p className="max-w-xl text-sm md:text-base text-[#969da7] lg:justify-self-end">{description}</p>
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
}: IntelligenceReportViewProps) {
  const report = useMemo(() => buildIntelligenceAssessment(results, target || 'target'), [results, target]);
  const highValue = report.evidence.filter((item) => item.analyticalValue === 'HIGH' && item.status === 'found');
  const uncertain = report.collection.uncertain + report.collection.rateLimited + report.collection.errors;
  const assessmentConfidence =
    report.judgments[0]?.confidence || (highValue.length > 2 ? 'MODERATE' : 'LOW');

  return (
    <article className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 pb-24">
      <div className="sticky top-16 z-30 -mx-4 sm:-mx-6 lg:-mx-8 border-b border-[#252a2f] bg-[#0b0e10]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1">
            {sectionLinks.map(([id, label]) => (
              <a
                key={id}
                href={`#intel-${id}`}
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-[#969ca5] transition hover:bg-[#13171a] hover:text-[#f2f3f4]"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onViewTable}
              className="rounded-xl border border-[#2d3339] px-3 py-2 text-xs font-medium text-[#c8ccd1] hover:border-[#5c626a] hover:text-white"
            >
              Audit table
            </button>
            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-2 rounded-xl border border-[#394047] bg-[#15191c] px-3 py-2 text-xs font-medium text-[#f2f3f4] hover:bg-[#1b2024]"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      <header className="pt-16 md:pt-24 pb-12 border-b border-[#20252a]">
        <div className="font-mono text-[12px] font-bold uppercase tracking-[0.22em] text-[#9aa1aa]">
          Intelligence report · {target ? `@${target}` : 'no target'}
        </div>
        <h1 className="mt-5 max-w-5xl text-[clamp(2.6rem,6vw,5.4rem)] leading-[0.98] font-semibold tracking-[-0.06em] text-[#f7f7f8]">
          Pegada pública observada com evidência, lacunas e próximos pivôs.
        </h1>
        <p className="mt-6 max-w-4xl text-lg md:text-2xl leading-relaxed text-[#9ba1aa]">
          Priorize achados fortes, resolva contradições e feche gaps antes de elevar qualquer hipótese de correlação.
        </p>

        <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-[#8e959f]">
          <Band value={`ASSESSMENT ${assessmentConfidence}`} />
          <span>Gerado localmente</span>
          <span className="text-[#444a50]">·</span>
          <span>{new Date(report.generatedAt).toLocaleString()}</span>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="High-value findings" value={highValue.length} detail="achados que merecem revisão analítica" />
          <Metric label="Effective coverage" value={`${report.collection.effectiveCoveragePercent}%`} detail={`${report.collection.completed}/${report.collection.requested} detectores concluídos`} />
          <Metric label="Unresolved" value={uncertain} detail="incertos, limitados ou com erro" />
          <Metric label="Analytical gaps" value={report.gaps.length} detail="lacunas que podem mudar a avaliação" />
        </div>
      </header>

      <section id="intel-assessment" className="scroll-mt-36 py-14 border-b border-[#20252a]">
        <SectionHeading
          index="01"
          eyebrow="Assessment"
          title="Visão executiva"
          description="Comece pelo que importa: julgamentos, confiança e limites da coleta. Os detalhes ficam abaixo, onde deveriam estar."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6 md:p-8">
            <div className="text-[11px] uppercase tracking-[0.17em] text-[#9299a2]">Key intelligence judgments</div>
            <div className="mt-5 space-y-5">
              {report.judgments.map((judgment) => (
                <div key={judgment.id} className="grid gap-3 border-b border-[#252a2f] pb-5 last:border-0 last:pb-0 md:grid-cols-[92px_1fr]">
                  <Band value={judgment.confidence} />
                  <div>
                    <p className="text-lg leading-snug text-[#f0f1f2]">{judgment.text}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#8f969f]">{judgment.basis}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6 md:p-8">
            <div className="text-[11px] uppercase tracking-[0.17em] text-[#9299a2]">Collection health</div>
            <div className="mt-6 space-y-5">
              {[
                ['Conclusive', report.collection.found + report.collection.absent, report.collection.requested],
                ['Uncertain', report.collection.uncertain, report.collection.requested],
                ['Rate limited', report.collection.rateLimited, report.collection.requested],
                ['Errors', report.collection.errors, report.collection.requested],
              ].map(([label, value, total]) => {
                const width = Number(total) ? Math.max(2, (Number(value) / Number(total)) * 100) : 0;
                return (
                  <div key={String(label)}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#aab0b7]">{label}</span>
                      <span className="tabular-nums text-[#f1f2f3]">{value}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#1b1f23] overflow-hidden">
                      <div className="h-full rounded-full bg-[#d9dde1]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="intel-evidence" className="scroll-mt-36 py-14 border-b border-[#20252a]">
        <SectionHeading
          index="02"
          eyebrow="Evidence"
          title="Matriz de evidência"
          description="Detector, observação e correlação permanecem separados. Um HTTP 200 não ganha diploma de identidade confirmada."
        />

        <div className="mt-8 overflow-hidden rounded-[24px] border border-[#2b3035] bg-[#101316]">
          <div className="hidden md:grid grid-cols-[1.3fr_.65fr_.65fr_.65fr_.7fr] gap-4 border-b border-[#2a2f34] px-6 py-4 text-[10px] uppercase tracking-[0.16em] text-[#828a94]">
            <span>Finding</span><span>Detector</span><span>Observation</span><span>Correlation</span><span>Value</span>
          </div>
          <div className="divide-y divide-[#252a2f]">
            {report.evidence.slice(0, 12).map((item) => (
              <div key={item.id} className="grid gap-4 px-6 py-5 md:grid-cols-[1.3fr_.65fr_.65fr_.65fr_.7fr] md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <CircleDot className="h-3.5 w-3.5 text-[#cfd3d7]" />
                    <span className="font-medium text-[#f1f2f3]">{item.platformName}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#828a94]">{item.category} · {item.status} · source {item.sourceQuality} · IPS {item.intelligencePriorityScore}</div>
                </div>
                <div><span className="md:hidden text-xs text-[#737b85]">Detector · </span><span className="tabular-nums text-[#dadddf]">{item.detectorConfidence}</span></div>
                <div><span className="md:hidden text-xs text-[#737b85]">Observation · </span><span className="tabular-nums text-[#dadddf]">{item.observationConfidence}</span></div>
                <div><span className="md:hidden text-xs text-[#737b85]">Correlation · </span><span className="tabular-nums text-[#dadddf]">{item.correlationConfidence}</span></div>
                <Band value={item.analyticalValue} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="intel-correlation" className="scroll-mt-36 py-14 border-b border-[#20252a]">
        <SectionHeading
          index="03"
          eyebrow="Correlation"
          title="Relações observadas e timeline"
          description="O grafo mostra relações públicas observadas. SAME_HANDLE continua sendo sinal de correlação, não prova de identidade."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[#858c95]">Correlation graph</div>
                <div className="mt-2 text-sm text-[#969da6]">{report.graph.nodes.length} nodes · {report.graph.edges.length} edges</div>
              </div>
              <Band value="PUBLIC EVIDENCE" />
            </div>

            <div className="mt-6 space-y-3">
              {report.graph.edges.slice(0, 10).map((edge) => {
                const source = report.graph.nodes.find((node) => node.id === edge.source);
                const targetNode = report.graph.nodes.find((node) => node.id === edge.target);
                return (
                  <div key={edge.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-[#282e33] px-4 py-3 text-sm">
                    <span className="truncate text-[#d9dde1]">{source?.label || edge.source}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#747c85]">
                      {edge.relationship} · {edge.confidence}
                    </span>
                    <span className="truncate text-right text-[#d9dde1]">{targetNode?.label || edge.target}</span>
                  </div>
                );
              })}
              {!report.graph.edges.length && (
                <p className="text-sm text-[#7e8690]">Nenhuma relação positiva foi observada na coleta atual.</p>
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6">
            <div className="text-[11px] uppercase tracking-[0.16em] text-[#858c95]">Observation timeline</div>
            <div className="mt-5 space-y-4">
              {report.timeline.slice(-8).map((event) => (
                <div key={event.id} className="grid grid-cols-[92px_1fr] gap-4 border-b border-[#262b30] pb-4 last:border-0">
                  <span className="font-mono text-[10px] text-[#737b84]">
                    {new Date(event.observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <div className="text-sm text-[#e1e4e7]">{event.platformName}</div>
                    <div className="mt-1 text-xs leading-relaxed text-[#858d96]">{event.label}</div>
                  </div>
                </div>
              ))}
              {!report.timeline.length && <p className="text-sm text-[#7e8690]">Timeline disponível após a coleta.</p>}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-[#2b3035] bg-[#101316] p-6">
          <div className="text-[11px] uppercase tracking-[0.16em] text-[#858c95]">Reliability heatmap</div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-[10px] uppercase tracking-[0.15em] text-[#737b84]">
                <tr><th className="pb-3">Cluster</th><th className="pb-3">High</th><th className="pb-3">Medium</th><th className="pb-3">Low</th></tr>
              </thead>
              <tbody className="divide-y divide-[#262b30]">
                {report.reliabilityHeatmap.map((cell) => (
                  <tr key={cell.category}>
                    <td className="py-3 text-[#dfe2e5]">{cell.category}</td>
                    <td className="py-3 tabular-nums text-[#dfe2e5]">{cell.high}</td>
                    <td className="py-3 tabular-nums text-[#9ba2aa]">{cell.medium}</td>
                    <td className="py-3 tabular-nums text-[#7c848d]">{cell.low}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="intel-hypotheses" className="scroll-mt-36 py-14 border-b border-[#20252a]">
        <SectionHeading
          index="04"
          eyebrow="Hypotheses"
          title="Hipóteses e contradições"
          description="A hipótese principal só é útil quando a hipótese alternativa continua visível e as evidências contra ela não somem por conveniência."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            {report.hypotheses.map((hypothesis) => (
              <div key={hypothesis.id} className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-[#9198a2]">{hypothesis.id}</span>
                  <Band value={hypothesis.confidence} />
                </div>
                <p className="mt-5 text-xl leading-snug text-[#f2f3f4]">{hypothesis.statement}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#8d949d]">{hypothesis.caveat}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-[#f0f1f2]">
              <TriangleAlert className="h-4 w-4" />
              Evidence against correlation
            </div>
            <div className="mt-5 space-y-4">
              {report.contradictoryEvidence.length ? report.contradictoryEvidence.map((item, index) => (
                <div key={index} className="border-l border-[#4b5158] pl-4 text-sm leading-relaxed text-[#a1a7af]">{item}</div>
              )) : (
                <p className="text-sm leading-relaxed text-[#858c95]">Nenhuma contradição explícita foi observada nos metadados disponíveis. Isso não equivale a confirmação.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="intel-pivots" className="scroll-mt-36 py-14 border-b border-[#20252a]">
        <SectionHeading
          index="05"
          eyebrow="Action"
          title="Próximos pivôs"
          description="Colete menos por impulso e mais por valor esperado. Cada pivô deve existir porque resolve uma pergunta, não porque a internet ainda tem páginas."
        />

        <div className="mt-8 grid gap-4">
          {report.pivots.slice(0, 8).map((pivot) => (
            <div key={pivot.id} className="group rounded-[22px] border border-[#2b3035] bg-[#101316] p-6 transition hover:border-[#4c535b]">
              <div className="grid gap-5 lg:grid-cols-[110px_1fr_auto] lg:items-center">
                <Band value={pivot.priority} />
                <div>
                  <div className="text-sm text-[#858c96]">{pivot.signal}</div>
                  <div className="mt-2 text-lg text-[#f1f2f3]">{pivot.action}</div>
                  <div className="mt-2 text-sm leading-relaxed text-[#858c96]">{pivot.reason}</div>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#777f88] transition group-hover:text-[#f1f2f3]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="intel-gaps" className="scroll-mt-36 py-14 border-b border-[#20252a]">
        <SectionHeading
          index="06"
          eyebrow="Gaps"
          title="O que ainda não sabemos"
          description="Uma boa avaliação mostra o que falta. Um relatório que só parece confiante está vendendo decoração."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {report.gaps.map((gap) => (
            <div key={gap.id} className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs text-[#858c96]">{gap.id}</span>
                <Band value={gap.severity} />
              </div>
              <p className="mt-5 text-lg text-[#f0f1f2]">{gap.question}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#8d949d]">{gap.reason}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[22px] border border-[#353a40] bg-[#0e1113] p-6">
          <div className="flex items-center gap-2 text-sm font-medium text-[#f0f1f2]">
            <SearchCheck className="h-4 w-4" />
            Stop condition
          </div>
          <p className="mt-3 max-w-4xl text-sm md:text-base leading-relaxed text-[#9aa1aa]">{report.stopCondition}</p>
        </div>
      </section>

      <section className="py-14 border-b border-[#20252a]">
        <SectionHeading
          index="07"
          eyebrow="AI Assist"
          title="Copiloto analítico"
          description="IA opcional para triagem de evidências, gaps e contradições. A camada determinística continua sendo a fonte de verdade."
        />
        <div className="mt-8">
          <AiAnalystPanel target={target} results={results} apiKey={aiApiKey} model={aiModel} />
        </div>
      </section>

      <section id="intel-method" className="scroll-mt-36 py-14">
        <SectionHeading
          index="08"
          eyebrow="Method"
          title="Como esta avaliação foi construída"
          description="Collection, evidence, correlation e assessment são camadas diferentes. O relatório mantém essa separação para evitar certeza artificial."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            [Layers3, 'Collection', 'Coleta resultados e registra cobertura.'],
            [ShieldCheck, 'Evidence', 'Avalia sinais observados e força do detector.'],
            [Gauge, 'Correlation', 'Combina evidências sem tratar username como identidade.'],
            [FileText, 'Assessment', 'Produz julgamentos, gaps e pivôs auditáveis.'],
          ].map(([Icon, title, detail]) => {
            const C = Icon as typeof Layers3;
            return (
              <div key={String(title)} className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-5">
                <C className="h-4 w-4 text-[#cdd1d5]" />
                <div className="mt-5 font-medium text-[#f0f1f2]">{title as string}</div>
                <div className="mt-2 text-sm leading-relaxed text-[#888f98]">{detail as string}</div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onViewTable}
          className="mt-8 inline-flex items-center gap-2 text-sm text-[#c5cad0] hover:text-white"
        >
          Abrir trilha completa de evidências
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>
    </article>
  );
}
