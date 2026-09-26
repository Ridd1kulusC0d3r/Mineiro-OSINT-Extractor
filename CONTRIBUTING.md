# Contributing

Contribuições são bem-vindas, especialmente para manutenção de endpoints, redução de falsos positivos, acessibilidade e documentação.

## Fluxo

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install
git checkout -b feature/minha-melhoria
```

Antes do pull request:

```bash
npm run lint
npm run build
```

## Alterações no catálogo

1. Confirme que a URL é pública.
2. Documente o comportamento de presença e ausência.
3. Não confie somente em HTTP 200 quando a plataforma usa página genérica.
4. Não inclua endpoints privados, credenciais ou técnicas de bypass de autenticação.
5. Teste falsos positivos e falsos negativos.
