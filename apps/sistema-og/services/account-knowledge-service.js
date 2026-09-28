(function attachAccountKnowledge(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_ACCOUNT_KNOWLEDGE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAccountKnowledge() {
  'use strict';

  function clean(value) { return String(value ?? '').trim(); }
  function normalize(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function unique(values) {
    const seen = new Set();
    const output = [];
    for (const value of values.flat(Infinity).map(clean).filter(Boolean)) {
      const key = normalize(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      output.push(value);
    }
    return output;
  }
  function queryForLead(lead = {}) {
    const recentNotes = Array.isArray(lead.interactions)
      ? lead.interactions.slice(-3).map(item => item?.note || item?.result)
      : [];
    const terms = unique([
      lead.segmentId,
      lead.segment,
      lead.pain,
      lead.objection,
      lead.objections,
      lead.nextAction,
      lead.vehicleTypes,
      lead.fleetProfile,
      lead.temperature,
      lead.potential,
      recentNotes
    ]);
    return terms.join(' ').slice(0, 500);
  }
  function contextSummary(lead = {}) {
    const parts = unique([
      lead.segmentId && `Segmento: ${lead.segmentId}`,
      lead.pain && `Dor: ${lead.pain}`,
      (lead.objection || lead.objections) && `Objeção: ${lead.objection || lead.objections}`,
      lead.nextAction && `Próxima ação: ${lead.nextAction}`
    ]);
    return parts.join(' · ');
  }
  function commandForLead(lead = {}) {
    const query = queryForLead(lead);
    return query ? `brain ${query}` : 'brain produto vendas';
  }

  return { normalize, queryForLead, contextSummary, commandForLead };
}));
