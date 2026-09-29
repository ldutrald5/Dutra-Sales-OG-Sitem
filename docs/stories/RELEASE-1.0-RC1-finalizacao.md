# DUTRA OS 1.0 RC1 — Finalização

## Objetivo
Entrar em modo release final: corrigir produção, estabilizar autenticação/sincronização e eliminar falhas que atrapalham o uso diário antes de qualquer expansão funcional.

## Critérios RC1
- login hospedado sem loop de prompts concorrentes;
- cache do PWA atualizado junto com a correção;
- CI completo verde;
- merge somente após validação;
- Railway publicado no SHA da RC1;
- /health respondendo;
- nenhum dado comercial apagado ou migrado de forma destrutiva.

## Próximos blocos
1. autenticação e runtime hospedado;
2. deploy/health/versionamento;
3. DUTRA Research ponta a ponta;
4. UX de erro/loading/estados vazios;
5. mobile e fluxo diário;
6. release candidate final.

## Fora da RC1
Novos módulos grandes, multi-agent avançado, Digital Twin profundo e portal do cliente ficam para versões posteriores.
