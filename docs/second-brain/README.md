# DUTRA Builder Brain — Second Brain

This directory is the durable engineering/product memory for the project.

## Canonical vs human-readable

Canonical records live in JSONL collections. Humans should normally start from:

- `BRAIN_INDEX.md` — generated navigation/index.
- `BRAIN_METRICS.md` — generated adoption/outcome metrics.
- `CONTEXT_ROUTER.md` — task → minimal context/skill routing.
- `KNOWLEDGE_SCHEMA.md` — mapping from compiler concepts to the canonical Builder Brain schema.

Refresh generated surfaces and validate the graph with:

```bash
npm run og:brain:refresh
```

## Collections

- `sources.jsonl` — sources/references.
- `knowledge.jsonl` — validated facts.
- `patterns.jsonl` — reusable patterns.
- `decisions.jsonl` — chosen directions.
- `ideas.jsonl` — candidates, not commitments.
- `experiments.jsonl` — uncertainty-reduction tests.
- `open-questions.jsonl` — unresolved material questions.
- `anti-patterns.jsonl` — risks to avoid.
- `incidents.jsonl` — important bugs/incidents with root cause, fix, prevention and regression test.
- `cycles.jsonl` — STANDARD/STRUCTURAL cycle adoption log.

## Provenance

Use:

- `source_ids` for evidence sources;
- `derived_from` for reasoning lineage;
- `supersedes` for replacement history.

Do not silently rewrite historical decisions when evidence changes. Supersede them.

## Proportionality

- MICRO: no brain ceremony unless durable learning appears.
- STANDARD: consult relevant brain context, then close out with cycle + refresh.
- STRUCTURAL: full evidence/architecture/safety loop and cycle + refresh.

## Stable vs dynamic information

The Second Brain stores durable rules, decisions, patterns, incidents and supported facts. It does **not** store volatile customer state such as latest conversation, account-specific negotiated price, next action or current proposal status; those belong to CRM/runtime data.

## Safety

Never place credentials, tokens, passwords, private exports, raw recordings or unnecessary customer personal data here.
