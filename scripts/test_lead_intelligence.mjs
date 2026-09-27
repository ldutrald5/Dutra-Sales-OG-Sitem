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
console.log('Lead intelligence tests: PASS');
