import * as d3 from 'd3';
import { MINEIRO_PALETTE } from './mineiroPalette';

/**
 * Mineiro Username Intelligence — Monochrome UI
 * Cores autorizadas:
 * Ink: #050505 | Ink 2: #0A0A0A | Line: #2A2A2A
 * Texto: #F5F5F5 | Texto 2: #A3A3A3 | Texto 3: #737373
 * White signal: #FFFFFF | Neutral absence: #737373
 * Bone: #FAFAFA | Ciano escuro: #A3A3A3 | Vermelho aberração: #FFFFFF
 */

// ==========================================
// 1. Category Color Hierarchy (Mineiro Neutrals & Contorno)
// ==========================================
export const CATEGORY_COLORS: Record<string, string> = {
  developer: MINEIRO_PALETTE.text,   // #F5F5F5
  security: MINEIRO_PALETTE.text,    // #F5F5F5
  social: MINEIRO_PALETTE.text2,     // #A3A3A3
  gaming: MINEIRO_PALETTE.text2,     // #A3A3A3
  crypto: MINEIRO_PALETTE.text,      // #F5F5F5
  creative: MINEIRO_PALETTE.text,    // #F5F5F5
  community: MINEIRO_PALETTE.text2,  // #A3A3A3
  media: MINEIRO_PALETTE.text2,      // #A3A3A3
  email: MINEIRO_PALETTE.cyan,       // #FFFFFF
  tech: MINEIRO_PALETTE.text,        // #F5F5F5
  finance: MINEIRO_PALETTE.text2,    // #A3A3A3
  default: MINEIRO_PALETTE.text3,    // #737373
};

export const CATEGORY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  developer: { bg: 'bg-[#0A0A0A]', text: 'text-[#F5F5F5]', border: 'border-[#2A2A2A]' },
  security: { bg: 'bg-[#0A0A0A]', text: 'text-[#F5F5F5]', border: 'border-[#2A2A2A]' },
  social: { bg: 'bg-[#0A0A0A]', text: 'text-[#A3A3A3]', border: 'border-[#2A2A2A]' },
  gaming: { bg: 'bg-[#0A0A0A]', text: 'text-[#A3A3A3]', border: 'border-[#2A2A2A]' },
  crypto: { bg: 'bg-[#0A0A0A]', text: 'text-[#F5F5F5]', border: 'border-[#2A2A2A]' },
  creative: { bg: 'bg-[#0A0A0A]', text: 'text-[#F5F5F5]', border: 'border-[#2A2A2A]' },
  community: { bg: 'bg-[#0A0A0A]', text: 'text-[#A3A3A3]', border: 'border-[#2A2A2A]' },
  media: { bg: 'bg-[#0A0A0A]', text: 'text-[#A3A3A3]', border: 'border-[#2A2A2A]' },
  email: { bg: 'bg-[#0A0A0A]', text: 'text-[#FFFFFF]', border: 'border-[#FFFFFF]/50' },
  default: { bg: 'bg-[#050505]', text: 'text-[#737373]', border: 'border-[#2A2A2A]' },
};

