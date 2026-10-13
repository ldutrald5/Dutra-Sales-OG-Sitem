/* Cleans the current quote context; CRM, application and prices keep their owners. */
(function attach(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_QUOTE_CLIENT_CONTEXT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createQuoteClientContext() {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));

  function clientForLead(lead, defaults) {
    const client = copy(defaults);
    for (const field of ['nome','empresa','cnpj','ie','socioAdmin','telefone','cidadeUf','internalCode']) client[field] = lead[field] || '';
    client.segmentId = lead.segmentId || defaults.segmentId;
    client.clientId = String(lead.id);
    return client;
  }

  function independentTechnicalItems(items = []) {
    return items.map(item => ({ code:item.code, qty:item.qty, customPrice:null,
      ...(['cavalo','carreta','outro','validar'].includes(item.applicationScope) ? {applicationScope:item.applicationScope} : {}) }));
  }

  function independentTechnicalVehicles(vehicles, clientId, data, idFactory) {
    return vehicles.map(vehicle => {
      const rule = data.vehicleConsultantRules.find(item => item.id === vehicle.vehicleTypeId);
      const previous = vehicle.technicalContext || {};
      const answers = Object.fromEntries((rule?.questions || []).filter(question => question.options.some(option => option.value === previous.answers?.[question.id])).map(question => [question.id,previous.answers[question.id]]));
      const id = idFactory('veh');
      const items = independentTechnicalItems(vehicle.items);
      return { id, name:rule?.name || 'Configuração técnica para revisão', vehicleTypeId:vehicle.vehicleTypeId,
        libras:vehicle.libras, includeDianteira:Boolean(vehicle.includeDianteira), qty:vehicle.qty, collapsed:false,
        items, clientId:String(clientId), clientReviewRequired:true,
        technicalContext:{ id:idFactory('TECH-DRAFT'), leadId:String(clientId), handoffId:id,
          selectedVehicleId:vehicle.vehicleTypeId, applicationScope:['all','cavalo','carreta'].includes(previous.applicationScope) ? previous.applicationScope : 'all', answers,
          libras:vehicle.libras, includeDianteira:Boolean(vehicle.includeDianteira), qty:vehicle.qty,
          targetVehicleName:rule?.name || '', notes:'', manualItems:items, manualConfirmed:false } };
    });
  }

  return { clientForLead, independentTechnicalItems, independentTechnicalVehicles };
}));
