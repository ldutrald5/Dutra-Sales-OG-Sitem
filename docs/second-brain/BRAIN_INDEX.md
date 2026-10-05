# DUTRA Builder Brain — Human Index

Generated from 133 records. Do not edit by hand; run `npm run og:brain:refresh`.

## Collections

| Type | Records |
|---|---:|
| anti_pattern | 17 |
| cycle | 13 |
| decision | 19 |
| experiment | 1 |
| idea | 3 |
| incident | 11 |
| knowledge | 13 |
| open_question | 7 |
| pattern | 23 |
| source | 26 |

## Active decisions

- **DEC-ARCH-001 — Evolve DUTRA OS instead of full rewrite** (active/high)
  Preserve current commercial frontend/intelligence and replace weak foundation incrementally.
- **DEC-ARCH-002 — Canonical relational truth with individual identity** (active/high)
  Architecture V1 selects Supabase Postgres as official commercial truth and Supabase Auth for individual PC/mobile identity, with Realtime deferred unless later evidence justifies it.
- **DEC-ARCH-003 — Keep vanilla JS frontend for V1** (active/high)
  No evidence currently justifies a React/Next rewrite; modularize incrementally when touched.
- **DEC-BRAIN-001 — Builder Brain V2 governance model** (active/high)
  Adopt proportional scope classes, semantic/referential validation, generated index/metrics, cycle closeout and license triage for Builder Brain.
- **DEC-SEC-00R-001 — Revision-authoritative synchronization baseline** (active/high)
  State writes require the current server revision; arbitrary force merge and client timestamp arbitration are not accepted by local or Cloudflare APIs.
- **DEC-XLSX-00R-001 — Isolate the legacy XLSX parser** (active/high)
  Remove vulnerable xlsx npm dependency and retain the vendored parser only inside a time- and size-bounded Web Worker until a compatible maintained replacement is validated.
- **DEC-SYNC-04R-001 — Human-reviewed revision conflicts with auth-safe outbox** (active/high)
  A revision conflict blocks automatic writes until a preserved local/remote comparison is reviewed; queued state persists without credentials and only an authenticated foreground session may perform the remote PUT.
- **DEC-MIG-05R-001 — Legacy reconciliation requires reviewed intent and reversible apply** (active/high)
  Legacy lead data may enter canonical Company/Contact only through dry-run classification, explicit user selection, checkpoint, revalidation against current state and controlled apply; weak/ambiguous matches never become canonical truth automatically.
- **DEC-HOST-06R-001 — HTTPS hosting is a protected preview, not a persistence architecture shortcut** (active/high)
  Expose the current DUTRA OS over HTTPS only through a protected hosted entrypoint with strong access token, healthcheck and persistent volume support; do not reinterpret the transition JSON state as the final canonical database or bypass the planned Supabase validation.
- **DEC-LEADS-OG18-001 — Keep conversation state, pipeline status and source as separate lead dimensions** (active/high)
  Smart lists are projections of one state.leads base. Conversation state, commercial pipeline status, source/list and priority remain independent fields; deterministic scoring may order work but never changes commercial truth automatically.
- **DEC-CIC01-001 — One deterministic score and shared commercial contracts** (active/high)
  All prioritization surfaces must delegate to the same deterministic score contract, and all next-action flows must use the same central mutation/normalization contracts instead of reimplementing weights, fallbacks or context rules per UI.
- **DEC-INTEL-COMPILER-001 — Extend Builder Brain as the DUTRA operational knowledge layer** (active/high)
  The existing Builder Brain remains the canonical durable evidence/decision layer; domain Skills stay thin and route to scoped context, stable domain guidance lives in existing knowledge/docs, dynamic account facts stay in CRM/runtime, and material bugs enter an incident collection with regression linkage.
- **DEC-V3-SHELL-001 — V3 is the single user experience during reintegration** (active/high)
  The V3 shell is the user-facing experience; legacy screens/engines may run internally during migration but must not require the seller to alternate between independent systems.
- **DEC-TECH-SINGLE-001 — One technical engine with VALIDAR/manual fallback** (active/high)
  All application consumers should converge on one deterministic technical engine; uncovered/ambiguous combinations return VALIDAR and manual override remains available instead of inventing a support mapping.
