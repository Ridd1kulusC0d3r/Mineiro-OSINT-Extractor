import type { Category, ScanResult } from '../types';
import type {
  AnalyticHypothesis,
  AnalyticLedgerEntry,
  CollectionCoverage,
  ConfidenceBand,
  CorrelationGraphEdge,
  CorrelationGraphNode,
  EvidenceAssessment,
  FootprintCluster,
  IntelligenceAssessment,
  IntelligenceGap,
  IntelligencePivot,
  IntelligenceRequirement,
  IntelligenceTimelineEvent,
  KeyJudgment,
  PriorityBand,
  ProvenanceGraphEdge,
  ProvenanceGraphNode,
  ProvenanceType,
  ReliabilityHeatmapCell,
  SourceQualityGrade,
  TechnicalAppendix,
} from './types';
import { analysisText, requirementLabel, type AnalysisLanguage } from './localization';

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function confidenceBand(score: number): ConfidenceBand {
  if (score >= 80) return 'HIGH';
  if (score >= 55) return 'MODERATE';
  return 'LOW';
}

function priorityBand(score: number): PriorityBand {
  if (score >= 78) return 'HIGH';
  if (score >= 50) return 'MEDIUM';
  return 'LOW';
}

function requirementRelevance(category: Category, requirement: IntelligenceRequirement): number {
  if (requirement === 'username_presence') return 75;
  if (requirement === 'account_correlation') return 85;
  if (requirement === 'digital_footprint') return 82;
  if (requirement === 'developer_footprint') {
    return category === 'developer' || category === 'security' ? 98 : category === 'community' ? 60 : 35;
  }
  if (requirement === 'threat_research_alias') {
    return category === 'security' || category === 'developer' || category === 'community' ? 92 : 45;
  }
  if (requirement === 'brand_impersonation') {
    return category === 'social' || category === 'community' || category === 'media' ? 95 : 45;
  }
  return 70;
}

function sourceQualityGrade(result: ScanResult): SourceQualityGrade {
  const detector = result.detectorReliability ?? 50;
  const observation = result.confidenceScore ?? 40;
  const signalCount = result.evidenceSignals?.length ?? 0;
  const selfDeclared = Boolean(result.metadata?.extractedLinks?.length || result.metadata?.displayName);

  if (selfDeclared && detector >= 90 && observation >= 85 && signalCount >= 3) return 'A';
  if (detector >= 80 && observation >= 75) return 'B';
  if (detector >= 65 && observation >= 55) return 'C';
  if (result.status === 'uncertain' || result.status === 'rate_limited') return 'D';
  return 'E';
}

function provenanceOf(result: ScanResult): ProvenanceType {
  return result.provenanceType === 'EXTERNAL' ? 'EXTERNAL' : 'PRIMARY';
}

export function calculateCollectionCoverage(results: ScanResult[]): CollectionCoverage {
  const requested = results.length;
  const found = results.filter((r) => r.status === 'found').length;
  const absent = results.filter((r) => r.status === 'not_found').length;
  const uncertain = results.filter((r) => r.status === 'uncertain').length;
  const rateLimited = results.filter((r) => r.status === 'rate_limited').length;
  const errors = results.filter((r) => r.status === 'error').length;
  const pending = results.filter((r) => r.status === 'pending' || r.status === 'scanning').length;
  const completed = requested - pending;
  const conclusive = found + absent;
  return {
    requested,
    completed,
    found,
    absent,
    uncertain,
    rateLimited,
    errors,
    pending,
    blockedOrInconclusive: uncertain + rateLimited + errors,
    effectiveCoveragePercent: requested ? clamp((conclusive / requested) * 100) : 0,
  };
}

