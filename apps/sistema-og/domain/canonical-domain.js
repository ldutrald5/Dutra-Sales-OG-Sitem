(function attachCanonicalDomain(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_CANONICAL_DOMAIN = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCanonicalDomain() {
  'use strict';

  const ENTITY_TYPES = Object.freeze(['company', 'contact', 'opportunity', 'activity', 'task']);

  function clean(value) { return String(value ?? '').trim(); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function iso(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) throw new Error('Data inválida');
    return date.toISOString();
  }
  function requireId(record, type) {
    if (!clean(record?.id)) throw new Error(`${type} exige id`);
    return clean(record.id);
  }
  function base(record, type, options = {}) {
    const now = iso(options.now);
    return {
      ...clone(record || {}),
      id: requireId(record, type),
      entityType: type,
      createdAt: record?.createdAt ? iso(record.createdAt) : now,
      updatedAt: record?.updatedAt ? iso(record.updatedAt) : now,
      archivedAt: record?.archivedAt ? iso(record.archivedAt) : null
    };
  }

  function createCompany(record, options = {}) {
    const next = base(record, 'company', options);
    next.name = clean(record?.name);
    if (!next.name) throw new Error('company exige name');
    next.legacyLeadId = clean(record?.legacyLeadId) || null;
    next.cnpj = clean(record?.cnpj).replace(/\D/g, '') || null;
    next.segment = clean(record?.segment) || null;
    next.status = clean(record?.status) || 'prospect';
    return next;
  }

  function createContact(record, options = {}) {
    const next = base(record, 'contact', options);
    next.companyId = clean(record?.companyId);
    next.name = clean(record?.name);
    if (!next.companyId || !next.name) throw new Error('contact exige companyId e name');
    next.role = clean(record?.role) || 'contact';
    next.phone = clean(record?.phone).replace(/\D/g, '') || null;
    next.email = clean(record?.email).toLowerCase() || null;
    next.isDecisionMaker = record?.isDecisionMaker === true;
    return next;
  }

  function createOpportunity(record, options = {}) {
    const next = base(record, 'opportunity', options);
    next.companyId = clean(record?.companyId);
    if (!next.companyId) throw new Error('opportunity exige companyId');
    next.title = clean(record?.title) || 'Oportunidade';
    next.stage = clean(record?.stage) || 'open';
    next.valueCents = Number.isInteger(record?.valueCents) && record.valueCents >= 0 ? record.valueCents : null;
    next.currency = clean(record?.currency) || 'BRL';
    return next;
  }

  function createActivity(record, options = {}) {
    const next = base(record, 'activity', options);
    next.companyId = clean(record?.companyId);
    next.type = clean(record?.type);
    next.occurredAt = record?.occurredAt ? iso(record.occurredAt) : iso(options.now);
    if (!next.companyId || !next.type) throw new Error('activity exige companyId e type');
    next.contactId = clean(record?.contactId) || null;
    next.opportunityId = clean(record?.opportunityId) || null;
    next.summary = clean(record?.summary);
    return next;
  }

  function createTask(record, options = {}) {
    const next = base(record, 'task', options);
    next.companyId = clean(record?.companyId);
    next.title = clean(record?.title);
    if (!next.companyId || !next.title) throw new Error('task exige companyId e title');
    next.opportunityId = clean(record?.opportunityId) || null;
    next.dueAt = record?.dueAt ? iso(record.dueAt) : null;
    next.status = clean(record?.status) || 'open';
    return next;
  }

  function validateGraph(graph = {}) {
    const errors = [];
    const companies = Array.isArray(graph.companies) ? graph.companies : [];
    const contacts = Array.isArray(graph.contacts) ? graph.contacts : [];
    const opportunities = Array.isArray(graph.opportunities) ? graph.opportunities : [];
    const activities = Array.isArray(graph.activities) ? graph.activities : [];
    const tasks = Array.isArray(graph.tasks) ? graph.tasks : [];
    const collections = { companies, contacts, opportunities, activities, tasks };
    const seen = new Set();
    for (const [key, items] of Object.entries(collections)) {
      for (const item of items) {
        if (!item?.id) { errors.push(`${key} contém item sem id`); continue; }
        const scoped = `${key}:${item.id}`;
        if (seen.has(scoped)) errors.push(`${key} contém id duplicado: ${item.id}`);
        seen.add(scoped);
      }
    }
    const companyIds = new Set(companies.map(item => String(item.id)));
    const opportunityIds = new Set(opportunities.map(item => String(item.id)));
    for (const [key, items] of Object.entries({ contacts, opportunities, activities, tasks })) {
      for (const item of items) if (!companyIds.has(String(item.companyId))) errors.push(`${key} ${item.id || '?'} referencia companyId inexistente`);
    }
    for (const item of [...activities, ...tasks]) {
      if (item.opportunityId && !opportunityIds.has(String(item.opportunityId))) errors.push(`${item.entityType || 'registro'} ${item.id || '?'} referencia opportunityId inexistente`);
    }
    return { valid: errors.length === 0, errors };
  }

  function createEmptyGraph() {
    return { schemaVersion: 1, companies: [], contacts: [], opportunities: [], activities: [], tasks: [] };
  }

  return {
    SCHEMA_VERSION: 1,
    ENTITY_TYPES,
    createEmptyGraph,
    createCompany,
    createContact,
    createOpportunity,
    createActivity,
    createTask,
    validateGraph
  };
}));
