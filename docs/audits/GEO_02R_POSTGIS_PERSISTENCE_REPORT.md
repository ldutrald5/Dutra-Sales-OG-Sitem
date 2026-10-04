# GEO-02R — PostGIS Persistence Foundation Report

## Status

**PASS — DISPOSABLE POSTGIS REPLAY GREEN / PRODUCTION UNCHANGED**

## Scope delivered

GEO-02R prepares, but does not apply, the persistence layer for the future commercial map.

The pending migration is:

`supabase/pending/20261004213000_geo_postgis_locations_v1.sql`

It includes:

- PostGIS under the Supabase `extensions` schema;
- database-side alphanumeric CNPJ validation;
- `public.company_establishments`;
- `public.company_locations`;
- canonical `extensions.geography(Point,4326)`;
- GiST spatial index;
- Company ↔ Establishment ↔ Location integrity guard;
- updated-at triggers;
- RLS enabled;
- direct anon/authenticated table privileges revoked;
- service-role/backend access;
- radius/nearest RPC;
- viewport RPC.

## Coordinate truth

`company_locations.geo` is the canonical persisted coordinate source.

Independent persisted latitude/longitude columns were intentionally rejected. Latitude and longitude are projections returned by spatial queries for frontend consumption.

## Browser/security boundary

The current live backend does not yet have the Auth/Organization pilot applied.

For that reason GEO-02R does not invent isolated browser policies. The pending schema is backend/service-role oriented and no privileged key may reach the browser.

Auth/RLS expansion remains a separate explicit rollout decision.

## CNPJ integrity

The pending database migration carries the same 2026 alphanumeric CNPJ rule as GEO-01R:

- 12 alphanumeric base positions;
- 2 numeric verification digits;
- official modulo-11 calculation;
- letters preserved as identity;
- no numeric cast.

The disposable replay validates the official example `12.ABC.345/01DE-35` and rejects the wrong DV `12.ABC.345/01DE-34`.

## Spatial contract

### Nearby / nearest

`public.company_locations_nearby_v1`

Supports:

- point origin;
- optional radius;
- distance in meters;
- nearest-neighbor ordering;
- bounded result limit.

### Viewport

`public.company_locations_in_view_v1`

Supports:

- min/max latitude/longitude;
- map viewport filtering;
- bounded result limit.

Both are currently granted only to `service_role`.

## Referential guard

A trigger rejects a `CompanyLocation` that references an Establishment owned by another Company.

The disposable replay explicitly tests that cross-company relationship and requires the write to fail.

## Test evidence

Dedicated workflow:

**GEO PostGIS Replay — run 37241292316: PASS**

Steps passed:

1. checkout;
2. pinned Supabase CLI;
3. static GEO persistence contract;
4. canonical migration isolation;
5. local Supabase initialization;
6. disposable database startup;
7. GEO tail build;
8. rollback-only base + GEO replay build;
9. full GEO transaction/replay assertions;
10. disposable stack shutdown.

Regression workflow:

**Supabase Canonical Replay — run 37241292375: PASS**

This proves the generic replay builder still reconstructs the existing backend without the optional GEO tail.

General Package 00R validation for the same branch:

- npm ci: PASS;
- lockfile integrity: PASS;
- `npm run validate`: PASS;
- Builder Brain check: PASS;
- security test: PASS;
- overall legacy workflow remains red only at the pre-existing `npm audit --audit-level=high` upstream AIOX/braces advisory.

No dependency or lockfile change was introduced by GEO-02R.

## Production impact

**None.**

GEO-02R did not:

- install PostGIS on live Supabase;
- create live tables;
- alter live RLS;
- deploy Edge Functions;
- modify Railway;
- enrich any customer;
- change any commercial record.

## Decision

The persistence design is technically ready for the next Git-only layer.

Production application remains intentionally blocked until a later controlled rollout explicitly authorizes it.

## Next safe package

**GEO-03R — Company Registry Provider + deterministic address normalization**

The next package should:

1. define `CompanyRegistryProvider`;
2. add provider-neutral normalized registry DTOs;
3. integrate with the existing enrichment-job architecture without proposal side effects;
4. implement deterministic address normalization;
5. provide mocks/fixtures and provider contract tests;
6. keep real provider calls and secrets server-side;
7. avoid writing live customer data in this package.
