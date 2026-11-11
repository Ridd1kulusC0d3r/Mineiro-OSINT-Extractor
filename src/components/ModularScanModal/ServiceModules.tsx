import { Cpu, Mail, Sparkles } from 'lucide-react';
import type { ModularScanConfig } from '../../types';
import { useI18n } from '../../utils/i18n';
import { CONCURRENCY_OPTIONS } from './modularScan.logic';

interface ServiceModulesProps {
  localConfig: ModularScanConfig;
  setLocalConfig: (config: ModularScanConfig) => void;
}

/** Modules 3 (e-mail recon), 4 (AI dossier) and 5 (concurrency). */
export function ServiceModules({ localConfig, setLocalConfig }: ServiceModulesProps) {
  const { tr } = useI18n();
  return (
    <>
      {/* Module 3: Email Reconnaissance & DNS MX */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
            3
          </div>
          <div>
            <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-ink-3" />
              Module 3: Email Reconnaissance & DNS MX Records
            </span>
            <p className="text-[11px] text-ink-3">
              Performs DNS MX queries for email domains and checks for Gravatar profile/avatar.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={localConfig.enableEmailRecon}
            onChange={(e) => {
              setLocalConfig({
                ...localConfig,
                preset: 'custom',
                enableEmailRecon: e.target.checked,
              });
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-rule peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-signal after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-signal after:border-ink-2 after:border after:h-5 after:w-5 after:transition-all peer-checked:bg-signal"></div>
        </label>
      </div>

      {/* Module 4: Gemini AI Intelligence Dossier Profiler */}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
            4
          </div>
          <div>
            <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-ink-3" />
              Module 4: AI Intelligence Dossier (Gemini)
            </span>
            <p className="text-[11px] text-ink-3">
              <strong className="text-ink-2">Disable to accelerate quick scans!</strong> When disabled, the AI dossier can still be generated on-demand anytime from the dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setLocalConfig({
                ...localConfig,
                preset: 'custom',
                enableAutoAiProfile: !localConfig.enableAutoAiProfile,
              });
            }}
            className={`px-2.5 py-1 text-[11px] border transition-colors ${
              localConfig.enableAutoAiProfile
                ? 'bg-paper-2 border-ink-3 text-ink'
                : 'bg-rule-2 border-rule text-ink-3 hover:text-ink'
            }`}
          >
            'AI Copilot · On demand'
          </button>
        </div>
      </div>

      {/* Module 5: Concurrency & Performance Engine */}
      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border border-rule bg-rule-2 flex items-center justify-center text-ink text-xs">
              5
            </div>
            <div>
              <span className="font-bold text-ink text-xs uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-ink-3" />
                Module 5: Network Concurrency & Latency Engine
              </span>
              <span className="text-[11px] text-ink-3">
                Adjust network concurrency to balance speed and rate-limiting stealth
              </span>
            </div>
          </div>

          <div className="tabs tabs-sm tabs-seg" role="group" aria-label={tr('modular.concurrency')}>
            {CONCURRENCY_OPTIONS.map((val) => ({ label: `${val}x`, val })).map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => {
                  setLocalConfig({
                    ...localConfig,
                    preset: 'custom',
                    concurrency: item.val,
                  });
                }}
                aria-pressed={localConfig.concurrency === item.val}
                className="tab"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
