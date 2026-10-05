import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);

const pairs=[
  ['apps/sistema-og/services/connection-state-service.js','preview-v2/p0-services/connection-state-service.js'],
];

for(const [canonical,mirror] of pairs){
  const a=fs.readFileSync(new URL('../'+canonical,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  const b=fs.readFileSync(new URL('../'+mirror,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  assert.equal(b,a,mirror+' deve permanecer byte-a-byte equivalente ao serviço canônico '+canonical);
}

const server=fs.readFileSync(new URL('../preview-v2/server.mjs',import.meta.url),'utf8');
assert.match(server,/path\.join\(dir, 'p0-services', 'connection-state-service\.js'\)/);
assert.match(server,/path\.join\(dir, 'p0-services', 'sync-bridge-service\.js'\)/);

console.log('V3 P0 deploy mirror parity: PASS');

// Stage 1 preserves MAIN IndexedDB v2 and the isolated V3 IndexedDB v3 artifact.
// They are intentionally not wired together until persistence convergence.
const mainSync=require('../apps/sistema-og/services/sync-bridge-service.js');
const v3Module={exports:{}};
vm.runInNewContext(fs.readFileSync(new URL('../preview-v2/p0-services/sync-bridge-service.js',import.meta.url),'utf8'),{module:v3Module});
const v3Sync=v3Module.exports;
assert.equal(mainSync.DB_VERSION,2,'Stage 1 must preserve MAIN persistence version');
assert.equal(v3Sync.DB_VERSION,3,'preserved V3 persistence candidate must retain mutations');
for(const key of ['DB_NAME','OUTBOX_STORE','RECOVERY_STORE']) assert.equal(v3Sync[key],mainSync[key]);
for(const api of ['queueState','readQueuedState','clearQueuedState','saveConflict','loadConflict','saveReview','loadReview']) {
  assert.equal(typeof mainSync[api],'function');
  assert.equal(typeof v3Sync[api],'function');
}
for(const sync of [mainSync,v3Sync]) {
  const body={revision:7,leads:[{id:'L1'}]};
  const record=sync.createQueuedRecord(body,{now:'2026-10-05T00:00:00Z'});
  body.leads[0].id='changed';
  assert.equal(record.body.leads[0].id,'L1','snapshot must preserve an independent copy');
  assert.throws(()=>sync.createQueuedRecord({revision:-1}),/Revisão/);
}
const mutation=v3Sync.createMutationRecord({id:'M1',action:'SCHEDULE_NEXT_ACTION',idempotencyKey:'task:T1'},{now:'2026-10-05T00:00:00Z'});
assert.equal(mutation.status,'PENDING');
assert.equal(mutation.idempotencyKey,'task:T1');
const v3Source=fs.readFileSync(new URL('../preview-v2/p0-services/sync-bridge-service.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
assert.equal(crypto.createHash('sha256').update(v3Source).digest('hex'),'56d08ea6930b572504a1f9a303048658919230aade752fb3eb21f7e60211e8e0','Stage 1 must retain the exact reviewed V3 sync artifact');
console.log('Stage 1 MAIN/V3 isolated sync compatibility and preservation: PASS');
