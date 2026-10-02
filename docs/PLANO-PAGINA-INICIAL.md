# Plano de melhorias · tela inicial

Estado: v2 entregue. Este documento registra **o que mudou, o que foi medido e o que vem a seguir**, em ordem de prioridade.

Princípio de trabalho: a tela inicial existe para levar a pessoa do "abri o app" ao "primeiro scan correto" no menor número de decisões, **sem esconder o caráter probatório da ferramenta** (observação não é identidade) e sem telemetria de usuário.

## 1. Linha de base medida

| Medida | Antes | Agora | Como medir |
|---|---:|---:|---|
| Altura da tela antes do primeiro scan (desktop, 1440 px) | 10.067 px (22 seções vazias) | 1.915 px | `scrollHeight` no Playwright |
| Onde fica o campo de busca | só na barra do topo | no hero, com foco automático em desktop | `scripts/e2e-start-page.mjs` |
| Violações WCAG 2 A/AA (axe-core) na tela inicial | não medido na v1; **9 de contraste** apareceram no primeiro rascunho da v2 e foram corrigidas | 0 | `npm run e2e:start` |
| Entrada inválida (URL de perfil, e-mail no modo errado, espaços) | escaneava o lixo | sugere a correção com 1 clique | `src/core/target.ts` + 6 testes |
| Chaves de i18n (EN/PT/ES) | 191 | 237 (46 novas na tela inicial) | `npm run i18n:validate` |
| JavaScript inicial (build de produção) | 1.430 KB (377 KB gzip), um único arquivo | **igual** | saída de `npm run build` |

A última linha é de propósito: ela é o próximo item P0.

## 2. Entregue

**v1** (antes): proposta de valor, exemplos públicos, três modos selecionáveis, legenda de veredito, método em quatro passos, garantias e atalhos.

**v2** (esta rodada):

- **Busca no hero.** Formulário próprio (Usuário/E-mail, campo, "Run scan"), ligado ao mesmo estado da barra do topo. Mostra o modo ativo e os atalhos (`Ctrl+K`, `Ctrl+Enter`, `?`).
- **Entrada tolerante** (`analyzeTarget`, função pura e testada):
  - `https://github.com/forgejo` → sugere `@forgejo` (reconhece o padrão de URL dos 985 detectores);
  - `ana@example.org` no modo usuário → oferece trocar para o modo e-mail;
  - `john smith` → sugere `johnsmith`;
  - `@@x` → o `@` inicial é removido ao digitar.
  Regra de segurança: com uma correção disponível, **Enter aplica a correção e não executa o scan**. Nunca se escaneia algo que sabemos estar errado.
- **Continue de onde parou.** Até 3 casos recentes (IndexedDB local), com alvo, "há X minutos" e achados/verificados. Um clique reabre o caso.
- **Status do sistema.** Versão, "rodando localmente" ou "instância compartilhada" (novo campo `publicMode` em `/api/health`) e se o copiloto de IA está configurado. Silencioso se a API estiver fora.
- **Acessibilidade.** Contraste corrigido, `aria-pressed` nos modos, `aria-live` nas dicas, `role="search"`, foco visível; em celular o campo **não** recebe foco automático (evita abrir o teclado sobre a página).
- **Teste ponta a ponta reutilizável**: `npm run e2e:start` (17 verificações: foco, URL colada, e-mail, espaços, modo, exemplo, scan, caso recente, status, axe, celular sem overflow, sem erros de página).

## 3. Problemas conhecidos (com evidência)

Em celular (390 px) a tela tem 3.821 px de altura: é uma coluna única, longa por natureza, mas a busca e os exemplos ficam na primeira dobra. Se o item 6 do plano mostrar abandono, avaliar recolher "Como funciona" em celular.

1. **Abas vazias mentem.** Antes do primeiro scan, *Evidence* e *Platforms* mostram "NO PLATFORMS MATCH CURRENT FILTER · Adjust filter settings…", como se existisse um filtro a ajustar. *Correlation* mostra um painel de consulta sobre um grafo vazio. *Observado.*
2. **JavaScript monolítico.** 1,43 MB num só arquivo, com d3, topojson, o mapa-múndi (1.340 linhas) e o relatório incluídos no JS que a primeira tela já baixa. O build avisa (`chunks larger than 500 kB`). *Observado.*
3. **A "pergunta de inteligência" saiu do pré-scan.** Antes era escolhida na seção 01 do relatório vazio; agora só aparece depois do scan. Não muda os fatos (só a relevância dos achados), mas é uma regressão de descoberta. *Observado.*
4. **O tema "bone" quase não muda nada.** Os componentes usam hex fixos; só o alto contraste tem efeito visível. *Observado.*
5. **Texto fixo fora do i18n.** Em uma só tela encontramos 7 strings em português dentro do relatório em inglês. Há motivo para supor mais em outros componentes. *Hipótese; falta auditar.*
6. **O teste ponta a ponta depende de rede externa** (executa um scan real). Serve de verificação manual, mas não é determinístico para CI. *Observado.*

## 4. Plano priorizado

Esforço: **S** ≤ 1 dia · **M** 2–4 dias · **L** > 1 semana.

### P0 · próximas 1–2 semanas

