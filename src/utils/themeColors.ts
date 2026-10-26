import * as d3 from 'd3';
import { MINEIRO_PALETTE } from './mineiroPalette';

/**
 * Mineiro Username Intelligence — Monochrome UI
 * Cores autorizadas:
 * Ink: #131210 | Ink 2: #1B1915 | Line: #37332B
 * Texto: #ECE8DD | Texto 2: #B9B4A6 | Texto 3: #908B7D
 * White signal: #ECE8DD | Neutral absence: #908B7D
 * Bone: #F3F0E8 | Ciano escuro: #B9B4A6 | Vermelho aberração: #ECE8DD
 */

// ==========================================
// 1. Category Color Hierarchy (Mineiro Neutrals & Contorno)
// ==========================================
export const CATEGORY_COLORS: Record<string, string> = {
  developer: MINEIRO_PALETTE.text,   // #ECE8DD
  security: MINEIRO_PALETTE.text,    // #ECE8DD
  social: MINEIRO_PALETTE.text2,     // #B9B4A6
  gaming: MINEIRO_PALETTE.text2,     // #B9B4A6
  crypto: MINEIRO_PALETTE.text,      // #ECE8DD
  creative: MINEIRO_PALETTE.text,    // #ECE8DD
  community: MINEIRO_PALETTE.text2,  // #B9B4A6
  media: MINEIRO_PALETTE.text2,      // #B9B4A6
  email: MINEIRO_PALETTE.cyan,       // #ECE8DD
  tech: MINEIRO_PALETTE.text,        // #ECE8DD
  finance: MINEIRO_PALETTE.text2,    // #B9B4A6
  default: MINEIRO_PALETTE.text3,    // #908B7D
};

export const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  developer: { bg: 'bg-[#1B1915]', text: 'text-[#ECE8DD]', border: 'border-[#37332B]' },
  security: { bg: 'bg-[#1B1915]', text: 'text-[#ECE8DD]', border: 'border-[#37332B]' },
  social: { bg: 'bg-[#1B1915]', text: 'text-[#B9B4A6]', border: 'border-[#37332B]' },
  gaming: { bg: 'bg-[#1B1915]', text: 'text-[#B9B4A6]', border: 'border-[#37332B]' },
  crypto: { bg: 'bg-[#1B1915]', text: 'text-[#ECE8DD]', border: 'border-[#37332B]' },
  creative: { bg: 'bg-[#1B1915]', text: 'text-[#ECE8DD]', border: 'border-[#37332B]' },
  community: { bg: 'bg-[#1B1915]', text: 'text-[#B9B4A6]', border: 'border-[#37332B]' },
  media: { bg: 'bg-[#1B1915]', text: 'text-[#B9B4A6]', border: 'border-[#37332B]' },
  email: { bg: 'bg-[#1B1915]', text: 'text-[#ECE8DD]', border: 'border-[#ECE8DD]/50' },
  default: { bg: 'bg-[#131210]', text: 'text-[#908B7D]', border: 'border-[#37332B]' },
};

// ==========================================
// 2. Recon Probe Status Hierarchy
// Monochrome rule: status is differentiated by label, border style, icon and contrast
// ==========================================
export const STATUS_COLORS = {
  found: {
    hex: MINEIRO_PALETTE.cyan,       // #ECE8DD (confirmed public signal)
    darkBg: MINEIRO_PALETTE.ink2,    // #1B1915
    lightText: MINEIRO_PALETTE.cyan, // #ECE8DD
    tailwindBadge: 'bg-[#F0885A] text-[#131210] font-bold border-[#F0885A]',
    label: 'HIT // SINAL',
  },
  uncertain: {
    hex: MINEIRO_PALETTE.text2,      // #B9B4A6
    darkBg: MINEIRO_PALETTE.ink2,    // #1B1915
    lightText: MINEIRO_PALETTE.text2,// #B9B4A6
    tailwindBadge: 'bg-[#1B1915] text-[#B9B4A6] border-[#908B7D] border-dashed',
    label: 'INCERTO (WAF)',
  },
  not_found: {
    hex: MINEIRO_PALETTE.rose,       // #908B7D (absence signal)
    darkBg: MINEIRO_PALETTE.ink,     // #131210
    lightText: MINEIRO_PALETTE.text3,// #908B7D
    tailwindBadge: 'bg-[#131210] text-[#908B7D] border-[#37332B]',
    label: 'AUSÊNCIA (404)',
  },
  scanning: {
    hex: MINEIRO_PALETTE.cyan,       // #ECE8DD
    darkBg: MINEIRO_PALETTE.ink2,    // #1B1915
    lightText: MINEIRO_PALETTE.cyan, // #ECE8DD
    tailwindBadge: 'bg-[#1B1915] text-[#ECE8DD] border-[#F0885A] animate-pulse',
    label: 'VARRENDO...',
  },
  rate_limited: {
    hex: MINEIRO_PALETTE.text3,      // #908B7D
    darkBg: MINEIRO_PALETTE.ink2,    // #1B1915
    lightText: MINEIRO_PALETTE.text2,// #B9B4A6
    tailwindBadge: 'bg-[#1B1915] text-[#B9B4A6] border-[#37332B]',
    label: 'RATE LIMITED (429)',
  },
  pending: {
    hex: MINEIRO_PALETTE.text3,      // #908B7D
    darkBg: MINEIRO_PALETTE.ink,     // #131210
    lightText: MINEIRO_PALETTE.text3,// #908B7D
    tailwindBadge: 'bg-[#131210] text-[#908B7D] border-[#37332B]',
    label: 'AGUARDANDO',
  },
  error: {
    hex: MINEIRO_PALETTE.rose,       // #908B7D
    darkBg: MINEIRO_PALETTE.ink2,    // #1B1915
    lightText: MINEIRO_PALETTE.rose, // #908B7D
    tailwindBadge: 'bg-[#1B1915] text-[#908B7D] border-[#908B7D]',
    label: 'ERRO NA BASE',
  },
} as const;

