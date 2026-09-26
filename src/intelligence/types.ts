import type { Category, ScanResult } from '../types';

export type ConfidenceBand = 'HIGH' | 'MODERATE' | 'LOW';
export type PriorityBand = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CollectionCoverage {
  requested: number;
  completed: number;
  found: number;
  absent: number;
  uncertain: number;
  rateLimited: number;
  errors: number;
  pending: number;
  effectiveCoveragePercent: number;
}

export interface EvidenceAssessment {
  id: string;
  platformId: string;
  platformName: string;
  category: Category;
  url: string;
  status: ScanResult['status'];
  detectorConfidence: number;
  observationConfidence: number;
  correlationConfidence: number;
  analyticalValue: PriorityBand;
  evidenceSignals: string[];
  whyItMatters: string;
}

export interface FootprintCluster {
  category: Category;
  findings: number;
  strongFindings: number;
  weightedScore: number;
  averageDetectorReliability: number;
}

export interface AnalyticHypothesis {
  id: string;
  statement: string;
  confidence: ConfidenceBand;
  supportingEvidenceIds: string[];
  contradictoryEvidenceIds: string[];
  caveat: string;
}

export interface IntelligencePivot {
  id: string;
  priority: PriorityBand;
  signal: string;
  action: string;
  reason: string;
}

export interface IntelligenceGap {
  id: string;
  severity: PriorityBand;
  question: string;
  reason: string;
}

export interface KeyJudgment {
  id: string;
  confidence: ConfidenceBand;
  text: string;
  basis: string;
}

export interface IntelligenceAssessment {
  generatedAt: string;
  collection: CollectionCoverage;
  judgments: KeyJudgment[];
  evidence: EvidenceAssessment[];
  clusters: FootprintCluster[];
  hypotheses: AnalyticHypothesis[];
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  gaps: IntelligenceGap[];
  pivots: IntelligencePivot[];
  collectionPlan: string[];
  stopCondition: string;
  sourceQualityNotes: string[];
}
