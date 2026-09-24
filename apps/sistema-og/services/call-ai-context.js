(function attachCallAiContext(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_CALL_AI_CONTEXT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCallAiContext() {
  'use strict';
  const BUDGET = Object.freeze({ maxRecentInteractions: 6, maxContextChars: 6000, maxKnowledgeSections: 3, defaultResponseLength: 'short' });
  function compactText(value, max = 900) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max); }
  function buildAccountSummary(lead) {
    if (!lead) return '';
    const parts = [lead.empresa || lead.nome];
    if (lead.nome && lead.nome !== lead.empresa) parts.push(`${lead.nome}${lead.cargo ? ` (${lead.cargo})` : ''}`);
    if (lead.fleetSize) parts.push(`Frota registrada: ${lead.fleetSize} veículos`);
    if (lead.pain) parts.push(`Dor registrada: ${lead.pain}`);
    if (lead.nextAction) parts.push(`Próxima ação: ${lead.nextAction}`);
    return compactText(lead.accountSummary || parts.filter(Boolean).join('. '), 1000);
  }
  function build(lead, options = {}) {
    if (!lead) return null;
    const recentLimit = Math.max(1, Math.min(Number(options.recentLimit) || BUDGET.maxRecentInteractions, 10));
    const needsPhone = ['create_message', 'personalize_message'].includes(options.intent || '');
    const recentInteractions = (lead.interactions || []).slice(-recentLimit).map(item => ({ at: item.at, type: compactText(item.type, 60), result: compactText(item.result, 100), note: compactText(item.note, 500), important: Boolean(item.important) }));
    const context = {
      contextVersion: `${lead.updatedAt || lead.lastContactAt || lead.createdDate || '0'}:${recentInteractions.length}`,
      company: { id: lead.id, name: compactText(lead.empresa || lead.nome, 160), segmentId: compactText(lead.segmentId, 80), fleetSize: Number(lead.fleetSize || 0) },
      contact: { id: lead.contactId || '', name: compactText(lead.nome, 120), role: compactText(lead.cargo || lead.decisionMaker, 100), ...(needsPhone ? { phone: compactText(lead.telefone, 30) } : {}) },
      stage: compactText(lead.status || 'novo', 60), accountSummary: buildAccountSummary(lead), recentInteractions,
      objections: Array.isArray(lead.objections) ? lead.objections.slice(0, 5).map(item => compactText(item, 240)) : [],
      nextAction: { description: compactText(lead.nextAction, 240), dueAt: lead.followUpAt || '' },
      relevantOpportunity: (lead.opportunities || []).find(item => item.status !== 'closed') || null
    };
    if (JSON.stringify(context).length > BUDGET.maxContextChars) context.recentInteractions = context.recentInteractions.slice(-3);
    return context;
  }
  function cacheKey(context, intent) { return context?.company?.id ? [context.company.id, intent, context.contextVersion].join(':') : ''; }
  return { BUDGET, build, buildAccountSummary, cacheKey };
}));
