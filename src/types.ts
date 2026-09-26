export type Category = 
  | 'developer'
  | 'social'
  | 'gaming'
  | 'security'
  | 'creative'
  | 'crypto'
  | 'community'
  | 'media';

export type DatabaseSource = 'mineiro-core' | 'mineiro-legacy';

export type PlatformTargetType = 'username' | 'email' | 'both';

export interface Platform {
  id: string;
  name: string;
  category: Category;
  urlPattern: string;
  checkMethod: 'status_code' | 'body_content' | 'cors_proxy';
  targetType?: PlatformTargetType; // 'username' (default profile handle), 'email' (account check by email), or 'both'
  source?: DatabaseSource;
  errorStatus?: number;
  expectedStatus?: number;
  description?: string;
  icon?: string;
  siteType?: string;
  detectorReliability?: number; // reliability of the detector/rule, not trustworthiness of the site
  reliabilityTier?: 'high' | 'medium' | 'experimental';
  provenanceStatus?: 'verified' | 'legacy-audit-required' | 'external-attributed';
  licenseStatus?: string;
  optionalEvidenceChecks?: string[];
  lastVerified?: string;
  provenanceSource?: string;
  scannable?: boolean;
}

export interface TargetMetadata {
  displayName?: string;
  organization?: string;
  publicProjects?: string[];
  accountCreatedAt?: string;
  firstPublicEvidenceAt?: string;
  avatarHash?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  followers?: string;
  tags?: string[];
  extractedLinks?: string[];
}

export interface ScanResult {
  id: string;
  platformId: string;
  platformName: string;
  category: Category;
  url: string;
  status: 'found' | 'not_found' | 'uncertain' | 'rate_limited' | 'error' | 'scanning' | 'pending';
  statusCode?: number;
  responseTimeMs?: number;
  confidenceScore?: number; // 0 - 100 percentage computed from response and corroboration signals
  evidenceLevel?: 'confirmed' | 'probable' | 'uncertain' | 'absent';
  evidenceSignals?: string[];
  siteType?: string;
  detectorReliability?: number;
  reliabilityTier?: 'high' | 'medium' | 'experimental';
  evidenceChecksPassed?: number;
  evidenceChecksTotal?: number;
  sourceDatabase?: string;
  uncertainReason?: string; // e.g. "Cloudflare WAF challenge", "TLS Fingerprint mismatch"
  wafRetried?: boolean; // Whether adaptive WAF retry was executed for this platform
  retryResolved?: boolean; // Whether adaptive WAF retry returned a conclusive response after retry
  wafStrategyApplied?: string; // Identifier of the WAF retry strategy applied
  scanDepth?: 'fast' | 'deep'; // Depth level applied during individual probe
  metadata?: TargetMetadata;
  checkedAt?: string;
  provenanceType?: 'PRIMARY' | 'EXTERNAL';
  sourceObservedAt?: string;
}

export interface ScanSummaryMetrics {
  durationSeconds: number;
  avgLatencyMs: number;
  confidenceIndex: number;
  overallExposureRating: 'Minimal' | 'Moderate' | 'Elevated' | 'Severe';
  uncertainCount: number;
  foundCount: number;
  totalScanned: number;
  completedAt: string;
}

export interface InvestigationPivot {
  hop: string;
  type: 'username' | 'domain' | 'email' | 'crypto' | 'code';
  explanation: string;
  recommendedAction: string;
}

export interface BehavioralSignals {
  opsecHygiene: 'Poor' | 'Basic' | 'Moderate' | 'High' | 'Paranoid';
  timezone?: string; // e.g. "UTC-3 (America/Sao_Paulo / BRT)"
  timezoneSignals?: string[]; // Specific signals extracted from identified platform profiles
  activeTimezoneWindow: string; // e.g. "UTC-3 (14:00 - 23:00 UTC)"
  language?: string; // e.g. "Portuguese (Native) / English (Technical Standard)"
  primaryLanguage?: string; // e.g. "Portuguese" or "English"
  secondaryLanguages?: string[]; // e.g. ["English", "Spanish"]
  languageSignals?: string[]; // Specific language and locale indicators extracted from identified platform profiles
  linguisticStyle: string; // e.g. "Technical, concise, English & Portuguese bilingual indicators"
  socialExposureRisk: 'Minimal' | 'Moderate' | 'Elevated' | 'Severe';
  handlePersistencePattern: 'Single Moniker Reuse' | 'Predictable Affixes' | 'Segmented Personas' | 'High-Entropy Anon';
  anonymityEffort: 'Low' | 'Moderate' | 'High';
  accountCreationEra?: string; // e.g. "Early Adopter (2012-2016)"
}

