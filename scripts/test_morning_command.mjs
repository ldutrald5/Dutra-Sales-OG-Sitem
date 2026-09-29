import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const morning=require('../apps/sistema-og/services/morning-command-service.js');
const salesDesk=require('../apps/sistema-og/modules/sales-desk.js');
const intelligence=require('../apps/sistema-og/modules/lead-intelligence.js');
const signals=require('../apps/sistema-og/modules/signal-center.js');
const automation=require('../apps/sistema-og/services/automation-engine-service.js');
const operationsModel=require('../apps/sistema-og/operations-model.js');

const now=new Date('2026-09-28T15:00:00.000Z');
const leads=[
  {id:'L1',empresa:'Vencida',status:'negociacao',priority:'alta',followUpAt:'2026-09-27T12:00:00.000Z',nextAction:'Ligar',updatedAt:'2026-09-20T12:00:00.000Z',fleetSize:40,decisionMaker:'Ana',pain:'Desgaste',interactions:[]},
  {id:'L2',empresa:'Hoje',status:'novo',priority:'media',followUpAt:'2026-09-28T18:00:00.000Z',nextAction:'Retornar',nextActionReason:'Cliente pediu retorno',nextActionObjective:'Validar teste',nextActionExpectedResult:'Definir próximo passo',updatedAt:'2026-09-28T10:00:00.000Z',interactions:[]},
  {id:'L3',empresa:'Sem ação',status:'negociacao',priority:'media',followUpAt:'',nextAction:'',updatedAt:'2026-09-18T10:00:00.000Z',decisionMaker:'Carlos',pain:'Pressão',interactions:[]},
  {id:'L4',empresa:'Fechada',status:'fechado',conversationStage:'customer',priority:'alta',followUpAt:'2026-09-27T10:00:00.000Z',nextAction:'',updatedAt:'2026-09-27T10:00:00.000Z',interactions:[]}
];
const before=JSON.stringify(leads);
const ops=operationsModel.createEmptyOperations('2026-09-28T14:00:00.000Z');
ops.activityEvents.push({id:'P1',type:'proposal.sent',at:'2026-09-27T14:00:00.000Z',clientId:'L1',proposalId:'PROP-1'});

const report=morning.build({leads,operations:ops,now},{
  salesDesk,
  leadIntelligence:intelligence,
  signalCenter:signals,
  automationEngine:automation
});
assert.equal(report.counts.active,3);
assert.equal(report.counts.overdue,1);
assert.equal(report.counts.today,1);
assert.equal(report.counts.commitments,1);
assert.equal(report.counts.commitmentToday,1);
assert.equal(report.commitments[0].leadId,'L2');
assert.equal(report.commitments[0].objective,'Validar teste');
assert.equal(report.counts.priority,1);
assert.ok(report.counts.noAction>=1);
assert.ok(report.mission);
assert.equal(report.calendar.connected,false);
assert.match(report.calendar.note,/não conectada/i);
assert.ok(report.topAccounts.length>0);
assert.equal(JSON.stringify(leads),before,'Morning Command não pode mutar leads');

const withCalendar=morning.build({
  leads,
  operations:ops,
  now,
  calendarConnected:true,
  calendarEvents:[{id:'CAL-1',summary:'Reunião comercial',start:'2026-09-28T17:00:00Z'}]
},{salesDesk,leadIntelligence:intelligence,signalCenter:signals,automationEngine:automation});
assert.equal(withCalendar.counts.calendar,1);
assert.equal(withCalendar.calendar.events[0].title,'Reunião comercial');

const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(html,/id="btn-morning-command"/);
assert.match(html,/id="morning-command-panel"/);
assert.match(html,/morning-command-service\.js/);
assert.match(app,/function runMorningCommand/);
assert.match(app,/OG_COMMAND_CORE\.routeMission/);
assert.match(app,/OG_COMMAND_EXECUTION\.startMission/);
assert.match(app,/OG_MORNING_COMMAND\.build/);
assert.match(app,/DUTRA, COMEÇA MEU DIA/);
assert.match(sw,/morning-command-service\.js/);

console.log('DUTRA-DAY-01 Morning Command: PASS');
