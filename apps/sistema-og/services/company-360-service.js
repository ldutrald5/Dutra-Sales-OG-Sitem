(function attachCompany360(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_COMPANY_360 = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCompany360() {
  'use strict';

  const clean = value => String(value ?? '').trim();
  const list = value => Array.isArray(value) ? value : [];
  const time = value => {
    const parsed = Date.parse(value || '');
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const byNewest = (a, b) => time(b.occurredAt || b.updatedAt || b.createdAt) - time(a.occurredAt || a.updatedAt || a.createdAt);
  const byDue = (a, b) => {
    const left = time(a.dueAt);
    const right = time(b.dueAt);
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;
    return left - right;
  };

  function isCanonical(record, type) {
    return record && record.entityType === type && clean(record.id);
  }

  function buildCompany360(graph = {}, companyId) {
    const id = clean(companyId);
    if (!id) throw new Error('companyId é obrigatório');
    const company = list(graph.companies).find(item => isCanonical(item, 'company') && clean(item.id) === id);
    if (!company) return null;

    const contacts = list(graph.contacts)
      .filter(item => isCanonical(item, 'contact') && clean(item.companyId) === id)
      .sort((a, b) => Number(Boolean(b.isDecisionMaker)) - Number(Boolean(a.isDecisionMaker)) || clean(a.name).localeCompare(clean(b.name), 'pt-BR'));

    const opportunities = list(graph.opportunities)
      .filter(item => isCanonical(item, 'opportunity') && clean(item.companyId) === id)
      .sort(byNewest);

    const activities = list(graph.activities)
      .filter(item => isCanonical(item, 'activity') && clean(item.companyId) === id)
      .sort(byNewest);

    const tasks = list(graph.tasks)
      .filter(item => isCanonical(item, 'task') && clean(item.companyId) === id)
      .sort(byDue);

    const openOpportunities = opportunities.filter(item => !['won', 'lost', 'closed'].includes(clean(item.stage).toLowerCase()));
    const openTasks = tasks.filter(item => !['done', 'completed', 'cancelled', 'canceled'].includes(clean(item.status).toLowerCase()));
    const decisionMakers = contacts.filter(item => item.isDecisionMaker === true);
    const pipelineValueCents = openOpportunities.reduce((total, item) => total + (Number.isInteger(item.valueCents) ? item.valueCents : 0), 0);

    return Object.freeze({
      company,
      contacts: Object.freeze(contacts),
      decisionMakers: Object.freeze(decisionMakers),
      opportunities: Object.freeze(opportunities),
      openOpportunities: Object.freeze(openOpportunities),
      activities: Object.freeze(activities),
      tasks: Object.freeze(tasks),
      openTasks: Object.freeze(openTasks),
      summary: Object.freeze({
        contacts: contacts.length,
        decisionMakers: decisionMakers.length,
        opportunities: opportunities.length,
        openOpportunities: openOpportunities.length,
        activities: activities.length,
        openTasks: openTasks.length,
        pipelineValueCents,
        lastActivityAt: activities[0]?.occurredAt || null,
        nextTaskAt: openTasks[0]?.dueAt || null
      })
    });
  }

  function listCompanies360(graph = {}) {
    return list(graph.companies)
      .filter(item => isCanonical(item, 'company'))
      .map(company => buildCompany360(graph, company.id))
      .filter(Boolean);
  }

  return { buildCompany360, listCompanies360 };
}));
