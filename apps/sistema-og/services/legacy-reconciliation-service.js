(function attachLegacyReconciliation(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OG_LEGACY_RECONCILIATION=api;}(typeof globalThis!=='undefined'?globalThis:this,function createLegacyReconciliation(){
  'use strict';
  const clean=v=>String(v??'').trim();
  const digits=v=>clean(v).replace(/\D/g,'');
  const comparable=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const list=v=>Array.isArray(v)?v:[];

  function canonicalCompanies(graph){return list(graph?.companies).filter(x=>x?.entityType==='company'&&clean(x.id));}
  function canonicalContacts(graph){return list(graph?.contacts).filter(x=>x?.entityType==='contact'&&clean(x.id));}
  function companySignals(lead,company){
    const matches=[];
    if(digits(lead?.cnpj)&&digits(lead.cnpj)===digits(company?.cnpj))matches.push('cnpj');
    if(comparable(lead?.empresa||lead?.nome)&&comparable(lead?.empresa||lead?.nome)===comparable(company?.name))matches.push('name');
    return matches;
  }
  function contactProposal(lead){
    const name=clean(lead?.decisionMaker||lead?.nome);
    const phone=digits(lead?.telefone);
    if(!name&&!phone)return null;
    return {name:name||'Contato principal',phone:phone||null,role:lead?.decisionMaker?'decision_maker':'contact',isDecisionMaker:Boolean(clean(lead?.decisionMaker)),source:'legacy_lead'};
  }
  function inspectLead(lead,graph={}){
    const id=clean(lead?.id);
    if(!id)return {leadId:null,status:'invalid',reason:'lead_without_id',candidates:[],proposal:null};
    const companies=canonicalCompanies(graph);
    const linked=companies.filter(c=>clean(c.legacyLeadId)===id);
    if(linked.length===1)return {leadId:id,status:'linked',reason:'explicit_legacy_bridge',companyId:linked[0].id,candidates:[{companyId:linked[0].id,signals:['legacyLeadId']}],proposal:null};
    if(linked.length>1)return {leadId:id,status:'blocked',reason:'duplicate_legacy_bridge',candidates:linked.map(c=>({companyId:c.id,signals:['legacyLeadId']})),proposal:null};
    const candidates=companies.map(c=>({companyId:c.id,signals:companySignals(lead,c)})).filter(x=>x.signals.length);
    const strong=candidates.filter(x=>x.signals.includes('cnpj'));
    if(strong.length===1)return {leadId:id,status:'review',reason:'cnpj_match_requires_confirmation',candidates,proposal:null};
    if(strong.length>1||candidates.length>1)return {leadId:id,status:'ambiguous',reason:'multiple_company_candidates',candidates,proposal:null};
    const companyName=clean(lead?.empresa||lead?.nome);
    if(!companyName)return {leadId:id,status:'blocked',reason:'company_name_missing',candidates:[],proposal:null};
    return {leadId:id,status:'proposed',reason:'new_company_candidate',candidates:[],proposal:{company:{name:companyName,cnpj:digits(lead?.cnpj)||null,legacyLeadId:id,segment:clean(lead?.segmentId)||null,status:'prospect',source:'legacy_lead'},contact:contactProposal(lead)}};
  }
  function buildPlan(leads=[],graph={}){
    const rows=list(leads).map(lead=>inspectLead(lead,graph));
    const counts=rows.reduce((a,row)=>(a[row.status]=(a[row.status]||0)+1,a),{});
    return Object.freeze({mode:'dry_run',createdAt:new Date().toISOString(),total:rows.length,counts:Object.freeze(counts),rows:Object.freeze(rows)});
  }
  function validatePlan(plan){
    const errors=[];
    if(plan?.mode!=='dry_run')errors.push('Plano deve ser dry_run.');
    const ids=new Set();
    for(const row of list(plan?.rows)){if(!row.leadId)continue;if(ids.has(row.leadId))errors.push(`leadId duplicado no plano: ${row.leadId}`);ids.add(row.leadId);}
    return {valid:errors.length===0,errors};
  }
  return{inspectLead,buildPlan,validatePlan};
}));