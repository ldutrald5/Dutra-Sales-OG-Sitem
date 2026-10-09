# DUTRA OS — Proposal Experience Vision

Status: active product direction  
Owner: Product/QG with Lucas Dutra  
Scope: proposal, quotation presentation, preview, export and client-facing storytelling

## North Star

The proposal must not feel like a conventional report that happens to be correct.

It must feel like a premium sales experience that a client understands quickly, remembers and wants to show to someone else.

Functional correctness remains mandatory, but the external-facing experience must also create impact.

## 10-second rule

The first viewport should communicate, without requiring long reading:

- who the proposal is for;
- the size/context of the operation;
- what OG is solving;
- the main investment;
- one strong value signal;
- what the client should do next.

Technical depth remains available after this first layer.

## Story before document

Default narrative:

1. Client / context
2. Problem or opportunity
3. OG solution
4. Fleet/application
5. Cavalo × Carreta when relevant
6. Investment
7. Economic scenario / ROI when explicitly supported
8. Conditions / confidence / validation
9. Next step

The exact order is configurable by template and account context.

## Progressive disclosure

Decision-makers should not be forced to read every technical row.

Use layers:
- executive summary first;
- application and financial proof next;
- deep technical detail on demand.

Nothing is deleted from the canonical proposal; presentation controls what is emphasized first.

## Visual personality

"Professional" does not mean a generic white corporate report.

The desired language may combine:
- OG yellow as a recognizable signature;
- configurable secondary accent colors;
- controlled dark/light contrast;
- large numbers and strong hierarchy;
- asymmetric cards and intentional whitespace;
- selected fleet/client imagery when authorized;
- visual rhythm between impact, proof and detail;
- restrained motion/interactivity on screen.

The goal is distinctive, premium and memorable — not decorative noise.

## Modular architecture

Content, business logic and visual composition must remain separate.

One frozen canonical proposal view model feeds reusable blocks such as:

- Hero
- Client Context
- Fleet Snapshot
- Problem / Opportunity
- OG Solution
- Cavalo
- Carreta / Implemento
- Application Detail
- Investment
- ROI / Payback
- Conditions
- Proof / Notes
- Next Step

A template controls:
- block order;
- visibility;
- theme tokens;
- layout variant;
- presentation copy;
- approved media references.

A template must never create a second quote, pricing, ROI or technical engine.

## Editability

Future visual change must be cheap.

Avoid hard-coded page compositions when a block/configuration can express the same thing.

Prefer:
- theme tokens;
- reusable components;
- configuration-driven block order;
- bounded presentation metadata;
- stable asset references;
- template variants over duplicated renderers.

## Gamma benchmark

Gamma is a benchmark for:
- modular storytelling;
- editable blocks;
- quick rearrangement;
- presentation-first hierarchy;
- content that adapts to layout.

Gamma is NOT:
- a canonical data owner;
- a runtime dependency;
- a replacement for DUTRA OS business logic;
- permission to send customer data to an external tool.

Pattern reuse, not architectural dependency.

## Co-creation protocol

Lucas does not need to describe design in CSS/component terminology.

Valid creative input includes:
- screenshots;
- "I like / I hate" reactions;
- voice descriptions;
- rough sketches;
- annotations;
- references from cars, packaging, websites, ads, apps, architecture or other industries.

QG translates these into a compact Design DNA.

For major visual work:
1. inspect prior feedback/current product;
2. produce 2–3 concrete visual directions;
3. expose trade-offs;
4. Lucas selects/refines;
5. persist only stable principles;
6. then implement.

Concept first, code second.

## Design DNA fields

For each selected direction capture:

- emotional target;
- first-impression goal;
- information density;
- hierarchy;
- color/contrast behavior;
- typography feel;
- image/media use;
- card/section rhythm;
- motion level;
- mobile behavior;
- desktop behavior;
- export behavior;
- what must remain easy to edit later.

## Learning loop

Every meaningful step should improve the system and the process.

- Stable success that changes future decisions → Pattern / Decision / Skill.
- Material failure → Incident → root cause → prevention → regression test.
- Stable product-owner preference → Product/UX context.
- Temporary visual experiment → do not hardcode yet.
- Dynamic customer fact → CRM/runtime, never Skill.

## Stage 8.1 role

Stage 8.1 is a strong functional export/presentation foundation:
- white print/PDF;
- PNG;
- templates;
- client branding;
- section visibility;
- editable presentation fields;
- preview;
- immutable history.

It is not the final creative ceiling.

## Next creative stage

Stage 8.2 should be a concept-first Proposal Experience / Creative Direction stage.

Before broad code:
- create 3 visual directions;
- use real proposal data;
- evaluate first viewport in 10 seconds;
- evaluate mobile and desktop;
- evaluate emotional impact and clarity;
- select/refine one direction.

Only then should the chosen system be implemented broadly.

## Non-negotiables

- One quote engine.
- One pricing owner.
- One ROI owner.
- One technical engine.
- Prepared/exported is not sent.
- No invented commercial claims.
- Missing evidence remains VALIDAR.
- Historical proposal versions remain immutable.
- Visual redesign must not silently change business truth.

## Lucas feedback — Stage 8.2 / round 1 / 2026-10-09

Provenance: `SRC-PROPOSAL-FEEDBACK-20261009-001`; screenshot `1001513701.jpg` and direct product-owner review of the three-direction board.

