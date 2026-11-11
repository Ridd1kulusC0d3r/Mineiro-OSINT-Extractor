import { describe, expect, it } from 'vitest';
import { chunkSize, isProgressiveFullScan, runScan, type ScanDeps, type Verifier } from '../src/scan/engine';
import { batchScanControl, createBatch, createBatchControl, runBatch } from '../src/scan/batch';
import { ApiError } from '../src/api/errors';
import { DEFAULT_SCAN_CONFIGS, getPlatformsForScope } from '../src/data/platforms';
import type { ModularScanConfig, Platform, ScanResult } from '../src/types';
import type { VerifyRequest, VerifyResponse } from '../src/api/types';

// ---------- fixtures ----------
const platform = (i: number): Platform => ({
  id: `p${i}`,
  name: `Platform ${i}`,
  category: i % 2 ? 'developer' : 'social',
  urlPattern: `https://p${i}.example/{username}`,
  checkMethod: 'status_code',
  detectorReliability: 70,
  siteType: 'test',
  reliabilityTier: 'medium',
});
const platforms = (n: number) => Array.from({ length: n }, (_, i) => platform(i));
const scope = (list: Platform[]) => () => list;

const config = (overrides: Partial<ModularScanConfig> = {}): ModularScanConfig => ({ ...DEFAULT_SCAN_CONFIGS.quick, ...overrides });

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

/** Records every call and the peak number of calls in flight; answers with `reply(request)` after a macrotask. */
function recordingVerifier(reply: (request: VerifyRequest) => VerifyResponse | Promise<VerifyResponse> = () => ({ status: 'not_found', statusCode: 404 })) {
  const calls: VerifyRequest[] = [];
  const state = { inFlight: 0, peak: 0 };
  const verify: Verifier = async (request) => {
    calls.push(request);
    state.inFlight++;
    state.peak = Math.max(state.peak, state.inFlight);
    try {
      await tick();
      return await reply(request);
    } finally {
      state.inFlight--;
    }
  };
  return { verify, calls, state };
}

const deterministic = (deps: Omit<ScanDeps, 'now' | 'random'>): ScanDeps => ({
  now: () => Date.UTC(2026, 0, 15, 12),
  random: () => 0.5,
  sleep: () => tick(),
  ...deps,
});

// ---------- tests ----------
describe('scan engine: scope and results', () => {
  it('returns one result per detector in scope, in scope order, none left pending', async () => {
    const list = platforms(37);
    const { verify, calls } = recordingVerifier((r) => ({
      status: Number(r.platformId.slice(1)) % 3 === 0 ? 'found' : 'not_found',
      statusCode: Number(r.platformId.slice(1)) % 3 === 0 ? 200 : 404,
      confidenceScore: 77,
    }));
    const outcome = await runScan({ target: '  alice  ', targetType: 'username', config: config() }, deterministic({ verify, resolveScope: scope(list) }));

    expect(outcome.results.map((r) => r.platformId)).toEqual(list.map((p) => p.id));
    expect(outcome.results.every((r) => r.status === 'found' || r.status === 'not_found')).toBe(true);
    expect(outcome.totalScanned).toBe(37);
    expect(outcome.foundCount).toBe(13);
    expect(calls).toHaveLength(37);
    expect(new Set(calls.map((c) => c.platformId)).size).toBe(37);
    // the handle is trimmed and URL-encoded into the detector pattern
    expect(outcome.results[0].url).toBe('https://p0.example/alice');
    expect(calls[0]).toMatchObject({ username: 'alice', fastMode: true, scanDepth: 'fast', wafRetryStrategy: 'none', enableEvidenceChecks: false, baseline: false });
    expect(outcome.results[0].checkedAt).toBe('2026-01-15T12:00:00.000Z');
    expect(outcome.results[0].wafStrategyApplied).toBe('respect-protection-boundary');
  });

  it('uses the catalog scope of the scan mode by default', async () => {
    const { verify, calls } = recordingVerifier();
    const quick = await runScan({ target: 'bob', targetType: 'username', config: DEFAULT_SCAN_CONFIGS.quick }, deterministic({ verify }));
    expect(quick.results.length).toBe(getPlatformsForScope('top20', 'all', 'username').length);
    expect(calls.length).toBe(quick.results.length);

    const none = await runScan({ target: 'bob@example.com', targetType: 'email', config: DEFAULT_SCAN_CONFIGS.email_only }, deterministic({ verify }));
    expect(none.results).toEqual([]);
  });

  it('reports progress before and after each chunk with the latest statuses', async () => {
    const snapshots: ScanResult['status'][][] = [];
    const { verify } = recordingVerifier();
    await runScan(
      { target: 'carol', targetType: 'username', config: config({ concurrency: 4 }) },
      deterministic({ verify, resolveScope: scope(platforms(8)), onProgress: (rows) => snapshots.push(rows.map((r) => r.status)) })
    );
    // initial + (scanning, settled) x 2 chunks
    expect(snapshots).toHaveLength(5);
    expect(snapshots[0].every((s) => s === 'pending')).toBe(true);
    expect(snapshots[1].slice(0, 4).every((s) => s === 'scanning')).toBe(true);
    expect(snapshots[1].slice(4).every((s) => s === 'pending')).toBe(true);
    expect(snapshots[4].every((s) => s === 'not_found')).toBe(true);
  });
});

