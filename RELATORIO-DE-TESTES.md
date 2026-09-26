# RELATÓRIO DE TESTES — Mineiro v1.3.2

Data: 26/09/2026

## Ambiente validado

| Item | Valor |
|---|---|
| CI | GitHub Actions |
| SO | Ubuntu runner |
| Node.js | 22 |
| Origem | branch `release/mineiro-v1.3.2-docs` |

## Testes previstos no CI

| Teste | Comando | Status |
|---|---|---|
| Instalação | `npm install` | AGUARDANDO CI DA v1.3.2 |
| Registry | `npm run registry:validate` | AGUARDANDO CI DA v1.3.2 |
| Estatísticas | `npm run registry:stats` | AGUARDANDO CI DA v1.3.2 |
| TypeScript | `npm run lint` | AGUARDANDO CI DA v1.3.2 |
| Build | `npm run build` | AGUARDANDO CI DA v1.3.2 |
| Demo sintética | `npm run demo` | AGUARDANDO CI DA v1.3.2 |
| Manual offline/estrutura | `npm run manual:validate` | AGUARDANDO CI DA v1.3.2 |
| Launcher Linux — sintaxe | `bash -n iniciar-mineiro.sh` | AGUARDANDO CI DA v1.3.2 |
| Launcher macOS — sintaxe shell | `bash -n Iniciar-Mineiro.command` | AGUARDANDO CI DA v1.3.2 |

## Testes não executados

| Teste | Status | Motivo |
|---|---|---|
| Windows `.bat` em Windows real | NÃO EXECUTADO | O CI atual usa Ubuntu. |
| Abertura gráfica do `.command` no macOS | NÃO EXECUTADO | O CI atual não usa macOS. |
| Abertura gráfica do `.bat` no Windows | NÃO EXECUTADO | O CI atual não usa Windows. |
| Scan real contra 985 serviços | NÃO EXECUTADO | Não é apropriado como teste repetitivo de documentação/CI. |

## Critério

Nenhum resultado deve ser marcado como PASSOU sem execução comprovada. Após o CI desta versão, este arquivo deve ser atualizado com os resultados observados.
