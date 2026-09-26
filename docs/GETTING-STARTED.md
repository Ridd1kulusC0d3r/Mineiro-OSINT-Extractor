# Getting Started

Você precisa de uma destas duas coisas:

- um navegador e Google Colab; ou
- Node.js 22+ no seu computador.

## Opção A — Google Colab

Abra o notebook oficial:

[▶ Mineiro Official Colab](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Official_Colab.ipynb)

No Colab:

1. clique em **Runtime → Run all**;
2. aguarde a validação;
3. abra o link exibido em **Mineiro UI**;
4. comece com preset **Quick**.

Não coloque chave de API em células públicas.

## Opção B — Local

### 1. Confirme o Node.js

```bash
node --version
npm --version
```

Use Node.js 22 ou superior.

### 2. Clone

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
```

### 3. Instale

```bash
npm install --no-audit --no-fund
```

### 4. Valide

```bash
npm run check
```

### 5. Rode

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Primeiro scan

Para o primeiro uso:

1. escolha **Username**;
2. informe um identificador que você tenha autorização para pesquisar;
3. mantenha **Quick**;
4. inicie a coleta;
5. revise **Intelligence** antes de abrir a tabela de evidência.

## Como saber se está funcionando

A API local deve responder:

```text
GET /api/health
```

O retorno deve indicar a versão do Mineiro e status saudável.

## Próximo passo

- Uso operacional: [USER-GUIDE.md](USER-GUIDE.md)
- Colab: [COLAB.md](COLAB.md)
- Problemas: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
