import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createSalesExecutionGateway,
  createSupabaseRestStore
} = require('../apps/sistema-og/server-sales-execution-gateway.cjs');

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function uuid(n) { return '00000000-0000-4000-8000-' + String(n).padStart(12, '0'); }

class FakeStore {
  constructor() {
    this.seq = 100;
    this.tables = Object.fromEntries([
      'companies','crm_contacts','crm_activities','sales_opportunities','lead_lists','lead_list_members',
      'prospecting_sessions','call_attempts','meetings','ai_briefings'
    ].map(name => [name, []]));
  }
  configured() { return true; }
  _value(row, key) {
    if (key.includes('->>')) {
      const [base, nested] = key.split('->>');
      return row?.[base]?.[nested];
    }
    return row?.[key];
  }
  _match(row, key, expression) {
    if (['select','order','limit'].includes(key)) return true;
    const value = this._value(row, key);
    const text = String(expression);
    if (text.startsWith('eq.')) return String(value ?? '') === text.slice(3);
    if (text.startsWith('in.(') && text.endsWith(')')) {
      const allowed = text.slice(4, -1).split(',').map(item => item.trim());
      return allowed.includes(String(value ?? ''));
    }
    return true;
  }
  _query(table, params = {}) {
    let rows = this.tables[table].filter(row => Object.entries(params).every(([key, value]) => this._match(row, key, value)));
    if (params.order) {
      const terms = String(params.order).split(',').map(term => {
        const [field, direction] = term.split('.');
        return { field, direction: direction === 'desc' ? -1 : 1 };
      });
      rows = rows.slice().sort((a,b) => {
        for (const term of terms) {
          const av = this._value(a, term.field), bv = this._value(b, term.field);
          if (String(av ?? '') === String(bv ?? '')) continue;
          return String(av ?? '') > String(bv ?? '') ? term.direction : -term.direction;
        }
        return 0;
      });
    }
    const limit = Number(params.limit || 0);
    return clone(limit > 0 ? rows.slice(0, limit) : rows);
  }
  async select(table, params = {}) { return this._query(table, params); }
  async insert(table, body) {
    const row = clone(body);
    if (!row.id) row.id = uuid(++this.seq);
    const now = '2026-09-30T01:00:00.000Z';
    if (!row.created_at) row.created_at = now;
    if (!row.updated_at && !['call_attempts'].includes(table)) row.updated_at = now;
    if (row.external_id) {
      const existing = this.tables[table].find(item => item.external_id === row.external_id);
      if (existing) {
        const error = new Error('duplicate key');
        error.status = 409;
        throw error;
      }
    }
    if (table === 'lead_list_members') {
      const existing = this.tables[table].find(item => item.list_id === row.list_id && item.company_id === row.company_id);
      if (existing) {
        const error = new Error('duplicate member');
        error.status = 409;
        throw error;
      }
    }
    this.tables[table].push(row);
    return [clone(row)];
  }
  async update(table, filters, body) {
    const matches = this.tables[table].filter(row => Object.entries(filters).every(([key, value]) => this._match(row, key, value)));
    for (const row of matches) {
      for (const [key, value] of Object.entries(body)) if (value !== undefined) row[key] = clone(value);
    }
    return clone(matches);
  }
}

const clock = () => new Date('2026-09-30T01:00:00.000Z');
const store = new FakeStore();
const gateway = createSalesExecutionGateway({ store, now: clock });

const leads = [
  { id:'LEG-ANA', empresa:'Transportes Alfa', cnpj:'12.345.678/0001-90', nome:'Ana', cargo:'Recepção', telefone:'44999990001', cidadeUf:'Maringá - PR', segmentId:'transportadora' },
  { id:'LEG-BETA', empresa:'Logística Beta', cnpj:'22.345.678/0001-90', nome:'Bruno', telefone:'44999990002', cidadeUf:'Sarandi - PR', segmentId:'transportadora' },
  { id:'LEG-GAMA', empresa:'Frota Gama', cnpj:'32.345.678/0001-90', nome:'Gabriel', telefone:'44999990003', cidadeUf:'Paiçandu - PR', segmentId:'transportadora' }
];

// A. lista -> sessão -> primeiro contato.
const imported = await gateway.importList({
  name:'Piloto OG Sales Execution',
  externalId:'test:list:pilot-1',
  source:'test',
  leads
});
assert.equal(imported.linked, 3);
assert.equal(store.tables.companies.length, 3);
assert.equal(store.tables.lead_list_members.length, 3);

let flow = await gateway.startSession({
  listId: imported.list.id,
  targetCalls: 3,
  externalId:'test:session:pilot-1'
});
assert.equal(flow.session.status, 'ACTIVE');
assert.equal(flow.current.company.legacy_lead_id, 'LEG-ANA');
assert.equal(flow.session.progress.target, 3);

// B. NO_ANSWER -> call_attempt + activity -> próximo.
const firstMemberId = flow.current.member.id;
const firstResult = await gateway.recordResult(flow.session.id, {
  memberId:firstMemberId,
  outcome:'NO_ANSWER',
  externalId:'test:call:1',
  notes:'Sem resposta',
  phone:'44999990001'
});
assert.equal(store.tables.call_attempts.length, 1);
assert.equal(store.tables.crm_activities.filter(item => item.activity_type === 'call').length, 1);
assert.notEqual(firstResult.current.member.id, firstMemberId);
assert.equal(store.tables.lead_list_members.find(item => item.id === firstMemberId).work_status, 'WORKED');

