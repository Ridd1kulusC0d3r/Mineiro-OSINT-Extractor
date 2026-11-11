# Mineiro Username Intelligence · Privacidade e dados

**OSINT Investigation Workbench**

Uma ferramenta de investigação lida com informação sensível por natureza: o **alvo** da pesquisa e o **rastro** do que você fez. Este documento diz, sem eufemismo, **onde cada dado fica**, **o que sai da sua máquina**, **para quem** e **como apagar**. Tudo foi verificado no código da versão 1.7.0.

> [!NOTE]
> Este texto descreve o comportamento do software. **Não é aconselhamento jurídico.** Tratar dados pessoais (LGPD no Brasil, GDPR na Europa) exige finalidade legítima, minimização, retenção limitada e segurança. A responsabilidade pelo uso é de quem opera a ferramenta.

## Sumário

1. [Resumo em 30 segundos](#1-resumo-em-30-segundos)
2. [Onde seus dados ficam](#2-onde-seus-dados-ficam)
3. [O que sai da sua máquina](#3-o-que-sai-da-sua-máquina)
4. [O que NÃO acontece](#4-o-que-não-acontece)
5. [Cenários: local, Colab, servidor compartilhado](#5-cenários-local-colab-servidor-compartilhado)
6. [A chave do Gemini](#6-a-chave-do-gemini)
7. [Relatórios exportados](#7-relatórios-exportados)
8. [Como apagar tudo](#8-como-apagar-tudo)
9. [Boas práticas](#9-boas-práticas)

---

## 1. Resumo em 30 segundos

- **Seus casos e relatórios ficam no seu computador** (navegador e, opcionalmente, um arquivo SQLite). Não há conta, nuvem do projeto, nem telemetria.
- A ferramenta **precisa falar com os sites que você consulta**: eles recebem o *handle* pesquisado e o seu IP.
- Por padrão **nada é enviado a IA**. Se você usar o copiloto, um resumo da investigação vai ao **Google (Gemini)**.
- O navegador ainda contata **serviços de ícones do Google e do DuckDuckGo** (só o domínio da plataforma, nunca o handle). Veja [§3](#3-o-que-sai-da-sua-máquina).

---

## 2. Onde seus dados ficam

### No navegador (por perfil e por *origem*)

A origem é o endereço completo: `http://localhost:3000`, `http://127.0.0.1:3000` e `http://localhost:3001` são **três cofres diferentes**.

| Dado | Onde | Chave / nome | Conteúdo |
|---|---|---|---|
| **Casos** | IndexedDB | `mineiro_cases_v1` (store `cases`) | Para cada alvo: snapshots completos (todos os resultados), pivôs, datas. Até 40 + 40 por caso. |
| **Cache dos 5 últimos scans** | `localStorage` | `mineiro_cached_scans_v1` | Resultados completos, e-mail, preset, contagens e o "selo" de integridade. |
| **Chave do Gemini** | `localStorage` | `mineiro_gemini_key` | A chave, **em texto puro**. |
| Modelo do Gemini | `localStorage` | `mineiro_gemini_model` | Nome do modelo escolhido. |
| Idioma | `localStorage` | `mineiro_language_preference` | `en`, `pt` ou `es`. |
| Tema | `localStorage` | `mineiro_theme_preference` | `dark`, `bone` ou `high-contrast`. |
| Sessão atual | memória da aba | | Resultados em tela, Console, fila de **lote**. Some ao recarregar. |

Não usamos `sessionStorage` nem *cookies*.

> [!IMPORTANT]
> **O lote nunca é persistido.** E um scan **interrompido** ou **sem plataformas** não vira caso.

### No servidor local (a mesma máquina)

| Dado | Onde | Observação |
|---|---|---|
| **SQLite opcional** | `~/.mineiro/mineiro.sqlite` (comando `mineiro`) ou `data/mineiro.sqlite` (código) | Só é criado/usado quando **você** chama `/api/store/*` (por exemplo, com o script `examples/api_scan.py --store`). **A interface não grava nele.** `MINEIRO_DB=:memory:` desliga a gravação em disco. |
| Caches em memória | RAM do processo | Resultado de `verify` por 5 min; *baseline* por detector por 15 min; contadores de limite de taxa. Somem ao parar o servidor. |
| Logs | saída padrão (terminal) | Apenas avisos e erros do servidor. **Não há log de acesso** com alvos. |

---

## 3. O que sai da sua máquina

Esta é a lista **completa** de destinos externos, na versão 1.7.0.

| Destino | Quando | O que recebe | Você controla? |
|---|---|---|---|
| **Cada site consultado** (até 984) | Em todo scan | O **handle** na URL, o seu **IP**, o *User-Agent* e cabeçalhos padrão. Também um segundo pedido com um **handle aleatório** (controle da baseline). | Escolhendo o preset e o escopo. |
| **Resolvedor DNS** do seu sistema | Reconhecimento de e-mail | Consulta MX do **domínio** do e-mail. | Evite o modo e-mail. |
| **gravatar.com** | Reconhecimento de e-mail | O **MD5 do e-mail** em minúsculas (`HEAD`). | Idem. |
| **google.com/s2/favicons** e **icons.duckduckgo.com** | O navegador mostra uma plataforma na tela | O **domínio da plataforma** (por exemplo `github.com`) e o IP do navegador. Nunca o handle. Sem *referrer*. | Hoje só bloqueando no navegador/firewall. [Pendência no plano](PLANO-PAGINA-INICIAL.md). |
| **Google (Gemini)** | Só se você clicar em **Analyze** no copiloto | Veja [§6](#6-a-chave-do-gemini) | Sim: não use o copiloto. |
| **web.archive.org** | Só se você chamar `/api/osint/wayback` (API) | A URL do perfil | Sim. |
| **brasilapi.com.br** | Só se você chamar `/api/osint/br/cnpj` (API) | O CNPJ | Sim. |
| **URL do avatar** | Só se você chamar `/api/osint/avatar-hash` (API) | O servidor baixa a imagem (PNG/JPEG ≤ 2 MB) | Sim. |

> [!NOTE]
> **Fontes tipográficas:** as versões anteriores à 1.7.0 carregavam três famílias do Google Fonts que o CSS nunca usava, o que gerava uma requisição ao Google a cada abertura. Isso foi **removido** na 1.7.0 (a interface usa fontes do sistema). Se você usa uma versão anterior, atualize.

### O que o site consultado enxerga

Do ponto de vista do site: uma requisição `GET` comum ao perfil público, vinda do **seu IP**, com um *User-Agent* de navegador (ou, em detectores que o exigem, um que identifica o Mineiro). Por isso:

- **Seu IP fica registrado** nos logs desses sites. Em investigações sensíveis, considere de onde consulta (rede corporativa, VPN contratada, etc.). O Mineiro **não** oferece anonimato.
- Os sites também recebem as consultas de **handles aleatórios** (`zq…`) usadas como controle.
- O Mineiro **não faz login, não usa cookies e não envia credenciais**.

### O que o Gemini recebe (copiloto)

Um resumo da avaliação local, não o arquivo bruto:

- instruções fixas + JSON com **coleta**, **julgamentos**, **clusters**, **hipóteses**, **contradições**, **lacunas**, **pivôs** e a pergunta (até 1000 caracteres);
- as **30 evidências de maior prioridade**: plataforma, categoria, **URL (que contém o handle)**, status, código HTTP, latência, as três confianças, qualidade da fonte, sinais e "por que importa";
- **não** vão: o rótulo do alvo, o grafo, a linha do tempo, o *ledger*, o apêndice técnico.

O Google pode reter essas informações conforme os termos da API que você contratou. Se isso não é aceitável para o caso, **não use o copiloto**: todo o relatório determinístico funciona sem ele.

---

## 4. O que NÃO acontece

Verificado por busca no código:

- ❌ **Telemetria, analytics ou *crash reports*.** Não há nenhum SDK desse tipo, e todo `fetch` do navegador vai para `/api` na própria máquina.
- ❌ Contas, login ou sincronização com nuvem do projeto.
- ❌ Envio de casos, relatórios ou resultados a qualquer servidor do projeto.
- ❌ Contorno de autenticação, CAPTCHA ou controles de acesso.
- ❌ Acesso a redes internas: o servidor **recusa** IPs privados, `localhost`, portas fora de 80/443 e valida cada redirecionamento (proteção contra SSRF).
- ❌ Nomes de sócios de empresas: a consulta de CNPJ devolve só a **contagem** (minimização de dados).

---

## 5. Cenários: local, Colab, servidor compartilhado

| Cenário | Onde os dados passam | Cuidado |
|---|---|---|
| **pip / código-fonte (localhost)** | Só pela sua máquina. | Cofre = o navegador. Quem usa seu perfil de navegador vê os casos. |
| **Docker/servidor seu** | Na máquina do servidor. | Defina `MINEIRO_PUBLIC=1` se outras pessoas acessam; use HTTPS e autenticação no proxy. |
| **Instância compartilhada (`MINEIRO_PUBLIC=1`)** | O servidor vê os handles pesquisados (as requisições passam por ele). | Desliga SQLite e hash de avatar, ignora a chave Gemini do servidor e limita taxas. **Não** é um serviço anônimo: avise os usuários. |
| **Google Colab** | A VM é do Google; as consultas saem do **IP do Google**. | Não coloque chaves em células. Exporte antes de fechar; a VM é temporária. |

---

## 6. A chave do Gemini

- É salva no `localStorage` **em texto puro** e enviada ao servidor local no cabeçalho `x-gemini-api-key` a cada chamada (e no corpo, ao testar a conexão). O servidor a usa para chamar o Google.
- Qualquer pessoa/extensão com acesso ao perfil do navegador pode lê-la. **Não** a configure em computador compartilhado.
- **Clear** remove a chave imediatamente. Revogue chaves antigas no Google AI Studio.
- Sem chave pessoal, o servidor usa `GEMINI_API_KEY` do ambiente (ignorada no modo público).
- O servidor só considera uma chave pessoal se ela tiver mais de 10 caracteres; senão volta silenciosamente para a do ambiente.

---

## 7. Relatórios exportados

Os arquivos exportados (HTML, JSON, Markdown, CSV) contêm o **alvo**, as **URLs** consultadas e os resultados. Trate-os como **dados pessoais em potencial**:

- guarde-os em local protegido e **com prazo de retenção definido**;
- compartilhe só com quem tem necessidade e base legal;
- o `.manifest.json` ajuda a provar que o arquivo **não foi alterado**, mas **não** protege o conteúdo (não é criptografia nem assinatura);
- o formato JSON pode incluir `rawResults` (resultado bruto de todas as consultas): desmarque se não precisar.

Para investigações sobre **pessoas**, documente a finalidade, a base legal e o que foi coletado. Para exemplos, tutoriais e relatórios de bug, use **organizações públicas** ou dados sintéticos.

---

## 8. Como apagar tudo

### No navegador

1. **Casos:** botão **Cases** → lixeira em cada caso (pede confirmação).
2. **Cache dos 5 scans:** **Cases** → **Clear All History**.
3. **Chave do Gemini:** **AI → Configure Gemini → Clear**.
4. **Tudo de uma vez:** nas ferramentas do desenvolvedor (F12) → *Application/Armazenamento* → **Clear site data** para `localhost:PORTA`. Repita para cada origem que você usou (`localhost` e `127.0.0.1`, portas diferentes).

### No computador

```bash
rm -f ~/.mineiro/mineiro.sqlite*      # SQLite opcional (pip)
rm -f data/mineiro.sqlite*            # SQLite opcional (código-fonte)
pip uninstall mineiro-osint           # remove o programa (não remove dados)
```

No Windows: apague `%USERPROFILE%\.mineiro`.

### No Colab

**Runtime → Disconnect and delete runtime.** Os arquivos exportados que você baixou continuam no seu computador.

---

## 9. Boas práticas

1. **Minimize:** use o menor preset que responde à pergunta. Mais sites = mais registros do seu IP e mais dados a proteger.
2. **Defina retenção:** apague casos e exportações quando a investigação acabar.
3. **Separe perfis:** use um perfil de navegador só para investigações, sem outras extensões.
4. **Não contamine tutoriais:** nunca cole alvos reais em issues públicas, prints ou relatórios de bug.
5. **Revise antes de compartilhar:** relatórios expõem URLs e handles; confira cada seção antes de enviar (o construtor de exportação deixa desmarcar seções).
6. **Em dúvida jurídica, consulte** o encarregado de dados (DPO) ou assessoria jurídica da sua organização.

Veja também: [SECURITY.md](../SECURITY.md) (como reportar vulnerabilidades) e [DEPLOYMENT.md](DEPLOYMENT.md) (operação segura).
