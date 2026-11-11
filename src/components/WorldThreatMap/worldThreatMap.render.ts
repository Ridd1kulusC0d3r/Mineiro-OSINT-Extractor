// Imperative D3 drawing of the world map (no React). The component calls it from an effect.
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';
import type { MappedOrigin, ThreatDensityCluster } from '../../data/geoPlatforms';
import { RECON_VANTAGE } from '../../data/worldMapHosts';
import { PALETTE } from '../../theme/palette';
import { matchesCountry, type CountryDensityMap } from './worldThreatMap.logic';

export interface WorldMapRenderOptions {
  dimensions: { width: number; height: number };
  filteredOrigins: MappedOrigin[];
  densityClusters: ThreatDensityCluster[];
  countryDensityMap: CountryDensityMap;
  visualizationMode: 'density' | 'vectors';
  showArcs: boolean;
  showGraticule: boolean;
  activeOrigin: MappedOrigin | null;
  hoveredOrigin: MappedOrigin | null;
  setActiveOrigin: (origin: MappedOrigin | null) => void;
  setActiveCluster: (cluster: ThreatDensityCluster | null) => void;
  setHoveredOrigin: (origin: MappedOrigin | null) => void;
}

/** Clears `svgEl` and draws the map; returns the zoom behaviour and projection the zoom buttons reuse. */
export function renderWorldMap(
  svgEl: SVGSVGElement,
  options: WorldMapRenderOptions,
): { zoom: d3.ZoomBehavior<SVGSVGElement, unknown>; projection: d3.GeoProjection } {
  const {
    dimensions, filteredOrigins, densityClusters, countryDensityMap, visualizationMode, showArcs, showGraticule,
    activeOrigin, hoveredOrigin, setActiveOrigin, setActiveCluster, setHoveredOrigin,
  } = options;
  const { width, height } = dimensions;
  const svg = d3.select(svgEl);

  svg.selectAll('*').remove();

  // Map Projection: Natural Earth 1
  const projection = d3.geoNaturalEarth1()
    .scale(width / 5.6)
    .translate([width / 2, height / 2]);

  const pathGenerator = d3.geoPath().projection(projection);

  // Zoom container
  const g = svg.append('g').attr('class', 'map-root');

  // Attach D3 Zoom
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 12])
    .translateExtent([[ -width * 1.5, -height * 1.5 ], [ width * 2.5, height * 2.5 ]])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  svg.call(zoom);

  // SVG Defs for gradients, radar animations, and glow filters
  const defs = svg.append('defs');

  // Glow filter
  const filter = defs.append('filter')
    .attr('id', 'map-glow')
    .attr('x', '-30%')
    .attr('y', '-30%')
    .attr('width', '160%')
    .attr('height', '160%');
  filter.append('feGaussianBlur')
    .attr('stdDeviation', '3')
    .attr('result', 'blur');
  filter.append('feMerge')
    .selectAll('feMergeNode')
    .data(['blur', 'SourceGraphic'])
    .enter()
    .append('feMergeNode')
    .attr('in', (d) => d);

  // Radial Gradients for Threat Footprint Density Halos
  const gradCritical = defs.append('radialGradient')
    .attr('id', 'grad-density-critical')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', '50%');
  gradCritical.append('stop').attr('offset', '0%').attr('stop-color', PALETTE.seq4).attr('stop-opacity', 0.85);
  gradCritical.append('stop').attr('offset', '40%').attr('stop-color', PALETTE.seq3).attr('stop-opacity', 0.45);
  gradCritical.append('stop').attr('offset', '75%').attr('stop-color', PALETTE.seq2).attr('stop-opacity', 0.18);
  gradCritical.append('stop').attr('offset', '100%').attr('stop-color', PALETTE.paper).attr('stop-opacity', 0);

  const gradHigh = defs.append('radialGradient')
    .attr('id', 'grad-density-high')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', '50%');
  gradHigh.append('stop').attr('offset', '0%').attr('stop-color', PALETTE.seq3).attr('stop-opacity', 0.8);
  gradHigh.append('stop').attr('offset', '45%').attr('stop-color', PALETTE.seq2).attr('stop-opacity', 0.35);
  gradHigh.append('stop').attr('offset', '80%').attr('stop-color', PALETTE.seq1).attr('stop-opacity', 0.12);
  gradHigh.append('stop').attr('offset', '100%').attr('stop-color', PALETTE.paper).attr('stop-opacity', 0);

  const gradElevated = defs.append('radialGradient')
    .attr('id', 'grad-density-elevated')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', '50%');
  gradElevated.append('stop').attr('offset', '0%').attr('stop-color', PALETTE.seq2).attr('stop-opacity', 0.75);
  gradElevated.append('stop').attr('offset', '50%').attr('stop-color', PALETTE.seq1).attr('stop-opacity', 0.28);
  gradElevated.append('stop').attr('offset', '100%').attr('stop-color', PALETTE.paper).attr('stop-opacity', 0);

  const gradModerate = defs.append('radialGradient')
    .attr('id', 'grad-density-moderate')
    .attr('cx', '50%')
    .attr('cy', '50%')
    .attr('r', '50%');
  gradModerate.append('stop').attr('offset', '0%').attr('stop-color', PALETTE.seq1).attr('stop-opacity', 0.65);
  gradModerate.append('stop').attr('offset', '60%').attr('stop-color', PALETTE.seq0).attr('stop-opacity', 0.2);
  gradModerate.append('stop').attr('offset', '100%').attr('stop-color', PALETTE.paper).attr('stop-opacity', 0);

  // Ocean background
  g.append('path')
    .datum({ type: 'Sphere' } as any)
    .attr('class', 'sphere-bg')
    .attr('d', pathGenerator as any)
    .attr('fill', PALETTE.paper)
    .attr('stroke', PALETTE.rule)
    .attr('stroke-width', 1);

  // Graticule grid lines
  if (showGraticule) {
    const graticule = d3.geoGraticule().step([20, 20]);
    g.append('path')
      .datum(graticule)
      .attr('class', 'graticule-lines')
      .attr('d', pathGenerator as any)
      .attr('fill', 'none')
      .attr('stroke', 'color-mix(in srgb, var(--ink) 5%, transparent)')
      .attr('stroke-width', 0.6)
      .attr('stroke-dasharray', '2 2');
  }

  // World Land & Country Boundaries from TopoJSON
  try {
    const countries = topojson.feature(worldData as any, (worldData as any).objects.countries) as any;

    // Draw sovereign country paths with density choropleth shading
    g.selectAll('.country-path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country-path')
      .attr('d', pathGenerator as any)
      .attr('fill', (d: any) => {
        const countryName = d.properties?.name || '';
        const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
        if (matchKey && countryDensityMap[matchKey]) {
          const density = countryDensityMap[matchKey].totalDensity;
          // Visual heat highlight for countries hosting verified server endpoints
          if (density > 200) return PALETTE.rule; // High density sovereign hotspot
          if (density > 100) return PALETTE.card;
          return PALETTE.paper2;
        }
        return PALETTE.paper;
      })
      .attr('stroke', (d: any) => {
        const countryName = d.properties?.name || '';
        const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
        if (matchKey && countryDensityMap[matchKey]) {
          const density = countryDensityMap[matchKey].totalDensity;
          if (density > 200) return PALETTE.seq4;
          if (density > 100) return PALETTE.seq3;
          return PALETTE.seq2;
        }
        return PALETTE.rule;
      })
      .attr('stroke-width', (d: any) => {
        const countryName = d.properties?.name || '';
        const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
        return matchKey ? 1 : 0.5;
      })
      .attr('cursor', 'pointer')
      .on('mouseover', function (event, d: any) {
        d3.select(this)
          .attr('fill', PALETTE.rule)
          .attr('stroke', PALETTE.ink);
      })
      .on('mouseout', function (event, d: any) {
        const countryName = d.properties?.name || '';
        const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
        if (matchKey && countryDensityMap[matchKey]) {
          const density = countryDensityMap[matchKey].totalDensity;
          d3.select(this)
            .attr('fill', density > 200 ? PALETTE.rule : density > 100 ? PALETTE.card : PALETTE.paper2)
            .attr('stroke', density > 200 ? PALETTE.seq4 : density > 100 ? PALETTE.seq3 : PALETTE.seq2);
        } else {
          d3.select(this)
            .attr('fill', PALETTE.paper)
            .attr('stroke', PALETTE.rule);
        }
      });
  } catch (err) {
    console.warn('Failed to parse TopoJSON:', err);
  }

  // Vantage point coordinates
  const vantageProjected = projection(RECON_VANTAGE.coordinates);

  // LAYER 1: THREAT FOOTPRINT DENSITY HEATMAP LAYER
  if (visualizationMode === 'density' && densityClusters.length > 0) {
    const densityGroup = g.append('g').attr('class', 'threat-density-layer');

    densityClusters.forEach((cluster) => {
      const coords = projection(cluster.coordinates);
      if (!coords) return;
      const [cx, cy] = coords;

      // Dynamic radius scaled by total density score
      const haloRadius = Math.max(26, Math.min(85, Math.round(Math.sqrt(cluster.totalDensityScore) * 4.2)));

      const clusterG = densityGroup.append('g')
        .attr('class', `density-cluster-${cluster.id}`)
        .attr('transform', `translate(${cx}, ${cy})`)
        .attr('cursor', 'pointer')
        .on('click', (event) => {
          event.stopPropagation();
          setActiveCluster(cluster);
          if (cluster.origins.length > 0) {
            setActiveOrigin(cluster.origins[0]);
          }
        });

      // Determine gradient URL based on density tier
      let gradId = 'url(#grad-density-moderate)';
      if (cluster.densityTier === 'CRITICAL') gradId = 'url(#grad-density-critical)';
      else if (cluster.densityTier === 'HIGH') gradId = 'url(#grad-density-high)';
      else if (cluster.densityTier === 'ELEVATED') gradId = 'url(#grad-density-elevated)';

      // Outer soft density heat halo
      clusterG.append('circle')
        .attr('r', haloRadius)
        .attr('fill', gradId)
        .attr('opacity', 0.9)
        .style('mix-blend-mode', 'screen');

      // Concentric pulse shockwave for high or critical density clusters
      if (cluster.densityTier === 'CRITICAL' || cluster.densityTier === 'HIGH') {
        clusterG.append('circle')
          .attr('r', haloRadius * 0.7)
          .attr('fill', 'none')
          .attr('stroke', cluster.densityTier === 'CRITICAL' ? PALETTE.seq4 : PALETTE.seq2)
          .attr('stroke-width', 0.9)
          .attr('stroke-dasharray', '3 3')
          .attr('opacity', 0.6)
          .style('animation', 'radarPing 3s cubic-bezier(0, 0.2, 0.8, 1) infinite');
      }

      // Density Badge Moniker Tag
      const badgeG = clusterG.append('g')
        .attr('transform', `translate(0, ${-haloRadius * 0.5 - 4})`);

      badgeG.append('rect')
        .attr('x', -35)
        .attr('y', -10)
        .attr('width', 70)
        .attr('height', 14)
        .attr('fill', PALETTE.paper2)
        .attr('stroke', cluster.densityTier === 'CRITICAL' ? PALETTE.ink : PALETTE.rule)
        .attr('stroke-width', 0.8);

      badgeG.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', PALETTE.ink)
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text(`${cluster.origins.length} SRV • ${cluster.totalDensityScore} DENS`);
    });
  }

  // LAYER 2: RECON TRAJECTORY NETWORK VECTORS (In 'vectors' mode or secondary)
  if ((visualizationMode === 'vectors' || showArcs) && vantageProjected && filteredOrigins.length > 0) {
    const arcGroup = g.append('g').attr('class', 'recon-arcs');

    filteredOrigins.forEach((origin) => {
      const destProjected = projection(origin.coordinates);
      if (!destProjected) return;

      const interpolator = d3.geoInterpolate(RECON_VANTAGE.coordinates, origin.coordinates);
      const pointsCount = 28;
      const lineData: [number, number][] = [];

      for (let i = 0; i <= pointsCount; i++) {
        const coords = interpolator(i / pointsCount);
        const proj = projection(coords);
        if (proj) lineData.push(proj);
      }

      const lineGenerator = d3.line<[number, number]>()
        .x((d) => d[0])
        .y((d) => d[1])
        .curve(d3.curveBasis);

      // Arc guide line
      arcGroup.append('path')
        .datum(lineData)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', 'color-mix(in srgb, var(--ink) 15%, transparent)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3 3');

      // Animated telemetry pulse stroke
      arcGroup.append('path')
        .datum(lineData)
        .attr('d', lineGenerator)
        .attr('fill', 'none')
        .attr('stroke', origin.threatDensityWeight > 80 ? PALETTE.ink : PALETTE.ink)
        .attr('stroke-width', origin.threatDensityWeight > 80 ? 1.5 : 1)
        .attr('stroke-dasharray', '8 14')
        .style('animation', 'reconPulseDash 3s linear infinite');
    });
  }

  // Recon Vantage Probe Beacon Node
  if (vantageProjected) {
    const vantageGroup = g.append('g')
      .attr('class', 'vantage-node')
      .attr('transform', `translate(${vantageProjected[0]}, ${vantageProjected[1]})`);

    vantageGroup.append('circle')
      .attr('r', 16)
      .attr('fill', 'none')
      .attr('stroke', PALETTE.ink)
      .attr('stroke-width', 0.8)
      .attr('opacity', 0.4)
      .style('animation', 'radarPing 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite');

    vantageGroup.append('circle')
      .attr('r', 4.5)
      .attr('fill', PALETTE.paper)
      .attr('stroke', PALETTE.ink)
      .attr('stroke-width', 1.8);

    vantageGroup.append('circle')
      .attr('r', 1.8)
      .attr('fill', PALETTE.ink);

    vantageGroup.append('text')
      .attr('x', 8)
      .attr('y', -6)
      .attr('fill', PALETTE.ink)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text('PROBE NODE [FRA]');
  }

  // LAYER 3: CORRELATED SERVER IP ORIGIN MARKERS
  const markerGroup = g.append('g').attr('class', 'origin-markers');

  filteredOrigins.forEach((origin) => {
    const coords = projection(origin.coordinates);
    if (!coords) return;

    const [cx, cy] = coords;
    const isSelected = activeOrigin?.id === origin.id;
    const isHovered = hoveredOrigin?.id === origin.id;
    const isPhysical = origin.physicalRisk === 'high';
    const isCritical = origin.threatDensityWeight >= 85;

    const nodeG = markerGroup.append('g')
      .attr('class', `origin-node-${origin.id}`)
      .attr('transform', `translate(${cx}, ${cy})`)
      .attr('cursor', 'pointer')
      .on('click', (event) => {
        event.stopPropagation();
        setActiveOrigin(origin);
      })
      .on('mouseenter', () => {
        setHoveredOrigin(origin);
      })
      .on('mouseleave', () => {
        setHoveredOrigin(null);
      });

    // Outer radar pulse for high density or selected
    if (isCritical || isSelected || isPhysical) {
      nodeG.append('circle')
        .attr('r', isSelected ? 22 : 16)
        .attr('fill', 'none')
        .attr('stroke', isCritical ? PALETTE.seq4 : isPhysical ? PALETTE.ink3 : PALETTE.ink)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', isPhysical ? '2 2' : 'none')
        .attr('opacity', 0.6)
        .style('animation', 'radarPing 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite');
    }

    // Base server node circle
    nodeG.append('circle')
      .attr('r', isSelected || isHovered ? 7.5 : 5)
      .attr('fill', isSelected ? PALETTE.ink : PALETTE.paper)
      .attr('stroke', isCritical ? PALETTE.seq4 : isPhysical ? PALETTE.ink3 : PALETTE.ink2)
      .attr('stroke-width', isSelected ? 2.2 : 1.4)
      .attr('filter', isSelected ? 'url(#map-glow)' : 'none');

    // Inner pin core
    nodeG.append('circle')
      .attr('r', isSelected ? 3 : 2)
      .attr('fill', isSelected ? PALETTE.paper : isCritical ? PALETTE.seq3 : isPhysical ? PALETTE.ink3 : PALETTE.ink);

    // Platform & IP Tag
    nodeG.append('text')
      .attr('x', 8)
      .attr('y', 3)
      .attr('fill', isSelected ? PALETTE.ink : PALETTE.ink2)
      .attr('font-size', isSelected ? '10px' : '8.5px')
      .attr('font-family', 'monospace')
      .attr('font-weight', isSelected ? 'bold' : 'normal')
      .attr('text-shadow', '0 1px 3px color-mix(in srgb, var(--paper) 95%, transparent)')
      .text(`${origin.platformName} [${origin.serverIp}]`);
  });

  // Reset selection on background click
  svg.on('click', () => {
    setActiveOrigin(null);
    setActiveCluster(null);
  });

  return { zoom, projection };
}
