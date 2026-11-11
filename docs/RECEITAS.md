# Mineiro Username Intelligence · Receitas de investigação

**OSINT Investigation Workbench**

Roteiros prontos para situações comuns: **objetivo, passos, como interpretar e quando parar**. Todos os exemplos usam **organizações públicas** (`forgejo`, `nodejs`, `rust-lang`). Em casos reais, só investigue com finalidade **legítima e autorizada**, e leia [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md).

> [!IMPORTANT]
> Em todas as receitas valem as mesmas regras: `FOUND` é observação, não identidade; `UNCERTAIN` não é "não existe"; o mesmo username em dois serviços não prova a mesma pessoa; IA resume, não cria confiança.

## Índice

| # | Receita | Quando usar |
|---|---|---|
| 1 | [Triagem rápida de um handle](#1-triagem-rápida-de-um-handle) | "Esse identificador aparece onde?" |
| 2 | [Pegada pública de uma organização ou marca](#2-pegada-pública-de-uma-organização-ou-marca) | Inventário e monitoramento de personificação |
| 3 | [Acompanhar mudanças ao longo do tempo](#3-acompanhar-mudanças-ao-longo-do-tempo) | "O que mudou desde a última vez?" |
| 4 | [Investigar suspeita de falso positivo](#4-investigar-suspeita-de-falso-positivo) | Um `HIT` que não faz sentido |
| 5 | [Validar um username candidato (pivô)](#5-validar-um-username-candidato-pivô) | "Esse `forgejo_dev` é o mesmo ator?" |
| 6 | [Triagem de várias organizações em lote](#6-triagem-de-várias-organizações-em-lote) | Lista de handles |
| 7 | [Relatório para terceiros](#7-relatório-para-terceiros) | Cliente, jurídico, time interno |
| 8 | [Automatizar e monitorar por script](#8-automatizar-e-monitorar-por-script) | Rotina semanal, integração |
| 9 | [Cadeia de custódia e integridade](#9-cadeia-de-custódia-e-integridade) | Evidência que precisa ser defendida |

---

## 1. Triagem rápida de um handle

**Objetivo:** saber, em segundos, se vale aprofundar.

1. Na tela inicial, digite `forgejo` (ou cole a URL de um perfil) e escolha **Quick**. Execute.
2. Em **Evidence**, filtre por **Found**. Anote as plataformas.
3. **Não pare aqui.** Quick não liga o Evidence Engine nem a baseline: `HIT` em sites que respondem 200 a tudo (Spotify, TikTok, Steam, entre outros) são esperados.
4. Se algum achado importa, repita em **Standard** e compare.

**Interpretação:** use Quick para decidir *se* continua, nunca para concluir. **Pare** se o Standard confirmar ausência na maioria dos serviços relevantes para a sua pergunta.

---

## 2. Pegada pública de uma organização ou marca

**Objetivo:** inventariar onde um nome de marca/organização aparece e vigiar possíveis personificações.

1. **Standard** com o handle da marca (por exemplo, `nodejs`).
2. Na seção 01 do relatório, escolha **Brand impersonation monitoring** (ou **Digital footprint mapping** para um inventário). Isso reordena os achados por relevância para social, comunidade e mídia; não muda os fatos.
3. Leia, nesta ordem: **Executive view → Collection coverage → High-confidence findings → Contradictory evidence → Intelligence gaps**.
4. Verifique **manualmente** cada achado (botão de abrir link): a URL existe? É da organização oficial ou de terceiros?
5. Em **Similar usernames**, veja variantes plausíveis (`nodejs_`, `the_nodejs`, `n0dejs`). Elas são **candidatas**; use *Pivot scan* para saber se o handle existe, e confirme titularidade por fonte independente (link no site oficial, selo verificado, registro de domínio).

**Interpretação:** uma variante que *existe* não é, por si só, um golpe; confirme conteúdo, data de criação e relação com a marca antes de qualquer ação.
**Pare** quando novos pivôs não alterarem os julgamentos nem fecharem lacunas.

---

## 3. Acompanhar mudanças ao longo do tempo

**Objetivo:** responder "o que mudou?" sem refazer análise manual.

1. Rode **Standard** hoje. Rode **Standard** de novo semanas depois, **com o mesmo preset e o mesmo alvo** (isso cria o segundo snapshot no mesmo caso).
2. Vá em **Correlation → Case & Diff**. Por padrão compara o penúltimo com o último.
3. Leia os contadores: `NEW`, `DISAPPEARED`, `CHANGED`, `CONFIDENCE_UP/DOWN`, `UNCHANGED`. Veja só as linhas materiais.

**Interpretação**

| Classe | Hipótese a testar | Hipótese errada comum |
|---|---|---|
| `NEW` | A conta surgiu, **ou** o site deixou de bloquear | "Alguém criou a conta" |
| `DISAPPEARED` | O site passou a bloquear, ou o escopo mudou | "A conta foi apagada" |
| `CHANGED` | Mudança de status, URL, código HTTP | |
| `CONFIDENCE_±` | Variação de ≥ 10 pontos sem outra mudança, em geral ruído de rede | |

Comparar Quick com Full gera `NEW` por simples diferença de escopo. **Pare** se, em dois ciclos seguidos, só houver `UNCHANGED`. Para rotinas automáticas, veja a [receita 8](#8-automatizar-e-monitorar-por-script).

---

## 4. Investigar suspeita de falso positivo

**Situação:** `HIT // 200` em um serviço onde isso parece impossível.

```text
HIT suspeito
 │
 ├─ Foi Quick? ──► sim ─► Refaça em Standard. A baseline costuma derrubar o falso positivo.
 │
 ├─ Abra o finding (Intelligence) e leia os sinais:
 │    ├─ baseline_identical_to_absent_profile ─► já deveria ter virado ABSENT (se não, reporte).
 │    ├─ baseline_status_differs:200_vs_404 ───► forte indício de perfil real.
 │    ├─ soft_404_hint_detected ───────────────► provável página "não encontrado" com 200.
 │    ├─ edge_protection_detected ─────────────► você pode ter visto um desafio, não o perfil.
 │    └─ username_not_in_final_url / final_host:… ─► redirecionou para outra página.
 │
 └─ Abra a URL no navegador e olhe com seus olhos. É a verificação final.
```

Se o serviço **é** um falso positivo sistemático (todas as consultas dão `HIT`), abra uma issue com o `id` do detector, o `evidenceSignals` e um handle **sintético** como `zqx9q8w7e6r5t4y3u2`. Esse é o tipo de caso que alimenta os [detectores declarativos](../REGISTRY.md).

---

## 5. Validar um username candidato (pivô)

**Situação:** `forgejo_dev` existe em outra plataforma. É o mesmo ator?

1. **Pivot scan** no candidato (aba Similar Usernames). Ele confirma **que o handle existe**.
2. Procure **corroboração independente** (do tipo que *não* depende do nome ser parecido):
   - o perfil A cita ou linka o perfil B (ou o contrário);
   - mesmo domínio próprio, e-mail público, ou chave pública em comum;
   - datas de criação e fuso de atividade compatíveis;
   - avatar idêntico ou muito similar (a API `/api/osint/avatar-hash` calcula a similaridade perceptual).
3. Registre o que **contradiz**: idiomas diferentes, interesses incompatíveis, datas impossíveis.
4. Escreva a hipótese **principal e a alternativa** (homonímia, coincidência, personificação).

**Regra de decisão sugerida:** sem pelo menos uma corroboração independente, a relação permanece como *candidata*. Só semelhança de nome **nunca** basta.

---

## 6. Triagem de várias organizações em lote

**Objetivo:** passar por uma lista de handles com o mesmo método.

1. Crie `lista.csv` (uma entrada por linha, **com** cabeçalho):

   ```csv
   target,type,notes
   forgejo,username,forge de código
   nodejs,username,runtime
   rust-lang,username,linguagem
   ```

2. **Batch → Upload CSV** (ou *Paste list*), confira a prévia (linhas inválidas **não** têm aviso: veja a contagem de *valid targets*), escolha a **concorrência** e inicie.
3. Acompanhe no painel **Batch**. Para um alvo concluído, **Inspect** carrega o relatório completo dele.
4. **Exporte o CSV/JSON do lote antes de fechar a aba:** o lote **não é persistido**.
5. Para guardar um alvo como caso, use **Inspect** e depois o fluxo normal (o scan do lote não cria caso).

**Cuidados:** os alvos rodam um por vez; um Full por alvo pode demorar muito. Prefira Standard.

---

## 7. Relatório para terceiros

**Objetivo:** entregar algo útil, mínimo e verificável.

1. Refaça em **Standard** (ou Full justificado). Escolha o **requisito** que responde à pergunta do solicitante.
2. **Export** → ajuste as seções:
   - mantenha *Executive assessment*, *Key judgments*, *Collection coverage*, *Contradictory evidence*, *Intelligence gaps* e *Methodology*;
   - **desmarque** *Raw results* (já vem desmarcado) e o que não for necessário (princípio da minimização);
   - confira *Provenance* e *Export manifest*.
3. Formato: **HTML** para leitura (e *Imprimir → PDF* do navegador, se precisar de PDF); **JSON** se vai integrar a outro sistema; **CSV** só para a matriz de evidências.
4. Entregue **o arquivo e o `.manifest.json`** juntos. O destinatário confere:

   ```bash
   sha256sum relatorio.html     # deve coincidir com payloadSha256 do manifest
   ```

5. Inclua uma frase de ressalva: *"Observações de presença pública; não estabelecem identidade."*

Retenção e compartilhamento: [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md#7-relatórios-exportados).

---

## 8. Automatizar e monitorar por script

**Objetivo:** rodar uma rotina semanal e ser avisado quando algo mudar.

```bash
mineiro --no-browser &                                    # sobe o servidor local

# hoje
python3 examples/api_scan.py nodejs --ids codeberg devto keybase --jsonl hoje.jsonl --store

# comparar com a semana passada
python3 examples/diff_jsonl.py semana_passada.jsonl hoje.jsonl
echo "exit=$?"     # 0 = sem mudanças; 1 = há mudanças
```

Exemplo de saída quando há mudanças:

```text
CHANGED      codeberg: found -> not_found
CONFIDENCE   devto: 90 -> 50
DISAPPEARED  keybase: estava not_found
3 mudança(s) material(is) em 3 plataforma(s).
```

- `--store` grava as observações no SQLite local (`~/.mineiro/mineiro.sqlite`), com `evidenceHash`, e permite `GET /api/store/export/stix?username=nodejs` para levar a um MISP/OpenCTI.
- Agende com `cron` (Linux/macOS) ou o Agendador de Tarefas (Windows). Use o código de saída do `diff_jsonl.py` para disparar um aviso.
- Mantenha `scanDepth: "fast"` e `wafRetryStrategy: "none"` (o padrão do exemplo): não insista em quem bloqueia.
- Respeite os limites de taxa: veja [CLI-E-API.md](CLI-E-API.md#6-limites-de-taxa-e-modo-público).

---

## 9. Cadeia de custódia e integridade

**Objetivo:** poder demonstrar depois **o que foi coletado, quando e que não foi alterado**.

| Camada | O que registra | Como verificar |
|---|---|---|
| **Resposta de cada site** | `evidenceHash` = SHA-256 de `status + URL final + corpo lido`; `collectedAt`; `detectorVersion` | Está no JSON do `verify`/da API e nas observações do SQLite |
| **Relatório exportado** | `payloadSha256` no `.manifest.json` | `sha256sum arquivo` e comparar |
| **Estado na tela** | *Integrity snapshot* (seção 21) e linha `[SNAPSHOT]` no Console | Hash do resumo canônico dos resultados (diferente do manifest) |

Boas práticas:

1. Exporte **logo após** a coleta e arquive arquivo + manifest.
2. Anote versão do Mineiro (`mineiro --version`), preset, data e quem executou.
3. Capture a tela do Console com o `[SNAPSHOT]`.
4. Lembre: o hash prova **integridade**, não **autoria** nem **identidade**, e não é assinatura (não há segredo envolvido).
5. O conteúdo das páginas muda: o `evidenceHash` prova *o que o Mineiro leu naquele momento*, não que a página continua igual.
