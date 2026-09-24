(function attachInteractionService(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_INTERACTION_SERVICE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createInteractionService() {
  'use strict';

  const RESULT_DEFINITIONS = Object.freeze({
    nao_atendeu: { label: 'Não atendeu', status: 'contatado', nextAction: 'Tentar novo contato' },
    atendeu: { label: 'Atendeu', status: 'contatado' },
    falar_depois: { label: 'Falar depois', status: 'contatado', nextAction: 'Retomar contato' },
    sem_interesse: { label: 'Sem interesse', status: 'perdido' },
    enviar_apresentacao: { label: 'Enviar apresentação', status: 'contatado', nextAction: 'Enviar apresentação' },
    enviar_orcamento: { label: 'Enviar orçamento', status: 'proposta_enviada', nextAction: 'Preparar orçamento' },
    negociacao: { label: 'Negociação', status: 'negociacao', nextAction: 'Retomar negociação' },
    venda: { label: 'Venda', status: 'fechado' },
    outro: { label: 'Outro' }
  });

  function eventId(prefix, now) {
    return `${prefix}-${new Date(now).getTime().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function ensureInteractions(lead) {
    if (!Array.isArray(lead.interactions)) lead.interactions = [];
    return lead.interactions;
  }

  function addInteraction(lead, input, options = {}) {
    if (!lead?.id) throw new Error('Cliente inválido');
    const note = String(input?.note || '').trim();
    if (!note) throw new Error('A interação exige uma nota');
    const now = options.now || new Date().toISOString();
    const interaction = {
      id: input.id || eventId('INT', now),
      at: now,
      type: input.type || 'nota',
      note,
      result: input.result || '',
      eventId: input.eventId || eventId('EVT', now),
      entity: 'lead',
      entityId: lead.id,
      changedFields: input.changedFields || ['interactions'],
      timestamp: now,
      deviceId: input.deviceId || null,
      previousVersion: input.previousVersion ?? null,
      idempotencyKey: input.idempotencyKey || eventId('IDEM', now),
      createdBy: input.createdBy || null
    };
    ensureInteractions(lead).push(interaction);
    if (input.countAsContact !== false) lead.lastContactAt = now;
    lead.updatedBy = input.updatedBy || lead.updatedBy || null;
    return interaction;
  }

  function recordResult(lead, result, note, options = {}) {
    const definition = RESULT_DEFINITIONS[result] || RESULT_DEFINITIONS.outro;
    if (definition.status) lead.status = definition.status;
    if (definition.nextAction && !lead.nextAction) lead.nextAction = definition.nextAction;
    return addInteraction(lead, {
      type: 'resultado_contato', result,
      note: String(note || '').trim() || `Resultado: ${definition.label}`,
      changedFields: ['interactions', 'status', 'lastContactAt']
    }, options);
  }

  function setNextAction(lead, nextAction, followUpAt, options = {}) {
    const previous = { nextAction: lead.nextAction || '', followUpAt: lead.followUpAt || '' };
    lead.nextAction = String(nextAction || '').trim();
    lead.followUpAt = String(followUpAt || '').trim();
    const label = lead.nextAction ? `${lead.nextAction}${lead.followUpAt ? ` · ${lead.followUpAt}` : ''}` : 'Sem próxima ação';
    return addInteraction(lead, { type: 'proxima_acao', note: label, countAsContact: false, changedFields: ['nextAction', 'followUpAt', 'interactions'], previous }, options);
  }

  return { RESULT_DEFINITIONS, addInteraction, recordResult, setNextAction };
}));
