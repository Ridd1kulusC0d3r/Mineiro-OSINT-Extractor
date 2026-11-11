import { DashboardView } from '../components/DashboardView';
import { IntelligenceReportView } from '../components/IntelligenceReportView';
import { HomeView } from '../components/HomeView';
import { PlatformGrid } from '../components/PlatformGrid';
import { PlatformTable } from '../components/PlatformTable';
import { EmailReconCard } from '../components/EmailReconCard';
import { TerminalLogs } from '../components/TerminalLogs';
import { AuditViewHeader } from '../components/AuditViewHeader';
import { CorrelationWorkspace } from '../components/CorrelationWorkspace';
import { AiWorkspace } from '../components/AiWorkspace';
import { BulkScanView } from '../components/BulkScanView';
import { useI18n } from '../utils/i18n';
import type { IntelligenceRequirement } from '../intelligence/types';
import type { ScanLog, ScanResult } from '../types';
import type { Scan } from '../hooks/useScan';
import type { Cases } from '../hooks/useCases';
import type { Modals } from '../hooks/useModals';
import type { useBulkBatch } from '../hooks/useBulkBatch';
import type { AppView } from './views';

interface MainViewsProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  scan: Scan;
  cases: Cases;
  batch: ReturnType<typeof useBulkBatch>;
  modals: Modals;
  geminiKey: string;
  geminiModel: string;
  requirement: IntelligenceRequirement;
  onRequirementChange: (requirement: IntelligenceRequirement) => void;
  visibleResults: ScanResult[];
  searchFilter: string;
  logs: ScanLog[];
  onClearLogs: () => void;
}

/** The main canvas: one view at a time, chosen by `activeView`. */
export function MainViews({
  activeView, setActiveView, scan, cases, batch, modals, geminiKey, geminiModel, requirement, onRequirementChange,
  visibleResults, searchFilter, logs, onClearLogs,
}: MainViewsProps) {
  const { tr } = useI18n();
  const { target, targetType, results, emailData, isEmailLoading, isScanning } = scan;
  const bulkBatch = batch.bulkBatch;

  return (
    <main className={`view-stage flex-1 w-full py-6 space-y-6 ${activeView === 'intelligence' ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
      {/* Email Intelligence Card if email mode and active view is not dashboard or batch */}
      {activeView !== 'dashboard' && activeView !== 'intelligence' && activeView !== 'batch' && (targetType === 'email' || emailData || isEmailLoading) && (
        <EmailReconCard data={emailData} isLoading={isEmailLoading} />
      )}

      {/* View: Bulk Batch Target Reconnaissance Queue */}
      {activeView === 'batch' && (
        <BulkScanView
          batch={bulkBatch}
          onPauseBatch={batch.pauseBatch}
          onResumeBatch={batch.resumeBatch}
          onSkipTarget={batch.skipTarget}
          onAbortBatch={batch.abortBatch}
          onOpenImport={() => modals.open('bulk')}
          onInspectTarget={scan.openBatchItem}
          onRemoveQueuedItem={batch.removeQueuedItem}
          isScanning={isScanning}
        />
      )}

      {/* View: Intelligence Assessment Workspace */}
      {activeView === 'intelligence' && results.length === 0 && !isScanning && (
        <HomeView
          target={target}
          setTarget={scan.setTarget}
          targetType={targetType}
          setTargetType={scan.setTargetType}
          activePreset={scan.scanConfig.preset}
          onSelectPreset={scan.selectPreset}
          onStartScan={() => scan.startScan()}
          recentCases={cases.recentCases}
          onOpenCase={scan.openCase}
          onOpenBatch={() => modals.open('bulk')}
          onOpenCases={() => modals.open('history')}
          casesCount={cases.persistentCases.length}
        />
      )}
      {activeView === 'intelligence' && (results.length > 0 || isScanning) && (
        <IntelligenceReportView
          target={target}
          results={results}
          onOpenExport={() => modals.open('export')}
          onViewTable={() => setActiveView('table')}
          aiApiKey={geminiKey}
          aiModel={geminiModel}
          requirement={requirement}
          onRequirementChange={onRequirementChange}
        />
      )}

      {/* View: Post-Scan Unified OSINT Dashboard (legacy, no tab) */}
      {activeView === 'dashboard' && (
        <DashboardView
          target={target}
          targetType={targetType}
          results={results}
          emailData={emailData}
          aiProfile={scan.aiProfile}
          onViewGrid={() => setActiveView('grid')}
          onViewTable={() => setActiveView('table')}
          onViewProfile={() => setActiveView('ai')}
          onViewTerminal={() => setActiveView('terminal')}
          onOpenExport={() => modals.open('export')}
          onPivotScan={scan.pivotScan}
          isScanning={isScanning}
          onRequestAiProfile={() => setActiveView('ai')}
          isAiLoading={false /* legacy automatic AI profiling was removed in v1.4.1 */}
          bulkBatch={bulkBatch}
          onViewBatch={() => setActiveView('batch')}
          onOpenImport={() => modals.open('bulk')}
          onInspectBatchTarget={scan.openBatchItem}
          onPauseBatch={batch.pauseBatch}
          onResumeBatch={batch.resumeBatch}
        />
      )}

      {/* View: Correlation workspace */}
      {activeView === 'linkage' && (
        <CorrelationWorkspace
          target={target}
          results={results}
          emailData={emailData}
          onPivotScan={scan.pivotScan}
          caseFile={cases.currentCase}
          onLoadSnapshot={scan.openSnapshot}
        />
      )}

      {/* View: Platforms Grid */}
      {activeView === 'grid' && (
        <div className="space-y-4">
          <AuditViewHeader
            title={tr('grid.title', { count: visibleResults.length })}
            hint={searchFilter ? tr('grid.matching', { query: searchFilter }) : tr('grid.hint')}
          />
          <PlatformGrid results={visibleResults} target={target} />
        </div>
      )}

      {/* View: Dense Audit Table */}
      {activeView === 'table' && (
        <div className="space-y-4">
          <AuditViewHeader title={tr('table.title', { count: visibleResults.length })} hint={tr('table.hint')} />
          <PlatformTable results={visibleResults} />
        </div>
      )}

      {/* View: AI Analyst Workspace */}
      {(activeView === 'ai' || activeView === 'profile') && (
        <AiWorkspace
          target={target}
          results={results}
          apiKey={geminiKey}
          model={geminiModel}
          requirement={requirement}
          onOpenConfig={() => modals.open('gemini')}
        />
      )}

      {/* View: Live Terminal Console */}
      {activeView === 'terminal' && (
        <TerminalLogs logs={logs} onClearLogs={onClearLogs} isScanning={isScanning} />
      )}
    </main>
  );
}
