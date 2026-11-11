// Codemod da Etapa 1 (docs/REFACTOR_PLAN.md): troca cor literal por token semântico.
//   node scripts/codemods/semantic-colors.mjs           aplica e imprime o relatório
//   node scripts/codemods/semantic-colors.mjs --dry     só relata, não grava
// Reexecutável: o que já está em token não casa de novo. Relatório também em artifacts/codemods/semantic-colors.json.
//
// Duas fases, ambas com mapa explícito abaixo; o que não está no mapa não é trocado, vai para o relatório.
//  1. Classes Tailwind: bg-[#…], text-[#…], border-[#…] (e divide, ring, from/via/to, fill, stroke, accent…),
//     *-neutral-N, *-white, *-black  →  bg-paper, text-ink-2, border-rule… (src/styles/tokens.css).
//     text escuro (#131210, black…) vira text-signal-ink quando a mesma string tem bg-[#F0885A] com o mesmo
//     prefixo de variante; senão text-paper (texto sobre fundo invertido em ink).
//  2. Hex em literal JS/JSX ('#ECE8DD', fill="#131210") de gráficos D3/SVG  →  PALETTE.ink (src/theme/palette.ts),
//     com o import acrescentado.
//  3. rgba(236,232,221,a) (a cor ink antiga com alfa) em sombras e traços  →  color-mix(… var(--ink) a% …).
// Pastas de origem de cor (src/styles, src/theme) e os arquivos adiados para a Etapa 2 ficam de fora
// (scripts/lib/color-scope.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFERRED_TO_STAGE_2, isColorSource, isDeferred, listSourceFiles } from '../lib/color-scope.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DRY = process.argv.includes('--dry');

// ---------- mapa: cor de origem → token, por papel do utilitário ----------
// Cores de origem: a paleta quente atual (hex e a escala neutral remapeada em index.css, que tinha os mesmos
// valores) e a paleta cinza-fria da tela inicial (HomeView, defeito 23 da linha de base).
const group = (token, colors) => Object.fromEntries(colors.map((c) => [c, token]));

const FILL_MAP = {
  ...group('paper', ['#131210', 'black', '#050505', '#000000', '#0b0e10']),
  ...group('paper-2', ['#1b1915', 'neutral-950', '#14181b']),
  ...group('card', ['#221f1a', '#101316', '#0d1013']),
  ...group('rule-2', ['#27241e', 'neutral-900']),
  ...group('rule', ['#37332b', 'neutral-800', '#4a453a', 'neutral-700']),
  ...group('ink-3', ['#6f6a5e', 'neutral-600', '#908b7d', 'neutral-500', '#a19c8e', 'neutral-400']),
  ...group('ink-2', ['#b9b4a6', 'neutral-300']),
  ...group('ink', ['#d6d1c3', 'neutral-200', '#ece8dd', 'neutral-100', 'white', '#ffffff', '#f3f0e8', 'neutral-50', '#f1f2f3']),
  ...group('signal', ['#f0885a']),
};

const DARK_TEXT = ['#131210', 'black', '#000000', '#050505', '#1b1915', 'neutral-950', '#27241e', 'neutral-900', '#0b0e10'];
const TEXT_MAP = {
  ...group('paper', DARK_TEXT), // ou signal-ink, ver signalContext()
  ...group('ink-3', [
    '#37332b', 'neutral-800', '#4a453a', 'neutral-700', '#6f6a5e', 'neutral-600', '#908b7d', 'neutral-500',
    '#a19c8e', 'neutral-400', '#a3a3a3', '#737373', '#8b929b', '#7d858e',
  ]),
  ...group('ink-2', ['#b9b4a6', 'neutral-300', '#989fa8', '#abb0b7', '#c3c7cc', '#d6d9dc']),
  ...group('ink', [
    '#d6d1c3', 'neutral-200', '#ece8dd', 'neutral-100', 'white', '#ffffff', '#f3f0e8', 'neutral-50',
    '#e8eaec', '#f1f2f3', '#f4f5f6', '#f7f7f8',
  ]),
  ...group('signal', ['#f0885a']),
};

// Linhas usam só rule: rule-2 fica para preenchimento (hover, aba ativa), que no alto contraste não pode ser
// branco como as linhas, senão o texto ink some sobre ele.
const LINE_MAP = {
  ...group('paper', ['black', '#131210', '#050505', '#000000']),
  ...group('rule', [
    '#27241e', 'neutral-900', 'neutral-950', '#1b1915', '#22272b',
    '#37332b', 'neutral-800', '#4a453a', 'neutral-700', '#2b3035', '#2d3339', '#3a4046', '#4a5057',
  ]),
  ...group('ink-3', [
    '#6f6a5e', 'neutral-600', '#908b7d', 'neutral-500', '#a19c8e', 'neutral-400', '#737373', '#6f7780',
    '#8b929b', '#9aa1a9',
  ]),
  ...group('ink-2', ['#b9b4a6', 'neutral-300']),
  ...group('ink', ['#d6d1c3', 'neutral-200', '#ece8dd', 'neutral-100', 'white', '#ffffff', '#f3f0e8', '#e8eaec']),
  ...group('signal', ['#f0885a']),
};

