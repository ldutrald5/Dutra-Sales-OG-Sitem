(function attachSalesExecutionService(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_EXECUTION = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesExecutionService(root) {
  'use strict';

  const OUTCOMES = Object.freeze([
    'NO_ANSWER',
    'INVALID_NUMBER',
    'GATEKEEPER',
    'DECISION_MAKER_IDENTIFIED',
    'DECISION_MAKER_REACHED',
    'RETURN_LATER',
    'QUALIFIED',
    'MEETING_BOOKED',
    'SEND_MATERIAL',
    'PROPOSAL',
    'NOT_INTERESTED'
  ]);

  const MODE_INTENTS = Object.freeze({
    GATEKEEPER: 'reach_decision_maker',
    DECISION_MAKER: 'prepare_call',
    MEETING: 'next_action',
    CUSTOMER: 'follow_up',
    FOLLOW_UP: 'follow_up',
    PROPOSAL: 'negotiate'
  });

  const MODE_OBJECTIVES = Object.freeze({
    GATEKEEPER: 'Chegar ao responsável por frota, pneus ou manutenção.',
    DECISION_MAKER: 'Entender operação, dor, impacto e qualificar o próximo passo.',
    MEETING: 'Confirmar reunião, participantes e objetivo.',
    CUSTOMER: 'Identificar reposição, expansão ou oportunidade de pós-venda.',
    FOLLOW_UP: 'Retomar o contexto e sair com um próximo compromisso concreto.',
    PROPOSAL: 'Entender o bloqueio real e avançar a proposta sem inventar condições.'
  });

  let requestFn = null;

  function clean(value, max = 1200) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function configure(options = {}) {
    requestFn = typeof options.request === 'function' ? options.request : null;
    return api;
  }

  function request() {
    if (!requestFn) throw new Error('Sales Execution Service não configurado.');
    return requestFn;
  }

  async function call(path, options = {}) {
    const response = await request()(path, options);
    let payload = {};
    try { payload = await response.json(); } catch (_) {}
    if (!response.ok || payload.ok === false) {
      const error = new Error(payload?.error?.message || 'Sales Execution indisponível.');
      error.code = payload?.error?.code || 'sales_execution_error';
      error.status = response.status;
      error.details = payload?.error?.details || null;
      throw error;
    }
    return payload.data;
  }

  function uuidLike(value) {
    return /^[0-9a-f-]{32,40}$/i.test(String(value || ''));
  }

  function clientExternalId(prefix, seed) {
    const base = clean(seed, 120).replace(/[^a-z0-9:_-]+/gi, '-').replace(/-+/g, '-');
    return prefix + ':' + base;
  }

  function getLists() {
    return call('/api/sales-execution/lists');
  }

  function getListMembers(listId) {
    return call('/api/sales-execution/lists/' + encodeURIComponent(listId) + '/members');
  }

  function importList(input = {}) {
    const leads = Array.isArray(input.leads) ? input.leads : [];
    return call('/api/sales-execution/lists/import', {
      method: 'POST',
      body: JSON.stringify({
        name: clean(input.name, 180),
        source: clean(input.source || 'DUTRA OS', 120),
        sourceOwner: clean(input.sourceOwner || 'Lucas Dutra', 120),
        externalId: clean(input.externalId, 180),
        leads: leads.map(lead => ({
          id: clean(lead.id, 180),
          legacyLeadId: clean(lead.id || lead.legacyLeadId, 180),
          companyId: uuidLike(lead.companyId) ? lead.companyId : null,
          contactId: uuidLike(lead.contactId) ? lead.contactId : null,
          empresa: clean(lead.empresa || lead.companyName || lead.name, 180),
          legalName: clean(lead.razaoSocial || lead.legalName, 220),
          cnpj: clean(lead.cnpj, 40),
          domain: clean(lead.domain, 240),
          website: clean(lead.website, 300),
          cidadeUf: clean(lead.cidadeUf, 160),
          segmentId: clean(lead.segmentId, 100),
          nome: clean(lead.nome || lead.contactName, 180),
          telefone: clean(lead.telefone || lead.phone, 40),
          whatsapp: clean(lead.whatsapp, 40),
          email: clean(lead.email, 220),
          cargo: clean(lead.cargo || lead.roleTitle, 140)
        }))
      })
    });
  }

  function startSession(input = {}) {
    return call('/api/sales-execution/sessions', {
      method: 'POST',
      body: JSON.stringify({
        listId: input.listId,
        targetCalls: Number(input.targetCalls) || 1,
        externalId: input.externalId
      })
    });
  }

  function resumeSession(sessionId) {
    return call('/api/sales-execution/sessions/' + encodeURIComponent(sessionId) + '/current');
  }

  function getCurrentMember(sessionId) {
    return resumeSession(sessionId);
  }

  function remoteBriefingUsable(briefing) {
    if (!briefing || briefing.status !== 'READY' || !briefing.record || !briefing.record.briefing) return false;
    if (briefing.record.valid_until && Date.parse(briefing.record.valid_until) <= Date.now()) return false;
    return true;
  }

  function normalizeRemoteBriefing(briefing, mode) {
    const record = briefing?.record?.briefing || {};
    return {
      mode,
      status: 'READY',
      source: 'ai_briefings',
      objective: clean(record.objective || record.objetivo || MODE_OBJECTIVES[mode], 600),
      context: clean(record.context || record.contexto || record.summary || '', 1200),
      opening: clean(record.opening || record.abertura || record.recommended_opening || '', 1000),
      questions: (record.questions || record.perguntas || []).slice(0, 5).map(item => clean(item, 500)).filter(Boolean),
      hook: clean(record.hook || record.gancho || '', 700),
      cta: clean(record.cta || record.next_step || record.proximo_passo || '', 700),
      warnings: (record.warnings || []).slice(0, 5).map(item => clean(item, 500)).filter(Boolean)
    };
  }

  function localOpening(mode, lead, current) {
    const contact = clean(current?.contact?.full_name || lead?.nome || '', 120);
    const company = clean(current?.company?.name || lead?.empresa || '', 160);
    if (mode === 'GATEKEEPER') return 'Olá' + (contact ? ', ' + contact : '') + '. Aqui é o Lucas, da Olho de Gato. Quem acompanha pneus, manutenção ou custos da frota na ' + (company || 'empresa') + '?';
    if (mode === 'FOLLOW_UP') return 'Olá' + (contact ? ', ' + contact : '') + '. Estou retomando o que combinamos para entender qual é o próximo passo mais útil.';
    if (mode === 'PROPOSAL') return 'Quero recapitular o que já fez sentido na proposta e entender o que ainda precisa ficar claro para avançarmos.';
    if (mode === 'MEETING') return 'Quero deixar a reunião objetiva: confirmar quem participa, o que vamos validar e qual decisão precisamos preparar.';
    if (mode === 'CUSTOMER') return 'Quero entender como a operação está hoje e se existe reposição, expansão ou outro ponto em que eu possa ajudar.';
    return 'Olá' + (contact ? ', ' + contact : '') + '. Posso usar dois minutos para entender como vocês cuidam hoje da pressão, desgaste e rotina dos pneus?';
  }

  function localCta(mode, lead, current) {
    const fleet = Number(current?.opportunity?.fleet_size || lead?.fleetSize || 0);
    if (mode === 'GATEKEEPER') return 'Conseguir nome, contato e melhor horário do responsável e registrar a ponte.';
    if (mode === 'DECISION_MAKER') return fleet > 0
      ? 'Se houver aderência, propor uma reunião curta para montar uma simulação em cima da frota registrada.'
      : 'Se houver aderência, confirmar frota e propor uma reunião curta para avaliar aplicação, investimento e próximos passos.';
    if (mode === 'PROPOSAL') return 'Identificar o bloqueio real e combinar a menor ação com responsável e data.';
    if (mode === 'MEETING') return 'Confirmar data, participantes e objetivo da reunião.';
    if (mode === 'CUSTOMER') return 'Definir reposição, expansão ou indicação com próximo passo e data.';
    return 'Sair com um compromisso concreto, responsável e data.';
  }

  function prepareMember(payload = {}, legacyLead = null, operations = {}) {
    const current = payload.current || null;
    const mode = payload.briefing?.mode || 'GATEKEEPER';
    if (remoteBriefingUsable(payload.briefing)) {
      return { ...normalizeRemoteBriefing(payload.briefing, mode), intent: MODE_INTENTS[mode] || 'prepare_call' };
    }
    const local = root?.OG_SALES_BRIEF?.build && legacyLead
      ? root.OG_SALES_BRIEF.build(legacyLead, operations)
      : { facts: [], gaps: [], questions: [], doNotSay: [] };
    const contextParts = [];
    if (current?.company?.city || current?.company?.state) contextParts.push([current.company.city, current.company.state].filter(Boolean).join(' - '));
    if (current?.company?.sector) contextParts.push(current.company.sector);
    if (current?.opportunity?.fleet_size) contextParts.push('Frota registrada: ' + current.opportunity.fleet_size);
    if (legacyLead?.pain) contextParts.push('Dor registrada: ' + legacyLead.pain);
    return {
      mode,
      status: payload.briefing?.status || current?.member?.enrichment_status || 'MISSING',
      source: 'sales_brief_local_fallback',
      objective: MODE_OBJECTIVES[mode] || MODE_OBJECTIVES.DECISION_MAKER,
      context: clean(contextParts.join(' · ') || (legacyLead?.accountSummary || ''), 1200),
      opening: localOpening(mode, legacyLead, current),
      questions: (local.questions || []).slice(0, 4),
      hook: legacyLead?.pain
        ? 'Use a dor registrada apenas como hipótese a reconfirmar: ' + clean(legacyLead.pain, 300)
        : 'Entenda primeiro processo atual, impacto e responsável. Não apresente economia como garantia.',
      cta: localCta(mode, legacyLead, current),
      warnings: (local.doNotSay || []).slice(0, 4),
      intent: MODE_INTENTS[mode] || 'prepare_call'
    };
  }

  function recordResult(sessionId, input = {}) {
    return call('/api/sales-execution/sessions/' + encodeURIComponent(sessionId) + '/results', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  function saveDecisionMaker(sessionId, input = {}) {
    return call('/api/sales-execution/sessions/' + encodeURIComponent(sessionId) + '/decision-maker', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  function scheduleMeeting(sessionId, input = {}) {
    return call('/api/sales-execution/sessions/' + encodeURIComponent(sessionId) + '/meetings', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  function advance(sessionId, input = {}) {
    return call('/api/sales-execution/sessions/' + encodeURIComponent(sessionId) + '/advance', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  function finishSession(sessionId) {
    return call('/api/sales-execution/sessions/' + encodeURIComponent(sessionId) + '/finish', {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  function legacyLeadForCurrent(leads, current) {
    const legacyId = current?.company?.legacy_lead_id;
    if (!legacyId) return null;
    return (leads || []).find(item => String(item.id) === String(legacyId)) || null;
  }

  function applyLegacyProjection(lead, projection = {}, options = {}) {
    if (!lead || !projection) return false;
    const interactionService = options.interactions || root?.OG_INTERACTION_SERVICE;
    const externalId = clean(projection.externalId || options.externalId, 180);
    if (externalId && Array.isArray(lead.interactions) && lead.interactions.some(item => item.idempotencyKey === externalId || item.sessionId === externalId)) return false;
    const now = options.now || new Date().toISOString();
    if (projection.legacyResult && interactionService?.recordResult) {
      interactionService.recordResult(lead, projection.legacyResult, projection.note || ('Sales Execution: ' + projection.outcome), {
        now,
        interaction: {
          type: 'sales_execution',
          sessionId: externalId || undefined,
          idempotencyKey: externalId || undefined,
          objective: options.mode || undefined
        }
      });
    }
    if (projection.nextAction !== undefined && interactionService?.setNextAction) {
      const nextAction = clean(projection.nextAction, 260);
      const followUpAt = clean(projection.followUpAt, 100);
      if (nextAction !== clean(lead.nextAction, 260) || followUpAt !== clean(lead.followUpAt, 100)) {
        interactionService.setNextAction(lead, nextAction, followUpAt, { now });
      }
    }
    if (projection.status) lead.status = projection.status;
    if (projection.decisionMaker) lead.decisionMaker = clean(projection.decisionMaker, 180);
    return true;
  }

  const api = {
    OUTCOMES,
    MODE_INTENTS,
    MODE_OBJECTIVES,
    configure,
    getLists,
    getListMembers,
    importList,
    startSession,
    resumeSession,
    getCurrentMember,
    prepareMember,
    recordResult,
    saveDecisionMaker,
    scheduleMeeting,
    advance,
    finishSession,
    legacyLeadForCurrent,
    applyLegacyProjection,
    clientExternalId
  };
  return api;
}));
