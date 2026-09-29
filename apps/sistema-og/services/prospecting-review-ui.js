(function attachProspectingReviewUI(root,factory){
  const api=factory(); if(typeof module!=='undefined'&&module.exports) module.exports=api; root.OG_PROSPECTING_REVIEW_UI=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function render(items=[]){
    const list=Array.isArray(items)?items:[];
    if(!list.length) return '<section class="clean-card prospect-research-empty"><span class="og-kicker">DUTRA RESEARCH</span><h2>Nenhuma descoberta aguardando revisão</h2><p>Resultados de pesquisa com evidência pública aparecerão aqui antes de entrarem no CRM.</p></section>';
    return '<section class="clean-card prospect-research-review"><header><div><span class="og-kicker">DUTRA RESEARCH</span><h2>Descobertas aguardando revisão</h2><p>'+list.length+' candidato(s) encontrados por pesquisa pública.</p></div></header><div class="prospect-research-grid">'+list.map((x,i)=>'<article class="prospect-research-card" data-research-index="'+i+'"><div><strong>'+esc(x.companyName)+'</strong><span>'+esc([x.city,x.state].filter(Boolean).join(' - '))+'</span></div><p>'+esc(x.segment||'Segmento não confirmado')+(x.fleetSize!=null?' · Frota '+esc(x.fleetSize):'')+'</p><p><b>Decisor:</b> '+esc(x.decisionMaker||'não encontrado')+' · <b>Contato:</b> '+esc(x.contact||'não encontrado')+'</p><p><b>Evidências:</b> '+esc(x.sources?.length||0)+' · <b>Fit:</b> '+esc((x.fitReasons||[]).join(', ')||'a revisar')+'</p><div class="prospect-research-actions"><button type="button" data-research-sources="'+i+'">Ver fontes</button><button type="button" class="og-button og-button-primary" data-research-import="'+i+'" '+(x.importAllowed?'':'disabled')+'>Adicionar ao CRM</button></div></article>').join('')+'</div></section>';
  }
  return Object.freeze({render});
}));