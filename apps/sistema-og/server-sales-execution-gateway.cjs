'use strict';

const TABLES = new Set([
  'companies',
  'crm_contacts',
  'crm_activities',
  'sales_opportunities',
  'lead_lists',
  'lead_list_members',
  'prospecting_sessions',
  'call_attempts',
  'meetings',
  'ai_briefings'
]);

const OUTCOMES = new Set([
  'NO_ANSWER',
  'INVALID_NUMBER',
  'GATEKEEPER',
  'DECISION_MAKER_IDENTIFIED',
  'DECISION_MAKER_REACHED',
  'RETURN_LATER',
  'QUALIFIED',
  'MEETING_BOOKED',
  'SEND_MATERIAL',
  'PROPOSAL',
  'NOT_INTERESTED'
]);

const ROLE_CATEGORIES = new Set([
  'GATEKEEPER',
  'OPERATIONAL',
  'FLEET_MANAGER',
  'MAINTENANCE_MANAGER',
  'PROCUREMENT',
  'DIRECTOR',
  'OWNER',
  'UNKNOWN'
]);

const CONTINUATION_OUTCOMES = new Set([
  'GATEKEEPER',
  'DECISION_MAKER_IDENTIFIED',
  'DECISION_MAKER_REACHED',
  'QUALIFIED'
]);

const PIPELINE_RANK = Object.freeze({
  PROSPECT: 0,
  CONTACT_ATTEMPTED: 1,
  CONNECTED: 2,
  DECISION_MAKER_IDENTIFIED: 3,
  DECISION_MAKER_CONTACTED: 4,
  QUALIFIED: 5,
  MEETING_TO_SCHEDULE: 6,
  MEETING_SCHEDULED: 7,
  MEETING_COMPLETED: 8,
  PROPOSAL: 9,
  NEGOTIATION: 10,
  WON: 11,
  LOST: 11
});

class GatewayError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
    this.details = details || null;
  }
}

function clean(value, max = 500) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeCnpj(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 14 ? digits : '';
}

function normalizeCompanyName(value) {
  return clean(value, 180)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDomain(value) {
  const raw = clean(value, 240).toLowerCase();
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return raw.replace(/^www\./, '').split('/')[0];
  }
}

function normalizePhoneE164(value) {
  let digits = String(value || '').replace(/\D/g, '').replace(/^00/, '');
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith('55')) digits = '55' + digits;
  return /^55\d{10,11}$/.test(digits) ? digits : '';
}

function validUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean(value, 80));
}

function parseCityState(value) {
  const text = clean(value, 160);
  const match = text.match(/^(.+?)(?:\s*[-/]\s*|\s+)([A-Za-z]{2})$/);
  if (!match) return { city: text || null, state: null };
  return { city: clean(match[1], 100) || null, state: match[2].toUpperCase() };
}

function ensureId(value, label) {
  const id = clean(value, 80);
  if (!validUuid(id)) throw new GatewayError(400, 'invalid_id', label + ' inválido.');
  return id;
}

function ensureExternalId(value) {
  const id = clean(value, 180);
  if (!id || id.length < 8) throw new GatewayError(400, 'invalid_external_id', 'externalId é obrigatório para idempotência.');
  return id;
}

function isoNow(now) {
  const value = now instanceof Date ? now : new Date(now || Date.now());
  if (Number.isNaN(value.getTime())) throw new GatewayError(400, 'invalid_date', 'Data inválida.');
  return value.toISOString();
}

function sanitizeRestError(error) {
  if (!error) return 'Falha de persistência.';
  if (typeof error === 'string') return clean(error, 300);
  return clean(error.message || error.hint || error.details || 'Falha de persistência.', 300);
}

function createSupabaseRestStore(options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const endpoint = clean(options.url || process.env.OG_SUPABASE_URL || process.env.SUPABASE_URL, 300).replace(/\/+$/, '');
  const serviceRoleKey = clean(options.serviceRoleKey || process.env.OG_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, 10000);

  function configured() {
    return Boolean(endpoint && serviceRoleKey && typeof fetchImpl === 'function');
  }

  async function request(table, options = {}) {
    if (!TABLES.has(table)) throw new GatewayError(500, 'table_not_allowed', 'Tabela não permitida no gateway.');
    if (!configured()) throw new GatewayError(503, 'sales_execution_unconfigured', 'Sales Execution ainda não possui conexão server-side com Supabase.');
    const query = new URLSearchParams();
    const params = options.params || {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value) !== '') query.set(key, String(value));
    });
    const url = endpoint + '/rest/v1/' + table + (query.toString() ? '?' + query.toString() : '');
    const headers = {
      apikey: serviceRoleKey,
      authorization: 'Bearer ' + serviceRoleKey,
      accept: 'application/json',
      'content-type': 'application/json',
      'accept-profile': 'public',
      'content-profile': 'public',
      prefer: options.prefer || 'return=representation'
    };
    let response;
    try {
      response = await fetchImpl(url, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body)
      });
    } catch (error) {
      throw new GatewayError(503, 'supabase_unreachable', 'Supabase indisponível no momento.', { cause: sanitizeRestError(error) });
    }
    const text = await response.text();
    let payload = null;
    if (text) {
      try { payload = JSON.parse(text); }
      catch { payload = text; }
    }
    if (!response.ok) {
      const message = sanitizeRestError(payload);
      const status = response.status === 409 ? 409 : (response.status >= 500 ? 503 : 502);
      throw new GatewayError(status, 'supabase_request_failed', message, { status: response.status });
    }
    return payload == null ? [] : payload;
  }

  function select(table, params = {}) {
    return request(table, { method: 'GET', params: { select: '*', ...params } });
  }

  function insert(table, body, prefer = 'return=representation') {
    return request(table, { method: 'POST', body, prefer });
  }

  function update(table, filters, body, prefer = 'return=representation') {
    return request(table, { method: 'PATCH', params: { ...filters, select: '*' }, body, prefer });
  }

  return Object.freeze({ configured, select, insert, update });
}

