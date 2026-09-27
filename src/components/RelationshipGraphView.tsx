import { useMemo, useState } from 'react';
import { GitBranch, Info } from 'lucide-react';
import type { EmailReconData, ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';
import { generateAccountLinkageDossier } from '../data/accountLinkage';
import { useI18n } from '../utils/i18n';

interface RelationshipGraphViewProps {
  target: string;
  results: ScanResult[];
  emailData: EmailReconData | null;
}

interface VisualNode {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  candidate?: boolean;
  evidenceId?: string;
}

interface VisualEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
  candidate?: boolean;
}

const WIDTH = 1120;
const HEIGHT = 660;

export function RelationshipGraphView({ target, results, emailData }: RelationshipGraphViewProps) {
  const { tr } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const data = useMemo(() => {
    const assessment = buildIntelligenceAssessment(results, target || 'target', 'account_correlation');
    const linkage = generateAccountLinkageDossier(target, results, emailData);

    const observed = assessment.graph.nodes.filter((node) =>
      ['TARGET', 'USERNAME', 'EMAIL', 'PROFILE', 'PLATFORM', 'DOMAIN', 'PUBLIC_URL', 'DISPLAY_NAME', 'ORGANIZATION', 'PUBLIC_PROJECT'].includes(node.type)
    );

    const nodes: VisualNode[] = [];
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    const targetNode = observed.find((node) => node.type === 'TARGET');
    if (targetNode) {
      nodes.push({ ...targetNode, x: centerX, y: centerY });
    }

    const primary = observed.filter((node) => node.type === 'USERNAME' || node.type === 'EMAIL');
    primary.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, primary.length);
      nodes.push({ ...node, x: centerX + Math.cos(angle) * 115, y: centerY + Math.sin(angle) * 115 });
    });

    const profileNodes = observed.filter((node) => node.type === 'PROFILE');
    profileNodes.slice(0, 24).forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, Math.min(24, profileNodes.length));
      nodes.push({ ...node, x: centerX + Math.cos(angle) * 230, y: centerY + Math.sin(angle) * 230 });
    });

    const secondary = observed.filter((node) =>
      ['PLATFORM', 'DOMAIN', 'PUBLIC_URL', 'DISPLAY_NAME', 'ORGANIZATION', 'PUBLIC_PROJECT'].includes(node.type)
    );
    secondary.slice(0, 28).forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, Math.min(28, secondary.length));
      nodes.push({ ...node, x: centerX + Math.cos(angle) * 310, y: centerY + Math.sin(angle) * 310 });
    });

    const candidateRadius = 285;
    linkage.permutations.slice(0, 12).forEach((item, index) => {
      const angle = -Math.PI / 2 + ((Math.PI * 2) / Math.max(1, Math.min(12, linkage.permutations.length))) * index;
      nodes.push({
        id: `candidate:${item.label}`,
        label: item.label,
        type: 'USERNAME_CANDIDATE',
        candidate: true,
        x: centerX + Math.cos(angle) * candidateRadius,
        y: centerY + Math.sin(angle) * candidateRadius,
      });
    });

    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges: VisualEdge[] = assessment.graph.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .slice(0, 70)
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relationship,
        confidence: edge.confidence,
      }));

    const usernameNode = nodes.find((node) => node.type === 'USERNAME' || node.type === 'EMAIL');
    if (usernameNode) {
      linkage.permutations.slice(0, 12).forEach((item) => {
        edges.push({
          id: `candidate-edge:${item.label}`,
          source: usernameNode.id,
          target: `candidate:${item.label}`,
          label: 'SIMILAR_USERNAME',
          confidence: item.similarityScore,
          candidate: true,
        });
      });
    }

    return { nodes, edges };
  }, [target, results, emailData]);

  const byId = useMemo(() => new Map(data.nodes.map((node) => [node.id, node])), [data.nodes]);
  const selected = selectedId ? byId.get(selectedId) : undefined;

  const observedEdges = data.edges.filter((edge) => !edge.candidate).length;
  const candidateEdges = data.edges.filter((edge) => edge.candidate).length;

  return (
    <section className="rounded-[22px] border border-[#2b3035] bg-[#101316] overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[#292f34] p-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#8d949d]">
            <GitBranch className="h-4 w-4" />
            Account Relationship Graph
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#f3f4f5]">
            {tr('graph.heading')}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#9097a0]">
            {tr('graph.desc')}
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-lg border border-[#343a40] px-3 py-2 text-[#b0b6bd]">{observedEdges} {tr('graph.observed')}</span>
          <span className="rounded-lg border border-dashed border-[#535a62] px-3 py-2 text-[#b0b6bd]">{candidateEdges} {tr('graph.candidate')}</span>
        </div>
      </div>

      <div className="relative overflow-x-auto bg-[#0b0e10]">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[900px] w-full">
          <rect width={WIDTH} height={HEIGHT} fill="#0b0e10" />
          {data.edges.map((edge) => {
            const source = byId.get(edge.source);
            const targetNode = byId.get(edge.target);
            if (!source || !targetNode) return null;
            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={edge.candidate ? '#59616a' : '#343a40'}
                  strokeWidth={edge.candidate ? 1.1 : Math.max(1, edge.confidence / 45)}
                  strokeDasharray={edge.candidate ? '6 6' : undefined}
                  opacity={edge.candidate ? 0.75 : 0.9}
                />
              </g>
            );
          })}

          {data.nodes.map((node) => {
            const isSelected = selectedId === node.id;
            const radius =
              node.type === 'TARGET' ? 28 :
              node.type === 'USERNAME' || node.type === 'EMAIL' ? 22 :
              node.type === 'PROFILE' ? 16 : node.candidate ? 13 : 11;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onClick={() => setSelectedId(node.id)}
                className="cursor-pointer"
              >
                <circle
                  r={radius}
                  fill={node.candidate ? '#111518' : node.type === 'TARGET' ? '#f1f2f3' : '#171b1f'}
                  stroke={node.candidate ? '#6b737c' : isSelected ? '#ffffff' : '#555d66'}
                  strokeWidth={isSelected ? 2.5 : 1.2}
                  strokeDasharray={node.candidate ? '4 3' : undefined}
                />
                {node.type === 'TARGET' && <text textAnchor="middle" dy="4" fontSize="10" fill="#0b0e10" fontWeight="700">TARGET</text>}
                <text
                  textAnchor="middle"
                  y={radius + 15}
                  fontSize="10"
                  fill="#a8aeb5"
                >
                  {node.label.length > 24 ? `${node.label.slice(0, 21)}…` : node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid gap-4 border-t border-[#292f34] p-5 md:grid-cols-[1fr_auto]">
        <div className="min-h-[58px]">
          {selected ? (
            <>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#747c85]">{selected.type}{selected.candidate ? ' · candidate' : ' · observed'}</div>
              <div className="mt-1 break-all text-sm text-[#e9ebed]">{selected.label}</div>
              {selected.evidenceId && <div className="mt-1 text-xs text-[#7f8790]">evidence: {selected.evidenceId}</div>}
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[#7f8790]"><Info className="h-4 w-4" /> Clique em um nó para inspecionar.</div>
          )}
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.12em] text-[#777f88]">
          <span>{tr('graph.solid')}</span>
          <span>{tr('graph.dashed')}</span>
        </div>
      </div>
    </section>
  );
}
