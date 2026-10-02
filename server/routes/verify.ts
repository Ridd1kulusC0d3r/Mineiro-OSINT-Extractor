import crypto from 'node:crypto';
import { Router } from 'express';
import { evaluateEvidence, readBodyPreview } from '../../src/core/evidence';
import { compareToBaseline, fingerprintPage, type PageFingerprint } from '../../src/core/baseline';
import { buildDetectorUrl, matchesDetectorPattern, randomControlUsername } from '../../src/core/net';
import { getRegistryDetector } from '../../src/registry/registry';
import { assertProbeableUrl, BlockedTargetError, safeFetch } from '../security/safeFetch';

const VERSION = '1.6.0';

const DEFAULT_HEADERS = {
  'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MineiroUsernameIntelligence/${VERSION}`,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

const RETRY_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.google.com/',
};

// Control fingerprints are per detector, not per target, so they are reused across scans.
const BASELINE_TTL_MS = 15 * 60_000;
const baselineCache = new Map<string, { at: number; fingerprint: PageFingerprint | null }>();

interface ProbeOutcome {
  statusCode: number;
  finalUrl: string;
  body: string;
  edgeProtected: boolean;
}

async function probe(
  url: string,
  timeoutMs: number,
  options: { method?: 'GET' | 'HEAD'; headers?: Record<string, string>; readBody?: boolean } = {}
): Promise<ProbeOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { response, finalUrl } = await safeFetch(url, {
      method: options.method,
      headers: options.headers || DEFAULT_HEADERS,
      signal: controller.signal,
    });
    const server = (response.headers.get('server') || '').toLowerCase();
    const edgeProtected = Boolean(response.headers.get('cf-ray')) || server.includes('cloudflare');
    let body = '';
    if (options.readBody) body = await readBodyPreview(response as any);
    else { try { await response.body?.cancel(); } catch {} }
    return { statusCode: response.status, finalUrl, body, edgeProtected };
  } finally {
    clearTimeout(timer);
  }
}

async function controlFingerprint(detectorId: string, urlPattern: string, timeoutMs: number): Promise<PageFingerprint | null> {
  const cached = baselineCache.get(detectorId);
  if (cached && Date.now() - cached.at < BASELINE_TTL_MS) return cached.fingerprint;

  const handle = randomControlUsername();
  let fingerprint: PageFingerprint | null = null;
  try {
    const outcome = await probe(buildDetectorUrl(urlPattern, handle), timeoutMs, { readBody: true });
    fingerprint = fingerprintPage({ status: outcome.statusCode, finalUrl: outcome.finalUrl, body: outcome.body, handle });
  } catch {
    fingerprint = null;
  }
  baselineCache.set(detectorId, { at: Date.now(), fingerprint });
  return fingerprint;
}

function evidenceHash(parts: { statusCode: number; finalUrl: string; body: string }): string {
  return crypto.createHash('sha256').update(`${parts.statusCode}\n${parts.finalUrl}\n${parts.body}`).digest('hex');
}

