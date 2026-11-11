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
import type { GraphPivotInvestigation } from '../graph/types';
import { UNIFIED_DATABASES, CATEGORY_LABELS } from '../data/platforms';
import { WorldThreatMap } from './WorldThreatMap';
import { NetworkRelationshipGraph } from './NetworkRelationshipGraph';
import { AccountLinkageView } from './AccountLinkageView';
import { CategoryHeatMap } from './CategoryHeatMap';
import { RiskMatrix2x2 } from './RiskMatrix2x2';
import { BatchOverviewCard } from './BatchOverviewCard';
import { PlatformFavicon } from './PlatformFavicon';
import { useI18n } from '../utils/i18n';
import { RegistryOverview } from './RegistryOverview';
import { useToast } from './Toast';
import { CATEGORY_COLORS, 
  EXPOSURE_COLORS, PALETTE } from '../theme/palette';

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
  onPivotScan?: (newTarget: string) => Promise<GraphPivotInvestigation>;
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
  const { tr } = useI18n();
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

  // Parcela conclusiva: encontrado ou ausência explícita sobre o total já verificado. É uma contagem, não uma
  // taxa de falso positivo (o painel antigo mostrava um "índice" inventado entre 85% e 99,8%; defeito 24).
  const confidenceScore = useMemo(() => {
    if (scannedTotal === 0) return 0;
    const conclusive = results.filter((r) => r.status === 'found' || r.status === 'not_found').length;
    return Math.round((conclusive / scannedTotal) * 100);
  }, [results, scannedTotal]);

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
      <div className="card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-ink-2 uppercase tracking-widest">OSINT INVESTIGATION LEDGER:</span>
              <span className="text-lg font-bold text-ink tracking-wider">@{target}</span>
              <span className="text-[10px] uppercase px-2 py-0.5 border border-rule bg-paper text-ink rounded-sm font-semibold">
                {targetType}
              </span>
            </div>
            <p className="text-xs text-ink-2">
              Evidence-oriented synthesis across the local Mineiro Registry and optional analysis modules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="dashboard-export-btn"
              type="button"
              onClick={onOpenExport}
              disabled={scannedTotal === 0}
              className="px-3.5 py-2 bg-signal text-signal-ink font-mono font-bold text-xs uppercase hover:bg-ink/90 border border-signal tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 rounded-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Dossier
            </button>
            <button
              id="dashboard-ai-btn"
              type="button"
              onClick={onViewProfile}
              className="px-3 py-2 border border-rule bg-paper text-ink hover:text-ink hover:border-ink-3 text-xs uppercase flex items-center gap-1.5 transition-colors rounded-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-ink" />
              AI Profile
            </button>
          </div>
        </div>

        {/* Unified Database Sources Badge Strip */}
        <div className="space-y-2">
          <div className="text-[10px] text-ink-2 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-3 h-3 text-ink" />
            Mineiro Registry & Analysis Modules
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {UNIFIED_DATABASES.map((db) => (
              <div
                key={db.id}
                className="p-2.5 border border-rule bg-paper rounded-sm flex flex-col justify-between text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-ink font-bold">{db.name}</strong>
                  <span className="text-[9px] px-1 py-0.2 border border-rule bg-paper-2 text-ink-2 rounded-sm">
                    {db.count}
                  </span>
                </div>
                <div className="text-[10px] text-ink-2 mt-1 truncate" title={db.focus}>
                  {db.focus}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RegistryOverview />

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
        <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between label-mono">
            <span>Verified Hits</span>
            <ShieldCheck className="w-4 h-4 text-ink" />
          </div>
          <div>
            <div className="stat-num">{foundResults.length}</div>
            <div className="text-[11px] text-ink-2 mt-0.5">
              {scannedTotal > 0 ? `${((foundResults.length / scannedTotal) * 100).toFixed(1)}% detection rate` : 'Standby'}
            </div>
          </div>
          <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
            <span>STATUS: CONFIRMED</span>
            <span className="text-ink font-bold">200 OK</span>
          </div>
        </div>

        {/* Mineiro Guard model Uncertain (Cloudflare / WAF / TLS challenge) */}
        <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between label-mono">
            <span>Uncertain / Protected</span>
            <AlertTriangle className="w-4 h-4 text-ink-2" />
          </div>
          <div>
            <div className="stat-num">{uncertainResults.length}</div>
            <div className="text-[11px] text-ink-2 mt-0.5">
              Mineiro Guard Cloudflare/WAF challenge
            </div>
          </div>
          <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
            <span>{tr('dash.notNegative')}</span>
            <span className="text-ink-2">403/WAF</span>
          </div>
        </div>

        {/* Confidence Rating  */}
        <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between label-mono">
            <span>{tr('dash.conclusive')}</span>
            <Activity className="w-4 h-4 text-ink" />
          </div>
          <div>
            <div className="stat-num">{confidenceScore}%</div>
            <div className="text-[11px] text-ink-2 mt-0.5">
              {tr('dash.conclusiveDetail')}
            </div>
          </div>
          <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
            <span>AVG LATENCY</span>
            <span className="text-ink font-bold tabular-nums">{avgLatency} ms</span>
          </div>
        </div>

        {/* Public Attack Surface / Exposure Rating */}
        <div className="card card-accent p-4 sm:p-5 flex flex-col justify-between min-h-[148px] space-y-2">
          <div className="flex items-center justify-between label-mono">
            <span>Attack Surface</span>
            <Fingerprint className="w-4 h-4 text-ink" />
          </div>
          <div>
            <div className={`text-xl font-black inline-block px-2.5 py-0.5 border rounded-sm ${exposureLevel.color}`}>
              {exposureLevel.label}
            </div>
            <div className="text-[11px] text-ink-2 mt-1">
              Public footprint severity
            </div>
          </div>
          <div className="pt-2 border-t border-rule-2 flex justify-between items-center text-[10px] text-ink-2">
            <span>TOTAL PROBES</span>
            <span className="text-ink font-bold tabular-nums">{scannedTotal} sites</span>
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Analytical Visualizer */}
      <div className="card overflow-hidden space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule bg-paper-2 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-ink" />
            <span className="card-title">
              Analytical OSINT Visualization Engine
            </span>
          </div>

          <div className="flex items-center border border-rule bg-paper p-0.5 self-start flex-wrap gap-1 rounded-sm">
            <button
              id="viz-tab-network-btn"
              type="button"
              onClick={() => setActiveVizTab('network')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase transition-colors rounded-sm ${
                activeVizTab === 'network'
                  ? 'bg-signal text-signal-ink font-bold'
                  : 'text-ink-2 hover:text-ink'
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
                  ? 'bg-signal text-signal-ink font-bold'
                  : 'text-ink-2 hover:text-ink'
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
                  ? 'bg-signal text-signal-ink font-bold'
                  : 'text-ink-2 hover:text-ink'
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
                  ? 'bg-signal text-signal-ink font-bold'
                  : 'text-ink-2 hover:text-ink'
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
                  ? 'bg-signal text-signal-ink font-bold'
                  : 'text-ink-2 hover:text-ink'
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
              onPivotScan={onPivotScan || (async (newTarget) => ({ id: `noop-${Date.now()}`, sourceTarget: target, target: newTarget, foundCount: 0, uncertainCount: 0, totalScanned: 0, results: [], scannedAt: new Date().toISOString() }))}
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
            <div className="card p-5 space-y-3 font-mono rounded-md">
              <div className="flex items-center justify-between border-b border-rule-2 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-ink" />
                  <span className="card-title">
                    AI Intelligence Dossier Summary
                  </span>
                  <span className="text-[10px] chip">
                    {aiProfile.modelUsed || 'Gemini'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onViewProfile}
                  className="text-[11px] text-ink hover:underline flex items-center gap-1"
                >
                  Full Dossier <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-ink leading-relaxed">
                {aiProfile.summary}
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                <span className="chip">
                  Archetype: <strong className="text-ink">{aiProfile.archetype}</strong>
                </span>
                <span className="chip">
                  Exposure: <strong className="text-ink">{aiProfile.threatLevel}</strong>
                </span>
                <span className="chip">
                  Surface Score: <strong className="text-ink">{aiProfile.footprintScore} / 100</strong>
                </span>
              </div>
            </div>
          ) : results.some((r) => r.status === 'found') && !isScanning && onRequestAiProfile ? (
            <div className="card p-4 font-mono space-y-2.5 rounded-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 border border-rule bg-paper flex items-center justify-center shrink-0 rounded-sm">
                    <Sparkles className="w-4 h-4 text-ink" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                      Psychological & OpSec AI Dossier (On-Demand Mode)
                    </span>
                    <span className="text-[11px] text-ink-2">
                      Scan completed. Would you like to synthesize behavioral analysis and exposure risk now?
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRequestAiProfile}
                  disabled={isAiLoading}
                  className="px-3.5 py-1.5 bg-signal text-signal-ink font-bold border border-signal hover:bg-ink/90 text-xs font-mono flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50 uppercase rounded-sm"
                >
                  {isAiLoading ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 fill-paper" />
                      <span>Generate AI Dossier</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {/* Category Footprint Breakdown */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rule-2 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-ink" />
                <span className="card-title">
                  Presence by Category & Attack Vector
                </span>
              </div>
              <span className="text-[11px] text-ink-2 uppercase">
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
                        <span className="text-ink font-semibold flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full inline-block shrink-0" 
                            style={{ backgroundColor: CATEGORY_COLORS[catKey] || PALETTE.ink }} 
                          />
                          {info.label}
                        </span>
                        <div className="flex items-center gap-3 text-[11px]">
                          <span className="text-ink-2">{info.desc}</span>
                          <span className="text-ink font-bold font-mono tabular-nums">
                            {stat.found} / {stat.total}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-paper h-2 border border-rule rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{ 
                            width: `${stat.found > 0 ? Math.max(percent, 8) : 0}%`,
                            backgroundColor: stat.found > 0 ? PALETTE.ink : PALETTE.rule
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>


          {/* Reliability-weighted Digital Footprint Profile */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rule-2 pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-ink" />
                <span className="card-title">
                  Digital Footprint Profile
                </span>
              </div>
              <span className="text-[10px] text-ink-3 uppercase">
                reliability-weighted
              </span>
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              {tr('dash.footprintNote')}
            </p>
            {footprintProfile.length === 0 ? (
              <div className="border border-dashed border-rule p-4 text-[11px] text-ink-3">
                {tr('dash.noCluster')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {footprintProfile.slice(0, 3).map((item, index) => (
                  <div key={item.category} className="border border-rule bg-paper p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-ink-3 uppercase">#{index + 1} cluster</span>
                      <span className="text-xs text-ink font-bold tabular-nums">{item.score}%</span>
                    </div>
                    <div className="text-xs text-ink font-bold uppercase">
                      {CATEGORY_LABELS[item.category]?.label || item.category}
                    </div>
                    <div className="text-[10px] text-ink-2">
                      {tr('dash.clusterDetail', { found: item.found, detector: item.avgDetector })}
                    </div>
                    <div className="h-1.5 bg-card border border-rule overflow-hidden">
                      <div className="h-full bg-signal" style={{ width: `${Math.max(4, item.score)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Confirmed Discoveries Quick Feed */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-rule-2 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-ink" />
                <span className="card-title">
                  Confirmed Target Profiles ({foundResults.length})
                </span>
              </div>
              <button
                type="button"
                onClick={onViewTable}
                className="text-[11px] text-ink-2 hover:text-ink flex items-center gap-1 transition-colors"
              >
                Inspect in Audit Table <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {foundResults.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-rule bg-paper rounded-sm text-ink-2 text-xs min-h-[140px] flex items-center justify-center">
                {isScanning
                  ? 'Reconnaissance in progress. Probing targets across platforms...'
                  : 'No confirmed profiles located in this scan scope. Target may use handle variations.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                {foundResults.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-rule bg-paper rounded-sm flex items-center justify-between hover:border-ink-3 transition-colors"
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
                          <span className="text-ink font-bold text-xs truncate">{item.platformName}</span>
                          <span className="text-[9px] uppercase px-1 py-0.2 border border-rule text-ink-2 rounded-sm">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-ink-2 truncate">{item.url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.url)}
                        className="p-1.5 border border-rule bg-paper-2 text-ink-2 hover:text-ink hover:border-ink-3 rounded-sm transition-colors"
                        title="Copy profile link"
                      >
                        {copiedUrl === item.url ? (
                          <Check className="w-3 h-3 text-ink" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 border border-rule bg-paper-2 text-ink-2 hover:text-ink hover:border-ink-3 rounded-sm transition-colors"
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
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-rule-2 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-ink" />
                  <span className="card-title">
                    Email Infrastructure
                  </span>
                </div>
                <span className="text-[10px] text-ink-2 uppercase">DNS MX</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] text-ink-2 uppercase">Target Address</div>
                  <div className="text-ink font-bold break-all">{emailData.email}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 border border-rule bg-paper rounded-sm">
                    <div className="text-[9px] text-ink-2 uppercase">Domain Type</div>
                    <div className="text-ink font-semibold">
                      {emailData.isDisposable ? 'Disposable' : emailData.isCommonProvider ? 'Commercial' : 'Enterprise'}
                    </div>
                  </div>
                  <div className="p-2.5 border border-rule bg-paper rounded-sm">
                    <div className="text-[9px] text-ink-2 uppercase">MX Resolution</div>
                    <div className="text-ink font-semibold">
                      {emailData.mxRecordsFound ? 'Active Host' : 'No MX'}
                    </div>
                  </div>
                </div>

                {emailData.gravatarExists && (
                  <div className="p-2.5 border border-rule bg-paper rounded-sm flex items-center gap-2.5">
                    {emailData.gravatarAvatarUrl && (
                      <img
                        src={emailData.gravatarAvatarUrl}
                        alt="Gravatar"
                        className="w-8 h-8 border border-signal rounded-sm"
                      />
                    )}
                    <div>
                      <div className="text-ink font-bold text-[11px]">Gravatar Verified</div>
                      <div className="text-[10px] text-ink-2">Public profile image confirmed</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-5 space-y-3 rounded-md">
              <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase border-b border-rule pb-2">
                <Fingerprint className="w-4 h-4 text-ink" />
                PII & Identity Signature
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">
                Reconnaissance on handle <strong className="text-ink">@{target}</strong> indicates active digital footprint across multiple distinct service clusters.
              </p>
              <div className="space-y-2 pt-1 text-[11px]">
                <div className="flex justify-between border-b border-rule pb-1">
                  <span className="text-ink-2">Handle Cohesion:</span>
                  <span className="text-ink font-semibold">
                    {foundResults.length > 5 ? 'High (Moniker Reuse)' : 'Moderate'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-rule pb-1">
                  <span className="text-ink-2">Dominant Cluster:</span>
                  <span className="text-ink font-semibold">
                    {Object.entries(categoryStats).sort((a, b) => (b[1] as { total: number; found: number; weighted: number; detectorSum: number }).found - (a[1] as { total: number; found: number; weighted: number; detectorSum: number }).found)[0]?.[0] || 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">Mineiro Guard Anti-Bot Rate:</span>
                  <span className="text-ink-2 tabular-nums">
                    {scannedTotal > 0 ? `${((uncertainResults.length / scannedTotal) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mineiro Guard Uncertain / Protected Sites Box */}
          <div className="card p-5 space-y-3 rounded-md">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <div className="flex items-center gap-2 text-ink font-bold text-xs uppercase">
                <AlertTriangle className="w-3.5 h-3.5 text-ink-2" />
                Mineiro Guard Protection Watchlist
              </div>
              <span className="text-[10px] text-ink-2 font-bold tabular-nums">
                {uncertainResults.length} SITES
              </span>
            </div>
            <p className="text-[11px] text-ink-2 leading-relaxed">
              These platforms returned Cloudflare WAF challenges or strict anti-bot responses. As per the Mineiro Guard model, they are flagged as <em>Uncertain</em> rather than false negatives.
            </p>
            {uncertainResults.length > 0 ? (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {uncertainResults.map((u) => (
                  <div
                    key={u.id}
                    className="p-2 border border-rule bg-paper rounded-sm flex items-center justify-between text-[11px]"
                  >
                    <span className="text-ink font-semibold">{u.platformName}</span>
                    <span className="text-[10px] text-ink-2">
                      HTTP {u.statusCode || 403} WAF
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border border-rule bg-paper rounded-sm text-center text-ink-2 text-[11px]">
                No active Cloudflare/WAF blocks recorded in this scope.
              </div>
            )}
          </div>

          {/* Quick Nav Action Shortcuts */}
          <div className="p-4 card space-y-2">
            <div className="text-[11px] text-ink-2 uppercase tracking-widest">
              Reconnaissance Workspaces
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={onViewTable}
                className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
              >
                <div className="font-bold text-ink">Audit Table</div>
                <div className="text-[10px] text-ink-2">Dense ledger</div>
              </button>
              <button
                type="button"
                onClick={onViewGrid}
                className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
              >
                <div className="font-bold text-ink">Grid Matrix</div>
                <div className="text-[10px] text-ink-2">Visual cards</div>
              </button>
              <button
                type="button"
                onClick={onViewProfile}
                className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
              >
                <div className="font-bold text-ink">AI Dossier</div>
                <div className="text-[10px] text-ink-2">Threat profile</div>
              </button>
              <button
                type="button"
                onClick={onViewTerminal}
                className="btn !justify-start !rounded-[var(--radius-sm)] !p-2.5 text-left"
              >
                <div className="font-bold text-ink">Console CLI</div>
                <div className="text-[10px] text-ink-2">Live streams</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
