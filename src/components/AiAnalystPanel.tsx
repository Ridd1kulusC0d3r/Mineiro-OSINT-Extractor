import { useMemo, useState } from 'react';
import { BrainCircuit, Loader2, Send, Sparkles } from 'lucide-react';
import type { ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';
import type { AnalystCopilotOutput } from '../ai/analystCopilot';
import type { IntelligenceRequirement } from '../intelligence/types';
import { useI18n } from '../utils/i18n';

interface AiAnalystPanelProps {
  target: string;
  results: ScanResult[];
  apiKey?: string;
  model?: string;
  requirement?: IntelligenceRequirement;
}

export function AiAnalystPanel({ target, results, apiKey, model, requirement = 'account_correlation' }: AiAnalystPanelProps) {
  const { tr } = useI18n();
  const assessment = useMemo(() => buildIntelligenceAssessment(results, target || 'target', requirement), [results, target, requirement]);
  const [question, setQuestion] = useState('');
  const [output, setOutput] = useState<(AnalystCopilotOutput & { modelUsed?: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const prioritizedAssessment = {
        ...assessment,
        evidence: assessment.evidence.slice(0, 100),
      };
      const res = await fetch('/api/intelligence/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'x-gemini-api-key': apiKey } : {}),
        },
        body: JSON.stringify({
          targetLabel: target,
          assessment: prioritizedAssessment,
          analystQuestion: question.trim() || undefined,
          model,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tr('ai.requestFailed'));
      setOutput(data);
    } catch (err: any) {
      setError(err?.message || tr('ai.requestFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="rounded-[24px] border border-[#2b3035] bg-[#101316] p-6 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9299a2]">
            <BrainCircuit className="h-4 w-4" />
            AI Analyst Copilot
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#f4f5f6]">
            {tr('ai.copilotTitle')}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#8f969f]">
            {tr('ai.copilotDesc')}
          </p>
        </div>
        <div className="rounded-xl border border-[#333941] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#aeb4bb]">
          {tr('ai.optional')}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={tr('ai.questionPlaceholder')}
          className="min-h-11 flex-1 rounded-xl border border-[#30363c] bg-[#0b0e10] px-4 text-sm text-[#eef0f2] outline-none placeholder:text-[#626a73] focus:border-[#646c75]"
        />
        <button
          type="button"
          onClick={run}
          disabled={isLoading || results.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#49515a] bg-[#171b1f] px-5 text-sm font-medium text-[#f1f2f3] hover:bg-[#1c2125] disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Analisar
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-[#4a3f3f] bg-[#171313] p-4 text-sm text-[#c7b8b8]">{error}</div>
      )}

      {output && (
        <div className="mt-7 space-y-6 border-t border-[#282d32] pt-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#f1f2f3]">
              <Sparkles className="h-4 w-4" />
              Executive brief
            </div>
            <p className="mt-3 max-w-4xl text-base leading-relaxed text-[#a2a8b0]">{output.executiveBrief}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#858c95]">{tr('ai.contradictions')}</div>
              <div className="mt-3 space-y-2">
                {(output.contradictionsToResolve || []).map((item, i) => (
                  <div key={i} className="border-l border-[#4b525a] pl-3 text-sm leading-relaxed text-[#a1a7af]">{item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#858c95]">{tr('ai.intelligenceGaps')}</div>
              <div className="mt-3 space-y-3">
                {(output.intelligenceGaps || []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-[#292f34] p-3">
                    <div className="text-xs font-medium text-[#dfe2e5]">{item.importance}</div>
                    <div className="mt-1 text-sm text-[#a0a6ae]">{item.question}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#858c95]">{tr('ai.recommendedPivots')}</div>
              <div className="mt-3 space-y-3">
                {(output.recommendedPivots || []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-[#292f34] p-3">
                    <div className="text-xs font-medium text-[#dfe2e5]">{item.priority}</div>
                    <div className="mt-1 text-sm text-[#a0a6ae]">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.15em] text-[#69717a]">
            Provenance: AI_SYNTHESIZED · factual confidence raised: NO · model: {output.modelUsed || model || 'configured'}
          </div>
        </div>
      )}
    </section>
  );
}
