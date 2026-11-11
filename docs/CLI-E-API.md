# Mineiro Username Intelligence · Linha de comando e API

**OSINT Investigation Workbench**

Referência para quem quer **iniciar** o Mineiro por terminal, **configurá-lo** por variáveis de ambiente ou **automatizar** consultas pela API local. Tudo aqui foi verificado contra a versão 1.7.0.

> [!NOTE]
> A API é **local e sem autenticação**: ela existe para a interface e para scripts na mesma máquina. Por padrão o `mineiro` escuta só em `127.0.0.1`. Não exponha a porta na internet sem proxy, autenticação e `MINEIRO_PUBLIC=1` (veja [DEPLOYMENT.md](DEPLOYMENT.md)).

## Sumário

1. [Comando `mineiro` (pip)](#1-comando-mineiro-pip)
2. [Rodar a partir do código](#2-rodar-a-partir-do-código)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Visão geral da API](#4-visão-geral-da-api)
5. [Referência dos endpoints](#5-referência-dos-endpoints)
6. [Limites de taxa e modo público](#6-limites-de-taxa-e-modo-público)
7. [Exemplo completo em Python](#7-exemplo-completo-em-python)

---

## 1. Comando `mineiro` (pip)

```bash
pip install mineiro-osint
mineiro
```

Sobe o servidor em `http://127.0.0.1:3000` (ou na próxima porta livre) e abre o navegador.

| Opção | Padrão | O que faz |
|---|---|---|
| `--host ENDEREÇO` | `127.0.0.1` | Endereço de escuta. Só altere com um motivo e uma camada de proteção na frente. |
| `--port N` | `3000` | Porta preferida. Se estiver ocupada, usa a próxima livre (até 50 tentativas). |
| `--no-browser` | desligado | Não abre o navegador (servidores, SSH, scripts). |
| `--data-dir CAMINHO` | `~/.mineiro` | Pasta do banco SQLite (`mineiro.sqlite`). |
| `--check` | | Diagnóstico e saída (veja abaixo). |
| `--version` | | Imprime `mineiro 1.7.0`. |

### `mineiro --check`

```text
mineiro 1.7.0
app bundle : ok (/…/site-packages/mineiro_osint/_app)
node       : /usr/bin/node
```

Código de saída `0` se o pacote do app existe **e** um Node compatível foi encontrado; `1` caso contrário. Use em scripts e em suporte.

### Qual Node é usado

1. o `node` do seu `PATH`, se for **≥ 22.5** (necessário para o SQLite embutido);
2. senão, o Node que acompanha o pacote `nodejs-wheel-binaries` (instalado junto com o `mineiro-osint`);
3. se nenhum servir, o comando explica como instalar e sai com código `1`.

### Outras formas de iniciar

| Forma | Quando usar |
|---|---|
| `python -m mineiro_osint` | Igual ao comando `mineiro`, útil dentro de ambientes virtuais. |
| `./iniciar-mineiro.sh` (Linux/macOS) | A partir do código-fonte; instala dependências na primeira vez e abre o navegador. `--check` mostra as versões de Node e npm. `MINEIRO_NO_BROWSER=1` não abre o navegador. |
| `Iniciar-Mineiro.bat` (Windows) | Mesmo papel do script acima; `--check` também existe. |
| `Iniciar-Mineiro.command` (macOS) | Duplo clique no Finder. |

---

## 2. Rodar a partir do código

Pré-requisito: Node.js 22+.

```bash
npm ci --no-audit --no-fund    # instalação reprodutível (usa o package-lock.json)
npm run dev                    # desenvolvimento, com recarga; http://localhost:3000
npm run build && npm start     # produção: gera dist/ e roda dist/server.cjs
```

Comandos úteis:

| Comando | Para quê |
|---|---|
| `npm run check` | O mesmo portão do CI (marca, i18n, grafo, casos, registry, tipos, testes, demo, manual, Colab, docs, build). |
| `npm test` | Testes unitários (Vitest). |
| `npm run e2e:start` | Teste ponta a ponta da tela inicial (precisa de servidor rodando em `:3400`). |
| `npm run registry:stats` / `registry:validate` | Estatísticas e validação do catálogo de detectores. |
| `npm run detectors:validate` / `detectors:health` | Valida as regras declarativas / consulta os canários nos sites reais. |
| `npm run build:python` | Empacota o app dentro do pacote pip (`python/src/mineiro_osint/_app`). |
| `npm run version:check` | Confere se a versão é a mesma em todos os lugares onde aparece. |

---

## 3. Variáveis de ambiente

Defina-as no shell ou em um arquivo `.env` na raiz (veja `.env.example`). **Nunca** faça commit de chaves.

| Variável | Padrão | Efeito |
|---|---|---|
| `PORT` | `3000` | Porta HTTP. |
| `HOST` | `0.0.0.0` (código-fonte/Docker) · `127.0.0.1` (comando `mineiro`) | Endereço de escuta. |
| `NODE_ENV` | | `production` serve o `dist/` já compilado; qualquer outro valor usa o Vite em modo desenvolvimento. |
| `GEMINI_API_KEY` | vazio | Chave do Gemini no **servidor**, para o copiloto de IA. Opcional. Ignorada em modo público. |
| `MINEIRO_PUBLIC` | desligado | `1` ativa o modo para instâncias compartilhadas ([seção 6](#6-limites-de-taxa-e-modo-público)). |
| `MINEIRO_DB` | `data/mineiro.sqlite` (código) · `~/.mineiro/mineiro.sqlite` (comando `mineiro`) | Arquivo SQLite. Use `:memory:` para não gravar nada. |
| `MINEIRO_TRUST_PROXY` | desligado | `1` quando há proxy reverso, para que o limite de taxa use o IP real do cliente. |
| `MINEIRO_HOST_CONCURRENCY` | `4` | Máximo de requisições simultâneas **por site**. |
| `MINEIRO_CACHE_TTL_MS` | `300000` (5 min) | Validade do cache de resultados do `/api/osint/verify`. |
| `MINEIRO_USER_AGENT` | vazio | Se definido, substitui o User-Agent de **todas** as sondagens. Útil para se identificar com um contato (`MeuProjeto/1.0 (+https://…)`). |
| `MINEIRO_ENABLE_LEGACY_PROFILE` | desligado | `1` reativa o endpoint legado `/api/osint/profile` (desativado por padrão; veja a [seção 5.12](#514-legado-apiosintprofile)). |
| `CHROME_PATH` | | Só para os scripts de captura/teste; caminho de um Chromium. |

> [!TIP]
> `APP_URL` aparece no `.env.example` por herança, mas **nenhum código o lê**. Pode ignorar.

---

## 4. Visão geral da API

- **Base:** `http://127.0.0.1:3000` (ajuste a porta).
- **Formato:** JSON. Envie `Content-Type: application/json` nos `POST`.
- **Tamanho máximo do corpo:** 2 MB.
- **Erros:** `4xx/5xx` com `{ "error": "mensagem" }`.
- **Atenção:** o `/api/osint/verify` responde **HTTP 200 mesmo quando o site está bloqueado ou expirou**; o resultado vem no campo `status` (`uncertain`, `error`, …). `4xx` significa *requisição inválida*, não *site inalcançável*.

| Grupo | Endpoints |
|---|---|
| Sistema | `GET /api/health` |
| Catálogo | `GET /api/registry/stats` · `GET /api/registry/detectors` · `POST /api/registry/benchmark` |
| Sondagem | `POST /api/osint/verify` · `POST /api/osint/email-recon` |
| Apoio à investigação | `POST /api/osint/variants` · `POST /api/osint/pivots` · `POST /api/osint/avatar-hash` · `POST /api/osint/wayback` · `GET /api/osint/br/cnpj/:cnpj` |
| Armazenamento | `POST /api/store/observations` · `POST /api/store/claims` · `GET /api/store/timeline` · `GET /api/store/export/stix` |
| IA | `GET /api/intelligence/copilot/status` · `POST /api/intelligence/copilot` · `POST /api/osint/gemini-validate` |

---

## 5. Referência dos endpoints

### 5.1 `GET /api/health`

```bash
curl -s localhost:3000/api/health
```

```json
{
  "status": "ok",
  "service": "Mineiro Username Intelligence · OSINT Investigation Workbench",
  "version": "1.7.0",
  "timestamp": "2026-10-02T04:57:16.355Z",
  "geminiConfigured": false,
  "publicMode": false,
  "supportedDatabases": ["Mineiro Core (local direct probes)", "Mineiro Evidence Engine", "Mineiro Public Recon"]
}
```

`geminiConfigured` só é `true` se a chave estiver no servidor **e** o modo público estiver desligado.

### 5.2 `GET /api/registry/stats`

Resumo do catálogo (totais, por categoria, tipo de site, nível de confiabilidade e proveniência).

```bash
curl -s localhost:3000/api/registry/stats | python3 -m json.tool | head -20
```

Valores desta versão: `totalDetectors: 985`, `scannableDetectors: 984`, `registryOnlyDetectors: 1`, `logicalEvidenceChecks: 7880` (985 × 8), `averageReliability: 80`.

> [!IMPORTANT]
> `verifiedDetectors` é **0** e `auditRequiredDetectors` é **985**: nenhum detector passou ainda pela auditoria de proveniência completa. Só 3 têm **regra declarativa verificada ao vivo** (Codeberg, DEV, Keybase), em `registry/detectors/`. Leia [REGISTRY.md](../REGISTRY.md).

### 5.3 `GET /api/registry/detectors`

Filtros por *query string*, todos opcionais e combináveis:

| Parâmetro | Valores |
|---|---|
| `category` | `developer`, `social`, `gaming`, `security`, `creative`, `crypto`, `community`, `media` |
| `tier` | `high`, `medium`, `experimental` |
| `provenance` | `verified`, `legacy-audit-required`, `external-attributed` |

```bash
curl -s "localhost:3000/api/registry/detectors?category=crypto" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['count'])"
# 45
```

Cada item traz `id`, `name`, `category`, `siteType`, `urlPattern` (com `{username}`), `checkMethod`, `detectorReliability`, `reliabilityTier`, `provenanceStatus`, `licenseStatus`, `optionalEvidenceChecks`, `lastVerified` e `scannable`.

### 5.4 `POST /api/registry/benchmark`

Calcula precisão, revocação e taxa de falso positivo de detectores a partir de observações **rotuladas por você** (não faz nenhuma requisição à internet).

```bash
curl -s -XPOST localhost:3000/api/registry/benchmark -H 'content-type: application/json' -d '{
  "detectorIds": ["codeberg"],
  "observations": [
    {"detectorId":"codeberg","expected":"present","observed":"found","timestamp":"2026-10-02T00:00:00Z"},
    {"detectorId":"codeberg","expected":"absent","observed":"not_found","timestamp":"2026-10-02T00:00:00Z"}
  ]
}'
```

```json
{"detectors":1,"observations":2,"metrics":[{"detectorId":"codeberg","samples":2,"truePositive":1,"trueNegative":1,"falsePositive":0,"falseNegative":0,"inconclusive":0,"precision":1,"recall":1,"falsePositiveRate":0,"availability":100,"benchmarkScore":100}]}
```

`expected`: `present` | `absent`. `observed`: `found` | `not_found` | `uncertain` | `rate_limited` | `error`. Limite: **10.000** observações por requisição (`400` acima disso). IDs desconhecidos são ignorados.

### 5.5 `POST /api/osint/verify`

O coração da coleta: sonda **um** detector para **um** handle.

```bash
curl -s -XPOST localhost:3000/api/osint/verify -H 'content-type: application/json' -d '{
  "platformId": "codeberg",
  "url": "https://codeberg.org/forgejo",
  "username": "forgejo",
  "enableEvidenceChecks": true,
  "baseline": true,
  "scanDepth": "fast",
  "wafRetryStrategy": "none"
}'
```

| Campo | Obrigatório | Padrão | Descrição |
|---|:--:|---|---|
| `platformId` | ✔ | | Id de um detector escaneável do catálogo. |
| `url` | ✔ | | **Precisa ser exatamente o que o padrão do detector produz** (`{username}` substituído, com *URL-encoding*). Qualquer outra URL é recusada. |
| `username` | | `""` | O handle, usado nos checks de evidência e no baseline. |
| `enableEvidenceChecks` | | `false` | Liga os 8 checks lógicos (lê até 192 KB do corpo). |
| `baseline` | | `false` | Também consulta um handle aleatório que não pode existir e compara (a [baseline diferencial](INTELLIGENCE-METHODOLOGY.md)). Dobra as requisições ao site na primeira vez; o controle fica em cache 15 min por detector. |
| `scanDepth` | | `deep` | `fast` (limite de 2,5 s) ou `deep` (6,5 s). |
| `timeoutMs` | | por profundidade | Entre 1000 e 12000 ms. |
| `wafRetryStrategy` | | `adaptive` em `deep`, `none` em `fast` | `adaptive` faz **uma** segunda tentativa com cabeçalhos de navegador após 403/429/503 ou desafio de borda. A interface sempre usa `none`. |
| `expectedStatus` / `errorStatus` | | `200` / `404` | Códigos de presença e de ausência. |
| `detectorReliability` | | `60` | Entra no cálculo da confiança. |

**Resposta (resumida):**

```json
{
  "platformId": "codeberg",
  "url": "https://codeberg.org/forgejo",
  "status": "found",
  "statusCode": 200,
  "confidenceScore": 85,
  "evidenceLevel": "confirmed",
  "evidenceSignals": ["http_status:200", "no_redirect", "username_in_final_url",
                      "baseline_status_differs:200_vs_404", "rule_present:status"],
  "evidenceChecksPassed": 6,
  "evidenceChecksTotal": 8,
  "baselineSimilarity": 0,
  "evidenceHash": "6911cb09888cffa2d787eb8376672b708dd2db93dea5e96597a94e3762a88c91",
  "collectedAt": "2026-10-02T04:58:20.006Z",
  "detectorVersion": "declarative:2026-10-02",
  "scanDepth": "fast",
  "responseTimeMs": 711,
  "wafRetried": false
}
```

| Campo | Significado |
|---|---|
| `status` | `found` · `not_found` · `uncertain` · `rate_limited` · `error` |
| `evidenceLevel` | `confirmed` · `probable` · `uncertain` · `absent` |
| `confidenceScore` | 0–100. **Confiança desta observação**, não prova de identidade. |
| `evidenceSignals` | Lista de sinais; veja o [glossário](GLOSSARIO.md#sinais-de-evidência). |
| `evidenceHash` | SHA-256 de `status + URL final + corpo lido`. Só existe quando o corpo foi lido. |
| `detectorVersion` | `declarative:AAAA-MM-DD` quando há regra declarativa verificada; senão a data de verificação do catálogo ou `legacy`. |
| `cached: true` | Aparece quando a resposta veio do cache de 5 min. |
| `uncertainReason` | Texto humano quando `status` é `uncertain`. |

**Erros de requisição (`400`):**

| Mensagem | Causa |
|---|---|
| `platformId and url are required` | Faltou campo. |
| `Unknown or non-scannable detector` | Id inexistente ou detector só de catálogo. |
| `URL does not match the detector pattern` | A URL não é a que o detector gera (proteção contra SSRF). |
| `Non-public address literal`, `Internal hostname`, `Port not allowed`… | URL aponta para IP privado, `localhost`, porta fora de 80/443 etc. |

### 5.6 `POST /api/osint/email-recon`

Reconhecimento **do endereço** (não de perfis): sintaxe, descartável, provedor comum, registros MX, existência de Gravatar.

```bash
curl -s -XPOST localhost:3000/api/osint/email-recon -H 'content-type: application/json' -d '{"email":"contato@example.org"}'
```

```json
{"email":"contato@example.org","username":"contato","domain":"example.org","isValidSyntax":true,
 "isDisposable":false,"isCommonProvider":false,"mxRecordsFound":true,"mxServers":[""],
 "gravatarExists":false,"hash":"80ec827a9b912549cb1b7ef896422361","associatedFootprint":[]}
```

> [!NOTE]
> O campo `hash` é o **MD5** do e-mail em minúsculas, que é o formato que o Gravatar exige. Não é um hash de segurança nem de integridade.

### 5.7 `POST /api/osint/variants`

Variantes de um username, ordenadas por similaridade (Jaro-Winkler, 0–100). Candidatos, **nunca** identidade.

```bash
curl -s -XPOST localhost:3000/api/osint/variants -H 'content-type: application/json' -d '{"username":"forgejo","max":4}'
# {"variants":[{"value":"forgejo_","kind":"suffix","similarity":98}, …]}
```

`max` padrão 40, teto 100. Usernames fora de 2–40 caracteres devolvem lista vazia. `kind`: `separator`, `leet`, `suffix`, `prefix`, `translit`, `case`, `reverse-digits`.

### 5.8 `POST /api/osint/pivots`

Extrai pistas (e-mails, domínios, handles, URLs de plataformas) de textos públicos e as planeja dentro de um orçamento.

```bash
curl -s -XPOST localhost:3000/api/osint/pivots -H 'content-type: application/json' -d '{
  "sources": [{"origin":"devto","text":"contato dev@forgejo.org https://forgejo.org @forgejo","depth":1}],
  "maxDepth": 2, "budget": 5, "seen": []
}'
```

Retorna `{ "accepted": [...], "skipped": [{..., "reason": "seen|depth|budget"}] }`. Limites: até 200 fontes, 20.000 caracteres por texto, `maxDepth` ≤ 3 (padrão 2), `budget` ≤ 100 (padrão 25). Ordem de prioridade: e-mail, handle, domínio, URL.

### 5.9 `POST /api/osint/avatar-hash`

Hash perceptual (dHash de 64 bits) de um avatar, para comparar imagens entre contas. **Desativado em modo público.**

```bash
curl -s -XPOST localhost:3000/api/osint/avatar-hash -H 'content-type: application/json' \
  -d '{"avatarUrl":"https://exemplo.org/avatar.png","compareWith":"f0e0c0c0c0e0f0f8"}'
# {"hash":"…16 hex…","similarity":93}
```

Aceita PNG e JPEG de até 2 MB, com 8 s de limite, pelo mesmo cliente protegido (só IPs públicos). `similarity` (0–100) só aparece se `compareWith` tiver 16 caracteres hexadecimais.

### 5.10 `POST /api/osint/wayback`

Linha do tempo no Internet Archive para uma URL de perfil **que um detector possa gerar**.

```bash
curl -s -XPOST localhost:3000/api/osint/wayback -H 'content-type: application/json' \
  -d '{"platformId":"devto","url":"https://dev.to/ben"}'
```

Retorna `{ snapshots, firstSeen, lastSeen, statusCodes, sample[] }`. `502` se o Archive recusar ou expirar.

### 5.11 `GET /api/osint/br/cnpj/:cnpj`

Consulta de **empresa** na BrasilAPI. Envie só os 14 dígitos.

```bash
curl -s localhost:3000/api/osint/br/cnpj/00000000000191
```

```json
{"cnpj":"00000000000191","legalName":"BANCO DO BRASIL SA","tradeName":"DIRECAO GERAL","status":"ATIVA",
 "openedAt":"1966-08-01","mainActivity":"Bancos múltiplos, com carteira comercial",
 "city":"BRASILIA","state":"DF","partnerCount":41,"source":"brasilapi.com.br"}
```

`400 Invalid CNPJ` (dígitos verificadores inválidos), `404` (não encontrado), `502` (BrasilAPI indisponível). Por minimização de dados (LGPD), **nomes de sócios nunca são devolvidos**, só a contagem.

### 5.12 Armazenamento (`/api/store/*`)

SQLite local no modelo **Entidade → Observação → Alegação**. Desativado em modo público (`403`) e retorna `503` se o Node não tiver `node:sqlite`.

**Gravar observações** (até 2.000 por requisição, em transação: ou entra tudo ou nada):

```bash
curl -s -XPOST localhost:3000/api/store/observations -H 'content-type: application/json' -d '{
  "observations": [{
    "entity": {"type":"username","value":"forgejo"},
    "source": "Codeberg", "detectorId": "codeberg", "status": "found",
    "confidence": 93, "url": "https://codeberg.org/forgejo", "evidenceHash": "6911cb09…"
  }]
}'
# {"stored":1,"ids":[1]}
```

`entity.type`: `username` · `email` · `domain` · `url` · `avatar-hash` · `company`. Campos opcionais: `detectorVersion`, `collectedAt`, `raw`.

**Alegações** (inferências) **exigem evidência**:

```bash
curl -s -XPOST localhost:3000/api/store/claims -H 'content-type: application/json' -d '{
  "subject":{"type":"username","value":"forgejo"}, "predicate":"linked_to",
  "object":{"type":"username","value":"forgejo_dev"}, "confidence":60, "observationIds":[]
}'
# 400 {"error":"A claim must reference at least one observation."}
```

Predicados usados: `same_operator_as`, `owns`, `mentions`, `linked_to`. A confiança é limitada a 0–100. Referenciar IDs de observação inexistentes também dá `400`.

**Linha do tempo:** `GET /api/store/timeline?type=username&value=forgejo` (mais recentes primeiro, até 1000).

**Exportar STIX 2.1:** `GET /api/store/export/stix?username=forgejo` devolve um *bundle* com `identity`, `user-account`, `url` e `observed-data` para cada conta **encontrada**, com `confidence` e `x_mineiro_evidence_hash`. Os IDs são determinísticos: exportar de novo gera os mesmos objetos.

### 5.13 IA (Gemini)

| Endpoint | O que faz |
|---|---|
| `GET /api/intelligence/copilot/status` | `{ configured, source: "personal"\|"server"\|"none", defaultModel, supportedModels, provider }`. Envie `x-gemini-api-key` para testar uma chave pessoal. |
| `POST /api/osint/gemini-validate` | Testa chave e modelo (8 s). Devolve `{ valid, isConfigured, isCustom, modelTested, message, … }`. |
| `POST /api/intelligence/copilot` | Recebe o *assessment* local e devolve a síntese. |

Modelos aceitos: `gemini-3.8-flash` (padrão), `gemini-3.7-flash`, `gemini-3.5-flash-lite`, `gemini-flash-latest`. O servidor tenta o escolhido e, se falhar por motivo que não seja credencial, os demais, com 15 s por modelo.

`POST /api/intelligence/copilot` — corpo: `{ targetLabel, assessment, analystQuestion?, model?, customApiKey? }`, mais o cabeçalho opcional `x-gemini-api-key`. No máximo **100** registros em `assessment.evidence`. Resposta de sucesso:

```json
{
  "executiveBrief": "…", "priorityEvidenceIds": ["E-001"],
  "contradictionsToResolve": [], "intelligenceGaps": [{"question":"…","importance":"HIGH","rationale":"…"}],
  "recommendedPivots": [{"priority":"HIGH","action":"…","rationale":"…"}],
  "alternativeHypotheses": [], "confidenceCaveat": "…",
  "droppedEvidenceIds": [], "modelUsed": "gemini-3.8-flash",
  "attemptedModels": ["gemini-3.8-flash"], "generatedAt": "…",
  "provenance": { "type": "AI_SYNTHESIZED", "factualConfidenceRaised": false }
}
```

`droppedEvidenceIds` lista IDs que o modelo citou e **não existem** no *assessment*: eles são descartados de `priorityEvidenceIds`.

| HTTP | `errorType` | Significado |
|---|---|---|
| `503` | `not_configured` | Sem chave (nem pessoal nem do servidor). |
| `502` | `authentication` | Chave recusada. |
| `502` | `rate_limited` | Cota esgotada. |
| `502` | `model_unavailable` | Modelo inexistente para essa chave. |
| `502` | `temporary_unavailable` | Sobrecarga ou *timeout*. |
| `502` | `provider_error` | Qualquer outro erro do provedor. |

### 5.14 Legado: `/api/osint/profile`

Desativado por padrão: responde `410` com a indicação de usar o copiloto. Só volta com `MINEIRO_ENABLE_LEGACY_PROFILE=1`. Não é recomendado: a síntese "de perfil" especulativa foi substituída pelo copiloto ligado à evidência.

---

## 6. Limites de taxa e modo público

Limite por IP, com balde de fichas. Ao estourar: `429`, cabeçalho `Retry-After` e `{ "error": "Rate limit exceeded", "limit": "<grupo>" }`.

| Grupo | Rotas | Local | Modo público |
|---|---|---:|---:|
| `verify` | `/api/osint/verify` | 6000/min (rajada 600) | 120/min (rajada 40) |
| `ai` | `/api/intelligence/*`, `/api/osint/gemini-validate`, `/api/osint/email-recon`, `/api/osint/profile` | 60/min | 10/min |
| `extras` | `/api/osint/wayback`, `avatar-hash`, `br/*`, `pivots`, `variants` | 300/min | 20/min |

**`MINEIRO_PUBLIC=1`** existe para instâncias compartilhadas. Ele: reduz os limites acima; **ignora** `GEMINI_API_KEY` do servidor (cada pessoa usa a própria chave); **desativa** `/api/store/*` e `/api/osint/avatar-hash` com `403`; e exibe "instância compartilhada" na tela inicial. Não substitui autenticação.

Além disso, todo `verify` aplica **no máximo 4 requisições simultâneas por site** (`MINEIRO_HOST_CONCURRENCY`) e guarda o resultado por 5 minutos (`MINEIRO_CACHE_TTL_MS`).

---

## 7. Exemplo completo em Python

[`examples/api_scan.py`](../examples/api_scan.py) usa só a biblioteca padrão. Ele lista detectores, monta a URL de cada um, chama `verify` com evidência e baseline, imprime uma tabela e, opcionalmente, grava as observações no SQLite.

```bash
mineiro --no-browser &
python3 examples/api_scan.py forgejo --ids codeberg devto keybase --store
```

```text
detector       status     http  conf  evidência  hash
codeberg       found      200   85    confirmed  55c02aafc675
devto          not_found  404   90    absent     a942cd0f1c9d
keybase        not_found  404   90    absent     9f42efef2670

store: HTTP 200 {'stored': 3, 'ids': [2, 3, 4]}
```

Opções: `--category crypto --limit 10` (em vez de `--ids`), `--jsonl saida.jsonl` (resultado bruto), `--base http://127.0.0.1:3001`.

> [!WARNING]
> Scripts não deveriam sondar centenas de sites em paralelo sem necessidade. Respeite os limites dos sites, mantenha `wafRetryStrategy: "none"` e trate `uncertain` como inconclusivo, nunca como convite para insistir.
