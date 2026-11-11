import { useMemo, useState } from 'react';
import { GitBranch, Info, Search, Target } from 'lucide-react';
import type { EmailReconData, ScanResult } from '../types';
import { buildIntelligenceAssessment } from '../intelligence/assessment';
import { generateAccountLinkageDossier } from '../data/accountLinkage';
import { useI18n } from '../utils/i18n';
import { GraphQueryPanel } from './GraphQueryPanel';
import type { GraphPivotInvestigation, GraphQueryResult, HuntGraphEdge, HuntGraphNode } from '../graph/types';
import { PALETTE } from '../theme/palette';

interface RelationshipGraphViewProps {
  target: string;
  results: ScanResult[];
  emailData: EmailReconData | null;
  onPivotScan: (newTarget: string) => Promise<GraphPivotInvestigation>;
  pivotInvestigations: GraphPivotInvestigation[];
}

interface VisualNode extends HuntGraphNode {
  x: number;
  y: number;
}

interface VisualEdge extends HuntGraphEdge {}

const WIDTH = 1120;
const HEIGHT = 700;
/**
 * Anéis elípticos [raio x, raio y]: a tela é mais larga que alta, então cada anel se abre na horizontal e os
 * anéis ficam separados por pelo menos ~70 px em y, para que rótulos de anéis vizinhos não se sobreponham
 * (defeito 10 da linha de base). Candidatos ficam num anel próprio, entre perfis e entidades secundárias.
 */
const RINGS: Record<'primary' | 'profile' | 'candidate' | 'secondary', [number, number]> = {
  primary: [120, 78],
  profile: [255, 150],
  candidate: [385, 222],
  secondary: [505, 300],
};

