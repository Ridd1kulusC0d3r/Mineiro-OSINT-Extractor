import { useState } from 'react';
import { FolderClock, GitBranch, GitFork } from 'lucide-react';
import type { EmailReconData, ScanResult } from '../types';
import { AccountLinkageView } from './AccountLinkageView';
import { RelationshipGraphView } from './RelationshipGraphView';
import { useI18n } from '../utils/i18n';
import type { GraphPivotInvestigation } from '../graph/types';
import type { CaseCollectionSnapshot, MineiroCase } from '../cases/types';
import { CaseDiffPanel } from './CaseDiffPanel';

interface CorrelationWorkspaceProps {
  target: string;
  results: ScanResult[];
  emailData: EmailReconData | null;
  onPivotScan: (newTarget: string) => Promise<GraphPivotInvestigation>;
  caseFile: MineiroCase | null;
  onLoadSnapshot: (snapshot: CaseCollectionSnapshot) => void;
}

export function CorrelationWorkspace(props: CorrelationWorkspaceProps) {
  const { tr } = useI18n();
  const [tab, setTab] = useState<'linkage' | 'graph' | 'case'>('graph');
  const [pivotInvestigations, setPivotInvestigations] = useState<GraphPivotInvestigation[]>([]);

  const handlePivotScan = async (candidate: string) => {
    const investigation = await props.onPivotScan(candidate);
    setPivotInvestigations((current) => [investigation, ...current.filter((item) => item.target !== investigation.target)].slice(0, 12));
    return investigation;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('graph')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${tab === 'graph' ? 'border-[#59616a] bg-[#181c20] text-white' : 'border-[#2d3339] text-[#8f969f] hover:text-white'}`}
        >
          <GitBranch className="h-4 w-4" />
          Relationship Graph
        </button>
        <button
          type="button"
          onClick={() => setTab('linkage')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${tab === 'linkage' ? 'border-[#59616a] bg-[#181c20] text-white' : 'border-[#2d3339] text-[#8f969f] hover:text-white'}`}
        >
          <GitFork className="h-4 w-4" />
          Similar Usernames
        </button>
        <button
          type="button"
          onClick={() => setTab('case')}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${tab === 'case' ? 'border-[#59616a] bg-[#181c20] text-white' : 'border-[#2d3339] text-[#8f969f] hover:text-white'}`}
        >
          <FolderClock className="h-4 w-4" />
          Case & Diff
        </button>
      </div>

      {tab === 'graph' ? (
        <RelationshipGraphView
          target={props.target}
          results={props.results}
          emailData={props.emailData}
          onPivotScan={handlePivotScan}
          pivotInvestigations={pivotInvestigations}
        />
      ) : tab === 'linkage' ? (
        <AccountLinkageView {...props} onPivotScan={handlePivotScan} />
      ) : (
        <CaseDiffPanel
          caseFile={props.caseFile}
          currentTarget={props.target}
          onLoadSnapshot={props.onLoadSnapshot}
        />
      )}
    </div>
  );
}
