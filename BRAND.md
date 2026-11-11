# Brand

## Nome oficial

**Mineiro Username Intelligence**

## Subtítulo oficial

**OSINT Investigation Workbench**

## Forma curta

Use **Mineiro** quando o contexto já tiver apresentado o nome completo.

## Não usar

Evite como nome do produto:

- Mineiro Intel
- Mineiro User Intelligence
- Mineiro Username Extractor
- Username Extractor
- Mineiro OSINT Extractor

Esses nomes podem aparecer apenas em histórico, changelog, compatibilidade ou referências ao slug antigo do repositório.

## Módulos

- Mineiro Registry
- Mineiro Evidence Engine
- Mineiro Correlation Engine
- Mineiro Intelligence Report
- Mineiro Analyst Copilot

## Assinatura recomendada

```text
Mineiro Username Intelligence
OSINT Investigation Workbench
```

## Repositório

O slug atual do GitHub permanece `Mineiro-OSINT-Extractor` por compatibilidade com links, badges, histórico e Colab. O nome do produto não depende do slug.

## Linguagem

O produto deve parecer uma ferramenta de investigação, não uma campanha de marketing.

Preferir:

- evidence
- observation
- correlation
- assessment
- provenance
- uncertainty
- collection

Evitar:

- revolutionary
- ultimate
- all-in-one
- unbeatable
- next-gen
- magical
- AI-powered em títulos sem necessidade

A interface deve explicar o que faz sem tentar impressionar o usuário com adjetivos.

## Identidade visual

Referência: LLmInjection `site/style.css` (commit `c67d262`). Plano: [`docs/REFACTOR_PLAN.md`](docs/REFACTOR_PLAN.md), seção 3.

### Fonte única

- Cor: `src/styles/tokens.css`, um bloco por tema (`dark`, `light`, `high-contrast`) e um bloco `@media print` com a versão clara.
- Vocabulário de componentes: `src/styles/base.css`.
- JS, D3, SVG e canvas: `src/theme/palette.ts` (`PALETTE.x` = `var(--x)`).
- Documentos fora do app (exportação HTML): `src/theme/tokens.ts`, conferido contra `tokens.css`.
- `npm run tokens:validate` falha com hex literal em `src/` fora de `src/styles` e `src/theme`, com classe da escala
  antiga (`neutral-*`, `white`, `black`) e com par texto/fundo abaixo de AA (4,5:1). Não há exceções.

### Tokens

| Token | Escuro | Claro | Uso |
| --- | --- | --- | --- |
| `paper` | `#100f0d` | `#f6f5f1` | fundo da página |
| `paper-2` | `#1a1916` | `#ecebe4` | faixas, hover |
| `card` | `#1c1b17` | `#ffffff` | cartões, modais, tabelas |
| `ink` | `#eeebe2` | `#15140f` | texto principal |
| `ink-2` | `#bdb8aa` | `#45423a` | texto secundário |
| `ink-3` | `#958f81` | `#625e55` | rótulos, metadados |
| `rule` | `#36332b` | `#d6d2c6` | bordas |
| `rule-2` | `#26241f` | `#e6e3da` | divisórias internas, preenchimento |
| `signal` | `#f0885a` | `#b43c0e` | ação primária, ativo, presença confirmada |
| `signal-ink` | `#131210` | `#ffffff` | texto sobre signal |
| `signal-soft` | `#3a2418` | `#f7e6dc` | fundo de eyebrow, halo |
| `seq-0..4` | `#3a2a21` → `#f6b48f` | `#f5ddcf` → `#7c2406` | escalas: heatmap, matriz de risco, mapa |

O texto sobre as células das escalas usa `--on-seq-low`, `--on-seq-mid` e `--on-seq-high`, também conferidos em AA.
O tema `high-contrast` é preto e branco puros; só `rule-2` e as escalas `seq` têm cinza.
Na impressão vale sempre a versão clara, com papel branco.

### Regra de cor

Um único matiz. `signal` marca só ação primária, seleção e presença confirmada. Status nunca depende só de cor:

| Status | Rótulo | Ícone | Borda |
| --- | --- | --- | --- |
| Encontrado | `Found` | ✓ | sólida, preenchida em signal |
| Incerto, limitado, erro | `Uncertain`, `Rate limited`, `Error` | alerta, relógio, x | tracejada |
| Ausente | `Absent` | – | pontilhada |
| Na fila, varrendo | `Queued`, `Scanning` | círculo tracejado, giro | sólida discreta |

Verde, vermelho e âmbar não entram.

### Tipografia

Pilha do sistema, sem fonte remota. `--sans` = Inter (se instalada), system-ui. `--mono` = ui-monospace, SF Mono,
JetBrains Mono, Menlo. Corpo em sans 15px. Mono só em rótulos (maiúsculo espaçado), dados, números, console e tabelas.

### Vocabulário (`src/styles/base.css`)

- `eyebrow`: pílula mono maiúscula em `signal` sobre `signal-soft`; abre cada seção.
- `tabs` / `tab`: abas em pílula, a ativa em `signal`. `tabs-seg`: seletor segmentado (modo, preset, idioma, filtro),
  com a escolha ativa em `ink`, para que `signal` continue marcando só a vista ativa e a ação primária.
- `card` (raio 14px, sombra suave), `card-accent` (filete signal à esquerda), `card-title`, `stat-num`.
- `tbl-wrap` / `tbl`: tabela em cartão, cabeçalho mono maiúsculo, números em `.num`.
- `btn-primary` (signal), `btn` (secundário), `chip`, `field`, `status-*`, `dialog`.
- `mast`: faixa com grade de 32px e halo radial em `signal-soft` (barra de alvo, exportação HTML, social preview).

### Fora do app

- Favicon: `public/favicon.svg`, quadrado `ink` com barra `signal`.
- `assets/social-preview.png` e capturas do README: `assets/src/social.html` e `assets/src/common.css` (mesmos tokens),
  renderizados com `node scripts/render-assets.mjs` a partir de `node scripts/capture-app-assets.mjs --offline`
  (veredictos sintéticos para o handle fictício `mineiro-demo`, sem rede).
- `MANUAL.html`, exportação HTML (`src/intelligence/reportExport.ts`) e dossiê de impressão (`DossierPrintView`)
  usam os mesmos tokens, com a versão clara na impressão.
- O logo `assets/mineiro-logo.png` não muda.

### Privacidade visual

Ícones de site vêm de um monograma local. Os favicons do Google e do DuckDuckGo só aparecem se o usuário ligar
"Ícones dos sites" (chave `mineiro_remote_favicons` em `localStorage`, desligada por padrão). Abrir o app não contata
terceiros; `npm run visual` falha se qualquer host externo for contatado.
