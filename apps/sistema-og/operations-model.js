(function attachOperationsModel(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_OPERATIONS_MODEL = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createOperationsModel() {
  'use strict';

  const SCHEMA_VERSION = 1;
  const ENTITY_KEYS = Object.freeze([
    'contacts', 'callSessions', 'materials', 'materialShares', 'materialPackages',
    'quotes', 'quoteTemplates', 'messageTemplates', 'documentTemplates',
    'generatedDocuments', 'sales', 'commissions', 'partners', 'transporters',
    'transporterCoverage', 'users', 'goals', 'activityEvents'
    , 'communications'
  ]);

  function isoNow(now) {
    const value = now instanceof Date ? now : new Date(now || Date.now());
    return Number.isNaN(value.getTime()) ? new Date().toISOString() : value.toISOString();
  }

  function createEmptyOperations(now) {
    const operations = {
      schemaVersion: SCHEMA_VERSION,
      createdAt: isoNow(now),
      updatedAt: isoNow(now),
      migrationLog: []
    };
    ENTITY_KEYS.forEach(key => { operations[key] = []; });
    return operations;
  }

  function cloneJson(value) {
    return JSON.parse(JSON.stringify(value ?? {}));
  }

  function migrateOperations(input, options = {}) {
    const source = input && typeof input === 'object' && !Array.isArray(input) ? cloneJson(input) : {};
    const now = isoNow(options.now);
    const fromVersion = Number(source.schemaVersion || 0);
    const migrated = { ...createEmptyOperations(now), ...source };
    ENTITY_KEYS.forEach(key => { migrated[key] = Array.isArray(source[key]) ? source[key] : []; });
    migrated.schemaVersion = SCHEMA_VERSION;
    migrated.createdAt = source.createdAt || now;
    migrated.updatedAt = fromVersion < SCHEMA_VERSION ? now : (source.updatedAt || now);
    migrated.migrationLog = Array.isArray(source.migrationLog) ? source.migrationLog : [];
    if (fromVersion < SCHEMA_VERSION && !migrated.migrationLog.some(item => item?.toVersion === SCHEMA_VERSION)) {
      migrated.migrationLog.push({ fromVersion, toVersion: SCHEMA_VERSION, at: now, mode: 'additive' });
    }
    return migrated;
  }

  function validateOperations(input) {
    const errors = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) errors.push('operations deve ser um objeto');
    if (Number(input?.schemaVersion) !== SCHEMA_VERSION) errors.push(`schemaVersion deve ser ${SCHEMA_VERSION}`);
    ENTITY_KEYS.forEach(key => {
      if (!Array.isArray(input?.[key])) errors.push(`${key} deve ser uma lista`);
      const ids = new Set();
      for (const item of input?.[key] || []) {
        if (!item || typeof item !== 'object') { errors.push(`${key} contém item inválido`); continue; }
        if (!item.id) { errors.push(`${key} contém item sem id`); continue; }
        const id = String(item.id);
        if (ids.has(id)) errors.push(`${key} contém id duplicado: ${id}`);
        ids.add(id);
      }
    });
    return { valid: errors.length === 0, errors };
  }

  function summarizeOperations(input) {
    const migrated = migrateOperations(input);
    return {
      schemaVersion: migrated.schemaVersion,
      updatedAt: migrated.updatedAt,
      counts: Object.fromEntries(ENTITY_KEYS.map(key => [key, migrated[key].length]))
    };
  }

  function appendActivity(operations, activity) {
    const next = migrateOperations(operations);
    if (!activity?.id || !activity?.type || !activity?.at) throw new Error('Atividade exige id, type e at');
    if (!next.activityEvents.some(item => String(item.id) === String(activity.id))) next.activityEvents.unshift(cloneJson(activity));
    next.updatedAt = isoNow();
    return next;
  }

  function validateMaterial(material) {
    const errors = [];
    const mediaTypes = new Set(['video', 'image', 'pdf', 'presentation', 'audio', 'link', 'script', 'message']);
    const statuses = new Set(['draft', 'approved', 'outdated', 'archived']);
    const audiences = new Set(['internal', 'customer_authorized']);
    if (!material?.id) errors.push('material exige id');
    if (!String(material?.title || '').trim()) errors.push('material exige título');
    if (!mediaTypes.has(material?.mediaType)) errors.push('mediaType inválido');
    if (!statuses.has(material?.status)) errors.push('status inválido');
    if (!audiences.has(material?.audience)) errors.push('audience inválido');
    if (material?.audience === 'customer_authorized' && !String(material?.consentRef || '').trim()) errors.push('material autorizado exige consentRef');
    return { valid: errors.length === 0, errors };
  }

  function upsertMaterial(operations, material) {
    const result = validateMaterial(material);
    if (!result.valid) throw new Error(result.errors.join('; '));
    const next = migrateOperations(operations);
    const index = next.materials.findIndex(item => String(item.id) === String(material.id));
    if (index >= 0) next.materials.splice(index, 1, cloneJson(material));
    else next.materials.unshift(cloneJson(material));
    next.updatedAt = isoNow();
    return next;
  }

  function upsertMaterialPackage(operations, packageRecord) {
    if (!packageRecord?.id || !packageRecord?.clientId || !String(packageRecord?.title || '').trim()) throw new Error('Pacote exige id, clientId e título');
    if (!Array.isArray(packageRecord.materialIds) || !packageRecord.materialIds.length) throw new Error('Pacote exige pelo menos um material');
    const next = migrateOperations(operations);
    const known = new Set(next.materials.map(item => String(item.id)));
    if (packageRecord.materialIds.some(id => !known.has(String(id)))) throw new Error('Pacote contém material inexistente');
    const index = next.materialPackages.findIndex(item => String(item.id) === String(packageRecord.id));
    if (index >= 0) next.materialPackages.splice(index, 1, cloneJson(packageRecord)); else next.materialPackages.unshift(cloneJson(packageRecord));
    next.updatedAt = isoNow();
    return next;
  }

  function appendMaterialShare(operations, share) {
    if (!share?.id || !share?.materialId || !share?.clientId || !share?.channel || !share?.preparedAt) throw new Error('Compartilhamento exige identificação, material, cliente, canal e preparo');
    if (share.sentAt && share.sentConfirmedByUser !== true) throw new Error('sentAt exige confirmação explícita do usuário');
    const next = migrateOperations(operations);
    if (!next.materials.some(item => String(item.id) === String(share.materialId))) throw new Error('Material do compartilhamento não existe');
    if (!next.materialShares.some(item => String(item.id) === String(share.id))) next.materialShares.unshift(cloneJson(share));
    next.updatedAt = isoNow();
    return next;
  }

  return { SCHEMA_VERSION, ENTITY_KEYS, createEmptyOperations, migrateOperations, validateOperations, summarizeOperations, appendActivity, validateMaterial, upsertMaterial, upsertMaterialPackage, appendMaterialShare };
}));
