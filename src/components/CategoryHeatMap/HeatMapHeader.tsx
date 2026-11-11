import { ArrowUpDown, Filter, Flame, Maximize2, Minimize2 } from 'lucide-react';
import type { HeatmapSortMode } from './categoryHeatMap.logic';

interface HeatMapHeaderProps {
  filterActiveOnly: boolean;
  setFilterActiveOnly: (value: boolean) => void;
  sortMode: HeatmapSortMode;
  setSortMode: (mode: HeatmapSortMode) => void;
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}

/** Title, active-only filter, sort selector and fullscreen toggle. */
export function HeatMapHeader({ filterActiveOnly, setFilterActiveOnly, sortMode, setSortMode, isFullscreen, setIsFullscreen }: HeatMapHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-4 mb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 border border-rule bg-rule-2 text-ink">
            <Flame className="w-4 h-4" />
          </span>
          <h3 className="text-sm font-bold text-ink tracking-wider uppercase flex items-center gap-2">
            D3.js Category Activity & Threat Heat Map
            <span className="px-2 py-0.5 text-[10px] bg-signal text-signal-ink font-bold">
              MULTI-DIMENSIONAL
            </span>
          </h3>
        </div>
        <p className="text-xs text-ink-3 font-sans">
          Thermal intensity and digital footprint mapping by sector: correlating presence, probe latency, OpSec risk, and metadata completeness.
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2 self-start">
        {/* Active only filter */}
        <button
          type="button"
          id="heatmap-filter-active-toggle-btn"
          onClick={() => setFilterActiveOnly(!filterActiveOnly)}
          className={`px-2.5 py-1.5 text-xs uppercase font-mono flex items-center gap-1.5 border transition-colors ${
            filterActiveOnly
              ? 'bg-rule-2 border-signal text-ink font-bold'
              : 'bg-paper border-rule text-ink-3 hover:text-ink'
          }`}
          title="Toggle between displaying only categories with found profiles or full catalog"
        >
          <Filter className="w-3 h-3" />
          {filterActiveOnly ? 'Active Only' : 'All'}
        </button>

        {/* Sort selector */}
        <div className="flex items-center border border-rule bg-paper text-xs">
          <span className="px-2 text-ink-3 flex items-center">
            <ArrowUpDown className="w-3 h-3 mr-1" />
            SORT:
          </span>
          <select
            id="heatmap-sort-select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as HeatmapSortMode)}
            className="bg-transparent text-ink py-1.5 pr-3 text-xs outline-none cursor-pointer"
          >
            <option value="intensity" className="bg-rule-2 text-ink">Highest Intensity</option>
            <option value="found" className="bg-rule-2 text-ink">Most Found</option>
            <option value="latency" className="bg-rule-2 text-ink">Lowest Latency</option>
            <option value="alphabetical" className="bg-rule-2 text-ink">Alphabetical</option>
          </select>
        </div>

        {/* Fullscreen toggle */}
        <button
          type="button"
          id="heatmap-fullscreen-toggle-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 border border-rule bg-paper text-ink-3 hover:text-ink transition-colors"
          title={isFullscreen ? 'Minimize' : 'Expand Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
