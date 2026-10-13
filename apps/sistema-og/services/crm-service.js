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
      id: lead.id || createLeadId(),
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

  // Comparison keys never rewrite the stored address/number. E-mail comparison is
  // case-insensitive, but punctuation and provider aliases remain distinct.
  const emailIdentity = value => {
    const key = clean(value).toLowerCase();
    return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(key) ? key : '';
  };
  const brazilDdds = new Set('11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99'.split(' '));
  const isBrazilNationalPhone = key => brazilDdds.has(key.slice(0, 2)) &&
    ((key.length === 10 && /^[2-5]\d{7}$/.test(key.slice(2))) ||
     (key.length === 11 && /^9\d{8}$/.test(key.slice(2))));
  const phoneIdentity = value => {
    const key = digits(value), national = key.slice(2);
    return (key.length === 12 || key.length === 13) && key.startsWith('55') && isBrazilNationalPhone(national) ? national : key;
  };
  const documentIdentity = (value, length) => { const key = digits(value); return key.length === length ? key : ''; };
  const leadPhoneIdentities = lead => [...new Set([lead?.telefone, ...(Array.isArray(lead?.additionalPhones) ? lead.additionalPhones.map(item => typeof item === 'string' ? item : item?.phone) : [])].map(phoneIdentity).filter(Boolean))];
  let generatedIdSequence = 0;
  function createLeadId(leads = [], options = {}) {
    const existing = new Set(leads.map(lead => clean(lead?.id)));
    if (typeof options.idFactory === 'function') {
      const id = clean(options.idFactory());
      if (!id || existing.has(id)) throw new Error('ID de cliente ausente ou já utilizado. Nenhum registro foi gravado.');
      return id;
    }
    const prefix = clean(options.prefix) || 'LEAD';
    const time = new Date(options.now || Date.now()).getTime().toString(36).toUpperCase();
    let id;
    do {
      const entropy = typeof globalThis.crypto?.randomUUID === 'function' ? globalThis.crypto.randomUUID() : (++generatedIdSequence).toString(36).toUpperCase();
      id = `${prefix}-${time}-${entropy}`;
    } while (existing.has(id));
    return id;
  }
  const domainIdentity = value => {
    if (!clean(value)) return '';
    try { return new URL(/^https?:\/\//i.test(clean(value)) ? clean(value) : 'https://' + clean(value)).hostname.toLowerCase().replace(/^www\./, ''); }
    catch (_) { return ''; }
  };

  function findPossibleDuplicates(leads, prospect) {
    const companyKey = comparable(prospect.empresa);
    const phoneKey = phoneIdentity(prospect.telefone);
    const emailKey = emailIdentity(prospect.email);
    const domainKey = domainIdentity(prospect.website || prospect.site);
    const idKey = clean(prospect.id);
    const cnpjKey = documentIdentity(prospect.cnpj, 14);
    const cpfKey = documentIdentity(prospect.cpf, 11);
    const codeKey = comparable(prospect.internalCode || prospect.codigo);
    return (leads || []).filter(item => {
      const lead = normalizeLead(item);
      return (idKey && clean(lead.id) === idKey) ||
        (phoneKey && leadPhoneIdentities(lead).includes(phoneKey)) ||
        (emailKey && emailIdentity(lead.email) === emailKey) ||
        (domainKey && domainIdentity(lead.website || lead.site) === domainKey) ||
        (cnpjKey && documentIdentity(lead.cnpj, 14) === cnpjKey) ||
        (cpfKey && documentIdentity(lead.cpf, 11) === cpfKey) ||
        (codeKey && comparable(lead.internalCode) === codeKey) ||
        (companyKey && comparable(lead.empresa) === companyKey);
    });
  }

  // A possible duplicate is a review candidate, not permission to write. Quote
  // linking additionally requires every supplied identity to agree with one lead.
  function resolveClientIdentity(leads = [], client = {}) {
    const result = (status, candidateIds = [], reason = '', lead = null) => ({ status, lead, candidateIds, reason });
    const ids = [...new Set([client.clientId, client.leadId].map(clean).filter(Boolean))];
    if (ids.length > 1) return result('CONFLICT', ids, 'Identificadores de cliente incompatíveis.');
    const companyIdentity = value => clean(value).replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
    const company = companyIdentity(client.empresa || client.company || client.clientCompany);
    const definitions = [
      ['Código OG', comparable(client.internalCode || client.codigo), lead => comparable(lead.internalCode || lead.codigo)],
      ['CNPJ', documentIdentity(client.cnpj, 14), lead => [documentIdentity(lead.cnpj, 14)]],
      ['CPF', documentIdentity(client.cpf, 11), lead => [documentIdentity(lead.cpf, 11)]],
      ['Telefone', phoneIdentity(client.telefone || client.phone), lead => leadPhoneIdentities(lead)],
      ['E-mail', emailIdentity(client.email), lead => emailIdentity(lead.email)]
    ].filter(([, key]) => key).map(([label, key, read]) => [label, key, lead => { const values = read(lead); return (Array.isArray(values) ? values : [values]).filter(Boolean); }]);
    const namesMatch = lead => [lead.empresa, lead.legalName, lead.razaoSocial, lead.nomeFantasia, !lead.empresa && lead.nome]
      .some(name => company && companyIdentity(name) === company);
    let candidates = [];
    if (ids.length) {
      candidates = leads.filter(lead => clean(lead.id) === ids[0]);
      if (!candidates.length) return result('NONE', ids, 'Cliente identificado não existe no CRM atual.');
    } else {
      candidates = leads.filter(lead => definitions.some(([, key, read]) => read(lead).includes(key)));
      if (!candidates.length) {
        candidates = leads.filter(namesMatch);
        if (candidates.length > 1) return result('AMBIGUOUS', candidates.map(lead => lead.id), 'Há empresas homônimas; escolha o ID correto.');
      }
    }
    if (!candidates.length) return result('NONE', [], 'Nenhum cliente identificado.');
    if (candidates.length > 1) return result(ids.length ? 'AMBIGUOUS' : 'CONFLICT', candidates.map(lead => lead.id), 'Mais de uma identidade corresponde aos dados informados.');
    const lead = candidates[0];
    if (company && !namesMatch(lead)) return result('CONFLICT', [lead.id], 'Empresa exibida não corresponde ao cliente identificado.');
    for (const [label, key, read] of definitions) {
      if (read(lead).length && !read(lead).includes(key)) return result('CONFLICT', [lead.id], `${label} não corresponde ao cliente identificado.`);
      const others = leads.filter(item => clean(item.id) !== clean(lead.id) && read(item).includes(key));
      const explicitlySelectedSharedContact = ids.length === 1 && ['Telefone', 'E-mail'].includes(label) && read(lead).includes(key);
      if (others.length && !explicitlySelectedSharedContact) return result('CONFLICT', [lead.id, ...others.map(item => item.id)], `${label} também identifica outra empresa.`);
    }
    return result('MATCH', [lead.id], 'Identidade canônica consistente.', lead);
  }

  function createProspect(input, options = {}) {
    const empresa = clean(input?.empresa);
    if (!empresa) throw new Error('Empresa é obrigatória');
    const now = options.now || new Date().toISOString();
    return normalizeLead({
      id: options.id || createLeadId(options.leads || [], { now }),
      empresa,
      nome: clean(input.nome),
      telefone: digits(input.telefone),
      cnpj: digits(input.cnpj),
      cpf: digits(input.cpf),
      internalCode: clean(input.internalCode || input.codigo),
      email: clean(input.email),
      website: clean(input.website || input.site),
      importMeta: input.importMeta || null,
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
      observacoes: clean(input.observacoes) || `Cadastro rápido em ${new Date(now).toLocaleDateString('pt-BR')}`,
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

  return { normalizeLead, findPossibleDuplicates, createProspect, getLeadById, searchableText, matchesSearch, findInternalCodeConflict, updateLeadProfile, diffProfile, emailIdentity, phoneIdentity, createLeadId, resolveClientIdentity };
}));
