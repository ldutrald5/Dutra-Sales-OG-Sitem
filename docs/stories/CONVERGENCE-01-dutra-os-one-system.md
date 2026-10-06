# CONVERGENCE-01 — DUTRA OS ONE SYSTEM

Current execution status: Stage 5 COMPLETE; local acceptance, independent QA and real integration publication verified. Current implementation boundary: 6eee22a4bf74960f40408a56cfb2aa9634a9e072; final documentation-only closure follows. Authoritative evidence: docs/handoffs/V3_UNIFICATION_CHECKPOINT.md. Earlier Stage3/4 stops are historical and resolved. Stage6 NOT AUTHORIZED.

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
- [x] Implementation publication and local/remote equality verified at 3be251834a67cca5b4ad13a31bcb6df1903535cb; final documentation closure must again verify equality.
- [x] Durable checkpoint/cycle closure and STOP before Stage4.

File List: apps/sistema-og/{app.js,index.html,service-worker.js,components/mission-control.js,components/mission-control.css,components/ui-components.js,services/interaction-service.js}; package.json; scripts/{validate.mjs,test_meu_dia_projection.mjs,test_meu_dia_browser.mjs,test_unified_shell_browser.mjs}; docs/audits/CONVERGENCE_01_STAGE3_MEU_DIA_AUDIT.md; this story; handoff checkpoint; docs/01-ARQUITETURA.md; tasks/TODO.md; tasks/DONE.md; DUTRA_OS_CONTEXT.md; AI_HANDOFF.md; CHANGELOG.md; docs/second-brain/{sources.jsonl,incidents.jsonl,cycles.jsonl,BRAIN_INDEX.md,BRAIN_METRICS.md}.

No Supabase, preview-v2, protected branch or production change. Calendar integration and full Cliente360 remain deferred.

## Stage 4 — Prospecção + Sales Execution Premium (QG authorized 2026-10-05)

PRE_STAGE4_SHA / rollback: fe1760d78865d85ecb84d8ae4a244094968bb4ca. This authorization replaces the earlier Stage 4 CRM/360 scope; deep 360 and Stage 5 remain deferred.

- [x] Clean authorized entry / remote equality / write preflight; existing implementations audited; @architect bounded APPROVE.
- [x] Premium prospecting in the single shell; canonical queue/score/NBA.
- [x] Safe commit-time/intra-batch dedup, explicit existing identity, no silent overwrite.
- [x] Canonical result/follow-up, durable current outbox, normalized CallAI Review.
- [x] Research provenance and truthful external action states preserved.
- [x] Mission Control consequences, online/offline/reconnect/conflict and PWA preserved.
- [x] Eight required viewports and six functional flows approved by @qa.
- [x] Full tests/Brain green, checkpoint updated, integration-only push verified, protected refs intact.

Audit matrix (closed before code):

| Capability | Current owner/source | V3 reference | Target/decision |
|---|---|---|---|
| Identity / dedup / conversion | OG_CRM_SERVICE / state.leads | operational-crm-v3 | KEEP owner; safe deterministic matching and explicit ambiguous identity |
| Prospect selection | OG_PROSPECTING eligibility + territory | prospecting-execution-v3 | ADAPT as subset of OG_SALES_DESK canonical queue |
| Priority / NBA | OG_LEAD_INTELLIGENCE | sales-action-center-v3 | KEEP; do not consume prospecting-engine alternate score/NBA |
| Results / follow-up | OG_INTERACTION_SERVICE; current Mesa command | execution focus UX | MERGE thin presentations into same protected command |
| Normalized execution | existing client/adapter + Review CallAI / recordCallResult | sales-execution-service | KEEP current engine; DO NOT PORT V3 mutations/agenda |
| Research staging / provenance | current Intake / Research / Review | feature-loader-v3 | KEEP; temporary discoveries are not CRM facts |
| Persist / recovery | current stores + OG_SYNC_BRIDGE | V3 local operations | DO NOT DUPLICATE; await existing durable outbox before success |
| Client context | current client sheet | V3 360 | KEEP internal bridge; deep 360 DEFER |

File list: Stage 4 implementation/QA list is maintained in docs/handoffs/V3_UNIFICATION_CHECKPOINT.md.

Stage 4 STOP / 2026-10-05: @qa new browser gate failed at scripts/test_prospecting_workspace_browser.mjs:89: `AssertionError: input did not match /Fila concluída/`. Empty priority filter keeps stale focused currentId (`1 / 0`) and permits action outside queue. Existing76/Brain/shell/day regressions passed, but they do not override this critical failure. Implementation stopped under QG STOP CONDITIONS; expected WIP preserved, HEAD unchanged, no commit/push. Full evidence and file list in Stage 4 checkpoint; acceptance boxes remain open.

