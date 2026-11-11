import {
  FileSearch,
  GitFork,
  LayoutGrid,
  Search,
  Table,
  Terminal,
  FileSpreadsheet,
} from 'lucide-react';
import { useI18n } from '../utils/i18n';

type View =
  | 'intelligence'
  | 'dashboard'
  | 'grid'
  | 'table'
  | 'profile'
  | 'ai'
  | 'linkage'
  | 'terminal'
  | 'batch';

interface StatsBarProps {
  activeView: View;
  setActiveView: (view: View) => void;
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

const views: Array<{
  id: View;
  label: 'nav.intelligence' | 'nav.evidence' | 'nav.platforms' | 'nav.correlation' | 'nav.console';
  icon: typeof FileSearch;
}> = [
  { id: 'intelligence', label: 'nav.intelligence', icon: FileSearch },
  { id: 'table', label: 'nav.evidence', icon: Table },
  { id: 'grid', label: 'nav.platforms', icon: LayoutGrid },
  { id: 'linkage', label: 'nav.correlation', icon: GitFork },
  { id: 'terminal', label: 'nav.console', icon: Terminal },
];

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
  batchCount = 0,
  isBatchActive = false,
}: StatsBarProps) {
  const { tr } = useI18n();
  const percent = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;
  const auditView = activeView === 'table' || activeView === 'grid';

  const statusLabel = (status: 'all' | 'found' | 'uncertain' | 'not_found') =>
    status === 'not_found'
      ? tr('stats.absent')
      : status === 'all'
        ? tr('stats.all')
        : status === 'uncertain'
          ? tr('stats.uncertain')
          : tr('stats.found');

  return (
    <div className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3">
          <nav className="tabs min-w-0 max-w-full" aria-label={tr('nav.views')}>
            {views.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveView(id)}
                aria-current={activeView === id ? 'page' : undefined}
                className={`tab ${activeView === id ? 'is-active' : ''}`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tr(label)}
              </button>
            ))}
            {(batchCount > 0 || isBatchActive || activeView === 'batch') && (
              <button
                type="button"
                onClick={() => setActiveView('batch')}
                aria-current={activeView === 'batch' ? 'page' : undefined}
                className={`tab ${activeView === 'batch' ? 'is-active' : ''}`}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {tr('nav.batch')}
                {batchCount > 0 && <span className="tab-count">{batchCount}</span>}
              </button>
            )}
          </nav>

          <div className="flex shrink-0 flex-wrap items-center gap-3 font-mono text-[11.5px] text-ink-3" aria-live="polite">
            <span className="tabular-nums">
              <span className="text-ink">{percent}%</span> {tr('stats.collected')}
            </span>
            <div
              className="h-1.5 w-24 overflow-hidden rounded-full bg-rule-2"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={tr('stats.collected')}
            >
              <div
                className={`h-full rounded-full bg-signal transition-all ${isScanning ? 'animate-pulse' : ''}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="tabular-nums">
              <span className="text-ink">{foundCount}</span> {tr('stats.found')}
            </span>
            {uncertainCount > 0 && (
              <span className="tabular-nums">
                <span className="text-ink">{uncertainCount}</span> {tr('stats.unresolved')}
              </span>
            )}
          </div>

          {auditView && (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="field relative h-9 min-w-[220px] flex-1 !rounded-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  id="filter-search-input"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder={tr('stats.filterEvidence')}
                  aria-label={tr('stats.filterEvidence')}
                  className="h-full w-full rounded-full bg-transparent pl-9 pr-3 text-[13px] text-ink outline-none placeholder:text-ink-3"
                />
              </div>
              <div className="tabs tabs-sm tabs-seg" role="group" aria-label={tr('stats.statusFilter')}>
                {(['all', 'found', 'uncertain', 'not_found'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    aria-pressed={statusFilter === status}
                    className="tab"
                  >
                    {statusLabel(status)}
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
