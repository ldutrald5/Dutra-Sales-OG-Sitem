# SUPABASE-00S-B — Canonical History Promotion

## Status

**PASS — CANONICAL REPLAY + STRUCTURAL PARITY PROVEN IN DISPOSABLE CI**

This package remains stacked on PR #109 and is **not authorized for merge** by this report.

## Final checkpoint

- Canonical replay: **PASS**
- Structural parity: **PASS**
- Unexplained drift: **0**
- NOT_VERIFIABLE_FROM_CURRENT_EVIDENCE: **0**
- Canonical migrations: **25/25**
- Edge Functions: **13/13**
- Orphan live tables recovered: **8/8**
- Production modified: **NO**
- Production migrations applied remotely: **NO**
- Edge Functions redeployed: **NO**
- PR #109 merged: **NO**
- PR #110 merged: **NO**
- PR #107 modified/rebased: **NO**
- GEO/CNPJ/PostGIS/geocoding work started: **NO**

## Changes prepared

### Applied migration history

The exact 25 migration versions and SQL payloads recorded by live Supabase were promoted into:

`supabase/migrations/`

The three retimestamped duplicates previously on `main` were removed from the canonical applied-history directory because their SQL is represented by the exact live versions.

### Pending Auth pilot

`20260926233000_auth_organization_pilot.sql` is not in the live migration history.

It remains under:

`supabase/pending/`

This prevents the repository from silently representing an unapplied pilot as part of current live history.

### Edge Functions

All 13 active live Edge Function sources are represented under:

`supabase/functions/`

The 11 previously absent sources were promoted from the read-only recovery snapshot. The two previously present functions matched recovered live source byte-for-byte.

### Eight live tables outside recorded migration history

Disposable replay previously proved that these live public tables are not created by the recorded 25 migration payloads:

- `crm_contacts`
- `crm_conversations`
- `crm_messages`
- `crm_insights`
- `crm_processor_runs`
- `crm_activities`
- `integration_events`
- `sales_opportunities`

Their recovered structural supplement remains isolated at:

`supabase/recovery/20261003/untracked-live-baseline.sql`

It is recovery evidence for deterministic replay and is **not** represented as a fabricated applied migration version.

## Structural parity gate

The dedicated replay now derives its expected structural fingerprint from the recovered remote evidence under:

`supabase/recovery/20261003/`

The actual fingerprint is captured from the disposable replay database **inside the replay transaction, before ROLLBACK**.

The gate compares deterministically:

- public tables;
- columns;
- data types/formats;
- nullable state;
- defaults;
- identity generation;
- primary keys;
- foreign keys, including recovered ON DELETE / ON UPDATE semantics through constraint definitions;
- UNIQUE constraints;
- CHECK constraints;
- indexes, including partial indexes;
- public/public-owned sequence semantics represented by recovered column identity/default evidence;
- views;
- materialized views;
- public functions/procedures represented by the recovered catalog;
- triggers;
- required installed extensions represented by recovered remote evidence;
- RLS enabled/disabled state;
- policies;
- captured `anon`, `authenticated` and `service_role` table grants/privileges.

The comparison does not alter discovered differences. Every compared category is classified as `MATCH`, `EXPECTED_DIFFERENCE` or `UNEXPLAINED_DRIFT`. Any `UNEXPLAINED_DRIFT` fails the gate. Missing snapshot evidence is reported as `NOT_VERIFIABLE_FROM_CURRENT_EVIDENCE` and also blocks structural parity.

For the successful run there are no allowlisted/expected differences: every compared category is `MATCH`.

## Proven fingerprint

Dedicated workflow:

`Supabase Canonical Replay` — run #15 — **SUCCESS**

Deterministic schema fingerprint:

`7f0c31d8de86892d48afb2bf9e4a6d0d36e293aab94d105344a5526241d959a9`

Observed parity:

| Category | Result |
|---|---:|
| Tables | MATCH — 34/34 |
| Columns | MATCH — 521/521 |
| Constraints | MATCH — 224/224 |
| Indexes | MATCH — 142/142 |
| Views | MATCH — 0/0 |
| Materialized views | MATCH — 0/0 |
| Functions/procedures | MATCH — 26/26 |
| Triggers | MATCH — 4/4 |
| Policies | MATCH — 0/0 |
| Captured table grants | MATCH — 476/476 |
| Required installed extensions | MATCH — 7/7 |
| Sequence/identity semantics | MATCH — 2/2 |

