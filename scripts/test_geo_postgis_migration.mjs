import assert from 'node:assert/strict';
import fs from 'node:fs';

const pending='supabase/pending/20261004213000_geo_postgis_locations_v1.sql';
const migration=fs.readFileSync(pending,'utf8');
const canonicalDir=fs.readdirSync('supabase/migrations');

assert.match(migration,/create extension if not exists postgis with schema extensions/i);
assert.match(migration,/create table if not exists public\.company_establishments/i);
assert.match(migration,/create table if not exists public\.company_locations/i);
assert.match(migration,/geo extensions\.geography\(Point,4326\)/i);
assert.match(migration,/using gist \(geo\)/i);
assert.match(migration,/company_locations_nearby_v1/i);
assert.match(migration,/company_locations_in_view_v1/i);
assert.match(migration,/enable row level security/i);
assert.match(migration,/revoke all on table public\.company_locations from anon, authenticated/i);
assert.match(migration,/grant select, insert, update, delete on table public\.company_locations to service_role/i);
assert.match(migration,/company_location establishment must belong to the same company/i);
assert.match(migration,/is_valid_cnpj_v1/i);
assert.match(migration,/REGISTERED_ADDRESS/);
assert.doesNotMatch(
  migration.match(/create table if not exists public\.company_locations \([\s\S]*?\n\);/i)?.[0] || '',
  /\blatitude\s+(?:numeric|double|real)|\blongitude\s+(?:numeric|double|real)/i,
  'company_locations table must not persist independent latitude/longitude columns'
);
assert.equal(
  canonicalDir.includes('20261004213000_geo_postgis_locations_v1.sql'),
  false,
  'pending GEO migration must not masquerade as already-applied history'
);

console.log('GEO-02R PostGIS migration static contract: PASS');
