import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import { THEME_CHANGE_EVENT } from './theme';

/**
 * Única fonte de cor para JS, D3, SVG e canvas (docs/REFACTOR_PLAN.md, Etapa 1).
 * Os valores vivem em src/styles/tokens.css, um bloco por tema; nada aqui escolhe cor por conta própria.
 *
 * - `PALETTE.x` é uma referência CSS (`var(--x)`): serve para atributos SVG, `style` e D3 `.attr()`/`.style()`
 *   e acompanha a troca de tema sem novo render.
 * - `resolvePalette()` lê os valores calculados do tema ativo, para o que precisa da cor em si
 *   (interpolação de escala D3, canvas). Quem usa deve recalcular com `useThemeVersion()`.
 */

export const TOKEN_NAMES = [
  'paper', 'paper-2', 'card', 'ink', 'ink-2', 'ink-3', 'rule', 'rule-2',
  'signal', 'signal-ink', 'signal-soft', 'seq-0', 'seq-1', 'seq-2', 'seq-3', 'seq-4',
] as const;
export type TokenName = (typeof TOKEN_NAMES)[number];

/**
 * Valores do tema dark, usados só quando não há documento (testes, SSR) ou a variável não resolve.
 * scripts/validate-tokens.mjs confere que são iguais aos de src/styles/tokens.css.
 */
export const DARK_FALLBACK: Record<TokenName, string> = {
  paper: '#100f0d',
  'paper-2': '#1a1916',
  card: '#1c1b17',
  ink: '#eeebe2',
  'ink-2': '#bdb8aa',
  'ink-3': '#958f81',
  rule: '#36332b',
  'rule-2': '#26241f',
  signal: '#f0885a',
  'signal-ink': '#131210',
  'signal-soft': '#3a2418',
  'seq-0': '#3a2a21',
  'seq-1': '#6b3d25',
  'seq-2': '#a85a30',
  'seq-3': '#e07f4e',
  'seq-4': '#f6b48f',
};

const cssVar = (name: TokenName) => `var(--${name})`;

export const PALETTE = {
  paper: cssVar('paper'),
  paper2: cssVar('paper-2'),
  card: cssVar('card'),
  ink: cssVar('ink'),
  ink2: cssVar('ink-2'),
  ink3: cssVar('ink-3'),
  rule: cssVar('rule'),
  rule2: cssVar('rule-2'),
  signal: cssVar('signal'),
  signalInk: cssVar('signal-ink'),
  signalSoft: cssVar('signal-soft'),
  seq0: cssVar('seq-0'),
  seq1: cssVar('seq-1'),
  seq2: cssVar('seq-2'),
  seq3: cssVar('seq-3'),
  seq4: cssVar('seq-4'),
  onSeqLow: 'var(--on-seq-low)',
  onSeqMid: 'var(--on-seq-mid)',
  onSeqHigh: 'var(--on-seq-high)',
} as const;

/** Valor calculado de um token no tema ativo (por exemplo `#eeebe2`). */
export function resolveToken(name: TokenName): string {
  if (typeof document !== 'undefined' && typeof getComputedStyle === 'function') {
    const value = getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
    if (value) return value;
  }
  return DARK_FALLBACK[name];
}

/** Todos os tokens resolvidos no tema ativo. */
export function resolvePalette(): Record<TokenName, string> {
  return Object.fromEntries(TOKEN_NAMES.map((name) => [name, resolveToken(name)])) as Record<TokenName, string>;
}

/** Número que muda a cada troca de tema; use como dependência de efeitos que pintam com cores resolvidas. */
export function useThemeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(THEME_CHANGE_EVENT, bump);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, bump);
  }, []);
  return version;
}

// ==========================================
// 1. Categorias (monocromático: hierarquia por contraste, não por matiz)
// ==========================================
export const CATEGORY_COLORS: Record<string, string> = {
  developer: PALETTE.ink,
  security: PALETTE.ink,
  social: PALETTE.ink2,
  gaming: PALETTE.ink2,
  crypto: PALETTE.ink,
  creative: PALETTE.ink,
  community: PALETTE.ink2,
  media: PALETTE.ink2,
  email: PALETTE.ink,
  tech: PALETTE.ink,
  finance: PALETTE.ink2,
  default: PALETTE.ink3,
};

export const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  developer: { bg: 'bg-paper-2', text: 'text-ink', border: 'border-rule' },
  security: { bg: 'bg-paper-2', text: 'text-ink', border: 'border-rule' },
  social: { bg: 'bg-paper-2', text: 'text-ink-2', border: 'border-rule' },
  gaming: { bg: 'bg-paper-2', text: 'text-ink-2', border: 'border-rule' },
  crypto: { bg: 'bg-paper-2', text: 'text-ink', border: 'border-rule' },
  creative: { bg: 'bg-paper-2', text: 'text-ink', border: 'border-rule' },
  community: { bg: 'bg-paper-2', text: 'text-ink-2', border: 'border-rule' },
  media: { bg: 'bg-paper-2', text: 'text-ink-2', border: 'border-rule' },
  email: { bg: 'bg-paper-2', text: 'text-ink', border: 'border-ink/50' },
  default: { bg: 'bg-paper', text: 'text-ink-3', border: 'border-rule' },
};

