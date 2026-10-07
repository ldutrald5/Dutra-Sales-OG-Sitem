---
name: dutra-builder-brain
description: Professional product-engineering second brain for evolving software safely from evidence. Use when auditing a system, studying an external repo/research/reference, generating context-aware ideas, comparing patterns, defining architecture, planning migrations, implementing reversible packages, validating releases, or capturing lessons/decisions into the project brain. Designed from the DUTRA OS journey but reusable across projects.
metadata:
  short-description: Evidence → patterns → architecture → plan → small safe implementation → learning
---

# DUTRA Builder Brain

A reusable operating method for building professional systems without drifting into feature chaos, copy-paste architecture, undocumented decisions or dead documentation.

The method was distilled from the DUTRA OS evolution:

**Vision → Audit → External Reference → Reverse Engineering → Gap Analysis → Architecture → Master Plan → Small Implementation Package → Tests/Release/Rollback → Learn → Update Brain → Next Package.**

It is not a persona. It is the project's **engineering/product memory, evidence graph and decision protocol**.

## Proportionality first

Do not force the same ceremony on every task. Classify scope before routing:

### MICRO
Use for isolated, low-risk changes with no new data ownership, integration, migration, auth, cross-device state or architectural consequence.

Examples: copy change, spacing fix, icon, known validation message, small CSS correction.

Required: inspect local context → implement → relevant test. Brain update only if a durable lesson appears.

### STANDARD
Use for a bounded feature or workflow change that touches known domain structures but does not redefine the foundation.

Required: frame → inspect current behavior → evidence/decision check → small plan → implementation → tests → brain closeout.

### STRUCTURAL
Use for persistence, canonical entities, identity/auth, sync, migrations, integrations, AI writes, background processing, deployment, cross-module redesign, or any change with material data/regression risk.

Required: use the full professional loop from the earliest unresolved stage.

When uncertain between levels, choose the safer higher level only when the consequence of being wrong is meaningful.

## When to activate

Use this skill when any of these are true:

- the user wants to build, evolve, redesign, migrate, integrate or professionalize a software system;
- a new repository, CRM, open-source project, article, research paper, benchmark, competitor, workflow, screenshot, recording or document is introduced as inspiration/reference;
- the user asks “what should we do next?”, “can we copy/use this?”, “generate ideas from this”, “how would this improve our system?”;
- a structural feature touches persistence, identity, canonical data, sync, backup, AI, integrations, deployment or multiple modules;
- a real implementation package is about to begin or end;
- the user wants a second brain, durable research memory, pattern library or context-aware ideation.

## When NOT to use the full skill

Do not invoke the full pipeline for:

- trivial copy/style changes inside known components;
- factual questions that do not affect product/engineering decisions;
- one-off code explanation with no requested change;
- routine tests already covered by a known package;
- tiny bug fixes whose cause, owner, rollback and test are already obvious;
- brainstorming that the user explicitly wants to remain ephemeral.

For these, use the **MICRO** path. If the task unexpectedly reveals structural uncertainty, escalate to STANDARD or STRUCTURAL.

## Core law

**Evidence before architecture. Architecture before migration. Migration plan before broad implementation. Small implementation before scale. Validation before the next package. Learning after every meaningful package.**

A new external reference is **input**, not authority.

## Operational knowledge compiler routing

When the task comes from recovered history, a prior incident, a new durable commercial rule or a request to make the project "remember":

1. read `docs/second-brain/CONTEXT_ROUTER.md`;
2. route to the smallest DUTRA domain Skill/context;
3. keep volatile customer/account facts in CRM/runtime rather than the brain;
4. record material bugs in `incidents.jsonl` as symptom → root cause → resolution → prevention → regression test;
5. never let conversation recovery override current tested code or validated OG evidence without an explicit conflict record.


## Activation protocol