- **DEC-AI-REVIEW-001 — AI suggestions require review before becoming CRM truth** (active/high)
  AI research and call analysis may propose structured updates, but inferred fields, notes and next actions require explicit review before persistence as customer truth.
- **DEC-INT-COMPILER-001 — Compile history into existing Second Brain plus routed Skills** (active/high)
  Conversation history is not a runtime dependency: durable knowledge is classified into the existing Second Brain and domain files, exposed through compact Skills and context routing, while volatile account data stays in CRM storage.
- **DEC-METRIC-UNIVERSE-001 — Conversion metrics use consistent attribution populations** (active/high)
  A conversion rate may only combine numerator and denominator from the same attributed population/filter; close rate must not be inflated by unrelated historical CRM sales.
- **DEC-PROMPT-ARCH-001 — Prompt Architect owns intent-to-mission compilation** (active/high)
  Use a dedicated Prompt Architect to convert human intent into scoped L0-L3 execution missions; Builder Brain remains decision/learning governance, Context Router remains retrieval authority, and SubagentPromptBuilder remains AIOX static task/agent packaging.
- **DEC-CONVERGENCE-SHELL-001 — Static presentation shell retains canonical navigation and sync owners** (active/high)
  apps/sistema-og is the unified target shell; preview-v2 remains UX reference. Reuse switchTab/hash/history and existing state/services. Static nav/status, localized feedback and scoped canonical tokens may adapt presentation; an ephemeral bootstrap promise coordinates recovery/reconnect without a new sync model.

## Open questions

- **OQ-PKG02-001 — Package 02 operational auth bootstrap details** (open/medium)
  Exact bootstrap/session/organization-membership implementation details must be confirmed against the chosen Supabase project/environment before enabling auth paths.
- **OQ-OG-TECH-001 — Which OG documents certify the current technical mappings** (open/high)
  Current code contains operational support/equalizer/vehicle mappings, but the exact validated OG source set that certifies each mapping must be attached/indexed before those mappings can be promoted to Confirmada OG outside implementation behavior.
- **OQ-INTEL-KCC-001 — Promote compiled domain knowledge into runtime Knowledge Command Center after review** (open/medium)
  The new agent-facing Skills/playbooks/context are available to repository agents immediately, while live Sales Brain/KCC uses its private imported knowledge index; decide which reviewed stable domain records should be ingested into that runtime index without importing volatile CRM facts or unvalidated OG claims.
- **OQ-TECH-UNIFICATION-001 — When is the V3 technical engine fully single-source?** (open/high)
  The shared technical engine and parity tests exist, but fallback/duplicated decision paths must be inventoried and removed before single-source status can be declared.
- **OQ-V3-OFFLINE-ACCEPT-001 — Manual offline/reconnect acceptance on real authenticated browser** (open/high)
  Automated sync/idempotency gates pass, but the real-browser flow of edit offline, close/reopen, reconnect, replay and reload still requires manual acceptance evidence.

## Open / active incidents

- **INC-XLSX-REPAIR-001 — Excel repaired generated workbook structures** (active/medium)
  A historical generated workbook opened with Excel recovery that removed an AutoFilter/table and a worksheet formula; the exact original serialization defect is not conclusively proven by recovered evidence.

## Recent resolved incidents

- **INC-EXEC-ENV-001 — Structural convergence blocked by missing checkout and unreachable proxy** (resolved/high)
  Structural work must prove its execution route before repository-local implementation. Local Git transport, GitHub provider access and hosted runtime access are separate capabilities; a failure in one must trigger classified fallback rather than repeated retries or false project conclusions.
- **INC-MEU-DIA-REFRESH-001 — Confirmed Mesa outcome lost on immediate refresh during sync debounce** (resolved/high)
  A local-first outcome must be recoverable before the UI confirms success or advances. Reuse the canonical outbox instead of waiting for debounced transport.
