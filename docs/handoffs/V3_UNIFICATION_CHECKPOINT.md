# DUTRA OS — V3 UNIFICATION CHECKPOINT

## Current Stage7 — Multi-Veículos Premium (2026-10-08)

STATUS: BLOCKED — implementation/QA/integration publication PASS; pilot deploy cancelled by Railway approval tool. PRE_STAGE7_SHA / rollback: `2797d3db087d774f5ec7350deba1f3c162ad1550`. POST_STAGE7_SHA (implementation): `c8c08924d43d1589b30bd228d765f4f5260dd537`; final closure HEAD is the containing documentation commit. Branch: integration/dutra-os-one-system. Authorization: QG Stage7 only; no Stage8/main/production changes.

Owners: client OG_CRM_SERVICE/state.leads with current state.client quote projection; multi-vehicle state.vehicles[].items/qty/id; technical OG_DATA + resolveVehicleSupports/buildConsolidatedVehiclePieces; pricing/cotation calculateCompleteQuote; recovery operations.quotes; saved history state.history[].payload. Engine, price resolver, quote calculator and data.js byte-identical to entry. No second catalog/engine/CRM/store.

Delivered: explicit new vehicle through validated technical editor; independent edit/duplicate/remove by stable IDs; quantities per configuration multiply unit items once; per-vehicle items plus consolidated provenance and native finance/extras; current manual compositions/custom prices survive sibling edits; complete client/fleet/technical snapshot in existing quotation/history. Reopening clones data and hydrates visible client fields. Composition drafts use the existing envelope/outbox and survive refresh/offline.

Async/data recovery: captured nonrecursive row/context signatures reject stale controls or late edits; current outbox is awaited before accepted handoff/card render. Queue failure keeps editing recoverable. Explicit confirmed conflict/server choice preserves a checkpoint, clears only the captured discarded queue atomically, rejects newer work, and restores the selected composition including empty state. Background pulls preserve active work. No reset/storage deletion/migration. Native save snapshots current canonical rows/totals together.

QA: multi-vehicle unit PASS (mature finance11210/card12555.20/revenda9006, qty/clone/context); independent browser14cases PASS including actual503/immediateoutbox/two reloads/native reconnect/409/explicitemptyserverchoice; eight viewports320x568,360x800,390x844,430x932,768x1024,1280x720,1440x900,1920x1080 PASS. Stage3/4/5, technical context/workspace, shell/PWA, auth persistence and sync regressions PASS. Full validation80 gates/release and Brain158 zero warnings; latest publication rerun recorded in closeout below.

Real-client proof: full434-lead private current-pilot snapshot preserved before any publication. Two independent authenticated local fixtures390x844/1440x900 execute real CRM identity→RodotremVolvo×2 + TocoVolvo×3→native explicitly unsent test quote→reload/reopen: stable rows, same client,152pieces/76tires/R$11210.00 PASS. Original two history entries, three operations quotes, all original operations/interactions and backup remain unchanged. No external requests/window.open/page errors/overflow. Private fixtures/snapshots are outside Git.

Temporary bridge: Multi-Veículos→existing state.consultant technical editor→current quotation/history; owner remains current app, no iframe/secondapplication. No responsive proposal redesign. Supplied photos are reference evidence only; runtime tests do not certify physical OG mappings.

Files: app.js; index.html; components/technical-workspace.js and multi-vehicle-workspace.js/.css; service-worker.js asset-only v76/precache; package.json scripts; scripts/validate.mjs; scripts/test_multi_vehicle_workspace.mjs and browser; this checkpoint/story; docs01/contexts/roadmap/changelog/tasks; Brain source/decision/cycle/index/metrics. No data.js, package-lock, dependency, Supabase, auth engine, sync engine or production file changes.

Evidence: /workspace/scratch/stage7/ logs, /tmp/dutra-stage7-multi-qa/ synthetic screenshots/results, /workspace/private/stage7/ recoverable current snapshot and real-fixture proof. Known limits: software/runtime application needs OG physical validation; isolated pilot remote providers remain unavailable; hardware/device certification not claimed. Rollback retains current private export and isolated volume, reverts only Stage7 code/adapter changes to PRE_STAGE7_SHA; never reset or discard user data. Final publication/deployment/clean status appears below only after verification.


Stage7 publication closeout: @devops implementation commit c8c08924d43d1589b30bd228d765f4f5260dd537 published only to integration; normal hooks80/80 PASS, live remote equality and CLEAN verified. Independent architect APPROVE; final browser14/eightviews and real-source isolated flows PASS. No main/V2/V3/#109/#110/production changes.

Pilot publication BLOCKER: reviewed sole non-destructive Railway source.commitSha patch `b155ce96-83be-4ddc-a8ba-909c2913ae85`, service b385d7a3-616c-4c44-82c7-7c9541ba7c45, changes prior pin5ed1518→testedc8c08924. First accept_deploy cancelled; user explicitly approved this exact patch; the second call also returned `Cancelled — the user did not approve this action. No changes were made.` No alternate API/CLI bypass, build, restart or variable/mount change. Patch remains STAGED for platform/dashboard application.

Latest live readback: deployment `0c0e06df-e90b-4b6b-9ed4-43c234579b1e` SUCCESS and public health HTTP200/ok, deployed SHA `2797d3db087d774f5ec7350deba1f3c162ad1550`. Isolated volume509ed70c-cdfc-44e9-9eaf-3d0dc144ff2c remains500MB /data; source patch only. URL https://dutra-os-uxr01-preview-production.up.railway.app remains the daily Stage6.7 pilot, NOT proof of hosted Stage7. Current authenticated backup434leads/twohistory/threeoperationsquotes is preserved privately.

Live Stage7 acceptance: NOT RUN because build did not start. Prepared guarded private live harness requires exact healthc8c, fresh snapshot, one marked unsent quote and no external actions; no live credential read or pilot test writes by that harness. Apply the reviewed patch in the preview-project dashboard, observe SUCCESS/health exactSHA, then execute live two-viewport save/reopen acceptance. Stage7 overall remains BLOCKED until publication/acceptance; Stage8 not authorized.


STAGE: 6 — APLICAÇÃO TÉCNICA PREMIUM
STATUS: COMPLETE — implementation, local gates, independent QA and real integration publication verified
UPDATED_AT: 2026-10-06
BRANCH: integration/dutra-os-one-system
PRE_STAGE6_SHA / ROLLBACK: 7c6d68ef3b2101feb41063a6f3c39adce09eb2d8
POST_STAGE6_SHA: fadec3678b7d371358e7e9635e5c8946d858ec59 (verified implementation/acceptance publication boundary)
FINAL_CLOSURE_HEAD: containing final documentation closure commit; obtain with git log -1 --format=%H -- docs/handoffs/V3_UNIFICATION_CHECKPOINT.md and verify LOCAL == REMOTE after closure publication
AUTHORIZATION: QG Stage6 only, including bounded identity/persistence recoveries; no Stage7/8, protected branch changes or production deployment.

## Stage6 ownership and delivered behavior

