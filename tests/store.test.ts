import { beforeAll, describe, expect, it } from 'vitest';
import { addClaim, addObservation, closeStoreForTests, openStore, timeline } from '../server/db';

let store: NonNullable<ReturnType<typeof openStore>>;

beforeAll(() => {
  closeStoreForTests();
  store = openStore(':memory:')!;
});

describe('store', () => {
  it('persists observations with evidence hashes and returns a timeline', () => {
    const id = addObservation(store, {
      entity: { type: 'username', value: 'Ben' }, source: 'DEV', detectorId: 'devto', status: 'found',
      confidence: 88, url: 'https://dev.to/ben', evidenceHash: 'abc123', collectedAt: '2026-10-02T00:00:00Z',
    });
    expect(id).toBeGreaterThan(0);
    const rows = timeline(store, 'username', 'BEN') as any[];
    expect(rows).toHaveLength(1);
    expect(rows[0].evidence_hash).toBe('abc123');
  });

  it('rejects claims without evidence and claims pointing at unknown observations', () => {
    const base = { subject: { type: 'username' as const, value: 'ben' }, predicate: 'same_operator_as' as const, object: { type: 'username' as const, value: 'ben_dev' }, confidence: 60 };
    expect(() => addClaim(store, { ...base, observationIds: [] })).toThrow(/at least one observation/);
    expect(() => addClaim(store, { ...base, observationIds: [9999] })).toThrow(/unknown observations/);
  });

  it('accepts claims that cite real observations', () => {
    const obs = addObservation(store, { entity: { type: 'username', value: 'ben_dev' }, source: 'Keybase', status: 'found' });
    const claim = addClaim(store, {
      subject: { type: 'username', value: 'ben' }, predicate: 'linked_to', object: { type: 'username', value: 'ben_dev' },
      confidence: 150, observationIds: [obs],
    });
    const row = store.prepare('SELECT confidence FROM claims WHERE id = ?').get(claim) as { confidence: number };
    expect(row.confidence).toBe(100); // clamped
  });
});
