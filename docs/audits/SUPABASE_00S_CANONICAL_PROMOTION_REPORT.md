# SUPABASE-00S-B — Canonical History Promotion

## Status

**GIT PROMOTION COMPLETE / DISPOSABLE REPLAY FOUND AN UNTRACKED-SCHEMA GAP**

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

## Remaining gate

A fresh replay must now pass with the untracked live baseline supplement plus the exact 25 recorded migrations before this history can be declared fully reproducible.

Because a managed Supabase development branch may have account-specific cost, creating one requires an explicit cost check/confirmation first.

A local/CI Supabase replay is a possible zero-platform-cost alternative and should be preferred if it can reproduce required extensions/services reliably.

## GEO consequence

No PostGIS/company location migration should be applied to production until this canonical history passes disposable replay.
