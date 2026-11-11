# Plano de refatoração arquitetural e de identidade visual

Estado: aprovado, em execução. Etapa 0 concluída (ver `docs/REFACTOR_BASELINE.md`). Branch de trabalho: `claude/brave-wright-d3gpv5`.
Cada etapa é executada por um agente Opus, uma por vez, e só avança quando o portão da etapa passa.

## 1. Diagnóstico (medido em `8f64aff`)

| Área | Achado | Consequência |
| --- | --- | --- |
| Cores | 1.744 hex literais em 39 arquivos de `src/` e 1.385 classes `neutral-*` | Trocar de tema exige reescrever arquivos. O tema claro ("bone") está no botão de tema mas não tem estilo nenhum. |
| Paleta | Três fontes concorrentes: `mineiroPalette.ts`, `themeColors.ts`, `@theme` em `index.css` | Nenhuma é a verdade única. |
| Fontes | `index.html` carrega Google Fonts (Bricolage, IBM Plex, JetBrains) | Uma ferramenta OSINT local-first faz requisição a terceiro a cada abertura e quebra offline. |
| `src/App.tsx` | 1.370 linhas, 39 hooks de estado, motor de scan, persistência e layout juntos | Qualquer mudança arrisca o scan. Não há como testar o motor isolado. |
| `server.ts` | 1.067 linhas: Gemini, e-mail recon e a rota `/api/osint/profile` (410 linhas) inline, enquanto `server/routes/` já existe para o resto | Rotas não testáveis; `server.ts` não exporta o app. |
| Chamadas de API | 6 `fetch('/api/...')` espalhados em 4 arquivos | Sem tratamento de erro e tipos comuns. |
| Domínio | `server.ts` importa de `src/data`, `src/core`, `src/registry` | A fronteira "código puro, sem React nem Express" existe na prática, mas nada a protege. |
| Componentes | 5 arquivos acima de 880 linhas (`WorldThreatMap`, `ExportModal`, `NetworkRelationshipGraph`, `AiProfileCard`, `RiskMatrix2x2`) | Dados e cálculo embutidos no JSX. |
| Testes | Só `tests/*.test.ts` de `core` em ambiente node | Nenhum teste de rota nem de tela. `npm run check` passa sem abrir o app. |
| Branch órfã | `claude/nifty-babbage-3rntpa` tem 4 commits sem PR (tela inicial v2, docs, correções; 95 arquivos) | Conflita com esta refatoração. Precisa de decisão antes da etapa 1. |

O que já funciona e deve continuar igual: `npm run check` verde, build, pacote pip, notebook Colab, contratos das rotas `/api/*`, formato dos casos salvos e dos relatórios exportados.

## 2. Arquitetura alvo

```text
index.html
src/
  styles/tokens.css      variáveis por tema (dark, light, high-contrast)
  styles/base.css        tipografia, componentes de identidade (eyebrow, tab, card, tbl)
  theme/                 theme.ts (alternância) + palette.ts (única fonte para JS/D3)
  api/client.ts          todas as chamadas /api, tipadas
  scan/                  motor de scan sem React (fila, concorrência, logs)
  hooks/                 useScan, useCases, useSettings, useBulkBatch
  app/                   App.tsx (composição), AppShell, roteamento de views
  components/            só apresentação
  core/ data/ registry/ intelligence/ graph/ cases/   domínio puro (sem React, sem Express)
server/
  app.ts                 createApp() exportado
  routes/                registry, email, gemini, copilot, profile, verify, extras, store
  services/gemini.ts     cliente, fallback de modelo, parsing
server.ts                bootstrap (~60 linhas)
tests/                   core + rotas + motor de scan
scripts/visual-smoke.mjs capturas das telas nos 3 temas
```

Regras que valem para todas as etapas:

- Refatoração preserva comportamento: nenhuma rota, formato de export ou chave de `localStorage` muda.
- Mover antes de reescrever. Extração de arquivo vai em commit separado de mudança de lógica.
- Nada de dependência nova de runtime. Dev-dependency só `@playwright/test` (etapa 0).
- O logo `assets/mineiro-logo.png` não muda.