describe('scan engine: concurrency', () => {
  it.each([1, 3, 10, 16, 40])('never has more than chunkSize(%i) probes in flight', async (concurrency) => {
    const { verify, state } = recordingVerifier();
    await runScan({ target: 'dave', targetType: 'username', config: config({ concurrency }) }, deterministic({ verify, resolveScope: scope(platforms(60)) }));
    expect(state.peak).toBeLessThanOrEqual(chunkSize(concurrency));
    expect(state.peak).toBe(Math.min(60, chunkSize(concurrency)));
  });

  it('clamps the chunk to [2, 24]', () => {
    expect(chunkSize(0)).toBe(2);
    expect(chunkSize(1)).toBe(2);
    expect(chunkSize(9)).toBe(9);
    expect(chunkSize(99)).toBe(24);
  });
});

describe('scan engine: cancellation', () => {
  it('stops before the next chunk when the signal aborts mid-scan; probes in flight finish', async () => {
    const stop = new AbortController();
    const logs: string[] = [];
    const { verify, calls } = recordingVerifier(() => {
      if (calls.length === 5) stop.abort(); // during the first chunk
      return { status: 'not_found', statusCode: 404 };
    });
    const outcome = await runScan(
      { target: 'erin', targetType: 'username', config: config({ concurrency: 5 }) },
      deterministic({ verify, resolveScope: scope(platforms(20)), control: { signal: stop.signal }, onLog: (m) => logs.push(m) })
    );
    expect(calls).toHaveLength(5);
    expect(outcome.totalScanned).toBe(5);
    expect(outcome.results.slice(5).every((r) => r.status === 'pending')).toBe(true);
    expect(logs).toContain('Scan aborted by analyst command.');
  });

  it('a batch item stops silently on abort, waits while paused and stops when skipped', async () => {
    const control = createBatchControl();
    const logs: string[] = [];
    const { verify, calls } = recordingVerifier(() => {
      if (calls.length === 2) control.paused = true;
      return { status: 'not_found', statusCode: 404 };
    });
    let sleeps = 0;
    const run = runScan(
      { target: 'frank', targetType: 'username', config: config({ concurrency: 2 }) },
      {
        ...deterministic({ verify, resolveScope: scope(platforms(10)), control: batchScanControl(control), onLog: (m) => logs.push(m) }),
        sleep: async () => {
          sleeps++;
          if (sleeps === 3) { control.paused = false; control.skipRequested = true; }
          await tick();
        },
      }
    );
    const outcome = await run;
    expect(sleeps).toBe(3);
    // after the pause ended, the next chunk ran; skip is checked before the chunk after it
    expect(calls.length).toBe(4);
    expect(outcome.totalScanned).toBe(4);
    expect(logs).toContain('[BATCH] Skipped target @frank on operator instruction.');
    expect(logs).not.toContain('Scan aborted by analyst command.');
  });
});

