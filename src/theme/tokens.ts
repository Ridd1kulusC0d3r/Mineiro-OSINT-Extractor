/**
 * Valores dos tokens para documentos fora do app (exportação HTML), que não carregam src/styles/tokens.css.
 * Sem React nem DOM: roda também no Node (scripts, testes). scripts/validate-tokens.mjs confere que estes valores
 * são iguais aos de tokens.css, então a única fonte continua sendo tokens.css.
 */
export const THEME_TOKENS = {
  dark: {
    paper: '#100f0d', 'paper-2': '#1a1916', card: '#1c1b17', ink: '#eeebe2', 'ink-2': '#bdb8aa', 'ink-3': '#958f81',
    rule: '#36332b', 'rule-2': '#26241f', signal: '#f0885a', 'signal-ink': '#131210', 'signal-soft': '#3a2418',
    'seq-0': '#3a2a21', 'seq-1': '#6b3d25', 'seq-2': '#a85a30', 'seq-3': '#e07f4e', 'seq-4': '#f6b48f',
  },
  light: {
    paper: '#f6f5f1', 'paper-2': '#ecebe4', card: '#ffffff', ink: '#15140f', 'ink-2': '#45423a', 'ink-3': '#625e55',
    rule: '#d6d2c6', 'rule-2': '#e6e3da', signal: '#b43c0e', 'signal-ink': '#ffffff', 'signal-soft': '#f7e6dc',
    'seq-0': '#f5ddcf', 'seq-1': '#e9b394', 'seq-2': '#d4804f', 'seq-3': '#b43c0e', 'seq-4': '#7c2406',
  },
} as const;

/** Papel branco na impressão; o resto igual ao tema claro (como o bloco @media print de tokens.css). */
const PRINT_OVERRIDES = { paper: '#ffffff', 'paper-2': '#f6f5f1' } as const;

const FONTS = [
  '--sans:"Inter",system-ui,-apple-system,"Segoe UI",Helvetica,Arial,sans-serif',
  '--mono:ui-monospace,"SF Mono","JetBrains Mono",Menlo,Consolas,"Liberation Mono",monospace',
].join(';');

const vars = (values: Record<string, string>) =>
  Object.entries(values).map(([name, value]) => `--${name}:${value}`).join(';');

/**
 * Bloco CSS com os tokens para um documento exportado: claro por padrão, escuro quando o leitor prefere,
 * e sempre claro (papel branco) na impressão.
 */
export function exportTokenCss(): string {
  return [
    `:root{color-scheme:light dark;${FONTS};${vars(THEME_TOKENS.light)};--grid-line:rgba(21,20,15,.05)}`,
    `@media (prefers-color-scheme:dark){:root{${vars(THEME_TOKENS.dark)};--grid-line:rgba(238,235,226,.045)}}`,
    `@media print{:root{color-scheme:light;${vars({ ...THEME_TOKENS.light, ...PRINT_OVERRIDES })};--grid-line:transparent}}`,
  ].join('\n');
}
