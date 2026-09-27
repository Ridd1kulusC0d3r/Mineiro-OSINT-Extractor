import { useMemo, useState } from 'react';
import { Check, Download, FileCode2, FileJson2, FileSpreadsheet, X } from 'lucide-react';
import type { ScanResult } from '../types';
import type { IntelligenceRequirement } from '../intelligence/types';
import { useI18n } from '../utils/i18n';
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

const labelsByLanguage: Record<'en' | 'pt' | 'es', Array<[keyof IntelligenceExportSelection, string, string]>> = {
  en: [
    ['executiveAssessment', 'Executive assessment', 'Known, Assessed and Unknown.'],
    ['keyJudgments', 'Key intelligence judgments', 'Priority conclusions with basis and confidence.'],
    ['collectionCoverage', 'Collection coverage', 'Coverage, errors, uncertainty and rate limits.'],
    ['highConfidenceFindings', 'High-confidence findings', 'Strong findings prioritized by IPS.'],
    ['evidenceMatrix', 'Evidence matrix', 'Detector, observation, correlation, source and IPS.'],
    ['footprintClusters', 'Footprint clusters', 'Clusters and cross-cluster overlap.'],
    ['correlationGraph', 'Correlation graph', 'Public relationships with confidence and provenance.'],
    ['hypotheses', 'Identity hypotheses', 'Primary, cluster and alternative hypotheses.'],
    ['supportingEvidence', 'Supporting evidence', 'Evidence supporting analytical claims.'],
    ['analyticLedger', 'Analytic ledger', 'Traceability between claims and evidence IDs.'],
    ['contradictions', 'Contradictory evidence', 'Evidence against correlation.'],
    ['unresolvedFindings', 'Unresolved findings', 'Inconclusive findings kept separate.'],
    ['gaps', 'Intelligence gaps', 'Questions capable of changing the assessment.'],
    ['timeline', 'Intelligence timeline', 'Separated timestamp types.'],
    ['pivots', 'High-value pivots', 'Next actions ordered by expected value.'],
    ['collectionPlan', 'Next collection plan', 'Priorities and stop condition.'],
    ['reliabilityHeatmap', 'Source & detector reliability', 'Heatmap and quality notes.'],
    ['methodology', 'Methodology', 'Explicit analytical pipeline.'],
    ['provenance', 'Provenance graph', 'PRIMARY, DERIVED, EXTERNAL and AI.'],
    ['technicalAppendix', 'Technical appendix', 'Counts, checks and distributions.'],
    ['integritySnapshot', 'Integrity snapshot', 'Reference to the payload SHA-256.'],
    ['exportManifest', 'Export manifest', 'Included, excluded, format and hash.'],
    ['rawResults', 'Raw results', 'Raw data. Disabled by default.'],
  ],
  pt: [
    ['executiveAssessment', 'Avaliação executiva', 'Conhecido, Avaliado e Desconhecido.'],
    ['keyJudgments', 'Julgamentos principais de inteligência', 'Conclusões prioritárias com base e confiança.'],
    ['collectionCoverage', 'Cobertura da coleta', 'Cobertura, erros, incerteza e rate limits.'],
    ['highConfidenceFindings', 'Achados de alta confiança', 'Achados fortes priorizados por IPS.'],
    ['evidenceMatrix', 'Matriz de evidência', 'Detector, observação, correlação, fonte e IPS.'],
    ['footprintClusters', 'Clusters de pegada', 'Clusters e sobreposição entre clusters.'],
    ['correlationGraph', 'Grafo de correlação', 'Relações públicas com confiança e proveniência.'],
    ['hypotheses', 'Hipóteses de identidade', 'Hipótese principal, por cluster e alternativa.'],
    ['supportingEvidence', 'Evidência de suporte', 'Evidências que sustentam os claims.'],
    ['analyticLedger', 'Analytic ledger', 'Rastreabilidade entre claims e IDs de evidência.'],
    ['contradictions', 'Evidência contraditória', 'Evidência contra correlação.'],
    ['unresolvedFindings', 'Achados não resolvidos', 'Resultados inconclusivos separados.'],
    ['gaps', 'Lacunas de inteligência', 'Perguntas capazes de alterar a avaliação.'],
    ['timeline', 'Timeline de inteligência', 'Tipos de timestamp separados.'],
    ['pivots', 'Pivôs de alto valor', 'Próximas ações por valor esperado.'],
    ['collectionPlan', 'Próximo plano de coleta', 'Prioridades e condição de parada.'],
    ['reliabilityHeatmap', 'Confiabilidade de fonte e detector', 'Heatmap e notas de qualidade.'],
    ['methodology', 'Metodologia', 'Pipeline analítico explícito.'],
    ['provenance', 'Grafo de proveniência', 'PRIMARY, DERIVED, EXTERNAL e IA.'],
    ['technicalAppendix', 'Apêndice técnico', 'Contagens, checks e distribuição.'],
    ['integritySnapshot', 'Snapshot de integridade', 'Referência ao SHA-256 do payload.'],
    ['exportManifest', 'Manifesto de exportação', 'Incluídos, excluídos, formato e hash.'],
    ['rawResults', 'Resultados brutos', 'Dados brutos. Desligados por padrão.'],
  ],
  es: [
    ['executiveAssessment', 'Evaluación ejecutiva', 'Conocido, Evaluado y Desconocido.'],
    ['keyJudgments', 'Juicios principales de inteligencia', 'Conclusiones prioritarias con base y confianza.'],
    ['collectionCoverage', 'Cobertura de recolección', 'Cobertura, errores, incertidumbre y rate limits.'],
    ['highConfidenceFindings', 'Hallazgos de alta confianza', 'Hallazgos fuertes priorizados por IPS.'],
    ['evidenceMatrix', 'Matriz de evidencia', 'Detector, observación, correlación, fuente e IPS.'],
    ['footprintClusters', 'Clusters de huella', 'Clusters y superposición entre clusters.'],
    ['correlationGraph', 'Grafo de correlación', 'Relaciones públicas con confianza y procedencia.'],
    ['hypotheses', 'Hipótesis de identidad', 'Hipótesis principal, por cluster y alternativa.'],
    ['supportingEvidence', 'Evidencia de soporte', 'Evidencia que sustenta los claims.'],
    ['analyticLedger', 'Analytic ledger', 'Trazabilidad entre claims e IDs de evidencia.'],
    ['contradictions', 'Evidencia contradictoria', 'Evidencia contra la correlación.'],
    ['unresolvedFindings', 'Hallazgos sin resolver', 'Resultados inconclusos separados.'],
    ['gaps', 'Brechas de inteligencia', 'Preguntas capaces de cambiar la evaluación.'],
    ['timeline', 'Línea temporal de inteligencia', 'Tipos de timestamp separados.'],
    ['pivots', 'Pivotes de alto valor', 'Próximas acciones por valor esperado.'],
    ['collectionPlan', 'Próximo plan de recolección', 'Prioridades y condición de parada.'],
    ['reliabilityHeatmap', 'Confiabilidad de fuente y detector', 'Heatmap y notas de calidad.'],
    ['methodology', 'Metodología', 'Pipeline analítico explícito.'],
    ['provenance', 'Grafo de procedencia', 'PRIMARY, DERIVED, EXTERNAL e IA.'],
    ['technicalAppendix', 'Apéndice técnico', 'Conteos, checks y distribución.'],
    ['integritySnapshot', 'Snapshot de integridad', 'Referencia al SHA-256 del payload.'],
    ['exportManifest', 'Manifest de exportación', 'Incluidos, excluidos, formato y hash.'],
    ['rawResults', 'Resultados brutos', 'Datos brutos. Desactivados por defecto.'],
  ],
};

