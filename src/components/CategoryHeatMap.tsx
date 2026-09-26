import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Flame, 
  Activity, 
  Sliders, 
  Filter, 
  ArrowUpDown, 
  ExternalLink, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers, 
  Compass, 
  Copy, 
  Check,
  RotateCcw
} from 'lucide-react';
import { ScanResult, EmailReconData, AiProfileReport, Category } from '../types';
import { 
  CATEGORY_COLORS, 
  CATEGORY_BADGES, 
  createHeatmapColorScale, 
  getHeatmapIntensityColor,
  getContrastTextColor,
  HEATMAP_STOPS,
  EXPOSURE_COLORS
} from '../utils/themeColors';

interface CategoryHeatMapProps {
  results: ScanResult[];
  target: string;
  targetType: 'username' | 'email';
  emailData: EmailReconData | null;
  aiProfile?: AiProfileReport | null;
  onPivotScan?: (newTarget: string) => void;
  onSelectCategory?: (category: string) => void;
}

// Category forensic profile representation
export interface CategoryMetrics {
  category: string;
  label: string;
  totalPlatforms: number;
  foundCount: number;
  uncertainCount: number;
  notFoundCount: number;
  avgResponseMs: number;
  // Intensity facets (0 to 100)
  presenceDensity: number;      // % of category platforms verified
  profileCompleteness: number;  // AI / metadata richness
  responseSpeedScore: number;   // Server latency / responsiveness index
  exposureThreatScore: number;  // Privacy and attack-surface weight
  linkageCorrelation: number;   // Cross-service handle correlation
  compositeIntensity: number;   // Weighted composite relative activity intensity (0 - 100)
  foundPlatforms: ScanResult[];
}

export type HeatmapViewMode = 'matrix' | 'platforms';
export type HeatmapSortMode = 'intensity' | 'found' | 'latency' | 'alphabetical';

const DIMENSIONS: Array<{
  id: 'presenceDensity' | 'profileCompleteness' | 'responseSpeedScore' | 'exposureThreatScore' | 'linkageCorrelation' | 'compositeIntensity';
  name: string;
  short: string;
  description: string;
  unit: string;
}> = [
  {
    id: 'presenceDensity',
    name: 'Digital Presence',
    short: 'PRESENCE',
    description: 'Density of confirmed active accounts relative to sector total.',
    unit: '%',
  },
  {
    id: 'profileCompleteness',
    name: 'Profile Completeness',
    short: 'COMPLETENESS',
    description: 'Index of extracted metadata (bio, avatars, public repos, tags).',
    unit: '%',
  },
  {
    id: 'responseSpeedScore',
    name: 'Network Activity',
    short: 'RESPONSE',
    description: 'Responsiveness and probe latency measured on platform servers.',
    unit: 'pts',
  },
  {
    id: 'linkageCorrelation',
    name: 'Alias Correlation',
    short: 'CORRELATION',
    description: 'Probability of cross-identity reuse by the same entity.',
    unit: '%',
  },
  {
    id: 'exposureThreatScore',
    name: 'OpSec Exposure Risk',
    short: 'OPSEC RISK',
    description: 'Sensitivity of exposed data (source code, wallets, infrastructure, keys).',
    unit: '%',
  },
  {
    id: 'compositeIntensity',
    name: 'Relative Intensity',
    short: 'INTENSITY',
    description: 'Consolidated concentration score of the sector digital footprint.',
    unit: '%',
  },
];

