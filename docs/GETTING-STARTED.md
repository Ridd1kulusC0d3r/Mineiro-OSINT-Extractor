# Mineiro Username Intelligence · Primeiros passos

**OSINT Investigation Workbench**

Em cerca de **5 minutos** você instala, abre a ferramenta e faz a primeira coleta, lendo o resultado do jeito certo. Este guia usa só alvos **públicos e legítimos** (organizações de código aberto como `forgejo`).

> [!IMPORTANT]
> O Mineiro consulta **informação publicamente acessível**, para uma **finalidade legítima e autorizada**. Ele não contorna login, CAPTCHA ou bloqueios, e um resultado `FOUND` é **uma observação, não uma prova de identidade**. Leia o [uso responsável](../README.md#responsible-use) antes de investigar pessoas.

## Sumário

1. [Escolha como instalar](#1-escolha-como-instalar)
2. [Opção A · pip (recomendado)](#2-opção-a--pip-recomendado)
3. [Opção B · Google Colab](#3-opção-b--google-colab)
4. [Opção C · Código-fonte](#4-opção-c--código-fonte)
5. [Confirme que está funcionando](#5-confirme-que-está-funcionando)
6. [Sua primeira investigação, passo a passo](#6-sua-primeira-investigação-passo-a-passo)
7. [O que você deve ver](#7-o-que-você-deve-ver)
8. [Atualizar e desinstalar](#8-atualizar-e-desinstalar)
9. [Próximos passos](#9-próximos-passos)

---

## 1. Escolha como instalar

| | **pip** | **Colab** | **Código-fonte** |
|---|---|---|---|
| Instala algo no seu computador? | sim (1,3 MB + Node) | não | sim |
| Precisa de Node.js? | não, vem junto se faltar | não | sim, 22+ |
| Seus dados ficam | no seu computador | na VM temporária do Colab | no seu computador |
| IP usado nas consultas | o seu | o do Google | o seu |
| Ideal para | **uso diário** | testar em 2 minutos, demonstrar | contribuir, depurar |
| Tempo até a tela inicial | ~1 min | ~3 min | ~3 min |

> [!TIP]
> Em dúvida? Use **pip**. Para só experimentar sem instalar nada, use o **Colab**.

---

## 2. Opção A · pip (recomendado)

Pré-requisito: Python 3.9 ou superior. O Node.js (22.5+) é usado se já existir; senão, o próprio pacote traz um.

```bash
python -m venv .venv
source .venv/bin/activate          # Windows (PowerShell): .venv\Scripts\Activate.ps1
pip install mineiro-osint
mineiro
```

> [!NOTE]
> Se `pip install mineiro-osint` ainda não encontrar o pacote no PyPI, instale pela *wheel* da release:
> `pip install https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/releases/download/v1.7.0/mineiro_osint-1.7.0-py3-none-any.whl`

O terminal mostra algo como:

```text
Mineiro 1.7.0 -> http://127.0.0.1:3000  (Ctrl+C to stop)
Public signals only. Use within a legitimate and authorized purpose.
```

O navegador abre sozinho. Para parar, `Ctrl+C` no terminal.

Variações úteis:

```bash
mineiro --no-browser               # não abre o navegador
mineiro --port 8080                # porta preferida (usa a próxima livre se ocupada)
mineiro --data-dir ~/investigacoes # onde fica o SQLite opcional
mineiro --check                    # diagnóstico: pacote e Node
```

Referência completa das opções: [CLI-E-API.md](CLI-E-API.md#1-comando-mineiro-pip). Se algo falhar: [TROUBLESHOOTING.md](TROUBLESHOOTING.md#a-instalação-e-inicialização).

---

## 3. Opção B · Google Colab

Abra o notebook oficial:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Username_Intelligence_Colab.ipynb)

1. Clique em **Runtime → Run all**.
2. Aguarde o cartão **Environment ready**.
3. Abra o link em **Mineiro UI**.
4. Comece com **Standard**.

A VM do Colab é **temporária**: exporte os relatórios antes de fechar. **Nunca** cole chaves de API em células de um notebook compartilhado. Mais em [COLAB.md](COLAB.md).

---

## 4. Opção C · Código-fonte

Pré-requisito: **Node.js 22+** (`node --version`).

```bash
git clone https://github.com/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor.git
cd Mineiro-OSINT-Extractor
npm ci --no-audit --no-fund        # instalação reprodutível (package-lock.json)
npm run dev
```

Abra `http://localhost:3000`.

Atalhos de inicialização: `./iniciar-mineiro.sh` (Linux/macOS), `Iniciar-Mineiro.bat` (Windows) e `Iniciar-Mineiro.command` (macOS, duplo clique). Todos aceitam `--check` para mostrar as versões de Node e npm.

Para validar tudo antes de contribuir: `npm run check`.

---

## 5. Confirme que está funcionando

Com o Mineiro rodando, em outro terminal:

```bash
curl -s localhost:3000/api/health
```

Esperado (resumido):

```json
{ "status": "ok", "version": "1.7.0", "geminiConfigured": false, "publicMode": false }
```

E a tela inicial deve aparecer no navegador:

<p align="center">
  <img src="../assets/screenshots/home.png" alt="Tela inicial do Mineiro com campo de busca, exemplos, modos de scan e legenda de veredito" width="860">
</p>

---

## 6. Sua primeira investigação, passo a passo

### Passo 1 · Idioma (opcional)

No cabeçalho, **EN · PT · ES**. O padrão é **português**. A escolha fica salva no navegador.

### Passo 2 · Escolha o alvo

Clique em um dos exemplos (`@forgejo`) ou digite um handle no campo grande.

- O campo é **tolerante**: cole `https://github.com/forgejo` e ele sugere `@forgejo`; digite um e-mail no modo usuário e ele oferece trocar para o modo e-mail.
- Quando há uma sugestão, o **Enter aplica a correção** e não executa o scan; aperte **Enter** de novo para executar.

### Passo 3 · Escolha a profundidade

Selecione o cartão **Standard** (recomendado). Ele liga os 8 checks de evidência e a *baseline diferencial* contra falsos positivos.

| Modo | Detectores (usuário) | Para quê |
|---|---:|---|
| **Quick** | 19 | Teste rápido. Sem Evidence Engine: espere falsos positivos. |
| **Standard** | 49 | Investigação normal. |
| **Full** | 984 | Cobertura ampla, em duas fases. Demora. |

> [!NOTE]
> A interface mostra "20 / 50 / 985" como números redondos. Os valores **reais** em modo usuário são 19 / 49 / 984, porque um detector do catálogo não é escaneável. Detalhes na [Cheatsheet](CHEATSHEET.md#presets-de-scan).

### Passo 4 · Execute

Pressione **Enter** ou **Run scan**. A interface mostra o relatório (aba **Intelligence**) e a barra do topo exibe o progresso (`33% collected · 0 found`). A demonstração abaixo abre a aba **Platforms** para mostrar os cartões chegando ao vivo:

<p align="center">
  <img src="../assets/demo.gif" alt="Demonstração: digitar o handle, rodar o scan Standard e ver os cartões chegando" width="860">
</p>

Dá para parar a qualquer momento com **Stop**. No **Console** você acompanha cada evento.

### Passo 5 · Leia primeiro a aba Intelligence

Ela começa pelo **Executive view** e pelos **Key judgments**:

<p align="center">
  <img src="../assets/screenshots/report.png" alt="Executive view e Key judgments do relatório" width="860">
</p>

Regra de ouro: leia **Known · Assessed · Unknown** antes de qualquer número. Um julgamento "baixo" ou "moderado" é normal quando muitas respostas foram bloqueadas.

### Passo 6 · Audite a evidência

Abra a aba **Evidence**. Cada linha mostra o veredito, a confiança, a confiabilidade do detector e **quantos dos 8 checks passaram**:

<p align="center">
  <img src="../assets/screenshots/evidence.png" alt="Ledger de evidências com status, confiança e checks aprovados" width="860">
</p>

Como ler os selos:

| Selo | Significa |
|---|---|
| `HIT // 200` | O site respondeu como se o perfil existisse. **Indício, não prova.** |
| `404 ABSENT` | Ausência confirmada pela resposta. |
| `UNCERTAIN` | Bloqueado, limitado ou inconclusivo. **Não** é "não existe". |
| `RATE_LMT` | O site limitou as consultas (HTTP 429). |
| `ERROR` | A consulta falhou antes de haver veredito (rede, recusa do servidor local). |

### Passo 7 · Exporte

Clique em **Export** (cabeçalho). Escolha as seções e o formato (HTML, JSON, Markdown ou CSV). Cada arquivo vem com um `.manifest.json` com o SHA-256 do conteúdo. Veja [USER-GUIDE.md](USER-GUIDE.md#13-exportar-o-relatório).

### Passo 8 · Volte depois

Todo scan concluído vira um **caso** guardado no seu navegador. Na tela inicial, **Continue de onde parou** reabre os 3 mais recentes; o botão **Cases** abre a lista completa.

---

## 7. O que você deve ver

Em um scan **Standard** de `forgejo` feito durante os testes desta documentação:

- ~49 plataformas verificadas em **10 a 20 segundos**;
- **3 encontradas** (por exemplo GitHub, Telegram, Roblox), **21 ausentes**, **23 incertas** (GitLab, Reddit, Instagram e outras que bloqueiam ou limitam automação), 1 limitada e 1 com erro;
- julgamento principal **baixo/moderado** e o julgamento "*Collection gaps materially limit negative conclusions*" como **alto**.

Seus números vão variar com a rede, o horário e as defesas de cada site. **Muitos `UNCERTAIN` são o comportamento correto**: o Mineiro prefere admitir incerteza a inventar certeza.

---

## 8. Atualizar e desinstalar

| Instalação | Atualizar | Desinstalar |
|---|---|---|
| pip | `pip install -U mineiro-osint` | `pip uninstall mineiro-osint` |
| Código-fonte | `git pull --ff-only && npm ci` | apague a pasta |
| Colab | rode a célula de atualização ([COLAB.md](COLAB.md)) | feche o notebook |

Seus **casos** ficam no navegador e o SQLite opcional em `~/.mineiro`. Desinstalar o programa **não** apaga esses dados; veja como apagar tudo em [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md#8-como-apagar-tudo).

---

## 9. Próximos passos

| Quero… | Leia |
|---|---|
| Entender cada tela e controle | [USER-GUIDE.md](USER-GUIDE.md) |
| Consultar atalhos, selos e presets rapidamente | [CHEATSHEET.md](CHEATSHEET.md) |
| Ver roteiros prontos de investigação | [RECEITAS.md](RECEITAS.md) |
| Entender o que é guardado e o que sai da minha máquina | [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md) |
| Automatizar por script | [CLI-E-API.md](CLI-E-API.md) |
| Saber o que significa cada termo | [GLOSSARIO.md](GLOSSARIO.md) |
| Resolver um erro | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
