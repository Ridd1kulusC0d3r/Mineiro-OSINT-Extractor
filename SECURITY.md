# Security Policy

## Supported version
A versão pública atual é a `1.x`.

## Reporting a vulnerability
Evite publicar detalhes exploráveis em uma issue pública. Nunca inclua chaves, tokens, cookies, credenciais ou dados pessoais desnecessários.

## Secrets
O arquivo `.env` e credenciais reais não devem ser versionados.

## Scope
Falhas em serviços externos consultados pela aplicação não são, por si só, vulnerabilidades deste projeto.


## Operational safety

- mantenha concorrência conservadora;
- respeite rate limits e termos aplicáveis;
- não tente contornar autenticação, CAPTCHA ou controles de acesso;
- trate bloqueios como `uncertain`, não como convite para escalada técnica;
- não armazene tokens, cookies ou credenciais no catálogo.
