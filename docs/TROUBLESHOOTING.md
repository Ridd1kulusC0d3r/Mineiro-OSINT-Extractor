# Mineiro Username Intelligence · Troubleshooting

**OSINT Investigation Workbench**

Procure pelo **sintoma** que você está vendo. Cada item diz *o que significa*, *como confirmar* e *o que fazer*. No fim há um roteiro para abrir uma issue com tudo que precisamos.

## Sumário

- [Diagnóstico em 60 segundos](#diagnóstico-em-60-segundos)
- [A. Instalação e inicialização](#a-instalação-e-inicialização)
- [B. A interface abre, mas não coleta](#b-a-interface-abre-mas-não-coleta)
- [C. Resultados que parecem estranhos](#c-resultados-que-parecem-estranhos)
- [D. Exportação, casos e armazenamento](#d-exportação-casos-e-armazenamento)
- [E. Copiloto de IA (Gemini)](#e-copiloto-de-ia-gemini)
- [F. Google Colab](#f-google-colab)
- [G. Desenvolvimento e CI](#g-desenvolvimento-e-ci)
- [Limites conhecidos](#limites-conhecidos)
- [Como abrir uma issue útil](#como-abrir-uma-issue-útil)

---

## Diagnóstico em 60 segundos

```bash
mineiro --check                      # instalação via pip
curl -s localhost:3000/api/health    # o servidor está de pé?
```

Resultado saudável de `mineiro --check`:

```text
mineiro 1.7.0
app bundle : ok (…/mineiro_osint/_app)
node       : /usr/bin/node
```

Resultado saudável de `/api/health`: `"status":"ok"`, a `version` esperada e `"publicMode":false` (em uso pessoal).

A partir do código-fonte:

```bash
node --version      # precisa ser 22.5 ou superior
npm run registry:validate
npm run lint
npm test
```

Se algum desses falhar, comece pela seção A.

---

## A. Instalação e inicialização

### `mineiro: command not found` (ou "não é reconhecido")

O `pip` instalou o comando numa pasta que não está no `PATH` (comum no Windows e com `pip install --user`).

```bash
python -m mineiro_osint          # funciona sem depender do PATH
python -m pip show -f mineiro-osint | grep -i scripts
```

Prefira instalar em um ambiente virtual ou com `pipx`:

```bash
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install mineiro-osint
```

### `error: externally-managed-environment`

O Python do sistema (Debian/Ubuntu/macOS recentes) bloqueia `pip install` global. Use um ambiente virtual (acima) ou `pipx install mineiro-osint`.

### `Node.js >= 22.5 was not found`

O `mineiro` procura primeiro o `node` do seu `PATH` e só o aceita se for ≥ 22.5; senão usa o do pacote `nodejs-wheel-binaries`. Se nenhum serve:

```bash
pip install --upgrade nodejs-wheel-binaries
mineiro --check
```

Ou instale o Node 22 LTS em <https://nodejs.org>.

### `The app bundle is missing from this installation`

A instalação ficou incompleta (por exemplo, instalou o código-fonte em vez da *wheel*). Reinstale: `pip install --force-reinstall mineiro-osint`.

### Aviso `ExperimentalWarning: SQLite is an experimental feature`

Normal no Node 22. O Mineiro usa o SQLite embutido (`node:sqlite`). O comando `mineiro` já silencia esse aviso; ao rodar do código-fonte ele aparece uma vez no terminal. Não afeta os resultados.

### `[store] persistence disabled: …`

O Node não tem `node:sqlite` (versão < 22.5). O app **continua funcionando**; só o armazenamento em `/api/store/*` fica indisponível (`503`). Atualize o Node.

### A porta 3000 está ocupada

- Com o comando `mineiro`: nada a fazer, ele escolhe a próxima porta livre e informa a URL no terminal.
- Do código-fonte: o servidor imprime `Port 3000 is already in use.` Use outra porta: `PORT=3001 npm run dev`, ou encerre o processo anterior (`lsof -i :3000` no Linux/macOS, `netstat -ano | findstr :3000` no Windows).

### Quero acessar de outro computador e não consigo

É proposital: o comando `mineiro` escuta só em `127.0.0.1`. Para outra máquina da rede use `--host 0.0.0.0` **apenas** em rede confiável, ou publique atrás de um proxy com autenticação. Leia [DEPLOYMENT.md](DEPLOYMENT.md) e [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md) antes.

### Falhas de build do código-fonte

```bash
rm -rf node_modules dist
npm ci --no-audit --no-fund       # npm ci, não npm install: respeita o package-lock.json
npm run check
```

---

## B. A interface abre, mas não coleta

### Todos os resultados vêm como `error` com HTTP `0`

O servidor não conseguiu abrir conexão com os sites. Causas, da mais comum à menos:

1. **Sem internet** ou DNS quebrado. Teste: `curl -I https://dev.to`.
2. **Rede que exige proxy explícito.** O Mineiro **não lê** `HTTP_PROXY` / `HTTPS_PROXY` (verificamos: um proxy inválido configurado não altera nada). Se a sua rede só sai por proxy, as consultas falham. Alternativas: rodar fora dessa rede, usar o [Colab](COLAB.md), ou acompanhar o item de suporte a proxy no [roadmap](../ROADMAP.md).
3. **Firewall local** bloqueando o Node.

O campo `error` do resultado (visível na aba Evidence e no Console) traz a mensagem do sistema (por exemplo `fetch failed`).

### "Blocked non-public address" / "Non-public address literal"

O servidor recusou propositalmente a URL: ela apontava para um IP privado, `localhost` ou outra porta que não 80/443. É a proteção contra SSRF e não deve ser contornada. Se você é desenvolvedor de detector e o site realmente resolve para um IP público, verifique o DNS.

### "URL does not match the detector pattern" (HTTP 400)

Você chamou a API com uma URL que o detector não geraria. Monte a URL substituindo `{username}` pelo handle *com URL-encoding* (`@` vira `%40`). Veja a [referência da API](CLI-E-API.md#55-post-apiosintverify).

### A tela inicial sumiu e só vejo o relatório vazio

Você já tem resultados na sessão. Use **Clear workspace** (ícone de reset ao lado de Export) para voltar à tela inicial.

### Um scan Full parece travado

Ele roda em duas fases: descoberta rápida de 985 detectores e depois checagens profundas só nos candidatos. A barra de progresso mostra a primeira fase. Abra a aba **Console** para ver os eventos em tempo real. Se ficar minutos sem eventos novos, **Stop** e rode Standard.

### O scan do meu lote CSV parou

Veja o painel **Batch**: o item pode estar pausado, pulado ou abortado. Os botões de pausar, retomar e pular estão no próprio painel. Detalhes em [USER-GUIDE.md](USER-GUIDE.md#10-lote-csv).

---

## C. Resultados que parecem estranhos

### Muitos `UNCERTAIN`

É honesto, não é defeito. Significa que o site **bloqueou ou limitou** a consulta (desafio de borda/WAF, HTTP 403/429/503, *timeout*). Exemplos reais de um scan Standard: GitLab e Reddit costumam responder `HTTP 403`; Instagram, `429`; outros expiram.

- O Mineiro **não tenta burlar** esses bloqueios (sem CAPTCHA, sem login, sem rotação de IP). Na interface a nova tentativa adaptativa fica desligada.
- `UNCERTAIN` **nunca** deve ser lido como "não existe".
- O que ajuda: reduzir o escopo, esperar alguns minutos, repetir de outro IP *quando for legítimo*, ou conferir a URL manualmente (botão de abrir link na aba Platforms).

### Um site que eu sei que bloqueia automação devolve `HTTP 403` só para o Mineiro

Alguns serviços recusam User-Agents que imitam um navegador, mas aceitam um User-Agent honesto que se identifica. O **Codeberg** é um caso conhecido: com o UA padrão responde 403; com o identificado responde 200. Por isso detectores declarativos podem ter `"userAgent": "honest"`. Você também pode definir um identificador seu para todas as sondagens:

```bash
MINEIRO_USER_AGENT="MeuProjeto/1.0 (+https://exemplo.org/contato)" mineiro
```

### `FOUND`/`HIT` em um site que obviamente não tem aquela conta

Quase sempre é *soft-404*: o site responde `200 OK` com uma página de "perfil não encontrado". Em **Quick** o Evidence Engine e a baseline diferencial estão desligados e esse falso positivo é esperado. Faça:

1. Rode **Standard** (liga os 8 checks e a baseline).
2. Abra o item na aba **Evidence** e leia os sinais; procure `baseline_identical_to_absent_profile` (aí o resultado vira *absent*) ou `soft_404_hint_detected`.
3. Compare a URL aberta no navegador.

Veja a explicação completa em [INTELLIGENCE-METHODOLOGY.md](INTELLIGENCE-METHODOLOGY.md).

### No modo **E-mail**, vários `HIT // 200` suspeitos (Spotify, TikTok, Steam…)

Esperado hoje, e importante entender: o modo e-mail usa o **endereço inteiro, codificado** (`contato%40example.org`) como identificador nos detectores marcados como `both`. Muitos sites respondem `200` para qualquer caminho, e no preset de e-mail a baseline não está ativa. **Trate esses HIT como indício muito fraco.** O que o modo e-mail faz de confiável é o reconhecimento do próprio endereço (sintaxe, descartável, MX, Gravatar). Veja [GUIA do modo e-mail](USER-GUIDE.md#9-modo-e-mail). A melhoria está no [plano](PLANO-PAGINA-INICIAL.md).

### `rate_limited` em muitos sites ao mesmo tempo

A concorrência está alta para a sua conexão ou IP. Diminua em **Advanced settings → Probe concurrency** (Stealth 3, Balanced 6, Turbo 10 no lote) e use Standard.

### O Evidence Engine diz "4/8 checks" mesmo em uma conta encontrada

Normal. São 8 checks lógicos por resposta; nem todo site oferece canonical, redirecionamento coerente etc. O que importa é *quais* passaram (aba Evidence → sinais), não atingir 8/8.

### O mesmo handle deu resultados diferentes ontem e hoje

Sites mudam, bloqueios variam e o cache de resultados vale 5 minutos. Use o **Diff Intelligence** (aba Correlation → Case & Diff) para ver o que mudou entre dois snapshots. `DISAPPEARED` é uma diferença *entre coletas*, **não** prova de que a conta foi apagada.

---

## D. Exportação, casos e armazenamento

### O botão **Export** está desabilitado

Só habilita depois que existe pelo menos um resultado. Rode um scan ou reabra um caso.

### "Relatório sem SHA-256" ou manifest vazio

O hash usa a Web Crypto API do navegador, que exige **HTTPS ou `localhost`**. Se você abriu o app por um IP da rede em `http://`, o navegador a desativa. Acesse por `http://localhost:PORTA` ou publique com HTTPS.

### Meus casos sumiram

Casos e o cache dos 5 últimos scans ficam no **navegador** (IndexedDB e localStorage), por perfil e por origem (`localhost:3000` ≠ `127.0.0.1:3000` ≠ `localhost:3001`). Limpar dados do site, usar janela anônima ou trocar de navegador/porta mostra um estado vazio. Para levar uma investigação consigo, exporte o JSON/HTML. Detalhes e como apagar tudo: [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md).

### `403 Persistence is disabled on public instances` / `503 SQLite store unavailable`

- `403`: o servidor roda com `MINEIRO_PUBLIC=1`, que desliga o armazenamento de propósito.
- `503`: o Node não tem `node:sqlite` (precisa de 22.5+).

---

## E. Copiloto de IA (Gemini)

O copiloto é **opcional**. Todo o assessment determinístico funciona sem ele.

| Sintoma | Causa | O que fazer |
|---|---|---|
| "Gemini is not configured" (`503 not_configured`) | Sem chave pessoal nem `GEMINI_API_KEY` no servidor | Clique em **AI → Configure Gemini**, cole a chave e use **Test connection**. |
| `authentication` | Chave inválida, revogada ou sem permissão | Gere outra no Google AI Studio e teste de novo. |
| `rate_limited` | Cota do plano gratuito esgotada | Aguarde, use outro modelo no seletor ou outra chave. |
| `model_unavailable` | O modelo escolhido não existe para a sua chave | Escolha outro; o servidor já tenta os demais automaticamente. |
| `temporary_unavailable` | Sobrecarga ou *timeout* (15 s por modelo) | Tente novamente em instantes. |
| Em instância compartilhada a chave do servidor "não funciona" | O modo público **ignora** `GEMINI_API_KEY` do servidor | Cada pessoa usa a própria chave pessoal. |

> [!IMPORTANT]
> Ao usar o copiloto, o *assessment* local (alvo, URLs e sinais dos achados, até 100 evidências) é **enviado ao Google**. Se isso não é aceitável para o seu caso, não use o copiloto. Veja [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md#3-o-que-sai-da-sua-máquina).

---

## F. Google Colab

| Sintoma | Causa provável | Correção |
|---|---|---|
| "host not allowed" | Clone antigo do repositório | Rode a célula de atualização (abaixo) e reinicie o servidor. |
| O notebook abre, a UI não | Servidor não saudável | Veja o log (abaixo) e teste `/api/health`. |
| Perdi tudo ao reabrir | A VM do Colab é temporária | Exporte os relatórios antes de fechar; casos ficam no navegador, mas a VM não. |

Atualização limpa:

```python
%cd /content/Mineiro-OSINT-Extractor
!git checkout main
!git pull --ff-only
!npm ci --no-audit --no-fund
```

Log do servidor no Colab:

```python
!tail -n 80 /content/mineiro-server.log
```

Mais em [COLAB.md](COLAB.md).

---

## G. Desenvolvimento e CI

### `npm run check` falha em `registry:validate`

Não ajuste um detector só para "fazer o teste passar": o validador existe para impedir catálogo silenciosamente quebrado. Rode `npm run registry:stats` para ver o estado e leia [REGISTRY.md](../REGISTRY.md).

### `detectors:health` falha (drift)

Um site mudou a página e a regra declarativa deixou de distinguir presença de ausência. O relatório `detector-health.md` mostra qual canário falhou. Atualize a regra e a data em `registry/detectors/*.json` **depois de verificar manualmente** o site.

### `Version mismatch` em `npm run version:check`

A versão precisa ser idêntica em `package.json`, `package-lock.json`, `python/pyproject.toml`, `python/src/mineiro_osint/__init__.py`, `server.ts`, `server/routes/verify.ts` e nos dois README. O comando lista os que estão fora.

### `npm run e2e:start` falha

Precisa de um servidor em `:3400` e de um Chromium (`CHROME_PATH` ou `/opt/pw-browsers`). O teste faz um scan real, então depende de rede externa.

---

## Limites conhecidos

Estas são limitações atuais, não erros seus:

1. **Sem suporte a proxy explícito** (`HTTP(S)_PROXY` é ignorado).
2. **Catálogo ainda não auditado:** 0 dos 985 detectores têm proveniência verificada; só 3 têm regra declarativa confirmada ao vivo. Confiabilidade é uma estimativa.
3. **Modo e-mail com `both`:** usa o endereço inteiro como handle e pode gerar falsos positivos (veja acima).
4. **Alguns textos da interface não são traduzidos** (por exemplo, partes do modal *Advanced settings* aparecem em português mesmo em EN).
5. **Casos vivem no navegador**, não no servidor: não há sincronização entre máquinas.
6. **O atalho de cada visão** listado no modal de atalhos pode divergir das abas atuais (veja [Cheatsheet](CHEATSHEET.md#atalhos-de-teclado)).

---

## Como abrir uma issue útil

Rode e cole a saída:

```bash
mineiro --version && mineiro --check
curl -s localhost:3000/api/health
node --version
```

E informe:

- sistema operacional (ou Colab) e navegador;
- instalação (pip, código-fonte, Docker, Colab);
- preset usado (Quick/Standard/Full) e se era usuário ou e-mail;
- o `id` do detector e o campo `evidenceSignals` do item afetado (aba Evidence);
- passos mínimos para reproduzir e, se possível, uma captura de tela.

> [!CAUTION]
> **Não publique** chaves de API, cookies, tokens, relatórios com dados pessoais nem o nome de uma pessoa real investigada. Para reproduzir, use handles de organizações públicas (`forgejo`, `nodejs`…) ou sintéticos.
