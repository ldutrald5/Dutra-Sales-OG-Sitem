(function attachAutomationEngine(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_AUTOMATION_ENGINE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAutomationEngine() {
  'use strict';

  const DAY = 86400000;
  const LOST_STATUS = 'perdido';

  function clean(value) { return String(value ?? '').trim(); }
  function key(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  }
  function asDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function leadLastActivity(lead = {}) {
    const values = [
      lead.lastContactAt,
      lead.updatedAt,
      lead.enteredAt,
      lead.createdDate,
      ...(Array.isArray(lead.interactions) ? lead.interactions.map(item => item?.at || item?.createdAt) : [])
    ].map(asDate).filter(Boolean).sort((a,b)=>b-a);
    return values[0] || null;
  }
  function canonicalEventType(value) {
    const normalized=key(value);
    const aliases={
      proposal_prepared:'proposal.prepared',
      proposal_sent:'proposal.sent',
      proposal_opened:'proposal.opened',
      proposal_reopened:'proposal.reopened',
      proposal_contact_clicked:'proposal.contact_clicked',
      proposal_accepted:'proposal.accepted',
      proposal_revoked:'proposal.revoked',
      installation_completed:'installation.completed',
      installation_reopened:'installation.reopened',
      customer_satisfaction_confirmed:'customer.satisfaction.confirmed',
      referral_requested:'referral.requested',
      referral_received:'referral.received',
      test_completed:'test.completed',
      test_cancelled:'test.cancelled'
    };
    return aliases[normalized] || clean(value);
  }
  function eventsForLead(operations = {}, leadId) {
    return (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .filter(item => clean(item.clientId || item.leadId) === clean(leadId))
      .map(item => ({...item,type:canonicalEventType(item.type)}))
      .sort((a,b)=>(asDate(a.at)?.getTime()||0)-(asDate(b.at)?.getTime()||0));
  }
  function alreadyApplied(events, ruleId, sourceId) {
    return events.some(item => item.type === 'automation.suggestion.applied'
      && item.ruleId === ruleId
      && clean(item.sourceId) === clean(sourceId));
  }
  function make(lead, ruleId, sourceId, title, reason, action, dueAt, severity='medium', metadata={}) {
    return Object.freeze({
      id: `AUTO:${clean(lead.id)}:${ruleId}:${clean(sourceId || 'lead')}`,
      leadId: clean(lead.id),
      ruleId,
      sourceId: clean(sourceId || 'lead'),
      title,
      reason,
      action,
      dueAt: dueAt ? asDate(dueAt)?.toISOString() || null : null,
      severity,
      metadata:Object.freeze({...metadata})
    });
  }
  function addDays(date, days) {
    const next = new Date(date);
    next.setTime(next.getTime() + (days * DAY));
    return next;
  }

  function suggestionsForLead(lead = {}, operations = {}, now = new Date()) {
    if (!lead?.id || key(lead.status) === LOST_STATUS) return Object.freeze([]);
    const reference = asDate(now) || new Date();
    const events = eventsForLead(operations, lead.id);
    const output = [];
    const customerLifecycle = key(lead.status) === 'fechado' || ['customer','loyal_customer'].includes(key(lead.conversationStage));

    const proposalSent = events.filter(item => item.type === 'proposal.sent').slice(-1)[0];
    if (proposalSent && !customerLifecycle) {
      const sentAt = asDate(proposalSent.at);
      const closedAfter = events.some(item => ['proposal.accepted','proposal.revoked'].includes(item.type) && (asDate(item.at)?.getTime()||0) >= (sentAt?.getTime()||0));
      const sourceId = proposalSent.proposalId || proposalSent.id;
      if (sentAt && !closedAfter && reference.getTime() - sentAt.getTime() >= 2 * DAY && !alreadyApplied(events,'proposal_48h_followup',sourceId)) {
        output.push(make(lead,'proposal_48h_followup',sourceId,'Proposta sem retorno há 48h','A proposta foi marcada como enviada e ainda não há evento de aceite ou revogação.','Retomar a proposta e combinar um próximo passo',reference,'high',{sentAt:sentAt.toISOString()}));
      }
    }

    const installation = events.filter(item => item.type === 'installation.completed').slice(-1)[0];
    if (installation) {
      const completedAt = asDate(installation.at);
      const sourceId = installation.installationId || installation.id;
      const postSaleDone = events.some(item => ['post_sale.completed','post_sale.contact_confirmed'].includes(item.type) && (asDate(item.at)?.getTime()||0) >= (completedAt?.getTime()||0));
      const installationReopened = events.some(item => item.type === 'installation.reopened' && (asDate(item.at)?.getTime()||0) >= (completedAt?.getTime()||0));
      if (completedAt && !postSaleDone && !installationReopened && !alreadyApplied(events,'post_sale_15d',sourceId)) {
        output.push(make(lead,'post_sale_15d',sourceId,'Pós-venda da instalação','A instalação foi concluída e precisa de acompanhamento para validar uso, benefício e possíveis ajustes.','Fazer pós-venda da instalação',addDays(completedAt,15),'medium',{completedAt:completedAt.toISOString()}));
      }
    }

    const satisfaction = events.filter(item => item.type === 'customer.satisfaction.confirmed').slice(-1)[0];
    if (satisfaction) {
      const at = asDate(satisfaction.at);
      const sourceId = satisfaction.id;
      const referralAfter = events.some(item => ['referral.requested','referral.received'].includes(item.type) && (asDate(item.at)?.getTime()||0) >= (at?.getTime()||0));
      if (at && !referralAfter && !alreadyApplied(events,'request_referral',sourceId)) {
        output.push(make(lead,'request_referral',sourceId,'Momento de pedir indicação','A satisfação foi confirmada e ainda não há indicação solicitada/registrada depois disso.','Pedir uma indicação de outra frota ou gestor',addDays(at,1),'medium'));
      }
    }

    const testEnd = asDate(lead.testEndsAt || lead.trialEndsAt);
    if (testEnd) {
      const sourceId = clean(lead.testId || lead.id);
      const daysUntil = Math.ceil((testEnd.getTime() - reference.getTime()) / DAY);
      const testClosed = events.some(item => ['test.completed','test.cancelled'].includes(item.type));
      if (!testClosed && daysUntil <= 14 && daysUntil >= -7 && !alreadyApplied(events,'test_end_followup',sourceId)) {
        output.push(make(lead,'test_end_followup',sourceId,'Teste perto do fechamento',daysUntil >= 0 ? `O teste termina em ${daysUntil} dia(s).` : `O teste venceu há ${Math.abs(daysUntil)} dia(s) e ainda não há encerramento registrado.`,'Revisar resultado do teste e definir expansão ou próximo passo',addDays(testEnd,-2),daysUntil <= 2 ? 'high' : 'medium',{testEndsAt:testEnd.toISOString()}));
      }
    }

    const last = leadLastActivity(lead);
    const hasFutureFollowUp = asDate(lead.followUpAt)?.getTime() > reference.getTime();
    if (!customerLifecycle && last && !hasFutureFollowUp && !clean(lead.nextAction)) {
      const idleDays = Math.floor((reference.getTime() - last.getTime()) / DAY);
      const sourceId = last.toISOString().slice(0,10);
      if (idleDays >= 7 && !alreadyApplied(events,'idle_7d_action',sourceId)) {
        output.push(make(lead,'idle_7d_action',sourceId,'Oportunidade sem próximo movimento',`A conta está há ${idleDays} dias sem atividade confirmada e sem próxima ação.`,'Retomar a conta e definir um próximo passo',reference,idleDays >= 14 ? 'high' : 'medium',{idleDays}));
      }
    }

    const severityWeight={high:3,medium:2,low:1};
    return Object.freeze(output.sort((a,b)=>(severityWeight[b.severity]||0)-(severityWeight[a.severity]||0)||String(a.dueAt||'').localeCompare(String(b.dueAt||''))||a.id.localeCompare(b.id)));
  }

  function buildSuggestions(leads = [], operations = {}, now = new Date()) {
    return (Array.isArray(leads) ? leads : []).flatMap(lead => suggestionsForLead(lead,operations,now))
      .sort((a,b)=>{
        const w={high:3,medium:2,low:1};
        return (w[b.severity]||0)-(w[a.severity]||0)||String(a.dueAt||'').localeCompare(String(b.dueAt||''))||a.id.localeCompare(b.id);
      });
  }

  function applyToLead(lead, suggestion, options = {}) {
    if (!lead || clean(lead.id) !== clean(suggestion?.leadId)) throw new Error('Sugestão não pertence a este cliente');
    const interaction = options.interactionService;
    if (!interaction?.setNextAction) throw new Error('Interaction Service é obrigatório');
    interaction.setNextAction(lead,suggestion.action,suggestion.dueAt || '',{
      reason:suggestion.reason,
      objective:'Executar o próximo passo no momento correto.',
      expectedResult:'Registrar um avanço ou uma nova decisão explícita.'
    });
    return lead;
  }

  function markApplied(operations, suggestion, options = {}) {
    const model=options.operationsModel;
    if (!model?.appendActivity) throw new Error('Operations Model é obrigatório');
    return model.appendActivity(operations,{
      id:`EVT-${suggestion.id.replace(/[^a-zA-Z0-9_-]/g,'-')}-APPLIED`,
      type:'automation.suggestion.applied',
      at:asDate(options.now || Date.now()).toISOString(),
      clientId:suggestion.leadId,
      ruleId:suggestion.ruleId,
      sourceId:suggestion.sourceId,
      automationSuggestionId:suggestion.id
    });
  }

  return { suggestionsForLead, buildSuggestions, applyToLead, markApplied };
}));
