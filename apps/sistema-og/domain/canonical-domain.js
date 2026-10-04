(function attachCanonicalDomain(globalScope, factory) {
  const cnpj = typeof module !== 'undefined' && module.exports
    ? require('./cnpj.js')
    : globalScope.OG_CNPJ;
  const api = factory(cnpj);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_CANONICAL_DOMAIN = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCanonicalDomain(cnpjDomain) {
  'use strict';

  const ENTITY_TYPES = Object.freeze(['company', 'company_establishment', 'company_location', 'contact', 'opportunity', 'activity', 'task']);
  const ESTABLISHMENT_ROLES = Object.freeze(['HEADQUARTERS', 'BRANCH', 'UNKNOWN']);
  const LOCATION_PURPOSES = Object.freeze(['REGISTERED_ADDRESS', 'OPERATIONAL_BASE', 'GARAGE', 'DISTRIBUTION_CENTER', 'OFFICE', 'VISIT_POINT', 'OTHER']);
  const LOCATION_ADDRESS_SOURCES = Object.freeze(['CNPJ_REGISTRY', 'COMPANY_WEBSITE', 'CUSTOMER', 'SELLER', 'VISIT', 'IMPORT', 'AI_SUGGESTED', 'OTHER']);
  const GEOCODE_PRECISIONS = Object.freeze(['ROOFTOP', 'ADDRESS', 'STREET', 'POSTAL_CODE', 'NEIGHBORHOOD', 'CITY', 'REGION', 'UNKNOWN', 'MANUAL']);
  const LOCATION_VERIFICATION_STATUSES = Object.freeze(['UNVERIFIED', 'AUTO_ACCEPTED', 'NEEDS_REVIEW', 'VERIFIED_BY_SELLER', 'VERIFIED_BY_CUSTOMER', 'VERIFIED_BY_VISIT', 'REJECTED', 'STALE']);

  function clean(value) { return String(value ?? '').trim(); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalizeCnpj(value) {
    if (cnpjDomain?.normalize) return cnpjDomain.normalize(value);
    return clean(value).toUpperCase().replace(/[.\/\-\s]/g, '');
  }
  function isCnpjValid(value) {
    if (cnpjDomain?.isValid) return cnpjDomain.isValid(value);
    return /^[A-Z0-9]{12}\d{2}$/.test(normalizeCnpj(value));
  }
  function iso(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) throw new Error('Data inválida');
    return date.toISOString();
  }
  function optionalIso(value) { return value ? iso(value) : null; }
  function requireId(record, type) {
    if (!clean(record?.id)) throw new Error(`${type} exige id`);
    return clean(record.id);
  }
  function base(record, type, options = {}) {
    const now = iso(options.now);
    return {
      ...clone(record || {}),
      id: requireId(record, type),
      entityType: type,
      createdAt: record?.createdAt ? iso(record.createdAt) : now,
      updatedAt: now,
      archivedAt: record?.archivedAt ? iso(record.archivedAt) : null
    };
  }
  function enumValue(value, allowed, fallback, label) {
    const normalized = clean(value || fallback).toUpperCase();
    if (!allowed.includes(normalized)) throw new Error(`${label} inválido: ${normalized || '?'}`);
    return normalized;
  }
  function optionalConfidence(value) {
    if (value == null || value === '') return null;
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 1) throw new Error('geocodeConfidence deve estar entre 0 e 1');
    return number;
  }
  function position(value) {
    if (!value || typeof value !== 'object') return null;
    const latitude = Number(value.latitude ?? value.lat);
    const longitude = Number(value.longitude ?? value.lng ?? value.lon);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('latitude inválida');
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('longitude inválida');
    return Object.freeze({ latitude, longitude });
  }

  function createCompany(record, options = {}) {
    const next = base(record, 'company', options);
    next.name = clean(record?.name);
    if (!next.name) throw new Error('company exige name');
    next.legacyLeadId = clean(record?.legacyLeadId) || null;
    next.cnpj = normalizeCnpj(record?.cnpj) || null;
    next.segment = clean(record?.segment) || null;
    next.status = clean(record?.status) || 'prospect';
    return next;
  }

  function createCompanyEstablishment(record, options = {}) {
    const next = base(record, 'company_establishment', options);
    next.companyId = clean(record?.companyId);
    if (!next.companyId) throw new Error('company_establishment exige companyId');
    next.cnpj = normalizeCnpj(record?.cnpj);
    if (!next.cnpj || !isCnpjValid(next.cnpj)) throw new Error('company_establishment exige CNPJ válido');
    next.cnpjRoot = cnpjDomain?.root ? cnpjDomain.root(next.cnpj) : next.cnpj.slice(0, 8);
    next.legalName = clean(record?.legalName) || null;
    next.tradeName = clean(record?.tradeName) || null;
    next.role = enumValue(record?.role, ESTABLISHMENT_ROLES, 'UNKNOWN', 'establishment role');
    next.registryStatus = clean(record?.registryStatus) || null;
    next.primaryCnae = clean(record?.primaryCnae) || null;
    next.openedAt = optionalIso(record?.openedAt);
    next.registryProvider = clean(record?.registryProvider) || null;
    next.registryObservedAt = optionalIso(record?.registryObservedAt);
    return next;
  }

  function createCompanyLocation(record, options = {}) {
    const next = base(record, 'company_location', options);
    next.companyId = clean(record?.companyId);
    if (!next.companyId) throw new Error('company_location exige companyId');
    next.establishmentId = clean(record?.establishmentId) || null;
    next.purpose = enumValue(record?.purpose, LOCATION_PURPOSES, '', 'location purpose');
    next.label = clean(record?.label) || null;
    next.addressRaw = clean(record?.addressRaw) || null;
    next.street = clean(record?.street) || null;
    next.streetNumber = clean(record?.streetNumber) || null;
    next.complement = clean(record?.complement) || null;
    next.district = clean(record?.district) || null;
    next.postalCode = clean(record?.postalCode) || null;
    next.city = clean(record?.city) || null;
    next.cityIbgeCode = clean(record?.cityIbgeCode) || null;
    next.state = clean(record?.state).toUpperCase() || null;
    next.countryCode = clean(record?.countryCode).toUpperCase() || 'BR';
    next.formattedAddress = clean(record?.formattedAddress) || null;
    next.position = position(record?.position);
    next.addressSource = enumValue(record?.addressSource, LOCATION_ADDRESS_SOURCES, 'OTHER', 'address source');
    next.sourceProvider = clean(record?.sourceProvider) || null;
    next.sourceReference = clean(record?.sourceReference) || null;
    next.sourceObservedAt = optionalIso(record?.sourceObservedAt);
    next.geocodeProvider = clean(record?.geocodeProvider) || null;
    next.geocodeProviderRef = clean(record?.geocodeProviderRef) || null;
    next.geocodedAt = optionalIso(record?.geocodedAt);
    next.geocodePrecision = enumValue(record?.geocodePrecision, GEOCODE_PRECISIONS, 'UNKNOWN', 'geocode precision');
    next.geocodeConfidence = optionalConfidence(record?.geocodeConfidence);
    next.verificationStatus = enumValue(record?.verificationStatus, LOCATION_VERIFICATION_STATUSES, 'UNVERIFIED', 'verification status');
    next.verifiedBy = clean(record?.verifiedBy) || null;
    next.verifiedAt = optionalIso(record?.verifiedAt);
    next.isPrimary = record?.isPrimary === true;
    next.isActive = record?.isActive !== false;
    return next;
  }

  function createContact(record, options = {}) {
    const next = base(record, 'contact', options);
    next.companyId = clean(record?.companyId);
    next.name = clean(record?.name);
    if (!next.companyId || !next.name) throw new Error('contact exige companyId e name');
    next.role = clean(record?.role) || 'contact';
    next.phone = clean(record?.phone).replace(/\D/g, '') || null;
    next.email = clean(record?.email).toLowerCase() || null;
    next.isDecisionMaker = record?.isDecisionMaker === true;
    return next;
  }

  function createOpportunity(record, options = {}) {
    const next = base(record, 'opportunity', options);
    next.companyId = clean(record?.companyId);
    if (!next.companyId) throw new Error('opportunity exige companyId');
    next.title = clean(record?.title) || 'Oportunidade';
    next.stage = clean(record?.stage) || 'open';
    next.valueCents = Number.isInteger(record?.valueCents) && record.valueCents >= 0 ? record.valueCents : null;
    next.currency = clean(record?.currency) || 'BRL';
    return next;
  }

  function createActivity(record, options = {}) {
    const next = base(record, 'activity', options);
    next.companyId = clean(record?.companyId);
    next.type = clean(record?.type);
    next.occurredAt = record?.occurredAt ? iso(record.occurredAt) : iso(options.now);
    if (!next.companyId || !next.type) throw new Error('activity exige companyId e type');
    next.contactId = clean(record?.contactId) || null;
    next.opportunityId = clean(record?.opportunityId) || null;
    next.summary = clean(record?.summary);
    return next;
  }

  function createTask(record, options = {}) {
    const next = base(record, 'task', options);
    next.companyId = clean(record?.companyId);
    next.title = clean(record?.title);
    if (!next.companyId || !next.title) throw new Error('task exige companyId e title');
    next.opportunityId = clean(record?.opportunityId) || null;
    next.dueAt = record?.dueAt ? iso(record.dueAt) : null;
    next.status = clean(record?.status) || 'open';
    return next;
  }

  function validateGraph(graph = {}) {
    const errors = [];
    const companies = Array.isArray(graph.companies) ? graph.companies : [];
    const establishments = Array.isArray(graph.establishments) ? graph.establishments : [];
    const locations = Array.isArray(graph.locations) ? graph.locations : [];
    const contacts = Array.isArray(graph.contacts) ? graph.contacts : [];
    const opportunities = Array.isArray(graph.opportunities) ? graph.opportunities : [];
    const activities = Array.isArray(graph.activities) ? graph.activities : [];
    const tasks = Array.isArray(graph.tasks) ? graph.tasks : [];
    const collections = { companies, establishments, locations, contacts, opportunities, activities, tasks };
    const seen = new Set();
    for (const [key, items] of Object.entries(collections)) {
      for (const item of items) {
        if (!item?.id) { errors.push(`${key} contém item sem id`); continue; }
        const scoped = `${key}:${item.id}`;
        if (seen.has(scoped)) errors.push(`${key} contém id duplicado: ${item.id}`);
        seen.add(scoped);
      }
    }
    const expectedTypes = {
      companies: 'company',
      establishments: 'company_establishment',
      locations: 'company_location',
      contacts: 'contact',
      opportunities: 'opportunity',
      activities: 'activity',
      tasks: 'task'
    };
    for (const [key, items] of Object.entries(collections)) {
      for (const item of items) {
        if (key === 'contacts' && item?.entityType == null) continue;
        if (item?.entityType !== expectedTypes[key]) errors.push(`${key} ${item?.id || '?'} possui entityType inválido`);
      }
    }
    const legacyLeadIds = new Set();
    for (const company of companies) {
      if (!company.legacyLeadId) continue;
      const bridge = String(company.legacyLeadId);
      if (legacyLeadIds.has(bridge)) errors.push(`companies contém legacyLeadId duplicado: ${bridge}`);
      legacyLeadIds.add(bridge);
    }
    const companyIds = new Set(companies.map(item => String(item.id)));
    const establishmentIds = new Map(establishments.map(item => [String(item.id), String(item.companyId)]));
    const establishmentCnpjs = new Set();
    for (const item of establishments) {
      if (!companyIds.has(String(item.companyId))) errors.push(`establishments ${item.id || '?'} referencia companyId inexistente`);
      const cnpj = normalizeCnpj(item.cnpj);
      if (cnpj) {
        if (establishmentCnpjs.has(cnpj)) errors.push(`establishments contém CNPJ duplicado: ${cnpj}`);
        establishmentCnpjs.add(cnpj);
      }
    }
    for (const item of locations) {
      if (!companyIds.has(String(item.companyId))) errors.push(`locations ${item.id || '?'} referencia companyId inexistente`);
      if (item.establishmentId) {
        const establishmentCompanyId = establishmentIds.get(String(item.establishmentId));
        if (!establishmentCompanyId) errors.push(`locations ${item.id || '?'} referencia establishmentId inexistente`);
        else if (establishmentCompanyId !== String(item.companyId)) errors.push(`locations ${item.id || '?'} referencia establishment de outra Company`);
      }
    }
    const canonicalContacts = contacts.filter(item => item?.entityType === 'contact');
    const contactIds = new Set(canonicalContacts.map(item => String(item.id)));
    const opportunityIds = new Set(opportunities.map(item => String(item.id)));
    for (const [key, items] of Object.entries({ contacts: canonicalContacts, opportunities, activities, tasks })) {
      for (const item of items) if (!companyIds.has(String(item.companyId))) errors.push(`${key} ${item.id || '?'} referencia companyId inexistente`);
    }
    for (const item of activities) {
      if (item.contactId && !contactIds.has(String(item.contactId))) errors.push(`activity ${item.id || '?'} referencia contactId inexistente`);
    }
    for (const item of [...activities, ...tasks]) {
      if (item.opportunityId && !opportunityIds.has(String(item.opportunityId))) errors.push(`${item.entityType || 'registro'} ${item.id || '?'} referencia opportunityId inexistente`);
    }
    return { valid: errors.length === 0, errors };
  }

  function createEmptyGraph() {
    return { schemaVersion: 1, companies: [], establishments: [], locations: [], contacts: [], opportunities: [], activities: [], tasks: [] };
  }

  return {
    SCHEMA_VERSION: 1,
    ENTITY_TYPES,
    ESTABLISHMENT_ROLES,
    LOCATION_PURPOSES,
    LOCATION_ADDRESS_SOURCES,
    GEOCODE_PRECISIONS,
    LOCATION_VERIFICATION_STATUSES,
    createEmptyGraph,
    createCompany,
    createCompanyEstablishment,
    createCompanyLocation,
    createContact,
    createOpportunity,
    createActivity,
    createTask,
    validateGraph
  };
}));
