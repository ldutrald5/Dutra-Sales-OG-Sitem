(function attachProspectingIntake(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PROSPECTING_INTAKE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createProspectingIntake() {
  'use strict';

  const clean = value => String(value ?? '').replace(/\s+/g,' ').trim();
  const fold = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function normalizeCriteria(input = {}, territory) {
    const parsed = territory?.locationForLead
      ? territory.locationForLead({ cidadeUf: input.location || input.cidadeUf, city: input.city, state: input.state })
      : { city:clean(input.city), state:clean(input.state).toUpperCase(), readiness:'unknown', label:clean(input.location) };
    const minFleet = Number(input.minFleet);
    return Object.freeze({
      city:parsed.city || '',
      state:parsed.state || '',
      locationLabel:parsed.label || '',
      locationReadiness:parsed.readiness || 'unknown',
      segment:clean(input.segment),
      minFleet:Number.isFinite(minFleet) && minFleet > 0 ? Math.round(minFleet) : null,
      keywords:Object.freeze((Array.isArray(input.keywords) ? input.keywords : clean(input.keywords).split(',')).map(clean).filter(Boolean).slice(0,12)),
      requestedCount:Math.max(1,Math.min(Number(input.requestedCount)||20,100))
    });
  }

  function buildResearchMission(input = {}, options = {}) {
    const criteria = normalizeCriteria(input, options.territoryReadiness);
    if (!criteria.city || !criteria.state) throw new Error('Prospecção exige cidade e UF verificáveis');
    if (!criteria.segment) throw new Error('Prospecção exige segmento');
    return Object.freeze({
      capability:'prospect.research',
      requestedBy:clean(input.requestedBy) || 'user',
      payload:Object.freeze({
        criteria,
        evidencePolicy:'public_sources_required',
        deduplication:'crm_before_create',
        mutationPolicy:'prepare_only',
        desiredOutput:Object.freeze([
          'company_name','city','state','segment','public_source','source_date',
          'fleet_evidence','decision_maker_evidence','contact_evidence','og_fit_reasons'
        ])
      })
    });
  }

  function normalizeCandidate(candidate = {}, criteria = {}) {
    const sources = (Array.isArray(candidate.sources) ? candidate.sources : [])
      .filter(source => source && clean(source.url))
      .map(source => Object.freeze({
        url:clean(source.url),
        title:clean(source.title),
        observedAt:clean(source.observedAt),
        supports:Object.freeze((Array.isArray(source.supports) ? source.supports : []).map(clean).filter(Boolean))
      }));
    const fleet = Number(candidate.fleetSize);
    const evidenceCount = sources.length;
    const fitReasons = [];
    if (criteria.segment && fold(candidate.segment).includes(fold(criteria.segment))) fitReasons.push('segment_match');
    if (criteria.city && fold(candidate.city) === fold(criteria.city)) fitReasons.push('city_match');
    if (criteria.state && clean(candidate.state).toUpperCase() === criteria.state) fitReasons.push('state_match');
    if (Number.isFinite(fleet) && criteria.minFleet && fleet >= criteria.minFleet) fitReasons.push('fleet_threshold');
    return Object.freeze({
      companyName:clean(candidate.companyName || candidate.name),
      city:clean(candidate.city),
      state:clean(candidate.state).toUpperCase(),
      segment:clean(candidate.segment),
      fleetSize:Number.isFinite(fleet) && fleet >= 0 ? fleet : null,
      decisionMaker:clean(candidate.decisionMaker),
      contact:clean(candidate.contact),
      sourceSnippet:clean(candidate.sourceSnippet || candidate.snippet || candidate.description).slice(0,500),
      sources:Object.freeze(sources),
      evidenceCount,
      fitReasons:Object.freeze(fitReasons),
      reviewStatus:evidenceCount ? 'ready_for_review' : 'insufficient_evidence'
    });
  }

  function dedupeAgainstCrm(candidates = [], leads = []) {
    const existing = new Set((Array.isArray(leads) ? leads : []).map(lead => fold(lead.company || lead.companyName || lead.name || lead.nome)).filter(Boolean));
    return (Array.isArray(candidates) ? candidates : []).map(candidate => Object.freeze({
      ...candidate,
      duplicate:existing.has(fold(candidate.companyName)),
      importAllowed:!existing.has(fold(candidate.companyName)) && candidate.reviewStatus === 'ready_for_review'
    }));
  }

  return Object.freeze({ normalizeCriteria, buildResearchMission, normalizeCandidate, dedupeAgainstCrm });
}));