- **INC-SUPABASE-DRIFT-001 — Supabase remote schema and Edge Functions exceed versioned repository state** (resolved/high)
  The live Supabase backend is now reconstructable from reviewed Git evidence: the exact 25 recorded migrations, all 13 deployed Edge Function sources, and a catalog-derived bootstrap supplement for eight CRM tables that had existed outside recorded migration history.
- **INC-V3-BLACK-001 — Historical V3 black screen and delayed first paint** (resolved/medium)
  The earlier V3 preview could render a black screen or delay the shell; the durable lesson is that the primary interface must render before optional/heavy modules.
- **INC-TECH-DATA-LOAD-001 — Historical technical configurator returned zero OG configurations** (resolved/medium)
  A technical configurator showed zero configurations when its OG data dependency had not been loaded before initialization.
- **INC-METRIC-CLOSE-001 — Historical close rate reached 48400 percent** (resolved/medium)
  A historical close-rate calculation mixed sales from a broad CRM population with proposals from a narrower prospecting population, producing an impossible 48400 percent result.
- **INC-PROSPECT-LIST-001 — Historical prospecting showed zero lists despite usable CRM views** (resolved/medium)
  Prospecting became operationally empty when lists were treated as an isolated module instead of projections/collections over the CRM base.
- **INC-SYNC-CONFLICT-001 — Silent revision conflict could overwrite local or remote work** (resolved/high)
  Revision conflicts require preserved local/remote state and explicit review; silent merge/resend is prohibited.

## Candidate / planned ideas

- **IDEA-BRAIN-001 — Research intake center for external references** (candidate/high)
  Provide a structured intake that accepts repo/article/paper/competitor/conversation sources and produces source cards, patterns, ideas and open questions without automatically changing product scope.
- **IDEA-BRAIN-002 — Idea promotion by repeated evidence/friction** (candidate/high)
  Track recurrence and evidence so repeated real friction promotes an idea while speculative novelty remains backlog.
- **IDEA-PRODUCT-001 — Company 360 as canonical commercial context surface** (planned/high)
  As Company/Contact become canonical, expose a fast Company 360 view with decision-maker, next action, timeline and quick actions.

## Validated / active patterns

- **PAT-REF-001 — Reference systems are pattern mines, not blueprints** (validated/high)
  Reverse engineer an external system by problem/capability, extract transferable patterns and complexity, then run a gap analysis before architecture decisions.
- **PAT-DATA-001 — One entity, one identity, multiple views** (active/high)
  CRM, prospecting, map, agenda, reports and AI should operate on canonical entities rather than maintain parallel copies.
- **PAT-AI-001 — AI over structured truth** (active/high)
  AI should consume selective structured context and propose actions; important writes pass through controlled domain operations and review rather than treating AI as the database.
- **PAT-DELIVERY-001 — Strangler migration with reversible vertical slices** (active/high)
  Replace legacy behavior incrementally with adapters, reconciliation, feature flags and rollback windows instead of a big-bang rewrite.
- **PAT-DELIVERY-002 — Professional gates may block release** (validated/high)
  Environment or test limitations should block/label a release rather than be hidden or reported as success.
- **PAT-UX-001 — Foundation plus visible user value** (active/high)
  Whenever safe, infrastructure packages should unlock a perceptible workflow improvement; UX polish should evolve with domain migration rather than as an isolated redesign.
- **PAT-BRAIN-001 — Proportional ceremony by risk** (active/high)
  Use MICRO, STANDARD and STRUCTURAL paths so low-risk work stays fast while structural work receives evidence/architecture/safety discipline.
- **PAT-BRAIN-002 — Machine store + generated human index** (active/high)
  Keep JSONL canonical for versioning/parsing while generating a readable index and metrics for human retrieval/adoption.
- **PAT-SYNC-001 — Durable outbox with foreground-auth handoff** (validated/high)
  Persist retryable state and recovery metadata without credentials, let background infrastructure signal pending work, and perform authenticated delivery in the foreground where session credentials already exist.
- **PAT-MIG-001 — Dry-run, approve, revalidate, apply, rollback selectively** (validated/high)
  For brownfield canonicalization, classify without mutation, require explicit approval, re-check candidates at apply time, checkpoint first and reverse only affected entities while blocking rollback if later work depends on them.
