# Minimal Context Routing

The second brain is useful only when it reduces repeated reasoning rather than flooding context.

## DUTRA project router

Environment and canonical project routing start in:

`docs/second-brain/CONTEXT_ROUTER.md`

The additive V3 domain router is `docs/intelligence/CONTEXT_ROUTER.md`; it never overrides Environment Guardian or canonical data ownership.

Load `AGENTS.md` first, then route to the smallest set of Skills/docs needed.

## Generic load-by-task rule

| Task | Load first |
|---|---|
| Product direction | vision + active decisions + roadmap |
| Bug/fix | affected module + tests + BUGBOOK + related decision |
| Data change | domain/data architecture + migration rules + affected entities |
| UI/UX | workflow + design tokens + affected domain |
| External reference | source question + analogous current problem + source intake |
| AI feature | AI boundary + knowledge items + affected entity/service + Review Gate |
| Implementation package | package plan + decisions + affected code + baseline |
| Post-release learning | package report + user friction + brain index |
| Runtime/deploy | runtime operator + live provider state |
| Technical OG | technical skill + motor + parity tests; never historical chat alone |

## Compression rule

Prefer IDs and durable summaries over raw historical conversations. Preserve source path/commit/date for drill-down.

## Stable vs dynamic

Stable rules/architecture/playbooks may be loaded from Skills/Second Brain.
Current account status, contact data, prices, meetings and next actions must be loaded from CRM/runtime.

## Staleness rule

When a brain entry conflicts with current tested code or verified runtime evidence, current evidence wins. Record the conflict and supersede/update the durable entry rather than silently rewriting history.

## Anti-amnesia rule

Before saying “does not exist”, search the repository. Before rewriting, search for an existing motor/service. Before changing architecture, search decisions. Before fixing a recurring bug, search BUGBOOK/tests.
