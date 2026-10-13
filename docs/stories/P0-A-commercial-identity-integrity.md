# P0-A — Recuperação da integridade comercial

Status: Ready for Review — P0-A APROVÁVEL localmente; publicação não autorizada. Base: `9f2d33a8585e3c991cba17f9fa7622096d9bacd0`, integration/dutra-os-one-system.

## Missão e limites

Corrigir F01/F02 e gravação em homônimos da DUTRA-AUDIT-001 sobre os owners CRM/quote existentes. Implementação, fixtures e commits somente locais. Sem push/deploy/dados reais, P0-B, preços/fórmulas ou redesign.

## Critérios

- [x] Reprodução adversarial antes da correção, com dados fictícios.
- [x] Troca de cliente explícita; contexto comercial limpo e cliente B canônico.
- [x] Composição não salva permite cancelamento, descarte ou revisão técnica independente, sem dados/preços específicos de A.
- [x] Nome/identificadores incompatíveis impedem persistência/preparo/exportação.
- [x] Pontes CRM, Meu Dia/Mesa, Command Center e técnico usam o contrato seguro.
- [x] Texto/OCR reutiliza preview/revisão existente, sem gravação antecipada.
- [x] Email significativo e telefone com DDI usam comparação canônica; ambiguidades não são mescladas.
- [x] IDs únicos, import idempotente e cancelamento sem escrita parcial.
- [x] Homônimos exigem escolha de identidade antes de gravação.
- [x] Histórico/propostas antigas intactos, incluindo ausência do cliente original.
- [x] Regressões locais/browser/PDF, offline/reconnect e gates executados.
- [x] Diff revisado, Brain/checkpoint e commits locais; nenhuma publicação.

## Evidência e arquivos

Reproduções no baseline: `/workspace/artifacts/DUTRA-P0-A/before-adversarial-summary.json` e `before/journey/commercial-identity-before.json`. Evidência nova: `after/final-browsers/commercial/result.json` (19 casos, zero erros JS/requests externos/window.open), `identity-manifest.json` e `proposal-manifest.json` com hashes estáveis do código. Cenário fictício B: 2 cavalos4×2 + 3 carretas3eixos, 88peças, 44pneus atendidos, R$6.490,00 pelo engine existente; PDF efetivamente gerado/reaberto sem conteúdo de A.

Executados: `npm run lint`, `npm test` (83/83), `npm run release:gate`, testes focados identidade/contexto/snapshot/planilha/nativeimport/pilotfixture/CRM/prospecção/Mesa; browsers auth/session, sync/reconnect/503/409, shell/PWA, prospecção e proposal operational Impacto (PDF/PNG, oito viewports). Após a guarda histórica, identity/proposal operational foram reexecutados no código congelado. Brain refresh/check e intelligence test integram o fechamento. A callback do inspector legado não é montada no CRM atual e foi testada em VM com o código real, não declarada como fluxo UI nativo.

Limites: dados sintéticos/tempdata somente; sem homologação humana, aparelho físico ou online. Um lote alterando a identidade do mesmo alvo em várias linhas pode abortar e exigir novo preview. Cadastros/versões históricos incoerentes não são migrados: permanecem para revisão.

## File list

- `apps/sistema-og/app.js`: resolver/transição, guardas de histórico/proposta/draft/export/OCR, importação legado, Command Center.
- `apps/sistema-og/services/crm-service.js`: identidade canônica, chaves email/DDI e IDs.
- `apps/sistema-og/services/spreadsheet-import-service.js`: matcher/revisão/assinaturas/aplicação atômica existentes.
- `apps/sistema-og/services/quote-client-context-service.js`: helper puro, sem engine/store.
- `apps/sistema-og/services/proposal-intelligence-service.js`: rejeição de contexto pendente/contraditório.
- `apps/sistema-og/index.html`, `service-worker.js`: carregar/precache do helper, SWv83.
- `scripts/test_crm_identity_integrity.mjs`, `test_commercial_quote_context.mjs`, `test_commercial_identity_browser.mjs`: regressões novas.
- `scripts/test_client_sheet.mjs`, `test_spreadsheet_import.mjs`, `test_native_lead_import_export_smoke.mjs`, `test_quote_composition_snapshot.mjs`: contratos existentes atualizados com revisão explícita/owner real e relógio constante.
- `package.json`, `scripts/validate.mjs`: gates novos, sem dependências.
- `.codex/skills/dutra-crm/SKILL.md`: procedimento durável de identidade/revisão.
- `docs/second-brain/{sources,incidents,patterns,open-questions,cycles}.jsonl`, índices/métricas gerados: proveniência/learning e análise externa.
- `docs/01-ARQUITETURA.md`, `CHANGELOG.md`, `tasks/TODO.md`, `tasks/DONE.md`, esta story, `docs/handoffs/V3_UNIFICATION_CHECKPOINT.md`: contrato/checkpoint local.

## Análise do Manus

Replay compartilhado efetivamente lido; entrega mais recente é SQL remoto Sales Execution sobre baseline9f2d33a. Não resolve F01/F02 locais. Teste do autor em schema mínimo difere do índice parcial do repo; concorrência/idempotência/rollback de função exigem homologação futura autorizada. Relatório sanitizado: `/workspace/artifacts/DUTRA-P0-A/manus/MANUS_REVIEW.md`; SQL/brutos privados fora do Git. Nenhuma migração aplicada.


## Rollback

Reverter os commits P0-A quando identificados; preservar todo estado persistido e documentos. Não resetar trabalho de terceiros nem executar limpeza de storage. Base anterior registrada acima, sem alteração de runtime.
