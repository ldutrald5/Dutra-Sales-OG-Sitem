# GEO-03R — Company Registry and Address Normalization

## Status

Implemented as a pending/server-side enrichment package. No provider call or database mutation has been performed against production.

## Boundary

Company registry enrichment is **not** proposal enrichment.

The existing `company-discovery` worker is proposal-aware and can release rendering. GEO-03R therefore reuses the existing `enrichment_jobs` infrastructure but separates job intent:

- `COMPANY_DISCOVERY`
- `COMPANY_REGISTRY`
- `LOCATION_GEOCODE`

`claim_enrichment_job_v1` remains as a compatibility wrapper for `COMPANY_DISCOVERY` only, so it cannot accidentally consume registry/geocode jobs.

## Provider abstraction

Shared provider-neutral normalization lives in:

`supabase/functions/_shared/company-registry.mjs`

The worker lives in:

`supabase/functions/company-registry/index.ts`

Provider selection is configured by `COMPANY_REGISTRY_PROVIDER`:

- `auto`
- `cnpjws`
- `brasilapi`

CNPJ.ws token, when used, comes only from `CNPJWS_API_TOKEN` in the server environment.

## Current provider capability

### CNPJ.ws Commercial

Current documentation exposes direct lookup at:

`GET https://comercial.cnpj.ws/cnpj/{cnpj}`

and currently documents the path identifier as 14 numeric digits.

Therefore DUTRA OS **does not send alphanumeric CNPJ to this adapter** until the provider contract explicitly supports it.

### BrasilAPI

Current CNPJ documentation accepts the 2026 shape:

`[0-9A-Z]{12}[0-9]{2}`

Therefore AUTO mode uses BrasilAPI for alphanumeric CNPJ.

### AUTO behavior

- numeric CNPJ + configured CNPJ.ws token → CNPJ.ws Commercial;
- alphanumeric CNPJ → BrasilAPI;
- numeric CNPJ without CNPJ.ws token → BrasilAPI.

Provider capability is explicit instead of silently stripping letters.

## Deterministic address normalization

Registry addresses are normalized without AI.

Normalized fields:

- raw
- street
- number
- complement
- district
- postalCode
- city
- cityIbgeCode
- state
- countryCode
- formattedAddress

The normalizer never invents a number, CEP, neighborhood or coordinate.

Registry enrichment does **not** geocode. It writes/updates a `REGISTERED_ADDRESS` candidate with `geo = null`, `geocodePrecision = UNKNOWN` and no geocode confidence.

Geocoding remains GEO-04R.

## Persistence behavior

Pending migration:

`supabase/pending/20261004221000_geo_company_registry_enrichment_v1.sql`

It adds typed enrichment metadata to the existing queue rather than creating another queue.

New server-only RPCs:

- `claim_enrichment_job_v2`
- `enqueue_company_registry_job_v1`
- `apply_company_registry_v1`
- `fail_enrichment_job_v2`

## Idempotency

Only one active registry job for the same Company + normalized CNPJ can exist at a time.

Completed jobs do not permanently block a later refresh.

## Retry economics

Retry behavior is intentionally selective:

- 429 → retryable with longer delay;
- 5xx/network/timeouts → retryable;
- malformed CNPJ, unsupported provider and other definitive errors → fail without wasteful retry.

Maximum-attempt behavior from the existing queue remains bounded.

## Manual-location protection

A registry refresh may update only an active CNPJ-registry address that is not manually verified.

Locations with:

- `VERIFIED_BY_SELLER`
- `VERIFIED_BY_CUSTOMER`
- `VERIFIED_BY_VISIT`

are never silently overwritten.

If registry data later differs, a separate registry candidate is stored for review.

## Proposal isolation

Registry jobs:

- use `proposal_id = null`;
- never call proposal-engine;
- never call PDF rendering;
- never use `apply_company_discovery_v2`;
- return `proposal_side_effect = false` from the apply RPC.

## Security

Provider credentials exist only in the Edge Function environment.

The worker requires internal service authorization.

No API token is accepted from or exposed to the browser.
