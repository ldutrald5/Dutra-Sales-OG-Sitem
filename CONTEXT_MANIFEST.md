# Context Manifest — Baseline 2026-09-28 / CIC-03

> **Scope note — historical baseline:** this file preserves the CIC-03 baseline. For current implemented capability/runtime direction, prefer `EXECUTION_CONTEXT.md`, current tested code on `main`, and live infrastructure evidence. Do not interpret the historical “not yet implemented” list below as a current feature matrix.

## Source of truth

- Repository: `ldutrald5/Dutra-Sales-OG-Sitem`
- Canonical code branch: `main`
- Baseline before CIC-03: `1fdafed8b60e7f3bcf0df894e0127a11dc4b7368`
- Working branch: `feat/baseline-account360-command-center-20260928`

## Required context

1. `EXECUTION_CONTEXT.md`
2. `docs/roadmap/BASELINE_2026-09-28.md`
3. `docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md`
4. `docs/second-brain/BRAIN_INDEX.md`
5. `docs/second-brain/CONTEXT_ROUTER.md`
6. task/story specific to the change

## Current architectural facts

- Vanilla JS/CSS/HTML frontend remains the approved V1 stack.
- Domain contracts for Company, Contact, Opportunity, Activity and Task exist additively.
- `state.leads` remains the operational compatibility layer during controlled reconciliation.
- Supabase Auth/Organization foundation exists under feature flag; remote pilot validation is still pending.
- Company 360 beta, Sync Bridge, conflict review and legacy reconciliation are implemented.
- Mission Control and Signal Center are implemented and derive from current CRM facts.
- `OG_LEAD_INTELLIGENCE` is the single deterministic score source.
- Railway HTTPS is live and the main service currently has a persistent volume mounted at `/data`.
- Proposal Tracking, Automation Engine and Territory Intelligence are not yet implemented.

## Authority of external inputs

| Source | Role | Authority |
|---|---|---|
| GitHub `main` | executable code and current behavior | canonical |
| Railway live state | current deployment/runtime evidence | authoritative for runtime state |
| attached spreadsheets/PDFs | business evidence, templates and import sources | business input; not code authority |
| external UI/CRM references | pattern/inspiration | advisory only |

## Explicit prohibitions

- no big-bang migration;
- no React/Laravel/Twenty rewrite;
- no automatic Company creation from weak legacy identity;
- no second score/queue/source of truth;
- no secret in Git/browser persistent storage;
- no silent overwrite of historical facts;
- no feature marked complete without test/gate evidence.

## CIC-03 scope

CIC-03 may refine Account 360, Command Center, documentation and tests. It must not start Proposal Tracking, Automation Engine, Territory Intelligence or activate remote Supabase auth.
