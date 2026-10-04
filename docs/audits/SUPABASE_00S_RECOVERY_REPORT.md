# SUPABASE-00S — Backend Reproducibility Recovery

## Status

**PARTIAL PASS — LIVE SNAPSHOT RECOVERED; REPLAYABLE BASELINE STILL PENDING**

## What was recovered

- 25 live migration-history records.
- 34 public tables in the live inventory.
- public catalog metadata: policies, indexes, constraints, triggers, functions, views/materialized views and grants.
- non-secret Storage bucket metadata.
- non-secret cron schedule metadata; command bodies were excluded.
- exact retrievable source for all 13 active Edge Functions.
- extension inventory.

## Security

No secret value was requested from Railway or Supabase secret stores for this recovery.

Every Edge Function source payload was scanned for common secret-like token/key/credential patterns before commit; zero files were omitted.

The snapshot intentionally excludes environment values, database credentials, decrypted Vault contents and cron commands.

## Important validation

The live recovered source for:

- `sales-execution-gateway`
- `call-intelligence`

matches the source already versioned on `main` exactly, including Git blob SHA.

## Why the incident is not closed yet

The final live schema can be observed, but the original SQL bodies for 21+ historical remote migrations cannot be truthfully recreated from migration names or final state alone.

Therefore this recovery snapshot is stored under `supabase/recovery/`, not `supabase/migrations/`.

Closing `INC-SUPABASE-DRIFT-001` requires a reviewed, replayable fresh-install baseline plus a repeatable drift gate.

## Next safe action

Prepare `SUPABASE-00S-B`:

1. derive a canonical fresh-install schema baseline from recovered evidence;
2. keep remote-history marker/provenance separate from executable baseline;
3. test on disposable/local Supabase only;
4. prove required tables/functions/indexes/policies are reconstructed;
5. only then define how future migrations continue from the existing remote history.

No production Supabase mutation is authorized by this report.
