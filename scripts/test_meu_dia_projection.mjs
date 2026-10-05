import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const mission = require('../apps/sistema-og/components/mission-control.js');
const crm = require('../apps/sistema-og/services/crm-service.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');
const owners = {
  salesDesk: require('../apps/sistema-og/modules/sales-desk.js'),
  intelligence: require('../apps/sistema-og/modules/lead-intelligence.js'),
  proposal: require('../apps/sistema-og/services/proposal-intelligence-service.js')
};
const now = new Date('2026-10-05T12:00:00Z');
const make = (id, fields = {}) => crm.normalizeLead({id, empresa:`QA ${id}`, status:'contatado', priority:'media', interactions:[], ...fields});
const urgent = make('URGENT', { priority:'alta', nextAction:'Ligar para confirmar diagnóstico', followUpAt:'2026-10-04T09:00', nextActionReason:'Retorno combinado' });
const today = make('TODAY', {nextAction:'Confirmar proposta', followUpAt:'2026-10-05T16:00'});
const upcoming = make('NEXT', {nextAction:'Revisar frota', followUpAt:'2026-10-07T09:00'});
const missing = make('MISSING');
const lost = make('LOST', {status:'perdido', nextAction:'Não executar ação antiga', followUpAt:'2026-10-01'});
const won = make('WON', {status:'fechado', nextAction:'Não executar ação antiga', followUpAt:'2026-10-01'});
const leads = [urgent, today, upcoming, missing, lost, won, {...urgent}];
const ops = {activityEvents:[
  {id:'SAVED', type:'proposal.prepared', clientId:'TODAY', proposalId:'P-SAVED', at:'2026-10-05T09:00Z'},
  {id:'WA', type:'whatsapp_opened', clientId:'TODAY', at:'2026-10-05T09:01Z'},
  {id:'SENT', type:'proposal.sent', source:'user_confirmed', clientId:'URGENT', proposalId:'P-SENT', at:'2026-10-05T09:00Z'},
  {id:'ACCEPT', type:'proposal.accepted', clientId:'URGENT', proposalId:'P-CLOSED', at:'2026-10-05T09:00Z'},
  {id:'LATER-OPEN', type:'proposal.opened', clientId:'URGENT', proposalId:'P-CLOSED', at:'2026-10-05T10:00Z'},
  {id:'MEETING', type:'call.saved', result:'reuniao_agendada', callSessionId:'CALL1', clientId:'TODAY', meeting:{scheduledAt:'2026-10-06T10:00', mode:'online'}, at:'2026-10-05T10:00Z'},
  {id:'OLD-MEETING', type:'call.saved', result:'reuniao_agendada', callSessionId:'CALL2', clientId:'NEXT', at:'2026-10-05T10:00Z'}
], tasks:[{id:'TASK', title:'Confirmar dado técnico', clientId:'URGENT', status:'open'}, {id:'DONE', title:'Concluída', status:'completed'}]};
const before = JSON.stringify({leads,ops});
const view = mission.project(leads, ops, owners, now);
assert.equal(JSON.stringify({leads,ops}), before, 'projection must never mutate domain');
assert.equal(view.population.length, 6);
assert.equal(view.queue.length, 4, 'CRM population must appear without source/list eligibility filters');
assert.equal(new Set(view.queue.map(item=>item.id)).size, view.queue.length);
assert.deepEqual(view.queue.map(item=>item.id), owners.salesDesk.selectQueue(leads.slice(0,6),'all','',now).map(item=>item.id));
assert.equal(view.now.lead.id, 'URGENT');
assert.equal(view.now.nba.score, owners.intelligence.score(urgent,now));
assert.equal(view.now.reason, 'Retorno combinado');
assert.equal(view.describe(missing).action, 'REVISAR / COMPLETAR CONTEXTO');
assert.equal(view.groups.overdue.length,1); assert.equal(view.groups.today.length,1); assert.equal(view.groups.upcoming.length,1);
assert.equal(view.meetings.length,2);
assert.equal(view.meetings.find(item=>item.id==='OLD-MEETING').scheduledAt,'','historical follow-up is not a meeting date');
assert.equal(view.proposals.length,2, 'terminal proposal cannot reopen due to later telemetry');
assert.equal(view.proposals.find(item=>item.proposalId==='P-SAVED').sent,false);
assert.equal(view.proposals.find(item=>item.proposalId==='P-SENT').sent,true);
assert.equal(view.tasks.length,1);
assert.match(mission.render(view),/envio não confirmado/);
// Same canonical mutation contracts used by the actual UI, result → next action → queue.
interactions.recordResult(urgent,'falar_depois','Retornar após diagnóstico',{now:now.toISOString()});
interactions.setNextAction(urgent,'Confirmar diagnóstico','2026-10-08T09:00',{now:now.toISOString()});
let after = mission.project(leads.slice(0,6),ops,owners,now);
assert.equal(after.groups.overdue.length,0);
assert.equal(after.queue.find(item=>item.id==='URGENT').nextAction,'Confirmar diagnóstico');
const refreshed = JSON.parse(JSON.stringify(leads.slice(0,6)));
assert.deepEqual(mission.project(refreshed,ops,owners,now).queue.map(item=>item.id),after.queue.map(item=>item.id));
interactions.recordResult(urgent,'venda','Venda confirmada',{now:now.toISOString()});
assert.equal(urgent.followUpAt,''); assert.equal(urgent.nextAction,'');
after = mission.project(leads.slice(0,6),ops,owners,now);
assert.ok(!after.queue.some(item=>item.id==='URGENT'));
assert.ok(!after.now || after.now.lead.id !== urgent.id, 'terminal clients never receive a Mission Control recommendation');
assert.equal(after.now.lead.id,'TODAY');
console.log('Meu Dia projection: identity/population/queue/NBA/terminal/follow-up/meetings/proposal facts/tasks/result/refresh PASS');
