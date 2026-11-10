(function attachPresentProjection(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PRESENT_PROJECTION = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createPresentProjection() {
  'use strict';

  const MAX_SOURCE_BYTES = 250000;
  const MAX_DTO_BYTES = 60000;
  const MAX_VEHICLES = 40;
  const MAX_ITEMS = 100;
  const MAX_TEXT = 300;
  const ROI_FIELDS = ['tirePrice', 'lifeMonths', 'lifeGainPct', 'fuelMonthlyCost', 'fuelSavingPct'];
  const ROI_UNITS = Object.freeze({tirePrice:'BRL/pneu',lifeMonths:'meses',lifeGainPct:'%',fuelMonthlyCost:'BRL/mês',fuelSavingPct:'%'});
  const kinds = ['proposal_revision', 'demonstrative_fixture'];

  class ProjectionError extends Error {
    constructor(code, path) {
      super(`${code}: ${path}`);
      this.name = 'ProjectionError';
      this.code = code;
      this.path = path;
    }
  }
  function fail(code, path) { throw new ProjectionError(code, path); }
  function object(value, path) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) fail('INVALID_OBJECT', path);
    return value;
  }
  function exact(value, allowed, path) {
    object(value, path);
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== 'string' || !allowed.includes(key)) fail('UNKNOWN_FIELD', `${path}.${String(key)}`);
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !Object.hasOwn(descriptor, 'value')) fail('INVALID_OBJECT', `${path}.${key}`);
    }
    return value;
  }
  function str(value, path, max = MAX_TEXT) {
    if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) fail('INVALID_TEXT', path);
    return value.trim();
  }
  function number(value, path, {positive = false, integer = false} = {}) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || positive && value === 0 || integer && !Number.isSafeInteger(value)) fail('INVALID_NUMBER', path);
    return value;
  }
  function time(value, path) {
    str(value, path, 40);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value) || !Number.isFinite(Date.parse(value))) fail('INVALID_DATE', path);
    return Date.parse(value);
  }
  function array(value, path, max) {
    if (!Array.isArray(value) || value.length > max || Object.keys(value).length !== value.length) fail('INVALID_ARRAY', path);
    return value;
  }
  function freeze(value) {
    if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
    return value;
  }
  function boundedJson(value, path, max) {
    const seen = new WeakSet();
    function inspect(child, at) {
      if (child === null || typeof child === 'string' || typeof child === 'boolean' || typeof child === 'number' && Number.isFinite(child)) return;
      if (!child || typeof child !== 'object') fail('INVALID_VALUE', at);
      if (seen.has(child)) fail('CIRCULAR_OR_SHARED', at);
      seen.add(child);
      if (Array.isArray(child)) {
        for (const key of Reflect.ownKeys(child)) if (key !== 'length' && !/^(0|[1-9]\d*)$/.test(String(key))) fail('INVALID_ARRAY', at);
      } else object(child, at);
      for (const key of Reflect.ownKeys(child)) {
        if (key === 'length' && Array.isArray(child)) continue;
        const descriptor = Object.getOwnPropertyDescriptor(child, key);
        if (typeof key !== 'string' || !descriptor || !Object.hasOwn(descriptor, 'value')) fail('INVALID_VALUE', at);
        inspect(descriptor.value, `${at}.${key}`);
      }
    }
    inspect(value, path);
    const json = JSON.stringify(value);
    if (!json || BufferLength(json) > max) fail('SIZE_LIMIT', path);
    return json;
  }
  function BufferLength(value) {
    if (typeof Buffer !== 'undefined') return Buffer.byteLength(value, 'utf8');
    return new TextEncoder().encode(value).length;
  }
  function commercialExpiry(value) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      const at = Date.parse(`${value}T23:59:59.999Z`);
      if (!Number.isFinite(at) || new Date(at).toISOString().slice(0, 10) !== value) fail('INVALID_DATE', 'snapshot.commercial.validUntil');
      return at;
    }
    return time(value, 'snapshot.commercial.validUntil');
  }
  function textReview(value, expected, path) {
    const selected = str(value, path);
    if (selected !== expected) fail('TEXT_NOT_REVIEWED', path);
    return selected;
  }
  function checkedRoi(roi, now, reviewedSources) {
    if (!roi) return null;
    exact(roi, ['formulaVersion','status','investment','totalTires','assumptions','missing','tireMonthly','fuelMonthly','monthlySavings','annualSavings','paybackMonths','roi12mPct','lifeWithMonths'], 'snapshot.roi');
    if (roi.formulaVersion !== 'replacement-cycle-and-fuel-v1' || !['ready','validate'].includes(roi.status)) fail('UNSUPPORTED_ROI', 'snapshot.roi');
    exact(roi.assumptions, ['schemaVersion','tires','fuel','fields'], 'snapshot.roi.assumptions');
    if (roi.assumptions.schemaVersion !== 1 || typeof roi.assumptions.tires !== 'boolean' || typeof roi.assumptions.fuel !== 'boolean') fail('UNSUPPORTED_ROI', 'snapshot.roi.assumptions');
    if (roi.status === 'ready' && !roi.assumptions.tires && !roi.assumptions.fuel) fail('UNSUPPORTED_ROI', 'snapshot.roi.assumptions');
    exact(roi.assumptions.fields, ROI_FIELDS, 'snapshot.roi.assumptions.fields');
    const required = [...(roi.assumptions.tires ? ['tirePrice','lifeMonths','lifeGainPct'] : []), ...(roi.assumptions.fuel ? ['fuelMonthlyCost','fuelSavingPct'] : [])];
    exact(reviewedSources, required, 'policy.reviewedText.roiSources');
    const premises = required.map(key => {
      const field = exact(roi.assumptions.fields[key], ['value','unit','source','status','version','updatedAt'], `snapshot.roi.assumptions.fields.${key}`);
      if (roi.status === 'validate') return null;
      if (field.unit !== ROI_UNITS[key]) fail('UNSUPPORTED_ROI', `${key}.unit`);
      if (field.status !== 'reviewed' || !field.source || time(field.updatedAt, `${key}.updatedAt`) > now) fail('UNREVIEWED_PREMISE', key);
      return {key, value:number(field.value, `${key}.value`), unit:str(field.unit, `${key}.unit`, 40), source:textReview(field.source, reviewedSources[key], `${key}.source`), version:number(field.version, `${key}.version`, {positive:true,integer:true}), updatedAt:field.updatedAt, classification:'estimate'};
    });
    if (roi.status === 'validate') return {classification:'validate',status:'VALIDAR',formulaVersion:roi.formulaVersion,assumptions:[],results:null};
    if (array(roi.missing, 'snapshot.roi.missing', 12).length) fail('UNSUPPORTED_ROI', 'snapshot.roi.missing');
    const result = {};
    for (const key of ['tireMonthly','fuelMonthly','monthlySavings','annualSavings','paybackMonths','roi12mPct','lifeWithMonths']) {
      result[key] = roi[key] == null ? null : key === 'roi12mPct'
        ? (typeof roi[key] === 'number' && Number.isFinite(roi[key]) ? roi[key] : fail('INVALID_NUMBER', `snapshot.roi.${key}`))
        : number(roi[key], `snapshot.roi.${key}`, {positive:key === 'lifeWithMonths'});
    }
    if (result.monthlySavings == null || result.annualSavings == null || result.roi12mPct == null || roi.assumptions.tires && (result.lifeWithMonths == null || result.tireMonthly == null) || roi.assumptions.fuel && result.fuelMonthly == null || result.monthlySavings > 0 && result.paybackMonths == null) fail('UNSUPPORTED_ROI', 'snapshot.roi.results');
    return {classification:'estimate',status:'ready',formulaVersion:roi.formulaVersion,assumptions:premises,results:result,limitations:['Economia anual equivalente; não representa fluxo de caixa realizado.','Premissas revisadas não comprovam o ganho efetivo.']};
  }
  function checkSnapshotShape(snapshot) {
    if (snapshot.presentation != null) {
      const view = exact(snapshot.presentation, ['schemaVersion','themeId','themeVersion','templateId','sections','text','branding'], 'snapshot.presentation');
      exact(view.sections, ['customer','vehicles','application','parts','conditions','roi','assumptions','disclaimer','observations'], 'snapshot.presentation.sections');
      exact(view.text, ['title','introduction','observation','deliveryNote','validityText','closing'], 'snapshot.presentation.text');
      if (view.branding != null) exact(view.branding, ['clientId','materialId','assetId','version','sha256'], 'snapshot.presentation.branding');
    }
    array(snapshot.extraItems, 'snapshot.extraItems', 200).forEach((item, index) => exact(item, ['code','name','category','qty','priceUnit','subtotal','isCustomPrice'], `snapshot.extraItems[${index}]`));
    for (const vehicle of snapshot.vehicles) {
      array(vehicle.items, 'snapshot.vehicles[].items', MAX_ITEMS).forEach(item => exact(item, ['code','qty','customPrice'], 'snapshot.vehicles[].items[]'));
      const context = exact(vehicle.technicalContext, ['id','leadId','handoffId','selectedVehicleId','applicationScope','libras','includeDianteira','qty','targetVehicleName','manualConfirmed','notes','answers','manualItems'], 'snapshot.vehicles[].technicalContext');
      if (context.answers != null) {
        object(context.answers, 'snapshot.vehicles[].technicalContext.answers');
        if (Object.keys(context.answers).length > 30) fail('SIZE_LIMIT', 'snapshot.vehicles[].technicalContext.answers');
        for (const [key, value] of Object.entries(context.answers)) { str(key, 'snapshot.vehicles[].technicalContext.answers.key', 80); str(value, 'snapshot.vehicles[].technicalContext.answers.value', 180); }
      }
      if (context.manualItems != null) array(context.manualItems, 'snapshot.vehicles[].technicalContext.manualItems', MAX_ITEMS).forEach(item => exact(item, ['code','qty','customPrice','applicationScope'], 'snapshot.vehicles[].technicalContext.manualItems[]'));
      array(vehicle.calculatedItems, 'snapshot.vehicles[].calculatedItems', MAX_ITEMS).forEach(item => exact(item, ['code','name','category','qty','priceUnit','subtotal','isCustomPrice'], 'snapshot.vehicles[].calculatedItems[]'));
      array(vehicle.applicationRows, 'snapshot.vehicles[].applicationRows', MAX_ITEMS).forEach(row => {
        exact(row, ['code','name','qty','scope','position','status','origin','path'], 'snapshot.vehicles[].applicationRows[]');
        array(row.path, 'snapshot.vehicles[].applicationRows[].path', 20).forEach(step => str(step, 'snapshot.vehicles[].applicationRows[].path[]'));
      });
    }
    if (snapshot.roi != null) {
      const roi = exact(snapshot.roi, ['formulaVersion','status','investment','totalTires','assumptions','missing','tireMonthly','fuelMonthly','monthlySavings','annualSavings','paybackMonths','roi12mPct','lifeWithMonths'], 'snapshot.roi');
      const assumptions = exact(roi.assumptions, ['schemaVersion','tires','fuel','fields'], 'snapshot.roi.assumptions');
      exact(assumptions.fields, ROI_FIELDS, 'snapshot.roi.assumptions.fields');
      for (const field of ROI_FIELDS) exact(assumptions.fields[field], ['value','unit','source','status','version','updatedAt'], `snapshot.roi.assumptions.fields.${field}`);
      array(roi.missing, 'snapshot.roi.missing', 12);
    }
  }

  function project(source, selection, policy) {
    boundedJson({source,selection,policy}, 'input', MAX_SOURCE_BYTES);
    exact(source, ['kind','clientRef','record','fixture'], 'source');
    if (!kinds.includes(source.kind)) fail('UNSUPPORTED_SOURCE', 'source.kind');
    exact(selection, ['subjectName','vehicleIds','showApplications','showCommercial','showEconomic'], 'selection');
    exact(policy, ['schemaVersion','now','expiresAt','publicSessionRef','expectedRevision','expectedFixture','reviewedText'], 'policy');
    if (policy.schemaVersion !== 1) fail('UNSUPPORTED_VERSION', 'policy.schemaVersion');
    const now = time(policy.now, 'policy.now');
    if (time(policy.expiresAt, 'policy.expiresAt') <= now) fail('EXPIRED', 'policy.expiresAt');
    const publicSessionRef = str(policy.publicSessionRef, 'policy.publicSessionRef', 80);
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(publicSessionRef)) fail('INVALID_REFERENCE', 'policy.publicSessionRef');
    if (typeof selection.showApplications !== 'boolean' || typeof selection.showCommercial !== 'boolean' || typeof selection.showEconomic !== 'boolean') fail('INVALID_SELECTION', 'selection');
    if (selection.showEconomic && !selection.showCommercial) fail('INVALID_SELECTION', 'selection.showEconomic');
    array(selection.vehicleIds, 'selection.vehicleIds', MAX_VEHICLES);
    if (new Set(selection.vehicleIds).size !== selection.vehicleIds.length) fail('DUPLICATE_REFERENCE', 'selection.vehicleIds');
    exact(policy.reviewedText, ['subjectName','vehicleNames','itemNames','applicationNames','paymentTerms','roiSources'], 'policy.reviewedText');
    exact(policy.reviewedText.vehicleNames, selection.vehicleIds, 'policy.reviewedText.vehicleNames');
    const reviewedItemNames = object(policy.reviewedText.itemNames, 'policy.reviewedText.itemNames');
    const reviewedApplicationNames = object(policy.reviewedText.applicationNames, 'policy.reviewedText.applicationNames');
    let dto;
    if (source.kind === 'proposal_revision') {
      if (source.fixture !== undefined) fail('MIXED_SOURCE', 'source.fixture');
      if (policy.expectedFixture !== null) fail('MIXED_SOURCE', 'policy.expectedFixture');
      exact(source.clientRef, ['leadId'], 'source.clientRef');
      const leadId = str(source.clientRef.leadId, 'source.clientRef.leadId', 100);
      const record = exact(source.record, ['id','clientId','quoteId','version','status','snapshot'], 'source.record');
      const expected = exact(policy.expectedRevision, ['proposalId','clientId','quoteId','version'], 'policy.expectedRevision');
      if (record.status !== 'internal_draft' || record.id !== expected.proposalId || record.clientId !== expected.clientId || record.quoteId !== expected.quoteId || record.version !== expected.version || leadId !== record.clientId) fail('IDENTITY_MISMATCH', 'source.record');
      number(record.version, 'source.record.version', {positive:true,integer:true});
      const snap = exact(record.snapshot, ['schemaVersion','representationVersion','quoteId','clientId','preparedAt','templateId','presentation','client','commercial','vehicles','extraItems','roi'], 'source.record.snapshot');
      if (snap.schemaVersion !== 1 || snap.representationVersion !== 2) fail('UNSUPPORTED_VERSION', 'source.record.snapshot');
      if (snap.quoteId !== record.quoteId || snap.clientId !== leadId || time(snap.preparedAt, 'snapshot.preparedAt') > now) fail('IDENTITY_MISMATCH', 'source.record.snapshot');
      if (snap.presentation?.branding?.clientId && snap.presentation.branding.clientId !== leadId) fail('IDENTITY_MISMATCH', 'snapshot.presentation.branding.clientId');
      const client = exact(snap.client, ['name','company','cnpj','city','internalCode'], 'snapshot.client');
      const commercial = exact(snap.commercial, ['totalValue','totalPieces','freightText','paymentTerms','totalTires','totalVehicles','subtotalProducts','cardFee','installments','installmentValue','deliveryText','seller','validUntil','notes'], 'snapshot.commercial');
      const vehicles = array(snap.vehicles, 'snapshot.vehicles', MAX_VEHICLES);
      checkSnapshotShape(snap);
      const byId = new Map();
      for (const vehicle of vehicles) {
        exact(vehicle, ['id','name','vehicleTypeId','libras','includeDianteira','qty','items','clientId','technicalContext','calculatedItems','unitSubtotal','totalSubtotal','totalTires','applicationRows'], 'snapshot.vehicles[]');
        const id = str(vehicle.id, 'snapshot.vehicles[].id', 100);
        if (byId.has(id) || vehicle.clientId !== leadId || vehicle.technicalContext?.leadId && vehicle.technicalContext.leadId !== leadId || vehicle.technicalContext?.selectedVehicleId && vehicle.technicalContext.selectedVehicleId !== id) fail('IDENTITY_MISMATCH', `snapshot.vehicles.${id}`);
        byId.set(id, vehicle);
      }
      const subjectName = textReview(selection.subjectName ? str(client.company || client.name, 'snapshot.client.company') : '', policy.reviewedText.subjectName, 'policy.reviewedText.subjectName');
      const itemNameKeys = [], applicationNameKeys = [];
      const fleetGroups = selection.vehicleIds.map((id, index) => {
        const vehicle = byId.get(id);
        if (!vehicle) fail('IDENTITY_MISMATCH', `selection.vehicleIds[${index}]`);
        const label = textReview(vehicle.name, policy.reviewedText.vehicleNames[id], `snapshot.vehicles.${id}.name`);
        const calculatedItems = array(vehicle.calculatedItems, `snapshot.vehicles.${id}.calculatedItems`, MAX_ITEMS).map((item, i) => {
          exact(item, ['code','name','category','qty','priceUnit','subtotal','isCustomPrice'], `snapshot.vehicles.${id}.calculatedItems[${i}]`);
          itemNameKeys.push(`${id}:${i}`);
          const visible = {code:str(item.code, 'item.code', 80),name:textReview(item.name, reviewedItemNames[`${id}:${i}`], 'item.name'),quantity:number(item.qty, 'item.qty', {integer:true})};
          return selection.showCommercial ? {...visible,unitPrice:number(item.priceUnit, 'item.priceUnit'),subtotal:number(item.subtotal, 'item.subtotal')} : visible;
        });
        const applications = selection.showApplications ? array(vehicle.applicationRows, `snapshot.vehicles.${id}.applicationRows`, MAX_ITEMS).map((row, i) => {
          exact(row, ['code','name','qty','scope','position','status','origin','path'], `snapshot.vehicles.${id}.applicationRows[${i}]`);
          applicationNameKeys.push(`${id}:${i}`);
          if (!['cavalo','carreta','outro','validar'].includes(row.scope) || !['dianteiro','tracao','truck','carreta','validar'].includes(row.position) || !['runtime','validate'].includes(row.status) || !['calculada','manual'].includes(row.origin)) fail('UNSUPPORTED_APPLICATION', `snapshot.vehicles.${id}.applicationRows[${i}]`);
          return {code:str(row.code, 'row.code', 80),name:textReview(row.name, reviewedApplicationNames[`${id}:${i}`], 'row.name'),quantity:number(row.qty, 'row.qty', {integer:true}),scope:row.scope,position:row.position,status:row.status,origin:row.origin};
        }) : [];
        return {ref:`vehicle-${index + 1}`,label,quantity:number(vehicle.qty, 'vehicle.qty', {positive:true,integer:true}),unit:'veículo',status:'declared',totalTires:number(vehicle.totalTires, 'vehicle.totalTires', {integer:true}),subtotal:selection.showCommercial ? number(vehicle.totalSubtotal, 'vehicle.totalSubtotal') : null,items:calculatedItems,technicalApplications:applications};
      });
      exact(reviewedItemNames, itemNameKeys, 'policy.reviewedText.itemNames');
      exact(reviewedApplicationNames, applicationNameKeys, 'policy.reviewedText.applicationNames');
      const investment = number(commercial.totalValue, 'snapshot.commercial.totalValue', {positive:true});
      number(commercial.totalPieces, 'snapshot.commercial.totalPieces', {integer:true});
      number(commercial.totalTires, 'snapshot.commercial.totalTires', {integer:true});
      if (selection.showCommercial) {
        if (!commercial.validUntil || commercialExpiry(commercial.validUntil) <= now || commercialExpiry(commercial.validUntil) < time(policy.expiresAt, 'policy.expiresAt')) fail('EXPIRED_OR_MISSING_TERMS', 'snapshot.commercial.validUntil');
        str(commercial.paymentTerms, 'snapshot.commercial.paymentTerms');
        textReview(commercial.paymentTerms, policy.reviewedText.paymentTerms, 'snapshot.commercial.paymentTerms');
      }
      const roi = selection.showEconomic ? checkedRoi(snap.roi, now, policy.reviewedText.roiSources) : null;
      if (roi && (snap.roi.investment !== investment || snap.roi.totalTires !== commercial.totalTires)) fail('IDENTITY_MISMATCH', 'snapshot.roi.facts');
      dto = {schemaVersion:1,publicSessionRef,classification:'commercial_projection',approvalStatus:'not_approved',source:{kind:source.kind,version:record.version,date:snap.preparedAt},expiresAt:policy.expiresAt,subject:{name:subjectName},fleetGroups,approvedCommercial:selection.showCommercial ? {currency:'BRL',investment,totalPieces:commercial.totalPieces,totalTires:commercial.totalTires,paymentTerms:commercial.paymentTerms,validUntil:commercial.validUntil} : null,economicScenario:roi,validation:{status:roi?.status === 'VALIDAR' ? 'VALIDAR' : 'ready_for_review'}};
    } else {
      if (source.record !== undefined || source.clientRef !== null || policy.expectedRevision !== null || selection.showCommercial || selection.showEconomic || selection.showApplications) fail('MIXED_SOURCE', 'source');
      exact(reviewedItemNames, [], 'policy.reviewedText.itemNames');
      exact(reviewedApplicationNames, [], 'policy.reviewedText.applicationNames');
      exact(policy.reviewedText.roiSources, [], 'policy.reviewedText.roiSources');
      if (policy.reviewedText.paymentTerms !== undefined) fail('MIXED_SOURCE', 'policy.reviewedText.paymentTerms');
      const fixture = exact(source.fixture, ['fixtureId','fixtureVersion','fixtureFingerprint','subject','fleetGroups'], 'source.fixture');
      str(fixture.fixtureId, 'source.fixture.fixtureId', 80);
      str(fixture.fixtureFingerprint, 'source.fixture.fixtureFingerprint', 100);
      if (!/^[a-f0-9]{64}$/.test(fixture.fixtureFingerprint)) fail('INVALID_REFERENCE', 'source.fixture.fixtureFingerprint');
      number(fixture.fixtureVersion, 'source.fixture.fixtureVersion', {positive:true,integer:true});
      const expected = exact(policy.expectedFixture, ['fixtureId','fixtureVersion','fixtureFingerprint'], 'policy.expectedFixture');
      if (expected.fixtureId !== fixture.fixtureId || expected.fixtureVersion !== fixture.fixtureVersion || expected.fixtureFingerprint !== fixture.fixtureFingerprint) fail('IDENTITY_MISMATCH', 'source.fixture');
      exact(fixture.subject, ['name'], 'source.fixture.subject');
      const subjectName = textReview(fixture.subject.name, policy.reviewedText.subjectName, 'source.fixture.subject.name');
      const groups = array(fixture.fleetGroups, 'source.fixture.fleetGroups', MAX_VEHICLES);
      if (selection.vehicleIds.length !== groups.length) fail('INVALID_SELECTION', 'selection.vehicleIds');
      const fleetGroups = groups.map((group, index) => {
        exact(group, ['label','quantity','unit','status'], `source.fixture.fleetGroups[${index}]`);
        if (selection.vehicleIds[index] !== `demo-${index + 1}` || group.status !== 'demonstrative') fail('INVALID_SELECTION', `source.fixture.fleetGroups[${index}]`);
        return {ref:`demo-${index + 1}`,label:textReview(group.label, policy.reviewedText.vehicleNames[`demo-${index + 1}`], `source.fixture.fleetGroups[${index}].label`),quantity:number(group.quantity, 'group.quantity', {positive:true,integer:true}),unit:str(group.unit, 'group.unit', 40),status:'demonstrative',totalTires:null,subtotal:null,items:[],technicalApplications:[]};
      });
      dto = {schemaVersion:1,publicSessionRef,classification:'demonstrative',approvalStatus:'not_approved',source:{kind:source.kind,version:fixture.fixtureVersion,date:policy.now},expiresAt:policy.expiresAt,subject:{name:subjectName},fleetGroups,approvedCommercial:null,economicScenario:null,validation:{status:'VALIDAR'}};
    }
    boundedJson(dto, 'dto', MAX_DTO_BYTES);
    return freeze(dto);
  }

  return Object.freeze({project,ProjectionError,LIMITS:Object.freeze({MAX_SOURCE_BYTES,MAX_DTO_BYTES,MAX_VEHICLES,MAX_ITEMS,MAX_TEXT})});
}));
