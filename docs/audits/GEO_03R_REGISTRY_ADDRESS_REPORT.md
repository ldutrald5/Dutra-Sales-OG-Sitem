# GEO-03R — Registry + Address Normalization Report

## Status

**PASS — PROVIDER-NEUTRAL FOUNDATION IMPLEMENTED**

## Delivered

- provider-neutral `CompanyRegistryProvider` contract;
- server-only provider safety boundary;
- normalized company-registry DTO;
- projections into legal Establishment and registered Location drafts;
- explicit `company_registry_v1` enrichment job payload;
- deterministic Brazilian address normalizer;
- raw-address preservation;
- CEP/UF/no-number normalization;
- geocoding-readiness signal;
- mock provider for regression tests;
- no production/provider calls.

## Architectural consequence

The future enrichment flow can now be:

```text
CNPJ
  -> CompanyRegistryProvider
  -> normalized RegistryRecord
  -> CompanyEstablishment
  -> REGISTERED_ADDRESS CompanyLocation
  -> GeocodingProvider
  -> PostGIS geo
```

Vendor payloads should stop at the provider adapter boundary.

## Proposal-pipeline isolation

The existing backend already uses `enrichment_jobs` for proposal/company discovery.

GEO-03R therefore introduces an explicit job `kind` for registry work rather than reusing proposal semantics implicitly.

A future worker must not release proposal rendering merely because a CNPJ registry lookup completed.

## Production impact

None.

No external API was called.
No secret was added.
No Supabase migration was applied.
No Edge Function was deployed.
No CRM/customer record was modified.

## Next safe package

**GEO-04R — Geocoding Provider + confidence/precision engine**

Recommended scope:

- provider-neutral geocoding contract;
- persistability/legal-policy metadata per provider;
- deterministic request DTO;
- normalized geocode result;
- precision mapping;
- internal confidence calculation from field matches;
- mock benchmark fixtures;
- no real customer geocoding yet.
