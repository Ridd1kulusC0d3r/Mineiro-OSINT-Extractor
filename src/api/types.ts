// Request and response shapes of the /api routes the client calls. Each one mirrors what the route in server/routes/
// actually reads or sends (see the comment on each type); domain types come from src/types.ts and src/ai, not copies.
import type { EmailReconData } from '../types';
import type { AnalystCopilotOutput } from '../ai/analystCopilot';
import type { IntelligenceAssessment } from '../intelligence/types';
import type { VerifyStatus } from '../core/verifyOutcome';

/** GET /api/health (server/routes/registry.ts). */
export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  timestamp: string;
  geminiConfigured: boolean;
  publicMode: boolean;
  supportedDatabases: string[];
}

/** POST /api/osint/verify body (server/routes/verify.ts destructures exactly these fields). */
export interface VerifyRequest {
  url: string;
  platformId: string;
  expectedStatus?: number;
  errorStatus?: number;
  fastMode?: boolean;
  scanDepth?: 'fast' | 'deep';
  timeoutMs?: number;
  wafRetryStrategy?: 'none' | 'adaptive';
  enableEvidenceChecks?: boolean;
  baseline?: boolean;
  username?: string;
  detectorReliability?: number;
}

/** POST /api/osint/verify 200 reply (all three reply branches of server/routes/verify.ts; most fields are optional). */
export interface VerifyResponse {
  platformId?: string;
  url?: string;
  scanDepth?: 'fast' | 'deep';
  collectedAt?: string;
  detectorVersion?: string;
  status?: VerifyStatus;
  statusCode?: number;
  responseTimeMs?: number;
  confidenceScore?: number;
  detectorReliability?: number;
  evidenceLevel?: 'confirmed' | 'probable' | 'uncertain' | 'absent';
  evidenceSignals?: string[];
  evidenceChecksPassed?: number;
  evidenceChecksTotal?: number;
  baselineSimilarity?: number;
  evidenceHash?: string;
  uncertainReason?: string;
  wafRetried?: boolean;
  retryResolved?: boolean;
  wafStrategyApplied?: string;
  cached?: boolean;
  error?: string;
}

/** POST /api/osint/email-recon body (server/routes/email.ts); the 200 reply is EmailReconData. */
export interface EmailReconRequest {
  email: string;
}

/** POST /api/osint/gemini-validate body (server/routes/gemini.ts). */
export interface GeminiValidateRequest {
  apiKey: string;
  model: string;
}

/** POST /api/osint/gemini-validate 200 reply. A failed test is a 400 with `error` (an ApiError). */
export interface GeminiValidateResponse {
  valid: boolean;
  isConfigured: boolean;
  isCustom?: boolean;
  modelTested?: string;
  message?: string;
  supportedModels: string[];
  timestamp?: string;
}

/** GET /api/intelligence/copilot/status (server/routes/copilot.ts). */
export interface CopilotStatusResponse {
  configured: boolean;
  source: 'personal' | 'server' | 'none';
  defaultModel: string;
  supportedModels: string[];
  provider?: string;
}

/** POST /api/intelligence/copilot body. */
export interface CopilotRequest {
  targetLabel: string;
  assessment: IntelligenceAssessment;
  analystQuestion?: string;
  model?: string;
}

/** POST /api/intelligence/copilot 200 reply: the sanitized output plus what the route adds. */
export type CopilotResponse = AnalystCopilotOutput & {
  droppedEvidenceIds?: string[];
  modelUsed?: string;
  attemptedModels?: string[];
  generatedAt?: string;
};

export type { EmailReconData };
