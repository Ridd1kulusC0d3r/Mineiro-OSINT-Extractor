# Guia de Uso — Mineiro Username Extractor 1.2

## Modos

### Quick
Top 20, menor custo operacional e Evidence Engine desligado.

### Standard
Top 50 com Evidence Engine habilitado.

### Deep
Catálogo completo de 985 endpoints. Pode produzir até **7.880 avaliações lógicas de evidência**.

Deep é opcional e deve ser usado com concorrência moderada.

## Como ler os scores

### Detector
Qualidade esperada da regra daquele site.

### Confidence
Força das evidências observadas na execução atual.

Exemplo:

```text
Detector:   86%
Confidence: 72%
Evidence:   probable
Checks:     5/8
```

## Perfil por categoria
O dashboard agrupa presenças em clusters como developer, security, social, community, gaming, creative, media e crypto.

O ranking é ponderado pela confiabilidade. Ele descreve onde o username aparece, não quem é a pessoa nem sua personalidade.

## Evidence Engine
Quando ativo, analisa status, ausência explícita, redirects, URL final, username no corpo, canonical, soft-404 e proteção/rate-limit.

## Catálogo completo
A v1.2 preserva os endpoints históricos, mas alguns permanecem marcados como `legacy-audit-required`. Isso significa: use como cobertura, não como promessa de precisão.

## Boas práticas

- prefira Quick para triagem;
- use Standard para confirmação;
- reserve Deep para investigação autorizada;
- reduza concorrência se surgirem rate limits;
- valide manualmente achados importantes;
- não trate `UNCERTAIN` como ausência;
- não trate username igual como identidade confirmada.
