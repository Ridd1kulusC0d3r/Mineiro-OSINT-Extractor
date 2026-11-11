import { Activity, BrainCircuit, Maximize2, Minimize2, Network, RotateCcw, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';
import type { GraphFilterMode, SizingMode } from './networkGraph.logic';

interface GraphToolbarProps {
  nodeCount: number;
  linkCount: number;
  hasAiProfile: boolean;
  sizingMode: SizingMode;
  setSizingMode: (mode: SizingMode) => void;
  filterMode: GraphFilterMode;
  setFilterMode: (mode: GraphFilterMode) => void;
  handleZoom: (scaleFactor: number) => void;
  handleResetZoom: () => void;
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
}

/** Title, node/link counts, sizing and topology switches, zoom and fullscreen buttons. */
export function GraphToolbar({
  nodeCount, linkCount, hasAiProfile, sizingMode, setSizingMode, filterMode, setFilterMode, handleZoom,
  handleResetZoom, isFullscreen, setIsFullscreen,
}: GraphToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b border-rule bg-paper/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-2.5">
        <Network className="w-4 h-4 text-ink" />
        <span className="text-xs font-bold text-ink uppercase tracking-wider">
          D3.js Relationship & Cluster Graph
        </span>
        <span className="text-[10px] px-2 py-0.5 border border-rule bg-rule-2 text-ink-3">
          {nodeCount} Nodes • {linkCount} Links
        </span>
        {hasAiProfile && (
          <span className="text-[10px] px-2 py-0.5 border border-ink/30 bg-rule-2 text-ink flex items-center gap-1">
            <BrainCircuit className="w-3 h-3 text-ink" />
            AI Intelligence Grounded
          </span>
        )}
      </div>

      {/* Filter and Sizing Toggles */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Node Sizing Mode Selector */}
        <div className="flex items-center border border-rule bg-paper p-0.5">
          <span className="text-[10px] text-ink-3 px-2 uppercase font-semibold hidden xl:inline">
            Sizing:
          </span>
          <button
            type="button"
            id="graph-sizing-completeness-btn"
            onClick={() => setSizingMode('completeness')}
            className={`px-2 py-1 text-[10px] uppercase transition-colors flex items-center gap-1 ${
              sizingMode === 'completeness' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
            title="Scale nodes by Profile Completeness extracted from AI analysis"
          >
            <Sparkles className="w-3 h-3" />
            AI Completeness
          </button>
          <button
            type="button"
            id="graph-sizing-density-btn"
            onClick={() => setSizingMode('density')}
            className={`px-2 py-1 text-[10px] uppercase transition-colors flex items-center gap-1 ${
              sizingMode === 'density' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
            title="Scale nodes by Activity Density & cluster concentration"
          >
            <Activity className="w-3 h-3" />
            Activity Density
          </button>
          <button
            type="button"
            id="graph-sizing-uniform-btn"
            onClick={() => setSizingMode('uniform')}
            className={`px-2 py-1 text-[10px] uppercase transition-colors ${
              sizingMode === 'uniform' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
            title="Standard uniform node radii"
          >
            Uniform
          </button>
        </div>

        {/* Topology Filter Buttons */}
        <div className="flex items-center border border-rule bg-paper p-0.5">
          <button
            type="button"
            id="graph-filter-all-btn"
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
              filterMode === 'all' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            All
          </button>
          <button
            type="button"
            id="graph-filter-hits-btn"
            onClick={() => setFilterMode('found_only')}
            className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
              filterMode === 'found_only' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Hits
          </button>
          <button
            type="button"
            id="graph-filter-linkages-btn"
            onClick={() => setFilterMode('linkages')}
            className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
              filterMode === 'linkages' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Linkage
          </button>
          <button
            type="button"
            id="graph-filter-clusters-btn"
            onClick={() => setFilterMode('clusters')}
            className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
              filterMode === 'clusters' ? 'bg-signal text-signal-ink font-bold' : 'text-ink-3 hover:text-ink'
            }`}
          >
            Hubs
          </button>
        </div>

        {/* Zoom Buttons */}
        <div className="flex items-center gap-1 border border-rule bg-paper p-0.5">
          <button
            type="button"
            id="graph-zoom-in-btn"
            onClick={() => handleZoom(1.3)}
            className="p-1 text-ink-3 hover:text-ink hover:bg-rule-2"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="graph-zoom-out-btn"
            onClick={() => handleZoom(0.7)}
            className="p-1 text-ink-3 hover:text-ink hover:bg-rule-2"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="graph-zoom-reset-btn"
            onClick={handleResetZoom}
            className="p-1 text-ink-3 hover:text-ink hover:bg-rule-2"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          id="graph-fullscreen-toggle-btn"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 border border-rule bg-paper text-ink-3 hover:text-ink"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
