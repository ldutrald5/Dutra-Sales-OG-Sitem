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
assert.ok(intelligence.score({priorityBand:'urgente',conversationStage:'negotiation',followUpAt:'2026-09-27T09:00:00-03:00',temperature:'quente',potential:'alto'},now) >
  intelligence.score({priority:'media',conversationStage:'first_contact'},now));

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