Status: captured creative feedback, not implemented; no final Design DNA or implementation prompt. Lucas liked **all three** directions. Preserve A / Impacto OG, B / Executivo Premium and C / Storytelling Operacional as examples/possible variants; do not choose a winner on his behalf.

### What to preserve / refine

- **Impacto OG:** preserve the strong truck, typography and OG contrast. Reduce the dark shape/surface behind the truck and lettering slightly so more yellow is visible. Explore a subtle cat-eye reference without literal/cartoon decoration or a drastic redesign. Exact shape remains a visual interpretation to confirm in the next concept.
- **First page / opening:** emphasize the problem/solution with minimal information. A short headline and a canonical tire count can carry the impact. Do not require vehicle/configuration counts or the full investment table before generating interest. Preserve recipient identity and a clear path to the next layer. This explicitly refines the default 10-second information density for the next exploration; detailed investment may follow on page/section 2.
- **Second page / proof:** reuse the refined executive language and the Cavalo/Carreta visual cards. Show how many cavalos and carretas are included, their applications and corresponding canonical quantities. Present investment from smaller scope to larger scope — axle, vehicle, conjunto, total — only where existing canonical calculations support each denominator. Never fabricate per-axle prices or multiply quantities again.
- **Third page / economic story:** explore savings, premises, payback and next step. Lucas explicitly left this page open for further work; its exact composition is not approved. Retain the operational narrative where useful, without forcing one template choice.
- The three-page/section order above is a **working synthesis** of the feedback, not a fixed template or an instruction to code. Keep the same controlled dataset across subsequent comparisons.

### Client branding

Lucas wants the client's logo to make the proposal and truck imagery feel personal. Prefer an existing customer-authorized asset associated with the same canonical client. A logo on truck imagery is a conceptual personalization, not proof that the depicted truck belongs to the company. No invented logo, internet scraping or stretched assets. Missing logo keeps the OG-only fallback from Stage 8.1.

### Economic premises mentioned by Lucas

- Diesel: **2%**.
- Tire economics/life: **20%**, with its meaning still to be confirmed; a lifetime gain and a reduction in tire expense are not interchangeable formulas.
- **18 months**, with cycle versus analysis horizon still to be confirmed.

These are recorded as product-owner-mentioned scenario inputs for review, **not validated universal OG claims**, not an instruction to alter ROI formulas, and not automatic production defaults. Before a future concept shows computed savings, audit the existing canonical ROI scenario, provenance, units and applicability. Missing inputs/meaning remain `VALIDAR`. Do not silently replace the earlier illustrative 25% / 24-month scenario with new numbers or keep its derived savings while changing its premises.

### Future idea — narrated proposal by link

Backlog: `IDEA-PROPOSAL-NARRATED-LINK-001`.

The print/image/proposal could lead to a personalized web experience that introduces the customer's company and tells the proposal's story with audio: context → challenge → application → investment → impact → next step. Reuse the canonical frozen proposal and inspect existing public proposal/share capability first. Access control, sharing format, narration source, audio playback behavior and explicit recipient interaction are unresolved. No implementation, provider purchase, publication or external communication is authorized by capturing this idea.

## Stage 8.2 — round 2 / Proposal Experience V2

See [Proposal Experience V2 review](PROPOSAL_EXPERIENCE_V2_REVIEW.md) for isolated previews, native quote/ROI audit, validation and the minimal later plan.

Lucas clarified on 2026-10-09: **18 months is current lifetime of a new tire**; **20% is estimated increase in that lifetime**. This resolves the meaning questions in round 1. Applicability/performance evidence remain scenario-specific, not universal OG claims. No final visual winner, Design DNA, production implementation or publication approved. Three styles remain available for evaluation.


## Stage 8.2 — round 3 / selected Impacto OG

Lucas explicitly selected **A — Impacto OG** on 2026-10-09 and would discard B/C. This supersedes the prior open-selection status; B/C remain archived, not active implementation directions. It does not delete the functional Stage 8.1 templates.

Preserve the opening and the strong yellow savings highlight. Refine the poor tractor card in section 2 and add a complementary black cat-eye-inspired band in section 3. Isolated refined previews are under `/workspace/artifacts/stage82-impacto-v3/`; canonical fixture/snapshot/ROI unchanged. Exact new card and band remain reviewable interpretations.

Selected DNA: [Impacto OG Design DNA](PROPOSAL_IMPACTO_OG_DESIGN_DNA.md). Future implementation prompt: [draft](PROPOSAL_IMPACTO_OG_IMPLEMENTATION_PROMPT.md), prepared only, not executed. No product/deploy changes; narrated link remains backlog. Source `SRC-PROPOSAL-IMPACTO-SELECTED-20261009-001`; decision `DEC-PROPOSAL-IMPACTO-001`.


## Stage 8.2 — final review / official direction

Lucas reconfirmed A as the official Proposal Experience V2 direction; B/C retained only as history. Final visual/financial review in [Impacto OG final review](PROPOSAL_IMPACTO_OG_FINAL_REVIEW.md); integration requires explicit subsequent authorization. Media must match vehicle scope/configuration; no two-axle image for 6×2/6×4, no guessed physical configuration from parts. Missing media is a presentation limitation, not proof of invalid technique.
