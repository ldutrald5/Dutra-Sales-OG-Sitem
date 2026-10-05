# CONVERGENCE-01 — DUTRA OS ONE SYSTEM

Current execution status: Stage 3 locally validated; publication verification pending. Stage 4 NOT STARTED. Current authoritative evidence: docs/handoffs/DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md. Earlier stop/status entries below are historical.

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

## Historical Stage 0 environment finding

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

At that initial preflight, local merge/build/tests were blocked; the valid checkout and completed subsequent stages below supersede this historical environment condition.

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

Historical Stage 0 closure: Stage 0 preflight and baseline recorded on 2026-10-05; COMPLETE after incident provenance correction and fully green 64/64 baseline. Valid local checkout and baseline matrix now exist. Stage 1 NOT STARTED. See docs/handoffs/DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md for current evidence; the prior environment finding above is historical.

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


## Stage 1 — Git + Supabase reconciliation

PRE_STAGE1_SHA / ROLLBACK_SHA: bcf36206b820861f1e41981a92003864b9cec2ea
V3_SHA: 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f

- [x] Clean entry/local-remote equality, stored-auth write preflight and protected refs verified.
- [x] Pre-merge categories and rollback recorded in docs/audits/CONVERGENCE_01_STAGE1_RECONCILIATION.md.
- [x] Controlled no-commit merge; 28 conflict files resolved individually.
- [x] Mature app/service-worker/sync preserved, V3 preview preserved, canonical Supabase diff empty.
- [x] Tooling/governance/Second Brain reconciled without gate or dependency downgrade.
- [x] npm ci, og:check, 75/75 npm test and Brain PASS; relevant explicit tests PASS.
- [x] Merge commit fd99210ca81a4374377f4353e7a402b45679a23c and push/fetch equality verified.
- [x] Current-merge Canonical Replay/Structural Parity PASS (run 37252679945); drift 0; not-verifiable 0.
- [x] Stage 1 COMPLETE / ready for Stage 2; Stage 2 NOT STARTED.

File List: all incoming and manually reconciled paths are enumerated in the linked audit; checkpoint, story, audit, package files, validate, workflow_dispatch and scoped mirror test also changed. No Stage 2 visual transformation occurred.


Stage 1 CI: Sales Execution and Call Intelligence SUCCESS. Package 00R fails only known braces/AIOX advisory (6 high), recorded separately without audit fix. Final evidence, hotspots and rollback remain in checkpoint/audit. Final closure file list adds Stage 1 source/cycle, generated index/metrics, changelog and TODO/DONE status; executable tree unchanged after tested merge.

## Stage 2 — unified premium shell closure (2026-10-05)

- [x] Clean entry and authenticated remote write gate.
- [x] Pre-edit shell audit/matrix closed; architect-approved strangler migration.
- [x] Static single shell; desktop sidebar/wide workspace; mobile/tablet bottom navigation.
- [x] Existing canonical route/state/sync/auth contracts preserved; no user-facing duplicate application.
- [x] Loading/local error/offline/reconnect states and first paint regression passed.
- [x] Eight requested viewports / 13 routes / history / refresh / modal / keyboard / drawer tested.
- [x] npm ci, check, 75/75 test, Brain, PWA/sync and explicit Sales/Call gates PASS.
- [x] Implementation committed in two coherent packages; real push and equality verified.
- [x] Independent QA PASS; network-emulation limitation and preexisting caught bootstrap debt documented honestly.
- [x] Checkpoint/Brain/documentation closeout persisted; Stage 3 NOT STARTED.

PRE_STAGE2_SHA: 331fca8984f85cb420de313f9a3e513366c45c44
POST_STAGE2_SHA (implementation/test): be4b46ce4829ff18d193b6f8dfc34e671b52b8c4

Audit/ownership and temporary bridge stage mapping: checkpoint + docs/audits/CONVERGENCE_01_STAGE2_SHELL_AUDIT.md. No Supabase/preview/business-service/lockfile difference, no production/deploy/merge/protected reference changes.

Stage 2 File List:

- `apps/sistema-og/app.js`
- `apps/sistema-og/index.html`
- `apps/sistema-og/components/app-shell.js`
- `apps/sistema-og/components/app-shell.css`
- `apps/sistema-og/service-worker.js`
- `package.json`
- `scripts/test_unified_shell_browser.mjs`
- `scripts/test_final_candidate_ux.mjs`
- `scripts/test_pwa_release_experience.mjs`
- `scripts/test_spreadsheet_import.mjs`
- `scripts/test_sync_conflict_ui.mjs`
- `docs/audits/CONVERGENCE_01_STAGE2_SHELL_AUDIT.md`
- `docs/handoffs/DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md`
- `docs/stories/CONVERGENCE-01-dutra-os-one-system.md`
- `docs/01-ARQUITETURA.md`
- `DUTRA_OS_CONTEXT.md`
- `AI_HANDOFF.md`
- `ROADMAP.md`
- `CHANGELOG.md`
- `tasks/TODO.md`
- `tasks/DONE.md`
- `docs/second-brain/sources.jsonl`
- `docs/second-brain/decisions.jsonl`
- `docs/second-brain/patterns.jsonl`
- `docs/second-brain/cycles.jsonl`
- `docs/second-brain/BRAIN_INDEX.md`
- `docs/second-brain/BRAIN_METRICS.md`

## Stage 3 — Meu Dia / Mission Control (2026-10-05)

Entry7527c4df5c9ea3e8bbf459227f665a1abb33fb91 follows audited governance fast-forward. [Owner audit](../audits/CONVERGENCE_01_STAGE3_MEU_DIA_AUDIT.md) closed before runtime changes.

- [x] Operational home: Agora → canonical queue/context → commitments.
- [x] No second CRM, score, NBA, agenda, execution engine or outbox.
- [x] Follow-ups, confirmed meeting facts, proposal facts and open tasks use existing owners.
- [x] Existing quick actions / local outcomes / normalized reviewed execution bridge.
- [x] Result/next-action/queue, immediate refresh, offline/reconnect and conflict regression.
- [x] Eight requested viewports, primary mobile CTA, touch targets and independent QA PASS.
- [x] Full76/lint/Brain/SalesExecution/CallIntelligence and shell/browser gates PASS.
- [ ] Publication and final local/remote equality verified.
- [ ] Durable checkpoint/cycle closure and STOP before Stage4.

File List: apps/sistema-og/{app.js,index.html,service-worker.js,components/mission-control.js,components/mission-control.css,components/ui-components.js,services/interaction-service.js}; package.json; scripts/{validate.mjs,test_meu_dia_projection.mjs,test_meu_dia_browser.mjs,test_unified_shell_browser.mjs}; docs/audits/CONVERGENCE_01_STAGE3_MEU_DIA_AUDIT.md; this story; handoff checkpoint; docs/01-ARQUITETURA.md; tasks/TODO.md; tasks/DONE.md; DUTRA_OS_CONTEXT.md; AI_HANDOFF.md; CHANGELOG.md; docs/second-brain/{sources.jsonl,incidents.jsonl,cycles.jsonl,BRAIN_INDEX.md,BRAIN_METRICS.md}.

No Supabase, preview-v2, protected branch or production change. Calendar integration and full Cliente360 remain deferred.
