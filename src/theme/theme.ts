export type ThemeMode = 'dark' | 'light' | 'high-contrast';

export const THEME_MODES: readonly ThemeMode[] = ['dark', 'light', 'high-contrast'];

/** Chave mantida desde a v1: não renomear (docs/PRIVACIDADE-E-DADOS.md). */
const THEME_STORAGE_KEY = 'mineiro_theme_preference';

/** Valores salvos por versões anteriores que ainda precisam abrir no tema certo. */
const LEGACY_THEME_VALUES: Record<string, ThemeMode> = { bone: 'light' };

/** Evento disparado em `window` a cada troca de tema, para quem precisa recalcular cores resolvidas (canvas, escalas D3). */
export const THEME_CHANGE_EVENT = 'mineiro:themechange';

/**
 * Tema inicial pela preferência do sistema, usado só quando nada foi salvo:
 * `prefers-contrast: more` → high-contrast; `prefers-color-scheme: light` → light; senão dark.
 */
export function getSystemPreferredTheme(): ThemeMode {
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-contrast: more)').matches) return 'high-contrast';
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  }
  return 'dark';
}

/** Converte um valor salvo (inclusive o legado `bone`) em tema válido, ou `null`. */
export function normalizeTheme(value: string | null | undefined): ThemeMode | null {
  if (!value) return null;
  if ((THEME_MODES as readonly string[]).includes(value)) return value as ThemeMode;
  return LEGACY_THEME_VALUES[value] ?? null;
}

/**
 * Tema salvo em localStorage ou, sem valor salvo, o do sistema.
 * Um valor legado (`bone`) é regravado como `light`.
 */
export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined' || !window.localStorage) {
    return getSystemPreferredTheme();
  }

  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const theme = normalizeTheme(saved);
    if (theme) {
      if (saved !== theme) window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      return theme;
    }
  } catch {
    // Ignore storage read errors
  }

  return getSystemPreferredTheme();
}

/** Próximo tema do botão Theme: dark → light → high-contrast → dark. */
export function nextTheme(theme: ThemeMode): ThemeMode {
  return THEME_MODES[(THEME_MODES.indexOf(theme) + 1) % THEME_MODES.length];
}

/**
 * Aplica `data-theme` (lido por src/styles/tokens.css) e as classes de compatibilidade em
 * document.documentElement, e grava a preferência em localStorage.
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  // Cross-fade de cor só numa troca de tema de verdade (não na carga inicial) e sem prefers-reduced-motion.
  const previous = root.getAttribute('data-theme');
  const reduceMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (previous && previous !== theme && !reduceMotion) {
    root.classList.add('theme-anim');
    window.setTimeout(() => root.classList.remove('theme-anim'), 500);
  }
  root.classList.remove('high-contrast', 'dark', 'light', 'theme-bone');

  if (theme === 'high-contrast') {
    root.classList.add('high-contrast', 'dark');
  } else if (theme === 'light') {
    root.classList.add('light');
  } else {
    root.classList.add('dark');
  }
  root.setAttribute('data-theme', theme);

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  } catch {
    // Ignore storage write errors
  }

  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
  }
}
