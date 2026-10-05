# CONVERGENCE-01 — DUTRA OS ONE SYSTEM

## Mission

Converge the current functional main line, the approved V3 Premium experience and the recovered/canonical Supabase history into one operational DUTRA OS without losing mature code, data, UX or rollback capability.

## Product outcome

The user must operate one system only.

Target:

- one responsive UI;
- one CRM and one canonical company identity;
- one Client/Account 360;
- one technical engine;
- one Multi-Vehicles flow;
- one quote/proposal flow;
- one Sales Execution path;
- one Call Intelligence path;
- one persistence/sync model;
- mobile + desktop parity;
- no required switch between V3 and legacy UI.

## Protected references

Do not modify these branches directly during convergence:

- main
- dutra-os-ui-v3-premium
- supabase-00s-recovery-snapshot (#109)
- supabase-00s-canonical-history (#110)
- V2 checkpoint/release branches

Convergence branch:

- integration/dutra-os-one-system

Initial base:

- supabase-00s-canonical-history @ 6031e04462340847c8bcff3d5d698427db444918

## Known verified heads at Stage 0

- main: 5255dc5d432850dfeebe0a523402a1902b1d3a52
- V3: 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f
- #109: c7585ba688ecca8e01b1ff8044cbef52aa5ac477
- #110: 6031e04462340847c8bcff3d5d698427db444918

Remote ancestry verified:

main -> #109 -> #110

## Source-of-truth rules

- Mature functional behavior: current main baseline unless newer tested evidence supersedes it.
- UX target: V3 Premium.
- Database history/schema: canonical Supabase package from #109/#110.
- No duplicate CRM/domain/rule engine/persistence source.
- Current persisted facts outrank recovered historical assumptions.
- Manual override remains available for operational workflows.

## Current Stage 0 environment finding

The Codex execution workspace used during preflight had:

- no usable repository checkout under /workspace or /home;
- no local Git HEAD/worktree;
- Git HTTPS transport failing before GitHub at an unreachable configured proxy endpoint on port 8080;
- GitHub connected provider still able to read repository refs.

This is an execution-environment incident, not a repository failure.

Mitigation established on this branch:

- new dutra-environment-guardian Skill;
- Builder Brain / Dev / Context Router / AGENTS environment routing;
- incident INC-EXEC-ENV-001;
- convergence branch created remotely from exact #110 head.

Local merge conflict resolution, build and integration tests remain blocked until a valid worktree is available.

## Stages

- Stage 0 — preflight and baseline
- Stage 1 — Git/Supabase reconciliation + integrate V3 history safely
- Stage 2 — unified responsive shell
- Stage 3 — Home / Meu Dia
- Stage 4 — CRM / Cliente 360
- Stage 5 — Prospecting / Sales Execution
- Stage 6 — Call AI / Call Intelligence
- Stage 7 — single technical engine
- Stage 8 — Multi-Vehicles
- Stage 9 — Quote / Proposal / ROI
- Stage 10 — Communication / WhatsApp
- Stage 11 — remaining operational modules
- Stage 12 — offline / sync / PWA
- Stage 13 — mobile / desktop parity
- Stage 14 — eliminate dual-system UI
- Stage 15 — regression gate
- Stage 16 — release candidate, no production merge without explicit authorization

## Stage 0 Definition of Done

Stage 0 is complete only when:

- integration branch exists from exact validated #110 base;
- repository state is persisted in story/checkpoint;
- environment preflight is routed through dutra-environment-guardian;
- a valid worktree exists for the convergence branch;
- working tree state is known;
- relevant baseline tests can run or an explicitly authoritative CI equivalent is documented;
- baseline matrix MAIN / V3 / SUPABASE / TARGET exists;
- no protected branch or production environment was modified.

Current status: Stage 0 preflight and baseline recorded on 2026-10-05; COMPLETE after incident provenance correction and fully green 64/64 baseline. Valid local checkout and baseline matrix now exist. Stage 1 NOT STARTED. See docs/handoffs/DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md for current evidence; the prior environment finding above is historical.

## Non-goals until convergence closes

Do not start CNPJ, GEO, PostGIS, maps, geocoding, Assets rollout or other major feature tracks.

## Rollback

Until final authorization, rollback is to abandon the convergence branch. main, V2, V3, #109 and #110 remain unchanged.

No production rollout is part of this story without explicit authorization.


## Stage 0 execution checklist — 2026-10-05

- [x] Real checkout on integration/dutra-os-one-system; HEAD and initial clean state recorded.
- [x] Protected remote refs and MAIN -> #109 -> #110 -> TARGET ancestry verified read-only.
- [x] Environment Guardian and requested documents read; Node/npm verified.
- [x] npm ci, og:check, npm test and og:brain:check executed in order.
- [x] Available Supabase static gates executed; unavailable database replay clearly marked NOT RUN.
- [x] MAIN / V3 / SUPABASE / TARGET matrix recorded in checkpoint.
- [x] No protected branch, production, merge, rebase or deploy changed.
- [x] Green baseline: 64/64 gates PASS; Builder Brain refresh/check PASS (97 records).
- [x] Stage 0 COMPLETE / safe to continue: YES for readiness only. Stage 1 not started.
- [x] Local replay/parity NOT RUN (CLI/psql absent); authoritative #110 replay/parity PASS, drift 0, not-verifiable 0, accepted solely for Stage 0.
- [x] Stage 1 must rerun Canonical Replay and Structural Parity after changes to Supabase/migrations/functions/recovery/replay scripts; no progression beyond that gate.

## File List — Stage 0 session

- docs/handoffs/DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md
- docs/stories/CONVERGENCE-01-dutra-os-one-system.md

- docs/second-brain/sources.jsonl
- docs/second-brain/incidents.jsonl
- docs/second-brain/BRAIN_INDEX.md (generated by refresh)
- docs/second-brain/BRAIN_METRICS.md (generated by refresh)
