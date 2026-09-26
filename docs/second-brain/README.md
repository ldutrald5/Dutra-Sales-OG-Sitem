# DUTRA Builder Brain — Second Brain

This directory is the durable engineering/product memory for the project.

## Canonical vs human-readable

Canonical records live in JSONL collections. Humans should normally start from:

- `BRAIN_INDEX.md` — generated navigation/index.
- `BRAIN_METRICS.md` — generated adoption/outcome metrics.

Refresh both and validate the graph with:

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

## Safety

Never place credentials, tokens, passwords, private exports, raw recordings or unnecessary customer personal data here.
