import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';

const require=createRequire(import.meta.url);
const bridge=require('../apps/sistema-og/services/sync-bridge-service.js');

const queued=bridge.createQueuedRecord(
  {revision:7,leads:[{id:'L1'}],history:[],operations:{}},
  {now:'2026-09-26T23:00:00Z'}
);
assert.equal(queued.url,'/api/state');
assert.equal(queued.method,'PUT');
assert.equal(queued.queuedAt,'2026-09-26T23:00:00.000Z');
assert.equal(queued.body.revision,7);
assert.equal(Object.prototype.hasOwnProperty.call(queued,'headers'),false,'outbox não deve persistir headers/tokens');
assert.throws(()=>bridge.createQueuedRecord({revision:-1}),/Revisão/);
assert.throws(()=>bridge.createQueuedRecord(null),/Payload/);
assert.equal(bridge.DB_VERSION,3);
assert.equal(bridge.OUTBOX_STORE,'outbox');
assert.equal(bridge.RECOVERY_STORE,'recovery');
assert.equal(bridge.MUTATION_STORE,'mutations');

const mutation=bridge.createMutationRecord({
  id:'M1',
  idempotencyKey:'lead:L1:next-action:A1',
  action:'SCHEDULE_NEXT_ACTION',
  entityType:'lead',
  entityId:'L1',
  label:'Próxima ação',
  metadata:{source:'v3'}
},{now:'2026-09-30T03:10:00Z'});
assert.equal(mutation.id,'M1');
assert.equal(mutation.status,'PENDING');
assert.equal(mutation.type,'SCHEDULE_NEXT_ACTION');
assert.deepEqual(mutation.payload,{});
assert.equal(mutation.attempts,0);
assert.equal(mutation.idempotencyKey,'lead:L1:next-action:A1');
assert.equal(mutation.metadata.source,'v3');
const businessMutation=bridge.createMutationRecord({
  id:'M-BIZ-1',
  idempotencyKey:'interaction:INT-1',
  action:'interaction.recorded',
  type:'INTERACTION_RECORDED',
  entityType:'lead',
  entityId:'L1',
  payload:{leadId:'L1',interactionId:'INT-1',note:'Falou com decisor'}
},{now:'2026-09-30T03:10:30Z'});
assert.equal(businessMutation.status,'PENDING');
assert.equal(businessMutation.type,'INTERACTION_RECORDED');
assert.equal(businessMutation.payload.interactionId,'INT-1');
assert.throws(()=>bridge.createMutationRecord({}),/action/);

const queuedWithMutation=bridge.createQueuedRecord(
  {revision:8,leads:[],history:[],operations:{}},
  {id:'STATE-1',mutationIds:['M1','M1','M2'],now:'2026-09-30T03:11:00Z'}
);
assert.equal(queuedWithMutation.id,'STATE-1');
assert.deepEqual(queuedWithMutation.mutationIds,['M1','M2']);

const sw=fs.readFileSync(new URL('../apps/sistema-og/service-worker.js',import.meta.url),'utf8');
assert.ok(sw.includes("type: 'OG_SYNC_OUTBOX_READY'"),'service worker deve entregar outbox ao foreground');
assert.ok(!sw.includes("fetch(pending.url"),'service worker não pode enviar outbox sem sessão/autorização do foreground');
assert.ok(sw.includes('SYNC_DB_VERSION = 3'),'service worker e app devem compartilhar versão do IndexedDB');
assert.ok(sw.includes("SYNC_MUTATION_STORE = 'mutations'"),'service worker deve preservar o store granular de mutations');

console.log('Sync bridge service tests: PASS');