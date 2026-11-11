// Validador de tokens de cor (docs/REFACTOR_PLAN.md, Etapa 1). Faz parte de `npm run check`.
//   node scripts/validate-tokens.mjs
// Falha quando:
//  1. src/styles/tokens.css não define todos os tokens nos três temas (dark, light, high-contrast);
//  2. os fallbacks de src/theme/palette.ts diferem do tema dark de tokens.css;
//  3. há hex literal em src/**/*.ts(x) fora de src/styles e src/theme (exceções da Etapa 2 em scripts/lib/color-scope.mjs);
//  4. há classe da escala antiga (*-neutral-N, *-white, *-black) fora dessas exceções;
//  5. um par texto/fundo dos tokens fica abaixo do contraste WCAG AA (4,5:1) em algum tema.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFERRED_TO_STAGE_2, isColorSource, isDeferred, listSourceFiles } from './lib/color-scope.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THEMES = ['dark', 'light', 'high-contrast'];
const TOKENS = [
  'paper', 'paper-2', 'card', 'ink', 'ink-2', 'ink-3', 'rule', 'rule-2',
  'signal', 'signal-ink', 'signal-soft', 'seq-0', 'seq-1', 'seq-2', 'seq-3', 'seq-4',
];

/**
 * Pares texto/fundo que a interface usa de fato. Fundos: página, faixa, cartão e o preenchimento de hover/aba
 * ativa (rule-2). Os demais: botão primário, chip invertido (text-paper sobre bg-ink) e eyebrow.
 */
const TEXT_PAIRS = [
  ...['ink', 'ink-2', 'ink-3', 'signal'].flatMap((fg) => ['paper', 'paper-2', 'card'].map((bg) => [fg, bg])),
  ['ink', 'rule-2'], ['ink-2', 'rule-2'], ['ink-3', 'rule-2'],
  ['signal-ink', 'signal'],
  ['paper', 'ink'],
  ['signal', 'signal-soft'],
];
const AA = 4.5;

const errors = [];
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// ---------- 1. tokens.css ----------
const css = read('src/styles/tokens.css').replace(/\/\*[\s\S]*?\*\//g, '');
const themes = {};
for (const theme of THEMES) {
  const selector = theme === 'dark' ? /:root,\s*:root\[data-theme="dark"\]\s*\{([^}]*)\}/ : new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`);
  const block = css.match(selector);
  if (!block) {
    errors.push(`tokens.css: bloco do tema ${theme} não encontrado`);
    continue;
  }
  themes[theme] = Object.fromEntries([...block[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2].toLowerCase()]));
  for (const token of TOKENS) {
    if (!themes[theme][token]) errors.push(`tokens.css: tema ${theme} sem --${token} em hex de 6 dígitos`);
  }
}
for (const token of TOKENS) {
  if (!new RegExp(`--color-${token}:\\s*var\\(--${token}\\)`).test(css)) errors.push(`tokens.css: @theme sem --color-${token}: var(--${token})`);
}

// ---------- 2. fallbacks de palette.ts ----------
const palette = read('src/theme/palette.ts');
const fallbackBlock = palette.match(/DARK_FALLBACK[^=]*=\s*\{([\s\S]*?)\};/);
if (!fallbackBlock) errors.push('palette.ts: DARK_FALLBACK não encontrado');
else if (themes.dark) {
  const fallback = Object.fromEntries([...fallbackBlock[1].matchAll(/'?([\w-]+)'?:\s*'(#[0-9a-fA-F]{6})'/g)].map((m) => [m[1], m[2].toLowerCase()]));
  for (const token of TOKENS) {
    if (fallback[token] !== themes.dark[token]) errors.push(`palette.ts: DARK_FALLBACK['${token}'] = ${fallback[token]} difere de tokens.css (${themes.dark[token]})`);
  }
}

// ---------- 3 e 4. cor literal fora das pastas de origem ----------
const HEX = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const LEGACY_CLASS = /(?<![\w-])(?:[\w-]+:)*-?(?:bg|text|border(?:-[xytrblse])?|divide|ring|outline|from|via|to|fill|stroke|accent|caret|decoration|shadow|placeholder)-(?:neutral-\d{2,3}|white|black)(?![\w-])/g;
let hexCount = 0;
let legacyCount = 0;
for (const rel of listSourceFiles(ROOT)) {
  if (isColorSource(rel) || isDeferred(rel)) continue;
  read(rel).split('\n').forEach((line, i) => {
    for (const m of line.matchAll(HEX)) {
      hexCount++;
      errors.push(`${rel}:${i + 1}: hex literal ${m[0]} (use uma classe semântica ou PALETTE de src/theme/palette.ts)`);
    }
    for (const m of line.matchAll(LEGACY_CLASS)) {
      legacyCount++;
      errors.push(`${rel}:${i + 1}: classe da escala antiga ${m[0]} (use paper/ink/rule/signal)`);
    }
  });
}

// ---------- 5. contraste ----------
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const contrastLines = [];
for (const theme of THEMES) {
  const t = themes[theme];
  if (!t) continue;
  const worst = [];
  for (const [fg, bg] of TEXT_PAIRS) {
    if (!t[fg] || !t[bg]) continue;
    const ratio = contrast(t[fg], t[bg]);
    worst.push({ pair: `${fg}/${bg}`, ratio });
    if (ratio < AA) errors.push(`contraste ${theme}: ${fg} (${t[fg]}) sobre ${bg} (${t[bg]}) = ${ratio.toFixed(2)}:1, abaixo de ${AA}:1`);
  }
  worst.sort((a, b) => a.ratio - b.ratio);
  contrastLines.push(`${theme}: ${TEXT_PAIRS.length} pares, menor ${worst[0].pair} ${worst[0].ratio.toFixed(2)}:1`);
}

if (errors.length) {
  for (const e of errors.slice(0, 60)) console.error(`[tokens] ${e}`);
  if (errors.length > 60) console.error(`[tokens] … e mais ${errors.length - 60}`);
  console.error(`[tokens] FALHOU: ${errors.length} problema(s) (${hexCount} hex, ${legacyCount} classes antigas).`);
  process.exit(1);
}
for (const line of contrastLines) console.log(`[tokens] AA ok: ${line}`);
console.log(`[tokens] OK: 0 hex literal e 0 classe antiga em src/ fora de src/styles e src/theme; exceções da Etapa 2: ${DEFERRED_TO_STAGE_2.length}.`);