| Capability | Owner / path retained | Stage6 boundary |
|---|---|---|
| Data, configurations, questions, catalog | `OG_DATA`, `apps/sistema-og/data.js` | Unchanged byte for byte; UI reads current configuration tree/catalog |
| Supports and physical composition | `resolveVehicleSupports` / `buildConsolidatedVehiclePieces`, `app.js` | Original function bodies byte intact against entry SHA; no V3 engine/fallback port |
| Technical context | `state.consultant` | Existing owner; thin `components/technical-workspace.js` presentation/input adapter |
| Durable draft | `state.operations.quotes` / `OG_OPERATIONS_MODEL` | `TECH-DRAFT-*`, `source:technical_workspace`, `status:technical_draft`, stable ID/clientId, createdAt/updatedAt, payload.client/vehicles + technicalContext |
| CRM / quote identity | `OG_CRM_SERVICE`, `state.leads`, current `state.client` projection | No technical client registry; manual quote client remains manual when unlinked |
| Handoff / prices | `state.vehicles`, `recalculateQuote`, `resolveItemPrice` / `calculateCompleteQuote` | Explicit current cotação handoff; same pricing/history/proposal owners |
| Persistence / sync / navigation | Existing local operations storage, `OG_SYNC_BRIDGE`, foreground controller, SW, `switchTab` | No new store/schema/sender/router; minimal scoped CSS and SW asset/version update |

INPUT_GATE: known configuration, each active conditional question has a valid option, supported PSI, positive integer vehicle quantity and boolean front inclusion before calling the original builder. Incomplete/unknown/invalid inputs yield empty/VALIDAR without default engine results or invented parts. Hook failure is explicit unavailable/error. UI labels runtime results as software rules requiring OG confirmation; computational parity is not physical OG certification (`OQ-OG-TECH-001` remains open).

MANUAL_REVIEW: replace/edit/add/remove current catalog items, vehicle quantity/name and notes; preserve code/qty/customPrice/technicalContext in the native vehicle contract. Every composition edit invalidates manual confirmation. Empty manual array remains empty after save/refresh and cannot resurrect automatic items. Reset to automatic and configuration changes affecting overrides require explicit confirmation; quote replacement compares name/qty/configuration/PSI/front/items, so unchanged parts do not hide manual vehicle edits.

DRAFT_AND_BRIDGES: save technical draft → `saveOperationsToStorage` → awaited existing durable outbox; UI acknowledges local persistence, global sync status requires remote ACK. No history, generatedDocuments, proposal event/value, activityEvents or contact/send fact is created by technical save. Thin handoff is Premium technical → current cotação; commercial proposal/public metadata expansion is deferred. Different linked client copies complete CRM identity/segment and resets prior billing defaults; cancellation preserves the existing quote. Unlinked draft copies the current manual quote client/terms and compares actual identity rather than equating all null clientIds. No CRM is invented. Saved technical contexts are recovered from canonical records with ID/client discriminator checks, explicit client selection and visible recovery feedback; dirty live edits are not replaced by pull/render.

ASYNC_SAFETY: controls capture connected DOM + draft signature and canonical lead identity. Save captures its draft before await; a later context/navigation cannot receive the old handoff. Submission is latched; return to the same client after another context cannot revive detached controls. Existing quotes/manual edits require confirmation before replacement.

## Stage6 bounded sync recoveries and prevention

1. Held bootstrap/reconnect GET delivered after a durable save replaced operations with an older snapshot, then scheduled PUT/ACK erased the draft/outbox while showing OK. Reproduction extracted real app functions (`handoff-runtime-review.cjs`); browser regression now holds real loopback GET and proves save survives response, refresh, subsequent PUT/ACK. Existing `loadSharedState` captures generation and rechecks generation/outbox/writer/review gates before applying remote state. Operations-only pull and local seed inspect canonical collection counts, including a technical draft with zero CRM/history/events.
2. Scheduled, queued reconnect and human-review PUT ACK could clear a newer durable outbox. Both foreground writers reproduced the window with serialized OLD payload, durable NEW save and retained timers (`old-ack-runtime-review.cjs`). Writers serialize immutable current wire snapshots and separately capture the exact existing outbox intention under lock: deep-cloned `expectedQueuedBody`, or null when absent. `clearQueuedState(expectedBody)` compares/deletes within one IndexedDB readwrite transaction. This also permits current recovered state to ACK an older captured queue without false mismatch, while a newly changed queue survives. Generation/mismatch preserves pending work and uses the current controller's timer; only the matching current ACK may produce OK. Explicit review queues its reviewed snapshot before send and applies the same safety. No retry manager, persistence or optional SW lock added. HTTP503 stays pending; HTTP409 retains explicit review.

## Stage6 validation, runtime and closeout

LOCAL_GATES: PASS — npm run lint/og:check; npm test 77/77 (tests-closeout.log); release:gate; technical input/conditional/unknown/quantity/manual/error unit; Brain refresh/check 148 records, zero warnings. No npm ci repeat: installed entry dependencies and lock unchanged; optional existing Playwright/Chromium are developer tools, no product dependency.
BROWSER_ACCEPTANCE: PASS — technical workspace eleven functional cases/eight viewports; independent context eleven flows including held GET, operations-only pull/seed, prior outbox versus newer recovered wire snapshot, scheduled/reconnect/human-review old ACK gaps, unlinked manual client, complete A→B identity/billing/pricing/history, A/B draft recovery and override replacement. Current technical UI discloses the manual quotation context when unlinked, without creating CRM identity.
REGRESSIONS: PASS — unchanged Meu Dia original; Prospecção original final (prospect-browser-final.log), Call AI thirteen flows (call-ai-browser-final.log), foreground sync/reconnect/503/409/manual review, shell routes/first paint/localized recovery/installed PWA offline reload. The earlier rapid Prospecção reconnect run timed out; the unchanged original final and two temporary diagnostic runs passed real remote ACK. No timeout or assertion was changed and no cause is claimed for that isolated earlier failure. Diagnostic code exists only outside Git.
ARCHITECT: final APPROVE — original technical/pricing functions and OG_DATA byte intact; no extra owner/schema/provider/infra. INDEPENDENT_QA: PASS — current implementation and local runtime acceptance (qa-independent-review.md). @devops publication PASS — authenticated real push/fetch and live remote equality verified at 2026-10-06T19:48:32Z; normal hooks executed all77 gates.
REGRESSION_HARNESS: Call AI's real storage-failure probe now aborts `outbox.put` rather than every outbox readwrite transaction; unrelated ACK compare/delete is not a result write. Actual durable-result abort, zero result PUT before canonical command ACK, same-ID retry and no duplicate interaction assertions remain. Final Stage5 browser result is tracked with the closing gates, not inferred from the harness change.

