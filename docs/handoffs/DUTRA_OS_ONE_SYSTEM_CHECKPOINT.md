# DUTRA OS ONE SYSTEM — CHECKPOINT

MISSION: CONVERGENCE-01 — DUTRA OS ONE SYSTEM
CURRENT_STAGE: 4 — PROSPECÇÃO + SALES EXECUTION PREMIUM
STATUS: Stage4 COMPLETE; implementation publication verified; final closure/status in V3_UNIFICATION_CHECKPOINT.md
UPDATED_AT: 2026-10-05 UTC
NEXT_STAGE: STOP after Stage4; Stage5 requires new QG authorization
SAFE_TO_CONTINUE_TO_STAGE_5: NO — not authorized

Current Stage4 authoritative checkpoint: [V3_UNIFICATION_CHECKPOINT.md](V3_UNIFICATION_CHECKPOINT.md). Stage3 evidence below is historical and remains valid.

## Stage 3 authoritative checkpoint

PRE_STAGE3_SHA: 7527c4df5c9ea3e8bbf459227f665a1abb33fb91
POST_STAGE3_SHA: 3be251834a67cca5b4ad13a31bcb6df1903535cb (verified implementation + checkpoint publication boundary; final documentation-only closure follows)
STAGE2_PUBLISHED_BOUNDARY: d948c355df11b236e48c7345c2f042ff93d879b4
ROLLBACK_SHA: 7527c4df5c9ea3e8bbf459227f665a1abb33fb91
FINAL_CHECKPOINT_HEAD: commit containing the final closure; verify LOCAL == REMOTE after publication
STAGE3_COMMITS: 553a4d5 audit / 0db6bcb runtime / 39a2b41 regressions
ENVIRONMENT: clean entry, audited governance fast-forward, all three governance gates PASS and write dry-run Everything up-to-date; stored gh route with GH_TOKEN/GITHUB_TOKEN temporarily empty; Node 24.19.0 / npm 11.9.0.
MISSION_CONTROL / DAILY_QUEUE / PRIORITY / NEXT_BEST_ACTION / FOLLOW_UP / MEETINGS / PROPOSALS_CONTEXT / QUICK_ACTIONS / RESULT_TO_NEXT_ACTION: local PASS
MOBILE / DESKTOP / TABLET / OFFLINE / SYNC: local PASS
ARCHITECT: APPROVED bounded canonical presentation and durable outbox acknowledgement
QA: PASS — independent code, visual and execution review
PUSH: PASS — real push + authenticated fetch; LOCAL == REMOTE == 3be251834a67cca5b4ad13a31bcb6df1903535cb; clean tree; normal pre-push 76 gates passed. Final closure publication must again verify equality.

### Canonical owners / projection

CANONICAL_DATA_SOURCES: state.leads (og_leads_crm), state.operations.activityEvents/tasks, state.history, explicit existing salesExecution references. No new commercial store, schema, agenda, score or persistence namespace.
CRM_OWNER: OG_CRM_SERVICE / state.leads / lead.id
QUEUE_OWNER: OG_SALES_DESK.selectQueue — same eligible, deduplicated population drives counters and rows; canonical sort unchanged.
PRIORITY_OWNER: OG_LEAD_INTELLIGENCE.score / scoreBreakdown — no independent score or percentage.
NBA_OWNER: OG_LEAD_INTELLIGENCE.nextBestAction — explicit action/reason; missing context asks REVIEW/COMPLETE; terminal queue entries excluded.
FOLLOWUP_OWNER: lead.nextAction/followUpAt + OG_INTERACTION_SERVICE.setNextAction.
SALES_EXECUTION_OWNER: local Mesa recordResult/setNextAction; normalized Review CallAI → syncApprovedCallToSalesExecution → atomic recordCallResult, IDs/idempotency preserved.
PROPOSAL_OWNER: OG_PROPOSAL_INTELLIGENCE factual events; prepared/saved != sent; WhatsApp-open and proposal_enviada status do not prove delivery. Exact proposal uses its quoteId through history; missing payload warns without replacing current draft.
MEETING_OWNER: explicit user-reviewed booking metadata in existing call.saved activity; never infer a meeting/date from generic followUp or text. Calendar externally disconnected; historical booking date unavailable explicitly. This is confirmation by the user, not a claim of remote calendar/Supabase acknowledgement.

### Packages / files

3A owner audit closed before runtime changes. 3B Agora / canonical reasons. 3C queue and context. 3D follow-ups/confirmed meetings/factual proposal/open task projection. 3E existing quick actions. 3F result loop/outbox acknowledgement. 3G responsive/44px/primary action before bottom nav. 3H deterministic and browser regressions.

