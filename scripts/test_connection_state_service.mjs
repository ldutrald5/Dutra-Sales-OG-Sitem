import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const connection=require('../apps/sistema-og/services/connection-state-service.js');

assert.deepEqual(connection.STATUSES,['CONNECTING','CONNECTED','OFFLINE','SYNCING','ERROR']);
assert.equal(connection.snapshot().status,'CONNECTING');

const observed=[];
const unsubscribe=connection.subscribe(value=>observed.push(value),{immediate:false});

connection.transition('CONNECTED',{lastSyncedAt:'2026-09-30T03:00:00Z'});
assert.equal(connection.snapshot().status,'CONNECTED');

connection.setPendingCount(2);
connection.beginSave({mutationId:'M1',label:'Próxima ação',now:'2026-09-30T03:01:00Z'});
assert.equal(connection.snapshot().status,'SYNCING');
assert.equal(connection.snapshot().save.phase,'SAVING');
assert.equal(connection.snapshot().pendingCount,2);

connection.saveQueued({mutationId:'M1',pendingCount:2,now:'2026-09-30T03:01:05Z'});
assert.equal(connection.snapshot().status,'OFFLINE');
assert.equal(connection.snapshot().save.phase,'QUEUED');
assert.equal(connection.snapshot().save.retryable,true);

connection.saveFailed({mutationId:'M1',pendingCount:2,error:'backend',now:'2026-09-30T03:01:10Z'});
assert.equal(connection.snapshot().status,'ERROR');
assert.equal(connection.snapshot().save.phase,'FAILED');
assert.equal(connection.snapshot().save.message,'TENTAR NOVAMENTE');

connection.saveSucceeded({mutationId:'M1',pendingCount:0,now:'2026-09-30T03:02:00Z'});
assert.equal(connection.snapshot().status,'CONNECTED');
assert.equal(connection.snapshot().save.phase,'SAVED');
assert.equal(connection.snapshot().save.message,'SALVO ✓');
assert.equal(connection.snapshot().pendingCount,0);
assert.equal(connection.snapshot().lastSyncedAt,'2026-09-30T03:02:00.000Z');

assert.throws(()=>connection.transition('UNKNOWN'),/inválido/);
unsubscribe();
assert.ok(observed.length>=5);

console.log('Connection state service tests: PASS');
