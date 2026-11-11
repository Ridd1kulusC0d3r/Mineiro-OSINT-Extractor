// Escopo de cor compartilhado por scripts/codemods/semantic-colors.mjs e scripts/validate-tokens.mjs.
import fs from 'node:fs';
import path from 'node:path';

/** Pastas onde cor literal é permitida: a definição dos tokens e o módulo que os lê. */
export const COLOR_SOURCE_DIRS = ['src/styles', 'src/theme'];

/**
 * Exceções ao validador. Vazia desde a Etapa 2 (docs/REFACTOR_PLAN.md): exportação HTML, gerador de relatório e
 * impressão passaram a usar os tokens (src/theme/tokens.ts e o bloco @media print de tokens.css).
 */
export const DEFERRED_TO_STAGE_2 = [];

const toPosix = (file) => file.split(path.sep).join('/');

export function isColorSource(rel) {
  return COLOR_SOURCE_DIRS.some((dir) => rel === dir || rel.startsWith(`${dir}/`));
}

export function isDeferred(rel) {
  return DEFERRED_TO_STAGE_2.includes(rel);
}

/** Arquivos .ts/.tsx de src/ relativos à raiz, em ordem estável. */
export function listSourceFiles(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(toPosix(path.relative(root, full)));
    }
  };
  walk(path.join(root, 'src'));
  return out.sort();
}
