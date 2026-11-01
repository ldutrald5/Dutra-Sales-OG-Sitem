# DUTRA OS — Market Radar — 2026-11-01

Status: research snapshot and prioritization input only. No roadmap or runtime change is implied by this report.

## Executive decision

**Do not start another broad product or visual stage because of market trends.** The market is moving toward context-rich, governed agents and evidence-backed conversation intelligence. DUTRA already has the right foundations in its CRM, Sales Execution, Call Intelligence and proposal owners; the next gain is to validate the existing workflows with real, authorized data and stronger evidence/approval boundaries.

### Top 3 signals

1. **Agentic sales is becoming governed workflow execution, not just chat.** Adopt the patterns of narrow tools, scoped data, approvals, traces and evaluations; do not build a generalized agent platform.
2. **Conversation intelligence is moving closer to evidence-backed CRM data.** Test source-linked extraction and human review inside the existing Call Intelligence → Sales Execution → CRM path.
3. **Proposals are becoming shareable, measurable digital experiences.** Watch and benchmark this against the already-recorded narrated-link idea; do not build it before Impacto OG is accepted in the pilot.

### Best opportunity this month

Validate the existing Call Intelligence V1 extraction loop: candidate fact → source excerpt/timecode → confidence/uncertainty → human review → canonical CRM/Sales Execution write. This is more immediately valuable than another agent or proposal platform integration.

### Cheapest experiment

Use 10–15 explicitly authorized, preferably anonymized calls. Compare AI-extracted candidates against a small manually reviewed reference set. Do not write anything automatically. See Signal 2.

---

## Baseline and comparison with the previous radar

The previous snapshot (2026-10-09) recommended Proposal Experience / Creative Direction as the best opportunity, with three concepts and a 5-second first-impression test.

The project state has materially advanced since that recommendation:

- DUTRA_OS_CONTEXT.md records Stage 8.2 Impacto OG as the selected direction, implemented locally for homologation; no publication is implied.
- ROADMAP.md says A — Impacto OG is selected and B/C are archived. The narrated proposal link, authorized client assets and Reverse Technical Lookup remain backlog.
- PROPOSAL_IMPACTO_OG_DESIGN_DNA.md records the stable selected visual principles.
- PROPOSAL_IMPACTO_OG_IMPLEMENTATION.md records the implementation and its focused validation, while keeping homologation/publication approval separate.
- ROADMAP.md identifies current validation work around V3.1 WhatsApp → CRM, Sales Execution P0, Call Intelligence V1, and post-sale/expansion.
- The latest reviewed unification checkpoint records a provider approval boundary that left the Impacto patch staged and the live pilot on the earlier Stage 8 build. This report did not perform a fresh Railway runtime check; treat the checkpoint as the latest repository evidence, not a live-status assertion.

**Priority change:** stop spending cycles choosing the proposal concept. The visual direction is selected and documented. First resolve the existing homologation/release gate through its established process; then prioritize real workflow validation in Sales Execution and Call Intelligence. Market research should inform these existing tracks, not create parallel scope.

## Signal 1 — Governed agentic execution and observable workflows

### What changed — facts

- Gong's Mission Big Dipper (2026-06-24) introduced a revenue-oriented agent execution layer, custom agents, scoped data access and configurable approval gates. Its stated use cases include account research, follow-up preparation and deal-risk analysis. [Gong — Mission Big Dipper](https://www.gong.io/press/gong-launches-mission-big-dipper-revenue-harness)
- Gong's Mission Callisto (2026-09-30) added account/contact enrichment, Deep Mode in Gong Assistant, Agent Builder and dashboards. The product direction combines richer account context with governed agent execution. [Gong — Mission Callisto](https://www.gong.io/press/gong-mission-callisto-sales-enrichment-layer)
- McKinsey's 2026 B2B Pulse research (2026-07-16) is based on nearly 4,000 buyers and sellers across 13 countries. Its central finding is that growth leaders are redesigning commercial journeys around AI while retaining customer understanding and relationship quality. This is research evidence about market direction, not proof that any specific agent increases OG sales. [McKinsey — The future of B2B sales](https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights/the-future-of-b2b-sales-how-growth-champions-rewire-their-playbooks-with-ai)
- OpenAI's current Agents SDK documentation recommends starting with one focused agent, adding guardrails/human review where needed, and using traces to inspect model calls, tool calls, handoffs and guardrails. Its evaluation guidance recommends trace grading and repeatable datasets once quality criteria are defined. [Agents SDK](https://developers.openai.com/api/docs/guides/agents/sdk) · [Tracing and observability](https://developers.openai.com/api/docs/guides/agents/integrations-observability) · [Agent evaluations](https://developers.openai.com/api/docs/guides/agent-evals)