export interface ThreatActorAnalysis {
  isThreatActorSuspect: boolean;
  threatActorCategory:
    | 'BENIGN_CIVILIAN'
    | 'AUTHORIZED_SECURITY_RESEARCHER'
    | 'AUTHORIZED_RED_TEAM'
    | 'DEFENSIVE_BLUE_TEAM'
    | 'COMMODITY_SCRIPT_OPERATOR'
    | 'UNDERGROUND_FORUM_BROKER'
    | 'FINANCIALLY_MOTIVATED_ACTOR'
    | 'HACKTIVIST_OPERATOR'
    | 'INSIDER_RISK_DISCREPANCY'
    | 'STEALTH_OPSEC_OPERATOR';
  threatActorScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
  verdictTitle: string;
  verdictSummary: string;
  occupationCrossReference: {
    inferredOccupation: string;
    platformBehaviorPattern: string;
    consistencyVerdict: 'CONSISTENT_LEGITIMATE' | 'NEUTRAL_BENIGN' | 'SUSPICIOUS_ANOMALY' | 'HIGH_RISK_DISCREPANCY';
    analysis: string;
  };
  observedTTPs: string[];
  indicatorMatches: Array<{
    category: 'underground' | 'offensive_tools' | 'opsec_evasion' | 'leaks_dumps' | 'credential_recon';
    severity: 'low' | 'medium' | 'high' | 'critical';
    indicator: string;
    evidence: string;
  }>;
  mitreTactics?: string[];
}

export interface TechnicalFootprint {
  level: 'None' | 'Minimal' | 'Moderate' | 'Advanced' | 'Expert';
  isTechProfessional: boolean;
  evidence: string;
  primaryTools?: string[];
}

export interface AiProfileReport {
  target: string;
  targetType: 'username' | 'email';
  summary: string;
  threatLevel: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  footprintScore: number; // 0 - 100
  industry?: string; // e.g. "Creative Arts & Design", "Cybersecurity & Infosec", "Endurance Athletics"
  interests?: string[]; // Distinct extracted subject-matter interests
  technicalFootprint?: TechnicalFootprint; // Distinct technical footprint assessment
  archetype: string; // e.g. "Offensive Security Engineer & Bug Bounty Hunter", "Concept Artist & Digital Illustrator"
  archetypeDescription?: string;
  behavioralSignals?: BehavioralSignals;
  threatActorAnalysis?: ThreatActorAnalysis;
  threatVulnerabilities?: string[];
  recommendedDefensiveActions?: string[];
  psycholinguisticClues?: string[];
  technicalSkills: string[];
  personalityTraits: string[];
  inferredLocations: string[];
  potentialInterests: string[];
  identityCorrelation: string;
  investigationPivots: InvestigationPivot[];
  generatedAt: string;
  modelUsed?: string;
  isCustomKey?: boolean;
  fallbackNotice?: string;
}

export interface AccountLinkageNode {
  id: string;
  label: string;
  category: 'target' | 'permutation' | 'email_variant' | 'platform' | 'associated_peer' | 'leak_correlation';
  mutationType: 'stem' | 'prefix' | 'suffix' | 'separator' | 'leetspeak' | 'email_alias' | 'familiar_tag' | 'initials';
  similarityScore: number; // 0 - 100
  reason: string;
  hypothesis: string;
  status: 'confirmed' | 'probable' | 'possible' | 'unverified';
  exampleUrl?: string;
  pivotHandle?: string;
}

