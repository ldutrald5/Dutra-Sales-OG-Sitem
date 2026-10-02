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

  function proposalEventEvidence(lead = {}, operations = {}) {
    const leadId = clean(lead.id);
    if (!leadId) return false;
    const proposalTypes = new Set([
      'proposal.prepared','proposal.sent','proposal.opened','proposal.reopened',
      'proposal_prepared','proposal_sent','proposal_opened','proposal_reopened'
    ]);
    return (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .some(item => clean(item.clientId || item.leadId) === leadId && proposalTypes.has(clean(item.type)));
  }

  function fleetProfile(lead = {}) {
    const fleet = Number(lead.fleetSize || lead.confirmedFleetSize || lead.estimatedFleetSize || 0);
    if (!Number.isFinite(fleet) || fleet <= 0) return Object.freeze({ id:'unknown', label:'Frota não levantada', count:0 });
    if (fleet === 1) return Object.freeze({ id:'single', label:'1 veículo', count:1 });
    if (fleet <= 9) return Object.freeze({ id:'2_9', label:'2–9 veículos', count:fleet });
    if (fleet <= 49) return Object.freeze({ id:'10_49', label:'10–49 veículos', count:fleet });
    return Object.freeze({ id:'50_plus', label:'50+ veículos', count:fleet });
  }

  function salesProfile(lead = {}, operations = {}) {
    const stage = stageDefinition(lead);
    const customer = isCustomerAccount(lead);
    const proposal = hasProposalEvidence(lead) || proposalEventEvidence(lead, operations);
    const contacted = hasConversationEvidence(lead) || Boolean(clean(lead.lastContactAt));
    const erpReview = needsErpReview(lead);

    let knowledge = Object.freeze({
      id:'unconfirmed',
      label:'Conhecimento OG não confirmado',
      basis:'Sem evidência explícita de contato, proposta ou compra.'
    });
    if (customer) {
      knowledge = Object.freeze({ id:'customer', label:'Já comprou / cliente', basis:'Relação de cliente registrada no CRM.' });
    } else if (proposal) {
      knowledge = Object.freeze({ id:'proposal', label:'Já recebeu proposta', basis:'Há evidência explícita de proposta/cotação.' });
    } else if (contacted) {
      knowledge = Object.freeze({ id:'contacted', label:'Contato OG já registrado', basis:'Há conversa ou tentativa registrada, sem presumir domínio do produto.' });
    }

    let route = Object.freeze({ id:'first_contact', label:'Primeiro contato', basis:'Sem histórico comercial explícito suficiente.' });
    if (erpReview) {
      route = Object.freeze({ id:'erp_review', label:'Conferir ERP antes de abordar', basis:'O registro possui pendência explícita de validação no ERP.' });
    } else if (customer && ['customer','loyal_customer'].includes(stage.id)) {
      route = Object.freeze({ id:'post_sale', label:'Pós-venda / expansão', basis:'Conta cliente com situação de cliente registrada.' });
    } else if (customer) {
      route = Object.freeze({ id:'customer_reactivation', label:'Reativação de cliente', basis:'Há relação de cliente, mas o contato atual precisa ser retomado.' });
    } else if (proposal || ['proposal','negotiation'].includes(stage.id)) {
      route = Object.freeze({ id:'proposal_followup', label:'Proposta / negociação', basis:'Há evidência de proposta ou negociação em andamento.' });
    } else if (['no_reply','waiting_response'].includes(stage.id)) {
      route = Object.freeze({ id:'follow_up', label:'Follow-up', basis:'A situação atual pede retorno, nova tentativa ou resposta.' });
    } else if (stage.id === 'interested') {
      route = Object.freeze({ id:'diagnosis', label:'Diagnóstico do interesse', basis:'Interesse registrado sem avanço confirmado para proposta.' });
    } else if (contacted) {
      route = Object.freeze({ id:'relationship', label:'Retomada / diagnóstico', basis:'Já existe contato registrado, sem proposta confirmada.' });
    }

    return Object.freeze({
      leadId:clean(lead.id),
      accountType:clean(lead.segmentId) || 'unclassified',
      fleet:fleetProfile(lead),
      knowledge,
      route,
      conversationStage:stage.id,
      conversationLabel:stage.label
    });
  }

  function approachGuide(lead = {}, operations = {}) {
    const profile = salesProfile(lead, operations);
    const largeFleet = profile.fleet.count >= 10;
    const guides = {
      erp_review: {
        opening:'Não abordar ainda: valide primeiro os dados pendentes no ERP.',
        questions:['O registro e o cliente estão corretos?','Pedido, valor e configuração conferem?','Existe alguma informação que ainda precisa ser validada antes do contato?'],
        cta:'Liberar a conta para abordagem somente depois da conferência.',
        technicalPrep:['Conferir identidade do cadastro e pedido no ERP.','Não citar valor, peça ou configuração duvidosa.','Registrar o que foi confirmado antes de ligar.']
      },
      first_contact: {
        opening:'Olá, aqui é o Lucas, da Olho de Gato. Posso te fazer duas perguntas rápidas sobre a frota?',
        questions:['Como vocês controlam hoje pressão e desgaste dos pneus?','Quem responde por frota ou manutenção?','Qual tipo de veículo ou conjunto roda mais na operação?'],
        cta:largeFleet ? 'Se fizer sentido, montar uma simulação em cima da frota real e combinar uma conversa rápida.' : 'Conquistar permissão para levantar a frota e definir o próximo passo.',
        technicalPrep:['Descobrir marca, modelo e configuração antes de recomendar aplicação.','Levantar quantidade de veículos e tipo de conjunto.','Não indicar suporte, PSI ou economia sem dados suficientes.']
      },
      relationship: {
        opening:'Quero retomar de onde vocês pararam com a Olho de Gato, sem repetir apresentação que talvez você já conheça.',
        questions:['O que você chegou a conhecer ou avaliar da solução?','O que impediu o avanço naquela época?','O que mudou na frota ou na prioridade desde então?'],
        cta:'Sair da conversa com um bloqueio real identificado e um próximo passo combinado.',
        technicalPrep:['Reabrir o histórico antes de ligar.','Confirmar se a frota/configuração continua a mesma.','Separar fato registrado de hipótese antes de falar de aplicação.']
      },
      follow_up: {
        opening:'Estou retomando exatamente do ponto que combinamos.',
        questions:['O que mudou desde o último contato?','Conseguiu validar internamente?','Existe algum bloqueio novo?'],
        cta:'Definir avanço, objeção concreta ou nova data de decisão.',
        technicalPrep:['Revisar a última ação prometida e a data combinada.','Levar somente material que responda ao bloqueio atual.','Não reiniciar a venda do zero.']
      },
      diagnosis: {
        opening:'Você demonstrou interesse e eu quero entender melhor a operação antes de te passar uma solução.',
        questions:['Onde hoje o pneu mais pesa na operação?','Como vocês fazem calibragem e acompanham desgaste?','Quais veículos fariam mais sentido avaliar primeiro?'],
        cta:largeFleet ? 'Transformar o interesse em levantamento de frota e simulação real.' : 'Fechar o diagnóstico mínimo para dimensionar uma aplicação.',
        technicalPrep:['Levantar veículo, eixos, uso e pressão antes da cotação.','Identificar quem valida a parte técnica.','Não transformar interesse em proposta genérica sem diagnóstico.']
      },
      proposal_followup: {
        opening:'Quero revisar o que ficou pendente na proposta e entender o que precisa acontecer para a decisão avançar.',
        questions:['O bloqueio é técnico, financeiro ou de timing?','Quem mais precisa aprovar?','Qual condição destrava o próximo passo?'],
        cta:'Sair com decisão, objeção concreta ou compromisso de próximo passo com data.',
        technicalPrep:['Abrir a última proposta e a configuração usada.','Revalidar a frota se houver chance de mudança.','Não oferecer desconto antes de entender o bloqueio.']
      },
      customer_reactivation: {
        opening:'Como vocês já são clientes, quero primeiro entender como está a operação hoje e o que mudou desde a última compra.',
        questions:['O que foi instalado continua atendendo bem?','Entraram veículos novos ou houve mudança de configuração?','Existe reposição, expansão ou algum problema pendente?'],
        cta:'Recuperar contexto real da conta antes de falar em nova venda.',
        technicalPrep:['Confirmar o que já foi instalado.','Checar reposições ou ocorrências abertas.','Não tratar cliente existente como lead frio.']
      },
      post_sale: {
        opening:'Quero entender como está a experiência com o que já foi instalado e se mudou algo na frota.',
        questions:['Como está performando?','Entraram veículos novos?','Existe reposição pendente ou oportunidade de expansão?'],
        cta:'Registrar experiência, resolver pendência e só então avaliar expansão ou indicação.',
        technicalPrep:['Revisar itens/aplicações já instalados.','Levantar veículos novos e reposições.','Não pedir indicação antes de validar a experiência do cliente.']
      }
    };
    const guide = guides[profile.route.id] || guides.first_contact;
    return Object.freeze({
      routeId:profile.route.id,
      routeLabel:profile.route.label,
      opening:guide.opening,
      questions:Object.freeze(guide.questions.slice()),
      cta:guide.cta,
      technicalPrep:Object.freeze(guide.technicalPrep.slice())
    });
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
    proposalEventEvidence,
    fleetProfile,
    salesProfile,
    approachGuide,
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
