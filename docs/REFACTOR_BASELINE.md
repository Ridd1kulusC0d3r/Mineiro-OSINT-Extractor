# Linha de base da refatoração (Etapa 0)

Medido sobre `915b746` mais os commits da Etapa 0, em 2026-11-11, com Node 22 e Chromium 153.0.8010.12
(Playwright 1.63.0, build 1243). Referência: [`docs/REFACTOR_PLAN.md`](REFACTOR_PLAN.md).

Este documento separa o que foi **verificado rodando** do que foi **inferido lendo o código**. Quando não há
marcação, o item foi verificado.

## 1. Como reproduzir

| Comando | O que faz | Resultado hoje |
| --- | --- | --- |
| `npm run check` | todos os validadores, testes (56), demo, build | verde |
| `npm run visual` | `scripts/visual-smoke.mjs`: 17 telas x 3 temas em `artifacts/visual/<tema>/` | verde, 51 PNGs, 0 erros de console |
| `npm run api:baseline -- --check` | compara 33 rotas com `tests/fixtures/api-baseline/` | verde |
| `npm run demo` | bench sintético de detectores | `[PASS] Demo sintética validada com sucesso.` |

Como o smoke visual funciona:

- Sobe `dist/server.cjs` (faz `npm run build` se `dist/` não existir) numa porta livre em `127.0.0.1`, com
  `MINEIRO_DB=:memory:` e sem `GEMINI_API_KEY`.
- Idioma fixo em inglês e tema gravado em `localStorage` (`mineiro_language_preference`, `mineiro_theme_preference`)
  antes do carregamento. `Date` congelado em `2026-01-15T12:00:00Z`, `Math.random` com semente, `reducedMotion`.
- O scan é o caminho real do `App.tsx` (`scanTargetCore`, fila, cache, IndexedDB, snapshot): só a resposta de
  `POST /api/osint/verify` é trocada por respostas fixas, derivadas de `platformId` e do handle.
- Toda requisição para fora da máquina é bloqueada e registrada. Hosts conhecidos ficam em
  `KNOWN_EXTERNAL_HOSTS` no topo do script; a Etapa 2 deve esvaziar essa lista.
- Telas com modal são capturadas no tamanho da janela (1440x900); as demais em página inteira com 1440 de largura.
- Usa o Chromium do próprio Playwright; `CHROME_PATH` é ignorado de propósito (neste contêiner ele aponta para outro
  binário e os pixels mudam). `MINEIRO_VISUAL_CHROME` força outro executável quando necessário.
- Saída extra: `artifacts/visual/report.json` (telas, problemas, hosts externos, versão do navegador).

Determinismo (verificado comparando execuções seguidas pixel a pixel): 47 de 51 PNGs idênticos; os outros diferem
em no máximo 48 pixels (abaixo de 0,005%), em bordas de cartão de Plataformas, no desfoque do fundo do modal de
atalhos e no cabeçalho de `batch-queue`. Bem abaixo do limite de 0,5% da Etapa 5. O grafo D3 do painel antigo só estabiliza depois de cerca de 6 s; o script espera esse tempo.

## 2. Telas

Todas as telas abaixo renderizaram nos três temas, sem erro de página e sem erro de console. Nenhuma tela ficou
inalcançável. Nenhuma tela tem rolagem horizontal em 1440 px.

