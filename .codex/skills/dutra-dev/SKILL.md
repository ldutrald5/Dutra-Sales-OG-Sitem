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

For any STANDARD/STRUCTURAL task that depends on repository checkout, Git transport, package/tool execution or external execution infrastructure, load `.codex/skills/dutra-environment-guardian/SKILL.md` before local code work.

For live hosted state also load `.codex/skills/dutra-runtime-operator/SKILL.md` and verify infrastructure live.

## Procedure
1. Prove the execution route first: valid checkout OR connected repository provider, required toolchain, writable safe branch and test capability. Do not assume `/workspace` is a checkout.
2. If local Git transport fails, classify proxy/network/auth separately and use the Environment Guardian fallback ladder. Do not repeat an unchanged failed transport.
3. Search existing code/service/contract first.
4. Check active ADR/decision and historical incident.
5. Identify canonical data owner and rollback.
6. For Supabase/schema/Edge Function work, compare the live project inventory with versioned `supabase/migrations/` and `supabase/functions/` before changing structure.
7. Implement the smallest reversible change.
8. Reuse existing contracts instead of parallel logic.
9. Add/extend a regression test.
10. Run relevant tests; never report NOT RUN as PASS. Environment-blocked tests are NOT RUN, not FAIL.
11. Return durable learning to the Second Brain when material.

## Guardrails
- Treat local CLI Git, GitHub connector/provider and hosted runtime access as separate capabilities. One working path does not prove the others.
- Never infer an invalid token from a request that failed at proxy/network transport.
- Remote provider writes require an explicitly authorized safe branch and must never be used to bypass required local tests.
- Keep vanilla JS unless evidence justifies a framework change.
- Preserve local/runtime data.
- No silent conflict overwrite.
- No secret in browser persistent storage or docs.
- Do not rewrite mature behavior solely because a newer UI exists.
- Do not treat live-only Supabase migrations/functions as a reproducible release; preserve schema/function source in Git and record intentional drift.

## Output
BEFORE / AFTER / WHY / FILES / RISK / VALIDATION / ROLLBACK.
