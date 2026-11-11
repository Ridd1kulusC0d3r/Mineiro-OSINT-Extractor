import type { ScanResult } from '../types';
import { computeSha256 } from '../utils/scanStorage';
import { buildIntelligenceAssessment } from './assessment';
import type { IntelligenceRequirement } from './types';
import type { AnalysisLanguage } from './localization';
import { exportTokenCss } from '../theme/tokens';

export interface IntelligenceExportSelection {
  executiveAssessment: boolean;
  keyJudgments: boolean;
  collectionCoverage: boolean;
  highConfidenceFindings: boolean;
  evidenceMatrix: boolean;
  footprintClusters: boolean;
  correlationGraph: boolean;
  hypotheses: boolean;
  supportingEvidence: boolean;
  analyticLedger: boolean;
  contradictions: boolean;
  unresolvedFindings: boolean;
  gaps: boolean;
  timeline: boolean;
  pivots: boolean;
  collectionPlan: boolean;
  reliabilityHeatmap: boolean;
  methodology: boolean;
  provenance: boolean;
  technicalAppendix: boolean;
  integritySnapshot: boolean;
  exportManifest: boolean;
  rawResults: boolean;
}

export const DEFAULT_INTELLIGENCE_EXPORT: IntelligenceExportSelection = {
  executiveAssessment: true,
  keyJudgments: true,
  collectionCoverage: true,
  highConfidenceFindings: true,
  evidenceMatrix: true,
  footprintClusters: true,
  correlationGraph: true,
  hypotheses: true,
  supportingEvidence: true,
  analyticLedger: true,
  contradictions: true,
  unresolvedFindings: true,
  gaps: true,
  timeline: true,
  pivots: true,
  collectionPlan: true,
  reliabilityHeatmap: true,
  methodology: true,
  provenance: true,
  technicalAppendix: true,
  integritySnapshot: true,
  exportManifest: true,
  rawResults: false,
};

export interface ExportManifest {
  schema: 'mineiro.export-manifest.v1';
  generatedAt: string;
  target: string;
  intelligenceRequirement: IntelligenceRequirement;
  format: 'html' | 'json' | 'markdown' | 'csv';
  generatedLocally: true;
  included: string[];
  excluded: string[];
  payloadSha256: string;
  hashScope: 'payload-before-manifest';
  language: AnalysisLanguage;
}


