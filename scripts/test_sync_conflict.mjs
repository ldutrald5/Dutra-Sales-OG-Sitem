import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sync=require('../apps/sistema-og/services/sync-conflict-service.js');
const safety=require('../apps/sistema-og/services/data-safety-service.js');
const model=require('../apps/sistema-og/operations-model.js');

const local={leads:[{id:'L1',empresa:'Local',updatedAt:'2026-09-26T10:00:00Z'},{id:'L2',empresa:'Só local'}],history:[],operations:model.createEmptyOperations('2026-09-26T10:00:00Z')};
local.operations.companies=[{id:'C1',entityType:'company',name:'Local',createdAt:'2026-09-26T09:00:00Z',updatedAt:'2026-09-26T10:00:00Z'}];
const remote={revision:8,leads:[{id:'L1',empresa:'Remoto',updatedAt:'2026-09-26T11:00:00Z'},{id:'L3',empresa:'Só remoto'}],history:[],operations:model.createEmptyOperations('2026-09-26T11:00:00Z')};
remote.operations.companies=[{id:'C1',entityType:'company',name:'Remoto',createdAt:'2026-09-26T09:00:00Z',updatedAt:'2026-09-26T11:00:00Z'}];

const conflict=sync.createConflict(local,7,remote);
assert.equal(conflict.type,'revision_conflict');
assert.equal(conflict.local.revision,7);
assert.equal(conflict.remote.revision,8);
assert.deepEqual(conflict.summary.leads,{onlyLocal:1,onlyRemote:1,different:1,same:0});
assert.equal(conflict.summary.operations.companies.different,1);
assert.notEqual(conflict.local.leads,local.leads,'snapshot deve ser cópia');
local.leads[0].empresa='Mutado depois';
assert.equal(conflict.local.leads[0].empresa,'Local','conflito deve preservar snapshot local');


const diffs=sync.differences(conflict);
assert.ok(diffs.some(row=>row.type==='leads'&&row.id==='L1'&&row.kind==='different'&&row.fields.includes('empresa')));
assert.ok(diffs.some(row=>row.type==='leads'&&row.id==='L2'&&row.kind==='only_local'));
assert.ok(diffs.some(row=>row.type==='leads'&&row.id==='L3'&&row.kind==='only_remote'));
assert.ok(diffs.some(row=>row.type==='companies'&&row.id==='C1'&&row.kind==='different'&&row.fields.includes('name')));

const review=sync.mergeForReview(conflict,safety,model);
assert.equal(review.revision,8,'merge para revisão usa revisão remota atual');
assert.deepEqual(new Set(review.leads.map(x=>x.id)),new Set(['L1','L2','L3']));
assert.equal(review.leads.find(x=>x.id==='L1').empresa,'Remoto','regra determinística existente preserva registro mais recente');
assert.equal(review.operations.companies.find(x=>x.id==='C1').name,'Remoto');
assert.equal(conflict.local.leads.find(x=>x.id==='L1').empresa,'Local','merge não deve mutar snapshot do conflito');
assert.throws(()=>sync.mergeForReview({},safety,model),/inválido/);
console.log('Sync conflict service tests: PASS');