### Why it matters to DUTRA / OG

The differentiator is not the number of agents. It is whether an agent can prepare a seller for the next action using the right client context, while staying inside the correct permissions and leaving an auditable trail.

### Current DUTRA capability

- CRM is the canonical operational source; Account 360, Next Best Action, Dutra Force and Ficha de Ataque already assemble seller context.
- Sales Execution P0 is moving toward normalized List → Session → Prospect → Call AI → confirmed result → next prospect, with idempotent transactional writes and a server-side privileged gateway.
- The project explicitly separates FATO / REGRA / SUGESTÃO and requires external actions to be confirmed by the seller.

### Real gap

A consistent, inspectable agent-run contract across the workflows: scoped input, allowed tools, output schema, trace, approval boundary, failure state and a repeatable evaluation set. Do not assume that the market launch announcements mean DUTRA needs a multi-agent orchestration layer.

### Classification

**ADOPT the design principles; TEST one narrow workflow.**

### Smallest reversible experiment

Run one read-only pre-call brief or after-call next-action agent against a single CRM account. It may read only the minimum approved fields and return:
- source-backed facts;
- missing/uncertain context;
- suggested next action;
- links/references to the source records;
- a short explanation of why the suggestion was made.

Capture a trace. Require seller review before any CRM write, message send, quote change or pipeline transition. Compare its output with a manually prepared brief before expanding.

### Risks

- **Data:** stale or conflicting CRM context can make a confident but wrong recommendation.
- **Security:** prompt injection in notes, imported files or web content; over-broad tool permissions; cross-client leakage.
- **UX:** another assistant surface can add cognitive load instead of reducing work.
- **Cost:** repeated research and multi-step tool calls can become expensive without measurable seller time saved.
- **Maintenance / lock-in:** avoid tying business logic to one agent framework or vendor-specific orchestration.

### Canonical owner

CRM / Account 360 remains client truth; Sales Execution owns call/session/outcome workflow; existing quote, pricing, technical and ROI owners remain unchanged. Agent output is a suggestion, not a new source of truth.

---

## Signal 2 — Conversation intelligence is moving from summaries toward evidence-backed data

### What changed — facts

- Gong's October 2026 updates describe AI Data Extractor results with drill-down to the evidence behind an extracted value: when it was calculated, what was searched and supporting conversation evidence. The same update describes reusable agent skills as coming soon, not generally available. [Gong — October monthly updates](https://help.gong.io/docs/our-monthly-updates)
- Gong's Mission Callisto also emphasizes closing account-data gaps and using richer context for revenue workflows. [Gong — Mission Callisto](https://www.gong.io/press/gong-mission-callisto-sales-enrichment-layer)
- OpenAI's agent-evaluation guidance supports grading traces against structured criteria and then creating repeatable datasets for regression testing. [OpenAI — Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agent-evals)

### Why it matters to DUTRA / OG

A call summary is useful, but a CRM fact is more consequential. Before a statement such as fleet size, decision-maker, objection, commitment or next action becomes operational truth, the seller should be able to see where it came from and correct it.

### Current DUTRA capability

- Call Intelligence V1 is already in the roadmap: seller-started recording, private audio storage, optional transcription, per-call and 30-day metrics, and linkage to the canonical Sales Execution result.
- The roadmap explicitly says candidate facts should be reviewed before promotion to Company / Contact / Opportunity.
- Kaption ingestion and Whisper fallback are already being validated; the project has a clear distinction between explicit inbound facts and AI suggestions.

### Real gap

Prove extraction quality on actual authorized calls and make provenance visible at field level. The system needs to distinguish:
- explicitly stated;
- inferred / suggested;
- not stated;
- conflicting evidence.

A confidence score alone is not enough. The reviewer needs the supporting excerpt and timestamp, where available.

### Classification

**TEST.** This is the highest-value near-term experiment because it advances a workflow already under validation.

### Smallest reversible experiment

1. Select 10–15 calls with explicit authorization and approved handling; anonymize customer-identifying details where practical.
2. Define a tiny reference set for five fields only: explicit next step/date, objection, fleet quantity/configuration, named decision-maker/role, and explicit commercial commitment.
3. Have a human reviewer create the reference labels.
4. Run the existing extraction path in suggestion-only mode.
5. For each candidate, show excerpt/timecode, source call, extraction status (explicit / inferred / absent / conflict) and reviewer accept/edit/reject.
6. Compare field-level precision and false-positive rate with the human reference. Do not promote candidates automatically.

### Risks

