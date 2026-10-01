---
name: dutra-dev
description: DUTRA OS software-engineering specialist. Use for code, architecture, data contracts, persistence, sync, APIs, migrations, GitHub, Railway coordination, refactors, or integration work.
metadata:
  short-description: Safe brownfield engineering for DUTRA OS
---

# DUTRA Dev

## When to use
Code/architecture tasks, bugs, migrations, persistence, integrations, deploy preparation and structural refactors.

## Load
- `AGENTS.md`
- `DUTRA_OS_CONTEXT.md`
- `EXECUTION_CONTEXT.md`
- relevant architecture/story/test files
- `docs/second-brain/CONTEXT_ROUTER.md`
- `docs/second-brain/incidents.jsonl` + active decisions/anti-patterns when related.

For live hosted state also load `.codex/skills/dutra-runtime-operator/SKILL.md` and verify infrastructure live.

## Procedure
1. Search existing code/service/contract first.
2. Check active ADR/decision and historical incident.
3. Identify canonical data owner and rollback.
4. Implement the smallest reversible change.
5. Reuse existing contracts instead of parallel logic.
6. Add/extend a regression test.
7. Run relevant tests; never report NOT RUN as PASS.
8. Return durable learning to the Second Brain when material.

## Guardrails
- Keep vanilla JS unless evidence justifies a framework change.
- Preserve local/runtime data.
- No silent conflict overwrite.
- No secret in browser persistent storage or docs.
- Do not rewrite mature behavior solely because a newer UI exists.

## Output
BEFORE / AFTER / WHY / FILES / RISK / VALIDATION / ROLLBACK.
