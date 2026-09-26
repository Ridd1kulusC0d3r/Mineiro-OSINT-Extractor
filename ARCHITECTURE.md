# Architecture

## Objective
Mineiro separates discovery, evidence evaluation and analyst interpretation.

```text
Target -> Catalog -> Probe Scheduler -> HTTP Response -> Evidence Engine
                                             |              |
                                             |              +-> confidence
                                             +-> category profile / export
```

## Catalog model
v1.2 retains **985 historical endpoints**. Every runtime platform receives:

- `category`
- `siteType`
- `detectorReliability`
- `reliabilityTier`
- `provenanceStatus`
- `licenseStatus`
- `optionalEvidenceChecks`

Historical entries remain available for coverage while provenance is progressively audited.

## Evidence Engine
A single HTTP response can yield up to eight logical checks:

| Check | Purpose | Extra request |
|---|---|---:|
| Expected status | presence behavior | 0 |
| Absence status | explicit negative evidence | 0 |
| Redirect consistency | detect generic redirects | 0 |
| Username in final URL | routing continuity | 0 |
| Username in body | response token | 0 |
| Canonical match | canonical consistency | 0 |
| Soft-404 | detect generic error pages | 0 |
| Edge protection | classify WAF/rate limiting | 0 |

With 985 endpoints:

```text
985 x 8 = 7,880 optional evidence checks
```

This does not mean 7,880 extra network requests.

## Two different scores

### Detector reliability
A maintained estimate of how dependable the site's detection rule is.

### Result confidence
Evidence observed during the current scan.

Example:

```text
detector reliability = 91
result confidence     = 84
evidence              = probable
```

## Digital footprint classification
Found endpoints contribute to observable service clusters. The dashboard aggregates approximately:

```text
result confidence x detector reliability
```

This classifies the **observed digital footprint**, not personality, profession, ideology or identity.

## Growth model
New catalog packs should declare source, license, attribution, verification date and maintainer. Large untracked copy/paste imports should not be merged.


## v1.3 Registry Layer

```text
catalog packs
    |
    v
Mineiro Registry
    |
    +--> taxonomy
    +--> detector reliability
    +--> provenance
    +--> license status
    +--> evidence capabilities
    |
    +--> Registry API
    |
    +--> Detector Bench
            |
            +--> TP / TN / FP / FN
            +--> precision
            +--> recall
            +--> false-positive rate
            +--> availability
            +--> benchmark score
```

### API

- `GET /api/registry/stats`
- `GET /api/registry/detectors`
- `POST /api/registry/benchmark`

O benchmark recebe observações rotuladas e calcula métricas localmente. Não precisa armazenar usernames reais.

### Colab

A mesma aplicação Node/React roda em Google Colab. O notebook oficial instala dependências, valida o Registry, inicia o servidor e usa o proxy do Colab para abrir a interface.


## v1.4 Intelligence Workbench

```text
Target
  |
  v
Progressive Collection
  |
  v
Normalized ScanResult
  |
  +--> Evidence Engine
  |       |
  |       +--> detector confidence
  |       +--> observation confidence
  |
  v
Intelligence Assessment
  |
  +--> correlation support
  +--> key judgments
  +--> hypotheses
  +--> contradictions
  +--> gaps
  +--> pivots
  +--> collection plan
  |
  +--> Local Report Export
  |
  +--> Optional AI Analyst Copilot
          |
          +--> AI_SYNTHESIZED
          +--> never raises factual confidence
```

### Progressive scan

A full scan usa uma fase rápida de discovery com concorrência limitada maior. Apenas candidatos encontrados, incertos ou rate-limited seguem para validação aprofundada com Evidence Engine.

A fase progressiva não usa retry para contornar proteção. Endpoints protegidos permanecem inconclusivos.

### Presentation architecture

```text
IntelligenceReportView
├── executive assessment
├── collection health
├── evidence matrix
├── hypotheses / contradictions
├── pivots
├── gaps
├── AI analyst
└── methodology

IntelligenceExportModal
├── section selector
├── HTML
├── JSON
├── Markdown
└── CSV
```

Documentação detalhada:
- `docs/ENGINEERING-V1.4.md`
- `docs/INTELLIGENCE-METHODOLOGY.md`
- `docs/REPORTING-UX-V1.4.md`


## v1.4.1 Complete Intelligence Layer

```text
INTELLIGENCE REQUIREMENT
          |
          v
COLLECTION
          |
          v
NORMALIZED EVIDENCE
          |
          +--> Detector Confidence
          +--> Observation Confidence
          +--> Source Quality
          +--> Provenance
          |
          v
CORRELATION
          |
          +--> Correlation Graph
          +--> SAME_DOMAIN / SAME_HANDLE
          +--> Cross-cluster overlap
          |
          v
HYPOTHESES
          |
          +--> Primary
          +--> Cluster hypothesis
          +--> Alternative hypothesis
          |
          v
CONTRADICTIONS
          |
          v
ASSESSMENT
          |
          +--> KIJ
          +--> Analytic Ledger
          +--> Known / Assessed / Unknown
          |
          v
PIVOTS + COLLECTION PLAN
          |
          v
REPORT + SHA-256 EXPORT MANIFEST
```

### Requirement-aware analysis

O `IntelligenceRequirement` altera o peso de relevância do finding sem alterar o fato observado. O mesmo hit pode ter maior valor para `developer_footprint` e menor valor para `brand_impersonation`.

### Graph model

Node types:

```text
TARGET
USERNAME
EMAIL
PROFILE
PLATFORM
DOMAIN
PUBLIC_URL
DISPLAY_NAME
ORGANIZATION
PUBLIC_PROJECT
AVATAR_HASH
```

Edge types:

```text
USES
LINKS_TO
MENTIONS
HOSTED_ON
SAME_HANDLE
SAME_DOMAIN
REFERENCES
OBSERVED_ON
```

Toda aresta mantém `confidence`, `provenance`, `evidenceId` e, quando disponível, `sourceUrl` e `observedAt`.

### Provenance graph

```text
PRIMARY ──────> EVIDENCE ──────> DERIVED ASSESSMENT
EXTERNAL ─────> EVIDENCE ──────> DERIVED ASSESSMENT
AI_SYNTHESIZED ----------------> HYPOTHESIS ONLY
```

AI synthesis nunca altera automaticamente confidence factual.

### Integrity

O export calcula SHA-256 real sobre o payload antes da inserção do manifest. Cada formato gera um arquivo `.manifest.json` companheiro.

O hash é uma verificação de integridade do conteúdo, não assinatura de autoria nem cadeia de custódia legal.
