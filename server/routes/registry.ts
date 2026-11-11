import { Router } from 'express';
import { benchmarkRegistry } from '../../src/registry/bench';
import { getRegistryStats, MINEIRO_REGISTRY } from '../../src/registry/registry';
import { PUBLIC_MODE } from '../security/middleware';

export function registryRouter(): Router {
  const router = Router();

  // Health check
  router.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Mineiro Username Intelligence · OSINT Investigation Workbench',
      version: '1.7.0',
      timestamp: new Date().toISOString(),
      geminiConfigured: !PUBLIC_MODE && Boolean(process.env.GEMINI_API_KEY),
      publicMode: PUBLIC_MODE,
      supportedDatabases: ['Mineiro Core (local direct probes)', 'Mineiro Evidence Engine', 'Mineiro Public Recon'],
    });
  });

  // Mineiro Registry metadata API
  router.get('/api/registry/stats', (req, res) => {
    res.json(getRegistryStats());
  });

  router.get('/api/registry/detectors', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const tier = typeof req.query.tier === 'string' ? req.query.tier : undefined;
    const provenance = typeof req.query.provenance === 'string' ? req.query.provenance : undefined;

    const filtered = MINEIRO_REGISTRY.filter((detector) => {
      if (category && detector.category !== category) return false;
      if (tier && detector.reliabilityTier !== tier) return false;
      if (provenance && detector.provenanceStatus !== provenance) return false;
      return true;
    });

    res.json({
      count: filtered.length,
      detectors: filtered,
    });
  });

  router.post('/api/registry/benchmark', (req, res) => {
    const observations = Array.isArray(req.body?.observations) ? req.body.observations : [];
    if (observations.length > 10000) {
      return res.status(400).json({ error: 'Maximum 10,000 benchmark observations per request' });
    }

    const requestedIds = Array.isArray(req.body?.detectorIds)
      ? req.body.detectorIds.filter((id: unknown) => typeof id === 'string')
      : MINEIRO_REGISTRY.map((detector) => detector.id);

    const validIds = requestedIds.filter((id: string) =>
      MINEIRO_REGISTRY.some((detector) => detector.id === id)
    );

    res.json({
      detectors: validIds.length,
      observations: observations.length,
      metrics: benchmarkRegistry(validIds, observations),
    });
  });

  return router;
}
