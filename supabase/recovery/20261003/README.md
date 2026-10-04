# Supabase recovery snapshot — 2026-10-03

This directory is a **read-only evidence snapshot** of the live `og-proposal-engine` backend captured while resolving `INC-SUPABASE-DRIFT-001`.

It contains:

- the live migration inventory;
- the **original SQL statements stored by Supabase for all 25 applied migrations** under `migrations-original/`;
- extension inventory;
- public table/catalog metadata;
- exact retrievable source for all 13 active Edge Functions.

## Migration recovery

The live table `supabase_migrations.schema_migrations` contains the `statements text[]` column. This allowed the recovery to preserve the SQL recorded for each applied remote migration instead of reconstructing SQL from the final schema.

Files under `migrations-original/` therefore come from the migration history stored by the live project.

They remain in the recovery namespace until canonical promotion is reviewed because the repository also contains:

- an Auth/Organization pilot migration that is **not applied on this remote**;
- three later-timestamp migration files on `main` whose contents match recovered remote migrations but whose version numbers differ.

The recovery process must resolve those history/provenance differences before changing the canonical `supabase/migrations/` folder.

## Secret handling

The recovery process scanned migration SQL, Edge Function source and catalog payloads for common secret-like token/key/credential patterns before writing them. No matching migration or function source was found.

Secret values, database credentials, Edge Function environment values, decrypted Vault values and cron command bodies were intentionally excluded from the metadata snapshot.

Environment-variable names inside source code are expected and are safe to version; their values remain outside Git.

## Existing canonical source comparison

The two Edge Functions already versioned on `main` were compared byte-for-byte with live recovered source:

- `sales-execution-gateway/index.ts`: exact match.
- `call-intelligence/index.ts`: exact match.

Three SQL files currently versioned on `main` also match the SQL of their corresponding recovered live migrations byte-for-byte after line-ending normalization:

- `record_sales_execution_result_v1`
- `harden_sales_execution_result_v1`
- `call_intelligence_v1`

Their Git filenames use different migration timestamps from the live history, which is a migration-history issue even though the SQL itself matches.

## What this is not

This snapshot is not yet the canonical migration directory and it does not authorize replay against production.

Never use `supabase db reset --linked` on production.

## Safe next step

Prepare the canonical-history promotion plan:

1. map every recovered remote migration to its exact recorded version/name;
2. resolve the three duplicate-but-retimestamped Git migrations;
3. keep the unapplied Auth/Organization pilot explicit instead of silently pretending it is live;
4. validate the resulting migration chain in a disposable environment;
5. add a repeatable live-vs-Git drift gate;
6. only then permit new structural migrations such as PostGIS/company_locations.