1. For STANDARD/STRUCTURAL work, load `.codex/skills/dutra-environment-guardian/SKILL.md` first and prove the required execution route (checkout/provider/toolchain) before assuming local execution is possible.
2. Read local instructions (`AGENTS.md`, project context and scoped docs) from the best verified repository source available.
3. Classify scope as MICRO / STANDARD / STRUCTURAL using `reference/00-method-map.md`.
4. Detect the earliest unresolved maturity stage.
5. Load only the references and brain entries needed for that stage.
6. Inspect existing code/data/contracts before proposing structural change.
7. If a new external source exists, run `reference/01-evidence-and-research.md`.
8. Generate ideas with `reference/03-idea-engine.md`; ideas do not become scope automatically.
9. Persist durable learnings using `reference/02-second-brain.md`.
10. For architecture/planning use `reference/04-architecture-and-planning.md`.
11. For implementation use `reference/05-implementation-package.md` and `reference/06-quality-gates.md`.
12. For possible code reuse, apply `reference/08-license-and-reuse.md` before recommending reuse.
13. For live access, hosted runtime, deployment, domains, logs, environment variables, service health or mobile access, route to `.codex/skills/dutra-runtime-operator/SKILL.md` and use live infrastructure tools instead of relying on remembered deployment state.
14. STANDARD/STRUCTURAL closeout must refresh the human index and metrics, then run the brain checker.
15. When work must continue later, cross between ChatGPT and Codex, requires manual user steps, or execution credits/tools are constrained, load `.codex/skills/dutra-collaboration-orchestrator/SKILL.md` and leave a reusable Action Pack/checkpoint when useful.
16. End with an explicit next-stage recommendation, not an uncontrolled chain of work.

## The professional loop

### Stage 0 — Frame the real problem
Capture business objective, user workflow, pain, constraints, existing assets, success evidence and non-goals. Do not start from technology.

### Stage 1 — Audit reality
Inspect code, data ownership, persistence, flows, tests, integrations, deployment and risks. Output what actually exists, not what documentation claims exists.

### Stage 2 — Study references
Inspect external systems/research only to answer a concrete uncertainty. Separate confirmed implementation, documented claim, reusable pattern, code-reuse candidate, complexity to avoid and unknown.

### Stage 3 — Gap analysis
Compare current needs with the reference. Classify as `KEEP / FIX / ADAPT / REUSE / REPLACE / DEFER / DO NOT IMPLEMENT`.

### Stage 4 — Architecture
Define canonical ownership, boundaries, contracts, data lifecycle, identity, sync, security, backup/restore, observability, AI boundaries and deployment. Record structural decisions as ADRs.

### Stage 5 — Master implementation plan
Turn architecture into small reversible packages across Foundation and Product tracks.

### Stage 6 — Safety baseline
Before touching important behavior/data: `PLAN → BACKUP/CHECKPOINT → ENVIRONMENT GATE → TEST BASELINE`.

The Environment Gate is executable, not ceremonial: prove checkout/provider access, required toolchain and test capability using `dutra-environment-guardian`. If local Git is blocked but a connected provider works, switch routes instead of repeating the same failed transport. An environment blocker is not a project/test failure.

### Stage 7 — Implement one package
Use the smallest vertical slice that proves the architecture. Preserve old behavior behind adapters/flags when needed.

### Stage 8 — Validate and release
Run relevant automated tests, data checks, UX validation, regression checks, health checks and rollback readiness. A blocked gate is a valid result.

### Stage 9 — Learn and update the brain
Capture new facts, decisions, patterns, friction, failures, ideas, experiments and open questions with provenance. Refresh index/metrics for STANDARD/STRUCTURAL cycles.

## Mandatory distinction: facts, patterns, ideas and decisions

Never mix these categories:

- **FACT/KNOWLEDGE** — supported by current code/data or a source.
- **PATTERN** — reusable method observed or validated.
- **HYPOTHESIS** — plausible but not yet validated.
- **IDEA** — possible product/engineering opportunity.
- **DECISION** — explicitly chosen direction with trade-offs.
- **EXPERIMENT** — controlled test intended to reduce uncertainty.
- **OPEN QUESTION** — material uncertainty requiring evidence or choice.
- **ANTI-PATTERN** — behavior to avoid because of observed or well-supported failure mode.

One source can create several entries, but an IDEA must never silently become a DECISION.

## Second Brain behavior

If `docs/second-brain/` exists, treat it as the durable evidence/decision layer.

Use stable IDs and provenance. Prefer compact JSONL records plus generated human-readable indexes. Never store secrets, credentials, access tokens, raw private exports or unnecessary personal data.

Every durable record uses explicit relations:

- `source_ids`: primary evidence sources;
- `derived_from`: prior brain records that led to this record;
- `supersedes`: older record replaced by this one when applicable.

Before writing a new entry:

1. search for duplicates/superseded items;
2. link evidence and derivation;
3. set confidence/status;
4. record applicability;
5. record what would change the conclusion;
6. prefer updating/superseding over silently rewriting history.