function buildEvidence(
  results: ScanResult[],
  requirement: IntelligenceRequirement,
  language: AnalysisLanguage
): EvidenceAssessment[] {
  const foundCategories = new Map<string, number>();
  results.filter((r) => r.status === 'found').forEach((r) => {
    foundCategories.set(r.category, (foundCategories.get(r.category) || 0) + 1);
  });

  return results
    .filter((r) => r.status === 'found' || r.status === 'uncertain' || r.status === 'rate_limited')
    .map((r) => {
      const detector = r.detectorReliability ?? 50;
      const observation = r.confidenceScore ?? (r.status === 'found' ? 55 : 30);
      const evidenceRatio = r.evidenceChecksTotal
        ? (r.evidenceChecksPassed ?? 0) / r.evidenceChecksTotal
        : 0.5;
      const categoryCorroboration = Math.min(1, (foundCategories.get(r.category) || 0) / 4);
      const correlation = clamp(
        detector * 0.24 +
        observation * 0.34 +
        evidenceRatio * 100 * 0.24 +
        categoryCorroboration * 100 * 0.18
      );
      const relevance = requirementRelevance(r.category, requirement);
      const novelty = foundCategories.get(r.category) === 1 ? 85 : 60;
      const evidenceQuality = evidenceRatio * 100;
      const priorityScore = clamp(
        evidenceQuality * 0.28 +
        correlation * 0.30 +
        novelty * 0.14 +
        relevance * 0.28
      );
      const valueScore = clamp(
        detector * 0.26 +
        observation * 0.27 +
        correlation * 0.24 +
        priorityScore * 0.23
      );
      const directCrossLink = Boolean(r.metadata?.extractedLinks?.length);

      return {
        id: `E-${r.platformId}`,
        platformId: r.platformId,
        platformName: r.platformName,
        category: r.category,
        url: r.url,
        status: r.status,
        statusCode: r.statusCode,
        responseTimeMs: r.responseTimeMs,
        capturedMetadata: r.metadata ? {
          displayName: r.metadata.displayName,
          location: r.metadata.location,
          organization: r.metadata.organization,
          publicProjects: r.metadata.publicProjects,
          extractedLinks: r.metadata.extractedLinks,
          accountCreatedAt: r.metadata.accountCreatedAt,
          firstPublicEvidenceAt: r.metadata.firstPublicEvidenceAt,
          avatarHash: r.metadata.avatarHash,
        } : undefined,
        detectorConfidence: detector,
        observationConfidence: observation,
        correlationConfidence: correlation,
        assessmentContribution: priorityBand(valueScore),
        analyticalValue: priorityBand(valueScore),
        intelligencePriorityScore: priorityScore,
        requirementRelevance: relevance,
        sourceQuality: sourceQualityGrade(r),
        provenance: provenanceOf(r),
        observedAt: r.checkedAt,
        sourceObservedAt: r.sourceObservedAt,
        evidenceSignals: r.evidenceSignals || [],
        whyItMatters: r.status === 'found'
          ? directCrossLink
            ? analysisText(language, 'evidence_direct')
            : analysisText(language, 'evidence_lead')
          : analysisText(language, 'evidence_inconclusive'),
        recommendedPivot: directCrossLink
          ? analysisText(language, 'pivot_direct')
          : analysisText(language, 'pivot_metadata'),
      };
    })
    .sort((a, b) =>
      b.intelligencePriorityScore - a.intelligencePriorityScore ||
      b.correlationConfidence - a.correlationConfidence
    );
}

function domainsFor(result: ScanResult): string[] {
  const domains = new Set<string>();
  for (const raw of result.metadata?.extractedLinks || []) {
    try {
      domains.add(new URL(raw).hostname.toLowerCase());
    } catch {
      // malformed public link; ignore
    }
  }
  return [...domains];
}

