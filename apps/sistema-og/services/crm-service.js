(function attachCrmService(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_CRM_SERVICE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCrmService() {
  'use strict';

  const clean = value => String(value || '').trim();
  const digits = value => clean(value).replace(/\D/g, '');
  const comparable = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const categoryKey = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const normalizePriorityBand = value => {
    const key = categoryKey(value);
    if (key.includes('urgent')) return 'urgente';
    if (key === 'alta' || key === 'high') return 'alta';
    if (key === 'baixa' || key === 'low') return 'baixa';
    return 'media';
  };
  const normalizeTemperature = value => {
    const key = categoryKey(value);
    return ['quente','morno','frio'].includes(key) ? key : '';
  };
  const normalizePotential = value => {
    const key = categoryKey(value);
    return ['alto','medio','baixo'].includes(key) ? key : '';
  };
  const normalizeConversationStage = value => {
    const key = categoryKey(value);
    return ['first_contact','talked','no_reply','waiting_response','interested','proposal','negotiation','customer','loyal_customer','not_interested'].includes(key) ? key : '';
  };
  const normalizeAdditionalPhones = value => {
    const seen = new Set();
    return (Array.isArray(value) ? value : []).map(item => typeof item === 'string' ? { label: '', phone: item } : item || {}).map(item => ({
      label: clean(item.label),
      phone: digits(item.phone),
      whatsapp: item.whatsapp !== false
    })).filter(item => item.phone && !seen.has(item.phone) && seen.add(item.phone)).slice(0, 10);
  };
  const normalizeReferrals = value => (Array.isArray(value) ? value : []).map(item => ({
    name: clean(item?.name),
    company: clean(item?.company),
    phone: digits(item?.phone),
    note: clean(item?.note)
  })).filter(item => item.name || item.company || item.phone || item.note).slice(0, 30);

  function normalizeLead(lead = {}) {
    return {
      ...lead,
      id: lead.id || `LEAD-${Date.now().toString(36).toUpperCase()}`,
      empresa: clean(lead.empresa || lead.nome),
      nome: clean(lead.nome),
      telefone: digits(lead.telefone),
      cnpj: digits(lead.cnpj),
      cpf: digits(lead.cpf),
      internalCode: clean(lead.internalCode || lead.codigo),
      email: clean(lead.email),
      additionalPhones: normalizeAdditionalPhones(lead.additionalPhones),
      referrals: normalizeReferrals(lead.referrals),
      status: clean(lead.status) || 'novo',
      priorityBand: normalizePriorityBand(lead.priorityBand || lead.sourcePriority || lead.priority),
      priority: normalizePriorityBand(lead.priorityBand || lead.sourcePriority || lead.priority) === 'urgente' ? 'alta' : normalizePriorityBand(lead.priorityBand || lead.sourcePriority || lead.priority),
      conversationStage: normalizeConversationStage(lead.conversationStage),
      temperature: normalizeTemperature(lead.temperature),
      potential: normalizePotential(lead.potential),
      sourcePriority: clean(lead.sourcePriority),
      sourceLabel: clean(lead.sourceLabel || lead.sourceChannel || lead.origem || lead.origin),
      sourceList: clean(lead.sourceList),
      accountSummary: clean(lead.accountSummary || lead.summary),
      importMeta: lead.importMeta && typeof lead.importMeta === 'object' ? { ...lead.importMeta } : null,
      fleetSize: Number.isFinite(Number(lead.fleetSize)) ? Number(lead.fleetSize) : 0,
      pain: clean(lead.pain),
      objections: Array.isArray(lead.objections) ? lead.objections : [],
      decisionMaker: clean(lead.decisionMaker),
      nextAction: clean(lead.nextAction),
      followUpAt: clean(lead.followUpAt),
      nextActionReason: clean(lead.nextActionReason),
      nextActionObjective: clean(lead.nextActionObjective),
      nextActionExpectedResult: clean(lead.nextActionExpectedResult),
      lastContactAt: clean(lead.lastContactAt),
      operationalStatus: clean(lead.operationalStatus) || (lead.interactions?.length ? 'WORKED_LEAD' : 'NEW_PROSPECT'),
      sourceChannel: clean(lead.sourceChannel || lead.origem) || 'sistema_og',
      batchTag: clean(lead.batchTag),
      enteredAt: clean(lead.enteredAt || lead.createdDate),
      interactions: Array.isArray(lead.interactions) ? lead.interactions : [],
      contacts: Array.isArray(lead.contacts) ? lead.contacts : [],
      opportunities: Array.isArray(lead.opportunities) ? lead.opportunities : [],
      tasks: Array.isArray(lead.tasks) ? lead.tasks : []
    };
  }

  function findPossibleDuplicates(leads, prospect) {
    const companyKey = comparable(prospect.empresa);
    const phoneKey = digits(prospect.telefone);
    const cnpjKey = digits(prospect.cnpj);
    const codeKey = comparable(prospect.internalCode || prospect.codigo);
    return (leads || []).filter(item => {
      const lead = normalizeLead(item);
      return (phoneKey && digits(lead.telefone) === phoneKey) ||
        (cnpjKey && digits(lead.cnpj) === cnpjKey) ||
        (codeKey && comparable(lead.internalCode) === codeKey) ||
        (companyKey && comparable(lead.empresa) === companyKey);
    });
  }

  function createProspect(input, options = {}) {
    const empresa = clean(input?.empresa);
    if (!empresa) throw new Error('Empresa é obrigatória');
    const now = options.now || new Date().toISOString();
    return normalizeLead({
      id: options.id || `LEAD-${Date.now().toString(36).toUpperCase()}`,
      empresa,
      nome: clean(input.nome),
      telefone: digits(input.telefone),
      cnpj: digits(input.cnpj),
      cpf: digits(input.cpf),
      internalCode: clean(input.internalCode || input.codigo),
      cidadeUf: clean(input.cidadeUf),
      segmentId: input.segmentId || 'transportadora',
      status: 'novo',
      priority: input.priority || 'media',
      priorityBand: input.priorityBand || input.priority || 'media',
      conversationStage: input.conversationStage || 'first_contact',
      temperature: input.temperature || '',
      potential: input.potential || '',
      sourceLabel: input.sourceLabel || input.sourceChannel || 'Sistema OG',
      sourceList: input.sourceList || 'Cadastro rápido',
      nextAction: clean(input.nextAction),
      followUpAt: clean(input.followUpAt),
      nextActionReason: clean(input.nextActionReason),
      nextActionObjective: clean(input.nextActionObjective),
      nextActionExpectedResult: clean(input.nextActionExpectedResult),
      operationalStatus: input.operationalStatus || 'NEW_PROSPECT',
      sourceChannel: input.sourceChannel || 'sistema_og',
      batchTag: clean(input.batchTag),
      enteredAt: input.enteredAt || now,
      observacoes: `Cadastro rápido em ${new Date(now).toLocaleDateString('pt-BR')}`,
      createdDate: now,
      createdBy: input.createdBy || null,
      assignedTo: input.assignedTo || null,
      updatedBy: input.updatedBy || null
    });
  }


  function searchableText(lead = {}) {
    const item = normalizeLead(lead);
    const values = [
      item.empresa, item.nome, item.telefone, item.cnpj, item.cpf, item.internalCode,
      item.email, item.cidadeUf, item.decisionMaker, item.nextAction, item.nextActionReason,
      item.nextActionObjective, item.nextActionExpectedResult, item.pain,
      item.sourceChannel, item.sourceLabel, item.sourceList, item.batchTag, item.conversationStage,
      item.temperature, item.potential, item.priorityBand, item.accountSummary,
      ...item.additionalPhones.flatMap(phone => [phone.label, phone.phone]),
      ...item.referrals.flatMap(referral => [referral.name, referral.company, referral.phone, referral.note])
    ];
    return values.map(value => comparable(value)).filter(Boolean).join(' ');
  }

  function matchesSearch(lead, query) {
    const q = comparable(query);
    if (!q) return true;
    return searchableText(lead).includes(q);
  }

  function findInternalCodeConflict(leads, code, excludeId = null) {
    const key = comparable(code);
    if (!key) return null;
    return (leads || []).find(item => String(item.id) !== String(excludeId || '') && comparable(normalizeLead(item).internalCode) === key) || null;
  }

  function updateLeadProfile(lead, input = {}, options = {}) {
    if (!lead?.id) throw new Error('Cliente inválido.');
    const merged = normalizeLead({
      ...lead,
      ...input,
      id: lead.id,
      internalCode: input.internalCode ?? lead.internalCode,
      telefone: input.telefone ?? lead.telefone,
      additionalPhones: input.additionalPhones ?? lead.additionalPhones,
      referrals: input.referrals ?? lead.referrals,
      objections: Array.isArray(input.objections) ? input.objections : lead.objections,
      updatedAt: options.now || new Date().toISOString()
    });
    if (!merged.empresa && !merged.nome) throw new Error('Informe empresa ou contato.');
    return merged;
  }

  const EDITABLE_PROFILE_FIELDS = Object.freeze([
    'empresa','nome','internalCode','telefone','additionalPhones','email','cnpj','cpf','cidadeUf','segmentId',
    'status','priority','priorityBand','conversationStage','temperature','potential','decisionMaker','fleetSize','pain','objections','nextAction','followUpAt','nextActionReason','nextActionObjective','nextActionExpectedResult','sourceChannel','sourceLabel','sourceList','accountSummary',
    'referrals','observacoes'
  ]);

  function diffProfile(before, after) {
    return EDITABLE_PROFILE_FIELDS.filter(field => JSON.stringify(before?.[field] ?? null) !== JSON.stringify(after?.[field] ?? null));
  }

  function getLeadById(leads, id) {
    return (leads || []).find(lead => String(lead.id) === String(id)) || null;
  }

  return { normalizeLead, findPossibleDuplicates, createProspect, getLeadById, searchableText, matchesSearch, findInternalCodeConflict, updateLeadProfile, diffProfile };
}));
