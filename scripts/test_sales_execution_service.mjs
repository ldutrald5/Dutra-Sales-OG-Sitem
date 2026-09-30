import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.OG_SALES_BRIEF = require('../apps/sistema-og/services/sales-brief-service.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');
const contextService = require('../apps/sistema-og/services/call-ai-context.js');
const salesExecution = require('../apps/sistema-og/services/sales-execution-service.js');

function response(data, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data };
}

const calls = [];
salesExecution.configure({
  request: async (path, options = {}) => {
    calls.push({ path, options });
    if (path === '/api/sales-execution/lists') return response({ ok:true, data:[{ id:'LIST-1', name:'Piloto' }] });
    if (path.includes('/current')) return response({ ok:true, data:{ session:{ id:'SESSION-1' }, current:null, briefing:null } });
    return response({ ok:true, data:{ ok:true } });
  }
});

const lists = await salesExecution.getLists();
assert.equal(lists[0].name, 'Piloto');
assert.equal(calls[0].path, '/api/sales-execution/lists');

const legacyLead = {
  id:'LEG-1',
  empresa:'Frota Exemplo',
  nome:'Ana',
  telefone:'44999990000',
  cidadeUf:'Maringá - PR',
  segmentId:'transportadora',
  status:'novo',
  interactions:[]
};
const current = {
  company:{ id:'COMP-1', legacy_lead_id:'LEG-1', name:'Frota Exemplo', city:'Maringá', state:'PR', sector:'transportadora', relationship_status:'COLD' },
  contact:{ id:'CONT-1', full_name:'Ana', role_category:'GATEKEEPER', decision_level:'gatekeeper', phone_e164:'5544999990000' },
  opportunity:{ id:'OPP-1', pipeline_stage:'CONNECTED', relationship_status:'COLD' },
  member:{ id:'MEM-1', list_id:'LIST-1', work_status:'IN_PROGRESS', enrichment_status:'PENDING' }
};

// READY briefing is consumed immediately.
const ready = salesExecution.prepareMember({
  current,
  briefing:{
    mode:'GATEKEEPER',
    status:'READY',
    record:{
      valid_until:'2099-01-01T00:00:00.000Z',
      briefing:{
        objective:'Chegar ao gestor de frota.',
        opening:'Ana, quem acompanha pneus e manutenção?',
        questions:['Qual é o nome do responsável?'],
        hook:'Evitar falar de ROI com a recepção.',
        cta:'Conseguir contato e melhor horário.'
      }
    }
  }
}, legacyLead, { activityEvents:[] });
assert.equal(ready.source, 'ai_briefings');
assert.equal(ready.intent, 'reach_decision_maker');
assert.match(ready.opening, /Ana/);

// FAILED/PENDING briefing never blocks the call and falls back to local facts.
const failed = salesExecution.prepareMember({
  current,
  briefing:{ mode:'GATEKEEPER', status:'FAILED', record:null }
}, legacyLead, { activityEvents:[] });
assert.equal(failed.source, 'sales_brief_local_fallback');
assert.ok(failed.opening);
assert.ok(failed.questions.length > 0);
assert.equal(failed.intent, 'reach_decision_maker');

const pending = salesExecution.prepareMember({
  current:{ ...current, member:{ ...current.member, enrichment_status:'PENDING' } },
  briefing:{ mode:'DECISION_MAKER', status:'PENDING', record:null }
}, legacyLead, { activityEvents:[] });
assert.equal(pending.source, 'sales_brief_local_fallback');
assert.ok(pending.cta);

// Call AI context accepts canonical Sales Execution without breaking the legacy shape.
const executionContext = {
  company:current.company,
  contact:current.contact,
  opportunity:current.opportunity,
  listMember:current.member,
  session:{ id:'SESSION-1', target_calls:60, current_member_id:'MEM-1', status:'ACTIVE' },
  briefing:failed,
  mode:'GATEKEEPER'
};
const compact = contextService.build(legacyLead, { salesExecution: executionContext });
assert.equal(compact.company.id, 'LEG-1');
assert.equal(compact.salesExecution.session.id, 'SESSION-1');
assert.equal(compact.salesExecution.listMember.id, 'MEM-1');
assert.equal(compact.salesExecution.mode, 'GATEKEEPER');

// Compatibility projection uses Interaction Service and is idempotent.
const projection = {
  externalId:'RESULT-1',
  legacyResult:'nao_atendeu',
  note:'Sem resposta',
  status:'contatado',
  nextAction:'Tentar novo contato',
  followUpAt:'2026-10-01T12:00:00.000Z',
  outcome:'NO_ANSWER'
};
assert.equal(salesExecution.applyLegacyProjection(legacyLead, projection, { interactions, externalId:'RESULT-1', now:'2026-09-30T01:00:00.000Z' }), true);
assert.equal(legacyLead.interactions.filter(item => item.idempotencyKey === 'RESULT-1').length, 1);
assert.equal(salesExecution.applyLegacyProjection(legacyLead, projection, { interactions, externalId:'RESULT-1', now:'2026-09-30T01:01:00.000Z' }), false);
assert.equal(legacyLead.interactions.filter(item => item.idempotencyKey === 'RESULT-1').length, 1);

const frontendFiles = [
  'apps/sistema-og/app.js',
  'apps/sistema-og/index.html',
  'apps/sistema-og/services/sales-execution-service.js',
  'apps/sistema-og/components/sales-execution-controller.js',
  'apps/sistema-og/components/sales-execution-ui.js'
].map(path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8')).join('\n');

assert.doesNotMatch(frontendFiles, /OG_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY/, 'service_role nunca pode aparecer no frontend');
assert.doesNotMatch(frontendFiles, /\/rest\/v1\//, 'frontend não pode acessar PostgREST Supabase diretamente');
assert.doesNotMatch(frontendFiles, /firecrawl/i, 'Call Mode P0 não pode depender de Firecrawl síncrono');

console.log('Sales Execution frontend service checks: PASS');
