import { Mail, CheckCircle2, XCircle, ShieldAlert, Server, Globe } from 'lucide-react';
import { EmailReconData } from '../types';

interface EmailReconCardProps {
  data: EmailReconData | null;
  isLoading: boolean;
}

export function EmailReconCard({ data, isLoading }: EmailReconCardProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-6 text-center space-y-3 font-mono">
        <div className="w-8 h-8 border-2 border-neutral-400 border-t-transparent animate-spin rounded-full mx-auto" />
        <p className="text-xs text-neutral-400 tracking-wide">RESOLVING DNS MX RECORDS & GRAVATAR FOOTPRINT...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 sm:p-5 space-y-4 font-mono text-xs shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-neutral-400" />
          <span className="text-white font-semibold tracking-wider uppercase text-xs">EMAIL RECONNAISSANCE INTELLIGENCE</span>
        </div>
        <span className="text-neutral-400 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800 uppercase text-[10px]">
          MD5: {data.hash.slice(0, 12)}...
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Syntax Check */}
        <div className="p-3 rounded-md border border-neutral-800/80 bg-neutral-950/70 space-y-1.5">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Syntax Validity</div>
          <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
            {data.isValidSyntax ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>VALID RFC 5322</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-400">INVALID FORMAT</span>
              </>
            )}
          </div>
        </div>

        {/* MX Mail Records */}
        <div className="p-3 rounded-md border border-neutral-800/80 bg-neutral-950/70 space-y-1.5">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">MX DNS Server</div>
          <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
            {data.mxRecordsFound ? (
              <>
                <Server className="w-3.5 h-3.5 text-neutral-400" />
                <span>ACTIVE MAIL HOST</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-neutral-400">NO MX DETECTED</span>
              </>
            )}
          </div>
        </div>

        {/* Disposable Analysis */}
        <div className="p-3 rounded-md border border-neutral-800/80 bg-neutral-950/70 space-y-1.5">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Domain Type</div>
          <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
            {data.isDisposable ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-300">TEMPORARY / BURNER</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                <span>{data.isCommonProvider ? 'COMMERCIAL PROVIDER' : 'CUSTOM ENTERPRISE'}</span>
              </>
            )}
          </div>
        </div>

        {/* Gravatar Presence */}
        <div className="p-3 rounded-md border border-neutral-800/80 bg-neutral-950/70 space-y-1.5">
          <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium">Gravatar Profile</div>
          <div className="flex items-center gap-2 text-white font-semibold text-xs">
            {data.gravatarExists ? (
              <>
                {data.gravatarAvatarUrl && (
                  <img
                    src={data.gravatarAvatarUrl}
                    alt="Gravatar"
                    className="w-5 h-5 rounded-full border border-neutral-700"
                  />
                )}
                <span className="text-neutral-400">VERIFIED LINKED</span>
              </>
            ) : (
              <span className="text-neutral-500">NO AVATAR FOUND</span>
            )}
          </div>
        </div>
      </div>

      {/* Associated footprints */}
      {data.associatedFootprint && data.associatedFootprint.length > 0 && (
        <div className="border-t border-neutral-800/80 pt-3 flex flex-wrap items-center gap-2">
          <span className="text-neutral-400 text-[11px] uppercase tracking-wider font-medium">INFRASTRUCTURE SIGNATURE:</span>
          {data.associatedFootprint.map((fp, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-md border border-neutral-800 bg-neutral-950 text-neutral-300 text-xs font-mono"
            >
              {fp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