const ROLE_OF = {
  bg: FILL_MAP, from: FILL_MAP, via: FILL_MAP, to: FILL_MAP, fill: FILL_MAP,
  text: TEXT_MAP, placeholder: TEXT_MAP, caret: TEXT_MAP, accent: TEXT_MAP, decoration: TEXT_MAP,
  border: LINE_MAP, divide: LINE_MAP, ring: LINE_MAP, 'ring-offset': LINE_MAP, outline: LINE_MAP, stroke: LINE_MAP,
  shadow: LINE_MAP,
};

// Literais JS/JSX: sem utilitário para dizer o papel, então um mapa único por valor.
const JS_MAP = {
  ...group('ink', ['#ece8dd', '#f3f0e8', '#d6d1c3', '#ffffff']),
  ...group('ink2', ['#b9b4a6']),
  ...group('ink3', ['#908b7d', '#a19c8e', '#6f6a5e']),
  ...group('rule', ['#37332b', '#4a453a']),
  ...group('rule2', ['#27241e']),
  ...group('card', ['#221f1a']),
  ...group('paper2', ['#1b1915']),
  ...group('paper', ['#131210', '#050505', '#000000']),
  ...group('signal', ['#f0885a']),
};

// rgba(r,g,b,a) → token. Só a cor ink antiga; sombras pretas e brilhos verdes/vermelhos não estão aqui e vão
// para o relatório (os pretos ficam: sombra é escura em qualquer tema).
const RGBA_MAP = { '236,232,221': 'ink' };

// ---------- utilitários ----------
function normColor(raw) {
  const value = raw.toLowerCase();
  if (!value.startsWith('[#')) return value;
  let hex = value.slice(2, -1);
  if (hex.length === 3 || hex.length === 4) hex = [...hex.slice(0, 3)].map((c) => c + c).join('');
  if (hex.length === 8) hex = hex.slice(0, 6); // alfa no hex: não aparece hoje; relatado abaixo se aparecer
  return `#${hex}`;
}

