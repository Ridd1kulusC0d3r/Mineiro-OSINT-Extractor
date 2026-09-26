import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import dns from 'dns/promises';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { extractPlatformSignals } from './src/data/platformSignalExtractor';
import { computeBehavioralProfile } from './src/data/behavioralEngine';
import { evaluateThreatActorHeuristics } from './src/data/threatActorHeuristics';
import { getRegistryStats, MINEIRO_REGISTRY } from './src/registry/registry';
import { benchmarkRegistry } from './src/registry/bench';
import { buildAnalystCopilotPrompt } from './src/ai/analystCopilot';


const TERMINAL_BANNER = `\n+------------------------------------------------------------------+\n|                                                                  |\n|   M   M  I  N   N  EEEEE  I  RRRR    OOO                       |\n|   MM MM  I  NN  N  E      I  R   R  O   O                      |\n|   M M M  I  N N N  EEEE   I  RRRR   O   O                      |\n|   M   M  I  N  NN  E      I  R  R   O   O                      |\n|   M   M  I  N   N  EEEEE  I  R   R   OOO                       |\n|                                                                  |\n|                USERNAME EXTRACTOR // OSINT                       |\n|                                                                  |\n|   [ probe ] -> [ classify ] -> [ correlate ] -> [ export ]      |\n|                                                                  |\n|   public signals only  |  evidence over assumptions              |\n+------------------------------------------------------------------+\n`;
const app = express();
const PORT = Number(process.env.PORT || 3000);


const EVIDENCE_CHECK_IDS = [
  'status_expected',
  'absence_status',
  'redirect_consistency',
  'username_final_url',
  'username_body',
  'canonical_match',
  'soft_404',
  'edge_protection',
] as const;

async function readBodyPreview(response: Response, maxBytes = 192 * 1024): Promise<string> {
  const type = response.headers.get('content-type') || '';
  if (!/text|html|json|xml/i.test(type) || !response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      const remaining = maxBytes - total;
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
      if (total >= maxBytes) break;
    }
  } finally {
    try { await reader.cancel(); } catch {}
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

function evaluateEvidence(input: {
  requestedUrl: string;
  finalUrl: string;
  username?: string;
  statusCode: number;
  expectedStatus: number;
  errorStatus: number;
  body: string;
  edgeProtected: boolean;
}) {
  const { requestedUrl, finalUrl, username = '', statusCode, expectedStatus, errorStatus, body, edgeProtected } = input;
  const bodyLower = body.toLowerCase();
  const usernameLower = username.trim().toLowerCase();
  const finalLower = finalUrl.toLowerCase();
  const requested = new URL(requestedUrl);
  const final = new URL(finalUrl);

  const soft404Hints = [
    'page not found', 'user not found', 'profile not found',
    'does not exist', "doesn't exist", 'no such user', '>404<'
  ];
  const soft404 = soft404Hints.some((hint) => bodyLower.includes(hint));

  const canonicalMatch = (() => {
    const match = body.match(/<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["']/i)
      || body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["']/i);
    if (!match) return false;
    try {
      const canonical = new URL(match[1], finalUrl);
      return canonical.hostname === final.hostname
        && (!usernameLower || canonical.href.toLowerCase().includes(encodeURIComponent(usernameLower)));
    } catch {
      return false;
    }
  })();

  const checks = [
    { id: 'status_expected', pass: statusCode === expectedStatus, signal: `http_status:${statusCode}` },
    { id: 'absence_status', pass: statusCode === errorStatus || statusCode === 404, signal: statusCode === errorStatus || statusCode === 404 ? 'explicit_absence_status' : 'absence_status_not_observed' },
    { id: 'redirect_consistency', pass: requested.hostname === final.hostname || final.hostname.endsWith(`.${requested.hostname}`) || requested.hostname.endsWith(`.${final.hostname}`), signal: requested.href === final.href ? 'no_redirect' : `final_host:${final.hostname}` },
    { id: 'username_final_url', pass: Boolean(usernameLower && finalLower.includes(encodeURIComponent(usernameLower))), signal: usernameLower && finalLower.includes(encodeURIComponent(usernameLower)) ? 'username_in_final_url' : 'username_not_in_final_url' },
    { id: 'username_body', pass: Boolean(usernameLower && bodyLower.includes(usernameLower)), signal: usernameLower && bodyLower.includes(usernameLower) ? 'username_token_in_body' : 'username_token_not_observed' },
    { id: 'canonical_match', pass: canonicalMatch, signal: canonicalMatch ? 'canonical_consistent' : 'canonical_not_confirmed' },
    { id: 'soft_404', pass: !soft404, signal: soft404 ? 'soft_404_hint_detected' : 'no_soft_404_hint' },
    { id: 'edge_protection', pass: !edgeProtected, signal: edgeProtected ? 'edge_protection_detected' : 'no_edge_protection_signal' },
  ];

  return {
    checks,
    passed: checks.filter((c) => c.pass).length,
    total: checks.length,
    signals: checks.map((c) => c.signal),
    soft404,
  };
}

app.use(express.json());

// Initialize GoogleGenAI client lazily or safely with User-Agent telemetry
function getGenAiClient(customApiKey?: string): { client: GoogleGenAI; isCustom: boolean } | null {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim().length > 10)
    ? customApiKey.trim()
    : process.env.GEMINI_API_KEY;

  if (!apiKey) return null;
  return {
    client: new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'mineiro-username-extractor/1.4.1',
        },
      },
    }),
    isCustom: Boolean(customApiKey && customApiKey.trim().length > 10),
  };
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mineiro Username Extractor Unified OSINT Engine',
    version: '1.4.1',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    supportedDatabases: ['Mineiro Core (local direct probes)', 'Mineiro Username Extractor WAF Guard', 'Mineiro Username Extractor DNS & Email Recon'],
  });
});


// Mineiro Registry metadata API
app.get('/api/registry/stats', (req, res) => {
  res.json(getRegistryStats());
});

