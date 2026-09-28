import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const crm=require('../apps/sistema-og/services/crm-service.js');
const lifecycle=require('../apps/sistema-og/services/customer-lifecycle-service.js');

const base=crm.normalizeLead({
  id:'LEAD-LIFE-1',
  empresa:'Frota Pós Venda',
  status:'fechado',
  fleetSize:40,
  equippedVehicles:'',
  installationStatus:'pending',
  testStatus:'active',
  testEndsAt:'2026-10-01T12:00',
  satisfactionStatus:'',
  replacementReviewAt:'2026-11-01T09:00',
  referrals:[]
});
assert.equal(base.equippedVehicles,null,'ausência de quantidade equipada não pode virar zero');
assert.equal(base.installationStatus,'pending');
assert.equal(base.testStatus,'active');
assert.equal(base.satisfactionStatus,'');
assert.equal(crm.matchesSearch(base,'pending'),true);

const updated=crm.updateLeadProfile(base,{
  equippedVehicles:12,
  installationStatus:'completed',
  installationCompletedAt:'2026-09-28T10:30',
  testStatus:'completed',
  satisfactionStatus:'satisfied',
  referrals:[{name:'João',company:'Outra Frota',phone:'44999990000',note:'indicação'}]
},{now:'2026-09-28T13:30:00.000Z'});
assert.equal(updated.equippedVehicles,12);
assert.equal(updated.installationStatus,'completed');
assert.equal(updated.satisfactionStatus,'satisfied');
const diff=crm.diffProfile(base,updated);
for(const field of ['equippedVehicles','installationStatus','installationCompletedAt','testStatus','satisfactionStatus','referrals'])assert.ok(diff.includes(field),field+' precisa participar do diff auditável');

let counter=0;
const events=lifecycle.deriveEvents(base,updated,{
  now:'2026-09-28T13:30:00.000Z',
  idFactory:type=>'EV-'+(++counter)+'-'+type
});
const types=new Set(events.map(item=>item.type));
assert.ok(types.has('installation.completed'));
assert.ok(types.has('customer.satisfaction.confirmed'));
assert.ok(types.has('test.completed'));
assert.ok(types.has('referral.received'));
assert.equal(events.find(item=>item.type==='installation.completed').at,'2026-09-28T10:30:00.000Z');
assert.ok(events.every(item=>item.clientId==='LEAD-LIFE-1'));
assert.ok(events.every(item=>item.source==='client-sheet'));

const unchanged=lifecycle.deriveEvents(updated,{...updated},{now:'2026-09-28T14:00:00.000Z',idFactory:()=> 'NOOP-'+(++counter)});
assert.equal(unchanged.length,0,'salvar a mesma ficha não pode duplicar eventos de ciclo');

const cancelled=lifecycle.deriveEvents({...base,testStatus:'active'},{...base,testStatus:'cancelled'},{now:'2026-09-28T14:00:00.000Z',idFactory:()=> 'EV-CANCEL'});
assert.equal(cancelled[0].type,'test.cancelled');

const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
const signals=fs.readFileSync('apps/sistema-og/modules/signal-center.js','utf8');
assert.match(app,/PÓS-VENDA & EXPANSÃO/);
assert.match(app,/name="installationStatus"/);
assert.match(app,/name="equippedVehicles"/);
assert.match(app,/name="testEndsAt"/);
assert.match(app,/name="satisfactionStatus"/);
assert.match(app,/name="replacementReviewAt"/);
assert.match(app,/OG_CUSTOMER_LIFECYCLE\.deriveEvents/);
assert.match(html,/customer-lifecycle-service\.js/);
assert.match(sw,/customer-lifecycle-service\.js/);
assert.match(signals,/lead\.referrals\) && lead\.referrals\.length > 0/,'indicação cadastrada deve encerrar sinal de indicação pendente');

console.log('CIC-05 customer lifecycle facts tests: PASS');