const exportMessages = {
  en: {
    target:'Target', requirement:'Intelligence Requirement', confidence:'Assessment Confidence', coverage:'Effective Coverage',
    executive:'Executive Assessment', known:'Known', assessed:'Assessed', unknown:'Unknown',
    judgments:'Key Intelligence Judgments', basis:'Basis', collection:'Collection Coverage',
    requested:'Requested', completed:'Completed', found:'Found', absent:'Absent', uncertain:'Uncertain', rateLimited:'Rate limited', errors:'Errors',
    highFindings:'High-Confidence Findings', evidence:'Evidence Matrix', clusters:'Digital Footprint Clusters',
    graph:'Correlation Graph', hypotheses:'Identity Hypotheses', caveat:'Caveat', supporting:'Supporting Evidence',
    ledger:'Analytic Ledger', contradictions:'Contradictory Evidence', noContradiction:'No explicit contradiction observed; this is not confirmation.',
    unresolved:'Uncertain / Unresolved Findings', gaps:'Intelligence Gaps', timeline:'Timeline', pivots:'High-Value Pivots',
    signal:'Signal', reason:'Reason', plan:'Next Collection Plan', stop:'Stop condition', reliability:'Source & Detector Reliability',
    methodology:'Methodology', provenance:'Provenance', appendix:'Technical Appendix', integrity:'Integrity Snapshot',
    generated:'Generated locally by Mineiro.', publicEvidence:'Public evidence, analytical gaps and next actions.',
    reportManifest:'Export manifest', reportManifestDesc:'Companion manifest contains the payload SHA-256 and exact included/excluded sections.',
    source:'Source', findings:'findings', strong:'strong', weighted:'weighted', alternative:'ALTERNATIVE',
    supportingLabel:'Supporting', contradictoryLabel:'Contradictory', none:'none', high:'High', medium:'Medium', low:'Low',
    integrityNote:'SHA-256 is recorded in the export manifest over the payload before manifest insertion.',
    aiRule:'AI_SYNTHESIZED output never raises factual confidence by itself.',
    methodologyNote:'Same handle is a lead, not identity proof.',
  },
  pt: {
    target:'Alvo', requirement:'Requisito de Inteligência', confidence:'Confiança da Avaliação', coverage:'Cobertura Efetiva',
    executive:'Avaliação Executiva', known:'Conhecido', assessed:'Avaliado', unknown:'Desconhecido',
    judgments:'Julgamentos Principais de Inteligência', basis:'Base', collection:'Cobertura da Coleta',
    requested:'Solicitados', completed:'Concluídos', found:'Encontrados', absent:'Ausentes', uncertain:'Incertos', rateLimited:'Limitados por taxa', errors:'Erros',
    highFindings:'Achados de Alta Confiança', evidence:'Matriz de Evidência', clusters:'Clusters de Pegada Digital',
    graph:'Grafo de Correlação', hypotheses:'Hipóteses de Identidade', caveat:'Ressalva', supporting:'Evidência de Suporte',
    ledger:'Analytic Ledger', contradictions:'Evidência Contraditória', noContradiction:'Nenhuma contradição explícita foi observada; isso não equivale a confirmação.',
    unresolved:'Achados Incertos / Não Resolvidos', gaps:'Lacunas de Inteligência', timeline:'Linha do Tempo', pivots:'Pivôs de Alto Valor',
    signal:'Sinal', reason:'Razão', plan:'Próximo Plano de Coleta', stop:'Condição de parada', reliability:'Confiabilidade de Fonte e Detector',
    methodology:'Metodologia', provenance:'Proveniência', appendix:'Apêndice Técnico', integrity:'Snapshot de Integridade',
    generated:'Gerado localmente pelo Mineiro.', publicEvidence:'Evidência pública, lacunas analíticas e próximas ações.',
    reportManifest:'Manifesto de Exportação', reportManifestDesc:'O manifesto companheiro contém o SHA-256 do payload e a lista exata das seções incluídas/excluídas.',
    source:'Fonte', findings:'achados', strong:'fortes', weighted:'ponderado', alternative:'ALTERNATIVA',
    supportingLabel:'Suporte', contradictoryLabel:'Contraditório', none:'nenhum', high:'Alta', medium:'Média', low:'Baixa',
    integrityNote:'O SHA-256 é registrado no manifesto de exportação sobre o payload antes da inserção do manifesto.',
    aiRule:'A saída AI_SYNTHESIZED nunca eleva sozinha a confiança factual.',
    methodologyNote:'Mesmo username é um lead, não prova de identidade.',
  },
  es: {
    target:'Objetivo', requirement:'Requisito de Inteligencia', confidence:'Confianza de la Evaluación', coverage:'Cobertura Efectiva',
    executive:'Evaluación Ejecutiva', known:'Conocido', assessed:'Evaluado', unknown:'Desconocido',
    judgments:'Juicios Principales de Inteligencia', basis:'Base', collection:'Cobertura de Recolección',
    requested:'Solicitados', completed:'Completados', found:'Encontrados', absent:'Ausentes', uncertain:'Inciertos', rateLimited:'Limitados por tasa', errors:'Errores',
    highFindings:'Hallazgos de Alta Confianza', evidence:'Matriz de Evidencia', clusters:'Clusters de Huella Digital',
    graph:'Grafo de Correlación', hypotheses:'Hipótesis de Identidad', caveat:'Reserva', supporting:'Evidencia de Soporte',
    ledger:'Analytic Ledger', contradictions:'Evidencia Contradictoria', noContradiction:'No se observó ninguna contradicción explícita; esto no equivale a confirmación.',
    unresolved:'Hallazgos Inciertos / Sin Resolver', gaps:'Brechas de Inteligencia', timeline:'Línea Temporal', pivots:'Pivotes de Alto Valor',
    signal:'Señal', reason:'Razón', plan:'Próximo Plan de Recolección', stop:'Condición de parada', reliability:'Confiabilidad de Fuente y Detector',
    methodology:'Metodología', provenance:'Procedencia', appendix:'Apéndice Técnico', integrity:'Snapshot de Integridad',
    generated:'Generado localmente por Mineiro.', publicEvidence:'Evidencia pública, brechas analíticas y próximas acciones.',
    reportManifest:'Manifest de Exportación', reportManifestDesc:'El manifest adjunto contiene el SHA-256 del payload y la lista exacta de secciones incluidas/excluidas.',
    source:'Fuente', findings:'hallazgos', strong:'fuertes', weighted:'ponderado', alternative:'ALTERNATIVA',
    supportingLabel:'Soporte', contradictoryLabel:'Contradictorio', none:'ninguno', high:'Alta', medium:'Media', low:'Baja',
    integrityNote:'El SHA-256 se registra en el manifest de exportación sobre el payload antes de insertar el manifest.',
    aiRule:'La salida AI_SYNTHESIZED nunca eleva por sí sola la confianza factual.',
    methodologyNote:'El mismo username es un lead, no una prueba de identidad.',
  },
} as const;

