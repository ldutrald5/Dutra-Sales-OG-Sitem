(function attachLeadIntelligence(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_LEAD_INTELLIGENCE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createLeadIntelligence() {
  'use strict';

  const CONVERSATION_STAGES = Object.freeze([
    { id: 'first_contact', label: 'Primeiro contato', tone: 'blue', weight: 8 },
    { id: 'talked', label: 'Já conversei', tone: 'slate', weight: 12 },
    { id: 'no_reply', label: 'Não respondeu', tone: 'rose', weight: 15 },
    { id: 'waiting_response', label: 'Aguardando resposta', tone: 'yellow', weight: 20 },
    { id: 'interested', label: 'Interessado', tone: 'orange', weight: 30 },
    { id: 'proposal', label: 'Proposta enviada', tone: 'violet', weight: 28 },
    { id: 'negotiation', label: 'Negociação', tone: 'orange', weight: 35 },
    { id: 'customer', label: 'Cliente', tone: 'green', weight: 8 },
    { id: 'loyal_customer', label: 'Cliente fidelizado', tone: 'green', weight: 10 },
    { id: 'not_interested', label: 'Sem interesse', tone: 'muted', weight: -50 }
  ]);

  const PRIORITY_BANDS = Object.freeze([
    { id: 'urgente', label: 'Urgente', weight: 100 },
    { id: 'alta', label: 'Alta', weight: 70 },
    { id: 'media', label: 'Média', weight: 40 },
    { id: 'baixa', label: 'Baixa', weight: 15 }
  ]);

  const clean = value => String(value ?? '').trim();
  const key = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const byId = (list, id) => list.find(item => item.id === id) || null;

  function priorityBand(lead = {}) {
    const raw = key(lead.priorityBand || lead.sourcePriority || lead.priority);
    if (raw.includes('urgent')) return 'urgente';
    if (raw === 'alta' || raw === 'high') return 'alta';
    if (raw === 'baixa' || raw === 'low') return 'baixa';
    return 'media';
  }

  function conversationStage(lead = {}) {
    const explicit = key(lead.conversationStage);
    if (byId(CONVERSATION_STAGES, explicit)) return explicit;
    if (lead.status === 'proposta_enviada') return 'proposal';
    if (lead.status === 'negociacao') return 'negotiation';
    if (lead.status === 'fechado') return 'customer';
    const interactions = Array.isArray(lead.interactions) ? lead.interactions : [];
    const latest = interactions.slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))[0];
    if (key(latest?.result) === 'nao_atendeu') return 'no_reply';
    if (interactions.length || lead.operationalStatus === 'WORKED_LEAD') return 'talked';
    return 'first_contact';
  }

  function stageDefinition(leadOrStage) {
    const id = typeof leadOrStage === 'string' ? leadOrStage : conversationStage(leadOrStage);
    return byId(CONVERSATION_STAGES, id) || CONVERSATION_STAGES[0];
  }

  function priorityDefinition(leadOrBand) {
    const id = typeof leadOrBand === 'string' ? leadOrBand : priorityBand(leadOrBand);
    return byId(PRIORITY_BANDS, id) || PRIORITY_BANDS[2];
  }

  function sourceLabel(lead = {}) {
    return clean(lead.sourceLabel || lead.sourceChannel || lead.origem || lead.origin || lead.sourceList || 'Sistema OG');
  }

  function temperatureWeight(value) {
    const id = key(value);
    if (id === 'quente') return 20;
    if (id === 'morno') return 8;
    return 0;
  }

  function potentialWeight(value) {
    const id = key(value);
    if (id === 'alto') return 15;
    if (id === 'medio') return 6;
    return 0;
  }

  function score(lead = {}, now = new Date()) {
    const reference = now instanceof Date ? now : new Date(now);
    let value = priorityDefinition(lead).weight + stageDefinition(lead).weight;
    const due = lead.followUpAt ? new Date(lead.followUpAt) : null;
    if (due && !Number.isNaN(due.getTime())) {
      const distance = due.getTime() - reference.getTime();
      if (distance < 0) value += 50;
      else if (distance <= 86400000) value += 35;
      else if (distance <= 172800000) value += 20;
    }
    value += temperatureWeight(lead.temperature);
    value += potentialWeight(lead.potential);
    if (!clean(lead.nextAction) && !['not_interested', 'customer', 'loyal_customer'].includes(conversationStage(lead))) value += 8;
    return value;
  }

  function importanceBand(lead = {}, now = new Date()) {
    const value = score(lead, now);
    if (value >= 150) return 'critical';
    if (value >= 105) return 'high';
    if (value >= 70) return 'medium';
    return 'normal';
  }

  function filterSort(leads = [], filters = {}, now = new Date()) {
    const conversation = clean(filters.conversation || 'all');
    const source = clean(filters.source || 'all');
    const priority = clean(filters.priority || 'all');
    return leads.filter(lead => {
      if (conversation !== 'all' && conversationStage(lead) !== conversation) return false;
      if (source !== 'all' && sourceLabel(lead) !== source) return false;
      if (priority !== 'all' && priorityBand(lead) !== priority) return false;
      return true;
    }).sort((a, b) => {
      const diff = score(b, now) - score(a, now);
      if (diff) return diff;
      return String(b.updatedAt || b.lastContactAt || b.enteredAt || b.createdDate || '').localeCompare(String(a.updatedAt || a.lastContactAt || a.enteredAt || a.createdDate || ''));
    });
  }

  function summarize(leads = []) {
    const stages = Object.fromEntries(CONVERSATION_STAGES.map(item => [item.id, 0]));
    const priorities = Object.fromEntries(PRIORITY_BANDS.map(item => [item.id, 0]));
    const sources = {};
    for (const lead of leads) {
      stages[conversationStage(lead)] = (stages[conversationStage(lead)] || 0) + 1;
      priorities[priorityBand(lead)] = (priorities[priorityBand(lead)] || 0) + 1;
      const source = sourceLabel(lead);
      sources[source] = (sources[source] || 0) + 1;
    }
    return { total: leads.length, stages, priorities, sources };
  }

  return {
    CONVERSATION_STAGES,
    PRIORITY_BANDS,
    priorityBand,
    priorityDefinition,
    conversationStage,
    stageDefinition,
    sourceLabel,
    score,
    importanceBand,
    filterSort,
    summarize
  };
}));
