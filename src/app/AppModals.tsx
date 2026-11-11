import { lazy, Suspense } from 'react';
import { DossierPrintView } from '../components/DossierPrintView';
import { BulkImportModal } from '../components/BulkImportModal';
import { ModularScanModal } from '../components/ModularScanModal';
import { DialogFallback, LazyBoundary, MountWhenOpened } from '../components/LazyFallback';
import type { IntelligenceRequirement } from '../intelligence/types';
import type { Scan } from '../hooks/useScan';
import type { Cases } from '../hooks/useCases';
import type { Modals } from '../hooks/useModals';
import type { AddLog } from '../hooks/useScanLog';
import type { useBulkBatch } from '../hooks/useBulkBatch';
import type { useSettings } from '../hooks/useSettings';
import { SHORTCUTS, type ShortcutAction } from './shortcuts';

// Dialogs closed at start-up load on first open (baseline defect 22) and then stay mounted, so they keep their
// state between openings as before. ModularScanModal and BulkImportModal stay in the start-up bundle: they copy
// the scan configuration into their state when they mount, and mounting them later would change what they show.
const IntelligenceExportModal = lazy(() => import('../components/IntelligenceExportModal').then((m) => ({ default: m.IntelligenceExportModal })));
const GeminiConfigModal = lazy(() => import('../components/GeminiConfigModal').then((m) => ({ default: m.GeminiConfigModal })));
const InvestigationHistoryModal = lazy(() => import('../components/InvestigationHistoryModal').then((m) => ({ default: m.InvestigationHistoryModal })));
const KeyboardShortcutsModal = lazy(() => import('../components/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal })));

interface AppModalsProps {
  modals: Modals;
  scan: Scan;
  cases: Cases;
  batch: ReturnType<typeof useBulkBatch>;
  settings: ReturnType<typeof useSettings>;
  requirement: IntelligenceRequirement;
  addLog: AddLog;
  onShortcutAction: (action: ShortcutAction) => void;
}

/** Every overlay of the app, plus the hidden print layout. Each one renders nothing while closed. */
export function AppModals({ modals, scan, cases, batch, settings, requirement, addLog, onShortcutAction }: AppModalsProps) {
  const { target, targetType, results, isScanning } = scan;

  return (
    <>
      {/* Modular Scan Configuration Modal */}
      <ModularScanModal
        isOpen={modals.isOpen.modular}
        onClose={() => modals.close('modular')}
        config={scan.scanConfig}
        onSaveConfig={(newConfig) => {
          scan.applyConfig(newConfig);
          addLog(`[MODULAR CONFIG] Settings updated. Preset: ${newConfig.preset.toUpperCase()}`, 'info');
        }}
        onStartScanWithConfig={(newConfig) => {
          scan.applyConfig(newConfig);
          scan.startScan(newConfig);
        }}
        target={target}
        targetType={targetType}
        isScanning={isScanning}
      />

      {/* Bulk Target Import Modal */}
      <BulkImportModal
        isOpen={modals.isOpen.bulk}
        onClose={() => modals.close('bulk')}
        onStartBulkScan={batch.startBatch}
        currentCategory={scan.selectedCategory}
        currentConcurrency={scan.concurrency}
        currentScope={scan.scanConfig.platformScope}
      />

      {/* Gemini AI Personal Key & Configuration Modal */}
      <MountWhenOpened isOpen={modals.isOpen.gemini}>
        <LazyBoundary silent>
          <Suspense fallback={<DialogFallback />}>
            <GeminiConfigModal
              isOpen={modals.isOpen.gemini}
              onClose={() => modals.close('gemini')}
              personalKey={settings.geminiKey}
              selectedModel={settings.geminiModel}
              onSavePersonalKey={settings.saveGeminiSettings}
            />
          </Suspense>
        </LazyBoundary>
      </MountWhenOpened>

      {/* Export Dossier Modal (HTML, JSON, Markdown, CSV) */}
      <MountWhenOpened isOpen={modals.isOpen.export}>
        <LazyBoundary silent>
          <Suspense fallback={<DialogFallback />}>
            <IntelligenceExportModal
              isOpen={modals.isOpen.export}
              onClose={() => modals.close('export')}
              target={target}
              results={results}
              requirement={requirement}
            />
          </Suspense>
        </LazyBoundary>
      </MountWhenOpened>

      {/* Hidden printable report layout rendered when window.print() is called */}
      <DossierPrintView
        target={target}
        targetType={targetType}
        results={results}
        aiProfile={scan.aiProfile}
        emailData={scan.emailData}
      />

      {/* Persistent cases (IndexedDB) and the localStorage cache of the last 5 scans */}
      <MountWhenOpened isOpen={modals.isOpen.history}>
        <LazyBoundary silent>
          <Suspense fallback={<DialogFallback />}>
            <InvestigationHistoryModal
              isOpen={modals.isOpen.history}
              onClose={() => modals.close('history')}
              cachedScans={cases.cachedScans}
              currentTarget={target}
              currentTargetType={targetType}
              onLoadInvestigation={scan.openCachedInvestigation}
              onDeleteInvestigation={cases.deleteCached}
              onClearAllHistory={cases.clearCached}
              persistentCases={cases.persistentCases}
              currentCaseId={cases.currentCaseId}
              onLoadCase={scan.openCase}
              onDeleteCase={cases.deleteCase}
            />
          </Suspense>
        </LazyBoundary>
      </MountWhenOpened>

      {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
      <MountWhenOpened isOpen={modals.isOpen.shortcuts}>
        <LazyBoundary silent>
          <Suspense fallback={<DialogFallback />}>
            <KeyboardShortcutsModal
              isOpen={modals.isOpen.shortcuts}
              onClose={() => modals.close('shortcuts')}
              shortcuts={SHORTCUTS}
              onActionTrigger={onShortcutAction}
            />
          </Suspense>
        </LazyBoundary>
      </MountWhenOpened>
    </>
  );
}
