# Contributing

Contribuições úteis para o Mineiro melhoram uma destas áreas:

- qualidade de detector;
- redução de falso positivo;
- performance;
- acessibilidade;
- investigação e reporting;
- documentação;
- testes sintéticos;
- proveniência do Registry.

## Ambiente

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install --no-audit --no-fund
git checkout -b feature/minha-melhoria
```

Antes do Pull Request:

```bash
npm run check
```

## Alterações no Registry

Um detector novo ou alterado deve:

1. apontar para uma superfície pública;
2. ter URL pattern claro;
3. documentar presença e ausência;
4. evitar depender apenas de HTTP 200 quando a página é genérica;
5. declarar proveniência;
6. registrar status de licença quando aplicável;
7. usar dados sintéticos/controlados em testes;
8. preservar `UNCERTAIN` quando a resposta não for conclusiva.

Não inclua:
- endpoints privados;
- cookies;
- tokens;
- credenciais;
- técnicas para contornar autenticação ou CAPTCHA.

## Mudanças analíticas

Ao alterar score, hypothesis, correlation ou report:

- explique qual pergunta analítica melhora;
- preserve separation entre observation e assessment;
- inclua teste sintético;
- mostre como contradições são tratadas;
- não transforme presença pública em inferência sensível.

## Mudanças de UI

Priorize:
- hierarquia visual;
- leitura;
- teclado;
- responsividade;
- redução de densidade;
- estados vazios e erro claros.

Não adicione gráfico só porque há um array disponível.

## Documentação

Se a mudança altera comportamento público:
- atualize o guia correspondente;
- mantenha o README curto;
- use `docs/` para detalhes;
- não crie um segundo documento para a mesma função.

## Pull Requests

Use o template do repositório.

PRs pequenos e focados são mais fáceis de revisar do que “refactor-final-v7-definitivo-agora-vai”.
