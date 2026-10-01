# ADR-INTELLIGENCE-COMPILER-001 — Operational Knowledge Architecture

- Date: 2026-10-01
- Status: ACTIVE
- Scope: DUTRA OS agents, engineering memory and stable commercial/technical knowledge

## Context

The repository already contains a canonical context, the DUTRA Builder Brain, JSONL provenance records, runtime knowledge files, AIOX agents and product tests. Conversation history contains additional durable rules, playbooks and incident learnings. Creating another parallel `/knowledge-system` would create drift.

## Decision

1. Extend the existing `docs/second-brain/` as the durable evidence/decision graph.
2. Keep `DUTRA_OS_CONTEXT.md`, `EXECUTION_CONTEXT.md` and scoped docs as current human context.
3. Add thin DUTRA domain Skills under `.codex/skills/`; Skills route to context rather than copy the whole Base Mestra.
4. Keep stable commercial/domain guidance in `knowledge/` and `docs/playbooks/`.
5. Keep dynamic account facts in CRM/runtime data, never in global Skills.
6. Add `incidents.jsonl` to the Second Brain so important bugs retain symptom → cause → fix → prevention → regression test.
7. Add a context router and a knowledge-regression contract test.
8. Current tested code and validated OG evidence outrank recovered historical conversation when they conflict.
9. No secret value may enter Skills, docs or Second Brain.

## Consequences

- Agents can load smaller context bundles.
- Historical bugs become reusable regression knowledge.
- Conversation recovery becomes evidence, not an alternate source of truth.
- The same rule can be traced to source/decision/test.
- Domain knowledge remains usable without freezing volatile customer data.
- Existing Builder Brain remains the single engineering/product memory.

## Rejected alternatives

### Create a new parallel knowledge tree
Rejected because it duplicates Builder Brain and creates two memories.

### Put all history into every Skill
Rejected because it increases token cost and causes stale duplicated rules.

### Treat conversation reports as canonical
Rejected because current code, validated evidence and live persisted data have higher authority.

## Validation

- `npm run og:intelligence:test`
- `npm run og:brain:refresh`
- relevant product tests
