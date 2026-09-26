import { useState } from 'react';
import { Key, Sparkles, CheckCircle2, XCircle, ExternalLink, X, Eye, EyeOff, ShieldCheck, Cpu } from 'lucide-react';

interface GeminiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  personalKey: string;
  onSavePersonalKey: (key: string, model: string) => void;
  selectedModel: string;
}

export function GeminiConfigModal({
  isOpen,
  onClose,
  personalKey,
  onSavePersonalKey,
  selectedModel,
}: GeminiConfigModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState(personalKey);
  const deprecated = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro', 'gemini-2.5-flash'];
  const initialModel = selectedModel && !deprecated.includes(selectedModel) ? selectedModel : 'gemini-3.8-flash';
  const [modelInput, setModelInput] = useState(initialModel);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/osint/gemini-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKeyInput.trim(), model: modelInput }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setTestResult({
          success: true,
          message: `${data.message} Tested Model: ${data.modelTested}`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || 'Failed to validate Gemini API key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection error while testing key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSavePersonalKey(apiKeyInput.trim(), modelInput);
    onClose();
  };

  const handleClear = () => {
    setApiKeyInput('');
    setTestResult(null);
    onSavePersonalKey('', modelInput);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-neutral-950 border border-neutral-700 max-w-xl w-full p-6 space-y-5 text-neutral-300 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Personal Gemini AI Integration
              </h2>
              <p className="text-[11px] text-neutral-400">
                Connect your personal Google Gemini API Key for forensic AI profiling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-3 bg-neutral-900/80 border border-neutral-800 text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-white font-semibold">
            <ShieldCheck className="w-4 h-4 text-neutral-400" />
            <span>Privacy & Full Control</span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Your key is kept strictly in session memory and relayed securely via headers to the OSINT engine proxy. No credentials are stored or shared.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-white underline hover:text-neutral-300 pt-1"
          >
            Obtain free API key in the provider console <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold block uppercase tracking-wider text-[11px]">
              Gemini API Key (GEMINI_API_KEY)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                autoComplete="off"
                spellCheck="false"
                className="w-full bg-black border border-neutral-700 text-white px-3 py-2.5 pr-20 text-xs font-mono focus:border-white focus:outline-none tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-white text-[11px]"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-neutral-500">
              If left blank, the system will fallback to the server environment key or the local heuristic engine.
            </p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-neutral-300 font-semibold block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Selected Gemini Model
            </label>
            <select
              value={modelInput}
              onChange={(e) => {
                setModelInput(e.target.value);
                setTestResult(null);
              }}
              className="w-full bg-black border border-neutral-700 text-white px-3 py-2 text-xs font-mono focus:border-white focus:outline-none"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended • Ultra-fast & Stable)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Flash Lite • Fast & Efficient)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (General Flash)</option>
            </select>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 border text-xs flex items-start gap-2.5 font-mono ${
              testResult.success
                ? 'bg-black border-white text-white'
                : 'bg-black border-neutral-600 text-neutral-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
            )}
            <div className="text-[11px] leading-relaxed">{testResult.message}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-neutral-800 pt-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 hover:border-neutral-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {apiKeyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-600 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider hover:bg-neutral-200 transition-colors border border-white"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