FILES_CHANGED:
- apps/sistema-og/app.js (small owner adapters, selection guard, canonical local result loop, reviewed metadata, approved-account DOM draft isolation).
- apps/sistema-og/components/mission-control.js/css (readonly projection / scoped premium presentation).
- apps/sistema-og/components/ui-components.js (canonical reason and next action in existing client rows).
- apps/sistema-og/index.html (operational home; support/decorative content folded).
- apps/sistema-og/services/interaction-service.js (Venda clears next action/follow-up through existing definition).
- apps/sistema-og/service-worker.js (v68→v69 and two projection assets only; outbox/recovery DBv2 and strategies unchanged).
- package.json / scripts/validate.mjs (meaningful projection gate added; no dependency/lock change).
- scripts/test_meu_dia_projection.mjs / scripts/test_meu_dia_browser.mjs / scripts/test_unified_shell_browser.mjs.
- scoped audit, story/checkpoint, architecture link, task/context/handoff/changelog notes, Brain source/incident/cycle and generated index/metrics.

TEMPORARY_INTERNAL_BRIDGES:
| module | reason | owner | planned migration stage |
|---|---|---|---|
| Meu Dia → CRM / quick client sheet | consume mature identity/context without a parallel360 | CRM/current client sheet | 4 |
| Meu Dia → normalized outcomes | retain reviewed atomic execution owner | Sales Execution / CallAI review | 5/6 |
| Proposal fact → original history | preserve existing quote engine and payload | history / proposal owner | 9 |
| Meeting projection → confirmed call.saved | canonical account-context reader lacks meeting/calendar read integration | existing CallAI activity metadata | later dedicated calendar/read integration; no second agenda |

### Executed tests / acceptance

VIEWPORTS_TESTED: 320x568; 360x800; 390x844; 430x932; 768x1024; 1280x720; 1440x900; 1920x1080.
TEST_RESULTS:
- npm ci: PASS (243 packages; lock/dependencies unchanged).
- npm run lint / og:check: PASS.
- npm test: PASS integral 76/76 (75 baseline + new readonly projection regression).
- og:brain:check: PASS; refresh regenerated after durable source/incident/cycle updates.
- og:meu-dia:test: PASS identity/population/canonical queue and NBA, terminal exclusions, follow-up/meeting/proposal/task facts and result/refresh.
- og:meu-dia:browser:test: PASS real isolated local outcome→next action→queue, duplicate captured click, immediate refresh before debounce, supported offline action and real reconnect, actual HTTP409 conflict survival after refresh, normalized cancel/accept identity without external mutation, eight viewports/primary action/focus/touch/overflow.
- og:shell:test: PASS eight viewports/13 routes, drawer/history/refresh, first paint with unavailable domain scripts, local renderer fault, precached offline Meu Dia + CRM and real reconnect acknowledgement.
- og:sales-execution:test / og:call-intelligence:test: PASS adapters/gateways/auth boundary/disabled-mode contracts; not production writes.
- Full 76 includes existing CRM, score/NBA, morning briefing, proposals, follow-up, sync/bridge/conflict/reliability, PWA, auth, technical, performance and preview gates.

BROWSER_NETWORK_LIMITATION: retained from Stage2 — after SW offline reload Chromium151/Playwright1.62.1 may miss native online; shell test proves transport200/navigator.onLine, emits explicit online contract event and requires the app's real acknowledgement. Regular native offline/reconnect passes. Physical hardware and live external booking mutation not claimed.
REGRESSIONS_FOUND_AND_FIXED: inconsistent terminal population in counts; selected terminal client; Venda stale commitments; immediate-refresh operation loss; normalized cancelled selection identity; accepted selection leaking prior notes DOM; incorrect proposal/draft destination; tablet42px action targets; decorative header pushing mobile CTA below first viewport.
FUNCTIONALITY_PRESERVED: auth, existing CRM/entities, execution/CallIntelligence contracts, technical/proposal engines, navigation, persistence, offline/outbox/conflict/PWA; no production mutation.
V3_UX_PRESERVED: OG black/graphite/yellow operational shell, compact context/next action, mobile bottom nav/desktop sidebar. preview-v2 remains untouched reference.
KNOWN_RISKS: external calendar disconnected; historical confirmed meeting without structured date explicitly unavailable; physical-device acceptance not executed; known braces/AIOX advisory unchanged. No blocker to this bounded Stage3; future domain convergence awaits authorization.
SUPABASE_DIFF: EMPTY against PRE_STAGE3_SHA; no replay gate triggered or remote/schema mutation claimed.
PROTECTED_REFERENCES: publication-time remote recheck PASS — main 5255dc5d432850dfeebe0a523402a1902b1d3a52; V2 preview 6b4bf7937aee8b236ce28701f9d149a69e0bdd7e; V3 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f; #109 c7585ba688ecca8e01b1ff8044cbef52aa5ac477; #110 6031e04462340847c8bcff3d5d698427db444918. No production/deploy/PR operations.
BLOCKERS: NONE. Final documentation publication/equality remains the mandatory last step of this closure.
SAFE_TO_START_STAGE_4: YES (readiness only); QG authorization required before execution. STOP. Stage4 NOT STARTED.

## Stage 2 authoritative closure

