import { useState, useMemo } from 'react';
import { 
  GitFork, 
  Search, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  ShieldAlert, 
  Layers, 
  Users, 
  Mail, 
  Compass, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ScanResult, EmailReconData, AccountLinkageNode } from '../types';
import { generateAccountLinkageDossier } from '../data/accountLinkage';

interface AccountLinkageViewProps {
  target: string;
  results: ScanResult[];
  emailData: EmailReconData | null;
  onPivotScan: (newTarget: string) => void;
}

export function AccountLinkageView({
  target,
  results,
  emailData,
  onPivotScan,
}: AccountLinkageViewProps) {
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'permutations' | 'emails' | 'peers'>('all');

  const dossier = useMemo(() => {
    return generateAccountLinkageDossier(target, results, emailData);
  }, [target, results, emailData]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHandle(text);
    setTimeout(() => setCopiedHandle(null), 2000);
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Top Banner / Concept Explainer */}
      <div className="border border-neutral-800 bg-neutral-950 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-white" />
              <h2 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider">
                Account Linkage Theory & Mutation Forensics
              </h2>
            </div>
            <p className="text-xs text-neutral-400 max-w-3xl">
              Heuristic identity correlation modeling across delimiter variations, leetspeak substitutions, 
              functional affixes, email anchors, and family/peer networks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 uppercase">Canonical Stem:</span>
            <span className="px-2.5 py-1 border border-neutral-700 bg-black text-white font-bold text-xs tracking-wider">
              {dossier.canonicalStem}
            </span>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 border border-neutral-800 bg-black">
            <span className="text-[10px] text-neutral-500 uppercase block">Total Mutations</span>
            <span className="text-xl font-bold text-white">{dossier.totalMutationsEvaluated}</span>
          </div>
          <div className="p-3 border border-neutral-800 bg-black">
            <span className="text-[10px] text-neutral-500 uppercase block">Handle Permutations</span>
            <span className="text-xl font-bold text-neutral-400">{dossier.permutations.length}</span>
          </div>
          <div className="p-3 border border-neutral-800 bg-black">
            <span className="text-[10px] text-neutral-500 uppercase block">Email Anchors</span>
            <span className="text-xl font-bold text-neutral-400">{dossier.emailCorrelations.length}</span>
          </div>
          <div className="p-3 border border-neutral-800 bg-black">
            <span className="text-[10px] text-neutral-500 uppercase block">Peer & Family Links</span>
            <span className="text-xl font-bold text-neutral-400">{dossier.familyPeerCorrelations.length}</span>
          </div>
        </div>
      </div>

      {/* Behavioral Hypotheses Summary Box */}
      <div className="border border-neutral-800 bg-neutral-950 p-5 space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5">
          <Compass className="w-4 h-4 text-white" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Account Naming Behavioral Hypotheses
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {dossier.behavioralHypotheses.map((hyp, i) => (
            <div key={i} className="p-3.5 border border-neutral-800 bg-black text-xs text-neutral-300 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase block font-bold">
                Hypothesis #{i + 1}
              </span>
              <p className="leading-relaxed font-sans text-neutral-300">
                {hyp}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center border border-neutral-800 bg-black p-1 self-start flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 text-xs uppercase transition-colors ${
            activeTab === 'all' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          All Mutations ({dossier.totalMutationsEvaluated})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permutations')}
          className={`px-3 py-1.5 text-xs uppercase transition-colors ${
            activeTab === 'permutations' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Username Permutations ({dossier.permutations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('emails')}
          className={`px-3 py-1.5 text-xs uppercase transition-colors ${
            activeTab === 'emails' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Email Corroborations ({dossier.emailCorrelations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('peers')}
          className={`px-3 py-1.5 text-xs uppercase transition-colors ${
            activeTab === 'peers' ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:text-white'
          }`}
        >
          Peer & Family Links ({dossier.familyPeerCorrelations.length})
        </button>
      </div>

      {/* Grid of Linkage Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(activeTab === 'all' || activeTab === 'permutations' ? dossier.permutations : [])
          .concat(activeTab === 'all' || activeTab === 'emails' ? dossier.emailCorrelations : [])
          .concat(activeTab === 'all' || activeTab === 'peers' ? dossier.familyPeerCorrelations : [])
          .map((item) => {
            const isEmail = item.category === 'email_variant';
            const isPeer = item.category === 'associated_peer';

            const badgeColor = isEmail
              ? 'border-neutral-500/50 bg-neutral-950/40 text-neutral-300'
              : isPeer
              ? 'border-neutral-500/50 bg-neutral-950/40 text-neutral-300'
              : 'border-neutral-500/50 bg-neutral-950/40 text-neutral-300';

            return (
              <div 
                key={item.id}
                className="border border-neutral-800 bg-neutral-950 p-4 flex flex-col justify-between space-y-3 hover:border-neutral-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold tracking-wider ${badgeColor}`}>
                      {item.mutationType}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-neutral-500 text-[10px]">Similarity:</span>
                      <span className="text-white font-bold">{item.similarityScore}%</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white tracking-wider truncate" title={item.label}>
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  <div className="p-2.5 border border-neutral-900 bg-black text-[11px] text-neutral-400 font-sans leading-relaxed">
                    <span className="text-neutral-500 block text-[10px] font-mono uppercase mb-0.5 font-bold">
                      Linkage Theory:
                    </span>
                    {item.hypothesis}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-900 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(item.label)}
                    className="px-2.5 py-1.5 border border-neutral-800 bg-black text-neutral-400 hover:text-white text-[11px] inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copiedHandle === item.label ? <Check className="w-3 h-3 text-neutral-400" /> : <Copy className="w-3 h-3" />}
                    {copiedHandle === item.label ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onPivotScan(item.pivotHandle || item.label)}
                    className="px-3 py-1.5 bg-white text-black font-bold uppercase text-[11px] hover:bg-neutral-200 inline-flex items-center gap-1.5 transition-colors tracking-wider"
                  >
                    <Search className="w-3 h-3" />
                    Pivot Scan
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
