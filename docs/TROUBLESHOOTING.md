# Mineiro Username Intelligence · Troubleshooting

## Diagnóstico rápido

Antes de qualquer coisa:

```bash
node --version
npm --version
npm run registry:validate
npm run lint
```

## Problemas comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| `node: command not found` | Node ausente | instale Node.js 22+ |
| `npm: command not found` | npm/PATH | reinstale Node.js |
| porta 3000 ocupada | servidor antigo | encerre o processo anterior |
| Colab: host not allowed | clone antigo | rode `git pull` e reinicie |
| muitos `UNCERTAIN` | proteção/rate limit | reduza escopo e aguarde |
| muitos timeouts | rede ou concorrência alta | use Standard/Quick |
| `FOUND` parece falso | soft-404/regra fraca | confira Evidence Matrix e URL |
| build falha | dependência/cache | remova `node_modules` e reinstale |
| notebook abre, UI não | servidor não saudável | rode health check |
| relatório sem SHA-256 | Web Crypto indisponível | use navegador moderno |
| IA não responde | chave/modelo/configuração | use Copilot sem chave custom ou revise configuração |
| Full Scan demora | cobertura ampla | use Progressive Full apenas quando necessário |

## Colab: atualização limpa

```python
%cd /content/Mineiro-OSINT-Extractor
!git checkout main
!git pull --ff-only
!npm install --no-audit --no-fund
```

Depois reinicie a célula do servidor.

## Ver logs do servidor no Colab

O notebook oficial mantém o log em:

```text
/content/mineiro-server.log
```

Use:

```python
!tail -n 80 /content/mineiro-server.log
```

## Registry inválido

Execute:

```bash
npm run registry:validate
npm run registry:stats
```

Não corrija um detector apenas para “fazer o teste passar”. O validator existe para impedir catálogo silenciosamente quebrado.

## Ainda não resolveu?

Ao abrir uma issue, inclua:

- versão do Mineiro;
- SO ou Colab;
- versão do Node;
- preset usado;
- mensagem de erro;
- passos mínimos para reproduzir.

Não publique tokens, cookies, credenciais ou dados pessoais.