Do not load every record on every task. Start from `BRAIN_INDEX.md`, then retrieve by ID/tag/collection.

## Brain adoption gate

For STANDARD and STRUCTURAL work, completion is not done until the method asks:

- Was the brain consulted before the material decision?
- Did the cycle create or change durable knowledge?
- Was that knowledge captured?
- Were open questions created/closed?
- Were rejected ideas preserved as rejected when the reason is useful?

Record the cycle in `cycles.jsonl`, then run:

```bash
npm run og:brain:refresh
```

The refresh regenerates the human index and adoption metrics, then validates semantic integrity.

MICRO work does not require a cycle entry unless it produces durable learning.

## Context-aware Idea Engine

Generate ideas only after understanding current context. For each serious idea answer:

1. What real problem does it solve?
2. What evidence triggered it?
3. Which user/workflow benefits?
4. Which canonical entity/data does it touch?
5. What dependency must already exist?
6. What is the smallest experiment/package?
7. What is the migration/regression risk?
8. What should explicitly **not** be built yet?

Prefer 3–7 high-leverage ideas over a giant wishlist. High excitement + weak evidence stays hypothesis/backlog.

## External reference rule

When the user introduces an external CRM/repo/system/research, do not clone its architecture.

Run:

`SOURCE INTAKE → REVERSE ENGINEER RELEVANT PARTS → EXTRACT PATTERNS → MAP TO CURRENT PROBLEMS → GAP → CANDIDATE IDEAS/DECISIONS`.

Pattern reuse and code reuse are different. Code reuse additionally requires license identification, compatibility triage, attribution/NOTICE obligations, coupling analysis, security review and maintenance cost. If legal compatibility is material or unclear, flag for legal review rather than guessing.

## Research rule

Use research to reduce a specific uncertainty. Define question, why it matters, evidence needed, preferred primary sources, freshness, output categories and which decision it may influence. Do not browse indefinitely for inspiration.

## AI rule

**AI is intelligence over structured truth, not the database.** Prefer deterministic rules/templates/calculations when adequate. Important AI writes should flow through controlled domain operations and human review unless explicitly authorized.

## Data rule

For any structural feature, be able to answer where the data lives, who owns it, stable ID, mutation path, validation, sync/conflict, delete/restore, backup, audit and AI access. If unknown, do not create a second hidden source of truth.

## UX/product rule

Infrastructure and user value should advance together when safe. Every implementation package states its visible improvement. Small professional details matter: save/sync/error states, next action visibility, keyboard/touch ergonomics, loading/empty states, consistent components, fast forms and clear hierarchy.

## Implementation package contract

Every package must define objective, problem solved, evidence/decision basis, dependencies, affected modules, data/schema impact, migration/compatibility, UX impact, tests, checkpoint, rollback, definition of done, visible value and brain closeout.

See `templates/implementation-package.md`.

## Value-per-credit and convergence rule

Treat time, execution credits and user attention as first-class product constraints.

- Optimize for **visible operational value per unit of execution**, not number of stages, documents, gates or commits.
- The primary convergence metric is: **how much real work can the user complete end-to-end from one canonical system entry point?**
- A unified Git branch is not sufficient if the user still has to operate separate hosted systems.
- After the architecture/owners are stable enough, prefer an **isolated unified preview / reality check** before extending the roadmap with more hidden branch-only features.
- If the user still needs an old/parallel system to finish the core workflow, closing that gap outranks polishing another isolated module unless safety or dependency order requires otherwise.
- Once canonical owners and contracts are stable, prefer **outcome-oriented sprints** that bundle adjacent stages with one heavy regression at the milestone boundary instead of repeating full ceremony after every small slice.
- During implementation, run targeted tests for the changed module and nearest integrations. Run broad viewport/PWA/sync/full-suite/independent QA when risk warrants it, at milestone/release boundaries, or when repository policy explicitly requires it.
- Do not repeatedly regenerate documentation that did not materially change. Capture durable deltas, incidents, decisions and new invariants; avoid ceremonial duplication.
- Never save credits by weakening checks that protect against data loss, duplicate writes, stale identity, destructive migration, sync corruption, wrong technical application or false external-action claims.

### Reality-check gate

When several historical interfaces/branches exist, periodically stop feature work and prove the current integrated product to the real user.

The gate asks:

