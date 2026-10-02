import { useState, useRef, DragEvent, ChangeEvent, FormEvent } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  X, 
  Trash2, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  AtSign, 
  Mail, 
  Layers,
  Sparkles,
  FileText
} from 'lucide-react';
import { 
  parseTargetCsv, 
  downloadSampleCsvTemplate, 
  ParsedTarget, 
  generateSampleCsv 
} from '../utils/csvParser';
import { CATEGORY_LABELS } from '../data/platforms';

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
}

export function BulkImportModal({
  isOpen,
  onClose,
  onStartBulkScan,
  currentCategory = 'all',
  currentConcurrency = 8,
}: BulkImportModalProps) {
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
  const [autoAiProfile, setAutoAiProfile] = useState<boolean>(true);

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

  const validTargets = parsedTargets.filter((t) => t.isValid);
  const usernameCount = validTargets.filter((t) => t.type === 'username').length;
  const emailCount = validTargets.filter((t) => t.type === 'email').length;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-black border border-neutral-800 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-start justify-between bg-neutral-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-white inline-block shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-white" />
                BULK TARGET IMPORT // BATCH INVESTIGATION
              </h2>
            </div>
            <p className="text-xs text-neutral-400">
              Import a list of handles or emails from a local CSV/TXT file to execute sequential batch reconnaissance.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 border border-neutral-800 bg-black text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Method Tabs & Sample Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-900 pb-3">
            <div className="flex items-center border border-neutral-800 bg-neutral-950 p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase transition-colors ${
                  activeTab === 'upload'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload CSV File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex items-center gap-1.5 px-3 py-1.5 uppercase transition-colors ${
                  activeTab === 'paste'
                    ? 'bg-white text-black font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste List / Text
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="px-2.5 py-1.5 border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white hover:border-neutral-700 uppercase text-[11px] transition-colors"
                title="Populate with a ready-to-test sample batch"
              >
                Load Demo Batch
              </button>
              <button
                type="button"
                onClick={downloadSampleCsvTemplate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 border border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white hover:border-neutral-600 uppercase text-[11px] transition-colors"
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
                    ? 'border-white bg-neutral-900/60'
                    : fileName
                    ? 'border-neutral-600 bg-neutral-950/80 hover:border-neutral-500'
                    : 'border-neutral-800 bg-neutral-950/40 hover:border-neutral-700 hover:bg-neutral-950'
                }`}
              >
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 border border-neutral-700 bg-black flex items-center justify-center text-neutral-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  {fileName ? (
                    <div>
                      <p className="text-white font-bold text-sm">{fileName}</p>
                      <p className="text-neutral-500 text-[11px] mt-0.5">Click or drag another file to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-bold">Drag & drop CSV or TXT file here</p>
                      <p className="text-neutral-500 text-[11px] mt-0.5">
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
              <label className="text-[11px] uppercase tracking-wider text-neutral-400 block">
                Target Identifiers (one per line; the first column is used):
              </label>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="satoshi&#10;vitalik&#10;deivsec&#10;octocat&#10;target@domain.com"
                rows={6}
                className="w-full bg-neutral-950 border border-neutral-800 p-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-white text-xs font-mono leading-relaxed"
              />
            </div>
          )}

          {/* Errors or Notices */}
          {parseErrors.length > 0 && (
            <div className="p-3 border border-neutral-800/60 bg-neutral-950/30 text-neutral-300 space-y-1">
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
            <div className="space-y-3">
              {/* Metric bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 border border-neutral-800 bg-neutral-950">
                <div className="flex items-center gap-4 text-neutral-400">
                  <span>VALID TARGETS: <strong className="text-white">{validTargets.length}</strong></span>
                  <span className="flex items-center gap-1">
                    <AtSign className="w-3 h-3 text-neutral-400" />
                    USERNAMES: <strong className="text-white">{usernameCount}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    EMAILS: <strong className="text-white">{emailCount}</strong>
                  </span>
                  {duplicateCount > 0 && (
                    <span className="text-neutral-500">
                      DUPLICATES STRIPPED: {duplicateCount}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-neutral-500 hover:text-white text-[11px] uppercase flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear List
                </button>
              </div>

              {/* Targets Preview Table */}
              <div className="border border-neutral-800 bg-neutral-950 max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black border-b border-neutral-800 text-neutral-400 text-[10px] uppercase sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10">#</th>
                      <th className="py-2 px-3">Target Identifier</th>
                      <th className="py-2 px-3 w-28">Type</th>
                      <th className="py-2 px-3">Context / Notes</th>
                      <th className="py-2 px-3 w-16 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {parsedTargets.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-neutral-900/50 transition-colors">
                        <td className="py-1.5 px-3 text-neutral-600 text-[10px]">{idx + 1}</td>
                        <td className="py-1.5 px-3 font-semibold text-white">
                          <span className="font-mono">
                            {item.type === 'username' ? `@${item.target}` : item.target}
                          </span>
                        </td>
                        <td className="py-1.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] uppercase border font-bold ${
                              item.type === 'email'
                                ? 'border-neutral-700/80 bg-neutral-950/40 text-neutral-300'
                                : 'border-neutral-700 bg-neutral-900 text-neutral-300'
                            }`}
                          >
                            {item.type === 'email' ? (
                              <Mail className="w-2.5 h-2.5" />
                            ) : (
                              <AtSign className="w-2.5 h-2.5" />
                            )}
                            {item.type}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-neutral-400 text-[11px] truncate max-w-[160px]">
                          {item.notes || '—'}
                        </td>
                        <td className="py-1.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveTarget(item.id)}
                            className="text-neutral-600 hover:text-neutral-400 p-1 transition-colors"
                            title="Remove target from batch"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Batch Scan Scope & Execution Configuration */}
          <div className="p-4 border border-neutral-800 bg-neutral-950 space-y-3">
            <div className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-neutral-900 pb-2">
              <Layers className="w-3.5 h-3.5" />
              Batch Execution Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category Scope */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-neutral-400 tracking-wider block">
                  Recon Platform Category Scope
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black border border-neutral-800 text-white text-xs p-2 focus:border-white focus:outline-none"
                >
                  {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
                    <option key={catKey} value={catKey}>
                      {info.label} ({info.count} platforms)
                    </option>
                  ))}
                </select>
              </div>

              {/* Concurrency Setting */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase text-neutral-400 tracking-wider block">
                  Probe Concurrency Rate
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: 'STEALTH (3)', val: 3 },
                    { label: 'BALANCED (8)', val: 8 },
                    { label: 'TURBO (16)', val: 16 }
                  ].map((rate) => (
                    <button
                      key={rate.val}
                      type="button"
                      onClick={() => setConcurrency(rate.val)}
                      className={`px-2 py-1.5 text-[10px] uppercase border transition-colors ${
                        concurrency === rate.val
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-neutral-800 bg-black text-neutral-400 hover:text-white'
                      }`}
                    >
                      {rate.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Profiling Toggle */}
            <div className="pt-2 border-t border-neutral-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-300 text-xs">
                  Automate Gemini AI Profiling for discovered targets
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAutoAiProfile(!autoAiProfile)}
                className={`px-2.5 py-1 text-[10px] uppercase border transition-colors ${
                  autoAiProfile
                    ? 'border-neutral-500/70 bg-neutral-950/50 text-neutral-300 font-bold'
                    : 'border-neutral-800 bg-black text-neutral-500'
                }`}
              >
                {autoAiProfile ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-neutral-800 bg-black text-neutral-400 hover:text-white text-xs uppercase transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={validTargets.length === 0}
            className="px-6 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase flex items-center gap-2 border border-white tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            Launch Bulk Reconnaissance ({validTargets.length} Targets)
          </button>
        </div>
      </div>
    </div>
  );
}
