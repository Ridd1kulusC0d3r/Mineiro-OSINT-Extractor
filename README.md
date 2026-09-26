# Mineiro Username Extractor

![Mineiro Username Extractor](assets/mineiro-logo.png)

**Mineiro Username Extractor** é uma engine OSINT para enumeração de usernames, classificação da pegada digital e validação de evidências públicas.

A v1.2 volta a preservar o catálogo amplo do projeto, mas deixa explícita a diferença entre **quantidade**, **confiabilidade do detector** e **proveniência**.

## Números da v1.2

- **985 endpoints catalogados**
- **8 categorias principais**
- **8 evidence checks opcionais por endpoint**
- **até 7.880 checks lógicos** em uma varredura completa
- score de confiabilidade do detector por site
- classificação por tipo de serviço
- perfil de presença digital ponderado pela confiabilidade

> 7.880 checks lógicos não significam 7.880 requisições extras. Vários sinais são extraídos de uma única resposta HTTP.

## Pipeline

```text
username
   |
   v
985 catalogued endpoints
   |
   v
bounded HTTP probes
   |
   +--> status
   +--> redirect
   +--> final URL
   +--> body token
   +--> canonical
   +--> soft-404
   +--> edge protection
   |
   v
evidence scoring
   |
   +--> FOUND
   +--> NOT FOUND
   +--> UNCERTAIN
   +--> RATE LIMITED
   |
   v
category profile + export
```

## Detector Reliability Score

O score mostrado para cada site mede **a confiabilidade da regra de detecção**, não a reputação do site.

Exemplos:

- endpoint com `200` para presença e `404` para ausência: tende a ser mais confiável;
- página de busca genérica que sempre responde `200`: tende a ter score menor;
- serviços com anti-bot agressivo: recebem penalização;
- sinais adicionais do Evidence Engine alteram a confiança do resultado observado.

### Tiers

| Tier | Interpretação |
|---|---|
| High | detector estruturalmente forte |
| Medium | detector utilizável, requer validação |
| Experimental | endpoint sujeito a falso positivo/negativo |

## Digital Footprint Profile

Os resultados são agrupados por tipo de serviço, por exemplo:

```text
developer
security
social
community
gaming
creative
media
crypto
```

Cada presença é ponderada por:

```text
result confidence × detector reliability
```

O dashboard então mostra os clusters predominantes do username.

Isso descreve **pegada digital observável**. Não é inferência psicológica, política ou de identidade.

## Evidence Engine

No modo opcional, uma resposta pode gerar até oito checks:

1. status HTTP esperado;
2. status explícito de ausência;
3. consistência de redirect;
4. continuidade do username na URL final;
5. username presente no corpo;
6. canonical compatível;
7. detecção de soft-404;
8. edge protection / rate limit.

Esse modo é habilitado no scan modular e vem ativo no preset Deep.

## Presets

### Quick
Top 20, sem Evidence Engine.

### Standard
Top 50, Evidence Engine ligado.

### Deep
Catálogo completo de 985 endpoints, Evidence Engine ligado, concorrência limitada e retry adaptativo.

A varredura completa é opcional. Serviços externos têm seus próprios limites e termos.

## Instalação

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Validação antes de release

```bash
npm run lint
npm run build
npm run dev
```

## Documentação

- [Guia de uso](USER_GUIDE.md)
- [Arquitetura](ARCHITECTURE.md)
- [Licenças e proveniência](LICENSES_AND_PROVENANCE.md)
- [Política de proveniência](PROVENANCE.md)
- [Security Policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Proveniência do catálogo

A base histórica ampla foi preservada em vez de descartada. Como nem toda entrada possui trilha de origem individual comprovada, a v1.2 marca o catálogo legado como `legacy-audit-required`.

Consulte [LICENSES_AND_PROVENANCE.md](LICENSES_AND_PROVENANCE.md).

## Uso responsável

Use somente para informações publicamente acessíveis, pesquisa legítima, threat intelligence, resposta a incidentes, validação de exposição e atividades autorizadas.

Um resultado `FOUND` não prova que contas em serviços diferentes pertencem à mesma pessoa.

## Licença

O código original do Mineiro é distribuído sob MIT. Materiais de terceiros, quando presentes, permanecem sujeitos às licenças de origem.
