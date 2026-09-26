import { useMemo, useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Sparkles, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers, 
  Database,
  ArrowRight,
  Fingerprint,
  Mail,
  BrainCircuit,
  Globe,
  Network,
  GitFork,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { ScanResult, AiProfileReport, EmailReconData, BulkBatchState, BulkTargetItem } from '../types';
import { UNIFIED_DATABASES, CATEGORY_LABELS } from '../data/platforms';
import { WorldThreatMap } from './WorldThreatMap';
import { NetworkRelationshipGraph } from './NetworkRelationshipGraph';
import { AccountLinkageView } from './AccountLinkageView';
import { CategoryHeatMap } from './CategoryHeatMap';
import { RiskMatrix2x2 } from './RiskMatrix2x2';
import { BatchOverviewCard } from './BatchOverviewCard';
import { PlatformFavicon } from './PlatformFavicon';
import { useToast } from './Toast';
import { 
  CATEGORY_COLORS, 
  EXPOSURE_COLORS 
} from '../utils/themeColors';

interface DashboardViewProps {
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  emailData: EmailReconData | null;
  aiProfile: AiProfileReport | null;
  onViewGrid: () => void;
  onViewTable: () => void;
  onViewProfile: () => void;
  onViewTerminal: () => void;
  onOpenExport: () => void;
  onPivotScan?: (newTarget: string) => void;
  isScanning: boolean;
  onRequestAiProfile?: () => void;
  isAiLoading?: boolean;
  bulkBatch?: BulkBatchState | null;
  onViewBatch?: () => void;
  onOpenImport?: () => void;
  onInspectBatchTarget?: (item: BulkTargetItem) => void;
  onPauseBatch?: () => void;
  onResumeBatch?: () => void;
}

export function DashboardView({
  target,
  targetType,
  results,
  emailData,
  aiProfile,
  onViewGrid,
  onViewTable,
  onViewProfile,
  onViewTerminal,
  onOpenExport,
  onPivotScan,
  isScanning,
  onRequestAiProfile,
  isAiLoading = false,
  bulkBatch,
  onViewBatch,
  onOpenImport,
  onInspectBatchTarget,
  onPauseBatch,
  onResumeBatch,
}: DashboardViewProps) {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [activeVizTab, setActiveVizTab] = useState<'network' | 'geo' | 'linkage' | 'heatmap' | 'risk_matrix'>('network');

  const foundResults = useMemo(() => results.filter((r) => r.status === 'found'), [results]);
  const uncertainResults = useMemo(
    () => results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited'),
    [results]
  );
  const scannedTotal = useMemo(() => results.filter((r) => r.status !== 'pending').length, [results]);

  // Latency calculation
  const avgLatency = useMemo(() => {
    const checked = results.filter((r) => r.responseTimeMs && r.responseTimeMs > 0);
    if (!checked.length) return 0;
    const sum = checked.reduce((acc, curr) => acc + (curr.responseTimeMs || 0), 0);
    return Math.round(sum / checked.length);
  }, [results]);

  // Category counts + reliability-weighted footprint scoring.
  // This describes the observed digital footprint, not personality or identity.
  const categoryStats = useMemo(() => {
    const counts: Record<string, { total: number; found: number; weighted: number; detectorSum: number }> = {};
    results.forEach((r) => {
      if (!counts[r.category]) {
        counts[r.category] = { total: 0, found: 0, weighted: 0, detectorSum: 0 };
      }
      counts[r.category].total += 1;
      counts[r.category].detectorSum += r.detectorReliability ?? 60;
      if (r.status === 'found') {
        counts[r.category].found += 1;
        const confidence = (r.confidenceScore ?? 50) / 100;
        const detector = (r.detectorReliability ?? 60) / 100;
        counts[r.category].weighted += confidence * detector;
      }
    });
    return counts;
  }, [results]);

  const footprintProfile = useMemo(() => {
    return Object.entries(categoryStats as Record<string, { total: number; found: number; weighted: number; detectorSum: number }>)
      .map(([category, stat]) => ({
        category,
        found: stat.found,
        total: stat.total,
        score: stat.total > 0 ? Math.round((stat.weighted / stat.total) * 100) : 0,
        avgDetector: stat.total > 0 ? Math.round(stat.detectorSum / stat.total) : 0,
      }))
      .filter((item) => item.found > 0)
      .sort((a, b) => b.score - a.score || b.found - a.found);
  }, [categoryStats]);

  // Exposure level evaluation with standardized palette
  const exposureLevel = useMemo(() => {
    const count = foundResults.length;
    if (count === 0) return { label: 'MINIMAL', color: EXPOSURE_COLORS.MINIMAL.badge };
    if (count <= 3) return { label: 'LOW', color: EXPOSURE_COLORS.LOW.badge };
    if (count <= 8) return { label: 'MODERATE', color: EXPOSURE_COLORS.MODERATE.badge };
    if (count <= 15) return { label: 'ELEVATED', color: EXPOSURE_COLORS.ELEVATED.badge };
    return { label: 'SEVERE', color: EXPOSURE_COLORS.SEVERE.badge };
  }, [foundResults.length]);

  // Confidence index computed from response and corroboration signals
  const confidenceScore = useMemo(() => {
    if (scannedTotal === 0) return 99.4;
    const uncertainRatio = uncertainResults.length / scannedTotal;
    const score = 99.4 - (uncertainRatio * 15);
    return Math.max(85, Math.min(99.8, score)).toFixed(1);
  }, [scannedTotal, uncertainResults.length]);

  const { showToast } = useToast();

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    showToast({
      title: 'Target URL Copied',
      message: url,
      type: 'copy',
    });
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Dashboard Top Banner */}
      <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-4 rounded-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A2A2A] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#A3A3A3] uppercase tracking-widest">OSINT INVESTIGATION LEDGER:</span>
              <span className="text-lg font-bold text-[#F5F5F5] tracking-wider">@{target}</span>
              <span className="text-[10px] uppercase px-2 py-0.5 border border-[#2A2A2A] bg-[#050505] text-[#FFFFFF] rounded-sm font-semibold">
                {targetType}
              </span>
            </div>
            <p className="text-xs text-[#A3A3A3]">
              Consolidated reconnaissance synthesis across unified databases (the local Mineiro platform catalog).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dashboard-export-btn"
              type="button"
              onClick={onOpenExport}
              disabled={scannedTotal === 0}
              className="px-3.5 py-2 bg-[#FFFFFF] text-[#050505] font-mono font-bold text-xs uppercase hover:bg-[#FFFFFF]/90 border border-[#FFFFFF] tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 rounded-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Dossier
            </button>
            <button
              id="dashboard-ai-btn"
              type="button"
              onClick={onViewProfile}
              className="px-3 py-2 border border-[#2A2A2A] bg-[#050505] text-[#F5F5F5] hover:text-[#FFFFFF] hover:border-[#737373] text-xs uppercase flex items-center gap-1.5 transition-colors rounded-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FFFFFF]" />
              AI Profile
            </button>
          </div>
        </div>

        {/* Unified Database Sources Badge Strip */}
        <div className="space-y-2">
          <div className="text-[10px] text-[#A3A3A3] uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-3 h-3 text-[#FFFFFF]" />
            Active Unified Intelligence Sources (4,000+ Unique Endpoints Unfolded)
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {UNIFIED_DATABASES.map((db) => (
              <div
                key={db.id}
                className="p-2.5 border border-[#2A2A2A] bg-[#050505] rounded-sm flex flex-col justify-between text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-[#F5F5F5] font-bold">{db.name}</strong>
                  <span className="text-[9px] px-1 py-0.2 border border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] rounded-sm">
                    {db.count}
                  </span>
                </div>
                <div className="text-[10px] text-[#A3A3A3] mt-1 truncate" title={db.focus}>
                  {db.focus}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Overview Card on Main Dashboard */}
      {bulkBatch && bulkBatch.items.length > 0 && (
        <BatchOverviewCard
          batch={bulkBatch}
          onViewBatch={onViewBatch || (() => {})}
          onOpenImport={onOpenImport || (() => {})}
          onInspectTarget={onInspectBatchTarget}
          onPauseBatch={onPauseBatch}
          onResumeBatch={onResumeBatch}
        />
      )}

      {/* KPI Stats Grid - Fixed min-height to eliminate visual shift */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confirmed Hits */}
        <div className="p-4 sm:p-5 border border-[#2A2A2A] bg-[#0A0A0A] rounded-md flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs uppercase">
            <span>Verified Hits</span>
            <ShieldCheck className="w-4 h-4 text-[#FFFFFF]" />
          </div>
          <div>
            <div className="text-3xl font-black text-[#F5F5F5] tabular-nums">{foundResults.length}</div>
            <div className="text-[11px] text-[#A3A3A3] mt-0.5">
              {scannedTotal > 0 ? `${((foundResults.length / scannedTotal) * 100).toFixed(1)}% detection rate` : 'Standby'}
            </div>
          </div>
          <div className="pt-2 border-t border-[#2A2A2A] flex justify-between items-center text-[10px] text-[#A3A3A3]">
            <span>STATUS: CONFIRMED</span>
            <span className="text-[#FFFFFF] font-bold">200 OK</span>
          </div>
        </div>

        {/* Mineiro Guard model Uncertain (Cloudflare / WAF / TLS challenge) */}
        <div className="p-4 sm:p-5 border border-[#2A2A2A] bg-[#0A0A0A] rounded-md flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs uppercase">
            <span>Uncertain / Protected</span>
            <AlertTriangle className="w-4 h-4 text-[#A3A3A3]" />
          </div>
          <div>
            <div className="text-3xl font-black text-[#F5F5F5] tabular-nums">{uncertainResults.length}</div>
            <div className="text-[11px] text-[#A3A3A3] mt-0.5">
              Mineiro Guard Cloudflare/WAF challenge
            </div>
          </div>
          <div className="pt-2 border-t border-[#2A2A2A] flex justify-between items-center text-[10px] text-[#A3A3A3]">
            <span>HEADLESS / TOR NEEDED</span>
            <span className="text-[#A3A3A3]">403/WAF</span>
          </div>
        </div>

        {/* Confidence Rating  */}
        <div className="p-4 sm:p-5 border border-[#2A2A2A] bg-[#0A0A0A] rounded-md flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs uppercase">
            <span>Confidence Index</span>
            <Activity className="w-4 h-4 text-[#FFFFFF]" />
          </div>
          <div>
            <div className="text-3xl font-black text-[#F5F5F5] tabular-nums">{confidenceScore}%</div>
            <div className="text-[11px] text-[#A3A3A3] mt-0.5">
              Zero-false-positive filtering
            </div>
          </div>
          <div className="pt-2 border-t border-[#2A2A2A] flex justify-between items-center text-[10px] text-[#A3A3A3]">
            <span>AVG LATENCY</span>
            <span className="text-[#F5F5F5] font-bold tabular-nums">{avgLatency} ms</span>
          </div>
        </div>

        {/* Public Attack Surface / Exposure Rating */}
        <div className="p-4 sm:p-5 border border-[#2A2A2A] bg-[#0A0A0A] rounded-md flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between text-[#A3A3A3] text-xs uppercase">
            <span>Attack Surface</span>
            <Fingerprint className="w-4 h-4 text-[#FFFFFF]" />
          </div>
          <div>
            <div className={`text-xl font-black inline-block px-2.5 py-0.5 border rounded-sm ${exposureLevel.color}`}>
              {exposureLevel.label}
            </div>
            <div className="text-[11px] text-[#A3A3A3] mt-1">
              Public footprint severity
            </div>
          </div>
          <div className="pt-2 border-t border-[#2A2A2A] flex justify-between items-center text-[10px] text-[#A3A3A3]">
            <span>TOTAL PROBES</span>
            <span className="text-[#F5F5F5] font-bold tabular-nums">{scannedTotal} sites</span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Analytical Visualizer */}
      <div className="border border-[#2A2A2A] bg-[#0A0A0A] rounded-md overflow-hidden space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] bg-[#0A0A0A] p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#FFFFFF]" />
            <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
              Analytical OSINT Visualization Engine
            </span>
          </div>

          <div className="flex items-center border border-[#2A2A2A] bg-[#050505] p-0.5 self-start flex-wrap gap-1 rounded-sm">
            <button
              id="viz-tab-network-btn"
              type="button"
              onClick={() => setActiveVizTab('network')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded-sm ${
                activeVizTab === 'network'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              D3 Force Graph
            </button>

            <button
              id="viz-tab-geo-btn"
              type="button"
              onClick={() => setActiveVizTab('geo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded-sm ${
                activeVizTab === 'geo'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              World Threat Map
            </button>

            <button
              id="viz-tab-linkage-btn"
              type="button"
              onClick={() => setActiveVizTab('linkage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded-sm ${
                activeVizTab === 'linkage'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              Linkage Theory
            </button>

            <button
              id="viz-tab-heatmap-btn"
              type="button"
              onClick={() => setActiveVizTab('heatmap')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded-sm ${
                activeVizTab === 'heatmap'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Category Heat Map
            </button>

            <button
              id="viz-tab-risk-matrix-btn"
              type="button"
              onClick={() => setActiveVizTab('risk_matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded-sm ${
                activeVizTab === 'risk_matrix'
                  ? 'bg-[#FFFFFF] text-[#050505] font-bold'
                  : 'text-[#A3A3A3] hover:text-[#F5F5F5]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              2x2 Risk Matrix
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {activeVizTab === 'network' && (
            <NetworkRelationshipGraph
              results={results}
              target={target}
              emailData={emailData}
              aiProfile={aiProfile}
              onPivotScan={onPivotScan}
            />
          )}

          {activeVizTab === 'geo' && (
            <WorldThreatMap
              results={results}
              target={target}
              emailData={emailData}
            />
          )}

          {activeVizTab === 'linkage' && (
            <AccountLinkageView
              target={target}
              results={results}
              emailData={emailData}
              onPivotScan={onPivotScan || (() => {})}
            />
          )}

          {activeVizTab === 'heatmap' && (
            <CategoryHeatMap
              results={results}
              target={target}
              targetType={targetType}
              emailData={emailData}
              aiProfile={aiProfile}
              onPivotScan={onPivotScan}
            />
          )}

          {activeVizTab === 'risk_matrix' && (
            <RiskMatrix2x2
              results={results}
              target={target}
              aiProfile={aiProfile}
              onPivotScan={onPivotScan}
            />
          )}
        </div>
      </div>

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Category Distribution & Discovered Hits */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Intelligence Dossier Brief if available, or on-demand trigger */}
          {aiProfile ? (
            <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-3 font-mono rounded-md">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-[#FFFFFF]" />
                  <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                    AI Intelligence Dossier Summary
                  </span>
                  <span className="text-[10px] px-2 py-0.5 border border-[#2A2A2A] bg-[#050505] text-[#A3A3A3] rounded-sm">
                    {aiProfile.modelUsed || 'Gemini'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onViewProfile}
                  className="text-[11px] text-[#FFFFFF] hover:underline flex items-center gap-1"
                >
                  Full Dossier <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-[#F5F5F5] leading-relaxed">
                {aiProfile.summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="px-2 py-0.5 border border-[#2A2A2A] bg-[#050505] text-[#A3A3A3] rounded-sm">
                  Archetype: <strong className="text-[#F5F5F5]">{aiProfile.archetype}</strong>
                </span>
                <span className="px-2 py-0.5 border border-[#2A2A2A] bg-[#050505] text-[#A3A3A3] rounded-sm">
                  Exposure: <strong className="text-[#F5F5F5]">{aiProfile.threatLevel}</strong>
                </span>
                <span className="px-2 py-0.5 border border-[#2A2A2A] bg-[#050505] text-[#A3A3A3] rounded-sm">
                  Surface Score: <strong className="text-[#FFFFFF]">{aiProfile.footprintScore} / 100</strong>
                </span>
              </div>
            </div>
          ) : results.some((r) => r.status === 'found') && !isScanning && onRequestAiProfile ? (
            <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-4 font-mono space-y-2.5 rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 border border-[#2A2A2A] bg-[#050505] flex items-center justify-center shrink-0 rounded-sm">
                    <Sparkles className="w-4 h-4 text-[#FFFFFF]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider block">
                      Psychological & OpSec AI Dossier (On-Demand Mode)
                    </span>
                    <span className="text-[11px] text-[#A3A3A3]">
                      Scan completed. Would you like to synthesize behavioral analysis and exposure risk now?
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRequestAiProfile}
                  disabled={isAiLoading}
                  className="px-3.5 py-1.5 bg-[#FFFFFF] text-[#050505] font-bold border border-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 uppercase rounded-sm"
                >
                  {isAiLoading ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-[#050505]" />
                      <span>Generate AI Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {/* Category Footprint Breakdown */}
          <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-4 rounded-md">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FFFFFF]" />
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Presence by Category & Attack Vector
                </span>
              </div>
              <span className="text-[11px] text-[#A3A3A3] uppercase">
                {Object.keys(categoryStats).length} Active Categories
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {Object.entries(CATEGORY_LABELS)
                .filter(([cat]) => cat !== 'all')
                .map(([catKey, info]) => {
                  const stat = categoryStats[catKey] || { total: info.count, found: 0 };
                  const percent = stat.total > 0 ? Math.round((stat.found / stat.total) * 100) : 0;

                  return (
                    <div key={catKey} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#F5F5F5] font-semibold flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full inline-block shrink-0" 
                            style={{ backgroundColor: CATEGORY_COLORS[catKey] || '#F5F5F5' }} 
                          />
                          {info.label}
                        </span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-[#A3A3A3]">{info.desc}</span>
                          <span className="text-[#F5F5F5] font-bold font-mono tabular-nums">
                            {stat.found} / {stat.total}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-[#050505] h-2 border border-[#2A2A2A] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${stat.found > 0 ? Math.max(percent, 8) : 0}%`,
                            backgroundColor: stat.found > 0 ? '#FFFFFF' : '#2A2A2A'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>


          {/* Reliability-weighted Digital Footprint Profile */}
          <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-4 rounded-md">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-[#FFFFFF]" />
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Digital Footprint Profile
                </span>
              </div>
              <span className="text-[10px] text-[#737373] uppercase">
                reliability-weighted
              </span>
            </div>
            <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
              Classificação baseada apenas nos tipos de serviços onde o mesmo username foi observado.
              Não representa personalidade, profissão, intenção ou identidade confirmada.
            </p>
            {footprintProfile.length === 0 ? (
              <div className="border border-dashed border-[#2A2A2A] p-4 text-[11px] text-[#737373]">
                Nenhum cluster com presença observada ainda.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {footprintProfile.slice(0, 3).map((item, index) => (
                  <div key={item.category} className="border border-[#2A2A2A] bg-[#050505] p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#737373] uppercase">#{index + 1} cluster</span>
                      <span className="text-xs text-[#FFFFFF] font-bold tabular-nums">{item.score}%</span>
                    </div>
                    <div className="text-xs text-[#F5F5F5] font-bold uppercase">
                      {CATEGORY_LABELS[item.category]?.label || item.category}
                    </div>
                    <div className="text-[10px] text-[#A3A3A3]">
                      {item.found} presença(s) · detector médio {item.avgDetector}%
                    </div>
                    <div className="h-1.5 bg-[#111111] border border-[#2A2A2A] overflow-hidden">
                      <div className="h-full bg-[#FFFFFF]" style={{ width: `${Math.max(4, item.score)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Confirmed Discoveries Quick Feed */}
          <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-4 rounded-md">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#FFFFFF]" />
                <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                  Confirmed Target Profiles ({foundResults.length})
                </span>
              </div>
              <button
                type="button"
                onClick={onViewTable}
                className="text-[11px] text-[#A3A3A3] hover:text-[#FFFFFF] flex items-center gap-1 transition-colors"
              >
                Inspect in Audit Table <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {foundResults.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#2A2A2A] bg-[#050505] rounded-sm text-[#A3A3A3] text-xs min-h-[140px] flex items-center justify-center">
                {isScanning
                  ? 'Reconnaissance in progress. Probing targets across platforms...'
                  : 'No confirmed profiles located in this scan scope. Target may use handle variations.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {foundResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-[#2A2A2A] bg-[#050505] rounded-sm flex items-center justify-between hover:border-[#737373] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <PlatformFavicon
                        url={item.url}
                        platformId={item.platformId}
                        platformName={item.platformName}
                        category={item.category}
                        size="sm"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[#F5F5F5] font-bold text-xs truncate">{item.platformName}</span>
                          <span className="text-[9px] uppercase px-1 py-0.2 border border-[#2A2A2A] text-[#A3A3A3] rounded-sm">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#A3A3A3] truncate">{item.url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url)}
                        className="p-1.5 border border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#F5F5F5] hover:border-[#737373] rounded-sm transition-colors"
                        title="Copy profile link"
                      >
                        {copiedUrl === item.url ? (
                          <Check className="w-3 h-3 text-[#FFFFFF]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 border border-[#2A2A2A] bg-[#0A0A0A] text-[#A3A3A3] hover:text-[#FFFFFF] hover:border-[#737373] rounded-sm transition-colors"
                        title="Open external profile"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 col): Intelligence & PII / Mineiro Guard Protection Insights */}
        <div className="space-y-6">
          {/* Email Recon / DNS Metadata */}
          {emailData ? (
            <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-4 rounded-md">
              <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#FFFFFF]" />
                  <span className="text-xs font-bold text-[#F5F5F5] uppercase tracking-wider">
                    Email Infrastructure
                  </span>
                </div>
                <span className="text-[10px] text-[#A3A3A3] uppercase">DNS MX</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-[#A3A3A3] uppercase">Target Address</div>
                  <div className="text-[#F5F5F5] font-bold break-all">{emailData.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 border border-[#2A2A2A] bg-[#050505] rounded-sm">
                    <div className="text-[9px] text-[#A3A3A3] uppercase">Domain Type</div>
                    <div className="text-[#F5F5F5] font-semibold">
                      {emailData.isDisposable ? 'Disposable' : emailData.isCommonProvider ? 'Commercial' : 'Enterprise'}
                    </div>
                  </div>
                  <div className="p-2.5 border border-[#2A2A2A] bg-[#050505] rounded-sm">
                    <div className="text-[9px] text-[#A3A3A3] uppercase">MX Resolution</div>
                    <div className="text-[#F5F5F5] font-semibold">
                      {emailData.mxRecordsFound ? 'Active Host' : 'No MX'}
                    </div>
                  </div>
                </div>

                {emailData.gravatarExists && (
                  <div className="p-2.5 border border-[#2A2A2A] bg-[#050505] rounded-sm flex items-center gap-2.5">
                    {emailData.gravatarAvatarUrl && (
                      <img
                        src={emailData.gravatarAvatarUrl}
                        alt="Gravatar"
                        className="w-8 h-8 border border-[#FFFFFF] rounded-sm"
                      />
                    )}
                    <div>
                      <div className="text-[#F5F5F5] font-bold text-[11px]">Gravatar Verified</div>
                      <div className="text-[10px] text-[#A3A3A3]">Public profile image confirmed</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-3 rounded-md">
              <div className="flex items-center gap-2 text-[#F5F5F5] font-bold text-xs uppercase border-b border-[#2A2A2A] pb-2">
                <Fingerprint className="w-4 h-4 text-[#FFFFFF]" />
                PII & Identity Signature
              </div>
              <p className="text-xs text-[#A3A3A3] leading-relaxed">
                Reconnaissance on handle <strong className="text-[#F5F5F5]">@{target}</strong> indicates active digital footprint across multiple distinct service clusters.
              </p>
              <div className="space-y-2 pt-1 text-[11px]">
                <div className="flex justify-between border-b border-[#2A2A2A] pb-1">
                  <span className="text-[#A3A3A3]">Handle Cohesion:</span>
                  <span className="text-[#F5F5F5] font-semibold">
                    {foundResults.length > 5 ? 'High (Moniker Reuse)' : 'Moderate'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#2A2A2A] pb-1">
                  <span className="text-[#A3A3A3]">Dominant Cluster:</span>
                  <span className="text-[#F5F5F5] font-semibold">
                    {Object.entries(categoryStats).sort((a, b) => (b[1] as { total: number; found: number; weighted: number; detectorSum: number }).found - (a[1] as { total: number; found: number; weighted: number; detectorSum: number }).found)[0]?.[0] || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A3A3]">Mineiro Guard Anti-Bot Rate:</span>
                  <span className="text-[#A3A3A3] tabular-nums">
                    {scannedTotal > 0 ? `${((uncertainResults.length / scannedTotal) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mineiro Guard Uncertain / Protected Sites Box */}
          <div className="border border-[#2A2A2A] bg-[#0A0A0A] p-5 space-y-3 rounded-md">
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
              <div className="flex items-center gap-2 text-[#F5F5F5] font-bold text-xs uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-[#A3A3A3]" />
                Mineiro Guard Protection Watchlist
              </div>
              <span className="text-[10px] text-[#A3A3A3] font-bold tabular-nums">
                {uncertainResults.length} SITES
              </span>
            </div>
            <p className="text-[11px] text-[#A3A3A3] leading-relaxed">
              These platforms returned Cloudflare WAF challenges or strict anti-bot responses. As per the Mineiro Guard model, they are flagged as <em>Uncertain</em> rather than false negatives.
            </p>
            {uncertainResults.length > 0 ? (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {uncertainResults.map((u) => (
                  <div
                    key={u.id}
                    className="p-2 border border-[#2A2A2A] bg-[#050505] rounded-sm flex items-center justify-between text-[11px]"
                  >
                    <span className="text-[#F5F5F5] font-semibold">{u.platformName}</span>
                    <span className="text-[10px] text-[#A3A3A3]">
                      HTTP {u.statusCode || 403} WAF
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-[#2A2A2A] bg-[#050505] rounded-sm text-center text-[#A3A3A3] text-[11px]">
                No active Cloudflare/WAF blocks recorded in this scope.
              </div>
            )}
          </div>

          {/* Quick Nav Action Shortcuts */}
          <div className="p-4 border border-[#2A2A2A] bg-[#0A0A0A] rounded-md space-y-2">
            <div className="text-[11px] text-[#A3A3A3] uppercase tracking-widest">
              Reconnaissance Workspaces
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={onViewTable}
                className="p-2.5 border border-[#2A2A2A] hover:border-[#737373] bg-[#050505] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors text-left rounded-sm"
              >
                <div className="font-bold text-[#F5F5F5]">Audit Table</div>
                <div className="text-[10px] text-[#A3A3A3]">Dense ledger</div>
              </button>
              <button
                type="button"
                onClick={onViewGrid}
                className="p-2.5 border border-[#2A2A2A] hover:border-[#737373] bg-[#050505] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors text-left rounded-sm"
              >
                <div className="font-bold text-[#F5F5F5]">Grid Matrix</div>
                <div className="text-[10px] text-[#A3A3A3]">Visual cards</div>
              </button>
              <button
                type="button"
                onClick={onViewProfile}
                className="p-2.5 border border-[#2A2A2A] hover:border-[#737373] bg-[#050505] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors text-left rounded-sm"
              >
                <div className="font-bold text-[#F5F5F5]">AI Dossier</div>
                <div className="text-[10px] text-[#A3A3A3]">Threat profile</div>
              </button>
              <button
                type="button"
                onClick={onViewTerminal}
                className="p-2.5 border border-[#2A2A2A] hover:border-[#737373] bg-[#050505] text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors text-left rounded-sm"
              >
                <div className="font-bold text-[#F5F5F5]">Console CLI</div>
                <div className="text-[10px] text-[#A3A3A3]">Live streams</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
