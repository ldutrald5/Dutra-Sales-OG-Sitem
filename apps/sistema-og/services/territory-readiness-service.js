(function attachTerritoryReadiness(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_TERRITORY_READINESS = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createTerritoryReadiness() {
  'use strict';

  const BR_STATES = new Set(['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']);

  function clean(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function fold(value) {
    return clean(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function titleCase(value) {
    return clean(value).toLowerCase().replace(/(^|[\s'’-])([a-zà-ÿ])/g, (_, prefix, letter) => prefix + letter.toUpperCase());
  }

  function splitCityState(value) {
    const raw = clean(value);
    if (!raw) return { city:'', state:'' };

    const stateMatch = raw.toUpperCase().match(/(?:^|[\s,\/\-–—])([A-Z]{2})$/);
    if (stateMatch && BR_STATES.has(stateMatch[1])) {
      const state = stateMatch[1];
      const city = clean(raw.slice(0, stateMatch.index).replace(/[\s,\/\-–—]+$/g, ''));
      return { city:titleCase(city), state };
    }

    const parts = raw.split(/\s*(?:-|–|—|\/|,)\s*/).filter(Boolean);
    if (parts.length >= 2) {
      const candidate = clean(parts.at(-1)).toUpperCase();
      if (BR_STATES.has(candidate)) return { city:titleCase(parts.slice(0,-1).join(' - ')), state:candidate };
    }
    return { city:titleCase(raw), state:'' };
  }

  function locationForLead(lead = {}) {
    const explicitCity = clean(lead.city || lead.cidade);
    const explicitState = clean(lead.state || lead.uf).toUpperCase();
    const combined = splitCityState(lead.cidadeUf || lead.cityState || '');
    const city = titleCase(explicitCity || combined.city);
    const state = BR_STATES.has(explicitState) ? explicitState : combined.state;
    const rawState = explicitState || combined.state;
    const address = clean(lead.address || lead.endereco || lead.logradouro);
    const postalCode = clean(lead.postalCode || lead.cep);
    const validState = !rawState || BR_STATES.has(rawState);
    const placeKey = city && state ? `${fold(city)}|${state}` : '';

    let readiness = 'missing_location';
    if (city && state && address) readiness = 'address_ready';
    else if (city && state) readiness = 'city_ready';
    else if (rawState && !validState) readiness = 'invalid_state';
    else if (city && !state) readiness = 'missing_state';
    else if (!city && state) readiness = 'missing_city';

    return Object.freeze({
      city,
      state: validState ? state : '',
      rawState,
      address,
      postalCode,
      placeKey,
      label: city && state ? `${city} - ${state}` : city || state || '',
      readiness,
      geocoded: Number.isFinite(Number(lead.latitude)) && Number.isFinite(Number(lead.longitude))
        && Number(lead.latitude) >= -90 && Number(lead.latitude) <= 90
        && Number(lead.longitude) >= -180 && Number(lead.longitude) <= 180
    });
  }

  function summarize(leads = []) {
    const list = Array.isArray(leads) ? leads : [];
    const clusters = new Map();
    const counts = {
      total:list.length,
      addressReady:0,
      cityReady:0,
      geocoded:0,
      missingLocation:0,
      missingState:0,
      missingCity:0,
      invalidState:0
    };

    for (const lead of list) {
      const location = locationForLead(lead);
      if (location.readiness === 'address_ready') counts.addressReady += 1;
      if (['address_ready','city_ready'].includes(location.readiness)) counts.cityReady += 1;
      if (location.geocoded) counts.geocoded += 1;
      if (location.readiness === 'missing_location') counts.missingLocation += 1;
      if (location.readiness === 'missing_state') counts.missingState += 1;
      if (location.readiness === 'missing_city') counts.missingCity += 1;
      if (location.readiness === 'invalid_state') counts.invalidState += 1;

      if (location.placeKey) {
        const current = clusters.get(location.placeKey) || {
          key:location.placeKey,
          city:location.city,
          state:location.state,
          label:location.label,
          total:0,
          prospects:0,
          customers:0,
          fleet:0
        };
        current.total += 1;
        const status = fold(lead.status);
        const conversation = fold(lead.conversationStage);
        if (status === 'fechado' || ['customer','loyal_customer','cliente','cliente_fidelizado'].includes(conversation)) current.customers += 1;
        else current.prospects += 1;
        const fleet = Number(String(lead.fleetSize ?? '').replace(/[^0-9.,-]/g,'').replace(',','.'));
        if (Number.isFinite(fleet) && fleet > 0) current.fleet += fleet;
        clusters.set(location.placeKey, current);
      }
    }

    const topClusters = [...clusters.values()]
      .sort((a,b)=>b.total-a.total || b.fleet-a.fleet || a.label.localeCompare(b.label,'pt-BR'))
      .slice(0,12)
      .map(item=>Object.freeze({...item}));

    return Object.freeze({
      ...counts,
      coveragePercent:counts.total ? Math.round((counts.cityReady / counts.total) * 100) : 0,
      addressCoveragePercent:counts.total ? Math.round((counts.addressReady / counts.total) * 100) : 0,
      topClusters:Object.freeze(topClusters)
    });
  }

  function filterByPlace(leads = [], placeKey = 'all') {
    if (!placeKey || placeKey === 'all') return Array.isArray(leads) ? leads.slice() : [];
    return (Array.isArray(leads) ? leads : []).filter(lead => locationForLead(lead).placeKey === placeKey);
  }

  return {
    BR_STATES,
    locationForLead,
    summarize,
    filterByPlace
  };
}));