// ==========================================
// 2. Status de sondagem: diferença por rótulo, estilo de borda, ícone e contraste
// ==========================================
export const STATUS_COLORS = {
  found: {
    hex: PALETTE.ink,
    darkBg: PALETTE.paper2,
    lightText: PALETTE.ink,
    tailwindBadge: 'bg-signal text-signal-ink font-bold border-signal',
    label: 'HIT // SINAL',
  },
  uncertain: {
    hex: PALETTE.ink2,
    darkBg: PALETTE.paper2,
    lightText: PALETTE.ink2,
    tailwindBadge: 'bg-paper-2 text-ink-2 border-ink-3 border-dashed',
    label: 'INCERTO (WAF)',
  },
  not_found: {
    hex: PALETTE.ink3,
    darkBg: PALETTE.paper,
    lightText: PALETTE.ink3,
    tailwindBadge: 'bg-paper text-ink-3 border-rule',
    label: 'AUSÊNCIA (404)',
  },
  scanning: {
    hex: PALETTE.ink,
    darkBg: PALETTE.paper2,
    lightText: PALETTE.ink,
    tailwindBadge: 'bg-paper-2 text-ink border-signal animate-pulse',
    label: 'VARRENDO...',
  },
  rate_limited: {
    hex: PALETTE.ink3,
    darkBg: PALETTE.paper2,
    lightText: PALETTE.ink2,
    tailwindBadge: 'bg-paper-2 text-ink-2 border-rule',
    label: 'RATE LIMITED (429)',
  },
  pending: {
    hex: PALETTE.ink3,
    darkBg: PALETTE.paper,
    lightText: PALETTE.ink3,
    tailwindBadge: 'bg-paper text-ink-3 border-rule',
    label: 'AGUARDANDO',
  },
  error: {
    hex: PALETTE.ink3,
    darkBg: PALETTE.paper2,
    lightText: PALETTE.ink3,
    tailwindBadge: 'bg-paper-2 text-ink-3 border-ink-3',
    label: 'ERRO NA BASE',
  },
} as const;

// ==========================================
// 3. Exposição operacional
// ==========================================
export const EXPOSURE_COLORS = {
  MINIMAL: {
    hex: PALETTE.ink3,
    label: 'MÍNIMA',
    badge: 'text-ink-3 border-rule bg-paper',
    desc: 'Superfície de ataque irrelevante (0 a 1 alvo público)',
  },
  LOW: {
    hex: PALETTE.ink2,
    label: 'BAIXA',
    badge: 'text-ink-2 border-rule bg-paper-2',
    desc: 'Presença digital contida (2 a 3 alvos públicos)',
  },
  MODERATE: {
    hex: PALETTE.ink,
    label: 'MODERADA',
    badge: 'text-ink border-rule bg-paper-2',
    desc: 'Exposição intermediária (4 a 8 serviços ativos)',
  },
  ELEVATED: {
    hex: PALETTE.ink,
    label: 'ELEVADA',
    badge: 'text-ink border-ink-3 bg-paper-2',
    desc: 'Alta correlação cruzada de perfis (9 a 15 serviços)',
  },
  SEVERE: {
    hex: PALETTE.ink,
    label: 'SEVERA',
    badge: 'text-signal-ink bg-signal border-signal font-bold shadow-[0_0_12px_color-mix(in_srgb,var(--ink)_30%,transparent)]',
    desc: 'Superfície crítica exposta (16+ contas identificadas)',
  },
} as const;

// ==========================================
// 4. Escala sequencial (heatmap, matriz, mapa): do fundo (dormente) às cinco etapas seq-0..4 de tokens.css,
//    um único matiz (signal) em intensidade crescente.
// ==========================================
const HEATMAP_TOKENS: Array<{ offset: number; token: TokenName; label: string }> = [
  { offset: 0, token: 'paper-2', label: 'Dormente' },
  { offset: 0.2, token: 'seq-0', label: 'Baixa' },
  { offset: 0.4, token: 'seq-1', label: 'Média' },
  { offset: 0.6, token: 'seq-2', label: 'Elevada' },
  { offset: 0.8, token: 'seq-3', label: 'Alta' },
  { offset: 1.0, token: 'seq-4', label: 'Sinal Crítico' },
];

export const HEATMAP_STOPS = HEATMAP_TOKENS.map(({ offset, token, label }) => ({ offset, color: cssVar(token), label }));

/** Escala D3 calibrada nas cores resolvidas do tema ativo (interpolação precisa da cor, não de `var()`). */
export function createHeatmapColorScale(domainMin = 0, domainMax = 100) {
  const span = domainMax - domainMin;
  return d3
    .scaleLinear<string>()
    .domain(HEATMAP_TOKENS.map(({ offset }) => domainMin + span * offset))
    .range(HEATMAP_TOKENS.map(({ token }) => resolveToken(token)))
    .clamp(true);
}

/** Cor resolvida para uma intensidade de 0 a 100. */
export function getHeatmapIntensityColor(percentage: number): string {
  return createHeatmapColorScale(0, 100)(Math.max(0, Math.min(100, percentage)));
}

/**
 * Texto legível sobre a célula da escala seq. tokens.css define, por tema, a cor de texto para as etapas claras
 * (--on-seq-low), a do meio (--on-seq-mid) e as fortes (--on-seq-high).
 */
export function getContrastTextColor(percentage: number): string {
  if (percentage === 0) return PALETTE.ink3;
  if (percentage < 50) return 'var(--on-seq-low)';
  if (percentage < 70) return 'var(--on-seq-mid)';
  return 'var(--on-seq-high)';
}