1. Is there one accessible preview/runtime for the integration branch?
2. Can the user complete the target workflow without opening the old systems?
3. Which exact step still forces a legacy detour?
4. Does the new system preserve the canonical owners and data?
5. What is the smallest package that removes the next legacy dependency?

Turn observed legacy detours into prioritized work. Do not continue a long stage sequence purely because it was planned earlier.

### Action-first autonomy

When analysis produces a clearly important next action:

- do not stop at “I would”, “we could” or a passive recommendation;
- if the action is already authorized, safe and inside scope, **execute it**;
- if it requires a separate authorization or external side effect, immediately provide the exact executable Action Pack / prompt / command sequence needed next;
- do not ask for approval for trivial internal investigative steps already covered by the active mission;
- solve local implementation bugs and regressions autonomously before escalating;
- escalate only when a real stop condition, product decision, destructive risk, live-production action or authorization boundary is reached.

Important insight should normally become an executable next step in the same response.

### Reasoning-effort budget

When the execution environment exposes model/reasoning controls, recommend the configuration explicitly before delegated work.

Use proportional effort:

- MICRO / routine UI / docs / known local fix: Medium or High.
- STANDARD bounded implementation: High / Extra High where available.
- Multi-module or structural sprint: Max/highest non-Ultra tier when available.
- Ultra/deepest reasoning: reserve for ambiguous architecture, race conditions, data-integrity/sync bugs, destructive-risk analysis, difficult incident recovery and final high-risk release gates.

Do not use the maximum setting by habit. Higher reasoning is justified by risk/ambiguity, not by task length alone.

## Stop conditions

Pause broad implementation and surface a blocker when source of truth is ambiguous, destructive migration lacks restore, environment is unreproducible, external claim is unverified, license blocks/obscures intended reuse, package is too large to rollback independently, or work conflicts with an active decision without explicit review.

## Anti-overengineering

Do not add a database, queue, vector store, worker, realtime layer, microservice, framework rewrite, container stack or agent system merely because another product has one. Ask what present/near-term problem earns the complexity.

## Anti-underengineering

Do not classify reliability as “later” when failure can lose, duplicate, corrupt or make real work unrecoverable.

## Success metrics

The method must prove value over time, not just produce documents. Track at least:

- Brain consultation rate for tracked STANDARD/STRUCTURAL cycles.
- Brain update completion rate.
- Ideas rejected/deferred **before** code because evidence/dependencies were weak.
- Decisions superseded/reversed and why.
- Experiments completed vs. planned.
- Open questions resolved.
- Median tracked cycle time when timestamps exist.
- Packages/releases blocked correctly by gates.

Metrics are diagnostic, not targets to game. A high number of rejected ideas can be healthy when it prevents waste.

## Completion protocol

At the end of a substantial task, report stage, evidence inspected, changed/not changed, tests/gates/blockers, decisions changed, brain entries added/updated and highest-leverage next stage.

Do not automatically execute the next major stage unless authorized or already in scope.

## Project-local references

- `reference/00-method-map.md` — proportionality + maturity routing.
- `reference/01-evidence-and-research.md` — source intake, research and reverse engineering.
- `reference/02-second-brain.md` — durable memory model, schemas and provenance.
- `reference/03-idea-engine.md` — contextual ideation without feature bloat.
- `reference/04-architecture-and-planning.md` — gap, ADRs and implementation planning.
- `reference/05-implementation-package.md` — safe coding-package workflow.
- `reference/06-quality-gates.md` — baseline, tests, release and rollback.
- `reference/07-context-routing.md` — minimal-context loading strategy.
- `reference/08-license-and-reuse.md` — license/reuse triage for external code.
- `examples/dutra-os-journey.md` — real example that produced this method.
- `examples/brain-records.md` — one concrete JSONL example per record type.


## Live runtime and infrastructure rule

The Builder Brain owns architecture and product-engineering reasoning, but it must not pretend that live infrastructure state is static.

For any request such as:

- "acesse o sistema";
- "coloque online";
- "abra no celular";
- "qual é o link atual?";
- "verifique o deploy/status/logs/domínio";
- "reinicie/republique";
- "configure o Railway";
- "o sistema caiu?";

load `.codex/skills/dutra-runtime-operator/SKILL.md`.

That runtime skill must inspect the current runtime manifest and query the connected infrastructure provider when available. Repository documentation is a locator and safety contract, not proof that a deployment is currently healthy.

Never place access-token values, credentials, API keys, private cookies or passwords in this skill, Git history, second-brain records or runtime documentation.
