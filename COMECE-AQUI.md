# Comece aqui

O caminho mais curto para usar o Mineiro:

## Google Colab

[▶ Abrir o notebook oficial](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Username_Intelligence_Colab.ipynb)

Depois escolha **Runtime → Run all**.

## Python (`pip`)

```bash
pip install https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/releases/download/v1.7.0/mineiro_osint-1.7.0-py3-none-any.whl
mineiro
```

Abre `http://127.0.0.1:3000`. Usa o Node.js 22+ do sistema ou baixa um sozinho.

## Do código-fonte

Pré-requisito: Node.js 22+.

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm ci --no-audit --no-fund
npm run dev
```

Abra `http://localhost:3000`.

## Antes do primeiro uso

Leia:

1. [docs/GETTING-STARTED.md](docs/GETTING-STARTED.md): primeira investigação, passo a passo
2. [docs/USER-GUIDE.md](docs/USER-GUIDE.md): todas as telas
3. [docs/PRIVACIDADE-E-DADOS.md](docs/PRIVACIDADE-E-DADOS.md): para onde vão seus dados
4. [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md): quando algo não funciona

Tudo organizado por objetivo em [docs/README.md](docs/README.md).

## Validação

```bash
npm run check
```

Esse comando valida Registry, TypeScript, demo sintética, assessment, notebook oficial, documentação, manual e build.

## Regra essencial

`FOUND` é um achado público. Não é prova automática de identidade.
