import { useEffect, useRef, useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { ScanResult, EmailReconData, AiProfileReport } from '../../types';
import { useThemeVersion } from '../../theme/useThemeVersion';
import {
  computeCategoryMetrics,
  filterAndSortCategories,
  pickActiveCategory,
  type CategoryMetrics,
  type HeatmapSortMode,
  type HeatmapViewMode,
  type HoveredCell,
} from './categoryHeatMap.logic';
import { renderHeatMap } from './categoryHeatMap.render';
import { HeatMapHeader } from './HeatMapHeader';
import { HoverStatusBar } from './HoverStatusBar';
import { CategoryDrilldown } from './CategoryDrilldown';

interface CategoryHeatMapProps {
  results: ScanResult[];
  target: string;
  targetType: 'username' | 'email';
  emailData: EmailReconData | null;
  aiProfile?: AiProfileReport | null;
  onPivotScan?: (newTarget: string) => void;
  onSelectCategory?: (category: string) => void;
}

export function CategoryHeatMap({
  results,
  target,
  targetType,
  emailData,
  aiProfile,
  onPivotScan,
  onSelectCategory,
}: CategoryHeatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewMode, setViewMode] = useState<HeatmapViewMode>('matrix');
  const [sortMode, setSortMode] = useState<HeatmapSortMode>('intensity');
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HoveredCell | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || 800);
      }
    };
    handleResize();
    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 1. Calculate Comprehensive Category Metrics
  const categoriesData: CategoryMetrics[] = useMemo(
    () => computeCategoryMetrics(results, emailData, aiProfile),
    [results, emailData, aiProfile],
  );

  // Filter and Sort Categories
  const filteredAndSortedCategories = useMemo(
    () => filterAndSortCategories(categoriesData, filterActiveOnly, sortMode),
    [categoriesData, filterActiveOnly, sortMode],
  );

  // Overall Max Intensity
  const maxIntensity = useMemo(() => {
    if (!filteredAndSortedCategories.length) return 100;
    return Math.max(...filteredAndSortedCategories.map((c) => c.compositeIntensity), 10);
  }, [filteredAndSortedCategories]);

  // Selected category object
  const activeCategoryObj = useMemo(
    () => pickActiveCategory(selectedCategory, filteredAndSortedCategories),
    [selectedCategory, filteredAndSortedCategories],
  );

  // 2. D3 Heat Map Rendering
  // A escala térmica usa cores resolvidas do tema: redesenha quando o tema muda.
  const themeVersion = useThemeVersion();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const svgEl = svgRef.current;
    renderHeatMap(svgEl, {
      containerWidth, filteredAndSortedCategories, selectedCategory, setSelectedCategory, onSelectCategory, setHoveredCell,
    });
  }, [filteredAndSortedCategories, selectedCategory, onSelectCategory, containerWidth, themeVersion]);

  const copyPlatformUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  return (
    <div 
      className={`border border-rule bg-paper-2 font-mono transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-paper/95 p-6 border-ink/20' : 'p-4 sm:p-5'
      }`}
    >
      {/* Top Header / Control Bar */}
      <HeatMapHeader
        filterActiveOnly={filterActiveOnly}
        setFilterActiveOnly={setFilterActiveOnly}
        sortMode={sortMode}
        setSortMode={setSortMode}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
      />

      {/* Main Heat Map Display */}
      {filteredAndSortedCategories.length === 0 ? (
        <div className="py-16 text-center space-y-3 font-mono border border-dashed border-rule">
          <Activity className="w-8 h-8 mx-auto text-ink-3 animate-pulse" />
          <p className="text-ink-3 text-xs uppercase tracking-wider">
            No active categories matching the current filter
          </p>
          <button
            type="button"
            id="heatmap-reset-filter-btn"
            onClick={() => setFilterActiveOnly(false)}
            className="px-3 py-1 text-xs border border-rule text-ink-2 hover:text-ink"
          >
            Display all catalog categories
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dynamic D3 SVG Container */}
          <div 
            ref={containerRef} 
            className="w-full overflow-x-auto overflow-y-hidden border border-rule bg-paper/80 p-2 sm:p-4 rounded-none"
          >
            <svg ref={svgRef} className="block w-full overflow-visible" />
          </div>

          {/* Hovered Cell Live Status Banner */}
          <HoverStatusBar hoveredCell={hoveredCell} />

          {/* Drill-down Detail Drawer for Selected Category */}
          {activeCategoryObj && (
            <CategoryDrilldown
              activeCategoryObj={activeCategoryObj}
              target={target}
              copiedUrl={copiedUrl}
              copyPlatformUrl={copyPlatformUrl}
            />
          )}
        </div>
      )}
    </div>
  );
}