PRE_STAGE2_SHA: 331fca8984f85cb420de313f9a3e513366c45c44
POST_STAGE2_SHA: be4b46ce4829ff18d193b6f8dfc34e671b52b8c4 (implementation + regression boundary; documentation closure is subsequent)
ROLLBACK_SHA: 331fca8984f85cb420de313f9a3e513366c45c44
FINAL_CHECKPOINT_HEAD: commit containing this closure; verify local/remote equality after final documentation publication
IMPLEMENTATION_COMMITS: 748f800f5448f40fd03e3f2e428d0937f2e239e4 / be4b46ce4829ff18d193b6f8dfc34e671b52b8c4
IMPLEMENTATION_PUSH: PASS — authenticated real push + fetch, local/remote equality at be4b46ce4829ff18d193b6f8dfc34e671b52b8c4
WORKING_TREE_AT_IMPLEMENTATION_PUBLICATION: CLEAN
ENVIRONMENT_GUARDIAN: PASS — checkout/branch/entry equality, dry-run and verified real publication; GH_TOKEN/GITHUB_TOKEN temporarily empty, hooks enabled
SHELL / DESKTOP / MOBILE / TABLET / FIRST_PAINT / NAVIGATION / GLOBAL_STATES: PASS
QA: PASS — independent scoped code/visual review and executed browser/race regressions

### Shell ownership / components

Target remains apps/sistema-og/. Static header/sidebar/bottom navigation/status in index.html; components/app-shell.css projects canonical OG tokens and responsive layout; components/app-shell.js handles presentation, localized startup/renderer feedback and retry only. Existing switchTab/hash/history/state.currentTab remain the single router/state owner. Existing auth/outbox/conflict/recovery contracts remain canonical. No new domain, store, router or sync engine.

Desktop: persistent 238px sidebar above 1024px, available-width workspace. Mobile/tablet: existing bottom navigation and More drawer, header/status, safe-area offsets, 44px targets. One canonical route per workspace: CRM includes Clientes/Pós-venda; cotacao includes Multi-Veículos/Propostas. No user-facing V3/Legacy/new/old product choices.

PWA changes: v67 -> v68 plus only app-shell.css/js precache. DB v2, cache strategies and API network-only behavior unchanged. Bootstrap adopts static navigation/status; initial route no longer waits for remote sync; optional renderer errors are local; SW update maintenance does not block recovery. A local bootstrap promise orders reconnect after the existing restore/import/pull and checks navigator.onLine after awaiting it. This is lifecycle coordination, not additional sync state.

### TEMPORARY_INTERNAL_BRIDGES

| module | reason | owner | planned migration stage |
|---|---|---|---|
| Meu Dia | existing dashboard/prioritization retained | app.js / command services | 3 |
| CRM / Clientes / Cliente 360 | preserve canonical entities and client sheet | CRM/company services | 4 |
| Prospecção / Sales Execution | preserve current launchers and workflows | prospecting / execution services | 5 |
| Call Intelligence | preserve current recorder/context/dashboard | Call services | 6 |
| Aplicação Técnica | retain validated mature engine | consultant/technical owner | 7 |
| Multi-Veículos | retain fleet/vehicle calculation | quote owner | 8 |
| Propostas / ROI | retain generation/print/tracking | proposal owner | 9 |
| Comunicação | retain existing templates/actions | communication services | 10 |
| Pós-venda / Performance / Biblioteca / operational support | retain existing CRM journey and operational views | customer journey/performance/material services | 11 |

### QA / test evidence

VIEWPORTS_TESTED: 320x568; 360x800; 390x844; 430x932; 768x1024; 1280x720; 1440x900; 1920x1080
13 canonical routes traversed at each size. No document horizontal overflow; current route visibility, active navigation, history/back, refresh, drawer bounds/Escape/focus, quick-lead modal, touch targets, offline/reconnect checked. Independent visual inspection: 320/768/1440. Desktop keyboard Enter navigation and visible OG focus passed.

TEST_RESULTS:
- npm ci: PASS (243 packages; lock/dependencies unchanged).
- og:check: PASS, including new shell and browser gate syntax.
- npm test: PASS 75/75 after final bootstrap changes; no partial result counted.
- og:brain:check: PASS; regenerated again for this structural closeout.
- og:shell:test: PASS — all eight viewports, first paint with domain scripts blocked, localized renderer exception/retry, PWA cached offline reload/CRM and real reconnect acknowledgement.
- PWA release / final candidate UX / sync conflict UI: PASS.
- Sales Execution adapter/gateway and Call Intelligence gateway/contract/local Whisper: PASS.
- Existing full suite also covers auth state, sync bridge/resilience, technical/quote/proposal, startup/performance and retained preview parity.
- Independent adversarial test: hold bootstrap import, reconnect then disconnect before recovery finishes; remain offline; subsequent reconnect receives real mode ok: PASS.

Corrections discovered: PDF selector and vehicle header overflow at 320px; mobile navigation overlapping dialogs; startup network listeners registered too late; reconnect ordering during recovery. Static markup accessibility assertions were moved to their new owner, without dropping gates. No module redesign occurred.

