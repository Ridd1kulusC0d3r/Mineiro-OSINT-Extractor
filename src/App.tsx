import { useEffect, useState, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { TargetBar } from './components/TargetBar';
import { StatsBar } from './components/StatsBar';
import { DashboardView } from './components/DashboardView';
import { IntelligenceReportView } from './components/IntelligenceReportView';
import { HomeView } from './components/HomeView';
import { PlatformGrid } from './components/PlatformGrid';
import { PlatformTable } from './components/PlatformTable';
import { EmailReconCard } from './components/EmailReconCard';
import { TerminalLogs } from './components/TerminalLogs';
import { IntelligenceExportModal } from './components/IntelligenceExportModal';
import { DossierPrintView } from './components/DossierPrintView';
import { GeminiConfigModal } from './components/GeminiConfigModal';
import { CorrelationWorkspace } from './components/CorrelationWorkspace';
import { AiWorkspace } from './components/AiWorkspace';
import { BulkImportModal } from './components/BulkImportModal';
import { BulkScanView } from './components/BulkScanView';
import { ModularScanModal } from './components/ModularScanModal';
import { InvestigationHistoryModal } from './components/InvestigationHistoryModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { ToastProvider } from './components/Toast';
import { PLATFORMS_DATABASE, DEFAULT_SCAN_CONFIGS, getPlatformsForScope } from './data/platforms';
import { 
  ScanResult, 
  AiProfileReport, 
  EmailReconData, 
  ScanLog, 
  BulkBatchState, 
  BulkTargetItem,
  ModularScanConfig,
  ScanPreset,
  CachedInvestigation
} from './types';
import { ParsedTarget } from './utils/csvParser';
import type { IntelligenceRequirement } from './intelligence/types';
import type { GraphPivotInvestigation } from './graph/types';
import type { CaseCollectionSnapshot, MineiroCase } from './cases/types';
import { appendCollection, appendPivot, deleteCase as deletePersistentCase, getCase, getOrCreateCaseForTarget, listCases } from './cases/store';
import { 
  getCachedInvestigations, 
  saveInvestigationToCache, 
  updateInvestigationInCache, 
  deleteCachedInvestigation, 
  clearCachedInvestigations,
  takeInvestigationSnapshot 
} from './utils/scanStorage';

export default function App() {
  const [target, setTarget] = useState('');
  const [targetType, setTargetType] = useState<'username' | 'email'>('username');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [concurrency, setConcurrency] = useState<number>(16);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<
    'intelligence' | 'dashboard' | 'grid' | 'table' | 'profile' | 'ai' | 'linkage' | 'terminal' | 'batch'
  >('intelligence');
  const [intelligenceRequirement, setIntelligenceRequirement] = useState<IntelligenceRequirement>('account_correlation');

  // Fast compatibility cache: last 5 scans in localStorage.
  const [cachedScans, setCachedScans] = useState<CachedInvestigation[]>(() => getCachedInvestigations());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Persistent Case Graph: long-lived investigation memory in IndexedDB.
  const [persistentCases, setPersistentCases] = useState<MineiroCase[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const currentCase = useMemo(
    () => persistentCases.find((item) => item.id === currentCaseId) || null,
    [persistentCases, currentCaseId]
  );

  // Global Keyboard Shortcuts Help Modal
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // Modular Scan Architecture State (Fast mode by default for lightning-fast simple scans)
  const [scanConfig, setScanConfig] = useState<ModularScanConfig>(DEFAULT_SCAN_CONFIGS.quick);
  const [isModularModalOpen, setIsModularModalOpen] = useState<boolean>(false);

  // Personal Gemini API Key & Model Configuration
  const [personalGeminiKey, setPersonalGeminiKey] = useState<string>(() => {
    return localStorage.getItem('mineiro_gemini_key') || '';
  });
  const [selectedGeminiModel, setSelectedGeminiModel] = useState<string>(() => {
    const saved = localStorage.getItem('mineiro_gemini_model');
    if (saved && saved !== 'gemini-flash-latest') return saved;
    return 'gemini-3.8-flash';
  });
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState<boolean>(false);

  // Bulk Target CSV Batch State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkBatch, setBulkBatch] = useState<BulkBatchState | null>(null);

  // Local filters
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'found' | 'uncertain' | 'not_found' | 'rate_limited'>('all');

  // Results & Recon State
  const [results, setResults] = useState<ScanResult[]>([]);
  const [aiProfile, setAiProfile] = useState<AiProfileReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [emailData, setEmailData] = useState<EmailReconData | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState<boolean>(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const abortRef = useRef<boolean>(false);
  const bulkBatchRef = useRef<BulkBatchState | null>(null);
  const isBatchPausedRef = useRef<boolean>(false);
  const abortBatchRef = useRef<boolean>(false);
  const skipTargetRef = useRef<boolean>(false);
  const graphPivotScanRef = useRef<boolean>(false);

  const addLog = (message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp,
        level,
        message,
      },
    ]);
  };

  const refreshPersistentCases = async () => {
    try {
      const cases = await listCases();
      setPersistentCases(cases);
      return cases;
    } catch (error) {
      console.warn('[MINEIRO CASES] Failed to load IndexedDB cases:', error);
      return [];
    }
  };

  useEffect(() => {
    refreshPersistentCases();
  }, []);

  const ensureCaseForTarget = async (
    caseTarget: string,
    caseTargetType: 'username' | 'email'
  ): Promise<MineiroCase> => {
    if (currentCaseId) {
      const attached = await getCase(currentCaseId);
      if (
        attached &&
        attached.primaryTarget.toLowerCase() === caseTarget.trim().toLowerCase() &&
        attached.primaryTargetType === caseTargetType
      ) {
        return attached;
      }
    }

    const caseFile = await getOrCreateCaseForTarget(caseTarget, caseTargetType);
    setCurrentCaseId(caseFile.id);
    await refreshPersistentCases();
    return caseFile;
  };

  const loadCaseCollectionSnapshot = (snapshot: CaseCollectionSnapshot) => {
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
    setActiveView('linkage');
    addLog(
      `[CASE RESTORE] Loaded snapshot ${snapshot.id} for "${snapshot.target}" from ${new Date(snapshot.collectedAt).toLocaleString()}.`,
      'success'
    );
  };

  const loadPersistentCase = (caseFile: MineiroCase) => {
    if (isScanning) {
      addLog('Cannot load a persistent case while a scan is running.', 'warn');
      return;
    }
    setCurrentCaseId(caseFile.id);
    const latest = [...caseFile.collections]
      .filter((item) => item.target.toLowerCase() === caseFile.primaryTarget.toLowerCase())
      .sort((a, b) => b.collectedAt.localeCompare(a.collectedAt))[0];
    if (latest) {
      loadCaseCollectionSnapshot(latest);
    } else {
      setTarget(caseFile.primaryTarget);
      setTargetType(caseFile.primaryTargetType);
      setResults([]);
      setEmailData(null);
      setActiveView('linkage');
    }
    addLog(`[CASE] Opened persistent case ${caseFile.id} · ${caseFile.name}.`, 'success');
  };

  const handleDeletePersistentCase = async (caseId: string) => {
    await deletePersistentCase(caseId);
    if (currentCaseId === caseId) setCurrentCaseId(null);
    await refreshPersistentCases();
    addLog(`[CASE] Deleted persistent case ${caseId} from IndexedDB.`, 'info');
  };

  // Handler for direct scan preset selection
  const handleSelectPreset = (preset: ScanPreset) => {
    const newCfg = { ...DEFAULT_SCAN_CONFIGS[preset] };
    setScanConfig(newCfg);
    setSelectedCategory(newCfg.selectedCategory);
    setConcurrency(newCfg.concurrency);
    const platforms = getPlatformsForScope(newCfg.platformScope, newCfg.selectedCategory);
    addLog(`[MODULAR PRESET] Switched to ${preset.toUpperCase()} (${platforms.length} targets, WAF: ${newCfg.wafInspectionMode.toUpperCase()}, Concurrency: ${newCfg.concurrency}x)`, 'info');
  };

  // Handler for fast vs deep scan depth toggle (adjusting timeout threshold and WAF retry strategy)
  const handleToggleScanDepth = (depth: 'fast' | 'deep') => {
    setScanConfig((prev) => {
      const isDeep = depth === 'deep';
      const timeoutMs = isDeep ? 6500 : 2500;
      const wafRetryStrategy: 'none' | 'adaptive' = isDeep ? 'adaptive' : 'none';
      return {
        ...prev,
        wafInspectionMode: depth,
        scanDepth: depth,
        timeoutMs,
        wafRetryStrategy,
        preset: 'custom',
      };
    });
    addLog(
      `[SCAN DEPTH] Set to ${depth.toUpperCase()} (Timeout: ${depth === 'deep' ? '6,500ms' : '2,500ms'}, WAF Strategy: ${depth === 'deep' ? 'Adaptive Retry with Browser-like Headers' : 'Single-Pass / Fail-Fast'})`,
      'info'
    );
  };

  // Filtered platforms based on category
  const targetPlatforms = useMemo(() => {
    if (selectedCategory === 'all') return PLATFORMS_DATABASE;
    return PLATFORMS_DATABASE.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  // Core Probe Engine: scans a target according to ModularScanConfig
  const scanTargetCore = async (
    targetHandle: string,
    targetMode: 'username' | 'email',
    configToUse: ModularScanConfig,
    isBulk: boolean = false,
    publishToWorkspace: boolean = true
  ): Promise<{
    results: ScanResult[];
    emailData: EmailReconData | null;
    foundCount: number;
    uncertainCount: number;
    totalScanned: number;
  }> => {
    const cleanTarget = targetHandle.trim();
    const platformsToScan = getPlatformsForScope(
      configToUse.platformScope,
      configToUse.selectedCategory,
      targetMode
    );

    const initialResults: ScanResult[] = platformsToScan.map((p) => ({
      id: `${p.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      platformId: p.id,
      platformName: p.name,
      category: p.category,
      url: p.urlPattern.replace('{username}', encodeURIComponent(cleanTarget)),
      status: 'pending',
      siteType: p.siteType,
      detectorReliability: p.detectorReliability,
      reliabilityTier: p.reliabilityTier,
    }));
    if (publishToWorkspace) setResults(initialResults);

    let targetEmailData: EmailReconData | null = null;
    // Modular email recon execution
    if (configToUse.enableEmailRecon && (targetMode === 'email' || cleanTarget.includes('@'))) {
      if (publishToWorkspace) setIsEmailLoading(true);
      addLog(`[DNS RECON] Probing MX records & Gravatar for ${cleanTarget}...`, 'info');
      try {
        const res = await fetch('/api/osint/email-recon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanTarget }),
        });
        const data = await res.json();
        targetEmailData = data;
        if (publishToWorkspace) setEmailData(data);
        if (data.mxRecordsFound) {
          addLog(`[DNS] Active MX mail server confirmed for domain: ${data.domain}`, 'success');
        }
        if (data.gravatarExists) {
          addLog(`[GRAVATAR] Verified profile identified for ${cleanTarget}`, 'success');
        }
      } catch (err: any) {
        addLog(`Email recon check error: ${err.message}`, 'warn');
      } finally {
        if (publishToWorkspace) setIsEmailLoading(false);
      }
    }

    const usernamePart = cleanTarget.includes('@') ? cleanTarget.split('@')[0] : cleanTarget;
    const currentResults = [...initialResults];

    const shouldStop = async () => {
      if (isBulk) {
        if (abortBatchRef.current) return true;
        if (skipTargetRef.current) {
          addLog(`[BATCH] Skipped target @${cleanTarget} on operator instruction.`, 'warn');
          return true;
        }
        while (isBatchPausedRef.current) {
          await new Promise((r) => setTimeout(r, 400));
          if (abortBatchRef.current) return true;
        }
        return false;
      }
      if (abortRef.current) {
        addLog('Scan aborted by analyst command.', 'warn');
        return true;
      }
      return false;
    };

    const probeItems = async (
      items: ScanResult[],
      options: {
        concurrency: number;
        depth: 'fast' | 'deep';
        timeoutMs: number;
        evidence: boolean;
        phaseLabel: string;
      }
    ) => {
      const batchSize = Math.max(2, Math.min(options.concurrency, 24));
      for (let index = 0; index < items.length; index += batchSize) {
        if (await shouldStop()) break;

        const batch = items.slice(index, index + batchSize);
        batch.forEach((item) => { item.status = 'scanning'; });
        if (publishToWorkspace) setResults([...currentResults]);

        await Promise.all(
          batch.map(async (item) => {
            const platform = PLATFORMS_DATABASE.find((p) => p.id === item.platformId);
            const targetUrl = item.url;

            try {
              const res = await fetch('/api/osint/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  url: targetUrl,
                  platformId: item.platformId,
                  expectedStatus: platform?.expectedStatus || 200,
                  errorStatus: platform?.errorStatus || 404,
                  fastMode: options.depth === 'fast',
                  scanDepth: options.depth,
                  timeoutMs: options.timeoutMs,
                  // v1.4 respects protection boundaries: progressive validation does not attempt bypass retries.
                  wafRetryStrategy: 'none',
                  enableEvidenceChecks: options.evidence,
                  baseline: options.evidence,
                  username: usernamePart,
                  detectorReliability: platform?.detectorReliability || 60,
                }),
              });

              const data = await res.json();
              item.status = data.status || 'not_found';
              item.statusCode = data.statusCode;
              item.responseTimeMs = data.responseTimeMs;
              item.confidenceScore = data.confidenceScore || 0;
              item.evidenceLevel = data.evidenceLevel;
              item.evidenceSignals = data.evidenceSignals || [];
              item.evidenceChecksPassed = data.evidenceChecksPassed;
              item.evidenceChecksTotal = data.evidenceChecksTotal;
              item.detectorReliability = data.detectorReliability ?? platform?.detectorReliability;
              item.siteType = platform?.siteType;
              item.reliabilityTier = platform?.reliabilityTier;
              item.uncertainReason = data.uncertainReason;
              item.wafRetried = false;
              item.retryResolved = false;
              item.wafStrategyApplied = 'respect-protection-boundary';
              item.scanDepth = options.depth;
              item.checkedAt = new Date().toISOString();

              if (item.status === 'found') {
                addLog(`FOUND [${options.phaseLabel}]: ${platform?.name || item.platformName} -> ${targetUrl} [${item.statusCode}]`, 'success');
              } else if (item.status === 'uncertain' || item.status === 'rate_limited') {
                addLog(`${item.status.toUpperCase()} [${options.phaseLabel}]: ${item.platformName} [HTTP ${item.statusCode || 0}]`, 'warn');
              }
            } catch (err: any) {
              item.status = 'error';
              item.statusCode = 0;
              item.confidenceScore = 0;
              item.uncertainReason = err?.message || 'Probe transport error';
            }
          })
        );

        if (publishToWorkspace) setResults([...currentResults]);
      }
    };

    const progressiveFullScan =
      configToUse.platformScope === 'all' &&
      configToUse.wafInspectionMode === 'deep' &&
      currentResults.length > 100;

    if (progressiveFullScan) {
      const discoveryConcurrency = Math.max(14, Math.min(20, configToUse.concurrency * 3));
      addLog(
        `[PROGRESSIVE SCAN] Phase 1 discovery: ${currentResults.length} detectors at ${discoveryConcurrency}x concurrency, 2.5s cap.`,
        'info'
      );

      await probeItems(currentResults, {
        concurrency: discoveryConcurrency,
        depth: 'fast',
        timeoutMs: Math.min(2500, configToUse.timeoutMs || 2500),
        evidence: false,
        phaseLabel: 'DISCOVERY',
      });

      if (!(await shouldStop())) {
        const validationCandidates = currentResults.filter(
          (item) =>
            item.status === 'found' ||
            item.status === 'uncertain' ||
            item.status === 'rate_limited'
        );

        if (validationCandidates.length) {
          addLog(
            `[PROGRESSIVE SCAN] Phase 2 validation: ${validationCandidates.length} candidate(s) with Evidence Engine.`,
            'info'
          );
          await probeItems(validationCandidates, {
            concurrency: Math.max(4, Math.min(8, configToUse.concurrency)),
            depth: 'deep',
            timeoutMs: Math.min(5000, configToUse.timeoutMs || 5000),
            evidence: true,
            phaseLabel: 'VALIDATION',
          });
        }
      }
    } else {
      await probeItems(currentResults, {
        concurrency: configToUse.concurrency,
        depth: configToUse.wafInspectionMode === 'deep' ? 'deep' : 'fast',
        timeoutMs: configToUse.timeoutMs || (configToUse.wafInspectionMode === 'deep' ? 5000 : 2500),
        evidence: configToUse.enableEvidenceChecks,
        phaseLabel: configToUse.wafInspectionMode === 'deep' ? 'DEEP' : 'FAST',
      });
    }

    const foundTotal = currentResults.filter((r) => r.status === 'found').length;
    const uncertainTotal = currentResults.filter((r) => r.status === 'uncertain').length;
    const scannedTotal = currentResults.filter((r) => r.status !== 'pending').length;

    return {
      results: currentResults,
      emailData: targetEmailData,
      foundCount: foundTotal,
      uncertainCount: uncertainTotal,
      totalScanned: scannedTotal,
    };
  };

  // Execute Single Target OSINT Scan
  const handleStartScan = async (overrideConfig?: ModularScanConfig) => {
    if (!target.trim() || isScanning || graphPivotScanRef.current) return;
    const activeCfg = overrideConfig || scanConfig;

    abortRef.current = false;
    setIsScanning(true);
    setAiProfile(null);
    setEmailData(null);

    const cleanTarget = target.trim();
    const platforms = getPlatformsForScope(activeCfg.platformScope, activeCfg.selectedCategory, targetType);
    addLog(`=== INITIALIZING MINEIRO OSINT RECON ENGINE ===`, 'info');
    addLog(`Target: @${cleanTarget} | Mode: ${targetType.toUpperCase()} | Preset: ${activeCfg.preset.toUpperCase()} | Scope: ${platforms.length} platforms (${activeCfg.concurrency}x concurrency)`, 'info');

    const scanResult = await scanTargetCore(cleanTarget, targetType, activeCfg, false);

    setIsScanning(false);
    addLog(`=== SCAN COMPLETE: ${scanResult.foundCount} FOUND RESULTS (${scanResult.uncertainCount} UNCERTAIN) ===`, 'success');

    // Save successful scan to local persistence cache (last 5 scans)
    if (!abortRef.current && scanResult.totalScanned > 0) {
      const updatedCache = saveInvestigationToCache({
        target: cleanTarget,
        targetType,
        results: scanResult.results,
        emailData: scanResult.emailData,
        aiProfile: null,
        preset: activeCfg.preset,
        foundCount: scanResult.foundCount,
        uncertainCount: scanResult.uncertainCount,
        totalScanned: scanResult.totalScanned,
      });
      setCachedScans(updatedCache);
      addLog(`[CACHE] Investigation persisted to localStorage (Slot ${Math.min(updatedCache.length, 5)}/5)`, 'info');

      // Persist the collection as an immutable-ish Case snapshot in IndexedDB.
      try {
        const caseFile = await ensureCaseForTarget(cleanTarget, targetType);
        const collectedAt = new Date().toISOString();
        await appendCollection(caseFile.id, {
          id: `collection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          target: cleanTarget,
          targetType,
          collectedAt,
          preset: activeCfg.preset,
          results: scanResult.results,
          emailData: scanResult.emailData,
          foundCount: scanResult.foundCount,
          uncertainCount: scanResult.uncertainCount,
          totalScanned: scanResult.totalScanned,
        });
        setCurrentCaseId(caseFile.id);
        await refreshPersistentCases();
        addLog(`[CASE] Collection appended to ${caseFile.id}. Diff Intelligence is available after the second snapshot for this target.`, 'success');
      } catch (caseError: any) {
        addLog(`[CASE] Persistent case write failed: ${caseError?.message || caseError}`, 'warn');
      }

      // Generate cryptographically signed snapshot for chain of custody
      try {
        const snapshot = await takeInvestigationSnapshot({
          target: cleanTarget,
          targetType,
          results: scanResult.results,
          emailData: scanResult.emailData,
          aiProfile: null,
          preset: activeCfg.preset,
          foundCount: scanResult.foundCount,
          uncertainCount: scanResult.uncertainCount,
          totalScanned: scanResult.totalScanned,
        });
        setCachedScans(getCachedInvestigations());
        addLog(`[SNAPSHOT] Local integrity snapshot generated: ${snapshot.snapshotId} (SHA-256: ${snapshot.summaryHash.slice(0, 10)}...)`, 'success');
      } catch (snapErr) {
        console.warn('Could not auto-generate snapshot:', snapErr);
      }
    }

    // Transition to the Results Dashboard after scan completes
    setActiveView('intelligence');

    if (scanResult.foundCount > 0) {
      addLog('[SCAN] AI analysis remains on-demand in the evidence-bounded Analyst Copilot.', 'info');
    }
  };

  const handleStopScan = () => {
    abortRef.current = true;
    setIsScanning(false);
    addLog('Signal received: Halting running scan worker.', 'warn');
    setActiveView('intelligence');
  };

  // Execute Bulk Target Batch Reconnaissance
  const handleStartBulkScan = async (
    importedTargets: ParsedTarget[],
    options: {
      category: string;
      concurrency: number;
      autoAiProfile: boolean;
    }
  ) => {
    if (importedTargets.length === 0) return;

    const newBatch: BulkBatchState = {
      batchId: Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: `Batch Ingestion (${importedTargets.length} targets)`,
      items: importedTargets.map((t) => ({
        id: t.id,
        target: t.target,
        type: t.type,
        status: 'queued',
        foundCount: 0,
        uncertainCount: 0,
        totalScanned: 0,
        notes: t.notes,
      })),
      currentIndex: 0,
      isActive: true,
      isPaused: false,
      autoAiProfile: options.autoAiProfile,
      selectedCategory: options.category,
      concurrency: options.concurrency,
      startedAt: new Date().toLocaleTimeString(),
    };

    setBulkBatch(newBatch);
    bulkBatchRef.current = newBatch;
    isBatchPausedRef.current = false;
    abortBatchRef.current = false;
    skipTargetRef.current = false;

    setActiveView('batch');
    setIsScanning(true);

    addLog(`=== INITIALIZING BATCH RECONNAISSANCE: ${importedTargets.length} TARGETS ===`, 'info');
    addLog(`Batch ID: ${newBatch.batchId} | Scope: ${options.category.toUpperCase()} | Concurrency: ${options.concurrency}`, 'info');

    // Process targets in sequence
    for (let idx = 0; idx < newBatch.items.length; idx++) {
      if (abortBatchRef.current) {
        addLog(`[BATCH] Investigation halted by analyst command.`, 'warn');
        break;
      }

      while (isBatchPausedRef.current) {
        await new Promise((r) => setTimeout(r, 400));
        if (abortBatchRef.current) break;
      }
      if (abortBatchRef.current) break;

      skipTargetRef.current = false;
      const currentItem = newBatch.items[idx];
      currentItem.status = 'scanning';
      currentItem.startedAt = new Date().toLocaleTimeString();

      setTarget(currentItem.target);
      setTargetType(currentItem.type);

      // Update state for live spotlight
      setBulkBatch({ ...newBatch, currentIndex: idx });

      addLog(`>>> [BATCH ${idx + 1}/${newBatch.items.length}] Initiating probe for: ${currentItem.target} (${currentItem.type})`, 'info');

      const bulkConfig: ModularScanConfig = {
        ...scanConfig,
        selectedCategory: options.category,
        concurrency: options.concurrency,
        enableAutoAiProfile: false,
      };

      const probeResult = await scanTargetCore(
        currentItem.target,
        currentItem.type,
        bulkConfig,
        true
      );

      currentItem.results = probeResult.results;
      currentItem.emailData = probeResult.emailData;
      currentItem.foundCount = probeResult.foundCount;
      currentItem.uncertainCount = probeResult.uncertainCount;
      currentItem.totalScanned = probeResult.totalScanned;
      currentItem.completedAt = new Date().toLocaleTimeString();

      if (skipTargetRef.current) {
        currentItem.status = 'skipped';
      } else {
        currentItem.status = 'completed';
      }

      // Legacy automatic profiling is disabled in v1.4.1.
      // Analysts can use the evidence-bounded Copilot after inspecting the target.

      setBulkBatch({ ...newBatch, currentIndex: idx });
      addLog(`<<< [BATCH ${idx + 1}/${newBatch.items.length}] Target @${currentItem.target} completed: ${currentItem.foundCount} hits located.`, 'success');
    }

    setIsScanning(false);
    newBatch.isActive = false;
    newBatch.completedAt = new Date().toLocaleTimeString();
    setBulkBatch({ ...newBatch });
    const totalBatchHits = newBatch.items.reduce((acc, i) => acc + (i.foundCount || 0), 0);
    addLog(`=== BATCH RECONNAISSANCE CONCLUDED: ${newBatch.items.length} TARGETS PROCESSED (${totalBatchHits} CUMULATIVE HITS) ===`, 'success');
  };

  const handlePauseBatch = () => {
    isBatchPausedRef.current = true;
    if (bulkBatch) {
      setBulkBatch({ ...bulkBatch, isPaused: true });
    }
    addLog('[BATCH] Batch execution paused by analyst.', 'warn');
  };

  const handleResumeBatch = () => {
    isBatchPausedRef.current = false;
    if (bulkBatch) {
      setBulkBatch({ ...bulkBatch, isPaused: false });
    }
    addLog('[BATCH] Resuming batch target queue.', 'info');
  };

  const handleSkipTarget = () => {
    skipTargetRef.current = true;
    addLog('[BATCH] Skip target signal dispatched.', 'warn');
  };

  const handleAbortBatch = () => {
    abortBatchRef.current = true;
    abortRef.current = true;
    isBatchPausedRef.current = false;
    setIsScanning(false);
    if (bulkBatch) {
      const updatedItems = bulkBatch.items.map((it) => 
        it.status === 'queued' || it.status === 'scanning' ? { ...it, status: 'skipped' as const } : it
      );
      setBulkBatch({ ...bulkBatch, items: updatedItems, isActive: false });
    }
    addLog('[BATCH] Batch aborted. Remaining targets cancelled.', 'warn');
  };

  const handleInspectTarget = (item: BulkTargetItem) => {
    setTarget(item.target);
    setTargetType(item.type);
    if (item.results) {
      setResults(item.results);
    }
    setEmailData(item.emailData || null);
    setAiProfile(item.aiProfile || null);
    setActiveView('intelligence');
    addLog(`Loaded forensic dossier for batch target: @${item.target}`, 'info');
  };

  const handleRemoveQueuedItem = (id: string) => {
    if (!bulkBatch) return;
    const updatedItems = bulkBatch.items.filter((item) => item.id !== id);
    setBulkBatch({ ...bulkBatch, items: updatedItems });
    addLog(`Removed target from batch queue.`, 'info');
  };

  // Request AI Intelligence Dossier from server-side Gemini
  const fetchAiProfile = async (targetHandle: string, foundList: ScanResult[]) => {
    setIsAiLoading(true);
    const modelNote = personalGeminiKey ? ` (Personal Key • ${selectedGeminiModel})` : '';
    addLog(`Synthesizing target intelligence profile with Gemini AI${modelNote}...`, 'info');

    try {
      const res = await fetch('/api/osint/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(personalGeminiKey ? { 'x-gemini-api-key': personalGeminiKey } : {}),
        },
        body: JSON.stringify({
          target: targetHandle,
          targetType,
          foundPlatforms: foundList.map((f) => ({
            platformName: f.platformName,
            category: f.category,
            url: f.url,
          })),
          emailData,
          model: selectedGeminiModel,
          customApiKey: personalGeminiKey || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate profile');
      const data: AiProfileReport = await res.json();
      setAiProfile(data);

      // Persist AI profile report into existing cached investigation
      const updatedCache = updateInvestigationInCache(targetHandle, targetType, { aiProfile: data });
      setCachedScans(updatedCache);

      // Refresh local integrity snapshot after optional AI synthesis
      try {
        await takeInvestigationSnapshot({
          target: targetHandle,
          targetType,
          results,
          emailData,
          aiProfile: data,
        });
        setCachedScans(getCachedInvestigations());
        addLog(`[SNAPSHOT] Investigation integrity snapshot refreshed.`, 'info');
      } catch (err) {
        // ignore
      }

      if (data.fallbackNotice) {
        addLog(data.fallbackNotice, 'warn');
        addLog(`Dossier synthesized: Archetype "${data.archetype}" [Threat Level: ${data.threatLevel}]`, 'info');
      } else {
        const keyType = data.isCustomKey ? ' [Personal Key]' : '';
        addLog(`AI Profiling completed via ${data.modelUsed || 'Gemini'}${keyType}: Archetype "${data.archetype}" [Threat Level: ${data.threatLevel}]`, 'success');
      }
    } catch (err: any) {
      addLog(`AI Profiling request notice: ${err.message}`, 'warn');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Local State Persistence Handlers (Cache of last 5 scans in localStorage)
  const handleLoadCachedInvestigation = (cached: CachedInvestigation) => {
    if (isScanning) {
      addLog('Cannot load cached scan while a scan is actively running. Stop current scan first.', 'warn');
      return;
    }
    setTarget(cached.target);
    setTargetType(cached.targetType);
    setResults(cached.results || []);
    setEmailData(cached.emailData || null);
    setAiProfile(cached.aiProfile || null);
    setActiveView('intelligence');
    addLog(`[CACHE RESTORE] Restored investigation for "${cached.target}" (${cached.foundCount} hits, cached on ${cached.formattedTime})`, 'success');
  };

  const handleDeleteCachedInvestigation = (id: string) => {
    const updated = deleteCachedInvestigation(id);
    setCachedScans(updated);
    addLog('[CACHE] Investigation removed from localStorage cache.', 'info');
  };

  const handleClearAllHistory = () => {
    clearCachedInvestigations();
    setCachedScans([]);
    addLog('[CACHE] Cleared all local storage investigation history.', 'info');
  };

  const handleReset = () => {
    abortRef.current = true;
    setIsScanning(false);
    setTarget('');
    setResults([]);
    setAiProfile(null);
    setEmailData(null);
    setCurrentCaseId(null);
    setLogs([]);
    setActiveView('intelligence');
    addLog('Workspace reset. System in standby.', 'info');
  };

  // Filtered results to render in Grid and Table views
  const visibleResults = useMemo(() => {
    return results.filter((r) => {
      // search filter
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matchesName = r.platformName.toLowerCase().includes(q);
        const matchesUrl = r.url.toLowerCase().includes(q);
        if (!matchesName && !matchesUrl) return false;
      }
      // status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'uncertain') {
          if (r.status !== 'uncertain' && r.status !== 'rate_limited') return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      return true;
    });
  }, [results, searchFilter, statusFilter]);

  // Graph pivot scan: scans a similar username in the background without replacing
  // the current investigation. The result is returned to the graph workspace so
  // analysts can compare the original target and candidate in one visual context.
  const handlePivotScan = async (newTarget: string): Promise<GraphPivotInvestigation> => {
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

    let pivotResult;
    try {
      pivotResult = await scanTargetCore(clean, 'username', pivotConfig, false, false);
    } finally {
      graphPivotScanRef.current = false;
    }

    const investigation: GraphPivotInvestigation = {
      id: `pivot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceTarget: target || 'target',
      target: clean,
      foundCount: pivotResult.foundCount,
      uncertainCount: pivotResult.uncertainCount,
      totalScanned: pivotResult.totalScanned,
      results: pivotResult.results,
      scannedAt: new Date().toISOString(),
    };

    const updatedCache = saveInvestigationToCache({
      target: clean,
      targetType: 'username',
      results: pivotResult.results,
      emailData: null,
      aiProfile: null,
      preset: pivotConfig.preset,
      foundCount: pivotResult.foundCount,
      uncertainCount: pivotResult.uncertainCount,
      totalScanned: pivotResult.totalScanned,
    });
    setCachedScans(updatedCache);

    try {
      const attachedCase = currentCaseId ? await getCase(currentCaseId) : null;
      const caseFile = attachedCase || await getOrCreateCaseForTarget(target || clean, target ? targetType : 'username');
      await appendPivot(caseFile.id, investigation);
      await appendCollection(caseFile.id, {
        id: `collection_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        target: clean,
        targetType: 'username',
        collectedAt: investigation.scannedAt,
        preset: pivotConfig.preset,
        results: pivotResult.results,
        emailData: null,
        foundCount: pivotResult.foundCount,
        uncertainCount: pivotResult.uncertainCount,
        totalScanned: pivotResult.totalScanned,
      });
      setCurrentCaseId(caseFile.id);
      await refreshPersistentCases();
      addLog(`[CASE GRAPH] Pivot @${clean} persisted inside ${caseFile.id}.`, 'success');
    } catch (caseError: any) {
      addLog(`[CASE GRAPH] Could not persist pivot: ${caseError?.message || caseError}`, 'warn');
    }

    addLog(
      `[GRAPH PIVOT] @${clean}: ${pivotResult.foundCount} found · ${pivotResult.uncertainCount} unresolved · ${pivotResult.totalScanned} checked.`,
      pivotResult.foundCount > 0 ? 'success' : 'info'
    );

    return investigation;
  };

  // Global Keyboard Shortcuts Manager (⌘K, Esc, /, 1-7, ⌘Enter, ⌘E, ⌘B, ⌘H, ⌘M, ?)
  useGlobalShortcuts({
    onStartScan: () => {
      if (!isScanning && target.trim()) {
        handleStartScan();
      }
    },
    onResetWorkspace: handleReset,
    onToggleShortcutsModal: () => setIsShortcutsModalOpen((prev) => !prev),
    onOpenExport: () => setIsExportOpen(true),
    onOpenBulkImport: () => setIsBulkModalOpen(true),
    onOpenHistory: () => setIsHistoryModalOpen(true),
    onOpenModular: () => setIsModularModalOpen(true),
    onToggleScanDepth: () => handleToggleScanDepth(scanConfig.wafInspectionMode === 'deep' ? 'fast' : 'deep'),
    onCloseActiveModal: () => {
      if (isShortcutsModalOpen) {
        setIsShortcutsModalOpen(false);
        return true;
      }
      if (isModularModalOpen) {
        setIsModularModalOpen(false);
        return true;
      }
      if (isBulkModalOpen) {
        setIsBulkModalOpen(false);
        return true;
      }
      if (isGeminiModalOpen) {
        setIsGeminiModalOpen(false);
        return true;
      }
      if (isExportOpen) {
        setIsExportOpen(false);
        return true;
      }
      if (isHistoryModalOpen) {
        setIsHistoryModalOpen(false);
        return true;
      }
      return false;
    },
    onChangeView: (view) => {
      setActiveView(view);
      addLog(`[SHORTCUT] Switched view to: ${view.toUpperCase()}`, 'info');
    },
    isScanning,
    target,
    setTarget,
    searchFilter,
    setSearchFilter,
  });

  const handleShortcutAction = (actionId: string) => {
    switch (actionId) {
      case 'focus-target': {
        const el = document.getElementById('target-input') as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
        break;
      }
      case 'start-scan':
        if (target.trim() && !isScanning) {
          handleStartScan();
        }
        break;
      case 'esc-clear':
        setTarget('');
        break;
      case 'focus-filter': {
        const el = document.getElementById('filter-search-input') as HTMLInputElement | null;
        if (el) {
          el.focus();
          el.select();
        }
        break;
      }
      case 'view-dashboard':
        setActiveView('intelligence');
        break;
      case 'view-grid':
        setActiveView('grid');
        break;
      case 'view-table':
        setActiveView('table');
        break;
      case 'view-profile':
        setActiveView('ai');
        break;
      case 'view-linkage':
        setActiveView('linkage');
        break;
      case 'view-terminal':
        setActiveView('terminal');
        break;
      case 'open-export':
        setIsExportOpen(true);
        break;
      case 'open-bulk':
        setIsBulkModalOpen(true);
        break;
      case 'open-history':
        setIsHistoryModalOpen(true);
        break;
      case 'open-modular':
        setIsModularModalOpen(true);
        break;
      case 'toggle-depth':
        handleToggleScanDepth(scanConfig.wafInspectionMode === 'deep' ? 'fast' : 'deep');
        break;
      case 'toggle-help':
        setIsShortcutsModalOpen((prev) => !prev);
        break;
    }
  };

  const foundCount = results.filter((r) => r.status === 'found').length;
  const uncertainCount = results.filter((r) => r.status === 'uncertain' || r.status === 'rate_limited').length;
  const scannedCount = results.filter((r) => r.status !== 'pending').length;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#050505] text-[#F5F5F5] flex flex-col selection:bg-[#FFFFFF] selection:text-[#050505]">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        onGoToDashboard={() => setActiveView('intelligence')}
        onOpenAiWorkspace={() => setActiveView('ai')}
        onOpenBulkImport={() => setIsBulkModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        cachedScansCount={persistentCases.length}
        bulkBatchCount={bulkBatch ? bulkBatch.items.length : 0}
        hasPersonalKey={Boolean(personalGeminiKey)}
        selectedModel={selectedGeminiModel}
        foundCount={foundCount}
        totalScanned={scannedCount}
        isScanning={isScanning}
      />

      {/* Target & Command Bar */}
      <TargetBar
        target={target}
        setTarget={setTarget}
        targetType={targetType}
        setTargetType={setTargetType}
        isScanning={isScanning}
        onStartScan={() => handleStartScan()}
        onStopScan={handleStopScan}
        scanConfig={scanConfig}
        onSelectPreset={handleSelectPreset}
        onOpenModularConfig={() => setIsModularModalOpen(true)}
        selectedCategory={selectedCategory}
        setSelectedCategory={(cat) => {
          setSelectedCategory(cat);
          setScanConfig((prev) => ({ ...prev, selectedCategory: cat, preset: 'custom' }));
        }}
        concurrency={concurrency}
        setConcurrency={(rate) => {
          setConcurrency(rate);
          setScanConfig((prev) => ({ ...prev, concurrency: rate, preset: 'custom' }));
        }}
        onOpenBulkImport={() => setIsBulkModalOpen(true)}
        bulkBatchCount={bulkBatch ? bulkBatch.items.length : 0}
        cachedScans={cachedScans}
        onLoadCachedInvestigation={handleLoadCachedInvestigation}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        scanDepth={scanConfig.wafInspectionMode}
        onToggleScanDepth={handleToggleScanDepth}
      />

      {/* Stats & View Switcher */}
      <StatsBar
        activeView={activeView}
        setActiveView={setActiveView}
        scannedCount={scannedCount}
        totalCount={results.length || targetPlatforms.length}
        foundCount={foundCount}
        uncertainCount={uncertainCount}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isScanning={isScanning}
        hasAiReport={Boolean(aiProfile)}
        batchCount={bulkBatch ? bulkBatch.items.length : 0}
        isBatchActive={bulkBatch?.isActive || false}
      />

      {/* Main Investigation Canvas */}
      <main className={`flex-1 w-full py-6 space-y-6 ${activeView === 'intelligence' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        {/* Email Intelligence Card if email mode and active view is not dashboard or batch */}
        {activeView !== 'dashboard' && activeView !== 'intelligence' && activeView !== 'batch' && (targetType === 'email' || emailData || isEmailLoading) && (
          <EmailReconCard data={emailData} isLoading={isEmailLoading} />
        )}

        {/* View: Bulk Batch Target Reconnaissance Queue */}
        {activeView === 'batch' && (
          <BulkScanView
            batch={bulkBatch}
            onPauseBatch={handlePauseBatch}
            onResumeBatch={handleResumeBatch}
            onSkipTarget={handleSkipTarget}
            onAbortBatch={handleAbortBatch}
            onOpenImport={() => setIsBulkModalOpen(true)}
            onInspectTarget={handleInspectTarget}
            onRemoveQueuedItem={handleRemoveQueuedItem}
            isScanning={isScanning}
          />
        )}

        {/* View: Intelligence Assessment Workspace */}
        {activeView === 'intelligence' && results.length === 0 && !isScanning && (
          <HomeView
            activePreset={scanConfig.preset}
            onSelectPreset={handleSelectPreset}
            onPickExample={(handle) => {
              setTarget(handle);
              setTargetType('username');
              window.setTimeout(() => document.querySelector<HTMLInputElement>('input[type="text"]')?.focus(), 0);
            }}
            onOpenBatch={() => setIsBulkModalOpen(true)}
            onOpenCases={() => setIsHistoryModalOpen(true)}
            casesCount={persistentCases.length}
          />
        )}
        {activeView === 'intelligence' && (results.length > 0 || isScanning) && (
          <IntelligenceReportView
            target={target}
            results={results}
            onOpenExport={() => setIsExportOpen(true)}
            onViewTable={() => setActiveView('table')}
            aiApiKey={personalGeminiKey}
            aiModel={selectedGeminiModel}
            requirement={intelligenceRequirement}
            onRequirementChange={setIntelligenceRequirement}
          />
        )}

        {/* View: Post-Scan Unified OSINT Dashboard */}
        {activeView === 'dashboard' && (
          <DashboardView
            target={target}
            targetType={targetType}
            results={results}
            emailData={emailData}
            aiProfile={aiProfile}
            onViewGrid={() => setActiveView('grid')}
            onViewTable={() => setActiveView('table')}
            onViewProfile={() => setActiveView('ai')}
            onViewTerminal={() => setActiveView('terminal')}
            onOpenExport={() => setIsExportOpen(true)}
            onPivotScan={handlePivotScan}
            isScanning={isScanning}
            onRequestAiProfile={() => setActiveView('ai')}
            isAiLoading={isAiLoading}
            bulkBatch={bulkBatch}
            onViewBatch={() => setActiveView('batch')}
            onOpenImport={() => setIsBulkModalOpen(true)}
            onInspectBatchTarget={handleInspectTarget}
            onPauseBatch={handlePauseBatch}
            onResumeBatch={handleResumeBatch}
          />
        )}

        {/* View: Correlation workspace */}
        {activeView === 'linkage' && (
          <CorrelationWorkspace
            target={target}
            results={results}
            emailData={emailData}
            onPivotScan={handlePivotScan}
            caseFile={currentCase}
            onLoadSnapshot={loadCaseCollectionSnapshot}
          />
        )}

        {/* View: Platforms Grid */}
        {activeView === 'grid' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-[#A3A3A3]">
              <span>
                DISPLAYING <strong className="text-[#F5F5F5]">{visibleResults.length}</strong> PLATFORMS
                {searchFilter && ` MATCHING "${searchFilter}"`}
              </span>
              <span className="text-[11px] text-[#737373]">
                CLICK LINK ICON TO AUDIT PROFILE DIRECTLY
              </span>
            </div>
            <PlatformGrid results={visibleResults} target={target} />
          </div>
        )}

        {/* View: Dense Audit Table */}
        {activeView === 'table' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-[#A3A3A3]">
              <span>TABULAR AUDIT LEDGER ({visibleResults.length} records)</span>
              <span className="text-[11px] text-[#737373]">SORTED BY RECON ENGINE DISCOVERY</span>
            </div>
            <PlatformTable results={visibleResults} />
          </div>
        )}

        {/* View: AI Analyst Workspace */}
        {(activeView === 'ai' || activeView === 'profile') && (
          <AiWorkspace
            target={target}
            results={results}
            apiKey={personalGeminiKey}
            model={selectedGeminiModel}
            requirement={intelligenceRequirement}
            onOpenConfig={() => setIsGeminiModalOpen(true)}
          />
        )}

        {/* View: Live Terminal Console */}
        {activeView === 'terminal' && (
          <TerminalLogs
            logs={logs}
            onClearLogs={() => setLogs([])}
            isScanning={isScanning}
          />
        )}
      </main>

      {/* Modular Scan Configuration Modal */}
      <ModularScanModal
        isOpen={isModularModalOpen}
        onClose={() => setIsModularModalOpen(false)}
        config={scanConfig}
        onSaveConfig={(newConfig) => {
          setScanConfig(newConfig);
          setSelectedCategory(newConfig.selectedCategory);
          setConcurrency(newConfig.concurrency);
          addLog(`[MODULAR CONFIG] Settings updated. Preset: ${newConfig.preset.toUpperCase()}`, 'info');
        }}
        onStartScanWithConfig={(newConfig) => {
          setScanConfig(newConfig);
          setSelectedCategory(newConfig.selectedCategory);
          setConcurrency(newConfig.concurrency);
          handleStartScan(newConfig);
        }}
        target={target}
        targetType={targetType}
        isScanning={isScanning}
      />

      {/* Bulk Target Import Modal */}
      <BulkImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onStartBulkScan={handleStartBulkScan}
        currentCategory={selectedCategory}
        currentConcurrency={concurrency}
      />

      {/* Gemini AI Personal Key & Configuration Modal */}
      <GeminiConfigModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        personalKey={personalGeminiKey}
        selectedModel={selectedGeminiModel}
        onSavePersonalKey={(key, model) => {
          setPersonalGeminiKey(key);
          setSelectedGeminiModel(model);
          if (key) {
            localStorage.setItem('mineiro_gemini_key', key);
            localStorage.setItem('mineiro_gemini_model', model);
            addLog(`Configured personal Gemini AI key [Model: ${model}].`, 'success');
          } else {
            localStorage.removeItem('mineiro_gemini_key');
            localStorage.setItem('mineiro_gemini_model', model);
            addLog(`Cleared personal Gemini AI key. Using server-side fallback.`, 'info');
          }
        }}
      />

      {/* Export Dossier Modal (JSON, CSV, TXT, PDF) */}
      <IntelligenceExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        target={target}
        results={results}
        requirement={intelligenceRequirement}
      />

      {/* Hidden printable report layout rendered when window.print() is called */}
      <DossierPrintView
        target={target}
        targetType={targetType}
        results={results}
        aiProfile={aiProfile}
        emailData={emailData}
      />

      {/* LocalStorage Investigation History Modal (Last 5 Scans) */}
      <InvestigationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        cachedScans={cachedScans}
        currentTarget={target}
        currentTargetType={targetType}
        onLoadInvestigation={handleLoadCachedInvestigation}
        onDeleteInvestigation={handleDeleteCachedInvestigation}
        onClearAllHistory={handleClearAllHistory}
        persistentCases={persistentCases}
        currentCaseId={currentCaseId}
        onLoadCase={loadPersistentCase}
        onDeleteCase={handleDeletePersistentCase}
      />

      {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        onActionTrigger={handleShortcutAction}
      />

      {/* Modern Minimalist Footer */}
      <footer className="border-t border-[#2A2A2A] bg-[#050505] py-5 font-mono text-xs text-[#A3A3A3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-1">
          <div className="flex flex-wrap items-center justify-center gap-x-2 text-[#F5F5F5]">
            <strong className="text-[#FFFFFF]">Mineiro Username Intelligence UNIFIED OSINT ENGINE</strong>
            <span className="text-[#737373]">//</span>
            <span className="text-[#A3A3A3]">LARGE LOCAL PLATFORM CATALOG</span>
            <span className="text-[#737373]">•</span>
            <span className="text-[#A3A3A3]">WAF & ANTI-BOT GUARD</span>
            <span className="text-[#737373]">•</span>
            <span className="text-[#A3A3A3]">EVIDENCE-BOUNDED AI COPILOT</span>
          </div>
          <div className="text-[10px] text-[#737373]">
            OSINT INVESTIGATION WORKBENCH · EVIDENCE · CORRELATION · REPORTING
          </div>
        </div>
      </footer>
    </div>
    </ToastProvider>
  );
}
