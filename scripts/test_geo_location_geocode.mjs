import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/pending/20261005193000_geo_location_geocoding_v1.sql','utf8');
const worker=fs.readFileSync('supabase/functions/location-geocode/index.ts','utf8');

assert.match(migration,/company_location_address_fingerprint_v1/i);
assert.match(migration,/enqueue_location_geocode_job_v1/i);
assert.match(migration,/apply_location_geocode_v1/i);
assert.match(migration,/job_type\s*=\s*'LOCATION_GEOCODE'/i);
assert.match(migration,/proposal_id[\s\S]*?null[\s\S]*?'LOCATION_GEOCODE'/i,'location jobs must not join proposal pipeline');
assert.match(migration,/address_changed/i,'stale address fingerprint must block coordinate application');
assert.match(migration,/VERIFIED_BY_SELLER.*VERIFIED_BY_CUSTOMER.*VERIFIED_BY_VISIT/is);
assert.match(migration,/verified_geo_protected/i);
assert.match(migration,/extensions\.st_setsrid\(extensions\.st_point\(v_long,v_lat\),4326\)::extensions\.geography/i);
assert.match(migration,/geocode_confidence=v_confidence/i);
assert.match(migration,/geocode_provider=v_provider/i);

assert.match(worker,/GEOCODING_PROVIDER/);
assert.match(worker,/geocoding_provider_not_selected/,'worker must not silently pick a production provider');
assert.match(worker,/GEOAPIFY_API_KEY/);
assert.match(worker,/MAPBOX_ACCESS_TOKEN/);
assert.match(worker,/MAPBOX_PERMANENT_ALLOWED/);
assert.match(worker,/params\.set\("permanent", "true"\)/,'Mapbox writes require permanent geocoding');
assert.match(worker,/claim_enrichment_job_v2/);
assert.match(worker,/LOCATION_GEOCODE/);
assert.match(worker,/apply_location_geocode_v1/);
assert.match(worker,/fail_enrichment_job_v2/);
assert.doesNotMatch(worker,/maps\.googleapis\.com|nominatim\.openstreetmap\.org/i);
assert.doesNotMatch(worker,/proposal-engine|proposal-pdf|render/i,'location geocoding must not trigger proposal side effects');

console.log('GEO-05R location geocode worker static contract: PASS');
