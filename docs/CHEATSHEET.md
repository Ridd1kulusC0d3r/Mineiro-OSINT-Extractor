# Mineiro Username Intelligence · Cheatsheet

**OSINT Investigation Workbench**

Uma página para consulta rápida. Detalhes e contexto em [USER-GUIDE.md](USER-GUIDE.md). Valores verificados na versão **1.7.0**.

## Sumário

[Comandos](#comandos) · [Presets de scan](#presets-de-scan) · [Atalhos de teclado](#atalhos-de-teclado) · [Selos e status](#selos-e-status) · [Pontuações](#pontuações) · [Sinais de evidência](#sinais-de-evidência) · [Consultas no grafo](#consultas-no-grafo-mgq) · [CSV de lote](#csv-de-lote) · [Onde ficam os dados](#onde-ficam-os-dados) · [Limites do servidor](#limites-do-servidor) · [API em uma tela](#api-em-uma-tela)

---

## Comandos

| Quero… | Comando |
|---|---|
| Instalar e abrir | `pip install mineiro-osint && mineiro` |
| Não abrir o navegador | `mineiro --no-browser` |
| Outra porta | `mineiro --port 8080` |
| Diagnóstico | `mineiro --check` |
| Rodar do código | `npm ci && npm run dev` |
| Validar tudo | `npm run check` |
| Testes unitários | `npm test` |
| Estado do servidor | `curl -s localhost:3000/api/health` |
| Scan por script | `python3 examples/api_scan.py forgejo --ids codeberg devto` |

---

## Presets de scan

| | Quick | Standard | Full | Email-only |
|---|---:|---:|---:|---:|
| Escopo | Top 20 | Top 50 | todos | nenhum |
| **Detectores · usuário** | **19** | **49** | **984** | 0 |
| **Detectores · e-mail** | 13 | 31 | 59 | 0 |
| Concorrência | 10 | 8 | 6 | 8 |
| Timeout | 2,5 s | 4,5 s | 6,5 s | 2,5 s |
| Evidence Engine + baseline | ✗ | ✓ | ✓ | ✗ |
| Reconhecimento de e-mail (MX, Gravatar) | ✗ | ✓ | ✓ | ✓ |
| Duas fases (progressivo) | ✗ | ✗ | ✓ | ✗ |
| Nova tentativa adaptativa | ✗ | ✗ | ✗ | ✗ |

A interface mostra "20 / 50 / 985" por arredondamento. **A nova tentativa adaptativa nunca é usada pela interface**, em nenhum preset.

---

## Atalhos de teclado

`Ctrl` vale como `⌘` no macOS. Os atalhos **com modificador** funcionam mesmo com um campo de texto focado; os **sem modificador** só quando nenhum campo está focado.

| Tecla | Ação |
|---|---|
| `Ctrl+K` | Foca e seleciona o campo de alvo da **barra do topo** |
| `Ctrl+Enter` | Executa o scan (não para um scan em andamento) |
| `Ctrl+E` | Abre a exportação |
| `Ctrl+B` | Abre a importação em lote |
| `Ctrl+H` | Abre o histórico (Cases) |
| `Ctrl+M` | Abre a configuração avançada |
| `Esc` | Fecha o modal aberto; senão, limpa o alvo/filtro ou tira o foco |
| `/` | Foca o filtro (só nas abas **Evidence** e **Platforms**) |
| `?` | Abre/fecha a lista de atalhos |
| `D` | Alterna Fast (2,5 s) ↔ Deep (6,5 s); vira `custom` |
| `1` | **Dashboard** (sem aba) |
| `2` | Platforms (cartões) |
| `3` | Evidence (tabela) |
| `4` | Área **AI** |
| `5` | Correlation |
| `6` | Console |
| `7` | Batch |

> [!NOTE]
> Divergências entre o atalho real e o modal de atalhos: a tecla `1` abre o **Dashboard** pelo teclado, mas o clique na linha do modal leva à aba Intelligence; a tecla `7` funciona, mas não está listada no modal. Os atalhos sem modificador também disparam com um modal aberto, se nenhum campo estiver focado.

---

## Selos e status

| Selo na tela | `status` | Significado | Cuidado |
|---|---|---|---|
| `HIT // 200` | `found` | Respondeu como se existisse | Indício, não prova. Em Quick, falsos positivos são esperados |
| `404 ABSENT` | `not_found` | Ausência confirmada (404, soft-404, baseline idêntica, regra) | Também cobre qualquer resposta não-2xx que não seja bloqueio |
| `UNCERTAIN` | `uncertain` | Bloqueio, WAF, timeout, resposta 2xx inesperada | Não é "não existe" |
| `RATE_LMT` | `rate_limited` | HTTP 429 do site | Reduza a concorrência |
| `ERROR` | `error` | Falha antes do veredito | Veja o *tooltip* |
| `SCANNING` · `QUEUED` | `scanning` · `pending` | Em andamento / na fila | |

`evidenceLevel`: `confirmed` · `probable` · `uncertain` · `absent` (aparece no JSON exportado e nos detalhes; a tabela não o exibe).

---

## Pontuações

| Nome | Faixa | Em uma frase |
|---|---|---|
| Detector Reliability | 0–100 | A regra deste site costuma ser confiável? (estimativa do catálogo; média atual 80) |
| Observation Confidence | 0–100 | Esta consulta foi conclusiva? |
| Correlation Confidence | 0–100 | Este achado ajuda a sustentar relação com outros? |
| Source Quality | A–E | Força da fonte pública (na prática B–E; A exige metadados que os scans não capturam) |
| IPS | 0–100 | Vale revisar este achado antes dos demais? (**não mede risco de pessoa**) |

Fórmulas em [INTELLIGENCE-METHODOLOGY.md](INTELLIGENCE-METHODOLOGY.md#como-os-números-são-calculados).

---

## Sinais de evidência

Os 8 *checks* lógicos (cada um emite um sinal positivo ou negativo):

| Check | Sinal positivo | Sinal negativo |
|---|---|---|
| Status HTTP | `http_status:200` | `http_status:<código>` |
| Ausência explícita | `explicit_absence_status` | `absence_status_not_observed` |
| Redirecionamento | `no_redirect` | `final_host:<host>` |
| Username na URL final | `username_in_final_url` | `username_not_in_final_url` |
| Username no corpo | `username_token_in_body` | `username_token_not_observed` |
| Canonical | `canonical_consistent` | `canonical_not_confirmed` |
| Soft-404 | `no_soft_404_hint` | `soft_404_hint_detected` |
| Proteção de borda | `no_edge_protection_signal` | `edge_protection_detected` |

Baseline: `baseline_status_differs:A_vs_B` · `baseline_redirect_shape_differs` · `baseline_distinct_from_absent_profile` · `baseline_identical_to_absent_profile` · `baseline_unavailable`.
Regras declarativas: `rule_present:<tipo>` · `rule_absent:<tipo>` · `rule_inconclusive`.
Sem Evidence Engine: `expected_status_match` / `unexpected_status`. Bloqueios: `request_blocked`.

Um perfil `found` sempre falha o check de ausência explícita, então o máximo prático é **7/8**. Significado completo: [GLOSSARIO.md](GLOSSARIO.md#sinais-de-evidência).

---

## Consultas no grafo (MGQ)

Cláusulas separadas por `AND` (não há `OR`), sem diferenciar maiúsculas.

```text
MATCH type=PROFILE
MATCH candidate=true AND similarity>=70
type=USERNAME_CANDIDATE AND label~dev
MATCH label~"git"
EDGE relationship=SAME_DOMAIN
EDGE confidence>=80
SHARED type=DOMAIN
PATH from=TARGET to=PROFILE
```

`EDGE`, `SHARED` e `PATH` **substituem** o conjunto de nós em vez de intersectar com cláusulas anteriores. Consulta vazia = grafo inteiro. Guia: [GRAPH-HUNTING.md](GRAPH-HUNTING.md).

---

## CSV de lote

```csv
target,type,notes
forgejo,username,organização
nodejs,username,
```

- Uma entrada **por linha**; só a primeira coluna é lida sem cabeçalho.
- Cabeçalhos: alvo `target|username|handle|identifier|account|query|user|name` · tipo `type|targettype|mode|category` · notas `notes|note|comment|description|role|tag`.
- Comece com uma linha de cabeçalho: uma primeira linha que contenha `target`, `username` ou `email` é descartada como cabeçalho.
- Concorrência do lote: Stealth 3 · Balanced 8 · Turbo 16.

---

## Onde ficam os dados

| O quê | Onde | Como apagar |
|---|---|---|
| Casos (snapshots) | IndexedDB `mineiro_cases_v1` (navegador) | Lixeira em **Cases**, ou limpar dados do site |
| Cache dos 5 últimos scans | `localStorage` · `mineiro_cached_scans_v1` | **Clear All History** |
| Chave do Gemini | `localStorage` · `mineiro_gemini_key` (texto puro) | **Clear** no modal do Gemini |
| Idioma · tema · modelo | `mineiro_language_preference` · `mineiro_theme_preference` · `mineiro_gemini_model` | Limpar dados do site |
| SQLite opcional (API) | `~/.mineiro/mineiro.sqlite` (pip) · `data/mineiro.sqlite` (código) | Apagar o arquivo |
| Lote | só memória | Fechar a aba |

Detalhes: [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md).

---

## Limites do servidor

| Limite | Valor |
|---|---|
| Timeout por consulta | 1–12 s (padrão 2,5 s fast · 6,5 s deep) |
| Conexões simultâneas por site | 4 (`MINEIRO_HOST_CONCURRENCY`) |
| Redirecionamentos | até 5, só http/https nas portas 80/443, sem IPs privados |
| Corpo lido | até 192 KiB |
| Cache de resultado | 5 min (`MINEIRO_CACHE_TTL_MS`) · baseline 15 min por detector |
| Corpo JSON da API | 2 MB |
| Taxa local `verify` | 6000/min (rajada 600) · público 120/min (rajada 40) |
| Casos | 40 snapshots e 40 pivôs por caso |
| Cópia no navegador | 5 scans em cache |
| Copiloto | 100 evidências aceitas · 30 enviadas ao Gemini · pergunta ≤ 1000 caracteres |

---

## API em uma tela

```text
GET  /api/health                      POST /api/osint/verify
GET  /api/registry/stats              POST /api/osint/email-recon
GET  /api/registry/detectors          POST /api/osint/variants
POST /api/registry/benchmark          POST /api/osint/pivots
GET  /api/intelligence/copilot/status POST /api/osint/avatar-hash   (não em modo público)
POST /api/intelligence/copilot        POST /api/osint/wayback
POST /api/osint/gemini-validate       GET  /api/osint/br/cnpj/:cnpj
POST /api/store/observations          GET  /api/store/timeline?type=&value=
POST /api/store/claims                GET  /api/store/export/stix?username=
```

Referência completa com exemplos reais: [CLI-E-API.md](CLI-E-API.md).
