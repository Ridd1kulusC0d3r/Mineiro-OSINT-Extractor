import { ScanResult, AiProfileReport, EmailReconData } from '../types';

interface DossierPrintViewProps {
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  aiProfile: AiProfileReport | null;
  emailData: EmailReconData | null;
}

export function DossierPrintView({
  target,
  targetType,
  results,
  aiProfile,
  emailData
}: DossierPrintViewProps) {
  const foundResults = results.filter((r) => r.status === 'found');
  const uncertainResults = results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited');
  const dateStr = new Date().toUTCString();

  return (
    <div className="hidden print:block bg-white text-black p-8 max-w-4xl mx-auto font-mono text-xs space-y-6">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black tracking-widest uppercase">
            MINEIRO UNIFIED OSINT DOSSIER
          </h1>
          <p className="text-xs text-neutral-600 uppercase">
            Unified Open-Source Intelligence Reconnaissance Report (Mineiro local catalog)
          </p>
        </div>
        <div className="text-right text-[11px] space-y-0.5">
          <div>DATE: {dateStr}</div>
          <div>CLASSIFICATION: UNCLASSIFIED / OSINT</div>
          <div>ENGINE: MINEIRO v3.0 UNIFIED</div>
        </div>
      </div>

      {/* Target metadata */}
      <div className="border border-black p-4 space-y-2">
        <div className="text-xs font-bold uppercase border-b border-black pb-1">
          1. TARGET METRICS & SCOPE
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Target Moniker</div>
            <div className="text-sm font-bold">@{target}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Target Mode</div>
            <div className="text-sm font-bold uppercase">{targetType}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Verified Hits</div>
            <div className="text-sm font-bold">{foundResults.length} Accounts</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Uncertain (WAF/Cloudflare)</div>
            <div className="text-sm font-bold">{uncertainResults.length} Platforms</div>
          </div>
        </div>
      </div>

      {/* Email Recon summary if applicable */}
      {emailData && (
        <div className="border border-black p-4 space-y-2">
          <div className="text-xs font-bold uppercase border-b border-black pb-1">
            2. EMAIL RECONNAISSANCE FINDINGS
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>Email: <strong>{emailData.email}</strong></div>
            <div>Domain: <strong>{emailData.domain}</strong></div>
            <div>MX Records: <strong>{emailData.mxRecordsFound ? 'Verified Active' : 'Not Detected'}</strong></div>
            <div>Gravatar: <strong>{emailData.gravatarExists ? 'Associated Profile Located' : 'None'}</strong></div>
          </div>
        </div>
      )}

      {/* AI Intelligence Assessment */}
      {aiProfile && (
        <div className="border border-black p-4 space-y-3">
          <div className="text-xs font-bold uppercase border-b border-black pb-1">
            3. AI BEHAVIORAL & THREAT ASSESSMENT (GEMINI)
          </div>
          <div>
            <div className="text-[10px] text-neutral-500 uppercase">Executive Summary</div>
            <p className="pt-1 leading-relaxed">{aiProfile.summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Target Archetype</div>
              <div className="font-bold">{aiProfile.archetype}</div>
              {aiProfile.archetypeDescription && (
                <div className="text-[10px] text-neutral-600 mt-0.5">{aiProfile.archetypeDescription}</div>
              )}
            </div>
            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Threat Level Rating</div>
              <div className="font-bold">{aiProfile.threatLevel}</div>
            </div>
          </div>
          {aiProfile.threatActorAnalysis && (
            <div className="border-t border-black pt-2 space-y-1">
              <div className="text-[10px] text-neutral-500 uppercase">Threat Actor & Occupation Analysis</div>
              <div className="text-[11px]">
                Classification: <strong>{aiProfile.threatActorAnalysis.verdictTitle}</strong> ({aiProfile.threatActorAnalysis.threatActorCategory}) — Score: {aiProfile.threatActorAnalysis.threatActorScore}/100
              </div>
              <div className="text-[10px] text-neutral-700">
                Inferred Occupation: <strong>{aiProfile.threatActorAnalysis.occupationCrossReference.inferredOccupation}</strong> | Consistency: <strong>{aiProfile.threatActorAnalysis.occupationCrossReference.consistencyVerdict}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verified Platforms Table */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase border-b border-black pb-1">
          4. CONFIRMED PLATFORMS LEDGER ({foundResults.length} HITS)
        </div>
        <table className="w-full border-collapse border border-black text-[11px]">
          <thead>
            <tr className="bg-neutral-100 border-b border-black">
              <th className="border border-black p-1.5 text-left">Platform</th>
              <th className="border border-black p-1.5 text-left">Category</th>
              <th className="border border-black p-1.5 text-left">Target Profile URL</th>
              <th className="border border-black p-1.5 text-right">HTTP</th>
              <th className="border border-black p-1.5 text-right">Latency</th>
            </tr>
          </thead>
          <tbody>
            {foundResults.length === 0 ? (
              <tr>
                <td colSpan={5} className="border border-black p-3 text-center text-neutral-500">
                  No verified accounts located.
                </td>
              </tr>
            ) : (
              foundResults.map((r) => (
                <tr key={r.id} className="border-b border-black">
                  <td className="border border-black p-1.5 font-bold">{r.platformName}</td>
                  <td className="border border-black p-1.5 uppercase text-[10px]">{r.category}</td>
                  <td className="border border-black p-1.5 break-all text-[10px]">{r.url}</td>
                  <td className="border border-black p-1.5 text-right">{r.statusCode || 200}</td>
                  <td className="border border-black p-1.5 text-right">{r.responseTimeMs || 0}ms</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mineiro Guard Uncertain Watchlist if any */}
      {uncertainResults.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold uppercase border-b border-black pb-1">
            5. UNCERTAIN / PROTECTED PLATFORMS ({uncertainResults.length})
          </div>
          <p className="text-[10px] text-neutral-600">
            Sites requiring headless browser / TLS fingerprint emulation when Cloudflare or another WAF interferes with verification:
          </p>
          <ul className="list-disc pl-5 text-[10px] space-y-0.5">
            {uncertainResults.map((u) => (
              <li key={u.id}>
                <strong>{u.platformName}</strong> ({u.url}) - {u.uncertainReason || 'Cloudflare / Anti-bot challenge'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer watermark */}
      <div className="border-t-2 border-black pt-3 text-[10px] text-neutral-600 flex justify-between">
        <span>MINEIRO UNIFIED OSINT ENGINE // AUTOMATED FORENSIC DOSSIER</span>
        <span>PAGE 1 OF 1 // CONFIDENTIAL INTELLIGENCE DOCUMENT</span>
      </div>
    </div>
  );
}
