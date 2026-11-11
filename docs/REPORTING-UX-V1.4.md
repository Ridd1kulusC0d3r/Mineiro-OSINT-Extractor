# Reporting UX — Mineiro v1.4

> [!NOTE]
> **Documento histórico (v1.4).** Descreve o desenho da época; pode divergir da versão atual. Para o estado vigente, veja [ARCHITECTURE.md](../ARCHITECTURE.md), [INTELLIGENCE-METHODOLOGY.md](INTELLIGENCE-METHODOLOGY.md) e [USER-GUIDE.md](USER-GUIDE.md).

## Direção visual

A v1.4 abandona o dashboard excessivamente fragmentado como tela principal.

Princípios:
- hierarquia editorial;
- mais espaço em branco/negativo;
- menos cards simultâneos;
- números grandes somente para KPIs importantes;
- gráficos somente quando respondem uma pergunta;
- texto analítico antes do detalhe técnico;
- navegação por capítulos.

## Estrutura

```text
Report Header
├── target
├── assessment confidence
├── generated locally
└── export

KPI Row
├── high-value findings
├── coverage
├── unresolved
└── gaps

01 Assessment
02 Evidence
03 Hypotheses
04 Action / Pivots
05 Gaps
06 AI Assist
07 Method
```

## Export configurável

Antes do download, o usuário seleciona seções:

- Executive assessment
- Key judgments
- Collection coverage
- High-confidence findings
- Evidence matrix
- Footprint clusters
- Hypotheses
- Contradictions
- Intelligence gaps
- High-value pivots
- Next collection plan
- Methodology
- Provenance
- Raw results

## Formatos

### HTML
Autocontido e legível localmente. Melhor formato para leitura e impressão.

### JSON
Para integrações e automação.

### Markdown
Para case notes e documentação.

### CSV
Matriz de evidência tabular.

## UX anti-overload

O novo relatório:
- esconde filtros de auditoria enquanto o usuário está na Intelligence View;
- mantém audit table como drill-down;
- mantém console como diagnóstico;
- desloca IA para um bloco opcional;
- evita exibir todos os gráficos ao mesmo tempo.

## Acessibilidade

- contraste alto;
- tipografia responsiva;
- tabelas com fallback mobile;
- botões com texto;
- navegação por anchors;
- exports independentes de tema.
