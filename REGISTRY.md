# Mineiro Registry — v1.3

O **Mineiro Registry** é a camada de inventário de detectores do projeto.

A partir da v1.3, o catálogo deixa de ser apenas uma lista de URLs e passa a ser tratado como um registro versionado de detectores com qualidade e proveniência mensuráveis.

## O que é um detector

Um detector representa a capacidade do Mineiro de testar um identificador público em um serviço.

```text
detector
├── id
├── platform
├── category
├── siteType
├── urlPattern
├── checkMethod
├── reliability
├── provenance
├── license status
└── evidence checks
```

## Dois scores diferentes

### Detector Reliability

Score heurístico de 0 a 100.

Ele mede a qualidade estrutural da regra:

- presença com HTTP previsível;
- ausência explícita;
- URL de perfil estável;
- soft-404;
- endpoints de busca;
- anti-bot frequente.

Não é uma probabilidade de identidade e não mede a reputação do site.

### Detector Benchmark Score

Score empírico calculado pelo **Detector Bench** com observações rotuladas.

O benchmark considera:

- true positive;
- true negative;
- false positive;
- false negative;
- inconclusivos;
- precision;
- recall;
- false-positive rate;
- availability.

A v1.3 adiciona o motor de cálculo. A coleta contínua de observações entra progressivamente à medida que cada detector é auditado.

## Proveniência

Cada detector possui um status:

| Status | Significado |
|---|---|
| `verified` | origem e comportamento auditados |
| `external-attributed` | origem externa documentada e atribuída |
| `legacy-audit-required` | detector histórico ainda pendente de auditoria |

A base de 985 detectores foi preservada. Ela não é silenciosamente promovida a "verificada".

## Crescimento para 6.000+

O Registry foi desenhado para packs independentes.

```text
registry
├── core
├── brazil
├── latam
├── developer
├── security
├── social
├── community
├── gaming
├── creative
├── publishing
├── academic
├── marketplaces
└── experimental
```

Metas recomendadas:

| Fase | Detectores |
|---|---:|
| Core atual | ~985 |
| Regional + niche packs | 2.000 |
| Community verified packs | 3.500 |
| Extended | 5.000 |
| Experimental / long-tail | 6.000+ |

O objetivo não é simplesmente alcançar 6.000 linhas. Cada entrada deve continuar identificável, classificável e auditável.

## Adicionando detector

Antes de contribuir:

1. confirme que o perfil é publicamente acessível;
2. determine o padrão de URL;
3. observe comportamento de presença e ausência;
4. atribua categoria e `siteType`;
5. registre proveniência;
6. documente licença quando houver material externo;
7. execute:

```bash
npm run registry:validate
npm run registry:stats
npm run lint
npm run build
```

## Detector Bench

O motor está em:

```text
src/registry/bench.ts
```

Entrada esperada:

```ts
{
  detectorId: "github",
  expected: "present",
  observed: "found",
  timestamp: "2026-09-26T20:00:00Z"
}
```

O benchmark não precisa armazenar usernames reais. O objetivo é medir o detector, não criar uma coleção de alvos.

## Perfil por categoria

O Mineiro pode agrupar resultados por `category` e `siteType`.

Isso descreve apenas a **pegada digital observada**. Não deve ser apresentado como diagnóstico de personalidade, crenças, ideologia, saúde ou identidade.
