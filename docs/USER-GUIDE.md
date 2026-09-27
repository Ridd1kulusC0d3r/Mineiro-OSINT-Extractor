# Mineiro Username Intelligence · Guia de uso

**OSINT Investigation Workbench**

Este guia cobre o fluxo normal de uma investigação no Mineiro.

## Idioma da interface

O seletor no cabeçalho oferece:

- **PT** — Português;
- **EN** — English;
- **ES** — Español.

A escolha é aplicada imediatamente à interface e fica salva no navegador.

Também seguem o idioma selecionado:

- Intelligence Report;
- julgamentos, hipóteses, contradições e gaps;
- Username Linkage;
- Relationship Graph;
- AI Analyst Copilot;
- configuração Gemini;
- construtor de exportação;
- HTML e Markdown exportados;
- narrativas do JSON analítico.

Os nomes estruturais de campos em JSON/CSV permanecem estáveis para não quebrar integrações.

## 1. Defina a pergunta

Antes de coletar, escolha o **Intelligence Requirement**.

| Requisito | Use quando quer responder |
|---|---|
| Username presence | onde o identificador aparece? |
| Public account correlation | quais findings têm suporte para relação entre si? |
| Digital footprint mapping | em quais tipos de serviço há presença pública? |
| Developer footprint | há presença técnica/dev relevante? |
| Threat research alias mapping | onde um alias público aparece em superfícies relevantes para pesquisa de ameaça? |
| Brand impersonation monitoring | há uso público do identificador em superfícies de marca/social? |

O requisito muda prioridade analítica. Não muda o fato observado.

## 2. Escolha o preset

### Quick
Use para:
- confirmar que o ambiente funciona;
- desenvolvimento;
- triagem inicial.

### Standard
Use para:
- investigação normal;
- cobertura intermediária;
- Evidence Engine ativo.

### Full
Use quando cobertura ampla realmente importa.

O Full Scan é progressivo:

```text
discovery rápido
      ↓
candidatos
      ↓
validação aprofundada
```

Não repita Full Scan sem necessidade. Mais tráfego não significa mais inteligência.

## 3. Leia a Intelligence View nesta ordem

### Executive Assessment
Veja:
- Assessment Confidence;
- Coverage;
- High-value Findings;
- Analytical Gaps.

### Known / Assessed / Unknown
Use este bloco para não confundir observação com interpretação.

### Key Intelligence Judgments
Cada julgamento deve ter:
- confidence;
- basis.

### Evidence Matrix
Compare:
- detector;
- observation;
- correlation;
- source quality;
- IPS.

### Contradictory Evidence
Leia antes de elevar qualquer hipótese.

### Intelligence Gaps
Pergunte: qual gap, se resolvido, mudaria a avaliação?

### High-Value Pivots
Execute primeiro os pivôs que:
1. corroboram por fonte independente;
2. resolvem contradições;
3. fecham gaps.

## 4. Abra um finding

Clique no evidence ID.

O detalhe mostra:
- URL;
- timestamp;
- HTTP status;
- latência;
- evidence signals;
- metadados públicos capturados;
- por que importa;
- pivot recomendado.

## 5. Interprete os scores corretamente

### Detector Reliability
Qualidade da regra de detecção daquele serviço.

### Observation Confidence
Qualidade desta resposta específica.

### Correlation Confidence
Quanto este finding ajuda a sustentar relação com outros achados.

### Source Quality
Força da fonte pública observada.

### IPS
Prioridade de revisão do finding.

IPS não mede risco da pessoa.

## 6. Use hipóteses com disciplina

O Mineiro mantém:
- hipótese principal;
- hipótese alternativa;
- supporting evidence;
- contradictory evidence;
- caveats.

O mesmo username em dois serviços não prova que é a mesma pessoa.

## 7. Exportação

Abra **Export** e escolha o conteúdo.

Formatos:

- HTML: leitura e impressão;
- JSON: integração;
- Markdown: case notes;
- CSV: evidência tabular.

Cada export gera um manifest JSON companheiro com SHA-256 do payload.

## 8. AI Analyst Copilot

Use quando quiser:
- resumir evidência;
- ordenar gaps;
- sugerir pivôs;
- revisar contradições;
- gerar hipóteses alternativas.

A saída é `AI_SYNTHESIZED`.

Ela não aumenta confidence factual sozinha.

## 9. Quando parar

Pare de ampliar a coleta quando novos dados não:
- alterarem julgamentos;
- resolverem contradições;
- fecharem gaps;
- mudarem materialmente a decisão analítica.

Essa regra é mais útil do que transformar 985 detectores em ritual religioso.
