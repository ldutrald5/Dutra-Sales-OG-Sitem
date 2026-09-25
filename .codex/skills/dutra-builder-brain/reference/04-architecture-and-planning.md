# Gap, architecture and planning protocol

## Gap analysis

Compare by problem/capability, not by product prestige.

Classify each area:

- KEEP
- FIX
- ADAPT
- REUSE
- REPLACE
- DEFER
- DO NOT IMPLEMENT

Also capture business impact, data-risk reduction, complexity, migration risk and dependencies.

## Architecture

Architecture must define at minimum:

- canonical domain/entities and ownership;
- stable identifiers and dedupe;
- write/read boundaries;
- persistence/source of truth;
- identity/auth/permissions;
- sync/concurrency/delete/restore;
- audit/observability;
- backup/restore/migrations;
- integration boundaries;
- AI context/write boundary;
- deployment/environments;
- non-goals.

Technology comes after requirements. Record structural technology choices in ADRs with alternatives and exit strategy.

## Master plan

Plan two coordinated tracks:

### Foundation
Reliability, data, identity, sync, backup, security, tests, observability.

### Product
Visible workflow value unlocked by foundation.

Every package should be independently testable and reversible. Prefer vertical proofs over broad layer-by-layer rewrites.

## Strangler principle

When replacing legacy paths:

`LEGACY → ADAPTER → CANONICAL PATH → RECONCILIATION → CUTOVER → ROLLBACK WINDOW → RETIRE LEGACY`.

Keep dual-write windows short and observable.
