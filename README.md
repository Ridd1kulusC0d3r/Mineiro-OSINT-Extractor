# Mineiro Username Extractor

![Mineiro Username Extractor](assets/mineiro-logo.png)

**Mineiro Username Extractor** é uma engine OSINT para enumeração de usernames, classificação da pegada digital e validação de evidências públicas.

A v1.3 transforma o catálogo em um **Registry versionado de detectores**, adiciona a base do **Detector Bench** e mantém explícita a diferença entre quantidade, confiabilidade do detector, evidência observada e proveniência.

## Números da v1.3

- **985 detectores catalogados**
- **17 packs modulares**
- **8 categorias principais**
- **8 evidence checks opcionais por detector**
- **até 7.880 checks lógicos** em uma varredura completa
- Mineiro Registry com inventário, taxonomia e proveniência
- Detector Bench com precision, recall, false-positive rate e availability
- score de confiabilidade heurístico por detector
- classificação por tipo de serviço
- perfil de presença digital ponderado pela confiabilidade
- execução suportada no Google Colab

> 7.880 checks lógicos não significam 7.880 requisições extras. Vários sinais são extraídos de uma única resposta HTTP.

## Google Colab

A v1.3 inclui um notebook oficial:

`notebooks/Mineiro_Username_Extractor_Colab.ipynb`

Ele clona o projeto, instala dependências, valida o Registry, inicia o servidor e tenta abrir a interface pelo proxy do Colab.

Consulte [COLAB.md](COLAB.md).

## Mineiro Registry

O catálogo é exposto como um registro de detectores versionados com:

```text
detector
├── id
├── category
├── siteType
├── URL pattern
├── detection method
├── detector reliability
├── provenance status
├── license status
└── evidence checks
```

Consulte [REGISTRY.md](REGISTRY.md).

## Detector Bench

A v1.3 adiciona um motor separado para medir detectores com observações rotuladas:

```text
TP / TN / FP / FN
        ↓
precision
recall
false-positive rate
availability
        ↓
benchmark score
```

Isso evita confundir o score heurístico do detector com desempenho empiricamente medido.

## Compatibilidade

### Local / Linux / macOS / Windows

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install
npm run dev
```

### Colab

Use o notebook em `notebooks/` ou siga [COLAB.md](COLAB.md).

### Colab v1.3.1

A configuração do Vite permite explicitamente o domínio interno do proxy do Google Colab sem usar `allowedHosts: true`. Detectores sem URL pública de username, como Discord, permanecem no Registry como `registry-only` e não entram em scans diretos.

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
- [Google Colab](COLAB.md)
- [Mineiro Registry](REGISTRY.md)
- [Arquitetura](ARCHITECTURE.md)
- [Licenças e proveniência](LICENSES_AND_PROVENANCE.md)
- [Política de proveniência](PROVENANCE.md)
- [Security Policy](SECURITY.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)

## Proveniência do catálogo

A base histórica ampla foi preservada em vez de descartada. Como nem toda entrada possui trilha de origem individual comprovada, a v1.3 marca o catálogo legado como `legacy-audit-required`.

Consulte [LICENSES_AND_PROVENANCE.md](LICENSES_AND_PROVENANCE.md).

## Uso responsável

Use somente para informações publicamente acessíveis, pesquisa legítima, threat intelligence, resposta a incidentes, validação de exposição e atividades autorizadas.

Um resultado `FOUND` não prova que contas em serviços diferentes pertencem à mesma pessoa.

## Licença

O código original do Mineiro é distribuído sob MIT. Materiais de terceiros, quando presentes, permanecem sujeitos às licenças de origem.
