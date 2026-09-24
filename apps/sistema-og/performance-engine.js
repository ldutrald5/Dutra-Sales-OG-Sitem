(function attachPerformanceEngine(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_PERFORMANCE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPerformanceEngine() {
  'use strict';

  const STAGES = [
    { id: 'novo', label: 'Novo lead' },
    { id: 'contatado', label: 'Contatado' },
    { id: 'diagnostico', label: 'Diagnóstico' },
    { id: 'proposta_enviada', label: 'Proposta' },
    { id: 'negociacao', label: 'Negociação' },
    { id: 'fechado', label: 'Venda' },
    { id: 'pos_venda', label: 'Pós-venda' }
  ];

  function dateOf(value) {
    const date = new Date(value || 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function inPeriod(value, from, to) {
    const date = dateOf(value); if (!date) return false;
    return date >= from && date <= to;
  }

  function stateFromCity(value) {
    const match = String(value || '').toUpperCase().match(/(?:-|\/|\s)([A-Z]{2})\s*$/);
    return match ? match[1] : '';
  }

  function normalizedStage(status) {
    const value = String(status || 'novo').toLowerCase();
    if (value === 'perdido') return 'perdido';
    if (['diagnostico', 'qualificacao'].includes(value)) return 'diagnostico';
    if (['pos_venda', 'cliente'].includes(value)) return 'pos_venda';
    return STAGES.some(stage => stage.id === value) ? value : 'novo';
  }

  function calculate(input = {}, filters = {}) {
    const leads = Array.isArray(input.leads) ? input.leads : [];
    const operations = input.operations || {};
    const from = dateOf(filters.from) || new Date(0);
    const to = dateOf(filters.to) || new Date('9999-12-31T23:59:59.999Z');
    const scopedLeads = leads.filter(lead => {
      if (filters.segment && filters.segment !== 'all' && lead.segmentId !== filters.segment) return false;
      if (filters.status && filters.status !== 'all' && normalizedStage(lead.status) !== filters.status) return false;
      if (filters.state && filters.state !== 'all' && stateFromCity(lead.cidadeUf) !== filters.state) return false;
      if (filters.seller && filters.seller !== 'all' && String(lead.vendedor || '') !== filters.seller) return false;
      if (filters.origin && filters.origin !== 'all' && String(lead.origin || lead.origem || '') !== filters.origin) return false;
      return true;
    });
    const leadIds = new Set(scopedLeads.map(lead => String(lead.id)));
    const interactions = scopedLeads.flatMap(lead => (lead.interactions || []).map(item => ({ ...item, clientId: lead.id }))).filter(item => inPeriod(item.at, from, to));
    const events = (operations.activityEvents || []).filter(item => inPeriod(item.at, from, to) && (!item.clientId || leadIds.has(String(item.clientId))));
    const shares = (operations.materialShares || []).filter(item => item.sentConfirmedByUser && inPeriod(item.sentAt, from, to) && leadIds.has(String(item.clientId)));
    const sales = (operations.sales || []).filter(item => inPeriod(item.soldAt || item.createdAt, from, to) && leadIds.has(String(item.clientId)));
    const commissions = (operations.commissions || []).filter(item => inPeriod(item.createdAt, from, to));
    const stageCounts = { ...Object.fromEntries(STAGES.map(stage => [stage.id, 0])), perdido: 0 };
    scopedLeads.forEach(lead => { stageCounts[normalizedStage(lead.status)] += 1; });
    const closed = stageCounts.fechado + stageCounts.pos_venda;
    const eligible = scopedLeads.filter(lead => lead.status !== 'perdido').length;
    const conversion = eligible ? (closed / eligible) * 100 : null;
    const now = to.getTime() < Date.now() ? to : new Date();
    const stalled = scopedLeads.filter(lead => !['fechado', 'pos_venda', 'perdido'].includes(normalizedStage(lead.status))).map(lead => {
      const reference = dateOf(lead.lastContactAt || lead.createdDate);
      const days = reference ? Math.floor((now - reference) / 86400000) : null;
      return { id: lead.id, name: lead.empresa || lead.nome || 'Cliente sem nome', stage: normalizedStage(lead.status), days, nextAction: lead.nextAction || '' };
    }).filter(item => item.days === null || item.days >= 14).sort((a, b) => (b.days ?? 99999) - (a.days ?? 99999));
    const revenueCents = sales.reduce((sum, item) => sum + Number(item.totalCents || 0), 0);
    const commissionCents = commissions.reduce((sum, item) => sum + Number(item.amountCents || 0), 0);
    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      sources: { clients: scopedLeads.length, interactions: interactions.length, events: events.length, confirmedShares: shares.length, sales: sales.length, commissions: commissions.length },
      stageCounts, stages: STAGES, conversion: { value: conversion, numerator: closed, denominator: eligible, smallBase: eligible > 0 && eligible < 20 },
      activity: { interactions: interactions.length, confirmedShares: shares.length, total: interactions.length + shares.length },
      commercial: { opportunities: eligible, sales: sales.length, revenueCents, commissionCents },
      stalled,
      limitations: { stageDuration: !events.some(item => item.type === 'client.stage_changed'), revenue: sales.length === 0, commission: commissions.length === 0 }
    };
  }

  return { STAGES, normalizedStage, stateFromCity, calculate };
}));
