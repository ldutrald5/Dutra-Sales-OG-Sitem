# DUTRA Intelligence Context Router

Purpose: load the smallest context set that is sufficient for a task. This file routes agents; it does not replace canonical product/runtime documents or CRM data.

## Truth precedence

1. Current persisted operational data for the account/task.
2. Explicitly validated OG technical/business evidence.
3. Current tested code and contracts on GitHub `main`.
4. Current architecture/context documents.
5. Second Brain active decisions/knowledge/patterns.
6. Recovered conversation history.
7. Assumptions, hypotheses and ideas.

Conflicts are never resolved silently. Record the conflict or leave it as `NEEDS_VALIDATION`.

## Stable knowledge vs dynamic data

Stable rules, architecture, heuristics, playbooks and anti-patterns may live in Skills, `knowledge/`, docs or the Second Brain.

Dynamic customer state must remain in CRM/runtime stores: last conversation, quote, price negotiated for one account, next action, meeting, stock, opportunity stage, proposal status and other volatile facts.

Never freeze dynamic customer data inside a global Skill.

## Router

| Task signal | Skills | Read first | Deep references |
|---|---|---|---|
| project direction / cross-cutting | dutra-core | `DUTRA_OS_CONTEXT.md`, `EXECUTION_CONTEXT.md` | `docs/second-brain/BRAIN_INDEX.md` |
| code / architecture / refactor | dutra-dev | `AGENTS.md`, scoped architecture docs | incidents + active decisions |
| execution environment / checkout / Git transport / proxy / toolchain | dutra-environment-guardian + dutra-dev | `.codex/skills/dutra-environment-guardian/SKILL.md`, repository/provider state | relevant incident + active task checkpoint |
| Railway / production / logs | dutra-dev + dutra-runtime-operator | runtime skill + live infrastructure | `docs/runtime/DUTRA_OS_RUNTIME.md` |
| Supabase / schema / Edge Functions | dutra-dev | live Supabase inventory + `supabase/migrations/` + `supabase/functions/` | `INC-SUPABASE-DRIFT-001` + architecture docs |
| client/account | dutra-crm + dutra-sales | current CRM record, Sales Execution contract | relevant playbook |
| prospecting / call | dutra-sales + dutra-crm | `knowledge/VENDAS-OG.md`, sales playbook | Call AI docs |
| proposal / negotiation | dutra-sales + dutra-crm + dutra-og-tech | current account + quote/proposal | product evidence + proposal services |
| post-sale / referral | dutra-sales + dutra-crm | current customer history | post-sale playbook |
| technical application | dutra-og-tech + dutra-fleet | validated OG source + current technical code | `knowledge/OG-TECH-RULES.md` |
| truck/fleet terminology | dutra-fleet | `knowledge/FLEET-OG.md` | current vehicle catalog |
| product/UX/roadmap | dutra-product | product directive + roadmap | design system, active decisions |
| bug / regression / incident | dutra-qa-guardian + dutra-dev | `docs/second-brain/incidents.jsonl`, tests | anti-patterns + affected code |
| external reference / new idea | dutra-builder-brain | source + scoped context | Second Brain protocol |

## Mandatory pre-flight for STANDARD / STRUCTURAL work

First prove the execution route with `dutra-environment-guardian`: checkout/provider access, required toolchain, safe write target and test capability. If local transport fails, classify the layer and switch to an authorized fallback instead of retrying blindly.

Before implementation answer internally:

- What is the canonical source of truth for this scope?
- Does an equivalent function/service already exist?
- Is there an active decision or ADR?
- Has a similar bug already occurred?
- Which tests guard the behavior?
- Am I creating a second entity, score, queue, knowledge store or rule engine?
- Is the change reversible?
- If Supabase is involved, can the live schema/functions be reproduced from Git?
- What needs human validation?

Then implement the smallest safe change.

## Knowledge update rule

After a meaningful change, ask: **does this change future decisions or prevent a repeated mistake?**

If yes:
1. register provenance;
2. update the relevant knowledge/decision/pattern/incident;
3. mark replaced knowledge with `supersedes`/status rather than deleting history;
4. update the relevant Skill only if routing/procedure changed;
5. add a regression test when the rule is machine-checkable;
6. run `npm run og:brain:refresh`.
