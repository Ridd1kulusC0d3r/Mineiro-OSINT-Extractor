import type { ScanResult } from '../types';
import { buildIntelligenceAssessment } from './assessment';

export interface IntelligenceExportSelection {
  executiveAssessment: boolean;
  keyJudgments: boolean;
  collectionCoverage: boolean;
  highConfidenceFindings: boolean;
  evidenceMatrix: boolean;
  footprintClusters: boolean;
  correlationGraph: boolean;
  timeline: boolean;
  reliabilityHeatmap: boolean;
  analyticLedger: boolean;
  hypotheses: boolean;
  contradictions: boolean;
  gaps: boolean;
  pivots: boolean;
  collectionPlan: boolean;
  methodology: boolean;
  provenance: boolean;
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
  timeline: true,
  reliabilityHeatmap: true,
  analyticLedger: true,
  hypotheses: true,
  contradictions: true,
  gaps: true,
  pivots: true,
  collectionPlan: true,
  methodology: true,
  provenance: true,
  rawResults: false,
};

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function buildIntelligenceBundle(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection
) {
  const assessment = buildIntelligenceAssessment(results, target || 'target');
  const included = Object.entries(sections).filter(([, enabled]) => enabled).map(([key]) => key);
  const excluded = Object.entries(sections).filter(([, enabled]) => !enabled).map(([key]) => key);

  return {
    schema: 'mineiro.intelligence-report.v1',
    generatedAt: new Date().toISOString(),
    generatedLocally: true,
    target,
    intelligenceRequirement: 'Public account correlation and digital-footprint assessment',
    manifest: {
      included,
      excluded,
      integrity: 'Generate SHA-256 snapshot from Mineiro export workflow when evidentiary sealing is required.',
    },
    assessment: sections.executiveAssessment ? {
      confidence: assessment.judgments[0]?.confidence ?? 'LOW',
      coverage: assessment.collection.effectiveCoveragePercent,
      highValueFindings: assessment.evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH').length,
      unresolved: assessment.collection.uncertain + assessment.collection.rateLimited + assessment.collection.errors,
    } : undefined,
    judgments: sections.keyJudgments ? assessment.judgments : undefined,
    collection: sections.collectionCoverage ? assessment.collection : undefined,
    highConfidenceFindings: sections.highConfidenceFindings
      ? assessment.evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH')
      : undefined,
    evidence: sections.evidenceMatrix ? assessment.evidence : undefined,
    clusters: sections.footprintClusters ? assessment.clusters : undefined,
    graph: sections.correlationGraph ? assessment.graph : undefined,
    timeline: sections.timeline ? assessment.timeline : undefined,
    reliabilityHeatmap: sections.reliabilityHeatmap ? assessment.reliabilityHeatmap : undefined,
    analyticLedger: sections.analyticLedger ? assessment.analyticLedger : undefined,
    hypotheses: sections.hypotheses ? assessment.hypotheses : undefined,
    contradictions: sections.contradictions ? assessment.contradictoryEvidence : undefined,
    gaps: sections.gaps ? assessment.gaps : undefined,
    pivots: sections.pivots ? assessment.pivots : undefined,
    collectionPlan: sections.collectionPlan ? {
      actions: assessment.collectionPlan,
      stopCondition: assessment.stopCondition,
    } : undefined,
    methodology: sections.methodology ? assessment.sourceQualityNotes : undefined,
    provenance: sections.provenance ? {
      evidenceModel: 'primary observation + derived analytical assessment',
      note: 'AI-synthesized content must remain labeled as hypothesis and cannot independently raise factual confidence.',
    } : undefined,
    rawResults: sections.rawResults ? results : undefined,
  };
}

export function generateIntelligenceJson(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection
): string {
  return JSON.stringify(buildIntelligenceBundle(target, results, sections), null, 2);
}

