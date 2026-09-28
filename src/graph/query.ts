import type { GraphQueryResult, HuntGraphEdge, HuntGraphNode } from './types';

function normalize(input: string) {
  return input.trim().replace(/\s+/g, ' ');
}

function compareNumber(value: number, op: string, expected: number) {
  if (op === '>=') return value >= expected;
  if (op === '<=') return value <= expected;
  if (op === '>') return value > expected;
  if (op === '<') return value < expected;
  return value === expected;
}

function connectedNodeIds(edges: HuntGraphEdge[], edgeIds: Set<string>) {
  const ids = new Set<string>();
  for (const edge of edges) {
    if (!edgeIds.has(edge.id)) continue;
    ids.add(edge.source);
    ids.add(edge.target);
  }
  return ids;
}

/**
 * Mineiro Graph Query (MGQ)
 *
 * Read-only local query syntax inspired by graph hunting tools:
 *
 * MATCH type=PROFILE
 * MATCH candidate=true
 * MATCH label~pascho
 * MATCH similarity>=80
 * EDGE relationship=SAME_DOMAIN
 * EDGE confidence>=80
 * SHARED type=DOMAIN
 * PATH from=TARGET to=PROFILE
 *
 * Multiple clauses can be joined with AND.
 */
export function runGraphQuery(
  rawQuery: string,
  nodes: HuntGraphNode[],
  edges: HuntGraphEdge[]
): GraphQueryResult {
  const query = normalize(rawQuery);
  if (!query) {
    return {
      query,
      matchedNodeIds: nodes.map((node) => node.id),
      matchedEdgeIds: edges.map((edge) => edge.id),
      summary: `${nodes.length} nodes · ${edges.length} edges`,
      warnings: [],
    };
  }

  const upper = query.toUpperCase();
  const warnings: string[] = [];
  let nodeMatches = new Set(nodes.map((node) => node.id));
  let edgeMatches = new Set(edges.map((edge) => edge.id));

  const clauses = query.split(/\s+AND\s+/i).map((part) => part.trim()).filter(Boolean);

  for (const clause of clauses) {
    const matchType = clause.match(/^(?:MATCH\s+)?type\s*=\s*([A-Z0-9_:-]+)$/i);
    if (matchType) {
      const expected = matchType[1].toUpperCase();
      nodeMatches = new Set([...nodeMatches].filter((id) => nodes.find((n) => n.id === id)?.type.toUpperCase() === expected));
      continue;
    }

    const matchCandidate = clause.match(/^(?:MATCH\s+)?candidate\s*=\s*(true|false)$/i);
    if (matchCandidate) {
      const expected = matchCandidate[1].toLowerCase() === 'true';
      nodeMatches = new Set([...nodeMatches].filter((id) => Boolean(nodes.find((n) => n.id === id)?.candidate) === expected));
      continue;
    }

    const matchLabel = clause.match(/^(?:MATCH\s+)?label\s*~\s*(.+)$/i);
    if (matchLabel) {
      const needle = matchLabel[1].replace(/^["']|["']$/g, '').toLowerCase();
      nodeMatches = new Set([...nodeMatches].filter((id) => nodes.find((n) => n.id === id)?.label.toLowerCase().includes(needle)));
      continue;
    }

    const matchSimilarity = clause.match(/^(?:MATCH\s+)?similarity\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)$/i);
    if (matchSimilarity) {
      const op = matchSimilarity[1];
      const expected = Number(matchSimilarity[2]);
      nodeMatches = new Set([...nodeMatches].filter((id) => {
        const score = nodes.find((n) => n.id === id)?.similarityScore;
        return typeof score === 'number' && compareNumber(score, op, expected);
      }));
      continue;
    }

    const edgeRel = clause.match(/^EDGE\s+relationship\s*=\s*([A-Z0-9_:-]+)$/i);
    if (edgeRel) {
      const expected = edgeRel[1].toUpperCase();
      edgeMatches = new Set([...edgeMatches].filter((id) => edges.find((e) => e.id === id)?.label.toUpperCase() === expected));
      nodeMatches = connectedNodeIds(edges, edgeMatches);
      continue;
    }

    const edgeConfidence = clause.match(/^EDGE\s+confidence\s*(>=|<=|>|<|=)\s*(\d+(?:\.\d+)?)$/i);
    if (edgeConfidence) {
      const op = edgeConfidence[1];
      const expected = Number(edgeConfidence[2]);
      edgeMatches = new Set([...edgeMatches].filter((id) => {
        const value = edges.find((e) => e.id === id)?.confidence ?? 0;
        return compareNumber(value, op, expected);
      }));
      nodeMatches = connectedNodeIds(edges, edgeMatches);
      continue;
    }

    const shared = clause.match(/^SHARED\s+type\s*=\s*([A-Z0-9_:-]+)$/i);
    if (shared) {
      const expected = shared[1].toUpperCase();
      const degree = new Map<string, number>();
      edges.forEach((edge) => {
        degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
        degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
      });
      nodeMatches = new Set(nodes
        .filter((node) => node.type.toUpperCase() === expected && (degree.get(node.id) || 0) >= 2)
        .map((node) => node.id));
      edgeMatches = new Set(edges
        .filter((edge) => nodeMatches.has(edge.source) || nodeMatches.has(edge.target))
        .map((edge) => edge.id));
      continue;
    }

    const path = clause.match(/^PATH\s+from\s*=\s*([A-Z0-9_:-]+)\s+to\s*=\s*([A-Z0-9_:-]+)$/i);
    if (path) {
      const fromType = path[1].toUpperCase();
      const toType = path[2].toUpperCase();
      const starts = nodes.filter((node) => node.type.toUpperCase() === fromType);
      const goals = new Set(nodes.filter((node) => node.type.toUpperCase() === toType).map((node) => node.id));
      const adjacency = new Map<string, Array<{ id: string; edgeId: string }>>();
      edges.forEach((edge) => {
        adjacency.set(edge.source, [...(adjacency.get(edge.source) || []), { id: edge.target, edgeId: edge.id }]);
        adjacency.set(edge.target, [...(adjacency.get(edge.target) || []), { id: edge.source, edgeId: edge.id }]);
      });

      const foundNodes = new Set<string>();
      const foundEdges = new Set<string>();
      for (const start of starts) {
        const queue: Array<{ id: string; pathNodes: string[]; pathEdges: string[] }> = [{ id: start.id, pathNodes: [start.id], pathEdges: [] }];
        const seen = new Set<string>([start.id]);
        while (queue.length) {
          const current = queue.shift()!;
          if (goals.has(current.id) && current.id !== start.id) {
            current.pathNodes.forEach((id) => foundNodes.add(id));
            current.pathEdges.forEach((id) => foundEdges.add(id));
            continue;
          }
          if (current.pathNodes.length > 6) continue;
          for (const next of adjacency.get(current.id) || []) {
            if (seen.has(next.id)) continue;
            seen.add(next.id);
            queue.push({
              id: next.id,
              pathNodes: [...current.pathNodes, next.id],
              pathEdges: [...current.pathEdges, next.edgeId],
            });
          }
        }
      }
      nodeMatches = foundNodes;
      edgeMatches = foundEdges;
      continue;
    }

    warnings.push(`Unsupported clause: ${clause}`);
  }

  // When a node-oriented query matched nodes, keep only edges fully inside the result.
  if (!clauses.some((clause) => /^EDGE|^SHARED|^PATH/i.test(clause))) {
    edgeMatches = new Set(edges.filter((edge) => nodeMatches.has(edge.source) && nodeMatches.has(edge.target)).map((edge) => edge.id));
  }

  return {
    query,
    matchedNodeIds: [...nodeMatches],
    matchedEdgeIds: [...edgeMatches],
    summary: `${nodeMatches.size} nodes · ${edgeMatches.size} edges`,
    warnings,
  };
}

export const GRAPH_QUERY_PRESETS = [
  { id: 'similar', label: 'Similar usernames', query: 'MATCH candidate=true AND similarity>=70' },
  { id: 'shared-domains', label: 'Shared domains', query: 'SHARED type=DOMAIN' },
  { id: 'profiles', label: 'Observed profiles', query: 'MATCH type=PROFILE' },
  { id: 'strong-edges', label: 'Strong edges', query: 'EDGE confidence>=80' },
  { id: 'same-domain', label: 'Same domain', query: 'EDGE relationship=SAME_DOMAIN' },
  { id: 'target-profiles', label: 'Target → profiles', query: 'PATH from=TARGET to=PROFILE' },
] as const;