function download

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
  const { tr, language } = useI18n();
  const labels = labelsByLanguage[language];
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
      const manifest = await createExportManifest(target, requirement, sections, format, payload, language);
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
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#f4f5f6]">{tr('export.title')}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#8f969f]">
              {tr('export.subtitle')}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-[#30363c] p-2.5 text-[#a7adb5] hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        <div className="grid gap-8 px-6 py-7 md:px-8 lg:grid-cols-[1.25fr_.75fr]">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div><div className="text-sm font-medium text-[#eff1f2]">{tr('export.content')}</div><div className="mt-1 text-xs text-[#777f89]">{activeCount}/{labels.length} {tr('export.sectionsSelected')}</div></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setSections(DEFAULT_INTELLIGENCE_EXPORT)} className="rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#aeb3b9] hover:text-white">{tr('export.default')}</button>
                <button type="button" onClick={() => setSections(Object.fromEntries(labels.map(([k]) => [k, true])) as unknown as IntelligenceExportSelection)} className="rounded-lg border border-[#30363c] px-3 py-2 text-xs text-[#aeb3b9] hover:text-white">{tr('export.all')}</button>
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
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.17em] text-[#858d96]">{tr('export.formats')}</div>
              <div className="mt-4 grid gap-3">
                <button disabled={isExporting} onClick={() => doExport('html','html','text/html;charset=utf-8',()=>generateIntelligenceHtml(target,results,sections,requirement,language))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileCode2 className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">{tr('export.html')}</div><div className="mt-1 text-xs text-[#7f8790]">{tr('export.htmlDesc')}</div></div><Download className="h-4 w-4" />
                </button>
                <button disabled={isExporting} onClick={() => doExport('json','json','application/json;charset=utf-8',()=>generateIntelligenceJson(target,results,sections,requirement,language))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileJson2 className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">{tr('export.json')}</div><div className="mt-1 text-xs text-[#7f8790]">{tr('export.jsonDesc')}</div></div><Download className="h-4 w-4" />
                </button>
                <button disabled={isExporting} onClick={() => doExport('markdown','md','text/markdown;charset=utf-8',()=>generateIntelligenceMarkdown(target,results,sections,requirement,language))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileCode2 className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">Markdown</div><div className="mt-1 text-xs text-[#7f8790]">{tr('export.markdownDesc')}</div></div><Download className="h-4 w-4" />
                </button>
                <button disabled={isExporting} onClick={() => doExport('csv','csv','text/csv;charset=utf-8',()=>generateEvidenceCsv(target,results,requirement,language))} className="group flex items-center gap-4 rounded-[16px] border border-[#343a40] p-4 text-left hover:border-[#606873] disabled:opacity-50">
                  <FileSpreadsheet className="h-5 w-5 text-[#cbd0d5]" /><div className="flex-1"><div className="text-sm font-medium text-[#f1f2f3]">{tr('export.csv')}</div><div className="mt-1 text-xs text-[#7f8790]">{tr('export.csvDesc')}</div></div><Download className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 border-t border-[#282d32] pt-4 text-xs leading-relaxed text-[#7f8790]">
                <b className="text-[#b9bec4]">{tr('export.integrity')}:</b> {tr('export.integrityDesc')}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
