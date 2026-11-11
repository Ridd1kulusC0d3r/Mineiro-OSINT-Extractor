// Imperative D3 drawing of the force graph (no React). The component calls it from an effect and stops the
// returned simulation on cleanup.
import * as d3 from 'd3';
import { PALETTE } from '../../theme/palette';
import type { GraphLink, GraphNode, SizingMode } from './networkGraph.logic';

export interface ForceGraphRenderOptions {
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
  sizingMode: SizingMode;
  setSelectedNode: (node: GraphNode | null) => void;
}

/** Clears `svgEl`, draws the grid, links and nodes and starts the simulation. */
export function renderForceGraph(svgEl: SVGSVGElement, options: ForceGraphRenderOptions): d3.Simulation<GraphNode, GraphLink> {
  const { width, height, nodes, links, sizingMode, setSelectedNode } = options;

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  svg.attr('width', width).attr('height', height).attr('viewBox', [0, 0, width, height]);

  // Background grid definition
  const defs = svg.append('defs');
  const pattern = defs
    .append('pattern')
    .attr('id', 'graph-grid')
    .attr('width', 24)
    .attr('height', 24)
    .attr('patternUnits', 'userSpaceOnUse');

  pattern
    .append('path')
    .attr('d', 'M 24 0 L 0 0 0 24')
    .attr('fill', 'none')
    .attr('stroke', 'color-mix(in srgb, var(--ink) 4%, transparent)')
    .attr('stroke-width', 1);

  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'url(#graph-grid)');

  // Main zoom container
  const g = svg.append('g').attr('class', 'main-group');

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.25, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // Centering transform
  svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85));

  // Force simulation with dynamic charge and collision based on node sizing
  const simulation = d3.forceSimulation<GraphNode>(nodes)
    .force(
      'link',
      d3.forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((d) => {
          if (d.type === 'hub') return 100;
          if (d.type === 'correlation') return 130;
          return 65;
        })
    )
    .force('charge', d3.forceManyBody().strength((d: any) => {
      if (d.type === 'target') return -480 - (d.radius * 6);
      if (d.type === 'category') return -200 - (d.radius * 6);
      return -75 - (d.radius * 4);
    }))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 12))
    .alphaDecay(0.035);

  // Render Links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll<SVGLineElement, GraphLink>('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', (d: GraphLink) => {
      if (d.type === 'hub') return 'color-mix(in srgb, var(--ink) 35%, transparent)';
      if (d.type === 'correlation') return 'color-mix(in srgb, var(--ink) 25%, transparent)';
      if (d.type === 'email') return 'color-mix(in srgb, var(--ink) 25%, transparent)';
      if (d.type === 'metadata-cluster') return 'color-mix(in srgb, var(--ink) 20%, transparent)';
      return 'color-mix(in srgb, var(--ink) 12%, transparent)';
    })
    .attr('stroke-width', (d: GraphLink) => (d.type === 'hub' ? 1.5 : d.type === 'metadata-cluster' ? 1.2 : 1))
    .attr('stroke-dasharray', (d: GraphLink) => {
      if (d.type === 'metadata-cluster') return '2 2';
      if (d.type === 'correlation' || d.type === 'email') return '4 3';
      return 'none';
    });

  // Render Node Groups
  const node = g.append('g')
    .attr('class', 'nodes')
    .selectAll<SVGGElement, GraphNode>('g')
    .data(nodes)
    .enter()
    .append('g')
    .attr('class', 'node')
    .style('cursor', 'pointer')
    .call(
      d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    )
    .on('click', (event, d: GraphNode) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

  // Outer rotating reticle ring for target node
  node.filter((d: GraphNode) => d.type === 'target')
    .append('circle')
    .attr('r', (d: GraphNode) => d.radius + 8)
    .attr('fill', 'none')
    .attr('stroke', 'color-mix(in srgb, var(--ink) 30%, transparent)')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4 4')
    .attr('class', 'animate-spin');

  // Completeness / Activity Density Arc Gauge on Target & Category nodes
  node.filter((d: GraphNode) => d.type === 'target' || d.type === 'category')
    .append('circle')
    .attr('r', (d: GraphNode) => d.radius + 4)
    .attr('fill', 'none')
    .attr('stroke', (d: GraphNode) => d.color)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', (d: GraphNode) => {
      const circum = 2 * Math.PI * (d.radius + 4);
      const metric = sizingMode === 'density' ? d.activityDensity : d.profileCompleteness;
      const filled = (metric / 100) * circum;
      return `${filled} ${circum}`;
    })
    .attr('stroke-linecap', 'round')
    .attr('opacity', 0.85);

  // Outer halo pulse for high activity density platform nodes
  node.filter((d: GraphNode) => d.type === 'platform' && d.activityDensity >= 75)
    .append('circle')
    .attr('r', (d: GraphNode) => d.radius + 4)
    .attr('fill', 'none')
    .attr('stroke', (d: GraphNode) => d.color)
    .attr('stroke-width', 1)
    .attr('opacity', 0.4)
    .attr('stroke-dasharray', '2 2')
    .attr('class', 'animate-pulse');

  // Base Node Circles
  node.append('circle')
    .attr('r', (d: GraphNode) => d.radius)
    .attr('fill', (d: GraphNode) => (d.type === 'target' ? PALETTE.signal : PALETTE.paper2))
    .attr('stroke', (d: GraphNode) => d.color)
    .attr('stroke-width', (d: GraphNode) => (d.type === 'target' ? 3 : 1.8));

  // Inner indicator for category hubs
  node.filter((d: GraphNode) => d.type === 'category')
    .append('circle')
    .attr('r', 4)
    .attr('fill', (d: GraphNode) => d.color);

  // Node Labels
  node.append('text')
    .text((d: GraphNode) => d.label)
    .attr('x', (d: GraphNode) => d.radius + 6)
    .attr('y', 3.5)
    .attr('fill', (d: GraphNode) => (d.type === 'target' ? PALETTE.ink : PALETTE.ink))
    .attr('font-size', (d: GraphNode) => (d.type === 'target' ? '12px' : d.type === 'category' ? '10px' : '9px'))
    .attr('font-weight', (d: GraphNode) => (d.type === 'target' || d.type === 'category' ? 'bold' : 'normal'))
    .attr('font-family', 'var(--mono)')
    .attr('pointer-events', 'none')
    .attr('stroke', PALETTE.paper)
    .attr('stroke-width', 4)
    .attr('stroke-linejoin', 'round')
    .attr('paint-order', 'stroke');

  // Simulation tick handler
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
  });

  return simulation;
}
