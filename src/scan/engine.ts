// Scan engine: probes one target across the detectors its scan configuration selects. Plain TypeScript with no React,
// no DOM and no storage: the caller passes in how to verify a probe, how to run e-mail recon, a clock, callbacks for
// progress and log lines, and the controls that stop, pause or skip the scan. The browser runs it through
// src/hooks/useScan.ts; the same module can run in a server worker with an in-process verifier.
//
// Behaviour (moved unchanged from App.tsx's scanTargetCore):
// - Scope: getPlatformsForScope(platformScope, selectedCategory, targetType).
// - Concurrency: probes run in consecutive chunks of max(2, min(concurrency, 24)); a chunk starts after the previous
//   one has settled, so no more than that many probes are ever in flight.
// - Full scan (scope "all", deep mode, more than 100 detectors) runs two phases: a fast discovery pass over every
//   detector, then a deep pass with the Evidence Engine and the random-handle baseline over the found, uncertain and
//   rate-limited candidates only. Other scans run one pass with the configured depth.
// - No bypass retries: every probe asks for wafRetryStrategy "none"; a protected endpoint stays uncertain/rate_limited.
// - A refusal from the local server (HTTP 4xx/5xx with a JSON body) becomes an `error` result through
//   readVerifyOutcome; a probe whose verifier throws anything else becomes `error` with the thrown message.
// - Stop/pause/skip are checked before every chunk and between the two phases. Probes already in flight finish.
import { getPlatformsForScope } from '../data/platforms';
import { readVerifyOutcome } from '../core/verifyOutcome';
import { isApiError } from '../api/errors';
import type { EmailReconData, ModularScanConfig, Platform, PlatformScope, ScanResult } from '../types';
import type { VerifyRequest, VerifyResponse } from '../api/types';

export type ScanTargetType = 'username' | 'email';
export type ScanLogLevel = 'info' | 'success' | 'warn' | 'error';

export interface ScanJob {
  /** The handle or e-mail as the analyst typed it (whitespace is trimmed here; a leading @ is the caller's business). */
  target: string;
  targetType: ScanTargetType;
  config: ModularScanConfig;
}

export interface ScanOutcome {
  /** One result per detector in scope, in scope order; same objects that were reported through onProgress. */
  results: ScanResult[];
  emailData: EmailReconData | null;
  foundCount: number;
  uncertainCount: number;
  /** Results that left the `pending` state (fewer than results.length when the scan was stopped early). */
  totalScanned: number;
}

/**
 * Sends one probe. Resolves with the verify route's 200 reply. A refusal from the server should be thrown as an
 * ApiError carrying the JSON body (src/api/client.ts does this); any other throw is a transport failure.
 */
export type Verifier = (request: VerifyRequest, context: { signal?: AbortSignal }) => Promise<VerifyResponse>;
export type EmailRecon = (email: string, context: { signal?: AbortSignal }) => Promise<EmailReconData>;

export interface ScanControl {
  /** Stops the scan before its next chunk. */
  signal?: AbortSignal;
  /** While true the scan waits (polling every 400 ms) before its next chunk. */
  isPaused?: () => boolean;
  /** When true the scan stops before its next chunk, logging that the target was skipped. */
  isSkipped?: () => boolean;
  /** Log "Scan aborted by analyst command." when the signal stops the scan (single scans do, batch items do not). */
  announceAbort?: boolean;
}

export interface ScanCallbacks {
  onLog?: (message: string, level: ScanLogLevel) => void;
  /** A fresh array (same result objects, updated in place) whenever statuses change: before and after each chunk. */
  onProgress?: (results: ScanResult[]) => void;
  onEmailLoading?: (loading: boolean) => void;
  onEmailData?: (data: EmailReconData) => void;
}

