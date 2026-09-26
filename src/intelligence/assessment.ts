import type { ScanResult } from '../types';
import type {
  CollectionCoverage,
  ConfidenceBand,
  EvidenceAssessment,
  FootprintCluster,
  IntelligenceAssessment,
  IntelligenceGap,
  IntelligencePivot,
  KeyJudgment,
  PriorityBand,
} from './types';

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
    effectiveCoveragePercent: requested ? clamp((conclusive / requested) * 100) : 0,
  };
}

function buildEvidence(results: ScanResult[]): EvidenceAssessment[] {
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
        detector * 0.25 +
        observation * 0.35 +
        evidenceRatio * 100 * 0.25 +
        categoryCorroboration * 100 * 0.15
      );
      const valueScore = clamp(detector * 0.35 + observation * 0.35 + correlation * 0.3);

      return {
        id: `E-${r.platformId}`,
        platformId: r.platformId,
        platformName: r.platformName,
        category: r.category,
        url: r.url,
        status: r.status,
        detectorConfidence: detector,
        observationConfidence: observation,
        correlationConfidence: correlation,
        analyticalValue: priorityBand(valueScore),
        evidenceSignals: r.evidenceSignals || [],
        whyItMatters:
          r.status === 'found'
            ? `Public presence signal in ${r.category}; treat as a lead until independently corroborated.`
            : `Inconclusive response in ${r.category}; do not use as positive identity evidence.`,
      };
    })
    .sort((a, b) =>
      b.correlationConfidence - a.correlationConfidence ||
      b.observationConfidence - a.observationConfidence
    );
}

function buildClusters(results: ScanResult[]): FootprintCluster[] {
  const byCategory = new Map<string, ScanResult[]>();
  results.filter((r) => r.status === 'found').forEach((r) => {
    const current = byCategory.get(r.category) || [];
    current.push(r);
    byCategory.set(r.category, current);
  });

  return [...byCategory.entries()]
    .map(([category, items]) => {
      const weighted = items.reduce((sum, item) => {
        const detector = (item.detectorReliability ?? 50) / 100;
        const observation = (item.confidenceScore ?? 50) / 100;
        return sum + detector * observation;
      }, 0);
      const detectorAverage = items.reduce((sum, item) => sum + (item.detectorReliability ?? 50), 0) / items.length;
      return {
        category: category as FootprintCluster['category'],
        findings: items.length,
        strongFindings: items.filter(
          (item) => (item.detectorReliability ?? 0) >= 80 && (item.confidenceScore ?? 0) >= 75
        ).length,
        weightedScore: clamp((weighted / Math.max(1, items.length)) * 100),
        averageDetectorReliability: clamp(detectorAverage),
      };
    })
    .sort((a, b) => b.weightedScore - a.weightedScore || b.findings - a.findings);
}

function buildJudgments(
  collection: CollectionCoverage,
  evidence: EvidenceAssessment[],
  clusters: FootprintCluster[]
): KeyJudgment[] {
  const judgments: KeyJudgment[] = [];
  const highEvidence = evidence.filter((e) => e.analyticalValue === 'HIGH' && e.status === 'found');
  const leading = clusters[0];

  judgments.push({
    id: 'KJ-01',
    confidence: confidenceBand(
      collection.effectiveCoveragePercent * 0.45 +
      Math.min(100, highEvidence.length * 12) * 0.55
    ),
    text: highEvidence.length
      ? `${highEvidence.length} high-value public findings warrant analyst review.`
      : 'No high-value finding currently supports a strong cross-platform assessment.',
    basis: `Effective collection coverage ${collection.effectiveCoveragePercent}% with ${highEvidence.length} high-value findings.`,
  });

  if (leading) {
    judgments.push({
      id: 'KJ-02',
      confidence: confidenceBand(leading.weightedScore),
      text: `${leading.category} is the strongest observed footprint cluster in the current collection.`,
      basis: `${leading.findings} findings; weighted evidence score ${leading.weightedScore}/100.`,
    });
  }

  if (collection.uncertain + collection.rateLimited + collection.errors > 0) {
    judgments.push({
      id: 'KJ-03',
      confidence: 'HIGH',
      text: 'Collection gaps materially limit negative conclusions.',
      basis: `${collection.uncertain} uncertain, ${collection.rateLimited} rate-limited and ${collection.errors} error results.`,
    });
  }

  return judgments;
}

function buildContradictions(results: ScanResult[]): string[] {
  const contradictions: string[] = [];
  const foundWithMetadata = results.filter((r) => r.status === 'found' && r.metadata);
  const displayNames = new Set(
    foundWithMetadata.map((r) => r.metadata?.displayName?.trim().toLowerCase()).filter(Boolean)
  );
  const locations = new Set(
    foundWithMetadata.map((r) => r.metadata?.location?.trim().toLowerCase()).filter(Boolean)
  );

  if (displayNames.size > 1) {
    contradictions.push('Public display names differ across observed profiles; identity correlation should be reduced until resolved.');
  }
  if (locations.size > 1) {
    contradictions.push('Public location fields differ across observed profiles; treat them as contradictory metadata, not proof of separate identities.');
  }

  const lowQualityFound = results.filter(
    (r) => r.status === 'found' && ((r.detectorReliability ?? 0) < 60 || (r.confidenceScore ?? 0) < 55)
  );
  if (lowQualityFound.length) {
    contradictions.push(`${lowQualityFound.length} FOUND result(s) rely on weak detector or observation confidence and should not drive the assessment.`);
  }

  return contradictions;
}

