import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Sparkles } from 'lucide-react';
import { ScanResult, EmailReconData, AiProfileReport } from '../../types';
import { generateAccountLinkageDossier } from '../../data/accountLinkage';
import { buildGraph, computeAiMetrics, type GraphFilterMode, type GraphNode, type SizingMode } from './networkGraph.logic';
import { renderForceGraph } from './networkGraph.render';
import { GraphToolbar } from './GraphToolbar';
import { GraphLegend } from './GraphLegend';
import { NodeInspector } from './NodeInspector';

interface NetworkGraphProps {
  results: ScanResult[];
  target: string;
  emailData: EmailReconData | null;
  aiProfile?: AiProfileReport | null;
  onPivotScan?: (newTarget: string) => void;
}

export function NetworkRelationshipGraph({
  results,
  target,
  emailData,
  aiProfile,
  onPivotScan,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [filterMode, setFilterMode] = useState<GraphFilterMode>('all');
  const [sizingMode, setSizingMode] = useState<SizingMode>('completeness');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // ResizeObserver on graph container
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

  // Generate account linkage data
  const linkageReport = useMemo(() => {
    return generateAccountLinkageDossier(target, results, emailData);
  }, [target, results, emailData]);

  // Extract AI intelligence signals, completeness scores & activity densities
  const aiMetrics = useMemo(() => computeAiMetrics(results, aiProfile, emailData), [results, aiProfile, emailData]);

  // Construct nodes and links based on filter and active sizing mode
  const { nodes, links } = useMemo(
    () => buildGraph({ results, target, emailData, filterMode, linkageReport, aiMetrics, sizingMode }),
    [results, target, emailData, filterMode, linkageReport, aiMetrics, sizingMode],
  );

  // Render D3 Force-Directed Simulation (networkGraph.render.ts)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerWidth;
    const height = isFullscreen ? window.innerHeight * 0.75 : 460;
    const simulation = renderForceGraph(svgRef.current, { width, height, nodes, links, sizingMode, setSelectedNode });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [nodes, links, isFullscreen, sizingMode, containerWidth]);

  // Zoom control handlers
  const handleZoom = (scaleFactor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, scaleFactor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight * 0.75 : 460;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(400).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85)
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div 
      ref={containerRef}
      className={`border border-rule bg-paper-2 font-mono transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden shadow-2xl flex flex-col' : 'relative'
      }`}
    >
      {/* Top Header & Interactive Controls */}
      <GraphToolbar
        nodeCount={nodes.length}
        linkCount={links.length}
        hasAiProfile={!!aiProfile}
        sizingMode={sizingMode}
        setSizingMode={setSizingMode}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        handleZoom={handleZoom}
        handleResetZoom={handleResetZoom}
        isFullscreen={isFullscreen}
        setIsFullscreen={setIsFullscreen}
      />

      {/* SVG Canvas Area */}
      <div className="relative flex-1 bg-paper min-h-[380px]">
        <svg 
          ref={svgRef} 
          className="w-full h-full block cursor-grab active:cursor-grabbing"
          onClick={() => setSelectedNode(null)}
        />

        {/* Floating Legend & Sizing Metric Indicator */}        <GraphLegend sizingMode={sizingMode} targetRadius={nodes.find(n => n.type === 'target')?.radius || 22} />

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <NodeInspector
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            onPivotScan={onPivotScan}
            copiedText={copiedText}
            handleCopy={handleCopy}
          />
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2 border-t border-rule bg-paper-2 text-[10px] text-ink-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-ink" />
          Node radius dynamically reflects {sizingMode === 'completeness' ? 'AI Profile Completeness' : sizingMode === 'density' ? 'Cluster Activity Density' : 'Uniform Grid'}. Drag nodes to adjust gravity layout.
        </span>
        <span className="text-ink-3">D3.js Force Physics Engine</span>
      </div>
    </div>
  );
}