const KINDS = 'bg|text|border(?:-[xytrblse])?|divide|ring-offset|ring|outline|from|via|to|fill|stroke|accent|caret|decoration|shadow|placeholder';
const CLASS_RE = new RegExp(
  `(?<=^|[\\s'"\`{(:])(!?)(-?)(${KINDS})-(\\[#[0-9a-fA-F]{3,8}\\]|neutral-\\d{2,3}|white|black)(\\/\\d{1,3}|\\/\\[[^\\]\\s]+\\])?(?![\\w\\[-])`,
  'g',
);
const DELIM = /[\s'"`]/;
const QUOTE = /['"`]/;
const SIGNAL_BG = /^(?:bg-\[#f0885a\]|bg-signal)(?:\/|$)/i;

function segmentAround(text, start, end) {
  let a = start;
  while (a > 0 && !QUOTE.test(text[a - 1]) && text[a - 1] !== '\n') a--;
  let b = end;
  while (b < text.length && !QUOTE.test(text[b]) && text[b] !== '\n') b++;
  return text.slice(a, b);
}

function variantPrefix(text, start) {
  let a = start;
  while (a > 0 && !DELIM.test(text[a - 1])) a--;
  return text.slice(a, start);
}

/** text escuro sobre bg-[#F0885A] (mesmo prefixo de variante, mesma string) é texto sobre signal. */
function signalContext(text, start, end, prefix) {
  return segmentAround(text, start, end)
    .split(/\s+/)
    .some((cls) => cls.startsWith(prefix) && SIGNAL_BG.test(cls.slice(prefix.length).replace(/^!/, '')));
}

const TEXT_COLOR = /^(?:[\w\-\[\]&:]*:)?!?text-(?:\[#|neutral-|white|black|ink|paper|signal)/;
function hasTextColor(text, start, end) {
  return segmentAround(text, start, end).split(/\s+/).some((cls) => TEXT_COLOR.test(cls));
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function relImport(rel) {
  const from = path.posix.dirname(rel);
  let spec = path.posix.relative(from, 'src/theme/palette');
  if (!spec.startsWith('.')) spec = `./${spec}`;
  return spec;
}

function ensurePaletteImport(source, rel) {
  const spec = relImport(rel);
  const existing = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"]${spec.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}['"];?`);
  const match = source.match(existing);
  if (match) {
    if (/\bPALETTE\b/.test(match[1])) return source;
    const names = match[1].trim().replace(/,\s*$/, '');
    return source.replace(existing, `import { ${names}, PALETTE } from '${spec}';`);
  }
  const imports = [...source.matchAll(/^import\s[^;]*?from\s*['"][^'"]+['"];?[ \t]*$/gm)];
  const line = `import { PALETTE } from '${spec}';\n`;
  if (!imports.length) return line + source;
  const last = imports[imports.length - 1];
  const at = last.index + last[0].length + 1;
  return source.slice(0, at) + line + source.slice(at);
}

// ---------- execução ----------
const targets = [
  'index.html',
  ...listSourceFiles(ROOT).filter((rel) => !isColorSource(rel) && !isDeferred(rel)),
];

const report = { replacedClasses: 0, replacedLiterals: 0, files: {}, unmatched: [], leftover: [], deferred: DEFERRED_TO_STAGE_2 };

for (const rel of targets) {
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, 'utf8');
  let changedClasses = 0;
  let changedLiterals = 0;

  let next = original.replace(CLASS_RE, (whole, bang, neg, kind, color, opacity = '', offset) => {
    const role = kind.startsWith('border') ? 'border' : kind;
    const map = ROLE_OF[role];
    const key = normColor(color);
    let token = map?.[key];
    if (!token || /^\[#[0-9a-f]{8}\]$/i.test(color)) {
      report.unmatched.push({ file: rel, line: lineOf(original, offset), token: whole, reason: 'cor fora do mapa' });
      return whole;
    }
    // Fundo cor de linha com texto colorido na mesma string é preenchimento (rótulo, tecla, chip), não linha.
    if (map === FILL_MAP && token === 'rule' && hasTextColor(original, offset, offset + whole.length)) token = 'rule-2';
    if (role === 'text' && DARK_TEXT.includes(key)) {
      const prefix = variantPrefix(original, offset);
      if (signalContext(original, offset, offset + whole.length, prefix)) token = 'signal-ink';
    }
    changedClasses++;
    return `${bang}${neg}${kind}-${token}${opacity}`;
  });

  if (/\.(ts|tsx)$/.test(rel)) {
    next = next.replace(/(=)?(['"])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\2/g, (whole, eq, _q, hex, offset) => {
      const full = `#${hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex}`.toLowerCase();
      const key = JS_MAP[full];
      if (!key) {
        report.unmatched.push({ file: rel, line: lineOf(next, offset), token: whole, reason: 'literal fora do mapa' });
        return whole;
      }
      changedLiterals++;
      return eq ? `={PALETTE.${key}}` : `PALETTE.${key}`;
    });
    if (changedLiterals) next = ensurePaletteImport(next, rel);
  }

  // Fase 3: rgba da cor ink do tema escuro antigo (236,232,221) com alfa, em sombras e traços de gráfico.
  // Vira color-mix sobre var(--ink), que acompanha o tema; em classe Tailwind, espaço vira "_".
  next = next.replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (whole, r, g, b, a, offset) => {
    const token = RGBA_MAP[`${r},${g},${b}`];
    if (!token) {
      report.unmatched.push({ file: rel, line: lineOf(next, offset), token: whole, reason: 'rgba fora do mapa' });
      return whole;
    }
    const pct = `${Math.round(Number(a) * 1000) / 10}%`;
    const inClass = variantPrefix(next, offset).includes('-[');
    changedClasses++;
    return inClass
      ? `color-mix(in_srgb,var(--${token})_${pct},transparent)`
      : `color-mix(in srgb, var(--${token}) ${pct}, transparent)`;
  });

  // Sobras: hex que nenhuma das fases trata (dentro de valores arbitrários, CSS embutido, comentários).
  next.split('\n').forEach((text, i) => {
    for (const m of text.matchAll(/(?<!&)#[0-9a-fA-F]{3,8}\b/g)) {
      report.leftover.push({ file: rel, line: i + 1, token: m[0], context: text.trim().slice(0, 160) });
    }
  });

  if (next !== original) {
    report.files[rel] = { classes: changedClasses, literals: changedLiterals };
    report.replacedClasses += changedClasses;
    report.replacedLiterals += changedLiterals;
    if (!DRY) fs.writeFileSync(file, next);
  }
}

const outDir = path.join(ROOT, 'artifacts', 'codemods');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'semantic-colors.json'), `${JSON.stringify(report, null, 2)}\n`);

console.log(`${DRY ? '[dry] ' : ''}classes trocadas: ${report.replacedClasses}; literais trocados: ${report.replacedLiterals}; arquivos: ${Object.keys(report.files).length}`);
for (const u of report.unmatched) console.log(`[sem mapa] ${u.file}:${u.line} ${u.token} (${u.reason})`);
for (const l of report.leftover) console.log(`[sobra] ${l.file}:${l.line} ${l.token}  ${l.context}`);
console.log(`adiados para a Etapa 2 (não tocados): ${DEFERRED_TO_STAGE_2.join(', ')}`);