app.get('/api/registry/detectors', (req, res) => {
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

app.post('/api/registry/benchmark', (req, res) => {
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

// Real-time URL verification for OSINT checks (handling CORS & uncertainty model for WAF/TLS)
app.post('/api/osint/verify', async (req, res) => {
  const { 
    url, 
    platformId, 
    expectedStatus = 200, 
    errorStatus = 404,
    timeoutMs,
    fastMode = false,
    scanDepth,
    wafRetryStrategy,
    enableEvidenceChecks = false,
    username = '',
    detectorReliability = 60,
  } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Valid URL is required' });
  }

  // Determine active scan depth and retry strategy
  // 'fast': 2,500ms timeout threshold, single-pass probe, zero edge-protection retries
  // 'deep': 6,500ms timeout threshold, adaptive browser-like headers + jittered retry for protected/403/429 responses
  const effectiveDepth: 'fast' | 'deep' = scanDepth 
    ? scanDepth 
    : (fastMode ? 'fast' : 'deep');

  const effectiveTimeout = timeoutMs && typeof timeoutMs === 'number'
    ? Math.min(Math.max(timeoutMs, 1000), 12000)
    : (effectiveDepth === 'fast' ? 2500 : 6500);

  const effectiveRetryStrategy = wafRetryStrategy || (effectiveDepth === 'deep' ? 'adaptive' : 'none');

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 MineiroUsernameExtractor/1.4.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    clearTimeout(timeoutId);

    const responseTimeMs = Date.now() - startTime;
    const statusCode = response.status;
    const cfRay = response.headers.get('cf-ray');
    const serverHeader = response.headers.get('server') || '';

    // Mineiro Guard model: identify protected sites (Cloudflare, TLS fingerprint challenge, WAF)
    const isCloudflareChallenge = cfRay || serverHeader.toLowerCase().includes('cloudflare');

    // Check if edge protection or rate limiting made the response inconclusive
    if (statusCode === 403 || statusCode === 429 || statusCode === 503 || isCloudflareChallenge) {
      // IF FAST MODE OR NO RETRY STRATEGY: Fail-fast immediately
      if (effectiveDepth === 'fast' || effectiveRetryStrategy === 'none') {
        return res.json({
          platformId,
          url,
          status: statusCode === 429 ? 'rate_limited' : 'uncertain',
          statusCode,
          responseTimeMs,
          confidenceScore: statusCode === 429 ? 35 : 42,
          evidenceLevel: 'uncertain',
          evidenceSignals: [`http_status:${statusCode}`, isCloudflareChallenge ? 'edge_protection_detected' : 'request_blocked'],
          uncertainReason: isCloudflareChallenge
            ? 'Mineiro Guard: Cloudflare WAF challenge (Fast mode - 0 retries)'
            : `HTTP ${statusCode} Anti-Bot Guard challenge (Fast mode - 0 retries)`,
          wafRetried: false,
          retryResolved: false,
          scanDepth: 'fast',
        });
      }

      // IF DEEP MODE & ADAPTIVE STRATEGY: Execute secondary probe with browser-compatible request headers & jittered backoff
      const remainingTime = Math.max(effectiveTimeout - (Date.now() - startTime), 2500);
      await new Promise(r => setTimeout(r, 200 + Math.floor(Math.random() * 150))); // 200-350ms jitter

      const retryController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryController.abort(), remainingTime);

      try {
        const retryResponse = await fetch(url, {
          method: 'GET',
          signal: retryController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': 'https://www.google.com/',
          },
        });
        clearTimeout(retryTimeoutId);

        const retryStatus = retryResponse.status;
        const retryRay = retryResponse.headers.get('cf-ray');
        const retryServer = retryResponse.headers.get('server') || '';
        const retryIsCf = retryRay || retryServer.toLowerCase().includes('cloudflare');

        // Retry returned the expected status
        if (retryStatus === expectedStatus) {
          return res.json({
            platformId,
            url,
            status: 'found',
            statusCode: retryStatus,
            responseTimeMs: Date.now() - startTime,
            confidenceScore: 80,
            evidenceLevel: 'probable',
            evidenceSignals: [`http_status:${retryStatus}`, 'expected_status_match', 'adaptive_retry_conclusive'],
            wafRetried: true,
            retryResolved: true,
            wafStrategyApplied: 'adaptive_browser_headers',
            scanDepth: 'deep',
          });
        }

        // Retry returned the configured absence status
        if (retryStatus === errorStatus || retryStatus === 404) {
          return res.json({
            platformId,
            url,
            status: 'not_found',
            statusCode: retryStatus,
            responseTimeMs: Date.now() - startTime,
            confidenceScore: 94,
            evidenceLevel: 'absent',
            evidenceSignals: [`http_status:${retryStatus}`, 'explicit_absence_status', 'adaptive_retry_conclusive'],
            wafRetried: true,
            retryResolved: true,
            wafStrategyApplied: 'adaptive_browser_headers',
            scanDepth: 'deep',
          });
        }

        // Still blocked after retry
        return res.json({
          platformId,
          url,
          status: retryStatus === 429 ? 'rate_limited' : 'uncertain',
          statusCode: retryStatus,
          responseTimeMs: Date.now() - startTime,
          confidenceScore: 45,
          evidenceLevel: 'uncertain',
          evidenceSignals: [`http_status:${retryStatus}`, 'adaptive_retry_inconclusive'],
          uncertainReason: retryIsCf
            ? 'Mineiro Guard: Persistent Cloudflare WAF protection after adaptive browser retry'
            : `HTTP ${retryStatus} persistent protection challenge after adaptive browser retry`,
          wafRetried: true,
          retryResolved: false,
          wafStrategyApplied: 'adaptive_browser_headers',
          scanDepth: 'deep',
        });
      } catch (retryErr: any) {
        clearTimeout(retryTimeoutId);
        const retryIsTimeout = retryErr.name === 'AbortError';
        return res.json({
          platformId,
          url,
          status: 'uncertain',
          statusCode: retryIsTimeout ? 408 : statusCode,
          responseTimeMs: Date.now() - startTime,
          confidenceScore: 40,
          uncertainReason: retryIsTimeout
            ? `Deep scan timeout reached threshold (${effectiveTimeout}ms) during adaptive retry`
            : `Adaptive WAF retry network exception: ${retryErr.message}`,
          wafRetried: true,
          retryResolved: false,
          wafStrategyApplied: 'adaptive_browser_headers',
          scanDepth: 'deep',
        });
      }
    }

    let found = false;
    let confidenceScore = 0;
    let evidenceLevel: 'confirmed' | 'probable' | 'uncertain' | 'absent' = 'uncertain';
    let evidenceSignals = [
      `http_status:${statusCode}`,
      statusCode === expectedStatus ? 'expected_status_match' : 'unexpected_status',
    ];
    let evidenceChecksPassed: number | undefined;
    let evidenceChecksTotal: number | undefined;

    let evidence: ReturnType<typeof evaluateEvidence> | null = null;
    if (enableEvidenceChecks) {
      const body = await readBodyPreview(response);
      evidence = evaluateEvidence({
        requestedUrl: url,
        finalUrl: response.url || url,
        username,
        statusCode,
        expectedStatus,
        errorStatus,
        body,
        edgeProtected: Boolean(isCloudflareChallenge),
      });
      evidenceSignals = evidence.signals;
      evidenceChecksPassed = evidence.passed;
      evidenceChecksTotal = evidence.total;
    } else {
      try { await response.body?.cancel(); } catch {}
    }

    if (statusCode === errorStatus || statusCode === 404) {
      found = false;
      confidenceScore = Math.max(80, Math.min(98, Math.round((Number(detectorReliability) * 0.45) + 55)));
      evidenceLevel = 'absent';
    } else if (statusCode === expectedStatus) {
      found = true;
      const evidenceRatio = evidence ? evidence.passed / evidence.total : 0.65;
      confidenceScore = Math.max(35, Math.min(97,
        Math.round((Number(detectorReliability) * 0.6) + (evidenceRatio * 100 * 0.4))
      ));
      if (evidence?.soft404) {
        found = false;
        confidenceScore = Math.min(confidenceScore, 45);
        evidenceLevel = 'uncertain';
      } else {
        evidenceLevel = enableEvidenceChecks && evidence && evidence.passed >= 6 ? 'confirmed' : 'probable';
      }
    } else {
      found = statusCode >= 200 && statusCode < 300;
      const evidenceRatio = evidence ? evidence.passed / evidence.total : 0.5;
      confidenceScore = Math.max(30, Math.min(85,
        Math.round((Number(detectorReliability) * 0.55) + (evidenceRatio * 100 * 0.45))
      ));
      evidenceLevel = 'uncertain';
    }

    return res.json({
      platformId,
      url,
      status: evidenceLevel === 'uncertain' && found ? 'uncertain' : (found ? 'found' : 'not_found'),
      statusCode,
      responseTimeMs,
      confidenceScore,
      detectorReliability: Number(detectorReliability),
      evidenceLevel,
      evidenceSignals,
      evidenceChecksPassed,
      evidenceChecksTotal,
      wafRetried: false,
      retryResolved: false,
      scanDepth: effectiveDepth,
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';

    // In Deep mode, if initial probe timed out, attempt a secondary lightweight retry if time permits
    if (isTimeout && effectiveDepth === 'deep' && effectiveRetryStrategy === 'adaptive') {
      try {
        const fallbackController = new AbortController();
        const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 2000);
        const fallbackResponse = await fetch(url, {
          method: 'HEAD',
          signal: fallbackController.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
          },
        });
        clearTimeout(fallbackTimeoutId);
        const fallbackStatus = fallbackResponse.status;
        if (fallbackStatus === expectedStatus) {
          return res.json({
            platformId,
            url,
            status: 'found',
            statusCode: fallbackStatus,
            responseTimeMs: Date.now() - startTime,
            confidenceScore: 88,
            wafRetried: true,
            retryResolved: true,
            wafStrategyApplied: 'head_fallback_after_timeout',
            scanDepth: 'deep',
          });
        }
      } catch {
        // Fallback also failed or timed out
      }
    }

    return res.json({
      platformId,
      url,
      status: isTimeout ? 'uncertain' : 'error',
      statusCode: isTimeout ? 408 : 0,
      responseTimeMs,
      confidenceScore: isTimeout ? 40 : 10,
      uncertainReason: isTimeout 
        ? `Connection timed out at ${effectiveTimeout}ms threshold (${effectiveDepth.toUpperCase()} mode)`
        : undefined,
      wafRetried: isTimeout && effectiveDepth === 'deep',
      retryResolved: false,
      scanDepth: effectiveDepth,
      error: err.message || 'Request failed',
    });
  }
});

