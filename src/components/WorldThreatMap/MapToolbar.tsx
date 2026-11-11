import { Activity, Flame, Globe, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface MapToolbarProps {
  visualizationMode: 'density' | 'vectors';
  setVisualizationMode: (mode: 'density' | 'vectors') => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleResetZoom: () => void;
}

/** Title, density/vectors switch and zoom buttons. */
export function MapToolbar({ visualizationMode, setVisualizationMode, handleZoomIn, handleZoomOut, handleResetZoom }: MapToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
      <div className="flex items-center gap-2.5">
        <Globe className="w-4 h-4 text-ink shrink-0" />
        <div>
          <div className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <span>Geographical Threat Footprint Density</span>
            <span className="text-[10px] px-1.5 py-0.2 border border-rule bg-paper text-ink-2">
              D3 Cartographic Engine
            </span>
          </div>
          <div className="text-[11px] text-ink-3 font-sans mt-0.5">
            Correlating discovered profile URLs with physical server IPs, host datacenters, and jurisdictional legal exposure.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Visualization Mode Toggle: Density Heatmap vs Network Vectors */}
        <div className="inline-flex border border-rule bg-paper p-0.5">
          <button
            id="mode-density-btn"
            type="button"
            onClick={() => setVisualizationMode('density')}
            className={`px-2.5 py-1 text-[11px] uppercase flex items-center gap-1.5 transition-colors ${
              visualizationMode === 'density'
                ? 'bg-signal text-signal-ink font-bold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Density Heatmap
          </button>
          <button
            id="mode-vectors-btn"
            type="button"
            onClick={() => setVisualizationMode('vectors')}
            className={`px-2.5 py-1 text-[11px] uppercase flex items-center gap-1.5 transition-colors ${
              visualizationMode === 'vectors'
                ? 'bg-signal text-signal-ink font-bold'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Network Vectors
          </button>
        </div>

        {/* Zoom Buttons */}
        <div className="inline-flex border border-rule bg-paper">
          <button
            id="map-zoom-in-btn"
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-ink-3 hover:text-ink hover:bg-rule-2 border-r border-rule"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="map-zoom-out-btn"
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-ink-3 hover:text-ink hover:bg-rule-2 border-r border-rule"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="map-zoom-reset-btn"
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 text-[10px] uppercase text-ink-3 hover:text-ink hover:bg-rule-2 flex items-center gap-1"
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
