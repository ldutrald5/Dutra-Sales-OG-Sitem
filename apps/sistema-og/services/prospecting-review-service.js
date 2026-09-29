(function attachProspectingReview(root, factory) {
  const api=factory();
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  root.OG_PROSPECTING_REVIEW=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createProspectingReview(){
  'use strict';
  const clean=v=>String(v??'').trim();
  const fold=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function reviewInbox(researchResults=[],leads=[]){
    const jobs=Array.isArray(researchResults)?researchResults:[];
    const existing=new Set((Array.isArray(leads)?leads:[]).map(lead=>fold(lead.company||lead.companyName||lead.empresa||lead.name||lead.nome)).filter(Boolean));
    return jobs.flatMap(job=>(Array.isArray(job?.candidates)?job.candidates:[])
      .filter(c=>c.reviewStatus==='ready_for_review' || c.importAllowed===true || c.duplicate===true)
      .map(c=>{
        const duplicate=c.duplicate===true || existing.has(fold(c.companyName));
        return Object.freeze({
          researchJobId:clean(job.id),providerId:clean(job.providerId),
          companyName:clean(c.companyName),city:clean(c.city),state:clean(c.state),
          segment:clean(c.segment),fleetSize:c.fleetSize,decisionMaker:clean(c.decisionMaker),
          contact:clean(c.contact),sourceSnippet:clean(c.sourceSnippet),sources:c.sources||[],fitReasons:c.fitReasons||[],
          duplicate,importAllowed:c.importAllowed===true && !duplicate,
          status:duplicate?'duplicate':'awaiting_review'
        });
      }));
  }

  function prepareCrmImport(item={},options={}){
    if(item.importAllowed!==true) throw new Error('Candidato não está liberado para importação');
    if(!item.sources?.length) throw new Error('Importação exige evidência pública');
    const sourceUrls=item.sources.map(s=>clean(s.url)).filter(Boolean);
    return Object.freeze({
      empresa:clean(item.companyName),
      nome:clean(item.decisionMaker),
      telefone:clean(item.contact),
      cidadeUf:[clean(item.city),clean(item.state)].filter(Boolean).join(' - '),
      segmentId:clean(options.segmentId||item.segment)||'transportadora',
      fleetSize:Number.isFinite(Number(item.fleetSize))?Number(item.fleetSize):0,
      sourceLabel:'DUTRA Research',
      sourceList:clean(item.researchJobId),
      sourceChannel:'dutra_research',
      operationalStatus:'NEW_PROSPECT',
      accountSummary:clean(options.accountSummary)||('Prospect pesquisado com '+sourceUrls.length+' fonte(s) pública(s).'),
      importMeta:Object.freeze({
        origin:'dutra_research',
        researchJobId:clean(item.researchJobId),
        providerId:clean(item.providerId),
        sourceUrls:Object.freeze(sourceUrls),
        fitReasons:Object.freeze((item.fitReasons||[]).map(clean).filter(Boolean)),
        reviewedBy:clean(options.reviewedBy)||'user',
        reviewedAt:clean(options.reviewedAt)||new Date().toISOString()
      })
    });
  }

  function importCandidate(item={},leads=[],options={}){
    const crm=options.crm;
    if(!crm?.createProspect||!crm?.findPossibleDuplicates) throw new Error('CRM Service é obrigatório');
    const prepared=prepareCrmImport(item,options);
    const duplicates=crm.findPossibleDuplicates(leads,{empresa:prepared.empresa,telefone:prepared.telefone});
    if(duplicates.length) return Object.freeze({status:'duplicate_blocked',duplicates:Object.freeze(duplicates.map(x=>x.id)),lead:null});
    const lead=crm.createProspect(prepared,{id:options.id,now:options.now});
    // createProspect is conservative; preserve reviewed research metadata additively.
    Object.assign(lead,{
      fleetSize:prepared.fleetSize,
      accountSummary:prepared.accountSummary,
      importMeta:prepared.importMeta
    });
    return Object.freeze({status:'imported',duplicates:Object.freeze([]),lead:Object.freeze(lead)});
  }

  return Object.freeze({reviewInbox,prepareCrmImport,importCandidate});
}));
