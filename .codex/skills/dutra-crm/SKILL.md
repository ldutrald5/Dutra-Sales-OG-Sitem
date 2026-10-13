---
name: dutra-crm
description: DUTRA OS CRM/domain specialist. Use for Account/Company, Contact/People, pipeline, relationship status, lists, sessions, next actions, meetings, proposals, orders, post-sale, deduplication and canonical identity.
metadata:
  short-description: Canonical CRM organization and commercial state
---

# DUTRA CRM

## Load
- current CRM/runtime record;
- `DUTRA_OS_CONTEXT.md`;
- `docs/02-BANCO-DE-DADOS.md`;
- `docs/architecture/SALES-EXECUTION-CONTRACT.md`;
- active canonical-data decisions/patterns in Second Brain.

## Rules
- CRM/account identity is central; lists are operational collections/views, not a second database.
- One business entity may appear in many lists without duplication.
- Pipeline stage and relationship state are separate concepts.
- Contact roles coexist; discovering a decision maker does not erase a gatekeeper.
- Stage/result changes require explicit confirmed evidence.
- Next action/follow-up must reuse central contracts.
- Weak identity matches require review before canonical linking.

## Procedure
Inspect canonical owner → identify mutation contract → validate identity → apply explicit confirmed fields only → create activity/next action → test alternate UI paths.

## Commercial identity integrity

- Reuse `OG_CRM_SERVICE.resolveClientIdentity` before binding quote/customer data; a possible duplicate is only a review candidate.
- Client changes use the explicit quote transition: clean context by default; cancel leaves it intact; technical-only reuse strips negotiated prices, notes, ROI, media and prior IDs and requires review.
- Persist/prepare/export only when displayed company, canonical IDs and vehicle/document owners agree. Historical snapshots never acquire another client by name fallback.
- Text/OCR and spreadsheets use the same preview/matcher/review. Apply to a cloned batch, validate every selected identity, then commit; cancellation or stale identity means no partial write.
- Reuse typed `emailIdentity`/`phoneIdentity`: email punctuation/provider aliases stay distinct; strip Brazil DDI only for a structurally valid complete Brazilian number. Comparison does not rewrite raw source fields.
- Generate IDs independently of collection size with `createLeadId`; reject missing/duplicate existing IDs and changed bounded identity signatures before applying reviewed imports.
- Confirm interpreted commands and target company separately. Never choose the first homonym; duplicate IDs or identity changes while reviewing block writes.
- Historical documents require matching quote ID, record owner and snapshot owner before copying terms/ROI/branding. Preserve incompatible old records for review without automatic migration.

## Output
Canonical entities affected, confirmed facts, state transition, next action, dedupe/provenance considerations and tests.

## V3 domain guidance retained for later convergence

Current Environment Guardian, canonical data and tested baseline rules above take precedence.

# DUTRA CRM

## Carregar

- `docs/04-CRM.md`
- `docs/05-MESA-DE-VENDAS.md`
- serviços/entidades realmente envolvidos;
- `docs/architecture/DUTRA_INTELLIGENCE_DECISIONS.md`.

## Modelo mental

- Company/Account = raiz;
- Contacts = pessoas da conta;
- lista = membership operacional, não cópia da empresa;
- pipeline comercial != relationship status;
- gatekeeper não é apagado quando decisor aparece;
- atividade registra fato;
- Next Action orienta trabalho;
- session organiza execução, não cria outro CRM.

## Guardrails

- deduplicar antes de cadastrar;
- não alterar estágio por abrir WhatsApp/cotação;
- não inferir contato realizado;
- não congelar dados de cliente em Skills;
- IA propõe mudanças, Review Gate aprova;
- preservar `legacyLeadId/external_id` durante reconciliação.

## Saída

Atualização mínima da conta central + histórico/next action apropriados, sem duplicar identidade.