export function generateIntelligenceMarkdown(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection
): string {
  const a = buildIntelligenceAssessment(results, target || 'target');
  const lines: string[] = [
    '# MINEIRO — OPEN-SOURCE INTELLIGENCE ASSESSMENT',
    '',
    `**Target:** @${target}`,
    `**Generated:** ${new Date().toISOString()}`,
    `**Assessment confidence:** ${a.judgments[0]?.confidence ?? 'LOW'}`,
    `**Effective collection coverage:** ${a.collection.effectiveCoveragePercent}%`,
    '',
  ];

  if (sections.keyJudgments) {
    lines.push('## Key Intelligence Judgments', '');
    a.judgments.forEach((j) => lines.push(`- **[${j.confidence}]** ${j.text}  `, `  Basis: ${j.basis}`));
    lines.push('');
  }
  if (sections.collectionCoverage) {
    lines.push('## Collection Coverage', '');
    lines.push(`- Requested: ${a.collection.requested}`);
    lines.push(`- Completed: ${a.collection.completed}`);
    lines.push(`- Found: ${a.collection.found}`);
    lines.push(`- Uncertain: ${a.collection.uncertain}`);
    lines.push(`- Rate limited: ${a.collection.rateLimited}`);
    lines.push(`- Errors: ${a.collection.errors}`, '');
  }
  if (sections.evidenceMatrix) {
    lines.push('## Evidence Matrix', '');
    lines.push('| Finding | Status | Detector | Observation | Correlation | Value |');
    lines.push('|---|---|---:|---:|---:|---|');
    a.evidence.forEach((e) => lines.push(`| ${e.platformName} | ${e.status} | ${e.detectorConfidence} | ${e.observationConfidence} | ${e.correlationConfidence} | ${e.analyticalValue} |`));
    lines.push('');
  }
  if (sections.correlationGraph) {
    lines.push('## Correlation Graph', '');
    a.graph.edges.forEach((edge) => {
      const source = a.graph.nodes.find((node) => node.id === edge.source)?.label || edge.source;
      const targetNode = a.graph.nodes.find((node) => node.id === edge.target)?.label || edge.target;
      lines.push(`- ${source} —[${edge.relationship} / ${edge.confidence}]→ ${targetNode}`);
    });
    lines.push('');
  }
  if (sections.timeline) {
    lines.push('## Observation Timeline', '');
    a.timeline.forEach((event) => lines.push(`- ${event.observedAt} · ${event.platformName} · ${event.label}`));
    lines.push('');
  }
  if (sections.analyticLedger) {
    lines.push('## Analytic Ledger', '');
    a.analyticLedger.forEach((entry) => {
      lines.push(`### ${entry.id} — ${entry.confidence}`, entry.claim, '');
      lines.push(`Supporting evidence: ${entry.supportingEvidenceIds.join(', ') || 'none'}`);
      lines.push(`Contradictory evidence: ${entry.contradictoryEvidenceIds.join(', ') || 'none'}`, '');
    });
  }

  if (sections.hypotheses) {
    lines.push('## Hypotheses', '');
    a.hypotheses.forEach((h) => lines.push(`### ${h.id} — ${h.confidence}`, h.statement, '', `Caveat: ${h.caveat}`, ''));
  }
  if (sections.contradictions) {
    lines.push('## Evidence Against Correlation', '');
    if (!a.contradictoryEvidence.length) lines.push('- No explicit contradiction observed in currently available metadata. This is not confirmation.');
    else a.contradictoryEvidence.forEach((x) => lines.push(`- ${x}`));
    lines.push('');
  }
  if (sections.gaps) {
    lines.push('## Intelligence Gaps', '');
    a.gaps.forEach((g) => lines.push(`- **${g.severity}** — ${g.question}  `, `  ${g.reason}`));
    lines.push('');
  }
  if (sections.pivots) {
    lines.push('## High-Value Pivots', '');
    a.pivots.forEach((p) => lines.push(`- **${p.priority}** — ${p.action}  `, `  Signal: ${p.signal}  `, `  Reason: ${p.reason}`));
    lines.push('');
  }
  if (sections.collectionPlan) {
    lines.push('## Next Collection Plan', '');
    a.collectionPlan.forEach((x, i) => lines.push(`${i + 1}. ${x}`));
    lines.push('', `**Stop condition:** ${a.stopCondition}`, '');
  }
  if (sections.methodology) {
    lines.push('## Methodology', '', 'Collection → Evidence → Correlation → Hypotheses → Contradictions → Assessment → Pivots → Collection Plan', '');
  }

  lines.push('---', 'Generated locally by Mineiro Username Extractor.');
  return lines.join('\n');
}

