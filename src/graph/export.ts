import type { HuntGraphEdge, HuntGraphNode } from './types';

function esc(value: unknown): string {
  return String(value ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function safeRel(label: string): string {
  const normalized = label.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  return normalized || 'RELATED_TO';
}

/**
 * Export the current evidence graph as idempotent Cypher.
 *
 * This function only generates text. Mineiro never connects to Neo4j
 * automatically and never sends graph data anywhere.
 */
export function graphToCypher(nodes: HuntGraphNode[], edges: HuntGraphEdge[]): string {
  const lines: string[] = [
    '// Mineiro Username Intelligence · Neo4j export',
    '// Generated locally. Candidate relationships remain explicitly marked.',
    '',
  ];

  for (const node of nodes) {
    lines.push(
      `MERGE (n:MineiroNode {id:"${esc(node.id)}"}) SET n.label="${esc(node.label)}", n.type="${esc(node.type)}", n.candidate=${Boolean(node.candidate)}, n.evidenceId="${esc(node.evidenceId || '')}", n.similarityScore=${typeof node.similarityScore === 'number' ? node.similarityScore : 'null'};`
    );
  }

  lines.push('');

  for (const edge of edges) {
    const rel = safeRel(edge.label);
    lines.push(
      `MATCH (a:MineiroNode {id:"${esc(edge.source)}"}), (b:MineiroNode {id:"${esc(edge.target)}"}) MERGE (a)-[r:${rel} {id:"${esc(edge.id)}"}]->(b) SET r.confidence=${Number.isFinite(edge.confidence) ? edge.confidence : 0}, r.candidate=${Boolean(edge.candidate)}, r.evidenceId="${esc(edge.evidenceId || '')}";`
    );
  }

  return lines.join('\n');
}
