# Mineiro Username Intelligence · Documentação

**OSINT Investigation Workbench** · versão 1.7

Esta pasta é o ponto de entrada para quem quer **usar**, **operar**, **entender** ou **contribuir**. Escolha o seu caminho.

## Comece pelo seu objetivo

| Eu quero… | Leia, nesta ordem |
|---|---|
| **Testar agora, sem instalar** | [Colab](COLAB.md) → [Getting Started](GETTING-STARTED.md) |
| **Instalar e fazer a 1ª investigação** | [Getting Started](GETTING-STARTED.md) (3 formas de instalar + 8 passos com imagens) |
| **Conhecer cada tela e botão** | [User Guide](USER-GUIDE.md) → [Cheatsheet](CHEATSHEET.md) |
| **Resolver uma situação concreta** | [Receitas](RECEITAS.md) (triagem, marca, diff, falso positivo, pivô, lote, relatório, automação, custódia) |
| **Entender o que os números significam** | [Glossário](GLOSSARIO.md) → [Metodologia](INTELLIGENCE-METHODOLOGY.md) (com as fórmulas) |
| **Investigar por relações** | [Graph Hunting](GRAPH-HUNTING.md) |
| **Saber para onde vão meus dados** | [Privacidade e dados](PRIVACIDADE-E-DADOS.md) |
| **Automatizar (CLI, API, scripts, CI)** | [CLI e API](CLI-E-API.md) → exemplos em [`../examples/`](../examples) |
| **Resolver um erro** | [Troubleshooting](TROUBLESHOOTING.md) → [FAQ](FAQ.md) |
| **Hospedar para uma equipe** | [Deployment](DEPLOYMENT.md) → [Privacidade](PRIVACIDADE-E-DADOS.md#5-cenários-local-colab-servidor-compartilhado) |
| **Entender a engenharia** | [Arquitetura](../ARCHITECTURE.md) → [Plano de evolução](PLANO-PAGINA-INICIAL.md) → [Roadmap](../ROADMAP.md) |
| **Contribuir com detectores** | [Contributing](../CONTRIBUTING.md) → [Registry](../REGISTRY.md) → [Proveniência](../PROVENANCE.md) |
| **Publicar uma versão** | [Releasing](RELEASING.md) |

## Caminhos de leitura sugeridos

- **Analista (primeira semana):** Getting Started → User Guide (seções 1–7) → Receitas 1, 3 e 4 → Glossário.
- **Analista sênior / relatórios:** Metodologia → Receitas 5, 7 e 9 → Privacidade.
- **Engenharia / SecOps:** CLI e API → Deployment → Privacidade (seção 5) → Arquitetura.
- **Quem só tem 5 minutos:** [Cheatsheet](CHEATSHEET.md).

## Mapa da documentação

| Documento | Para quem | Tempo |
|---|---|---:|
| [Getting Started](GETTING-STARTED.md) | primeiro uso | 10 min |
| [User Guide](USER-GUIDE.md) | usuário/analista | 25 min |
| [Cheatsheet](CHEATSHEET.md) | consulta rápida (atalhos, presets, selos) | 3 min |
| [Receitas](RECEITAS.md) | situações reais, passo a passo | 15 min |
| [Glossário](GLOSSARIO.md) | todo mundo | consulta |
| [Metodologia](INTELLIGENCE-METHODOLOGY.md) | analistas | 15 min |
| [Graph Hunting](GRAPH-HUNTING.md) | investigação por relações | 10 min |
| [Privacidade e dados](PRIVACIDADE-E-DADOS.md) | todo mundo, antes de usar em casos reais | 10 min |
| [CLI e API](CLI-E-API.md) | automação / integração | 20 min |
| [Colab](COLAB.md) | quem não quer instalar | 5 min |
| [Troubleshooting](TROUBLESHOOTING.md) | suporte (por sintoma) | consulta |
| [FAQ](FAQ.md) | dúvidas rápidas | consulta |
| [Deployment](DEPLOYMENT.md) | operação / produção (EN) | 10 min |
| [Arquitetura](../ARCHITECTURE.md) | engenharia | 10 min |
| [Plano de evolução](PLANO-PAGINA-INICIAL.md) | produto / UX, backlog priorizado | 8 min |
| [Releasing](RELEASING.md) | manutenção / release (EN) | 5 min |
| [Contributing](../CONTRIBUTING.md) | contribuidores | 8 min |

### Históricos (v1.4)

Mantidos para contexto de design; podem divergir da versão atual: [Engenharia v1.4](ENGINEERING-V1.4.md) e [Reporting UX v1.4](REPORTING-UX-V1.4.md).

## Convenções

- `FOUND`: sinal de presença, não identidade confirmada. `UNCERTAIN`: resposta inconclusiva. `ERROR`: falha do servidor local (não do site).
- `PRIMARY`: observado diretamente · `DERIVED`: calculado a partir de evidência · `EXTERNAL`: fonte externa atribuída · `AI_SYNTHESIZED`: síntese produzida por modelo.
- Exemplos usam **organizações públicas** (`forgejo`, `nodejs`, `rust-lang`). Nunca um indivíduo privado.
- Imagens: `assets/docs/` (capturas reais, geradas por `npm run assets:capture`) e `assets/diagrams/`.
- `npm run docs:validate` confere todos os links e âncoras destes arquivos.

Documentou algo errado ou faltou algo? Abra uma issue com a página e o trecho. Correções de documentação são contribuições bem-vindas.
