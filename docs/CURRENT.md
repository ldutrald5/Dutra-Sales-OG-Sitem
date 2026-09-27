# CURRENT — DUTRA OS

> Compact mutable state. Verify live infrastructure before treating runtime details as current facts.

## Baseline

- **Production branch:** `main`
- **GitHub HEAD when this audit fix was prepared:** `2314f8f7935a759404d49037ab2796d428fa043b`
- **Latest product package:** **07R — client sheet and usable CRM workspace**
- **Visible result:** searchable CRM list + editable side sheet, OG client code search, preserved Company 360/material context, improved mobile accessibility.
- **Evidence:** `tasks/DONE.md`, `tasks/TODO.md`, current 07R product baseline on `main`.

## Quality state recorded for 07R

Package evidence records:

- `npm run og:client-sheet:test`
- `npm run validate`
- security/audit/release gates in CI

This AI-operating-system task is documentation/process-only and must not change product behavior.

## Hosted runtime snapshot

Live Railway verification performed while preparing this file:

- Project: `Dutra Sales OG`
- Service: `sistema-og`
- Environment: `production`
- Latest deployment: `2c442632-e029-4af1-bf71-5292e94e7fe1`
- Deployment status: `SUCCESS`
- Deployed commit: `b9a512a667a53c8501e5cd2069a93b1e08ba1d61`
- Public service domain: `sistema-og-production.up.railway.app`
- Health path: `/health`
- Persistent Railway volumes reported at this snapshot: **none**

Do not reuse this snapshot as proof later. Query Railway live.

## AI Operating System status

**CONCLUÍDO — compact entrypoints and economical bootstrap (PR #18).**

This is a documentation/process closeout only. It adds the compact brain/current/decision/protocol entrypoints and AGENTS routing without changing product behavior, persistence, runtime or architecture.

## Current authorized work

**Nenhum próximo pacote de produto, runtime ou arquitetura é autorizado por este arquivo após o merge da PR #18.**

Any next implementation requires explicit authorization and formal prioritization against the operational backlog in `tasks/TODO.md`.

## Known blockers / cautions

- Hosted filesystem is not durable canonical CRM persistence while no persistent volume/database path is verified.
- Supabase canonical database/auth direction exists, but activation details remain environment-gated.
- Avoid two agents writing the same product package concurrently.
- Do not assign the next package number from chat memory; inspect the live plan first.

## Product candidates vs. operational backlog

`tasks/TODO.md` remains the operational backlog and prioritization reference for executable work.

A **Cockpit Operacional / Painel Hoje** remains only a **candidate idea**. It is not an authorized package, does not supersede `tasks/TODO.md`, and may receive package/task scope only after explicit formal prioritization.
