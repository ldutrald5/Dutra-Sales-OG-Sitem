(function attachSalesDesk(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_DESK = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesDesk(root) {
  'use strict';
  function lastInteraction(lead) { return (lead.interactions || []).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))[0] || null; }
  function intelligence() {
    if (root?.OG_LEAD_INTELLIGENCE?.score) return root.OG_LEAD_INTELLIGENCE;
    if (typeof require === 'function') return require('./lead-intelligence.js');
    throw new Error('Motor de inteligência de leads indisponível');
  }
  function score(lead, now = Date.now()) {
    const reference = now instanceof Date ? now : new Date(now);
    return intelligence().score(lead, reference);
  }
  function selectQueue(leads, filter = 'all', query = '', now = new Date()) {
    const today = now.toISOString().slice(0, 10);
    const q = String(query || '').trim().toLowerCase();
    return (leads || []).filter(lead => {
      if (['fechado', 'perdido'].includes(lead.status)) return false;
      if (q && ![
        lead.empresa, lead.nome, lead.telefone, lead.internalCode, lead.cnpj, lead.nextAction,
        ...(lead.additionalPhones || []).flatMap(item => [item?.label, item?.phone]),
        ...(lead.referrals || []).flatMap(item => [item?.name, item?.company, item?.phone])
      ].some(value => String(value || '').toLowerCase().includes(q))) return false;
      const due = String(lead.followUpAt || '').slice(0, 10);
      if (filter === 'overdue') return due && due < today;
      if (filter === 'today') return due === today;
      if (filter === 'priority') return lead.priority === 'alta';
      if (filter === 'no-action') return !String(lead.nextAction || '').trim();
      return true;
    }).sort((a, b) => score(b, now) - score(a, now));
  }
  return { lastInteraction, score, selectQueue };
}));
