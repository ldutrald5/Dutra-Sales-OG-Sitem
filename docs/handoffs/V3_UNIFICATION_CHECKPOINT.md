# DUTRA OS — V3 UNIFICATION CHECKPOINT

STAGE: 6 — APLICAÇÃO TÉCNICA PREMIUM
STATUS: READY_FOR_PUBLICATION — local gates and independent QA PASS; real push proof pending
UPDATED_AT: 2026-10-06
BRANCH: integration/dutra-os-one-system
PRE_STAGE6_SHA / ROLLBACK: 7c6d68ef3b2101feb41063a6f3c39adce09eb2d8
POST_STAGE6_SHA: PENDING — no Stage6 commit/push claimed
FINAL_CLOSURE_HEAD / LOCAL==REMOTE: PENDING — verify after authorized real push/fetch
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
ARCHITECT: final APPROVE — original technical/pricing functions and OG_DATA byte intact; no extra owner/schema/provider/infra. INDEPENDENT_QA: PASS — current implementation and local runtime acceptance (qa-independent-review.md). Publication remains an independent @devops gate.
REGRESSION_HARNESS: Call AI's real storage-failure probe now aborts `outbox.put` rather than every outbox readwrite transaction; unrelated ACK compare/delete is not a result write. Actual durable-result abort, zero result PUT before canonical command ACK, same-ID retry and no duplicate interaction assertions remain. Final Stage5 browser result is tracked with the closing gates, not inferred from the harness change.

VIEWPORTS_TESTED: 320x568, 360x800, 390x844, 430x932, 768x1024, 1280x720, 1440x900, 1920x1080 — latest technical browser PASS for long codes/many manual items, navigation, touch/focus/keyboard and overflow. Tests use synthetic isolated records and real loopback HTTP/IndexedDB; no customer/provider/Supabase hosted writes or physical installation/device certification.
EVIDENCE: `/workspace/scratch/stage6/{architect-audit,handoff-runtime-review,runtime-access}.md`; `{tests-closeout,technical-browser-final,technical-context-browser-final,call-ai-browser-final,prospect-browser-final,day-browser-latest,sync-browser-latest,shell-browser-final,lint-final,brain-refresh-final,brain-check-final,release-final}.log`; `technical/results.txt` and eight synthetic screenshots. Initial failures and deterministic repro scripts (including ACK contract pre/postfix) remain outside Git; no production diagnostic instrumentation.
TEST_PATHS: `scripts/test_technical_workspace.mjs`; `scripts/test_technical_workspace_browser.mjs`; `scripts/test_technical_context_browser.mjs`; existing Stage3/4/5, shell/PWA/sync gates. Full suite includes the canonical technical unit test; browser tools remain optional development prerequisites without product dependency changes.
FILES_CHANGED: app.js; index.html; components/technical-workspace.js/.css; service-worker.js; services/sync-bridge-service.js; package.json scripts; scripts/validate.mjs; technical unit/workspace/context browser tests; scripts/test_sync_conflict_ui.mjs; scripts/test_call_ai_workspace_browser.mjs; story; this checkpoint; DUTRA_OS_CONTEXT/AI_HANDOFF/ROADMAP/CHANGELOG/docs01Arquitetura/tasks; Second Brain source/decision/two incidents/cycle and generated index/metrics after refresh. No OG_DATA/Supabase/preview-v2/package-lock/dependency changes.
DURABLE_MEMORY: SRC-CONVERGENCE-TECH-20261006-001; DEC-CONVERGENCE-TECH-001; INC-SYNC-STALE-GET-001; INC-SYNC-STALE-ACK-001; CYCLE-CONVERGENCE-STAGE6-20261006-001. Prior records retained; refresh/check PASS (148 records, zero warnings).

ACCESS_VERIFIED_READONLY: Railway/Sites inventory and public health audited 2026-10-06 13:05–13:11 UTC; no hosted integration preview exists in returned inventory. https://dutra-os-v3-premium-production.up.railway.app is historical V3 (`dutra-os-ui-v3-premium`, SHA 7ce99b313724ac2ad2bb9996c12eea9b897a7e3f), not Stage6. Core live SHA f4c2b3c68d747b6477410ffff50521d8788f8d62 differs from remote main 5255dc5d432850dfeebe0a523402a1902b1d3a52. No deployment, service, domain, Site or tunnel created; access credentials remain runtime-managed and undisclosed.
KNOWN_RISKS / GAPS: official OG provenance remains incomplete; manual review is not factory certification. Public proposal metadata enrichment/deep Client360/Stage7 remain deferred. Isolated local acceptance does not prove physical-device or hosted-provider behavior. Existing caught empty-storage bootstrap TDZ is separate baseline debt. A hosted Stage6 link needs a separately authorized preview environment; existing production/V3 links do not prove integration acceptance.
ROLLBACK: preserve localStorage/IndexedDB/private .data/volume first; reverse only Stage6 runtime/adapters/test/asset changes to PRE_STAGE6_SHA on the integration branch, retaining additive technical draft records and outbox. No reset/data deletion or production rollback performed.
PUSH / PROTECTED_REFS_VERIFICATION: PENDING final normal-hook real push/fetch; prior read/remote-write preflight PASS is not publication proof. main/V3/V2/#109/#110 and production are outside scope.
BLOCKERS: real publication proof pending. Hosted Stage6 access is a separate runtime gap, not a deployed integration claim.
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
