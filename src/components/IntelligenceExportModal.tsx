import { useMemo, useState } from 'react';
import { Check, Download, FileCode2, FileJson2, FileSpreadsheet, X } from 'lucide-react';
import type { ScanResult } from '../types';
import {
  DEFAULT_INTELLIGENCE_EXPORT,
  generateEvidenceCsv,
  generateIntelligenceHtml,
  generateIntelligenceJson,
  generateIntelligenceMarkdown,
  type IntelligenceExportSelection,
} from '../intelligence/reportExport';

interface IntelligenceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: string;
  results: ScanResult[];
}

const labels: Array<[keyof IntelligenceExportSelection, string, string]> = [
  ['executiveAssessment', 'Executive assessment', 'Resumo operacional e confiança.'],
  ['keyJudgments', 'Key intelligence judgments', 'Conclusões prioritárias com base explícita.'],
  ['collectionCoverage', 'Collection coverage', 'Cobertura, erros, incerteza e rate limits.'],
  ['highConfidenceFindings', 'High-confidence findings', 'Achados fortes para revisão.'],
  ['evidenceMatrix', 'Evidence matrix', 'Detector, observação, correlação e valor.'],
  ['footprintClusters', 'Footprint clusters', 'Distribuição ponderada por categoria.'],
  ['correlationGraph', 'Correlation graph', 'Relações públicas observadas e força de cada aresta.'],
  ['timeline', 'Observation timeline', 'Sequência temporal das observações realizadas.'],
  ['reliabilityHeatmap', 'Reliability heatmap', 'Força dos findings por cluster.'],
  ['analyticLedger', 'Analytic ledger', 'Julgamentos rastreáveis até as evidências que os sustentam.'],
  ['hypotheses', 'Hypotheses', 'Hipótese principal e alternativa.'],
  ['contradictions', 'Contradictions', 'Evidência contra correlação.'],
  ['gaps', 'Intelligence gaps', 'Perguntas que ainda podem mudar a avaliação.'],
  ['pivots', 'High-value pivots', 'Próximas ações investigativas.'],
  ['collectionPlan', 'Next collection plan', 'Prioridades e stop condition.'],
  ['methodology', 'Methodology', 'Separação entre coleta, evidência e avaliação.'],
  ['provenance', 'Provenance', 'Origem e natureza da evidência.'],
  ['rawResults', 'Raw results', 'Inclui resultados brutos. Pode deixar o arquivo pesado.'],
];

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function IntelligenceExportModal({
  isOpen,
  onClose,
  target,
  results,
}: IntelligenceExportModalProps) {
  const [sections, setSections] = useState<IntelligenceExportSelection>(DEFAULT_INTELLIGENCE_EXPORT);
  const activeCount = useMemo(() => Object.values(sections).filter(Boolean).length, [sections]);

  if (!isOpen) return null;

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');

  const toggle = (key: keyof IntelligenceExportSelection) => {
    setSections((current) => ({ ...current, [key]: !current[key] }));
  };

  const exportHtml = () => download(
    `mineiro-intelligence-${target || 'report'}-${stamp}.html`,
    generateIntelligenceHtml(target, results, sections),
    'text/html;charset=utf-8'
  );

  const exportJson = () => download(
    `mineiro-intelligence-${target || 'report'}-${stamp}.json`,
    generateIntelligenceJson(target, results, sections),
    'application/json;charset=utf-8'
  );

  const exportMarkdown = () => download(
    `mineiro-intelligence-${target || 'report'}-${stamp}.md`,
    generateIntelligenceMarkdown(target, results, sections),
    'text/markdown;charset=utf-8'
  );

  const exportCsv = () => download(
    `mineiro-evidence-${target || 'report'}-${stamp}.csv`,
    generateEvidenceCsv(target, results),
    'text/csv;charset=utf-8'
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="mx-auto max-w-6xl rounded-[26px] border border-[#2c3136] bg-[#0e1113] shadow-2xl">
        <div className="flex items-start justify-between gap-6 border-b border-[#262b30] px-6 py-6 md:px-8">
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#969da7]">
              Report export · local only
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#f4f5f6]">
              Monte o relatório antes de exportar.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#8f969f]">
              Escolha o que entra no arquivo. O HTML é autocontido e abre localmente no navegador; JSON preserva a estrutura analítica; CSV exporta a matriz de evidência.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#30363c] p-2.5 text-[#a7adb5] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-8 px-6 py-7 md:px-8 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-[#eff1f2]">Conteúdo do relatório</div>
                <div className="mt-1 text-xs text-[#777f89]">{activeCount}/{labels.length} seções selecionadas</div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSections(DEFAULT_INTELLIGENCE_EXPORT)}
                  className="rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#aeb3b9] hover:text-white"
                >
                  Padrão
                </button>
                <button
                  type="button"
                  onClick={() => setSections(Object.fromEntries(labels.map(([k]) => [k, true])) as unknown as IntelligenceExportSelection)}
                  className="rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#aeb3b9] hover:text-white"
                >
                  Tudo
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {labels.map(([key, title, description]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={`rounded-[18px] border p-4 text-left transition ${
                    sections[key]
                      ? 'border-[#555d66] bg-[#15191c]'
                      : 'border-[#262b30] bg-[#0b0e10] opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[#eef0f1]">{title}</div>
                      <div className="mt-1.5 text-xs leading-relaxed text-[#7f8790]">{description}</div>
                    </div>
                    <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border ${
                      sections[key] ? 'border-[#d8dce0] bg-[#eceff1] text-[#0b0e10]' : 'border-[#4a5159]'
                    }`}>
                      {sections[key] && <Check className="h-3.5 w-3.5" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside>
            <div className="sticky top-8 rounded-[22px] border border-[#2b3035] bg-[#101316] p-5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#858d96]">Export formats</div>
              <div className="mt-4 grid gap-3">
                <button onClick={exportHtml} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] hover:bg-[#15191c]">
                  <FileCode2 className="h-5 w-5 text-[#cbd0d5]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#f1f2f3]">Enriched HTML</div>
                    <div className="mt-1 text-xs text-[#7f8790]">Melhor opção para leitura e impressão local.</div>
                  </div>
                  <Download className="h-4 w-4 text-[#767e87] group-hover:text-white" />
                </button>

                <button onClick={exportJson} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] hover:bg-[#15191c]">
                  <FileJson2 className="h-5 w-5 text-[#cbd0d5]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#f1f2f3]">Analytical JSON</div>
                    <div className="mt-1 text-xs text-[#7f8790]">Estrutura completa para integrações e automação.</div>
                  </div>
                  <Download className="h-4 w-4 text-[#767e87] group-hover:text-white" />
                </button>

                <button onClick={exportMarkdown} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] hover:bg-[#15191c]">
                  <FileCode2 className="h-5 w-5 text-[#cbd0d5]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#f1f2f3]">Markdown</div>
                    <div className="mt-1 text-xs text-[#7f8790]">Case notes, GitHub, Obsidian e documentação.</div>
                  </div>
                  <Download className="h-4 w-4 text-[#767e87] group-hover:text-white" />
                </button>

                <button onClick={exportCsv} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] hover:bg-[#15191c]">
                  <FileSpreadsheet className="h-5 w-5 text-[#cbd0d5]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[#f1f2f3]">Evidence CSV</div>
                    <div className="mt-1 text-xs text-[#7f8790]">Uma linha por finding com os três scores.</div>
                  </div>
                  <Download className="h-4 w-4 text-[#767e87] group-hover:text-white" />
                </button>
              </div>

              <div className="mt-5 border-t border-[#282d32] pt-4 text-xs leading-relaxed text-[#7f8790]">
                <b className="text-[#b9bec4]">Privacidade:</b> a geração ocorre no navegador. O relatório não precisa ser enviado a um serviço externo para ser montado.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
