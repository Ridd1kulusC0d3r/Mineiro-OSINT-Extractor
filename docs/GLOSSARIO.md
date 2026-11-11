# Mineiro Username Intelligence · Glossário

**OSINT Investigation Workbench**

Termos usados na interface, nos relatórios e na API, com o significado **exato** que têm no Mineiro. Para os cálculos, veja [INTELLIGENCE-METHODOLOGY.md](INTELLIGENCE-METHODOLOGY.md).

**Atalhos:** [A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [K](#k) · [L](#l) · [M](#m) · [O](#o) · [P](#p) · [R](#r) · [S](#s) · [U](#u) · [W](#w) · [Sinais de evidência](#sinais-de-evidência)

---

## A

**Absent (`404 ABSENT`, `not_found`)** · Ausência confirmada pela resposta do site (404, *soft-404* detectado, baseline idêntica à página de ausência ou regra declarativa). Também é o resultado de qualquer resposta não-2xx que não seja um bloqueio. Não é prova de que a conta *nunca* existiu.

**Alegação (*claim*)** · No armazenamento SQLite: uma inferência ligando duas entidades (por exemplo, `linked_to`). **Precisa citar observações existentes**; sem isso a API recusa. Veja [CLI-E-API](CLI-E-API.md#512-armazenamento-apistore).

**Assessed** · Coluna do *Executive view*: o que foi **avaliado** (julgamentos), em oposição ao que é *Known* (observado) e *Unknown* (lacuna).

**Assessment** · A avaliação estruturada que o relatório monta a partir dos resultados: cobertura, evidências, clusters, hipóteses, contradições, lacunas, pivôs e plano.

## B

**Baseline diferencial** · Técnica contra falsos positivos: o Mineiro também consulta um handle aleatório que não pode existir (`zq…` + 18 caracteres) e compara a página do alvo com essa página de controle (status, forma do redirecionamento, esqueleto do DOM, título, texto). Se forem indistinguíveis, o resultado vira *absent*. Ligada em **Standard** e **Full**.

**Bloqueio** · Resposta que impede a leitura do perfil (403, 429, 503, desafio de borda). Vira `UNCERTAIN` ou `RATE_LMT`. O Mineiro não tenta contorná-lo.

## C

**Canário** · Par de handles de teste de um detector declarativo: um que **deve** existir e um que **não deve**. O fluxo semanal `detector-health` verifica ambos nos sites reais e abre uma issue se a regra deixar de distinguir os dois (*drift*).

**Canonical** · Marcação `<link rel="canonical">` da página. O check `canonical_match` confere se aponta para o mesmo host e contém o handle.

**Caso (*case*)** · Memória persistente de um alvo no IndexedDB do navegador: snapshots de cada scan e pivôs. Até 40 + 40. Veja [USER-GUIDE §11](USER-GUIDE.md#11-casos-e-diff-intelligence).

**Cluster** · Agrupamento de achados por tipo de serviço (desenvolvimento, social, jogos…) para descrever a **pegada pública observada**. Não descreve personalidade.

**Collection coverage (cobertura)** · Quantos detectores foram solicitados, concluídos e *conclusivos* (`found` + `absent`). A cobertura efetiva é `conclusivos ÷ solicitados`.

**Contradictory evidence (evidência contraditória)** · O que enfraquece a hipótese atual. Tem o mesmo direito de aparecer que a evidência de apoio.

**Correlation Confidence** · Quanto um achado ajuda a sustentar relação com outros: `24% detector + 34% observação + 24% proporção de checks + 18% corroboração na mesma categoria`.

## D

**Dashboard** · Visão agregada sem aba, aberta pela tecla `1`.

**Declarativo (detector)** · Regra em JSON (`registry/detectors/*.json`) com condições de presença/ausência, fonte, data de verificação e canários, em vez de lógica escrita em código. Hoje: Codeberg, DEV e Keybase.

**Detector** · A regra de verificação de **um** site: padrão de URL com `{username}`, código esperado e de ausência, confiabilidade, categoria. O catálogo tem 985 (984 escaneáveis).

**Detector Reliability** · Estimativa (0–100) de quão confiável é a regra de **um site**. Não mede a qualidade desta consulta (isso é *Observation Confidence*). Média atual: 80.

**Diff Intelligence** · Comparação entre dois snapshots do mesmo alvo. Classes: `NEW`, `DISAPPEARED`, `CHANGED`, `UNCHANGED`, `CONFIDENCE_UP`, `CONFIDENCE_DOWN`.

**`DISAPPEARED`** · Uma plataforma que estava no snapshot antigo e não está no novo. É uma diferença **entre coletas** (escopo, bloqueio), **nunca** prova de que a conta foi apagada.

## E

**Edge protection (proteção de borda)** · Defesa na frente do site (Cloudflare e similares). Detectada pelos cabeçalhos `cf-ray` ou `server: cloudflare`. Resulta em `UNCERTAIN`.

**Entidade** · No SQLite: algo observado (`username`, `email`, `domain`, `url`, `avatar-hash`, `company`).

**Evidence Engine** · Os 8 *checks* lógicos extraídos de **uma** resposta HTTP (não são 8 requisições). Veja [Sinais](#sinais-de-evidência).

**`evidenceHash`** · SHA-256 de `status + URL final + corpo lido`. Permite demonstrar depois que a resposta registrada não foi alterada. Só existe quando o corpo foi lido (Evidence Engine, baseline ou regra declarativa).

**`evidenceLevel`** · `confirmed` · `probable` · `uncertain` · `absent`. Aparece nos detalhes e no JSON exportado.

**Executive view** · Seção 02 do relatório: *Known · Assessed · Unknown* e a saúde da coleta.

## F

**Falso positivo / falso negativo** · `HIT` em quem não tem conta / `ABSENT` em quem tem. O Mineiro mede ambos no *benchmark* de detectores (`/api/registry/benchmark`).

**Finding (achado)** · Uma plataforma com resultado `found`, `uncertain` ou `rate_limited` que entra na matriz de evidências.

**`FOUND` / `HIT // 200`** · O site respondeu como se o perfil existisse. **Observação, não identidade.**

## G

**Gap (lacuna)** · Pergunta não respondida que, se respondida, **mudaria** a avaliação. Tem importância (HIGH/MEDIUM/LOW).

**Gravatar** · Serviço de avatar por e-mail. O Mineiro consulta `HEAD` com o **MD5** do e-mail para saber se há avatar.

## H

**Handle** · O identificador pesquisado (nome de usuário, sem `@`).

**Hipótese** · Explicação candidata (principal e alternativa) para os achados. Sempre acompanha evidência de apoio, contradição e ressalva.

**`HOST`/porta** · Endereço de escuta do servidor. O comando `mineiro` usa `127.0.0.1:3000`.

## I

**Identidade** · O que o Mineiro **não** estabelece. O mesmo username em dois serviços não prova que é a mesma pessoa.

**IPS (Intelligence Priority Score)** · Prioridade para **revisar um achado** (0–100): `28% qualidade da evidência + 30% correlação + 14% novidade + 28% relevância para a pergunta`. **Não mede risco de pessoa.**

**Integrity snapshot** · Seção 21 do relatório: SHA-256 de um resumo canônico dos resultados na tela. É diferente do `payloadSha256` do manifest de exportação.

## K

**Key Intelligence Judgments (julgamentos-chave)** · Conclusões do relatório com **nível de confiança** (HIGH, MODERATE, LOW) e **base**. Cada um gera uma linha no *analytic ledger*.

**Known** · O que foi **observado** diretamente.

## L

**Ledger (analítico)** · Rastreabilidade entre cada julgamento (`A-xxx`) e os IDs das evidências de apoio e contrárias.

## M

**Manifest (de exportação)** · Arquivo `.manifest.json` ao lado de cada exportação, com formato, seções incluídas/excluídas, o SHA-256 do conteúdo (`payloadSha256`) e o escopo do hash (`payload-before-manifest`). Prova integridade, **não** autoria.

**MGQ (Mineiro Graph Query)** · Linguagem de consulta do painel do grafo (`MATCH`, `EDGE`, `SHARED`, `PATH`). Veja [GRAPH-HUNTING.md](GRAPH-HUNTING.md).

## O

**Observation Confidence** · Quão conclusiva foi **esta** consulta (0–100). Depende do código HTTP, da confiabilidade do detector e dos checks.

**Observação (SQLite)** · Fato registrado, com fonte, momento, confiança e `evidenceHash`.

## P

**Pivô / Pivot** · Próxima pergunta ou consulta sugerida a partir de um achado (por exemplo, um domínio citado no perfil).

**Pivot scan** · Verificação em segundo plano de um username **candidato**, sem substituir a investigação atual. Confirma que o handle candidato existe, **não** que pertence ao alvo.

**Proveniência** · De onde vem a informação. `PRIMARY` (observado diretamente) · `DERIVED` (calculado de evidência) · `EXTERNAL` (fonte externa atribuída) · `AI_SYNTHESIZED` (produzido pelo copiloto).

**Public mode (modo público)** · `MINEIRO_PUBLIC=1`: configuração para instâncias compartilhadas. Limita taxas e desliga SQLite, hash de avatar e a chave Gemini do servidor.

## R

**`RATE_LMT` (`rate_limited`)** · O site respondeu 429 (limite de requisições).

**Registry** · O catálogo de detectores com taxonomia, confiabilidade, proveniência e licença. **Nenhum** dos 985 passou ainda por auditoria completa de proveniência.

**Requirement (requisito de inteligência)** · A pergunta que orienta a leitura: muda **prioridade**, nunca os fatos.

## S

**Snapshot** · Foto dos resultados de um scan guardada no caso. Também o "selo" de integridade registrado no Console (`MINEIRO-SNAP-…`).

**Soft-404** · Página de "não encontrado" servida com `200 OK`. Principal causa de falso positivo. Combatida pela baseline e por dicas no corpo (`page not found`, `user not found`, `profile not found`, `does not exist`, `doesn't exist`, `no such user`, `>404<`).

**Source Quality (qualidade da fonte)** · Nota de A a E da fonte pública observada. `A` exige metadados autodeclarados que os scans atuais não capturam; na prática aparecem B–E.

| Nota | Regra |
|---|---|
| A | metadados autodeclarados + detector ≥ 90 + observação ≥ 85 + ≥ 3 sinais |
| B | detector ≥ 80 e observação ≥ 75 |
| C | detector ≥ 65 e observação ≥ 55 |
| D | resultado `uncertain` ou `rate_limited` |
| E | o restante |

**SSRF** · Ataque em que o servidor é induzido a consultar redes internas. O Mineiro só sonda URLs que um detector gera, recusa IPs privados e portas fora de 80/443, e valida cada redirecionamento.

**STIX 2.1** · Formato aberto de inteligência de ameaças. O Mineiro o exporta **pela API** (`/api/store/export/stix`), não pela interface.

## U

**`UNCERTAIN`** · Resposta inconclusiva: bloqueio, limite, tempo esgotado ou código inesperado. **Nunca** significa "não existe".

## W

**WAF** · *Web Application Firewall*. Ver *Edge protection*.

**Wayback** · Internet Archive; `/api/osint/wayback` resume quando um perfil foi capturado.

---

## Sinais de evidência

Strings que aparecem em `evidenceSignals` (detalhe do achado e exportações). Cada check emite um sinal **positivo** ou **negativo**.

### Os 8 checks

| Sinal | Quando ocorre | Como ler |
|---|---|---|
| `http_status:<n>` | Sempre | Código HTTP recebido. `200` é o esperado para presença. |
| `explicit_absence_status` | Código = código de ausência (404) | Forte sinal de ausência. |
| `absence_status_not_observed` | Qualquer outro código | Esperado em perfis encontrados (por isso um `found` nunca passa 8/8). |
| `no_redirect` | URL final = URL pedida | Bom: a rota é a do perfil. |
| `final_host:<host>` | Redirecionou para outro host | Pode ser *login wall* ou rota genérica. |
| `username_in_final_url` | A URL final contém o handle | Continuidade de rota. |
| `username_not_in_final_url` | Não contém | Redirecionou para uma página sem o handle. |
| `username_token_in_body` | O handle aparece no HTML | Sinal moderado (páginas genéricas às vezes ecoam o termo). |
| `username_token_not_observed` | Não aparece | Pouco comum em perfis reais. |
| `canonical_consistent` | Canonical no mesmo host e com o handle | Sinal forte de página de perfil. |
| `canonical_not_confirmed` | Ausente ou diferente | Neutro: muitos sites não usam. |
| `no_soft_404_hint` | Nenhuma dica de "não encontrado" | Bom. |
| `soft_404_hint_detected` | Há uma dica no corpo | Suspeito: pode ser uma página de "não encontrado" com 200. |
| `no_edge_protection_signal` | Sem WAF aparente | A leitura é confiável. |
| `edge_protection_detected` | `cf-ray`/`server: cloudflare` | O que você viu pode ser um desafio, não o perfil. |

### Sem Evidence Engine (Quick)

| Sinal | Significado |
|---|---|
| `expected_status_match` / `unexpected_status` | O código HTTP foi / não foi o esperado. |
| `request_blocked` | Bloqueio sem identificação de borda. |
| `adaptive_retry_inconclusive` | Nova tentativa adaptativa sem sucesso (a interface não faz essa tentativa; só chamadas diretas da API). |

### Baseline

| Sinal | Significado |
|---|---|
| `baseline_status_differs:<alvo>_vs_<controle>` | O status do alvo difere do do controle (ex.: `200_vs_404`). **Forte** a favor de presença. |
| `baseline_redirect_shape_differs` | O destino/forma da rota difere do controle. Favorece presença. |
| `baseline_distinct_from_absent_profile` | Mesmo status, mas a página difere do "perfil ausente". Favorece presença. |
| `baseline_identical_to_absent_profile` | A página é indistinguível da de um perfil que não existe. O resultado vira **absent**. |
| `baseline_unavailable` | O controle foi bloqueado ou falhou. Sem conclusão pela baseline. |

### Regras declarativas

| Sinal | Significado |
|---|---|
| `rule_present:<tipo>` | Uma condição de presença casou (`status`, `body_contains`, `body_regex`, `final_path_regex`). |
| `rule_absent:<tipo>` | Uma condição de ausência casou. **Tem precedência.** |
| `rule_inconclusive` | Nenhuma regra decidiu. |

> [!TIP]
> Receita rápida de leitura: comece pelo `http_status` e pela **baseline**; depois veja `soft_404_hint_detected` e `edge_protection_detected`. Só então olhe `username_*` e `canonical_*`.