function buildClusters(results: ScanResult[]): FootprintCluster[] {
  const byCategory = new Map<Category, ScanResult[]>();
  results.filter((r) => r.status === 'found').forEach((r) => {
    const current = byCategory.get(r.category) || [];
    current.push(r);
    byCategory.set(r.category, current);
  });

  const clusters: FootprintCluster[] = [...byCategory.entries()].map(([category, items]) => {
    const weighted = items.reduce((sum, item) => {
      return sum + ((item.detectorReliability ?? 50) / 100) * ((item.confidenceScore ?? 50) / 100);
    }, 0);
    const detectorAverage = items.reduce((sum, item) => sum + (item.detectorReliability ?? 50), 0) / items.length;
    return {
      category,
      findings: items.length,
      strongFindings: items.filter(
        (item) => (item.detectorReliability ?? 0) >= 80 && (item.confidenceScore ?? 0) >= 75
      ).length,
      weightedScore: clamp((weighted / Math.max(1, items.length)) * 100),
      averageDetectorReliability: clamp(detectorAverage),
      overlaps: [] as FootprintCluster['overlaps'],
    } satisfies FootprintCluster;
  });

  for (const cluster of clusters) {
    const sourceItems = byCategory.get(cluster.category) || [];
    const sourceDomains = new Set(sourceItems.flatMap(domainsFor));
    for (const other of clusters) {
      if (other.category === cluster.category) continue;
      const otherDomains = new Set((byCategory.get(other.category) || []).flatMap(domainsFor));
      const shared = [...sourceDomains].filter((d) => otherDomains.has(d));
      if (shared.length) {
        cluster.overlaps.push({
          withCategory: other.category,
          sharedSignals: shared,
          score: clamp(65 + Math.min(30, shared.length * 10)),
        });
      }
    }
  }

  return clusters.sort((a, b) => b.weightedScore - a.weightedScore || b.findings - a.findings);
}

function buildContradictions(results: ScanResult[], language: AnalysisLanguage): string[] {
  const contradictions: string[] = [];
  const found = results.filter((r) => r.status === 'found');
  const displayNames = new Set(found.map((r) => r.metadata?.displayName?.trim().toLowerCase()).filter(Boolean));
  const locations = new Set(found.map((r) => r.metadata?.location?.trim().toLowerCase()).filter(Boolean));
  const organizations = new Set(found.map((r) => r.metadata?.organization?.trim().toLowerCase()).filter(Boolean));
  const avatarHashes = new Set(found.map((r) => r.metadata?.avatarHash?.trim().toLowerCase()).filter(Boolean));

  if (displayNames.size > 1) contradictions.push(analysisText(language, 'contradiction_display'));
  if (locations.size > 1) contradictions.push(analysisText(language, 'contradiction_location'));
  if (organizations.size > 1) contradictions.push(analysisText(language, 'contradiction_org'));
  if (avatarHashes.size > 1) contradictions.push(analysisText(language, 'contradiction_avatar'));
  const weakFound = found.filter((r) => (r.detectorReliability ?? 0) < 60 || (r.confidenceScore ?? 0) < 55);
  if (weakFound.length) contradictions.push(analysisText(language, 'contradiction_weak', { count: weakFound.length }));
  return contradictions;
}

function buildJudgments(
  collection: CollectionCoverage,
  evidence: EvidenceAssessment[],
  clusters: FootprintCluster[],
  requirement: IntelligenceRequirement,
  language: AnalysisLanguage
): KeyJudgment[] {
  const high = evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH');
  const leading = clusters[0];
  const out: KeyJudgment[] = [{
    id: 'KJ-01',
    confidence: confidenceBand(collection.effectiveCoveragePercent * 0.4 + Math.min(100, high.length * 12) * 0.6),
    text: high.length
      ? analysisText(language, 'judgment_high', { count: high.length, requirement: requirementLabel(language, requirement).toLowerCase() })
      : analysisText(language, 'judgment_none'),
    basis: analysisText(language, 'judgment_basis', { coverage: collection.effectiveCoveragePercent, count: high.length }),
  }];
  if (leading) {
    out.push({
      id: 'KJ-02',
      confidence: confidenceBand(leading.weightedScore),
      text: analysisText(language, 'judgment_cluster', { category: leading.category }),
      basis: analysisText(language, 'judgment_cluster_basis', { count: leading.findings, score: leading.weightedScore }),
    });
  }
  if (collection.blockedOrInconclusive) {
    out.push({
      id: 'KJ-03',
      confidence: 'HIGH',
      text: analysisText(language, 'judgment_gap'),
      basis: analysisText(language, 'judgment_gap_basis', { count: collection.blockedOrInconclusive }),
    });
  }
  return out;
}

