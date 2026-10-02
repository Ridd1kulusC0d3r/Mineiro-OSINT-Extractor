import type { IntelligenceAssessment } from '../intelligence/types';

export interface AnalystCopilotInput {
  targetLabel: string;
  assessment: IntelligenceAssessment;
  analystQuestion?: string;
}

export interface AnalystCopilotOutput {
  executiveBrief: string;
  priorityEvidenceIds: string[];
  contradictionsToResolve: string[];
  intelligenceGaps: Array<{
    question: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    rationale: string;
  }>;
  recommendedPivots: Array<{
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: string;
    rationale: string;
  }>;
  alternativeHypotheses: string[];
  confidenceCaveat: string;
  provenance: {
    type: 'AI_SYNTHESIZED';
    factualConfidenceRaised: false;
  };
}

export function buildAnalystCopilotPrompt(input: AnalystCopilotInput): string {
  const compact = {
    collection: input.assessment.collection,
    judgments: input.assessment.judgments,
    evidence: input.assessment.evidence.slice(0, 30),
    clusters: input.assessment.clusters,
    hypotheses: input.assessment.hypotheses,
    contradictions: input.assessment.contradictoryEvidence,
    gaps: input.assessment.gaps,
    pivots: input.assessment.pivots,
    question: input.analystQuestion || null,
  };

  return [
    'You are an OSINT analysis copilot.',
    'Use only the supplied public-evidence assessment.',
    'Do not infer sensitive traits, mental state, political views, sexuality, religion, health, private identity, or criminality.',
    'Do not claim that equal usernames prove equal identities.',
    'Do not increase factual confidence merely because an inference sounds plausible.',
    'Treat contradictions as first-class analytical evidence.',
    'Prefer actions that validate existing public evidence over collecting more weak matches.',
    'Return strict JSON with keys: executiveBrief, priorityEvidenceIds, contradictionsToResolve, intelligenceGaps, recommendedPivots, alternativeHypotheses, confidenceCaveat.',
    '',
    JSON.stringify(compact, null, 2),
  ].join('\n');
}

/** JSON Schema handed to Gemini (`responseJsonSchema`) so the output shape is enforced by the provider, not by regex cleanup. */
export const COPILOT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    executiveBrief: { type: 'string' },
    priorityEvidenceIds: { type: 'array', items: { type: 'string' } },
    contradictionsToResolve: { type: 'array', items: { type: 'string' } },
    intelligenceGaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          importance: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          rationale: { type: 'string' },
        },
        required: ['question', 'importance', 'rationale'],
      },
    },
    recommendedPivots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          action: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['priority', 'action', 'rationale'],
      },
    },
    alternativeHypotheses: { type: 'array', items: { type: 'string' } },
    confidenceCaveat: { type: 'string' },
  },
  required: ['executiveBrief', 'priorityEvidenceIds', 'intelligenceGaps', 'recommendedPivots', 'confidenceCaveat'],
} as const;

/**
 * Post-validation: the model may only cite evidence that exists in the supplied assessment.
 * Unknown ids are dropped and reported, so a fabricated reference never reaches the analyst as if it were real.
 */
export function sanitizeCopilotOutput(
  parsed: Record<string, any>,
  validEvidenceIds: Iterable<string>
): { output: Record<string, any>; droppedEvidenceIds: string[] } {
  const valid = new Set(validEvidenceIds);
  const cited: string[] = Array.isArray(parsed.priorityEvidenceIds) ? parsed.priorityEvidenceIds.map(String) : [];
  const kept = cited.filter((id) => valid.has(id));
  const array = (value: unknown) => (Array.isArray(value) ? value : []);

  return {
    output: {
      executiveBrief: typeof parsed.executiveBrief === 'string' ? parsed.executiveBrief : '',
      priorityEvidenceIds: kept,
      contradictionsToResolve: array(parsed.contradictionsToResolve),
      intelligenceGaps: array(parsed.intelligenceGaps),
      recommendedPivots: array(parsed.recommendedPivots),
      alternativeHypotheses: array(parsed.alternativeHypotheses),
      confidenceCaveat: typeof parsed.confidenceCaveat === 'string' ? parsed.confidenceCaveat : '',
    },
    droppedEvidenceIds: cited.filter((id) => !valid.has(id)),
  };
}
