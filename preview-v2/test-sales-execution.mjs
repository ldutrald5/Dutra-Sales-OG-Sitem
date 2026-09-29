import assert from 'node:assert/strict';
await import('./sales-execution-service.js');
const s=globalThis.DUTRA_SALES_EXECUTION;
assert.ok(s,'Sales Execution service must attach');

const base=Array.from({length:60},(_,i)=>({
  empresa:'Conta '+(i+1),
  cnpj:String(10000000000000+i),
  telefone:'+55449999'+String(1000+i).padStart(4,'0'),
  cidadeUf:'Maringá - PR',
  relationshipStatus:i===0?'CUSTOMER':'COLD',
  interactions:[]
}));

// CASE A — 60 contacts, no answer, auto-next is available.
let imported=s.importRows([],{}, {name:'Lista A',source:'test'}, base, new Date('2026-09-29T12:00:00Z'));
assert.equal(imported.total,60);
let started=s.startSession(imported.operations,imported.list.id,60,'seller-1',new Date('2026-09-29T12:05:00Z'));
let first=s.nextMember(started.operations,started.session);
started.session.currentMemberId=first.id;
first.workStatus='IN_PROGRESS';
let outcome=s.recordOutcome(imported.leads,started.operations,started.session.id,first.id,'NO_ANSWER',{},new Date('2026-09-29T12:06:00Z'));
assert.equal(outcome.session.attemptedCalls,1);
assert.equal(outcome.member.workStatus,'WORKED');
assert.notEqual(s.nextMember(outcome.operations,outcome.session)?.id,first.id);
assert.equal(outcome.lead.relationshipStatus,'CUSTOMER','não atendimento deve preservar o relacionamento existente');

// CASE B — gatekeeper and decision maker coexist.
let c1=s.addContact(outcome.operations,outcome.lead.id,{name:'Ana',role:'Recepção',phone:'(44) 99999-1111',roleCategory:'GATEKEEPER'},new Date('2026-09-29T12:07:00Z'));
let c2=s.addContact(c1.operations,outcome.lead.id,{name:'Marcos',role:'Gestor de Frota',phone:'(44) 99999-2222',roleCategory:'FLEET_MANAGER',influenceLevel:4},new Date('2026-09-29T12:08:00Z'));
const people=c2.operations.contacts.filter(c=>c.leadId===outcome.lead.id);
assert.equal(people.length,2);
assert.ok(people.some(c=>c.name==='Ana'&&c.roleCategory==='GATEKEEPER'));
assert.ok(people.some(c=>c.name==='Marcos'&&c.roleCategory==='FLEET_MANAGER'));

// CASE C — qualified -> meeting record.
const member2=s.nextMember(c2.operations,outcome.session);
outcome.session.currentMemberId=member2.id;
member2.workStatus='IN_PROGRESS';
let qualified=s.recordOutcome(outcome.leads,c2.operations,outcome.session.id,member2.id,'QUALIFIED',{contactId:people.find(c=>c.name==='Marcos').id},new Date('2026-09-29T12:10:00Z'));
assert.equal(qualified.lead.pipelineStage,'QUALIFIED');
assert.equal(qualified.lead.relationshipStatus,'NEGOTIATION');
const meeting=s.scheduleMeeting(qualified.operations,{leadId:qualified.lead.id,listId:qualified.session.listId,sessionId:qualified.session.id,contactId:people.find(c=>c.name==='Marcos').id,decisionMaker:'Marcos',scheduledAt:new Date('2026-09-30T14:00:00Z'),durationMinutes:30,objective:'Diagnóstico de frota'},new Date('2026-09-29T12:11:00Z'));
assert.equal(meeting.meeting.meetingStatus,'MEETING_SCHEDULED');
assert.equal(meeting.operations.meetings.length,1);
assert.ok(meeting.operations.opportunities.some(o=>o.clientId===qualified.lead.id&&o.stage==='QUALIFIED'),'qualificação deve criar oportunidade operacional');
assert.ok(meeting.operations.activities.some(a=>a.type==='meeting'),'reunião deve gerar atividade');
assert.ok(meeting.operations.activities.some(a=>a.type==='follow_up'&&a.title==='Confirmar reunião'),'reunião deve gerar follow-up pré-reunião');
const confirmed=s.updateMeetingStatus(meeting.operations,meeting.meeting.id,'MEETING_CONFIRMED',new Date('2026-09-29T13:00:00Z'));
assert.equal(confirmed.meeting.meetingStatus,'MEETING_CONFIRMED');
const completed=s.updateMeetingStatus(confirmed.operations,meeting.meeting.id,'MEETING_COMPLETED',new Date('2026-09-30T14:40:00Z'));
assert.equal(completed.meeting.meetingStatus,'MEETING_COMPLETED');

