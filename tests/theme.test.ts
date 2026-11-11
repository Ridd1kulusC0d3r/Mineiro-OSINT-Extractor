import { afterEach, describe, expect, it } from 'vitest';
import { getSavedTheme, nextTheme, normalizeTheme } from '../src/theme/theme';

const KEY = 'mineiro_theme_preference';

function fakeWindow(saved: string | null, media: Record<string, boolean> = {}) {
  const store = new Map<string, string>();
  if (saved !== null) store.set(KEY, saved);
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    },
    matchMedia: (query: string) => ({ matches: Boolean(media[query]) }),
  };
  return store;
}

afterEach(() => {
  delete (globalThis as any).window;
});

describe('theme', () => {
  it('migrates the legacy "bone" value to "light" under the same key', () => {
    const store = fakeWindow('bone');
    expect(getSavedTheme()).toBe('light');
    expect(store.get(KEY)).toBe('light');
  });

  it('keeps valid saved values and ignores unknown ones', () => {
    expect(normalizeTheme('dark')).toBe('dark');
    expect(normalizeTheme('high-contrast')).toBe('high-contrast');
    expect(normalizeTheme('sepia')).toBeNull();
    fakeWindow('high-contrast', { '(prefers-color-scheme: light)': true });
    expect(getSavedTheme()).toBe('high-contrast');
  });

  it('uses prefers-contrast and prefers-color-scheme only when nothing is saved', () => {
    fakeWindow(null, { '(prefers-contrast: more)': true, '(prefers-color-scheme: light)': true });
    expect(getSavedTheme()).toBe('high-contrast');
    fakeWindow(null, { '(prefers-color-scheme: light)': true });
    expect(getSavedTheme()).toBe('light');
    fakeWindow(null);
    expect(getSavedTheme()).toBe('dark');
    fakeWindow('sepia');
    expect(getSavedTheme()).toBe('dark');
  });

  it('cycles dark → light → high-contrast → dark', () => {
    expect(nextTheme('dark')).toBe('light');
    expect(nextTheme('light')).toBe('high-contrast');
    expect(nextTheme('high-contrast')).toBe('dark');
  });
});