function buildGaps(collection: CollectionCoverage, evidence: EvidenceAssessment[], language: AnalysisLanguage): IntelligenceGap[] {
  const gaps: IntelligenceGap[] = [];
  if (collection.effectiveCoveragePercent < 80) gaps.push({
    id: 'GAP-01', severity: 'HIGH',
    question: analysisText(language, 'gap1_q'),
    reason: analysisText(language, 'gap1_r', { coverage: collection.effectiveCoveragePercent }),
  });
  if (!evidence.some((e) => e.correlationConfidence >= 80 && e.status === 'found')) gaps.push({
    id: 'GAP-02', severity: 'HIGH',
    question: analysisText(language, 'gap2_q'),
    reason: analysisText(language, 'gap2_r'),
  });
  if (!evidence.some((e) => e.sourceQuality === 'A' || e.sourceQuality === 'B')) gaps.push({
    id: 'GAP-03', severity: 'MEDIUM',
    question: analysisText(language, 'gap3_q'),
    reason: analysisText(language, 'gap3_r'),
  });
  return gaps;
}

function buildPivots(
  evidence: EvidenceAssessment[],
  collection: CollectionCoverage,
  contradictions: string[],
  language: AnalysisLanguage
): IntelligencePivot[] {
  const pivots: IntelligencePivot[] = evidence
    .filter((e) => e.status === 'found')
    .slice(0, 6)
    .map((e, i) => ({
      id: `PIVOT-${String(i + 1).padStart(2, '0')}`,
      priority: priorityBand(e.intelligencePriorityScore),
      priorityScore: e.intelligencePriorityScore,
      signal: `${e.platformName}: source ${e.sourceQuality}, correlation ${e.correlationConfidence}/100`,
      action: e.recommendedPivot,
      reason: e.whyItMatters,
    }));
  if (contradictions.length) pivots.unshift({
    id: 'PIVOT-CONTRADICTION',
    priority: 'HIGH',
    priorityScore: 95,
    signal: analysisText(language, 'pivot_contradiction_signal', { count: contradictions.length }),
    action: analysisText(language, 'pivot_contradiction_action'),
    reason: analysisText(language, 'pivot_contradiction_reason'),
  });
  if (collection.uncertain + collection.rateLimited > 0) pivots.push({
    id: 'PIVOT-COLLECTION',
    priority: 'MEDIUM',
    priorityScore: 58,
    signal: analysisText(language, 'pivot_collection_signal', { count: collection.uncertain + collection.rateLimited }),
    action: analysisText(language, 'pivot_collection_action'),
    reason: analysisText(language, 'pivot_collection_reason'),
  });
  return pivots;
}

function buildReliabilityHeatmap(results: ScanResult[]): ReliabilityHeatmapCell[] {
  const map = new Map<string, ReliabilityHeatmapCell>();
  results.filter((r) => r.status === 'found').forEach((r) => {
    const current = map.get(r.category) || { category: r.category, high: 0, medium: 0, low: 0 };
    const combined = (r.detectorReliability ?? 50) * 0.5 + (r.confidenceScore ?? 50) * 0.5;
    if (combined >= 80) current.high++;
    else if (combined >= 55) current.medium++;
    else current.low++;
    map.set(r.category, current);
  });
  return [...map.values()].sort((a, b) => (b.high * 3 + b.medium * 2 + b.low) - (a.high * 3 + a.medium * 2 + a.low));
}

