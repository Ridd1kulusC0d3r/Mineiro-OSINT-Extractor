# RELATÓRIO DE TESTES — Mineiro v1.3.2

Data: 26/09/2026

## Ambiente validado

| Item | Valor |
|---|---|
| CI | GitHub Actions |
| SO | Ubuntu runner |
| Node.js | 22 |
| Branch | `main` |
| Workflow run | `36273469255` |
| Commit testado | `3aeb785cc0b872c77e1901f7dd90cbcb53833375` |

## Testes executados

| Teste | Comando / etapa | Status |
|---|---|---|
| Instalação | `npm install` | **PASSOU** |
| Registry | `npm run registry:validate` | **PASSOU** |
| Estatísticas | `npm run registry:stats` | **PASSOU** |
| TypeScript | `npm run lint` | **PASSOU** |
| Demo sintética | `npm run demo` | **PASSOU** |
| Manual offline/estrutura | `npm run manual:validate` | **PASSOU** |
| Launcher Linux — sintaxe | `bash -n iniciar-mineiro.sh` | **PASSOU** |
| Launcher macOS — sintaxe shell | `bash -n Iniciar-Mineiro.command` | **PASSOU** |
| Build | `npm run build` | **PASSOU** |

## Testes não executados

| Teste | Status | Motivo |
|---|---|---|
| Windows `.bat` em Windows real | **NÃO EXECUTADO** | O CI desta release usa Ubuntu. |
| Abertura gráfica do `.command` no macOS | **NÃO EXECUTADO** | O CI desta release não usa macOS. |
| Abertura gráfica do `.bat` no Windows | **NÃO EXECUTADO** | O CI desta release não usa Windows. |
| Renderização headless completa do `MANUAL.html` | **NÃO EXECUTADO** | A tentativa local com Chromium excedeu a janela disponível; a estrutura offline foi validada por script. |
| Scan real contra 985 serviços | **NÃO EXECUTADO** | Não é apropriado gerar tráfego repetitivo contra serviços externos em um teste de documentação/CI. |

## Resultado

**PASSOU** para instalação, validação do Registry, TypeScript, demo sintética, estrutura offline do manual, sintaxe dos lançadores shell e build de produção.

Os testes de interface gráfica específicos de Windows/macOS permanecem explicitamente não executados. Nenhum resultado foi promovido a PASSOU sem evidência de execução.

## Observações

A demo contém apenas observações sintéticas e não consulta pessoas reais. O CI valida o mecanismo de benchmark sem gerar tráfego contra o catálogo externo.
