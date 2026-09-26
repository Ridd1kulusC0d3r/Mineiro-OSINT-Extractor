import { useMemo, useState } from 'react';
import { Check, Download, FileCode2, FileJson2, FileSpreadsheet, X } from 'lucide-react';
import type { ScanResult } from '../types';
import type { IntelligenceRequirement } from '../intelligence/types';
import {
  DEFAULT_INTELLIGENCE_EXPORT,
  createExportManifest,
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
  requirement: IntelligenceRequirement;
}

const labels: Array<[keyof IntelligenceExportSelection, string, string]> = [
  ['executiveAssessment', 'Executive assessment', 'Known, Assessed e Unknown.'],
  ['keyJudgments', 'Key intelligence judgments', 'Conclusões prioritárias com basis e confidence.'],
  ['collectionCoverage', 'Collection coverage', 'Cobertura, erros, incerteza e rate limits.'],
  ['highConfidenceFindings', 'High-confidence findings', 'Achados fortes priorizados por IPS.'],
  ['evidenceMatrix', 'Evidence matrix', 'Detector, observação, correlação, source e IPS.'],
  ['footprintClusters', 'Footprint clusters', 'Clusters e cross-cluster overlap.'],
  ['correlationGraph', 'Correlation graph', 'Relações públicas com confidence e provenance.'],
  ['hypotheses', 'Identity hypotheses', 'Hipóteses principal, por cluster e alternativa.'],
  ['supportingEvidence', 'Supporting evidence', 'Evidências que sustentam claims.'],
  ['analyticLedger', 'Analytic ledger', 'Rastreabilidade entre claims e evidence IDs.'],
  ['contradictions', 'Contradictory evidence', 'Evidência contra correlação.'],
  ['unresolvedFindings', 'Unresolved findings', 'Resultados inconclusivos separados.'],
  ['gaps', 'Intelligence gaps', 'Perguntas capazes de alterar a avaliação.'],
  ['timeline', 'Intelligence timeline', 'Tipos de timestamp separados.'],
  ['pivots', 'High-value pivots', 'Próximas ações por valor esperado.'],
  ['collectionPlan', 'Next collection plan', 'Prioridades e stop condition.'],
  ['reliabilityHeatmap', 'Source & detector reliability', 'Heatmap e notas de qualidade.'],
  ['methodology', 'Methodology', 'Pipeline analítico explícito.'],
  ['provenance', 'Provenance graph', 'PRIMARY, DERIVED, EXTERNAL e AI.'],
  ['technicalAppendix', 'Technical appendix', 'Contagens, checks e distribuição.'],
  ['integritySnapshot', 'Integrity snapshot', 'Referência ao SHA-256 do payload.'],
  ['exportManifest', 'Export manifest', 'Incluídos, excluídos, formato e hash.'],
  ['rawResults', 'Raw results', 'Dados brutos. Desligado por padrão.'],
];

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function IntelligenceExportModal({
  isOpen,
  onClose,
  target,
  results,
  requirement,
}: IntelligenceExportModalProps) {
  const [sections, setSections] = useState<IntelligenceExportSelection>(DEFAULT_INTELLIGENCE_EXPORT);
  const [isExporting, setIsExporting] = useState(false);
  const activeCount = useMemo(() => Object.values(sections).filter(Boolean).length, [sections]);

  if (!isOpen) return null;

  const toggle = (key: keyof IntelligenceExportSelection) =>
    setSections((current) => ({ ...current, [key]: !current[key] }));

  const doExport = async (
    format: 'html' | 'json' | 'markdown' | 'csv',
    extension: string,
    mime: string,
    producer: () => string
  ) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const base = `mineiro-intelligence-${target || 'report'}-${stamp}`;
      const payload = producer();
      const manifest = await createExportManifest(target, requirement, sections, format, payload);
      download(`${base}.${extension}`, payload, mime);
      download(`${base}.manifest.json`, JSON.stringify(manifest, null, 2), 'application/json;charset=utf-8');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="mx-auto max-w-6xl rounded-[26px] border border-[#2c3136] bg-[#0e1113] shadow-2xl">
        <div className="flex items-start justify-between gap-6 border-b border-[#262b30] px-6 py-6 md:px-8">
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#969da7]">
              Report export · local only · {requirement}
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#f4f5f6]">Monte o relatório antes de exportar.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#8f969f]">
              Cada export gera o arquivo principal e um manifest JSON separado com SHA-256 do payload, formato e lista exata de seções incluídas e excluídas.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#30363c] p-2.5 text-[#a7adb5] hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-8 px-6 py-7 md:px-8 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div><div className="text-sm font-medium text-[#eff1f2]">Conteúdo do relatório</div><div className="mt-1 text-xs text-[#777f89]">{activeCount}/{labels.length} seções selecionadas</div></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSections(DEFAULT_INTELLIGENCE_EXPORT)} className="rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#aeb3b9] hover:text-white">Padrão</button>
                <button type="button" onClick={() => setSections(Object.fromEntries(labels.map(([k]) => [k, true])) as unknown as IntelligenceExportSelection)} className="rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#aeb3b9] hover:text-white">Tudo</button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {labels.map(([key, title, description]) => (
                <button key={key} type="button" onClick={() => toggle(key)} className={`rounded-[18px] border p-4 text-left transition ${sections[key] ? 'border-[#555d66] bg-[#15191c]' : 'border-[#262b30] bg-[#0b0e10] opacity-65'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="text-sm font-medium text-[#eef0f1]">{title}</div><div className="mt-1.5 text-xs leading-relaxed text-[#7f8790]">{description}</div></div>
                    <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border ${sections[key] ? 'border-[#d8dce0] bg-[#eceff1] text-[#0b0e10]' : 'border-[#4a5159]'}`}>{sections[key] && <Check className="h-3.5 w-3.5" />}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <aside>
            <div className="sticky top-8 rounded-[22px] border border-[#2b3035] bg-[#101316] p-5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#858d96]">Export formats</div>
              <div className="mt-4 grid gap-3">
                <button disabled={isExporting} onClick={() => doExport('html','html','text/html;charset=utf-8',()=>generateIntelligenceHtml(target,results,sections,requirement))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileCode2 className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">Enriched HTML</div><div className="mt-1 text-xs text-[#7f8790]">Leitura e impressão local.</div></div><Download className="h-4 w-4" />
                </button>
                <button disabled={isExporting} onClick={() => doExport('json','json','application/json;charset=utf-8',()=>generateIntelligenceJson(target,results,sections,requirement))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileJson2 className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">Analytical JSON</div><div className="mt-1 text-xs text-[#7f8790]">Integrações e automação.</div></div><Download className="h-4 w-4" />
                </button>
                <button disabled={isExporting} onClick={() => doExport('markdown','md','text/markdown;charset=utf-8',()=>generateIntelligenceMarkdown(target,results,sections,requirement))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileCode2 className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">Markdown</div><div className="mt-1 text-xs text-[#7f8790]">Case notes e documentação.</div></div><Download className="h-4 w-4" />
                </button>
                <button disabled={isExporting} onClick={() => doExport('csv','csv','text/csv;charset=utf-8',()=>generateEvidenceCsv(target,results,requirement))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileSpreadsheet className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">Evidence CSV</div><div className="mt-1 text-xs text-[#7f8790]">Finding, scores, source quality, IPS e provenance.</div></div><Download className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 border-t border-[#282d32] pt-4 text-xs leading-relaxed text-[#7f8790]">
                <b className="text-[#b9bec4]">Integridade:</b> o manifest calcula SHA-256 sobre o payload antes da inserção do próprio manifest. Isso verifica integridade do arquivo, não autoria ou identidade.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