- **Data/privacy:** call recordings and transcripts are sensitive business data; require clear authorization, restricted access, retention limits and careful use of external transcription providers.
- **Security:** malicious or irrelevant spoken content must never become tool instructions.
- **UX:** too many low-value candidates will create review fatigue.
- **Cost:** transcription and repeated extraction can grow with audio length; measure cost per useful accepted fact.
- **Maintenance:** keep extraction schemas small and versioned; do not create a second CRM schema.

### Canonical owner

Call Intelligence owns recording/transcription/extraction evidence; Sales Execution owns call outcome and next-action workflow; CRM remains the canonical owner of approved company/contact/opportunity facts. No new AI-owned customer database.

---

## Signal 3 — Proposals are becoming connected, shareable digital sales experiences

### What changed — facts

- Qwilr's 2026-09-25 MCP release connects proposal data to AI tools. Its announced capabilities include creating personalized pages from templates, publishing shareable links or PDF downloads, retrieving CRM context and analyzing engagement across proposals and page sections. [Qwilr — New Qwilr MCP](https://qwilr.com/updates/new-qwilr-mcp/)
- Qwilr's help documentation describes MCP actions such as finding pages, creating from templates, publishing/unpublishing and checking engagement. [Qwilr — MCP help](https://help.qwilr.com/article/874-qwilr-mcp)

These are vendor product capabilities, not independent proof that section-level engagement analytics improves close rates.

### Why it matters to DUTRA / OG

This validates the direction of Lucas's already-recorded idea IDEA-PROPOSAL-NARRATED-LINK-001: the client may receive a link to a guided, personalized proposal rather than only a PDF or image. It does not make the feature urgent.

### Current DUTRA capability

- Stage 8.2 Impacto OG is the selected visual direction and has a local implementation/homologation package.
- The proposal renderer and immutable generated-document owner already support PDF/PNG and approved presentation assets.
- A narrated proposal link is already recorded in the backlog; it is not implemented or authorized for publication.

### Real gap

A secure recipient-facing web projection of the frozen canonical proposal, with access rules, version semantics, optional narration and an explicit next step. Engagement analytics are a separate decision and should not be assumed necessary.

### Classification

**WATCH.** Benchmark the experience; do not integrate Qwilr or build a public link before the Impacto OG pilot is accepted and the core sales workflow is stable.

### Smallest reversible experiment

Create a no-code storyboard or local, non-public prototype with five scenes:
1. client-specific opening;
2. operational challenge;
3. Cavalo × Carreta application;
4. investment and validated economic scenario;
5. next step.

Compare it with the existing PDF on comprehension and seller ease. Audio is optional and should not autoplay. Use fictitious or approved data only. No public URL, tracking pixel, external platform or client-data transfer.

### Risks

- **Data/privacy:** a public or forwarded link can expose pricing, fleet and contact information.
- **Security:** recipient identity, link expiry/revocation and immutable versioning are unresolved.
- **UX:** too much animation/audio can slow the buyer down.
- **Cost / lock-in:** external proposal vendors can become expensive and may capture analytics or document ownership.
- **Maintenance:** link, PDF and screen projections must all consume the same frozen proposal model.

### Canonical owner

OG_PROPOSAL_INTELLIGENCE / operations.generatedDocuments remains proposal/version truth; CRM remains client identity; quote, pricing, technical and ROI owners remain unchanged. A link is a projection and access surface, never a new business-data owner.

---

## Secondary watchlist — relevant, but not a new DUTRA feature

### Fleet / tire technology

