export type ThemeMode = 'dark' | 'bone' | 'high-contrast';

const THEME_STORAGE_KEY = 'mineiro_theme_preference';

/**
 * Detect user's system preference:
 * If the user has configured system high-contrast / more-contrast, default to 'high-contrast'.
 * Otherwise default to standard 'dark'.
 */
export function getSystemPreferredTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-contrast: more)').matches) {
      return 'high-contrast';
    }
  }
  return 'dark';
}

/**
 * Retrieve the active theme from localStorage, or infer from system preference.
 */
export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getSystemPreferredTheme();
  }

  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY) || window.localStorage.getItem('mineiro_theme_preference');
    if (saved === 'high-contrast' || saved === 'dark' || saved === 'bone') {
      return saved as ThemeMode;
    }
  } catch {
    // Ignore storage read errors
  }

  return getSystemPreferredTheme();
}

/**
 * Apply the theme class and data-theme attribute to document.documentElement
 * and persist preference to localStorage.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.classList.remove('high-contrast', 'dark', 'theme-bone');

  if (theme === 'high-contrast') {
    root.classList.add('high-contrast', 'dark');
    root.setAttribute('data-theme', 'high-contrast');
  } else if (theme === 'bone') {
    root.classList.add('theme-bone');
    root.setAttribute('data-theme', 'bone');
  } else {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore storage write errors
  }
}
