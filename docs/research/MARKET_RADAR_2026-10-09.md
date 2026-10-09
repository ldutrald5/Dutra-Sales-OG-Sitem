# DUTRA OS — Market Radar — 2026-10-09

Status: research snapshot, not automatic roadmap commitment.

## Executive read

The strongest external signals reinforce the direction already chosen for DUTRA OS:

1. **Agentic sales is moving into core sales workflows**, including prospecting and quote creation.
2. **Unified, clean data is becoming a prerequisite for useful AI**, not an afterthought.
3. **B2B growth leaders are combining AI with stronger customer understanding and hyper-personalization**, not replacing human selling.
4. **Presentation tools are separating content from theme/layout**, making visual iteration dramatically cheaper.
5. **Design-token systems are becoming the practical bridge between design decisions and production code**.

The implication is not “add more AI.” It is: keep one canonical system, make seller workflows complete, make visual/storytelling layers modular, and use AI to remove friction around the seller rather than create another interface.

## Signal 1 — AI agents are entering core sales work

Sources:
- HubSpot, State of Sales in 2026 — survey/interviews with 1,000+ sales/revenue professionals.
- Salesforce, State of Sales 2026 — survey of 4,000+ sales professionals.
- McKinsey, 2026 B2B Pulse / future of B2B sales — nearly 4,000 buyers and sellers across 13 countries.

Observed direction:
- sales organizations report broad AI use;
- agents are being applied across the sales cycle;
- quote creation and prospecting are explicit use cases;
- seller efficiency and customer experience are repeatedly cited as benefits.

### DUTRA implication

ADOPT THE PATTERN, NOT THE HYPE.

DUTRA should continue moving toward:
seller talks to customer → DUTRA prepares/researches/calculates/records/follows up.

Do not create autonomous commercial truth outside canonical owners.

### Candidate experiments

- pre-call account brief assembled from CRM + public research;
- after-call structured review + next-action draft;
- proposal narrative suggestions over frozen quote facts;
- account-specific objection/playbook suggestions;
- agent-assisted preparation of follow-up, never silent send.

## Signal 2 — AI value depends on connected/clean data

Salesforce 2026 research highlights data quality and disconnected systems as material constraints on AI initiatives.

McKinsey similarly frames AI value around rewiring real commercial journeys, not isolated pilots.

### DUTRA implication

This validates current architecture:
- one CRM;
- one client identity;
- one quote owner;
- one technical engine;
- one proposal owner;
- explicit sync/conflict handling.

Do not sacrifice this foundation for flashy agent demos.

### Candidate experiment

Create an “AI readiness” health indicator for internal development:
- canonical identity present?
- latest client context present?
- unresolved conflict?
- stale/ambiguous technical data?
- enough proposal facts for safe generation?

This is a future internal quality feature, not a user-facing score yet.

## Signal 3 — Hyper-personalization + human relationship

McKinsey’s 2026 B2B work emphasizes customer understanding, personalized commercial journeys and AI embedded into workflows while preserving relationship quality.

### DUTRA implication

The proposal should increasingly feel account-specific:
- client name/logo;
- their fleet/configuration;
- their technical scenario;
- their economic assumptions;
- their language/problem;
- their next step.

But personalization must come from real CRM/technical facts, not invented AI copy.

### Candidate experiment

For Proposal Experience 8.2:
create one version that opens with the client’s operation and scale rather than OG product information.

Measure 5-second comprehension.

## Signal 4 — Themes and blocks are replacing hard-coded visual documents

Gamma’s current product model emphasizes:
- flexible slides/cards;
- global themes;
- editable visual styles;
- theme changes without rewriting content;
- multiple presentation/document/social/web formats.

### DUTRA implication

Strongly supports:
canonical proposal view model
→ reusable story blocks
→ template/theme configuration
→ PDF/PNG/mobile/web projections.

Do not make “template” equal “copy of renderer.”

### Candidate experiment

Stage 8.2 should test three visual directions using the same content model before further production coding.

## Signal 5 — Tokens make visual evolution cheap

Figma’s current variables/design-token guidance emphasizes reusable named values, modes/themes and scalable synchronization of visual decisions.

### DUTRA implication

Create a small DUTRA visual token hierarchy before broad visual expansion:

Primitive:
- raw palette;
- spacing scale;
- radius;
- typography scale.

Semantic:
- surface/base;
- surface/elevated;
- surface/impact;
- text/primary;
- text/secondary;
- accent/og;
- accent/secondary;
- status/success;
- status/warning;
- technical/validate.

Proposal-specific component tokens only when repeated need is proven.

### Candidate experiment

After Lucas selects Stage 8.2 direction:
encode only the stable chosen palette/hierarchy into semantic tokens and compare how quickly all three proposal templates can be restyled.

## What to WATCH

- interactive digital sales rooms;
- proposal analytics / engagement signals;
- quote-to-sign workflows;
- account-specific AI agents;
- multimodal call + screen + CRM context;
- AI-generated visual storytelling;
- usage-based / outcome-oriented commercial models where relevant to OG.

None of these are roadmap commitments.

## What to DEFER

- autonomous external sending;
- external proposal platform becoming canonical data owner;
- large framework rewrite for visual design;
- generalized “AI agent platform” before existing commercial loops are complete;
- engagement tracking that creates privacy/security complexity before a clear sales decision depends on it.

## Best opportunity now

Proposal Experience / Creative Direction.

Reason:
- foundation already exists;
- customer-facing differentiation is visible;
- user has strong product taste but needs visual co-creation;
- architecture now supports modular presentation without corrupting business truth.

## Cheapest next experiment

Three first-viewport proposal concepts using identical real-like controlled data.

Test:
- 5-second recall;
- perceived premium quality;
- value comprehension;
- obvious next step;
- preference + reason.

No production code required.

## Research sources used for this snapshot

- HubSpot — State of Sales in 2026.
- Salesforce — State of Sales 2026 / State of Sales report.
- McKinsey — The future of B2B sales: How growth champions rewire their playbooks with AI (2026).
- McKinsey — The surprising economics of B2B growth (2026).
- Figma — Guide to Variables / Design Tokens.
- Gamma — current Help Center guidance on themes, visuals and flexible slides/cards.

## Next radar question

What should DUTRA learn from modern digital sales rooms and interactive proposal platforms *without* giving them ownership of customer, quote or proposal truth?
