// Local persistence (node:sqlite, no native dependency).
// Model: Entity (what we look at) -> Observation (what a source showed, with evidence hash)
//        -> Claim (analyst/system hypothesis linking entities, always referencing observations).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// node:sqlite is experimental in Node 22; load lazily so the app still boots (without persistence) if it is missing.
type Db = {
  exec(sql: string): void;
  prepare(sql: string): { run(...a: any[]): any; get(...a: any[]): any; all(...a: any[]): any[] };
};

let db: Db | null = null;
let disabledReason: string | null = null;

export function openStore(file = process.env.MINEIRO_DB || path.join(process.cwd(), 'data', 'mineiro.sqlite')): Db | null {
  if (db || disabledReason) return db;
  try {
    const { DatabaseSync } = createRequire(path.join(process.cwd(), 'noop.js'))('node:sqlite');
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    db = new DatabaseSync(file) as Db;
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS entities (
        id INTEGER PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('username','email','domain','url','avatar-hash','company')),
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (type, value)
      );
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY,
        entity_id INTEGER NOT NULL REFERENCES entities(id),
        source TEXT NOT NULL,
        detector_id TEXT,
        detector_version TEXT,
        status TEXT NOT NULL,
        confidence INTEGER,
        url TEXT,
        evidence_hash TEXT,
        collected_at TEXT NOT NULL,
        raw_json TEXT
      );
      CREATE INDEX IF NOT EXISTS obs_entity ON observations(entity_id, collected_at);
      CREATE INDEX IF NOT EXISTS obs_hash ON observations(evidence_hash);
      CREATE TABLE IF NOT EXISTS claims (
        id INTEGER PRIMARY KEY,
        subject_id INTEGER NOT NULL REFERENCES entities(id),
        predicate TEXT NOT NULL,
        object_id INTEGER NOT NULL REFERENCES entities(id),
        confidence INTEGER NOT NULL,
        observation_ids TEXT NOT NULL,
        author TEXT NOT NULL DEFAULT 'system',
        note TEXT,
        created_at TEXT NOT NULL
      );
    `);
  } catch (err) {
    disabledReason = (err as Error).message;
    console.warn(`[store] persistence disabled: ${disabledReason}`);
    db = null;
  }
  return db;
}

export function closeStoreForTests() {
  db = null;
  disabledReason = null;
}

export type EntityType = 'username' | 'email' | 'domain' | 'url' | 'avatar-hash' | 'company';

export function upsertEntity(store: Db, type: EntityType, value: string): number {
  const v = value.trim().toLowerCase();
  store.prepare('INSERT OR IGNORE INTO entities (type, value, created_at) VALUES (?, ?, ?)').run(type, v, new Date().toISOString());
  return (store.prepare('SELECT id FROM entities WHERE type = ? AND value = ?').get(type, v) as { id: number }).id;
}

export interface ObservationInput {
  entity: { type: EntityType; value: string };
  source: string;
  detectorId?: string;
  detectorVersion?: string;
  status: string;
  confidence?: number;
  url?: string;
  evidenceHash?: string;
  collectedAt?: string;
  raw?: unknown;
}

export function addObservation(store: Db, input: ObservationInput): number {
  const entityId = upsertEntity(store, input.entity.type, input.entity.value);
  const result = store.prepare(
    `INSERT INTO observations (entity_id, source, detector_id, detector_version, status, confidence, url, evidence_hash, collected_at, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    entityId, input.source, input.detectorId ?? null, input.detectorVersion ?? null, input.status,
    input.confidence ?? null, input.url ?? null, input.evidenceHash ?? null,
    input.collectedAt ?? new Date().toISOString(), input.raw === undefined ? null : JSON.stringify(input.raw)
  );
  return Number(result.lastInsertRowid);
}

export interface ClaimInput {
  subject: { type: EntityType; value: string };
  predicate: 'same_operator_as' | 'owns' | 'mentions' | 'linked_to';
  object: { type: EntityType; value: string };
  confidence: number;
  observationIds: number[];
  author?: string;
  note?: string;
}

/** A claim without supporting observations is rejected: inference must always point at evidence. */
export function addClaim(store: Db, input: ClaimInput): number {
  if (!input.observationIds.length) throw new Error('A claim must reference at least one observation.');
  const known = store
    .prepare(`SELECT COUNT(*) AS n FROM observations WHERE id IN (${input.observationIds.map(() => '?').join(',')})`)
    .get(...input.observationIds) as { n: number };
  if (known.n !== new Set(input.observationIds).size) throw new Error('Claim references unknown observations.');

  const result = store.prepare(
    `INSERT INTO claims (subject_id, predicate, object_id, confidence, observation_ids, author, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    upsertEntity(store, input.subject.type, input.subject.value), input.predicate,
    upsertEntity(store, input.object.type, input.object.value),
    Math.max(0, Math.min(100, Math.round(input.confidence))), JSON.stringify(input.observationIds),
    input.author ?? 'system', input.note ?? null, new Date().toISOString()
  );
  return Number(result.lastInsertRowid);
}

export function timeline(store: Db, type: EntityType, value: string) {
  return store.prepare(
    `SELECT o.* FROM observations o JOIN entities e ON e.id = o.entity_id
     WHERE e.type = ? AND e.value = ? ORDER BY o.collected_at DESC LIMIT 1000`
  ).all(type, value.trim().toLowerCase());
}
