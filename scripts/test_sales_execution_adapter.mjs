import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const adapter = require('../apps/sistema-og/services/sales-execution-adapter.js');

const lead = { id:'L-1', empresa:'ACME', nome:'Ana', cargo:'Frota', status:'novo', interactions:[{at:'1'},{at:'2'}] };
const env = adapter.fromLegacyLead(lead);
assert.equal(env.company.legacyLeadId, 'L-1');
assert.equal(env.contact.name, 'Ana');

const projected = adapter.toCallAiLead({
  company:{ id:'c1', legacy_lead_id:'L-1', name:'ACME' },
  contact:{ id:'p1', name:'Ana', role_category:'FLEET_MANAGER' },
  opportunity:{ id:'o1', pipeline_stage:'QUALIFIED', next_action:'Agendar reunião' },
  session:{ id:'s1' },
  recentActivities:[{ type:'call', result:'connected' }]
}, lead);
assert.equal(projected.salesExecution.companyId, 'c1');
assert.equal(projected.status, 'QUALIFIED');
assert.equal(projected.cargo, 'FLEET_MANAGER');

const q = adapter.queueProjection([
 {id:'3',work_status:'WORKED',position:1},
 {id:'2',work_status:'AVAILABLE',position:2},
 {id:'1',work_status:'IN_PROGRESS',position:1}
]);
assert.deepEqual(q.map(x=>x.id), ['1','2']);
const accountEnvelope=adapter.projectAccountContext({
  company:{id:'c1',name:'Transportes X',legacy_lead_id:'L-9',city:'Maringá',state:'PR'},
  contacts:[{id:'p1',full_name:'Carlos',decision_level:'decision_maker',role_category:'FLEET_MANAGER',phone_e164:'5544999999999'}],
  opportunities:[{id:'o1',pipeline_stage:'QUALIFIED',next_action:'Agendar reunião'}],
  recentActivities:[{id:'a1',activity_type:'call',description:'Contato realizado',created_at:'2026-09-30T00:00:00Z'}],
  briefings:[{id:'b1',processing_status:'READY'}]
},{id:'m1',list_id:'l1',company_id:'c1',primary_contact_id:'p1',work_status:'IN_PROGRESS'},{id:'s1',list_id:'l1'});
const callLead=adapter.toCallAiLead(accountEnvelope,{});
assert.equal(callLead.id,'L-9');
assert.equal(callLead.nome,'Carlos');
assert.equal(callLead.salesExecution.listMemberId,'m1');
assert.equal(callLead.salesExecution.sessionId,'s1');
assert.equal(callLead.interactions[0].note,'Contato realizado');
console.log('sales-execution-adapter: ok');
