import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const intelligence=require('../apps/sistema-og/modules/lead-intelligence.js');

const now=new Date('2026-09-27T12:00:00-03:00');
const first={id:'A',empresa:'Novo',priority:'media',interactions:[]};
assert.equal(intelligence.conversationStage(first),'first_contact');

const noReply={id:'B',priority:'alta',interactions:[{at:'2026-09-27T10:00:00-03:00',type:'call',result:'nao_atendeu'}]};
assert.equal(intelligence.conversationStage(noReply),'no_reply');

const explicit={id:'C',conversationStage:'waiting_response',priority:'alta',interactions:[{type:'conversation'}]};
assert.equal(intelligence.conversationStage(explicit),'waiting_response','estado explícito deve prevalecer');

const closedUntouched={id:'CLOSED-1',status:'fechado',interactions:[],observacoes:''};
assert.equal(intelligence.conversationStage(closedUntouched),'first_contact','cliente histórico sem evidência de conversa deve entrar como primeiro contato da rotina');

const closedNoReply={id:'CLOSED-2',status:'fechado',observacoes:'Não atende',interactions:[]};
assert.equal(intelligence.conversationStage(closedNoReply),'no_reply','anotação de tentativa sem resposta deve prevalecer sobre venda histórica');

const closedWaiting={id:'CLOSED-3',status:'fechado',observacoes:'Está em reunião, entrar em contato mais tarde',interactions:[]};
assert.equal(intelligence.conversationStage(closedWaiting),'waiting_response','anotação de retorno deve virar aguardando resposta');

const closedTalked={id:'CLOSED-4',status:'fechado',observacoes:'Ainda não instalou os equipamentos por falta de tempo',interactions:[]};
assert.equal(intelligence.conversationStage(closedTalked),'talked','anotação de conversa sem outro sinal deve virar já conversei');

assert.equal(intelligence.inferStageFromText('Recusou chamada'),'no_reply');
assert.equal(intelligence.inferStageFromText('Cliente já instalou e indicou conhecidos'),'talked');
assert.equal(intelligence.inferStageFromText('Sem interesse em continuar'),'not_interested');

assert.equal(intelligence.priorityBand({priority:'alta',priorityBand:'urgente'}),'urgente');
const priorityCase={priorityBand:'urgente',conversationStage:'negotiation',followUpAt:'2026-09-27T09:00:00-03:00',temperature:'quente',potential:'alto',nextAction:'Ligar para o gestor',nextActionReason:'Proposta enviada e retorno combinado',nextActionObjective:'Descobrir o bloqueio',nextActionExpectedResult:'Definir avanço ou nova data'};
assert.ok(intelligence.score(priorityCase,now) > intelligence.score({priority:'media',conversationStage:'first_contact'},now));
const breakdown=intelligence.scoreBreakdown(priorityCase,now);
assert.equal(breakdown.total,intelligence.score(priorityCase,now),'score e explicação devem usar a mesma fonte');
assert.ok(breakdown.factors.some(item=>item.id==='followup_overdue'&&item.points===50),'retorno vencido deve ser explicável');
assert.ok(breakdown.factors.some(item=>item.id==='priority'&&item.points===100),'prioridade urgente deve ser explicável');
assert.ok(breakdown.factors.some(item=>item.id==='conversation'&&item.points===35),'negociação deve ser explicável');

const nextBest=intelligence.nextBestAction(priorityCase,now);
assert.equal(nextBest.action,'Ligar para o gestor');
assert.equal(nextBest.reason,'Proposta enviada e retorno combinado');
assert.equal(nextBest.objective,'Descobrir o bloqueio');
assert.equal(nextBest.expectedResult,'Definir avanço ou nova data');
assert.equal(nextBest.score,breakdown.total);

const fallback=intelligence.nextBestAction({priority:'alta',conversationStage:'proposal',followUpAt:'2026-09-27T09:00:00-03:00'},now);
assert.equal(fallback.action,'Definir próxima ação');
assert.equal(fallback.reason,'Retorno vencido','fallback deve explicar apenas fatos determinísticos já presentes');

const noAction=intelligence.nextBestAction({priority:'baixa',conversationStage:'not_interested'},now);
assert.equal(noAction.action,'','sem interesse não deve receber ação inventada');
assert.equal(noAction.actionRequired,false,'sem interesse deve permanecer em estado neutro');
assert.equal(noAction.reason,'Situação: Sem interesse');