function createSalesExecutionGateway(options = {}) {
  const store = options.store || createSupabaseRestStore(options);
  const now = typeof options.now === 'function' ? options.now : () => new Date();
  const logger = options.logger || { info() {}, warn() {}, error() {} };

  function configured() {
    return typeof store.configured === 'function' ? store.configured() : true;
  }

  async function selectOne(table, params = {}) {
    const rows = await store.select(table, { ...params, limit: 1 });
    return Array.isArray(rows) ? rows[0] || null : null;
  }

  async function selectRows(table, params = {}) {
    const rows = await store.select(table, params);
    return Array.isArray(rows) ? rows : [];
  }

  async function insertOne(table, body) {
    const rows = await store.insert(table, body);
    return Array.isArray(rows) ? rows[0] || null : rows;
  }

  async function updateRows(table, filters, body) {
    const rows = await store.update(table, filters, { ...body, updated_at: body.updated_at || isoNow(now()) });
    return Array.isArray(rows) ? rows : [];
  }

  async function findCompanyCandidates(lead) {
    const matches = new Map();
    const legacyLeadId = clean(lead.legacyLeadId || lead.id, 180);
    const cnpj = normalizeCnpj(lead.cnpj);
    const companyId = clean(lead.companyId, 80);
    const domain = normalizeDomain(lead.domain || lead.website);
    const normalizedName = normalizeCompanyName(lead.companyName || lead.empresa || lead.name);

    async function addRows(rows, source) {
      for (const row of rows || []) {
        if (!row || !row.id) continue;
        const existing = matches.get(String(row.id)) || { company: row, sources: [] };
        existing.sources.push(source);
        matches.set(String(row.id), existing);
      }
    }

    if (legacyLeadId) await addRows(await selectRows('companies', { legacy_lead_id: 'eq.' + legacyLeadId, limit: 3 }), 'legacy_lead_id');
    if (cnpj) await addRows(await selectRows('companies', { cnpj: 'eq.' + cnpj, limit: 3 }), 'cnpj');
    if (validUuid(companyId)) await addRows(await selectRows('companies', { id: 'eq.' + companyId, limit: 3 }), 'company_id');
    if (domain) await addRows(await selectRows('companies', { domain: 'eq.' + domain, limit: 3 }), 'domain');

    if (matches.size > 1) {
      throw new GatewayError(409, 'company_identity_conflict', 'Mais de uma empresa corresponde aos identificadores informados.', {
        legacyLeadId,
        cnpj: cnpj || null,
        companyId: validUuid(companyId) ? companyId : null,
        domain: domain || null
      });
    }

    if (!matches.size && normalizedName) {
      let rows = await selectRows('companies', { normalized_name: 'eq.' + normalizedName, limit: 5 });
      if (!rows.length) rows = await selectRows('companies', { name: 'eq.' + clean(lead.companyName || lead.empresa || lead.name, 180), limit: 5 });
      if (rows.length > 1) throw new GatewayError(409, 'company_identity_ambiguous', 'Nome da empresa é ambíguo. Confirme CNPJ, domínio ou vínculo legado.');
      if (rows.length === 1) await addRows(rows, 'safe_name_fallback');
    }

    return {
      match: matches.size === 1 ? [...matches.values()][0] : null,
      legacyLeadId,
      cnpj,
      domain,
      normalizedName
    };
  }

  async function resolveCompany(lead, options = {}) {
    const name = clean(lead.companyName || lead.empresa || lead.name, 180);
    if (!name) throw new GatewayError(400, 'company_name_required', 'Empresa é obrigatória.');
    const resolution = await findCompanyCandidates(lead);
    if (resolution.match) {
      const company = resolution.match.company;
      if (resolution.legacyLeadId && !company.legacy_lead_id) {
        const updated = await updateRows('companies', { id: 'eq.' + company.id }, { legacy_lead_id: resolution.legacyLeadId });
        return updated[0] || { ...company, legacy_lead_id: resolution.legacyLeadId };
      }
      if (resolution.legacyLeadId && company.legacy_lead_id && String(company.legacy_lead_id) !== resolution.legacyLeadId && resolution.match.sources.includes('safe_name_fallback')) {
        throw new GatewayError(409, 'company_legacy_conflict', 'Empresa semelhante já está vinculada a outro lead legado.');
      }
      return company;
    }

    if (options.allowCreate !== true) return null;
    if (!resolution.legacyLeadId) throw new GatewayError(409, 'company_identity_insufficient', 'Novo vínculo exige legacyLeadId ou identificador canônico confiável.');
    const place = parseCityState(lead.cidadeUf || lead.location || '');
    const created = await insertOne('companies', {
      name,
      legal_name: clean(lead.legalName || lead.razaoSocial, 220) || null,
      cnpj: resolution.cnpj || null,
      domain: resolution.domain || null,
      website: clean(lead.website, 300) || null,
      sector: clean(lead.segmentId || lead.segment, 100) || null,
      city: place.city,
      state: place.state,
      normalized_name: resolution.normalizedName || normalizeCompanyName(name),
      relationship_status: 'UNKNOWN',
      legacy_lead_id: resolution.legacyLeadId
    });
    if (!created) throw new GatewayError(502, 'company_create_failed', 'Não foi possível criar o vínculo canônico da empresa.');
    return created;
  }

  async function resolveContact(company, lead, options = {}) {
    const phone = normalizePhoneE164(lead.phone || lead.telefone || lead.whatsapp);
    const legacyContactId = clean(lead.legacyContactId || (lead.id ? String(lead.id) + ':primary' : ''), 180);
    const explicitId = clean(lead.contactId, 80);
    const email = clean(lead.email, 220).toLowerCase();
    const matches = new Map();

    async function add(rows, source) {
      for (const row of rows || []) {
        if (!row || !row.id) continue;
        const existing = matches.get(String(row.id)) || { contact: row, sources: [] };
        existing.sources.push(source);
        matches.set(String(row.id), existing);
      }
    }

    if (phone) await add(await selectRows('crm_contacts', { phone_e164: 'eq.' + phone, limit: 3 }), 'phone_e164');
    if (legacyContactId) await add(await selectRows('crm_contacts', { legacy_contact_id: 'eq.' + legacyContactId, limit: 3 }), 'legacy_contact_id');
    if (validUuid(explicitId)) await add(await selectRows('crm_contacts', { id: 'eq.' + explicitId, limit: 3 }), 'contact_id');
    if (email) await add(await selectRows('crm_contacts', { email: 'eq.' + email, limit: 3 }), 'email');

    if (matches.size > 1) throw new GatewayError(409, 'contact_identity_conflict', 'Mais de um contato corresponde aos identificadores informados.');
    if (matches.size === 1) {
      const found = [...matches.values()][0].contact;
      if (found.company_id && String(found.company_id) !== String(company.id)) {
        throw new GatewayError(409, 'contact_company_conflict', 'Contato encontrado já pertence a outra empresa.');
      }
      const patch = {};
      if (!found.company_id) patch.company_id = company.id;
      if (legacyContactId && !found.legacy_contact_id) patch.legacy_contact_id = legacyContactId;
      if (Object.keys(patch).length) {
        const updated = await updateRows('crm_contacts', { id: 'eq.' + found.id }, patch);
        return updated[0] || { ...found, ...patch };
      }
      return found;
    }

    if (options.allowCreate !== true) return null;
    const fullName = clean(lead.contactName || lead.nome || lead.fullName, 180);
    if (!fullName && !phone && !email) return null;
    const created = await insertOne('crm_contacts', {
      company_id: company.id,
      provider: 'dutra_sales_execution',
      external_contact_id: null,
      full_name: fullName || null,
      phone_e164: phone || null,
      whatsapp_e164: normalizePhoneE164(lead.whatsapp || lead.telefone) || phone || null,
      email: email || null,
      role_title: clean(lead.roleTitle || lead.cargo, 140) || null,
      decision_level: 'unknown',
      role_category: 'UNKNOWN',
      source: 'dutra_sales_execution',
      source_metadata: { imported_from: 'state.leads' },
      legacy_contact_id: legacyContactId || null
    });
    return created;
  }

  async function getOpportunity(companyId) {
    const rows = await selectRows('sales_opportunities', { company_id: 'eq.' + companyId, order: 'updated_at.desc', limit: 20 });
    return rows.find(row => !['WON', 'LOST'].includes(row.pipeline_stage)) || null;
  }

  async function ensureOpportunity(company, contact, legacyLeadId) {
    let opportunity = await getOpportunity(company.id);
    if (opportunity) return opportunity;
    const legacyOpportunityId = clean(legacyLeadId ? 'sales-execution:' + legacyLeadId : '', 180) || null;
    if (legacyOpportunityId) {
      opportunity = await selectOne('sales_opportunities', { legacy_opportunity_id: 'eq.' + legacyOpportunityId });
      if (opportunity) return opportunity;
    }
    return insertOne('sales_opportunities', {
      company_id: company.id,
      primary_contact_id: contact && contact.id ? contact.id : null,
      source: 'dutra_sales_execution',
      stage: 'lead',
      pipeline_stage: 'PROSPECT',
      relationship_status: company.relationship_status || 'UNKNOWN',
      objections: [],
      metadata: { source: 'sales_execution_p0' },
      legacy_opportunity_id: legacyOpportunityId
    });
  }

  function maxStage(current, target) {
    const a = clean(current, 60) || 'PROSPECT';
    const b = clean(target, 60) || a;
    if (a === 'WON' || a === 'LOST') return a;
    return (PIPELINE_RANK[b] || 0) > (PIPELINE_RANK[a] || 0) ? b : a;
  }

  function stageForOutcome(outcome) {
    return {
      NO_ANSWER: 'CONTACT_ATTEMPTED',
      INVALID_NUMBER: 'CONTACT_ATTEMPTED',
      GATEKEEPER: 'CONNECTED',
      DECISION_MAKER_IDENTIFIED: 'DECISION_MAKER_IDENTIFIED',
      DECISION_MAKER_REACHED: 'DECISION_MAKER_CONTACTED',
      RETURN_LATER: 'CONNECTED',
      QUALIFIED: 'QUALIFIED',
      MEETING_BOOKED: 'MEETING_SCHEDULED',
      SEND_MATERIAL: 'CONNECTED',
      PROPOSAL: 'PROPOSAL',
      NOT_INTERESTED: 'LOST'
    }[outcome] || 'PROSPECT';
  }

  function nextActionForOutcome(outcome, input = {}) {
    const dueAt = input.followUpAt ? isoNow(input.followUpAt) : null;
    const map = {
      NO_ANSWER: ['CALL', 'Tentar novo contato'],
      INVALID_NUMBER: ['CALL', 'Corrigir telefone e retomar'],
      GATEKEEPER: ['CALL', 'Chegar ao decisor'],
      DECISION_MAKER_IDENTIFIED: ['CALL', 'Falar com o decisor identificado'],
      DECISION_MAKER_REACHED: ['CALL', 'Qualificar operação com o decisor'],
      RETURN_LATER: ['FOLLOW_UP', 'Retomar contato'],
      QUALIFIED: ['MEETING', 'Marcar reunião'],
      MEETING_BOOKED: ['MEETING', 'Realizar reunião'],
      SEND_MATERIAL: ['FOLLOW_UP', 'Confirmar recebimento do material'],
      PROPOSAL: ['CREATE_PROPOSAL', 'Preparar proposta'],
      NOT_INTERESTED: [null, null]
    };
    const pair = map[outcome] || [null, null];
    return {
      type: clean(input.nextActionType || pair[0], 60) || null,
      description: clean(input.nextAction || pair[1], 260) || null,
      dueAt,
      reason: clean(input.nextActionReason || '', 400) || null
    };
  }

  function legacyProjectionFor(outcome, input, opportunity) {
    const legacyResult = {
      NO_ANSWER: 'nao_atendeu',
      INVALID_NUMBER: 'outro',
      GATEKEEPER: 'atendeu',
      DECISION_MAKER_IDENTIFIED: 'atendeu',
      DECISION_MAKER_REACHED: 'atendeu',
      RETURN_LATER: 'falar_depois',
      QUALIFIED: 'negociacao',
      MEETING_BOOKED: 'negociacao',
      SEND_MATERIAL: 'enviar_apresentacao',
      PROPOSAL: 'enviar_orcamento',
      NOT_INTERESTED: 'sem_interesse'
    }[outcome] || 'outro';
    const status = outcome === 'NOT_INTERESTED' ? 'perdido'
      : outcome === 'PROPOSAL' ? 'proposta_enviada'
      : ['QUALIFIED', 'MEETING_BOOKED'].includes(outcome) ? 'negociacao'
      : 'contatado';
    return {
      externalId: clean(input.externalId, 180),
      legacyResult,
      note: clean(input.notes || input.note || '', 2000) || ('Sales Execution: ' + outcome),
      status,
      nextAction: opportunity ? opportunity.next_action || '' : '',
      followUpAt: opportunity ? opportunity.next_action_due_at || '' : '',
      outcome
    };
  }

  function determineMode(company, contact, opportunity) {
    const pipeline = opportunity && opportunity.pipeline_stage ? opportunity.pipeline_stage : 'PROSPECT';
    const relationship = (opportunity && opportunity.relationship_status) || company.relationship_status || 'UNKNOWN';
    if (relationship === 'CUSTOMER' || pipeline === 'WON') return 'CUSTOMER';
    if (['PROPOSAL', 'NEGOTIATION'].includes(pipeline)) return 'PROPOSAL';
    if (pipeline.startsWith('MEETING_')) return 'MEETING';
    if (contact && (contact.decision_level === 'gatekeeper' || contact.role_category === 'GATEKEEPER')) return 'GATEKEEPER';
    if (opportunity && opportunity.next_action_type === 'FOLLOW_UP') return 'FOLLOW_UP';
    if (contact && contact.decision_level === 'decision_maker') return 'DECISION_MAKER';
    if (PIPELINE_RANK[pipeline] >= PIPELINE_RANK.DECISION_MAKER_IDENTIFIED) return 'DECISION_MAKER';
    return 'GATEKEEPER';
  }

  async function getBriefing(company, contact, opportunity, session) {
    const mode = determineMode(company, contact, opportunity);
    const rows = await selectRows('ai_briefings', { company_id: 'eq.' + company.id, mode: 'eq.' + mode, order: 'created_at.desc', limit: 8 });
    const currentTime = now().getTime();
    const ready = rows.find(row => row.processing_status === 'READY' && (!row.valid_until || Date.parse(row.valid_until) > currentTime));
    const record = ready || rows[0] || null;
    return {
      mode,
      status: record ? record.processing_status : 'MISSING',
      record,
      usable: Boolean(ready)
    };
  }

  async function hydrateMember(member) {
    if (!member) return null;
    const company = await selectOne('companies', { id: 'eq.' + member.company_id });
    if (!company) throw new GatewayError(409, 'member_company_missing', 'Membro da lista referencia empresa inexistente.');
    let contact = null;
    if (member.primary_contact_id) contact = await selectOne('crm_contacts', { id: 'eq.' + member.primary_contact_id });
    if (!contact) {
      const contacts = await selectRows('crm_contacts', { company_id: 'eq.' + company.id, order: 'updated_at.desc', limit: 20 });
      contact = contacts.find(row => row.decision_level === 'decision_maker') || contacts[0] || null;
    }
    const opportunity = await getOpportunity(company.id);
    return { member, company, contact, opportunity };
  }

  async function deriveSessionMetrics(sessionId) {
    const attempts = await selectRows('call_attempts', { session_id: 'eq.' + sessionId, order: 'created_at.asc', limit: 1000 });
    const meetings = await selectRows('meetings', { 'metadata->>sales_execution_session_id': 'eq.' + sessionId, order: 'created_at.asc', limit: 500 });
    const terminalMembers = new Set();
    attempts.forEach(row => {
      if (row.list_member_id && !CONTINUATION_OUTCOMES.has(row.outcome)) terminalMembers.add(String(row.list_member_id));
    });
    const connected = attempts.filter(row => row.connected).length;
    const decisionMakers = attempts.filter(row => row.decision_maker_reached).length;
    const qualified = attempts.filter(row => row.qualified).length;
    return {
      attemptedCalls: attempts.length,
      processedMembers: terminalMembers.size,
      connectedCalls: connected,
      decisionMakersReached: decisionMakers,
      qualifiedOpportunities: qualified,
      meetingsBooked: meetings.length
    };
  }

  async function refreshSessionCounters(session) {
    const metrics = await deriveSessionMetrics(session.id);
    const patch = {
      attempted_calls: metrics.attemptedCalls,
      connected_calls: metrics.connectedCalls,
      decision_makers_reached: metrics.decisionMakersReached,
      qualified_opportunities: metrics.qualifiedOpportunities,
      meetings_booked: metrics.meetingsBooked
    };
    const updated = await updateRows('prospecting_sessions', { id: 'eq.' + session.id }, patch);
    return { session: updated[0] || { ...session, ...patch }, metrics };
  }

  async function getSession(sessionId) {
    const id = ensureId(sessionId, 'sessionId');
    const session = await selectOne('prospecting_sessions', { id: 'eq.' + id });
    if (!session) throw new GatewayError(404, 'session_not_found', 'Sessão não encontrada.');
    const refreshed = await refreshSessionCounters(session);
    const target = Number(refreshed.session.target_calls || 0);
    return {
      ...refreshed.session,
      metrics: refreshed.metrics,
      progress: {
        current: Math.min(refreshed.metrics.processedMembers, target),
        target,
        remaining: Math.max(0, target - refreshed.metrics.processedMembers)
      }
    };
  }

  async function getCurrent(sessionId) {
    const session = await getSession(sessionId);
    if (!session.current_member_id) return { session, current: null, briefing: null };
    const member = await selectOne('lead_list_members', { id: 'eq.' + session.current_member_id });
    if (!member) throw new GatewayError(409, 'current_member_missing', 'Cursor da sessão aponta para membro inexistente.');
    const hydrated = await hydrateMember(member);
    const briefing = await getBriefing(hydrated.company, hydrated.contact, hydrated.opportunity, session);
    return { session, current: hydrated, briefing };
  }

  async function getLists() {
    const lists = await selectRows('lead_lists', { status: 'eq.ACTIVE', order: 'created_at.desc', limit: 200 });
    const result = [];
    for (const list of lists) {
      const members = await selectRows('lead_list_members', { list_id: 'eq.' + list.id, select: 'id,work_status', limit: 5000 });
      const total = members.length;
      const worked = members.filter(row => row.work_status === 'WORKED').length;
      const remaining = members.filter(row => ['AVAILABLE', 'IN_PROGRESS'].includes(row.work_status)).length;
      const activeSession = await selectOne('prospecting_sessions', { list_id: 'eq.' + list.id, status: 'eq.ACTIVE', order: 'started_at.desc' });
      let sessionSummary = null;
      if (activeSession) {
        const session = await getSession(activeSession.id);
        sessionSummary = { id: session.id, status: session.status, targetCalls: session.target_calls, progress: session.progress, metrics: session.metrics };
      }
      result.push({
        ...list,
        derived: { total, worked, remaining },
        activeSession: sessionSummary
      });
    }
    return result;
  }

  async function getListMembers(listId) {
    const id = ensureId(listId, 'listId');
    const list = await selectOne('lead_lists', { id: 'eq.' + id });
    if (!list) throw new GatewayError(404, 'list_not_found', 'Lista não encontrada.');
    const members = await selectRows('lead_list_members', { list_id: 'eq.' + id, order: 'position.asc,created_at.asc', limit: 5000 });
    const hydrated = [];
    for (const member of members) hydrated.push(await hydrateMember(member));
    return { list, members: hydrated };
  }

  async function importList(input = {}) {
    const name = clean(input.name, 180);
    const externalId = ensureExternalId(input.externalId);
    const leads = Array.isArray(input.leads) ? input.leads.slice(0, 200) : [];
    if (!name) throw new GatewayError(400, 'list_name_required', 'Nome da lista é obrigatório.');
    if (!leads.length) throw new GatewayError(400, 'list_leads_required', 'Selecione pelo menos um contato.');
    let list = await selectOne('lead_lists', { external_id: 'eq.' + externalId });
    if (!list) {
      list = await insertOne('lead_lists', {
        name,
        source: clean(input.source || 'DUTRA OS', 120) || 'DUTRA OS',
        source_owner: clean(input.sourceOwner || 'Lucas Dutra', 120) || null,
        status: 'ACTIVE',
        external_id: externalId,
        metadata: { imported_via: 'sales_execution_p0' }
      });
    }
    const issues = [];
    let linked = 0;
    let position = 0;
    for (const lead of leads) {
      position += 1;
      try {
        const company = await resolveCompany(lead, { allowCreate: true });
        const contact = await resolveContact(company, lead, { allowCreate: true });
        let member = await selectOne('lead_list_members', { list_id: 'eq.' + list.id, company_id: 'eq.' + company.id });
        if (!member) {
          member = await insertOne('lead_list_members', {
            list_id: list.id,
            company_id: company.id,
            primary_contact_id: contact && contact.id ? contact.id : null,
            position,
            work_status: 'AVAILABLE',
            enrichment_status: company.enrichment_status === 'enriched' ? 'READY' : 'PENDING',
            external_id: clean(externalId + ':member:' + (lead.id || company.id), 180),
            metadata: { legacy_lead_id: clean(lead.id || lead.legacyLeadId, 180) || null }
          });
        } else if (!member.primary_contact_id && contact && contact.id) {
          const updated = await updateRows('lead_list_members', { id: 'eq.' + member.id }, { primary_contact_id: contact.id });
          member = updated[0] || member;
        }
        linked += 1;
      } catch (error) {
        issues.push({
          legacyLeadId: clean(lead.id || lead.legacyLeadId, 180) || null,
          company: clean(lead.empresa || lead.companyName || lead.name, 180) || null,
          code: error.code || 'identity_error',
          message: clean(error.message, 300)
        });
      }
    }
    const members = await selectRows('lead_list_members', { list_id: 'eq.' + list.id, select: 'id,work_status', limit: 5000 });
    const worked = members.filter(row => row.work_status === 'WORKED').length;
    const updated = await updateRows('lead_lists', { id: 'eq.' + list.id }, { total_count: members.length, worked_count: worked });
    list = updated[0] || list;
    return { list, linked, issues, partial: issues.length > 0 };
  }

  async function startSession(input = {}) {
    const listId = ensureId(input.listId, 'listId');
    const externalId = ensureExternalId(input.externalId);
    const requestedTarget = Math.max(1, Math.min(200, Number(input.targetCalls) || 1));
    const list = await selectOne('lead_lists', { id: 'eq.' + listId });
    if (!list) throw new GatewayError(404, 'list_not_found', 'Lista não encontrada.');

    let session = await selectOne('prospecting_sessions', { list_id: 'eq.' + listId, status: 'eq.ACTIVE', order: 'started_at.desc' });
    if (!session) session = await selectOne('prospecting_sessions', { external_id: 'eq.' + externalId });
    if (session && session.status === 'ACTIVE') return { resumed: true, ...(await getCurrent(session.id)) };

    const members = await selectRows('lead_list_members', { list_id: 'eq.' + listId, work_status: 'in.(AVAILABLE,IN_PROGRESS)', order: 'position.asc,created_at.asc', limit: 5000 });
    if (!members.length) throw new GatewayError(409, 'list_finished', 'Não há contatos disponíveis nesta lista.');
    const targetCalls = Math.min(requestedTarget, members.length);
    const current = members.find(row => row.work_status === 'IN_PROGRESS') || members[0];
    session = await insertOne('prospecting_sessions', {
      list_id: listId,
      seller_id: null,
      status: 'ACTIVE',
      target_calls: targetCalls,
      current_member_id: current.id,
      external_id: externalId,
      session_state: { source: 'dutra_os_p0' }
    });
    if (current.work_status === 'AVAILABLE') await updateRows('lead_list_members', { id: 'eq.' + current.id }, { work_status: 'IN_PROGRESS' });
    return { resumed: false, ...(await getCurrent(session.id)) };
  }

  async function patchOpportunityForOutcome(opportunity, outcome, input) {
    const action = nextActionForOutcome(outcome, input);
    const targetStage = stageForOutcome(outcome);
    const patch = {
      pipeline_stage: maxStage(opportunity.pipeline_stage, targetStage),
      next_action_type: action.type,
      next_action: action.description,
      next_action_due_at: action.dueAt,
      next_action_reason: action.reason,
      next_action_priority: action.type ? (outcome === 'QUALIFIED' ? 'HIGH' : 'MEDIUM') : null
    };
    if (outcome === 'QUALIFIED') patch.stage = 'qualified';
    if (outcome === 'PROPOSAL') patch.stage = 'proposal';
    if (outcome === 'NOT_INTERESTED') patch.stage = 'lost';
    const rows = await updateRows('sales_opportunities', { id: 'eq.' + opportunity.id }, patch);
    return rows[0] || { ...opportunity, ...patch };
  }

  async function ensureActivity(externalId, input) {
    const activityExternalId = clean('activity:' + externalId, 180);
    let activity = await selectOne('crm_activities', { external_id: 'eq.' + activityExternalId });
    if (activity) return activity;
    activity = await insertOne('crm_activities', {
      company_id: input.companyId || null,
      contact_id: input.contactId || null,
      opportunity_id: input.opportunityId || null,
      activity_type: input.activityType || 'call',
      status: 'completed',
      title: clean(input.title || 'Ligação registrada', 180),
      description: clean(input.description || '', 2000) || null,
      due_at: input.dueAt || null,
      completed_at: isoNow(now()),
      external_id: activityExternalId,
      metadata: input.metadata || {}
    });
    return activity;
  }

  async function moveAfterMember(session, memberId, options = {}) {
    const id = ensureId(memberId, 'memberId');
    const latest = await selectOne('prospecting_sessions', { id: 'eq.' + session.id });
    if (!latest) throw new GatewayError(404, 'session_not_found', 'Sessão não encontrada.');
    if (String(latest.current_member_id || '') !== id) return getCurrent(latest.id);

    if (options.markWorked !== false) {
      await updateRows('lead_list_members', { id: 'eq.' + id }, {
        work_status: options.skipped ? 'SKIPPED' : 'WORKED',
        worked_at: options.skipped ? null : isoNow(now()),
        last_attempt_at: options.attempted ? isoNow(now()) : undefined
      });
    }

    const metrics = await deriveSessionMetrics(latest.id);
    if (!options.skipped && metrics.processedMembers >= Number(latest.target_calls || 0)) {
      await updateRows('prospecting_sessions', { id: 'eq.' + latest.id }, {
        status: 'COMPLETED',
        finished_at: isoNow(now()),
        current_member_id: null
      });
      return getCurrent(latest.id);
    }

    const members = await selectRows('lead_list_members', {
      list_id: 'eq.' + latest.list_id,
      work_status: 'in.(AVAILABLE,IN_PROGRESS)',
      order: 'position.asc,created_at.asc',
      limit: 5000
    });
    const next = members.find(row => String(row.id) !== id) || null;
    if (!next) {
      await updateRows('prospecting_sessions', { id: 'eq.' + latest.id }, {
        status: 'COMPLETED',
        finished_at: isoNow(now()),
        current_member_id: null
      });
      return getCurrent(latest.id);
    }
    if (next.work_status === 'AVAILABLE') await updateRows('lead_list_members', { id: 'eq.' + next.id }, { work_status: 'IN_PROGRESS' });
    await updateRows('prospecting_sessions', { id: 'eq.' + latest.id }, { current_member_id: next.id });
    return getCurrent(latest.id);
  }

  async function recordResult(sessionId, input = {}) {
    const session = await getSession(sessionId);
    if (!['ACTIVE', 'PAUSED'].includes(session.status)) throw new GatewayError(409, 'session_not_active', 'Sessão não está ativa.');
    const memberId = ensureId(input.memberId || session.current_member_id, 'memberId');
    const member = await selectOne('lead_list_members', { id: 'eq.' + memberId });
    if (!member || String(member.list_id) !== String(session.list_id)) throw new GatewayError(409, 'member_not_in_session', 'Contato não pertence à lista da sessão.');
    const outcome = clean(input.outcome, 80).toUpperCase();
    if (!OUTCOMES.has(outcome)) throw new GatewayError(400, 'invalid_outcome', 'Resultado de ligação inválido.');
    const externalId = ensureExternalId(input.externalId);
    const hydrated = await hydrateMember(member);
    const company = hydrated.company;
    const contact = input.contactId && validUuid(input.contactId)
      ? (await selectOne('crm_contacts', { id: 'eq.' + input.contactId })) || hydrated.contact
      : hydrated.contact;
    let opportunity = hydrated.opportunity || await ensureOpportunity(company, contact, company.legacy_lead_id);

    let attempt = await selectOne('call_attempts', { external_id: 'eq.' + externalId });
    const duplicate = Boolean(attempt);
    if (!attempt) {
      try {
        attempt = await insertOne('call_attempts', {
          session_id: session.id,
          list_member_id: member.id,
          company_id: company.id,
          contact_id: contact && contact.id ? contact.id : null,
          phone_e164: normalizePhoneE164(input.phone || (contact && contact.phone_e164)) || null,
          started_at: input.startedAt ? isoNow(input.startedAt) : isoNow(now()),
          ended_at: isoNow(now()),
          outcome,
          connected: !['NO_ANSWER', 'INVALID_NUMBER'].includes(outcome),
          decision_maker_reached: ['DECISION_MAKER_REACHED', 'QUALIFIED', 'MEETING_BOOKED', 'PROPOSAL'].includes(outcome),
          qualified: ['QUALIFIED', 'MEETING_BOOKED', 'PROPOSAL'].includes(outcome),
          notes: clean(input.notes || input.note || '', 2000) || null,
          metadata: { source: 'sales_execution_p0', mode: clean(input.mode, 80) || null },
          external_id: externalId
        });
      } catch (error) {
        if (error.status !== 409) throw error;
        attempt = await selectOne('call_attempts', { external_id: 'eq.' + externalId });
        if (!attempt) throw error;
      }
    }

    opportunity = await patchOpportunityForOutcome(opportunity, outcome, input);
    await ensureActivity(externalId, {
      companyId: company.id,
      contactId: contact && contact.id,
      opportunityId: opportunity.id,
      activityType: 'call',
      title: 'Ligação · ' + outcome,
      description: clean(input.notes || input.note || '', 2000) || ('Resultado: ' + outcome),
      dueAt: opportunity.next_action_due_at || null,
      metadata: { sales_execution_session_id: session.id, list_member_id: member.id, outcome, call_attempt_id: attempt.id }
    });
    await updateRows('lead_list_members', { id: 'eq.' + member.id }, { last_attempt_at: isoNow(now()) });

    let flow;
    if (CONTINUATION_OUTCOMES.has(outcome)) {
      await updateRows('lead_list_members', { id: 'eq.' + member.id }, { work_status: 'IN_PROGRESS' });
      flow = await getCurrent(session.id);
    } else {
      flow = await moveAfterMember(session, member.id, { markWorked: true, attempted: true });
    }

    return {
      duplicate,
      attempt,
      opportunity,
      legacyProjection: legacyProjectionFor(outcome, input, opportunity),
      ...flow
    };
  }

  async function saveDecisionMaker(sessionId, input = {}) {
    const session = await getSession(sessionId);
    const memberId = ensureId(input.memberId || session.current_member_id, 'memberId');
    const member = await selectOne('lead_list_members', { id: 'eq.' + memberId });
    if (!member) throw new GatewayError(404, 'member_not_found', 'Contato atual não encontrado.');
    const hydrated = await hydrateMember(member);
    const name = clean(input.name, 180);
    if (!name) throw new GatewayError(400, 'decision_maker_name_required', 'Nome do decisor é obrigatório.');
    const roleCategory = clean(input.roleCategory || 'UNKNOWN', 80).toUpperCase();
    if (!ROLE_CATEGORIES.has(roleCategory)) throw new GatewayError(400, 'invalid_role_category', 'Categoria de cargo inválida.');
    const phone = normalizePhoneE164(input.phone || input.whatsapp);
    const email = clean(input.email, 220).toLowerCase();
    const externalId = ensureExternalId(input.externalId);

    let contact = phone ? await selectOne('crm_contacts', { phone_e164: 'eq.' + phone }) : null;
    if (!contact && email) contact = await selectOne('crm_contacts', { email: 'eq.' + email });
    if (contact && contact.company_id && String(contact.company_id) !== String(hydrated.company.id)) {
      throw new GatewayError(409, 'decision_maker_company_conflict', 'Contato informado já está vinculado a outra empresa.');
    }
    const patch = {
      company_id: hydrated.company.id,
      full_name: name,
      phone_e164: phone || (contact && contact.phone_e164) || null,
      whatsapp_e164: normalizePhoneE164(input.whatsapp) || phone || (contact && contact.whatsapp_e164) || null,
      email: email || (contact && contact.email) || null,
      role_title: clean(input.roleTitle || input.cargo, 140) || (contact && contact.role_title) || null,
      decision_level: 'decision_maker',
      role_category: roleCategory,
      influence_level: Math.max(1, Math.min(5, Number(input.influenceLevel) || 5)),
      notes: clean(input.notes || input.observation, 1200) || (contact && contact.notes) || null,
      source: contact && contact.source ? contact.source : 'dutra_sales_execution',
      source_metadata: { ...(contact && contact.source_metadata ? contact.source_metadata : {}), identified_via_sales_execution: true }
    };
    if (contact) {
      const rows = await updateRows('crm_contacts', { id: 'eq.' + contact.id }, patch);
      contact = rows[0] || { ...contact, ...patch };
    } else {
      contact = await insertOne('crm_contacts', {
        provider: 'dutra_sales_execution',
        external_contact_id: null,
        legacy_contact_id: null,
        ...patch
      });
    }

    await updateRows('lead_list_members', { id: 'eq.' + member.id }, { primary_contact_id: contact.id, work_status: 'IN_PROGRESS' });
    let opportunity = hydrated.opportunity || await ensureOpportunity(hydrated.company, contact, hydrated.company.legacy_lead_id);
    const rows = await updateRows('sales_opportunities', { id: 'eq.' + opportunity.id }, {
      primary_contact_id: contact.id,
      pipeline_stage: maxStage(opportunity.pipeline_stage, 'DECISION_MAKER_IDENTIFIED'),
      next_action_type: 'CALL',
      next_action: 'Falar com ' + name,
      next_action_reason: 'Decisor identificado durante prospecção',
      next_action_priority: 'HIGH'
    });
    opportunity = rows[0] || opportunity;
    await ensureActivity(externalId, {
      companyId: hydrated.company.id,
      contactId: contact.id,
      opportunityId: opportunity.id,
      activityType: 'note',
      title: 'Decisor identificado',
      description: name + (patch.role_title ? ' · ' + patch.role_title : ''),
      metadata: { sales_execution_session_id: session.id, list_member_id: member.id, role_category: roleCategory }
    });
    const flow = await getCurrent(session.id);
    return {
      contact,
      opportunity,
      legacyProjection: { decisionMaker: name, nextAction: opportunity.next_action || '', followUpAt: opportunity.next_action_due_at || '' },
      ...flow
    };
  }

  async function scheduleMeeting(sessionId, input = {}) {
    const session = await getSession(sessionId);
    const memberId = ensureId(input.memberId || session.current_member_id, 'memberId');
    const member = await selectOne('lead_list_members', { id: 'eq.' + memberId });
    if (!member) throw new GatewayError(404, 'member_not_found', 'Contato atual não encontrado.');
    const hydrated = await hydrateMember(member);
    const externalId = ensureExternalId(input.externalId);
    const scheduledAt = isoNow(input.scheduledAt);
    const duration = Math.max(5, Math.min(480, Number(input.durationMinutes) || 30));
    const mode = clean(input.mode || 'ONLINE', 40).toUpperCase();
    if (!['ONLINE', 'PRESENCIAL', 'PHONE'].includes(mode)) throw new GatewayError(400, 'invalid_meeting_mode', 'Modo de reunião inválido.');

    let opportunity = hydrated.opportunity || await ensureOpportunity(hydrated.company, hydrated.contact, hydrated.company.legacy_lead_id);
    let meeting = await selectOne('meetings', { external_id: 'eq.' + externalId });
    const duplicate = Boolean(meeting);
    if (!meeting) {
      meeting = await insertOne('meetings', {
        company_id: hydrated.company.id,
        opportunity_id: opportunity.id,
        primary_contact_id: hydrated.contact && hydrated.contact.id ? hydrated.contact.id : null,
        seller_id: null,
        meeting_status: 'MEETING_SCHEDULED',
        meeting_type: clean(input.meetingType || 'sales_discovery', 100) || null,
        mode,
        scheduled_at: scheduledAt,
        duration_minutes: duration,
        objective: clean(input.objective || 'Diagnóstico comercial e próximo passo', 500) || null,
        notes: clean(input.notes || '', 2000) || null,
        participants: Array.isArray(input.participants) ? input.participants.slice(0, 20) : [],
        confirmation_message: clean(input.confirmationMessage || '', 1200) || null,
        follow_up_at: input.followUpAt ? isoNow(input.followUpAt) : null,
        external_id: externalId,
        metadata: {
          source: 'sales_execution_p0',
          sales_execution_session_id: session.id,
          sales_execution_list_id: session.list_id,
          list_member_id: member.id
        }
      });
    }

    const rows = await updateRows('sales_opportunities', { id: 'eq.' + opportunity.id }, {
      pipeline_stage: maxStage(opportunity.pipeline_stage, 'MEETING_SCHEDULED'),
      stage: opportunity.stage === 'lead' ? 'discovery' : opportunity.stage,
      next_action_type: 'MEETING',
      next_action: 'Realizar reunião',
      next_action_due_at: scheduledAt,
      next_action_reason: clean(input.objective || 'Reunião comercial agendada', 400),
      next_action_priority: 'HIGH'
    });
    opportunity = rows[0] || opportunity;
    await ensureActivity(externalId, {
      companyId: hydrated.company.id,
      contactId: hydrated.contact && hydrated.contact.id,
      opportunityId: opportunity.id,
      activityType: 'meeting',
      title: 'Reunião marcada',
      description: clean(input.objective || 'Reunião comercial agendada', 1200),
      dueAt: scheduledAt,
      metadata: { sales_execution_session_id: session.id, list_member_id: member.id, meeting_id: meeting.id }
    });

    const flow = await moveAfterMember(session, member.id, { markWorked: true, attempted: false });
    return {
      duplicate,
      meeting,
      opportunity,
      legacyProjection: {
        status: 'negociacao',
        nextAction: 'Realizar reunião',
        followUpAt: scheduledAt,
        note: 'Reunião marcada para ' + scheduledAt
      },
      ...flow
    };
  }

  async function advance(sessionId, input = {}) {
    const session = await getSession(sessionId);
    if (!session.current_member_id) return getCurrent(session.id);
    const action = clean(input.action || 'SKIP', 40).toUpperCase();
    if (action !== 'SKIP') throw new GatewayError(400, 'advance_requires_result', 'Avanço sem resultado só é permitido como SKIP.');
    return moveAfterMember(session, session.current_member_id, { skipped: true, markWorked: true });
  }

  async function finishSession(sessionId) {
    const session = await getSession(sessionId);
    if (session.status === 'COMPLETED') return getCurrent(session.id);
    await updateRows('prospecting_sessions', { id: 'eq.' + session.id }, {
      status: 'COMPLETED',
      finished_at: isoNow(now()),
      current_member_id: null
    });
    return getCurrent(session.id);
  }

  return Object.freeze({
    configured,
    getLists,
    getListMembers,
    importList,
    startSession,
    getSession,
    getCurrent,
    recordResult,
    saveDecisionMaker,
    scheduleMeeting,
    advance,
    finishSession,
    resolveCompany,
    resolveContact
  });
}

