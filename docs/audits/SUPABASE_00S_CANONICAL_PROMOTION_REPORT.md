# SUPABASE-00S-B — Canonical History Promotion

## Status

**PASS — CANONICAL RECOVERY + DISPOSABLE REPLAY GREEN**

## Changes prepared

### Applied migration history

The exact 25 migration versions and SQL payloads recorded by live Supabase were promoted into:

`supabase/migrations/`

The three retimestamped duplicates previously on `main` were removed from the canonical applied-history directory because their SQL is represented by the exact live versions.

### Pending Auth pilot

`20260926233000_auth_organization_pilot.sql` is not in the live migration history.

It was moved to:

`supabase/pending/`

This prevents the repository from silently representing an unapplied pilot as part of current live history.

### Edge Functions

All 13 active live Edge Function sources are now represented under:

`supabase/functions/`

The 11 previously absent sources were promoted from the read-only recovery snapshot. The two previously present functions already matched live source byte-for-byte.

### Regression contract

`og:supabase:recovery:test` now asserts:

- exactly the 25 live migration filenames exist in canonical migrations;
- canonical SQL equals the recovered live SQL;
- the Auth pilot is pending and absent from applied history;
- every active recovered Edge Function file exists canonically and is byte-identical;
- recovery evidence contains no obvious committed secret-like credentials.

## Disposable replay finding

The first local Supabase replay progressed through the recovered migration chain until the Sales Execution migration tried to alter `public.crm_contacts`.

That table did not exist in the recorded 25 migrations.

A live catalog cross-check then identified **8 public tables that exist remotely but have no CREATE TABLE statement in the recorded Supabase migration history**:

- `crm_activities`
- `crm_contacts`
- `crm_conversations`
- `crm_insights`
- `crm_messages`
- `crm_processor_runs`
- `integration_events`
- `sales_opportunities`

This proves the drift was not limited to missing migration files in Git. Part of the live CRM schema was created outside the migration history currently stored in `supabase_migrations.schema_migrations`.

A non-production recovery supplement was added at:

`supabase/recovery/20261003/untracked-live-baseline.sql`

It reconstructs those eight tables from live catalog metadata so the disposable replay can test the full recovered history without falsely inserting invented versions into the canonical 25-migration history.

The replay workflow remains rollback-only and runs against a local disposable database.

## No remote mutation

This branch does not:

- apply migration;
- deploy Edge Function;
- install extension;
- change RLS;
- change production data;
- change Railway.

## Replay result

The zero-platform-cost local/CI replay now passes.

Evidence from the dedicated `Supabase Canonical Replay` workflow:

- pinned Supabase CLI installation: PASS;
- replay safety gate: PASS;
- disposable local database startup: PASS;
- recovery bootstrap + exact 25 recorded migrations: PASS;
- recovered FK/index/RLS/grant phase: PASS;
- table/function structural assertions: PASS;
- transaction rollback: PASS;
- disposable stack shutdown: PASS.

The replay intentionally mutates only the disposable local database and rolls back the structural transaction.

## GEO consequence

Git-only GEO/domain implementation may proceed. Any production PostGIS/company-location DDL still requires a separate reviewed package, current live-vs-Git pre-flight and explicit rollout decision.
