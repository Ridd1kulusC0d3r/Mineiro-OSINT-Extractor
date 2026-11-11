import { useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { DEFAULT_SCAN_CONFIGS, getPlatformsForScope, PLATFORMS_DATABASE } from '../data/platforms';
import { runScan, type ScanControl, type ScanJob, type ScanOutcome, type ScanTargetType } from '../scan/engine';
import type { AiProfileReport, BulkTargetItem, CachedInvestigation, EmailReconData, ModularScanConfig, ScanPreset, ScanResult } from '../types';
import type { GraphPivotInvestigation } from '../graph/types';
import type { CaseCollectionSnapshot, MineiroCase } from '../cases/types';
import type { AppView } from '../app/views';
import type { AddLog } from './useScanLog';
import type { Cases } from './useCases';

interface UseScanOptions {
  addLog: AddLog;
  clearLogs: () => void;
  cases: Cases;
  navigate: (view: AppView) => void;
}

/**
 * The single-target workspace: what is being investigated (target, results, e-mail recon), the scan configuration,
 * and the scan engine (src/scan/engine.ts) wired to the local server. `isScanning` is the app-wide "a scan is running"
 * flag; the batch runner sets it too, so a single scan cannot start while a batch runs.
 */
export function useScan({ addLog, clearLogs, cases, navigate }: UseScanOptions) {
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState<ScanTargetType>('username');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [concurrency, setConcurrency] = useState<number>(16);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  // Modular Scan Architecture State (Fast mode by default for lightning-fast simple scans)
  const [scanConfig, setScanConfig] = useState<ModularScanConfig>(DEFAULT_SCAN_CONFIGS.quick);

  const [results, setResults] = useState<ScanResult[]>([]);
  const [aiProfile, setAiProfile] = useState<AiProfileReport | null>(null);
  const [emailData, setEmailData] = useState<EmailReconData | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);

  // Stop signal shared by the single scan and graph pivots. It is replaced only when a single scan starts, so a
  // pivot launched after Stop or Clear workspace sees it already aborted (behaviour kept from the pre-hook App).
  const stopRef = useRef<AbortController>(new AbortController());
  const graphPivotScanRef = useRef<boolean>(false);

  /** Runs the engine against the local server. `publish` mirrors progress and e-mail recon into the workspace. */
  const execute = (job: ScanJob, options: { publish: boolean; control: ScanControl }): Promise<ScanOutcome> =>
    runScan(job, {
      // The signal is not forwarded to fetch: probes already in flight finish when a scan stops, as they always did.
      verify: (request) => api.verify(request),
      emailRecon: (email) => api.emailRecon({ email }),
      control: options.control,
      onLog: addLog,
      onProgress: options.publish ? setResults : undefined,
      onEmailLoading: options.publish ? setIsEmailLoading : undefined,
      onEmailData: options.publish ? setEmailData : undefined,
    });

  // Execute Single Target OSINT Scan
  const startScan = async (overrideConfig?: ModularScanConfig) => {
    if (!target.trim() || isScanning || graphPivotScanRef.current) return;
    const activeCfg = overrideConfig || scanConfig;

    const stop = new AbortController();
    stopRef.current = stop;
    setIsScanning(true);
    setAiProfile(null);
    setEmailData(null);

    // A leading @ is decoration, not part of the handle (it would become %40 in every URL).
    const cleanTarget = targetType === 'username' ? target.trim().replace(/^@+/, '') : target.trim();
    const platforms = getPlatformsForScope(activeCfg.platformScope, activeCfg.selectedCategory, targetType);
    addLog(`=== INITIALIZING MINEIRO OSINT RECON ENGINE ===`, 'info');
    addLog(`Target: @${cleanTarget} | Mode: ${targetType.toUpperCase()} | Preset: ${activeCfg.preset.toUpperCase()} | Scope: ${platforms.length} platforms (${activeCfg.concurrency}x concurrency)`, 'info');

    const outcome = await execute({ target: cleanTarget, targetType, config: activeCfg }, { publish: true, control: { signal: stop.signal } });

    setIsScanning(false);
    addLog(`=== SCAN COMPLETE: ${outcome.foundCount} FOUND RESULTS (${outcome.uncertainCount} UNCERTAIN) ===`, 'success');

    // Save successful scan to local persistence cache (last 5 scans), the case store and an integrity snapshot.
    if (!stop.signal.aborted && outcome.totalScanned > 0) {
      await cases.persistScan(cleanTarget, targetType, activeCfg.preset, outcome);
    }

    // Transition to the Results Dashboard after scan completes
    navigate('intelligence');

    if (outcome.foundCount > 0) {
      addLog('[SCAN] AI analysis remains on-demand in the evidence-bounded Analyst Copilot.', 'info');
    }
  };

  /** Raises the stop signal of the running single scan or graph pivot (probes in flight still finish). */
  const abortSingleScan = () => stopRef.current.abort();

  const stopScan = () => {
    abortSingleScan();
    setIsScanning(false);
    addLog('Signal received: Halting running scan worker.', 'warn');
    navigate('intelligence');
  };

  // Graph pivot scan: scans a similar username in the background without replacing
  // the current investigation. The result is returned to the graph workspace so
  // analysts can compare the original target and candidate in one visual context.
  const pivotScan = async (newTarget: string): Promise<GraphPivotInvestigation> => {
    const clean = newTarget.trim();
    if (!clean) throw new Error('Pivot target is empty.');
    if (isScanning || graphPivotScanRef.current) throw new Error('A scan is already running. Finish or stop it before launching a graph pivot.');
    graphPivotScanRef.current = true;

    const pivotConfig: ModularScanConfig = {
      ...DEFAULT_SCAN_CONFIGS.standard,
      concurrency: Math.min(10, DEFAULT_SCAN_CONFIGS.standard.concurrency),
      enableEvidenceChecks: true,
      enableAutoAiProfile: false,
    };

    addLog(`[GRAPH PIVOT] Background scan started for @${clean} from @${target || 'target'}.`, 'info');

    let outcome: ScanOutcome;
    try {
      outcome = await execute({ target: clean, targetType: 'username', config: pivotConfig }, { publish: false, control: { signal: stopRef.current.signal } });
    } finally {
      graphPivotScanRef.current = false;
    }

    const investigation: GraphPivotInvestigation = {
      id: `pivot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceTarget: target || 'target',
      target: clean,
      foundCount: outcome.foundCount,
      uncertainCount: outcome.uncertainCount,
      totalScanned: outcome.totalScanned,
      results: outcome.results,
      scannedAt: new Date().toISOString(),
    };

    await cases.persistPivot(investigation, { target, targetType }, pivotConfig.preset);

    addLog(
      `[GRAPH PIVOT] @${clean}: ${outcome.foundCount} found · ${outcome.uncertainCount} unresolved · ${outcome.totalScanned} checked.`,
      outcome.foundCount > 0 ? 'success' : 'info'
    );

    return investigation;
  };

  // Handler for direct scan preset selection
  const selectPreset = (preset: ScanPreset) => {
    const newCfg = { ...DEFAULT_SCAN_CONFIGS[preset] };
    setScanConfig(newCfg);
    setSelectedCategory(newCfg.selectedCategory);
    setConcurrency(newCfg.concurrency);
    const platforms = getPlatformsForScope(newCfg.platformScope, newCfg.selectedCategory);
    addLog(`[MODULAR PRESET] Switched to ${preset.toUpperCase()} (${platforms.length} targets, WAF: ${newCfg.wafInspectionMode.toUpperCase()}, Concurrency: ${newCfg.concurrency}x)`, 'info');
  };

  // Handler for fast vs deep scan depth toggle (adjusting timeout threshold and WAF retry strategy)
  const toggleScanDepth = (depth: 'fast' | 'deep') => {
    setScanConfig((prev) => {
      const isDeep = depth === 'deep';
      return {
        ...prev,
        wafInspectionMode: depth,
        scanDepth: depth,
        timeoutMs: isDeep ? 6500 : 2500,
        wafRetryStrategy: isDeep ? 'adaptive' : 'none',
        preset: 'custom',
      };
    });
    addLog(
      `[SCAN DEPTH] Set to ${depth.toUpperCase()} (Timeout: ${depth === 'deep' ? '6,500ms' : '2,500ms'}, WAF Strategy: ${depth === 'deep' ? 'Adaptive Retry with Browser-like Headers' : 'Single-Pass / Fail-Fast'})`,
      'info'
    );
  };

  const flipScanDepth = () => toggleScanDepth(scanConfig.wafInspectionMode === 'deep' ? 'fast' : 'deep');

  const changeCategory = (cat: string) => {
    setSelectedCategory(cat);
    setScanConfig((prev) => ({ ...prev, selectedCategory: cat, preset: 'custom' }));
  };

  const changeConcurrency = (rate: number) => {
    setConcurrency(rate);
    setScanConfig((prev) => ({ ...prev, concurrency: rate, preset: 'custom' }));
  };

  /** A configuration saved from the modular scan modal. */
  const applyConfig = (newConfig: ModularScanConfig) => {
    setScanConfig(newConfig);
    setSelectedCategory(newConfig.selectedCategory);
    setConcurrency(newConfig.concurrency);
  };

  // ---------- loading saved work into the workspace ----------

  const openSnapshot = (snapshot: CaseCollectionSnapshot) => {
    if (isScanning) {
      addLog('Cannot load a case snapshot while a scan is running.', 'warn');
      return;
    }
    setTarget(snapshot.target);
    setTargetType(snapshot.targetType);
    setResults(snapshot.results || []);
    setEmailData(snapshot.emailData || null);
    setAiProfile(null);
    setScanConfig((previous) => ({ ...previous, preset: snapshot.preset }));
    navigate('linkage');
    addLog(
      `[CASE RESTORE] Loaded snapshot ${snapshot.id} for "${snapshot.target}" from ${new Date(snapshot.collectedAt).toLocaleString()}.`,
      'success'
    );
  };

  const openCase = (caseFile: MineiroCase) => {
    if (isScanning) {
      addLog('Cannot load a persistent case while a scan is running.', 'warn');
      return;
    }
    cases.setCurrentCaseId(caseFile.id);
    const latest = [...caseFile.collections]
      .filter((item) => item.target.toLowerCase() === caseFile.primaryTarget.toLowerCase())
      .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0];
    if (latest) {
      openSnapshot(latest);
    } else {
      setTarget(caseFile.primaryTarget);
      setTargetType(caseFile.primaryTargetType);
      setResults([]);
      setEmailData(null);
      navigate('linkage');
    }
    addLog(`[CASE] Opened persistent case ${caseFile.id} · ${caseFile.name}.`, 'success');
  };

  // Local State Persistence Handlers (Cache of last 5 scans in localStorage)
  const openCachedInvestigation = (cached: CachedInvestigation) => {
    if (isScanning) {
      addLog('Cannot load cached scan while a scan is actively running. Stop current scan first.', 'warn');
      return;
    }
    setTarget(cached.target);
    setTargetType(cached.targetType);
    setResults(cached.results || []);
    setEmailData(cached.emailData || null);
    setAiProfile(cached.aiProfile || null);
    navigate('intelligence');
    addLog(`[CACHE RESTORE] Restored investigation for "${cached.target}" (${cached.foundCount} hits, cached on ${cached.formattedTime})`, 'success');
  };

  /** Opens a finished batch target in the workspace (an explicit analyst action). */
  const openBatchItem = (item: BulkTargetItem) => {
    setTarget(item.target);
    setTargetType(item.type);
    if (item.results) {
      setResults(item.results);
    }
    setEmailData(item.emailData || null);
    setAiProfile(item.aiProfile || null);
    navigate('intelligence');
    addLog(`Loaded forensic dossier for batch target: @${item.target}`, 'info');
  };

  const reset = () => {
    abortSingleScan();
    setIsScanning(false);
    setTarget('');
    setResults([]);
    setAiProfile(null);
    setEmailData(null);
    cases.setCurrentCaseId(null);
    clearLogs();
    navigate('intelligence');
    addLog('Workspace reset. System in standby.', 'info');
  };

  const counts = useMemo(() => ({
    found: results.filter((r) => r.status === 'found').length,
    uncertain: results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited').length,
    scanned: results.filter((r) => r.status !== 'pending').length,
  }), [results]);

  // Detectors of the selected category (the total shown before the first scan).
  const categoryPlatformCount = useMemo(
    () => (selectedCategory === 'all' ? PLATFORMS_DATABASE.length : PLATFORMS_DATABASE.filter((p) => p.category === selectedCategory).length),
    [selectedCategory]
  );

  return {
    // workspace
    target, setTarget, targetType, setTargetType, results, emailData, aiProfile, isEmailLoading, counts,
    // configuration
    scanConfig, selectedCategory, concurrency, categoryPlatformCount,
    selectPreset, toggleScanDepth, flipScanDepth, changeCategory, changeConcurrency, applyConfig,
    // running
    isScanning, setIsScanning, execute, startScan, stopScan, abortSingleScan, pivotScan,
    // loading saved work
    openSnapshot, openCase, openCachedInvestigation, openBatchItem, reset,
  };
}

export type Scan = ReturnType<typeof useScan>;
