import { LayoutDashboard, LayoutGrid, Table, BrainCircuit, Terminal, Search, GitFork, FileSpreadsheet, FileSearch } from 'lucide-react';

interface StatsBarProps {
  activeView: 'intelligence' | 'dashboard' | 'grid' | 'table' | 'profile' | 'linkage' | 'terminal' | 'batch';
  setActiveView: (view: 'intelligence' | 'dashboard' | 'grid' | 'table' | 'profile' | 'linkage' | 'terminal' | 'batch') => void;
  scannedCount: number;
  totalCount: number;
  foundCount: number;
  uncertainCount?: number;
  searchFilter: string;
  setSearchFilter: (val: string) => void;
  statusFilter: 'all' | 'found' | 'uncertain' | 'not_found' | 'rate_limited';
  setStatusFilter: (val: 'all' | 'found' | 'uncertain' | 'not_found' | 'rate_limited') => void;
  isScanning: boolean;
  hasAiReport: boolean;
  batchCount?: number;
  isBatchActive?: boolean;
}

export function StatsBar({
  activeView,
  setActiveView,
  scannedCount,
  totalCount,
  foundCount,
  uncertainCount = 0,
  searchFilter,
  setSearchFilter,
  statusFilter,
  setStatusFilter,
  isScanning,
  hasAiReport,
  batchCount = 0,
  isBatchActive = false
}: StatsBarProps) {
  const percent = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-[#050505] border-b border-[#2A2A2A] py-3 font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        {/* Progress Metric Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[#A3A3A3] uppercase tracking-wider text-[11px]">COLLECTION:</span>
              <span className="font-bold text-[#F5F5F5] tabular-nums">{percent}%</span>
              <span className="text-[#737373] tabular-nums">({scannedCount}/{totalCount})</span>
            </div>
            <div className="w-24 sm:w-36 h-2 bg-[#0A0A0A] border border-[#2A2A2A] rounded-full overflow-hidden">
              <div
                className={`h-full bg-[#FFFFFF] transition-all duration-200 ${isScanning ? 'opacity-90 animate-pulse' : 'opacity-100'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0A0A0A] border border-[#2A2A2A]">
              <span className="text-[#A3A3A3] text-[11px] uppercase">FOUND:</span>
              <span className="text-[#FFFFFF] font-bold tabular-nums">{foundCount}</span>
            </div>
            {uncertainCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0A0A0A] border border-[#2A2A2A]">
                <span className="text-[#A3A3A3] text-[11px] uppercase">UNCERTAIN:</span>
                <span className="text-[#A3A3A3] font-bold tabular-nums">{uncertainCount}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#0A0A0A] border border-[#2A2A2A]">
              <span className="text-[#A3A3A3] text-[11px] uppercase">FOUND RATE:</span>
              <span className="text-[#F5F5F5] font-bold tabular-nums">
                {totalCount > 0 ? ((foundCount / (scannedCount || 1)) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Tabs and Local Search/Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 pt-2 border-t border-[#2A2A2A]">
          {/* View Switchers */}
          <div className="flex items-center border border-[#2A2A2A] bg-[#0A0A0A] p-1 rounded-sm self-start flex-wrap gap-1 shadow-sm">
            <button
              id="view-intelligence-btn"
              type="button"
              onClick={() => setActiveView('intelligence')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all ${
                activeView === 'intelligence'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              Intelligence
            </button>

            <button
              id="view-dashboard-btn"
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all ${
                activeView === 'dashboard'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              id="view-grid-btn"
              type="button"
              onClick={() => setActiveView('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all ${
                activeView === 'grid'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid View
            </button>

            <button
              id="view-table-btn"
              type="button"
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all ${
                activeView === 'table'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Audit Table
            </button>

            <button
              id="view-profile-btn"
              type="button"
              onClick={() => setActiveView('profile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all relative ${
                activeView === 'profile'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              AI Dossier
              {hasAiReport && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-pulse" />
              )}
            </button>

            <button
              id="view-linkage-btn"
              type="button"
              onClick={() => setActiveView('linkage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all ${
                activeView === 'linkage'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Linkages & Pivots
            </button>

            <button
              id="view-terminal-btn"
              type="button"
              onClick={() => setActiveView('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all ${
                activeView === 'terminal'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Console
            </button>

            {(batchCount > 0 || isBatchActive || activeView === 'batch') && (
              <button
                id="view-batch-btn"
                type="button"
                onClick={() => setActiveView('batch')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-sm transition-all relative ${
                  activeView === 'batch'
                    ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                    : 'text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#050505]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#FFFFFF]" />
                Batch Queue
                {batchCount > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-sm font-bold ${
                      activeView === 'batch'
                        ? 'bg-[#050505] text-[#FFFFFF]'
                        : 'bg-[#050505] text-[#A3A3A3] border border-[#2A2A2A]'
                    }`}
                  >
                    {batchCount}
                  </span>
                )}
                {isBatchActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF] animate-ping" />
                )}
              </button>
            )}
          </div>

          {/* Local Search & Status Filter — hidden in the report workspace to reduce visual density */}
          {activeView !== 'intelligence' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                id="filter-search-input"
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter by site name..."
                className="w-full h-8.5 bg-[#0A0A0A] border border-[#2A2A2A] rounded-sm text-xs font-mono pl-8 pr-7 text-[#F5F5F5] placeholder:text-[#737373] focus:outline-none focus:border-[#FFFFFF] transition-colors"
              />
              {searchFilter ? (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#F5F5F5] text-xs font-mono px-1 py-0.5 rounded hover:bg-[#2A2A2A]"
                  title="Clear filter (Esc)"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.2 text-[10px] font-mono bg-[#050505] border border-[#2A2A2A] rounded text-[#A3A3A3] pointer-events-none select-none">
                  /
                </kbd>
              )}
            </div>

            <div className="flex items-center border border-[#2A2A2A] bg-[#0A0A0A] p-0.5 rounded-sm text-xs font-mono h-8.5">
              {(['all', 'found', 'uncertain', 'not_found'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  id={`status-filter-${st}`}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-sm uppercase transition-all text-[11px] ${
                    statusFilter === st
                      ? 'bg-[#FFFFFF] text-[#050505] font-bold shadow-sm'
                      : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'uncertain' ? 'Uncertain' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
