(function attachPublicSearchProvider(root,factory){
  const api=factory(); if(typeof module!=='undefined'&&module.exports) module.exports=api; root.OG_PUBLIC_SEARCH_PROVIDER=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function buildQuery(criteria={}){
    const place=[criteria.city,criteria.state].filter(Boolean).join(' ');
    const segment=criteria.segment||'transportadora';
    const fleet=Number(criteria.minFleet||0);
    const keywords=(criteria.keywords||[]).join(' ');
    return [segment,place,fleet?('frota '+fleet+' caminhões'):'frota caminhões',keywords].filter(Boolean).join(' ').trim();
  }
  function normalizeWebResults(response={}){
    const rows=response?.data?.web||response?.web||[];
    return rows.map(row=>({
      companyName:String(row.title||'').replace(/\s*[|–—-].*$/,'').trim(),
      city:null,state:null,segment:null,fleetSize:null,decisionMaker:null,contact:null,
      sources:row.url?[{url:row.url,title:row.title||row.url,observedAt:new Date().toISOString(),supports:['public_search']}]:[],
      sourceSnippet:row.description||''
    })).filter(x=>x.companyName&&x.sources.length);
  }
  function createAdapter(searchFn){
    if(typeof searchFn!=='function') throw new Error('searchFn obrigatório');
    return Object.freeze({id:'public_web_search',async search(criteria,options={}){
      const query=buildQuery(criteria);
      const raw=await searchFn({query,limit:Math.min(Number(options.requestedCount||criteria.requestedCount||10),25)});
      return normalizeWebResults(raw);
    }});
  }
  return Object.freeze({buildQuery,normalizeWebResults,createAdapter});
}));