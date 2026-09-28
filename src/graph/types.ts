export interface HuntGraphNode {
  id: string;
  label: string;
  type: string;
  candidate?: boolean;
  evidenceId?: string;
  similarityScore?: number;
  metadata?: Record<string, unknown>;
}

export interface HuntGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence: number;
  candidate?: boolean;
  evidenceId?: string;
}

export interface GraphQueryResult {
  query: string;
  matchedNodeIds: string[];
  matchedEdgeIds: string[];
  summary: string;
  warnings: string[];
}