// Email reconnaissance endpoint (MX records, Gravatar, Provider heuristics)
app.post('/api/osint/email-recon', async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const [username, domain] = cleanEmail.split('@');

  // Calculate Gravatar MD5 hash
  const hash = crypto.createHash('md5').update(cleanEmail).digest('hex');

  // Check MX records via DNS
  let mxRecordsFound = false;
  let mxServers: string[] = [];
  try {
    const records = await dns.resolveMx(domain);
    if (records && records.length > 0) {
      mxRecordsFound = true;
      mxServers = records.map(r => r.exchange);
    }
  } catch (e) {
    mxRecordsFound = false;
  }

  // Check Gravatar existence
  let gravatarExists = false;
  let gravatarAvatarUrl = `https://www.gravatar.com/avatar/${hash}?d=404&s=256`;
  try {
    const gravatarRes = await fetch(gravatarAvatarUrl, { method: 'HEAD' });
    if (gravatarRes.status === 200) {
      gravatarExists = true;
    }
  } catch {
    gravatarExists = false;
  }

  // Disposable domain checks
  const disposableDomains = [
    'mailinator.com', '10minutemail.com', 'tempmail.com', 'guerrillamail.com',
    'trashmail.com', 'sharklasers.com', 'yopmail.com', 'getairmail.com'
  ];
  const isDisposable = disposableDomains.some(d => domain.includes(d));

  // Common provider checks
  const commonProviders = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'proton.me', 'protonmail.com', 'icloud.com'];
  const isCommonProvider = commonProviders.includes(domain);

  // Footprint hints based on domain and provider
  const associatedFootprint: string[] = [];
  if (mxRecordsFound) {
    if (mxServers.some(s => s.includes('google') || s.includes('l.google.com'))) {
      associatedFootprint.push('Google Workspace / Gmail Infrastructure');
    }
    if (mxServers.some(s => s.includes('outlook') || s.includes('protection.outlook.com'))) {
      associatedFootprint.push('Microsoft 365 / Exchange Online');
    }
    if (mxServers.some(s => s.includes('protonmail') || s.includes('proton.me'))) {
      associatedFootprint.push('ProtonMail End-to-End Encrypted Service');
    }
  }

  if (gravatarExists) {
    associatedFootprint.push('Automattic / Gravatar Verified Profile');
  }

  return res.json({
    email: cleanEmail,
    username,
    domain,
    isValidSyntax: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail),
    isDisposable,
    isCommonProvider,
    mxRecordsFound,
    mxServers,
    gravatarExists,
    gravatarAvatarUrl: gravatarExists ? gravatarAvatarUrl : undefined,
    hash,
    associatedFootprint,
  });
});

// Helper function to extract and parse JSON cleanly
function parseCleanJson(text: string): any {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
}

// Timeout helper to avoid uncomfortably long blocking calls on model backend spikes
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Model request timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Resilient Gemini generateContent with cascading models and backoff retries for 503 / high demand spikes
async function generateDossierWithGemini(
  aiClient: GoogleGenAI,
  prompt: string,
  preferredModel?: string
): Promise<{ data: any; modelUsed: string; quotaExceeded?: boolean } | null> {
  // Modern supported models from @google/genai guidelines - prioritizing gemini-3.8-flash for stability and speed
  const modernModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

  // Filter out any deprecated models
  const deprecated = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'];
  const cleanPreferred = preferredModel && !deprecated.includes(preferredModel.trim())
    ? preferredModel.trim()
    : 'gemini-3.8-flash';

  const candidateModels = [cleanPreferred, ...modernModels].filter((v, i, a) => a.indexOf(v) === i);
  let quotaExceeded = false;

  for (const model of candidateModels) {
    try {
      const response: any = await withTimeout(
        aiClient.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
        10000
      );

      const rawText = response.text || '';
      if (rawText) {
        const parsed = parseCleanJson(rawText);
        if (parsed && (parsed.summary || parsed.archetype)) {
          return { data: parsed, modelUsed: model };
        }
      }
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isDemandSpike = errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('high demand') || errMsg.includes('timed out');
      const isRateLimited = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('exceeded your current quota');

      if (isRateLimited) {
        quotaExceeded = true;
      }

      console.log(`[Gemini Engine] Candidate '${model}' unavailable (${isDemandSpike ? '503 demand/timeout' : isRateLimited ? '429 rate limit' : 'error'}). Seamlessly cascading to next candidate...`);
      // Immediately cascade to next candidate without blocking delay
      continue;
    }
  }

  return quotaExceeded ? { data: null, modelUsed: 'quota-exceeded', quotaExceeded: true } : null;
}

