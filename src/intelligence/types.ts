import type { Category, ScanResult } from '../types';

export type ConfidenceBand = 'HIGH' | 'MODERATE' | 'LOW';
export type PriorityBand = 'HIGH' | 'MEDIUM' | 'LOW';
export type SourceQualityGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type ProvenanceType = 'PRIMARY' | 'DERIVED' | 'EXTERNAL' | 'AI_SYNTHESIZED';

export type IntelligenceRequirement =
  | 'username_presence'
  | 'account_correlation'
  | 'digital_footprint'
  | 'developer_footprint'
  | 'threat_research_alias'
  | 'brand_impersonation';

export const INTELLIGENCE_REQUIREMENT_LABELS: Record<IntelligenceRequirement, string> = {
  username_presence: 'Username presence',
  account_correlation: 'Public account correlation',
  digital_footprint: 'Digital footprint mapping',
  developer_footprint: 'Developer footprint',
  threat_research_alias: 'Threat research alias mapping',
  brand_impersonation: 'Brand impersonation monitoring',
};

export interface CollectionCoverage {
  requested: number;
  completed: number;
  found: number;
  absent: number;
  uncertain: number;
  rateLimited: number;
  errors: number;
  pending: number;
  blockedOrInconclusive: number;
  effectiveCoveragePercent: number;
}

export interface EvidenceAssessment {
  id: string;
  platformId: string;
  platformName: string;
  category: Category;
  url: string;
  status: ScanResult['status'];
  statusCode?: number;
  responseTimeMs?: number;
  capturedMetadata?: {
    displayName?: string;
    location?: string;
    organization?: string;
    publicProjects?: string[];
    extractedLinks?: string[];
    accountCreatedAt?: string;
    firstPublicEvidenceAt?: string;
    avatarHash?: string;
  };
  detectorConfidence: number;
  observationConfidence: number;
  correlationConfidence: number;
  assessmentContribution: PriorityBand;
  analyticalValue: PriorityBand;
  intelligencePriorityScore: number;
  requirementRelevance: number;
  sourceQuality: SourceQualityGrade;
  provenance: ProvenanceType;
  observedAt?: string;
  sourceObservedAt?: string;
  evidenceSignals: string[];
  whyItMatters: string;
  recommendedPivot: string;
}

export interface ClusterOverlap {
  withCategory: Category;
  sharedSignals: string[];
  score: number;
}

export interface FootprintCluster {
  category: Category;
  findings: number;
  strongFindings: number;
  weightedScore: number;
  averageDetectorReliability: number;
  overlaps: ClusterOverlap[];
}

export interface AnalyticHypothesis {
  id: string;
  statement: string;
  confidence: ConfidenceBand;
  supportingEvidenceIds: string[];
  contradictoryEvidenceIds: string[];
  caveat: string;
  alternative?: boolean;
}

export interface IntelligencePivot {
  id: string;
  priority: PriorityBand;
  priorityScore: number;
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
  provenance: 'DERIVED';
}

export type TimelineTimestampKind =
  | 'SCAN_TIMESTAMP'
  | 'ACCOUNT_CREATED'
  | 'FIRST_PUBLIC_EVIDENCE'
  | 'SOURCE_OBSERVED';

export interface IntelligenceTimelineEvent {
  id: string;
  observedAt: string;
  timestampKind: TimelineTimestampKind;
  type: 'SCAN_OBSERVATION' | 'PUBLIC_PROFILE_SIGNAL' | 'PUBLIC_LINK_SIGNAL' | 'ACCOUNT_LIFECYCLE';
  platformName: string;
  label: string;
  evidenceId?: string;
  provenance: ProvenanceType;
}

export type CorrelationNodeType =
  | 'TARGET'
  | 'USERNAME'
  | 'EMAIL'
  | 'DOMAIN'
  | 'DISPLAY_NAME'
  | 'PUBLIC_URL'
  | 'PROFILE'
  | 'PLATFORM'
  | 'PUBLIC_PROJECT'
  | 'ORGANIZATION'
  | 'AVATAR_HASH';

export interface CorrelationGraphNode {
  id: string;
  type: CorrelationNodeType;
  label: string;
  provenance: ProvenanceType;
  evidenceId?: string;
}

export type CorrelationRelationship =
  | 'USES'
  | 'LINKS_TO'
  | 'MENTIONS'
  | 'HOSTED_ON'
  | 'SAME_HANDLE'
  | 'SAME_DOMAIN'
  | 'REFERENCES'
  | 'OBSERVED_ON';

export interface CorrelationGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: CorrelationRelationship;
  confidence: number;
  evidenceId?: string;
  sourceUrl?: string;
  observedAt?: string;
  provenance: ProvenanceType;
}

export interface ProvenanceGraphNode {
  id: string;
  label: string;
  type: ProvenanceType | 'EVIDENCE' | 'ASSESSMENT';
}

export interface ProvenanceGraphEdge {
  source: string;
  target: string;
  relation: 'OBSERVED_AS' | 'DERIVED_FROM' | 'SYNTHESIZED_FROM';
}

export interface ReliabilityHeatmapCell {
  category: string;
  high: number;
  medium: number;
  low: number;
}

export interface KnownAssessedUnknown {
  known: string[];
  assessed: string[];
  unknown: string[];
}

export interface TechnicalAppendix {
  detectorCount: number;
  evidenceChecksAvailable: number;
  resultStatusCounts: Record<string, number>;
  sourceQualityCounts: Record<SourceQualityGrade, number>;
  provenanceCounts: Record<ProvenanceType, number>;
}

export interface IntelligenceAssessment {
  generatedAt: string;
  intelligenceRequirement: IntelligenceRequirement;
  intelligenceRequirementLabel: string;
  assessmentConfidence: ConfidenceBand;
  collection: CollectionCoverage;
  judgments: KeyJudgment[];
  evidence: EvidenceAssessment[];
  highConfidenceFindings: EvidenceAssessment[];
  unresolvedFindings: EvidenceAssessment[];
  clusters: FootprintCluster[];
  hypotheses: AnalyticHypothesis[];
  supportingEvidence: string[];
  contradictoryEvidence: string[];
  knownAssessedUnknown: KnownAssessedUnknown;
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
  provenanceGraph: {
    nodes: ProvenanceGraphNode[];
    edges: ProvenanceGraphEdge[];
  };
  reliabilityHeatmap: ReliabilityHeatmapCell[];
  technicalAppendix: TechnicalAppendix;
}
