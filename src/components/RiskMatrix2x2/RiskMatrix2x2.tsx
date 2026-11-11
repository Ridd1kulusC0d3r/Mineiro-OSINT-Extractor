import { useEffect, useRef, useState, useMemo } from 'react';
import { Filter, ShieldAlert } from 'lucide-react';
import { ScanResult, AiProfileReport } from '../../types';
import { useToast } from '../Toast';
import {
  buildRiskAccounts,
  countQuadrants,
  filterRiskAccounts,
  matrixDimensions,
  type QuadrantFilter,
  type RiskMatrixAccount,
} from './riskMatrix.logic';
import { renderRiskMatrix } from './riskMatrix.render';
import { MatrixHeader } from './MatrixHeader';
import { TargetInspector } from './TargetInspector';

interface RiskMatrix2x2Props {
  results: ScanResult[];
  target: string;
  aiProfile?: AiProfileReport | null;
  onPivotScan?: (target: string) => void;
}

export function RiskMatrix2x2({
  results,
  target,
  aiProfile,
  onPivotScan,
}: RiskMatrix2x2Props) {
  const { showToast } = useToast();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [selectedAccount, setSelectedAccount] = useState<RiskMatrixAccount | null>(null);
  const [activeQuadrantFilter, setActiveQuadrantFilter] = useState<QuadrantFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 700,
    height: 480,
  });

  // Observe container size dynamically with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (!containerRef.current) return;
      setDimensions(matrixDimensions(containerRef.current.clientWidth));
    };

    updateDimensions();
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Compute structured risk accounts from verified found results
  const accounts: RiskMatrixAccount[] = useMemo(() => buildRiskAccounts(results), [results]);

  // Quadrant counts
  const counts = useMemo(() => countQuadrants(accounts), [accounts]);

  // Filtered accounts based on quadrant tab and search
  const visibleAccounts = useMemo(
    () => filterRiskAccounts(accounts, activeQuadrantFilter, searchQuery),
    [accounts, activeQuadrantFilter, searchQuery],
  );

  // Auto-select first critical or highest priority account
  useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      const sorted = [...accounts].sort((a, b) => b.priorityScore - a.priorityScore);
      setSelectedAccount(sorted[0]);
    }
  }, [accounts, selectedAccount]);

  // D3 Visualization Render (riskMatrix.render.ts)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    renderRiskMatrix(svgRef.current, { dimensions, accounts, visibleAccounts, selectedAccount, activeQuadrantFilter, setSelectedAccount });
  }, [accounts, visibleAccounts, selectedAccount, activeQuadrantFilter, dimensions]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    showToast({
      title: 'Target URL Copied',
      message: url,
      type: 'copy',
    });
  };

  return (
    <div className="border border-rule bg-paper-2 p-5 space-y-5 font-mono text-xs">
      {/* Header & Controls */}
      <MatrixHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeQuadrantFilter={activeQuadrantFilter}
        setActiveQuadrantFilter={setActiveQuadrantFilter}
        counts={counts}
      />

      {/* Main Grid: D3 Matrix Canvas (left) + Target Inspector Card (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* D3 Vector Canvas Container (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          <div 
            ref={containerRef} 
            className="w-full bg-paper border border-rule overflow-hidden relative"
          >
            {accounts.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8 space-y-2">
                <ShieldAlert className="w-8 h-8 text-ink-3" />
                <span className="text-ink-3 font-bold uppercase">No Confirmed Targets For Risk Plotting</span>
                <span className="text-[11px] text-ink-3 max-w-sm">
                  Run a scan to corroborate verified platform identities. Discovered accounts will be automatically prioritized here.
                </span>
              </div>
            ) : visibleAccounts.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Filter className="w-7 h-7 text-ink-3" />
                <span className="text-ink-2 font-bold uppercase">No Platforms Match Current Filter</span>
                <span className="text-[11px] text-ink-3 max-w-sm">
                  No confirmed target profiles match quadrant &quot;{activeQuadrantFilter}&quot;{searchQuery ? ` and search &quot;${searchQuery}&quot;` : ''}.
                </span>
                <button
                  type="button"
                  id="matrix-reset-filters-btn"
                  onClick={() => {
                    setActiveQuadrantFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 bg-signal text-signal-ink font-bold uppercase text-[10px] hover:bg-ink transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <svg ref={svgRef} className="w-full block" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[10px] text-ink-3 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-ink-3 inline-block" /> Critical Priority (Top Right)
              <span className="w-2 h-2 rounded-full bg-ink-3 inline-block ml-2" /> Latent Vault (Top Left)
              <span className="w-2 h-2 rounded-full bg-ink-3 inline-block ml-2" /> Broad Surface (Bottom Right)
              <span className="w-2 h-2 rounded-full bg-ink-3 inline-block ml-2" /> Peripheral (Bottom Left)
            </span>
            <span>Click any node in the vector field to inspect target</span>
          </div>
        </div>

        {/* Selected Target Deep Inspector & Priority Brief (4 cols) */}
        <TargetInspector
          selectedAccount={selectedAccount}
          copiedUrl={copiedUrl}
          handleCopyUrl={handleCopyUrl}
          onPivotScan={onPivotScan}
        />
      </div>
    </div>
  );
}