describe('scan engine: two-phase full scan', () => {
  it('discovers every detector fast, then validates only found/uncertain/rate-limited ones with evidence and baseline', async () => {
    const list = platforms(120);
    const verdict = (id: string) => {
      const n = Number(id.slice(1));
      if (n % 10 === 0) return { status: 'found' as const, statusCode: 200 };
      if (n % 10 === 1) return { status: 'uncertain' as const, statusCode: 403 };
      if (n % 10 === 2) return { status: 'rate_limited' as const, statusCode: 429 };
      return { status: 'not_found' as const, statusCode: 404 };
    };
    const { verify, calls, state } = recordingVerifier((r) => verdict(r.platformId));
    const logs: string[] = [];
    const deep = config({ ...DEFAULT_SCAN_CONFIGS.deep });
    expect(isProgressiveFullScan(deep, list.length)).toBe(true);

    const outcome = await runScan({ target: 'gina', targetType: 'username', config: deep }, deterministic({ verify, resolveScope: scope(list), onLog: (m) => logs.push(m) }));

    const discovery = calls.slice(0, 120);
    const validation = calls.slice(120);
    expect(discovery.every((c) => c.scanDepth === 'fast' && c.enableEvidenceChecks === false && c.baseline === false && c.timeoutMs === 2500)).toBe(true);
    expect(validation).toHaveLength(36);
    expect(validation.every((c) => c.scanDepth === 'deep' && c.enableEvidenceChecks === true && c.baseline === true && c.timeoutMs === 5000)).toBe(true);
    expect(validation.every((c) => c.wafRetryStrategy === 'none')).toBe(true);
    expect(new Set(validation.map((c) => Number(c.platformId.slice(1)) % 10))).toEqual(new Set([0, 1, 2]));
    // discovery: max(14, min(20, 6*3)) = 18; validation: max(4, min(8, 6)) = 6
    expect(state.peak).toBeLessThanOrEqual(18);
    expect(outcome.results.find((r) => r.platformId === 'p0')?.scanDepth).toBe('deep');
    expect(outcome.results.find((r) => r.platformId === 'p3')?.scanDepth).toBe('fast');
    expect(logs[0]).toBe('[PROGRESSIVE SCAN] Phase 1 discovery: 120 detectors at 18x concurrency, 2.5s cap.');
    expect(logs).toContain('[PROGRESSIVE SCAN] Phase 2 validation: 36 candidate(s) with Evidence Engine.');
  });

  it('stays single-pass below 101 detectors or outside the "all" scope', () => {
    const deep = config({ ...DEFAULT_SCAN_CONFIGS.deep });
    expect(isProgressiveFullScan(deep, 100)).toBe(false);
    expect(isProgressiveFullScan({ ...deep, platformScope: 'top50' }, 500)).toBe(false);
    expect(isProgressiveFullScan({ ...deep, wafInspectionMode: 'fast' }, 500)).toBe(false);
  });

  it('a deep single pass sends evidence and baseline as configured', async () => {
    const { verify, calls } = recordingVerifier();
    await runScan({ target: 'hal', targetType: 'username', config: DEFAULT_SCAN_CONFIGS.standard }, deterministic({ verify, resolveScope: scope(platforms(3)) }));
    expect(calls.every((c) => c.scanDepth === 'deep' && c.fastMode === false && c.enableEvidenceChecks && c.baseline && c.timeoutMs === 4500)).toBe(true);
  });
});

