# Mineiro Username Intelligence · Google Colab oficial

**OSINT Investigation Workbench**

O notebook canônico do Mineiro é:

**[`notebooks/Mineiro_Username_Intelligence_Colab.ipynb`](../notebooks/Mineiro_Username_Intelligence_Colab.ipynb)**

[▶ Abrir no Google Colab](https://colab.research.google.com/github/Ridd1kulusC0d3r/Mineiro-OSINT-Extractor/blob/main/notebooks/Mineiro_Username_Intelligence_Colab.ipynb)

## O que ele faz

Uma execução completa prepara:

```text
GitHub main
   ↓
Node.js 22+
   ↓
npm dependencies
   ↓
Registry validation
   ↓
Mineiro server :3000
   ↓
health check
   ↓
Colab proxy URL
   ↓
Mineiro UI
```

A VM do Colab é temporária. O notebook não transforma Colab em hospedagem permanente.

## Uso recomendado

1. abra o notebook;
2. escolha **Runtime → Run all**;
3. aguarde o card **Environment ready**;
4. abra o link em **Mineiro UI**;
5. comece com Quick ou Standard.

## Células

### 1 · Environment

Define:
- repositório;
- branch;
- diretório;
- porta;
- arquivo de log.

Também mostra a versão do notebook.

### 2 · Bootstrap

- clona o repositório se necessário;
- atualiza a branch;
- garante Node.js 22+;
- instala dependências;
- valida o Registry.

### 3 · Start Mineiro

- encerra uma instância anterior da sessão;
- inicia `npm run dev`;
- grava logs em `/content/mineiro-server.log`;
- espera `/api/health`;
- exibe a URL do proxy.

### 4 · Validation

Opcional. Executa demo sintética e smoke test analítico.

### 5 · Diagnostics

Mostra as últimas linhas do log do servidor.

### 6 · Stop

Encerra o processo da sessão.

## Atualizar uma sessão já aberta

```python
%cd /content/Mineiro-OSINT-Extractor
!git checkout main
!git pull --ff-only
!npm ci --no-audit --no-fund --prefer-offline
```

Depois execute novamente a célula **Start Mineiro**.

## Host bloqueado

O proxy do Colab usa hosts no domínio:

```text
*.codatalab-user-runtimes.internal
```

O Vite do projeto aceita esse domínio de forma restrita. Se aparecer:

```text
Blocked request. This host is not allowed.
```

sua sessão provavelmente está com clone antigo. Atualize com `git pull` e reinicie o servidor.

Não configure `allowedHosts: true`.

## Performance

Durante desenvolvimento:

- use Quick;
- use Standard para validar Evidence Engine;
- evite Full Scan repetido.

No Full, o Mineiro usa progressive scan: discovery rápido e validação profunda apenas de candidatos.

## Logs

```python
!tail -n 100 /content/mineiro-server.log
```

## Chaves de IA

Não escreva API keys em células que serão compartilhadas.

Use a configuração da aplicação apenas na sua sessão. O Copilot é opcional; o assessment funciona sem IA.

## Limites

Colab pode:
- encerrar a VM;
- trocar o hostname do proxy;
- limitar CPU/RAM/rede;
- perder processos quando a sessão desconecta.

Isso é esperado. Para uso persistente, rode localmente ou em infraestrutura própria.
