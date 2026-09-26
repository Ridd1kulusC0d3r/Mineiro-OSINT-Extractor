import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  ShieldAlert, 
  Activity, 
  ExternalLink, 
  Copy, 
  Check, 
  Filter, 
  Search, 
  Maximize2, 
  Info, 
  Flame, 
  Lock, 
  Globe2, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ScanResult, AiProfileReport } from '../types';
import { useToast } from './Toast';
import { PlatformFavicon } from './PlatformFavicon';

export interface RiskMatrixAccount {
  id: string;
  platformName: string;
  category: string;
  url: string;
  sensitivity: number; // 0 - 100
  activity: number;    // 0 - 100
  quadrant: 'critical' | 'latent' | 'surface' | 'peripheral';
  quadrantTitle: string;
  description: string;
  priorityScore: number;
  responseTimeMs?: number;
  statusCode?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface RiskMatrix2x2Props {
  results: ScanResult[];
  target: string;
  aiProfile?: AiProfileReport | null;
  onPivotScan?: (target: string) => void;
}

// Heuristic calculation of Sensitivity (0 - 100) based on platform category and identity characteristics
function calculatePlatformSensitivity(platform: ScanResult): number {
  const name = platform.platformName.toLowerCase();
  const category = (platform.category || '').toLowerCase();

  // Tier 1: Highest sensitivity (Financial, Cloud, Crypto, Security, Critical Dev Vaults)
  if (
    category === 'finance' || 
    category === 'crypto' || 
    category === 'security' ||
    name.includes('paypal') ||
    name.includes('coinbase') ||
    name.includes('binance') ||
    name.includes('keybase') ||
    name.includes('proton') ||
    name.includes('stripe') ||
    name.includes('hackerone') ||
    name.includes('bugcrowd')
  ) {
    return 85 + (hashString(name) % 13); // 85 - 97
  }

  // Tier 2: High sensitivity (Source Code, Cloud Services, Package Registries, Professional Career)
  if (
    category === 'developer' || 
    category === 'cloud' || 
    category === 'career' ||
    name.includes('github') ||
    name.includes('gitlab') ||
    name.includes('docker') ||
    name.includes('npm') ||
    name.includes('pypi') ||
    name.includes('linkedin') ||
    name.includes('aws')
  ) {
    return 65 + (hashString(name) % 18); // 65 - 82
  }

  // Tier 3: Moderate sensitivity (Messaging, Direct Communications, Forums, Blogs)
  if (
    category === 'messaging' || 
    category === 'social' || 
    category === 'tech' ||
    name.includes('telegram') ||
    name.includes('discord') ||
    name.includes('signal') ||
    name.includes('reddit') ||
    name.includes('twitter') ||
    name.includes('x') ||
    name.includes('medium') ||
    name.includes('substack')
  ) {
    return 45 + (hashString(name) % 18); // 45 - 62
  }

  // Tier 4: Lower sensitivity (Gaming, Music, Creative, Video, Lifestyle)
  if (
    category === 'gaming' || 
    category === 'music' || 
    category === 'creative' ||
    category === 'entertainment' ||
    name.includes('steam') ||
    name.includes('spotify') ||
    name.includes('twitch') ||
    name.includes('soundcloud') ||
    name.includes('pinterest') ||
    name.includes('deviantart')
  ) {
    return 20 + (hashString(name) % 22); // 20 - 41
  }

  // Default baseline
  return 30 + (hashString(name) % 25);
}

// Heuristic calculation of Activity Frequency (0 - 100)
function calculateActivityFrequency(platform: ScanResult, sensitivity: number): number {
  const name = platform.platformName.toLowerCase();
  const category = (platform.category || '').toLowerCase();

  let baseActivity = 50;

  // High-cadence interactive platforms
  if (
    name.includes('twitter') || 
    name.includes('github') || 
    name.includes('reddit') || 
    name.includes('telegram') || 
    name.includes('discord') || 
    name.includes('linkedin') ||
    category === 'social' ||
    category === 'messaging'
  ) {
    baseActivity = 72 + (hashString(name + 'act') % 23); // 72 - 94
  } else if (
    category === 'developer' || 
    category === 'gaming' || 
    name.includes('twitch') || 
    name.includes('spotify')
  ) {
    baseActivity = 55 + (hashString(name + 'act') % 25); // 55 - 79
  } else if (
    category === 'finance' || 
    category === 'crypto' || 
    name.includes('keybase') ||
    name.includes('gravatar') ||
    name.includes('docker')
  ) {
    // Dormant repositories or static utility registrations
    baseActivity = 25 + (hashString(name + 'act') % 28); // 25 - 52
  } else {
    baseActivity = 35 + (hashString(name + 'act') % 35); // 35 - 69
  }

  // Latency modifier: fast response times often correlate with active edge nodes
  if (platform.responseTimeMs && platform.responseTimeMs < 250) {
    baseActivity = Math.min(98, baseActivity + 5);
  }

  return Math.max(10, Math.min(98, baseActivity));
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function RiskMatrix2x2({
  results,
  target,
  aiProfile,
  onPivotScan,
}: RiskMatrix2x2Props) {
  const { showToast } = useToast();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [selectedAccount, setSelectedAccount] = useState<RiskMatrixAccount | null>(null);
  const [activeQuadrantFilter, setActiveQuadrantFilter] = useState<'all' | 'critical' | 'latent' | 'surface' | 'peripheral'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 700,
    height: 480,
  });