function buildTimeline(results: ScanResult[], language: AnalysisLanguage): IntelligenceTimelineEvent[] {
  const events: IntelligenceTimelineEvent[] = [];
  let index = 1;
  for (const r of results.filter((x) => x.status === 'found' || x.status === 'uncertain')) {
    const evidenceId = `E-${r.platformId}`;
    const scanTime = r.checkedAt || new Date().toISOString();
    events.push({
      id: `T-${String(index++).padStart(3, '0')}`,
      observedAt: scanTime,
      timestampKind: 'SCAN_TIMESTAMP',
      type: r.status === 'found' ? 'PUBLIC_PROFILE_SIGNAL' : 'SCAN_OBSERVATION',
      platformName: r.platformName,
      label: r.status === 'found' ? analysisText(language, 'timeline_found') : analysisText(language, 'timeline_uncertain'),
      evidenceId,
      provenance: provenanceOf(r),
    });
    if (r.metadata?.accountCreatedAt) events.push({
      id: `T-${String(index++).padStart(3, '0')}`,
      observedAt: r.metadata.accountCreatedAt,
      timestampKind: 'ACCOUNT_CREATED',
      type: 'ACCOUNT_LIFECYCLE',
      platformName: r.platformName,
      label: analysisText(language, 'timeline_created'),
      evidenceId,
      provenance: provenanceOf(r),
    });
    if (r.metadata?.firstPublicEvidenceAt) events.push({
      id: `T-${String(index++).padStart(3, '0')}`,
      observedAt: r.metadata.firstPublicEvidenceAt,
      timestampKind: 'FIRST_PUBLIC_EVIDENCE',
      type: 'ACCOUNT_LIFECYCLE',
      platformName: r.platformName,
      label: analysisText(language, 'timeline_first'),
      evidenceId,
      provenance: provenanceOf(r),
    });
    if (r.sourceObservedAt) events.push({
      id: `T-${String(index++).padStart(3, '0')}`,
      observedAt: r.sourceObservedAt,
      timestampKind: 'SOURCE_OBSERVED',
      type: 'PUBLIC_PROFILE_SIGNAL',
      platformName: r.platformName,
      label: analysisText(language, 'timeline_source'),
      evidenceId,
      provenance: provenanceOf(r),
    });
  }
  return events.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
}

function addGraphNode(nodes: Map<string, CorrelationGraphNode>, node: CorrelationGraphNode) {
  if (!nodes.has(node.id)) nodes.set(node.id, node);
}

