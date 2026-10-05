# DUTRA OS — V3 UNIFICATION CHECKPOINT

STAGE: 4 — PROSPECÇÃO + SALES EXECUTION PREMIUM
STATUS: READY_TO_PUBLISH — technical acceptance and independent QA PASS; publication still requires verification
UPDATED_AT: 2026-10-05
BRANCH: integration/dutra-os-one-system
PRE_STAGE4_SHA / ROLLBACK: fe1760d78865d85ecb84d8ae4a244094968bb4ca
POST_STAGE4_SHA: pending verified implementation publication
FINAL_CLOSURE_HEAD: verify containing closure commit against origin/integration/dutra-os-one-system
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
@qa: PASS final independent review of actual code and execution evidence; publication gate pending.

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

PUSH: pending @devops verified integration-only publication
MAIN / V2 / V3 / #109 / #110 / PRODUCTION MODIFIED: NO
SAFE_TO_START_STAGE_5: NO — fresh QG authorization required, even after technical readiness.