// CASE D — existing customer remains customer when re-imported.
const customer=[{id:'CUST-1',empresa:'Cliente OG',cnpj:'12345678000199',telefone:'+5544999990000',relationshipStatus:'CUSTOMER',interactions:[]}];
const custImport=s.importRows(customer,{}, {name:'Clientes'},[{empresa:'Cliente OG',cnpj:'12.345.678/0001-99'}],new Date('2026-09-29T12:20:00Z'));
assert.equal(custImport.leads.length,1);
assert.equal(custImport.leads[0].relationshipStatus,'CUSTOMER');
assert.equal(s.callMode(custImport.leads[0],{}),'CUSTOMER','cliente existente deve entrar em CUSTOMER MODE');
assert.equal(s.callMode({status:'novo',relationshipStatus:'COLD'}, {roleCategory:'GATEKEEPER'}),'GATEKEEPER');

// CASE E — same company in two lists does not duplicate central account.
const one=[{empresa:'Duplicada',cnpj:'98765432000188',telefone:'(44) 99999-3333'}];
const l1=s.importRows([],{}, {name:'L1'},one,new Date('2026-09-29T12:30:00Z'));
const l2=s.importRows(l1.leads,l1.operations,{name:'L2'},one,new Date('2026-09-29T12:31:00Z'));
assert.equal(l2.leads.length,1);
assert.equal(l2.operations.leadLists.length,2);
assert.equal(l2.operations.leadListMembers.length,2);

// CASE F — active session survives serialization/refresh.
const sr=s.startSession(l2.operations,l2.list.id,10,'seller-refresh',new Date('2026-09-29T12:32:00Z'));
const restored=s.ensureOperations(JSON.parse(JSON.stringify(sr.operations)));
const resumed=s.getActiveSession(restored);
assert.equal(resumed.id,sr.session.id);
assert.equal(resumed.targetCalls,10);
const oneTarget=s.startSession(l2.operations,l2.list.id,1,'seller-target',new Date('2026-09-29T12:40:00Z'));
const targetMember=s.nextMember(oneTarget.operations,oneTarget.session);
targetMember.workStatus='IN_PROGRESS';
const targetDone=s.recordOutcome(l2.leads,oneTarget.operations,oneTarget.session.id,targetMember.id,'NO_ANSWER',{},new Date('2026-09-29T12:41:00Z'));
assert.equal(s.nextMember(targetDone.operations,targetDone.session),null,'sessão deve parar ao atingir a meta');

const metrics=s.listMetrics(outcome.operations, imported.list.id, outcome.leads);
assert.equal(metrics.attempted,1);
assert.equal(metrics.rates.contactRate,0);

const action=s.scheduleAction(outcome.leads,outcome.operations,outcome.lead.id,{type:'FOLLOW_UP',description:'Retornar contato',dueAt:new Date('2026-09-30T15:00:00Z'),reason:'Retorno combinado',priority:'HIGH'},new Date('2026-09-29T13:00:00Z'));
assert.equal(action.lead.nextActionType,'FOLLOW_UP');
assert.equal(s.actionQueue(action.leads,action.operations,new Date('2026-09-30T16:00:00Z'))[0].state,'OVERDUE');
const completedAction=s.completeAction(action.leads,action.operations,action.lead.id,{result:'done'},new Date('2026-09-30T16:01:00Z'));
assert.equal(completedAction.lead.nextAction,'');
assert.ok(completedAction.operations.activities.some(a=>a.status==='completed'));

const proposalMember=s.nextMember(outcome.operations,outcome.session);
proposalMember.workStatus='IN_PROGRESS';
const proposalIntent=s.recordOutcome(outcome.leads,outcome.operations,outcome.session.id,proposalMember.id,'PROPOSAL',{},new Date('2026-09-29T13:10:00Z'));
assert.equal(proposalIntent.lead.pipelineStage,'PROPOSAL');
assert.equal(proposalIntent.lead.nextActionType,'CREATE_PROPOSAL');
assert.notEqual(proposalIntent.lead.status,'proposta_enviada','solicitação de proposta não pode fingir que proposta foi enviada');

assert.equal(s.normalizeBrazilPhone('(44) 99999-9999'),'+5544999999999');
console.log('Sales Execution acceptance A-F: PASS');