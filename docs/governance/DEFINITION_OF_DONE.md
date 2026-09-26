# Definition of Done e Release Gate

Uma mudança está pronta para revisão quando:

- parte de branch atualizada, sem alteração direta do `main`;
- `npm ci` reproduz o lockfile sem modificá-lo;
- `npm run validate`, `npm run og:brain:check`, `npm run og:security:test` e `npm run release:gate` passam;
- `npm audit --audit-level=high` passa;
- dados reais e diretórios privados permanecem intactos;
- mudanças de contrato têm teste e rollback documentado;
- segredos não entram no Git e nenhum token privilegiado é usado no navegador;
- a PR descreve risco residual e não faz deploy automaticamente.

## Proteção recomendada para `main`

Exigir PR, checks obrigatórios do workflow Package 00R, bloquear force-push e exclusão. Exigir uma revisão quando houver um segundo mantenedor. Esta política é instrução; o Package 00R não altera configurações remotas.
