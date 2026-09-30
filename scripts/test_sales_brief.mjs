import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const brief=require('../apps/sistema-og/services/sales-brief-service.js');

const incomplete={
  id:'L1',
  empresa:'Frota Alpha',
  nome:'João',
  segmentId:'transportadora',
  fleetSize:'',
  decisionMaker:'',
  pain:'',
  nextAction:'',
  telefone:'44999990000',
  cidadeUf:'Maringá - PR'
};
const b=brief.build(incomplete,{activityEvents:[{id:'S1',type:'proposal.sent',at:'2026-09-28T12:00:00Z',clientId:'L1'}]});
assert.ok(b.gaps.includes('Tamanho/composição da frota'));
assert.ok(b.gaps.includes('Decisor/processo de decisão'));
assert.ok(b.gaps.includes('Dor validada'));
assert.ok(b.questions.some(q=>/quem participa/i.test(q)));
assert.ok(b.doNotSay.some(x=>/não presuma/i.test(x)));
assert.ok(b.doNotSay.some(x=>/não há abertura confirmada/i.test(x)));
assert.ok(b.doNotSay.some(x=>/percentual de economia/i.test(x)));
assert.equal(b.approach.id,'first_contact');
assert.match(b.approach.awareness,/não confirmado/i);
assert.match(b.approach.opening,/antes de eu te explicar/i);
assert.ok(b.approach.preparation.some(x=>/marca, modelo, ano/i.test(x)));

const proposal=brief.build({
  ...incomplete,
  conversationStage:'proposal',
  pain:'Desgaste irregular',
  fleetSize:24,
  decisionMaker:'João'
},{});
assert.equal(proposal.approach.id,'proposal');
assert.match(proposal.approach.opening,/investimento, aplicação ou prioridade/i);
assert.match(proposal.approach.desiredNextStep,/objeção principal/i);

const customer=brief.build({
  ...incomplete,
  conversationStage:'customer',
  status:'fechado',
  pain:'Calibragem frequente',
  fleetSize:12,
  decisionMaker:'Maria'
},{});
assert.equal(customer.approach.id,'customer');
assert.match(customer.approach.objective,/experiência real/i);
assert.match(customer.approach.desiredNextStep,/expansão, reposição/i);

const noReply=brief.build({
  ...incomplete,
  conversationStage:'no_reply'
},{});
assert.equal(noReply.approach.id,'no_reply');
assert.match(noReply.approach.primaryQuestion,/ainda é prioridade/i);

const reopened=brief.build({
  ...incomplete,
  fleetSize:80,
  decisionMaker:'Maria',
  pain:'Desgaste irregular',
  nextAction:'Revisar proposta'
},{activityEvents:[{id:'R1',type:'proposal.reopened',at:'2026-09-28T13:00:00Z',clientId:'L1'}]});
assert.ok(reopened.facts.some(x=>x.label==='Sinal interno de proposta'&&/Reabertura/.test(x.value)));
assert.ok(reopened.doNotSay.some(x=>/eu vi você abrir/i.test(x)));
assert.ok(reopened.questions.some(x=>/continua acontecendo/i.test(x)));

assert.throws(()=>brief.build({},{}),/cliente identificado/);

const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(html,/sales-brief-service\.js/);
assert.match(sw,/sales-brief-service\.js/);
assert.match(app,/OG_SALES_BRIEF\.build/);
assert.match(app,/PERGUNTAS PARA DESCOBRIR/);
assert.match(app,/NÃO DIGA AINDA/);
assert.match(app,/MODO DE ABORDAGEM/);
assert.match(app,/Preparação técnica antes de falar/);

console.log('PRECALL-01 + PLAYBOOK-01 contextual approach: PASS');
