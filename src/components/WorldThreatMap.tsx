import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';
import { 
  Globe, 
  Crosshair, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ShieldAlert, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Radio, 
  AlertTriangle,
  Server,
  Compass,
  Search,
  ChevronDown,
  ChevronUp,
  Cpu,
  Flame,
  Activity,
  Maximize2
} from 'lucide-react';
import { ScanResult, EmailReconData } from '../types';
import { 
  resolvePlatformGeo, 
  computeGeographicalThreatReport, 
  computeDensityClusters,
  calculateThreatDensityWeight,
  MappedOrigin,
  ThreatDensityCluster
} from '../data/geoPlatforms';

interface WorldThreatMapProps {
  results: ScanResult[];
  target: string;
  emailData: EmailReconData | null;
  onInspectProfile?: (result: ScanResult) => void;
}

// Recon Node vantage point (Central European / Atlantic Cyber Hub)
const RECON_VANTAGE: { name: string; coordinates: [number, number]; city: string; country: string } = {
  name: 'OSINT Recon Probe [Primary Node]',
  coordinates: [8.682, 50.110], // Frankfurt, Germany
  city: 'Frankfurt am Main',
  country: 'Germany'
};

function matchesCountry(featureName: string, originCountry: string): boolean {
  if (!featureName || !originCountry) return false;
  const f = featureName.toLowerCase();
  const o = originCountry.toLowerCase();
  if (f === o) return true;
  if (o.includes('united states') && (f.includes('united states') || f === 'usa')) return true;
  if (o.includes('united kingdom') && (f.includes('united kingdom') || f === 'uk' || f.includes('great britain'))) return true;
  return f.includes(o) || o.includes(f);
}

