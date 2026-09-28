import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const engine = require('../apps/sistema-og/services/automation-engine-service.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');
const operationsModel = require('../apps/sistema-og/operations-model.js');

const now='2026-09-28T12:00:00.000Z';
const lead={
  id:'LEAD-1',
  empresa:'Frota Teste',
  status:'negociacao',
  updatedAt:'2026-09-19T12:00:00.000Z',
  nextAction:'',
  followUpAt:'',
  testEndsAt:'2026-09-30T12:00:00.000Z',
  interactions:[]
};
let ops=operationsModel.createEmptyOperations('2026-09-18T00:00:00.000Z');
ops.activityEvents.push(
  {id:'E-PROP',type:'proposal_sent',at:'2026-09-25T10:00:00.000Z',clientId:'LEAD-1',proposalId:'PROP-1'},
  {id:'E-INSTALL',type:'installation.completed',at:'2026-09-20T10:00:00.000Z',clientId:'LEAD-1',installationId:'INST-1'},
  {id:'E-SAT',type:'customer.satisfaction.confirmed',at:'2026-09-27T10:00:00.000Z',clientId:'LEAD-1'}
);

const suggestions=engine.suggestionsForLead(lead,ops,now);
const rules=new Set(suggestions.map(item=>item.ruleId));
assert.ok(rules.has('proposal_48h_followup'),'alias legado proposal_sent deve alimentar contrato canônico');
assert.ok(rules.has('post_sale_15d'));
assert.ok(rules.has('request_referral'));
assert.ok(rules.has('test_end_followup'));
assert.ok(rules.has('idle_7d_action'));

const proposal=suggestions.find(item=>item.ruleId==='proposal_48h_followup');
engine.applyToLead(lead,proposal,{interactionService:interactions});
assert.equal(lead.nextAction,'Retomar a proposta e combinar um próximo passo');
assert.match(lead.nextActionReason,/proposta foi marcada como enviada/i);
assert.ok(lead.interactions.some(item=>item.type==='proxima_acao'));

ops=engine.markApplied(ops,proposal,{operationsModel,now});
assert.ok(ops.activityEvents.some(item=>item.type==='automation.suggestion.applied'&&item.ruleId==='proposal_48h_followup'));
const after=engine.suggestionsForLead(lead,ops,now);
assert.ok(!after.some(item=>item.ruleId==='proposal_48h_followup'));

const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const html=fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw=fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
assert.match(app,/function renderAutomationCenter/);
assert.match(app,/renderSignalCenter\(\);\s*renderAutomationCenter\(\);/,'Meu Dia precisa realmente renderizar o Automation Center');
assert.match(app,/OG_AUTOMATION_ENGINE\.buildSuggestions/);
assert.match(app,/Criar próxima ação/);
assert.match(html,/id="automation-center"/);
assert.match(html,/automation-engine-service\.js/);
assert.match(sw,/automation-engine-service\.js/);
assert.match(sw,/SW_VERSION = 'v\d+'/);
assert.ok(!sw.includes("',\\n  '"),'service worker não pode conter quebra literal \\n entre itens do shell');
assert.ok(!html.includes("</script>\\n  <script"),'HTML não pode conter quebra literal \\n entre scripts');

console.log('AUTO-01 Automation Engine V1 tests: PASS');
