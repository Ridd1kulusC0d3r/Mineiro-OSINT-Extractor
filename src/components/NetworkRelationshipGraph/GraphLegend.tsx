import type { SizingMode } from './networkGraph.logic';

interface GraphLegendProps {
  sizingMode: SizingMode;
  targetRadius: number;
}

/** Floating legend over the canvas, with the active sizing metric. */
export function GraphLegend({ sizingMode, targetRadius }: GraphLegendProps) {
  return (
    <div className="absolute bottom-3 left-3 bg-paper/90 border border-rule p-2.5 backdrop-blur-md text-[10px] space-y-1.5 pointer-events-none hidden sm:block">
      <div className="text-ink-3 font-bold uppercase tracking-wider flex items-center justify-between gap-4">
        <span>Topology Legend</span>
        <span className="text-ink font-normal">
          Sizing: {sizingMode === 'completeness' ? 'AI Completeness' : sizingMode === 'density' ? 'Activity Density' : 'Uniform'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-signal inline-block border border-ink-3" />
        <span className="text-ink-2">Target Core (Radius {targetRadius}px)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-ink-2 inline-block" />
        <span className="text-ink-2">Category Hubs (Dynamic Gauge)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-signal inline-block" />
        <span className="text-ink-2">Confirmed Hits (Sized by AI Score)</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-0.5 bg-signal inline-block border-t border-dotted border-signal" />
        <span className="text-ink-2">Shared Metadata Cluster Links</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-ink-3 inline-block" />
        <span className="text-ink-2">Account Permutations</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-ink-2 inline-block" />
        <span className="text-ink-2">Email Correlations</span>
      </div>
    </div>
  );
}
