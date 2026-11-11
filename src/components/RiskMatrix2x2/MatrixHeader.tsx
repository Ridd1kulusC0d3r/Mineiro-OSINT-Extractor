import { Globe2, Layers, Lock, Search, ShieldAlert } from 'lucide-react';
import type { QuadrantFilter } from './riskMatrix.logic';

interface MatrixHeaderProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  activeQuadrantFilter: QuadrantFilter;
  setActiveQuadrantFilter: (value: QuadrantFilter) => void;
  counts: Record<QuadrantFilter, number>;
}

/** Title, search box and quadrant filter pills. */
export function MatrixHeader({ searchQuery, setSearchQuery, activeQuadrantFilter, setActiveQuadrantFilter, counts }: MatrixHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rule pb-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-ink-3 inline-block shadow-[0_0_8px_color-mix(in_srgb,var(--ink-3)_80%,transparent)]" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
            2x2 TARGET RISK MATRIX // PLATFORM SENSITIVITY VS. ACTIVITY
          </h3>
          <span className="px-2 py-0.5 border border-rule bg-paper text-[10px] text-ink-3">
            D3.js Vector Engine
          </span>
        </div>
        <p className="text-ink-3 text-xs">
          Bivariate prioritization mapping across confirmed platforms to triage high-value confidential vaults and active exposure surfaces.
        </p>
      </div>

      {/* Search & Quadrant Filter Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Target / Platform Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-ink-3 absolute left-2 pointer-events-none" />
          <input
            id="matrix-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search platform/cat..."
            className="pl-7 pr-6 py-1 bg-paper border border-rule text-ink text-[11px] placeholder:text-ink-3 focus:outline-none focus:border-signal w-40 sm:w-48 font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              id="matrix-clear-search-btn"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 text-[10px] text-ink-3 hover:text-ink px-1"
              title="Clear Search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quadrant Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="matrix-filter-all-btn"
            onClick={() => setActiveQuadrantFilter('all')}
            className={`px-2.5 py-1 text-[11px] font-mono border transition-all ${
              activeQuadrantFilter === 'all'
                ? 'bg-signal text-signal-ink font-bold border-signal'
                : 'bg-paper text-ink-3 border-rule hover:text-ink hover:border-rule'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            type="button"
            id="matrix-filter-critical-btn"
            onClick={() => setActiveQuadrantFilter('critical')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
              activeQuadrantFilter === 'critical'
                ? 'bg-ink-3 text-paper font-bold border-ink-3'
                : 'bg-paper text-ink-3 border-rule hover:border-rule'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            Critical ({counts.critical})
          </button>

          <button
            type="button"
            id="matrix-filter-latent-btn"
            onClick={() => setActiveQuadrantFilter('latent')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
              activeQuadrantFilter === 'latent'
                ? 'bg-ink-3 text-paper font-bold border-ink-3'
                : 'bg-paper text-ink-3 border-rule hover:border-rule'
            }`}
          >
            <Lock className="w-3 h-3" />
            Latent ({counts.latent})
          </button>

          <button
            type="button"
            id="matrix-filter-surface-btn"
            onClick={() => setActiveQuadrantFilter('surface')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
              activeQuadrantFilter === 'surface'
                ? 'bg-ink-3 text-paper font-bold border-ink-3'
                : 'bg-paper text-ink-3 border-rule hover:border-rule'
            }`}
          >
            <Globe2 className="w-3 h-3" />
            Surface ({counts.surface})
          </button>

          <button
            type="button"
            id="matrix-filter-peripheral-btn"
            onClick={() => setActiveQuadrantFilter('peripheral')}
            className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
              activeQuadrantFilter === 'peripheral'
                ? 'bg-ink-2 text-paper font-bold border-ink-2'
                : 'bg-paper text-ink-3 border-rule hover:text-ink'
            }`}
          >
            <Layers className="w-3 h-3" />
            Peripheral ({counts.peripheral})
          </button>
        </div>
      </div>
    </div>
  );
}
