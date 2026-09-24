(function attachCrmService(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_CRM_SERVICE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCrmService() {
  'use strict';

  const clean = value => String(value || '').trim();
  const digits = value => clean(value).replace(/\D/g, '');
  const comparable = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

  function normalizeLead(lead = {}) {
    return {
      ...lead,
      id: lead.id || `LEAD-${Date.now().toString(36).toUpperCase()}`,
      empresa: clean(lead.empresa || lead.nome),
      nome: clean(lead.nome),
      telefone: digits(lead.telefone),
      status: clean(lead.status) || 'novo',
      priority: ['alta', 'media', 'baixa'].includes(lead.priority) ? lead.priority : 'media',
      fleetSize: Number.isFinite(Number(lead.fleetSize)) ? Number(lead.fleetSize) : 0,
      pain: clean(lead.pain),
      objections: Array.isArray(lead.objections) ? lead.objections : [],
      decisionMaker: clean(lead.decisionMaker),
      nextAction: clean(lead.nextAction),
      followUpAt: clean(lead.followUpAt),
      lastContactAt: clean(lead.lastContactAt),
      interactions: Array.isArray(lead.interactions) ? lead.interactions : [],
      contacts: Array.isArray(lead.contacts) ? lead.contacts : [],
      opportunities: Array.isArray(lead.opportunities) ? lead.opportunities : [],
      tasks: Array.isArray(lead.tasks) ? lead.tasks : []
    };
  }

  function findPossibleDuplicates(leads, prospect) {
    const companyKey = comparable(prospect.empresa);
    const phoneKey = digits(prospect.telefone);
    return (leads || []).filter(item => {
      const lead = normalizeLead(item);
      return (phoneKey && digits(lead.telefone) === phoneKey) || (companyKey && comparable(lead.empresa) === companyKey);
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
      cidadeUf: clean(input.cidadeUf),
      cnpj: '',
      segmentId: input.segmentId || 'transportadora',
      status: 'novo',
      priority: input.priority || 'media',
      nextAction: clean(input.nextAction),
      followUpAt: clean(input.followUpAt),
      observacoes: `Cadastro rápido em ${new Date(now).toLocaleDateString('pt-BR')}`,
      createdDate: now,
      createdBy: input.createdBy || null,
      assignedTo: input.assignedTo || null,
      updatedBy: input.updatedBy || null
    });
  }

  function getLeadById(leads, id) {
    return (leads || []).find(lead => String(lead.id) === String(id)) || null;
  }

  return { normalizeLead, findPossibleDuplicates, createProspect, getLeadById };
}));