// Intrinsic risk weight per sector
const CATEGORY_THREAT_WEIGHTS: Record<string, number> = {
  security: 95,   // PGP keys, HackerOne, CTF, BugCrowd
  crypto: 90,     // Wallets, BitcoinTalk, Ethereum addresses
  developer: 85,  // GitHub, GitLab, Docker, npm tokens
  email: 80,      // MX records, Gravatar, direct email exposure
  finance: 80,    // CashApp, PayPal, Venmo
  social: 65,     // Twitter/X, Reddit, Telegram
  media: 50,      // YouTube, Twitch, Spotify
  community: 45,  // Discard, forums, StackExchange
  creative: 40,   // Behance, ArtStation, SoundCloud
  gaming: 35,     // Steam, Chess.com, Roblox
  default: 30,
};

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
  const [hoveredCell, setHoveredCell] = useState<{
    category: string;
    dimension: string;
    value: number;
    description: string;
  } | null>(null);
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
  const categoriesData: CategoryMetrics[] = useMemo(() => {
    // Unique list of categories in results + email
    const catMap = new Map<string, ScanResult[]>();
    results.forEach((r) => {
      const list = catMap.get(r.category) || [];
      list.push(r);
      catMap.set(r.category, list);
    });

    // If email recon data exists, add email category if not present
    if (emailData && (emailData.gravatarExists || emailData.mxRecordsFound)) {
      if (!catMap.has('email')) {
        catMap.set('email', []);
      }
    }

    const items: CategoryMetrics[] = [];

    catMap.forEach((categoryResults, catKey) => {
      const total = categoryResults.length || (catKey === 'email' ? 2 : 1);
      const foundList = categoryResults.filter((r) => r.status === 'found');
      const uncertainList = categoryResults.filter((r) => r.status === 'uncertain');
      const notFoundList = categoryResults.filter((r) => r.status === 'not_found');

      // Email integration bonus
      let effectiveFoundCount = foundList.length;
      if (catKey === 'email' && emailData) {
        if (emailData.gravatarExists) effectiveFoundCount += 1;
        if (emailData.mxRecordsFound) effectiveFoundCount += 1;
      }

      // Latency calculation
      const withLatency = categoryResults.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
      const avgLatency = withLatency.length > 0
        ? Math.round(withLatency.reduce((acc, curr) => acc + (curr.responseTimeMs || 0), 0) / withLatency.length)
        : (effectiveFoundCount > 0 ? 160 : 350);

      // 1. Presence density: (effectiveFound / total) scaled
      const presenceDensity = total > 0 ? Math.round(Math.min(100, (effectiveFoundCount / Math.max(1, total)) * 100)) : 0;

      // 2. Profile completeness: presence + metadata points
      let metaScore = 0;
      foundList.forEach((r) => {
        if (r.metadata?.bio) metaScore += 25;
        if (r.metadata?.displayName) metaScore += 20;
        if (r.metadata?.location) metaScore += 20;
        if (r.metadata?.extractedLinks?.length) metaScore += 20;
        if (r.metadata?.avatarUrl) metaScore += 15;
      });
      const avgMeta = foundList.length > 0 ? Math.min(100, Math.round(metaScore / foundList.length)) : (effectiveFoundCount > 0 ? 55 : 0);

      // 3. Response speed score (fast = high, slow = lower)
      const responseSpeedScore = effectiveFoundCount > 0
        ? Math.max(15, Math.min(100, Math.round(100 - (avgLatency / 10))))
        : 10;

      // 4. Exposure threat score (category weight modulated by presence)
      const baseWeight = CATEGORY_THREAT_WEIGHTS[catKey] || 35;
      const exposureThreatScore = effectiveFoundCount > 0
        ? Math.min(100, Math.round(baseWeight * 0.6 + (effectiveFoundCount * 8)))
        : 5;

      // 5. Linkage correlation
      let linkageCorrelation = 0;
      if (effectiveFoundCount > 0) {
        // High correlation if found on developer + security + email
        linkageCorrelation = Math.min(100, Math.round(50 + (effectiveFoundCount * 10)));
        if (aiProfile?.archetype && catKey === 'developer') linkageCorrelation = Math.min(100, linkageCorrelation + 15);
      }

      // 6. Composite Activity & Threat Intensity (Weighted Formula)
      const compositeIntensity = effectiveFoundCount > 0
        ? Math.min(100, Math.round(
            presenceDensity * 0.35 +
            avgMeta * 0.15 +
            responseSpeedScore * 0.15 +
            exposureThreatScore * 0.20 +
            linkageCorrelation * 0.15
          ))
        : (uncertainList.length > 0 ? 18 : 0);

      const label = catKey.charAt(0).toUpperCase() + catKey.slice(1);

      items.push({
        category: catKey,
        label,
        totalPlatforms: total,
        foundCount: effectiveFoundCount,
        uncertainCount: uncertainList.length,
        notFoundCount: notFoundList.length,
        avgResponseMs: avgLatency,
        presenceDensity,
        profileCompleteness: avgMeta,
        responseSpeedScore,
        exposureThreatScore,
        linkageCorrelation,
        compositeIntensity,
        foundPlatforms: foundList,
      });
    });

    return items;
  }, [results, emailData, aiProfile]);

  // Filter and Sort Categories
  const filteredAndSortedCategories = useMemo(() => {
    let list = [...categoriesData];

    if (filterActiveOnly) {
      list = list.filter((c) => c.foundCount > 0 || c.uncertainCount > 0);
    }

    switch (sortMode) {
      case 'intensity':
        list.sort((a, b) => b.compositeIntensity - a.compositeIntensity);
        break;
      case 'found':
        list.sort((a, b) => b.foundCount - a.foundCount || b.compositeIntensity - a.compositeIntensity);
        break;
      case 'latency':
        list.sort((a, b) => a.avgResponseMs - b.avgResponseMs);
        break;
      case 'alphabetical':
        list.sort((a, b) => a.label.localeCompare(b.label));
        break;
    }

    return list;
  }, [categoriesData, filterActiveOnly, sortMode]);

  // Overall Max Intensity
  const maxIntensity = useMemo(() => {
    if (!filteredAndSortedCategories.length) return 100;
    return Math.max(...filteredAndSortedCategories.map((c) => c.compositeIntensity), 10);
  }, [filteredAndSortedCategories]);

  // Selected category object
  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory) return filteredAndSortedCategories[0] || null;
    return filteredAndSortedCategories.find((c) => c.category === selectedCategory) || filteredAndSortedCategories[0] || null;
  }, [selectedCategory, filteredAndSortedCategories]);

  // 2. D3 Heat Map Rendering
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const svgEl = svgRef.current;
    const isMobile = containerWidth < 640;

    const margin = {
      top: 45,
      right: isMobile ? 15 : 25,
      bottom: 25,
      left: isMobile ? 100 : 160,
    };

    const width = Math.max(300, containerWidth - margin.left - margin.right);
    const rowHeight = isMobile ? 38 : 46;
    const height = Math.max(200, filteredAndSortedCategories.length * rowHeight);

    // Clear previous elements
    d3.select(svgEl).selectAll('*').remove();

    const svg = d3
      .select(svgEl)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Scales
    const yScale = d3
      .scaleBand()
      .domain(filteredAndSortedCategories.map((d) => d.category))
      .range([0, height])
      .padding(0.12);

    const xScale = d3
      .scaleBand()
      .domain(DIMENSIONS.map((d) => d.id))
      .range([0, width])
      .padding(0.08);

    const colorScale = createHeatmapColorScale(0, 100);

    // Grid Background Highlights
    g.selectAll<SVGRectElement, CategoryMetrics>('.row-highlight')
      .data(filteredAndSortedCategories)
      .enter()
      .append('rect')
      .attr('class', 'row-highlight')
      .attr('x', -margin.left)
      .attr('y', (d: CategoryMetrics) => yScale(d.category) || 0)
      .attr('width', width + margin.left)
      .attr('height', yScale.bandwidth())
      .attr('fill', (d: CategoryMetrics) => (d.category === selectedCategory ? '#FFFFFF' : 'transparent'))
      .attr('fill-opacity', (d: CategoryMetrics) => (d.category === selectedCategory ? 0.08 : 0))
      .attr('pointer-events', 'none');

    // Column Headers (X-Axis)
    const headersG = g.append('g').attr('class', 'x-headers');

    headersG
      .selectAll('.col-header')
      .data(DIMENSIONS)
      .enter()
      .append('text')
      .attr('class', 'col-header font-mono text-[10px] uppercase tracking-wider')
      .attr('x', (d) => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .attr('y', -14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#A3A3A3')
      .attr('font-weight', 'bold')
      .text((d) => (isMobile ? d.short.substring(0, 4) : d.short));

    // Category Row Labels (Y-Axis)
    const yAxisG = g.append('g').attr('class', 'y-axis');

    filteredAndSortedCategories.forEach((cat) => {
      const y = (yScale(cat.category) || 0) + yScale.bandwidth() / 2;
      const catColor = CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.default;

      const rowLabelG = yAxisG
        .append('g')
        .attr('class', 'cursor-pointer select-none')
        .on('click', () => {
          setSelectedCategory(cat.category);
          if (onSelectCategory) onSelectCategory(cat.category);
        });

      // Category indicator dot
      rowLabelG
        .append('circle')
        .attr('cx', -margin.left + (isMobile ? 10 : 16))
        .attr('cy', y)
        .attr('r', 4)
        .attr('fill', catColor)
        .attr('stroke', cat.compositeIntensity > 60 ? '#FFFFFF' : 'transparent')
        .attr('stroke-width', 1);

      // Category Name Text
      rowLabelG
        .append('text')
        .attr('class', 'font-mono text-xs font-bold')
        .attr('x', -margin.left + (isMobile ? 22 : 30))
        .attr('y', y - 2)
        .attr('fill', cat.category === selectedCategory ? '#FFFFFF' : '#F5F5F5')
        .text(isMobile ? cat.label.substring(0, 10) : cat.label);

      // Sub-label (hit count / total)
      rowLabelG
        .append('text')
        .attr('class', 'font-mono text-[9px]')
        .attr('x', -margin.left + (isMobile ? 22 : 30))
        .attr('y', y + 10)
        .attr('fill', '#737373')
        .text(`${cat.foundCount} hits • ${cat.totalPlatforms} srcs`);
    });

    // Heat Map Matrix Cells
    const matrixData: Array<{
      category: string;
      categoryLabel: string;
      dimension: typeof DIMENSIONS[number];
      value: number;
    }> = [];

    filteredAndSortedCategories.forEach((cat) => {
      DIMENSIONS.forEach((dim) => {
        matrixData.push({
          category: cat.category,
          categoryLabel: cat.label,
          dimension: dim,
          value: cat[dim.id] as number,
        });
      });
    });

    // Render Rectangular Cells
    const cells = g
      .selectAll('.heat-cell')
      .data(matrixData)
      .enter()
      .append('g')
      .attr('class', 'heat-cell cursor-pointer')
      .attr('transform', (d) => `translate(${xScale(d.dimension.id)},${yScale(d.category)})`)
      .on('mouseenter', (event, d) => {
        setHoveredCell({
          category: d.categoryLabel,
          dimension: d.dimension.name,
          value: d.value,
          description: d.dimension.description,
        });
      })
      .on('mouseleave', () => {
        setHoveredCell(null);
      })
      .on('click', (event, d) => {
        setSelectedCategory(d.category);
        if (onSelectCategory) onSelectCategory(d.category);
      });

    // Cell Background Rect
    cells
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', '#0A0A0A')
      .attr('stroke', '#2A2A2A')
      .attr('stroke-width', 1)
      .transition()
      .duration(450)
      .attr('fill', (d) => colorScale(d.value))
      .attr('stroke', (d) => {
        if (d.value >= 75) return '#FFFFFF';
        if (d.value >= 50) return '#737373';
        if (d.value > 0) return '#FFFFFF';
        return '#2A2A2A';
      })
      .attr('stroke-opacity', (d) => (d.value > 0 ? 0.6 : 0.8));

    // Cell Label (Numeric Value)
    cells
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('class', 'font-mono font-bold select-none pointer-events-none')
      .attr('font-size', isMobile ? '10px' : '11px')
      .attr('fill', (d) => getContrastTextColor(d.value))
      .text((d) => `${Math.round(d.value)}${d.dimension.unit}`);

    // Glow pulse on top intensity cells
    cells
      .filter((d) => d.value >= 85)
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', 'none')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3 2')
      .attr('class', 'animate-pulse');

  }, [filteredAndSortedCategories, selectedCategory, onSelectCategory, containerWidth]);

  const copyPlatformUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  return (
    <div 
      className={`border border-neutral-800 bg-neutral-950 font-mono transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-black/95 p-6 border-white/20' : 'p-4 sm:p-5'
      }`}
    >
      {/* Top Header / Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4 mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 border border-neutral-700 bg-neutral-900 text-white">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              D3.js Category Activity & Threat Heat Map
              <span className="px-2 py-0.5 text-[10px] bg-white text-black font-bold">
                MULTI-DIMENSIONAL
              </span>
            </h3>
          </div>
          <p className="text-xs text-neutral-400 font-sans">
            Thermal intensity and digital footprint mapping by sector: correlating presence, probe latency, OpSec risk, and metadata completeness.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          {/* Active only filter */}
          <button
            type="button"
            id="heatmap-filter-active-toggle-btn"
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`px-2.5 py-1.5 text-xs uppercase font-mono flex items-center gap-1.5 border transition-colors ${
              filterActiveOnly
                ? 'bg-neutral-900 border-white text-white font-bold'
                : 'bg-black border-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Toggle between displaying only categories with found profiles or full catalog"
          >
            <Filter className="w-3 h-3" />
            {filterActiveOnly ? 'Active Only' : 'All'}
          </button>

          {/* Sort selector */}
          <div className="flex items-center border border-neutral-800 bg-black text-xs">
            <span className="px-2 text-neutral-500 flex items-center">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              SORT:
            </span>
            <select
              id="heatmap-sort-select"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as HeatmapSortMode)}
              className="bg-transparent text-neutral-200 py-1.5 pr-3 text-xs outline-none cursor-pointer"
            >
              <option value="intensity" className="bg-neutral-900 text-white">Highest Intensity</option>
              <option value="found" className="bg-neutral-900 text-white">Most Found</option>
              <option value="latency" className="bg-neutral-900 text-white">Lowest Latency</option>
              <option value="alphabetical" className="bg-neutral-900 text-white">Alphabetical</option>
            </select>
          </div>

          {/* Fullscreen toggle */}
          <button
            type="button"
            id="heatmap-fullscreen-toggle-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 border border-neutral-800 bg-black text-neutral-400 hover:text-white transition-colors"
            title={isFullscreen ? 'Minimize' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Heat Map Display */}
      {filteredAndSortedCategories.length === 0 ? (
        <div className="py-16 text-center space-y-3 font-mono border border-dashed border-neutral-800">
          <Activity className="w-8 h-8 mx-auto text-neutral-600 animate-pulse" />
          <p className="text-neutral-400 text-xs uppercase tracking-wider">
            No active categories matching the current filter
          </p>
          <button
            type="button"
            id="heatmap-reset-filter-btn"
            onClick={() => setFilterActiveOnly(false)}
            className="px-3 py-1 text-xs border border-neutral-700 text-neutral-300 hover:text-white"
          >
            Display all catalog categories
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Dynamic D3 SVG Container */}
          <div 
            ref={containerRef} 
            className="w-full overflow-x-auto overflow-y-hidden border border-neutral-900 bg-black/80 p-2 sm:p-4 rounded-none"
          >
            <svg ref={svgRef} className="block w-full overflow-visible" />
          </div>

          {/* Hovered Cell Live Status Banner */}
          <div className="border border-neutral-800 bg-neutral-900/60 p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            {hoveredCell ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-neutral-500 uppercase">Focused Cell:</span>
                <span className="font-bold text-white uppercase">{hoveredCell.category}</span>
                <span className="text-neutral-600">»</span>
                <span className="text-white font-mono font-semibold">{hoveredCell.dimension}:</span>
                <span className="px-2 py-0.5 bg-white text-black font-bold text-xs">
                  {Math.round(hoveredCell.value)}%
                </span>
                <span className="text-neutral-400 font-sans text-[11px] sm:ml-2">
                  ({hoveredCell.description})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-neutral-500">
                <Info className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Hover over any thermal cell to audit details and click to inspect sector profiles.</span>
              </div>
            )}

            {/* Standardized Heatmap Legend Bar */}
            <div className="flex items-center gap-1.5 shrink-0 select-none">
              <span className="text-[10px] text-neutral-500 uppercase mr-1">Thermal Scale:</span>
              {HEATMAP_STOPS.map((stop) => (
                <div key={stop.color} className="flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-none inline-block border border-black"
                    style={{ backgroundColor: stop.color }}
                  />
                  <span className="text-[9px] text-neutral-400">{stop.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Drill-down Detail Drawer for Selected Category */}
          {activeCategoryObj && (
            <div className="border border-neutral-800 bg-black p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-none inline-block"
                    style={{ backgroundColor: CATEGORY_COLORS[activeCategoryObj.category] || '#F5F5F5' }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      Forensic Sector: {activeCategoryObj.label}
                      <span className="px-2 py-0.5 text-[10px] border border-neutral-700 bg-neutral-900 text-neutral-300">
                        {activeCategoryObj.foundCount} Confirmed Accounts
                      </span>
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neutral-500">
                    Average Latency: <strong className="text-white">{activeCategoryObj.avgResponseMs} ms</strong>
                  </span>
                  <span className="text-neutral-500">
                    Relative Intensity: <strong className="text-white">{activeCategoryObj.compositeIntensity}%</strong>
                  </span>
                  <div
                    className="px-2 py-0.5 text-[10px] font-bold uppercase border border-neutral-700 bg-neutral-900 text-white"
                  >
                    {activeCategoryObj.compositeIntensity >= 75 ? 'HIGH IMPACT' : activeCategoryObj.compositeIntensity >= 40 ? 'MODERATE' : 'LOW'}
                  </div>
                </div>
              </div>

              {/* Found Platforms in This Category */}
              {activeCategoryObj.foundPlatforms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activeCategoryObj.foundPlatforms.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 border border-neutral-800 bg-neutral-950 hover:border-neutral-700 transition-colors flex flex-col justify-between gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-white block truncate">
                            {p.platformName}
                          </span>
                          <span className="text-[10px] text-neutral-500 block truncate font-mono">
                            {p.url}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 text-[9px] bg-neutral-900 text-white border border-neutral-700 shrink-0 font-bold">
                          HIT
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-neutral-500 pt-2 border-t border-neutral-900">
                        <span>{p.responseTimeMs ? `${p.responseTimeMs}ms` : 'Status 200'}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyPlatformUrl(p.url)}
                            className="p-1 hover:text-white border border-neutral-800 bg-black"
                            title="Copy URL"
                          >
                            {copiedUrl === p.url ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                          </button>
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:text-white border border-neutral-800 bg-black flex items-center gap-1"
                            title="Open external profile"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500 font-mono">
                  No verified accounts with status 200 found in this category for target @{target}.
                  {activeCategoryObj.uncertainCount > 0 && (
                    <p className="text-neutral-400 mt-1">
                      Identified {activeCategoryObj.uncertainCount} probes with WAF/Cloudflare mitigation (uncertain status).
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
