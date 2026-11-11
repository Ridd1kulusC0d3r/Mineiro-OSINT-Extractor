import React, { useMemo } from 'react';
import { 
  FileSpreadsheet, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Activity, 
  ArrowRight, 
  Layers, 
  AlertTriangle, 
  Upload, 
  Play, 
  Pause, 
  ExternalLink,
  Users,
  Target
} from 'lucide-react';
import { BulkBatchState, BulkTargetItem } from '../types';

interface BatchOverviewCardProps {
  batch: BulkBatchState | null;
  onViewBatch: () => void;
  onOpenImport: () => void;
  onInspectTarget?: (item: BulkTargetItem) => void;
  onPauseBatch?: () => void;
  onResumeBatch?: () => void;
  onLoadDemoBatch?: () => void;
}

export function BatchOverviewCard({
  batch,
  onViewBatch,
  onOpenImport,
  onInspectTarget,
  onPauseBatch,
  onResumeBatch,
  onLoadDemoBatch,
}: BatchOverviewCardProps) {
  // Aggregate Metrics Calculations
  const stats = useMemo(() => {
    if (!batch || batch.items.length === 0) {
      return null;
    }

    const totalTargets = batch.items.length;
    const completedItems = batch.items.filter((i) => i.status === 'completed');
    const scanningItem = batch.items.find((i) => i.status === 'scanning');
    const queuedItems = batch.items.filter((i) => i.status === 'queued');
    const failedOrSkipped = batch.items.filter((i) => i.status === 'failed' || i.status === 'skipped');

    const totalHits = batch.items.reduce((acc, i) => acc + (i.foundCount || 0), 0);
    const totalScannedPlatforms = batch.items.reduce((acc, i) => acc + (i.totalScanned || 0), 0);

    // Target Success Rate: targets with at least 1 verified found profile
    const targetsWithHits = completedItems.filter((i) => (i.foundCount || 0) > 0).length;
    const targetSuccessRate = completedItems.length > 0
      ? Math.round((targetsWithHits / completedItems.length) * 100)
      : 0;

    // Platform Resolution Hit Rate
    const platformHitRate = totalScannedPlatforms > 0
      ? ((totalHits / totalScannedPlatforms) * 100).toFixed(1)
      : '0.0';

    // Average threat level calculation
    // Threat numeric mapping: Low=25, Moderate=50, Elevated=75, Critical=95
    let totalThreatScore = 0;
    let threatCount = 0;
    const threatDist = { Low: 0, Moderate: 0, Elevated: 0, Critical: 0 };

    completedItems.forEach((item) => {
      let score = 30; // baseline
      let level: 'Low' | 'Moderate' | 'Elevated' | 'Critical' = 'Low';

      if (item.aiProfile) {
        level = item.aiProfile.threatLevel;
        if (level === 'Critical') score = 95;
        else if (level === 'Elevated') score = 75;
        else if (level === 'Moderate') score = 50;
        else score = 25;
      } else {
        // Inferred from hits found
        if (item.foundCount >= 15) {
          level = 'Critical';
          score = 90;
        } else if (item.foundCount >= 8) {
          level = 'Elevated';
          score = 70;
        } else if (item.foundCount >= 3) {
          level = 'Moderate';
          score = 45;
        } else {
          level = 'Low';
          score = 20;
        }
      }

      threatDist[level] = (threatDist[level] || 0) + 1;
      totalThreatScore += score;
      threatCount++;
    });

    const avgThreatScore = threatCount > 0 ? Math.round(totalThreatScore / threatCount) : 0;
    let avgThreatVerdict: 'Low' | 'Moderate' | 'Elevated' | 'Critical' = 'Low';
    let avgThreatColor = 'text-ink-3 border-rule bg-paper-2/40';

    if (avgThreatScore >= 80) {
      avgThreatVerdict = 'Critical';
      avgThreatColor = 'text-ink-3 border-rule bg-paper-2/40';
    } else if (avgThreatScore >= 60) {
      avgThreatVerdict = 'Elevated';
      avgThreatColor = 'text-ink-3 border-rule bg-paper-2/40';
    } else if (avgThreatScore >= 40) {
      avgThreatVerdict = 'Moderate';
      avgThreatColor = 'text-ink-3 border-rule bg-paper-2/40';
    }

    const percentComplete = Math.round((completedItems.length / totalTargets) * 100);

    return {
      totalTargets,
      completedItems,
      scanningItem,
      queuedItems,
      failedOrSkipped,
      totalHits,
      totalScannedPlatforms,
      targetSuccessRate,
      targetsWithHits,
      platformHitRate,
      avgThreatScore,
      avgThreatVerdict,
      avgThreatColor,
      threatDist,
      percentComplete,
    };
  }, [batch]);

  // If no active or completed batch exists, display a sleek standby card
  if (!batch || !stats || batch.items.length === 0) {
    return (
      <div className="border border-rule bg-paper-2 p-5 font-mono text-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-ink-3" />
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              BATCH RECONNAISSANCE // MULTI-TARGET OPERATIONS
            </h3>
            <span className="text-[10px] px-2 py-0.5 border border-rule bg-paper text-ink-3">
              STANDBY
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onLoadDemoBatch && (
              <button
                type="button"
                id="load-demo-batch-btn"
                onClick={onLoadDemoBatch}
                className="px-2.5 py-1 text-[11px] border border-rule bg-paper text-ink-2 hover:text-ink hover:border-ink-3 transition-colors"
              >
                Load Sample Batch
              </button>
            )}
            <button
              type="button"
              id="import-batch-hero-btn"
              onClick={onOpenImport}
              className="px-3 py-1 bg-signal text-signal-ink font-bold hover:bg-ink transition-colors flex items-center gap-1.5 uppercase text-[11px]"
            >
              <Upload className="w-3 h-3" />
              Import Targets CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-ink-3">
          <div className="p-3 border border-rule bg-paper space-y-1">
            <span className="text-[10px] uppercase text-ink-3 block">Aggregate Hit Analysis</span>
            <p className="text-[11px] text-ink-2">
              Correlate multiple monikers and email handles in automated sequence with shared exposure metrics.
            </p>
          </div>
          <div className="p-3 border border-rule bg-paper space-y-1">
            <span className="text-[10px] uppercase text-ink-3 block">Cross-Target Threat Scoring</span>
            <p className="text-[11px] text-ink-2">
              Calculate collective threat levels and surface concentrations across organizations or teams.
            </p>
          </div>
          <div className="p-3 border border-rule bg-paper space-y-1">
            <span className="text-[10px] uppercase text-ink-3 block">Unified Case Export</span>
            <p className="text-[11px] text-ink-2">
              Generate unified multi-subject forensic spreadsheets and JSON investigation dossiers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-rule bg-paper-2 p-5 font-mono text-xs space-y-5">
      {/* Batch Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-ink-3 inline-block shadow-[0_0_8px_color-mix(in_srgb,var(--ink-3)_80%,transparent)]" />
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              BATCH OVERVIEW // {batch.name.toUpperCase()}
            </h3>
            <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${
              batch.isActive && !batch.isPaused
                ? 'border-rule bg-paper-2/60 text-ink-2 animate-pulse'
                : batch.isActive && batch.isPaused
                ? 'border-rule bg-paper-2/60 text-ink-2'
                : 'border-rule bg-rule-2 text-ink-2'
            }`}>
              {batch.isActive ? (batch.isPaused ? 'PAUSED' : 'SCANNING') : 'BATCH COMPLETED'}
            </span>
          </div>
          <p className="text-ink-3 text-xs">
            Multi-target operational telemetry, cross-subject corroboration rates, and collective threat indexing.
          </p>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center gap-2">
          {batch.isActive && (
            <>
              {batch.isPaused ? (
                <button
                  type="button"
                  onClick={onResumeBatch}
                  className="px-2.5 py-1.5 border border-signal bg-signal text-signal-ink font-bold flex items-center gap-1 uppercase hover:bg-ink transition-colors text-[11px]"
                >
                  <Play className="w-3 h-3 fill-paper" />
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPauseBatch}
                  className="px-2.5 py-1.5 border border-rule bg-rule-2 text-ink-2 flex items-center gap-1 uppercase hover:text-ink transition-colors text-[11px]"
                >
                  <Pause className="w-3 h-3" />
                  Pause
                </button>
              )}
            </>
          )}

          <button
            type="button"
            id="view-batch-queue-btn"
            onClick={onViewBatch}
            className="px-3 py-1.5 bg-signal text-signal-ink font-bold hover:bg-ink transition-colors flex items-center gap-1.5 uppercase text-[11px]"
          >
            <span>Full Batch Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Aggregate KPI Grid: 4 Core Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Target Resolution Success Rate */}
        <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-ink-3 text-[11px] uppercase">
            <span>Target Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-ink-3" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-ink">
              {stats.targetSuccessRate}%
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5">
              {stats.targetsWithHits} of {stats.completedItems.length} targets resolved with verified hits
            </div>
          </div>
          <div className="pt-2 border-t border-rule text-[10px] text-ink-3 flex justify-between">
            <span>TOTAL TARGETS: {stats.totalTargets}</span>
            <span className="text-ink font-bold">{stats.percentComplete}% COMPLETE</span>
          </div>
        </div>

        {/* 2. Average Threat Level */}
        <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-ink-3 text-[11px] uppercase">
            <span>Average Threat Level</span>
            <ShieldAlert className="w-4 h-4 text-ink-3" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-ink">
                {stats.avgThreatScore}
              </span>
              <span className="text-xs text-ink-3">/ 100</span>
              <span className={`text-[10px] px-2 py-0.5 border font-bold uppercase ${stats.avgThreatColor}`}>
                {stats.avgThreatVerdict}
              </span>
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5">
              Derived from AI behavioral heuristics & sensitive hits
            </div>
          </div>
          <div className="pt-2 border-t border-rule text-[10px] text-ink-3 flex justify-between">
            <span>HIGH/CRIT TARGETS</span>
            <span className="text-ink-3 font-bold">{stats.threatDist.Critical + stats.threatDist.Elevated}</span>
          </div>
        </div>

        {/* 3. Corroborated Footprints (Hits) */}
        <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-ink-3 text-[11px] uppercase">
            <span>Aggregated Footprints</span>
            <Activity className="w-4 h-4 text-ink" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-ink">
              {stats.totalHits}
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5">
              Verified active accounts across {stats.totalScannedPlatforms} platform checks
            </div>
          </div>
          <div className="pt-2 border-t border-rule text-[10px] text-ink-3 flex justify-between">
            <span>HIT DENSITY</span>
            <span className="text-ink font-bold">
              {stats.completedItems.length > 0 ? (stats.totalHits / stats.completedItems.length).toFixed(1) : '0'} hits/target
            </span>
          </div>
        </div>

        {/* 4. Queue Progress & Status */}
        <div className="p-3.5 border border-rule bg-paper flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between text-ink-3 text-[11px] uppercase">
            <span>Queue Status</span>
            <Layers className="w-4 h-4 text-ink-3" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-ink">
              {stats.completedItems.length} <span className="text-ink-3 text-lg">/ {stats.totalTargets}</span>
            </div>
            <div className="text-[11px] text-ink-3 mt-0.5">
              {stats.scanningItem ? `Active: @${stats.scanningItem.target}` : 'Queue processing idle'}
            </div>
          </div>
          <div className="pt-2 border-t border-rule text-[10px] text-ink-3 flex justify-between">
            <span>PENDING QUEUE</span>
            <span className="text-ink-3 font-bold">{stats.queuedItems.length} waiting</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-ink-3">
          <span>Batch Execution Progress</span>
          <span>{stats.percentComplete}% ({stats.completedItems.length}/{stats.totalTargets} Targets Completed)</span>
        </div>
        <div className="w-full bg-rule-2 h-2 border border-rule overflow-hidden">
          <div 
            className="h-full bg-signal transition-all duration-300"
            style={{ width: `${stats.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Target Roster Carousel / High Exposure Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-ink-3">
          <span className="uppercase font-bold tracking-wider">Targets in Current Batch:</span>
          <span className="text-[10px] text-ink-3">Click any target to inspect findings</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {batch.items.slice(0, 6).map((item) => {
            const isCompleted = item.status === 'completed';
            const isScanning = item.status === 'scanning';
            const threatBadge = item.aiProfile?.threatLevel || (item.foundCount >= 10 ? 'Critical' : item.foundCount >= 5 ? 'Elevated' : 'Low');

            return (
              <div
                key={item.id}
                onClick={() => onInspectTarget && isCompleted && onInspectTarget(item)}
                className={`p-2.5 border text-xs transition-all flex items-center justify-between ${
                  isCompleted
                    ? 'border-rule bg-paper hover:border-ink-3 cursor-pointer'
                    : isScanning
                    ? 'border-ink-3 bg-paper-2/20 animate-pulse'
                    : 'border-rule bg-paper-2 opacity-60'
                }`}
              >
                <div className="space-y-0.5 truncate mr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-ink-3 font-mono text-[10px]">
                      {item.type === 'username' ? '@' : '✉'}
                    </span>
                    <strong className="text-ink font-bold truncate text-[11px]">{item.target}</strong>
                  </div>
                  <div className="text-[10px] text-ink-3">
                    {isCompleted ? (
                      <span className="text-ink-3 font-bold">{item.foundCount} hits found</span>
                    ) : isScanning ? (
                      <span className="text-ink-3 font-bold">Scanning...</span>
                    ) : (
                      <span>Queued</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isCompleted && (
                    <span className={`text-[9px] uppercase px-1.5 py-0.5 border font-bold ${
                      threatBadge === 'Critical'
                        ? 'border-rule text-ink-3 bg-paper-2/40'
                        : threatBadge === 'Elevated'
                        ? 'border-rule text-ink-3 bg-paper-2/40'
                        : 'border-rule text-ink-3 bg-rule-2'
                    }`}>
                      {threatBadge}
                    </span>
                  )}
                  {isScanning && (
                    <span className="w-2 h-2 rounded-full bg-ink-3 animate-ping" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {batch.items.length > 6 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onViewBatch}
              className="text-[11px] text-ink-3 hover:text-ink underline underline-offset-2"
            >
              + {batch.items.length - 6} more targets in batch queue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
