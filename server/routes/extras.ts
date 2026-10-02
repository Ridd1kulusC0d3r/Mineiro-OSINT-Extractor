import { Router } from 'express';
import { isValidCnpj, onlyDigits, summarizeBrasilApiCnpj } from '../../src/core/br';
import { dHash, avatarSimilarity } from '../../src/core/phash';
import { extractPivots, planPivots, type Pivot } from '../../src/core/pivots';
import { generateUsernameVariants } from '../../src/core/variants';
import { cdxQueryUrl, summarizeCdx } from '../../src/core/wayback';
import { getRegistryDetector } from '../../src/registry/registry';
import { matchesDetectorPattern } from '../../src/core/net';
import { PUBLIC_MODE } from '../security/middleware';
import { assertProbeableUrl, BlockedTargetError, safeFetch } from '../security/safeFetch';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

async function readLimited(response: { body: any }, maxBytes: number): Promise<Buffer> {
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) throw new Error('Image too large');
      chunks.push(value);
    }
  } finally {
    try { await reader.cancel(); } catch {}
  }
  return Buffer.concat(chunks);
}

async function decodeImage(buf: Buffer): Promise<{ data: Uint8Array; width: number; height: number }> {
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const { PNG } = await import('pngjs');
    const png = PNG.sync.read(buf);
    return { data: png.data, width: png.width, height: png.height };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const jpeg = (await import('jpeg-js')).default;
    const img = jpeg.decode(buf, { useTArray: true, maxMemoryUsageInMB: 64 });
    return { data: img.data, width: img.width, height: img.height };
  }
  throw new Error('Only PNG and JPEG avatars are supported');
}

export function extrasRouter(): Router {
  const router = Router();

  router.post('/api/osint/variants', (req, res) => {
    const handle = typeof req.body?.username === 'string' ? req.body.username : '';
    res.json({ variants: generateUsernameVariants(handle, Math.min(Number(req.body?.max) || 40, 100)) });
  });

  router.post('/api/osint/pivots', (req, res) => {
    const sources = Array.isArray(req.body?.sources) ? req.body.sources.slice(0, 200) : [];
    const candidates: Pivot[] = sources.flatMap((s: any) =>
      typeof s?.text === 'string' ? extractPivots(s.text.slice(0, 20000), String(s.origin || 'unknown').slice(0, 200), Number(s.depth) || 1) : []
    );
    const plan = planPivots(candidates, {
      maxDepth: Math.min(Number(req.body?.maxDepth) || 2, 3),
      budget: Math.min(Number(req.body?.budget) || 25, 100),
      seen: new Set(Array.isArray(req.body?.seen) ? req.body.seen.filter((v: unknown) => typeof v === 'string') : []),
    });
    res.json(plan);
  });

  router.post('/api/osint/avatar-hash', async (req, res) => {
    if (PUBLIC_MODE) return res.status(403).json({ error: 'Disabled on public instances.' });
    const { avatarUrl, compareWith } = req.body ?? {};
    if (typeof avatarUrl !== 'string') return res.status(400).json({ error: 'avatarUrl required' });
    try {
      assertProbeableUrl(avatarUrl);
      const { response } = await safeFetch(avatarUrl, { signal: AbortSignal.timeout(8000) });
      if (response.status !== 200) return res.status(502).json({ error: `Avatar returned HTTP ${response.status}` });
      const image = await decodeImage(await readLimited(response as any, MAX_IMAGE_BYTES));
      const hash = dHash(image.data, image.width, image.height);
      res.json({ hash, similarity: typeof compareWith === 'string' && compareWith.length === 16 ? avatarSimilarity(hash, compareWith) : undefined });
    } catch (err) {
      res.status(err instanceof BlockedTargetError ? 400 : 502).json({ error: (err as Error).message });
    }
  });

  // Wayback: only profile URLs a registry detector can produce are queried (the CDX host is fixed).
  router.post('/api/osint/wayback', async (req, res) => {
    const { platformId, url } = req.body ?? {};
    const detector = typeof platformId === 'string' ? getRegistryDetector(platformId) : undefined;
    if (!detector || typeof url !== 'string' || !matchesDetectorPattern(url, detector.urlPattern)) {
      return res.status(400).json({ error: 'platformId and a matching profile url are required' });
    }
    try {
      const { response } = await safeFetch(cdxQueryUrl(url), { signal: AbortSignal.timeout(15000) });
      if (response.status !== 200) return res.status(502).json({ error: `Archive returned HTTP ${response.status}` });
      res.json(summarizeCdx(await response.json()));
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
    }
  });

  router.get('/api/osint/br/cnpj/:cnpj', async (req, res) => {
    const digits = onlyDigits(req.params.cnpj);
    if (!isValidCnpj(digits)) return res.status(400).json({ error: 'Invalid CNPJ' });
    try {
      const { response } = await safeFetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, { signal: AbortSignal.timeout(10000) });
      if (response.status === 404) return res.status(404).json({ error: 'CNPJ not found' });
      if (response.status !== 200) return res.status(502).json({ error: `BrasilAPI returned HTTP ${response.status}` });
      res.json(summarizeBrasilApiCnpj(await response.json()));
    } catch (err) {
      res.status(502).json({ error: (err as Error).message });
    }
  });

  return router;
}
