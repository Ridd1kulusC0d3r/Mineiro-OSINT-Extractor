# Comece aqui

O caminho mais curto para usar o Mineiro:

## Google Colab

[▶ Abrir o notebook oficial](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Username_Intelligence_Colab.ipynb)

Depois escolha **Runtime → Run all**.

## Local

Pré-requisito: Node.js 22+.

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm install --no-audit --no-fund
npm run dev
```

Abra `http://localhost:3000`.

## Antes do primeiro uso

Leia:

1. [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md)
2. [docs/USER-GUIDE.md](docs/USER-GUIDE.md)
3. [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Validação

```bash
npm run check
```

Esse comando valida Registry, TypeScript, demo sintética, assessment, notebook oficial, documentação, manual e build.

## Regra essencial

`FOUND` é um achado público. Não é prova automática de identidade.
