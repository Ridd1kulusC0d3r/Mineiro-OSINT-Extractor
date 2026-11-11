import { AlertTriangle } from 'lucide-react';
import type { computeGeographicalThreatReport } from '../../data/geoPlatforms';

interface MapFilterBarProps {
  originCount: number;
  threatReport: ReturnType<typeof computeGeographicalThreatReport>;
  filterJurisdiction: string;
  setFilterJurisdiction: (id: string) => void;
  onlyPhysicalRisk: boolean;
  setOnlyPhysicalRisk: (value: boolean) => void;
  showArcs: boolean;
  setShowArcs: (value: boolean) => void;
  showGraticule: boolean;
  setShowGraticule: (value: boolean) => void;
}

/** Jurisdiction tabs, the GPS-risk toggle and the layer checkboxes. */
export function MapFilterBar({
  originCount, threatReport, filterJurisdiction, setFilterJurisdiction, onlyPhysicalRisk, setOnlyPhysicalRisk,
  showArcs, setShowArcs, showGraticule, setShowGraticule,
}: MapFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-paper p-2.5 border border-rule text-xs">
      {/* Jurisdiction Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] text-ink-3 uppercase tracking-widest mr-1">
          JURISDICTION:
        </span>
        {[
          { id: 'all', label: `All (${originCount})` },
          { id: 'Five Eyes', label: `Five Eyes (${threatReport.fiveEyesCount})` },
          { id: 'EU / GDPR', label: `EU/GDPR (${threatReport.euGdprCount})` },
          { id: 'Swiss Sanctuary', label: `Swiss (${threatReport.sanctuaryCount})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterJurisdiction(tab.id)}
            className={`px-2 py-1 text-[11px] uppercase transition-colors ${
              filterJurisdiction === tab.id
                ? 'bg-signal text-signal-ink font-bold'
                : 'text-ink-3 hover:text-ink hover:bg-rule-2 border border-rule'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Physical Risk Highlight Filter */}
        {threatReport.highPhysicalRiskCount > 0 && (
          <button
            type="button"
            onClick={() => setOnlyPhysicalRisk(!onlyPhysicalRisk)}
            className={`px-2 py-1 text-[11px] uppercase border transition-colors flex items-center gap-1 ${
              onlyPhysicalRisk
                ? 'border-signal bg-signal text-signal-ink font-bold'
                : 'border-rule bg-paper text-ink-2 hover:border-ink-3'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-ink shrink-0" />
            GPS Risk ({threatReport.highPhysicalRiskCount})
          </button>
        )}
      </div>

      {/* Display Layer Toggles */}
      <div className="flex items-center gap-3 text-[11px] text-ink-3">
        <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-ink">
          <input
            type="checkbox"
            checked={showArcs}
            onChange={(e) => setShowArcs(e.target.checked)}
            className="accent-ink rounded-none cursor-pointer"
          />
          <span>Recon Arcs</span>
        </label>
        <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-ink">
          <input
            type="checkbox"
            checked={showGraticule}
            onChange={(e) => setShowGraticule(e.target.checked)}
            className="accent-ink rounded-none cursor-pointer"
          />
          <span>Graticule Grid</span>
        </label>
      </div>
    </div>
  );
}