function buildCorrelationGraph(results: ScanResult[], targetLabel: string): {nodes: CorrelationGraphNode[]; edges: CorrelationGraphEdge[]} {
  const nodes = new Map<string, CorrelationGraphNode>();
  const edges: CorrelationGraphEdge[] = [];
  addGraphNode(nodes, { id: 'target', type: 'TARGET', label: targetLabel, provenance: 'DERIVED' });
  const usernameId = `username:${targetLabel.toLowerCase()}`;
  addGraphNode(nodes, { id: usernameId, type: targetLabel.includes('@') ? 'EMAIL' : 'USERNAME', label: targetLabel, provenance: 'PRIMARY' });
  edges.push({ id: 'edge:target:identifier', source: 'target', target: usernameId, relationship: 'USES', confidence: 100, provenance: 'DERIVED' });

  for (const r of results.filter((x) => x.status === 'found')) {
    const evidenceId = `E-${r.platformId}`;
    const provenance = provenanceOf(r);
    const platformId = `platform:${r.platformId}`;
    const profileId = `profile:${r.platformId}`;
    addGraphNode(nodes, { id: platformId, type: 'PLATFORM', label: r.platformName, provenance, evidenceId });
    addGraphNode(nodes, { id: profileId, type: 'PROFILE', label: r.url, provenance, evidenceId });
    edges.push({
      id: `edge:identifier:${r.platformId}`, source: usernameId, target: profileId,
      relationship: 'SAME_HANDLE', confidence: clamp((r.detectorReliability ?? 50) * 0.45 + (r.confidenceScore ?? 50) * 0.55),
      evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance,
    });
    edges.push({
      id: `edge:profile:platform:${r.platformId}`, source: profileId, target: platformId,
      relationship: 'OBSERVED_ON', confidence: 100, evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance,
    });

    if (r.metadata?.displayName) {
      const id = `display:${r.metadata.displayName.toLowerCase()}`;
      addGraphNode(nodes, { id, type: 'DISPLAY_NAME', label: r.metadata.displayName, provenance, evidenceId });
      edges.push({ id: `edge:display:${r.platformId}`, source: profileId, target: id, relationship: 'USES', confidence: 72, evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance });
    }
    if (r.metadata?.organization) {
      const id = `org:${r.metadata.organization.toLowerCase()}`;
      addGraphNode(nodes, { id, type: 'ORGANIZATION', label: r.metadata.organization, provenance, evidenceId });
      edges.push({ id: `edge:org:${r.platformId}`, source: profileId, target: id, relationship: 'MENTIONS', confidence: 72, evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance });
    }
    if (r.metadata?.avatarHash) {
      const id = `avatar:${r.metadata.avatarHash}`;
      addGraphNode(nodes, { id, type: 'AVATAR_HASH', label: r.metadata.avatarHash, provenance, evidenceId });
      edges.push({ id: `edge:avatar:${r.platformId}`, source: profileId, target: id, relationship: 'REFERENCES', confidence: 70, evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance });
    }
    for (const project of r.metadata?.publicProjects || []) {
      const id = `project:${project.toLowerCase()}`;
      addGraphNode(nodes, { id, type: 'PUBLIC_PROJECT', label: project, provenance, evidenceId });
      edges.push({ id: `edge:project:${r.platformId}:${id}`, source: profileId, target: id, relationship: 'REFERENCES', confidence: 75, evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance });
    }
    for (const rawLink of r.metadata?.extractedLinks || []) {
      try {
        const parsed = new URL(rawLink);
        const domainId = `domain:${parsed.hostname.toLowerCase()}`;
        const urlId = `url:${rawLink}`;
        addGraphNode(nodes, { id: domainId, type: 'DOMAIN', label: parsed.hostname.toLowerCase(), provenance, evidenceId });
        addGraphNode(nodes, { id: urlId, type: 'PUBLIC_URL', label: rawLink, provenance, evidenceId });
        edges.push({ id: `edge:url:${r.platformId}:${rawLink}`, source: profileId, target: urlId, relationship: 'LINKS_TO', confidence: 88, evidenceId, sourceUrl: r.url, observedAt: r.checkedAt, provenance });
        edges.push({ id: `edge:host:${r.platformId}:${parsed.hostname}`, source: urlId, target: domainId, relationship: 'HOSTED_ON', confidence: 100, evidenceId, sourceUrl: rawLink, observedAt: r.checkedAt, provenance });
      } catch {
        // ignore malformed public links
      }
    }
  }

  const domainProfiles = new Map<string, string[]>();
  edges.filter((e) => e.relationship === 'HOSTED_ON').forEach((e) => {
    const linkedUrlEdge = edges.find((x) => x.target === e.source && x.relationship === 'LINKS_TO');
    if (!linkedUrlEdge) return;
    const list = domainProfiles.get(e.target) || [];
    list.push(linkedUrlEdge.source);
    domainProfiles.set(e.target, list);
  });
  for (const [domainId, profiles] of domainProfiles.entries()) {
    const unique = [...new Set(profiles)];
    if (unique.length < 2) continue;
    for (let i = 0; i < unique.length - 1; i++) {
      edges.push({
        id: `edge:same-domain:${domainId}:${i}`,
        source: unique[i], target: unique[i + 1], relationship: 'SAME_DOMAIN',
        confidence: 90, provenance: 'DERIVED',
      });
    }
  }

  return { nodes: [...nodes.values()], edges };
}