Summary:

- `MATCH` categories: **12**
- `EXPECTED_DIFFERENCE`: **0**
- `UNEXPLAINED_DRIFT`: **0**
- `NOT_VERIFIABLE_FROM_CURRENT_EVIDENCE`: **0**

## Clean-room replay determinism

The workflow now executes the canonical replay twice.

For each replay it:

1. starts a disposable local Supabase database;
2. asserts that the public project schema contains no project tables, views, materialized views, sequences or public routines before replay;
3. applies the recovered eight-table bootstrap plus the exact 25 canonical migration payloads;
4. applies the recovered post-migration FK/index/RLS/grant phase;
5. captures the structural fingerprint before rollback;
6. checks structural parity;
7. rolls back the replay transaction;
8. destroys the local Supabase stack with `--no-backup`.

The stack is then started again for replay #2 and the same empty-schema precondition is enforced.

Both clean executions produced the same fingerprint:

`7f0c31d8de86892d48afb2bf9e4a6d0d36e293aab94d105344a5526241d959a9`

The workflow also performs a byte-for-byte comparison of the normalized expected and actual fingerprints from both runs.

Result:

**Clean replay fingerprint determinism: PASS**

This proves the green result does not depend on residual state from the previous replay.

## Reproducible evidence

Implementation:

- `scripts/build_supabase_transactional_replay.mjs` — builds the rollback-only canonical replay and captures the pre-rollback catalog fingerprint;
- `scripts/check_supabase_schema_parity.mjs` — derives expected state from the recovered snapshots, normalizes both sides, computes SHA-256, classifies parity and fails on unexplained/not-verifiable state;
- `.github/workflows/supabase-replay-ci.yml` — executes two clean disposable replays and verifies deterministic equality.

The workflow publishes the normalized expected/actual fingerprints and parity reports as a short-lived GitHub Actions artifact for review.

## Regression contract

`og:supabase:recovery:test` continues to assert:

- exactly the 25 live migration filenames exist in canonical migrations;
- canonical SQL equals the recovered live SQL;
- the Auth pilot is pending and absent from applied history;
- every active recovered Edge Function file exists canonically and is byte-identical;
- recovery evidence contains no obvious committed secret-like credentials.

Normal project validation also remains green before the independent npm audit gate.

## Package 00R / AIOX advisory — separate issue

The legacy `Package 00R CI` remains red for a reason separate from Supabase canonical replay/parity.

On run #529:

- `npm ci`: PASS;
- lockfile integrity: PASS;
- `npm run validate`: PASS;
- `npm run og:brain:check`: PASS;
- `npm run og:security:test`: PASS;
- `npm audit --audit-level=high`: FAIL.

The audit reports **6 high-severity findings** rooted in the existing AIOX dependency chain around `braces` / `@aiox-squads/core`.

The audit proposes `npm audit fix --force`, which would install a breaking AIOX version. That action is explicitly **not** performed in SUPABASE-00S.

Therefore:

- do not use `npm audit fix --force`;
- do not mix AIOX dependency remediation with Supabase canonical recovery;
- document/remediate the braces/AIOX advisory as a separate Package 00R task.

## No remote mutation

This package did not:

- apply any migration to Supabase production;
- alter production tables, constraints, grants, policies or RLS;
- install or modify a production extension;
- deploy/redeploy an Edge Function;
- mutate production data;
- change Railway;
- merge PR #109 or #110;
- touch PR #107.

All schema mutation performed by the replay occurred only inside disposable local CI databases and was rolled back before each disposable stack was destroyed.

## Branch/PR sequencing

The required stack is preserved:

`main <- PR #109 / supabase-00s-recovery-snapshot <- PR #110 / supabase-00s-canonical-history`

No branch reorganization was performed.

PR #107 remains a future Assets migration package and must be reconciled/rebased only after #109/#110 are definitively integrated under explicit approval.

## Stop condition

SUPABASE-00S canonical replay/parity has reached its requested Definition of Done.

**STOP HERE.**

Do not begin:

- CNPJ work;
- GEO;
- PostGIS;
- map;
- geocoding;
- Assets reconciliation;
- production migration rollout;
- merge of PR #109/#110.

Those require an explicit subsequent decision.
