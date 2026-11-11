import { AlertTriangle, Compass, Server, ShieldAlert } from 'lucide-react';
import type { computeGeographicalThreatReport } from '../../data/geoPlatforms';

interface ThreatMetricsProps {
  threatReport: ReturnType<typeof computeGeographicalThreatReport>;
  originCount: number;
}

/** Dispersion, Five Eyes, jurisdiction and physical-risk tiles, then the hosting nations strip. */
export function ThreatMetrics({ threatReport, originCount }: ThreatMetricsProps) {
  return (
    <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
      {/* Footprint Dispersion Profile */}
      <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-1">
        <div className="text-[10px] text-ink-3 uppercase tracking-widest flex items-center justify-between">
          <span>DISPERSION SPREAD</span>
          <Compass className="w-3.5 h-3.5 text-ink-3" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink leading-tight">
            {threatReport.dispersionProfile}
          </div>
          <div className="text-[11px] text-ink-3 mt-1">
            {threatReport.uniqueCountries} nations • {threatReport.uniqueCities} city clusters
          </div>
        </div>
      </div>

      {/* Five Eyes MLAT Intercept Exposure */}
      <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-1">
        <div className="text-[10px] text-ink-3 uppercase tracking-widest flex items-center justify-between">
          <span>FIVE EYES EXPOSURE</span>
          <ShieldAlert className="w-3.5 h-3.5 text-ink" />
        </div>
        <div>
          <div className="text-xl font-black text-ink">
            {threatReport.fiveEyesPercent}%
          </div>
          <div className="text-[11px] text-ink-3 mt-0.5">
            {threatReport.fiveEyesCount} of {originCount} nodes under MLAT sharing
          </div>
        </div>
      </div>

      {/* Legal Exposure Index */}
      <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-1">
        <div className="text-[10px] text-ink-3 uppercase tracking-widest flex items-center justify-between">
          <span>DOMINANT JURISDICTION</span>
          <Server className="w-3.5 h-3.5 text-ink-3" />
        </div>
        <div>
          <div className="text-sm font-bold text-ink truncate">
            {threatReport.dominantJurisdiction}
          </div>
          <div className="text-[11px] text-ink-3 mt-1">
            Primary regulatory legal vector
          </div>
        </div>
      </div>

      {/* Physical Geolocation Alert Status */}
      <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-1">
        <div className="text-[10px] text-ink-3 uppercase tracking-widest flex items-center justify-between">
          <span>PHYSICAL TRACKING RISK</span>
          <AlertTriangle className={`w-3.5 h-3.5 ${threatReport.highPhysicalRiskCount > 0 ? 'text-ink' : 'text-ink-3'}`} />
        </div>
        <div>
          <div className={`text-sm font-bold ${threatReport.highPhysicalRiskCount > 0 ? 'text-ink' : 'text-ink-3'}`}>
            {threatReport.highPhysicalRiskCount > 0 ? `${threatReport.highPhysicalRiskCount} Vectors Detected` : 'Minimal Leak Risk'}
          </div>
          <div className="text-[11px] text-ink-3 mt-1">
            {threatReport.highPhysicalRiskCount > 0
              ? 'Strava / media GPS traces detected'
              : 'No GPS fitness routes exposed'}
          </div>
        </div>
      </div>
    </div>

    {/* Top Host Nations Breakdown */}
    {threatReport.topCountries.length > 0 && (
      <div className="p-3 border border-rule bg-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <span className="text-[10px] text-ink-3 uppercase tracking-widest">
          HOSTING NATIONS CONCENTRATION:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {threatReport.topCountries.map((c) => (
            <span
              key={c.country}
              className="px-2 py-0.5 border border-rule bg-paper-2 text-ink-2 text-[11px] flex items-center gap-1.5"
            >
              <span className="font-semibold text-ink">{c.country}:</span>
              <span className="text-ink-3">{c.count} {c.count === 1 ? 'profile' : 'profiles'}</span>
            </span>
          ))}
        </div>
      </div>
    )}
    </>
  );
}
