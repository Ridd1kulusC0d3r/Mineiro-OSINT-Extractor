export type DetectorTier = 'high' | 'medium' | 'experimental';
export type ProvenanceStatus = 'verified' | 'legacy-audit-required' | 'external-attributed';

export interface RegistryDetector {
  id: string;
  name: string;
  category: string;
  siteType: string;
  urlPattern: string;
  checkMethod: string;
  detectorReliability: number;
  reliabilityTier: DetectorTier;
  provenanceStatus: ProvenanceStatus;
  licenseStatus: string;
  optionalEvidenceChecks: string[];
  lastVerified?: string;
}

export interface RegistryBreakdownItem {
  key: string;
  count: number;
  percent: number;
}

export interface RegistryStats {
  totalDetectors: number;
  logicalEvidenceChecks: number;
  evidenceChecksPerDetector: number;
  byCategory: RegistryBreakdownItem[];
  bySiteType: RegistryBreakdownItem[];
  byReliabilityTier: RegistryBreakdownItem[];
  byProvenance: RegistryBreakdownItem[];
  averageReliability: number;
  verifiedDetectors: number;
  auditRequiredDetectors: number;
}

export interface DetectorBenchmarkObservation {
  detectorId: string;
  expected: 'present' | 'absent';
  observed: 'found' | 'not_found' | 'uncertain' | 'rate_limited' | 'error';
  timestamp: string;
  latencyMs?: number;
}

export interface DetectorBenchmarkMetrics {
  detectorId: string;
  samples: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  inconclusive: number;
  precision: number | null;
  recall: number | null;
  falsePositiveRate: number | null;
  availability: number;
  benchmarkScore: number;
}
