(function attachCanonicalEditor(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_CANONICAL_EDITOR = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCanonicalEditor() {
  'use strict';

  const clean = value => String(value ?? '').trim();
  const list = value => Array.isArray(value) ? value : [];
  const clone = value => JSON.parse(JSON.stringify(value));

  function requireDomain(domain) {
    if (!domain?.createCompany || !domain?.createContact || !domain?.validateGraph) throw new Error('Canonical Domain indisponível');
  }

  function ensureUniqueLegacyLead(companies, legacyLeadId, exceptId = null) {
    const bridge = clean(legacyLeadId);
    if (!bridge) return;
    const duplicate = list(companies).find(item => clean(item.legacyLeadId) === bridge && clean(item.id) !== clean(exceptId));
    if (duplicate) throw new Error('lead legado já vinculado a outra Company');
  }

  function saveCompany(graph, input, options = {}) {
    requireDomain(options.domain);
    const next = clone(graph || {});
    next.companies = list(next.companies);
    for (const key of ['contacts', 'opportunities', 'activities', 'tasks']) next[key] = list(next[key]);
    ensureUniqueLegacyLead(next.companies, input?.legacyLeadId, input?.id);
    const existingIndex = next.companies.findIndex(item => clean(item.id) === clean(input?.id));
    const previous = existingIndex >= 0 ? next.companies[existingIndex] : null;
    const company = options.domain.createCompany({ ...previous, ...input }, { now: options.now });
    if (existingIndex >= 0) next.companies[existingIndex] = company;
    else next.companies.push(company);
    const validation = options.domain.validateGraph(next);
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return { graph: next, company };
  }

  function saveContact(graph, input, options = {}) {
    requireDomain(options.domain);
    const next = clone(graph || {});
    for (const key of ['companies', 'contacts', 'opportunities', 'activities', 'tasks']) next[key] = list(next[key]);
    const existingIndex = next.contacts.findIndex(item => item?.entityType === 'contact' && clean(item.id) === clean(input?.id));
    const previous = existingIndex >= 0 ? next.contacts[existingIndex] : null;
    const contact = options.domain.createContact({ ...previous, ...input }, { now: options.now });
    if (existingIndex >= 0) next.contacts[existingIndex] = contact;
    else next.contacts.push(contact);
    const validation = options.domain.validateGraph(next);
    if (!validation.valid) throw new Error(validation.errors.join('; '));
    return { graph: next, contact };
  }

  return { saveCompany, saveContact };
}));
