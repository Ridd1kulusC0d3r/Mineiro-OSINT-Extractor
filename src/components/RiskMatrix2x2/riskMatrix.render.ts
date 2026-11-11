// Imperative D3 drawing of the 2x2 risk matrix (no React). The component calls it from an effect.
import * as d3 from 'd3';
import { PALETTE } from '../../theme/palette';
import type { QuadrantFilter, RiskMatrixAccount } from './riskMatrix.logic';

export interface RiskMatrixRenderOptions {
  dimensions: { width: number; height: number };
  accounts: RiskMatrixAccount[];
  visibleAccounts: RiskMatrixAccount[];
  selectedAccount: RiskMatrixAccount | null;
  activeQuadrantFilter: QuadrantFilter;
  setSelectedAccount: (account: RiskMatrixAccount) => void;
}

/** Clears `svgEl` and draws quadrants, guides, axis labels and the account nodes (collision-separated). */
export function renderRiskMatrix(svgEl: SVGSVGElement, options: RiskMatrixRenderOptions): void {
  const { dimensions, accounts, visibleAccounts, selectedAccount, activeQuadrantFilter, setSelectedAccount } = options;

  const width = dimensions.width;
  const height = dimensions.height;

  const margin = { top: 50, right: 40, bottom: 55, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3.select(svgEl);
  svg.selectAll('*').remove();

  svg
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales (0 to 100)
  const xScale = d3.scaleLinear().domain([0, 100]).range([0, innerWidth]);
  const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

  const midX = xScale(50);
  const midY = yScale(50);

  // 1. Quadrant Background Shading
  // Q1: Top-Right (Critical Risk: High Sensitivity, High Activity)
  g.append('rect')
    .attr('x', midX)
    .attr('y', 0)
    .attr('width', innerWidth - midX)
    .attr('height', midY)
    .attr('fill', PALETTE.seq3)
    .attr('fill-opacity', activeQuadrantFilter === 'critical' ? 0.42 : 0.24)
    .attr('stroke', PALETTE.rule)
    .attr('stroke-opacity', activeQuadrantFilter === 'critical' ? 1 : 0.6);

  // Q2: Top-Left (Latent Vault: High Sensitivity, Low Activity)
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', midX)
    .attr('height', midY)
    .attr('fill', PALETTE.seq2)
    .attr('fill-opacity', activeQuadrantFilter === 'latent' ? 0.42 : 0.22)
    .attr('stroke', PALETTE.rule)
    .attr('stroke-opacity', activeQuadrantFilter === 'latent' ? 1 : 0.6);

  // Q3: Bottom-Right (Broad Surface: Low Sensitivity, High Activity)
  g.append('rect')
    .attr('x', midX)
    .attr('y', midY)
    .attr('width', innerWidth - midX)
    .attr('height', innerHeight - midY)
    .attr('fill', PALETTE.seq1)
    .attr('fill-opacity', activeQuadrantFilter === 'surface' ? 0.42 : 0.22)
    .attr('stroke', PALETTE.rule)
    .attr('stroke-opacity', activeQuadrantFilter === 'surface' ? 1 : 0.6);

  // Q4: Bottom-Left (Peripheral: Low Sensitivity, Low Activity)
  g.append('rect')
    .attr('x', 0)
    .attr('y', midY)
    .attr('width', midX)
    .attr('height', innerHeight - midY)
    .attr('fill', PALETTE.seq0)
    .attr('fill-opacity', activeQuadrantFilter === 'peripheral' ? 0.42 : 0.2)
    .attr('stroke', PALETTE.rule)
    .attr('stroke-opacity', activeQuadrantFilter === 'peripheral' ? 1 : 0.6);

  // 2. Quadrant Watermark Labels
  const watermarkData = [
    { text: 'CRITICAL RISK // PRIME TARGET', x: midX + 14, y: 22, color: PALETTE.ink, sub: 'High Sensitivity • High Activity' },
    { text: 'LATENT VAULT // HIGH PRIVILEGE', x: 14, y: 22, color: PALETTE.ink3, sub: 'High Sensitivity • Low Activity' },
    { text: 'BROAD SURFACE // FREQUENT ENGAGEMENT', x: midX + 14, y: midY + 22, color: PALETTE.ink, sub: 'Low Sensitivity • High Activity' },
    { text: 'PERIPHERAL // LOW EXPOSURE', x: 14, y: midY + 22, color: PALETTE.ink2, sub: 'Low Sensitivity • Low Activity' },
  ];

  watermarkData.forEach((wm) => {
    g.append('text')
      .attr('x', wm.x)
      .attr('y', wm.y)
      .attr('fill', wm.color)
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('letter-spacing', '0.08em')
      .text(wm.text);

    g.append('text')
      .attr('x', wm.x)
      .attr('y', wm.y + 12)
      .attr('fill', PALETTE.ink3)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .text(wm.sub);
  });

  // 3. Gridlines & Quadrant Dividers
  // Center divider lines (50% threshold)
  g.append('line')
    .attr('x1', midX)
    .attr('y1', 0)
    .attr('x2', midX)
    .attr('y2', innerHeight)
    .attr('stroke', PALETTE.ink)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4,4')
    .attr('stroke-opacity', 0.4);

  g.append('line')
    .attr('x1', 0)
    .attr('y1', midY)
    .attr('x2', innerWidth)
    .attr('y2', midY)
    .attr('stroke', PALETTE.ink)
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4,4')
    .attr('stroke-opacity', 0.4);

  // Subtle 25% and 75% tick guides
  [25, 75].forEach((val) => {
    g.append('line')
      .attr('x1', xScale(val))
      .attr('y1', 0)
      .attr('x2', xScale(val))
      .attr('y2', innerHeight)
      .attr('stroke', PALETTE.rule)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4');

    g.append('line')
      .attr('x1', 0)
      .attr('y1', yScale(val))
      .attr('x2', innerWidth)
      .attr('y2', yScale(val))
      .attr('stroke', PALETTE.rule)
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,4');
  });

  // 4. Outer Axis Bounding Frame
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .attr('fill', 'none')
    .attr('stroke', PALETTE.rule)
    .attr('stroke-width', 1);

  // 5. Axis Labels
  // Bottom X-Axis Label: Activity Frequency
  svg.append('text')
    .attr('x', margin.left + innerWidth / 2)
    .attr('y', height - 12)
    .attr('text-anchor', 'middle')
    .attr('fill', PALETTE.ink)
    .attr('font-size', '11px')
    .attr('font-family', 'monospace')
    .attr('font-weight', 'bold')
    .attr('letter-spacing', '0.06em')
    .text('ACTIVITY FREQUENCY → (Infrequent / Dormant to Real-Time / Daily)');

  // Left Y-Axis Label: Platform Sensitivity (rotated)
  svg.append('text')
    .attr('transform', `rotate(-90)`)
    .attr('x', -(margin.top + innerHeight / 2))
    .attr('y', 18)
    .attr('text-anchor', 'middle')
    .attr('fill', PALETTE.ink)
    .attr('font-size', '11px')
    .attr('font-family', 'monospace')
    .attr('font-weight', 'bold')
    .attr('letter-spacing', '0.06em')
    .text('PLATFORM SENSITIVITY → (Public / Casual to Financial / Cloud / Code)');

  // 6. Force Simulation for Soft Node Collision (prevents exact overlapping)
  const simulationNodes = accounts.map((d) => ({
    ...d,
    x: xScale(d.activity),
    y: yScale(d.sensitivity),
    targetX: xScale(d.activity),
    targetY: yScale(d.sensitivity),
  }));

  const simulation = d3.forceSimulation(simulationNodes as any)
    .force('x', d3.forceX((d: any) => d.targetX).strength(0.85))
    .force('y', d3.forceY((d: any) => d.targetY).strength(0.85))
    .force('collide', d3.forceCollide(14))
    .stop();

  // Run simulation ticks synchronously for crisp render
  for (let i = 0; i < 45; i++) simulation.tick();

  // 7. Render Account Nodes
  const nodeGroup = g.append('g').attr('class', 'risk-nodes');

  simulationNodes.forEach((node: any) => {
    const isVisible = visibleAccounts.some((a) => a.id === node.id);
    const isSelected = selectedAccount?.id === node.id;

    // Color mapping by quadrant
    let nodeColor = PALETTE.ink2;
    let ringColor = PALETTE.ink3;
    if (node.quadrant === 'critical') {
      nodeColor = PALETTE.ink;
      ringColor = PALETTE.seq4;
    } else if (node.quadrant === 'latent') {
      nodeColor = PALETTE.ink3;
      ringColor = PALETTE.seq2;
    } else if (node.quadrant === 'surface') {
      nodeColor = PALETTE.ink;
      ringColor = PALETTE.seq3;
    }

    const clampedX = Math.max(14, Math.min(innerWidth - 14, node.x));
    const clampedY = Math.max(14, Math.min(innerHeight - 14, node.y));

    const accountG = nodeGroup.append('g')
      .attr('transform', `translate(${clampedX},${clampedY})`)
      .attr('cursor', 'pointer')
      .attr('opacity', isVisible ? 1 : 0.18)
      .on('click', () => {
        setSelectedAccount(node);
      });

    // Halo ring if selected or critical
    if (isSelected || node.quadrant === 'critical') {
      accountG.append('circle')
        .attr('r', isSelected ? 15 : 12)
        .attr('fill', 'none')
        .attr('stroke', ringColor)
        .attr('stroke-width', isSelected ? 2 : 1)
        .attr('stroke-dasharray', isSelected ? 'none' : '3,3')
        .attr('opacity', isSelected ? 0.9 : 0.4);
    }

    // Base Node Circle
    accountG.append('circle')
      .attr('r', isSelected ? 10 : 8)
      .attr('fill', PALETTE.paper2)
      .attr('stroke', isSelected ? PALETTE.ink : nodeColor)
      .attr('stroke-width', isSelected ? 2.5 : 1.5)
      .attr('filter', isSelected ? 'drop-shadow(0 0 6px color-mix(in srgb, var(--ink) 60%, transparent))' : 'none');

    // Inner color pip
    accountG.append('circle')
      .attr('r', isSelected ? 5 : 3.5)
      .attr('fill', nodeColor);

    // Node Label (Short platform moniker)
    accountG.append('text')
      .attr('x', 11)
      .attr('y', 3.5)
      .attr('fill', isSelected ? PALETTE.ink : PALETTE.ink)
      .attr('font-size', isSelected ? '10px' : '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', isSelected ? 'bold' : 'normal')
      .attr('pointer-events', 'none')
      .text(node.platformName);
  });
}
