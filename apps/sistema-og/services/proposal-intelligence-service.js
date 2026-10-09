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
  const FORBIDDEN_PUBLIC_KEYS = new Set(['password','secret','token','accessToken','authorization','apiKey','session','leads','history','operations','state']);

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

  // One ROI calculation for quotation, proposal and the existing simulator.
  // Values are scenario premises, never universal OG claims or price inputs.
  const ROI_FIELDS = Object.freeze({
    tirePrice:{label:'Custo médio do pneu',unit:'BRL/pneu',positive:true},
    lifeMonths:{label:'Vida útil atual',unit:'meses',positive:true},
    lifeGainPct:{label:'Ganho estimado de vida útil',unit:'%',positive:false},
    fuelMonthlyCost:{label:'Gasto mensal de combustível da frota atendida',unit:'BRL/mês',positive:true},
    fuelSavingPct:{label:'Economia estimada de combustível',unit:'%',positive:false,max:100}
  });
  function normalizeRoiAssumptions(input = {}) {
    return {
      schemaVersion:1, tires:input.tires !== false, fuel:input.fuel === true,
      fields:Object.fromEntries(Object.entries(ROI_FIELDS).map(([key,definition]) => {
        const field = input.fields?.[key] || {};
        const value = field.value === '' || field.value == null ? null : Number(field.value);
        return [key,{value:Number.isFinite(value) ? value : null,unit:definition.unit,
          source:clean(field.source).slice(0,300),status:field.status === 'reviewed' ? 'reviewed' : 'validate',
          version:Math.max(1,Math.round(safeNumber(field.version) || 1)),updatedAt:clean(field.updatedAt).slice(0,40)}];
      }))
    };
  }
  function calculateRoi(facts = {}, input = {}) {
    const assumptions = normalizeRoiAssumptions(input);
    const investment = Number(facts.investment), tires = Number(facts.totalTires);
    const missing = [];
    if (!Number.isFinite(investment) || investment <= 0) missing.push('Investimento da cotação');
    if (!assumptions.tires && !assumptions.fuel) missing.push('Selecione uma fonte de economia');
    if (assumptions.tires && (!Number.isFinite(tires) || tires <= 0)) missing.push('Pneus atendidos');
    const required = [...(assumptions.tires ? ['tirePrice','lifeMonths','lifeGainPct'] : []), ...(assumptions.fuel ? ['fuelMonthlyCost','fuelSavingPct'] : [])];
    for (const key of required) {
      const field = assumptions.fields[key], definition = ROI_FIELDS[key];
      if (field.value == null || field.value < 0 || (definition.positive && field.value <= 0) || (definition.max != null && field.value > definition.max)
        || field.status !== 'reviewed' || !field.source || !Number.isFinite(Date.parse(field.updatedAt))) missing.push(definition.label);
    }
    const result = {formulaVersion:'replacement-cycle-and-fuel-v1',status:missing.length ? 'validate' : 'ready',
      investment:Number.isFinite(investment) ? investment : null,totalTires:Number.isFinite(tires) ? tires : null,
      assumptions,missing,tireMonthly:null,fuelMonthly:null,monthlySavings:null,annualSavings:null,paybackMonths:null,roi12mPct:null,lifeWithMonths:null};
    if (missing.length) return result;
    const fields = assumptions.fields;
    result.lifeWithMonths = assumptions.tires ? fields.lifeMonths.value * (1 + fields.lifeGainPct.value / 100) : null;
    result.tireMonthly = assumptions.tires ? tires * fields.tirePrice.value * (1 / fields.lifeMonths.value - 1 / result.lifeWithMonths) : 0;
    result.fuelMonthly = assumptions.fuel ? fields.fuelMonthlyCost.value * fields.fuelSavingPct.value / 100 : 0;
    result.monthlySavings = result.tireMonthly + result.fuelMonthly;
    result.annualSavings = result.monthlySavings * 12;
    result.paybackMonths = result.monthlySavings > 0 ? investment / result.monthlySavings : null;
    result.roi12mPct = (result.annualSavings - investment) / investment * 100;
    if (Object.values(result).some(value => typeof value === 'number' && !Number.isFinite(value))) return {...result,status:'validate',missing:['Premissas fora dos limites numéricos'],tireMonthly:null,fuelMonthly:null,monthlySavings:null,annualSavings:null,paybackMonths:null,roi12mPct:null,lifeWithMonths:null};
    return result;
  }

  function safeTechnicalContext(context = {}) {
    const fields = ['id','leadId','handoffId','selectedVehicleId','applicationScope','libras','includeDianteira','qty','targetVehicleName','manualConfirmed','notes'];
    const next = Object.fromEntries(fields.filter(key => context[key] != null && typeof context[key] !== 'object').map(key => [key,typeof context[key] === 'string' ? context[key].slice(0,1000) : context[key]]));
    next.answers = Object.fromEntries(Object.entries(context.answers || {}).slice(0,30).filter(([,value]) => typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean').map(([key,value]) => [key,String(value).slice(0,180)]));
    next.manualItems = Array.isArray(context.manualItems) ? context.manualItems.slice(0,100).map(item => ({...safeExtra(item),applicationScope:clean(item.applicationScope) || 'validar'})) : null;
    return next;
  }

  // Presentation is versioned metadata, never a second commercial calculation.
  const PRESENTATION_TEMPLATES = Object.freeze({
    executivo:{label:'Executivo',sections:['customer','vehicles','conditions','roi','observations','disclaimer']},
    tecnico:{label:'Técnico',sections:['customer','vehicles','application','parts','conditions','roi','assumptions','observations','disclaimer']},
    compacto:{label:'Compacto',sections:['customer','parts','conditions','observations','disclaimer']}
  });
  const PRESENTATION_SECTIONS = Object.freeze(['customer','vehicles','application','parts','conditions','roi','assumptions','disclaimer','observations']);
  function normalizePresentation(input = {}, clientId = '') {
    const templateId = Object.hasOwn(PRESENTATION_TEMPLATES,input.templateId) ? input.templateId : 'tecnico';
    const defaults = PRESENTATION_TEMPLATES[templateId].sections;
    const textLimits = {title:120,introduction:1200,observation:2000,deliveryNote:500,validityText:300,closing:800};
    const reference = input.branding;
    const branding = reference && clean(reference.clientId) === clean(clientId) && clean(reference.materialId) && clean(reference.assetId)
      ? {clientId:clean(clientId),materialId:clean(reference.materialId).slice(0,180),assetId:clean(reference.assetId).slice(0,180),version:clean(reference.version).slice(0,40),sha256:/^[a-f0-9]{64}$/.test(reference.sha256 || '') ? reference.sha256 : ''} : null;
    return {schemaVersion:1,templateId,
      sections:Object.fromEntries(PRESENTATION_SECTIONS.map(key => [key,typeof input.sections?.[key] === 'boolean' ? input.sections[key] : defaults.includes(key)])),
      text:Object.fromEntries(Object.entries(textLimits).map(([key,limit]) => [key,clean(input.text?.[key]).slice(0,limit)])),branding};
  }
  function presentationSnapshot(original, presentation, options = {}) {
    validatePublicSnapshot(original);
    const snapshot = {...clone(original),preparedAt:iso(options.now),presentation:normalizePresentation(presentation,original.clientId)};
    validatePublicSnapshot(snapshot);
    return freeze(snapshot);
  }
  function safeCalculatedItem(item = {}) {
    return {code:clean(item.code),name:clean(item.name),category:clean(item.category),qty:safeNumber(item.qty),
      priceUnit:safeNumber(item.priceUnit),subtotal:safeNumber(item.subtotal),isCustomPrice:item.isCustomPrice === true};
  }
  function safeApplicationRows(projection = {}) {
    return (projection.rows || []).slice(0,200).map(row => ({code:clean(row.code),name:clean(row.name),qty:safeNumber(row.qty),
      scope:clean(row.scope),position:clean(row.position),status:clean(row.status),origin:clean(row.origin),
      path:(row.path || []).slice(0,20).map(step => clean(step).slice(0,300))}));
  }
  function snapshotSignature(snapshot) {
    const {preparedAt,version,...content} = snapshot;
    return JSON.stringify(content);
  }
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }

  function buildSnapshot(input = {}, options = {}) {
    const quote = input.quote || {};
    const state = input.quoteState || quote.payload || {};
    const clientId = clean(input.clientId || quote.clientId);
    const quoteId = clean(input.quoteId || quote.id);
    if (!clientId) throw new Error('Snapshot de proposta exige clientId');
    if (!quoteId) throw new Error('Snapshot de proposta exige quoteId');
    if (quote.id && clean(quote.id) !== quoteId) throw new Error('Identidade da cotação divergente');
    if (quote.clientId && clean(quote.clientId) !== clientId) throw new Error('Cliente da proposta diverge da cotação');

    const client = state.client || input.client || {};
    const preparedAt = iso(options.now);
    const data = input.quoteData;
    if (data && Math.abs(safeNumber(data.totalFinalVenda) - safeNumber(quote.totalValue)) > 0.000001) throw new Error('Total da proposta diverge da cotação');
    if (data && (state.vehicles || []).some(vehicle => vehicle.clientId && clean(vehicle.clientId) !== clientId)) throw new Error('Veículo pertence a outro cliente');
    if (data && (state.vehicles || []).some(vehicle => vehicle.technicalContext?.leadId && clean(vehicle.technicalContext.leadId) !== clientId)) throw new Error('Contexto técnico pertence a outro cliente');
    if (data && new Set((state.vehicles || []).map(vehicle => clean(vehicle.id))).size !== (state.vehicles || []).length) throw new Error('Identidades de veículos duplicadas');
    if (data && ((data.vehicles || []).length !== (state.vehicles || []).length || (state.vehicles || []).some(vehicle => !(data.vehicles || []).some(row => clean(row.id) === clean(vehicle.id))))) throw new Error('Contexto de veículos diverge da cotação');
    const snapshot = {
      schemaVersion: 1,
      quoteId,
      clientId,
      preparedAt,
      templateId: clean(state.activePdfTemplate || input.templateId || 'default'),
      presentation: normalizePresentation(client.proposalPresentation,clientId),
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
    if (data) {
      snapshot.representationVersion = 2;
      snapshot.commercial = {...snapshot.commercial,totalTires:safeNumber(data.totalPneus),totalVehicles:safeNumber(data.totalConjuntos),
        subtotalProducts:safeNumber(data.subtotalProdutos),cardFee:safeNumber(data.taxaCartaoValor),installments:safeNumber(data.parcelas),installmentValue:safeNumber(data.valorParcela),
        deliveryText:clean(client.prazoEntrega),seller:clean(client.vendedor),validUntil:clean(client.proposalTerms?.validUntil),
        paymentTerms:clean(client.proposalTerms?.paymentTerms || client.condicaoPagamento || client.paymentTerms),notes:clean(client.proposalTerms?.notes).slice(0,3000)};
      snapshot.vehicles = snapshot.vehicles.map(vehicle => {
        const original = (state.vehicles || []).find(row => clean(row.id) === vehicle.id);
        const calculated = data.vehicles.find(row => clean(row.id) === vehicle.id);
        return {...vehicle,clientId,technicalContext:safeTechnicalContext(original.technicalContext),
          calculatedItems:(calculated.calculatedItems || []).slice(0,100).map(safeCalculatedItem),
          unitSubtotal:safeNumber(calculated.unitSubtotal),totalSubtotal:safeNumber(calculated.totalSubtotal),totalTires:safeNumber(calculated.totalPneus),
          applicationRows:safeApplicationRows(input.applicationMaps?.[vehicle.id])};
      });
      snapshot.extraItems = (data.extraItems || []).slice(0,200).map(safeCalculatedItem);
      snapshot.roi = calculateRoi({investment:snapshot.commercial.totalValue,totalTires:snapshot.commercial.totalTires},client.roiAssumptions);
    }
    validatePublicSnapshot(snapshot);
    return freeze(snapshot);
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
    const snapshot = input.sourceSnapshot ? presentationSnapshot(input.sourceSnapshot,input.presentation,options) : buildSnapshot(input, options);
    if (input.sourceSnapshot && !next.generatedDocuments.some(doc=>doc.documentType === 'proposal_tracking' && doc.clientId === input.sourceSnapshot.clientId && doc.quoteId === input.sourceSnapshot.quoteId && doc.snapshot && snapshotSignature(doc.snapshot) === snapshotSignature(input.sourceSnapshot))) throw new Error('Revisão visual exige uma versão histórica existente');
    if (input.sourceSnapshot && (clean(input.clientId) !== snapshot.clientId || clean(input.quoteId) !== snapshot.quoteId)) throw new Error('Revisão visual exige a identidade original da proposta');
    const family = next.generatedDocuments.filter(item => item.documentType === 'proposal_tracking' && clean(item.quoteId) === snapshot.quoteId);
    if (family.some(item => clean(item.clientId) !== snapshot.clientId)) throw new Error('Cotação já vinculada a outro cliente');
    const latest = family.sort((a,b) => safeNumber(b.version) - safeNumber(a.version))[0];
    if (latest?.snapshot && snapshotSignature(latest.snapshot) === snapshotSignature(snapshot)) return next;
    const version = latest ? Math.max(1,safeNumber(latest.version)) + 1 : 1;
    const baseId = clean(input.proposalId) || proposalId(snapshot.quoteId);
    const id = version === 1 ? baseId : `${baseId}-V${version}`;
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
    if (!input.sourceSnapshot) {
      if (quoteIndex >= 0) next.quotes.splice(quoteIndex, 1, quoteRecord);
      else next.quotes.unshift(quoteRecord);
    }

    const documentRecord = {
      id,
      documentType: 'proposal_tracking',
      clientId: snapshot.clientId,
      quoteId: snapshot.quoteId,
      status: 'internal_draft',
      version,
      createdAt:preparedAt,
      updatedAt:preparedAt,
      previousProposalId:latest?.id || null,
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
    if (documentIndex >= 0) throw new Error('Identidade da proposta já existe; versão anterior preservada');
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
    canPublish,
    ROI_FIELDS, normalizeRoiAssumptions, calculateRoi, safeTechnicalContext,
    PRESENTATION_TEMPLATES, PRESENTATION_SECTIONS, normalizePresentation, presentationSnapshot
  };
}));
