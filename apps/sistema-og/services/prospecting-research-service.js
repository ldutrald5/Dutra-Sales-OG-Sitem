(function attachProspectingResearch(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PROSPECTING_RESEARCH = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createProspectingResearch() {
  'use strict';

  const clean=v=>String(v??'').trim();
  const clone=v=>JSON.parse(JSON.stringify(v??null));

  function createProvider(definition = {}) {
    const id=clean(definition.id);
    if (!id) throw new Error('Provider exige id');
    if (typeof definition.search !== 'function') throw new Error('Provider exige search');
    return Object.freeze({
      id,
      search:definition.search,
      health:typeof definition.health === 'function' ? definition.health : async()=>({status:'unknown'})
    });
  }

  function createResearchJob(mission = {}, options = {}) {
    if (mission.capability !== 'prospect.research') throw new Error('Missão incompatível');
    if (!mission.payload?.criteria) throw new Error('Missão sem critérios');
    const now=new Date(options.now || Date.now()).toISOString();
    return Object.freeze({
      id:clean(options.id) || 'research-'+Date.parse(now)+'-'+clean(mission.payload.criteria.city).toLowerCase().replace(/[^a-z0-9]+/g,'-'),
      status:'queued',
      capability:mission.capability,
      requestedBy:clean(mission.requestedBy)||'user',
      criteria:clone(mission.payload.criteria),
      policy:Object.freeze({
        evidencePolicy:mission.payload.evidencePolicy,
        deduplication:mission.payload.deduplication,
        mutationPolicy:mission.payload.mutationPolicy
      }),
      createdAt:now
    });
  }

  async function runResearchJob(job, options = {}) {
    const provider=options.provider;
    const intake=options.intake;
    if (!provider?.search) throw new Error('Provider de pesquisa é obrigatório');
    if (!intake?.normalizeCandidate || !intake?.dedupeAgainstCrm) throw new Error('Prospecting Intake é obrigatório');
    if (job?.status !== 'queued') throw new Error('Job precisa estar queued');

    const startedAt=new Date(options.now || Date.now()).toISOString();
    const raw=await provider.search(clone(job.criteria), Object.freeze({
      requestedCount:job.criteria.requestedCount,
      evidencePolicy:job.policy.evidencePolicy
    }));
    const list=Array.isArray(raw) ? raw : [];
    const normalized=list.slice(0,job.criteria.requestedCount).map(item=>intake.normalizeCandidate(item,job.criteria));
    const reviewed=intake.dedupeAgainstCrm(normalized,options.leads || []);
    const ready=reviewed.filter(item=>item.importAllowed);
    const insufficient=reviewed.filter(item=>item.reviewStatus==='insufficient_evidence');
    const duplicates=reviewed.filter(item=>item.duplicate);
    return Object.freeze({
      ...clone(job),
      status:'completed',
      providerId:clean(provider.id),
      startedAt,
      finishedAt:new Date(options.finishedAt || options.now || Date.now()).toISOString(),
      candidates:Object.freeze(reviewed),
      summary:Object.freeze({
        found:reviewed.length,
        readyForReview:ready.length,
        duplicates:duplicates.length,
        insufficientEvidence:insufficient.length
      })
    });
  }

  function createResearchQueue(initial = []) {
    const jobs=(Array.isArray(initial)?initial:[]).map(clone);
    return Object.freeze({
      enqueue(job) {
        if (!job?.id) throw new Error('Job exige id');
        if (jobs.some(item=>item.id===job.id)) return clone(jobs.find(item=>item.id===job.id));
        jobs.push(clone(job));
        return clone(job);
      },
      replace(job) {
        const index=jobs.findIndex(item=>item.id===job?.id);
        if (index<0) throw new Error('Job não encontrado');
        jobs.splice(index,1,clone(job));
        return clone(job);
      },
      next() { return clone(jobs.find(item=>item.status==='queued') || null); },
      list(status) { return jobs.filter(item=>!status || item.status===status).map(clone); }
    });
  }

  return Object.freeze({ createProvider, createResearchJob, runResearchJob, createResearchQueue });
}));
