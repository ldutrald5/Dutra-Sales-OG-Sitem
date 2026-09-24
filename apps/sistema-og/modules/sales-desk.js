(function attachSalesDesk(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_DESK = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesDesk() {
  'use strict';
  function lastInteraction(lead) { return (lead.interactions || []).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))[0] || null; }
  function score(lead, now = Date.now()) {
    let value = lead.priority === 'alta' ? 40 : lead.priority === 'media' ? 20 : 0;
    const due = lead.followUpAt ? new Date(lead.followUpAt).getTime() : null;
    if (due && due < now) value += 50;
    else if (due && due - now < 86400000) value += 35;
    if (!lead.nextAction) value += 18;
    if (lead.status === 'negociacao') value += 20;
    return value;
  }
  function selectQueue(leads, filter = 'all', query = '', now = new Date()) {
    const today = now.toISOString().slice(0, 10);
    const q = String(query || '').trim().toLowerCase();
    return (leads || []).filter(lead => {
      if (['fechado', 'perdido'].includes(lead.status)) return false;
      if (q && ![lead.empresa, lead.nome, lead.telefone, lead.nextAction].some(value => String(value || '').toLowerCase().includes(q))) return false;
      const due = String(lead.followUpAt || '').slice(0, 10);
      if (filter === 'overdue') return due && due < today;
      if (filter === 'today') return due === today;
      if (filter === 'priority') return lead.priority === 'alta';
      if (filter === 'no-action') return !String(lead.nextAction || '').trim();
      return true;
    }).sort((a, b) => score(b, now.getTime()) - score(a, now.getTime()));
  }
  return { lastInteraction, score, selectQueue };
}));