## 3. Identidade visual (referência: LLmInjection `site/style.css`, commit `c67d262`)

Tokens, copiados dos valores atuais do LLmInjection:

| Token | Escuro | Claro | Uso |
| --- | --- | --- | --- |
| `--paper` | `#100f0d` | `#f6f5f1` | fundo da página |
| `--paper-2` | `#1a1916` | `#ecebe4` | faixas, hover |
| `--card` | `#1c1b17` | `#ffffff` | cartões, modais, tabelas |
| `--ink` | `#eeebe2` | `#15140f` | texto principal |
| `--ink-2` | `#bdb8aa` | `#45423a` | texto secundário |
| `--ink-3` | `#958f81` | `#625e55` | rótulos, metadados |
| `--rule` | `#36332b` | `#d6d2c6` | bordas |
| `--rule-2` | `#26241f` | `#e6e3da` | divisórias internas |
| `--signal` | `#f0885a` | `#b43c0e` | ação primária, ativo, "encontrado" |
| `--signal-ink` | `#131210` | `#ffffff` | texto sobre signal |
| `--signal-soft` | `#3a2418` | `#f7e6dc` | fundo de eyebrow, halo |
| `--seq-0..4` | `#3a2a21 #6b3d25 #a85a30 #e07f4e #f6b48f` | `#f5ddcf #e9b394 #d4804f #b43c0e #7c2406` | escalas: heatmap, matriz de risco, mapa |

Demais decisões:

- **Tipografia:** pilha do sistema, sem fonte remota. `--sans`/`--display` = Inter, system-ui; `--mono` = ui-monospace, SF Mono, JetBrains Mono, Menlo. Corpo em sans 15px; mono fica para rótulos, dados, console e tabelas numéricas. Hoje o corpo inteiro é mono.
- **Forma:** raio 14px (cartão) e 9px (controle), pílula para abas e chips; sombra suave `--shadow-1/2`.
- **Vocabulário:** `eyebrow` (pílula mono maiúscula em signal-soft), abas em pílula com ativa em signal, tabela com cabeçalho mono maiúsculo, cabeçalho da página com grade de 32px e halo radial em signal-soft.
- **Regra de cor:** um único matiz. Status continua comunicado por rótulo, ícone e estilo de borda; signal marca só ação primária, seleção e presença confirmada. Verde, vermelho e âmbar não entram.
- **Temas:** `dark` (padrão), `light` (substitui "bone"), `high-contrast` (preto e branco puros, como hoje). `prefers-color-scheme` e `prefers-contrast` definem o inicial.
- **Fora do app:** favicon (quadrado ink com barra signal), `assets/social-preview.png`, `MANUAL.html`, relatório de impressão e exportações HTML seguem os mesmos tokens. `BRAND.md` documenta tudo.

## 4. Etapas

### Etapa 0 — Linha de base e varredura de defeitos
Objetivo: saber o que "funcionar" significa antes de mexer.
1. Adicionar `@playwright/test` (dev) e `scripts/visual-smoke.mjs`: sobe `dist/server.cjs`, abre cada view (Relatório, Evidência, Plataformas, Correlação, Console, Casos, Lote, IA, modais de Export, Scan modular, Atalhos) e salva PNG em `artifacts/visual/<tema>/`. Falha se houver erro no console.
2. Rodar um scan real (`npm run demo` e um alvo pelo app) e registrar em `docs/REFACTOR_BASELINE.md`: erros de console, telas quebradas, rotas que falham.
3. Não corrigir nada ainda, exceto o que impedir a captura.

Portão: `npm run check` verde; `npm run visual` gera as capturas; lista de defeitos escrita.