// ==========================================
// 3. Operational Exposure & Threat Severity
// ==========================================
export const EXPOSURE_COLORS = {
  MINIMAL: {
    hex: MINEIRO_PALETTE.text3,
    label: 'MÍNIMA',
    badge: 'text-[#908B7D] border-[#37332B] bg-[#131210]',
    desc: 'Superfície de ataque irrelevante (0 a 1 alvo público)',
  },
  LOW: {
    hex: MINEIRO_PALETTE.text2,
    label: 'BAIXA',
    badge: 'text-[#B9B4A6] border-[#37332B] bg-[#1B1915]',
    desc: 'Presença digital contida (2 a 3 alvos públicos)',
  },
  MODERATE: {
    hex: MINEIRO_PALETTE.text,
    label: 'MODERADA',
    badge: 'text-[#ECE8DD] border-[#37332B] bg-[#1B1915]',
    desc: 'Exposição intermediária (4 a 8 serviços ativos)',
  },
  ELEVATED: {
    hex: MINEIRO_PALETTE.text,
    label: 'ELEVADA',
    badge: 'text-[#ECE8DD] border-[#908B7D] bg-[#1B1915]',
    desc: 'Alta correlação cruzada de perfis (9 a 15 serviços)',
  },
  SEVERE: {
    hex: MINEIRO_PALETTE.cyan,
    label: 'SEVERA',
    badge: 'text-[#131210] bg-[#F0885A] border-[#F0885A] font-bold shadow-[0_0_12px_rgba(236,232,221,0.3)]',
    desc: 'Superfície crítica exposta (16+ contas identificadas)',
  },
} as const;

// ==========================================
// 4. Heat Map Thermal Spectrum (0% -> 100% Mineiro Spectrum)
// 0%: #131210 (Ink - Dormente)
// 25%: #1B1915 (Ink 2 - Painéis)
// 50%: #37332B (Line - Divisórias)
// 75%: #908B7D (Texto 3 - Discreto)
// 90%: #B9B4A6 (Texto 2)
// 100%: #ECE8DD (White - strongest contrast)
// ==========================================
export const HEATMAP_STOPS = [
  { offset: 0, color: MINEIRO_PALETTE.ink, label: 'Dormente' },
  { offset: 0.25, color: MINEIRO_PALETTE.ink2, label: 'Baixa' },
  { offset: 0.50, color: MINEIRO_PALETTE.line, label: 'Média' },
  { offset: 0.75, color: MINEIRO_PALETTE.text3, label: 'Elevada' },
  { offset: 0.90, color: MINEIRO_PALETTE.text2, label: 'Alta' },
  { offset: 1.0, color: MINEIRO_PALETTE.cyan, label: 'Sinal Crítico' },
];

/**
 * Creates a calibrated D3 scale for heat map intensity adhering strictly to Mineiro palette.
 */
export function createHeatmapColorScale(domainMin = 0, domainMax = 100) {
  return d3.scaleLinear<string>()
    .domain([
      domainMin,
      domainMin + (domainMax - domainMin) * 0.25,
      domainMin + (domainMax - domainMin) * 0.50,
      domainMin + (domainMax - domainMin) * 0.75,
      domainMin + (domainMax - domainMin) * 0.90,
      domainMax
    ])
    .range([
      MINEIRO_PALETTE.ink,
      MINEIRO_PALETTE.ink2,
      MINEIRO_PALETTE.line,
      MINEIRO_PALETTE.text3,
      MINEIRO_PALETTE.text2,
      MINEIRO_PALETTE.cyan
    ])
    .clamp(true);
}

/**
 * Helper to get exact hex color for a given intensity percentage (0 - 100).
 */
export function getHeatmapIntensityColor(percentage: number): string {
  const scale = createHeatmapColorScale(0, 100);
  return scale(Math.max(0, Math.min(100, percentage)));
}

/**
 * Helper to pick high-contrast text color based on cell luminosity.
 */
export function getContrastTextColor(percentage: number): string {
  if (percentage === 0) return MINEIRO_PALETTE.text3; // #908B7D
  if (percentage < 85) return MINEIRO_PALETTE.text;   // #ECE8DD
  return MINEIRO_PALETTE.ink;                         // #131210 on top of #ECE8DD
}
