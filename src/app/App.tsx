// Composition only: state lives in src/hooks, the scan engine in src/scan, /api calls in src/api, screens in
// src/components. See ARCHITECTURE.md, "Client layout".
import { useState } from 'react';
import { Header } from '../components/Header';
import { TargetBar } from '../components/TargetBar';
import { StatsBar } from '../components/StatsBar';
import { ToastProvider } from '../components/Toast';
import { useI18n } from '../utils/i18n';
import type { IntelligenceRequirement } from '../intelligence/types';
import { useScanLog } from '../hooks/useScanLog';
import { useSettings } from '../hooks/useSettings';
import { useModals } from '../hooks/useModals';
import { useCases } from '../hooks/useCases';
import { useScan } from '../hooks/useScan';
import { useBulkBatch } from '../hooks/useBulkBatch';
import { useResultFilters } from '../hooks/useResultFilters';
import { useAppShortcuts } from './useAppShortcuts';
import { MainViews } from './MainViews';
import { AppModals } from './AppModals';
import type { AppView } from './views';

export default function App() {
  const { tr } = useI18n();
  const [activeView, setActiveView] = useState<AppView>('intelligence');
  const [intelligenceRequirement, setIntelligenceRequirement] = useState<IntelligenceRequirement>('account_correlation');

  const { logs, addLog, clearLogs } = useScanLog();
  const settings = useSettings(addLog);
  const modals = useModals();
  const cases = useCases(addLog);
  const scan = useScan({ addLog, clearLogs, cases, navigate: setActiveView });
  const batch = useBulkBatch({ addLog, scan, navigate: setActiveView });
  const filters = useResultFilters(scan.results);
  const onShortcutAction = useAppShortcuts({
    scan, modals, addLog, setActiveView, searchFilter: filters.searchFilter, setSearchFilter: filters.setSearchFilter,
  });

  const batchCount = batch.bulkBatch ? batch.bulkBatch.items.length : 0;

  return (
    <ToastProvider>
      <div className="app-shell min-h-screen bg-paper text-ink flex flex-col selection:bg-signal selection:text-signal-ink">
      {/* Top Header */}
      <Header
        onReset={scan.reset}
        onOpenExport={() => modals.open('export')}
        onGoToDashboard={() => setActiveView('intelligence')}
        onOpenAiWorkspace={() => setActiveView('ai')}
        onOpenBulkImport={() => modals.open('bulk')}
        onOpenHistory={() => modals.open('history')}
        onOpenShortcuts={() => modals.open('shortcuts')}
        cachedScansCount={cases.persistentCases.length}
        bulkBatchCount={batchCount}
        hasPersonalKey={Boolean(settings.geminiKey)}
        selectedModel={settings.geminiModel}
        foundCount={scan.counts.found}
        totalScanned={scan.counts.scanned}
        isScanning={scan.isScanning}
      />

      {/* Target & Command Bar */}
      <TargetBar
        target={scan.target}
        setTarget={scan.setTarget}
        targetType={scan.targetType}
        setTargetType={scan.setTargetType}
        isScanning={scan.isScanning}
        onStartScan={() => scan.startScan()}
        onStopScan={scan.stopScan}
        scanConfig={scan.scanConfig}
        onSelectPreset={scan.selectPreset}
        onOpenModularConfig={() => modals.open('modular')}
        selectedCategory={scan.selectedCategory}
        setSelectedCategory={scan.changeCategory}
        concurrency={scan.concurrency}
        setConcurrency={scan.changeConcurrency}
        onOpenBulkImport={() => modals.open('bulk')}
        bulkBatchCount={batchCount}
        cachedScans={cases.cachedScans}
        onLoadCachedInvestigation={scan.openCachedInvestigation}
        onOpenHistoryModal={() => modals.open('history')}
        scanDepth={scan.scanConfig.wafInspectionMode}
        onToggleScanDepth={scan.toggleScanDepth}
      />

      {/* Stats & View Switcher */}
      <StatsBar
        activeView={activeView}
        setActiveView={setActiveView}
        scannedCount={scan.counts.scanned}
        totalCount={scan.results.length || scan.categoryPlatformCount}
        foundCount={scan.counts.found}
        uncertainCount={scan.counts.uncertain}
        searchFilter={filters.searchFilter}
        setSearchFilter={filters.setSearchFilter}
        statusFilter={filters.statusFilter}
        setStatusFilter={filters.setStatusFilter}
        isScanning={scan.isScanning}
        hasAiReport={Boolean(scan.aiProfile)}
        batchCount={batchCount}
        isBatchActive={batch.bulkBatch?.isActive || false}
      />

      {/* Main Investigation Canvas */}
      <MainViews
        activeView={activeView}
        setActiveView={setActiveView}
        scan={scan}
        cases={cases}
        batch={batch}
        modals={modals}
        geminiKey={settings.geminiKey}
        geminiModel={settings.geminiModel}
        requirement={intelligenceRequirement}
        onRequirementChange={setIntelligenceRequirement}
        visibleResults={filters.visibleResults}
        searchFilter={filters.searchFilter}
        logs={logs}
        onClearLogs={clearLogs}
      />

      <AppModals
        modals={modals}
        scan={scan}
        cases={cases}
        batch={batch}
        settings={settings}
        requirement={intelligenceRequirement}
        addLog={addLog}
        onShortcutAction={onShortcutAction}
      />

      {/* Rodapé */}
      <footer className="border-t border-rule bg-paper py-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3 px-4 font-mono text-[11.5px] text-ink-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="mast-dot" aria-hidden="true" />
            <strong className="font-sans text-[13px] font-semibold text-ink">Mineiro Username Intelligence</strong>
            <span>· OSINT Investigation Workbench</span>
          </div>
          <div>{tr('footer.tagline')}</div>
        </div>
      </footer>
    </div>
    </ToastProvider>
  );
}