Hendrickson's WATCHMAN page describes trailer tire-pressure and wheel-end-temperature sensing, with Bluetooth/J1939 connectivity and alerts routed to a telematics provider or mobile app. This is a useful market benchmark for the direction of fleet maintenance toward measurable condition and alerts. It is not evidence that OG's equalizer product has electronic sensing or telemetry. [Hendrickson — WATCHMAN](https://hencdn.com/products/watchman/watchman)

**Classification: WATCH.** Use it to improve discovery questions and understand adjacent solutions; do not imply sensor capabilities or create a telemetry module without a validated OG product/partner case.

### Brazilian logistics regulation

ANTT's CIOT Para Todos page was updated on 2026-09-21 and states that CIOT registration applies to remunerated road-freight operations, with defined exceptions. The record covers parties, vehicles, cargo, origin/destination and freight values; it supports traceability and minimum-freight checks. [ANTT — CIOT Para Todos](https://www.gov.br/antt/pt-br/assuntos/cargas/ciot-para-todos-1)

**Classification: WATCH for customer context; REJECT as a DUTRA compliance feature for now.** It may inform discovery about transporters' operational pressure and data discipline, but it does not create a direct requirement for an OG tire equalization CRM.

### Local-first PWA / sync

DUTRA already uses a local-first PWA and the roadmap records offline/reconnect, 503 and conflict handling. MDN documents Background Sync as a way for service workers to retry deferred work when connectivity returns; Supabase lists ElectricSQL as a partner offering local-first Postgres sync. These are implementation options, not a reason to replace the current architecture. [MDN — Offline and background operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation) · [Supabase — ElectricSQL partner](https://supabase.com/partners/catalog/electricsql)

**Classification: DEFER new sync framework.** First close the current identity, auth, reconciliation and idempotency gaps in the existing flow. Add a sync layer only if measured conflicts or offline requirements cannot be handled by the current architecture.

### Design systems / visual storytelling

Figma variable modes support reusable values across contexts such as light/dark themes, device sizes and other design modes. This reinforces semantic tokens and controlled variants; it does not justify a Figma integration or a new design-system rewrite. [Figma — Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)

**Classification: ADOPT the pattern, no new scope.** Keep the selected Impacto OG DNA and existing token vocabulary stable. Add a token only when a repeated component or theme need is demonstrated.

### CPQ / ROI

No reviewed evidence this cycle justifies a new CPQ, quote or ROI engine for OG. Preserve the current canonical quote/pricing and ROI owners. Presentation may reorganize the display, but never recompute, redistribute or infer commercial values.

**Classification: REJECT duplicate engines; WATCH product benchmarks.**

---

## Cross-cutting security signal — agent permissions need enforcement, not prompt promises

OWASP's 2026 Agentic Applications Top 10 identifies risks including goal hijack, tool misuse, identity/privilege abuse, supply-chain compromise, memory/context poisoning and cascading failures. Its Q3 2026 exploit roundup (published 2026-10-08) documents selected cases where agent tools and permissions enabled out-of-scope actions. The roundup is not exhaustive, but it is a timely reminder that agent security is about what the runtime permits, not only what the prompt says. [OWASP — Agentic Top 10 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-2026/) · [OWASP — Q3 2026 exploit roundup](https://genai.owasp.org/2026/10/08/genai-and-agentic-ai-exploit-roundup-q3-2026/)

For DUTRA, retain these controls before expanding agent actions:
- server-side allowlist of tools and operations;
- least-privilege access scoped to the current user/client;
- no browser-side administrative secrets;
- explicit approval for CRM fact promotion, pipeline transitions, WhatsApp send, quote changes and external publication;
- idempotency, audit trail, rate/cost limits and trace IDs;
- treat notes, PDFs, transcripts and web pages as untrusted data, never as instructions;
- test cross-client isolation and revoked/expired access.

**Classification: ADOPT as a security baseline.** The project already has some of these boundaries; the roadmap still identifies authentication/permissions as structural work before broad multi-user use.

---

## What to ignore for now

- A generalized multi-agent platform or agent marketplace.
- Autonomous WhatsApp sending or automatic CRM/pipeline writes.
- Qwilr/MCP integration or public proposal links before the Impacto pilot is accepted.
- Section-level proposal tracking without a concrete sales decision that depends on it.
- New CPQ, pricing or ROI engines.
- A rewrite of the local-first PWA or adoption of ElectricSQL/another sync framework before the existing sync path is measured.
- A new visual direction or broad design-system rewrite after Impacto OG has already been selected.
- Treating tire-pressure sensor/telematics products as equivalent to OG's pneumatic equalization solution.

## Suggested updates to DUTRA knowledge

### Skills

- **dutra-product:** add a rule that market recommendations must first load the current DUTRA_OS_CONTEXT.md, ROADMAP.md and latest unification checkpoint, then distinguish delivered, homologating, staged and live capabilities. The previous radar's opportunity became stale because the market view was not explicitly tied to the latest project baseline.
- **Call Intelligence / AI skill (when its current file is identified):** add evidence-first extraction, explicit/inferred/absent/conflict states, source excerpt/timecode, human review and evaluation-set requirements. Do not add a new skill if an existing one owns this workflow.

### Second Brain

- No new permanent commercial or technical fact should be promoted from this market research.
- Keep the three external signals as research references.
- Promote a Pattern only after the call-extraction experiment proves that source-linked review reduces false positives or seller correction time.
- Keep the narrated proposal link as the existing idea/backlog item; do not duplicate it.

### Design DNA

- No update recommended. Impacto OG remains the selected, documented direction. Digital-link storytelling is a future experience experiment, not a reason to reopen the visual decision.

## Next radar question

Can DUTRA turn one real, authorized customer call into a small set of source-backed, reviewable CRM facts and a useful next action—without increasing seller review time or weakening data ownership?
