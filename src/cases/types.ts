import type { EmailReconData, ScanPreset, ScanResult } from '../types';
import type { GraphPivotInvestigation } from '../graph/types';

export type CaseTargetType = 'username' | 'email';

export interface CaseCollectionSnapshot {
  id: string;
  caseId: string;
  target: string;
  targetType: CaseTargetType;
  collectedAt: string;
  preset: ScanPreset;
  results: ScanResult[];
  emailData: EmailReconData | null;
  foundCount: number;
  uncertainCount: number;
  totalScanned: number;
  durationMs?: number;
}

export interface MineiroCase {
  id: string;
  name: string;
  primaryTarget: string;
  primaryTargetType: CaseTargetType;
  createdAt: string;
  updatedAt: string;
  collections: CaseCollectionSnapshot[];
  pivotInvestigations: GraphPivotInvestigation[];
  tags: string[];
  notes?: string;
  schemaVersion: 1;
}

export type DiffChangeType =
  | 'NEW'
  | 'DISAPPEARED'
  | 'CHANGED'
  | 'UNCHANGED'
  | 'CONFIDENCE_UP'
  | 'CONFIDENCE_DOWN';

export interface DiffEntry {
  id: string;
  platformId: string;
  platformName: string;
  category: string;
  changeType: DiffChangeType;
  beforeStatus?: ScanResult['status'];
  afterStatus?: ScanResult['status'];
  beforeConfidence?: number;
  afterConfidence?: number;
  beforeUrl?: string;
  afterUrl?: string;
  beforeCheckedAt?: string;
  afterCheckedAt?: string;
  changedFields: string[];
  note: string;
}

export interface DiffIntelligenceReport {
  fromSnapshotId: string;
  toSnapshotId: string;
  target: string;
  generatedAt: string;
  entries: DiffEntry[];
  counts: Record<DiffChangeType, number>;
  materialChanges: number;
  summary: string;
}
