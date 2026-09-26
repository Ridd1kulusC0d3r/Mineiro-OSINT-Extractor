# RELATÓRIO DE TESTES — Mineiro v1.4.2

Data: 26/09/2026

## Ambiente validado

| Item | Valor |
|---|---|
| CI | GitHub Actions |
| SO | Ubuntu runner |
| Node.js | 22 |
| Branch | `main` |
| Workflow run | `36277967662` |
| Commit testado | `176de1445f6d7b892b36b121f34312e1369344f4` |

## Testes executados

| Teste | Comando / etapa | Status |
|---|---|---|
| Instalação | `npm install --prefer-offline --no-audit --no-fund` | **PASSOU** |
| Registry | `npm run registry:validate` | **PASSOU** |
| TypeScript | `npm run lint` | **PASSOU** |
| Demo sintética | `npm run demo` | **PASSOU** |
| Intelligence assessment | `npm run intelligence:test` | **PASSOU** |
| Notebook oficial Colab | `npm run colab:validate` | **PASSOU** |
| Superfície de documentação | `npm run docs:validate` | **PASSOU** |
| Manual offline | `npm run manual:validate` | **PASSOU** |
| Launcher Linux | `bash -n iniciar-mineiro.sh` | **PASSOU** |
| Launcher macOS | `bash -n Iniciar-Mineiro.command` | **PASSOU** |
| Build de produção | `npm run build` | **PASSOU** |

## O que o CI protege nesta release

Além do build, a pipeline agora valida:

- existência do notebook canônico `Mineiro_Official_Colab.ipynb`;
- ausência de outputs salvos no notebook;
- tokens obrigatórios do fluxo Colab;
- ausência de referências aos notebooks legados nas páginas canônicas;
- existência do hub de documentação e guias essenciais;
- Registry válido;
- assessment e export analíticos;
- manual offline;
- sintaxe dos launchers.

## Testes não executados

| Teste | Status | Motivo |
|---|---|---|
| Windows `.bat` em Windows real | **NÃO EXECUTADO** | O CI desta release usa Ubuntu. |
| Abertura gráfica do `.command` no macOS | **NÃO EXECUTADO** | O CI desta release não usa macOS. |
| Abertura gráfica do `.bat` no Windows | **NÃO EXECUTADO** | O CI desta release não usa Windows. |
| Execução completa da UI dentro de uma VM Colab real | **NÃO EXECUTADO** | O CI valida a estrutura do notebook, mas não possui uma sessão Google Colab interativa. |
| Scan real contra todo o Registry | **NÃO EXECUTADO** | O CI não deve gerar tráfego amplo contra serviços externos. |

## Resultado

**PASSOU** para a superfície de produto validada em GitHub Actions.

A release v1.4.2 tem evidência automatizada para instalação, Registry, TypeScript, demo sintética, camada de inteligência, notebook oficial, documentação, manual, launchers shell e build.

Nenhum teste não executado foi promovido a PASSOU.

## Observações

A demo e o smoke test usam dados sintéticos/controlados. A pipeline não consulta pessoas reais nem executa full scan contra serviços externos.