- **PAT-HOST-001 — Provider-safe preview entrypoint** (validated/high)
  For a brownfield app that was local-only, add a dedicated hosted entrypoint that validates secrets before boot, binds provider PORT on 0.0.0.0, exposes a minimal unauthenticated healthcheck, routes persistent state to the provider volume and keeps production architecture boundaries explicit.
- **PAT-CIC01-001 — Context-aware deterministic decision contract** (validated/high)
  Centralize deterministic decisions in one contract, make dependent context invalidation explicit, include relevant business context in cache keys, and exercise every alternate UI path through the same contract in regression tests.
- **PAT-CONTEXT-ROUTING-001 — Route minimal context by task** (active/high)
  Load a small core context plus the domain Skill/docs needed for the task instead of injecting the full project history into every agent invocation.
- **PAT-BUG-LEARNING-001 — Bug to prevention to regression** (active/high)
  A material bug is not fully closed when behavior is patched; capture symptom and root cause, derive a prevention rule, attach a regression test and preserve provenance in the incident store.
- **PAT-SALES-STAGE-001 — Stage-aware commercial guidance** (active/high)
  Select commercial objective, questions and next step from current relationship/pipeline context: gatekeeper seeks access, decision maker gets diagnosis, proposal gets blocker analysis, follow-up resumes commitments and customer/post-sale starts with experience.
- **PAT-TECH-VALIDATION-001 — Technical uncertainty becomes a validation state** (active/high)
  When technical evidence is insufficient or conflicting, preserve uncertainty as Precisa validar/Não determinada and route to manual validation rather than filling the gap from plausibility, code history or model inference.
- **PAT-AUTOMATION-ESCAPE-001 — Automation with manual escape** (active/high)
  Automation should accelerate common work while preserving review, edit, replace, add, remove, note and validate paths for real exceptions.
- **PAT-AUTO-ESCAPE-001 — Automation with manual escape** (validated/high)
  Use automation to produce a strong default, then preserve edit, override, add, remove, observe and validate paths whenever real commercial/technical exceptions exist.
- **PAT-METRIC-POPULATION-001 — Metric numerator and denominator share one population** (validated/high)
  Conversion metrics must derive numerator and denominator from compatible filters, attribution and time/population scope; historical totals cannot be divided by current-session denominators.
- **PAT-CONTEXT-ROUTER-001 — Skill to context to source routing** (active/high)
  Keep Skills procedural and compact, route each task to a bounded context set, and retain deeper evidence in canonical source files instead of copying the master context into every prompt.
- **PAT-V3-INTERNAL-LEGACY-001 — New shell over extracted brownfield engines** (validated/high)
  When a new UX is approved but the legacy system owns mature domain logic, keep one user-facing shell and progressively extract/reuse legacy engines behind it until transitional bridges can be removed.
- **PAT-PROMPT-MINCTX-001 — Mission prompts use minimal decision-changing context** (active/high)
  Execution prompts should reference bounded required context, conditional context and explicit do-not-load areas, scaling prompt depth with risk instead of copying the whole project history into each delegation.
- **PAT-CONVERGENCE-SHELL-QA-001 — Prove shell independence and reconnect with real acknowledgement** (active/high)
  Block domain scripts to verify static shell/error recovery, inject renderer faults to prove other routes remain usable, traverse mobile/tablet/desktop sizes, and require real API acknowledgement after reconnect. When a browser emulator omits the network event, prove transport separately and label explicit event simulation; never mock sync success.

## Recent sources

- **SRC-CONVERGENCE-STAGE1-20261005-001 — CONVERGENCE-01 Stage 1 merge and current-SHA replay evidence** (validated/high)
  Merge fd99210ca81a4374377f4353e7a402b45679a23c preserves Stage 0 functional core and canonical Supabase while integrating V3 ancestry and exact preview files. Local validation passed 75/75; workflow 37252679945 proved two clean canonical replays and structural parity with zero drift/gaps and deterministic fingerprint 7f0c31d8de86892d48afb2bf9e4a6d0d36e293aab94d105344a5526241d959a9.
