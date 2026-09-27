# Mineiro Username Intelligence · FAQ

## O Mineiro confirma identidade?
Não. Ele observa presença pública e produz suporte de correlação. Identidade exige evidência independente.

## Um HTTP 200 significa FOUND?
Não necessariamente. O Evidence Engine também considera redirect, URL final, conteúdo, canonical, soft-404 e proteção de borda.

## Detector Reliability e Observation Confidence são a mesma coisa?
Não.

- Detector Reliability: qualidade esperada da regra.
- Observation Confidence: qualidade desta execução.

## O que é Source Quality?
É a força da fonte pública observada, separada da qualidade do detector.

## O que é IPS?
Intelligence Priority Score. Serve para priorizar findings, não pessoas.

## Por que há `UNCERTAIN`?
Porque alguns serviços respondem com rate limit, WAF, redirects ambíguos ou comportamento inconclusivo. O Mineiro prefere admitir incerteza a inventar certeza.

## Full Scan faz 7.880 requests?
Não. Os 7.880 são checks lógicos possíveis. Vários são extraídos de uma única resposta.

## Posso rodar no Colab?
Sim. Use o notebook oficial em `notebooks/Mineiro_Username_Intelligence_Colab.ipynb`.

## O Copilot é obrigatório?
Não. Todo assessment determinístico funciona sem IA.

## O Copilot pode elevar confidence?
Não sozinho. Saída de IA é marcada `AI_SYNTHESIZED`.

## O SHA-256 prova autoria?
Não. Ele verifica integridade do payload exportado.

## Posso adicionar detectores?
Sim, desde que o endpoint seja público, a proveniência seja documentada e o comportamento seja testável.

## Por que alguns detectores ficam registry-only?
Porque são úteis para taxonomia ou documentação, mas não possuem uma URL pública estável adequada para scan direto.