BROWSER_NETWORK_LIMITATION: Chromium 151 / Playwright 1.62.1 did not emit online after a service-worker offline reload when setOffline(false) restored transport. Direct page and server /api/state both returned 200; navigator.onLine was true, but the event was absent. The committed gate proves real transport, explicitly emits the online contract event and requires the app's own real API acknowledgement/mode ok. It does not mock sync state. Ordinary offline/reconnect events passed in all eight non-SW contexts. Physical-device network switching is not claimed.

Evidence: reproducible npm run og:shell:test; local logs/captures /workspace/scratch/dutra-stage2/browser-final.log and final-viewports/. These developer artifacts are outside Git and contain no committed browser profile or private data. Optional developer test requires installed Playwright/Chromium; no runtime dependency was added.

FUNCTIONALITY_PRESERVED: mature services/modules/server/auth/persistence untouched; current CRM, Sales Execution, Call Intelligence, application, proposal and sync/PWA gates green.
V3_UX_PRESERVED: premium dark/graphite/OG yellow, industrial identity, clear actions/active navigation; preview-v2 unchanged as reference.
SUPABASE_DIFF: EMPTY against PRE_STAGE2_SHA; no migration/function/recovery/replay/workflow changes. Stage 1 replay/parity evidence remains applicable to unchanged Supabase. No new replay or production validation claimed.
PRODUCTION / MAIN / V2 / V3 / PR109 / PR110 MODIFIED: NO
Protected remote heads after publication: main 5255dc5d432850dfeebe0a523402a1902b1d3a52; V3 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f; #109 c7585ba688ecca8e01b1ff8044cbef52aa5ac477;  #110 6031e04462340847c8bcff3d5d698427db444918. V2 preview snapshot 6b4bf7937aee8b236ce28701f9d149a69e0bdd7e, unchanged by this work.

KNOWN_RISKS: internal module UI bridges intentionally remain for subsequent stages. Existing caught syncRecoveryReady TDZ in empty-storage first-run lead loading was observed; that code path is unchanged from entry, did not produce an uncaught error or prevent verified scenarios, and remains separate baseline debt. Browser event-emulation limitation above is explicit. Existing braces/AIOX audit advisory remains unchanged dependency debt; no audit fix/deploy used.
BLOCKERS: NONE for Stage 2
SAFE_TO_START_STAGE3: YES (readiness only)
STAGE3: NOT STARTED — stop after final checkpoint publication.

FILES_CHANGED: runtime/test paths and closure file list are maintained in the Stage 2 story and audit.

## Stage 1 authoritative closure (historical)

PRE_STAGE1_SHA: bcf36206b820861f1e41981a92003864b9cec2ea
POST_STAGE1_SHA: fd99210ca81a4374377f4353e7a402b45679a23c
V3_SHA_INTEGRATED: 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f
ROLLBACK_SHA: bcf36206b820861f1e41981a92003864b9cec2ea
FINAL_CHECKPOINT_HEAD: commit containing this closure; verify local/remote equality after publication
MERGE: PASS — two parents bcf36206b820861f1e41981a92003864b9cec2ea and 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f
CONFLICTS_FOUND: 28 files
CONFLICTS_RESOLVED: 28 files
CONFLICTS_PENDING: 0
FILES_MANUALLY_RECONCILED: enumerated and classified in docs/audits/CONVERGENCE_01_STAGE1_RECONCILIATION.md
SUPABASE_DIFF: EMPTY against bcf36206b820861f1e41981a92003864b9cec2ea; three V3 duplicates not reintroduced
TEST_RESULTS: npm ci PASS; og:check PASS; npm test 75/75 PASS; Brain PASS; explicit sync/PWA/Sales Execution/Call Intelligence/proposal/11 preview tests PASS
PUSH: PASS — merge LOCAL=REMOTE=fd99210ca81a4374377f4353e7a402b45679a23c; final documentation publication verified separately

Hotspots:

| Hotspot | Decision |
|---|---|
| app.js | MAIN_FUNCTIONAL — byte-identical Stage 0 |
| service-worker.js | MAIN_FUNCTIONAL — byte-identical Stage 0 |
| sync-bridge | MAIN_FUNCTIONAL — core v2 intact; V3 v3 candidate isolated in preview |
| preview-v2 | V3_UX — all 36 files exact V3, no activation/deploy |
| package.json | MERGE_BOTH — union scripts and syntax checks; dependencies/engines/overrides unchanged |
| package-lock.json | MERGE_BOTH audit — retained exact Stage 0 lock after equal-dependency comparison |
| scripts/validate.mjs | MERGE_BOTH — all baseline gates plus V3, 75 gates |
| AGENTS/Skills/Context/architecture/knowledge/TODO | MERGE_BOTH — current safety preserved; useful V3 content retained as scoped reference |
| Second Brain | MERGE_BOTH — stable-ID union; no shared record divergence; generated surfaces refreshed |
| Supabase | CANONICAL_SUPABASE — exact Stage 0/#110 directory; no SQL/function drift |

