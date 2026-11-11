import { Router } from 'express';
import { buildStixBundle, type StixObservation } from '../../src/core/stix';
import { addClaim, addObservation, openStore, StoreValidationError, timeline, type ClaimInput, type EntityType } from '../db';
import { PUBLIC_MODE } from '../security/middleware';

const ENTITY_TYPES = new Set(['username', 'email', 'domain', 'url', 'avatar-hash', 'company']);
const PREDICATES = new Set(['same_operator_as', 'owns', 'mentions', 'linked_to']);
const MAX_CLAIM_OBSERVATIONS = 500;

/** Lists what is wrong with a claim body, so a bad request never reaches SQLite. */
function claimProblems(body: any): string[] {
  const problems: string[] = [];
  const isEntity = (v: any) => ENTITY_TYPES.has(v?.type) && typeof v?.value === 'string' && v.value.trim() !== '';
  if (!isEntity(body?.subject)) problems.push('subject must be { type, value } with a known entity type');
  if (!PREDICATES.has(body?.predicate)) problems.push(`predicate must be one of ${[...PREDICATES].join(', ')}`);
  if (!isEntity(body?.object)) problems.push('object must be { type, value } with a known entity type');
  if (typeof body?.confidence !== 'number' || !Number.isFinite(body.confidence)) problems.push('confidence must be a number');
  const ids = body?.observationIds;
  if (!Array.isArray(ids) || !ids.every((id: unknown) => Number.isSafeInteger(id) && (id as number) > 0)) {
    problems.push('observationIds must be an array of observation ids');
  } else if (ids.length > MAX_CLAIM_OBSERVATIONS) {
    problems.push(`observationIds accepts at most ${MAX_CLAIM_OBSERVATIONS} ids`);
  }
  if (body?.author !== undefined && typeof body.author !== 'string') problems.push('author must be a string');
  if (body?.note !== undefined && typeof body.note !== 'string') problems.push('note must be a string');
  return problems;
}

export function storeRouter(): Router {
  const router = Router();

  // A shared public instance must not become a database of other people's lookups.
  router.use('/api/store', (req, res, next) => {
    if (PUBLIC_MODE) return res.status(403).json({ error: 'Persistence is disabled on public instances.' });
    if (!openStore()) return res.status(503).json({ error: 'SQLite store unavailable (requires Node 22.5+).' });
    next();
  });

  router.post('/api/store/observations', (req, res, next) => {
    const items = Array.isArray(req.body?.observations) ? req.body.observations : [];
    if (items.length > 2000) return res.status(400).json({ error: 'At most 2000 observations per request.' });
    const store = openStore()!;
    const ids: number[] = [];
    store.exec('BEGIN');
    try {
      for (const item of items) {
        if (!ENTITY_TYPES.has(item?.entity?.type) || typeof item?.entity?.value !== 'string' || typeof item?.source !== 'string') {
          throw new StoreValidationError('Invalid observation shape');
        }
        ids.push(addObservation(store, item));
      }
      store.exec('COMMIT');
    } catch (err) {
      store.exec('ROLLBACK');
      if (err instanceof StoreValidationError) return res.status(400).json({ error: err.message });
      return next(err);
    }
    res.json({ stored: ids.length, ids });
  });

  router.post('/api/store/claims', (req, res, next) => {
    const problems = claimProblems(req.body);
    if (problems.length) return res.status(400).json({ error: `Invalid claim: ${problems.join('; ')}` });
    try {
      const id = addClaim(openStore()!, req.body as ClaimInput);
      res.json({ id });
    } catch (err) {
      if (err instanceof StoreValidationError) return res.status(400).json({ error: err.message });
      next(err);
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
