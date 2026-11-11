import { Crosshair, Flame, Radio } from 'lucide-react';

interface MapOverlaysProps {
  visualizationMode: 'density' | 'vectors';
  clusterCount: number;
  originCount: number;
}

/** Legend, vantage badge and the empty state drawn over the map. */
export function MapOverlays({ visualizationMode, clusterCount, originCount }: MapOverlaysProps) {
  return (
    <>
      {/* Threat Footprint Density Color Scale Legend (Overlay Top-Right) */}
      {visualizationMode === 'density' && (
        <div className="absolute top-3 right-3 p-2.5 border border-rule/90 bg-paper/90 backdrop-blur-md text-[10px] space-y-1.5 z-10">
          <div className="text-ink-2 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3 h-3 text-ink-3" />
            Threat Footprint Density
          </div>
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 rounded-none bg-gradient-to-r from-ink-3 via-ink-3 via-ink-3 to-ink-3" />
          </div>
          <div className="flex justify-between text-[9px] text-ink-3 font-mono">
            <span>Moderate</span>
            <span>Elevated</span>
            <span>Critical</span>
          </div>
        </div>
      )}

      {/* Overlay Compass / Legend Badge (Overlay Top-Left) */}
      <div className="absolute top-3 left-3 pointer-events-none p-2 border border-rule/80 bg-paper/85 backdrop-blur-sm text-[10px] space-y-1">
        <div className="flex items-center gap-1.5 text-ink-2 font-bold uppercase tracking-wider">
          <Crosshair className="w-3 h-3 text-ink" />
          Vantage: Frankfurt Node [50.11°N, 8.68°E]
        </div>
        <div className="text-ink-3">
          {clusterCount} Datacenter Hubs Identified • {originCount} Correlated Endpoints
        </div>
      </div>

      {/* Empty state overlay if zero hits */}
      {originCount === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper/75 p-6 text-center">
          <Radio className="w-8 h-8 text-ink-3 mb-2 animate-pulse" />
          <div className="text-sm font-bold text-ink uppercase tracking-wider">
            Awaiting Reconnaissance Hits
          </div>
          <div className="text-xs text-ink-3 max-w-sm mt-1 font-sans">
            Run a profile or email probe to correlate discovered URLs with server IP infrastructure and display threat footprint density.
          </div>
        </div>
      )}
    </>
  );
}