CI_RESULTS on fd99210ca81a4374377f4353e7a402b45679a23c:

| Workflow | Result / evidence |
|---|---|
| [Supabase Canonical Replay](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/actions/runs/37252679945) | SUCCESS; two clean replays; Structural Parity PASS twice; drift 0; not-verifiable 0; deterministic fingerprint 7f0c31d8de86892d48afb2bf9e4a6d0d36e293aab94d105344a5526241d959a9 |
| [Sales Execution P0](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/actions/runs/37252682099) | SUCCESS |
| [Call Intelligence V1](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/actions/runs/37252684333) | SUCCESS |
| [Package 00R CI](https://github.com/ldutrald5/Dutra-Sales-OG-Sitem/actions/runs/37252686691) | FAILURE solely known npm audit braces/AIOX GHSA-vfj7-8cjw-p6xm (6 high); install/lock/75-gate validate/Brain/security PASS; release step skipped after audit; local release PASS |

CANONICAL_REPLAY: PASS (current merge, not historical #110 substitution)
STRUCTURAL_PARITY: PASS
UNEXPLAINED_DRIFT: 0
NOT_VERIFIABLE: 0
QA: PASS — controlled merge audit and independent final current-SHA CI evidence review
BLOCKERS: NONE for Stage 1; known Package 00R audit advisory is separate dependency debt explicitly allowed by the task
ARTIFACT_DOWNLOAD: NOT AVAILABLE — one storage transport Forbidden; no retry. Authoritative GitHub run logs retrieved successfully and contain both parity reports' printed results/fingerprints plus byte-comparison determinism PASS. No local downloaded artifact is claimed.
SAFE_TO_START_STAGE2: YES (readiness only)
STAGE2: NOT STARTED
PRODUCTION / MAIN / V2 / V3 / PR109 / PR110 MODIFIED: NO

Final documentation/Brain closure changes no runtime/Supabase/replay/workflow code after fd99210ca81a4374377f4353e7a402b45679a23c. Current-merge CI therefore covers the unchanged executable/schema tree; final Brain/validation is rerun for the documentation closure.

## Previous Stage 0 and interim Stage 1 checkpoints (historical)

## Current environment and repository evidence

CHECKOUT: YES — real Git worktree, obtained with one successful clone
REPOSITORY_PATH: /workspace/Dutra-Sales-OG-Sitem
BRANCH: integration/dutra-os-one-system
ENTRY_HEAD: d8c31f0fd24a969a11d400bdd2031de78b79371b
CLOSURE_HEAD: c385e7f33cfa8f52dc84004a9ca4ac2cfec20ecb
PUBLICATION_BLOCKER_HEAD: 715e99aa699310199cebcf1178338ef38a57bf53 (historical)
WORKING_TREE_INITIAL: CLEAN (git status --porcelain=v1 empty)
WORKING_TREE_AFTER_BASELINE: CLEAN
WORKING_TREE_PRECOMMIT: six understood documentation/Brain files only
WORKING_TREE_AFTER_CLOSURE_COMMIT: CLEAN
WORKING_TREE_FINAL: CLEAN after local documentation commits
REMOTE: https://github.com/ldutrald5/Dutra-Sales-OG-Sitem.git (origin fetch/push)
LOCAL_GIT_TRANSPORT: PASS — clone, ls-remote and fetch succeeded; no transport retries
PROXY: inherited platform route preserved; GitHub and npm transport succeeded
AUTH: repository reads verified; integration-branch push explicitly authorized
GITHUB_PROVIDER: not used; local Git route sufficient
FILESYSTEM: writable executable checkout
NODE: v24.19.0
NPM: 11.9.0 — meets engines >=11; packageManager declares npm@11.19.0
DOCKER: daemon available, 28.4.0
SUPABASE_CLI: absent from PATH
PSQL: absent from PATH
REMOTE_WRITE_SCOPE: Stage 0 closure commit to integration/dutra-os-one-system only

Skill read and followed: `.codex/skills/dutra-environment-guardian/SKILL.md`.
Requested AGENTS, story, prior checkpoint and execution runbook read before baselines.

## Remote references and ancestry

Refs independently checked with git ls-remote and fetched read-only:

| Reference | SHA |
|---|---|
| MAIN | 5255dc5d432850dfeebe0a523402a1902b1d3a52 |
| V3 / dutra-os-ui-v3-premium | 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f |
| #109 / supabase-00s-recovery-snapshot | c7585ba688ecca8e01b1ff8044cbef52aa5ac477 |
| #110 / supabase-00s-canonical-history | 6031e04462340847c8bcff3d5d698427db444918 |
| TARGET / integration/dutra-os-one-system | d8c31f0fd24a969a11d400bdd2031de78b79371b |

`git merge-base --is-ancestor` PASS for MAIN -> #109 -> #110 -> TARGET.
MAIN/V3 common ancestor: 1b55a4fa5c7cc4f114ee0551425c554e1f58f871.
TARGET application, scripts, Cloudflare, Supabase, package.json and lockfile are
byte-identical to #110 (`git diff --quiet` PASS). Existing differences are
convergence documentation, Skills and Second Brain routing/incident metadata.

## Baseline executions, in requested order

| Command | Result |
|---|---|
| npm ci | PASS — exit 0; 243 packages; lockfile unchanged |
| npm run og:check | PASS — exit 0 |
| npm test | PASS — final rerun exit 0; 64/64 gates PASS |
| npm run og:brain:check | PASS — after refresh and after full baseline; 97 records, 0 warnings |
| npm run og:supabase:recovery:test | PASS — exit 0 |
| npm run og:supabase:replay-safety:test | PASS — exit 0 |
| node scripts/build_supabase_transactional_replay.mjs supabase/migrations /workspace/scratch/dutra-replay.sql /workspace/scratch/dutra-actual-schema.json | PASS — SQL generated from 25 migrations; 34 table assertions; fingerprint capture enabled |

Historical baseline errors, now corrected:

```text
ERROR incidents.jsonl:10 invalid status mitigated
ERROR incidents.jsonl:10 requires source_ids or derived_from provenance
DUTRA brain check FAIL — 2 error(s), 0 warning(s).
Validation suite: FAIL (og:brain:check)
```

INC-EXEC-ENV-001 is preserved with status resolved and source_ids referencing
SRC-CONVERGENCE-ENV-20261004-001. derived_from remains empty. The new root source
records the actual initial failure and recovered execution route. No schema or
checker was changed. This resolves the specific incident, not all future proxy
risks; Environment Guardian prevention remains active.

`npm run og:brain:refresh` PASS; generated index/metrics refreshed legitimately.
`lint` is an alias of the executed og:check. release:gate and aiox:config-check
were executed by npm test and passed. No audit fix was run.

Local execution logs (ephemeral workspace evidence):

- /workspace/scratch/dutra-npm-ci.log
- /workspace/scratch/dutra-og-check.log
- /workspace/scratch/dutra-npm-test.log
- /workspace/scratch/dutra-brain-check.log (historical failure)
- /workspace/scratch/dutra-stage0-final-og-check.log (PASS)
- /workspace/scratch/dutra-stage0-final-test.log (64/64 PASS)

## Supabase evidence limits

Recovery/canonical alignment and replay safety passed on current TARGET.
Replay SQL generation is not a database replay or structural parity result.
Double disposable replay, actual fingerprint capture, structural parity and
fingerprint determinism: NOT RUN in this session because Supabase CLI and psql
are absent. No production connection, query, migration or deployment was made.
The dedicated workflow is `.github/workflows/supabase-replay-ci.yml` (CLI 2.119.0).
No workflow dispatch was performed.

Historical #110 evidence only: `docs/audits/SUPABASE_00S_CANONICAL_PROMOTION_REPORT.md`
records replay/parity PASS, 0 unexplained drift, 0 not-verifiable categories and
fingerprint `7f0c31d8de86892d48afb2bf9e4a6d0d36e293aab94d105344a5526241d959a9`.
LOCAL CANONICAL REPLAY: NOT RUN — Supabase CLI/psql unavailable
LOCAL STRUCTURAL PARITY: NOT RUN — Supabase CLI/psql unavailable
AUTHORITATIVE #110 CANONICAL REPLAY: PASS
AUTHORITATIVE #110 STRUCTURAL PARITY: PASS
UNEXPLAINED DRIFT: 0 in authoritative #110 evidence
NOT VERIFIABLE: 0 in authoritative #110 evidence

The user explicitly accepts this authoritative evidence solely for Stage 0.
No structural Supabase change exists after #110: `git diff --quiet` against #110
for supabase and scripts PASS, including all uncommitted Stage 0 changes.
Package 00R braces/AIOX audit debt remains separate.

Mandatory Stage 1 gate: after any integration/resolution changing supabase/**,
migrations, functions, recovery baseline or replay scripts, rerun Canonical
Replay and Structural Parity. Prefer the dedicated GitHub Actions workflow if
local Supabase CLI/psql remain unavailable. Do not proceed beyond this gate after
Supabase changes without successful replay/parity. No Stage 1 action was run.

## BASELINE_MATRIX — MAIN / V3 / SUPABASE CANONICAL / TARGET

This is a source-backed baseline and target contract, not implemented convergence.
MAIN and V3 were inspected through fetched Git objects without branch checkout or
modification. Their standalone suites were not rerun; current tests apply to TARGET.

| Scope | MAIN | V3 | SUPABASE (#109/#110) | TARGET |
|---|---|---|---|---|
| Operational source | Mature apps/sistema-og; current functional baseline | preview-v2 shell connected through core-bridge and /core-api/state | Canonical base inherits MAIN behavior | Currently #110 runtime; preserve tested MAIN behavior during future convergence |
| UI / mobile / desktop | Existing index.html, app.js, styles.css and PWA | Premium shell, feature loader, Meu Dia, operational CRM and technical center | No Premium UI convergence | One responsive shell; V3 UX with mature behavior; not implemented yet |
| CRM / Company 360 | canonical-domain, company-360, canonical-editor, reconciliation services | operational-crm-v3 and core bridge | Canonical recovery adds live CRM structures; Auth pilot remains pending | One canonical company/account identity and Client 360; no second CRM |
| Technical / Multi-Vehicles / quote | Existing app and proposal services | technical-application-core-v3, technical-quote-service-v3, quote handoff and parity tests | Canonical calculation/proposal SQL and recovered functions | One engine and one Multi-Vehicles/quote/proposal/ROI flow; parity must be preserved |
| Sales Execution | server-sales-execution-gateway.cjs, adapter/client and tests | sales-action-center-v3, prospecting-execution-v3 and sales-execution-service | Exact live Sales Execution migration versions and recovered gateway | Preserve mature gateway/contracts and adopt V3 flow after reconciliation |
| Call Intelligence | gateway/client, Whisper contracts and compiler tests | call-provider-v3; current V3 tree lacks MAIN gateway/client and call-intelligence function | Live call-intelligence migration/function recovered | One Call Intelligence path; avoid losing MAIN capabilities |
| Persistence / offline / sync | sync-bridge, conflict/reconciliation, backups and PWA tests | connection states, IndexedDB mutation outbox/retry; p0-services mirrors | 25 exact migrations; 13 functions; 8-table supplement; Auth pilot pending | One persistence/sync model; offline/mobile acceptance still needed |
| Schema history | Retimestamped duplicates and Auth pilot under migrations | Divergent Sales Execution names/history | Exact live history and recovered evidence; historical disposable parity PASS | Keep canonical history; do not auto-apply pending Auth or fabricate versions |
| Governance / tests | Mature validation and Second Brain | Divergent package/validate/Second Brain; audit at older SHA has manual offline acceptance pending | Recovery/replay-safety and dedicated double replay workflow | 64/64 validation gates PASS; Brain provenance corrected; Stage 0 COMPLETE |

Sources: fetched trees/diffs of MAIN, V3 and #110; V3's
`docs/audits/DUTRA_OS_V3_SPRINT_1_AUDIT.md` (historical baseline
57c9c8ff9e6a07cf35c6683eea84aeab64918c08), `preview-v2/package.json`, current
`package.json`, Supabase promotion report and CONVERGENCE-01 source-of-truth rules.
The V3 audit is not a new runtime or current-head certification.

## Stage 0 acceptance and stop

- Checkout, branch, HEAD, remote, clean initial baseline and toolchain: verified.
- Protected refs and canonical base ancestry: verified.
- Required baseline and available Supabase gates: executed and recorded.
- MAIN / V3 / SUPABASE / TARGET matrix: completed above.
- Stage 0 acceptance: COMPLETE — og:check, npm test (64/64), Brain all PASS.
- Disposable Supabase rerun capability: limited by missing CLI/psql.
- BLOCKERS: NONE for Stage 0; Git write authentication recovered through valid stored login with injected variables temporarily empty. Supabase local tooling limitation remains explicitly accepted for Stage 0 only.
- Stage 1: NOT STARTED; SAFE_TO_CONTINUE_TO_STAGE_1: YES (readiness only). Stop here.

PRODUCTION_CHANGED: NO
MAIN_CHANGED: NO
V2_CHANGED: NO
V3_CHANGED: NO
PR_109_CHANGED: NO
PR_110_CHANGED: NO
MERGE: NONE
REBASE: NONE
DEPLOY: NONE
PUSH_SCOPE: ONLY integration/dutra-os-one-system
PUSH: PASS — stored authentication recovery published 0bf317200c93ce73b81e4ff0d0e8e9ae5ad38a7c; fetched local/remote HEAD equality verified.
Earlier failed push attempts below are preserved as history; no unchanged failing path was retried.
REMOTE_WRITES_SUCCEEDED: integration/dutra-os-one-system only; initial recovery push verified

Historical initial publication attempt: the local closure commit c385e7f33cfa8f52dc84004a9ca4ac2cfec20ecb was created
with the pre-commit check passing. The explicit integration-only push ran the
pre-push validation suite successfully, then failed with this exact error:

```text
fatal: could not read Username for 'https://github.com': No such device or address
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
error: failed to push some refs to 'https://github.com/ldutrald5/Dutra-Sales-OG-Sitem.git'
```

The historical push failure did not invalidate the green local Stage 0 baseline.
It was persisted in local followup commit 715e99aa before manual login restored
write authentication. Current publication success is recorded above and in the
stored authentication recovery section; the original error remains historical.

## Historical checkpoint (prior workspace; superseded environment finding)

The following records the earlier blocked environment. It is historical and does
not override the current successful checkout/transport evidence above.

## Completed

- Verified the four expected remote heads.
- Verified stacked ancestry main -> #109 -> #110.
- Created integration/dutra-os-one-system remotely from exact #110 SHA.
- Added dutra-environment-guardian.
- Routed Builder Brain and dutra-dev through the environment gate.
- Updated Context Router and AGENTS routing for checkout/Git/proxy/toolchain failures.
- Recorded incident INC-EXEC-ENV-001.

## Environment

CHECKOUT: UNAVAILABLE in the failing Codex workspace
REPOSITORY_PATH: not found locally
LOCAL_GIT_TRANSPORT: BLOCKED
PROXY: configured route to proxy:8080 was unreachable
AUTH: NOT PROVEN INVALID; transport failed before provider reachability
GITHUB_PROVIDER: AVAILABLE
FILESYSTEM_TEST_WORKTREE: UNAVAILABLE
LOCAL_TEST_CAPABILITY: UNAVAILABLE until a checkout is present

## Important diagnosis

The repository and remote refs are healthy enough to be inspected through the connected GitHub provider.

The blocker is the execution workspace transport/worktree, not the DUTRA OS repository and not the Supabase canonical package.

Do not repeat git ls-remote/clone through the same dead proxy unless the proxy/network condition changed.

## Conflicts resolved

None yet. V3 has not been integrated into this branch.

## Conflicts pending

- main/V3 code-level convergence;
- package/validate governance overlap;
- service worker/PWA overlap;
- docs/Second Brain overlap;
- canonical Supabase vs retimestamped V3 migration names;
- all other overlap discovered by actual merge in a valid worktree.

## Tests

TESTS_PASS: none executed after remote bootstrap
TESTS_FAIL: none — tests are NOT RUN because no local worktree exists

SUPABASE_CANONICAL_REPLAY: previously PASS on PR #110 evidence
STRUCTURAL_PARITY: previously PASS on PR #110 evidence
UNEXPLAINED_DRIFT: previously 0
NOT_VERIFIABLE: previously 0

These prior results are evidence for #110, not a substitute for convergence-branch reruns after V3 integration.

## Next required action

Obtain one valid executable checkout of integration/dutra-os-one-system.

Preferred order:

1. new Codex/workspace with repository attached or native GitHub checkout;
2. repair/remove the dead platform proxy only if that environment is under operator control;
3. clone/fetch the integration branch after transport works;
4. run dutra-environment-guardian preflight;
5. run baseline tests;
6. create MAIN / V3 / SUPABASE / TARGET matrix;
7. close Stage 0;
8. only then start Stage 1.

NEXT_STAGE: Finish Stage 0, not Stage 1.
BLOCKER: no executable local worktree in the prior Codex environment.
SAFE_TO_CONTINUE: NO for Stage 1 until a valid worktree/test route exists.


## Stored GitHub authentication recovery — 2026-10-05

Manual GitHub login completed. With GH_TOKEN/GITHUB_TOKEN temporarily empty,
stored auth PASS and repository permissions.push=true. Dry run PASS; real push
PASS; fetch verified LOCAL=REMOTE=0bf317200c93ce73b81e4ff0d0e8e9ae5ad38a7c.
The injected token had overridden the stored credential helper path; no token
value was printed and no user credentials were deleted. Only the integration
branch was published. Additional hardening requires real verified publication
before marking REMOTE WRITE GATE PASS; all prior incident history is preserved.
This hardening commit is published only after its green baseline, with final
HEAD equality verified after fetch. Stage 1 remains NOT STARTED.


## Stage 1 rollback and audit

PRE_STAGE1_SHA: bcf36206b820861f1e41981a92003864b9cec2ea
ROLLBACK_SHA: bcf36206b820861f1e41981a92003864b9cec2ea
V3_SHA_TO_INTEGRATE: 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f
PREMERGE_AUDIT: docs/audits/CONVERGENCE_01_STAGE1_RECONCILIATION.md
Abort an inconsistent uncommitted merge with git merge --abort; never git reset --hard.


## Stage 1 local reconciliation checkpoint

CONFLICTS_FOUND: 28 files
CONFLICTS_RESOLVED: 28 files
CONFLICTS_PENDING: 0
SUPABASE_DIFF: EMPTY versus PRE_STAGE1_SHA
TEST_RESULTS: npm ci PASS; og:check PASS; npm test 75/75 PASS; Brain PASS (125 records, 0 warnings); explicit sync/PWA/Sales Execution/Call Intelligence/proposal/preview technical tests PASS
CI_RESULTS: PENDING dedicated replay/parity and relevant workflows after merge commit/push
STATUS_STAGE1: LOCAL RECONCILIATION VALIDATED — CI pending
FILES_MANUALLY_RECONCILED / HOTSPOT_DECISIONS: docs/audits/CONVERGENCE_01_STAGE1_RECONCILIATION.md
V3_UX: preview-v2 bytes preserved; no activation
MAIN_FUNCTIONAL: app.js/service-worker/sync bytes preserved
CANONICAL_SUPABASE: exact Stage 0 directory; duplicate V3 versions rejected
MERGE_BOTH: package/validate/AGENTS/Skills/Second Brain/context; 75 gates retained/added
SAFE_TO_START_STAGE2: NO