### Etapa 1 — Tokens de design e temas
1. Criar `src/styles/tokens.css` com a tabela da seção 3 para `dark`, `light` e `high-contrast`, e expor no `@theme` do Tailwind como `paper`, `paper-2`, `card`, `ink`, `ink-2`, `ink-3`, `rule`, `rule-2`, `signal`, `signal-ink`, `signal-soft`, `seq-0..4`.
2. Codemod (script em `scripts/codemods/`, reexecutável) que troca `bg-[#…]`, `text-[#…]`, `border-[#…]` e `*-neutral-*`, `*-white`, `*-black` pelas classes semânticas. Mapa explícito no script; o que não casar vira relatório, não chute.
3. `src/theme/palette.ts` lê as variáveis CSS em tempo de execução para D3, canvas e SVG; apagar `mineiroPalette.ts` e `themeColors.ts`, migrando `CATEGORY_COLORS`, `CATEGORY_BADGES`, `STATUS_COLORS`.
4. `theme.ts`: `bone` vira `light`, com migração do valor salvo em `localStorage`.
5. Novo validador `scripts/validate-tokens.mjs` no `npm run check`: falha se houver hex literal em `src/**/*.tsx` ou `.ts` fora de `src/styles` e `src/theme`.

Portão: zero hex literal fora das duas pastas; capturas nos 3 temas sem texto ilegível (contraste AA checado no validador para os pares texto/fundo); `npm run check` verde.

### Etapa 2 — Identidade LLmInjection nos componentes
1. `index.html`: remover Google Fonts e as classes de cor do `<body>`; favicon novo.
2. `src/styles/base.css`: tipografia, `eyebrow`, `tab`, `card`, `tbl`, `btn-primary`, `chip`, cabeçalho com grade.
3. Aplicar em ordem: `Header`, `TargetBar`, `StatsBar`, abas de view, `PlatformTable`/`PlatformGrid`, `IntelligenceReportView`, `DashboardView`, modais, `TerminalLogs` (continua mono).
4. Gráficos: `CategoryHeatMap`, `RiskMatrix2x2`, `WorldThreatMap`, `NetworkRelationshipGraph` usam `seq-0..4` e `ink`/`rule`.
5. `DossierPrintView`, `reportExport.ts`, `reportGenerator.ts`, `MANUAL.html`: mesmos tokens, com versão clara para impressão.
6. Atualizar `BRAND.md`, `assets/social-preview.png` e as capturas do README.

Portão: capturas revisadas tela a tela contra o LLmInjection; nenhuma requisição externa ao abrir o app (verificado no smoke); `npm run check` verde.

### Etapa 3 — Servidor em módulos
1. `server/app.ts` com `createApp()`; `server.ts` só faz bootstrap e `listen`.
2. Mover sem alterar lógica: `server/services/gemini.ts` (cliente, fallback, `parseCleanJson`, `withTimeout`), `server/routes/registry.ts`, `email.ts`, `gemini.ts`, `copilot.ts`, `profile.ts`.
3. `tests/routes.test.ts`: sobe `createApp()` em porta 0 e cobre `/api/health`, `/api/registry/*`, `/api/osint/verify` (com `fetch` simulado), validação de entrada e rate limit.
4. Ajustar `build`, `build:bundle`, `Dockerfile` e `scripts/build-python-package.mjs` se o ponto de entrada mudar.

Portão: respostas de todas as rotas idênticas às da etapa 0 (comparação de JSON gravado); `npm run check` e build do pacote pip verdes.

### Etapa 4 — Cliente desacoplado
1. `src/api/client.ts`: uma função tipada por rota, erro padronizado.
2. `src/scan/engine.ts`: `scanTargetCore` e a fila de concorrência saem do `App.tsx`, sem React; teste em `tests/scan-engine.test.ts` com verificador simulado.
3. Hooks: `useScan`, `useCases`, `useSettings` (chave e modelo Gemini), `useBulkBatch`, `useModals`.
4. `src/app/App.tsx` compõe; meta de até 300 linhas.
5. Teste de fronteira `tests/boundaries.test.ts`: `core`, `data`, `registry`, `intelligence`, `graph`, `cases`, `scan` não importam `react` nem `express`; `components` não importa `server`.

Portão: scan real com o mesmo resultado da linha de base; casos salvos antes da etapa abrem depois; `npm run check` verde.