function createHttpHandler(gateway, helpers = {}) {
  const readBody = helpers.readBody;
  const sendJson = helpers.sendJson;
  const allowWrite = helpers.allowWrite || (() => true);
  const logger = helpers.logger || { info() {}, warn() {}, error() {} };

  if (typeof readBody !== 'function' || typeof sendJson !== 'function') throw new Error('readBody e sendJson são obrigatórios.');

  function success(res, status, data) {
    return sendJson(res, status, { ok: true, data });
  }

  function fail(res, error) {
    const status = error instanceof GatewayError ? error.status : 500;
    const code = error instanceof GatewayError ? error.code : 'sales_execution_error';
    if (status >= 500) logger.error('[sales-execution] ' + code + ': ' + clean(error && error.message, 300));
    else logger.warn('[sales-execution] ' + code);
    return sendJson(res, status, {
      ok: false,
      error: {
        code,
        message: clean(error && error.message ? error.message : 'Falha no Sales Execution.', 400),
        ...(error instanceof GatewayError && error.details ? { details: error.details } : {})
      }
    });
  }

  async function body(req) {
    return readBody(req, 250_000);
  }

  return async function handle(req, res, url) {
    if (!url.pathname.startsWith('/api/sales-execution')) return false;
    const started = Date.now();
    try {
      if (url.pathname === '/api/sales-execution/status' && req.method === 'GET') {
        success(res, 200, { configured: gateway.configured(), mode: 'server_side_only' });
        return true;
      }
      if (!gateway.configured()) throw new GatewayError(503, 'sales_execution_unconfigured', 'Conexão server-side do Sales Execution ainda não foi configurada.');

      if (url.pathname === '/api/sales-execution/lists' && req.method === 'GET') {
        success(res, 200, await gateway.getLists());
        return true;
      }
      if (url.pathname === '/api/sales-execution/lists/import' && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 201, await gateway.importList(await body(req)));
        return true;
      }
      const membersMatch = url.pathname.match(/^\/api\/sales-execution\/lists\/([0-9a-f-]+)\/members$/i);
      if (membersMatch && req.method === 'GET') {
        success(res, 200, await gateway.getListMembers(membersMatch[1]));
        return true;
      }
      if (url.pathname === '/api/sales-execution/sessions' && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 201, await gateway.startSession(await body(req)));
        return true;
      }
      const sessionMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)$/i);
      if (sessionMatch && req.method === 'GET') {
        success(res, 200, await gateway.getSession(sessionMatch[1]));
        return true;
      }
      const currentMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)\/current$/i);
      if (currentMatch && req.method === 'GET') {
        success(res, 200, await gateway.getCurrent(currentMatch[1]));
        return true;
      }
      const resultMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)\/results$/i);
      if (resultMatch && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 200, await gateway.recordResult(resultMatch[1], await body(req)));
        return true;
      }
      const decisionMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)\/decision-maker$/i);
      if (decisionMatch && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 200, await gateway.saveDecisionMaker(decisionMatch[1], await body(req)));
        return true;
      }
      const meetingMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)\/meetings$/i);
      if (meetingMatch && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 201, await gateway.scheduleMeeting(meetingMatch[1], await body(req)));
        return true;
      }
      const advanceMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)\/advance$/i);
      if (advanceMatch && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 200, await gateway.advance(advanceMatch[1], await body(req)));
        return true;
      }
      const finishMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]+)\/finish$/i);
      if (finishMatch && req.method === 'POST') {
        if (!allowWrite(req)) throw new GatewayError(429, 'rate_limited', 'Muitas gravações. Aguarde um minuto.');
        success(res, 200, await gateway.finishSession(finishMatch[1]));
        return true;
      }
      throw new GatewayError(404, 'sales_execution_route_not_found', 'Rota Sales Execution não encontrada.');
    } catch (error) {
      fail(res, error);
      return true;
    } finally {
      logger.info('[sales-execution] ' + req.method + ' ' + url.pathname + ' ' + (Date.now() - started) + 'ms');
    }
  };
}