export function generateEvidenceCsv(target: string, results: ScanResult[]): string {
  const a = buildIntelligenceAssessment(results, target || 'target');
  const header = [
    'target','evidence_id','platform','category','status','detector_confidence',
    'observation_confidence','correlation_confidence','analytical_value','url'
  ];
  const q = (v: unknown) => `"${String(v ?? '').replaceAll('"','""')}"`;
  const rows = a.evidence.map((e) => [
    target,e.id,e.platformName,e.category,e.status,e.detectorConfidence,
    e.observationConfidence,e.correlationConfidence,e.analyticalValue,e.url,
  ].map(q).join(','));
  return [header.join(','), ...rows].join('\n');
}

export function generateIntelligenceHtml(
  target: string,
  results: ScanResult[],
  sections: IntelligenceExportSelection
): string {
  const a = buildIntelligenceAssessment(results, target || 'target');
  const high = a.evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH');
  const blocks: string[] = [];

  if (sections.keyJudgments) {
    blocks.push(`<section><div class="eyebrow">01 · ASSESSMENT</div><h2>Key intelligence judgments</h2>${a.judgments.map(j => `<article class="row"><b>${escapeHtml(j.confidence)}</b><div><strong>${escapeHtml(j.text)}</strong><p>${escapeHtml(j.basis)}</p></div></article>`).join('')}</section>`);
  }
  if (sections.evidenceMatrix) {
    blocks.push(`<section><div class="eyebrow">02 · EVIDENCE</div><h2>Evidence matrix</h2><div class="table"><div class="tr th"><span>Finding</span><span>Detector</span><span>Observation</span><span>Correlation</span><span>Value</span></div>${a.evidence.map(e => `<div class="tr"><span><b>${escapeHtml(e.platformName)}</b><small>${escapeHtml(e.category)} · ${escapeHtml(e.status)}</small><small>${escapeHtml(e.url)}</small></span><span>${e.detectorConfidence}</span><span>${e.observationConfidence}</span><span>${e.correlationConfidence}</span><span>${escapeHtml(e.analyticalValue)}</span></div>`).join('')}</div></section>`);
  }
  if (sections.correlationGraph) {
    blocks.push(`<section><div class="eyebrow">03 · CORRELATION</div><h2>Correlation graph</h2><div class="cards">${a.graph.edges.slice(0,20).map(edge=>{const source=a.graph.nodes.find(n=>n.id===edge.source)?.label||edge.source;const target=a.graph.nodes.find(n=>n.id===edge.target)?.label||edge.target;return `<article class="card"><b>${escapeHtml(source)} → ${escapeHtml(target)}</b><p>${escapeHtml(edge.relationship)} · confidence ${edge.confidence}</p><small>${escapeHtml(edge.evidenceId||'')}</small></article>`}).join('')}</div></section>`);
  }
  if (sections.timeline) {
    blocks.push(`<section><div class="eyebrow">04 · TIMELINE</div><h2>Observation timeline</h2>${a.timeline.slice(-20).map(event=>`<article class="row"><b>${escapeHtml(new Date(event.observedAt).toLocaleString())}</b><div><strong>${escapeHtml(event.platformName)}</strong><p>${escapeHtml(event.label)}</p></div></article>`).join('')}</section>`);
  }
  if (sections.analyticLedger) {
    blocks.push(`<section><div class="eyebrow">05 · ANALYTIC LEDGER</div><h2>Traceable analytical claims</h2>${a.analyticLedger.map(entry=>`<article class="row"><b>${escapeHtml(entry.id)}</b><div><strong>${escapeHtml(entry.claim)}</strong><p>Confidence: ${escapeHtml(entry.confidence)} · Supporting: ${escapeHtml(entry.supportingEvidenceIds.join(', ')||'none')} · Contradictory: ${escapeHtml(entry.contradictoryEvidenceIds.join(', ')||'none')}</p></div></article>`).join('')}</section>`);
  }

  if (sections.hypotheses || sections.contradictions) {
    blocks.push(`<section><div class="eyebrow">03 · HYPOTHESES</div><h2>Hypotheses & contradictions</h2><div class="cards">${sections.hypotheses ? a.hypotheses.map(h=>`<article class="card"><b>${h.id} · ${h.confidence}</b><p>${escapeHtml(h.statement)}</p><small>${escapeHtml(h.caveat)}</small></article>`).join('') : ''}${sections.contradictions ? `<article class="card"><b>Evidence against correlation</b>${a.contradictoryEvidence.length ? a.contradictoryEvidence.map(x=>`<p>• ${escapeHtml(x)}</p>`).join('') : '<p>No explicit contradiction observed. This is not confirmation.</p>'}</article>` : ''}</div></section>`);
  }
  if (sections.gaps) {
    blocks.push(`<section><div class="eyebrow">04 · GAPS</div><h2>What we still do not know</h2><div class="cards">${a.gaps.map(g=>`<article class="card"><b>${g.id} · ${g.severity}</b><p>${escapeHtml(g.question)}</p><small>${escapeHtml(g.reason)}</small></article>`).join('')}</div></section>`);
  }
  if (sections.pivots) {
    blocks.push(`<section><div class="eyebrow">05 · ACTION</div><h2>High-value pivots</h2>${a.pivots.map(p=>`<article class="row"><b>${p.priority}</b><div><strong>${escapeHtml(p.action)}</strong><p>${escapeHtml(p.reason)}</p></div></article>`).join('')}</section>`);
  }
  if (sections.collectionPlan) {
    blocks.push(`<section><div class="eyebrow">06 · COLLECTION PLAN</div><h2>Next collection plan</h2><ol>${a.collectionPlan.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol><div class="stop"><b>STOP CONDITION</b><p>${escapeHtml(a.stopCondition)}</p></div></section>`);
  }

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mineiro Intelligence Report — ${escapeHtml(target)}</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0b0e10;color:#f3f4f5;font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.55}.wrap{max-width:1180px;margin:auto;padding:48px 40px 90px}.eyebrow{font:700 12px ui-monospace,monospace;letter-spacing:.18em;color:#969da7}h1{font-size:clamp(40px,7vw,78px);line-height:1;letter-spacing:-.055em;max-width:1000px;margin:20px 0}h2{font-size:30px;letter-spacing:-.03em;margin:8px 0 24px}.lead{font-size:22px;color:#9ba1aa;max-width:850px}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:38px 0}.metric,.card{border:1px solid #2c3136;background:#111417;border-radius:22px;padding:24px}.metric b{display:block;font-size:34px}.metric small,.card small,.row p{color:#8f969f}.metric span{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#9299a2}section{padding:48px 0;border-top:1px solid #22272c}.row{display:grid;grid-template-columns:110px 1fr;gap:20px;padding:22px 0;border-bottom:1px solid #252a2f}.row strong{font-size:18px}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.table{border:1px solid #2b3035;border-radius:20px;overflow:hidden}.tr{display:grid;grid-template-columns:1.5fr repeat(4,.7fr);gap:16px;padding:16px 20px;border-bottom:1px solid #252a2f}.tr:last-child{border-bottom:0}.tr small{display:block;color:#7f8790}.th{font-size:10px;text-transform:uppercase;letter-spacing:.15em;color:#858c95}.stop{margin-top:24px;border:1px solid #343a40;border-radius:18px;padding:20px}li{margin:10px 0;color:#c5c9ce}@media(max-width:800px){.wrap{padding:28px 18px}.metrics{grid-template-columns:1fr 1fr}.cards{grid-template-columns:1fr}.tr{grid-template-columns:1fr 1fr}.th{display:none}.row{grid-template-columns:1fr}}@media print{body{background:white;color:black}.wrap{max-width:none;padding:0}.metric,.card,.table,.stop{background:white;border-color:#bbb}.lead,.metric small,.card small,.row p,.eyebrow{color:#555}section{break-inside:avoid;border-color:#ccc}}
  </style></head><body><main class="wrap"><header><div class="eyebrow">MINEIRO · OPEN-SOURCE INTELLIGENCE ASSESSMENT</div><h1>Pegada pública observada com evidência, lacunas e próximos pivôs.</h1><p class="lead">Target: @${escapeHtml(target)} · Generated locally · ${escapeHtml(new Date().toISOString())}</p><div class="metrics"><div class="metric"><span>High-value findings</span><b>${high.length}</b><small>analyst review</small></div><div class="metric"><span>Coverage</span><b>${a.collection.effectiveCoveragePercent}%</b><small>${a.collection.completed}/${a.collection.requested}</small></div><div class="metric"><span>Unresolved</span><b>${a.collection.uncertain+a.collection.rateLimited+a.collection.errors}</b><small>collection gaps</small></div><div class="metric"><span>Analytical gaps</span><b>${a.gaps.length}</b><small>questions open</small></div></div></header>${blocks.join('')}<footer><section><div class="eyebrow">EXPORT MANIFEST</div><p>Generated locally. AI synthesis, when present, must remain labeled as hypothesis and cannot independently raise factual confidence.</p></section></footer></main></body></html>`;
}
