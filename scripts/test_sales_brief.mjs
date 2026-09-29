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

console.log('PRECALL-01 diagnostic + guardrails: PASS');