| # | Item | Por quê | Critério de aceite | Esforço |
|---|---|---|---|---|
| 1 | **Estados vazios honestos** nas abas Evidence, Platforms, Correlation e Console | Problema 1: mensagem enganosa antes do primeiro scan | Nenhuma aba, sem scan, exibe texto de filtro; cada uma explica o que aparecerá e tem botão "Voltar ao início" | S |
| 2 | **E2E determinístico no CI** | Problema 6: sem rede flaky, sem regressão silenciosa | `page.route('/api/osint/verify')` devolve resultados sintéticos; job `e2e` no GitHub Actions com Chromium; screenshots anexados em caso de falha | M |
| 3 | **Code-splitting** (`React.lazy`) do relatório, grafo/mapa, modal de export | Problema 2: custo pago por quem só quer digitar um handle | JS inicial reduzido em ≥ 50% na saída do build; orçamento de tamanho falha o CI se estourar | M |
| 4 | **Seletor compacto de pergunta de inteligência** no formulário | Problema 3: recuperar a descoberta sem reabrir a parede de seções | Select/segmented com os 6 requisitos, valor propagado para o relatório; testado no E2E | S |

### P1 · próximo mês

| # | Item | Por quê | Critério de aceite | Esforço |
|---|---|---|---|---|
| 5 | **"Carregar investigação de exemplo"** (conjunto sintético embutido) | Permite avaliar o relatório completo **sem consultar ninguém**: demos, screenshots e CI sem rede, sem questão ética | Botão na Home abre o relatório com ~50 resultados sintéticos, rotulados "SYNTHETIC" em toda a interface e nos exports | M |
| 6 | **Lembrar último modo, tipo de alvo e idioma** | Menos cliques em uso repetido | Persistido em `localStorage`, ignorado no modo público | S |
| 7 | **Sinal de confiança do registry** na Home | A diferença do projeto é proveniência; hoje não aparece | "985 detectores · N com regra verificada · última verificação AAAA-MM-DD" via `/api/registry/stats` | S |
| 8 | **Auditoria de i18n com lint** | Problema 5 | Regra que falha o CI para texto literal em JSX fora de `tr()`; lista de exceções explícita | M |
| 9 | **Soltar CSV na Home** (drag-and-drop) | Lote hoje exige abrir modal | Arrastar `.csv` abre a importação já preenchida | S |
| 10 | **Orçamento de performance e Lighthouse CI** | Evitar que o item 3 regrida | A11y ≥ 95, LCP e tamanho do bundle como metas versionadas | S |
| 11 | **Teste visual de regressão** (3 idiomas × 3 larguras) | Layouts quebram em silêncio (já vimos um overflow de URL) | Capturas de referência versionadas; diff com tolerância | M |
| 12 | **Limpar "continue de onde parou"** | Os casos recentes expõem alvos anteriores em máquina compartilhada | Botão "limpar" por item e geral; documentado em `SECURITY.md` | S |

### P2 · depois

| # | Item | Observação | Esforço |
|---|---|---|---|
| 13 | **Tema claro de verdade** (tokens CSS em vez de hex fixos) | Problema 4; toca todos os componentes, por isso depois do item 11 (rede de proteção visual) | L |
| 14 | **Paleta de comandos** (`Ctrl+K` hoje só foca a busca) | Navegar entre abas, abrir casos, trocar modo | M |
| 15 | **Onboarding opcional de 3 passos** | Para primeira visita; descartável e sem rastreio | S |
| 16 | **Shell offline (PWA)** | Funciona com a API local; baixo risco | M |
| 17 | **Histórico de alvos com autocomplete** | Só opt-in, só local, desligado no modo público; depende do item 12 | M |

## 5. Como saber se funcionou (sem telemetria)

Tudo é medido em CI ou localmente. Não coletamos dados de uso.

- **Primeiro scan:** número de interações até iniciar (hoje: exemplo + `Enter` = 2) — medido no E2E.
- **Peso:** JS inicial em KB (build) e LCP (Lighthouse CI).
- **Acessibilidade:** violações axe A/AA = 0 e pontuação Lighthouse ≥ 95.
- **Correção de entrada:** testes unitários de `analyzeTarget` crescem a cada caso real reportado em issue.
- **i18n:** paridade de chaves (já validada) + lint de texto literal (item 8).

## 6. Decisões em aberto

1. **Foco automático do campo** (desktop). Acelera, mas pode atrapalhar leitores de tela que esperam começar pelo título. Mitigação atual: só com `pointer: fine`. Reavaliar com um teste real de leitor de tela.
2. **Casos recentes na Home** mostram alvos anteriores. É dado local e útil, mas sensível em máquina compartilhada. O item 12 resolve; até lá, o botão "Open cases" já permite apagar casos.
3. **Exemplos sugeridos** (`forgejo`, `nodejs`, `rust-lang`) são organizações públicas. Se algum deles passar a bloquear consultas automatizadas, trocar a lista; ela é uma constante em `HomeView.tsx`.

## 7. Ordem sugerida

`1 → 4 → 2 → 3` (a rede de proteção do E2E antes da refatoração do bundle), depois `5` (destrava demos e CI), `7`, `6`, `8`, e então os itens de qualidade visual (`10`, `11`) antes de qualquer mexida em tema (`13`).
