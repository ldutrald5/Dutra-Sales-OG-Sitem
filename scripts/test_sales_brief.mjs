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
assert.equal(b.playbook.moment,'first_contact');
assert.match(b.playbook.label,/primeiro contato/i);
assert.match(b.playbook.objective,/Abrir conversa/i);
assert.match(b.playbook.approach,/Não despeje produto/i);
assert.match(b.playbook.opening,/Antes de te explicar qualquer coisa/i);
assert.match(b.playbook.whatsapp,/Lucas/i);
assert.ok(b.playbook.technicalPrep.some(item=>item.status==='missing'&&/Veículo/.test(item.label)));
assert.match(b.playbook.nextStep,/Confirmar frota/i);

const proposal=brief.build({
  ...incomplete,
  conversationStage:'proposal',
  fleetSize:18,
  vehicleModel:'Volvo FH',
  operatingPressure:'110 psi'
},{});
assert.equal(proposal.playbook.moment,'proposal');
assert.match(proposal.playbook.objective,/impedindo a decisão/i);
assert.match(proposal.playbook.opening,/o que pesa mais/i);
assert.ok(proposal.playbook.technicalPrep.some(item=>item.status==='known'&&item.label==='Veículo/configuração'));
assert.ok(proposal.playbook.technicalPrep.some(item=>item.status==='known'&&item.label==='Pressão de trabalho'));

const customer=brief.build({
  ...incomplete,
  status:'fechado',
  conversationStage:'customer'
},{});
assert.equal(customer.playbook.moment,'customer');
assert.match(customer.playbook.approach,/experiência real/i);
assert.match(customer.playbook.nextStep,/expansão/i);

const negotiation=brief.playbookForLead({...incomplete,conversationStage:'negotiation'});
assert.equal(negotiation.moment,'negotiation');
assert.match(negotiation.approach,/não ofereça desconto/i);

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
assert.match(app,/FICHA DE ATAQUE · PLAYBOOK VIVO/);
assert.match(app,/PREPARAÇÃO TÉCNICA ANTES DE PROPOR/);
assert.match(app,/WHATSAPP DE ENTRADA/);

console.log('PRECALL-01 diagnostic + guardrails: PASS');
