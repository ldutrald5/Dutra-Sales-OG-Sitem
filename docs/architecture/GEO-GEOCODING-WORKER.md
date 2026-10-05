# GEO-05R — Safe Location Geocoding Worker

## Status

Implemented as a pending/backend package. No production geocoder is selected and no provider call is performed by CI.

## Principle

Geocoding may enrich a known Location. It must never become a second address authority.

The address remains in `company_locations`; PostGIS `geo` remains the canonical coordinate field.

## Queue

GEO-05R uses the existing typed `enrichment_jobs` queue from GEO-03R.

Job type:

`LOCATION_GEOCODE`

A geocode job always has:

- `proposal_id = null`;
- company id inherited from the Location;
- location id;
- deterministic address fingerprint;
- address snapshot;
- active-job idempotency key.

It cannot be consumed by `company-discovery`.

## Address fingerprint

`company_location_address_fingerprint_v1(location_id)`

Fingerprint input includes:

- country;
- state;
- city;
- postal code;
- street;
- number;
- complement;
- district;
- formatted address;
- raw address.

If the address changes after the job is queued, the result is recorded as stale and coordinates are not applied.

This prevents delayed workers from attaching yesterday's coordinates to today's corrected address.

## Provider selection

The worker intentionally has **no default provider**.

`GEOCODING_PROVIDER` must explicitly be one of:

- `geoapify`
- `mapbox_permanent`

If unset, the worker fails with `geocoding_provider_not_selected`.

That gate remains until the GEO-04R Brazil benchmark has sufficient manually verified ground truth.

## Geoapify

Requires server-side:

`GEOAPIFY_API_KEY`

The worker uses structured Brazilian address input when available and limits results before applying DUTRA's internal scoring.

## Mapbox Permanent

Requires:

- `MAPBOX_ACCESS_TOKEN`;
- `MAPBOX_PERMANENT_ALLOWED=1`.

Every request sets:

`permanent=true`

Temporary Mapbox results are not accepted by this worker for canonical persistence.

## Quality application

The worker imports the GEO-04R provider-neutral scoring contract.

It sends only the normalized best candidate to the database:

- provider;
- provider reference;
- latitude/longitude;
- canonical precision;
- internal confidence;
- provider signal;
- component score;
- verification decision;
- attribution.

Raw provider payloads are not written to the canonical Location.

## Persistence

`apply_location_geocode_v1` converts coordinates to:

`extensions.geography(Point,4326)`

and writes:

- `geo`;
- `geocode_provider`;
- `geocode_provider_ref`;
- `geocoded_at`;
- `geocode_precision`;
- `geocode_confidence`;
- provenance metadata/attribution.

Independent lat/lng columns are still forbidden.

## Human verification protection

### Verified Location with coordinates

Automatic re-geocoding is skipped.

Reason:

`verified_geo_protected`

### Verified address without coordinates

A provider coordinate may be added only when the GEO-04R quality contract marks the candidate `AUTO_ACCEPTED`.

The existing human status is preserved, for example:

`VERIFIED_BY_VISIT`

is not converted to `AUTO_ACCEPTED`.

### Unverified Location

Provider results may write the point and preserve the derived quality state:

- AUTO_ACCEPTED;
- NEEDS_REVIEW;
- UNVERIFIED.

Approximate points therefore remain distinguishable from trusted points.

## Stale-result protection

Before writing, the apply RPC recomputes the address fingerprint.

If it differs from the queued fingerprint:

- no coordinate is written;
- job completes as stale;
- output records expected/current fingerprints.

## Retry economics

The worker uses GEO-03R `fail_enrichment_job_v2`:

- 429 → retry;
- 5xx → retry;
- network/timeout → retry;
- invalid config/address/definitive provider error → no wasteful retry.

## Security

- provider keys remain Edge Function environment variables;
- internal service authorization is mandatory;
- no privileged key reaches the browser;
- no Google/Public Nominatim endpoint is built into the worker.

## Production gate

This package is not permission to deploy.

Before production:

1. GEO-04R provider benchmark reaches its ground-truth threshold;
2. provider is explicitly selected;
3. required secret is configured server-side;
4. GEO-02R/GEO-03R/GEO-05R pending migrations are promoted in a controlled rollout;
5. a small canary batch is reviewed manually;
6. only then may broader backfill start.
