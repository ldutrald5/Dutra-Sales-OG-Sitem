# Supabase recovery snapshot — 2026-10-03

This directory is a **read-only evidence snapshot** of the live `og-proposal-engine` backend captured while resolving `INC-SUPABASE-DRIFT-001`.

It contains the live migration inventory, extension inventory, public table/catalog metadata and the retrievable source of all 13 active Edge Functions.

## What this is not

This is **not an executable migration chain** and it does not pretend to reconstruct the original SQL of the 25 historical remote migrations.

Do not copy these files into `supabase/migrations/` and do not run them against production.

## Secret handling

The recovery process scanned source/catalog payloads for common secret-like patterns before writing them. No matching file was committed. Secret values, database credentials, Edge Function environment values, decrypted Vault values and cron commands were intentionally excluded.

Environment-variable names inside source code are expected and are safe to version; their values remain outside Git.

## Existing canonical source comparison

The two Edge Functions already versioned on `main` were compared byte-for-byte with the live recovered source:

- `sales-execution-gateway/index.ts`: exact match.
- `call-intelligence/index.ts`: exact match.

This is positive evidence that those two Git sources match the deployed source inspected during this capture.

## Safe next step

The next step is to build and review a canonical **fresh-install baseline** from this evidence without falsifying historical migrations, then validate that baseline in a disposable environment.

Never use `supabase db reset --linked` on production.
