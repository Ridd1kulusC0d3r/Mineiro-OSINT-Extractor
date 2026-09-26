import { useEffect, useState } from 'react';
import { BrainCircuit, CheckCircle2, Settings2, TriangleAlert } from 'lucide-react';
import type { ScanResult } from '../types';
import type { IntelligenceRequirement } from '../intelligence/types';
import { AiAnalystPanel } from './AiAnalystPanel';

interface AiWorkspaceProps {
  target: string;
  results: ScanResult[];
  apiKey?: string;
  model?: string;
  requirement: IntelligenceRequirement;
  onOpenConfig: () => void;
}

export function AiWorkspace({
  target,
  results,
  apiKey,
  model,
  requirement,
  onOpenConfig,
}: AiWorkspaceProps) {
  const [status, setStatus] = useState<{
    configured: boolean;
    source: 'personal' | 'server' | 'none';
    defaultModel: string;
    supportedModels: string[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/intelligence/copilot/status', {
      headers: apiKey ? { 'x-gemini-api-key': apiKey } : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus({
            configured: Boolean(apiKey),
            source: apiKey ? 'personal' : 'none',
            defaultModel: model || 'gemini-3.8-flash',
            supportedModels: ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'],
          });
        }
      });
    return () => { cancelled = true; };
  }, [apiKey, model]);

  return (
    <div className="space-y-6">
      <section className="rounded-[22px] border border-[#2b3035] bg-[#101316] p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8d949d]">
              <BrainCircuit className="h-4 w-4" />
              AI Analyst
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#f4f5f6]">
              Copilot analítico conectado ao assessment, não ao legado de profiling.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#9097a0]">
              A IA recebe a camada estruturada de evidência e pode resumir, revisar contradições, gaps e pivôs. Ela não aumenta confidence factual sozinha.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenConfig}
            className="inline-flex items-center gap-2 rounded-xl border border-[#3a4148] px-4 py-2.5 text-sm text-[#d9dde1] hover:bg-[#171b1f]"
          >
            <Settings2 className="h-4 w-4" />
            Configure Gemini
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[16px] border border-[#292f34] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">Connection</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-[#e6e9ec]">
              {status?.configured ? <CheckCircle2 className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
              {status?.configured ? 'configured' : 'not configured'}
            </div>
          </div>
          <div className="rounded-[16px] border border-[#292f34] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">Credential source</div>
            <div className="mt-2 text-sm text-[#e6e9ec]">{status?.source || (apiKey ? 'personal' : 'unknown')}</div>
          </div>
          <div className="rounded-[16px] border border-[#292f34] p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#747c85]">Selected model</div>
            <div className="mt-2 font-mono text-sm text-[#e6e9ec]">{model || status?.defaultModel || 'gemini-3.8-flash'}</div>
          </div>
        </div>
      </section>

      <AiAnalystPanel
        target={target}
        results={results}
        apiKey={apiKey}
        model={model}
        requirement={requirement}
      />
    </div>
  );
}
