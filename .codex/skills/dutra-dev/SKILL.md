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
4. For Supabase/schema/Edge Function work, compare the live project inventory with versioned `supabase/migrations/` and `supabase/functions/` before changing structure.
5. Implement the smallest reversible change.
6. Reuse existing contracts instead of parallel logic.
7. Add/extend a regression test.
8. Run relevant tests; never report NOT RUN as PASS.
9. Return durable learning to the Second Brain when material.

## Guardrails
- Keep vanilla JS unless evidence justifies a framework change.
- Preserve local/runtime data.
- No silent conflict overwrite.
- No secret in browser persistent storage or docs.
- Do not rewrite mature behavior solely because a newer UI exists.
- Do not treat live-only Supabase migrations/functions as a reproducible release; preserve schema/function source in Git and record intentional drift.

## Output
BEFORE / AFTER / WHY / FILES / RISK / VALIDATION / ROLLBACK.
