import { useCallback, useState } from 'react';
import type { AddLog } from './useScanLog';

// localStorage keys and formats are part of the user's saved state: do not rename them.
export const GEMINI_KEY_STORAGE_KEY = 'mineiro_gemini_key';
export const GEMINI_MODEL_STORAGE_KEY = 'mineiro_gemini_model';
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage unavailable (restricted browser context)
  }
}

/** Saved model, except the retired alias `gemini-flash-latest`, which falls back to the default. */
export function readSavedGeminiModel(): string {
  const saved = readStorage(GEMINI_MODEL_STORAGE_KEY);
  if (saved && saved !== 'gemini-flash-latest') return saved;
  return DEFAULT_GEMINI_MODEL;
}

/**
 * Persisted analyst preferences: the personal Gemini key and model. Language and theme keep their own modules
 * (src/utils/i18n.tsx, src/theme/theme.ts); the remote-favicon switch lives in src/utils/faviconPreference.ts.
 */
export function useSettings(addLog: AddLog) {
  const [geminiKey, setGeminiKey] = useState<string>(() => readStorage(GEMINI_KEY_STORAGE_KEY) || '');
  const [geminiModel, setGeminiModel] = useState<string>(readSavedGeminiModel);

  const saveGeminiSettings = useCallback((key: string, model: string) => {
    setGeminiKey(key);
    setGeminiModel(model);
    if (key) {
      localStorage.setItem(GEMINI_KEY_STORAGE_KEY, key);
      localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
      addLog(`Configured personal Gemini AI key [Model: ${model}].`, 'success');
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
      localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, model);
      addLog(`Cleared personal Gemini AI key. Using server-side fallback.`, 'info');
    }
  }, [addLog]);

  return { geminiKey, geminiModel, saveGeminiSettings };
}
