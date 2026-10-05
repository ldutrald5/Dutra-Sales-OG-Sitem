# GEO-06R — Manual Locations + Commercial Map Read Model

## Status

Implemented as a pending/backend package. No production migration or map renderer is activated by this package.

## Product boundary

The commercial map is a projection of canonical CRM data.

It does not own companies, commercial status or customer history.

The chain remains:

```text
Company
  -> CompanyEstablishment
  -> CompanyLocation
  -> PostGIS
  -> map read model
```

## Manual Location management

Manual correction is part of the minimum viable geography contract.

Server-side RPC:

`public.upsert_manual_company_location_v1`

Supports:

- creating a new known physical location;
- optionally linking an existing legal establishment;
- selecting physical purpose;
- saving structured/raw address;
- optional manual point;
- provenance source;
- human verification status;
- primary location per purpose;
- actor id for audit.

Allowed manual provenance sources are intentionally limited to:

- SELLER
- VISIT
- CUSTOMER
- OTHER

Registry/AI/import sources are not impersonated as manual sources.

## Automatic-source fork rule

If a seller edits a Location whose address source is:

- CNPJ_REGISTRY
- COMPANY_WEBSITE
- AI_SUGGESTED
- IMPORT

the RPC does not erase the source record.

It creates a new manual Location and records:

`forked_from_location_id`

This keeps source truth and operational truth side by side.

Example:

- registered company address remains as CNPJ_REGISTRY;
- confirmed truck garage becomes GARAGE / SELLER;
- both remain available to the CRM.

## Manual coordinate rule

When seller/customer/visit coordinates are supplied explicitly:

- PostGIS `geo` receives the point;
- `geocode_provider = manual`;
- `geocode_precision = MANUAL`;
- `geocode_confidence = 1`;
- verification status remains human-derived.

Latitude and longitude are inputs/projections only and are not persisted as parallel canonical columns.

## Address edit safety

Updating a manual address without supplying a replacement point deliberately clears the existing coordinate.

A changed address must not keep a stale pin.

It may subsequently receive a fresh geocode through the GEO-05R pipeline.

## Archiving

`archive_company_location_v1`

soft-archives a Location:

- `is_active = false`;
- `is_primary = false`.

Historical provenance remains available.

## Audit

GEO-06R introduces:

`public.audit_events`

and a CompanyLocation audit trigger.

Recorded fields include:

- entity type/id;
- action;
- actor id;
- source;
- old values;
- new values;
- optional enrichment job;
- correlation id;
- timestamp.

The goal is to answer:

> Why is this company pin here, who changed it, and what was there before?

The table is backend/service-role only until the broader Auth/Organization rollout is promoted.

## Company 360 location read

`company_locations_for_company_v1`

returns the Location set for one Company, including projected latitude/longitude only when PostGIS geo exists.

This is the backend contract for the future Company 360 Locations section.

## Commercial map read model

`map_accounts_in_view_v1`

is a viewport query, not a parallel CRM store.

It composes:

- Company identity;
- physical Location;
- account lifecycle;
- relationship status;
- most relevant/current sales Opportunity;
- detailed pipeline stage;
- compact sales-stage group;
- fleet size;
- next action;
- next-action due date;
- next-action priority;
- latest CRM activity timestamp;
- overdue-action flag.

## Sales stage grouping

Detailed CRM stages remain authoritative.

The map derives a reduced visual group:

| Pipeline stage | Map group |
| --- | --- |
| PROSPECT | UNTOUCHED |
| CONTACT_ATTEMPTED / CONNECTED / DECISION_MAKER_* | CONTACTING |
| QUALIFIED | QUALIFYING |
| MEETING_* | MEETING |
| PROPOSAL | PROPOSAL |
| NEGOTIATION | NEGOTIATION |
| WON / LOST | CLOSED |

The group is derived and never stored as a second status truth.

## Lifecycle

Current read-model projection derives:

- CUSTOMER
- INACTIVE_CUSTOMER
- PROSPECT

from existing relationship state.

This avoids introducing another independent lifecycle column solely for the map.

## MVP filters supported by this read model

Current backend filters:

- relationship status;
- pipeline stage;
- physical location purpose;
- location verification status;
- next-action priority;
- viewport.

Seller/owner filtering is intentionally not invented because the audited canonical backend does not yet expose a trustworthy owner field for this projection.

When ownership becomes canonical, it can be added as a read-model filter without redesigning Location.

## Viewport scale

The RPC receives map bounds and uses the PostGIS bounding operator against `geo`.

This avoids loading every point into the browser.

Current result cap is bounded to 10,000, with a default of 5,000.

At substantially higher scale the architecture can evolve to vector tiles/MVT without changing the canonical Location model.

## Browser boundary

GEO-06R remains service-role/backend-only because Auth/Organization browser-facing RLS is still pending.

No service-role key belongs in the browser.

A later UI should call an authenticated/backend gateway rather than granting broad map-table access to anonymous clients.

## Non-goals

GEO-06R does not:

- install a map renderer;
- deploy MapLibre;
- execute navigation;
- choose a production geocoder;
- bulk enrich customers;
- migrate production data;
- apply pending migrations;
- create seller ownership fields;
- create route planning.
