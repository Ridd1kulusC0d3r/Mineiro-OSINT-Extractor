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

  return (
    <div className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 py-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-5 overflow-x-auto">
            <nav className="flex shrink-0 items-center gap-1">
              {views.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveView(id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activeView === id
                      ? 'bg-rule-2 text-ink'
                      : 'text-ink-3 hover:bg-card hover:text-ink'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tr(label)}
                </button>
              ))}
              {(batchCount > 0 || isBatchActive || activeView === 'batch') && (
                <button
                  type="button"
                  onClick={() => setActiveView('batch')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activeView === 'batch'
                      ? 'bg-rule-2 text-ink'
                      : 'text-ink-3 hover:bg-card hover:text-ink'
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Batch
                  {batchCount > 0 && <span className="text-ink-2">{batchCount}</span>}
                </button>
              )}
            </nav>

            <div className="hidden h-4 w-px shrink-0 bg-rule md:block" />

            <div className="hidden shrink-0 items-center gap-3 text-xs text-ink-3 md:flex">
              <span className="tabular-nums">{percent}% {tr('stats.collected')}</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-rule-2">
                <div
                  className={`h-full rounded-full bg-ink transition-all ${isScanning ? 'animate-pulse' : ''}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="tabular-nums">{foundCount} {tr('stats.found')}</span>
              {uncertainCount > 0 && <span className="tabular-nums">{uncertainCount} {tr('stats.unresolved')}</span>}
            </div>
          </div>

          {auditView && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[210px] flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  id="filter-search-input"
                  value={searchFilter}
                  onChange={(event) => setSearchFilter(event.target.value)}
                  placeholder={tr('stats.filterEvidence')}
                  className="h-9 w-full rounded-lg border border-rule bg-card pl-9 pr-3 text-xs text-ink outline-none placeholder:text-ink-3 focus:border-ink-3"
                />
              </div>
              <div className="flex h-9 items-center gap-1 rounded-lg border border-rule bg-card p-1">
                {(['all', 'found', 'uncertain', 'not_found'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-md px-2 py-1 text-[10px] uppercase tracking-[0.08em] transition ${
                      statusFilter === status
                        ? 'bg-ink text-paper'
                        : 'text-ink-3 hover:text-ink'
                    }`}
                  >
                    {status === 'not_found' ? tr('stats.absent') : status === 'all' ? tr('stats.all') : status === 'uncertain' ? tr('stats.uncertain') : status}
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
