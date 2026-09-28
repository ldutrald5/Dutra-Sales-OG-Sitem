import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const core=require('../apps/sistema-og/services/command-core-service.js');
const execution=require('../apps/sistema-og/services/command-execution-service.js');
const operationsModel=require('../apps/sistema-og/operations-model.js');

let ops=operationsModel.createEmptyOperations('2026-09-28T20:00:00-03:00');
const route=core.routeMission({
  id:'MISSION-1',
  capability:'day.prepare',
  accountId:'LEAD-1',
  requestedBy:'lucas',
  payload:{query:'começa meu dia',authorization:'Bearer segredo'}
});
ops=execution.startMission(ops,route,{operationsModel,now:'2026-09-28T20:01:00-03:00',eventId:'CMD-START-1'});
const start=ops.activityEvents.find(item=>item.id==='CMD-START-1');
assert.equal(start.type,'command.mission.started');
assert.equal(start.agentId,'account-analyst');
assert.equal(start.payload.authorization,'[redacted]');

ops=execution.finishMission(ops,{
  missionId:'MISSION-1',
  accountId:'LEAD-1',
  capability:'day.prepare',
  agentId:'account-analyst',
  summary:'Fila do dia preparada',
  result:{count:4,token:'não-logar'}
},{operationsModel,now:'2026-09-28T20:02:00-03:00',eventId:'CMD-END-1'});
assert.equal(ops.activityEvents.find(item=>item.id==='CMD-END-1').result.token,'[redacted]');
assert.equal(execution.executionLog(ops)[0].status,'completed');

const externalAction={type:'email.send',autonomy:core.AUTONOMY.EXTERNAL_WRITE,external:true,to:'cliente@example.com'};
ops=execution.requestApproval(ops,externalAction,{missionId:'MISSION-1',accountId:'LEAD-1',password:'x'},{
  operationsModel,
  commandCore:core,
  now:'2026-09-28T20:03:00-03:00',
  approvalId:'APPROVAL-1'
});
let pending=execution.pendingApprovals(ops);
assert.equal(pending.length,1);
assert.equal(pending[0].id,'APPROVAL-1');
assert.equal(pending[0].context.password,'[redacted]');
assert.throws(()=>execution.requestApproval(ops,{type:'draft',autonomy:core.AUTONOMY.PREPARE},{},{operationsModel,commandCore:core}),/não exige aprovação/);

ops=execution.resolveApproval(ops,'APPROVAL-1','approved',{
  operationsModel,
  now:'2026-09-28T20:04:00-03:00',
  resolvedBy:'lucas'
});
pending=execution.pendingApprovals(ops);
assert.equal(pending.length,0);
assert.throws(()=>execution.resolveApproval(ops,'APPROVAL-1','approved',{operationsModel}),/não encontrada/);

const adapter=execution.createAdapter({
  id:'mail-fixture',
  operations:['read','prepare','execute'],
  read:async input=>({subject:input.subject}),
  prepare:async input=>({draft:input}),
  execute:async input=>({sent:true,input}),
  health:async()=>({ok:true})
});
assert.deepEqual(await execution.invokeAdapter(adapter,'health',{}),{ok:true});
assert.deepEqual(await execution.invokeAdapter(adapter,'read',{subject:'x'}),{subject:'x'});
await assert.rejects(()=>execution.invokeAdapter(adapter,'execute',{to:'x'}),/aprovação explícita/);
assert.equal((await execution.invokeAdapter(adapter,'execute',{to:'x'},{approved:true})).sent,true);

const unsupported=core.routeMission({id:'MISSION-X',capability:'unknown.capability'});
ops=execution.startMission(ops,unsupported,{operationsModel,now:'2026-09-28T20:05:00-03:00',eventId:'CMD-UNSUPPORTED'});
assert.equal(ops.activityEvents.find(item=>item.id==='CMD-UNSUPPORTED').type,'command.mission.unsupported');

const validation=operationsModel.validateOperations(ops);
assert.equal(validation.valid,true,'event-sourced Command Core must preserve operations schema');

const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(html,/command-execution-service\.js/);
assert.match(sw,/command-execution-service\.js/);

console.log('DUTRA-CORE-02 execution log + approval queue: PASS');
