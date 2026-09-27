(function attachLegacyReconciliation(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OG_LEGACY_RECONCILIATION=api;}(typeof globalThis!=='undefined'?globalThis:this,function createLegacyReconciliation(){
  'use strict';
  const clean=v=>String(v??'').trim();
  const digits=v=>clean(v).replace(/\D/g,'');
  const comparable=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
  const list=v=>Array.isArray(v)?v:[];
  const clone=v=>JSON.parse(JSON.stringify(v??null));

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
  function duplicateContact(graph,companyId,proposal){
    if(!proposal)return null;
    const phone=digits(proposal.phone),name=comparable(proposal.name);
    return canonicalContacts(graph).find(item=>clean(item.companyId)===clean(companyId)&&((phone&&digits(item.phone)===phone)||(name&&comparable(item.name)===name)))||null;
  }
  function applyApproved(leads=[],graph={},plan,approvals=[],options={}){
    const checked=validatePlan(plan);if(!checked.valid)throw new Error(checked.errors.join(' '));
    const domain=options.domain,idFactory=options.idFactory;
    if(!domain?.createCompany||!domain?.createContact||!domain?.validateGraph)throw new Error('Canonical Domain indisponível.');
    if(typeof idFactory!=='function')throw new Error('idFactory é obrigatório.');
    const now=new Date(options.now||Date.now()).toISOString();
    const next=clone(graph||{})||{};
    for(const key of ['companies','contacts','opportunities','activities','tasks','activityEvents'])next[key]=list(next[key]);
    const leadMap=new Map(list(leads).filter(x=>x?.id).map(x=>[clean(x.id),x]));
    const approvedIds=new Set(),results=[];
    for(const approval of list(approvals)){
      const leadId=clean(approval?.leadId);
      if(!leadId||approvedIds.has(leadId))throw new Error(`Aprovação inválida ou duplicada: ${leadId||'?'}`);
      approvedIds.add(leadId);
      if(approval.confirmed!==true)throw new Error(`Reconciliação de ${leadId} exige confirmação explícita.`);
      const lead=leadMap.get(leadId);if(!lead)throw new Error(`Lead não encontrado: ${leadId}`);
      const planned=list(plan.rows).find(row=>row.leadId===leadId);if(!planned)throw new Error(`Lead fora do plano: ${leadId}`);
      const current=inspectLead(lead,next);
      let company=null,action=clean(approval.action),contact=null,contactSkipped=null;
      if(action==='create_company'){
        if(current.status!=='proposed')throw new Error(`Lead ${leadId} não está mais elegível para criar Company (${current.status}). Gere nova prévia.`);
        company=domain.createCompany({id:idFactory('company',leadId),...current.proposal.company},{now});
        next.companies.push(company);
      }else if(action==='link_company'){
        if(!['review','ambiguous'].includes(current.status))throw new Error(`Lead ${leadId} não está mais elegível para vínculo (${current.status}). Gere nova prévia.`);
        const companyId=clean(approval.companyId);
        const chosen=current.candidates.find(item=>clean(item.companyId)===companyId);
        if(!chosen)throw new Error(`Company ${companyId||'?'} não é candidata atual para ${leadId}.`);
        if(current.status==='review'&&!chosen.signals.includes('cnpj'))throw new Error(`Company ${companyId} não corresponde ao CNPJ confirmado de ${leadId}.`);
        const index=next.companies.findIndex(item=>item?.entityType==='company'&&clean(item.id)===companyId);
        if(index<0)throw new Error(`Company não encontrada: ${companyId}`);
        const existing=next.companies[index];
        if(clean(existing.legacyLeadId)&&clean(existing.legacyLeadId)!==leadId)throw new Error(`Company ${companyId} já está vinculada a outro lead.`);
        company=domain.createCompany({...existing,legacyLeadId:leadId},{now});
        next.companies[index]=company;
      }else throw new Error(`Ação não permitida para ${leadId}: ${action||'?'}`);

      const proposal=contactProposal(lead);
      if(approval.includeContact===true&&proposal){
        const duplicate=duplicateContact(next,company.id,proposal);
        if(duplicate)contactSkipped=duplicate.id;
        else{contact=domain.createContact({id:idFactory('contact',leadId),companyId:company.id,...proposal},{now});next.contacts.push(contact);}
      }
      const event={id:idFactory('event',leadId),type:'legacy.reconciliation.applied',at:now,clientId:leadId,companyId:company.id,action,contactId:contact?.id||null,contactSkippedDuplicateId:contactSkipped};
      next.activityEvents.unshift(event);
      results.push({leadId,action,companyId:company.id,contactId:contact?.id||null,contactSkippedDuplicateId:contactSkipped});
    }
    const validation=domain.validateGraph(next);if(!validation.valid)throw new Error(validation.errors.join('; '));
    next.updatedAt=now;
    return {graph:next,report:Object.freeze({mode:'controlled_apply',appliedAt:now,total:results.length,results:Object.freeze(results)})};
  }
  return{inspectLead,buildPlan,validatePlan,applyApproved};
}));