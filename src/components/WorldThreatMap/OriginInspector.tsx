import { AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';
import type { MappedOrigin } from '../../data/geoPlatforms';

interface OriginInspectorProps {
  activeFocus: MappedOrigin;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
  onClose: () => void;
}

/** Floating forensic HUD for the clicked or hovered origin. */
export function OriginInspector({ activeFocus, copiedKey, copyToClipboard, onClose }: OriginInspectorProps) {
  return (
    <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-96 border border-signal bg-paper/95 backdrop-blur-md p-4 text-xs space-y-3 z-20 shadow-2xl">
      <div className="flex items-start justify-between gap-2 border-b border-rule pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-ink font-bold text-sm tracking-wide">
              {activeFocus.platformName}
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 border border-rule bg-rule-2 text-ink-2">
              {activeFocus.category}
            </span>
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5">
            {activeFocus.city}, {activeFocus.country}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => copyToClipboard(activeFocus.url, `url-${activeFocus.id}`)}
            className="p-1.5 border border-rule bg-rule-2 text-ink-2 hover:text-ink"
            title="Copy URL"
          >
            {copiedKey === `url-${activeFocus.id}` ? (
              <Check className="w-3.5 h-3.5 text-ink" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <a
            href={activeFocus.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 border border-rule bg-rule-2 text-ink-2 hover:text-ink"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Resolved Server IP & Network Infrastructure */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 border border-rule bg-paper-2">
          <div className="text-[9px] text-ink-3 uppercase flex items-center justify-between">
            <span>RESOLVED SERVER IP</span>
            <button
              type="button"
              onClick={() => copyToClipboard(activeFocus.serverIp, `ip-${activeFocus.id}`)}
              className="text-ink-3 hover:text-ink"
              title="Copy IP"
            >
              {copiedKey === `ip-${activeFocus.id}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
          </div>
          <div className="text-ink font-mono font-bold mt-0.5 truncate">
            {activeFocus.serverIp}
          </div>
        </div>

        <div className="p-2 border border-rule bg-paper-2">
          <div className="text-[9px] text-ink-3 uppercase">AUTONOMOUS SYSTEM</div>
          <div className="text-ink font-mono mt-0.5 truncate" title={activeFocus.asn}>
            {activeFocus.asn}
          </div>
        </div>
      </div>

      {/* Coordinates & Hosting Telemetry */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 border border-rule bg-paper-2">
          <div className="text-[9px] text-ink-3 uppercase">SERVER COORDS</div>
          <div className="text-ink font-mono mt-0.5">
            {activeFocus.coordinates[1].toFixed(3)}°, {activeFocus.coordinates[0].toFixed(3)}°
          </div>
        </div>

        <div className="p-2 border border-rule bg-paper-2">
          <div className="text-[9px] text-ink-3 uppercase">THREAT DENSITY</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`font-bold ${activeFocus.threatDensityWeight > 80 ? 'text-ink-3' : 'text-ink'}`}>
              {activeFocus.threatDensityWeight}/100
            </span>
            <div className="flex-1 bg-rule h-1.5">
              <div
                className={`h-1.5 ${activeFocus.threatDensityWeight > 80 ? 'bg-ink-3' : 'bg-signal'}`}
                style={{ width: `${activeFocus.threatDensityWeight}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Attack Surface & Subpoena Notes */}
      <div className="space-y-1 text-[11px] font-sans">
        <div className="flex items-center justify-between">
          <span className="text-ink-3 font-mono text-[10px] uppercase">SUBPOENA RISK:</span>
          <span className="text-ink font-bold font-mono">{activeFocus.subpoenaExposure}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-3 font-mono text-[10px] uppercase">BACKBONE CARRIER:</span>
          <span className="text-ink font-mono truncate max-w-[200px]">{activeFocus.isp}</span>
        </div>
        {activeFocus.physicalRisk === 'high' && (
          <div className="p-2 border border-rule bg-rule-2 text-ink text-[11px] flex items-start gap-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <div>
              <strong className="text-ink block">Physical Geolocation Risk Vector</strong>
              {activeFocus.threatNotes}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-rule text-[10px] text-ink-3 font-mono">
        <span className="truncate max-w-[200px] text-ink-3">HOST: {activeFocus.resolvedHost}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-ink-3 hover:text-ink uppercase underline ml-2"
        >
          Close HUD
        </button>
      </div>
    </div>
  );
}
