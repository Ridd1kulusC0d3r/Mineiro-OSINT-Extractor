import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CachedInvestigation, ScanPreset } from '../types';
import type { GraphPivotInvestigation } from '../graph/types';
import type { MineiroCase } from '../cases/types';
import type { ScanOutcome, ScanTargetType } from '../scan/engine';
import type { AddLog } from './useScanLog';
import { appendCollection, appendPivot, deleteCase as deletePersistentCase, getCase, getOrCreateCaseForTarget, listCases } from '../cases/store';
import {
  getCachedInvestigations,
  saveInvestigationToCache,
  deleteCachedInvestigation,
  clearCachedInvestigations,
  takeInvestigationSnapshot,
} from '../utils/scanStorage';

const collectionId = () => `collection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Saved investigations. Two stores, both unchanged from before the hooks existed:
 * - persistent cases in IndexedDB (`mineiro_cases_v1`, src/cases/store.ts): every completed scan and graph pivot
 *   becomes a collection snapshot of the case for its target;
 * - the compatibility cache of the last 5 scans in localStorage (`mineiro_cached_scans_v1`, src/utils/scanStorage.ts).
 */
export function useCases(addLog: AddLog) {
  const [cachedScans, setCachedScans] = useState<CachedInvestigation[]>(() => getCachedInvestigations());
  const [persistentCases, setPersistentCases] = useState<MineiroCase[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const currentCase = useMemo(
    () => persistentCases.find((item) => item.id === currentCaseId) || null,
    [persistentCases, currentCaseId]
  );

  const refreshPersistentCases = useCallback(async () => {
    try {
      const cases = await listCases();
      setPersistentCases(cases);
      return cases;
    } catch (error) {
      console.warn('[MINEIRO CASES] Failed to load IndexedDB cases:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    refreshPersistentCases();
  }, [refreshPersistentCases]);

  const ensureCaseForTarget = async (caseTarget: string, caseTargetType: ScanTargetType): Promise<MineiroCase> => {
    if (currentCaseId) {
      const attached = await getCase(currentCaseId);
      if (
        attached &&
        attached.primaryTarget.toLowerCase() === caseTarget.trim().toLowerCase() &&
        attached.primaryTargetType === caseTargetType
      ) {
        return attached;
      }
    }

    const caseFile = await getOrCreateCaseForTarget(caseTarget, caseTargetType);
    setCurrentCaseId(caseFile.id);
    await refreshPersistentCases();
    return caseFile;
  };

  /** After a completed single scan: cache slot, case collection and local integrity snapshot. */
  const persistScan = async (target: string, targetType: ScanTargetType, preset: ScanPreset, outcome: ScanOutcome) => {
    const updatedCache = saveInvestigationToCache({
      target,
      targetType,
      results: outcome.results,
      emailData: outcome.emailData,
      aiProfile: null,
      preset,
      foundCount: outcome.foundCount,
      uncertainCount: outcome.uncertainCount,
      totalScanned: outcome.totalScanned,
    });
    setCachedScans(updatedCache);
    addLog(`[CACHE] Investigation persisted to localStorage (Slot ${Math.min(updatedCache.length, 5)}/5)`, 'info');

    // Persist the collection as an immutable-ish Case snapshot in IndexedDB.
    try {
      const caseFile = await ensureCaseForTarget(target, targetType);
      await appendCollection(caseFile.id, {
        id: collectionId(),
        target,
        targetType,
        collectedAt: new Date().toISOString(),
        preset,
        results: outcome.results,
        emailData: outcome.emailData,
        foundCount: outcome.foundCount,
        uncertainCount: outcome.uncertainCount,
        totalScanned: outcome.totalScanned,
      });
      setCurrentCaseId(caseFile.id);
      await refreshPersistentCases();
      addLog(`[CASE] Collection appended to ${caseFile.id}. Diff Intelligence is available after the second snapshot for this target.`, 'success');
    } catch (caseError: any) {
      addLog(`[CASE] Persistent case write failed: ${caseError?.message || caseError}`, 'warn');
    }

    // Generate cryptographically signed snapshot for chain of custody
    try {
      const snapshot = await takeInvestigationSnapshot({
        target,
        targetType,
        results: outcome.results,
        emailData: outcome.emailData,
        aiProfile: null,
        preset,
        foundCount: outcome.foundCount,
        uncertainCount: outcome.uncertainCount,
        totalScanned: outcome.totalScanned,
      });
      setCachedScans(getCachedInvestigations());
      addLog(`[SNAPSHOT] Local integrity snapshot generated: ${snapshot.snapshotId} (SHA-256: ${snapshot.summaryHash.slice(0, 10)}...)`, 'success');
    } catch (snapErr) {
      console.warn('Could not auto-generate snapshot:', snapErr);
    }
  };

  /**
   * After a graph pivot: cache slot for the pivot handle, then the pivot and its collection inside the case that is
   * open (or the case of the source target).
   */
  const persistPivot = async (
    investigation: GraphPivotInvestigation,
    source: { target: string; targetType: ScanTargetType },
    preset: ScanPreset,
  ) => {
    const updatedCache = saveInvestigationToCache({
      target: investigation.target,
      targetType: 'username',
      results: investigation.results,
      emailData: null,
      aiProfile: null,
      preset,
      foundCount: investigation.foundCount,
      uncertainCount: investigation.uncertainCount,
      totalScanned: investigation.totalScanned,
    });
    setCachedScans(updatedCache);

    try {
      const attachedCase = currentCaseId ? await getCase(currentCaseId) : null;
      const caseFile = attachedCase || await getOrCreateCaseForTarget(source.target || investigation.target, source.target ? source.targetType : 'username');
      await appendPivot(caseFile.id, investigation);
      await appendCollection(caseFile.id, {
        id: collectionId(),
        target: investigation.target,
        targetType: 'username',
        collectedAt: investigation.scannedAt,
        preset,
        results: investigation.results,
        emailData: null,
        foundCount: investigation.foundCount,
        uncertainCount: investigation.uncertainCount,
        totalScanned: investigation.totalScanned,
      });
      setCurrentCaseId(caseFile.id);
      await refreshPersistentCases();
      addLog(`[CASE GRAPH] Pivot @${investigation.target} persisted inside ${caseFile.id}.`, 'success');
    } catch (caseError: any) {
      addLog(`[CASE GRAPH] Could not persist pivot: ${caseError?.message || caseError}`, 'warn');
    }
  };

  const deleteCase = async (caseId: string) => {
    await deletePersistentCase(caseId);
    if (currentCaseId === caseId) setCurrentCaseId(null);
    await refreshPersistentCases();
    addLog(`[CASE] Deleted persistent case ${caseId} from IndexedDB.`, 'info');
  };

  const deleteCached = (id: string) => {
    setCachedScans(deleteCachedInvestigation(id));
    addLog('[CACHE] Investigation removed from localStorage cache.', 'info');
  };

  const clearCached = () => {
    clearCachedInvestigations();
    setCachedScans([]);
    addLog('[CACHE] Cleared all local storage investigation history.', 'info');
  };

  /** The three most recently updated cases, for the start screen. */
  const recentCases = useMemo(
    () => [...persistentCases].sort((x, y) => y.updatedAt.localeCompare(x.updatedAt)).slice(0, 3),
    [persistentCases]
  );

  return {
    cachedScans,
    persistentCases,
    recentCases,
    currentCaseId,
    currentCase,
    setCurrentCaseId,
    persistScan,
    persistPivot,
    deleteCase,
    deleteCached,
    clearCached,
  };
}

export type Cases = ReturnType<typeof useCases>;
