import type { Category, ScanResult } from '../types';

export type ConfidenceBand = 'HIGH' | 'MODERATE' | 'LOW';
export type PriorityBand = 'HIGH' | 'MEDIUM' | 'LOW';
export type SourceQualityGrade = 'A' | 'B' | 'C' | 'D' | 'E';

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
  intelligencePriorityScore: number;
  sourceQuality: SourceQualityGrade;
  observedAt?: string;
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

export interface AnalyticLedgerEntry {
  id: string;
  claim: string;
  confidence: ConfidenceBand;
  supportingEvidenceIds: string[];
  contradictoryEvidenceIds: string[];
  generatedAt: string;
}

export interface IntelligenceTimelineEvent {
  id: string;
  observedAt: string;
  type: 'SCAN_OBSERVATION' | 'PUBLIC_PROFILE_SIGNAL' | 'PUBLIC_LINK_SIGNAL';
  platformName: string;
  label: string;
  evidenceId?: string;
}

export interface CorrelationGraphNode {
  id: string;
  type: 'TARGET' | 'PROFILE' | 'DOMAIN' | 'PUBLIC_URL';
  label: string;
}

export interface CorrelationGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: 'SAME_HANDLE' | 'OBSERVED_ON' | 'LINKS_TO';
  confidence: number;
  evidenceId?: string;
}

export interface ReliabilityHeatmapCell {
  category: string;
  high: number;
  medium: number;
  low: number;
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
  analyticLedger: AnalyticLedgerEntry[];
  timeline: IntelligenceTimelineEvent[];
  graph: {
    nodes: CorrelationGraphNode[];
    edges: CorrelationGraphEdge[];
  };
  reliabilityHeatmap: ReliabilityHeatmapCell[];
}
