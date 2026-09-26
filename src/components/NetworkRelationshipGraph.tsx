import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Filter, 
  ExternalLink, 
  Maximize2, 
  Minimize2, 
  Layers, 
  Sparkles, 
  Search, 
  ArrowRight,
  ShieldAlert,
  Fingerprint,
  Info,
  Check,
  Copy,
  BrainCircuit,
  Activity,
  Gauge
} from 'lucide-react';
import { ScanResult, EmailReconData, AiProfileReport } from '../types';
import { generateAccountLinkageDossier } from '../data/accountLinkage';
import { CATEGORY_COLORS } from '../utils/themeColors';

export type SizingMode = 'completeness' | 'density' | 'uniform';

interface NetworkGraphProps {
  results: ScanResult[];
  target: string;
  emailData: EmailReconData | null;
  aiProfile?: AiProfileReport | null;
  onPivotScan?: (newTarget: string) => void;
}

// Graph node definition with AI-extracted profile completeness & activity density
export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'target' | 'category' | 'platform' | 'linkage' | 'email';
  category?: string;
  status?: string;
  url?: string;
  confidence?: number;
  similarity?: number;
  radius: number;
  color: string;
  details?: string;
  profileCompleteness: number; // 0 - 100%
  activityDensity: number;     // 0 - 100%
  densityFactors: string[];
}

