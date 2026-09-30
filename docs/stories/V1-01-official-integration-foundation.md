# V1-01 — Fundação da integração oficial

## Objetivo

Estabelecer uma branch reproduzível, gates verdes e uma única fonte de verdade para o motor técnico/cotação usado pela V3.

## Critérios de aceite

- [x] Branch isolada a partir da V3 Premium.
- [x] Baseline registrado.
- [x] Falhas de sync/paridade diagnosticadas e corrigidas.
- [x] Fonte canônica do motor técnico e de cotação criada.
- [x] Consolidação multi-veículos criada no domínio, com breakdown e bloqueio por ambiguidade.
- [x] Espelhos de deploy protegidos por teste.
- [x] Documentação inicial de integração, persistência, cotação, testes e riscos.
- [x] `npm run validate` após as mudanças.
- [x] Commit e publicação da branch.
- [ ] Preview Railway validado sem alteração de produção — bloqueado pelo limite de recursos do plano gratuito; serviços existentes não foram reaproveitados sem evidência de que estavam livres.

## Arquivos

- `apps/sistema-og/services/technical-application-service.js`
- `apps/sistema-og/services/quote-engine-service.js`
- `scripts/test_v1_quote_engine.mjs`
- `scripts/test_v1_quote_mirror.mjs`
- `docs/INTEGRATION-V1-MAP.md`
- `docs/PERSISTENCE-V1.md`
- `docs/QUOTE-ENGINE.md`
- `docs/V1-TEST-PLAN.md`
- `docs/V1-KNOWN-ISSUES.md`
