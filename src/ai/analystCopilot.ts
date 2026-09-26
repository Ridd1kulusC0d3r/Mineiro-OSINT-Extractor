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
