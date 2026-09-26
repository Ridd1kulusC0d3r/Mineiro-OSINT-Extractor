# Mineiro Username Extractor

![Mineiro Username Extractor](assets/mineiro-logo.png)

**Mineiro Username Extractor** é um OSINT Intelligence Workbench para coleta pública de usernames, avaliação de evidências, correlação cautelosa e produção de relatórios analíticos.

A v1.4.1 completa a separação **collection → evidence → correlation → hypotheses → contradictions → assessment → pivots → collection plan**, adiciona Intelligence Requirements, Source Quality, IPS, Analytic Ledger, grafo de correlação, provenance graph, timeline semântica e manifestos SHA-256 por export.

## Comece em 1 minuto

### Intelligence Workbench v1.4.1

A tela principal é um relatório analítico de 22 capítulos:

```text
01 Intelligence Requirement
02 Executive Assessment
03 Key Intelligence Judgments
04 Collection Coverage
05 High-Confidence Findings
06 Evidence Matrix
07 Digital Footprint Clusters
08 Correlation Graph
09 Identity Hypotheses
10 Supporting Evidence + Analytic Ledger
11 Contradictory Evidence
12 Uncertain / Unresolved Findings
13 Intelligence Gaps
14 Intelligence Timeline
15 High-Value Pivots
16 Next Collection Plan
17 Source & Detector Reliability
18 Methodology
19 Provenance
20 Technical Appendix
21 Integrity Snapshot
22 Export Manifest
```

O usuário escolhe o **Intelligence Requirement** antes da interpretação: username presence, account correlation, digital footprint, developer footprint, threat-research alias mapping ou brand-impersonation monitoring. A relevância dos findings e o IPS são recalculados para a pergunta selecionada.

### Progressive Full Scan

No full scan, a v1.4 usa duas fases:

```text
fast discovery across the registry
              ↓
FOUND / UNCERTAIN / RATE_LIMITED
              ↓
deeper validation + Evidence Engine
```

Isso reduz o gargalo do Colab sem aumentar agressivamente a coleta.

### Relatório local enriquecido

O usuário escolhe as seções antes de exportar:

- HTML autocontido;
- JSON analítico;
- Markdown;
- Evidence CSV;
- manifest JSON companheiro com SHA-256 do payload;
- lista exata de seções incluídas/excluídas;
- requisito de inteligência e formato.

O hash verifica integridade do artefato. Não prova autoria, identidade ou cadeia de custódia legal.

### AI Analyst Copilot

A IA é opcional e trabalha sobre a avaliação já estruturada. Ela pode priorizar evidências, gaps, contradições e pivôs, mas a saída permanece `AI_SYNTHESIZED` e **não aumenta a confiança factual automaticamente**.

## Google Colab

A forma mais curta de testar o Mineiro sem instalar nada localmente é abrir o notebook pronto:

**[Mineiro One-Click Colab](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_One_Click_Colab.ipynb)**

O notebook possui identidade visual do projeto e executa:

```text
clone/update
    ↓
npm install
    ↓
Registry validation
    ↓
server
    ↓
Colab proxy
    ↓
Mineiro UI
```

### Computador local

Leia primeiro [COMECE-AQUI.md](COMECE-AQUI.md). Depois abra [MANUAL.html](MANUAL.html) no navegador para o manual completo offline.

Lançadores incluídos:

- Windows: `Iniciar-Mineiro.bat`
- macOS: `Iniciar-Mineiro.command`
- Linux: `iniciar-mineiro.sh`

### Demo segura

```bash
npm install
npm run demo
```

A demo usa somente dados sintéticos e valida o Detector Bench sem consultar pessoas reais.

## Números da v1.4.1

- **985 detectores catalogados**
- **17 packs modulares**
- **8 categorias principais**
- **8 evidence checks opcionais por detector**
- **até 7.880 checks lógicos** em uma varredura completa
- Mineiro Registry com inventário, taxonomia e proveniência
- Detector Bench com precision, recall, false-positive rate e availability
- score de confiabilidade heurístico por detector
- classificação por tipo de serviço
- perfil de presença digital ponderado pela confiabilidade
- execução suportada no Google Colab

> 7.880 checks lógicos não significam 7.880 requisições extras. Vários sinais são extraídos de uma única resposta HTTP.

## Google Colab

A v1.4.1 inclui notebook oficial:

`notebooks/Mineiro_Username_Extractor_Colab.ipynb`

Ele clona o projeto, instala dependências, valida o Registry, inicia o servidor e tenta abrir a interface pelo proxy do Colab.

Consulte [COLAB.md](COLAB.md).

## Mineiro Registry

O catálogo é exposto como um registro de detectores versionados com:

```text
detector
├── id
├── category
├── siteType
├── URL pattern
├── detection method
├── detector reliability
├── provenance status
├── license status
└── evidence checks
```

