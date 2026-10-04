# SUPABASE-00S — Backend Reproducibility Recovery

## Status

**PASS WITH GOVERNANCE BLOCKER — ORIGINAL LIVE SQL AND FUNCTION SOURCES RECOVERED; CANONICAL PROMOTION PENDING**

## Major finding

The live Supabase migration history stores the original executed SQL in:

`supabase_migrations.schema_migrations.statements`

The recovery therefore did **not** need to invent historical SQL from final schema state.

All 25 migration records contain one stored SQL statement payload and were recovered under:

`supabase/recovery/20261003/migrations-original/`

No migration matched the secret-like credential patterns used by the recovery scan.

## Recovered evidence

- 25 live migration-history records.
- original recorded SQL for all 25 migrations.
- 34 public tables in the live inventory.
- public catalog metadata: policies, indexes, constraints, triggers, functions, views/materialized views and grants.
- non-secret Storage bucket metadata.
- non-secret cron schedule metadata; command bodies excluded.
- exact retrievable source for all 13 active Edge Functions.
- extension inventory.

## Source comparisons

### Edge Functions already in main

Exact byte match:

- `sales-execution-gateway`
- `call-intelligence`

### SQL already in main

The following Git migrations match corresponding live recovered migration SQL exactly after line-ending normalization, but their Git migration timestamps differ from the remote history:

- Git `20260930024500_record_sales_execution_result_v1.sql`
  ↔ remote `20260930023756_record_sales_execution_result_v1`
- Git `20260930031500_harden_sales_execution_result_v1.sql`
  ↔ remote `20260930030530_harden_sales_execution_result_v1`
- Git `20260930104500_call_intelligence_v1.sql`
  ↔ remote `20260930103929_call_intelligence_v1`

### V3 evidence

- `add_sales_execution_fk_indexes`: exact SQL match to live, timestamp differs.
- `add_sales_execution_external_ids`: exact SQL match to live, timestamp differs.
- `add_sales_execution_p0`: comments/format differ, normalized executable SQL matches live.

This is strong evidence that much of the missing backend history came from prior implementation work whose final deployed timestamps were not backfilled to the canonical Git branch.

## Auth/Organization divergence

The repository contains:

`20260926233000_auth_organization_pilot.sql`

but the live remote migration history does not.

The live remote also currently lacks:

- `public.organizations`
- `public.profiles`
- `public.organization_members`

That migration must remain explicitly classified as **unapplied/pilot** until the Auth/RLS rollout is deliberately decided and tested. It must not be silently described as current remote state.

## Security

No secret values were requested from secret managers.

All recovered Edge Function source and migration SQL was screened for common secret-like key/JWT/private-key/database-password forms before commit.

The metadata snapshot intentionally excludes environment values, decrypted Vault contents and cron command bodies.

## CI evidence

PR #109 validation established:

- `npm ci`: PASS
- lockfile integrity: PASS
- `npm run validate`: PASS
- `og:supabase:recovery:test`: PASS
- `og:brain:check`: PASS
- `og:security:test`: PASS
- Sales Execution P0 workflow: PASS
- Call Intelligence V1 workflow: PASS

The overall Package 00R CI job is currently red only because `npm audit --audit-level=high` detects the newly published `braces` advisory through the AIOX dependency chain. The branch does not modify `package-lock.json`; the advisory has no patched `braces` release at the time of this audit. This is an upstream dependency/security gate and is not hidden or reclassified as PASS.

## Remaining governance blocker

Do not yet copy recovered SQL blindly into `supabase/migrations/`.

A controlled promotion must decide:

1. canonicalize the exact 25 remote versions;
2. remove/archive duplicate retimestamped files without breaking tests/docs;
3. classify the unapplied Auth pilot separately;
4. validate clean replay in a disposable environment;
5. add a live-vs-Git drift gate.

No production Supabase mutation is authorized by this report.

## Next safe package

**SUPABASE-00S-B — Canonical Migration History Promotion Plan + Disposable Replay**

The first half (promotion plan and Git-only changes) can proceed safely. Any creation of a Supabase development branch must follow the platform cost-confirmation flow before execution.