### Etapa 5 — Componentes grandes
Só os cinco acima de 880 linhas. Para cada um: dados estáticos vão para `src/data/`, cálculo puro para um módulo irmão com teste, JSX repartido em subcomponentes no mesmo diretório. Sem mudança visual.

Portão: capturas idênticas às da etapa 2 (diferença de pixel abaixo de 0,5%); nenhum arquivo de componente acima de 500 linhas.

### Etapa 6 — Distribuição Linux e pendências
1. `packaging/install-linux.sh` (apt, dnf, yum; Node 22; `pipx install mineiro-osint`).
2. Workflow `linux-matrix.yml`: `debian:stable`, `ubuntu:24.04`, `kalilinux/kali-rolling`, `parrotsec/core`, `amazonlinux:2023`; instala e roda `mineiro --version` e `/api/health`.
3. PRs do Dependabot abertos (#45, #47, #48, #49, #50): aplicar os compatíveis num único commit; `motion` 14 é major e só entra se o smoke visual passar.
4. Atualizar `ARCHITECTURE.md`, `CONTRIBUTING.md` e `CHANGELOG.md`; versão 1.8.0.

Portão: matriz verde nas cinco distros; `npm run check` verde.

## 4.1 Ajustes depois da etapa 0

A linha de base (`docs/REFACTOR_BASELINE.md`) listou 24 defeitos. Cada um entra na etapa que já toca o arquivo:

| Etapa | Defeitos da linha de base | Mudança no plano |
| --- | --- | --- |
| 1 | 2, 3, 23 | O codemod também mapeia a paleta cinza-fria da tela inicial. O alto contraste passa a trocar fundo e texto, não só bordas. |
| 2 | 4, 9, 10, 11, 15, 16, 18, 19, 20, 24 | `PlatformFavicon` deixa de chamar Google e DuckDuckGo: monograma local por padrão, favicon remoto só com opção ligada pelo usuário. `KNOWN_EXTERNAL_HOSTS` do smoke fica vazio. Google Fonts já saiu no merge `915b746`. |
| 3 | 1, 6, 7, 8, 14, 17 | Correções de rota mudam as fixtures de `tests/fixtures/api-baseline/` de propósito, em commit próprio. O defeito 1 (`src/core/net.ts` bloqueia `192.0.0.0/16` inteiro) ganha teste. Padrão de escuta passa a `127.0.0.1`. |
| 4 | 5, 12 | A comparação de "mesmo resultado" usa o smoke com respostas fixas, não rede real. |
| 5 | 21, 22 | `ExportModal.tsx` é código morto: apagar em vez de repartir. `DashboardView` é legado: decidir remover ou ligar ao menu. Divisão do bundle por `import()` nas views pesadas. |
| 6 | 13 | Correção dos tipos de site no catálogo. |

A decisão em aberto 1 está resolvida: a branch `claude/nifty-babbage-3rntpa` foi integrada em `915b746`.

## 5. Como o Opus executa

- Um agente Opus por etapa, em sequência, porque todas tocam os mesmos arquivos. Dentro da etapa 2 e da 5, subtarefas por componente podem rodar em paralelo em worktrees separados.
- Cada agente recebe: este arquivo, a etapa, o portão e a instrução de parar e relatar se o portão não passar em duas tentativas.
- Ao fim de cada etapa: `npm run check`, `npm run visual`, revisão do diff pelo orquestrador, um commit por passo lógico e push.
- Entrega em três PRs para manter a revisão possível: **A** (etapas 0 a 2, identidade), **B** (3 a 5, arquitetura), **C** (6, Linux e pendências). Depois de cada merge a branch recomeça da `main`.
- Reversão: cada etapa é um conjunto de commits próprio; reverter uma não desfaz as anteriores.

## 6. Decisões em aberto

1. **Branch `claude/nifty-babbage-3rntpa`:** integrar antes da etapa 1, descartar ou tratar depois.
2. **Tema padrão:** escuro (proposto) ou seguir o sistema.
3. **Merge:** quem faz o merge de cada PR quando o CI fica verde.
