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
assert.equal(bridge.DB_VERSION,2);
assert.equal(bridge.OUTBOX_STORE,'outbox');
assert.equal(bridge.RECOVERY_STORE,'recovery');

const sw=fs.readFileSync(new URL('../apps/sistema-og/service-worker.js',import.meta.url),'utf8');
assert.ok(sw.includes("type: 'OG_SYNC_OUTBOX_READY'"),'service worker deve entregar outbox ao foreground');
assert.ok(!sw.includes("fetch(pending.url"),'service worker não pode enviar outbox sem sessão/autorização do foreground');
assert.ok(sw.includes('SYNC_DB_VERSION = 2'),'service worker e app devem compartilhar versão do IndexedDB');

console.log('Sync bridge service tests: PASS');