| Arquivo | Como se chega | O que se vê (tema `dark`) | Problemas visíveis |
| --- | --- | --- | --- |
| `start` | abrir o app | tela inicial v2: busca, exemplos, três modos, quatro passos | paleta fria (`#101316`, `#2b3035`) diferente do resto, que é quente; diz "20 detectors" enquanto a barra de cima diz "19 detectors in scope" |
| `report` | scan rápido de `mineiro-smoke` | relatório de inteligência, 22 seções, 12.961 px de altura | corpo inteiro em mono; "1 high-value finding" com 3 encontrados e cobertura "79%" ao lado de "19/19 completed" confundem |
| `evidence` | aba Evidence | tabela de 19 linhas | a barra de status é cortada pelo filtro ("3 found ‹", o contador "unresolved" some); filtros `FOUND` etc. sem tradução; tipo de site errado em várias linhas (Spotify e Steam como "developer platform", Instagram e TikTok como "video streaming") |
| `platforms` | aba Platforms | grade de cartões | mesmo corte da barra de status |
| `correlation` | aba Correlation | consulta de grafo e grafo de relações | rótulos sobrepostos (Steam Community, Instagram, TikTok cortado em "Tik"); aparece um segundo nó `mineiro-smoke` além do nó TARGET |
| `console` | aba Console | 14 eventos com horário | o banner diz `v2.5.0`; a versão do produto é 1.7.0 |
| `header-report` | botão Report do cabeçalho | volta ao relatório | igual a `report` |
| `header-ai` | botão AI do cabeçalho | Analyst Copilot, "not configured" | nenhum |
| `modal-gemini` | AI, botão Configure Gemini | modal de chave e modelo | nenhum |
| `header-cases-history-modal` | botão Cases do cabeçalho | casos persistentes (IndexedDB) e cache dos últimos 5 scans | nenhum |
| `header-batch-import-modal` | botão Batch do cabeçalho | importação de lote | "Automate Gemini AI Profiling: ENABLED" não tem efeito; "All Platforms (985 platforms)" não é o escopo que roda |
| `modal-export` | botão Export do cabeçalho | `IntelligenceExportModal`: seções e quatro formatos | nenhum |
| `modal-modular-scan` | engrenagem "Advanced settings" da barra de alvo | `ModularScanModal` | textos em português no meio da UI em inglês ("Catálogo completo com 985 endpoints", "Top 20 (Rápido)", "Todas (985+)", "alvos"); emojis; "Turbo (16x)" enquanto a barra mostra "10x" |
| `modal-shortcuts` | tecla `?` | lista de atalhos | "1 = Executive Dashboard" leva a uma tela que não existe nas abas |
| `dashboard-legacy` | tecla `1` (não há aba nem botão) | `DashboardView` antigo: registro, grafo D3, mapa, matriz | texto em português na UI inglesa ("Classificação baseada apenas..."); promessa "Zero-false-positive filtering" |
| `batch-queue` | lote de 2 alvos colado no modal Batch | `BulkScanView` com 2 alvos concluídos | "Scope: ALL" e "38 probes" com o modo Quick; o lote substitui o alvo e os resultados do scan individual (o cabeçalho passa a mostrar `mineiro-smoke-b`) |
| `start-recent-cases` | botão "Clear workspace" | tela inicial com "Continue where you left off" | mesma paleta fria de `start` |

Temas:

- `bone`: 16 das 17 capturas são idênticas byte a byte às do `dark` (a outra difere só pelo ruído descrito acima). O tema claro não tem estilo nenhum; o botão
  Theme parece não fazer nada no primeiro clique.
- `high-contrast`: só as bordas mudam para branco (`html.high-contrast *` em `src/index.css`). Fundos continuam
  `#131210` e o texto continua cinza. Não é alto contraste.

Não capturado e por quê:

- `ExportModal.tsx` (1.196 linhas): não é importado em lugar nenhum; o Export do app usa `IntelligenceExportModal`.
  É código morto (inferido por busca de importações).
- Analyst Copilot com resposta, Test Connection do Gemini e e-mail recon com MX/Gravatar: dependem de chave ou de
  rede externa. Fora do escopo de uma captura determinística.
- Modo e-mail, telas de celular e idiomas PT/ES: não fazem parte desta linha de base; `scripts/e2e-start-page.mjs`
  já cobre celular na tela inicial e passa.

## 3. Requisições externas

Observadas pelo smoke ao abrir todas as telas (todas bloqueadas, nenhuma saiu da máquina):

| Host | Origem |
| --- | --- |
| `www.google.com` (`/s2/favicons`) | `PlatformFavicon` via `src/utils/favicon.ts` |
| `icons.duckduckgo.com` | fallback do mesmo componente, quando o Google falha |

Somadas, 82 requisições por tema (246 nos três) ao percorrer as 17 telas.

Google Fonts já não está em `index.html` (saiu no merge `915b746`). Os hosts `fonts.googleapis.com` e
`fonts.gstatic.com` continuam na lista do script só para tornar visível uma regressão.

O servidor, por sua vez, só sai para a rede quando o usuário pede: `verify`, `email-recon` (DNS e Gravatar),
`wayback`, `avatar-hash`, `br/cnpj` e Gemini (inferido lendo `server.ts` e `server/routes/`).