describe('scan engine: errors, refusals and rate limits', () => {
  it('maps protection, refusals and transport failures without ever retrying', async () => {
    const list = platforms(5);
    const { verify, calls } = recordingVerifier((r) => {
      switch (r.platformId) {
        case 'p0': return { status: 'rate_limited', statusCode: 429, confidenceScore: 35, uncertainReason: 'HTTP 429 protection challenge (no retry in this mode)' };
        case 'p1': return { status: 'uncertain', statusCode: 403, uncertainReason: 'Edge protection challenge (no retry in this mode)' };
        case 'p2': throw new ApiError({ status: 429, message: 'Too many requests', body: { error: 'Too many requests' }, serverMessage: 'Too many requests' });
        case 'p3': throw new ApiError({ status: 0, message: 'Failed to fetch', network: true });
        default: return {} as VerifyResponse; // 200 that is not a verify reply
      }
    });
    const logs: Array<[string, string]> = [];
    const outcome = await runScan(
      { target: 'ivy', targetType: 'username', config: config() },
      deterministic({ verify, resolveScope: scope(list), onLog: (m, l) => logs.push([m, l]) })
    );
    const byId = Object.fromEntries(outcome.results.map((r) => [r.platformId, r]));

    expect(calls).toHaveLength(5);
    expect(byId.p0).toMatchObject({ status: 'rate_limited', statusCode: 429, confidenceScore: 35 });
    expect(byId.p1).toMatchObject({ status: 'uncertain', statusCode: 403, uncertainReason: 'Edge protection challenge (no retry in this mode)' });
    // a refusal by the local server is never "not found"
    expect(byId.p2).toMatchObject({ status: 'error', statusCode: 0, uncertainReason: 'Local server refused the probe: Too many requests' });
    expect(byId.p3).toMatchObject({ status: 'error', statusCode: 0, confidenceScore: 0, uncertainReason: 'Failed to fetch' });
    expect(byId.p4).toMatchObject({ status: 'error', uncertainReason: 'Unexpected reply from the local server (HTTP 200)' });
    expect(outcome.uncertainCount).toBe(1);
    expect(logs).toContainEqual(['RATE_LIMITED [FAST]: Platform 0 [HTTP 429]', 'warn']);
    expect(logs).toContainEqual(['UNCERTAIN [FAST]: Platform 1 [HTTP 403]', 'warn']);
  });

  it('runs e-mail recon when enabled and logs its failure without failing the scan', async () => {
    const { verify } = recordingVerifier();
    const logs: string[] = [];
    const loading: boolean[] = [];
    const ok = await runScan(
      { target: 'jo@example.com', targetType: 'email', config: { ...DEFAULT_SCAN_CONFIGS.email_only } },
      deterministic({
        verify,
        emailRecon: async (email) => ({ email, username: 'jo', domain: 'example.com', isValidSyntax: true, isDisposable: false, isCommonProvider: false, mxRecordsFound: true, mxServers: ['mx.example.com'], gravatarExists: false, hash: 'h', associatedFootprint: [] }),
        onLog: (m) => logs.push(m),
        onEmailLoading: (v) => loading.push(v),
      })
    );
    expect(ok.emailData?.domain).toBe('example.com');
    expect(loading).toEqual([true, false]);
    expect(logs).toContain('[DNS] Active MX mail server confirmed for domain: example.com');

    const failed = await runScan(
      { target: 'jo@example.com', targetType: 'email', config: { ...DEFAULT_SCAN_CONFIGS.email_only } },
      deterministic({ verify, emailRecon: async () => { throw new ApiError({ status: 400, message: 'Valid email address is required' }); }, onLog: (m) => logs.push(m) })
    );
    expect(failed.emailData).toBeNull();
    expect(logs).toContain('Email recon check error: Valid email address is required');
  });
});

describe('batch runner', () => {
  it('scans every target in order and records counts per item', async () => {
    const targets = ['a', 'b', 'c'].map((t, i) => ({ id: `t${i}`, target: t, type: 'username' as const }));
    const control = createBatchControl();
    const batch = createBatch(targets, { category: 'all', concurrency: 4 }, DEFAULT_SCAN_CONFIGS.quick, () => '12:00:00', () => 0.5);
    const order: string[] = [];
    const updates: number[] = [];
    const done = await runBatch(batch, { category: 'all', concurrency: 4 }, DEFAULT_SCAN_CONFIGS.quick, {
      control,
      timeLabel: () => '12:00:00',
      onUpdate: (b) => updates.push(b.currentIndex),
      scanItem: async (item, cfg) => {
        order.push(item.target);
        expect(cfg.concurrency).toBe(4);
        const { verify } = recordingVerifier(() => ({ status: 'found', statusCode: 200 }));
        return runScan({ target: item.target, targetType: item.type, config: cfg }, deterministic({ verify, resolveScope: scope(platforms(item.target.charCodeAt(0) - 96)), control: batchScanControl(control) }));
      },
    });
    expect(order).toEqual(['a', 'b', 'c']);
    expect(done.items.map((i) => [i.status, i.foundCount])).toEqual([['completed', 1], ['completed', 2], ['completed', 3]]);
    expect(done.isActive).toBe(false);
    // the final snapshot keeps the batch's own currentIndex (0), as the pre-engine App did
    expect(updates).toEqual([0, 0, 1, 1, 2, 2, 0]);
  });

  it('stops after the current item when aborted', async () => {
    const targets = ['a', 'b', 'c'].map((t, i) => ({ id: `t${i}`, target: t, type: 'username' as const }));
    const control = createBatchControl();
    const batch = createBatch(targets, { category: 'all', concurrency: 4 }, DEFAULT_SCAN_CONFIGS.quick);
    const order: string[] = [];
    await runBatch(batch, { category: 'all', concurrency: 4 }, DEFAULT_SCAN_CONFIGS.quick, {
      control,
      onUpdate: () => undefined,
      scanItem: async (item) => {
        order.push(item.target);
        control.abort();
        return { results: [], emailData: null, foundCount: 0, uncertainCount: 0, totalScanned: 0 };
      },
    });
    expect(order).toEqual(['a']);
    expect(batch.items.map((i) => i.status)).toEqual(['completed', 'queued', 'queued']);
  });
});
