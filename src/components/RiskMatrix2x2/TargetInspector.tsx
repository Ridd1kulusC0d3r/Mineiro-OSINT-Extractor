import { ArrowUpRight, Check, Copy, ExternalLink } from 'lucide-react';
import { PlatformFavicon } from '../PlatformFavicon';
import type { RiskMatrixAccount } from './riskMatrix.logic';

interface TargetInspectorProps {
  selectedAccount: RiskMatrixAccount | null;
  copiedUrl: boolean;
  handleCopyUrl: (url: string) => void;
  onPivotScan?: (target: string) => void;
}

/** Right-hand card: the selected account's scores, priority, URL and actions. */
export function TargetInspector({ selectedAccount, copiedUrl, handleCopyUrl, onPivotScan }: TargetInspectorProps) {
  return (
  <div className="lg:col-span-4 flex flex-col space-y-3">
    <div className="border border-rule bg-paper p-4 space-y-4 h-full flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-rule pb-2">
          <span className="text-[10px] text-ink-3 uppercase tracking-wider font-bold">
            TARGET INSPECTOR & TRIAGE
          </span>
          {selectedAccount && (
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
              selectedAccount.quadrant === 'critical'
                ? 'border-rule bg-paper-2/40 text-ink-2'
                : selectedAccount.quadrant === 'latent'
                ? 'border-rule bg-paper-2/40 text-ink-2'
                : selectedAccount.quadrant === 'surface'
                ? 'border-rule bg-paper-2/40 text-ink-2'
                : 'border-rule bg-rule-2 text-ink-3'
            }`}>
              {selectedAccount.quadrant.toUpperCase()}
            </span>
          )}
        </div>

        {selectedAccount ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <PlatformFavicon platformName={selectedAccount.platformName} url={selectedAccount.url} className="w-7 h-7" />
              <div>
                <h4 className="text-sm font-bold text-ink uppercase">{selectedAccount.platformName}</h4>
                <span className="text-[11px] text-ink-3">Category: {selectedAccount.category}</span>
              </div>
            </div>

            {/* Priority KPI Meters */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 border border-rule bg-paper-2 space-y-1">
                <span className="text-[10px] text-ink-3 uppercase block">Platform Sensitivity</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-ink">{selectedAccount.sensitivity}</span>
                  <span className="text-[10px] text-ink-3">/ 100</span>
                </div>
                <div className="w-full bg-rule-2 h-1 overflow-hidden">
                  <div 
                    className={`h-full ${selectedAccount.sensitivity >= 50 ? 'bg-ink-3' : 'bg-ink-3'}`} 
                    style={{ width: `${selectedAccount.sensitivity}%` }} 
                  />
                </div>
              </div>

              <div className="p-2.5 border border-rule bg-paper-2 space-y-1">
                <span className="text-[10px] text-ink-3 uppercase block">Activity Frequency</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold text-ink">{selectedAccount.activity}</span>
                  <span className="text-[10px] text-ink-3">/ 100</span>
                </div>
                <div className="w-full bg-rule-2 h-1 overflow-hidden">
                  <div 
                    className={`h-full ${selectedAccount.activity >= 50 ? 'bg-ink-3' : 'bg-ink-3'}`} 
                    style={{ width: `${selectedAccount.activity}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Priority Composite Score */}
            <div className="p-3 border border-rule bg-paper-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-ink-3">Triage Priority Index:</span>
                <strong className="text-ink font-bold">{selectedAccount.priorityScore} / 100</strong>
              </div>
              <p className="text-[11px] text-ink-2 leading-relaxed">
                {selectedAccount.description}
              </p>
            </div>

            {/* Endpoint URL display */}
            <div className="space-y-1">
              <span className="text-[10px] text-ink-3 uppercase">Target Endpoint:</span>
              <div className="p-2 border border-rule bg-paper-2 text-[11px] text-ink-2 truncate select-all">
                {selectedAccount.url}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-ink-3 text-xs">
            Select an account node to view forensic triage breakdown.
          </div>
        )}
      </div>

      {/* Action Bar */}
      {selectedAccount && (
        <div className="pt-3 border-t border-rule space-y-2">
          <div className="flex items-center gap-2">
            <a
              id="matrix-audit-live-url-link"
              href={selectedAccount.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-3 bg-signal text-signal-ink font-bold text-center hover:bg-ink transition-colors flex items-center justify-center gap-1.5 uppercase text-[11px]"
            >
              <span>Audit Live URL</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              id="matrix-copy-target-url-btn"
              onClick={() => handleCopyUrl(selectedAccount.url)}
              className="py-2 px-3 border border-rule bg-paper-2 text-ink-2 hover:text-ink hover:border-ink-3 transition-colors flex items-center justify-center text-[11px]"
              title="Copy URL to clipboard"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-ink" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {onPivotScan && (
            <button
              type="button"
              id="matrix-deep-pivot-scan-btn"
              onClick={() => onPivotScan(selectedAccount.platformName)}
              className="w-full py-1.5 border border-rule bg-paper text-ink-3 hover:text-ink hover:border-rule transition-colors text-[10px] uppercase flex items-center justify-center gap-1"
            >
              <span>Deep Pivot on Platform</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  </div>
  );
}
