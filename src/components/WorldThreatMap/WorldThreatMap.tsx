import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { EmailReconData, ScanResult } from '../../types';
import {
  computeDensityClusters,
  computeGeographicalThreatReport,
  type MappedOrigin,
  type ThreatDensityCluster,
} from '../../data/geoPlatforms';
import {
  buildCountryDensityMap,
  buildMappedOrigins,
  filterMatrixRows,
  filterOrigins,
  mapDimensions,
} from './worldThreatMap.logic';
import { renderWorldMap } from './worldThreatMap.render';
import { MapToolbar } from './MapToolbar';
import { MapFilterBar } from './MapFilterBar';
import { MapOverlays } from './MapOverlays';
import { OriginInspector } from './OriginInspector';
import { CorrelationMatrix } from './CorrelationMatrix';
import { ThreatMetrics } from './ThreatMetrics';

interface WorldThreatMapProps {
  results: ScanResult[];
  target: string;
  emailData: EmailReconData | null;
  onInspectProfile?: (result: ScanResult) => void;
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
  const allOrigins: MappedOrigin[] = useMemo(() => buildMappedOrigins(results, emailData), [results, emailData]);

  // Filtered origins based on UI selection
  const filteredOrigins = useMemo(
    () => filterOrigins(allOrigins, filterJurisdiction, onlyPhysicalRisk),
    [allOrigins, filterJurisdiction, onlyPhysicalRisk],
  );

  // Threat Density Clusters
  const densityClusters = useMemo(() => {
    return computeDensityClusters(filteredOrigins);
  }, [filteredOrigins]);

  // Holistic threat report
  const threatReport = useMemo(() => {
    return computeGeographicalThreatReport(allOrigins);
  }, [allOrigins]);

  // Country density score map
  const countryDensityMap = useMemo(() => buildCountryDensityMap(filteredOrigins), [filteredOrigins]);

  // Filtered correlation matrix rows
  const matrixRows = useMemo(() => filterMatrixRows(allOrigins, matrixSearch), [allOrigins, matrixSearch]);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth } = containerRef.current;
      setDimensions(mapDimensions(clientWidth));
    };

    updateSize();
    const observer = new ResizeObserver(() => {
      updateSize();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Primary D3 Rendering Effect (worldThreatMap.render.ts)
  useEffect(() => {
    if (!svgRef.current) return;

    const { zoom, projection } = renderWorldMap(svgRef.current, {
      dimensions, filteredOrigins, densityClusters, countryDensityMap, visualizationMode, showArcs, showGraticule,
      activeOrigin, hoveredOrigin, setActiveOrigin, setActiveCluster, setHoveredOrigin,
    });
    projectionRef.current = projection;
    zoomBehaviorRef.current = zoom;
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
    <div id="world-threat-perspective-container" className="border border-rule bg-paper-2 p-5 space-y-4 font-mono">
      {/* Header bar with primary telemetry metadata */}
      <MapToolbar
        visualizationMode={visualizationMode}
        setVisualizationMode={setVisualizationMode}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        handleResetZoom={handleResetZoom}
      />

      {/* Layer Toggles & Jurisdiction Filter Bar */}
      <MapFilterBar
        originCount={allOrigins.length}
        threatReport={threatReport}
        filterJurisdiction={filterJurisdiction}
        setFilterJurisdiction={setFilterJurisdiction}
        onlyPhysicalRisk={onlyPhysicalRisk}
        setOnlyPhysicalRisk={setOnlyPhysicalRisk}
        showArcs={showArcs}
        setShowArcs={setShowArcs}
        showGraticule={showGraticule}
        setShowGraticule={setShowGraticule}
      />

      {/* SVG Canvas Map Container */}
      <div 
        ref={containerRef}
        className="relative w-full border border-rule bg-paper overflow-hidden select-none"
        style={{ minHeight: '380px' }}
      >
        <svg
          id="world-threat-d3-svg"
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-auto block"
        />

        <MapOverlays visualizationMode={visualizationMode} clusterCount={densityClusters.length} originCount={allOrigins.length} />

        {/* Floating Forensic HUD Inspector (if node clicked or hovered) */}
        {activeFocus && (
          <OriginInspector
            activeFocus={activeFocus}
            copiedKey={copiedKey}
            copyToClipboard={copyToClipboard}
            onClose={() => {
              setActiveOrigin(null);
              setActiveCluster(null);
            }}
          />
        )}
      </div>

      {/* URL to Geographical Server IP Correlation Matrix (Collapsible Table) */}
      <CorrelationMatrix
        allOrigins={allOrigins}
        matrixRows={matrixRows}
        matrixSearch={matrixSearch}
        setMatrixSearch={setMatrixSearch}
        showCorrelationMatrix={showCorrelationMatrix}
        setShowCorrelationMatrix={setShowCorrelationMatrix}
        activeOrigin={activeOrigin}
        copiedKey={copiedKey}
        copyToClipboard={copyToClipboard}
        focusOnServer={focusOnServer}
      />

      {/* Forensic Threat Metrics & Geopolitical Exposure Strip, Top Host Nations Breakdown */}
      <ThreatMetrics threatReport={threatReport} originCount={allOrigins.length} />
    </div>
  );
}
