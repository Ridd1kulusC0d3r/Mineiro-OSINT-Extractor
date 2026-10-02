import { Router } from 'express';
import { buildStixBundle, type StixObservation } from '../../src/core/stix';
import { addClaim, addObservation, openStore, timeline, type EntityType } from '../db';
import { PUBLIC_MODE } from '../security/middleware';

const ENTITY_TYPES = new Set(['username', 'email', 'domain', 'url', 'avatar-hash', 'company']);

export function storeRouter(): Router {
  const router = Router();

  // A shared public instance must not become a database of other people's lookups.
  router.use('/api/store', (req, res, next) => {
    if (PUBLIC_MODE) return res.status(403).json({ error: 'Persistence is disabled on public instances.' });
    if (!openStore()) return res.status(503).json({ error: 'SQLite store unavailable (requires Node 22.5+).' });
    next();
  });

  router.post('/api/store/observations', (req, res) => {
    const items = Array.isArray(req.body?.observations) ? req.body.observations : [];
    if (items.length > 2000) return res.status(400).json({ error: 'At most 2000 observations per request.' });
    const store = openStore()!;
    const ids: number[] = [];
    store.exec('BEGIN');
    try {
      for (const item of items) {
        if (!ENTITY_TYPES.has(item?.entity?.type) || typeof item?.entity?.value !== 'string' || typeof item?.source !== 'string') {
          throw new Error('Invalid observation shape');
        }
        ids.push(addObservation(store, item));
      }
      store.exec('COMMIT');
    } catch (err) {
      store.exec('ROLLBACK');
      return res.status(400).json({ error: (err as Error).message });
    }
    res.json({ stored: ids.length, ids });
  });

  router.post('/api/store/claims', (req, res) => {
    try {
      const id = addClaim(openStore()!, req.body);
      res.json({ id });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  router.get('/api/store/timeline', (req, res) => {
    const type = String(req.query.type || 'username') as EntityType;
    if (!ENTITY_TYPES.has(type) || typeof req.query.value !== 'string') return res.status(400).json({ error: 'type and value required' });
    res.json({ observations: timeline(openStore()!, type, req.query.value) });
  });

  router.get('/api/store/export/stix', (req, res) => {
    const value = typeof req.query.username === 'string' ? req.query.username : '';
    if (!value) return res.status(400).json({ error: 'username required' });
    const rows = timeline(openStore()!, 'username', value) as any[];
    const observations: StixObservation[] = rows
      .filter((r) => r.detector_id)
      .map((r) => ({
        detectorId: r.detector_id, platform: r.source, url: r.url ?? '', username: value, status: r.status,
        confidence: r.confidence ?? 0, collectedAt: r.collected_at, evidenceHash: r.evidence_hash ?? undefined,
        detectorVersion: r.detector_version ?? undefined,
      }));
    res.setHeader('Content-Disposition', `attachment; filename="mineiro-${value}.stix.json"`);
    res.json(buildStixBundle(value, observations));
  });

  return router;
}