const lostWithStaleStage={priority:'alta',status:'perdido',conversationStage:'interested',nextAction:''};
assert.equal(intelligence.conversationStage(lostWithStaleStage),'not_interested','status perdido deve prevalecer sobre situação de conversa obsoleta');
const lostNext=intelligence.nextBestAction(lostWithStaleStage,now);
assert.equal(lostNext.action,'','status perdido não pode receber ação genérica');
assert.equal(lostNext.actionRequired,false);

const customerNoAction=intelligence.nextBestAction({priority:'baixa',conversationStage:'customer'},now);
assert.equal(customerNoAction.action,'','cliente sem ação explícita não deve receber ação genérica');
assert.equal(customerNoAction.actionRequired,false);

const rows=[
  {id:'1',priority:'media',conversationStage:'first_contact',sourceLabel:'Lista A'},
  {id:'2',priorityBand:'urgente',priority:'alta',conversationStage:'negotiation',sourceLabel:'Carteira',followUpAt:'2026-09-27T09:00:00-03:00'},
  {id:'3',priority:'alta',conversationStage:'waiting_response',sourceLabel:'Carteira'},
  {id:'4',priority:'alta',conversationStage:'not_interested',sourceLabel:'Lista A'}
];
const ordered=intelligence.filterSort(rows,{},now);
assert.equal(ordered[0].id,'2','negociação urgente vencida deve aparecer primeiro');
assert.equal(intelligence.filterSort(rows,{conversation:'waiting_response'},now)[0].id,'3');
assert.deepEqual(intelligence.filterSort(rows,{source:'Lista A'},now).map(x=>x.id).sort(),['1','4']);
assert.equal(intelligence.filterSort(rows,{priority:'urgente'},now)[0].id,'2');
assert.equal(intelligence.stageDefinition('negotiation').label,'Negociação');
assert.equal(intelligence.summarize(rows).stages.first_contact,1);

const crmRows=[
  {id:'CRM-1',status:'fechado',conversationStage:'customer',priorityBand:'media',sourceLabel:'Pós-venda OG'},
  {id:'CRM-2',status:'novo',conversationStage:'first_contact',priorityBand:'media',sourceLabel:'CRM antigo'},
  {id:'CRM-3',status:'proposta_enviada',conversationStage:'proposal',priorityBand:'alta',sourceLabel:'Proposta recuperada'},
  {id:'CRM-4',status:'novo',conversationStage:'first_contact',priorityBand:'media',nextAction:'Conferir ERP antes de abordar',sourceLabel:'Prospecção ERP 24/09'},
  {id:'CRM-5',status:'contatado',conversationStage:'waiting_response',priorityBand:'media',accountSummary:'Falamos com o gestor e ficou retorno combinado.'},
  {id:'CRM-6',status:'novo',conversationStage:'first_contact',priorityBand:'media',potential:'alto',fleetSize:70}
];
assert.equal(intelligence.matchesCrmView(crmRows[0],'customers'),true,'cliente fechado deve entrar em Clientes');
assert.equal(intelligence.matchesCrmView(crmRows[0],'prospects'),false,'cliente fechado não deve entrar em Prospects');
assert.equal(intelligence.matchesCrmView(crmRows[1],'attack'),true,'prospect novo deve entrar na fila de ataque');
assert.equal(intelligence.matchesCrmView(crmRows[3],'attack'),false,'registro pendente de ERP deve sair da fila de ataque');
assert.equal(intelligence.matchesCrmView(crmRows[3],'erp_review'),true,'ação explícita de conferir ERP deve criar recorte de revisão');
assert.equal(intelligence.matchesCrmView(crmRows[2],'proposals'),true,'proposta deve entrar no recorte de propostas');
assert.equal(intelligence.matchesCrmView(crmRows[5],'strategic'),true,'potencial alto/frota grande deve entrar em estratégicas');
assert.equal(intelligence.matchesCrmView(crmRows[4],'talked'),true,'retorno registrado deve entrar em já conversados');
const crmSummary=intelligence.summarizeCrmViews(crmRows);
assert.equal(crmSummary.all,6);
assert.equal(crmSummary.customers,1);
assert.equal(crmSummary.erp_review,1);
assert.equal(intelligence.crmViewDefinition('attack').label,'Fila de ataque');
console.log('Lead intelligence tests: PASS');
