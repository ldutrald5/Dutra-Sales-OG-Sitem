(function attachCallAiContext(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_CALL_AI_CONTEXT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCallAiContext() {
  'use strict';
  const BUDGET = Object.freeze({ maxRecentInteractions: 6, maxContextChars: 6000, maxKnowledgeSections: 3, defaultResponseLength: 'short' });
  function compactText(value, max = 900) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max); }
  function commercialContextFingerprint(lead = {}) {
    const raw = JSON.stringify([
      compactText(lead.status, 60),
      compactText(lead.conversationStage, 60),
      compactText(lead.nextAction, 240),
      compactText(lead.followUpAt, 80),
      compactText(lead.nextActionReason, 360),
      compactText(lead.nextActionObjective, 360),
      compactText(lead.nextActionExpectedResult, 360)
    ]);
    let hash = 2166136261;
    for (let index = 0; index < raw.length; index += 1) {
      hash ^= raw.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  function buildAccountSummary(lead) {
    if (!lead) return '';
    const parts = [lead.empresa || lead.nome];
    if (lead.nome && lead.nome !== lead.empresa) parts.push(`${lead.nome}${lead.cargo ? ` (${lead.cargo})` : ''}`);
    if (lead.fleetSize) parts.push(`Frota registrada: ${lead.fleetSize} veículos`);
    if (lead.pain) parts.push(`Dor registrada: ${lead.pain}`);
    if (lead.nextAction) parts.push(`Próxima ação: ${lead.nextAction}`);
    return compactText(lead.accountSummary || parts.filter(Boolean).join('. '), 1000);
  }
  function normalizeSalesExecution(value = {}) {
    if (!value || typeof value !== 'object') return null;
    const company=value.company||{}, contact=value.contact||{}, opportunity=value.opportunity||{}, listMember=value.listMember||value.member||{}, session=value.session||{}, briefing=value.briefing||{};
    if (!company.id && !session.id && !listMember.id) return null;
    return {
      mode: compactText(value.mode || briefing.mode, 40),
      company: { id:compactText(company.id,80), name:compactText(company.name,160), city:compactText(company.city,100), state:compactText(company.state,2), sector:compactText(company.sector,100), relationshipStatus:compactText(company.relationship_status || company.relationshipStatus,60) },
      contact: { id:compactText(contact.id,80), name:compactText(contact.full_name || contact.name,120), role:compactText(contact.role_title || contact.role,120), roleCategory:compactText(contact.role_category,80), decisionLevel:compactText(contact.decision_level,80), phone:compactText(contact.phone_e164 || contact.phone,30) },
      opportunity: opportunity && opportunity.id ? {
        id:compactText(opportunity.id,80), pipelineStage:compactText(opportunity.pipeline_stage,80), relationshipStatus:compactText(opportunity.relationship_status,80),
        fleetSize:Number(opportunity.fleet_size||0), primaryPain:compactText(opportunity.primary_pain,360), nextAction:compactText(opportunity.next_action,240), nextActionDueAt:opportunity.next_action_due_at||''
      } : null,
      listMember: { id:compactText(listMember.id,80), listId:compactText(listMember.list_id || listMember.listId,80), workStatus:compactText(listMember.work_status || listMember.workStatus,40), enrichmentStatus:compactText(listMember.enrichment_status || listMember.enrichmentStatus,40) },
      session: { id:compactText(session.id,80), targetCalls:Number(session.target_calls || session.targetCalls || 0), currentMemberId:compactText(session.current_member_id || session.currentMemberId,80), status:compactText(session.status,40) },
      briefing: { status:compactText(briefing.status,40), source:compactText(briefing.source,80), objective:compactText(briefing.objective,600), opening:compactText(briefing.opening,900), hook:compactText(briefing.hook,600), cta:compactText(briefing.cta,600), questions:Array.isArray(briefing.questions)?briefing.questions.slice(0,5).map(item=>compactText(item,500)):[] }
    };
  }

  function build(lead, options = {}) {
    if (!lead) return null;
    const recentLimit = Math.max(1, Math.min(Number(options.recentLimit) || BUDGET.maxRecentInteractions, 10));
    const needsPhone = ['create_message', 'personalize_message'].includes(options.intent || '');
    const recentInteractions = (lead.interactions || []).slice(-recentLimit).map(item => ({ at: item.at, type: compactText(item.type, 60), result: compactText(item.result, 100), note: compactText(item.note, 500), important: Boolean(item.important) }));
    const salesExecution = normalizeSalesExecution(options.salesExecution);
    const context = {
      contextVersion: `${lead.updatedAt || lead.lastContactAt || lead.createdDate || '0'}:${recentInteractions.length}:${commercialContextFingerprint(lead)}:${salesExecution?.session?.id || ''}:${salesExecution?.listMember?.id || ''}`,
      company: { id: lead.id, name: compactText(lead.empresa || lead.nome, 160), segmentId: compactText(lead.segmentId, 80), fleetSize: Number(lead.fleetSize || 0) },
      contact: { id: lead.contactId || '', name: compactText(lead.nome, 120), role: compactText(lead.cargo || lead.decisionMaker, 100), ...(needsPhone ? { phone: compactText(lead.telefone, 30) } : {}) },
      stage: compactText(lead.status || 'novo', 60), accountSummary: buildAccountSummary(lead), recentInteractions,
      objections: Array.isArray(lead.objections) ? lead.objections.slice(0, 5).map(item => compactText(item, 240)) : [],
      nextAction: {
        description: compactText(lead.nextAction, 240),
        dueAt: lead.followUpAt || '',
        reason: compactText(lead.nextActionReason, 360),
        objective: compactText(lead.nextActionObjective, 360),
        expectedResult: compactText(lead.nextActionExpectedResult, 360)
      },
      relevantOpportunity: salesExecution?.opportunity || (lead.opportunities || []).find(item => item.status !== 'closed') || null,
      ...(salesExecution ? { salesExecution } : {})
    };
    if (JSON.stringify(context).length > BUDGET.maxContextChars) context.recentInteractions = context.recentInteractions.slice(-3);
    return context;
  }
  function cacheKey(context, intent) { return context?.company?.id ? [context.company.id, intent, context.contextVersion].join(':') : ''; }
  return { BUDGET, build, buildAccountSummary, cacheKey, normalizeSalesExecution };
}));