// ==========================================
// 2. Recon Probe Status Hierarchy
// Monochrome rule: status is differentiated by label, border style, icon and contrast
// ==========================================
export const STATUS_COLORS = {
  found: {
    hex: MINEIRO_PALETTE.cyan,       // #FFFFFF (confirmed public signal)
    darkBg: MINEIRO_PALETTE.ink2,    // #0A0A0A
    lightText: MINEIRO_PALETTE.cyan, // #FFFFFF
    tailwindBadge: 'bg-[#FFFFFF] text-[#050505] font-bold border-[#FFFFFF]',
    label: 'HIT // SINAL',
  },
  uncertain: {
    hex: MINEIRO_PALETTE.text2,      // #A3A3A3
    darkBg: MINEIRO_PALETTE.ink2,    // #0A0A0A
    lightText: MINEIRO_PALETTE.text2,// #A3A3A3
    tailwindBadge: 'bg-[#0A0A0A] text-[#A3A3A3] border-[#737373] border-dashed',
    label: 'INCERTO (WAF)',
  },
  not_found: {
    hex: MINEIRO_PALETTE.rose,       // #737373 (absence signal)
    darkBg: MINEIRO_PALETTE.ink,     // #050505
    lightText: MINEIRO_PALETTE.text3,// #737373
    tailwindBadge: 'bg-[#050505] text-[#737373] border-[#2A2A2A]',
    label: 'AUSÊNCIA (404)',
  },
  scanning: {
    hex: MINEIRO_PALETTE.cyan,       // #FFFFFF
    darkBg: MINEIRO_PALETTE.ink2,    // #0A0A0A
    lightText: MINEIRO_PALETTE.cyan, // #FFFFFF
    tailwindBadge: 'bg-[#0A0A0A] text-[#FFFFFF] border-[#FFFFFF] animate-pulse',
    label: 'VARRENDO...',
  },
  rate_limited: {
    hex: MINEIRO_PALETTE.text3,      // #737373
    darkBg: MINEIRO_PALETTE.ink2,    // #0A0A0A
    lightText: MINEIRO_PALETTE.text2,// #A3A3A3
    tailwindBadge: 'bg-[#0A0A0A] text-[#A3A3A3] border-[#2A2A2A]',
    label: 'RATE LIMITED (429)',
  },
  pending: {
    hex: MINEIRO_PALETTE.text3,      // #737373
    darkBg: MINEIRO_PALETTE.ink,     // #050505
    lightText: MINEIRO_PALETTE.text3,// #737373
    tailwindBadge: 'bg-[#050505] text-[#737373] border-[#2A2A2A]',
    label: 'AGUARDANDO',
  },
  error: {
    hex: MINEIRO_PALETTE.rose,       // #737373
    darkBg: MINEIRO_PALETTE.ink2,    // #0A0A0A
    lightText: MINEIRO_PALETTE.rose, // #737373
    tailwindBadge: 'bg-[#0A0A0A] text-[#737373] border-[#737373]',
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
    badge: 'text-[#737373] border-[#2A2A2A] bg-[#050505]',
    desc: 'Superfície de ataque irrelevante (0 a 1 alvo público)',
  },
  LOW: {
    hex: MINEIRO_PALETTE.text2,
    label: 'BAIXA',
    badge: 'text-[#A3A3A3] border-[#2A2A2A] bg-[#0A0A0A]',
    desc: 'Presença digital contida (2 a 3 alvos públicos)',
  },
  MODERATE: {
    hex: MINEIRO_PALETTE.text,
    label: 'MODERADA',
    badge: 'text-[#F5F5F5] border-[#2A2A2A] bg-[#0A0A0A]',
    desc: 'Exposição intermediária (4 a 8 serviços ativos)',
  },
  ELEVATED: {
    hex: MINEIRO_PALETTE.text,
    label: 'ELEVADA',
    badge: 'text-[#F5F5F5] border-[#737373] bg-[#0A0A0A]',
    desc: 'Alta correlação cruzada de perfis (9 a 15 serviços)',
  },
  SEVERE: {
    hex: MINEIRO_PALETTE.cyan,
    label: 'SEVERA',
    badge: 'text-[#050505] bg-[#FFFFFF] border-[#FFFFFF] font-bold shadow-[0_0_12px_rgba(255, 255, 255,0.3)]',
    desc: 'Superfície crítica exposta (16+ contas identificadas)',
  },
} as const;

// ==========================================
// 4. Heat Map Thermal Spectrum (0% -> 100% Mineiro Spectrum)
// 0%: #050505 (Ink - Dormente)
// 25%: #0A0A0A (Ink 2 - Painéis)
// 50%: #2A2A2A (Line - Divisórias)
// 75%: #737373 (Texto 3 - Discreto)
// 90%: #A3A3A3 (Texto 2)
// 100%: #FFFFFF (White - strongest contrast)
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
  if (percentage === 0) return MINEIRO_PALETTE.text3; // #737373
  if (percentage < 85) return MINEIRO_PALETTE.text;   // #F5F5F5
  return MINEIRO_PALETTE.ink;                         // #050505 on top of #FFFFFF
}