export interface ScanDeps extends ScanCallbacks {
  verify: Verifier;
  emailRecon?: EmailRecon;
  control?: ScanControl;
  /** Detectors for a scope; defaults to the bundled catalog (src/data/platforms.ts). */
  resolveScope?: (scope: PlatformScope, category: string, targetType: ScanTargetType) => Platform[];
  /** Milliseconds since the epoch; defaults to Date.now. Used for result ids and `checkedAt`. */
  now?: () => number;
  /** [0, 1); defaults to Math.random. Used for result ids only. */
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

interface ProbePass {
  concurrency: number;
  depth: 'fast' | 'deep';
  timeoutMs: number;
  evidence: boolean;
  phaseLabel: string;
}

const PAUSE_POLL_MS = 400;
const MAX_CHUNK = 24;
const MIN_CHUNK = 2;
const PROGRESSIVE_MIN_DETECTORS = 100;

/** How many probes one chunk sends for a configured concurrency. */
export function chunkSize(concurrency: number): number {
  return Math.max(MIN_CHUNK, Math.min(concurrency, MAX_CHUNK));
}

/** Whether a configuration takes the two-phase (discovery, then validation) path for a scope of `detectorCount`. */
export function isProgressiveFullScan(config: ModularScanConfig, detectorCount: number): boolean {
  return config.platformScope === 'all' && config.wafInspectionMode === 'deep' && detectorCount > PROGRESSIVE_MIN_DETECTORS;
}

/** The pending result rows for a scope, in scope order. */
export function initialResults(platforms: Platform[], target: string, now: () => number, random: () => number): ScanResult[] {
  return platforms.map((p) => ({
    id: `${p.id}-${now()}-${random().toString(36).substring(2, 7)}`,
    platformId: p.id,
    platformName: p.name,
    category: p.category,
    url: p.urlPattern.replace('{username}', encodeURIComponent(target)),
    status: 'pending',
    siteType: p.siteType,
    detectorReliability: p.detectorReliability,
    reliabilityTier: p.reliabilityTier,
  }));
}

export function summarize(results: ScanResult[], emailData: EmailReconData | null): ScanOutcome {
  return {
    results,
    emailData,
    foundCount: results.filter((r) => r.status === 'found').length,
    uncertainCount: results.filter((r) => r.status === 'uncertain').length,
    totalScanned: results.filter((r) => r.status !== 'pending').length,
  };
}

export async function runScan(job: ScanJob, deps: ScanDeps): Promise<ScanOutcome> {
  const { config } = job;
  const now = deps.now ?? Date.now;
  const random = deps.random ?? Math.random;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const log = deps.onLog ?? (() => undefined);
  const progress = deps.onProgress ?? (() => undefined);
  const control = deps.control ?? {};
  const signal = control.signal;
  const resolveScope = deps.resolveScope ?? getPlatformsForScope;

  const cleanTarget = job.target.trim();
  const platforms = resolveScope(config.platformScope, config.selectedCategory, job.targetType);
  const platformById = new Map(platforms.map((p) => [p.id, p]));
  const current = initialResults(platforms, cleanTarget, now, random);
  progress([...current]);

  let emailData: EmailReconData | null = null;
  if (config.enableEmailRecon && deps.emailRecon && (job.targetType === 'email' || cleanTarget.includes('@'))) {
    deps.onEmailLoading?.(true);
    log(`[DNS RECON] Probing MX records & Gravatar for ${cleanTarget}...`, 'info');
    try {
      const data = await deps.emailRecon(cleanTarget, { signal });
      emailData = data;
      deps.onEmailData?.(data);
      if (data.mxRecordsFound) log(`[DNS] Active MX mail server confirmed for domain: ${data.domain}`, 'success');
      if (data.gravatarExists) log(`[GRAVATAR] Verified profile identified for ${cleanTarget}`, 'success');
    } catch (err: any) {
      log(`Email recon check error: ${err?.message}`, 'warn');
    } finally {
      deps.onEmailLoading?.(false);
    }
  }

  const usernamePart = cleanTarget.includes('@') ? cleanTarget.split('@')[0] : cleanTarget;

  const shouldStop = async (): Promise<boolean> => {
    if (signal?.aborted) {
      if (control.announceAbort !== false) log('Scan aborted by analyst command.', 'warn');
      return true;
    }
    if (control.isSkipped?.()) {
      log(`[BATCH] Skipped target @${cleanTarget} on operator instruction.`, 'warn');
      return true;
    }
    while (control.isPaused?.()) {
      await sleep(PAUSE_POLL_MS);
      if (signal?.aborted) return true;
    }
    return false;
  };

  const probeOne = async (item: ScanResult, pass: ProbePass) => {
    const platform = platformById.get(item.platformId);
    const targetUrl = item.url;
    try {
      let httpOk = true;
      let httpStatus = 200;
      let data: any;
      try {
        data = await deps.verify({
          url: targetUrl,
          platformId: item.platformId,
          expectedStatus: platform?.expectedStatus || 200,
          errorStatus: platform?.errorStatus || 404,
          fastMode: pass.depth === 'fast',
          scanDepth: pass.depth,
          timeoutMs: pass.timeoutMs,
          // v1.4 respects protection boundaries: progressive validation does not attempt bypass retries.
          wafRetryStrategy: 'none',
          enableEvidenceChecks: pass.evidence,
          baseline: pass.evidence,
          username: usernamePart,
          detectorReliability: platform?.detectorReliability || 60,
        }, { signal });
      } catch (refusal) {
        // A reply from the local server that is not 2xx: verifyOutcome reads its JSON body. No reply: transport error.
        if (!isApiError(refusal) || refusal.network || refusal.aborted) throw refusal;
        httpOk = false;
        httpStatus = refusal.status;
        data = refusal.body ?? {};
      }
      data = data ?? {};
      const outcome = readVerifyOutcome(httpOk, httpStatus, data);
      item.status = outcome.status;
      item.statusCode = outcome.statusCode;
      item.responseTimeMs = data.responseTimeMs;
      item.confidenceScore = data.confidenceScore || 0;
      item.evidenceLevel = data.evidenceLevel;
      item.evidenceSignals = data.evidenceSignals || [];
      item.evidenceChecksPassed = data.evidenceChecksPassed;
      item.evidenceChecksTotal = data.evidenceChecksTotal;
      item.detectorReliability = data.detectorReliability ?? platform?.detectorReliability;
      item.siteType = platform?.siteType;
      item.reliabilityTier = platform?.reliabilityTier;
      item.uncertainReason = outcome.uncertainReason;
      item.wafRetried = false;
      item.retryResolved = false;
      item.wafStrategyApplied = 'respect-protection-boundary';
      item.scanDepth = pass.depth;
      item.checkedAt = new Date(now()).toISOString();

      if (item.status === 'found') {
        log(`FOUND [${pass.phaseLabel}]: ${platform?.name || item.platformName} -> ${targetUrl} [${item.statusCode}]`, 'success');
      } else if (item.status === 'uncertain' || item.status === 'rate_limited') {
        log(`${item.status.toUpperCase()} [${pass.phaseLabel}]: ${item.platformName} [HTTP ${item.statusCode || 0}]`, 'warn');
      }
    } catch (err: any) {
      item.status = 'error';
      item.statusCode = 0;
      item.confidenceScore = 0;
      item.uncertainReason = err?.message || 'Probe transport error';
    }
  };

  const probeItems = async (items: ScanResult[], pass: ProbePass) => {
    const size = chunkSize(pass.concurrency);
    for (let index = 0; index < items.length; index += size) {
      if (await shouldStop()) break;
      const chunk = items.slice(index, index + size);
      chunk.forEach((item) => { item.status = 'scanning'; });
      progress([...current]);
      await Promise.all(chunk.map((item) => probeOne(item, pass)));
      progress([...current]);
    }
  };

  if (isProgressiveFullScan(config, current.length)) {
    const discoveryConcurrency = Math.max(14, Math.min(20, config.concurrency * 3));
    log(`[PROGRESSIVE SCAN] Phase 1 discovery: ${current.length} detectors at ${discoveryConcurrency}x concurrency, 2.5s cap.`, 'info');
    await probeItems(current, {
      concurrency: discoveryConcurrency,
      depth: 'fast',
      timeoutMs: Math.min(2500, config.timeoutMs || 2500),
      evidence: false,
      phaseLabel: 'DISCOVERY',
    });

    if (!(await shouldStop())) {
      const candidates = current.filter((item) => item.status === 'found' || item.status === 'uncertain' || item.status === 'rate_limited');
      if (candidates.length) {
        log(`[PROGRESSIVE SCAN] Phase 2 validation: ${candidates.length} candidate(s) with Evidence Engine.`, 'info');
        await probeItems(candidates, {
          concurrency: Math.max(4, Math.min(8, config.concurrency)),
          depth: 'deep',
          timeoutMs: Math.min(5000, config.timeoutMs || 5000),
          evidence: true,
          phaseLabel: 'VALIDATION',
        });
      }
    }
  } else {
    const deep = config.wafInspectionMode === 'deep';
    await probeItems(current, {
      concurrency: config.concurrency,
      depth: deep ? 'deep' : 'fast',
      timeoutMs: config.timeoutMs || (deep ? 5000 : 2500),
      evidence: config.enableEvidenceChecks,
      phaseLabel: deep ? 'DEEP' : 'FAST',
    });
  }

  return summarize(current, emailData);
}