- **SRC-CONVERGENCE-SHELL-20261005-001 — Stage 2 audited shell implementation and execution evidence** (validated/high)
  Pre-edit current/V3 matrix and architect/QA reviews support the single apps/sistema-og shell. Full75 gates, eight viewport/13 route browser acceptance and real API sync acknowledgement passed; implementation publication verified at be4b46ce4829ff18d193b6f8dfc34e671b52b8c4. Browser missing online event is explicitly simulated only after real transport proof.
- **SRC-CONVERGENCE-MEU-DIA-20261005-001 — Stage 3 canonical projection and executed regression evidence** (validated/high)
  Audited canonical queue/NBA/outcome owners before edits. Deterministic projection and eight viewport browser gates passed, including immediate refresh, supported offline outcome, real local reconnect and HTTP409 conflict recovery. Independent architecture and QA approved. Normalized account selection is tested with isolated read fixtures; no external mutation is claimed.
- **SRC-CONVERGENCE-ENV-20261004-001 — CONVERGENCE-01 Stage 0 execution environment preflight** (validated/high)
  CONVERGENCE-01 Stage 0 documented the failed initial cloud workspace with no usable checkout and unreachable proxy transport, followed by successful recovery in a repository-attached workspace with a valid Git checkout.
- **SRC-INTEL-RECOVERY-001 — DUTRA OS recovered conversation knowledge audit** (validated/medium)
  Recovered master conversation and technical handoff preserve historical decisions, bugs, playbooks and prior V3 migration context; they are evidence inputs but do not override current tested main or validated OG sources.
- **SRC-INTEL-MAIN-001 — Live GitHub main audit for Intelligence Compiler** (validated/high)
  Live repository audit established GitHub main at f4c2b3c68d747b6477410ffff50521d8788f8d62 as the current canonical code line and identified the existing Builder Brain, context manifests, knowledge services, current tests and newer Call Intelligence/Whisper implementation.
- **SRC-CALLINT-20261001-001 — Call Intelligence and local Whisper production hardening commits** (implemented/high)
  Main commit chain 39be4d18 → 445ac095 → d631ef29 → af5469eb → f4c2b3c6 hardened signed audio upload, fact extraction, production metric hygiene and the local faster-whisper fallback, then added an opt-in production end-to-end self-test.
- **SRC-TECH-HANDOFF-20261001-001 — Live GitHub/Railway/Supabase technical recovery audit** (validated/high)
  Live audit verified GitHub main and Railway production alignment before the Intelligence Compiler merge, persistent Railway volume /data, PWA cache v67, an active hybrid Supabase/Postgres backend, and a reproducibility gap: the remote Supabase project had 25 applied migrations and 13 active Edge Functions while the repository versioned only 4 migration files and 2 Edge Function sources.
- **SRC-INTEL-CLOSEOUT-001 — DUTRA Intelligence Compiler V1 PR and CI closeout** (implemented/high)
  PR #104 merged the Intelligence Compiler V1 to main as commit 72354a1f04d6fdd5584fe876ec4b09bb050a312a after PR workflows Package 00R CI #404, Sales Execution P0 #24 and Call Intelligence V1 #22 passed; main Package 00R CI #405 also passed after merge.
- **SRC-CHAT-RECOVERY-20261001 — DUTRA OS master conversation recovery audit** (validated/high)
  User-reviewed recovery audit consolidating the long-running DUTRA OS conversation into decisions, implemented work, failures, commercial context, technical mappings and pending work before chat archival.

## Retrieval workflow

1. Start here.
2. Use `CONTEXT_ROUTER.md` to select the smallest relevant domain context.
3. Search by ID/tag in the relevant JSONL collection.
4. Follow `source_ids`, `derived_from`, and `supersedes` for provenance.
5. Load only the records needed for the task.

## Relationship model

```mermaid
flowchart LR
  S[Source] --> K[Knowledge / Pattern]
  S --> N[Incident]
  N --> K
  K --> I[Idea / Open Question]
  K --> D[Decision]
  I --> E[Experiment]
  D --> P[Implementation Package / Cycle]
  E --> D
  P --> L[Learning]
  L --> K
```