export interface AccountLinkageReport {
  target: string;
  canonicalStem: string;
  permutations: AccountLinkageNode[];
  emailCorrelations: AccountLinkageNode[];
  familyPeerCorrelations: AccountLinkageNode[];
  behavioralHypotheses: string[];
  totalMutationsEvaluated: number;
}

export interface EmailReconData {
  email: string;
  username: string;
  domain: string;
  isValidSyntax: boolean;
  isDisposable: boolean;
  isCommonProvider: boolean;
  mxRecordsFound: boolean;
  mxServers: string[];
  gravatarExists: boolean;
  gravatarAvatarUrl?: string;
  hash: string;
  associatedFootprint: string[];
}

export interface ScanLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  target?: string;
}

export interface BulkTargetItem {
  id: string;
  target: string;
  type: 'username' | 'email';
  status: 'queued' | 'scanning' | 'completed' | 'failed' | 'skipped';
  foundCount: number;
  uncertainCount: number;
  totalScanned: number;
  results?: ScanResult[];
  emailData?: EmailReconData | null;
  aiProfile?: AiProfileReport | null;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  notes?: string;
}

export interface BulkBatchState {
  batchId: string;
  name: string;
  items: BulkTargetItem[];
  currentIndex: number;
  isActive: boolean;
  isPaused: boolean;
  autoAiProfile: boolean;
  selectedCategory: string;
  concurrency: number;
  startedAt?: string;
  completedAt?: string;
}

// Modular OSINT Scan Configuration
export type ScanPreset = 'quick' | 'standard' | 'deep' | 'email_only' | 'custom';

export type PlatformScope = 'top20' | 'top50' | 'category' | 'all' | 'none';

export interface ModularScanConfig {
  preset: ScanPreset;
  // Module 1: Platform Web Probes
  platformScope: PlatformScope;
  selectedCategory: string; // 'all' or specific Category
  // Module 2: Concurrency & Performance
  concurrency: number; // e.g. 4, 8, 16, 24
  timeoutMs: number; // 2500, 4500, 6000
  // Module 3: Anti-False-Positive & WAF Protection
  wafInspectionMode: 'fast' | 'deep'; // 'fast': raw HTTP status; 'deep': full body & Cloudflare WAF analysis
  wafRetryStrategy?: 'none' | 'adaptive'; // 'none': fail-fast single pass; 'adaptive': jitter backoff + browser spoof retry
  scanDepth?: 'fast' | 'deep'; // Quick toggle scan depth alias
  // Module 4: Email & DNS Intelligence
  enableEmailRecon: boolean; // DNS MX lookup & Gravatar check
  // Module 5: Gemini AI Dossier Generation
  enableAutoAiProfile: boolean; // Auto-trigger Gemini synthesis upon completion or on-demand
  enableEvidenceChecks: boolean; // run the optional multi-signal evidence engine on each response
  // Module 6: Account Linkage Correlation
  enableAccountLinkage: boolean; // Cross-platform correlation
}

// Local Investigation Integrity Snapshot
export interface InvestigationSnapshot {
  snapshotId: string;
  timestamp: string; // ISO string
  signature: string; // Legacy field name: SHA-256 integrity seal, not an authorship signature
  summaryHash: string; // Canonical SHA-256 digest of findings
  target: string;
  targetType: 'username' | 'email';
  verifiedCount: number;
  uncertainCount: number;
  totalPlatforms: number;
  aiArchetype?: string;
  threatLevel?: string;
  footprintScore?: number;
  summaryBlockText: string; // Formatted forensic verification block
}

// Local State Persistence Layer (localStorage Cache for last 5 scans)
export interface CachedInvestigation {
  id: string;
  target: string;
  targetType: 'username' | 'email';
  timestamp: string; // ISO date string
  formattedTime: string; // e.g. "16/09 03:45"
  results: ScanResult[];
  emailData: EmailReconData | null;
  aiProfile: AiProfileReport | null;
  preset: ScanPreset;
  foundCount: number;
  uncertainCount: number;
  totalScanned: number;
  durationMs?: number;
  snapshot?: InvestigationSnapshot | null;
}

