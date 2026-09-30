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
console.log('sales-execution-adapter: ok');