function buildProvenanceGraph(
  evidence: EvidenceAssessment[],
  ledger: AnalyticLedgerEntry[]
): {nodes: ProvenanceGraphNode[]; edges: ProvenanceGraphEdge[]} {
  const nodes: ProvenanceGraphNode[] = [];
  const edges: ProvenanceGraphEdge[] = [];
  for (const e of evidence) {
    const sourceNodeId = `prov:${e.id}:${e.provenance}`;
    nodes.push({ id: sourceNodeId, label: e.provenance, type: e.provenance });
    nodes.push({ id: e.id, label: e.platformName, type: 'EVIDENCE' });
    edges.push({ source: sourceNodeId, target: e.id, relation: 'OBSERVED_AS' });
  }
  for (const entry of ledger) {
    nodes.push({ id: entry.id, label: entry.claim, type: 'ASSESSMENT' });
    for (const eId of entry.supportingEvidenceIds) {
      edges.push({ source: eId, target: entry.id, relation: 'DERIVED_FROM' });
    }
  }
  return { nodes, edges };
}

function buildTechnicalAppendix(results: ScanResult[], evidence: EvidenceAssessment[]): TechnicalAppendix {
  const resultStatusCounts: Record<string, number> = {};
  results.forEach((r) => { resultStatusCounts[r.status] = (resultStatusCounts[r.status] || 0) + 1; });
  const sourceQualityCounts: Record<SourceQualityGrade, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  const provenanceCounts: Record<ProvenanceType, number> = { PRIMARY: 0, DERIVED: 0, EXTERNAL: 0, AI_SYNTHESIZED: 0 };
  evidence.forEach((e) => {
    sourceQualityCounts[e.sourceQuality]++;
    provenanceCounts[e.provenance]++;
  });
  provenanceCounts.DERIVED += 1;
  return {
    detectorCount: results.length,
    evidenceChecksAvailable: results.reduce((sum, r) => sum + (r.evidenceChecksTotal || 0), 0),
    resultStatusCounts,
    sourceQualityCounts,
    provenanceCounts,
  };
}

function buildHypotheses(
  evidence: EvidenceAssessment[],
  clusters: FootprintCluster[],
  contradictions: string[],
  collection: CollectionCoverage,
  language: AnalysisLanguage
): AnalyticHypothesis[] {
  const strong = evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH');
  const hypotheses: AnalyticHypothesis[] = [{
    id: 'H1',
    statement: analysisText(language, 'hypothesis_h1'),
    confidence: confidenceBand(strong.length * 12 + collection.effectiveCoveragePercent * 0.35),
    supportingEvidenceIds: strong.map((e) => e.id),
    contradictoryEvidenceIds: contradictions.map((_, i) => `C-${String(i + 1).padStart(3, '0')}`),
    caveat: analysisText(language, 'hypothesis_h1_caveat'),
  }];
  if (clusters[0]) hypotheses.push({
    id: 'H2',
    statement: analysisText(language, 'hypothesis_h2', { category: clusters[0].category }),
    confidence: confidenceBand(clusters[0].weightedScore),
    supportingEvidenceIds: evidence.filter((e) => e.category === clusters[0].category && e.status === 'found').map((e) => e.id),
    contradictoryEvidenceIds: [],
    caveat: analysisText(language, 'hypothesis_h2_caveat'),
  });
  hypotheses.push({
    id: 'H3',
    statement: analysisText(language, 'hypothesis_h3'),
    confidence: evidence.some((e) => e.status === 'found' && e.correlationConfidence < 50) ? 'MODERATE' : 'LOW',
    supportingEvidenceIds: evidence.filter((e) => e.status === 'found' && e.correlationConfidence < 50).map((e) => e.id),
    contradictoryEvidenceIds: strong.map((e) => e.id),
    caveat: analysisText(language, 'hypothesis_h3_caveat'),
    alternative: true,
  });
  return hypotheses;
}