export function verifyRouter(): Router {
  const router = Router();

  router.post('/api/osint/verify', async (req, res) => {
    const {
      url, platformId,
      expectedStatus = 200, errorStatus = 404,
      timeoutMs, fastMode = false, scanDepth, wafRetryStrategy,
      enableEvidenceChecks = false, baseline = false,
      username = '', detectorReliability = 60,
    } = req.body ?? {};

    if (typeof url !== 'string' || typeof platformId !== 'string') {
      return res.status(400).json({ error: 'platformId and url are required' });
    }

    // The probe URL must be exactly what a registry detector can produce; arbitrary URLs are refused.
    const detector = getRegistryDetector(platformId);
    if (!detector || !detector.scannable) return res.status(400).json({ error: 'Unknown or non-scannable detector' });
    if (!matchesDetectorPattern(url, detector.urlPattern)) {
      return res.status(400).json({ error: 'URL does not match the detector pattern' });
    }
    try { assertProbeableUrl(url); } catch (err) {
      return res.status(400).json({ error: err instanceof BlockedTargetError ? err.message : 'Blocked URL' });
    }

    const depth: 'fast' | 'deep' = scanDepth === 'fast' || scanDepth === 'deep' ? scanDepth : (fastMode ? 'fast' : 'deep');
    const timeout = typeof timeoutMs === 'number'
      ? Math.min(Math.max(timeoutMs, 1000), 12000)
      : (depth === 'fast' ? 2500 : 6500);
    const retryStrategy = wafRetryStrategy || (depth === 'deep' ? 'adaptive' : 'none');
    const handle = typeof username === 'string' ? username : '';
    const wantBody = Boolean(enableEvidenceChecks || baseline);
    const started = Date.now();
    const collectedAt = new Date().toISOString();
    const base = { platformId, url, scanDepth: depth, collectedAt, detectorVersion: detector.lastVerified || 'legacy' };

    try {
      const [first, control] = await Promise.all([
        probe(url, timeout, { readBody: wantBody }),
        baseline ? controlFingerprint(platformId, detector.urlPattern, timeout) : Promise.resolve(null),
      ]);
      let outcome = first;
      const statusCode = outcome.statusCode;
      let wafRetried = false;

      const blocked = statusCode === 403 || statusCode === 429 || statusCode === 503 || outcome.edgeProtected;
      if (blocked) {
        if (depth === 'fast' || retryStrategy === 'none') {
          return res.json({
            ...base,
            status: statusCode === 429 ? 'rate_limited' : 'uncertain',
            statusCode, responseTimeMs: Date.now() - started,
            confidenceScore: statusCode === 429 ? 35 : 42,
            evidenceLevel: 'uncertain',
            evidenceSignals: [`http_status:${statusCode}`, outcome.edgeProtected ? 'edge_protection_detected' : 'request_blocked'],
            uncertainReason: outcome.edgeProtected
              ? 'Edge protection challenge (no retry in this mode)'
              : `HTTP ${statusCode} protection challenge (no retry in this mode)`,
            wafRetried: false, retryResolved: false,
          });
        }

        // Deep + adaptive: one jittered retry with a different header profile.
        await new Promise((r) => setTimeout(r, 200 + Math.floor(Math.random() * 150)));
        wafRetried = true;
        const retry = await probe(url, Math.max(timeout - (Date.now() - started), 2500), { headers: RETRY_HEADERS, readBody: wantBody });
        if (retry.statusCode !== expectedStatus && retry.statusCode !== errorStatus && retry.statusCode !== 404) {
          return res.json({
            ...base,
            status: retry.statusCode === 429 ? 'rate_limited' : 'uncertain',
            statusCode: retry.statusCode, responseTimeMs: Date.now() - started,
            confidenceScore: 45, evidenceLevel: 'uncertain',
            evidenceSignals: [`http_status:${retry.statusCode}`, 'adaptive_retry_inconclusive'],
            uncertainReason: `HTTP ${retry.statusCode} persistent protection after retry`,
            wafRetried: true, retryResolved: false, wafStrategyApplied: 'adaptive_browser_headers',
          });
        }
        outcome = retry;
      }

      const code = outcome.statusCode;
      const reliability = Number(detectorReliability);
      let found = false;
      let confidenceScore = 0;
      let evidenceLevel: 'confirmed' | 'probable' | 'uncertain' | 'absent' = 'uncertain';
      let evidenceSignals = [`http_status:${code}`, code === expectedStatus ? 'expected_status_match' : 'unexpected_status'];

      const evidence = enableEvidenceChecks
        ? evaluateEvidence({
            requestedUrl: url, finalUrl: outcome.finalUrl || url, username: handle,
            statusCode: code, expectedStatus, errorStatus, body: outcome.body, edgeProtected: outcome.edgeProtected,
          })
        : null;
      if (evidence) evidenceSignals = evidence.signals;

      if (code === errorStatus || code === 404) {
        confidenceScore = Math.max(80, Math.min(98, Math.round(reliability * 0.45 + 55)));
        evidenceLevel = 'absent';
      } else if (code === expectedStatus) {
        found = true;
        const ratio = evidence ? evidence.passed / evidence.total : 0.65;
        confidenceScore = Math.max(35, Math.min(97, Math.round(reliability * 0.6 + ratio * 100 * 0.4)));
        if (evidence?.soft404) {
          found = false;
          confidenceScore = Math.min(confidenceScore, 45);
        } else {
          evidenceLevel = evidence && evidence.passed >= 6 ? 'confirmed' : 'probable';
        }
      } else {
        found = code >= 200 && code < 300;
        const ratio = evidence ? evidence.passed / evidence.total : 0.5;
        confidenceScore = Math.max(30, Math.min(85, Math.round(reliability * 0.55 + ratio * 100 * 0.45)));
      }

      // Differential baseline: compare with a profile that cannot exist.
      let baselineSimilarity: number | undefined;
      if (baseline && code === expectedStatus) {
        const target = fingerprintPage({ status: code, finalUrl: outcome.finalUrl, body: outcome.body, handle });
        const verdict = compareToBaseline(target, control);
        baselineSimilarity = verdict.similarity;
        evidenceSignals = [...evidenceSignals, ...verdict.signals];
        if (verdict.relation === 'same') {
          found = false;
          evidenceLevel = 'absent';
          confidenceScore = Math.max(80, Math.min(95, Math.round(reliability * 0.3 + 62)));
        } else if (verdict.relation === 'different' && found) {
          confidenceScore = Math.min(97, confidenceScore + 8);
          if (evidenceLevel === 'probable' && (!evidence || evidence.passed >= 5)) evidenceLevel = 'confirmed';
        }
      }

      return res.json({
        ...base,
        status: evidenceLevel === 'uncertain' && found ? 'uncertain' : (found ? 'found' : 'not_found'),
        statusCode: code,
        responseTimeMs: Date.now() - started,
        confidenceScore,
        detectorReliability: reliability,
        evidenceLevel,
        evidenceSignals,
        evidenceChecksPassed: evidence?.passed,
        evidenceChecksTotal: evidence?.total,
        baselineSimilarity,
        evidenceHash: wantBody ? evidenceHash({ statusCode: code, finalUrl: outcome.finalUrl, body: outcome.body }) : undefined,
        wafRetried, retryResolved: wafRetried,
        wafStrategyApplied: wafRetried ? 'adaptive_browser_headers' : undefined,
      });
    } catch (err: any) {
      const timedOut = err?.name === 'AbortError';
      if (err instanceof BlockedTargetError) return res.status(400).json({ error: err.message });
      return res.json({
        ...base,
        status: timedOut ? 'uncertain' : 'error',
        statusCode: timedOut ? 408 : 0,
        responseTimeMs: Date.now() - started,
        confidenceScore: timedOut ? 40 : 10,
        uncertainReason: timedOut ? `Timed out at ${timeout}ms (${depth} mode)` : undefined,
        wafRetried: false, retryResolved: false,
        error: err?.cause?.message || err?.message || 'Request failed',
      });
    }
  });

  return router;
}