Stage 4 RECOVERY / 2026-10-05: QG authorized preserved-WIP empty-focus correction. @architect APPROVE, new Stage4 browser exit0: filtered selection derives canonical membership/null and obsolete DOM actions are inert; eight viewports/many/long/empty PASS. Full76/Brain and shell/PWA PASS. Mandatory Meu Dia reconnect timed out at scripts/test_meu_dia_browser.mjs:72:45 (`page.waitForFunction: Timeout 30000ms exceeded` waiting for mode=ok). Stopped under Recovery STOP CONDITIONS; no retry, broader sync fix, commit or push. Latest checkpoint records original blocker fixed and new gate failure; HEAD remains original fe1760d.

Stage4 RECOVERY2 / 2026-10-05: optional serviceWorker.ready was proven to hold foreground write lock after failed offline debounced PUT; detached best-effort registration now follows durable outbox persistence and does not block finally/reconnect. Original day test unchanged PASS. New deterministic sync browser proves failed offline PUT before reconnect, real ACK/outboxclear/OK, 503notOK/no loop, 409explicitreviewresolution and boundedlisteners. Full76/Brain138/Stage4/day/shell/SalesExecution gates PASS; @architect APPROVE and @qa final PASS. Publication pending; prior recovery stop history retained. New file list additionally includes scripts/test_sync_reconnect_browser.mjs and generated Brain artifacts; full list in checkpoint. No Stage5/main/production.

Stage4 COMPLETE: implementation/test/Brain/checkpoint published and verified at 6379c4f81007b78582444e0aeeaab26c96aa4dc7; protected refs unchanged and working tree clean. Final doc-only closure preserves tested runtime. STOP before Stage5; new QG authorization required.


## Stage 5 — Call AI / Call Intelligence Premium (QG authorized 2026-10-05)

PRE_STAGE5_SHA / rollback: a8a75b3fdf65560359cf63e3be009e3eaca31e78. Single apps/sistema-og shell; preview-v2 is UX reference, no engine port.

Audit matrix closed before implementation:

| Capability | Current owner / source | V3 reference / target decision |
|---|---|---|
| Account/context/history | OG_CRM_SERVICE / state.leads / existing interactions | Compact context and history; KEEP |
| Transcription | Call Intelligence client → Node gateway → existing Edge / private recordings | State clarity / transcript separation; KEEP |
| Whisper fallback | Current gateway → faster-whisper worker → trusted transcript ingestion | Honest error/fallback display; KEEP |
| Orientation/analysis | OG_CALL_AI_PROMPTS / OG_AI_SERVICE; existing local fallback, no configured remote orientation provider | Review candidates distinguished from facts; ADAPT presentation |
| Review/result | Current Review → recordCallResult; current local interaction projection | Editable, explicit approval and retry; ADAPT boundary |
| Follow-up/queue/NBA | OG_INTERACTION_SERVICE / OG_SALES_DESK / OG_LEAD_INTELLIGENCE | Reuse Mission Control consequences; DO NOT DUPLICATE |
| Sync/PWA | Existing durable outbox / foreground ACK / same SW strategy | Keep Stage4 reconnect fix; KEEP |
| UX | Current shell/tokens + V3 operational context/transcript/review reference | Scoped mobile/desktop CSS; ADAPT |

@architect approves captured generation/account/session/recording guards, transient latches, normalized RPC before local projection, durable queue before success. No provider/schema/owner changes.

Acceptance: real transcription contract/fallback retained; explicit human review/edit/discard; late A response cannot affect B/A-new-session; failed normalized result retains review/retry; edited confirmed result feeds same CRM/history/follow-up/Mission Control; offline never fabricates AI; genuine reconnect/409 preserve outbox; eight viewports; Stage3/4 regressions; full suite/Brain; authorized integration publication verified, main/production intact. Stage6 remains unauthorized.


Stage5 local acceptance / 2026-10-06:
- [x] Same-shell Premium UI, actual existing transcription/Whisper contracts retained, human edit/discard and honest local/offline/provider states.
- [x] Captured account/session guards, A→B→A/late media/upload/status/manual/fallback and fully cleared new-session drafts.
- [x] Normalized ACK-before-local, module failure/retry/idempotency and actual durable outbox error/recovery; no second owner.
- [x] CRM/result/follow-up/Meu Dia/external semantics + Stage3/4/sync/PWA regressions and full76/Brain.
- [x] Eight viewports, contrast/overflow/touch/focus/keyboard approval.
- [x] Independent final QA PASS; release gate PASS.
- [x] Committed/pushed clean integration and protected refs verified at 6eee22a4bf74960f40408a56cfb2aa9634a9e072; final documentation-only closure follows.
File list / source IDs / evidence / rollback: current Stage5 checkpoint. Stage6 requires fresh QG authorization.
