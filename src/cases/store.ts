import type { CaseCollectionSnapshot, MineiroCase } from './types';
import type { GraphPivotInvestigation } from '../graph/types';

const DB_NAME = 'mineiro_cases_v1';
const DB_VERSION = 1;
const STORE = 'cases';
const MAX_COLLECTIONS_PER_CASE = 40;
const MAX_PIVOTS_PER_CASE = 40;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
        store.createIndex('primaryTarget', 'primaryTarget');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open Mineiro case database.'));
  });
}

function transactionRequest<T>(
  mode: IDBTransactionMode,
  execute: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = execute(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error('IndexedDB transaction failed.'));
    };
  }));
}

export async function listCases(): Promise<MineiroCase[]> {
  const cases = await transactionRequest<MineiroCase[]>('readonly', (store) => store.getAll());
  return (cases || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCase(caseId: string): Promise<MineiroCase | null> {
  const result = await transactionRequest<MineiroCase | undefined>('readonly', (store) => store.get(caseId));
  return result || null;
}

export async function saveCase(caseFile: MineiroCase): Promise<MineiroCase> {
  await transactionRequest<IDBValidKey>('readwrite', (store) => store.put(caseFile));
  return caseFile;
}

export async function deleteCase(caseId: string): Promise<void> {
  await transactionRequest<undefined>('readwrite', (store) => store.delete(caseId) as IDBRequest<undefined>);
}

export async function createCase(input: {
  primaryTarget: string;
  primaryTargetType: MineiroCase['primaryTargetType'];
  name?: string;
}): Promise<MineiroCase> {
  const now = new Date().toISOString();
  const clean = input.primaryTarget.trim();
  const caseFile: MineiroCase = {
    id: `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name?.trim() || clean,
    primaryTarget: clean,
    primaryTargetType: input.primaryTargetType,
    createdAt: now,
    updatedAt: now,
    collections: [],
    pivotInvestigations: [],
    tags: [],
    schemaVersion: 1,
  };
  return saveCase(caseFile);
}

export async function getOrCreateCaseForTarget(
  target: string,
  targetType: MineiroCase['primaryTargetType']
): Promise<MineiroCase> {
  const clean = target.trim().toLowerCase();
  const cases = await listCases();
  const existing = cases.find(
    (item) =>
      item.primaryTarget.toLowerCase() === clean &&
      item.primaryTargetType === targetType
  );
  return existing || createCase({ primaryTarget: target, primaryTargetType: targetType });
}

export async function appendCollection(
  caseId: string,
  snapshot: Omit<CaseCollectionSnapshot, 'caseId'>
): Promise<MineiroCase> {
  const caseFile = await getCase(caseId);
  if (!caseFile) throw new Error(`Case not found: ${caseId}`);

  const next: MineiroCase = {
    ...caseFile,
    updatedAt: snapshot.collectedAt,
    collections: [
      ...caseFile.collections.filter((item) => item.id !== snapshot.id),
      { ...snapshot, caseId },
    ]
      .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt))
      .slice(-MAX_COLLECTIONS_PER_CASE),
  };
  return saveCase(next);
}

export async function appendPivot(
  caseId: string,
  pivot: GraphPivotInvestigation
): Promise<MineiroCase> {
  const caseFile = await getCase(caseId);
  if (!caseFile) throw new Error(`Case not found: ${caseId}`);

  const next: MineiroCase = {
    ...caseFile,
    updatedAt: pivot.scannedAt,
    pivotInvestigations: [
      pivot,
      ...caseFile.pivotInvestigations.filter((item) => item.id !== pivot.id),
    ].slice(0, MAX_PIVOTS_PER_CASE),
  };
  return saveCase(next);
}

export function latestCollectionForTarget(caseFile: MineiroCase, target: string): CaseCollectionSnapshot | null {
  const clean = target.trim().toLowerCase();
  return [...caseFile.collections]
    .filter((item) => item.target.toLowerCase() === clean)
    .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0] || null;
}

export function collectionsForTarget(caseFile: MineiroCase, target: string): CaseCollectionSnapshot[] {
  const clean = target.trim().toLowerCase();
  return caseFile.collections
    .filter((item) => item.target.toLowerCase() === clean)
    .sort((a, b) => a.collectedAt.localeCompare(b.collectedAt));
}
