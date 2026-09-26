# Roadmap

O roadmap é orientado por qualidade analítica e manutenção, não por quantidade de features.

## Agora

### Registry quality
- reduzir `legacy-audit-required`;
- aumentar detectores com provenance verificada;
- criar fixtures sintéticas por família de detector;
- medir estabilidade e false-positive rate.

### Investigation workflow
- melhorar interação do correlation graph;
- permitir notas locais do analista;
- tornar intelligence requirements extensíveis;
- melhorar comparação entre snapshots.

### Performance
- benchmark reproduzível de Quick / Standard / Full;
- tuning adaptativo de concorrência por classe de endpoint;
- cache local de resultados recentes com TTL explícito;
- melhor telemetria de gargalo sem coletar dados do usuário.

## Depois

- packs de Registry versionados independentemente;
- schema público para integrations;
- import/export de cases;
- documentação bilíngue;
- release artifacts assinados pelo pipeline;
- benchmark público usando apenas alvos sintéticos/controlados.

## Fora de escopo

- bypass de autenticação ou CAPTCHA;
- credential stuffing;
- coleta de conteúdo privado;
- inferência de atributos sensíveis;
- “threat score” de pessoas baseado em presença pública;
- expansão do catálogo sem proveniência e teste.

A regra é simples: cobertura só vale quando continua auditável.
