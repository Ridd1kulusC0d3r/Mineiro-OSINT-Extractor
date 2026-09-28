import { runGraphQuery } from '../src/graph/query';
import { graphToCypher } from '../src/graph/export';
import type { HuntGraphEdge, HuntGraphNode } from '../src/graph/types';

const nodes: HuntGraphNode[] = [
  { id: 'target', label: 'pascho', type: 'TARGET' },
  { id: 'user', label: 'pascho', type: 'USERNAME' },
  { id: 'candidate', label: 'pascho_dev', type: 'USERNAME_CANDIDATE', candidate: true, similarityScore: 82 },
  { id: 'profile1', label: 'GitHub', type: 'PROFILE', evidenceId: 'E-001' },
  { id: 'domain', label: 'example.com', type: 'DOMAIN' },
  { id: 'profile2', label: 'GitLab', type: 'PROFILE', evidenceId: 'E-002' },
];

const edges: HuntGraphEdge[] = [
  { id: 'e1', source: 'target', target: 'user', label: 'USES', confidence: 100 },
  { id: 'e2', source: 'user', target: 'candidate', label: 'SIMILAR_USERNAME', confidence: 82, candidate: true },
  { id: 'e3', source: 'user', target: 'profile1', label: 'OBSERVED_ON', confidence: 92 },
  { id: 'e4', source: 'profile1', target: 'domain', label: 'SAME_DOMAIN', confidence: 88 },
  { id: 'e5', source: 'profile2', target: 'domain', label: 'SAME_DOMAIN', confidence: 84 },
];

const similar = runGraphQuery('MATCH candidate=true AND similarity>=80', nodes, edges);
if (!similar.matchedNodeIds.includes('candidate') || similar.matchedNodeIds.length !== 1) {
  throw new Error('candidate similarity query failed');
}

const shared = runGraphQuery('SHARED type=DOMAIN', nodes, edges);
if (!shared.matchedNodeIds.includes('domain')) throw new Error('shared-domain query failed');

const strong = runGraphQuery('EDGE confidence>=90', nodes, edges);
if (!strong.matchedEdgeIds.includes('e1') || !strong.matchedEdgeIds.includes('e3')) {
  throw new Error('edge confidence query failed');
}

const path = runGraphQuery('PATH from=TARGET to=PROFILE', nodes, edges);
if (!path.matchedNodeIds.includes('target') || !path.matchedNodeIds.includes('profile1')) {
  throw new Error('path query failed');
}

const cypher = graphToCypher(nodes, edges);
if (!cypher.includes('MERGE (n:MineiroNode') || !cypher.includes('SIMILAR_USERNAME')) {
  throw new Error('Cypher export failed');
}
if (!cypher.includes('candidate=true')) throw new Error('Cypher export lost candidate semantics');

console.log('[PASS] Graph hunting queries and Neo4j export validated.');
