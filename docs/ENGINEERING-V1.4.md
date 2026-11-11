# Mineiro v1.4 — Engenharia de Software, Dados e Arquitetura

> [!NOTE]
> **Documento histórico (v1.4).** Descreve o desenho da época; pode divergir da versão atual. Para o estado vigente, veja [ARCHITECTURE.md](../ARCHITECTURE.md), [INTELLIGENCE-METHODOLOGY.md](INTELLIGENCE-METHODOLOGY.md) e [USER-GUIDE.md](USER-GUIDE.md).

## 1. Visão

A v1.4 separa explicitamente cinco responsabilidades:

```text
COLLECTION
   ↓
EVIDENCE
   ↓
CORRELATION
   ↓
ASSESSMENT
   ↓
PRESENTATION / EXPORT
```

A motivação é evitar que uma resposta HTTP seja promovida diretamente a conclusão analítica.

## 2. Arquitetura de software

```text
┌─────────────────────────────────────────────────────────────┐
│ React UI                                                    │
│                                                             │
│ TargetBar  StatsBar  IntelligenceReport  Evidence Table     │
│              │                     │                        │
└──────────────┼─────────────────────┼────────────────────────┘
               │                     │
               ▼                     ▼
┌────────────────────────┐  ┌───────────────────────────────┐
│ Scan Orchestration     │  │ Intelligence Layer            │
│ App.tsx                │  │ assessment.ts                 │
│ progressive scheduler  │  │ reportExport.ts               │
└────────────┬───────────┘  └──────────────┬────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Express API                                                 │
│ /api/osint/verify                                           │
│ /api/registry/*                                             │
│ /api/intelligence/copilot                                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│ Public external endpoints                                   │
│ bounded HTTP collection                                     │
└─────────────────────────────────────────────────────────────┘
```

## 3. Módulos principais

### Catalog / Registry
Responsável por declarar detectores, taxonomia, proveniência e confiabilidade estrutural.

### Scan Orchestrator
Coordena execução, concorrência, timeout, cancelamento e atualização progressiva da interface.

### Progressive Full Scan
O full scan da v1.4 possui dois estágios:

```text
PHASE 1 — DISCOVERY
all scannable detectors
fast timeout
higher bounded concurrency
no evidence-body parsing
no anti-bot retry
        │
        ▼
candidate set
FOUND + UNCERTAIN + RATE_LIMITED
        │
        ▼
PHASE 2 — VALIDATION
lower concurrency
Evidence Engine enabled
deeper response analysis
```

O objetivo é reduzir o tempo total no Colab sem aumentar agressivamente tráfego ou tentar contornar proteção de serviços.

### Evidence Engine
Transforma a resposta observada em sinais estruturados.

### Intelligence Assessment
Camada determinística que produz:
- collection coverage;
- evidence matrix;
- footprint clusters;
- key judgments;
- hypotheses;
- contradictions;
- intelligence gaps;
- pivots;
- collection plan;
- stop condition.

### AI Analyst Copilot
Camada opcional. Recebe somente a avaliação já estruturada.

Regras:
- não coleta novos dados;
- não aumenta confiança factual;
- não infere atributos sensíveis;
- não transforma username compartilhado em identidade confirmada;
- saída sempre marcada `AI_SYNTHESIZED`.

## 4. Modelo de dados

### ScanResult

```text
ScanResult
├── platform identity
├── category / siteType
├── status
├── HTTP metadata
├── detectorReliability
├── confidenceScore
├── evidenceSignals[]
├── evidenceChecksPassed
├── evidenceChecksTotal
├── metadata
└── checkedAt
```

### EvidenceAssessment

```text
EvidenceAssessment
├── evidence id
├── platform
├── status
├── detectorConfidence
├── observationConfidence
├── correlationConfidence
├── analyticalValue
├── evidenceSignals[]
└── whyItMatters
```

### IntelligenceAssessment

```text
IntelligenceAssessment
├── collection
├── judgments[]
├── evidence[]
├── clusters[]
├── hypotheses[]
├── supportingEvidence[]
├── contradictoryEvidence[]
├── gaps[]
├── pivots[]
├── collectionPlan[]
├── stopCondition
└── sourceQualityNotes[]
```

## 5. Três scores, três perguntas

### Detector Confidence
A regra daquele serviço é estruturalmente confiável?

### Observation Confidence
Esta execução específica foi conclusiva?

### Correlation Confidence
Quanto aquele finding contribui para uma hipótese de correlação?

Nenhum desses scores, isoladamente, prova identidade.

## 6. Engenharia de dados

### Raw layer
Resultados individuais de probes.

### Normalized layer
`ScanResult` padronizado.

### Evidence layer
Sinais e scores derivados.

### Analytical layer
Hipóteses, gaps, contradições e pivôs.

### Presentation layer
UI e exports.

```text
RAW → NORMALIZED → EVIDENCE → ANALYTICAL → REPORT
```

Cada transição deve ser reproduzível sem depender de IA.

## 7. Performance no Colab

Os principais gargalos da v1.3 eram:
- 985 chamadas tratadas com concorrência baixa;
- deep inspection aplicada indiscriminadamente;
- parsing de evidência em resultados que já eram explicitamente ausentes;
- longa espera por endpoints protegidos.

A v1.4 reduz esse custo com progressive scan.

### Princípios
- descoberta rápida primeiro;
- análise profunda apenas em candidatos;
- limite de concorrência;
- nenhuma tentativa de bypass de proteção na fase progressiva;
- retry futuro deve ser seletivo, nunca repetir os 985 detectores por padrão.

## 8. Export

A v1.4 gera localmente:
- enriched HTML;
- analytical JSON;
- Markdown;
- Evidence CSV.

O usuário escolhe quais seções entram no relatório.

## 9. Testabilidade

```bash
npm run registry:validate
npm run registry:stats
npm run demo
npm run intelligence:test
npm run manual:validate
npm run lint
npm run build
```

A camada de intelligence possui teste sintético e determinístico.

## 10. Direção pós-v1.4

- cache de detector por TTL;
- resumable scans;
- fila persistente local;
- empirical Detector Bench alimentando Reliability;
- graph data model opcional;
- provenance ledger;
- export assinado com manifest;
- plugin SDK para packs externos.