VIEWPORTS_TESTED: 320x568, 360x800, 390x844, 430x932, 768x1024, 1280x720, 1440x900, 1920x1080 — latest technical browser PASS for long codes/many manual items, navigation, touch/focus/keyboard and overflow. Tests use synthetic isolated records and real loopback HTTP/IndexedDB; no customer/provider/Supabase hosted writes or physical installation/device certification.
EVIDENCE: `/workspace/scratch/stage6/{architect-audit,handoff-runtime-review,runtime-access}.md`; `{tests-closeout,technical-browser-final,technical-context-browser-final,call-ai-browser-final,prospect-browser-final,day-browser-latest,sync-browser-latest,shell-browser-final,lint-final,brain-refresh-final,brain-check-final,release-final}.log`; `technical/results.txt` and eight synthetic screenshots. Initial failures and deterministic repro scripts (including ACK contract pre/postfix) remain outside Git; no production diagnostic instrumentation.
TEST_PATHS: `scripts/test_technical_workspace.mjs`; `scripts/test_technical_workspace_browser.mjs`; `scripts/test_technical_context_browser.mjs`; existing Stage3/4/5, shell/PWA/sync gates. Full suite includes the canonical technical unit test; browser tools remain optional development prerequisites without product dependency changes.
FILES_CHANGED: app.js; index.html; components/technical-workspace.js/.css; service-worker.js; services/sync-bridge-service.js; package.json scripts; scripts/validate.mjs; technical unit/workspace/context browser tests; scripts/test_sync_conflict_ui.mjs; scripts/test_call_ai_workspace_browser.mjs; story; this checkpoint; DUTRA_OS_CONTEXT/AI_HANDOFF/ROADMAP/CHANGELOG/docs01Arquitetura/tasks; Second Brain source/decision/two incidents/cycle and generated index/metrics after refresh. No OG_DATA/Supabase/preview-v2/package-lock/dependency changes.
DURABLE_MEMORY: SRC-CONVERGENCE-TECH-20261006-001; DEC-CONVERGENCE-TECH-001; INC-SYNC-STALE-GET-001; INC-SYNC-STALE-ACK-001; CYCLE-CONVERGENCE-STAGE6-20261006-001. Prior records retained; refresh/check PASS (148 records, zero warnings).

ACCESS_VERIFIED_READONLY: Railway/Sites inventory and public health audited 2026-10-06 13:05–13:11 UTC; no hosted integration preview exists in returned inventory. https://dutra-os-v3-premium-production.up.railway.app is historical V3 (`dutra-os-ui-v3-premium`, SHA 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f), not Stage6. Public health rechecked at 2026-10-06T19:47:38Z: V3 and core HTTP200/ok. Core live SHA f4c2b3c68d747b6477410ffff50521d8788f8d62 differs from remote main 5255dc5d432850dfeebe0a523402a1902b1d3a52. No deployment, service, domain, Site or tunnel created; access credentials remain runtime-managed and undisclosed.
KNOWN_RISKS / GAPS: official OG provenance remains incomplete; manual review is not factory certification. Public proposal metadata enrichment/deep Client360/Stage7 remain deferred. Isolated local acceptance does not prove physical-device or hosted-provider behavior. Existing caught empty-storage bootstrap TDZ is separate baseline debt. A hosted Stage6 link needs a separately authorized preview environment; existing production/V3 links do not prove integration acceptance.
ROLLBACK: preserve localStorage/IndexedDB/private .data/volume first; reverse only Stage6 runtime/adapters/test/asset changes to PRE_STAGE6_SHA on the integration branch, retaining additive technical draft records and outbox. No reset/data deletion or production rollback performed.
PUSH: PASS — normal hooks, real integration-only push/fetch; LOCAL == REMOTE == fadec3678b7d371358e7e9635e5c8946d858ec59, clean tree. Final documentation closure also requires authenticated equality verification. COMMITS: e69209b sync; fadec3678b7d371358e7e9635e5c8946d858ec59 technical workspace/acceptance/docs; containing closure commit records publication. PROTECTED_REFS: main 5255dc5d432850dfeebe0a523402a1902b1d3a52; V3 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f; V2 6b4bf7937aee8b236ce28701f9d149a69e0bdd7e; #109 c7585ba688ecca8e01b1ff8044cbef52aa5ac477; #110 6031e04462340847c8bcff3d5d698427db444918 — unchanged after publication. MAIN / V2 / V3 / #109 / #110 / PRODUCTION MODIFIED: NO.
BLOCKERS: NONE for Stage6 implementation/publication. Hosted integration access remains the explicitly recorded runtime gap.
SAFE_TO_START_STAGE7: NO — fresh QG authorization required after Stage6 closeout.

## Stage5 historical checkpoint (closed at 7c6d68ef3b2101feb41063a6f3c39adce09eb2d8)

STAGE: 5 — CALL AI / CALL INTELLIGENCE PREMIUM
STATUS: COMPLETE — technical acceptance, independent QA and real implementation publication verified
UPDATED_AT: 2026-10-06
BRANCH: integration/dutra-os-one-system
PRE_STAGE5_SHA / ROLLBACK: a8a75b3fdf65560359cf63e3be009e3eaca31e78
POST_STAGE5_SHA: 6eee22a4bf74960f40408a56cfb2aa9634a9e072 (verified implementation + validation publication boundary; final closure is documentation only)
FINAL_CLOSURE_HEAD: containing final closure commit; obtain with git log -1 --format=%H -- docs/handoffs/V3_UNIFICATION_CHECKPOINT.md and verify LOCAL == REMOTE after closure publication
AUTHORIZATION: fresh QG Stage5 only; no Stage6/main merge/production deployment.

## Stage5 architecture and evidence

CRM/context/history: OG_CRM_SERVICE / state.leads / OG_CALL_AI_CONTEXT / existing lead.interactions. Queue/priority/NBA/follow-up retain OG_SALES_DESK / OG_LEAD_INTELLIGENCE / OG_INTERACTION_SERVICE. Review remains the only normalized result handoff: existing recordCallResult → gateway → atomic command. No new CRM, Call AI, Sales Execution, transcription, history or persistence engine.

TRANSCRIPTION_PATH: explicit MediaRecorder capture → current signed private upload → Call Intelligence gateway/Edge provider → current transcript/metrics. WHISPER_FALLBACK: existing local worker + trusted transcript ingestion; no provider/schema/retention changes. Browser validation uses synthetic mic/audio/client contract fixtures; live provider/customer/physical-device acceptance is NOT RUN and never implied by PASS.

ORIENTATION: current OG_CALL_AI_PROMPTS / OG_AI_SERVICE. No remote orientation provider is configured in this app; existing local guidance stays usable and is explicitly labelled local/unavailable rather than remote AI success. Pasted text is a transient manual input to these existing contracts, not a new transcription system. Transcript literal, local guidance, suggestions and CRM facts remain distinguishable; suggested fields never auto-update CRM. Review permits edit/discard before approval; asking for a proposal does not mark it sent.

ASYNC_SAFETY: captured account/session/recording/generation validated after awaits and before continuations/render. A→B→A and reset invalidate old requests. Returned stale media permissions stop their tracks. Polls/submits are latched and bounded; session discard/reset clears drafts/signals/suggestions/origin. Normalized module absence or RPC failure preserves Review for explicit retry with the same external ID, before any confirmed local projection. Existing durable queue is awaited before success/advance; an ACK followed by outbox failure keeps confirmed fields locked for idempotent completion.

SYNC: existing foreground controller/outbox/SW strategy retained. Deterministic regression reproduced online arriving between durable queue completion and prior lock release (sync-lock-reproduced.log, original 30s timeout). A transient reconnect intent, set only by explicit reconnect blocked by the lock, is consumed once after release with current online/conflict/review gates rechecked. No timer/manager/store/retry loop added; 503 remains pending, actual409 requires review/send. Stage4 nonblocking serviceWorker.ready fix retained.