  // Observe container size dynamically with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const clientWidth = containerRef.current.clientWidth || 700;
      const width = Math.max(320, clientWidth);
      const height = Math.max(460, Math.min(640, Math.round(width * 0.64)));
      setDimensions({ width, height });
    };

    updateDimensions();
    const observer = new ResizeObserver(() => {
      updateDimensions();
    });
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Compute structured risk accounts from verified found results
  const accounts: RiskMatrixAccount[] = useMemo(() => {
    const found = results.filter((r) => r.status === 'found');
    return found.map((r) => {
      const sensitivity = calculatePlatformSensitivity(r);
      const activity = calculateActivityFrequency(r, sensitivity);
      
      let quadrant: 'critical' | 'latent' | 'surface' | 'peripheral';
      let quadrantTitle = '';
      let description = '';

      if (sensitivity >= 50 && activity >= 50) {
        quadrant = 'critical';
        quadrantTitle = 'Critical Threat & Prime Target';
        description = 'High privilege data (financial, credentials, source code) with active real-time footprint.';
      } else if (sensitivity >= 50 && activity < 50) {
        quadrant = 'latent';
        quadrantTitle = 'Latent Vault / High Privilege';
        description = 'High sensitivity account with low rotation/activity. High impact if compromised.';
      } else if (sensitivity < 50 && activity >= 50) {
        quadrant = 'surface';
        quadrantTitle = 'Broad Public Surface';
        description = 'Frequent social or gaming presence. Rich source for behavioral, linguistic, and timeline clues.';
      } else {
        quadrant = 'peripheral';
        quadrantTitle = 'Peripheral / Low Impact';
        description = 'Low sensitivity profile with infrequent usage. Secondary forensic utility.';
      }

      // Priority score: weighted combination (60% sensitivity, 40% activity)
      const priorityScore = Math.round(sensitivity * 0.6 + activity * 0.4);

      return {
        id: r.platformId,
        platformName: r.platformName,
        category: r.category,
        url: r.url,
        sensitivity,
        activity,
        quadrant,
        quadrantTitle,
        description,
        priorityScore,
        responseTimeMs: r.responseTimeMs,
        statusCode: r.statusCode,
      };
    });
  }, [results]);

  // Quadrant counts
  const counts = useMemo(() => {
    return {
      all: accounts.length,
      critical: accounts.filter((a) => a.quadrant === 'critical').length,
      latent: accounts.filter((a) => a.quadrant === 'latent').length,
      surface: accounts.filter((a) => a.quadrant === 'surface').length,
      peripheral: accounts.filter((a) => a.quadrant === 'peripheral').length,
    };
  }, [accounts]);

  // Filtered accounts based on quadrant tab and search
  const visibleAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (activeQuadrantFilter !== 'all' && acc.quadrant !== activeQuadrantFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          acc.platformName.toLowerCase().includes(q) ||
          acc.category.toLowerCase().includes(q) ||
          acc.url.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, activeQuadrantFilter, searchQuery]);

  // Auto-select first critical or highest priority account
  useEffect(() => {
    if (!selectedAccount && accounts.length > 0) {
      const sorted = [...accounts].sort((a, b) => b.priorityScore - a.priorityScore);
      setSelectedAccount(sorted[0]);
    }
  }, [accounts, selectedAccount]);

  // D3 Visualization Render
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = dimensions.width;
    const height = dimensions.height;

    const margin = { top: 50, right: 40, bottom: 55, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
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
      .attr('fill', '#FFFFFF')
      .attr('fill-opacity', activeQuadrantFilter === 'critical' ? 0.14 : 0.05)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-opacity', activeQuadrantFilter === 'critical' ? 0.4 : 0.15);

    // Q2: Top-Left (Latent Vault: High Sensitivity, Low Activity)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', midX)
      .attr('height', midY)
      .attr('fill', '#737373')
      .attr('fill-opacity', activeQuadrantFilter === 'latent' ? 0.14 : 0.04)
      .attr('stroke', '#737373')
      .attr('stroke-opacity', activeQuadrantFilter === 'latent' ? 0.4 : 0.15);

    // Q3: Bottom-Right (Broad Surface: Low Sensitivity, High Activity)
    g.append('rect')
      .attr('x', midX)
      .attr('y', midY)
      .attr('width', innerWidth - midX)
      .attr('height', innerHeight - midY)
      .attr('fill', '#FFFFFF')
      .attr('fill-opacity', activeQuadrantFilter === 'surface' ? 0.14 : 0.04)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-opacity', activeQuadrantFilter === 'surface' ? 0.4 : 0.15);

    // Q4: Bottom-Left (Peripheral: Low Sensitivity, Low Activity)
    g.append('rect')
      .attr('x', 0)
      .attr('y', midY)
      .attr('width', midX)
      .attr('height', innerHeight - midY)
      .attr('fill', '#737373')
      .attr('fill-opacity', activeQuadrantFilter === 'peripheral' ? 0.14 : 0.03)
      .attr('stroke', '#2A2A2A')
      .attr('stroke-opacity', activeQuadrantFilter === 'peripheral' ? 0.4 : 0.15);

    // 2. Quadrant Watermark Labels
    const watermarkData = [
      { text: 'CRITICAL RISK // PRIME TARGET', x: midX + 14, y: 22, color: '#FFFFFF', sub: 'High Sensitivity • High Activity' },
      { text: 'LATENT VAULT // HIGH PRIVILEGE', x: 14, y: 22, color: '#737373', sub: 'High Sensitivity • Low Activity' },
      { text: 'BROAD SURFACE // FREQUENT ENGAGEMENT', x: midX + 14, y: midY + 22, color: '#FFFFFF', sub: 'Low Sensitivity • High Activity' },
      { text: 'PERIPHERAL // LOW EXPOSURE', x: 14, y: midY + 22, color: '#A3A3A3', sub: 'Low Sensitivity • Low Activity' },
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
        .attr('fill', '#737373')
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
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.4);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', midY)
      .attr('x2', innerWidth)
      .attr('y2', midY)
      .attr('stroke', '#FFFFFF')
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
        .attr('stroke', '#2A2A2A')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '2,4');

      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(val))
        .attr('x2', innerWidth)
        .attr('y2', yScale(val))
        .attr('stroke', '#2A2A2A')
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
      .attr('stroke', '#2A2A2A')
      .attr('stroke-width', 1);

    // 5. Axis Labels
    // Bottom X-Axis Label: Activity Frequency
    svg.append('text')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', height - 12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#F5F5F5')
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
      .attr('fill', '#F5F5F5')
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
      let nodeColor = '#A3A3A3';
      let ringColor = '#737373';
      if (node.quadrant === 'critical') {
        nodeColor = '#FFFFFF';
        ringColor = '#FFFFFF';
      } else if (node.quadrant === 'latent') {
        nodeColor = '#737373';
        ringColor = '#737373';
      } else if (node.quadrant === 'surface') {
        nodeColor = '#FFFFFF';
        ringColor = '#FFFFFF';
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
        .attr('fill', '#0A0A0A')
        .attr('stroke', isSelected ? '#FFFFFF' : nodeColor)
        .attr('stroke-width', isSelected ? 2.5 : 1.5)
        .attr('filter', isSelected ? 'drop-shadow(0 0 6px rgba(255, 255, 255,0.6))' : 'none');

      // Inner color pip
      accountG.append('circle')
        .attr('r', isSelected ? 5 : 3.5)
        .attr('fill', nodeColor);

      // Node Label (Short platform moniker)
      accountG.append('text')
        .attr('x', 11)
        .attr('y', 3.5)
        .attr('fill', isSelected ? '#FFFFFF' : '#F5F5F5')
        .attr('font-size', isSelected ? '10px' : '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .attr('pointer-events', 'none')
        .text(node.platformName);
    });

  }, [accounts, visibleAccounts, selectedAccount, activeQuadrantFilter, dimensions]);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
    showToast({
      title: 'Target URL Copied',
      message: url,
      type: 'copy',
    });
  };

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-5 font-mono text-xs">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-neutral-500 inline-block shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              2x2 TARGET RISK MATRIX // PLATFORM SENSITIVITY VS. ACTIVITY
            </h3>
            <span className="px-2 py-0.5 border border-neutral-800 bg-black text-[10px] text-neutral-400">
              D3.js Vector Engine
            </span>
          </div>
          <p className="text-neutral-400 text-xs">
            Bivariate prioritization mapping across confirmed platforms to triage high-value confidential vaults and active exposure surfaces.
          </p>
        </div>

        {/* Search & Quadrant Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Target / Platform Search Bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2 pointer-events-none" />
            <input
              id="matrix-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search platform/cat..."
              className="pl-7 pr-6 py-1 bg-black border border-neutral-800 text-white text-[11px] placeholder:text-neutral-600 focus:outline-none focus:border-white w-40 sm:w-48 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                id="matrix-clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 text-[10px] text-neutral-500 hover:text-white px-1"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quadrant Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              id="matrix-filter-all-btn"
              onClick={() => setActiveQuadrantFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-mono border transition-all ${
                activeQuadrantFilter === 'all'
                  ? 'bg-white text-black font-bold border-white'
                  : 'bg-black text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-700'
              }`}
            >
              All ({counts.all})
            </button>

            <button
              type="button"
              id="matrix-filter-critical-btn"
              onClick={() => setActiveQuadrantFilter('critical')}
              className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
                activeQuadrantFilter === 'critical'
                  ? 'bg-neutral-500 text-black font-bold border-neutral-500'
                  : 'bg-black text-neutral-400 border-neutral-950 hover:border-neutral-800'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              Critical ({counts.critical})
            </button>

            <button
              type="button"
              id="matrix-filter-latent-btn"
              onClick={() => setActiveQuadrantFilter('latent')}
              className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
                activeQuadrantFilter === 'latent'
                  ? 'bg-neutral-500 text-black font-bold border-neutral-500'
                  : 'bg-black text-neutral-400 border-neutral-950 hover:border-neutral-800'
              }`}
            >
              <Lock className="w-3 h-3" />
              Latent ({counts.latent})
            </button>

            <button
              type="button"
              id="matrix-filter-surface-btn"
              onClick={() => setActiveQuadrantFilter('surface')}
              className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
                activeQuadrantFilter === 'surface'
                  ? 'bg-neutral-500 text-black font-bold border-neutral-500'
                  : 'bg-black text-neutral-400 border-neutral-950 hover:border-neutral-800'
              }`}
            >
              <Globe2 className="w-3 h-3" />
              Surface ({counts.surface})
            </button>

            <button
              type="button"
              id="matrix-filter-peripheral-btn"
              onClick={() => setActiveQuadrantFilter('peripheral')}
              className={`px-2.5 py-1 text-[11px] font-mono border flex items-center gap-1.5 transition-all ${
                activeQuadrantFilter === 'peripheral'
                  ? 'bg-neutral-300 text-black font-bold border-neutral-300'
                  : 'bg-black text-neutral-400 border-neutral-800 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              Peripheral ({counts.peripheral})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: D3 Matrix Canvas (left) + Target Inspector Card (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* D3 Vector Canvas Container (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          <div 
            ref={containerRef} 
            className="w-full bg-black border border-neutral-900 overflow-hidden relative"
          >
            {accounts.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8 space-y-2">
                <ShieldAlert className="w-8 h-8 text-neutral-600" />
                <span className="text-neutral-400 font-bold uppercase">No Confirmed Targets For Risk Plotting</span>
                <span className="text-[11px] text-neutral-500 max-w-sm">
                  Run a scan to corroborate verified platform identities. Discovered accounts will be automatically prioritized here.
                </span>
              </div>
            ) : visibleAccounts.length === 0 ? (
              <div className="h-96 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <Filter className="w-7 h-7 text-neutral-500" />
                <span className="text-neutral-300 font-bold uppercase">No Platforms Match Current Filter</span>
                <span className="text-[11px] text-neutral-500 max-w-sm">
                  No confirmed target profiles match quadrant &quot;{activeQuadrantFilter}&quot;{searchQuery ? ` and search &quot;${searchQuery}&quot;` : ''}.
                </span>
                <button
                  type="button"
                  id="matrix-reset-filters-btn"
                  onClick={() => {
                    setActiveQuadrantFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 bg-white text-black font-bold uppercase text-[10px] hover:bg-neutral-200 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <svg ref={svgRef} className="w-full block" />
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-[10px] text-neutral-500 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-neutral-500 inline-block" /> Critical Priority (Top Right)
              <span className="w-2 h-2 rounded-full bg-neutral-500 inline-block ml-2" /> Latent Vault (Top Left)
              <span className="w-2 h-2 rounded-full bg-neutral-500 inline-block ml-2" /> Broad Surface (Bottom Right)
              <span className="w-2 h-2 rounded-full bg-neutral-400 inline-block ml-2" /> Peripheral (Bottom Left)
            </span>
            <span>Click any node in the vector field to inspect target</span>
          </div>
        </div>

        {/* Selected Target Deep Inspector & Priority Brief (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="border border-neutral-800 bg-black p-4 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                  TARGET INSPECTOR & TRIAGE
                </span>
                {selectedAccount && (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 border ${
                    selectedAccount.quadrant === 'critical'
                      ? 'border-neutral-700 bg-neutral-950/40 text-neutral-300'
                      : selectedAccount.quadrant === 'latent'
                      ? 'border-neutral-700 bg-neutral-950/40 text-neutral-300'
                      : selectedAccount.quadrant === 'surface'
                      ? 'border-neutral-700 bg-neutral-950/40 text-neutral-300'
                      : 'border-neutral-800 bg-neutral-900 text-neutral-400'
                  }`}>
                    {selectedAccount.quadrant.toUpperCase()}
                  </span>
                )}
              </div>

              {selectedAccount ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <PlatformFavicon platformName={selectedAccount.platformName} url={selectedAccount.url} className="w-7 h-7" />
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">{selectedAccount.platformName}</h4>
                      <span className="text-[11px] text-neutral-400">Category: {selectedAccount.category}</span>
                    </div>
                  </div>

                  {/* Priority KPI Meters */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 border border-neutral-900 bg-neutral-950 space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase block">Platform Sensitivity</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-white">{selectedAccount.sensitivity}</span>
                        <span className="text-[10px] text-neutral-500">/ 100</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1 overflow-hidden">
                        <div 
                          className={`h-full ${selectedAccount.sensitivity >= 50 ? 'bg-neutral-500' : 'bg-neutral-600'}`} 
                          style={{ width: `${selectedAccount.sensitivity}%` }} 
                        />
                      </div>
                    </div>

                    <div className="p-2.5 border border-neutral-900 bg-neutral-950 space-y-1">
                      <span className="text-[10px] text-neutral-500 uppercase block">Activity Frequency</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-white">{selectedAccount.activity}</span>
                        <span className="text-[10px] text-neutral-500">/ 100</span>
                      </div>
                      <div className="w-full bg-neutral-900 h-1 overflow-hidden">
                        <div 
                          className={`h-full ${selectedAccount.activity >= 50 ? 'bg-neutral-500' : 'bg-neutral-600'}`} 
                          style={{ width: `${selectedAccount.activity}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Priority Composite Score */}
                  <div className="p-3 border border-neutral-800 bg-neutral-950 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Triage Priority Index:</span>
                      <strong className="text-white font-bold">{selectedAccount.priorityScore} / 100</strong>
                    </div>
                    <p className="text-[11px] text-neutral-300 leading-relaxed">
                      {selectedAccount.description}
                    </p>
                  </div>

                  {/* Endpoint URL display */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-500 uppercase">Target Endpoint:</span>
                    <div className="p-2 border border-neutral-900 bg-neutral-950 text-[11px] text-neutral-300 truncate select-all">
                      {selectedAccount.url}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-neutral-500 text-xs">
                  Select an account node to view forensic triage breakdown.
                </div>
              )}
            </div>

            {/* Action Bar */}
            {selectedAccount && (
              <div className="pt-3 border-t border-neutral-900 space-y-2">
                <div className="flex items-center gap-2">
                  <a
                    id="matrix-audit-live-url-link"
                    href={selectedAccount.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-white text-black font-bold text-center hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 uppercase text-[11px]"
                  >
                    <span>Audit Live URL</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    id="matrix-copy-target-url-btn"
                    onClick={() => handleCopyUrl(selectedAccount.url)}
                    className="py-2 px-3 border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 transition-colors flex items-center justify-center text-[11px]"
                    title="Copy URL to clipboard"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {onPivotScan && (
                  <button
                    type="button"
                    id="matrix-deep-pivot-scan-btn"
                    onClick={() => onPivotScan(selectedAccount.platformName)}
                    className="w-full py-1.5 border border-neutral-900 bg-black text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors text-[10px] uppercase flex items-center justify-center gap-1"
                  >
                    <span>Deep Pivot on Platform</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
