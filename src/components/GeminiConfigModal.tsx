import { useState } from 'react';
import { Key, Sparkles, CheckCircle2, XCircle, ExternalLink, X, Eye, EyeOff, ShieldCheck, Cpu } from 'lucide-react';
import { useI18n } from '../utils/i18n';

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
  const { tr } = useI18n();
  const [apiKeyInput, setApiKeyInput] = useState(personalKey);
  const supportedModels = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];
  const initialModel = supportedModels.includes(selectedModel) ? selectedModel : 'gemini-3.8-flash';
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
          message: data.error || data.message || tr('gemini.validationFailed'),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || tr('gemini.connectionError'),
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
    <div className="fixed inset-0 z-50 bg-paper/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-paper-2 border border-rule max-w-xl w-full p-6 space-y-5 text-ink-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-rule pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-signal text-signal-ink flex items-center justify-center font-bold">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">
                {tr('gemini.title')}
              </h2>
              <p className="text-[11px] text-ink-3">
                {tr('gemini.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-3 hover:text-ink p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-3 bg-rule-2/80 border border-rule text-xs space-y-1.5">
          <div className="flex items-center gap-2 text-ink font-semibold">
            <ShieldCheck className="w-4 h-4 text-ink-3" />
            <span>{tr('gemini.privacy')}</span>
          </div>
          <p className="text-ink-3 text-[11px] leading-relaxed">
            {tr('gemini.privacyDesc')}
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-ink underline hover:text-ink-2 pt-1"
          >
            {tr('gemini.obtainKey')} <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Inputs */}
        <div className="space-y-4 text-xs">
          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-ink-2 font-semibold block uppercase tracking-wider text-[11px]">
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
                className="w-full bg-paper border border-rule text-ink px-3 py-2.5 pr-20 text-xs font-mono focus:border-signal focus:outline-none tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-3 hover:text-ink text-[11px]"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-ink-3">
              {tr('gemini.blankKey')}
            </p>
          </div>

          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="text-ink-2 font-semibold block uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              Selected Gemini Model
            </label>
            <select
              value={modelInput}
              onChange={(e) => {
                setModelInput(e.target.value);
                setTestResult(null);
              }}
              className="w-full bg-paper border border-rule text-ink px-3 py-2 text-xs font-mono focus:border-signal focus:outline-none"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended · Stable)</option>
              <option value="gemini-3.7-flash">gemini-3.7-flash (Stable fallback)</option>
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Fast / efficient)</option>
              <option value="gemini-flash-latest">gemini-flash-latest (Latest alias)</option>
            </select>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`p-3 border text-xs flex items-start gap-2.5 font-mono ${
              testResult.success
                ? 'bg-paper border-signal text-ink'
                : 'bg-paper border-ink-3 text-ink-2'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-ink mt-0.5" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0 text-ink-3 mt-0.5" />
            )}
            <div className="text-[11px] leading-relaxed">{testResult.message}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-rule pt-4 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="px-3 py-2 bg-rule-2 hover:bg-rule-2 text-ink border border-rule hover:border-ink-3 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isTesting ? tr('gemini.testing') : tr('gemini.test')}
            </button>
            {apiKeyInput && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 text-ink-3 hover:text-ink border border-rule hover:border-ink-3 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-ink-3 hover:text-ink transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-signal text-signal-ink font-bold uppercase tracking-wider hover:bg-ink transition-colors border border-signal"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
