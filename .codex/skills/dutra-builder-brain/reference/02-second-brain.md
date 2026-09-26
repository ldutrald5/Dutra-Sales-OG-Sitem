# Second Brain Protocol

The second brain stores durable knowledge that should survive chats, agents and implementation phases without becoming a dump.

Default location: `docs/second-brain/`.

## Collections

- `sources.jsonl` — meaningful source/reference.
- `knowledge.jsonl` — durable supported facts.
- `patterns.jsonl` — reusable methods/patterns.
- `decisions.jsonl` — chosen directions (link ADR when available).
- `ideas.jsonl` — candidate improvements, not commitments.
- `experiments.jsonl` — uncertainty-reduction tests and outcomes.
- `open-questions.jsonl` — material unknowns.
- `anti-patterns.jsonl` — failures/risks to avoid.
- `cycles.jsonl` — STANDARD/STRUCTURAL work-cycle adoption and outcome log.

## Required common schema

All records require:

- `id` — stable unique ID.
- `type` — collection-appropriate type.
- `title` — concise human label.
- `statement` — compact meaning/outcome.
- `status` — lifecycle state.
- `confidence` — `low | medium | high`.
- `project_scope` — applicability boundary.
- `tags` — array.
- `source_ids` — array of source records; may be empty only for a root source or when `derived_from` provides valid provenance.
- `derived_from` — array of brain record IDs that materially led to this record.
- `created_at` — ISO date/date-time.
- `updated_at` — ISO date/date-time.

Optional common fields: `supersedes`, `notes`, `what_changes_this`.

## Type-specific minimums

### source
Requires `source_kind` and `origin` (`internal`, `external`, `user-review`, etc.). A root source may have empty `source_ids`/`derived_from`.

### knowledge
Requires `evidence_summary`.

### pattern
Requires `applicability`.

### decision
Requires `rationale`; add `adr` when an ADR exists.

### idea
Requires `problem`, `smallest_test`, and `non_goals` (array).

### experiment
Requires `hypothesis`; completed/implemented experiments require `result`.

### open_question
Requires `decision_impact`.

### anti_pattern
Requires `risk`.

### cycle
Requires `scope_class`, `brain_available`, `brain_consulted`, `brain_updated`, `outcome`, `started_at`, `completed_at`.

## Relationship rules

Use three explicit relation types:

- `source_ids` = evidence provenance.
- `derived_from` = reasoning lineage (pattern → idea, source → decision, etc.).
- `supersedes` = lifecycle replacement.

All referenced IDs must exist. The checker validates referential integrity.

## Status model

Common statuses include `candidate`, `validated`, `active`, `planned`, `implemented`, `rejected`, `superseded`, `deprecated`, `open`, `resolved`, `completed`, `deferred`.

## Human retrieval

JSONL remains the canonical lightweight store, but humans should start with generated files:

- `BRAIN_INDEX.md` — collection summary, active decisions, open questions, ideas, sources and relation overview.
- `BRAIN_METRICS.md` — adoption and effectiveness metrics.

Do not hand-maintain these generated files. Run:

```bash
npm run og:brain:refresh
```

## Quality gate

`og:brain:check` validates more than JSON syntax:

- required common/type-specific fields;
- allowed confidence/status/type;
- unique IDs;
- relation integrity;
- root-source exception rules;
- stale/missing generated index/metrics;
- basic semantic hygiene such as non-empty statements and arrays.

It still cannot prove truth. Human/agent evidence discipline remains necessary.

## Learning loop

After each STANDARD/STRUCTURAL cycle:

1. consult relevant brain entries before material decisions;
2. capture newly confirmed facts/decisions/patterns;
3. preserve rejected/deferred ideas when the reason is reusable;
4. close/create open questions;
5. record a `cycle` entry;
6. run `npm run og:brain:refresh`.

MICRO changes skip this unless they produce durable learning.

## Promotion rule for ideas

An idea moves from `candidate` to `planned` only when the problem is real enough, dependencies/ownership are understood, rollback/risk is known and it does not conflict with an active decision without review.

## Sensitive-data rule

Do not store credentials, tokens, raw customer exports, private recordings, passwords or unnecessary personal data. The brain stores distilled engineering/product knowledge, not operational secrets.