// Endpoint to validate a personal Gemini API key or check system key status
app.post('/api/osint/gemini-validate', async (req, res) => {
  const customKey = req.body.apiKey || (req.headers['x-gemini-api-key'] as string);
  const deprecated = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'];
  const selectedModel = req.body.model && !deprecated.includes(req.body.model.trim())
    ? req.body.model.trim()
    : 'gemini-3.8-flash';

  const clientInfo = getGenAiClient(customKey);
  if (!clientInfo) {
    return res.json({
      valid: false,
      isConfigured: false,
      message: 'No API key provided or found in environment.',
    });
  }

  try {
    const response = await withTimeout(
      clientInfo.client.models.generateContent({
        model: selectedModel,
        contents: 'Respond with JSON: {"status": "ok", "service": "gemini"}',
        config: { responseMimeType: 'application/json' },
      }),
      6000
    );

    return res.json({
      valid: true,
      isConfigured: true,
      isCustom: clientInfo.isCustom,
      modelTested: selectedModel,
      message: 'Gemini API key is active and responding successfully!',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(400).json({
      valid: false,
      isConfigured: true,
      isCustom: clientInfo.isCustom,
      error: err.message || 'Failed to authenticate with Gemini API',
    });
  }
});

interface ExtractedEntities {
  industry: string;
  interests: string[];
  technicalFootprint: {
    level: 'None' | 'Minimal' | 'Moderate' | 'Advanced' | 'Expert';
    isTechProfessional: boolean;
    evidence: string;
    primaryTools?: string[];
  };
}

// Pass 1: Granular entity identification for Industry, Interests, and Technical Footprint
async function evaluatePass1Entities(
  aiClient: GoogleGenAI,
  target: string,
  targetType: string,
  platformsList: string,
  categoryPercentages: Record<string, number>,
  categoryDistribution: Record<string, number>,
  emailData: any,
  preferredModel?: string
): Promise<ExtractedEntities | null> {
  const pass1Prompt = `You are the Pre-Profiling Entity Extraction Engine in Mineiro Username Extractor OSINT.
Perform PASS 1 of a multi-pass evaluation on target "${target}" (${targetType}).

Discovered Platforms & Profiles:
${platformsList}

Platform Category Breakdown:
${Object.entries(categoryPercentages)
  .filter(([_, pct]) => pct > 0)
  .map(([cat, pct]) => `- ${cat}: ${pct}% (${categoryDistribution[cat]} platform(s))`)
  .join('\n')}

Email Data:
${emailData ? JSON.stringify(emailData) : 'None'}

TASK: Identify 'Industry', 'Interests', and 'Technical Footprint' as distinct metadata entities.
CRITICAL CONSTRAINT FOR TECHNICAL FOOTPRINT:
- Carefully distinguish between true tech professionals and non-tech users (e.g. creative artists, illustrators, gamers, musicians, athletes, runners, e-commerce sellers, students, social users).
- "isTechProfessional" MUST be FALSE if the target has no verified proof of active professional software engineering or cybersecurity research. Having an account on a social platform is NOT proof of being a tech professional.
- For non-tech users, set "level" to "None" or "Minimal", "isTechProfessional" to false, and identify their authentic real-world industry (e.g., "Creative Arts & Visual Design", "Music & Audio Production", "Endurance Athletics & Fitness", "Gaming & Interactive Entertainment", "E-Commerce & Digital Merchandising", "Academic & Scientific Research").

Respond strictly in valid JSON matching this schema:
{
  "industry": string,
  "interests": string[],
  "technicalFootprint": {
    "level": "None" | "Minimal" | "Moderate" | "Advanced" | "Expert",
    "isTechProfessional": boolean,
    "evidence": string,
    "primaryTools": string[]
  }
}`;

  try {
    const res = await generateDossierWithGemini(aiClient, pass1Prompt, preferredModel);
    if (res && res.data && res.data.industry && res.data.technicalFootprint) {
      const level = ['None', 'Minimal', 'Moderate', 'Advanced', 'Expert'].includes(res.data.technicalFootprint.level)
        ? res.data.technicalFootprint.level
        : 'None';
      return {
        industry: String(res.data.industry),
        interests: Array.isArray(res.data.interests) ? res.data.interests.map(String) : [],
        technicalFootprint: {
          level,
          isTechProfessional: Boolean(res.data.technicalFootprint.isTechProfessional),
          evidence: String(res.data.technicalFootprint.evidence || ''),
          primaryTools: Array.isArray(res.data.technicalFootprint.primaryTools)
            ? res.data.technicalFootprint.primaryTools.map(String)
            : [],
        },
      };
    }
  } catch (err) {
    console.warn('[Pass 1 Entity Extraction] Fallback to baseline entities:', err);
  }
  return null;
}

// Weight entities against verified platform activity patterns to prevent false tech labeling
function weightEntitiesAgainstPatterns(
  entities: ExtractedEntities,
  foundPlatforms: any[],
  baselineBehavior: any,
  target: string
): {
  weightedEntities: ExtractedEntities;
  archetypeDirective: string;
} {
  const platformNames = new Set(foundPlatforms.map((p) => (p.platformName || '').toLowerCase()));
  const categoryCounts = baselineBehavior.categoryDistribution || {};
  const techPlatformCount = (categoryCounts.developer || 0) + (categoryCounts.security || 0);

  const hasGithub = platformNames.has('github');
  const hasGitlab = platformNames.has('gitlab');
  const hasBugBounty = platformNames.has('hackerone') || platformNames.has('bugcrowd') || platformNames.has('intigriti');
  const hasCtf = platformNames.has('hackthebox') || platformNames.has('tryhackme') || platformNames.has('ctftime');
  const lowerTarget = target.toLowerCase();
  const hasSecHandle = lowerTarget.includes('sec') || lowerTarget.includes('pwn') || lowerTarget.includes('root') || lowerTarget.includes('hack') || lowerTarget.includes('cyber');
  const hasDevHandle = lowerTarget.includes('dev') || lowerTarget.includes('code');

  const verifiedTechPresence = hasBugBounty || hasCtf || hasGithub || hasGitlab || (techPlatformCount >= 1 && (hasSecHandle || hasDevHandle));

  let isTechProfessional = entities.technicalFootprint.isTechProfessional;
  let level = entities.technicalFootprint.level;
  let evidence = entities.technicalFootprint.evidence;
  let industry = entities.industry;
  let interests = entities.interests.length > 0 ? entities.interests : baselineBehavior.interests;
  let primaryTools = entities.technicalFootprint.primaryTools && entities.technicalFootprint.primaryTools.length > 0
    ? entities.technicalFootprint.primaryTools
    : baselineBehavior.technicalFootprint.primaryTools || [];

  // STRICT CROSS-CHECK: If marked as tech professional, but 0 verified tech platforms or handle signals exist:
  if (isTechProfessional && !verifiedTechPresence) {
    isTechProfessional = false;
    level = 'Minimal';
    evidence = `Cross-examination against platform activity patterns detected 0 verified source code repositories, package distributions, or security credentials. Overriding tech classification to reflect authentic ${baselineBehavior.industry} footprint.`;
    industry = baselineBehavior.industry;
    interests = baselineBehavior.interests;
    primaryTools = baselineBehavior.technicalFootprint.primaryTools || [];
  }

  // Generate strict archetype weighting directive
  let archetypeDirective = '';
  if (!isTechProfessional) {
    archetypeDirective = `CRITICAL NON-TECH USER ENFORCEMENT:
Target is verified as a NON-TECH user in the "${industry}" sector (Technical Footprint Level: ${level}, isTechProfessional: false).
Platform activity patterns show no software development or cybersecurity participation.
You are STRICTLY FORBIDDEN from assigning any archetype, description, or skills referencing "Software Engineer", "Developer", "Programmer", "Systems Architect", "Cybersecurity Analyst", "Hacker", or "Security Researcher".
The Archetype MUST strictly reflect their authentic industry ("${industry}") and interests (${interests.join(', ')}).
Recommended Archetype alignment: "${baselineBehavior.archetype}".`;
  } else {
    archetypeDirective = `VERIFIED TECHNICAL FOOTPRINT:
Target has verified technical credentials in "${industry}" (Level: ${level}, isTechProfessional: true).
Synthesize an authentic technical archetype reflecting their verified technical sector (e.g., "${baselineBehavior.archetype}").`;
  }

  return {
    weightedEntities: {
      industry,
      interests,
      technicalFootprint: {
        level,
        isTechProfessional,
        evidence,
        primaryTools,
      },
    },
    archetypeDirective,
  };
}

// Evidence-bounded AI analyst copilot. This endpoint summarizes the local assessment;
 // it does not collect new target data and cannot raise factual confidence on its own.
app.post('/api/intelligence/copilot', async (req, res) => {
  const { targetLabel = 'target', assessment, analystQuestion, model, customApiKey } = req.body || {};
  const headerKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;

  if (!assessment || typeof assessment !== 'object') {
    return res.status(400).json({ error: 'A local intelligence assessment is required.' });
  }

  const evidenceCount = Array.isArray(assessment.evidence) ? assessment.evidence.length : 0;
  if (evidenceCount > 100) {
    return res.status(400).json({ error: 'Copilot accepts at most 100 prioritized evidence records per request.' });
  }

  const clientInfo = getGenAiClient(headerKey);
  if (!clientInfo) {
    return res.status(503).json({
      error: 'No Gemini API key is configured. The deterministic local assessment remains available without AI.',
    });
  }

  const prompt = buildAnalystCopilotPrompt({
    targetLabel: String(targetLabel).slice(0, 200),
    assessment,
    analystQuestion: typeof analystQuestion === 'string' ? analystQuestion.slice(0, 1000) : undefined,
  });

  const selectedModel = typeof model === 'string' && model.trim()
    ? model.trim()
    : 'gemini-3.8-flash';

  try {
    const response: any = await withTimeout(
      clientInfo.client.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
      12000
    );

    const parsed = parseCleanJson(response.text || '{}');
    return res.json({
      ...parsed,
      modelUsed: selectedModel,
      generatedAt: new Date().toISOString(),
      provenance: {
        type: 'AI_SYNTHESIZED',
        factualConfidenceRaised: false,
      },
    });
  } catch (err: any) {
    return res.status(502).json({
      error: err?.message || 'AI analyst request failed',
      provenance: {
        type: 'AI_SYNTHESIZED',
        factualConfidenceRaised: false,
      },
    });
  }
});

// AI-Powered Autonomous Profiling Engine (Mineiro Username Extractor Flagship Intelligence)
app.post('/api/osint/profile', async (req, res) => {
  if (process.env.MINEIRO_ENABLE_LEGACY_PROFILE !== '1') {
    return res.status(410).json({
      error: 'Legacy speculative profile endpoint is disabled by default in Mineiro v1.4.1.',
      replacement: '/api/intelligence/copilot',
      note: 'Use the evidence-bounded Analyst Copilot. AI synthesis cannot raise factual confidence by itself.',
    });
  }
  const { target, targetType = 'username', foundPlatforms = [], emailData = null, model, customApiKey } = req.body;
  const userHeaderKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;

  if (!target || typeof target !== 'string') {
    return res.status(400).json({ error: 'Target identifier is required' });
  }

  const platformsList = Array.isArray(foundPlatforms)
    ? foundPlatforms.map((p: any) => `${p.platformName} (${p.category}): ${p.url}`).join('\n')
    : 'None explicitly provided.';

  // Extract explicit timezone and language signals from identified platform profiles
  const signals = extractPlatformSignals(foundPlatforms, target, emailData);

  // Compute baseline objective behavioral distribution
  const baselineBehavior = computeBehavioralProfile(foundPlatforms, target, emailData);

  // Evaluate security-focused heuristics for threat actor identification & occupation cross-referencing
  const threatActorHeuristics = baselineBehavior.threatActorAnalysis || evaluateThreatActorHeuristics(foundPlatforms, target, emailData);

  const clientInfo = getGenAiClient(userHeaderKey);

  if (clientInfo) {
    // --- MULTI-PASS EVALUATION ---
    // Pass 1: Identify Industry, Interests, and Technical Footprint as distinct entities
    const rawEntities = await evaluatePass1Entities(
      clientInfo.client,
      target,
      targetType,
      platformsList,
      baselineBehavior.categoryPercentages,
      baselineBehavior.categoryDistribution,
      emailData,
      model
    );

    const initialEntities: ExtractedEntities = rawEntities || {
      industry: baselineBehavior.industry,
      interests: baselineBehavior.interests,
      technicalFootprint: baselineBehavior.technicalFootprint,
    };

    // Weight these three variables against platform activity patterns
    const { weightedEntities, archetypeDirective } = weightEntitiesAgainstPatterns(
      initialEntities,
      foundPlatforms,
      baselineBehavior,
      target
    );

    // Pass 2: Synthesize comprehensive forensic dossier with weighted Archetype mapping
    const prompt = `You are the AI Intelligence Profiling Engine inside Mineiro Username Extractor, a unified high-grade open-source intelligence analysis system.
Analyze the following target reconnaissance data and generate an actionable, comprehensive forensic OSINT dossier.

Target: "${target}"
Target Type: ${targetType}
Discovered Platforms & Profiles (${foundPlatforms.length} total):
${platformsList}

Platform Category Breakdown:
${Object.entries(baselineBehavior.categoryPercentages)
  .filter(([_, pct]) => pct > 0)
  .map(([cat, pct]) => `- ${cat}: ${pct}% (${baselineBehavior.categoryDistribution[cat]} platform(s))`)
  .join('\n')}

MULTI-PASS VERIFIED ENTITIES:
- Industry: ${weightedEntities.industry}
- Interests: ${weightedEntities.interests.join(', ')}
- Technical Footprint Level: ${weightedEntities.technicalFootprint.level}
- Is Tech Professional: ${weightedEntities.technicalFootprint.isTechProfessional ? 'YES' : 'NO'}
- Technical Evidence: ${weightedEntities.technicalFootprint.evidence}
- Primary Tools: ${weightedEntities.technicalFootprint.primaryTools.join(', ') || 'Standard web & communication tools'}

ARCHETYPE WEIGHTING DIRECTIVE:
${archetypeDirective}

Inferred Professional Occupation & Domain Footprint:
- Inferred Primary Occupation: ${threatActorHeuristics.occupationCrossReference.inferredOccupation}
- Platform Pattern: ${threatActorHeuristics.occupationCrossReference.platformBehaviorPattern}
- Cross-Reference Consistency Verdict: ${threatActorHeuristics.occupationCrossReference.consistencyVerdict}
- Preliminary Threat Actor Verdict: ${threatActorHeuristics.verdictTitle} (Score: ${threatActorHeuristics.threatActorScore}/100)
- Observed TTPs: ${threatActorHeuristics.observedTTPs.join(', ') || 'None (Benign non-adversarial activity)'}

Extracted Platform Behavioral Signals:
- Dominant Platform Sector: ${baselineBehavior.dominantDomain.toUpperCase()}
- Platform Timezone Footprint: ${signals.timezone} (${signals.activeTimezoneWindow})
- Platform Timezone Indicators:
${signals.timezoneSignals.map((s) => `  * ${s}`).join('\n')}
- Platform Language & Dialect Footprint: ${signals.language}
- Primary Language: ${signals.primaryLanguage}
- Secondary / Technical Languages: ${signals.secondaryLanguages.join(', ') || 'None'}
- Platform Language Indicators:
${signals.languageSignals.map((s) => `  * ${s}`).join('\n')}
- Inferred Linguistic Style: ${signals.linguisticStyle}

Additional Email Reconnaissance Data:
${emailData ? JSON.stringify(emailData, null, 2) : 'No direct email reconnaissance data available.'}

Respond strictly in valid JSON format matching this schema:
{
  "target": "${target}",
  "targetType": "${targetType}",
  "summary": "2-3 crisp sentences synthesizing the target's digital footprint, identity cohesion, and primary domain of activity.",
  "threatLevel": "Low" | "Moderate" | "Elevated" | "Critical",
  "footprintScore": number between 10 and 95 (higher means broader public digital attack surface),
  "industry": "${weightedEntities.industry}",
  "interests": ${JSON.stringify(weightedEntities.interests)},
  "technicalFootprint": {
    "level": "${weightedEntities.technicalFootprint.level}",
    "isTechProfessional": ${weightedEntities.technicalFootprint.isTechProfessional},
    "evidence": "${weightedEntities.technicalFootprint.evidence.replace(/"/g, '\\"')}",
    "primaryTools": ${JSON.stringify(weightedEntities.technicalFootprint.primaryTools)}
  },
  "archetype": "Specific archetype title strictly adhering to the Archetype Weighting Directive above",
  "archetypeDescription": "Detailed forensic explanation of why this specific archetype fits the discovered cross-platform activity signatures.",
  "threatActorAnalysis": {
    "isThreatActorSuspect": boolean,
    "threatActorCategory": "BENIGN_CIVILIAN" | "AUTHORIZED_SECURITY_RESEARCHER" | "AUTHORIZED_RED_TEAM" | "DEFENSIVE_BLUE_TEAM" | "COMMODITY_SCRIPT_OPERATOR" | "UNDERGROUND_FORUM_BROKER" | "FINANCIALLY_MOTIVATED_ACTOR" | "HACKTIVIST_OPERATOR" | "INSIDER_RISK_DISCREPANCY" | "STEALTH_OPSEC_OPERATOR",
    "threatActorScore": number between 0 and 100,
    "confidenceScore": number between 0 and 100,
    "verdictTitle": "Crisp title e.g. '${threatActorHeuristics.verdictTitle}'",
    "verdictSummary": "Forensic synthesis explaining the threat actor classification or benign confirmation.",
    "occupationCrossReference": {
      "inferredOccupation": "${threatActorHeuristics.occupationCrossReference.inferredOccupation}",
      "platformBehaviorPattern": "${threatActorHeuristics.occupationCrossReference.platformBehaviorPattern}",
      "consistencyVerdict": "CONSISTENT_LEGITIMATE" | "NEUTRAL_BENIGN" | "SUSPICIOUS_ANOMALY" | "HIGH_RISK_DISCREPANCY",
      "analysis": "Detailed cross-referencing analysis"
    },
    "observedTTPs": ["TTP 1", "TTP 2"],
    "indicatorMatches": [
      {
        "category": "underground" | "offensive_tools" | "opsec_evasion" | "leaks_dumps" | "credential_recon",
        "severity": "low" | "medium" | "high" | "critical",
        "indicator": "Indicator description",
        "evidence": "Observed evidence"
      }
    ]
  },
  "behavioralSignals": {
    "opsecHygiene": "Poor" | "Basic" | "Moderate" | "High" | "Paranoid",
    "timezone": "Specific inferred primary timezone e.g. '${signals.timezone}'",
    "timezoneSignals": [
      "Specific signal extracted from identified platforms e.g. '${signals.timezoneSignals[0] || 'Active during standard diurnal hours'}'"
    ],
    "activeTimezoneWindow": "Estimated peak activity window e.g. '${signals.activeTimezoneWindow}'",
    "language": "Primary and secondary language assessment e.g. '${signals.language}'",
    "primaryLanguage": "${signals.primaryLanguage}",
    "secondaryLanguages": ${JSON.stringify(signals.secondaryLanguages)},
    "languageSignals": [
      "Specific language indicator e.g. '${signals.languageSignals[0] || 'Standard international communication'}'"
    ],
    "linguisticStyle": "Observed psycholinguistic pattern e.g. '${signals.linguisticStyle}'",
    "socialExposureRisk": "Minimal" | "Moderate" | "Elevated" | "Severe",
    "handlePersistencePattern": "Single Moniker Reuse" | "Predictable Affixes" | "Segmented Personas" | "High-Entropy Anon",
    "anonymityEffort": "Low" | "Moderate" | "High",
    "accountCreationEra": "Estimated account era, e.g. 'Established Veteran (2012-2018)' or 'Recent Emergence (2020+)'"
  },
  "threatVulnerabilities": [
    "Vulnerability 1",
    "Vulnerability 2"
  ],
  "recommendedDefensiveActions": [
    "Defensive action 1",
    "Defensive action 2"
  ],
  "psycholinguisticClues": [
    "Clue 1",
    "Clue 2"
  ],
  "technicalSkills": ["relevant skill 1 based on dominant activity", "skill 2", "skill 3"],
  "personalityTraits": ["trait 1", "trait 2", "trait 3"],
  "inferredLocations": ["potential location based on timezone and language"],
  "potentialInterests": ["interest 1", "interest 2"],
  "identityCorrelation": "Analysis of handle reuse probability across platforms and whether it is a unique moniker or generic pseudonym.",
  "investigationPivots": [
    {
      "hop": "Next lead or platform to verify",
      "type": "username" | "domain" | "email" | "crypto" | "code",
      "explanation": "Why this pivot is high value",
      "recommendedAction": "Actionable command or search syntax"
    }
  ]
}

Return strictly the raw JSON without markdown code fences or backticks.`;

    const aiResult = await generateDossierWithGemini(clientInfo.client, prompt, model);

    if (aiResult && aiResult.data) {
      // Extra safety guard: If target is verified non-tech professional, ensure archetype is not contaminated with tech titles
      let finalArchetype = aiResult.data.archetype || baselineBehavior.archetype;
      if (!weightedEntities.technicalFootprint.isTechProfessional) {
        const lowerArchetype = finalArchetype.toLowerCase();
        const forbiddenTerms = ['software', 'developer', 'engineer', 'programmer', 'cybersecurity', 'hacker', 'infosec', 'penetration', 'cloud architect'];
        if (forbiddenTerms.some((term) => lowerArchetype.includes(term))) {
          finalArchetype = baselineBehavior.archetype;
        }
      }

      const mergedBehavioralSignals = {
        opsecHygiene: aiResult.data.behavioralSignals?.opsecHygiene || baselineBehavior.opsecHygiene,
        timezone: aiResult.data.behavioralSignals?.timezone || signals.timezone,
        timezoneSignals: aiResult.data.behavioralSignals?.timezoneSignals?.length
          ? aiResult.data.behavioralSignals.timezoneSignals
          : signals.timezoneSignals,
        activeTimezoneWindow: aiResult.data.behavioralSignals?.activeTimezoneWindow || signals.activeTimezoneWindow,
        language: aiResult.data.behavioralSignals?.language || signals.language,
        primaryLanguage: aiResult.data.behavioralSignals?.primaryLanguage || signals.primaryLanguage,
        secondaryLanguages: aiResult.data.behavioralSignals?.secondaryLanguages || signals.secondaryLanguages,
        languageSignals: aiResult.data.behavioralSignals?.languageSignals?.length
          ? aiResult.data.behavioralSignals.languageSignals
          : signals.languageSignals,
        linguisticStyle: aiResult.data.behavioralSignals?.linguisticStyle || signals.linguisticStyle,
        socialExposureRisk: aiResult.data.behavioralSignals?.socialExposureRisk || baselineBehavior.socialExposureRisk,
        handlePersistencePattern: aiResult.data.behavioralSignals?.handlePersistencePattern || baselineBehavior.handlePersistencePattern,
        anonymityEffort: aiResult.data.behavioralSignals?.anonymityEffort || baselineBehavior.anonymityEffort,
        accountCreationEra: aiResult.data.behavioralSignals?.accountCreationEra || baselineBehavior.accountCreationEra,
      };

      const mergedThreatActorAnalysis = {
        isThreatActorSuspect: typeof aiResult.data.threatActorAnalysis?.isThreatActorSuspect === 'boolean'
          ? aiResult.data.threatActorAnalysis.isThreatActorSuspect
          : threatActorHeuristics.isThreatActorSuspect,
        threatActorCategory: aiResult.data.threatActorAnalysis?.threatActorCategory || threatActorHeuristics.threatActorCategory,
        threatActorScore: typeof aiResult.data.threatActorAnalysis?.threatActorScore === 'number'
          ? aiResult.data.threatActorAnalysis.threatActorScore
          : threatActorHeuristics.threatActorScore,
        confidenceScore: typeof aiResult.data.threatActorAnalysis?.confidenceScore === 'number'
          ? aiResult.data.threatActorAnalysis.confidenceScore
          : threatActorHeuristics.confidenceScore,
        verdictTitle: aiResult.data.threatActorAnalysis?.verdictTitle || threatActorHeuristics.verdictTitle,
        verdictSummary: aiResult.data.threatActorAnalysis?.verdictSummary || threatActorHeuristics.verdictSummary,
        occupationCrossReference: {
          inferredOccupation: aiResult.data.threatActorAnalysis?.occupationCrossReference?.inferredOccupation || threatActorHeuristics.occupationCrossReference.inferredOccupation,
          platformBehaviorPattern: aiResult.data.threatActorAnalysis?.occupationCrossReference?.platformBehaviorPattern || threatActorHeuristics.occupationCrossReference.platformBehaviorPattern,
          consistencyVerdict: aiResult.data.threatActorAnalysis?.occupationCrossReference?.consistencyVerdict || threatActorHeuristics.occupationCrossReference.consistencyVerdict,
          analysis: aiResult.data.threatActorAnalysis?.occupationCrossReference?.analysis || threatActorHeuristics.occupationCrossReference.analysis,
        },
        observedTTPs: aiResult.data.threatActorAnalysis?.observedTTPs?.length
          ? aiResult.data.threatActorAnalysis.observedTTPs
          : threatActorHeuristics.observedTTPs,
        indicatorMatches: aiResult.data.threatActorAnalysis?.indicatorMatches?.length
          ? aiResult.data.threatActorAnalysis.indicatorMatches
          : threatActorHeuristics.indicatorMatches,
        mitreTactics: aiResult.data.threatActorAnalysis?.mitreTactics || threatActorHeuristics.mitreTactics,
      };

      return res.json({
        ...aiResult.data,
        industry: aiResult.data.industry || weightedEntities.industry,
        interests: Array.isArray(aiResult.data.interests) && aiResult.data.interests.length > 0
          ? aiResult.data.interests
          : weightedEntities.interests,
        technicalFootprint: aiResult.data.technicalFootprint || weightedEntities.technicalFootprint,
        archetype: finalArchetype,
        archetypeDescription: aiResult.data.archetypeDescription || baselineBehavior.archetypeDescription,
        threatActorAnalysis: mergedThreatActorAnalysis,
        behavioralSignals: mergedBehavioralSignals,
        generatedAt: new Date().toISOString(),
        modelUsed: aiResult.modelUsed,
        isCustomKey: clientInfo.isCustom,
      });
    }

    var isQuotaExceeded = Boolean(aiResult?.quotaExceeded);
  }

  // High-fidelity fallback heuristic profiler (used if no API key or on temporary demand spike)
  const count = Array.isArray(foundPlatforms) ? foundPlatforms.length : 0;
  const threatLevel = threatActorHeuristics.isThreatActorSuspect
    ? 'Critical'
    : count > 12 ? 'Elevated' : count > 5 ? 'Moderate' : 'Low';
  const footprintScore = Math.min(95, Math.max(15, count * 7 + 20));

  return res.json({
    target,
    targetType,
    summary: baselineBehavior.summary,
    threatLevel,
    footprintScore,
    industry: baselineBehavior.industry,
    interests: baselineBehavior.interests,
    technicalFootprint: baselineBehavior.technicalFootprint,
    archetype: baselineBehavior.archetype,
    archetypeDescription: baselineBehavior.archetypeDescription,
    threatActorAnalysis: threatActorHeuristics,
    behavioralSignals: {
      opsecHygiene: baselineBehavior.opsecHygiene,
      timezone: signals.timezone,
      timezoneSignals: signals.timezoneSignals,
      activeTimezoneWindow: signals.activeTimezoneWindow,
      language: signals.language,
      primaryLanguage: signals.primaryLanguage,
      secondaryLanguages: signals.secondaryLanguages,
      languageSignals: signals.languageSignals,
      linguisticStyle: signals.linguisticStyle,
      socialExposureRisk: baselineBehavior.socialExposureRisk,
      handlePersistencePattern: baselineBehavior.handlePersistencePattern,
      anonymityEffort: baselineBehavior.anonymityEffort,
      accountCreationEra: baselineBehavior.accountCreationEra,
    },
    threatVulnerabilities: baselineBehavior.threatVulnerabilities,
    recommendedDefensiveActions: baselineBehavior.recommendedDefensiveActions,
    psycholinguisticClues: baselineBehavior.psycholinguisticClues,
    technicalSkills: baselineBehavior.technicalSkills,
    personalityTraits: baselineBehavior.personalityTraits,
    inferredLocations: [signals.timezone],
    potentialInterests: baselineBehavior.dominantDomain === 'security'
      ? ['Offensive Security', 'CTF Competitions', 'Privacy Protocols', 'Network Defense']
      : baselineBehavior.dominantDomain === 'developer'
      ? ['Open Source', 'Software Architecture', 'Continuous Delivery', 'API Engineering']
      : baselineBehavior.dominantDomain === 'creative'
      ? ['Visual Arts', 'Digital Illustration', 'UI/UX Design', 'Creative Branding']
      : baselineBehavior.dominantDomain === 'gaming'
      ? ['Competitive Gaming', 'Live Streaming', 'Game Mods', 'Voice Communities']
      : ['Social Trends', 'Media Consumption', 'Digital Culture', 'Online Communities'],
    identityCorrelation: `Analysis shows handle '@${target}' concentrated in the ${baselineBehavior.dominantDomain.toUpperCase()} domain (${baselineBehavior.categoryPercentages[baselineBehavior.dominantDomain] || 0}% share). Characteristic cross-site moniker reuse without random numeric affixes.`,
    investigationPivots: baselineBehavior.dominantDomain === 'developer'
      ? [
          {
            hop: 'Commit History & GPG Key Search',
            type: 'code',
            explanation: 'Audit public Git commit patches to extract author email, timezones, and signing keys.',
            recommendedAction: `git log --author="${target}" --format="%ae %ai"`,
          },
          {
            hop: 'Package Registry & Dep Graph',
            type: 'code',
            explanation: 'Audit npm/PyPI/crates.io for packages published under this namespace.',
            recommendedAction: `Check npmjs.com/~${target}`,
          },
        ]
      : baselineBehavior.dominantDomain === 'security'
      ? [
          {
            hop: 'Bug Bounty Disclosures & CVE Hall of Fame',
            type: 'username',
            explanation: 'Search coordinated vulnerability disclosures and hacker rankings.',
            recommendedAction: `Audit HackerOne and Bugcrowd for @${target}`,
          },
          {
            hop: 'Keybase PGP & Cryptographic Identity Proofs',
            type: 'crypto',
            explanation: 'Cross-reference PGP key fingerprints linked to this handle.',
            recommendedAction: `keybase id ${target}`,
          },
        ]
      : baselineBehavior.dominantDomain === 'gaming'
      ? [
          {
            hop: 'Steam Community & VAC History',
            type: 'username',
            explanation: 'Query SteamID database for match history, avatar caches, and alias history.',
            recommendedAction: `Lookup vanity URL steamcommunity.com/id/${target}`,
          },
          {
            hop: 'Interactive Live Streaming Archives',
            type: 'username',
            explanation: 'Inspect past VODs and chat log archives for time-of-day activity.',
            recommendedAction: `Cross-reference Twitch and Kick for @${target}`,
          },
        ]
      : baselineBehavior.dominantDomain === 'creative'
      ? [
          {
            hop: 'Visual Portfolio Showcase Audit',
            type: 'domain',
            explanation: 'Audit Behance/Dribbble/ArtStation for contact forms, agency links, and client credits.',
            recommendedAction: `Review portfolio metadata on Behance for ${target}`,
          },
          {
            hop: 'Reverse Image & EXIF Extraction',
            type: 'username',
            explanation: 'Scan portfolio artwork for embedded camera and copyright EXIF signatures.',
            recommendedAction: `Extract EXIF metadata from published artwork`,
          },
        ]
      : [
          {
            hop: 'Cross-Network Social Graph Correlation',
            type: 'username',
            explanation: 'Correlate friend/follower mutual intersections across identified social networks.',
            recommendedAction: `Map mutual connections between public accounts for @${target}`,
          },
          {
            hop: 'Historical Avatar & Bio Fingerprinting',
            type: 'domain',
            explanation: 'Compare profile photos and bios across accounts for identical phrasing.',
            recommendedAction: `Cross-reference biography text snippets across found profiles`,
          },
        ],
    generatedAt: new Date().toISOString(),
    modelUsed: 'heuristic-rule-engine',
    fallbackNotice: clientInfo
      ? (isQuotaExceeded
          ? 'Server Gemini quota temporarily reached (429 Rate Limit). Dossier generated with high fidelity by the local heuristic engine. For unlimited real-time AI profiling, connect your personal key in the "Gemini AI" settings.'
          : 'Temporary high demand on Gemini clusters (503). Dossier generated by the behavioral heuristic engine.')
      : 'Gemini key not configured. Dossier generated by the behavioral heuristic engine.',
  });
});

async function startServer() {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + TERMINAL_BANNER + '\n');
      console.log(`[ready] http://0.0.0.0:${PORT}`);
      console.log('[mode] local-first OSINT probes | monochrome interface | v1.3.1');
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`[Server Error] Port ${PORT} is already in use.`);
      } else {
        console.error('[Server Error] Unhandled server error:', err);
      }
    });
  } catch (err) {
    console.error('[Server Startup Error] Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();

