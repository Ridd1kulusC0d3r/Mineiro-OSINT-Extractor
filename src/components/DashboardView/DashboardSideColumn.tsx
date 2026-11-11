import { AlertTriangle, Fingerprint, Mail } from 'lucide-react';
import type { EmailReconData, ScanResult } from '../../types';
import type { CategoryStats } from './dashboard.logic';

interface DashboardSideColumnProps {
  target: string;
  emailData: EmailReconData | null;
  foundResults: ScanResult[];
  uncertainResults: ScanResult[];
  scannedTotal: number;
  categoryStats: CategoryStats;
  onViewTable: () => void;
  onViewGrid: () => void;
  onViewProfile: () => void;
  onViewTerminal: () => void;
}

/** Right column: e-mail infrastructure or identity signature, protection watchlist, workspace shortcuts. */
export function DashboardSideColumn({
  target, emailData, foundResults, uncertainResults, scannedTotal, categoryStats, onViewTable, onViewGrid,
  onViewProfile, onViewTerminal,
}: DashboardSideColumnProps) {
  return (
  <div className="space-y-6">
    {/* Email Recon / DNS Metadata */}
    {emailData ? (
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-rule-2 pb-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-ink" />
            <span className="card-title">
              Email Infrastructure
            </span>
          </div>
          <span className="text-[10px] text-ink-2 uppercase">DNS MX</span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="text-[10px] text-ink-2 uppercase">Target Address</div>
            <div className="text-ink font-bold break-all">{emailData.email}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 border border-rule bg-paper rounded-sm">
              <div className="text-[9px] text-ink-2 uppercase">Domain Type</div>
              <div className="text-ink font-semibold">
                {emailData.isDisposable ? 'Disposable' : emailData.isCommonProvider ? 'Commercial' : 'Enterprise'}
              </div>
            </div>
            <div className="p-2.5 border border-rule bg-paper rounded-sm">
              <div className="text-[9px] text-ink-2 uppercase">MX Resolution</div>
              <div className="text-ink font-semibold">
                {emailData.mxRecordsFound ? 'Active Host' : 'No MX'}
              </div>
            </div>
          </div>

          {emailData.gravatarExists && (
            <div className="p-2.5 border border-rule bg-paper rounded-sm flex items-center gap-2.5">
              {emailData.gravatarAvatarUrl && (
                <img
                  src={emailData.gravatarAvatarUrl}
                  alt="Gravatar"
                  className="w-8 h-8 border border-signal rounded-sm"
                />
              )}
              <div>
                <div className="text-ink font-bold text-[11px]">Gravatar Verified</div>
                <div className="text-[10px] text-ink-2">Public profile image confirmed</div>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="card p-5 space-y-3 rounded-md">
        <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase border-b border-rule pb-2">
          <Fingerprint className="w-4 h-4 text-ink" />
          PII & Identity Signature
        </div>
        <p className="text-xs text-ink-2 leading-relaxed">
          Reconnaissance on handle <strong className="text-ink">@{target}</strong> indicates active digital footprint across multiple distinct service clusters.
        </p>
        <div className="space-y-2 pt-1 text-[11px]">
          <div className="flex justify-between border-b border-rule pb-1">
            <span className="text-ink-2">Handle Cohesion:</span>
            <span className="text-ink font-semibold">
              {foundResults.length > 5 ? 'High (Moniker Reuse)' : 'Moderate'}
            </span>
          </div>
          <div className="flex justify-between border-b border-rule pb-1">
            <span className="text-ink-2">Dominant Cluster:</span>
            <span className="text-ink font-semibold">
              {Object.entries(categoryStats).sort((a, b) => (b[1] as { total: number; found: number; weighted: number; detectorSum: number }).found - (a[1] as { total: number; found: number; weighted: number; detectorSum: number }).found)[0]?.[0] || 'Pending'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-2">Mineiro Guard Anti-Bot Rate:</span>
            <span className="text-ink-2 tabular-nums">
              {scannedTotal > 0 ? `${((uncertainResults.length / scannedTotal) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>
      </div>
    )}

    {/* Mineiro Guard Uncertain / Protected Sites Box */}
    <div className="card p-5 space-y-3 rounded-md">
      <div className="flex items-center justify-between border-b border-rule pb-2">
        <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase">
          <AlertTriangle className="w-3.5 h-3.5 text-ink-2" />
          Mineiro Guard Protection Watchlist
        </div>
        <span className="text-[10px] text-ink-2 font-bold tabular-nums">
          {uncertainResults.length} SITES
        </span>
      </div>
      <p className="text-[11px] text-ink-2 leading-relaxed">
        These platforms returned Cloudflare WAF challenges or strict anti-bot responses. As per the Mineiro Guard model, they are flagged as <em>Uncertain</em> rather than false negatives.
      </p>
      {uncertainResults.length > 0 ? (
        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
          {uncertainResults.map((u) => (
            <div
              key={u.id}
              className="p-2 border border-rule bg-paper rounded-sm flex items-center justify-between text-[11px]"
            >
              <span className="text-ink font-semibold">{u.platformName}</span>
              <span className="text-[10px] text-ink-2">
                HTTP {u.statusCode || 403} WAF
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 border border-rule bg-paper rounded-sm text-center text-ink-2 text-[11px]">
          No active Cloudflare/WAF blocks recorded in this scope.
        </div>
      )}
    </div>

    {/* Quick Nav Action Shortcuts */}
    <div className="p-4 card space-y-2">
      <div className="text-[11px] text-ink-2 uppercase tracking-widest">
        Reconnaissance Workspaces
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={onViewTable}
          className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
        >
          <div className="font-bold text-ink">Audit Table</div>
          <div className="text-[10px] text-ink-2">Dense ledger</div>
        </button>
        <button
          type="button"
          onClick={onViewGrid}
          className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
        >
          <div className="font-bold text-ink">Grid Matrix</div>
          <div className="text-[10px] text-ink-2">Visual cards</div>
        </button>
        <button
          type="button"
          onClick={onViewProfile}
          className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
        >
          <div className="font-bold text-ink">AI Dossier</div>
          <div className="text-[10px] text-ink-2">Threat profile</div>
        </button>
        <button
          type="button"
          onClick={onViewTerminal}
          className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
        >
          <div className="font-bold text-ink">Console CLI</div>
          <div className="text-[10px] text-ink-2">Live streams</div>
        </button>
      </div>
    </div>
  </div>
  );
}