function buildGaps(collection: CollectionCoverage, evidence: EvidenceAssessment[]): IntelligenceGap[] {
  const gaps: IntelligenceGap[] = [];
  if (collection.effectiveCoveragePercent < 80) {
    gaps.push({
      id: 'GAP-01',
      severity: 'HIGH',
      question: 'What conclusions would change if currently inconclusive services became available?',
      reason: `Only ${collection.effectiveCoveragePercent}% of requested collection is currently conclusive.`,
    });
  }
  if (!evidence.some((e) => e.correlationConfidence >= 80)) {
    gaps.push({
      id: 'GAP-02',
      severity: 'HIGH',
      question: 'Is there an independent public cross-link connecting two or more findings?',
      reason: 'Username reuse alone is insufficient for strong identity correlation.',
    });
  }
  if (!evidence.some((e) => e.evidenceSignals.length >= 3)) {
    gaps.push({
      id: 'GAP-03',
      severity: 'MEDIUM',
      question: 'Can high-value findings be corroborated with richer response evidence?',
      reason: 'Most current findings have limited multi-signal evidence.',
    });
  }
  return gaps;
}

function buildPivots(
  evidence: EvidenceAssessment[],
  collection: CollectionCoverage,
  contradictions: string[]
): IntelligencePivot[] {
  const pivots: IntelligencePivot[] = [];
  const top = evidence.filter((e) => e.status === 'found').slice(0, 5);

  top.forEach((e, index) => {
    pivots.push({
      id: `PIVOT-${String(index + 1).padStart(2, '0')}`,
      priority: e.analyticalValue,
      signal: `${e.platformName}: ${e.observationConfidence}/100 observation confidence`,
      action: 'Open the public profile and validate self-declared links, display name and other public metadata before correlating identities.',
      reason: 'Independent self-declared cross-links are stronger than username reuse alone.',
    });
  });

  if (collection.uncertain + collection.rateLimited > 0) {
    pivots.push({
      id: 'PIVOT-COLLECTION',
      priority: 'MEDIUM',
      signal: `${collection.uncertain + collection.rateLimited} inconclusive protected responses`,
      action: 'Re-run only inconclusive detectors later with conservative concurrency.',
      reason: 'A targeted retry is more efficient and less noisy than repeating the full scan.',
    });
  }

  if (contradictions.length) {
    pivots.push({
      id: 'PIVOT-CONTRADICTION',
      priority: 'HIGH',
      signal: `${contradictions.length} contradictory signal(s)`,
      action: 'Resolve contradictions before increasing identity-correlation confidence.',
      reason: 'Contradictory evidence is analytically more important than collecting more weak matches.',
    });
  }

  return pivots;
}

export function buildIntelligenceAssessment(results: ScanResult[]): IntelligenceAssessment {
  const collection = calculateCollectionCoverage(results);
  const evidence = buildEvidence(results);
  const clusters = buildClusters(results);
  const contradictoryEvidence = buildContradictions(results);
  const gaps = buildGaps(collection, evidence);
  const pivots = buildPivots(evidence, collection, contradictoryEvidence);

  const strongEvidence = evidence.filter((e) => e.status === 'found' && e.analyticalValue === 'HIGH');
  const supportingEvidence = strongEvidence.map(
    (e) => `${e.id}: ${e.platformName} public-presence signal (${e.correlationConfidence}/100 correlation support).`
  );

  return {
    generatedAt: new Date().toISOString(),
    collection,
    judgments: buildJudgments(collection, evidence, clusters),
    evidence,
    clusters,
    hypotheses: [
      {
        id: 'H1',
        statement: 'A subset of high-confidence findings may represent the same public online identity.',
        confidence: confidenceBand(strongEvidence.length * 12 + collection.effectiveCoveragePercent * 0.35),
        supportingEvidenceIds: strongEvidence.map((e) => e.id),
        contradictoryEvidenceIds: contradictoryEvidence.map((_, i) => `C-${i + 1}`),
        caveat: 'Same username is only a lead. Identity correlation requires independent corroboration.',
      },
      {
        id: 'H2',
        statement: 'Some low-confidence findings may be username collisions unrelated to the primary identity hypothesis.',
        confidence: evidence.some((e) => e.correlationConfidence < 50) ? 'MODERATE' : 'LOW',
        supportingEvidenceIds: evidence.filter((e) => e.correlationConfidence < 50).map((e) => e.id),
        contradictoryEvidenceIds: [],
        caveat: 'Do not merge weak findings into a single identity without independent evidence.',
      },
    ],
    supportingEvidence,
    contradictoryEvidence,
    gaps,
    pivots,
    collectionPlan: [
      'Validate the top five high-value findings manually.',
      'Prioritize independent public cross-links over additional username-only matches.',
      'Resolve contradictory metadata before raising correlation confidence.',
      'Retry only inconclusive detectors after cooldown instead of repeating the entire registry.',
      'Record source URL, timestamp and detector confidence for any finding used in a final assessment.',
    ],
    stopCondition:
      'Stop expanding collection when new public findings no longer materially change the key judgments or resolve an identified intelligence gap.',
    sourceQualityNotes: [
      'Direct self-declared cross-links should receive more analytical weight than username reuse alone.',
      'Search/index hits and generic 200 responses should receive less weight than stable profile endpoints.',
      'AI-generated synthesis must remain a hypothesis layer and must not increase factual confidence without new evidence.',
    ],
  };
}