// Graph link definition
export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  value: number;
  type: 'hub' | 'membership' | 'correlation' | 'email' | 'metadata-cluster';
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
  const [filterMode, setFilterMode] = useState<'all' | 'found_only' | 'clusters' | 'linkages'>('all');
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
  const aiMetrics = useMemo(() => {
    const foundResults = results.filter((r) => r.status === 'found');
    const foundCount = foundResults.length;
    const scannedCount = Math.max(1, results.filter((r) => r.status !== 'pending').length);

    // AI Investigation pivot lookup
    const aiPivotPlatforms = new Set<string>();
    if (aiProfile?.investigationPivots) {
      aiProfile.investigationPivots.forEach((p) => {
        aiPivotPlatforms.add((p.hop || '').toLowerCase());
        aiPivotPlatforms.add((p.recommendedAction || '').toLowerCase());
      });
    }

    // 1. Root Target Node Metrics
    let targetCompleteness = 0;
    let targetDensity = 0;
    const targetFactors: string[] = [];

    if (aiProfile) {
      const footprint = aiProfile.footprintScore || 50;
      const skillsCount = aiProfile.technicalSkills?.length || 0;
      const locationsCount = aiProfile.inferredLocations?.length || 0;
      const pivotsCount = aiProfile.investigationPivots?.length || 0;
      const interestsCount = aiProfile.potentialInterests?.length || 0;

      targetCompleteness = Math.min(
        100,
        Math.round(
          footprint * 0.35 +
          Math.min(skillsCount * 4, 18) +
          (aiProfile.behavioralSignals ? 18 : 0) +
          (locationsCount > 0 ? 10 : 0) +
          Math.min(pivotsCount * 3, 10) +
          Math.min(interestsCount * 2, 9)
        )
      );

      targetDensity = Math.min(
        100,
        Math.round(
          Math.min(foundCount * 5, 40) +
          (aiProfile.threatLevel === 'Critical' ? 35 : aiProfile.threatLevel === 'Elevated' ? 25 : aiProfile.threatLevel === 'Moderate' ? 15 : 8) +
          (aiProfile.behavioralSignals?.socialExposureRisk === 'Severe' ? 25 : aiProfile.behavioralSignals?.socialExposureRisk === 'Elevated' ? 15 : 5)
        )
      );

      targetFactors.push(`AI Archetype: ${aiProfile.archetype}`);
      targetFactors.push(`Exposure Threat: ${aiProfile.threatLevel} (Footprint ${aiProfile.footprintScore}/100)`);
      if (skillsCount > 0) targetFactors.push(`${skillsCount} technical skills identified`);
      if (aiProfile.behavioralSignals?.opsecHygiene) {
        targetFactors.push(`OpSec Hygiene: ${aiProfile.behavioralSignals.opsecHygiene}`);
      }
      if (locationsCount > 0) {
        targetFactors.push(`Inferred Locale: ${aiProfile.inferredLocations.join(', ')}`);
      }
    } else {
      targetCompleteness = Math.min(85, Math.round(20 + foundCount * 6));
      targetDensity = Math.min(85, Math.round((foundCount / scannedCount) * 120 + 15));
      targetFactors.push(`${foundCount} confirmed digital presences discovered`);
      targetFactors.push(`${scannedCount} probes scanned`);
    }

    // 2. Category Cluster Metrics
    const categoryMetrics: Record<string, { completeness: number; density: number; factors: string[] }> = {};
    const categoriesPresent = new Set<string>();
    results.forEach((r) => categoriesPresent.add(r.category));
    if (emailData) categoriesPresent.add('email');

    categoriesPresent.forEach((cat) => {
      const catFound = foundResults.filter((r) => r.category === cat);
      const catTotal = results.filter((r) => r.category === cat);
      const factors: string[] = [];

      let isAiAligned = false;
      let alignmentReason = '';

      if (aiProfile) {
        const arch = (aiProfile.archetype || '').toLowerCase();
        const skills = (aiProfile.technicalSkills || []).join(' ').toLowerCase();
        const interests = (aiProfile.potentialInterests || []).join(' ').toLowerCase();

        if (cat === 'developer') {
          if (arch.includes('developer') || arch.includes('architect') || arch.includes('engineer') || skills.length > 0) {
            isAiAligned = true;
            alignmentReason = 'Gemini Archetype: Software Architecture & Code Repos';
          }
        } else if (cat === 'security') {
          if (arch.includes('security') || arch.includes('bounty') || arch.includes('offensive') || aiProfile.threatLevel === 'Critical' || aiProfile.threatLevel === 'Elevated') {
            isAiAligned = true;
            alignmentReason = 'Gemini Threat Evaluation: High Security & OpSec Footprint';
          }
        } else if (cat === 'social') {
          if (aiProfile.behavioralSignals?.socialExposureRisk === 'Elevated' || aiProfile.behavioralSignals?.socialExposureRisk === 'Severe') {
            isAiAligned = true;
            alignmentReason = 'AI Behavioral Signal: Elevated Public Social Exposure';
          }
        } else if (cat === 'crypto') {
          if (interests.includes('crypto') || interests.includes('blockchain') || interests.includes('web3') || arch.includes('crypto')) {
            isAiAligned = true;
            alignmentReason = 'AI Detected Interests: Web3 / Distributed Ledger Assets';
          }
        } else if (cat === 'gaming') {
          if (interests.includes('game') || interests.includes('esports') || interests.includes('steam')) {
            isAiAligned = true;
            alignmentReason = 'AI Profile: Digital Gaming Ecosystems';
          }
        }
      }

      const hitRatio = catFound.length / Math.max(1, foundCount);
      const density = Math.min(
        100,
        Math.round(hitRatio * 50 + (catFound.length > 0 ? 25 : 0) + (isAiAligned ? 25 : 0))
      );

      const completeness = Math.min(
        100,
        Math.round(catFound.length * 15 + (isAiAligned ? 30 : 15) + (catTotal.length > 0 ? 10 : 0))
      );

      if (catFound.length > 0) factors.push(`${catFound.length} confirmed platform accounts`);
      if (isAiAligned) factors.push(alignmentReason);
      factors.push(`${catTotal.length} category surfaces monitored`);

      categoryMetrics[cat] = { completeness, density, factors };
    });

    if (emailData) {
      categoryMetrics['email'] = {
        completeness: emailData.isValidSyntax ? 85 : 40,
        density: emailData.isCommonProvider ? 60 : 80,
        factors: [
          `Target Domain: ${emailData.domain}`,
          emailData.isDisposable ? 'Disposable email vendor' : 'Primary corporate/standard mail provider'
        ]
      };
    }

    return {
      targetCompleteness,
      targetDensity,
      targetFactors,
      categoryMetrics,
      aiPivotPlatforms
    };
  }, [results, aiProfile, emailData]);

  // Construct nodes and links based on filter and active sizing mode
  const { nodes, links } = useMemo(() => {
    const rawNodes: GraphNode[] = [];
    const rawLinks: GraphLink[] = [];

    // Node radius sizing helper based on chosen sizing mode
    const calculateRadius = (
      type: 'target' | 'category' | 'platform' | 'linkage' | 'email',
      status: string | undefined,
      completeness: number,
      density: number,
      similarity: number | undefined
    ) => {
      if (sizingMode === 'uniform') {
        if (type === 'target') return 22;
        if (type === 'category') return 14;
        if (type === 'platform') return status === 'found' ? 9 : 6;
        return 8;
      }

      const metric = sizingMode === 'completeness' ? completeness : density;
      const ratio = Math.max(0, Math.min(1, metric / 100));

      if (type === 'target') {
        // Radius scale: 22px to 38px
        return Math.round(22 + ratio * 16);
      }
      if (type === 'category') {
        // Radius scale: 13px to 25px
        return Math.round(13 + ratio * 12);
      }
      if (type === 'platform') {
        if (status === 'found') {
          // Radius scale: 8px to 17px
          return Math.round(8 + ratio * 9);
        }
        if (status === 'uncertain' || status === 'rate_limited') {
          return 6.5;
        }
        return 5;
      }
      // Linkage / Email nodes
      const sim = (similarity || 50) / 100;
      return Math.round(6 + sim * 5);
    };

    // 1. Central Target Node
    const targetNodeRadius = calculateRadius(
      'target',
      undefined,
      aiMetrics.targetCompleteness,
      aiMetrics.targetDensity,
      100
    );

    const targetNode: GraphNode = {
      id: `target-${target}`,
      label: `@${target}`,
      type: 'target',
      radius: targetNodeRadius,
      color: '#FFFFFF',
      confidence: 100,
      details: 'Primary Investigation Target Core',
      profileCompleteness: aiMetrics.targetCompleteness,
      activityDensity: aiMetrics.targetDensity,
      densityFactors: aiMetrics.targetFactors
    };
    rawNodes.push(targetNode);

    // 2. Category Hub Nodes
    const categoriesPresent = new Set<string>();
    results.forEach((r) => categoriesPresent.add(r.category));
    if (emailData) categoriesPresent.add('email');

    categoriesPresent.forEach((cat) => {
      const catColor = CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
      const metric = aiMetrics.categoryMetrics[cat] || { completeness: 40, density: 40, factors: [] };
      const hubRadius = calculateRadius(
        'category',
        undefined,
        metric.completeness,
        metric.density,
        undefined
      );

      rawNodes.push({
        id: `hub-${cat}`,
        label: cat.toUpperCase(),
        type: 'category',
        category: cat,
        radius: hubRadius,
        color: catColor,
        details: `${cat.toUpperCase()} Cluster • ${metric.completeness}% Completeness / ${metric.density}% Density`,
        profileCompleteness: metric.completeness,
        activityDensity: metric.density,
        densityFactors: metric.factors
      });

      // Link category hub to central target
      rawLinks.push({
        source: targetNode.id,
        target: `hub-${cat}`,
        value: 3,
        type: 'hub',
      });
    });

    // 3. Platform Nodes
    results.forEach((res) => {
      if (filterMode === 'found_only' && res.status !== 'found') return;
      if (filterMode === 'clusters' && res.status !== 'found') return;

      const isFound = res.status === 'found';
      const isUncertain = res.status === 'uncertain' || res.status === 'rate_limited';

      if (!isFound && !isUncertain && filterMode !== 'all') return;

      const catMetric = aiMetrics.categoryMetrics[res.category] || { completeness: 30, density: 30 };
      const pNameLower = res.platformName.toLowerCase();
      const isAiPivot = aiMetrics.aiPivotPlatforms.has(pNameLower) || aiMetrics.aiPivotPlatforms.has(res.id.toLowerCase());

      const platformFactors: string[] = [];
      let platformCompleteness = 10;
      let platformDensity = 10;

      if (isFound) {
        platformCompleteness = Math.min(100, Math.round(55 + (res.confidenceScore || 90) * 0.3 + (isAiPivot ? 15 : 0)));
        platformDensity = Math.min(100, Math.round(45 + catMetric.density * 0.35 + (isAiPivot ? 20 : 0)));
        platformFactors.push(`Live HTTP hit confirmed (${res.confidenceScore || 95}% confidence)`);
        if (isAiPivot) platformFactors.push('Flagged by Gemini as high-value investigation pivot point');
        if (catMetric.density >= 60) platformFactors.push(`High cluster activity density in ${res.category}`);
      } else if (isUncertain) {
        platformCompleteness = 35;
        platformDensity = 25;
        platformFactors.push('Uncertain / WAF-protected response requires manual auditing');
      } else {
        platformFactors.push('Absence confirmed (HTTP 404 / inactive handle)');
      }

      const pColor = isFound
        ? (CATEGORY_COLORS[res.category] || '#FFFFFF')
        : isUncertain
        ? '#A3A3A3'
        : '#737373';

      const pRadius = calculateRadius(
        'platform',
        res.status,
        platformCompleteness,
        platformDensity,
        res.confidenceScore
      );

      const pNode: GraphNode = {
        id: `platform-${res.id}`,
        label: res.platformName,
        type: 'platform',
        category: res.category,
        status: res.status,
        url: res.url,
        confidence: res.confidenceScore || (isFound ? 95 : 50),
        radius: pRadius,
        color: pColor,
        details: `${res.platformName} (${res.category}) - ${res.status.toUpperCase()}`,
        profileCompleteness: platformCompleteness,
        activityDensity: platformDensity,
        densityFactors: platformFactors
      };
      rawNodes.push(pNode);

      // Link platform to its category hub
      rawLinks.push({
        source: `hub-${res.category}`,
        target: pNode.id,
        value: isFound ? 2 : 1,
        type: 'membership',
      });
    });

    // 3b. Direct Cross-Account Metadata Cluster Links
    // Connect verified platforms within the same metadata category / shared username cluster
    const verifiedByCluster: Record<string, GraphNode[]> = {};
    rawNodes.filter(n => n.type === 'platform' && n.status === 'found').forEach(pNode => {
      const clusterKey = pNode.category || 'general';
      if (!verifiedByCluster[clusterKey]) verifiedByCluster[clusterKey] = [];
      verifiedByCluster[clusterKey].push(pNode);
    });

    Object.entries(verifiedByCluster).forEach(([_clusterKey, clusterNodes]) => {
      if (clusterNodes.length > 1) {
        for (let i = 0; i < clusterNodes.length; i++) {
          for (let j = i + 1; j < Math.min(i + 3, clusterNodes.length); j++) {
            rawLinks.push({
              source: clusterNodes[i].id,
              target: clusterNodes[j].id,
              value: 1.2,
              type: 'metadata-cluster',
            });
          }
        }
      }
    });

    // 4. Linkage Theory Nodes (Account Permutations & Similarities)
    if (filterMode === 'all' || filterMode === 'linkages') {
      linkageReport.permutations.slice(0, 6).forEach((perm) => {
        const permRadius = calculateRadius('linkage', undefined, perm.similarityScore, perm.similarityScore, perm.similarityScore);
        const permNode: GraphNode = {
          id: `perm-${perm.id}`,
          label: perm.label,
          type: 'linkage',
          similarity: perm.similarityScore,
          radius: permRadius,
          color: '#F5F5F5', // Mineiro Username Extractor Neutral Light
          details: `Permutation: ${perm.reason} [${perm.similarityScore}% similarity]`,
          profileCompleteness: perm.similarityScore,
          activityDensity: Math.round(perm.similarityScore * 0.8),
          densityFactors: [perm.reason, `Mutation: ${perm.mutationType}`]
        };
        rawNodes.push(permNode);

        rawLinks.push({
          source: targetNode.id,
          target: permNode.id,
          value: 1.5,
          type: 'correlation',
        });
      });

      // Email linkage nodes
      linkageReport.emailCorrelations.slice(0, 3).forEach((ec) => {
        const emailRadius = calculateRadius('email', undefined, ec.similarityScore, ec.similarityScore, ec.similarityScore);
        const emailNode: GraphNode = {
          id: `email-${ec.id}`,
          label: ec.label,
          type: 'email',
          similarity: ec.similarityScore,
          radius: emailRadius,
          color: '#FFFFFF', // Mineiro Username Extractor Cyan Signal
          details: `Email Correlation: ${ec.reason}`,
          profileCompleteness: ec.similarityScore,
          activityDensity: Math.round(ec.similarityScore * 0.85),
          densityFactors: [ec.reason, 'Correlation from MX/Syntax patterns']
        };
        rawNodes.push(emailNode);

        rawLinks.push({
          source: targetNode.id,
          target: emailNode.id,
          value: 1.5,
          type: 'email',
        });
      });
    }

    return { nodes: rawNodes, links: rawLinks };
  }, [results, target, emailData, filterMode, linkageReport, aiMetrics, sizingMode]);

  // Render D3 Force-Directed Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const width = containerWidth;
    const height = isFullscreen ? window.innerHeight * 0.75 : 460;

    const svg = d3.select(svgRef.current);
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
      .attr('stroke', 'rgba(255, 255, 255, 0.04)')
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
        if (d.type === 'hub') return 'rgba(255, 255, 255, 0.35)';
        if (d.type === 'correlation') return 'rgba(255, 255, 255, 0.25)';
        if (d.type === 'email') return 'rgba(255, 255, 255, 0.25)';
        if (d.type === 'metadata-cluster') return 'rgba(255, 255, 255, 0.2)';
        return 'rgba(255, 255, 255, 0.12)';
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
      .attr('stroke', 'rgba(255, 255, 255, 0.3)')
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
      .attr('fill', (d: GraphNode) => (d.type === 'target' ? '#FFFFFF' : '#0A0A0A'))
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
      .attr('fill', (d: GraphNode) => (d.type === 'target' ? '#FFFFFF' : '#F5F5F5'))
      .attr('font-size', (d: GraphNode) => (d.type === 'target' ? '12px' : d.type === 'category' ? '10px' : '9px'))
      .attr('font-weight', (d: GraphNode) => (d.type === 'target' || d.type === 'category' ? 'bold' : 'normal'))
      .attr('font-family', 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
      .attr('pointer-events', 'none')
      .attr('filter', 'drop-shadow(0px 1px 2px rgba(0,0,0,0.9))');

    // Simulation tick handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

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
      className={`border border-neutral-800 bg-neutral-950 font-mono transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden shadow-2xl flex flex-col' : 'relative'
      }`}
    >
      {/* Top Header & Interactive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 border-b border-neutral-800 bg-black/80 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <Network className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            D3.js Relationship & Cluster Graph
          </span>
          <span className="text-[10px] px-2 py-0.5 border border-neutral-800 bg-neutral-900 text-neutral-400">
            {nodes.length} Nodes • {links.length} Links
          </span>
          {aiProfile && (
            <span className="text-[10px] px-2 py-0.5 border border-white/30 bg-neutral-900 text-white flex items-center gap-1">
              <BrainCircuit className="w-3 h-3 text-white" />
              AI Intelligence Grounded
            </span>
          )}
        </div>

        {/* Filter and Sizing Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Node Sizing Mode Selector */}
          <div className="flex items-center border border-neutral-800 bg-black p-0.5">
            <span className="text-[10px] text-neutral-500 px-2 uppercase font-semibold hidden xl:inline">
              Sizing:
            </span>
            <button
              type="button"
              id="graph-sizing-completeness-btn"
              onClick={() => setSizingMode('completeness')}
              className={`px-2 py-1 text-[10px] uppercase transition-colors flex items-center gap-1 ${
                sizingMode === 'completeness' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Scale nodes by Profile Completeness extracted from AI analysis"
            >
              <Sparkles className="w-3 h-3" />
              AI Completeness
            </button>
            <button
              type="button"
              id="graph-sizing-density-btn"
              onClick={() => setSizingMode('density')}
              className={`px-2 py-1 text-[10px] uppercase transition-colors flex items-center gap-1 ${
                sizingMode === 'density' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Scale nodes by Activity Density & cluster concentration"
            >
              <Activity className="w-3 h-3" />
              Activity Density
            </button>
            <button
              type="button"
              id="graph-sizing-uniform-btn"
              onClick={() => setSizingMode('uniform')}
              className={`px-2 py-1 text-[10px] uppercase transition-colors ${
                sizingMode === 'uniform' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
              title="Standard uniform node radii"
            >
              Uniform
            </button>
          </div>

          {/* Topology Filter Buttons */}
          <div className="flex items-center border border-neutral-800 bg-black p-0.5">
            <button
              type="button"
              id="graph-filter-all-btn"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
                filterMode === 'all' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              id="graph-filter-hits-btn"
              onClick={() => setFilterMode('found_only')}
              className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
                filterMode === 'found_only' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Hits
            </button>
            <button
              type="button"
              id="graph-filter-linkages-btn"
              onClick={() => setFilterMode('linkages')}
              className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
                filterMode === 'linkages' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Linkage
            </button>
            <button
              type="button"
              id="graph-filter-clusters-btn"
              onClick={() => setFilterMode('clusters')}
              className={`px-2.5 py-1 text-[11px] uppercase transition-colors ${
                filterMode === 'clusters' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Hubs
            </button>
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 border border-neutral-800 bg-black p-0.5">
            <button
              type="button"
              id="graph-zoom-in-btn"
              onClick={() => handleZoom(1.3)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="graph-zoom-out-btn"
              onClick={() => handleZoom(0.7)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id="graph-zoom-reset-btn"
              onClick={handleResetZoom}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            id="graph-fullscreen-toggle-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 border border-neutral-800 bg-black text-neutral-400 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 bg-black min-h-[380px]">
        <svg 
          ref={svgRef} 
          className="w-full h-full block cursor-grab active:cursor-grabbing"
          onClick={() => setSelectedNode(null)}
        />

        {/* Floating Legend & Sizing Metric Indicator */}
        <div className="absolute bottom-3 left-3 bg-black/90 border border-neutral-800 p-2.5 backdrop-blur-md text-[10px] space-y-1.5 pointer-events-none hidden sm:block">
          <div className="text-neutral-400 font-bold uppercase tracking-wider flex items-center justify-between gap-4">
            <span>Topology Legend</span>
            <span className="text-white font-normal">
              Sizing: {sizingMode === 'completeness' ? 'AI Completeness' : sizingMode === 'density' ? 'Activity Density' : 'Uniform'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white inline-block border border-neutral-400" />
            <span className="text-neutral-300">Target Core (Radius {nodes.find(n => n.type === 'target')?.radius || 22}px)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 inline-block" />
            <span className="text-neutral-300">Category Hubs (Dynamic Gauge)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white inline-block" />
            <span className="text-neutral-300">Confirmed Hits (Sized by AI Score)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-white inline-block border-t border-dotted border-white" />
            <span className="text-neutral-300">Shared Metadata Cluster Links</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400 inline-block" />
            <span className="text-neutral-300">Account Permutations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-300 inline-block" />
            <span className="text-neutral-300">Email Correlations</span>
          </div>
        </div>

        {/* Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-3 right-3 max-w-sm w-full bg-black/95 border border-neutral-700 p-4 backdrop-blur-md text-xs space-y-3 shadow-2xl z-20">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-2">
              <div>
                <span className="text-[10px] uppercase text-neutral-500 tracking-wider">
                  NODE INSPECTION:
                </span>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  {selectedNode.label}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="text-neutral-500 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-neutral-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Node Type:</span>
                <span className="text-white font-bold uppercase">{selectedNode.type}</span>
              </div>
              {selectedNode.category && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Category:</span>
                  <span className="text-white capitalize">{selectedNode.category}</span>
                </div>
              )}
              {selectedNode.status && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Probe Status:</span>
                  <span className={`font-bold uppercase ${selectedNode.status === 'found' ? 'text-white' : 'text-neutral-400'}`}>
                    {selectedNode.status}
                  </span>
                </div>
              )}
              {selectedNode.similarity !== undefined && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Correlation Similarity:</span>
                  <span className="text-white font-bold">{selectedNode.similarity}%</span>
                </div>
              )}
              {selectedNode.confidence !== undefined && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Confidence Score:</span>
                  <span className="text-white font-bold">{selectedNode.confidence}%</span>
                </div>
              )}

              {/* AI Sizing Metrics Breakdown */}
              <div className="pt-2 border-t border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] uppercase text-neutral-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Gauge className="w-3 h-3 text-white" />
                    Profile Completeness:
                  </span>
                  <span className="text-white font-mono font-bold">{selectedNode.profileCompleteness}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 border border-neutral-800 overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all duration-300" 
                    style={{ width: `${selectedNode.profileCompleteness}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] uppercase text-neutral-400 font-semibold pt-1">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-neutral-300" />
                    Activity Density:
                  </span>
                  <span className="text-white font-mono font-bold">{selectedNode.activityDensity}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-1.5 border border-neutral-800 overflow-hidden">
                  <div 
                    className="bg-neutral-300 h-full transition-all duration-300" 
                    style={{ width: `${selectedNode.activityDensity}%` }}
                  />
                </div>
              </div>

              {/* Contributing Factors from AI */}
              {selectedNode.densityFactors && selectedNode.densityFactors.length > 0 && (
                <div className="pt-2 border-t border-neutral-800 space-y-1">
                  <span className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider">
                    Contributing AI Intelligence:
                  </span>
                  <ul className="space-y-1 text-[10px] text-neutral-300 list-disc list-inside">
                    {selectedNode.densityFactors.map((factor, idx) => (
                      <li key={idx} className="leading-snug text-neutral-300">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedNode.details && (
                <div className="pt-2 border-t border-neutral-800 text-neutral-400 text-[10px]">
                  {selectedNode.details}
                </div>
              )}
            </div>

            {/* Actions for Selected Node */}
            <div className="pt-2 border-t border-neutral-800 flex flex-wrap gap-2">
              {selectedNode.url && (
                <a
                  href={selectedNode.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-2.5 py-1.5 bg-white text-black font-bold uppercase text-[10px] hover:bg-neutral-200 inline-flex items-center gap-1.5 tracking-wider"
                >
                  <ExternalLink className="w-3 h-3" />
                  Audit Profile
                </a>
              )}

              {onPivotScan && (selectedNode.type === 'linkage' || selectedNode.type === 'email') && (
                <button
                  type="button"
                  onClick={() => onPivotScan(selectedNode.label.replace(/^@/, ''))}
                  className="px-2.5 py-1.5 border border-white bg-white text-black font-bold uppercase text-[10px] hover:bg-neutral-200 inline-flex items-center gap-1.5 tracking-wider"
                >
                  <Search className="w-3 h-3" />
                  Pivot Scan
                </button>
              )}

              <button
                type="button"
                onClick={() => handleCopy(selectedNode.label)}
                className="px-2 py-1.5 border border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white text-[10px] inline-flex items-center gap-1"
              >
                {copiedText === selectedNode.label ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                {copiedText === selectedNode.label ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950 text-[10px] text-neutral-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-white" />
          Node radius dynamically reflects {sizingMode === 'completeness' ? 'AI Profile Completeness' : sizingMode === 'density' ? 'Cluster Activity Density' : 'Uniform Grid'}. Drag nodes to adjust gravity layout.
        </span>
        <span className="text-neutral-400">D3.js Force Physics Engine</span>
      </div>
    </div>
  );
}

