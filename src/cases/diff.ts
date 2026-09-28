import type { ScanResult } from '../types';
import type { CaseCollectionSnapshot, DiffChangeType, DiffEntry, DiffIntelligenceReport } from './types';

const CONCLUSIVE = new Set<ScanResult['status']>(['found', 'not_found']);

function confidence(result?: ScanResult): number | undefined {
  if (!result) return undefined;
  return result.confidenceScore ?? result.detectorReliability;
}

function metadataSignature(result?: ScanResult): string {
  if (!result?.metadata) return '';
  const meta = result.metadata;
  return JSON.stringify({
    displayName: meta.displayName || '',
    organization: meta.organization || '',
    accountCreatedAt: meta.accountCreatedAt || '',
    avatarHash: meta.avatarHash || '',
    location: meta.location || '',
    extractedLinks: [...(meta.extractedLinks || [])].sort(),
    publicProjects: [...(meta.publicProjects || [])].sort(),
  });
}

function classify(before: ScanResult | undefined, after: ScanResult | undefined): {
  type: DiffChangeType;
  fields: string[];
  note: string;
} {
  if (!before && after) {
    return {
      type: 'NEW',
      fields: ['platform'],
      note: 'This platform appears in the newer collection but not in the previous snapshot.',
    };
  }

  if (before && !after) {
    return {
      type: 'DISAPPEARED',
      fields: ['platform'],
      note: 'This platform is absent from the newer collection scope. Treat disappearance as a collection change, not proof that an account was deleted.',
    };
  }

  if (!before || !after) {
    return { type: 'UNCHANGED', fields: [], note: 'No material difference.' };
  }

  const fields: string[] = [];
  if (before.status !== after.status) fields.push('status');
  if (before.url !== after.url) fields.push('url');
  if (before.statusCode !== after.statusCode) fields.push('statusCode');
  if (metadataSignature(before) !== metadataSignature(after)) fields.push('metadata');

  const beforeConfidence = confidence(before);
  const afterConfidence = confidence(after);
  const delta =
    typeof beforeConfidence === 'number' && typeof afterConfidence === 'number'
      ? afterConfidence - beforeConfidence
      : 0;

  // Confidence-only movement is separated from general CHANGED.
  if (fields.length === 0 && delta >= 10) {
    return {
      type: 'CONFIDENCE_UP',
      fields: ['confidence'],
      note: `Observation confidence increased by ${Math.round(delta)} points.`,
    };
  }
  if (fields.length === 0 && delta <= -10) {
    return {
      type: 'CONFIDENCE_DOWN',
      fields: ['confidence'],
      note: `Observation confidence decreased by ${Math.round(Math.abs(delta))} points.`,
    };
  }

  if (fields.length > 0) {
    const uncertaintyTransition =
      (!CONCLUSIVE.has(before.status) || !CONCLUSIVE.has(after.status)) &&
      before.status !== after.status;

    return {
      type: 'CHANGED',
      fields,
      note: uncertaintyTransition
        ? 'The observation changed, but at least one snapshot is inconclusive. Review evidence before treating this as a real account-state change.'
        : 'Material public observation fields changed between collection snapshots.',
    };
  }

  return {
    type: 'UNCHANGED',
    fields: [],
    note: 'No material difference detected between snapshots.',
  };
}

export function diffCollections(
  before: CaseCollectionSnapshot,
  after: CaseCollectionSnapshot
): DiffIntelligenceReport {
  const beforeMap = new Map(before.results.map((item) => [item.platformId, item]));
  const afterMap = new Map(after.results.map((item) => [item.platformId, item]));
  const ids = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort();

  const entries: DiffEntry[] = ids.map((platformId) => {
    const oldResult = beforeMap.get(platformId);
    const newResult = afterMap.get(platformId);
    const classified = classify(oldResult, newResult);
    const exemplar = newResult || oldResult!;

    return {
      id: `diff:${before.id}:${after.id}:${platformId}`,
      platformId,
      platformName: exemplar.platformName,
      category: exemplar.category,
      changeType: classified.type,
      beforeStatus: oldResult?.status,
      afterStatus: newResult?.status,
      beforeConfidence: confidence(oldResult),
      afterConfidence: confidence(newResult),
      beforeUrl: oldResult?.url,
      afterUrl: newResult?.url,
      beforeCheckedAt: oldResult?.checkedAt,
      afterCheckedAt: newResult?.checkedAt,
      changedFields: classified.fields,
      note: classified.note,
    };
  });

  const counts: Record<DiffChangeType, number> = {
    NEW: 0,
    DISAPPEARED: 0,
    CHANGED: 0,
    UNCHANGED: 0,
    CONFIDENCE_UP: 0,
    CONFIDENCE_DOWN: 0,
  };
  entries.forEach((entry) => counts[entry.changeType]++);

  const materialChanges =
    counts.NEW +
    counts.DISAPPEARED +
    counts.CHANGED +
    counts.CONFIDENCE_UP +
    counts.CONFIDENCE_DOWN;

  return {
    fromSnapshotId: before.id,
    toSnapshotId: after.id,
    target: after.target,
    generatedAt: new Date().toISOString(),
    entries,
    counts,
    materialChanges,
    summary: materialChanges
      ? `${materialChanges} material change(s) detected across ${entries.length} platform observations.`
      : `No material change detected across ${entries.length} platform observations.`,
  };
}
