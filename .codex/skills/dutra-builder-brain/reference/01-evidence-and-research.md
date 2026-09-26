# Evidence, research and external reference intake

## Evidence ladder

Prefer evidence in this order for project facts:

1. Runtime behavior / reproducible test.
2. Current production/source code and schema.
3. Versioned configuration/migrations/contracts.
4. Current project documentation.
5. Historical docs/issues/conversations.
6. Inference.

For external facts, prefer primary/official sources and current versions.

Always label important claims as one of:

- CONFIRMED_LOCAL
- CONFIRMED_EXTERNAL
- DOCUMENTED_NOT_VERIFIED
- INFERENCE
- UNKNOWN

## New source intake

For every serious source create or mentally fill a Source Card:

- source_id
- title
- source_type (repo, paper, docs, article, product, interview, dataset, video, conversation)
- owner/author
- version/date
- URL/path
- license/terms when code/assets may be reused
- question this source helps answer
- reliability/freshness notes
- relevant sections
- extracted facts
- extracted patterns
- risks/anti-patterns
- unknowns

Do not read an entire large source indiscriminately. Start with the question, then inspect the relevant evidence.

## Reverse-engineering protocol

For an external software system, inspect only what matters to the current problem:

1. topology/stack;
2. source of truth and data model;
3. identity/auth/authorization;
4. write/read paths;
5. concurrency/sync/delete;
6. migrations/backup/restore;
7. integrations/events/idempotency;
8. AI/knowledge boundaries if relevant;
9. tests/observability/deploy;
10. license/coupling/security;
11. maturity gaps and NOT CONFIRMED areas.

Output patterns, not admiration.

## Transferability test

Before recommending an observed pattern, answer:

- Which exact problem does it solve in the reference?
- Does our project have the same problem?
- Is the scale/team/risk similar enough?
- Can we adopt the principle without the same technology?
- What complexity would we import?
- Is code reuse needed, or is pattern reuse enough?

## Research brief

Good research begins with a decision-shaped question.

Example:

> We need reliable two-device synchronization for one seller. Compare refresh-on-focus + optimistic concurrency versus full realtime. Focus on correctness, operational cost and migration impact; do not optimize for large-team collaboration.

Research ends when uncertainty is reduced enough to make the next decision, not when the internet is exhausted.
