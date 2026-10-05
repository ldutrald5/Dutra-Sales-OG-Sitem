# GEO-04R — Geocoding Benchmark Report

## Status

**PASS — BENCHMARK HARNESS READY / PROVIDER SELECTION INTENTIONALLY PENDING**

## Delivered

- provider-neutral normalized geocode DTO;
- Geoapify response normalizer;
- Mapbox v6 Permanent response normalizer;
- canonical precision mapping;
- address component matching;
- provider-signal integration;
- internal confidence model;
- hard mismatch caps;
- AUTO_ACCEPTED / NEEDS_REVIEW / UNVERIFIED decision contract;
- haversine distance evaluation;
- benchmark aggregate metrics;
- minimum ground-truth gate;
- economical sequential benchmark runner;
- explicit Mapbox Permanent opt-in;
- public fixture schema/template;
- guard preventing Google/Public Nominatim from entering the executable benchmark providers;
- private-fixture Git exclusion.

## Why no winner is declared

No provider should become the canonical coordinate source until a representative Brazilian ground-truth set exists.

The template intentionally reports:

`INSUFFICIENT_GROUND_TRUTH`

instead of inventing a confidence ranking.

## Current commercial/legal screening

### Geoapify — eligible

Current docs permit result storage and commercial Free-plan use subject to limits/attribution.

Current Free tier documented on 2026-10-05:

- 3,000 credits/day;
- up to 5 req/s;
- geocoding is 1 credit/request.

### Mapbox Permanent — eligible with billing/access

Permanent geocoding explicitly allows indefinite result storage when used as Permanent Geocoding.

Current pricing page on 2026-10-05 lists:

- USD 5 / 1,000 for 1–500,000 Permanent Geocoding requests.

The benchmark requires `MAPBOX_PERMANENT_ALLOWED=1`.

### Google Geocoding — rejected for this persistence role

General caching/storage restrictions conflict with DUTRA's canonical persistent-coordinate requirement.

### Public Nominatim — rejected for production/bulk

The public policy caps heavy use and discourages bulk/periodic workloads.

## Economics

A 100-address comparison is designed to be very cheap:

- Geoapify: inside current 3,000/day Free allowance;
- Mapbox Permanent: approximately USD 0.50 at current published first-tier pricing, if the account is eligible.

Provider calls are never part of normal CI.

## Production impact

None.

No geocoder API key was created.
No provider request was executed.
No real customer address was uploaded.
No database coordinate was written.
No deployment occurred.

## Next gate

Build the verified benchmark fixture from approved public/business addresses and/or manually confirmed CRM locations.

Only after the benchmark has enough ground truth may GEO-05R promote a provider and implement the `LOCATION_GEOCODE` worker/persistence path.
