# DUTRA Collaboration Protocol — Lucas + ChatGPT + Codex

## Goal

Create a working rhythm where planning, execution and follow-up do not depend on remembering a long conversation.

The system should proactively turn important discussions into reusable work material.

## Roles

### ChatGPT / QG
Owns preparation: audit, architecture, comparison, decisions, prompts, action packs, rollback, review and checkpoint interpretation.

### Codex / Workshop
Owns execution: checkout, edits, tests, browser QA, commit and push.

### Lucas
Owns product intent, approvals and manual access that only exists on his PC/account.

## Default cadence

1. Discuss goal.
2. QG converts it into an exact package.
3. Codex executes only the package.
4. Codex stops at checkpoint.
5. Lucas brings checkpoint back.
6. QG validates and prepares the next package.

## When Codex credits end

Do not burn time waiting. QG switches to preparation: compare evidence, build future prompts, create recovery kits and checklists, inspect GitHub, identify next decisions and reduce future Codex work.

## Manual-action communication

Whenever Lucas must do something manually, provide step number, where to click/go, what to paste/type, what should appear, what not to do, and what to send back.

## Prepared-later files

When useful, prepare files before Lucas reaches the PC: ZIP recovery kit, README, manifest, inventory helper, Codex prompt, audit checklist, error fallback and handoff.

## State persistence

Current execution state belongs in handoff/checkpoint docs.
Stable collaboration behavior belongs in .codex/skills/dutra-collaboration-orchestrator/SKILL.md.

Do not rely on conversation recall as the only source.

## Safety

No hidden overwrite. No production mutation without explicit approval. No main merge without explicit approval. No secret in packs/docs. No local PC version copied over canonical Git without a diff/audit first.
