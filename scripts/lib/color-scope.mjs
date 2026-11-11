// Escopo de cor compartilhado por scripts/codemods/semantic-colors.mjs e scripts/validate-tokens.mjs.
import fs from 'node:fs';
import path from 'node:path';

/** Pastas onde cor literal é permitida: a definição dos tokens e o módulo que os lê. */
export const COLOR_SOURCE_DIRS = ['src/styles', 'src/theme'];

/**
 * Fora do escopo da Etapa 1, de propósito. São a exportação HTML e a impressão, que ganham a versão clara
 * para impressão com os mesmos tokens na Etapa 2 (docs/REFACTOR_PLAN.md, Etapa 2, passo 5). Até lá ficam
 * como estão: o codemod não as toca e o validador não as cobra. Remover cada linha quando a Etapa 2 chegar.
 */
export const DEFERRED_TO_STAGE_2 = [
  'src/intelligence/reportExport.ts', // CSS embutido no HTML exportado (#131210, #F3F0E8, ...)
  'src/utils/reportGenerator.ts', // gerador do relatório exportado
  'src/components/DossierPrintView.tsx', // relatório de impressão (bg-[#F0885A], escala neutral/black legada)
];

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
