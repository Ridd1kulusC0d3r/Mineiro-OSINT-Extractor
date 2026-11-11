import { Activity, Check, Copy, ExternalLink, Gauge, Search } from 'lucide-react';
import type { GraphNode } from './networkGraph.logic';

interface NodeInspectorProps {
  selectedNode: GraphNode;
  setSelectedNode: (node: GraphNode | null) => void;
  onPivotScan?: (newTarget: string) => void;
  copiedText: string | null;
  handleCopy: (text: string) => void;
}

/** Drawer with the selected node's metrics, AI factors and actions. */
export function NodeInspector({ selectedNode, setSelectedNode, onPivotScan, copiedText, handleCopy }: NodeInspectorProps) {
  return (
    <div className="absolute top-3 right-3 max-w-sm w-full bg-paper/95 border border-rule p-4 backdrop-blur-md text-xs space-y-3 shadow-2xl z-20">
      <div className="flex items-start justify-between border-b border-rule pb-2">
        <div>
          <span className="text-[10px] uppercase text-ink-3 tracking-wider">
            NODE INSPECTION:
          </span>
          <h4 className="text-sm font-bold text-ink tracking-wide">
            {selectedNode.label}
          </h4>
        </div>
        <button
          type="button"
          onClick={() => setSelectedNode(null)}
          className="text-ink-3 hover:text-ink text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-ink-2 text-[11px]">
        <div className="flex justify-between">
          <span className="text-ink-3">Node Type:</span>
          <span className="text-ink font-bold uppercase">{selectedNode.type}</span>
        </div>
        {selectedNode.category && (
          <div className="flex justify-between">
            <span className="text-ink-3">Category:</span>
            <span className="text-ink capitalize">{selectedNode.category}</span>
          </div>
        )}
        {selectedNode.status && (
          <div className="flex justify-between">
            <span className="text-ink-3">Probe Status:</span>
            <span className={`font-bold uppercase ${selectedNode.status === 'found' ? 'text-ink' : 'text-ink-3'}`}>
              {selectedNode.status}
            </span>
          </div>
        )}
        {selectedNode.similarity !== undefined && (
          <div className="flex justify-between">
            <span className="text-ink-3">Correlation Similarity:</span>
            <span className="text-ink font-bold">{selectedNode.similarity}%</span>
          </div>
        )}
        {selectedNode.confidence !== undefined && (
          <div className="flex justify-between">
            <span className="text-ink-3">Confidence Score:</span>
            <span className="text-ink font-bold">{selectedNode.confidence}%</span>
          </div>
        )}

        {/* AI Sizing Metrics Breakdown */}
        <div className="pt-2 border-t border-rule space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase text-ink-3 font-semibold">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-ink" />
              Profile Completeness:
            </span>
            <span className="text-ink font-mono font-bold">{selectedNode.profileCompleteness}%</span>
          </div>
          <div className="w-full bg-rule-2 h-1.5 border border-rule overflow-hidden">
            <div 
              className="bg-signal h-full transition-all duration-300" 
              style={{ width: `${selectedNode.profileCompleteness}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] uppercase text-ink-3 font-semibold pt-1">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-ink-2" />
              Activity Density:
            </span>
            <span className="text-ink font-mono font-bold">{selectedNode.activityDensity}%</span>
          </div>
          <div className="w-full bg-rule-2 h-1.5 border border-rule overflow-hidden">
            <div 
              className="bg-ink-2 h-full transition-all duration-300" 
              style={{ width: `${selectedNode.activityDensity}%` }}
            />
          </div>
        </div>

        {/* Contributing Factors from AI */}
        {selectedNode.densityFactors && selectedNode.densityFactors.length > 0 && (
          <div className="pt-2 border-t border-rule space-y-1">
            <span className="text-[10px] uppercase text-ink-3 font-bold tracking-wider">
              Contributing AI Intelligence:
            </span>
            <ul className="space-y-1 text-[10px] text-ink-2 list-disc list-inside">
              {selectedNode.densityFactors.map((factor, idx) => (
                <li key={idx} className="leading-snug text-ink-2">
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedNode.details && (
          <div className="pt-2 border-t border-rule text-ink-3 text-[10px]">
            {selectedNode.details}
          </div>
        )}
      </div>

      {/* Actions for Selected Node */}
      <div className="pt-2 border-t border-rule flex flex-wrap gap-2">
        {selectedNode.url && (
          <a
            href={selectedNode.url}
            target="_blank"
            rel="noreferrer noopener"
            className="px-2.5 py-1.5 bg-signal text-signal-ink font-bold uppercase text-[10px] hover:bg-ink inline-flex items-center gap-1.5 tracking-wider"
          >
            <ExternalLink className="w-3 h-3" />
            Audit Profile
          </a>
        )}

        {onPivotScan && (selectedNode.type === 'linkage' || selectedNode.type === 'email') && (
          <button
            type="button"
            onClick={() => onPivotScan(selectedNode.label.replace(/^@/, ''))}
            className="px-2.5 py-1.5 border border-signal bg-signal text-signal-ink font-bold uppercase text-[10px] hover:bg-ink inline-flex items-center gap-1.5 tracking-wider"
          >
            <Search className="w-3 h-3" />
            Pivot Scan
          </button>
        )}

        <button
          type="button"
          onClick={() => handleCopy(selectedNode.label)}
          className="px-2 py-1.5 border border-rule bg-rule-2 text-ink-2 hover:text-ink text-[10px] inline-flex items-center gap-1"
        >
          {copiedText === selectedNode.label ? <Check className="w-3 h-3 text-ink" /> : <Copy className="w-3 h-3 text-ink-3" />}
          {copiedText === selectedNode.label ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
