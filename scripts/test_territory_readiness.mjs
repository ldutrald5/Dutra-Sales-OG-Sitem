import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const territory = require('../apps/sistema-og/services/territory-readiness-service.js');

const leads = [
  { id:'A', empresa:'Alpha', cidadeUf:'Maringá - PR', status:'novo', fleetSize:12 },
  { id:'B', empresa:'Beta', cidade:'Maringá', uf:'PR', endereco:'Av. Brasil, 100', status:'fechado', fleetSize:30 },
  { id:'C', empresa:'Gama', cidadeUf:'Cascavel/PR', status:'negociacao', fleetSize:20 },
  { id:'D', empresa:'Delta', cidadeUf:'Londrina', status:'novo' },
  { id:'E', empresa:'Epsilon', status:'novo' }
];

const a=territory.locationForLead(leads[0]);
assert.equal(a.city,'Maringá');
assert.equal(a.state,'PR');
assert.equal(a.label,'Maringá - PR');
assert.equal(a.readiness,'city_ready');

const b=territory.locationForLead(leads[1]);
assert.equal(b.readiness,'address_ready');

const d=territory.locationForLead(leads[3]);
assert.equal(d.city,'Londrina');
assert.equal(d.state,'');
assert.equal(d.readiness,'missing_state');

const summary=territory.summarize(leads);
assert.equal(summary.total,5);
assert.equal(summary.cityReady,3);
assert.equal(summary.addressReady,1);
assert.equal(summary.coveragePercent,60);
assert.equal(summary.topClusters[0].label,'Maringá - PR');
assert.equal(summary.topClusters[0].total,2);
assert.equal(summary.topClusters[0].customers,1);
assert.equal(summary.topClusters[0].prospects,1);
assert.equal(summary.topClusters[0].fleet,42);

const filtered=territory.filterByPlace(leads,'maringa|PR');
assert.deepEqual(filtered.map(item=>item.id),['A','B']);

const original=JSON.stringify(leads);
territory.summarize(leads);
assert.equal(JSON.stringify(leads),original,'territory readiness não pode mutar a carteira');

const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(html,/territory-readiness-service\.js/);
assert.match(sw,/territory-readiness-service\.js/);
assert.match(app,/OG_TERRITORY_READINESS\.summarize/);
assert.match(app,/data-prospect-territory/);
assert.ok(!app.includes('latitude =')&&!app.includes('longitude ='),'TERR-01A não pode inventar coordenadas');

console.log('TERR-01A territory readiness tests: PASS');
