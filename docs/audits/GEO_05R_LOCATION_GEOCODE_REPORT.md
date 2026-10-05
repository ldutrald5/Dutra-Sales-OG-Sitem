# GEO-05R — Location Geocode Worker Report

## Status

**PASS — SAFE GEOCODE WORKER + ROLLBACK-ONLY REPLAY GREEN**

## Delivered

- address fingerprint helper;
- idempotent LOCATION_GEOCODE enqueue;
- delayed-result stale-address protection;
- verified-coordinate overwrite protection;
- controlled geocode application RPC;
- PostGIS point persistence;
- Geoapify adapter;
- Mapbox Permanent adapter;
- explicit no-default-provider gate;
- retry-aware failure handling;
- normalized-only provider result persistence;
- provider attribution/provenance metadata;
- static worker contract;
- rollback-only database assertions;
- dedicated local Supabase replay workflow.

## Important design decision

GEO-05R does not promote Geoapify merely because it is currently the lower-cost favorite.

The worker refuses to run until `GEOCODING_PROVIDER` is explicitly selected after GEO-04R has adequate ground truth.

## Production impact

None.

- no pending migration applied;
- no Edge Function deployed;
- no API key created;
- no provider request executed;
- no customer coordinate written;
- no Railway change.

## Replay assertions

The disposable replay verifies:

1. typed geocode job with `proposal_id = null`;
2. successful high-confidence point application;
3. PostGIS geo/provenance fields;
4. stale-address result rejection;
5. human-verified existing coordinate protection;
6. high-confidence geocode augmentation for a verified address with no coordinates;
7. preservation of human verification status.

## Test evidence

Validated branch head before this report update: `efc7d8df2a6da760f44284dd68835e1912e1c54b`.

- GEO Location Geocode Replay run `37362561337`: **PASS**
  - static worker contract: PASS;
  - GEO-04 quality contract: PASS;
  - disposable Supabase startup: PASS;
  - canonical + GEO-02 + GEO-03 + GEO-05 tail: PASS;
  - PostGIS application/stale/protection assertions: PASS;
  - rollback/shutdown: PASS.
- Package 00R:
  - npm ci: PASS;
  - lockfile integrity: PASS;
  - npm run validate: PASS;
  - Builder Brain: PASS;
  - security test: PASS;
  - overall legacy workflow remains red only on the known upstream AIOX/`braces` npm-audit advisory.

## Next step after green replay

GEO-06R should build the map read model and manual Location management so the product can use verified/approximate points without waiting for bulk automatic geocoding.
