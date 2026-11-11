// Imperative D3 drawing of the category heat map (no React). The component calls it from an effect.
import * as d3 from 'd3';
import {
  CATEGORY_COLORS,
  createHeatmapColorScale,
  getContrastTextColor,
  PALETTE,
} from '../../theme/palette';
import { DIMENSIONS } from './dimensions';
import type { CategoryMetrics, HoveredCell } from './categoryHeatMap.logic';

export interface HeatMapRenderOptions {
  containerWidth: number;
  filteredAndSortedCategories: CategoryMetrics[];
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
  onSelectCategory?: (category: string) => void;
  setHoveredCell: (cell: HoveredCell | null) => void;
}

/** Clears `svgEl` and draws headers, row labels and the cells (fill animates in over 450 ms). */
export function renderHeatMap(svgEl: SVGSVGElement, options: HeatMapRenderOptions): void {
  const { containerWidth, filteredAndSortedCategories, selectedCategory, setSelectedCategory, onSelectCategory, setHoveredCell } = options;
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
    .attr('fill', (d: CategoryMetrics) => (d.category === selectedCategory ? PALETTE.ink : 'transparent'))
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
    .attr('fill', PALETTE.ink2)
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
      .attr('stroke', cat.compositeIntensity > 60 ? PALETTE.signal : 'transparent')
      .attr('stroke-width', 1);

    // Category Name Text
    rowLabelG
      .append('text')
      .attr('class', 'font-mono text-xs font-bold')
      .attr('x', -margin.left + (isMobile ? 22 : 30))
      .attr('y', y - 2)
      .attr('fill', cat.category === selectedCategory ? PALETTE.ink : PALETTE.ink)
      .text(isMobile ? cat.label.substring(0, 10) : cat.label);

    // Sub-label (hit count / total)
    rowLabelG
      .append('text')
      .attr('class', 'font-mono text-[9px]')
      .attr('x', -margin.left + (isMobile ? 22 : 30))
      .attr('y', y + 10)
      .attr('fill', PALETTE.ink3)
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
    .attr('fill', PALETTE.paper2)
    .attr('stroke', PALETTE.rule)
    .attr('stroke-width', 1)
    .transition()
    .duration(450)
    .attr('fill', (d) => colorScale(d.value))
    .attr('stroke', (d) => {
      if (d.value >= 75) return PALETTE.seq4;
      if (d.value >= 50) return PALETTE.seq3;
      if (d.value > 0) return PALETTE.seq2;
      return PALETTE.rule;
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
    .attr('stroke', PALETTE.ink)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3 2')
    .attr('class', 'animate-pulse');
}
