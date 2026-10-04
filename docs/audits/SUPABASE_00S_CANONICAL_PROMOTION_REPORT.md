# SUPABASE-00S-B — Canonical History Promotion

## Status

**GIT PROMOTION COMPLETE / DISPOSABLE REPLAY PENDING**

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

## No remote mutation

This branch does not:

- apply migration;
- deploy Edge Function;
- install extension;
- change RLS;
- change production data;
- change Railway.

## Remaining gate

A fresh replay must still be performed in a disposable Supabase-compatible environment before this history can be declared fully reproducible.

Because a managed Supabase development branch may have account-specific cost, creating one requires an explicit cost check/confirmation first.

A local/CI Supabase replay is a possible zero-platform-cost alternative and should be preferred if it can reproduce required extensions/services reliably.

## GEO consequence

No PostGIS/company location migration should be applied to production until this canonical history passes disposable replay.
