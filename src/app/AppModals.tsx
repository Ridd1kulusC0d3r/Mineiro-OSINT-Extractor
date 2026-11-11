import { IntelligenceExportModal } from '../components/IntelligenceExportModal';
import { DossierPrintView } from '../components/DossierPrintView';
import { GeminiConfigModal } from '../components/GeminiConfigModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { ModularScanModal } from '../components/ModularScanModal';
import { InvestigationHistoryModal } from '../components/InvestigationHistoryModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import type { IntelligenceRequirement } from '../intelligence/types';
import type { Scan } from '../hooks/useScan';
import type { Cases } from '../hooks/useCases';
import type { Modals } from '../hooks/useModals';
import type { AddLog } from '../hooks/useScanLog';
import type { useBulkBatch } from '../hooks/useBulkBatch';
import type { useSettings } from '../hooks/useSettings';

interface AppModalsProps {
  modals: Modals;
  scan: Scan;
  cases: Cases;
  batch: ReturnType<typeof useBulkBatch>;
  settings: ReturnType<typeof useSettings>;
  requirement: IntelligenceRequirement;
  addLog: AddLog;
  onShortcutAction: (actionId: string) => void;
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
      <GeminiConfigModal
        isOpen={modals.isOpen.gemini}
        onClose={() => modals.close('gemini')}
        personalKey={settings.geminiKey}
        selectedModel={settings.geminiModel}
        onSavePersonalKey={settings.saveGeminiSettings}
      />

      {/* Export Dossier Modal (HTML, JSON, Markdown, CSV) */}
      <IntelligenceExportModal
        isOpen={modals.isOpen.export}
        onClose={() => modals.close('export')}
        target={target}
        results={results}
        requirement={requirement}
      />

      {/* Hidden printable report layout rendered when window.print() is called */}
      <DossierPrintView
        target={target}
        targetType={targetType}
        results={results}
        aiProfile={scan.aiProfile}
        emailData={scan.emailData}
      />

      {/* Persistent cases (IndexedDB) and the localStorage cache of the last 5 scans */}
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

      {/* Global Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={modals.isOpen.shortcuts}
        onClose={() => modals.close('shortcuts')}
        onActionTrigger={onShortcutAction}
      />
    </>
  );
}