Consulte [REGISTRY.md](REGISTRY.md).

## Detector Bench

A v1.3 adiciona um motor separado para medir detectores com observações rotuladas:

```text
TP / TN / FP / FN
        ↓
precision
recall
false-positive rate
availability
        ↓
benchmark score
```

Isso evita confundir o score heurístico do detector com desempenho empiricamente medido.

## Compatibilidade

### Local / Linux / macOS / Windows

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install
npm run dev
```

### Colab

Use o notebook em `notebooks/` ou siga [COLAB.md](COLAB.md).

### Colab v1.4.1

A configuração do Vite permite explicitamente o domínio interno do proxy do Google Colab sem usar `allowedHosts: true`. Detectores sem URL pública de username, como Discord, permanecem no Registry como `registry-only` e não entram em scans diretos.

## Pipeline

```text
username
   |
   v
985 catalogued endpoints
   |
   v
bounded HTTP probes
   |
   +--> status
   +--> redirect
   +--> final URL
   +--> body token
   +--> canonical
   +--> soft-404
   +--> edge protection
   |
   v
evidence scoring
   |
   +--> FOUND
   +--> NOT FOUND
   +--> UNCERTAIN
   +--> RATE LIMITED
   |
   v
category profile + export
```

## Detector Reliability Score

O score mostrado para cada site mede **a confiabilidade da regra de detecção**, não a reputação do site.

Exemplos:

- endpoint com `200` para presença e `404` para ausência: tende a ser mais confiável;
- página de busca genérica que sempre responde `200`: tende a ter score menor;
- serviços com anti-bot agressivo: recebem penalização;
- sinais adicionais do Evidence Engine alteram a confiança do resultado observado.

### Tiers

| Tier | Interpretação |
|---|---|
| High | detector estruturalmente forte |
| Medium | detector utilizável, requer validação |
| Experimental | endpoint sujeito a falso positivo/negativo |

## Digital Footprint Profile

Os resultados são agrupados por tipo de serviço, por exemplo:

```text
developer
security
social
community
gaming
creative
media
crypto
```

Cada presença é ponderada por:

```text
result confidence × detector reliability
```

O dashboard então mostra os clusters predominantes do username.

Isso descreve **pegada digital observável**. Não é inferência psicológica, política ou de identidade.

## Evidence Engine

No modo opcional, uma resposta pode gerar até oito checks:

1. status HTTP esperado;
2. status explícito de ausência;
3. consistência de redirect;
4. continuidade do username na URL final;
5. username presente no corpo;
6. canonical compatível;
7. detecção de soft-404;
8. edge protection / rate limit.

Esse modo é habilitado no scan modular e vem ativo no preset Deep.

## Presets

### Quick
Top 20, sem Evidence Engine.

### Standard
Top 50, Evidence Engine ligado.

### Full / Deep
Catálogo completo com **progressive scan**: discovery rápido em todo o Registry e validação aprofundada apenas de FOUND / UNCERTAIN / RATE_LIMITED. A fase progressiva não tenta contornar WAF ou CAPTCHA.

A varredura completa é opcional. Serviços externos têm seus próprios limites e termos.

## Instalação

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Validação antes de release

```bash
npm run lint
npm run build
npm run dev
```

## Documentação

- [Comece aqui](COMECE-AQUI.md)
- [Manual completo offline](MANUAL.html)
- [Relatório de testes](RELATORIO-DE-TESTES.md)
- [Guia de uso](USER_GUIDE.md)
- [Google Colab](COLAB.md)
- [Mineiro Registry](REGISTRY.md)
- [Arquitetura](ARCHITECTURE.md)
- [Engenharia v1.4](docs/ENGINEERING-V1.4.md)
- [Metodologia analítica](docs/INTELLIGENCE-METHODOLOGY.md)
- [Reporting UX v1.4](docs/REPORTING-UX-V1.4.md)
- [Licenças e proveniência](LICENSES_AND_PROVENANCE.md)
- [Política de proveniência](PROVENANCE.md)
- [Security Policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Proveniência do catálogo

A base histórica ampla foi preservada em vez de descartada. Como nem toda entrada possui trilha de origem individual comprovada, a v1.3 marca o catálogo legado como `legacy-audit-required`.

Consulte [LICENSES_AND_PROVENANCE.md](LICENSES_AND_PROVENANCE.md).

## Uso responsável

Use somente para informações publicamente acessíveis, pesquisa legítima, threat intelligence, resposta a incidentes, validação de exposição e atividades autorizadas.

Um resultado `FOUND` não prova que contas em serviços diferentes pertencem à mesma pessoa.

## Licença

O código original do Mineiro é distribuído sob MIT. Materiais de terceiros, quando presentes, permanecem sujeitos às licenças de origem.