function ex(language: AnalysisLanguage, key: keyof typeof exportMessages.en): string {
  return exportMessages[language][key];
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function selectionManifest(sections: IntelligenceExportSelection) {
  return {
    included: Object.entries(sections).filter(([, enabled]) => enabled).map(([key]) => key),
    excluded: Object.entries(sections).filter(([, enabled]) => !enabled).map(([key]) => key),
  };
}

export function buildIntelligenceBundle(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection,
  requirement: IntelligenceRequirement = 'account_correlation',
  language: AnalysisLanguage = 'en'
) {
  const assessment = buildIntelligenceAssessment(results, target || 'target', requirement, language);
  const selection = selectionManifest(sections);

  return {
    schema: 'mineiro.intelligence-report.v2',
    generatedAt: new Date().toISOString(),
    generatedLocally: true,
    language,
    target,
    intelligenceRequirement: assessment.intelligenceRequirement,
    intelligenceRequirementLabel: assessment.intelligenceRequirementLabel,
    assessment: sections.executiveAssessment ? {
      confidence: assessment.assessmentConfidence,
      knownAssessedUnknown: assessment.knownAssessedUnknown,
      coverage: assessment.collection.effectiveCoveragePercent,
      highValueFindings: assessment.highConfidenceFindings.length,
      unresolved: assessment.unresolvedFindings.length + assessment.collection.errors,
    } : undefined,
    judgments: sections.keyJudgments ? assessment.judgments : undefined,
    collection: sections.collectionCoverage ? assessment.collection : undefined,
    highConfidenceFindings: sections.highConfidenceFindings ? assessment.highConfidenceFindings : undefined,
    evidence: sections.evidenceMatrix ? assessment.evidence : undefined,
    clusters: sections.footprintClusters ? assessment.clusters : undefined,
    graph: sections.correlationGraph ? assessment.graph : undefined,
    hypotheses: sections.hypotheses ? assessment.hypotheses : undefined,
    supportingEvidence: sections.supportingEvidence ? assessment.supportingEvidence : undefined,
    analyticLedger: sections.analyticLedger ? assessment.analyticLedger : undefined,
    contradictions: sections.contradictions ? assessment.contradictoryEvidence : undefined,
    unresolvedFindings: sections.unresolvedFindings ? assessment.unresolvedFindings : undefined,
    gaps: sections.gaps ? assessment.gaps : undefined,
    timeline: sections.timeline ? assessment.timeline : undefined,
    pivots: sections.pivots ? assessment.pivots : undefined,
    collectionPlan: sections.collectionPlan ? { actions: assessment.collectionPlan, stopCondition: assessment.stopCondition } : undefined,
    reliability: sections.reliabilityHeatmap ? {
      heatmap: assessment.reliabilityHeatmap,
      sourceQualityNotes: assessment.sourceQualityNotes,
    } : undefined,
    methodology: sections.methodology ? {
      pipeline: ['COLLECTION','EVIDENCE','CORRELATION','HYPOTHESES','CONTRADICTIONS','ASSESSMENT','PIVOTS','COLLECTION_PLAN'],
      note: ex(language, 'methodologyNote'),
    } : undefined,
    provenance: sections.provenance ? {
      graph: assessment.provenanceGraph,
      rule: ex(language, 'aiRule'),
    } : undefined,
    technicalAppendix: sections.technicalAppendix ? assessment.technicalAppendix : undefined,
    integritySnapshot: sections.integritySnapshot ? {
      method: 'SHA-256',
      note: ex(language, 'integrityNote'),
    } : undefined,
    exportSelection: sections.exportManifest ? selection : undefined,
    rawResults: sections.rawResults ? results : undefined,
  };
}

export function generateIntelligenceJson(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection,
  requirement: IntelligenceRequirement = 'account_correlation',
  language: AnalysisLanguage = 'en'
): string {
  return JSON.stringify(buildIntelligenceBundle(target, results, sections, requirement, language), null, 2);
}

export function generateIntelligenceMarkdown(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection,
  requirement: IntelligenceRequirement = 'account_correlation',
  language: AnalysisLanguage = 'en'
): string {
  const a = buildIntelligenceAssessment(results, target || 'target', requirement, language);
  const lines = [
    '# MINEIRO USERNAME INTELLIGENCE — OPEN-SOURCE INTELLIGENCE ASSESSMENT','',
    `**${ex(language, 'target')}:** @${target}`,
    `**${ex(language, 'requirement')}:** ${a.intelligenceRequirementLabel}`,
    `**${ex(language, 'confidence')}:** ${a.assessmentConfidence}`,
    `**${ex(language, 'coverage')}:** ${a.collection.effectiveCoveragePercent}%`,''
  ];

  if (sections.executiveAssessment) {
    lines.push(`## 02 ${ex(language, 'executive')}`,'', `### ${ex(language, 'known')}`, ...a.knownAssessedUnknown.known.map(x=>`- ${x}`),'',`### ${ex(language, 'assessed')}`,...a.knownAssessedUnknown.assessed.map(x=>`- ${x}`),'',`### ${ex(language, 'unknown')}`,...a.knownAssessedUnknown.unknown.map(x=>`- ${x}`),'');
  }
  if (sections.keyJudgments) {
    lines.push(`## 03 ${ex(language, 'judgments')}`,'');
    a.judgments.forEach(j=>lines.push(`- **[${j.confidence}] ${j.id}** ${j.text}  `,`  ${ex(language, 'basis')}: ${j.basis}`)); lines.push('');
  }
  if (sections.collectionCoverage) {
    lines.push(`## 04 ${ex(language, 'collection')}`,'',`${ex(language, 'requested')}: ${a.collection.requested}`,`${ex(language, 'completed')}: ${a.collection.completed}`,`${ex(language, 'found')}: ${a.collection.found}`,`${ex(language, 'absent')}: ${a.collection.absent}`,`${ex(language, 'uncertain')}: ${a.collection.uncertain}`,`${ex(language, 'rateLimited')}: ${a.collection.rateLimited}`,`${ex(language, 'errors')}: ${a.collection.errors}`,'');
  }
  if (sections.highConfidenceFindings) {
    lines.push(`## 05 ${ex(language, 'highFindings')}`,'');
    a.highConfidenceFindings.forEach(e=>lines.push(`- **${e.platformName}** · Source ${e.sourceQuality} · IPS ${e.intelligencePriorityScore} · ${e.url}`)); lines.push('');
  }
  if (sections.evidenceMatrix) {
    lines.push(`## 06 ${ex(language, 'evidence')}`,'','| Finding | Status | Detector | Observation | Correlation | Source | IPS |','|---|---|---:|---:|---:|---|---:|');
    a.evidence.forEach(e=>lines.push(`| ${e.platformName} | ${e.status} | ${e.detectorConfidence} | ${e.observationConfidence} | ${e.correlationConfidence} | ${e.sourceQuality} | ${e.intelligencePriorityScore} |`)); lines.push('');
  }
  if (sections.footprintClusters) {
    lines.push(`## 07 ${ex(language, 'clusters')}`,'');
    a.clusters.forEach(c=>lines.push(`- **${c.category}** · findings ${c.findings} · strong ${c.strongFindings} · weighted ${c.weightedScore}`)); lines.push('');
  }
  if (sections.correlationGraph) {
    lines.push(`## 08 ${ex(language, 'graph')}`,'');
    a.graph.edges.forEach(e=>{const s=a.graph.nodes.find(n=>n.id===e.source)?.label||e.source;const d=a.graph.nodes.find(n=>n.id===e.target)?.label||e.target;lines.push(`- ${s} —[${e.relationship} / ${e.confidence}]→ ${d}`)}); lines.push('');
  }
  if (sections.hypotheses) {
    lines.push(`## 09 ${ex(language, 'hypotheses')}`,'');
    a.hypotheses.forEach(h=>lines.push(`### ${h.id} · ${h.confidence}${h.alternative?' · ALTERNATIVE':''}`,h.statement,'',`${ex(language, 'caveat')}: ${h.caveat}`,''));
  }
  if (sections.supportingEvidence) lines.push(`## 10 ${ex(language, 'supporting')}`,'',...a.supportingEvidence.map(x=>`- ${x}`),'');
  if (sections.analyticLedger) {
    lines.push(`### ${ex(language, 'ledger')}`,'');
    a.analyticLedger.forEach(e=>lines.push(`- **${e.id} [${e.confidence}]** ${e.claim} · supporting: ${e.supportingEvidenceIds.join(', ')||'none'} · contradictory: ${e.contradictoryEvidenceIds.join(', ')||'none'}`)); lines.push('');
  }
  if (sections.contradictions) lines.push(`## 11 ${ex(language, 'contradictions')}`,'',...(a.contradictoryEvidence.length?a.contradictoryEvidence:[ex(language, 'noContradiction')]).map(x=>`- ${x}`),'');
  if (sections.unresolvedFindings) lines.push(`## 12 ${ex(language, 'unresolved')}`,'',...a.unresolvedFindings.map(e=>`- ${e.platformName} · ${e.status} · ${e.whyItMatters}`),'');
  if (sections.gaps) lines.push(`## 13 ${ex(language, 'gaps')}`,'',...a.gaps.flatMap(g=>[`- **${g.severity} · ${g.id}** ${g.question}  `,`  ${g.reason}`]),'');
  if (sections.timeline) lines.push(`## 14 ${ex(language, 'timeline')}`,'',...a.timeline.map(e=>`- ${e.observedAt} · ${e.timestampKind} · ${e.platformName} · ${e.label}`),'');
  if (sections.pivots) lines.push(`## 15 ${ex(language, 'pivots')}`,'',...a.pivots.flatMap(p=>[`- **${p.priority} · IPS ${p.priorityScore}** ${p.action}  `,`  ${ex(language, 'signal')}: ${p.signal} · ${ex(language, 'reason')}: ${p.reason}`]),'');
  if (sections.collectionPlan) lines.push(`## 16 ${ex(language, 'plan')}`,'',...a.collectionPlan.map((x,i)=>`${i+1}. ${x}`),'',`**${ex(language, 'stop')}:** ${a.stopCondition}`,'');
  if (sections.reliabilityHeatmap) lines.push(`## 17 ${ex(language, 'reliability')}`,'',...a.sourceQualityNotes.map(x=>`- ${x}`),'');
  if (sections.methodology) lines.push(`## 18 ${ex(language, 'methodology')}`,'','COLLECTION → EVIDENCE → CORRELATION → HYPOTHESES → CONTRADICTIONS → ASSESSMENT → PIVOTS → COLLECTION PLAN','');
  if (sections.provenance) lines.push(`## 19 ${ex(language, 'provenance')}`,'',`Nodes: ${a.provenanceGraph.nodes.length} · edges: ${a.provenanceGraph.edges.length}`,'',ex(language, 'aiRule'),'');
  if (sections.technicalAppendix) lines.push(`## 20 ${ex(language, 'appendix')}`,'',`Detectors: ${a.technicalAppendix.detectorCount}`,`Evidence checks: ${a.technicalAppendix.evidenceChecksAvailable}`,'');
  if (sections.integritySnapshot) lines.push(`## 21 ${ex(language, 'integrity')}`,'',ex(language, 'integrityNote'),'');
  lines.push('---',ex(language, 'generated'));
  return lines.join('\n');
}

export function generateEvidenceCsv(
  target: string,
  results: ScanResult[],
  requirement: IntelligenceRequirement = 'account_correlation',
  language: AnalysisLanguage = 'en'
): string {
  const a = buildIntelligenceAssessment(results, target || 'target', requirement, language);
  const header = ['target','evidence_id','platform','category','status','detector_confidence','observation_confidence','correlation_confidence','source_quality','ips','provenance','url'];
  const q=(v:unknown)=>`"${String(v??'').replaceAll('"','""')}"`;
  return [header.join(','),...a.evidence.map(e=>[target,e.id,e.platformName,e.category,e.status,e.detectorConfidence,e.observationConfidence,e.correlationConfidence,e.sourceQuality,e.intelligencePriorityScore,e.provenance,e.url].map(q).join(','))].join('\n');
}

export function generateIntelligenceHtml(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection,
  requirement: IntelligenceRequirement = 'account_correlation',
  language: AnalysisLanguage = 'en'
): string {
  const a=buildIntelligenceAssessment(results,target||'target',requirement,language);
  const blocks:string[]=[];
  const section=(n:string,title:string,body:string)=>`<section><div class="eyebrow">${n}</div><h2>${escapeHtml(title)}</h2>${body}</section>`;
  const row=(left:string,title:string,detail:string)=>`<article class="row"><b>${escapeHtml(left)}</b><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(detail)}</p></div></article>`;

  if(sections.executiveAssessment) blocks.push(section(`02 · ${ex(language, 'executive').toUpperCase()}`,`${ex(language, 'known')} · ${ex(language, 'assessed')} · ${ex(language, 'unknown')}`,`<div class="cards"><article class="card"><b>KNOWN</b>${a.knownAssessedUnknown.known.map(x=>`<p>${escapeHtml(x)}</p>`).join('')}</article><article class="card"><b>ASSESSED</b>${a.knownAssessedUnknown.assessed.map(x=>`<p>${escapeHtml(x)}</p>`).join('')}</article><article class="card"><b>UNKNOWN</b>${a.knownAssessedUnknown.unknown.map(x=>`<p>${escapeHtml(x)}</p>`).join('')}</article></div>`));
  if(sections.keyJudgments) blocks.push(section(`03 · ${ex(language, 'judgments').toUpperCase()}`,ex(language, 'judgments'),a.judgments.map(j=>row(j.confidence,j.text,j.basis)).join('')));
  if(sections.collectionCoverage) blocks.push(section(`04 · ${ex(language, 'collection').toUpperCase()}`,ex(language, 'collection'),`<div class="metrics">${[['Requested',a.collection.requested],['Completed',a.collection.completed],['Conclusive',a.collection.found+a.collection.absent],['Inconclusive',a.collection.blockedOrInconclusive]].map(([l,v])=>`<div class="metric"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`));
  if(sections.highConfidenceFindings) blocks.push(section(`05 · ${ex(language, 'highFindings').toUpperCase()}`,ex(language, 'highFindings'),a.highConfidenceFindings.map(e=>row(`IPS ${e.intelligencePriorityScore}`,e.platformName,`Source ${e.sourceQuality} · ${e.url}`)).join('')));
  if(sections.evidenceMatrix) blocks.push(section(`06 · ${ex(language, 'evidence').toUpperCase()}`,ex(language, 'evidence'),`<div class="table"><div class="tr th"><span>Finding</span><span>Detector</span><span>Observation</span><span>Correlation</span><span>IPS</span></div>${a.evidence.map(e=>`<div class="tr"><span><b>${escapeHtml(e.platformName)}</b><small>${escapeHtml(e.sourceQuality)} · ${escapeHtml(e.provenance)}</small><small>${escapeHtml(e.url)}</small></span><span>${e.detectorConfidence}</span><span>${e.observationConfidence}</span><span>${e.correlationConfidence}</span><span>${e.intelligencePriorityScore}</span></div>`).join('')}</div>`));
  if(sections.footprintClusters) blocks.push(section(`07 · ${ex(language, 'clusters').toUpperCase()}`,ex(language, 'clusters'),`<div class="cards">${a.clusters.map(c=>`<article class="card"><b>${escapeHtml(c.category)}</b><p>${c.findings} findings · ${c.strongFindings} strong · weighted ${c.weightedScore}</p><small>${escapeHtml(c.overlaps.map(o=>`${c.category}↔${o.withCategory}: ${o.sharedSignals.join(', ')}`).join(' | '))}</small></article>`).join('')}</div>`));
  if(sections.correlationGraph) blocks.push(section(`08 · ${ex(language, 'graph').toUpperCase()}`,ex(language, 'graph'),a.graph.edges.slice(0,40).map(e=>{const s=a.graph.nodes.find(n=>n.id===e.source)?.label||e.source;const d=a.graph.nodes.find(n=>n.id===e.target)?.label||e.target;return row(String(e.confidence),`${s} → ${d}`,`${e.relationship} · ${e.provenance} · ${e.evidenceId||''}`)}).join('')));
  if(sections.hypotheses) blocks.push(section(`09 · ${ex(language, 'hypotheses').toUpperCase()}`,ex(language, 'hypotheses'),`<div class="cards">${a.hypotheses.map(h=>`<article class="card"><b>${escapeHtml(h.id)} · ${escapeHtml(h.confidence)}${h.alternative?' · ALTERNATIVE':''}</b><p>${escapeHtml(h.statement)}</p><small>${escapeHtml(h.caveat)}</small></article>`).join('')}</div>`));
  if(sections.supportingEvidence||sections.analyticLedger) blocks.push(section('10 · SUPPORTING EVIDENCE','Supporting evidence & analytic ledger',a.analyticLedger.map(e=>row(e.id,e.claim,`Supporting: ${e.supportingEvidenceIds.join(', ')||'none'} · Contradictory: ${e.contradictoryEvidenceIds.join(', ')||'none'}`)).join('')));
  if(sections.contradictions) blocks.push(section(`11 · ${ex(language, 'contradictions').toUpperCase()}`,ex(language, 'contradictions'),(a.contradictoryEvidence.length?a.contradictoryEvidence:[ex(language, 'noContradiction')]).map(x=>`<p>• ${escapeHtml(x)}</p>`).join('')));
  if(sections.unresolvedFindings) blocks.push(section(`12 · ${ex(language, 'unresolved').toUpperCase()}`,ex(language, 'unresolved'),a.unresolvedFindings.map(e=>row(e.status.toUpperCase(),e.platformName,e.whyItMatters)).join('')));
  if(sections.gaps) blocks.push(section(`13 · ${ex(language, 'gaps').toUpperCase()}`,ex(language, 'gaps'),`<div class="cards">${a.gaps.map(g=>`<article class="card"><b>${g.id} · ${g.severity}</b><p>${escapeHtml(g.question)}</p><small>${escapeHtml(g.reason)}</small></article>`).join('')}</div>`));
  if(sections.timeline) blocks.push(section(`14 · ${ex(language, 'timeline').toUpperCase()}`,ex(language, 'timeline'),a.timeline.map(e=>row(e.timestampKind,e.platformName,`${e.observedAt} · ${e.label}`)).join('')));
  if(sections.pivots) blocks.push(section(`15 · ${ex(language, 'pivots').toUpperCase()}`,ex(language, 'pivots'),a.pivots.map(p=>row(`${p.priority} · ${p.priorityScore}`,p.action,`${p.signal} · ${p.reason}`)).join('')));
  if(sections.collectionPlan) blocks.push(section(`16 · ${ex(language, 'plan').toUpperCase()}`,ex(language, 'plan'),`<ol>${a.collectionPlan.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol><div class="stop"><b>STOP CONDITION</b><p>${escapeHtml(a.stopCondition)}</p></div>`));
  if(sections.reliabilityHeatmap) blocks.push(section(`17 · ${ex(language, 'reliability').toUpperCase()}`,ex(language, 'reliability'),`<div class="cards">${a.reliabilityHeatmap.map(x=>`<article class="card"><b>${escapeHtml(x.category)}</b><p>High ${x.high} · Medium ${x.medium} · Low ${x.low}</p></article>`).join('')}</div>`));
  if(sections.methodology) blocks.push(section(`18 · ${ex(language, 'methodology').toUpperCase()}`,ex(language, 'methodology'),'<p>COLLECTION → EVIDENCE → CORRELATION → HYPOTHESES → CONTRADICTIONS → ASSESSMENT → PIVOTS → COLLECTION PLAN</p>'));
  if(sections.provenance) blocks.push(section(`19 · ${ex(language, 'provenance').toUpperCase()}`,ex(language, 'provenance'),`<p>${a.provenanceGraph.nodes.length} nodes · ${a.provenanceGraph.edges.length} derivation edges.</p><p>AI_SYNTHESIZED output never raises factual confidence by itself.</p>`));
  if(sections.technicalAppendix) blocks.push(section(`20 · ${ex(language, 'appendix').toUpperCase()}`,ex(language, 'appendix'),`<pre>${escapeHtml(JSON.stringify(a.technicalAppendix,null,2))}</pre>`));
  if(sections.integritySnapshot) blocks.push(section(`21 · ${ex(language, 'integrity').toUpperCase()}`,ex(language, 'integrity'),'<p>SHA-256 is recorded in the export manifest over the payload before manifest insertion.</p>'));

  return `<!doctype html><html lang="${language === 'pt' ? 'pt-BR' : language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mineiro Username Intelligence Report — ${escapeHtml(target)}</title><style>
${exportTokenCss()}
  *{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.6 var(--sans);-webkit-font-smoothing:antialiased}.wrap{max-width:1180px;margin:auto;padding:0 40px 90px}header.mast{margin:0 -40px;padding:56px 40px 40px;border-bottom:1px solid var(--rule);background:radial-gradient(900px 340px at 88% -10%,var(--signal-soft),transparent 70%),linear-gradient(var(--grid-line,transparent) 1px,transparent 1px) 0 0/100% 32px,linear-gradient(90deg,var(--grid-line,transparent) 1px,transparent 1px) 0 0/32px 100%,var(--paper)}.eyebrow{display:inline-block;font:700 10.5px/1.5 var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--signal);background:var(--signal-soft);border-radius:999px;padding:3px 10px}h1{font:800 clamp(34px,5vw,60px)/1.02 var(--sans);letter-spacing:-.035em;max-width:1000px;margin:16px 0}h2{font:750 25px/1.2 var(--sans);letter-spacing:-.02em;margin:12px 0 18px}.lead{font-size:18px;color:var(--ink-2);max-width:850px;margin:0}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:28px 0 0}.metric,.card{position:relative;overflow:hidden;border:1px solid var(--rule-2);background:var(--card);border-radius:14px;padding:18px 20px;box-shadow:0 1px 2px rgba(0,0,0,.06)}.metric:before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--signal)}.metric b{display:block;font:700 30px/1 var(--mono);letter-spacing:-.04em}.metric span{display:block;margin:0 0 10px;font:600 10.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3)}.row{display:grid;grid-template-columns:150px 1fr;gap:20px;padding:14px 0;border-bottom:1px solid var(--rule-2)}.row>b{font:600 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);padding-top:3px}.row p,.card small{color:var(--ink-3)}.row p{margin:4px 0 0}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.card b{font-family:var(--mono);font-size:12px;letter-spacing:.04em}.table{border:1px solid var(--rule-2);border-radius:14px;overflow:hidden;background:var(--card)}.tr{display:grid;grid-template-columns:1.5fr repeat(4,.7fr);gap:12px;padding:12px 18px;border-bottom:1px solid var(--rule-2);font-variant-numeric:tabular-nums}.tr:last-child{border-bottom:0}.tr small{display:block;color:var(--ink-3);font:11px var(--mono)}.th{font:600 10.5px var(--mono);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);border-bottom-color:var(--rule)}section{padding:40px 0;border-top:1px solid var(--rule-2)}header+section{border-top:0}.stop,pre{border:1px solid var(--rule-2);border-left:3px solid var(--signal);border-radius:9px;padding:16px;overflow:auto;background:var(--card)}pre{font:12px/1.5 var(--mono);color:var(--ink-2)}a{color:var(--ink);text-decoration-color:var(--signal)}@media(max-width:800px){.wrap{padding:0 18px 60px}header.mast{margin:0 -18px;padding:32px 18px}.metrics,.cards{grid-template-columns:1fr 1fr}.tr,.row{grid-template-columns:1fr}}@media print{.wrap{max-width:none;padding:0}header.mast{margin:0;padding:0 0 24px;background:var(--paper)}.metric,.card,.table,.stop,pre{box-shadow:none}section{break-inside:avoid}}
  </style></head><body><main class="wrap"><header class="mast"><div class="eyebrow">MINEIRO USERNAME INTELLIGENCE · OPEN-SOURCE INTELLIGENCE ASSESSMENT</div><h1>${escapeHtml(ex(language, 'publicEvidence'))}</h1><p class="lead">${escapeHtml(ex(language, 'target'))}: @${escapeHtml(target)} · ${escapeHtml(ex(language, 'requirement'))}: ${escapeHtml(a.intelligenceRequirementLabel)} · ${escapeHtml(ex(language, 'confidence'))}: ${a.assessmentConfidence} · ${escapeHtml(ex(language, 'coverage'))}: ${a.collection.effectiveCoveragePercent}%</p></header>${blocks.join('')}<section><div class="eyebrow">22 · EXPORT MANIFEST</div><h2>${escapeHtml(ex(language, 'reportManifest'))}</h2><div id="mineiro-export-manifest">${escapeHtml(ex(language, 'reportManifestDesc'))}</div></section></main></body></html>`;
}

export async function createExportManifest(
  target: string,
  requirement: IntelligenceRequirement,
  sections: IntelligenceExportSelection,
  format: ExportManifest['format'],
  payload: string,
  language: AnalysisLanguage = 'en'
): Promise<ExportManifest> {
  const selection=selectionManifest(sections);
  return {
    schema:'mineiro.export-manifest.v1',
    generatedAt:new Date().toISOString(),
    target,
    intelligenceRequirement:requirement,
    format,
    generatedLocally:true,
    included:selection.included,
    excluded:selection.excluded,
    payloadSha256:await computeSha256(payload),
    hashScope:'payload-before-manifest',
    language,
  };
}
