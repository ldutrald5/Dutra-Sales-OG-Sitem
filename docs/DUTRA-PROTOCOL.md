# DUTRA PROTOCOL — economical agent workflow

> This is a compact routing protocol over the existing Builder Brain. It is not a replacement for AIOX, stories, quality gates or `.codex/skills/dutra-builder-brain/`.

## Core operating rules

1. Start from `DUTRA-BRAIN.md` + `CURRENT.md`, not from a repository-wide reread.
2. Use progressive context: **Brain → scoped module docs → exact code/data files**.
3. Search for an existing implementation before creating a new one.
4. Work on one authorized package/problem at a time.
5. Preserve data, stable IDs, compatibility and rollback paths.
6. Do not turn suggestions, AI output or channel opens into factual commercial events.
7. Prefer deterministic rules/templates/calculations before AI.
8. Use the smallest safe change that solves the objective.
9. Do not convert a local bug fix into an unrelated refactor.
10. Run relevant tests/gates before closeout; a blocked gate is a valid result.
11. Update durable brain state only when the task creates durable learning/decisions.
12. Update `CURRENT.md` when a meaningful package/baseline closes.
13. Do not start the next major package automatically.
14. For live runtime claims, query Railway; never trust remembered status.
15. Never store secrets, tokens, private exports or unnecessary customer personal data in Git/brain docs.

## Project shorthand

These are **conversation shorthands**, not shell commands.

### `/STATUS`
Read `DUTRA-BRAIN.md`, `CURRENT.md`, relevant canonical brain entries, then verify live GitHub/Railway when the question depends on them. Report facts only. Make no changes.

### `/BUILD <package>`
Implement only the authorized package. Confirm scope, inspect existing capability, define acceptance criteria, make the smallest reversible vertical slice, test, update docs/brain/current as required, then stop.

### `/AUDIT <package-or-change>`
Do not implement product changes. Compare code/evidence against acceptance criteria, decisions, regression risk, data safety and UX. Return actionable findings.

### `/FIX <problem>`
Reproduce/locate cause first. Read only relevant context. Apply the smallest safe fix, add/update the focused regression test, run relevant gates, document durable learning only if warranted.

### `/IDEA <theme>`
Product/UX/strategy exploration only. Inspect current context first. Separate evidence, hypothesis and idea. Do not write product code or promote the idea into scope automatically.

## Context budget discipline

- Do not load all of `docs/`, `knowledge/` or `docs/second-brain/` by default.
- Start from generated indexes and IDs.
- Prefer a few relevant files over a repository dump.
- Reuse summaries only while they match live code; code/provider state wins when they disagree.
- Screenshots are useful for visual/bug evidence; repeated ZIPs are not a substitute for live GitHub state.
- Commercial source files can be consulted when they materially affect the task; do not ingest them all automatically.

## Builder vs Auditor

Recommended operating model:

- **Builder:** the only agent changing the current package branch/code.
- **Auditor:** reviews evidence/PR and does not independently implement the same package.
- **Fix loop:** findings → targeted fixes → rerun gates → close.
- **Then** authorize the next package.

This prevents concurrent agents from overwriting or duplicating work.
