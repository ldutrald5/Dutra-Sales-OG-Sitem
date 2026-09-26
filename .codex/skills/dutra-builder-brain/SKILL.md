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

## Activation protocol

1. Read local instructions (`AGENTS.md`, project context and scoped docs).
2. Classify scope as MICRO / STANDARD / STRUCTURAL using `reference/00-method-map.md`.
3. Detect the earliest unresolved maturity stage.
4. Load only the references and brain entries needed for that stage.
5. Inspect existing code/data/contracts before proposing structural change.
6. If a new external source exists, run `reference/01-evidence-and-research.md`.
7. Generate ideas with `reference/03-idea-engine.md`; ideas do not become scope automatically.
8. Persist durable learnings using `reference/02-second-brain.md`.
9. For architecture/planning use `reference/04-architecture-and-planning.md`.
10. For implementation use `reference/05-implementation-package.md` and `reference/06-quality-gates.md`.
11. For possible code reuse, apply `reference/08-license-and-reuse.md` before recommending reuse.
12. STANDARD/STRUCTURAL closeout must refresh the human index and metrics, then run the brain checker.
13. End with an explicit next-stage recommendation, not an uncontrolled chain of work.

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
