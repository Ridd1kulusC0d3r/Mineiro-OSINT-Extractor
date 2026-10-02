# Mineiro Username Intelligence · FAQ

Respostas curtas, com link para o detalhe. Termos técnicos: [GLOSSARIO.md](GLOSSARIO.md).

## Índice

[Conceito](#conceito) · [Resultados](#resultados-e-números) · [Instalação e uso](#instalação-e-uso) · [Privacidade e segurança](#privacidade-e-segurança) · [Dados e exportação](#dados-e-exportação) · [IA](#ia-copiloto) · [Detectores e contribuição](#detectores-e-contribuição) · [Legal e ética](#legal-e-ética)

---

## Conceito

### O Mineiro confirma identidade?
Não. Ele observa **presença pública** de um identificador e produz suporte de correlação. Identidade exige evidência independente ([receita 5](RECEITAS.md#5-validar-um-username-candidato-pivô)).

### O que ele faz de diferente de outros verificadores de username?
Separa **observação**, **hipótese** e **lacuna**; usa uma **baseline diferencial** contra soft-404; mostra por que cada resultado foi classificado (sinais, checks, hash de evidência); e assume o que não sabe (`UNCERTAIN`, cobertura efetiva, 0 detectores auditados). Veja [metodologia](INTELLIGENCE-METHODOLOGY.md).

### Ele faz scraping de dados de perfil?
Não. Hoje ele checa **presença** (status, URL final, trechos do corpo para os 8 checks) e não captura nome, bio ou foto. Por isso clusters por domínio e contradições de perfil quase não aparecem.

---

## Resultados e números

### Um HTTP 200 significa FOUND?
Não necessariamente. O Evidence Engine considera redirect, URL final, conteúdo, canonical, soft-404 e proteção de borda; no Standard/Full, a baseline derruba páginas que não diferem do perfil inexistente.

### Por que no Quick aparecem tantos `HIT` em Spotify, TikTok, Steam…?
O Quick **não** liga Evidence Engine nem baseline, e esses sites respondem 200 a qualquer handle. Refaça em Standard ([receita 4](RECEITAS.md#4-investigar-suspeita-de-falso-positivo)).

### Detector Reliability e Observation Confidence são a mesma coisa?
Não. *Reliability* é a qualidade esperada da regra (catálogo); *Observation Confidence* é a qualidade **desta** execução. Fórmulas: [metodologia](INTELLIGENCE-METHODOLOGY.md#como-os-números-são-calculados).

### O que é Source Quality?
Nota A–E da força da fonte observada, separada do detector. A nota **A** exige metadados autodeclarados, que os scans atuais não capturam.

### O que é IPS?
Intelligence Priority Score. Ordena **achados**, não pessoas, e depende do requisito escolhido.

### Por que há `UNCERTAIN`?
Rate limit, WAF, redirects ambíguos ou comportamento inconclusivo. O Mineiro prefere admitir incerteza a inventar certeza, e **não** tenta contornar bloqueios. Veja [TROUBLESHOOTING](TROUBLESHOOTING.md).

### `ERROR` é diferente de `UNCERTAIN`?
Sim. `ERROR` significa que o **servidor local** recusou ou falhou (por exemplo, limite de taxa local ou URL fora do padrão do detector); não diz nada sobre o site.

### Por que dois scans do mesmo alvo dão resultados diferentes?
Sites variam, bloqueiam por rajada e o cache local dura 5 minutos (baseline: 15). Compare com **Case & Diff** e leia `NEW`/`DISAPPEARED` como hipóteses ([receita 3](RECEITAS.md#3-acompanhar-mudanças-ao-longo-do-tempo)).

### Full Scan faz 7.880 requests?
Não. 7.880 (985 × 8) são checks **lógicos** possíveis, extraídos de uma resposta por detector (mais a requisição da baseline, nos presets que a usam).

### Dá para confiar na contagem "985 plataformas"?
É o tamanho do catálogo, não de contas verificadas. Para username são 984 detectores ativos; para e-mail, 59. Os cartões da tela inicial arredondam (20/50/985); a interface de plataformas mostra os números reais.

### Posso pesquisar por e-mail?
Sim, mas é o modo mais fraco: em plataformas que aceitam ambos os tipos, o endereço **inteiro** vira o handle e os `HIT` ali são fracos. Prefira o username local-part ou pivôs. Detalhes: [USER-GUIDE](USER-GUIDE.md#9-modo-e-mail).

---

## Instalação e uso

### Qual a forma mais rápida de testar?
`pip install` + `mineiro`, ou o [Colab](COLAB.md) se você não quer instalar nada, ou o Codespaces. Passo a passo: [GETTING-STARTED](GETTING-STARTED.md).

### Preciso de Node?
O pacote Python usa o Node 22+ do sistema; se não achar, instala um via `nodejs-wheel-binaries`. Se quiser executar a partir do código-fonte, `npm ci && npm run build && npm start`.

### Posso rodar no Colab?
Sim, com o notebook oficial em `notebooks/Mineiro_Username_Intelligence_Colab.ipynb` ([COLAB.md](COLAB.md)). O túnel público é seu risco: não exponha com chaves de API salvas.

### Funciona atrás de proxy corporativo?
O **servidor** ignora variáveis `HTTP(S)_PROXY` (proteção anti-SSRF própria). Em rede restrita, use Codespaces/Colab ou libere a saída. Suporte a proxy está no [plano](PLANO-PAGINA-INICIAL.md#4-plano-priorizado).

### Posso hospedar para uma equipe?
Sim, com `MINEIRO_PUBLIC=1` e proxy reverso com TLS e autenticação. O Mineiro **não** tem login. Veja [DEPLOYMENT](DEPLOYMENT.md).

### Dá para usar por script/CI?
Sim: [CLI-E-API.md](CLI-E-API.md) e `examples/api_scan.py` / `examples/diff_jsonl.py` ([receita 8](RECEITAS.md#8-automatizar-e-monitorar-por-script)).

---

## Privacidade e segurança

### Para onde vão os dados?
Casos, preferências e cache ficam no **navegador** (IndexedDB/localStorage). O servidor local não os guarda, exceto o SQLite opcional **via API**. Saem da máquina: as requisições de sondagem aos sites, consultas de ícones (Google/DuckDuckGo) e, se ativado, o conteúdo do assessment para o Gemini. Tudo em [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md).

### Minha chave do Gemini é guardada com segurança?
Fica em `localStorage` em **texto puro** no seu navegador. Use uma chave com cota baixa e nunca em computador compartilhado.

### O Mineiro pode ser usado para atacar a rede interna (SSRF)?
Ele foi desenhado para impedir: só sonda URLs que o detector pode gerar, resolve DNS por um guard que bloqueia faixas privadas/metadata e revalida cada redirect. Não é auditoria de terceiros; reporte falhas via [SECURITY.md](../SECURITY.md).

### Ele burla CAPTCHA, login ou WAF?
Não. Por princípio. Bloqueou, é `UNCERTAIN`.

---

## Dados e exportação

### O SHA-256 prova autoria?
Não. Prova **integridade** do arquivo exportado frente ao manifest. Não é assinatura.

### Quais formatos exporta?
HTML, JSON, Markdown e CSV (com manifest). STIX 2.1 só pela API (`/api/store/export/stix`).

### Perdi meus casos. Dá para recuperar?
Os casos vivem no IndexedDB **daquele navegador e perfil**. Limpar dados do site, modo anônimo ou outro navegador os apaga/oculta. Exporte o que importa.

### O lote (Batch) é salvo?
Não. Exporte o CSV/JSON do lote antes de fechar a aba.

---

## IA (Copiloto)

### O Copilot é obrigatório?
Não. Todo o assessment determinístico funciona sem IA.

### O Copilot pode elevar confidence?
Não. Saída de IA é marcada `AI_SYNTHESIZED`, IDs de evidência inventados são descartados e `factualConfidenceRaised` é sempre `false`.

### Qual modelo ele usa?
O modelo do Gemini configurado em Ajustes (`mineiro_gemini_model`). Veja [USER-GUIDE](USER-GUIDE.md#14-copiloto-de-ia).

---

## Detectores e contribuição

### Posso adicionar detectores?
Sim, desde que o endpoint seja público, a proveniência seja documentada e o comportamento seja testável. Veja [REGISTRY.md](../REGISTRY.md) e [CONTRIBUTING.md](../CONTRIBUTING.md).

### O que é um detector "declarativo"?
Um JSON em `registry/detectors/` com regras de presença/ausência, fonte, data e **canários**; tem precedência de ausência. Hoje: Codeberg, DEV e Keybase.

### Por que alguns detectores ficam registry-only?
São úteis para taxonomia, mas não têm URL pública estável para scan direto.

### Por que "0 de 985 auditados"?
O catálogo foi herdado de listas comunitárias; a proveniência de cada entrada ainda não foi verificada. Está dito no README e em [LICENSES_AND_PROVENANCE.md](../LICENSES_AND_PROVENANCE.md).

---

## Legal e ética

### Posso usar contra qualquer pessoa?
Não é um convite a isso. Use com finalidade **legítima e autorizada** (LGPD/GDPR, termos dos sites, leis locais). Leia [PRIVACIDADE-E-DADOS.md](PRIVACIDADE-E-DADOS.md) e [SECURITY.md](../SECURITY.md).

### Qual a licença?
Código original MIT. O catálogo histórico ainda tem entradas sob auditoria: leia [LICENSES_AND_PROVENANCE.md](../LICENSES_AND_PROVENANCE.md) antes de reutilizar o dataset.