function buildAnalyticLedger(
  judgments: KeyJudgment[],
  evidence: EvidenceAssessment[],
  contradictions: string[],
  generatedAt: string
): AnalyticLedgerEntry[] {
  const strongIds = evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH').map((e) => e.id);
  return judgments.map((judgment, index) => ({
    id: `A-${String(index + 1).padStart(3, '0')}`,
    claim: judgment.text,
    confidence: judgment.confidence,
    supportingEvidenceIds: index === 0 ? strongIds.slice(0, 12) : evidence.slice(0, 6).map((e) => e.id),
    contradictoryEvidenceIds: contradictions.map((_, i) => `C-${String(i + 1).padStart(3, '0')}`),
    generatedAt,
    provenance: 'DERIVED',
  }));
}

export function buildIntelligenceAssessment(
  results: ScanResult[],
  targetLabel = 'target',
  requirement: IntelligenceRequirement = 'account_correlation',
  language: AnalysisLanguage = 'en'
): IntelligenceAssessment {
  const generatedAt = new Date().toISOString();
  const collection = calculateCollectionCoverage(results);
  const evidence = buildEvidence(results, requirement, language);
  const clusters = buildClusters(results);
  const contradictoryEvidence = buildContradictions(results, language);
  const judgments = buildJudgments(collection, evidence, clusters, requirement, language);
  const gaps = buildGaps(collection, evidence, language);
  const pivots = buildPivots(evidence, collection, contradictoryEvidence, language);
  const hypotheses = buildHypotheses(evidence, clusters, contradictoryEvidence, collection, language);
  const ledger = buildAnalyticLedger(judgments, evidence, contradictoryEvidence, generatedAt);
  const timeline = buildTimeline(results, language);
  const graph = buildCorrelationGraph(results, targetLabel);
  const provenanceGraph = buildProvenanceGraph(evidence, ledger);
  const highConfidenceFindings = evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH');
  const unresolvedFindings = evidence.filter((e) => e.status === 'uncertain' || e.status === 'rate_limited');
  const assessmentConfidence = judgments[0]?.confidence || 'LOW';

  return {
    generatedAt,
    intelligenceRequirement: requirement,
    intelligenceRequirementLabel: requirementLabel(language, requirement),
    assessmentConfidence,
    collection,
    judgments,
    evidence,
    highConfidenceFindings,
    unresolvedFindings,
    clusters,
    hypotheses,
    supportingEvidence: highConfidenceFindings.map((e) => `${e.id}: ${e.platformName} (${e.sourceQuality}, IPS ${e.intelligencePriorityScore})`),
    contradictoryEvidence,
    knownAssessedUnknown: {
      known: evidence.filter((e) => e.status === 'found').slice(0, 10).map((e) => analysisText(language, 'known_presence', { platform: e.platformName, url: e.url })),
      assessed: judgments.map((j) => `${j.id}: ${j.text}`),
      unknown: gaps.map((g) => g.question),
    },
    gaps,
    pivots,
    collectionPlan: [
      analysisText(language, 'plan1'),
      analysisText(language, 'plan2'),
      analysisText(language, 'plan3'),
      analysisText(language, 'plan4'),
    ],
    stopCondition: analysisText(language, 'stop'),
    sourceQualityNotes: [
      analysisText(language, 'sourceA'),
      analysisText(language, 'sourceB'),
      analysisText(language, 'sourceC'),
      analysisText(language, 'sourceD'),
      analysisText(language, 'sourceE'),
      analysisText(language, 'sourceAI'),
    ],
    analyticLedger: ledger,
    timeline,
    graph,
    provenanceGraph,
    reliabilityHeatmap: buildReliabilityHeatmap(results),
    technicalAppendix: buildTechnicalAppendix(results, evidence),
  };
}