TEMPORARY_INTERNAL_BRIDGES: Premium CallAI → current client sheet/history and current reviewed execution commands; deep Client360 deferred. No preview-v2 engine port or second application.

VIEWPORTS_TESTED: 320x568,360x800,390x844,430x932,768x1024,1280x720,1440x900,1920x1080. PASS: workspace/review, long/incomplete context, overflow≤1px, touch targets≥44px, import contrast≥4.5, focus/keyboard and actual Enter approval. Scoped shell-token CSS plus minimal SW v71 asset/version update; no caching of API/AI responses.

TEST_RESULTS: lint/og:check PASS; npm test 76/76 PASS; call-ai static PASS; Call Intelligence gateway/contract + local Whisper contract PASS; Sales Execution adapter/gateway PASS; Call AI browser13/13 PASS (edited/ignored candidates, correct identity, module/RPC failure, same-ID retry, actual IndexedDB abort-after-ACK recovery, terminal follow-up cleared, delayed account/session/permission/upload/manual/poll/fallback, actual outbox/ACK/503/409, WhatsApp opened≠sent and eight viewports). Stage3 Meu Dia, Stage4 Prospecção including stale/empty/out-of-queue, deterministic reconnect and shell/PWA PASS. Brain refresh/check PASS:143 records/zero warnings. Original timeouts/behavioral invariants retained; browser identity assertions now check exact data-lead-id + account and empty factual summary instead of fabricated call text, and Meu Dia waits for its existing asynchronous durable-command render before asserting overdue=0.
QA: independent PASS, 13/13 executed flows/eight viewports/zero uncaught browser errors; report /workspace/scratch/stage5/qa-stage5-verdict.md. Architect APPROVE bounded ownership/review/reconnect changes. Release gate PASS. PUSH: PASS — normal hooks (76/76), real authenticated push and fetch verified LOCAL == REMOTE == 6eee22a4bf74960f40408a56cfb2aa9634a9e072; clean tree. Final documentation-only closure must also verify exact equality.
EVIDENCE: /workspace/scratch/stage5/{call-ai-browser-final,tests-final-verified,brain-final-verified,day-complete,prospecting-sync-final,sync-lock-reproduced,sync-lock-fixed,shell-complete,call-contracts-final,sales-final}.log and call-ai/16 synthetic screenshots. npm ci not repeated: installed entry dependencies/lock unchanged; Playwright/Chromium already available optional developer tools, no product dependency added.
FILES_CHANGED: app.js; index.html; components/call-ai-workspace.css; service-worker.js; package.json (scripts only); scripts/test_call_ai_workspace_browser.mjs; Stage3/4/sync browsers and sync conflict signature check; existing story/checkpoint; compact context/handoff/roadmap/changelog/tasks/architecture/CallAI docs; Second Brain source/3 incidents/cycle and generated index/metrics. No deletions, supabase/**/preview-v2/** changes or package-lock/dependency changes.
DURABLE_MEMORY: SRC-CONVERGENCE-CALLAI-20261006-001; INC-CALLAI-CONTEXT-001; INC-CALLAI-RETRY-001; INC-SYNC-RECONNECT-LOCK-001; CYCLE-CONVERGENCE-STAGE5-20261006-001. Prior records preserved.
KNOWN_GAPS: actual hosted provider/private storage/Whisper end-to-end and physical-device acceptance were not invoked; fixtures/contracts preserve current paths. Remote orientation provider remains unconfigured. Existing caught empty-storage bootstrap TDZ is separate baseline debt. No new infrastructure or external service.
COMMITS: 332481efda687e9fd70d42abc18e5c21f377d8a3 runtime/regression; 6eee22a4bf74960f40408a56cfb2aa9634a9e072 validation/Brain/checkpoint; containing closure commit records publication.
PROTECTED_REFS: main5255dc5d432850dfeebe0a523402a1902b1d3a52; V37ce99b313724ac2ad2bb9996c12eea9b897a7e3f; V2dutra-os-ui-v2-preview6b4bf7937aee8b236ce28701f9d149a69e0bdd7e; #109branch+PRc7585ba688ecca8e01b1ff8044cbef52aa5ac477; #110branch+PR6031e04462340847c8bcff3d5d698427db444918 — verified unchanged after real publication.
BLOCKERS: NONE
MAIN / V2 / V3 / #109 / #110 / PRODUCTION MODIFIED: NO
READINESS_STAGE6: technically ready; execution requires fresh QG authorization.
SAFE_TO_START_STAGE6: NO — fresh QG authorization required.

## Stage4 historical checkpoint (closed at a8a75b3fdf65560359cf63e3be009e3eaca31e78)

STAGE: 4 — PROSPECÇÃO + SALES EXECUTION PREMIUM
STATUS: COMPLETE — technical acceptance, independent QA and implementation publication verified; final documentation closure follows
UPDATED_AT: 2026-10-05
BRANCH: integration/dutra-os-one-system
PRE_STAGE4_SHA / ROLLBACK: fe1760d78865d85ecb84d8ae4a244094968bb4ca
POST_STAGE4_SHA: 6379c4f81007b78582444e0aeeaab26c96aa4dc7 (verified implementation + validation publication boundary; final closure is documentation only)
FINAL_CLOSURE_HEAD: containing final closure commit; obtain with git log -1 --format=%H -- docs/handoffs/V3_UNIFICATION_CHECKPOINT.md and verify LOCAL == REMOTE after publication
AUTHORIZATION: QG Stage4 and two bounded recoveries only. STOP; no Stage5/main merge/production deploy.

Prior stages: [CONVERGENCE-01 checkpoint](DUTRA_OS_ONE_SYSTEM_CHECKPOINT.md). Original WIP preserved throughout; no reset/stash/discard or data cleanup.

## Architecture reused

CRM/identity/dedup: OG_CRM_SERVICE / state.leads / lead.id.
Queue: OG_SALES_DESK.selectQueue over existing first-contact/territory eligibility; no independent queue engine.
Priority / NBA: OG_LEAD_INTELLIGENCE.scoreBreakdown / nextBestAction.
Results / follow-up: OG_INTERACTION_SERVICE.recordResult / setNextAction; shared existing outcome command.
Normalized execution: existing client/adapter → Review CallAI → atomic recordCallResult. No V3 engine port.
Research/provenance: existing Intake/Research/Review; imported public evidence remains distinguishable from confirmed facts.
Persistence/sync: existing stores / OG_SYNC_BRIDGE / same IndexedDB v2 outbox/recovery; foreground authenticated sender. SW signals foreground delivery, never another sender.

TEMPORARY_INTERNAL_BRIDGES: Prospecção → current client sheet (deep 360 deferred); normalized Prospecção → current Review CallAI (sole normalized outcome owner); linked research discovery → premium Meu Dia (same canonical CRM identity).

## Delivered behavior

Premium prospecting uses the single shell and OG tokens, wide desktop workspace/context and operational mobile actions. Import plans the whole batch against current CRM plus preceding planned rows, requires explicit ambiguous target or explicit duplicate-creation decision, preserves identity/history and only fills missing profile fields. Research retains source URLs/review metadata and offers explicit linkage. No second CRM/score/agenda/Sales Execution/storage.

Local results use the same guarded command as Meu Dia, await existing durable outbox before success/advance, update follow-up and feed Mission Control. Any normalized companyId uses current Review, including without an active session; cancelled account switching preserves notes and identity. WhatsApp open/preparation never implies delivery. Scoped CSS is precached with minimal SW v70 asset/version change; strategies/schema unchanged.

## Recovery evidence / root causes

1. Original Stage4 browser failed: `AssertionError: input did not match /Fila concluída/`, old script line89. Focus accepted a CRM lookup without active filtered membership, exposing `1 / 0` and actions outside queue. `prospectFocusSelection` now derives valid current/first eligible/null on every render. A normalized session validates session/member/company/nonterminal membership. Position derives actual queue membership. Panel capture rejects obsolete/disconnected controls before any mutation or external action. Regression retains the empty-state assertion and proves one→zero, invalid→eligible, zero→items and stale captured WA/tel/Review/delay/save inertness.

2. Required Meu Dia reconnect failed at scripts/test_meu_dia_browser.mjs:72:45: `page.waitForFunction: Timeout 30000ms exceeded`. Root cause reproduced using a temporary served-app probe: after offline debounced PUT failed and outbox persisted, optional navigator.serviceWorker.ready remained unresolved while serverSyncInFlight stayed true. Online flush returned false, preserving busy/pending forever. Earlier passes reconnected before this debounce path; this was a real timing race, not evidence of a harmless flake.

FIX: keep await of existing durable outbox; detach optional ready→Background Sync registration in a caught best-effort promise; existing finally releases foreground lock. No timeout increase, visual forced OK, new timer, owner or retry mechanism. No temporary diagnostic code remains in production files.

SYNC_FLOW: native offline/online → single existing network listener → ordered startup recovery → loadSharedState → existing foreground outbox flush/authenticated PUT → actual HTTP ACK → queue clear → setSyncStatus → persistent #og-sync-status consumed by Meu Dia/shell. Errors retain queued state; HTTP409 persists conflict/review and forbids implicit overwrite. Optional SW Background Sync does not block this path.

## Validation

@architect: APPROVE Stage4 bounded canonical adapters and both recoveries.
@qa: PASS final independent review of actual code and execution evidence. @devops: real implementation push PASS; authenticated fetch verifies exact equality and protected references.

- npm ci: not repeated; installed entry dependencies/lock unchanged. Playwright/Chromium are already-installed optional developer tools, no new product dependency.
- npm run og:check / lint equivalent: PASS, syntax includes both new browser scripts.
- npm test: 76/76 PASS (CRM, intelligence, sync/conflict, Call AI, PWA and existing regressions included).
- npm run og:brain:refresh / og:brain:check: PASS, 138 records, zero warnings.
- npm run og:prospecting:test: PASS, canonical deterministic CNPJ/phone/additional phone/email/domain/name/internal-ID matching and provenance.
- npm run og:sales-execution:test: PASS, adapter/gateway contracts.
- npm run og:prospecting:browser:test: PASS, all six required flows; explicit existing link, ambiguous two-target choice/no overwrite, intra-batch duplicate cancellation atomic, new CRM conversion, canonical result/follow-up→Meu Dia/refresh/double click, researched source URLs, normalized identity Review, real offline/reconnect/HTTP409 preservation, stale focus regression.
- npm run og:meu-dia:browser:test: PASS; original script unchanged, original timeout/assertion preserved. Includes actual remote reconnect ACK and HTTP409 review/refresh.
- npm run og:sync:browser:test: PASS. Deterministically waits for failed offline scheduled PUT and durable outbox BEFORE reconnect with SW blocked; verifies actual remote data/outbox clear/OK. Also empty-outbox reconnect, HTTP503 queued/notOK/no request loop, later real retry ACK, actual409 with refresh/explicit prepare(no write)/send/ACK/cleared recovery, bounded listeners/requests after repeated navigation/reconnect. No manual reload needed for successful reconnect; reload only tests conflict recovery.
- npm run og:shell:test: PASS, 13 routes/eight viewports, first paint without optional engines, localized error recovery and installed PWA offline reload/current sync contract.
- git diff --check: PASS; no excluded/renamed functional files; supabase/** and preview-v2/** unchanged.

VIEWPORTS_TESTED: 320x568, 360x800, 390x844, 430x932, 768x1024, 1280x720, 1440x900, 1920x1080. Focus/intake/queue/many/long/few/empty, overflow/actions/focus, mobile/tablet/desktop shell PASS. Recovery2 changes no layout. Independent visuals reviewed.

FILES_CHANGED: apps/sistema-og/app.js; components/prospecting-workspace.css; index.html; service-worker.js; services/crm-service.js; services/prospecting-review-ui.js; scripts/test_prospecting_engine.mjs; scripts/test_prospecting_workspace_browser.mjs; scripts/test_sync_reconnect_browser.mjs; package.json (scripts only); Second Brain sources/incidents/cycle and generated index/metrics; CONVERGENCE story; this checkpoint; compact canonical context/handoff/changelog/roadmap/task status and prior checkpoint pointer.

DURABLE_MEMORY: SRC-CONVERGENCE-PROSPECTING-20261005-001; INC-PROSPECT-FOCUS-001 resolved; INC-SYNC-SW-READY-001 resolved; CYCLE-CONVERGENCE-STAGE4-20261005-001 completed. Prior Brain records untouched.
EVIDENCE: /workspace/scratch/recovery2/{probe,day-fixed,stage4-browser-final,shell-final,tests-final,brain-refresh,sync-browser-final,sales-execution}.log; /workspace/scratch/dutra-stage4/ artificial-data screenshots. Probe is outside Git; no production instrumentation.

KNOWN_RISKS / GAPS: browser tests use artificial isolated local data and fixtures, never claim live hosted Supabase/provider/customer validation. Existing caught empty-storage bootstrap TDZ and physical-device network acceptance remain separate recorded debt. Historical result status proposal_enviada is retained for compatibility and is not proof of sending; factual proposal/Mission Control contracts remain unchanged. Deep Client360 and full V3 engine migration deferred; not required for this stage. Optional browser tooling remains a developer prerequisite outside product dependencies.

PUSH: PASS — normal hooks and authenticated push/fetch verified LOCAL == REMOTE == 6379c4f81007b78582444e0aeeaab26c96aa4dc7; clean tree. Final documentation-only closure must also verify exact equality.
COMMITS: aa21cc200154957ffc1439a8d714a09f58e9ec57 runtime; 6379c4f81007b78582444e0aeeaab26c96aa4dc7 regression/Brain/checkpoint; containing closure commit documents publication.
BLOCKERS: NONE
PROTECTED_REFS: main 5255dc5d432850dfeebe0a523402a1902b1d3a52; V3 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f; V2 dutra-os-ui-v2-preview 6b4bf7937aee8b236ce28701f9d149a69e0bdd7e; #109 c7585ba688ecca8e01b1ff8044cbef52aa5ac477; #110 6031e04462340847c8bcff3d5d698427db444918 — unchanged after publication.
MAIN / V2 / V3 / #109 / #110 / PRODUCTION MODIFIED: NO
SAFE_TO_START_STAGE_5: NO — fresh QG authorization required, even after technical readiness.


## Stage 6.5 — Unified Preview / Reality Check (2026-10-07)

STATUS: COMPLETE — recovery REUSE EXISTING UXR PREVIEW authorized by QG to avoid the Free plan fourth-service provisioning limit. No upgrade, new project, service or volume.

- Project: DUTRA OS UXR-01 Preview (`d8e7173f-b8d3-4f8a-85e7-33c93d627774`); environment production (`e5b1fd77-0460-431c-b886-7be134a5c5f3`). This is the preview project, not official production.
- Reused service: `dutra-os-uxr01-preview` (`b385d7a3-616c-4c44-82c7-7c9541ba7c45`), now the Unified Preview. Existing technical name/domain retained; former UXR source consciously replaced.
- Source: `ldutrald5/Dutra-Sales-OG-Sitem`, branch `integration/dutra-os-one-system`, pinned deployed SHA `85e17dffd04f2f1f16eab1714344778bb60a3422`. Pin prevents subsequent documentation pushes from implicitly deploying a different commit; reconnect source deliberately for later authorized releases.
- Deployment: `639a9b9b-0758-4af2-bd6e-2c8e057a8c9d`, SUCCESS. RAILPACK, repository root `/`, `npm start`, health `/health`.
- URL: https://dutra-os-uxr01-preview-production.up.railway.app
- HTTP application and health: 200; health `ok=true`. Release field is null; deployed SHA is verified through Railway deployment metadata, not inferred from health.
- Isolation: no attached volume, database migration, production credentials or seed copied. Only pre-existing preview OG_ACCESS_PIN / OG_ACCESS_TOKEN / OG_DATA_DIR remain. Filesystem persistence is EPHEMERAL; use disposable test data, not the only copy of customer records.
- Browser smoke on the live domain: 390x844 and 1440x900 PASS. Meu Dia, Prospecção, Call AI UI, Aplicação Técnica (`guia`) and existing Cotação navigate inside one shell; one visible workspace, zero horizontal overflow and zero page/bootstrap errors. Access-code prompt displayed. No mandatory navigation to historical V3.
- Scope of smoke: prompt dismissed without changing credentials; authenticated persistence/commercial writes and remote AI/provider workflows were NOT tested. Existing preview access code is required for protected APIs. Call AI/Whisper, Prospect Search and remote Sales Execution credentials were not copied; their remote capabilities may be unavailable and are not certified by UI smoke.
- Preservation confirmed live: V2 deployment `267a08bc-0e1f-4fd3-8674-2e35f41fba1a`, V3 `0d869744-565e-42a7-be53-f21d9007e868`, official production `def9b0c2-301b-4c83-a459-07ff29c0dda3` and its `/data` volume unchanged. Main and protected Git branches untouched. No application code changes.
- Runtime rollback: prior UXR source `uxr-01-mobile-simplification`, deployment `75ffd707-2287-4d84-bde4-a038a4f53745`, SHA `417d4fab88bf18e561559a62570f2404f0dab973`; retained as historical locator, no rollback executed.
- Reality check for Lucas: Meu Dia → Cliente → Prospecção → Registrar resultado → Call AI → Follow-up → Aplicação Técnica → Cotação existente. Ask: “Em qual momento eu ainda preciso sair deste sistema?” Record mandatory exits as prioritized backlog, without implementing Stage 7.

NEXT: STOP. Stage 7 requires fresh QG authorization.


## Stage 6.6 — Synthetic reality check (2026-10-07)

ENTRY_SHA: `8325f5cf6c2f0104138106f3025a0708ca06c069`.
STATUS: COMPLETE — authenticated live reality check PASS.

Reuses `applyHostedSeed` / `OG_STATE_SEED_GZIP_B64`, idempotent canonical merge, existing `state.leads` and durable sync/outbox. Fixture `scripts/fixtures/isolated-preview-seed.json` contains only DEMO-DUTRA-CLIENT / DEMO-DUTRA-PROSPECT, synthetic company/contact/context, no telephone/CNPJ/email or production data. No separate CRM, score, agenda, history, sync or demo engine. Existing guarded technical client change carries canonical identity from the sales card and client sheet; no unsaved draft overwritten without the existing confirmation.

`OG_ISOLATED_PREVIEW=true` is an explicit service-only switch. Public no-store runtime metadata contains no data/secrets; SW never caches it. Preview status annotates actual sync mode (never forces OK), preserving visible failures/offline/conflict and all ordinary production semantics. External communication launch and remote Sales Execution/Call Intelligence/research endpoints are blocked in isolated preview; canonical local review/result/follow-up and ephemeral `/api/state` still work. Existing access PIN remains required; no production credentials copied. Health release can read Railway's deployed commit metadata.

QA proportional: og:check PASS; new `og:preview:reality:test` PASS at 390x844 / 1440x900 through real seed→Meu Dia→client sheet→Call AI review→result/follow-up→Meu Dia→technical→quote, exact CRM identity/vehicle/pieces/quantities, real ACK/offline/reconnect and honest HTTP503. Standard hosted config/auth, hosted seed, client sheet/CRM, Call AI, technical unit/context browser, sync bridge/conflict/reconnect/HTTP409 and PWA release checks PASS. No eight-viewport matrix or independent full-stage replay. Durable lesson SRC-CONVERGENCE-REALITY-20261007-001 / INC-TECH-ENTRY-CONTEXT-001; Brain150 zero warnings.

Rollback: entry SHA above plus service's prior pinned `85e17dffd04f2f1f16eab1714344778bb60a3422`; disable only service-specific preview flag/seed if reverting. Never clear persisted user state. Synthetic seed is additive and marker-controlled; ephemeral container replacement can restore the fixture and lose preview-only changes. Stage7 NOT authorized.

Stage6.6 hosted closeout: deployed/pinned SHA `8c1e9c6443e59c89c80269093d8fc7afe3f86d4f`, deployment `0a9ae144-3df1-49ed-b58c-2998fb91f82b` SUCCESS on service `b385d7a3-616c-4c44-82c7-7c9541ba7c45`. URL https://dutra-os-uxr01-preview-production.up.railway.app ; HTTP200 health reports that exact release SHA. Explicit runtime flag true, no volume. Seed and OG_ISOLATED_PREVIEW are service-only; a generated preview-only OG_LOCAL_ACCESS_TOKEN enabled authenticated smoke without exposing credentials or changing existing OG_ACCESS_PIN. It is not copied from production.

Live new reality test PASS 390x844 / 1440x900: canonical customer and review identity, human DEMO outcome/follow-up→Meu Dia, guarded client→technical→exact existing quote handoff, actual `/api/state` writes/ACKs, offline/reconnect and visible HTTP503 recovery, blocked external communication. Node hosted runner uses NODE_USE_ENV_PROXY=1 for this workspace's transport; no test assertion/timeout weakened. Server inspection after smoke: exactly 2 synthetic leads, blank phone/CNPJ/email, 2 explicitly reviewed DEMO interactions and 1 technical draft under the same client ID. Screenshots at /workspace/scratch/stage66-live (outside Git). No live production/provider/WhatsApp/telephone/Supabase write.

Protected runtime rechecked: V2 and V3 deployments unchanged; official production remains `def9b0c2-301b-4c83-a459-07ff29c0dda3` with its separate `/data` volume. Integration implementation push verified CLEAN/local=remote by @devops; normal hooks77/77 PASS. Documentation closeout commit is intentionally newer than the pinned runtime and must likewise be pushed/verified. Readiness: Lucas can test with the existing preview PIN; only synthetic disposable data, remote AI/transcription/research/Sales Execution providers unavailable. Filesystem data may disappear on redeploy. Stage7 STOP.

## Stage 6.7 — stable daily pilot preflight (2026-10-07)

STATUS: BLOCKED by explicit QG stop condition: current canonical real CRM dataset cannot yet be identified/read. Entry integration SHA `3ce304764a28420235ff02318bf5485fe62ddfe5` clean, local=remote; runtime remains pinned Stage6.6 `8c1e9c6443e59c89c80269093d8fc7afe3f86d4f`. No code, authentication, seed, deployment, production or infrastructure mutation.

Data audit: no private `.data/shared-state.json`, XLSX, ODS or real import snapshot in this workspace/attachments; only synthetic fixture and empty imports/.gitkeep. Legacy production `/imports/lucas-2026.json` HTTP404. Official CRM `/api/state` HTTP401 without an authorized authenticated export; production credentials not read/copied. Connected Drive located auxiliary Clientes_Pos_Venda_OG_Final.xlsx (`1VEAtvwjdnDkm-LI6ZeIy_Uoq3_HKGY7T`, modified 2026-09-29) and two Leads_Consolidados_CRM.xlsx versions (`1-qG-aBKdP5BUtCPcje17MYMeOn7ZYXFz`, modified 2026-09-30; `1aGXRROCQBfILqMfwJ5gSC4OEOSM_dbGL`, modified 2026-09-29). No exact CRM OG dr.ods identified in scoped search. These metadata dates do not establish current canonical ownership. No auxiliary file imported, merged or changed. Totals/field coverage/dedup are UNKNOWN, never zero by assumption. Canonical template policy identifies DUTRA OS after confirmed import as source of truth.

Auth audit: current client prompts and stores entered bearer access value in sessionStorage, server verifies bearer/PIN. Persistent authenticated session/logout not implemented in this stage because canonical-source stop condition precedes implementation. Preview project still has no volumes/buckets; real-data pilot persistence NOT verified. No new storage provisioned, no production volume reused. Do not call this a daily real-data pilot or relabel the existing synthetic preview.

Resume requirement: obtain current CRM functional backup/export carrying canonical IDs, revision/time, history, next actions and operations; identify its actual owner before comparing auxiliary spreadsheets. Use existing backup/export path; do not share PIN/tokens in Git/chat. Then resume auth/session and isolated persistence work with regression gates. Stage7 remains unauthorized.

Budget backlog — recorded only, NOT implemented: (1) white economical print layout with OG identity; (2) high-resolution PNG for WhatsApp, single/multipage as appropriate; (3) controlled editable text/titles/notes/conditions without silent technical-calculation changes; (4) one template engine over canonical quote data for quick/standard/executive/premium/custom presentations; (5) strategic-client personalization with logo/name/complementary identity/cover and available fleet photos. No independent generators, advanced ROI or quote redesign in Stage6.7.

## Stage 6.7 recovery — QG data source decision and local persistent auth

STATUS: BLOCKED (whole pilot); persistent-auth implementation is locally validated, not deployed. PRE_SHA `ed7d32c6b2be04260ba1cd7c16d76b2c9d2111de`; POST_SHA is the containing recovery commit. `8c1e9c6443e59c89c80269093d8fc7afe3f86d4f` is an ancestor (git gate exit0). Earlier unresolved-source decision above is superseded by QG: PRIMARY PILOT SEED `CRM OG dr.ods`; secondary enrichment `Clientes_Pos_Venda_OG_Final.xlsx`; other consolidated XLSX auxiliary/review only. Runtime owner stays OG_CRM_SERVICE/state.leads.

FILE_REQUIRED: `CRM OG dr.ods` — no ODS physically present in workspace. Only import is paused; no substitute imported and no indefinite Drive search. ODS/XLSX/other totals, duplicate count and real-lead count remain UNKNOWN/NOT RUN. No real data imported, no second CRM, no synthetic data relabelled as real.

Auth delta: opt-in `OG_PERSISTENT_AUTH=true`; signed opaque Secure/HttpOnly/SameSite=Strict/Path=/ cookie, 30-day remember-device session; unchecked browser-session cookie with 24h server expiration. Reuses current server PIN and strong bearer-derived signing key (or private OG_SESSION_SECRET). Durable hashes/expiry/revocation in existing OG_DATA_DIR, atomic mode0600 file; logout invalidates replay. One shared login promise prevents concurrent prompts; no PIN written by the enabled client to browser storage. Non-secret last-known mode supports offline PWA boot without granting access; explicit server flag false wins. Cookie writes require same Origin, except existing bearer credentials actually validated server-side. Static private/dot data paths are denied. Legacy default-off access remains compatible and the live preview still uses it until deployment.

QA: auth unit and browser login/incorrect PIN/reload/reopen/nav/offline/reconnect/process restart/logout/tamper/expiry/origin/HTTP409 PASS; 390x844/1440x900 auth layout PASS. Existing Meu Dia, prospecting and installed shell/PWA browser suites PASS; general suite78/78 PASS, Brain153 zero warnings. Final original installed-PWA auth offline reload is part of retained browser coverage. No raw logs, user content or credentials committed. Architecture approval scoped to auth; imported real-client/sample20/quote/persistence-on-Railway validation NOT RUN.

Live read-only check: preview remains pinned `8c1e9c6443e59c89c80269093d8fc7afe3f86d4f`, deployment `0a9ae144-3df1-49ed-b58c-2998fb91f82b` SUCCESS, health200, no volume or staged mutations. Current preview has user-entered test quotation/work on ephemeral store. Before redeploy or attaching authorized isolated volume, obtain recoverable authenticated pilot backup/export. No live access credential available through permitted tools; do not replace credentials/redeploy first or bypass redaction. This is data-loss prevention, not a new canonical-source ambiguity. No production/provider/data write, no main/V2/V3 mutation.

Resume Action Pack: (1) provide private `CRM OG dr.ods` and backup/export of current preview store; no PIN/token in chat/Git; (2) retain recoverable snapshot outside Git; (3) configure preview-only isolated volume with existing filesystem path and restore current store, stable signer/auth flag; (4) deploy tested integration commit and verify remembered sessions/restart/logout; (5) import primary ODS idempotently, enrich/dedup cautiously, validate20 real identities and one quote, then update pilot banner. Existing budget backlog stays deferred. Rollback code: PRE_SHA; runtime stays original pinned SHA until a verified recoverable store is available. Stage7 NOT AUTHORIZED.

Auth validation clarification: enabled session mode accepts PIN only through rate-limited login; existing strong API bearer stays compatible. Installed-PWA offline-reload QA uses explicit online event after CDP restores network, matching existing shell/PWA harness: trace showed navigator.onLine=true but zero native online events. Canonical handler must produce real sync OK/API200; no visual override or timeout increase. Ordinary no-reload reconnect and browser restart use normal browser events.

## Stage 6.7 continuation — preserved backup and real pilot import

PRE_SHA: `5d987927de619f3e76a08a53b92dcb09df9b0760`. STATUS: COMPLETE — local gates, live smoke and actual restart/redeploy retention PASS. QG supplied the primary ODS and a full current-pilot backup; the exact known auxiliary workbook was retrieved read-only. Earlier missing-source blocker is resolved.

Backup: valid original export preserved outside Git before transformation or infrastructure changes. Existing Data Safety restore verifies all 13 canonical IDs, one quotation history entry, one operations quote and 15 activity events. Full fallback restores original work on the new empty pilot store; existing meaningful state, including operations-only work, is never replaced. Private snapshots/review stay outside Git.

Import: primary ODS 425 CRM/list rows, 424 valid and one invalid (35 CRM + 390 list rows; 389 list valid). Secondary XLSX 1,132 physical rows across 822 list + 155 post-sales + repeated 155 unique-client view; repeated views are not concatenated into CRM. Final 434 leads = 13 preserved + 421 new. Two primary matches reuse the same entity; one code namespace collision remains for review. Secondary safely enriches four unique entities; 21 identity-review and 1,104 unmatched source rows are retained privately, not silently merged/imported. 32 contacts attach to existing unique parent entities. Runtime owner remains OG_CRM_SERVICE/state.leads. No second CRM or scoring owner.

Identity/idempotence: stable source IDs, fill-only canonical imports and existing CRM/spreadsheet owners; existing human fields/interactions/history/operations preserved. Two actual adapter passes and hosted marker repeat retain the same 434 IDs, zero second-pass additions. Existing seed merger now matches canonical ID before optional identifiers. Spreadsheet calendar dates preserve wall-clock day.

Runtime plan: preview-only service b385d7a3-616c-4c44-82c7-7c9541ba7c45; isolated volume piloto-dutra-os-data (`509ed70c-cdfc-44e9-9eaf-3d0dc144ff2c`) staged at /data, 500 MB. No production mount, credential or database used. Existing opt-in signed-cookie auth and stable private signing key; original preview PIN unchanged. Banner requires explicit flags, validated seed marker/hash/provenance and real mounted data directory, while retaining real sync/error/offline state.

Scope remains Stage 6.7. Budget print/PNG/editable presentations/template/client-branding backlog above is deferred. Code rollback locator: PRE_SHA; data rollback: preserved original full export plus isolated store snapshots. Never clear user persistence or reuse production /data. Hosted deployed SHA, restart/redeploy proof, final tests and publication are recorded below only after validation.

Local gates: og:check PASS; full suite 79/79 PASS (release gate included); Brain155 zero warnings. Auth browser wrong PIN/cookie/reload/reopen/restart/logout/offline PWA/HTTP409 PASS; offline public-isolation flag retained without granting access. Meu Dia, Prospecção (empty/stale/out-of-queue), reconnect/503/409 review PASS; technical context PASS. Architect scoped APPROVE after fixing additive contact preservation: existing records remain intact; different people sharing a switchboard are keyed by name+phone. Runtime/banner public metadata contain no secrets or customer content. Live original-PIN login remains unverified because provider redacts existing credentials; it will not be replaced just to satisfy a test.

Stage6.7 hosted closeout: implementation/deployed SHA `5ed1518179bba323df6ea978238df2f9a56579cc`; initial deployment `526fa38e-a4c3-4af4-b217-7d621715bf45`, final redeployment `5da54afa-b8bf-4553-aae7-d4b5aeb2da76`, both SUCCESS. Existing UXR service remains the only target; isolated volume `509ed70c-cdfc-44e9-9eaf-3d0dc144ff2c` LIVE, 500 MB, /data, service-only. URL https://dutra-os-uxr01-preview-production.up.railway.app ; health HTTP200 reports exact deployed SHA and persistent=true; no staged changes remain.

Live QA: 20 varied real imported entities at each 390x844/1440x900 maintain canonical CRM → Call AI review → technical IDs. One explicitly marked unsent test quotation verifies the same client/vehicle/pieces/quantities; second viewport reuses it. Original quotation, activity/history/interactions preserved; reload/reconnect/operational navigation/no overflow/no page errors PASS. No fabricated call outcome, remote provider request, message or telephone action. Full current recoverable canonical export validated privately. Actual Railway process restart and subsequent compatible redeploy preserve identical leads/history/operations (434 leads, two quotation history entries including the one test quotation); repeated seed does not duplicate or reset current work.

Auth deployed: runtime persistentAuth=true, anonymous API denied, incorrect PIN rejected. Original preview PIN/shared source unchanged; signing key stable and session hashes use isolated persistent OG_DATA_DIR. Local normal-PIN cookie login/reload/browser reopen/restart/logout/offline PWA/HTTP409 and 30-day remember-device expiration PASS. Live smoke uses a strong preview-only API bearer, so original PIN login was not manually executed on the live URL; this limitation is explicit, not represented as a tested human login. Unchecked sessions use a browser-session cookie and 24h server expiry. No raw PIN in browser storage/bundle/Git.

QA transport incident: Playwright API request bypassed the workspace proxy and exposed the generated preview-only QA bearer in a connection-error diagnostic. Harness now uses proxied native fetch/browser transport and sanitizes failure output. Local matching diagnostic logs sanitized; the exposed bearer was rotated only on the pilot and verified HTTP401 after redeploy. User PIN, stable session key and production credentials untouched. No claim that historical tool output was erased.

ODS field audit (CRM/list): 425 total, 424 valid, one invalid; CNPJ5, phone275, email0, city3, source status35. Secondary physical-row audit remains 1,132 (977 rows before the repeated 155-row view); safe enrichment only, no bulk secondary addition. Ambiguous primary/secondary/contact rows remain recoverable private review, not silently discarded or merged.

Final gates: og:check PASS; validation79/79 PASS with release gate; Brain155 zero warnings; import/backup/hosted idempotence/auth PASS; Meu Dia/Prospecção/Sales Execution/Call AI/technical/PWA/offline/reconnect/sync/HTTP409 regressions PASS. Architect APPROVE. Production deployment `def9b0c2-301b-4c83-a459-07ff29c0dda3` and its separate volume, V2/V3 deployments and protected Git refs unchanged. Supabase/schema/main not modified.

Published implementation commit above was verified clean/local=remote by @devops with normal hooks. Final documentation/harness closure HEAD is its containing commit; runtime intentionally stays pinned to the tested implementation SHA, so the closure push cannot silently deploy a new build. Rollback preserves the isolated volume/current export; PRE_SHA above is code rollback locator, not permission to delete data or downgrade populated stores blindly.

KNOWN_GAPS: original live PIN human login not exercised by automation; secondary namespace/identity review remains pending; remote AI/Whisper/research/Sales Execution deliberately unavailable in isolation. Pilot persistence is not a substitute for regular user exports. Budget presentation backlog remains deferred. SAFE_TO_USE_AS_DAILY_PILOT: YES (isolated pilot, with these capability limits). SAFE_TO_START_STAGE_7: NO — fresh QG authorization required. STOP.
