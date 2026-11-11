import { useMemo, useState } from 'react';
import { ScanResult, AiProfileReport, EmailReconData, BulkBatchState, BulkTargetItem } from '../../types';
import type { GraphPivotInvestigation } from '../../graph/types';
import { BatchOverviewCard } from '../BatchOverviewCard';
import { RegistryOverview } from '../RegistryOverview';
import { useToast } from '../Toast';
import {
  averageLatency,
  computeCategoryStats,
  computeFootprintProfile,
  conclusiveShare,
  exposureLevel as exposureLevelFor,
} from './dashboard.logic';
import { DashboardBanner } from './DashboardBanner';
import { KpiGrid } from './KpiGrid';
import { VisualizationPanel } from './VisualizationPanel';
import { DashboardMainColumn } from './DashboardMainColumn';
import { DashboardSideColumn } from './DashboardSideColumn';

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
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const foundResults = useMemo(() => results.filter((r) => r.status === 'found'), [results]);
  const uncertainResults = useMemo(
    () => results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited'),
    [results]
  );
  const scannedTotal = useMemo(() => results.filter((r) => r.status !== 'pending').length, [results]);

  // Latency calculation
  const avgLatency = useMemo(() => averageLatency(results), [results]);

  // Category counts + reliability-weighted footprint scoring.
  // This describes the observed digital footprint, not personality or identity.
  const categoryStats = useMemo(() => computeCategoryStats(results), [results]);

  const footprintProfile = useMemo(() => computeFootprintProfile(categoryStats), [categoryStats]);

  // Exposure level evaluation with standardized palette
  const exposureLevel = useMemo(() => exposureLevelFor(foundResults.length), [foundResults.length]);

  // Conclusive share (dashboard.logic.ts, defect 24 of the baseline).
  const confidenceScore = useMemo(() => conclusiveShare(results, scannedTotal), [results, scannedTotal]);

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
      <DashboardBanner
        target={target}
        targetType={targetType}
        scannedTotal={scannedTotal}
        onOpenExport={onOpenExport}
        onViewProfile={onViewProfile}
      />

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
      <KpiGrid
        foundCount={foundResults.length}
        uncertainCount={uncertainResults.length}
        scannedTotal={scannedTotal}
        confidenceScore={confidenceScore}
        avgLatency={avgLatency}
        exposureLevel={exposureLevel}
      />

      {/* Multi-Dimensional Analytical Visualizer */}
      <VisualizationPanel
        target={target}
        targetType={targetType}
        results={results}
        emailData={emailData}
        aiProfile={aiProfile}
        onPivotScan={onPivotScan}
      />

      {/* Main Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Category Distribution & Discovered Hits */}
        <DashboardMainColumn
          results={results}
          foundResults={foundResults}
          aiProfile={aiProfile}
          isScanning={isScanning}
          isAiLoading={isAiLoading}
          onRequestAiProfile={onRequestAiProfile}
          onViewProfile={onViewProfile}
          onViewTable={onViewTable}
          categoryStats={categoryStats}
          footprintProfile={footprintProfile}
          copiedUrl={copiedUrl}
          copyToClipboard={copyToClipboard}
        />

        {/* Right Column (1 col): Intelligence & PII / Mineiro Guard Protection Insights */}
        <DashboardSideColumn
          target={target}
          emailData={emailData}
          foundResults={foundResults}
          uncertainResults={uncertainResults}
          scannedTotal={scannedTotal}
          categoryStats={categoryStats}
          onViewTable={onViewTable}
          onViewGrid={onViewGrid}
          onViewProfile={onViewProfile}
          onViewTerminal={onViewTerminal}
        />
      </div>
    </div>
  );
}
