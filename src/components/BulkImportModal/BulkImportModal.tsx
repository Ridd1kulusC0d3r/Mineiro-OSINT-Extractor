import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  X, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Layers,
  Sparkles,
  FileText
} from 'lucide-react';
import { 
  parseTargetCsv, 
  downloadSampleCsvTemplate, 
  ParsedTarget, 
  generateSampleCsv 
} from '../../utils/csvParser';
import { CATEGORY_LABELS, countPlatformsForScope } from '../../data/platforms';
import type { PlatformScope } from '../../types';
import { useI18n } from '../../utils/i18n';
import { summarizeParsedTargets } from './bulkImport.logic';
import { TargetsPreview } from './TargetsPreview';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartBulkScan: (
    targets: ParsedTarget[],
    options: {
      category: string;
      concurrency: number;
      autoAiProfile: boolean;
    }
  ) => void;
  currentCategory?: string;
  currentConcurrency?: number;
  /** Escopo do preset ativo: é o que o lote executa para cada alvo. */
  currentScope?: PlatformScope;
}

export function BulkImportModal({
  isOpen,
  onClose,
  onStartBulkScan,
  currentCategory = 'all',
  currentConcurrency = 8,
  currentScope = 'top20',
}: BulkImportModalProps) {
  const { tr } = useI18n();
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedTargets, setParsedTargets] = useState<ParsedTarget[]>([]);
  const [deduplicate, setDeduplicate] = useState(true);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  
  // Options
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory);
  const [concurrency, setConcurrency] = useState<number>(currentConcurrency);
  // O perfil automático por IA está desligado desde a v1.4.1 (App.tsx força enableAutoAiProfile: false); o modal
  // não oferece mais um interruptor que não tinha efeito (defeito 11).
  const autoAiProfile = false;

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileContent = (content: string, name: string) => {
    setFileName(name);
    const result = parseTargetCsv(content, { deduplicate });
    setParsedTargets(result.items);
    setDuplicateCount(result.duplicateCount);
    setParseErrors(result.errors);
  };

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleFileContent(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          handleFileContent(text, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedTargets([]);
      setDuplicateCount(0);
      setParseErrors([]);
      return;
    }
    const result = parseTargetCsv(text, { deduplicate });
    setParsedTargets(result.items);
    setDuplicateCount(result.duplicateCount);
    setParseErrors(result.errors);
  };

  const handleLoadSampleBatch = () => {
    const sample = generateSampleCsv();
    setRawText(sample);
    setActiveTab('paste');
    const result = parseTargetCsv(sample, { deduplicate: true });
    setParsedTargets(result.items);
    setDuplicateCount(result.duplicateCount);
    setParseErrors([]);
  };

  const handleRemoveTarget = (id: string) => {
    setParsedTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleClearAll = () => {
    setParsedTargets([]);
    setFileName(null);
    setRawText('');
    setDuplicateCount(0);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { validTargets, usernameCount, emailCount } = summarizeParsedTargets(parsedTargets);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validTargets.length === 0) return;

    onStartBulkScan(validTargets, {
      category: selectedCategory,
      concurrency,
      autoAiProfile,
    });
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="bulk-import-title" className="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="dialog w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mast p-5 border-b border-rule flex items-start justify-between">
          <div className="space-y-1">
            <span className="eyebrow">{tr('batchImport.eyebrow')}</span>
            <h2 id="bulk-import-title" className="text-xl font-semibold tracking-tight text-ink flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-ink-2" />
              {tr('batchImport.title')}
            </h2>
            <p className="text-sm text-ink-2">{tr('batchImport.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-icon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Method Tabs & Sample Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule-2 pb-4">
            <div className="tabs tabs-sm" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'upload'}
                onClick={() => setActiveTab('upload')}
                className="tab"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload CSV File
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'paste'}
                onClick={() => setActiveTab('paste')}
                className="tab"
              >
                <FileText className="w-3.5 h-3.5" />
                Paste List / Text
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="btn"
                title="Populate with a ready-to-test sample batch"
              >
                Load Demo Batch
              </button>
              <button
                type="button"
                onClick={downloadSampleCsvTemplate}
                className="btn"
                title="Download CSV format template"
              >
                <Download className="w-3 h-3" />
                Template CSV
              </button>
            </div>
          </div>

          {/* Tab 1: Upload Zone */}
          {activeTab === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
              />
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-signal bg-rule-2/60'
                    : fileName
                    ? 'border-ink-3 bg-paper-2/80 hover:border-ink-3'
                    : 'border-rule bg-paper-2/40 hover:border-rule hover:bg-paper-2'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 border border-rule bg-paper flex items-center justify-center text-ink-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  {fileName ? (
                    <div>
                      <p className="text-ink font-bold text-sm">{fileName}</p>
                      <p className="text-ink-3 text-[11px] mt-0.5">Click or drag another file to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-ink font-bold">Drag & drop CSV or TXT file here</p>
                      <p className="text-ink-3 text-[11px] mt-0.5">
                        Supports CSV files or custom target lists
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Text Zone */}
          {activeTab === 'paste' && (
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-ink-3 block">
                Target Identifiers (one per line; the first column is used):
              </label>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="satoshi&#10;vitalik&#10;deivsec&#10;octocat&#10;target@domain.com"
                rows={6}
                className="w-full bg-paper-2 border border-rule p-3 text-ink placeholder:text-ink-3 focus:outline-none focus:border-signal text-xs font-mono leading-relaxed"
              />
            </div>
          )}

          {/* Errors or Notices */}
          {parseErrors.length > 0 && (
            <div className="p-3 border border-rule/60 bg-paper-2/30 text-ink-2 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                Parsing Notice
              </div>
              {parseErrors.map((err, i) => (
                <div key={i} className="text-[11px] opacity-90">• {err}</div>
              ))}
            </div>
          )}

          {/* Ingested Summary & Targets Preview */}
          {parsedTargets.length > 0 && (
            <TargetsPreview
              parsedTargets={parsedTargets}
              validCount={validTargets.length}
              usernameCount={usernameCount}
              emailCount={emailCount}
              duplicateCount={duplicateCount}
              handleClearAll={handleClearAll}
              handleRemoveTarget={handleRemoveTarget}
            />
          )}

          {/* Batch Scan Scope & Execution Configuration */}
          <div className="card p-4 space-y-3">
            <div className="text-[11px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-rule pb-2">
              <Layers className="w-3.5 h-3.5" />
              Batch Execution Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Scope */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-ink-3 tracking-wider block">
                  Recon Platform Category Scope
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="field w-full text-[13px] p-2"
                >
                  {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
                    <option key={catKey} value={catKey}>
                      {info.label} ({tr('modular.detectors', { count: countPlatformsForScope(currentScope, catKey) })})
                    </option>
                  ))}
                </select>
              </div>

              {/* Concurrency Setting */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-ink-3 tracking-wider block">
                  Probe Concurrency Rate
                </label>
                <div className="tabs tabs-sm tabs-seg">
                  {[...new Set([3, 8, 16, currentConcurrency])].sort((x, y) => x - y).map((val) => ({ label: `${val}x`, val })).map((rate) => (
                    <button
                      key={rate.val}
                      type="button"
                      onClick={() => setConcurrency(rate.val)}
                      aria-pressed={concurrency === rate.val}
                      className="tab justify-center"
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* O que de fato roda: escopo do preset, categoria escolhida, sem IA automática */}
            <div className="pt-2 border-t border-rule-2 space-y-1.5 text-[12.5px] text-ink-2">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-ink-3" />
                <span>{tr('batch.runsScope', { count: countPlatformsForScope(currentScope, selectedCategory) })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-ink-3" />
                <span>{tr('batch.noAutoAi')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-rule flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={validTargets.length === 0}
            className="btn-primary"
          >
            <Play className="w-3.5 h-3.5" />
            Launch Bulk Reconnaissance ({validTargets.length} Targets)
          </button>
        </div>
      </div>
    </div>
  );
}
