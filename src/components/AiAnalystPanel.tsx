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
  const { tr, language } = useI18n();
  const assessment = useMemo(() => buildIntelligenceAssessment(results, target || 'target', requirement, language), [results, target, requirement, language]);
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
    <section className="rounded-[24px] border border-[#37332B] bg-[#1B1915] p-6 md:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#908B7D]">
            <BrainCircuit className="h-4 w-4" />
            AI Analyst Copilot
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[#F3F0E8]">
            {tr('ai.copilotTitle')}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[#908B7D]">
            {tr('ai.copilotDesc')}
          </p>
        </div>
        <div className="rounded-xl border border-[#37332B] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#B9B4A6]">
          {tr('ai.optional')}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={tr('ai.questionPlaceholder')}
          className="min-h-11 flex-1 rounded-xl border border-[#37332B] bg-[#131210] px-4 text-sm text-[#ECE8DD] outline-none placeholder:text-[#6F6A5E] focus:border-[#6F6A5E]"
        />
        <button
          type="button"
          onClick={run}
          disabled={isLoading || results.length === 0}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#4A453A] bg-[#27241E] px-5 text-sm font-medium text-[#ECE8DD] hover:bg-[#27241E] disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Analisar
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-[#4A453A] bg-[#221F1A] p-4 text-sm text-[#B9B4A6]">{error}</div>
      )}

      {output && (
        <div className="mt-7 space-y-6 border-t border-[#37332B] pt-6">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-[#ECE8DD]">
              <Sparkles className="h-4 w-4" />
              Executive brief
            </div>
            <p className="mt-3 max-w-4xl text-base leading-relaxed text-[#A19C8E]">{output.executiveBrief}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#908B7D]">{tr('ai.contradictions')}</div>
              <div className="mt-3 space-y-2">
                {(output.contradictionsToResolve || []).map((item, i) => (
                  <div key={i} className="border-l border-[#4A453A] pl-3 text-sm leading-relaxed text-[#A19C8E]">{item}</div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#908B7D]">{tr('ai.intelligenceGaps')}</div>
              <div className="mt-3 space-y-3">
                {(output.intelligenceGaps || []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-[#37332B] p-3">
                    <div className="text-xs font-medium text-[#ECE8DD]">{item.importance}</div>
                    <div className="mt-1 text-sm text-[#A19C8E]">{item.question}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#908B7D]">{tr('ai.recommendedPivots')}</div>
              <div className="mt-3 space-y-3">
                {(output.recommendedPivots || []).map((item, i) => (
                  <div key={i} className="rounded-xl border border-[#37332B] p-3">
                    <div className="text-xs font-medium text-[#ECE8DD]">{item.priority}</div>
                    <div className="mt-1 text-sm text-[#A19C8E]">{item.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] uppercase tracking-[0.15em] text-[#6F6A5E]">
            Provenance: AI_SYNTHESIZED · factual confidence raised: NO · model: {output.modelUsed || model || 'configured'}
          </div>
        </div>
      )}
    </section>
  );
}
