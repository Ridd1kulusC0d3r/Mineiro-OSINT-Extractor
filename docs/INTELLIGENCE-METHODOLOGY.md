# Metodologia Analítica — Mineiro v1.4

## Objetivo

O Mineiro não deve responder apenas "onde apareceu".

Ele deve ajudar o analista a separar:
- o que foi observado;
- o que é provável;
- o que contradiz a hipótese;
- o que ainda falta;
- qual próximo passo tem maior valor.

## Pipeline

```text
Collection
    ↓
Evidence
    ↓
Correlation
    ↓
Hypotheses
    ↓
Contradictions
    ↓
Assessment
    ↓
Pivots
    ↓
Collection Plan
```

## Key Intelligence Judgments

Cada julgamento possui:
- texto;
- confidence band;
- basis.

Confidence bands:
- HIGH;
- MODERATE;
- LOW.

## Evidence Matrix

Cada finding separa:
- detector confidence;
- observation confidence;
- correlation confidence;
- analytical value.

## Hypothesis discipline

Toda hipótese deve aceitar:
- supporting evidence;
- contradictory evidence;
- caveat;
- alternative hypothesis.

## Intelligence Gaps

Gaps são perguntas não respondidas que podem alterar uma avaliação.

Um gap tem:
- pergunta;
- severidade;
- motivo.

## Pivot prioritization

Pivôs devem priorizar:
1. corroboration independente;
2. evidência de alta qualidade;
3. resolução de contradições;
4. fechamento de gaps;
5. somente depois expansão de coleta.

## Stop condition

O relatório deve dizer quando parar.

A coleta deve parar quando novos achados não alteram materialmente:
- julgamentos;
- hipóteses;
- gaps;
- confiança.

## IA

A IA pode:
- resumir;
- ordenar evidências;
- propor hipóteses alternativas;
- destacar contradições;
- sugerir pivôs;
- reformular perguntas analíticas.

A IA não pode:
- transformar inferência em fato;
- elevar automaticamente confidence;
- concluir identidade por username;
- inferir atributos sensíveis;
- classificar criminalidade sem evidência explícita e apropriada.

## Proveniência

Tipos conceituais:
- PRIMARY: observado diretamente;
- DERIVED: calculado deterministicamente;
- EXTERNAL: importado de outra fonte;
- AI_SYNTHESIZED: produzido pelo copiloto.

Toda saída de IA deve continuar distinguível das camadas observadas e derivadas.
