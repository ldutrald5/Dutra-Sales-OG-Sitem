# Pending Supabase changes

Files in this directory are **not part of the applied live migration history**.

They are reviewed candidates that require an explicit environment/rollout decision before promotion into `supabase/migrations/`.

Current pending items:

- `20260926233000_auth_organization_pilot.sql` — Auth + Organization + membership/RLS pilot; not applied to the current live backend.
- `20261004213000_geo_postgis_locations_v1.sql` — GEO-02R PostGIS + legal-establishment + physical-location persistence. Validated in disposable rollback-only replay, but not applied to production.
- `20261004221000_geo_company_registry_enrichment_v1.sql` — GEO-03R typed company-registry enrichment on the existing queue. Pending; no production provider calls or database mutation.
- `20261005193000_geo_location_geocoding_v1.sql` — GEO-05R safe LOCATION_GEOCODE enqueue/apply contract. Pending; no production geocoder is selected.
- `20261005200000_geo_map_read_manual_locations_v1.sql` — GEO-06R manual Location management, audit trail and commercial map viewport read model. Pending; no map UI or production migration.

Do not apply pending files automatically.