module.exports = {
  GatewayError,
  OUTCOMES,
  ROLE_CATEGORIES,
  CONTINUATION_OUTCOMES,
  createSupabaseRestStore,
  createSalesExecutionGateway,
  createHttpHandler,
  normalizePhoneE164,
  normalizeCnpj,
  normalizeCompanyName,
  determineMode: function(company, contact, opportunity) {
    const gateway = createSalesExecutionGateway({ store: { configured: () => true } });
    return gateway && company ? (function() {
      const pipeline = opportunity && opportunity.pipeline_stage ? opportunity.pipeline_stage : 'PROSPECT';
      const relationship = (opportunity && opportunity.relationship_status) || company.relationship_status || 'UNKNOWN';
      if (relationship === 'CUSTOMER' || pipeline === 'WON') return 'CUSTOMER';
      if (['PROPOSAL', 'NEGOTIATION'].includes(pipeline)) return 'PROPOSAL';
      if (pipeline.startsWith('MEETING_')) return 'MEETING';
      if (contact && (contact.decision_level === 'gatekeeper' || contact.role_category === 'GATEKEEPER')) return 'GATEKEEPER';
      if (opportunity && opportunity.next_action_type === 'FOLLOW_UP') return 'FOLLOW_UP';
      if (contact && contact.decision_level === 'decision_maker') return 'DECISION_MAKER';
      if ((PIPELINE_RANK[pipeline] || 0) >= PIPELINE_RANK.DECISION_MAKER_IDENTIFIED) return 'DECISION_MAKER';
      return 'GATEKEEPER';
    }()) : 'GATEKEEPER';
  }
};