// C. retry/double click não duplica nem pula outro contato.
const currentAfterFirst = firstResult.current.member.id;
const duplicate = await gateway.recordResult(flow.session.id, {
  memberId:firstMemberId,
  outcome:'NO_ANSWER',
  externalId:'test:call:1',
  notes:'Sem resposta',
  phone:'44999990001'
});
assert.equal(duplicate.duplicate, true);
assert.equal(store.tables.call_attempts.length, 1);
assert.equal(store.tables.crm_activities.filter(item => item.external_id === 'activity:test:call:1').length, 1);
assert.equal(duplicate.current.member.id, currentAfterFirst);

// D. gatekeeper Ana -> descobrir Marcos; ambos permanecem.
const beta = duplicate.current;
await store.update('crm_contacts', { id:'eq.' + beta.contact.id }, { role_category:'GATEKEEPER', decision_level:'gatekeeper', full_name:'Ana Gatekeeper' });
const gatekeeper = await gateway.recordResult(flow.session.id, {
  memberId:beta.member.id,
  contactId:beta.contact.id,
  outcome:'GATEKEEPER',
  externalId:'test:call:gatekeeper',
  notes:'Ana informou que Marcos cuida da frota.'
});
assert.equal(gatekeeper.current.member.id, beta.member.id, 'gatekeeper deve manter a empresa em contexto');
const contactsBeforeDecision = store.tables.crm_contacts.filter(item => item.company_id === beta.company.id).length;
const decision = await gateway.saveDecisionMaker(flow.session.id, {
  memberId:beta.member.id,
  name:'Marcos',
  roleTitle:'Gestor de Frota',
  roleCategory:'FLEET_MANAGER',
  phone:'44999991111',
  email:'marcos@example.com',
  externalId:'test:decision:marcos'
});
const companyContacts = store.tables.crm_contacts.filter(item => item.company_id === beta.company.id);
assert.equal(companyContacts.length, contactsBeforeDecision + 1);
assert.ok(companyContacts.some(item => item.full_name === 'Ana Gatekeeper'));
assert.ok(companyContacts.some(item => item.full_name === 'Marcos' && item.decision_level === 'decision_maker'));

// E. decisor identificado -> opportunity stage correto.
assert.equal(decision.opportunity.pipeline_stage, 'DECISION_MAKER_IDENTIFIED');
assert.equal(decision.current.contact.full_name, 'Marcos');

// F. QUALIFIED -> CTA meeting sem avançar.
const qualified = await gateway.recordResult(flow.session.id, {
  memberId:beta.member.id,
  contactId:decision.contact.id,
  outcome:'QUALIFIED',
  externalId:'test:call:qualified',
  notes:'Frota relevante e dor confirmada.'
});
assert.equal(qualified.opportunity.pipeline_stage, 'QUALIFIED');
assert.equal(qualified.opportunity.next_action_type, 'MEETING');
assert.equal(qualified.current.member.id, beta.member.id);

// G. reunião -> meeting + activity + MEETING_SCHEDULED + próximo.
const meeting = await gateway.scheduleMeeting(flow.session.id, {
  memberId:beta.member.id,
  scheduledAt:'2026-10-01T14:00:00-03:00',
  durationMinutes:20,
  mode:'ONLINE',
  objective:'Validar frota, aplicação, investimento e próximo passo.',
  notes:'Marcos participará.',
  externalId:'test:meeting:1'
});
assert.equal(store.tables.meetings.length, 1);
assert.ok(store.tables.crm_activities.some(item => item.activity_type === 'meeting'));
assert.equal(meeting.opportunity.pipeline_stage, 'MEETING_SCHEDULED');
assert.notEqual(meeting.current.member.id, beta.member.id);

// H. refresh/resume mantém cursor.
const resumed = await gateway.getCurrent(flow.session.id);
assert.equal(resumed.current.member.id, meeting.current.member.id);

// I. mesma company em duas listas não duplica company.
const secondList = await gateway.importList({
  name:'Outra lista',
  externalId:'test:list:pilot-2',
  source:'test',
  leads:[leads[0]]
});
assert.equal(secondList.linked, 1);
assert.equal(store.tables.companies.filter(item => item.legacy_lead_id === 'LEG-ANA').length, 1);

// J. briefing PENDING/FAILED não bloqueia ligação.
store.tables.ai_briefings.push({
  id:uuid(900),
  company_id:resumed.current.company.id,
  contact_id:resumed.current.contact.id,
  opportunity_id:resumed.current.opportunity?.id || null,
  session_id:flow.session.id,
  mode:'GATEKEEPER',
  processing_status:'FAILED',
  briefing:{},
  created_at:'2026-09-30T00:59:00.000Z',
  updated_at:'2026-09-30T00:59:00.000Z'
});
const briefingFlow = await gateway.getCurrent(flow.session.id);
assert.equal(briefingFlow.current.company.id, resumed.current.company.id);
assert.ok(['FAILED','MISSING'].includes(briefingFlow.briefing.status));

// K. Supabase indisponível -> erro controlado sem tocar fake state local.
const rest = createSupabaseRestStore({
  url:'https://example.supabase.co',
  serviceRoleKey:'server-only-secret',
  fetchImpl:async () => { throw new Error('network down'); }
});
const unavailable = createSalesExecutionGateway({ store:rest, now:clock });
await assert.rejects(
  () => unavailable.getLists(),
  error => error && error.code === 'supabase_unreachable' && error.status === 503
);

console.log('Sales Execution gateway critical flows: PASS');
