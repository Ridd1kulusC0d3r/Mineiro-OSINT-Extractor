import { Activity, AlertTriangle, Fingerprint, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../utils/i18n';

interface KpiGridProps {
  foundCount: number;
  uncertainCount: number;
  scannedTotal: number;
  confidenceScore: number;
  avgLatency: number;
  exposureLevel: { label: string; color: string };
}

/** Verified hits, uncertain, conclusive share and attack surface tiles. */
export function KpiGrid({ foundCount, uncertainCount, scannedTotal, confidenceScore, avgLatency, exposureLevel }: KpiGridProps) {
  const { tr } = useI18n();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Confirmed Hits */}
      <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
        <div className="flex items-center justify-between label-mono">
          <span>Verified Hits</span>
          <ShieldCheck className="w-4 h-4 text-ink" />
        </div>
        <div>
          <div className="stat-num">{foundCount}</div>
          <div className="text-[11px] text-ink-2 mt-0.5">
            {scannedTotal > 0 ? `${((foundCount / scannedTotal) * 100).toFixed(1)}% detection rate` : 'Standby'}
          </div>
        </div>
        <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
          <span>STATUS: CONFIRMED</span>
          <span className="text-ink font-bold">200 OK</span>
        </div>
      </div>

      {/* Mineiro Guard model Uncertain (Cloudflare / WAF / TLS challenge) */}
      <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
        <div className="flex items-center justify-between label-mono">
          <span>Uncertain / Protected</span>
          <AlertTriangle className="w-4 h-4 text-ink-2" />
        </div>
        <div>
          <div className="stat-num">{uncertainCount}</div>
          <div className="text-[11px] text-ink-2 mt-0.5">
            Mineiro Guard Cloudflare/WAF challenge
          </div>
        </div>
        <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
          <span>{tr('dash.notNegative')}</span>
          <span className="text-ink-2">403/WAF</span>
        </div>
      </div>

      {/* Confidence Rating  */}
      <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
        <div className="flex items-center justify-between label-mono">
          <span>{tr('dash.conclusive')}</span>
          <Activity className="w-4 h-4 text-ink" />
        </div>
        <div>
          <div className="stat-num">{confidenceScore}%</div>
          <div className="text-[11px] text-ink-2 mt-0.5">
            {tr('dash.conclusiveDetail')}
          </div>
        </div>
        <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
          <span>AVG LATENCY</span>
          <span className="text-ink font-bold tabular-nums">{avgLatency} ms</span>
        </div>
      </div>

      {/* Public Attack Surface / Exposure Rating */}
      <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
        <div className="flex items-center justify-between label-mono">
          <span>Attack Surface</span>
          <Fingerprint className="w-4 h-4 text-ink" />
        </div>
        <div>
          <div className={`text-xl font-black inline-block px-2.5 py-0.5 border rounded-sm ${exposureLevel.color}`}>
            {exposureLevel.label}
          </div>
          <div className="text-[11px] text-ink-2 mt-1">
            Public footprint severity
          </div>
        </div>
        <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
          <span>TOTAL PROBES</span>
          <span className="text-ink font-bold tabular-nums">{scannedTotal} sites</span>
        </div>
      </div>
    </div>
  );
}
