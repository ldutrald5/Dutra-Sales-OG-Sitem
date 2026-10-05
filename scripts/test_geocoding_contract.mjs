import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  benchmarkCase,
  haversineMeters,
  normalizeGeoapifyResult,
  normalizeMapboxResult,
  scoreGeocodeCandidate,
  selectBestGeocode,
} from '../supabase/functions/_shared/geocoding.mjs';

const input={
  street:'Avenida Brasil',
  number:'1000',
  postalCode:'87000000',
  city:'Maringá',
  state:'PR',
  countryCode:'BR'
};

const geoapify=normalizeGeoapifyResult({
  place_id:'geo-1',
  lat:-23.42,
  lon:-51.93,
  formatted:'Avenida Brasil 1000, Maringá, PR, Brasil',
  street:'Avenida Brasil',
  housenumber:'1000',
  postcode:'87000-000',
  city:'Maringá',
  state_code:'PR',
  country_code:'br',
  result_type:'building',
  rank:{confidence:0.98,match_type:'full_match'},
  datasource:{attribution:'© OpenStreetMap contributors'}
});
assert.equal(geoapify.precision,'ADDRESS');
assert.equal(geoapify.postalCode,'87000000');
const geoScore=scoreGeocodeCandidate(input,geoapify);
assert.equal(geoScore.verificationStatus,'AUTO_ACCEPTED');
assert.ok(geoScore.internalConfidence>0.9);

const mapbox=normalizeMapboxResult({
  geometry:{coordinates:[-51.9301,-23.4201]},
  properties:{
    mapbox_id:'mbx-1',
    feature_type:'address',
    full_address:'Avenida Brasil 1000, Maringá, Paraná, Brasil',
    coordinates:{longitude:-51.9301,latitude:-23.4201,accuracy:'rooftop'},
    match_code:{confidence:'exact'},
    context:{
      address:{address_number:'1000',street_name:'Avenida Brasil'},
      street:{name:'Avenida Brasil'},
      postcode:{name:'87000-000'},
      place:{name:'Maringá'},
      region:{region_code:'PR',name:'Paraná'},
      country:{country_code:'BR',name:'Brasil'}
    }
  }
});
assert.equal(mapbox.precision,'ROOFTOP');
assert.equal(scoreGeocodeCandidate(input,mapbox).verificationStatus,'AUTO_ACCEPTED');

const wrongCity={...geoapify,city:'Londrina'};
const wrongScore=scoreGeocodeCandidate(input,wrongCity);
assert.ok(wrongScore.internalConfidence<=0.49);
assert.notEqual(wrongScore.verificationStatus,'AUTO_ACCEPTED');

const streetOnly={...geoapify,number:null,precision:'STREET',providerConfidence:0.9};
const selected=selectBestGeocode(input,[streetOnly,geoapify]);
assert.equal(selected.candidate.providerRef,'geo-1');

const distance=haversineMeters({lat:-23.42,lng:-51.93},{lat:-23.4201,lng:-51.9301});
assert.ok(distance>0&&distance<30);
const bench=benchmarkCase(input,geoapify,{lat:-23.4201,lng:-51.9301,toleranceMeters:50});
assert.equal(bench.withinTolerance,true);

const runner=fs.readFileSync('scripts/run_geocoder_benchmark.mjs','utf8');
assert.match(runner,/permanent','true'/,'Mapbox benchmark must explicitly request permanent storage rights');
assert.match(runner,/MAPBOX_PERMANENT_ALLOWED!=='1'/,'billable Mapbox permanent calls need explicit opt-in');
assert.match(runner,/GEOAPIFY_API_KEY/);
assert.doesNotMatch(runner,/maps\.googleapis\.com|nominatim\.openstreetmap\.org/i,'restricted/public geocoders must not be benchmark execution providers');

const dry=spawnSync(process.execPath,[
  'scripts/run_geocoder_benchmark.mjs',
  '--dry-run',
  '--fixture=scripts/geocoding/benchmark-br.template.json'
],{encoding:'utf8'});
assert.equal(dry.status,0,dry.stderr||dry.stdout);
const parsed=JSON.parse(dry.stdout);
assert.equal(parsed.dryRun,true);
assert.equal(parsed.selectionReady,false,'template data must never produce a provider decision');

console.log('GEO-04R geocoding quality contract: PASS');
