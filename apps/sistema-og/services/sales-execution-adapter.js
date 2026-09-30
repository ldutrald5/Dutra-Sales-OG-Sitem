(function attachSalesExecutionAdapter(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_EXECUTION_ADAPTER = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesExecutionAdapter() {
  'use strict';

  function text(value, max = 500) { return String(value || '').trim().slice(0, max); }

  function fromLegacyLead(lead = {}, normalized = {}) {
    return {
      company: normalized.company || {
        legacyLeadId: text(lead.id, 160),
        name: text(lead.empresa || lead.nome, 180),
        sector: text(lead.segmentId || lead.segment, 120),
        relationshipStatus: text(lead.relationshipStatus, 80)
      },
      contact: normalized.contact || {
        legacyContactId: text(lead.contactId, 160),
        name: text(lead.nome, 140),
        role: text(lead.cargo || lead.decisionMaker, 120),
        phone: text(lead.telefone, 40)
      },
      opportunity: normalized.opportunity || {
        legacyStage: text(lead.status, 80),
        nextAction: text(lead.nextAction, 300),
        nextActionAt: lead.followUpAt || null
      },
      listMember: normalized.listMember || null,
      session: normalized.session || null,
      briefing: normalized.briefing || null,
      recentActivities: normalized.recentActivities || (lead.interactions || []).slice(-6)
    };
  }

  function toCallAiLead(envelope = {}, legacyLead = {}) {
    const company = envelope.company || {};
    const contact = envelope.contact || {};
    const opportunity = envelope.opportunity || {};
    return Object.assign({}, legacyLead, {
      id: company.legacy_lead_id || company.legacyLeadId || legacyLead.id,
      empresa: company.name || legacyLead.empresa,
      nome: contact.name || legacyLead.nome,
      cargo: contact.role_category || contact.role || legacyLead.cargo,
      contactId: contact.id || legacyLead.contactId,
      status: opportunity.pipeline_stage || opportunity.legacyStage || legacyLead.status,
      nextAction: opportunity.next_action || opportunity.nextAction || legacyLead.nextAction,
      followUpAt: opportunity.next_action_at || opportunity.nextActionAt || legacyLead.followUpAt,
      interactions: envelope.recentActivities || legacyLead.interactions || [],
      salesExecution: {
        companyId: company.id || null,
        contactId: contact.id || null,
        opportunityId: opportunity.id || null,
        listMemberId: envelope.listMember?.id || null,
        sessionId: envelope.session?.id || null,
        briefingId: envelope.briefing?.id || null
      }
    });
  }

  function queueProjection(members = []) {
    return members
      .filter(item => ['AVAILABLE', 'IN_PROGRESS'].includes(item.work_status || item.workStatus))
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  }

  return { fromLegacyLead, toCallAiLead, queueProjection };
}));