export function RelationshipGraphView({ target, results, emailData, onPivotScan, pivotInvestigations }: RelationshipGraphViewProps) {
  const { tr, language } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<GraphQueryResult | null>(null);
  const [scanningCandidate, setScanningCandidate] = useState<string | null>(null);

  const copy = useMemo(() => ({
    en: {
      inspect: 'Click a node to inspect.',
      candidate: 'candidate',
      observed: 'observed',
      similarity: 'similarity',
      scan: 'Scan candidate',
      candidateHelp: 'This node is only a username-similarity hypothesis. Run a pivot scan to collect independent public evidence.',
      queryActive: 'query active',
      queryHint: 'Matched nodes stay bright; unmatched nodes are dimmed.',
      target: 'Target',
      scanComplete: 'pivot scan complete',
      profilesFound: 'profiles found',
      scanning: 'Scanning…',
    },
    pt: {
      inspect: 'Clique em um nó para inspecionar.',
      candidate: 'candidato',
      observed: 'observado',
      similarity: 'similaridade',
      scan: 'Escanear candidato',
      candidateHelp: 'Este nó é apenas uma hipótese de similaridade de username. Execute um pivot scan para coletar evidência pública independente.',
      queryActive: 'consulta ativa',
      queryHint: 'Nós encontrados permanecem em destaque; os demais ficam atenuados.',
      target: 'Alvo',
      scanComplete: 'pivot concluído',
      profilesFound: 'perfis encontrados',
      scanning: 'Escaneando…',
    },
    es: {
      inspect: 'Haz clic en un nodo para inspeccionar.',
      candidate: 'candidato',
      observed: 'observado',
      similarity: 'similitud',
      scan: 'Escanear candidato',
      candidateHelp: 'Este nodo es solo una hipótesis de similitud de username. Ejecuta un pivot scan para recopilar evidencia pública independiente.',
      queryActive: 'consulta activa',
      queryHint: 'Los nodos coincidentes permanecen destacados; los demás se atenúan.',
      target: 'Objetivo',
      scanComplete: 'pivot completado',
      profilesFound: 'perfiles encontrados',
      scanning: 'Escaneando…',
    },
  })[language], [language]);

  const data = useMemo(() => {
    const assessment = buildIntelligenceAssessment(results, target || 'target', 'account_correlation', language);
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
      nodes.push({ ...node, x: centerX + Math.cos(angle) * RINGS.primary[0], y: centerY + Math.sin(angle) * RINGS.primary[1] });
    });

    const profileNodes = observed.filter((node) => node.type === 'PROFILE');
    profileNodes.slice(0, 24).forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(1, Math.min(24, profileNodes.length));
      nodes.push({ ...node, x: centerX + Math.cos(angle) * RINGS.profile[0], y: centerY + Math.sin(angle) * RINGS.profile[1] });
    });

    const secondary = observed.filter((node) =>
      ['PLATFORM', 'DOMAIN', 'PUBLIC_URL', 'DISPLAY_NAME', 'ORGANIZATION', 'PUBLIC_PROJECT'].includes(node.type)
    );
    secondary.slice(0, 28).forEach((node, index) => {
      const step = (Math.PI * 2) / Math.max(1, Math.min(28, secondary.length));
      const angle = step * index + step / 2; // meio passo de defasagem em relação ao anel de perfis
      nodes.push({ ...node, x: centerX + Math.cos(angle) * RINGS.secondary[0], y: centerY + Math.sin(angle) * RINGS.secondary[1] });
    });

    linkage.permutations.slice(0, 16).forEach((item, index) => {
      const angle = -Math.PI / 2 + ((Math.PI * 2) / Math.max(1, Math.min(16, linkage.permutations.length))) * index;
      nodes.push({
        id: `candidate:${item.label}`,
        label: item.label,
        type: 'USERNAME_CANDIDATE',
        candidate: true,
        similarityScore: item.similarityScore,
        metadata: {
          mutationType: item.mutationType,
          reason: item.reason,
          hypothesis: item.hypothesis,
          pivotHandle: item.pivotHandle || item.label,
        },
        x: centerX + Math.cos(angle) * RINGS.candidate[0],
        y: centerY + Math.sin(angle) * RINGS.candidate[1],
      });
    });

    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges: VisualEdge[] = assessment.graph.edges
      .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .slice(0, 90)
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.relationship,
        confidence: edge.confidence,
        evidenceId: edge.evidenceId,
      }));

    const usernameNode = nodes.find((node) => node.type === 'USERNAME' || node.type === 'EMAIL');
    if (usernameNode) {
      linkage.permutations.slice(0, 16).forEach((item) => {
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

    // Preserve pivot scans inside the current graph. A successful pivot confirms
    // public presence of the candidate handle on those services, but it does not
    // confirm that the candidate and original target are the same identity.
    pivotInvestigations.forEach((pivot, pivotIndex) => {
      let candidateNode = nodes.find((node) => node.id === `candidate:${pivot.target}`);
      if (!candidateNode) {
        const angle = -Math.PI / 2 + ((Math.PI * 2) / Math.max(1, pivotInvestigations.length)) * pivotIndex;
        candidateNode = {
          id: `candidate:${pivot.target}`,
          label: pivot.target,
          type: 'USERNAME_CANDIDATE',
          candidate: true,
          similarityScore: 0,
          metadata: { pivotHandle: pivot.target },
          x: centerX + Math.cos(angle) * 285,
          y: centerY + Math.sin(angle) * 285,
        };
        nodes.push(candidateNode);
        if (usernameNode) {
          edges.push({
            id: `candidate-edge:${pivot.target}`,
            source: usernameNode.id,
            target: candidateNode.id,
            label: 'PIVOT_CANDIDATE',
            confidence: 0,
            candidate: true,
          });
        }
      }

      candidateNode.metadata = {
        ...(candidateNode.metadata || {}),
        scannedAt: pivot.scannedAt,
        foundCount: pivot.foundCount,
        uncertainCount: pivot.uncertainCount,
        totalScanned: pivot.totalScanned,
      };

      const foundProfiles = pivot.results.filter((result) => result.status === 'found').slice(0, 8);
      foundProfiles.forEach((result, resultIndex) => {
        const localAngle = ((Math.PI * 2) / Math.max(1, foundProfiles.length)) * resultIndex;
        const profileId = `pivot-profile:${pivot.target}:${result.platformId}`;
        const profileNode: VisualNode = {
          id: profileId,
          label: result.platformName,
          type: 'PIVOT_PROFILE',
          candidate: false,
          evidenceId: result.id,
          metadata: {
            username: pivot.target,
            url: result.url,
            statusCode: result.statusCode,
            detectorReliability: result.detectorReliability,
            confidenceScore: result.confidenceScore,
          },
          x: Math.max(36, Math.min(WIDTH - 36, candidateNode!.x + Math.cos(localAngle) * 72)),
          y: Math.max(36, Math.min(HEIGHT - 36, candidateNode!.y + Math.sin(localAngle) * 72)),
        };
        if (!nodes.some((node) => node.id === profileId)) nodes.push(profileNode);
        edges.push({
          id: `pivot-observed:${pivot.target}:${result.platformId}`,
          source: candidateNode!.id,
          target: profileId,
          label: 'OBSERVED_ON',
          confidence: result.confidenceScore || result.detectorReliability || 60,
          candidate: false,
          evidenceId: result.id,
        });
      });
    });

    return { nodes, edges };
  }, [target, results, emailData, language, pivotInvestigations]);

  const byId = useMemo(() => new Map(data.nodes.map((node) => [node.id, node])), [data.nodes]);
  const selected = selectedId ? byId.get(selectedId) : undefined;

  const observedEdges = data.edges.filter((edge) => !edge.candidate).length;
  const candidateEdges = data.edges.filter((edge) => edge.candidate).length;
  const matchedNodes = queryResult?.query ? new Set(queryResult.matchedNodeIds) : null;
  const matchedEdges = queryResult?.query ? new Set(queryResult.matchedEdgeIds) : null;

  return (
    <section className="space-y-4">
      <GraphQueryPanel
        nodes={data.nodes}
        edges={data.edges}
        onResult={(result) => {
          setQueryResult(result);
          if (result.matchedNodeIds.length === 1) setSelectedId(result.matchedNodeIds[0]);
        }}
      />

      <div className="rounded-[22px] border border-rule bg-paper-2 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-rule p-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">
              <GitBranch className="h-4 w-4" />
              {tr('graph.title')}
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-ink">
              {tr('graph.heading')}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink-3">
              {tr('graph.desc')}
            </p>
            {queryResult?.query ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                <span className="rounded-lg border border-rule px-2.5 py-1 font-mono">{copy.queryActive}: {queryResult.query}</span>
                <span>{copy.queryHint}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-rule px-3 py-2 text-ink-2">{observedEdges} {tr('graph.observed')}</span>
            <span className="rounded-lg border border-dashed border-ink-3 px-3 py-2 text-ink-2">{candidateEdges} {tr('graph.candidate')}</span>
          </div>
        </div>

        <div className="relative overflow-x-auto bg-paper">
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[900px] w-full">
            <rect width={WIDTH} height={HEIGHT} fill={PALETTE.paper} />
            {data.edges.map((edge) => {
              const source = byId.get(edge.source);
              const targetNode = byId.get(edge.target);
              if (!source || !targetNode) return null;
              const matches = !matchedEdges || matchedEdges.has(edge.id);
              return (
                <g key={edge.id} opacity={matches ? 1 : 0.11}>
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={edge.candidate ? PALETTE.ink3 : PALETTE.rule}
                    strokeWidth={edge.candidate ? 1.1 : Math.max(1, edge.confidence / 45)}
                    strokeDasharray={edge.candidate ? '6 6' : undefined}
                    opacity={edge.candidate ? 0.78 : 0.92}
                  />
                </g>
              );
            })}

            {data.nodes.map((node) => {
              const isSelected = selectedId === node.id;
              const matches = !matchedNodes || matchedNodes.has(node.id);
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
                  opacity={matches ? 1 : 0.16}
                >
                  <circle
                    r={radius}
                    fill={node.candidate ? PALETTE.card : node.type === 'TARGET' ? PALETTE.signal : PALETTE.rule2}
                    stroke={node.candidate ? PALETTE.ink3 : isSelected ? PALETTE.signal : node.type === 'TARGET' ? PALETTE.signal : PALETTE.ink3}
                    strokeWidth={isSelected ? 2.5 : matches && matchedNodes ? 2 : 1.2}
                    strokeDasharray={node.candidate ? '4 3' : undefined}
                  />
                  {node.type === 'TARGET' && <text textAnchor="middle" dy="4" fontSize="10" fill={PALETTE.signalInk} fontWeight="700" fontFamily="var(--mono)">TARGET</text>}
                  <text
                    textAnchor="middle"
                    y={radius + 15}
                    fontSize="10.5"
                    fontFamily="var(--mono)"
                    fill={isSelected ? PALETTE.signal : PALETTE.ink}
                    stroke={PALETTE.paper}
                    strokeWidth={4}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                  >
                    <title>{node.label}</title>
                    {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                  </text>
                  {node.candidate && typeof node.similarityScore === 'number' ? (
                    <text textAnchor="middle" y={radius + 29} fontSize="9" fontFamily="var(--mono)" fill={PALETTE.ink3} stroke={PALETTE.paper} strokeWidth={3} paintOrder="stroke">
                      {node.similarityScore}%
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>

        <div className="grid gap-4 border-t border-rule p-5 lg:grid-cols-[1fr_auto]">
          <div className="min-h-[72px]">
            {selected ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                    {selected.type} · {selected.candidate ? copy.candidate : copy.observed}
                  </div>
                  <div className="mt-1 break-all text-sm text-ink">{selected.label}</div>
                  {typeof selected.similarityScore === 'number' ? (
                    <div className="mt-1 text-xs text-ink-3">{copy.similarity}: {selected.similarityScore}%</div>
                  ) : null}
                  {selected.evidenceId && <div className="mt-1 text-xs text-ink-3">evidence: {selected.evidenceId}</div>}
                  {selected.candidate ? <div className="mt-2 max-w-2xl text-xs leading-relaxed text-ink-3">{copy.candidateHelp}</div> : null}
                  {selected.candidate && typeof selected.metadata?.totalScanned === 'number' ? (
                    <div className="mt-2 rounded-lg border border-rule bg-paper px-3 py-2 font-mono text-[10px] text-ink-3">
                      {copy.scanComplete} · {String(selected.metadata.foundCount || 0)} {copy.profilesFound} · {String(selected.metadata.totalScanned)} checked
                    </div>
                  ) : null}
                </div>

                {selected.candidate ? (
                  <button
                    type="button"
                    disabled={scanningCandidate === selected.label}
                    onClick={async () => {
                      const handle = String(selected.metadata?.pivotHandle || selected.label);
                      setScanningCandidate(handle);
                      try {
                        await onPivotScan(handle);
                      } finally {
                        setScanningCandidate(null);
                      }
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-ink-3 bg-rule-2 px-4 py-2.5 text-sm font-medium text-ink hover:bg-rule-2 disabled:opacity-50"
                  >
                    <Search className="h-4 w-4" />
                    {scanningCandidate === selected.label ? copy.scanning : copy.scan}
                  </button>
                ) : selected.type === 'TARGET' ? (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-rule px-3 py-2 text-xs text-ink-2">
                    <Target className="h-4 w-4" />
                    {copy.target}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-ink-3"><Info className="h-4 w-4" /> {copy.inspect}</div>
            )}
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.12em] text-ink-3">
            <span>{tr('graph.solid')}</span>
            <span>{tr('graph.dashed')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