export function WorldThreatMap({
  results,
  target,
  emailData,
  onInspectProfile
}: WorldThreatMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 900,
    height: 480
  });

  const [visualizationMode, setVisualizationMode] = useState<'density' | 'vectors'>('density');
  const [activeOrigin, setActiveOrigin] = useState<MappedOrigin | null>(null);
  const [activeCluster, setActiveCluster] = useState<ThreatDensityCluster | null>(null);
  const [hoveredOrigin, setHoveredOrigin] = useState<MappedOrigin | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [filterJurisdiction, setFilterJurisdiction] = useState<string>('all');
  const [showArcs, setShowArcs] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [onlyPhysicalRisk, setOnlyPhysicalRisk] = useState<boolean>(false);
  const [showCorrelationMatrix, setShowCorrelationMatrix] = useState<boolean>(true);
  const [matrixSearch, setMatrixSearch] = useState<string>('');

  // Map found scan results and email infrastructure to geographical origins
  const allOrigins: MappedOrigin[] = useMemo(() => {
    const found = results.filter((r) => r.status === 'found');
    const mapped: MappedOrigin[] = [];

    found.forEach((r) => {
      const geo = resolvePlatformGeo(r.platformId, r.platformName, r.category);
      const densityWeight = calculateThreatDensityWeight(geo.threatScore, geo.physicalRisk, geo.jurisdiction);

      mapped.push({
        id: r.id,
        platformId: r.platformId,
        platformName: r.platformName,
        category: r.category,
        url: r.url,
        coordinates: geo.coordinates,
        city: geo.city,
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        jurisdiction: geo.jurisdiction,
        threatScore: geo.threatScore,
        cloudProvider: geo.cloudProvider,
        subpoenaExposure: geo.subpoenaExposure,
        physicalRisk: geo.physicalRisk,
        threatNotes: geo.threatNotes,
        status: r.status,
        confidenceScore: r.confidenceScore,
        serverIp: geo.serverIp || '104.26.12.89',
        asn: geo.asn || 'AS13335 CLOUDFLARENET',
        isp: geo.isp || 'Global Edge Network',
        resolvedHost: geo.resolvedHost || `${r.platformId}.edge-origin.net`,
        threatDensityWeight: densityWeight
      });
    });

    // If email reconnaissance detected an active MX domain, map the mailhost infrastructure
    if (emailData && emailData.domain) {
      let mxCoords: [number, number] = [-77.036, 38.907]; // Washington DC fallback
      let mxCity = 'Ashburn, VA';
      let mxCountry = 'United States';
      let mxJurisdiction: MappedOrigin['jurisdiction'] = 'Five Eyes';
      let mxCloud = 'Global Mail Routing Node';
      let mxIp = '142.250.190.26';
      let mxAsn = 'AS15169 GOOGLE';
      let mxHost = `aspmx.l.google.com`;

      if (emailData.domain.includes('proton')) {
        mxCoords = [6.143, 46.204];
        mxCity = 'Geneva';
        mxCountry = 'Switzerland';
        mxJurisdiction = 'Swiss Sanctuary';
        mxCloud = 'Proton AG Encrypted Vault';
        mxIp = '185.70.41.130';
        mxAsn = 'AS62371 PROTON-AS';
        mxHost = 'mail.protonmail.ch';
      } else if (emailData.domain.includes('gmail') || emailData.domain.includes('google')) {
        mxCoords = [-122.084, 37.422];
        mxCity = 'Mountain View, CA';
        mxCountry = 'United States';
        mxJurisdiction = 'Five Eyes';
        mxCloud = 'Google Cloud MX Anycast';
        mxIp = '142.250.190.26';
        mxAsn = 'AS15169 GOOGLE';
        mxHost = 'aspmx.l.google.com';
      } else if (emailData.domain.includes('outlook') || emailData.domain.includes('hotmail')) {
        mxCoords = [-122.121, 47.674];
        mxCity = 'Redmond, WA';
        mxCountry = 'United States';
        mxJurisdiction = 'Five Eyes';
        mxCloud = 'Microsoft Exchange Online';
        mxIp = '40.92.0.0';
        mxAsn = 'AS8075 MICROSOFT';
        mxHost = 'mail.protection.outlook.com';
      }

      mapped.push({
        id: 'email-mx-origin',
        platformId: 'email_mx',
        platformName: `MX: ${emailData.domain}`,
        category: 'security',
        url: `mailto:${emailData.email}`,
        coordinates: mxCoords,
        city: mxCity,
        country: mxCountry,
        countryCode: 'US',
        region: 'North America',
        jurisdiction: mxJurisdiction,
        threatScore: 82,
        cloudProvider: mxCloud,
        subpoenaExposure: mxJurisdiction === 'Swiss Sanctuary' ? 'Low (Sanctuary)' : 'High (MLAT)',
        physicalRisk: 'low',
        threatNotes: `Authoritative Mail eXchanger for domain ${emailData.domain}. Active MX servers receive unencrypted SMTP handshake signals.`,
        status: 'found',
        confidenceScore: 99.8,
        serverIp: mxIp,
        asn: mxAsn,
        isp: `${mxCloud} Backbone`,
        resolvedHost: mxHost,
        threatDensityWeight: 88
      });
    }

    return mapped;
  }, [results, emailData]);

  // Filtered origins based on UI selection
  const filteredOrigins = useMemo(() => {
    return allOrigins.filter((origin) => {
      if (filterJurisdiction !== 'all' && origin.jurisdiction !== filterJurisdiction) {
        return false;
      }
      if (onlyPhysicalRisk && origin.physicalRisk !== 'high') {
        return false;
      }
      return true;
    });
  }, [allOrigins, filterJurisdiction, onlyPhysicalRisk]);

  // Threat Density Clusters
  const densityClusters = useMemo(() => {
    return computeDensityClusters(filteredOrigins);
  }, [filteredOrigins]);

  // Holistic threat report
  const threatReport = useMemo(() => {
    return computeGeographicalThreatReport(allOrigins);
  }, [allOrigins]);

  // Country density score map
  const countryDensityMap = useMemo(() => {
    const map: Record<string, { count: number; totalDensity: number }> = {};
    filteredOrigins.forEach((o) => {
      map[o.country] = map[o.country] || { count: 0, totalDensity: 0 };
      map[o.country].count += 1;
      map[o.country].totalDensity += o.threatDensityWeight;
    });
    return map;
  }, [filteredOrigins]);

  // Filtered correlation matrix rows
  const matrixRows = useMemo(() => {
    if (!matrixSearch.trim()) return allOrigins;
    const q = matrixSearch.toLowerCase();
    return allOrigins.filter(
      (o) =>
        o.platformName.toLowerCase().includes(q) ||
        o.url.toLowerCase().includes(q) ||
        o.serverIp.toLowerCase().includes(q) ||
        o.asn.toLowerCase().includes(q) ||
        o.city.toLowerCase().includes(q) ||
        o.country.toLowerCase().includes(q) ||
        o.resolvedHost.toLowerCase().includes(q)
    );
  }, [allOrigins, matrixSearch]);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;
      const width = Math.max(320, clientWidth);
      const height = Math.max(380, Math.min(540, Math.round(width * 0.52)));
      setDimensions({ width, height });
    };

    updateSize();
    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Primary D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current) return;

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);

    svg.selectAll('*').remove();

    // Map Projection: Natural Earth 1
    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.6)
      .translate([width / 2, height / 2]);

    projectionRef.current = projection;

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
    zoomBehaviorRef.current = zoom;

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
    gradCritical.append('stop').attr('offset', '0%').attr('stop-color', '#FFFFFF').attr('stop-opacity', 0.85);
    gradCritical.append('stop').attr('offset', '40%').attr('stop-color', '#737373').attr('stop-opacity', 0.45);
    gradCritical.append('stop').attr('offset', '75%').attr('stop-color', '#737373').attr('stop-opacity', 0.18);
    gradCritical.append('stop').attr('offset', '100%').attr('stop-color', '#050505').attr('stop-opacity', 0);

    const gradHigh = defs.append('radialGradient')
      .attr('id', 'grad-density-high')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    gradHigh.append('stop').attr('offset', '0%').attr('stop-color', '#737373').attr('stop-opacity', 0.8);
    gradHigh.append('stop').attr('offset', '45%').attr('stop-color', '#FFFFFF').attr('stop-opacity', 0.35);
    gradHigh.append('stop').attr('offset', '80%').attr('stop-color', '#A3A3A3').attr('stop-opacity', 0.12);
    gradHigh.append('stop').attr('offset', '100%').attr('stop-color', '#050505').attr('stop-opacity', 0);

    const gradElevated = defs.append('radialGradient')
      .attr('id', 'grad-density-elevated')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    gradElevated.append('stop').attr('offset', '0%').attr('stop-color', '#FFFFFF').attr('stop-opacity', 0.75);
    gradElevated.append('stop').attr('offset', '50%').attr('stop-color', '#A3A3A3').attr('stop-opacity', 0.28);
    gradElevated.append('stop').attr('offset', '100%').attr('stop-color', '#050505').attr('stop-opacity', 0);

    const gradModerate = defs.append('radialGradient')
      .attr('id', 'grad-density-moderate')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%');
    gradModerate.append('stop').attr('offset', '0%').attr('stop-color', '#A3A3A3').attr('stop-opacity', 0.65);
    gradModerate.append('stop').attr('offset', '60%').attr('stop-color', '#737373').attr('stop-opacity', 0.2);
    gradModerate.append('stop').attr('offset', '100%').attr('stop-color', '#050505').attr('stop-opacity', 0);

    // Ocean background
    g.append('path')
      .datum({ type: 'Sphere' } as any)
      .attr('class', 'sphere-bg')
      .attr('d', pathGenerator as any)
      .attr('fill', '#050505')
      .attr('stroke', '#2A2A2A')
      .attr('stroke-width', 1);

    // Graticule grid lines
    if (showGraticule) {
      const graticule = d3.geoGraticule().step([20, 20]);
      g.append('path')
        .datum(graticule)
        .attr('class', 'graticule-lines')
        .attr('d', pathGenerator as any)
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255, 255, 255, 0.05)')
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
            if (density > 200) return '#2A2A2A'; // High density sovereign hotspot
            if (density > 100) return '#111111';
            return '#0A0A0A';
          }
          return '#050505';
        })
        .attr('stroke', (d: any) => {
          const countryName = d.properties?.name || '';
          const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
          if (matchKey && countryDensityMap[matchKey]) {
            const density = countryDensityMap[matchKey].totalDensity;
            if (density > 200) return '#FFFFFF';
            if (density > 100) return '#737373';
            return '#FFFFFF';
          }
          return '#2A2A2A';
        })
        .attr('stroke-width', (d: any) => {
          const countryName = d.properties?.name || '';
          const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
          return matchKey ? 1 : 0.5;
        })
        .attr('cursor', 'pointer')
        .on('mouseover', function (event, d: any) {
          d3.select(this)
            .attr('fill', '#2A2A2A')
            .attr('stroke', '#FFFFFF');
        })
        .on('mouseout', function (event, d: any) {
          const countryName = d.properties?.name || '';
          const matchKey = Object.keys(countryDensityMap).find((k) => matchesCountry(countryName, k));
          if (matchKey && countryDensityMap[matchKey]) {
            const density = countryDensityMap[matchKey].totalDensity;
            d3.select(this)
              .attr('fill', density > 200 ? '#2A2A2A' : density > 100 ? '#111111' : '#0A0A0A')
              .attr('stroke', density > 200 ? '#FFFFFF' : density > 100 ? '#737373' : '#FFFFFF');
          } else {
            d3.select(this)
              .attr('fill', '#050505')
              .attr('stroke', '#2A2A2A');
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
            .attr('stroke', cluster.densityTier === 'CRITICAL' ? '#FFFFFF' : '#737373')
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
          .attr('fill', '#0A0A0A')
          .attr('stroke', cluster.densityTier === 'CRITICAL' ? '#FFFFFF' : '#2A2A2A')
          .attr('stroke-width', 0.8);

        badgeG.append('text')
          .attr('x', 0)
          .attr('y', 0)
          .attr('fill', '#F5F5F5')
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
          .attr('stroke', 'rgba(255, 255, 255, 0.15)')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '3 3');

        // Animated telemetry pulse stroke
        arcGroup.append('path')
          .datum(lineData)
          .attr('d', lineGenerator)
          .attr('fill', 'none')
          .attr('stroke', origin.threatDensityWeight > 80 ? '#FFFFFF' : '#FFFFFF')
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
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 0.8)
        .attr('opacity', 0.4)
        .style('animation', 'radarPing 2.5s cubic-bezier(0, 0.2, 0.8, 1) infinite');

      vantageGroup.append('circle')
        .attr('r', 4.5)
        .attr('fill', '#050505')
        .attr('stroke', '#FFFFFF')
        .attr('stroke-width', 1.8);

      vantageGroup.append('circle')
        .attr('r', 1.8)
        .attr('fill', '#FFFFFF');

      vantageGroup.append('text')
        .attr('x', 8)
        .attr('y', -6)
        .attr('fill', '#FFFFFF')
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
          .attr('stroke', isCritical ? '#FFFFFF' : isPhysical ? '#737373' : '#FFFFFF')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', isPhysical ? '2 2' : 'none')
          .attr('opacity', 0.6)
          .style('animation', 'radarPing 2.2s cubic-bezier(0, 0.2, 0.8, 1) infinite');
      }

      // Base server node circle
      nodeG.append('circle')
        .attr('r', isSelected || isHovered ? 7.5 : 5)
        .attr('fill', isSelected ? '#FFFFFF' : '#050505')
        .attr('stroke', isCritical ? '#FFFFFF' : isPhysical ? '#737373' : '#A3A3A3')
        .attr('stroke-width', isSelected ? 2.2 : 1.4)
        .attr('filter', isSelected ? 'url(#map-glow)' : 'none');

      // Inner pin core
      nodeG.append('circle')
        .attr('r', isSelected ? 3 : 2)
        .attr('fill', isSelected ? '#050505' : isCritical ? '#FFFFFF' : isPhysical ? '#737373' : '#F5F5F5');

      // Platform & IP Tag
      nodeG.append('text')
        .attr('x', 8)
        .attr('y', 3)
        .attr('fill', isSelected ? '#FFFFFF' : '#A3A3A3')
        .attr('font-size', isSelected ? '10px' : '8.5px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .attr('text-shadow', '0 1px 3px rgba(7,7,11,0.95)')
        .text(`${origin.platformName} [${origin.serverIp}]`);
    });

    // Reset selection on background click
    svg.on('click', () => {
      setActiveOrigin(null);
      setActiveCluster(null);
    });

  }, [dimensions, filteredOrigins, visualizationMode, showArcs, showGraticule, activeOrigin, hoveredOrigin, countryDensityMap, densityClusters]);

  // Zoom control helpers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    setActiveOrigin(null);
    setActiveCluster(null);
  };

  // Fly and center on a specific server coordinate
  const focusOnServer = (origin: MappedOrigin) => {
    if (!svgRef.current || !zoomBehaviorRef.current || !projectionRef.current) return;
    const projected = projectionRef.current(origin.coordinates);
    if (!projected) return;

    const { width, height } = dimensions;
    const [x, y] = projected;
    const scale = 3.8;
    const transform = d3.zoomIdentity
      .translate(width / 2 - x * scale, height / 2 - y * scale)
      .scale(scale);

    d3.select(svgRef.current)
      .transition()
      .duration(650)
      .call(zoomBehaviorRef.current.transform, transform);

    setActiveOrigin(origin);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeFocus = activeOrigin || hoveredOrigin;

  return (
    <div id="world-threat-perspective-container" className="border border-neutral-800 bg-neutral-950 p-5 space-y-4 font-mono">
      {/* Header bar with primary telemetry metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-white shrink-0" />
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Geographical Threat Footprint Density</span>
              <span className="text-[10px] px-1.5 py-0.2 border border-neutral-700 bg-black text-neutral-300">
                D3 Cartographic Engine
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-sans mt-0.5">
              Correlating discovered profile URLs with physical server IPs, host datacenters, and jurisdictional legal exposure.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Visualization Mode Toggle: Density Heatmap vs Network Vectors */}
          <div className="inline-flex border border-neutral-800 bg-black p-0.5">
            <button
              id="mode-density-btn"
              type="button"
              onClick={() => setVisualizationMode('density')}
              className={`px-2.5 py-1 text-[11px] uppercase flex items-center gap-1.5 transition-colors ${
                visualizationMode === 'density'
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Density Heatmap
            </button>
            <button
              id="mode-vectors-btn"
              type="button"
              onClick={() => setVisualizationMode('vectors')}
              className={`px-2.5 py-1 text-[11px] uppercase flex items-center gap-1.5 transition-colors ${
                visualizationMode === 'vectors'
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Network Vectors
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="inline-flex border border-neutral-800 bg-black">
            <button
              id="map-zoom-in-btn"
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 border-r border-neutral-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="map-zoom-out-btn"
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 border-r border-neutral-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              id="map-zoom-reset-btn"
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-[10px] uppercase text-neutral-400 hover:text-white hover:bg-neutral-900 flex items-center gap-1"
              title="Reset View"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Layer Toggles & Jurisdiction Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-black p-2.5 border border-neutral-800 text-xs">
        {/* Jurisdiction Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest mr-1">
            JURISDICTION:
          </span>
          {[
            { id: 'all', label: `All (${allOrigins.length})` },
            { id: 'Five Eyes', label: `Five Eyes (${threatReport.fiveEyesCount})` },
            { id: 'EU / GDPR', label: `EU/GDPR (${threatReport.euGdprCount})` },
            { id: 'Swiss Sanctuary', label: `Swiss (${threatReport.sanctuaryCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterJurisdiction(tab.id)}
              className={`px-2 py-1 text-[11px] uppercase transition-colors ${
                filterJurisdiction === tab.id
                  ? 'bg-white text-black font-bold'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Physical Risk Highlight Filter */}
          {threatReport.highPhysicalRiskCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyPhysicalRisk(!onlyPhysicalRisk)}
              className={`px-2 py-1 text-[11px] uppercase border transition-colors flex items-center gap-1 ${
                onlyPhysicalRisk
                  ? 'border-white bg-white text-black font-bold'
                  : 'border-neutral-700 bg-black text-neutral-300 hover:border-neutral-500'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-white shrink-0" />
              GPS Risk ({threatReport.highPhysicalRiskCount})
            </button>
          )}
        </div>

        {/* Display Layer Toggles */}
        <div className="flex items-center gap-3 text-[11px] text-neutral-400">
          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showArcs}
              onChange={(e) => setShowArcs(e.target.checked)}
              className="accent-white rounded-none cursor-pointer"
            />
            <span>Recon Arcs</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-white">
            <input
              type="checkbox"
              checked={showGraticule}
              onChange={(e) => setShowGraticule(e.target.checked)}
              className="accent-white rounded-none cursor-pointer"
            />
            <span>Graticule Grid</span>
          </label>
        </div>
      </div>

      {/* SVG Canvas Map Container */}
      <div 
        ref={containerRef}
        className="relative w-full border border-[#2A2A2A] bg-[#050505] overflow-hidden select-none"
        style={{ minHeight: '380px' }}
      >
        <svg
          id="world-threat-d3-svg"
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto block"
        />

        {/* Threat Footprint Density Color Scale Legend (Overlay Top-Right) */}
        {visualizationMode === 'density' && (
          <div className="absolute top-3 right-3 p-2.5 border border-neutral-800/90 bg-black/90 backdrop-blur-md text-[10px] space-y-1.5 z-10">
            <div className="text-neutral-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-neutral-500" />
              Threat Footprint Density
            </div>
            <div className="flex items-center gap-1">
              <div className="w-16 h-2 rounded-none bg-gradient-to-r from-neutral-600 via-neutral-500 via-neutral-500 to-neutral-600" />
            </div>
            <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
              <span>Moderate</span>
              <span>Elevated</span>
              <span>Critical</span>
            </div>
          </div>
        )}

        {/* Overlay Compass / Legend Badge (Overlay Top-Left) */}
        <div className="absolute top-3 left-3 pointer-events-none p-2 border border-neutral-800/80 bg-black/85 backdrop-blur-sm text-[10px] space-y-1">
          <div className="flex items-center gap-1.5 text-neutral-300 font-bold uppercase tracking-wider">
            <Crosshair className="w-3 h-3 text-white" />
            Vantage: Frankfurt Node [50.11°N, 8.68°E]
          </div>
          <div className="text-neutral-500">
            {densityClusters.length} Datacenter Hubs Identified • {allOrigins.length} Correlated Endpoints
          </div>
        </div>

        {/* Empty state overlay if zero hits */}
        {allOrigins.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-6 text-center">
            <Radio className="w-8 h-8 text-neutral-600 mb-2 animate-pulse" />
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              Awaiting Reconnaissance Hits
            </div>
            <div className="text-xs text-neutral-400 max-w-sm mt-1 font-sans">
              Run a profile or email probe to correlate discovered URLs with server IP infrastructure and display threat footprint density.
            </div>
          </div>
        )}

        {/* Floating Forensic HUD Inspector (if node clicked or hovered) */}
        {activeFocus && (
          <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-96 border border-white bg-black/95 backdrop-blur-md p-4 text-xs space-y-3 z-20 shadow-2xl">
            <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-sm tracking-wide">
                    {activeFocus.platformName}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 border border-neutral-700 bg-neutral-900 text-neutral-300">
                    {activeFocus.category}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {activeFocus.city}, {activeFocus.country}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeFocus.url, `url-${activeFocus.id}`)}
                  className="p-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
                  title="Copy URL"
                >
                  {copiedKey === `url-${activeFocus.id}` ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <a
                  href={activeFocus.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Resolved Server IP & Network Infrastructure */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <div className="text-[9px] text-neutral-500 uppercase flex items-center justify-between">
                  <span>RESOLVED SERVER IP</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activeFocus.serverIp, `ip-${activeFocus.id}`)}
                    className="text-neutral-400 hover:text-white"
                    title="Copy IP"
                  >
                    {copiedKey === `ip-${activeFocus.id}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                  </button>
                </div>
                <div className="text-white font-mono font-bold mt-0.5 truncate">
                  {activeFocus.serverIp}
                </div>
              </div>

              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <div className="text-[9px] text-neutral-500 uppercase">AUTONOMOUS SYSTEM</div>
                <div className="text-white font-mono mt-0.5 truncate" title={activeFocus.asn}>
                  {activeFocus.asn}
                </div>
              </div>
            </div>

            {/* Coordinates & Hosting Telemetry */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <div className="text-[9px] text-neutral-500 uppercase">SERVER COORDS</div>
                <div className="text-white font-mono mt-0.5">
                  {activeFocus.coordinates[1].toFixed(3)}°, {activeFocus.coordinates[0].toFixed(3)}°
                </div>
              </div>

              <div className="p-2 border border-neutral-800 bg-neutral-950">
                <div className="text-[9px] text-neutral-500 uppercase">THREAT DENSITY</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`font-bold ${activeFocus.threatDensityWeight > 80 ? 'text-neutral-400' : 'text-white'}`}>
                    {activeFocus.threatDensityWeight}/100
                  </span>
                  <div className="flex-1 bg-neutral-800 h-1.5">
                    <div
                      className={`h-1.5 ${activeFocus.threatDensityWeight > 80 ? 'bg-neutral-500' : 'bg-white'}`}
                      style={{ width: `${activeFocus.threatDensityWeight}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Attack Surface & Subpoena Notes */}
            <div className="space-y-1 text-[11px] font-sans">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-mono text-[10px] uppercase">SUBPOENA RISK:</span>
                <span className="text-white font-bold font-mono">{activeFocus.subpoenaExposure}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400 font-mono text-[10px] uppercase">BACKBONE CARRIER:</span>
                <span className="text-white font-mono truncate max-w-[200px]">{activeFocus.isp}</span>
              </div>
              {activeFocus.physicalRisk === 'high' && (
                <div className="p-2 border border-neutral-700 bg-neutral-900 text-neutral-200 text-[11px] flex items-start gap-2 mt-2">
                  <AlertTriangle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Physical Geolocation Risk Vector</strong>
                    {activeFocus.threatNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800 text-[10px] text-neutral-400 font-mono">
              <span className="truncate max-w-[200px] text-neutral-500">HOST: {activeFocus.resolvedHost}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveOrigin(null);
                  setActiveCluster(null);
                }}
                className="text-neutral-400 hover:text-white uppercase underline ml-2"
              >
                Close HUD
              </button>
            </div>
          </div>
        )}
      </div>

      {/* URL to Geographical Server IP Correlation Matrix (Collapsible Table) */}
      <div className="border border-neutral-800 bg-black">
        <div 
          className="p-3 border-b border-neutral-800 flex items-center justify-between cursor-pointer hover:bg-neutral-900/50 transition-colors"
          onClick={() => setShowCorrelationMatrix(!showCorrelationMatrix)}
        >
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-white shrink-0" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              URL ↔ Server IP Infrastructure Correlation Matrix
            </span>
            <span className="text-[10px] px-2 py-0.5 border border-neutral-700 bg-neutral-900 text-neutral-300">
              {allOrigins.length} Correlated Endpoints
            </span>
          </div>

          <div className="flex items-center gap-2 text-neutral-400 text-xs">
            <span>{showCorrelationMatrix ? 'Collapse Matrix' : 'Expand Matrix'}</span>
            {showCorrelationMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {showCorrelationMatrix && (
          <div className="p-3 space-y-3">
            {/* Search Filter for Matrix */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by IP, platform, ASN, city, URL..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 text-white text-[11px] placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 font-mono"
                />
              </div>

              <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                <span>Showing {matrixRows.length} of {allOrigins.length} endpoints</span>
                {matrixSearch && (
                  <button
                    type="button"
                    onClick={() => setMatrixSearch('')}
                    className="text-neutral-500 hover:text-white underline text-[10px]"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-neutral-800">
              <table className="w-full text-left text-[11px] font-mono divide-y divide-neutral-800">
                <thead className="bg-neutral-950 text-neutral-400 text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Discovered Platform & Target URL</th>
                    <th className="p-2.5">Correlated Server IP</th>
                    <th className="p-2.5">ASN & Backbone</th>
                    <th className="p-2.5">Geographical Location</th>
                    <th className="p-2.5">Jurisdiction</th>
                    <th className="p-2.5 text-right">Threat Density</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 bg-black">
                  {matrixRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-neutral-500">
                        No correlated endpoints matched search criteria.
                      </td>
                    </tr>
                  ) : (
                    matrixRows.map((origin) => {
                      const isSelected = activeOrigin?.id === origin.id;
                      return (
                        <tr 
                          key={origin.id}
                          className={`hover:bg-neutral-900/60 transition-colors ${
                            isSelected ? 'bg-neutral-900/80 border-l-2 border-l-white' : ''
                          }`}
                        >
                          <td className="p-2.5">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{origin.platformName}</span>
                              <span className="text-[9px] uppercase px-1 py-0.2 bg-neutral-900 border border-neutral-800 text-neutral-400 font-normal">
                                {origin.category}
                              </span>
                            </div>
                            <a
                              href={origin.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-neutral-400 hover:text-white truncate block max-w-xs transition-colors mt-0.5"
                              title={origin.url}
                            >
                              {origin.url}
                            </a>
                          </td>

                          <td className="p-2.5">
                            <div className="text-white font-bold flex items-center gap-1">
                              <span>{origin.serverIp}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(origin.serverIp, `tbl-ip-${origin.id}`)}
                                className="text-neutral-500 hover:text-white"
                                title="Copy IP"
                              >
                                {copiedKey === `tbl-ip-${origin.id}` ? (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5" />
                                )}
                              </button>
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                              {origin.resolvedHost}
                            </div>
                          </td>

                          <td className="p-2.5">
                            <div className="text-neutral-200 font-medium truncate max-w-[160px]" title={origin.asn}>
                              {origin.asn}
                            </div>
                            <div className="text-[10px] text-neutral-500 truncate max-w-[160px]">
                              {origin.isp}
                            </div>
                          </td>

                          <td className="p-2.5">
                            <div className="text-neutral-200">{origin.city}</div>
                            <div className="text-[10px] text-neutral-500">{origin.country}</div>
                          </td>

                          <td className="p-2.5">
                            <span className="text-[10px] uppercase px-1.5 py-0.5 bg-neutral-950 border border-neutral-800 text-neutral-300">
                              {origin.jurisdiction}
                            </span>
                          </td>

                          <td className="p-2.5 text-right">
                            <span className={`font-bold ${origin.threatDensityWeight > 80 ? 'text-neutral-400' : 'text-neutral-300'}`}>
                              {origin.threatDensityWeight}
                            </span>
                            <span className="text-[10px] text-neutral-500 block">
                              Score: {origin.threatScore}
                            </span>
                          </td>

                          <td className="p-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => focusOnServer(origin)}
                                className="p-1 border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-600"
                                title="Locate on World Map"
                              >
                                <Crosshair className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={origin.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-600"
                                title="Open URL"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Forensic Threat Metrics & Geopolitical Exposure Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Footprint Dispersion Profile */}
        <div className="p-3.5 border border-neutral-800 bg-black flex flex-col justify-between space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest flex items-center justify-between">
            <span>DISPERSION SPREAD</span>
            <Compass className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-tight">
              {threatReport.dispersionProfile}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {threatReport.uniqueCountries} nations • {threatReport.uniqueCities} city clusters
            </div>
          </div>
        </div>

        {/* Five Eyes MLAT Intercept Exposure */}
        <div className="p-3.5 border border-neutral-800 bg-black flex flex-col justify-between space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest flex items-center justify-between">
            <span>FIVE EYES EXPOSURE</span>
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-xl font-black text-white">
              {threatReport.fiveEyesPercent}%
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {threatReport.fiveEyesCount} of {allOrigins.length} nodes under MLAT sharing
            </div>
          </div>
        </div>

        {/* Legal Exposure Index */}
        <div className="p-3.5 border border-neutral-800 bg-black flex flex-col justify-between space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest flex items-center justify-between">
            <span>DOMINANT JURISDICTION</span>
            <Server className="w-3.5 h-3.5 text-neutral-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white truncate">
              {threatReport.dominantJurisdiction}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Primary regulatory legal vector
            </div>
          </div>
        </div>

        {/* Physical Geolocation Alert Status */}
        <div className="p-3.5 border border-neutral-800 bg-black flex flex-col justify-between space-y-1">
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest flex items-center justify-between">
            <span>PHYSICAL TRACKING RISK</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${threatReport.highPhysicalRiskCount > 0 ? 'text-white' : 'text-neutral-500'}`} />
          </div>
          <div>
            <div className={`text-sm font-bold ${threatReport.highPhysicalRiskCount > 0 ? 'text-white' : 'text-neutral-400'}`}>
              {threatReport.highPhysicalRiskCount > 0 ? `${threatReport.highPhysicalRiskCount} Vectors Detected` : 'Minimal Leak Risk'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {threatReport.highPhysicalRiskCount > 0
                ? 'Strava / media GPS traces detected'
                : 'No GPS fitness routes exposed'}
            </div>
          </div>
        </div>
      </div>

      {/* Top Host Nations Breakdown */}
      {threatReport.topCountries.length > 0 && (
        <div className="p-3 border border-neutral-800 bg-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
            HOSTING NATIONS CONCENTRATION:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {threatReport.topCountries.map((c) => (
              <span
                key={c.country}
                className="px-2 py-0.5 border border-neutral-800 bg-neutral-950 text-neutral-300 text-[11px] flex items-center gap-1.5"
              >
                <span className="font-semibold text-white">{c.country}:</span>
                <span className="text-neutral-400">{c.count} {c.count === 1 ? 'profile' : 'profiles'}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
