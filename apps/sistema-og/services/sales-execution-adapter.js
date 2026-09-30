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

  function normalizeActivity(item = {}) {
    return {
      id: item.id || item.external_id || '',
      at: item.completed_at || item.created_at || item.updated_at || '',
      type: item.activity_type || item.type || 'note',
      result: item.metadata?.outcome || item.result || '',
      note: item.description || item.title || item.note || '',
      important: Boolean(item.metadata?.important)
    };
  }

  function chooseContact(context = {}, member = {}) {
    const contacts = Array.isArray(context.contacts) ? context.contacts : [];
    return contacts.find(item => item.id === member.primary_contact_id)
      || contacts.find(item => item.decision_level === 'decision_maker')
      || contacts[0]
      || {};
  }

  function chooseOpportunity(context = {}) {
    const opportunities = Array.isArray(context.opportunities) ? context.opportunities : [];
    return opportunities.find(item => !['WON', 'LOST'].includes(item.pipeline_stage))
      || opportunities[0]
      || {};
  }

  function projectAccountContext(context = {}, member = {}, session = {}, legacyLead = {}) {
    const company = context.company || {};
    const contact = chooseContact(context, member);
    const opportunity = chooseOpportunity(context);
    const briefings = Array.isArray(context.briefings) ? context.briefings : [];
    const briefing = briefings.find(item => item.processing_status === 'READY') || briefings[0] || null;
    return {
      company,
      contact,
      opportunity,
      listMember: member || null,
      session: session || null,
      briefing,
      recentActivities: (context.recentActivities || []).slice(0, 10).map(normalizeActivity),
      legacyLead
    };
  }

  function toCallAiLead(envelope = {}, legacyLead = {}) {
    const company = envelope.company || {};
    const contact = envelope.contact || {};
    const opportunity = envelope.opportunity || {};
    const stableId = company.legacy_lead_id || company.legacyLeadId || legacyLead.id || (company.id ? 'SE-' + company.id : '');
    return Object.assign({}, legacyLead, {
      id: stableId,
      empresa: company.name || legacyLead.empresa,
      nome: contact.full_name || contact.name || legacyLead.nome,
      telefone: contact.phone_e164 || contact.whatsapp_e164 || contact.phone || legacyLead.telefone,
      email: contact.email || legacyLead.email,
      cargo: contact.role_title || contact.role_category || contact.role || legacyLead.cargo,
      decisionMaker: contact.decision_level === 'decision_maker'
        ? (contact.full_name || contact.name || legacyLead.decisionMaker)
        : legacyLead.decisionMaker,
      cidadeUf: [company.city, company.state].filter(Boolean).join(' - ') || legacyLead.cidadeUf,
      segmentId: company.sector || legacyLead.segmentId,
      status: opportunity.pipeline_stage || opportunity.legacyStage || legacyLead.status,
      nextAction: opportunity.next_action || opportunity.nextAction || legacyLead.nextAction,
      followUpAt: opportunity.next_action_due_at || opportunity.nextActionAt || legacyLead.followUpAt,
      nextActionReason: opportunity.next_action_reason || legacyLead.nextActionReason,
      fleetSize: Number(opportunity.fleet_size || legacyLead.fleetSize || 0),
      pain: opportunity.primary_pain || legacyLead.pain,
      interactions: envelope.recentActivities?.length ? envelope.recentActivities : (legacyLead.interactions || []),
      sourceChannel: legacyLead.sourceChannel || 'Sales Execution',
      sourceList: legacyLead.sourceList || 'Supabase Sales Execution',
      operationalStatus: envelope.listMember?.work_status === 'WORKED' ? 'WORKED_LEAD' : 'IN_PROGRESS',
      salesExecution: {
        companyId: company.id || null,
        contactId: contact.id || null,
        opportunityId: opportunity.id || null,
        listMemberId: envelope.listMember?.id || null,
        listId: envelope.listMember?.list_id || envelope.session?.list_id || null,
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

  return { fromLegacyLead, normalizeActivity, chooseContact, chooseOpportunity, projectAccountContext, toCallAiLead, queueProjection };
}));
