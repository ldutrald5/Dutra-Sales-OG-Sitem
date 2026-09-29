(function attachLeadIntelligence(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_LEAD_INTELLIGENCE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createLeadIntelligence() {
  'use strict';

  const CONVERSATION_STAGES = Object.freeze([
    { id: 'first_contact', label: 'Ainda não conversei', tone: 'blue', weight: 8 },
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

  const CRM_ACCOUNT_VIEWS = Object.freeze([
    { id: 'all', label: 'Todos', description: 'Base completa, sem criar cópias do cliente.' },
    { id: 'attack', label: 'Fila de ataque', description: 'Prospects ativos fora da conferência ERP, ordenados pela importância comercial.' },
    { id: 'customers', label: 'Clientes', description: 'Contas com venda fechada ou relação de cliente registrada.' },
    { id: 'prospects', label: 'Prospects', description: 'Contas comerciais ainda abertas, incluindo primeiro contato, retorno e negociação.' },
    { id: 'proposals', label: 'Propostas', description: 'Contas com proposta, cotação, orçamento ou negociação registrados.' },
    { id: 'erp_review', label: 'ERP para conferir', description: 'Registros marcados explicitamente para conferência no ERP antes da abordagem.' },
    { id: 'strategic', label: 'Estratégicas', description: 'Prioridade alta/urgente, potencial alto ou frota registrada com 50+ veículos.' },
    { id: 'talked', label: 'Já conversados', description: 'Contas com evidência de conversa, tentativa, retorno ou negociação registrada.' }
  ]);

  const clean = value => String(value ?? '').trim();
  const key = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const textKey = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const byId = (list, id) => list.find(item => item.id === id) || null;

  function inferStageFromText(value) {
    const text = textKey(value);
    if (!text) return '';
    if (/\bsem interesse\b|\bnao tem interesse\b|\bnao quer (comprar|seguir|continuar)\b|\bdesistiu\b/.test(text)) return 'not_interested';
    if (/\bnao atende\b|\bnao atendeu\b|\brecusou chamada\b|\bchamada recusada\b|\bnao respondeu\b|\bsem resposta\b|\bnao consegui contato\b|\bcaixa postal\b/.test(text)) return 'no_reply';
    if (/\bem reuniao\b|\bentrar em contato mais tarde\b|\bligar mais tarde\b|\bligar depois\b|\bretornar\b|\bretorno combinado\b|\baguardando resposta\b|\baguardando retorno\b/.test(text)) return 'waiting_response';
    if (/\bproposta enviada\b|\borcamento enviado\b|\bcotacao enviada\b/.test(text)) return 'proposal';
    if (/\bem negociacao\b|\bnegociando\b|\bcontraproposta\b/.test(text)) return 'negotiation';
    if (/\binteressad[oa]\b|\bdemonstrou interesse\b/.test(text)) return 'interested';
    return 'talked';
  }

  function priorityBand(lead = {}) {
    const raw = key(lead.priorityBand || lead.sourcePriority || lead.priority);
    if (raw.includes('urgent')) return 'urgente';
    if (raw === 'alta' || raw === 'high') return 'alta';
    if (raw === 'baixa' || raw === 'low') return 'baixa';
    return 'media';
  }

  function conversationStage(lead = {}) {
    if (key(lead.status) === 'perdido') return 'not_interested';

    const explicit = key(lead.conversationStage);
    if (byId(CONVERSATION_STAGES, explicit)) return explicit;

    const interactions = Array.isArray(lead.interactions) ? lead.interactions : [];
    const latest = interactions.slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')))[0];
    const latestResult = key(latest?.result);
    if (latestResult === 'nao_atendeu') return 'no_reply';
    if (latestResult === 'sem_interesse') return 'not_interested';

    const interactionEvidence = inferStageFromText([latest?.note, latest?.result].filter(Boolean).join(' '));
    if (interactionEvidence) return interactionEvidence;

    const storedEvidence = inferStageFromText([lead.accountSummary, lead.observacoes].filter(Boolean).join(' '));
    if (storedEvidence) return storedEvidence;

    if (interactions.length || lead.operationalStatus === 'WORKED_LEAD' || lead.status === 'contatado') return 'talked';
    if (lead.status === 'proposta_enviada') return 'proposal';
    if (lead.status === 'negociacao') return 'negotiation';

    // "fechado" descreve relação/comercial histórico, não o estado da conversa atual.
    // Um cliente OG ainda não trabalhado nesta rotina deve entrar como primeiro contato
    // até existir evidência de conversa, resposta ou estágio explícito.
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

  function needsErpReview(lead = {}) {
    const reviewText = textKey([
      lead.nextAction,
      lead.nextActionReason,
      lead.accountSummary,
      lead.observacoes,
      lead.importMeta?.reviewStatus,
      lead.importMeta?.reviewReason
    ].filter(Boolean).join(' '));
    return /\b(conferir|revisar|validar) erp\b/.test(reviewText);
  }

  function isCustomerAccount(lead = {}) {
    const stage = conversationStage(lead);
    return key(lead.status) === 'fechado' ||
      key(lead.operationalStatus) === 'customer' ||
      stage === 'customer' ||
      stage === 'loyal_customer';
  }

  function hasProposalEvidence(lead = {}) {
    const stage = conversationStage(lead);
    const status = key(lead.status);
    const source = textKey([lead.sourceLabel, lead.sourceList, lead.batchTag].filter(Boolean).join(' '));
    return stage === 'proposal' ||
      stage === 'negotiation' ||
      status === 'proposta_enviada' ||
      status === 'negociacao' ||
      /\b(proposta|cotacao|orcamento)\b/.test(source) ||
      (Array.isArray(lead.opportunities) && lead.opportunities.length > 0);
  }

  function isStrategicAccount(lead = {}) {
    const priority = priorityBand(lead);
    const fleet = Number(lead.fleetSize || lead.estimatedFleetSize || lead.confirmedFleetSize || 0);
    return priority === 'urgente' ||
      priority === 'alta' ||
      key(lead.potential) === 'alto' ||
      (Number.isFinite(fleet) && fleet >= 50);
  }

  function hasConversationEvidence(lead = {}) {
    const interactions = Array.isArray(lead.interactions) ? lead.interactions : [];
    if (interactions.length) return true;
    const stage = conversationStage(lead);
    if (['talked','no_reply','waiting_response','interested','proposal','negotiation','not_interested'].includes(stage)) return true;
    return Boolean(inferStageFromText([lead.accountSummary, lead.observacoes].filter(Boolean).join(' ')));
  }

  function matchesCrmView(lead = {}, viewId = 'all') {
    const id = clean(viewId || 'all');
    if (id === 'all') return true;
    const customer = isCustomerAccount(lead);
    const stage = conversationStage(lead);
    if (id === 'customers') return customer;
    if (id === 'prospects') return !customer && stage !== 'not_interested';
    if (id === 'proposals') return hasProposalEvidence(lead);
    if (id === 'erp_review') return needsErpReview(lead);
    if (id === 'strategic') return isStrategicAccount(lead);
    if (id === 'talked') return hasConversationEvidence(lead);
    if (id === 'attack') return !customer && stage !== 'not_interested' && !needsErpReview(lead);
    return true;
  }

  function crmViewDefinition(viewId = 'all') {
    return CRM_ACCOUNT_VIEWS.find(item => item.id === viewId) || CRM_ACCOUNT_VIEWS[0];
  }

  function summarizeCrmViews(leads = []) {
    const counts = Object.fromEntries(CRM_ACCOUNT_VIEWS.map(item => [item.id, 0]));
    for (const lead of leads) {
      for (const view of CRM_ACCOUNT_VIEWS) {
        if (matchesCrmView(lead, view.id)) counts[view.id] += 1;
      }
    }
    return counts;
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

  function scoreBreakdown(lead = {}, now = new Date()) {
    const reference = now instanceof Date ? now : new Date(now);
    const factors = [];
    const add = (id, label, points) => {
      if (!points) return;
      factors.push(Object.freeze({ id, label, points }));
    };

    const priority = priorityDefinition(lead);
    add('priority', `Prioridade ${priority.label.toLowerCase()}`, priority.weight);

    const stage = stageDefinition(lead);
    add('conversation', `Situação: ${stage.label}`, stage.weight);

    const due = lead.followUpAt ? new Date(lead.followUpAt) : null;
    if (due && !Number.isNaN(due.getTime())) {
      const distance = due.getTime() - reference.getTime();
      if (distance < 0) add('followup_overdue', 'Retorno vencido', 50);
      else if (distance <= 86400000) add('followup_24h', 'Retorno nas próximas 24h', 35);
      else if (distance <= 172800000) add('followup_48h', 'Retorno nas próximas 48h', 20);
    }

    const temperature = temperatureWeight(lead.temperature);
    if (temperature) add('temperature', `Temperatura ${clean(lead.temperature).toLowerCase()}`, temperature);

    const potential = potentialWeight(lead.potential);
    if (potential) add('potential', `Potencial ${clean(lead.potential).toLowerCase()}`, potential);

    if (!clean(lead.nextAction) && !['not_interested', 'customer', 'loyal_customer'].includes(conversationStage(lead))) {
      add('missing_next_action', 'Sem próxima ação definida', 8);
    }

    const total = factors.reduce((sum, factor) => sum + factor.points, 0);
    return Object.freeze({ total, factors: Object.freeze(factors) });
  }

  function score(lead = {}, now = new Date()) {
    return scoreBreakdown(lead, now).total;
  }

  function importanceBand(lead = {}, now = new Date()) {
    const value = score(lead, now);
    if (value >= 150) return 'critical';
    if (value >= 105) return 'high';
    if (value >= 70) return 'medium';
    return 'normal';
  }

  function nextBestAction(lead = {}, now = new Date()) {
    const breakdown = scoreBreakdown(lead, now);
    const timing = breakdown.factors.find(item => item.id.startsWith('followup_'));
    const stage = breakdown.factors.find(item => item.id === 'conversation');
    const priority = breakdown.factors.find(item => item.id === 'priority');
    const explicitAction = clean(lead.nextAction);
    const noActionStage = ['not_interested', 'customer', 'loyal_customer'].includes(conversationStage(lead));
    return Object.freeze({
      action: explicitAction || (noActionStage ? '' : 'Definir próxima ação'),
      dueAt: clean(lead.followUpAt),
      reason: clean(lead.nextActionReason) || timing?.label || stage?.label || priority?.label || '',
      objective: clean(lead.nextActionObjective),
      expectedResult: clean(lead.nextActionExpectedResult),
      explicitAction: Boolean(explicitAction),
      actionRequired: Boolean(explicitAction) || !noActionStage,
      score: breakdown.total,
      importance: importanceBand(lead, now),
      factors: breakdown.factors
    });
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
    CRM_ACCOUNT_VIEWS,
    inferStageFromText,
    priorityBand,
    priorityDefinition,
    conversationStage,
    stageDefinition,
    sourceLabel,
    needsErpReview,
    isCustomerAccount,
    hasProposalEvidence,
    isStrategicAccount,
    hasConversationEvidence,
    matchesCrmView,
    crmViewDefinition,
    summarizeCrmViews,
    score,
    scoreBreakdown,
    nextBestAction,
    importanceBand,
    filterSort,
    summarize
  };
}));
