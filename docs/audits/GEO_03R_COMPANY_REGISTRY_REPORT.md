# GEO-03R — Company Registry Report

## Status

**PASS — REGISTRY PIPELINE + DISPOSABLE REPLAY GREEN**

## Delivered

1. Provider-neutral registry DTO.
2. Deterministic Brazilian address normalizer.
3. CNPJ.ws Commercial adapter.
4. BrasilAPI adapter with alphanumeric CNPJ support.
5. Capability-aware provider selection.
6. Existing `enrichment_jobs` reused instead of creating a second queue.
7. Typed claims prevent `company-discovery` from consuming registry/geocode jobs.
8. Active-job idempotency by Company + normalized CNPJ.
9. Registry apply path writes legal Establishment + registered-address Location.
10. Verified manual locations are protected.
11. Address changes invalidate stale geocode fields instead of retaining false coordinates.
12. Definitive failures do not receive wasteful retry.
13. Registry jobs are isolated from proposal/render side effects.
14. No production provider call or mutation.

## Provider documentation reviewed

CNPJ.ws Commercial currently documents its direct lookup path as numeric-only:
https://docs.cnpj.ws/referencia-de-api/api-comercial/consultando-cnpj

BrasilAPI currently documents the CNPJ path as accepting 12 alphanumeric base characters + two numeric check digits:
https://brasilapi.com.br/docs

This is why the adapter does not assume every provider has migrated at the same speed.

## Pending artifacts

- `supabase/pending/20261004221000_geo_company_registry_enrichment_v1.sql`
- `supabase/functions/company-registry/index.ts`
- `supabase/functions/_shared/company-registry.mjs`
- `scripts/test_company_registry_contract.mjs`
- `scripts/test_geo_registry_pipeline.mjs`
- `scripts/geo_registry_replay_assertions.sql`
- `.github/workflows/geo-registry-replay-ci.yml`

## Production impact

None.

No pending migration applied.
No Edge Function deployed.
No secret created.
No external registry request executed.
No customer record changed.

## Test evidence

Final validated head: `4664dc260498f2c47ee14ea5a695dc01a498c7c6`.

- GEO Registry Replay run `37360877965`: **PASS**
  - provider contract: PASS;
  - typed-pipeline static contract: PASS;
  - disposable Supabase startup: PASS;
  - canonical backend + GEO-02R + GEO-03R replay: PASS;
  - registry application assertions: PASS;
  - verified-location overwrite protection: PASS;
  - rollback and shutdown: PASS.
- Supabase Canonical Replay run `37360877979`: **PASS**.
- Package 00R:
  - npm ci: PASS;
  - lockfile integrity: PASS;
  - npm run validate: PASS;
  - Builder Brain: PASS;
  - security test: PASS;
  - overall workflow remains red only at the pre-existing upstream AIOX/`braces` npm-audit advisory.

A regression test now also guards the PL/pgSQL retry-function dollar delimiters that caused the first disposable replay failure.

## Next package after green replay

**GEO-04R — Geocoding Provider Benchmark + persistent geocode contract**

It should benchmark persistable geocoders on known Brazilian addresses before choosing the production provider.