## 4. Scan real e `npm run demo`

`npm run demo`: passa. GitHub com 4 amostras (precisão 1, recall 1, score 100) e GitLab com 4 (recall 0,5,
1 inconclusivo, score 83).

Scan real pelo app (Quick, alvo `forgejo`, sem simulação, pelo proxy deste contêiner), 19 detectores em 1,4 s,
sem erro de console:

- `found` (HTTP 200): github, hackernews, pinterest, spotify, steam, telegram, tiktok, twitch.
- `not_found` (404): devto, keybase, youtube.
- `uncertain`: gitlab, twitter (proteção de borda), linkedin (999), medium, reddit, threads (403).
- `rate_limited`: instagram (429).
- `error`: gravatar, "Blocked non-public address for en.gravatar.com". Não é limite do ambiente: ver defeito 1.

A rede deste contêiner passa por um proxy restritivo; respostas 403, 429 e 999 acima podem vir dele e não devem ser
lidas como defeito do produto. Vários `found` do modo Quick (hackernews, spotify, telegram, pinterest) são candidatos
a soft-404, porque o Quick não liga o Evidence Engine; isso é inferência, não foi conferido site a site.

## 5. Linha de base da API (para a Etapa 3)

`scripts/api-baseline.mjs` grava 33 respostas normalizadas em `tests/fixtures/api-baseline/` (corpo, status e os
cabeçalhos de contrato; `timestamp`, `generatedAt`, `collectedAt` e `responseTimeMs` viram `<volatile>`; o HTML da
SPA vira `<spa index.html>`). Cobre `/api/health`, `/api/registry/stats`, `/api/registry/detectors` (com e sem
filtro), `/api/registry/benchmark`, `/api/intelligence/copilot/status` (sem chave e com chave pessoal fictícia),
os erros de validação de todas as rotas POST, as rotas `store` com SQLite em memória e uma rota `/api` inexistente.
`--check` compara e sai com 1 se algo mudar.

O baseline grava o comportamento de hoje, inclusive os defeitos 6, 7 e 8. A Etapa 3 precisa decidir se mantém
essas respostas (comparação exata) ou se as corrige em commit separado, atualizando os fixtures de propósito.

## 6. Defeitos, por gravidade

Nenhum foi corrigido nesta etapa; nada impediu as capturas.

**Alta**

1. Gravatar (e qualquer site em `192.0.0.0/16`, como a Automattic/WordPress.com) é sempre `error`.
   `isBlockedAddress` bloqueia `a === 192 && b === 0` inteiro, mas só `192.0.0.0/24` e `192.0.2.0/24` são
   reservados. `src/core/net.ts:20`. Verificado no scan real (en.gravatar.com resolve para `192.0.80.x`).
2. Tema `bone` não tem estilo: capturas idênticas ao `dark`. `src/utils/theme.ts`, `src/index.css`.
3. Tema `high-contrast` só troca a cor das bordas; fundo e texto ficam iguais. `src/index.css:95-96`, fundo
   fixo em `src/App.tsx:1070`.
4. Abrir o app faz cerca de 80 requisições a terceiros (favicons no Google e DuckDuckGo), contra a proposta
   local-first. `src/components/PlatformFavicon.tsx`, `src/utils/favicon.ts:88-99`.
5. Um lote substitui o alvo e os resultados do scan individual aberto, sem aviso: `scanTargetCore` é chamado com
   `publishToWorkspace` padrão `true` em `handleStartBulkScan`, e `setTarget` é chamado a cada item.
   `src/App.tsx:637-657`. Verificado em `batch-queue`.

**Média**

6. Rota `/api` desconhecida responde 200 com o `index.html` da SPA, em vez de 404 JSON. `server.ts:1043`.
   Fixture `get-unknown-api-route.json`.
7. JSON malformado em qualquer POST responde 400 com página HTML do Express. `server.ts:29`. Fixture
   `post-verify-malformed-json.json`.
8. `POST /api/store/claims` com corpo vazio devolve a mensagem interna do JavaScript
   ("Cannot read properties of undefined (reading 'length')"). `server/db.ts:118`, `server/routes/store.ts:39`.
9. Barra de status cortada nas abas Evidence e Platforms: o filtro empurra os contadores e o "unresolved" some.
   `src/components/StatsBar.tsx` (linha `xl:flex-row` com `overflow-x-auto`).
