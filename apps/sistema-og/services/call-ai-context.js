(function attachCallAiContext(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_CALL_AI_CONTEXT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCallAiContext() {
  'use strict';
  function build(lead, options = {}) {
    if (!lead) return null;
    const recentLimit = Math.max(1, Math.min(Number(options.recentLimit) || 5, 10));
    return {
      company: { id: lead.id, name: lead.empresa || lead.nome || '', segmentId: lead.segmentId || '', fleetSize: Number(lead.fleetSize || 0) },
      contact: { id: lead.contactId || '', name: lead.nome || '', phone: lead.telefone || '', role: lead.cargo || lead.decisionMaker || '' },
      stage: lead.status || 'novo',
      recentInteractions: (lead.interactions || []).slice(-recentLimit).map(item => ({ at: item.at, type: item.type, result: item.result || '', note: item.note || '' })),
      objections: Array.isArray(lead.objections) ? lead.objections.slice(0, 5) : [],
      nextAction: { description: lead.nextAction || '', dueAt: lead.followUpAt || '' },
      relevantOpportunity: (lead.opportunities || []).find(item => item.status !== 'closed') || null
    };
  }
  return { build };
}));
