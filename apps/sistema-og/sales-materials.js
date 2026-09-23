(function attachSalesMaterials(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_SALES_MATERIALS = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesMaterials() {
  'use strict';

  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function terms(value) {
    if (Array.isArray(value)) return value.flatMap(terms);
    return normalize(value).split(' ').filter(item => item.length > 2);
  }

  function overlap(recordValues, contextValues) {
    const record = new Set(terms(recordValues));
    return [...new Set(terms(contextValues))].filter(item => record.has(item));
  }

  function recommendMaterials(materials = [], client = {}) {
    const context = {
      segment: [client.segmentId, client.segment, client.observacoes],
      stage: [client.status],
      pain: [client.pain, client.observacoes, ...(client.interactions || []).slice(-3).map(item => item.note)],
      decisionMaker: [client.decisionMaker, client.nome],
      vehicle: [client.vehicleTypes, client.fleetProfile, client.observacoes]
    };
    return materials.filter(material => material.status === 'approved' && material.audience === 'customer_authorized').map(material => {
      const reasons = [];
      const segment = overlap(material.segmentIds, context.segment); if (segment.length) reasons.push(`segmento: ${segment.join(', ')}`);
      const stage = overlap(material.salesStages, context.stage); if (stage.length) reasons.push(`etapa: ${stage.join(', ')}`);
      const pain = overlap(material.painTags, context.pain); if (pain.length) reasons.push(`dor: ${pain.join(', ')}`);
      const decision = overlap(material.decisionMakerRoles, context.decisionMaker); if (decision.length) reasons.push(`decisor: ${decision.join(', ')}`);
      const vehicle = overlap(material.vehicleTypeIds, context.vehicle); if (vehicle.length) reasons.push(`veículo: ${vehicle.join(', ')}`);
      const score = reasons.length * 10 + Number(Boolean(material.favorite));
      return { material, score, reasons };
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || String(b.material.updatedAt).localeCompare(String(a.material.updatedAt)));
  }

  function composePackageText(packageRecord, materials, client) {
    const selected = packageRecord.materialIds.map(id => materials.find(item => String(item.id) === String(id))).filter(Boolean);
    const greeting = `Olá ${client?.nome || 'tudo bem'}, separei estes materiais para ${client?.empresa || 'sua operação'}:`;
    const lines = selected.map((item, index) => {
      const reference = item.externalUrl || item.textContent || '[arquivo disponível no Sistema OG]';
      return `${index + 1}. ${item.title}\n${reference}`;
    });
    return [packageRecord.messageDraft || greeting, ...lines, 'Se fizer sentido, conversamos sobre o próximo passo.'].join('\n\n');
  }

  return { normalize, recommendMaterials, composePackageText };
}));
