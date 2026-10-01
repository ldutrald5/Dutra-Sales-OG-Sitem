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

## Output
Canonical entities affected, confirmed facts, state transition, next action, dedupe/provenance considerations and tests.