10. Grafo de correlação com rótulos sobrepostos e um nó `mineiro-smoke` duplicado ao lado do TARGET.
    `src/components/RelationshipGraphView.tsx` (inferido que o nó extra vem das variantes do handle).
11. O modal de lote mostra "Automate Gemini AI Profiling: ENABLED", mas o perfil automático está desligado desde
    a v1.4.1 (`src/App.tsx:672`); "All Platforms (985 platforms)" e "Scope: ALL" não correspondem ao escopo que roda
    (o do preset atual). `src/components/BulkImportModal.tsx`, `src/components/BulkScanView.tsx`.
12. Painel antigo (`DashboardView`, 880 linhas) só abre pela tecla `1`; o modal de atalhos o anuncia como
    "Executive Dashboard", enquanto a ação `view-dashboard` do mesmo modal abre o relatório. `src/hooks/useGlobalShortcuts.ts:194`,
    `src/App.tsx:1025`.
13. Tipo de site errado no catálogo: Spotify e Steam como "developer platform", Instagram e TikTok como "video
    streaming". `src/data/platforms.ts` / `registry/`.
14. Servidor escuta em `0.0.0.0` por padrão; só o lançador pip força `127.0.0.1`. `server.ts:23`.

**Baixa**

15. Textos em português na UI em inglês: `ModularScanModal.tsx:284` e vizinhos, `DashboardView.tsx:606`.
16. Navegação do cabeçalho (`Report`, `Cases`, `Batch`, `AI`) e filtros de status escritos em inglês no JSX e
    traduzidos depois por um `MutationObserver` que reescreve o DOM. `src/components/Header.tsx`,
    `src/components/StatsBar.tsx`, `src/utils/i18n.tsx:1294`.
17. Banner do console com `v2.5.0`. `src/components/TerminalLogs.tsx:299`.
18. Contagem divergente: "Quick 20" e "20 detectors" na tela inicial, "19 detectors in scope" na barra.
    `src/components/HomeView.tsx:28`, `src/components/TargetBar.tsx`.
19. Só o modal de atalhos tem `role="dialog"` e `aria-modal`; os outros cinco não. `src/components/*Modal.tsx`.
20. `onOpenShortcuts` é passado ao `Header` mas não é usado: não há botão de atalhos no cabeçalho.
    `src/components/Header.tsx:32-46`.
21. `ExportModal.tsx` (1.196 linhas) é código morto. `src/components/ExportModal.tsx`.
22. Bundle do cliente com 1,41 MB (aviso do Vite em todo build). `vite.config.ts`.
23. Tela inicial com paleta fria própria (`#101316`, `#2b3035`, `#8b929b`), fora das três fontes de cor já listadas
    no plano. `src/components/HomeView.tsx`.
24. Texto que promete demais no painel antigo: "Confidence index 96.2% · Zero-false-positive filtering".
    `src/components/DashboardView.tsx`.

## 7. Correções feitas nesta etapa

Nenhuma. Nenhum defeito impediu as capturas.

## 8. Impacto no plano

- Etapa 2: a fonte remota já saiu; o que resta são os favicons de terceiros (defeito 4). O plano não os menciona, e
  o portão "nenhuma requisição externa ao abrir o app" depende deles.
- Etapa 5: `ExportModal.tsx` está na lista dos cinco componentes grandes, mas é código morto; apagar é mais barato
  que repartir. `DashboardView.tsx` (880 linhas, no limite) só é alcançável pela tecla `1`; vale decidir se fica.
- Etapa 1: o codemod precisa mapear também a paleta fria da tela inicial (defeito 23). O portão de contraste AA vai
  falhar no `high-contrast` atual, que não muda fundo nem texto.
- Etapa 3: comparação exata com a linha de base preserva os defeitos 6 a 8; corrigi-los exige atualizar os fixtures
  num commit próprio.
- Etapa 4: "scan real com o mesmo resultado" não é reproduzível com rede real (proxy, rate limit, sites mudando).
  O smoke com respostas fixas de `verify` é a comparação estável; o scan real serve só de sanidade.
- Seção 6, decisão 1: a branch `claude/nifty-babbage-3rntpa` já foi integrada em `915b746`.
