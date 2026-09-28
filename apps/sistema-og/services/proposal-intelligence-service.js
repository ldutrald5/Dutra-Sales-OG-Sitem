(function attachProposalIntelligence(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PROPOSAL_INTELLIGENCE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createProposalIntelligence() {
  'use strict';

  const PUBLIC_EVENT_TYPES = Object.freeze(['proposal.opened','proposal.reopened','proposal.contact_clicked','proposal.accepted']);
  const USER_EVENT_TYPES = Object.freeze(['proposal.sent','proposal.revoked']);
  const EVENT_ALIASES = Object.freeze({
    proposal_prepared:'proposal.prepared',
    proposal_sent:'proposal.sent',
    proposal_opened:'proposal.opened',
    proposal_reopened:'proposal.reopened',
    proposal_contact_clicked:'proposal.contact_clicked',
    proposal_accepted:'proposal.accepted',
    proposal_revoked:'proposal.revoked'
  });
  const FORBIDDEN_PUBLIC_KEYS = new Set(['password','secret','token','accessToken','authorization','apiKey','session']);

  function clean(value) { return String(value ?? '').trim(); }
  function clone(value) { return JSON.parse(JSON.stringify(value ?? null)); }
  function iso(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) throw new Error('Data inválida');
    return date.toISOString();
  }
  function safeNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function normalizeProposalEventType(value) {
    const raw = clean(value);
    const normalized = raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
    return EVENT_ALIASES[normalized] || raw;
  }
  function safeVehicle(vehicle = {}) {
    return {
      id: clean(vehicle.id) || null,
      name: clean(vehicle.name),
      vehicleTypeId: clean(vehicle.vehicleTypeId) || null,
      libras: safeNumber(vehicle.libras),
      includeDianteira: Boolean(vehicle.includeDianteira),
      qty: Math.max(1, Math.round(safeNumber(vehicle.qty) || 1)),
      items: (Array.isArray(vehicle.items) ? vehicle.items : []).slice(0, 100).map(item => ({
        code: clean(item.code),
        qty: Math.max(0, Math.round(safeNumber(item.qty))),
        customPrice: item.customPrice == null ? null : safeNumber(item.customPrice)
      }))
    };
  }
  function safeExtra(item = {}) {
    return {
      code: clean(item.code),
      qty: Math.max(0, Math.round(safeNumber(item.qty))),
      customPrice: item.customPrice == null ? null : safeNumber(item.customPrice)
    };
  }

  function buildSnapshot(input = {}, options = {}) {
    const quote = input.quote || {};
    const state = input.quoteState || quote.payload || {};
    const clientId = clean(input.clientId || quote.clientId);
    const quoteId = clean(input.quoteId || quote.id);
    if (!clientId) throw new Error('Snapshot de proposta exige clientId');
    if (!quoteId) throw new Error('Snapshot de proposta exige quoteId');

    const client = state.client || input.client || {};
    const preparedAt = iso(options.now);
    const snapshot = {
      schemaVersion: 1,
      quoteId,
      clientId,
      preparedAt,
      templateId: clean(state.activePdfTemplate || input.templateId || 'default'),
      client: {
        name: clean(client.nome || quote.clientName),
        company: clean(client.empresa || quote.clientCompany),
        cnpj: clean(client.cnpj),
        city: clean(client.cidadeUf),
        internalCode: clean(quote.clientInternalCode || client.internalCode)
      },
      commercial: {
        totalValue: safeNumber(quote.totalValue),
        totalPieces: Math.max(0, Math.round(safeNumber(quote.totalPecas))),
        freightText: clean(client.freteTexto),
        paymentTerms: clean(client.condicaoPagamento || client.paymentTerms)
      },
      vehicles: (Array.isArray(state.vehicles) ? state.vehicles : []).slice(0, 100).map(safeVehicle),
      extraItems: (Array.isArray(state.extraItems) ? state.extraItems : []).slice(0, 200).map(safeExtra)
    };
    validatePublicSnapshot(snapshot);
    return Object.freeze(snapshot);
  }

  function validatePublicSnapshot(snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('Snapshot público inválido');
    if (!clean(snapshot.quoteId) || !clean(snapshot.clientId)) throw new Error('Snapshot público exige quoteId e clientId');
    const raw = JSON.stringify(snapshot);
    if (raw.length > 250000) throw new Error('Snapshot público excede 250 KB');
    const visit = value => {
      if (!value || typeof value !== 'object') return;
      for (const [key, child] of Object.entries(value)) {
        if (FORBIDDEN_PUBLIC_KEYS.has(key)) throw new Error(`Campo proibido no snapshot público: ${key}`);
        visit(child);
      }
    };
    visit(snapshot);
    return true;
  }

  function proposalId(quoteId) {
    return `PROP-${clean(quoteId).replace(/[^a-zA-Z0-9_-]/g,'').slice(-32) || Date.now().toString(36)}`;
  }

  function prepareTrackingDraft(operations, input = {}, options = {}) {
    const model = options.operationsModel;
    if (!model?.migrateOperations || !model?.appendActivity) throw new Error('Operations Model é obrigatório');
    const next = model.migrateOperations(operations);
    const snapshot = buildSnapshot(input, options);
    const id = clean(input.proposalId) || proposalId(snapshot.quoteId);
    const preparedAt = snapshot.preparedAt;

    const quoteRecord = {
      id: snapshot.quoteId,
      clientId: snapshot.clientId,
      status: 'saved',
      totalValue: snapshot.commercial.totalValue,
      totalPieces: snapshot.commercial.totalPieces,
      preparedAt,
      source: 'quote_history'
    };
    const quoteIndex = next.quotes.findIndex(item => String(item.id) === String(quoteRecord.id));
    if (quoteIndex >= 0) next.quotes.splice(quoteIndex, 1, quoteRecord);
    else next.quotes.unshift(quoteRecord);

    const documentRecord = {
      id,
      documentType: 'proposal_tracking',
      clientId: snapshot.clientId,
      quoteId: snapshot.quoteId,
      status: 'internal_draft',
      version: 1,
      preparedAt,
      snapshot,
      publication: {
        publicEnabled: false,
        publicToken: null,
        publicUrl: null,
        publishedAt: null,
        revokedAt: null
      }
    };
    const documentIndex = next.generatedDocuments.findIndex(item => String(item.id) === String(id));
    if (documentIndex >= 0) next.generatedDocuments.splice(documentIndex, 1, documentRecord);
    else next.generatedDocuments.unshift(documentRecord);

    return model.appendActivity(next, {
      id: `EVT-${id}-PREPARED`,
      type: 'proposal.prepared',
      at: preparedAt,
      clientId: snapshot.clientId,
      quoteId: snapshot.quoteId,
      proposalId: id,
      source: 'user_confirmed_quote_save'
    });
  }

  function recordServerEvent(publication, event = {}, options = {}) {
    if (!publication?.id) throw new Error('Publicação inválida');
    const type = normalizeProposalEventType(event.type);
    if (!PUBLIC_EVENT_TYPES.includes(type)) throw new Error('Evento público inválido');
    if (options.trustedServer !== true) throw new Error('Eventos públicos só podem ser registrados por backend confiável');
    return Object.freeze({
      id: clean(event.id) || `PEVT-${Date.now().toString(36)}`,
      proposalId: publication.id,
      type,
      at: iso(event.at),
      source: 'trusted_server',
      metadata: clone(event.metadata || {})
    });
  }

  function recordUserEvent(operations, event = {}, options = {}) {
    const model = options.operationsModel;
    if (!model?.migrateOperations || !model?.appendActivity) throw new Error('Operations Model é obrigatório');
    if (options.confirmedByUser !== true) throw new Error('Evento de proposta exige confirmação explícita do usuário');
    const type = normalizeProposalEventType(event.type);
    if (!USER_EVENT_TYPES.includes(type)) throw new Error('Evento de proposta do usuário inválido');
    const clientId = clean(event.clientId);
    const proposalIdValue = clean(event.proposalId);
    if (!clientId || !proposalIdValue) throw new Error('Evento de proposta exige clientId e proposalId');
    const at = iso(event.at);
    return model.appendActivity(model.migrateOperations(operations), {
      id: clean(event.id) || `EVT-${proposalIdValue}-${type.replace(/[^a-z0-9]+/gi,'-').toUpperCase()}-${Date.parse(at)}`,
      type,
      at,
      clientId,
      proposalId:proposalIdValue,
      quoteId:clean(event.quoteId) || null,
      source:'user_confirmed',
      metadata:clone(event.metadata || {})
    });
  }

  function canPublish(documentRecord) {
    return Boolean(
      documentRecord?.documentType === 'proposal_tracking'
      && documentRecord?.status === 'internal_draft'
      && documentRecord?.snapshot
      && validatePublicSnapshot(documentRecord.snapshot)
    );
  }

  return {
    PUBLIC_EVENT_TYPES,
    USER_EVENT_TYPES,
    EVENT_ALIASES,
    normalizeProposalEventType,
    buildSnapshot,
    validatePublicSnapshot,
    prepareTrackingDraft,
    recordServerEvent,
    recordUserEvent,
    canPublish
  };
}));
