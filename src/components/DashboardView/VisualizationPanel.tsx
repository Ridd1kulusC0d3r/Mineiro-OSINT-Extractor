import { useState } from 'react';
import { Activity, Flame, GitFork, Globe, Network, ShieldAlert } from 'lucide-react';
import type { AiProfileReport, EmailReconData, ScanResult } from '../../types';
import type { GraphPivotInvestigation } from '../../graph/types';
import { WorldThreatMap } from '../WorldThreatMap';
import { NetworkRelationshipGraph } from '../NetworkRelationshipGraph';
import { AccountLinkageView } from '../AccountLinkageView';
import { CategoryHeatMap } from '../CategoryHeatMap';
import { RiskMatrix2x2 } from '../RiskMatrix2x2';

interface VisualizationPanelProps {
  target: string;
  targetType: 'username' | 'email';
  results: ScanResult[];
  emailData: EmailReconData | null;
  aiProfile: AiProfileReport | null;
  onPivotScan?: (newTarget: string) => Promise<GraphPivotInvestigation>;
}

/** The chart tabs: force graph, world map, linkage, category heat map, risk matrix. */
export function VisualizationPanel({ target, targetType, results, emailData, aiProfile, onPivotScan }: VisualizationPanelProps) {
  const [activeVizTab, setActiveVizTab] = useState<'network' | 'geo' | 'linkage' | 'heatmap' | 'risk_matrix'>('network');

  return (
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
  );
}
