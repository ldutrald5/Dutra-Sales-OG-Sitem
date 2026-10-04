(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
let selectedId='';
let handoffPayload=null;
let visualCandidates=[];
let visualLoadToken=0;
const selectedVisualIds=new Set();

function core(){return globalThis.DUTRA_CORE}
function leads(){return core()?.getLeads?.()||[]}
function ops(){return core()?.getState?.()?.operations||{}}
function people(id){return (ops().contacts||[]).filter(c=>String(c.leadId||c.companyId)===String(id))}
function leadById(id){return leads().find(l=>String(l.id)===String(id))||null}

function addStyles(){if($('#proposal-entry-v3-style'))return;const s=document.createElement('style');s.id='proposal-entry-v3-style';s.textContent=`
.peHero{border:1px solid #5c4e18;border-radius:18px;padding:18px;background:radial-gradient(circle at 90% 0,#68510f55,transparent 34%),linear-gradient(145deg,#201b08,#091015 66%)}.peHero h2{font-size:25px;margin:5px 0}.peHero p{font-size:10px;color:#9da7af;line-height:1.5;margin:0}.peSearch{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:13px}.peSearch input{background:#080d11;color:#fff;border:1px solid #38434b;border-radius:10px;padding:11px}.peSearch button,.peBtn{border:1px solid #ffd400;border-radius:10px;background:#ffd400;color:#111;font-size:9px;font-weight:900;padding:0 13px}.peResults{display:grid;gap:5px;margin-top:7px}.peResult{border:1px solid #29343b;border-radius:9px;background:#0b1217;padding:9px;text-align:left;color:#e7ecef}.peResult b{display:block;font-size:10px}.peResult small{display:block;color:#84909a;font-size:8px;margin-top:2px}.peAccount{margin-top:12px;border:1px solid #2b353d;border-radius:14px;background:#091015;padding:14px}.peAccount h3{margin:0;font-size:16px}.peAccount p{margin:4px 0 0;color:#8d99a2;font-size:9px}.peData{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.peData div{border:1px solid #222d34;border-radius:8px;padding:8px}.peData small{display:block;font-size:7px;color:#7f8a93}.peData b{display:block;font-size:9px;margin-top:3px}.peActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.peActions button{height:40px;border:1px solid #34404a;border-radius:9px;background:#0d1419;color:#e5ebee;padding:0 11px;font-size:9px;font-weight:900}.peActions .primary{background:#ffd400;color:#111;border-color:#ffd400}.peWarning{margin-top:10px;padding:10px;border:1px solid #54491e;border-radius:10px;background:#171609;color:#d9cd83;font-size:8px;line-height:1.5}.peRecent{display:grid;gap:7px}.peDoc{border:1px solid #263138;border-radius:11px;background:#091015;padding:10px;display:grid;grid-template-columns:1fr auto;gap:8px}.peDoc b{font-size:10px}.peDoc small{display:block;color:#83909a;font-size:8px;margin-top:3px}.peDoc strong{font-size:11px;color:#ffd400}.peEmpty{padding:18px;text-align:center;border:1px dashed #334049;border-radius:11px;color:#8a969f;font-size:9px}.peWorkspace{margin-top:12px;border:1px solid #5c4e18;border-radius:14px;background:#070c10;overflow:hidden}.peWorkspaceHead{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #29343b;background:#101207}.peWorkspaceHead b{font-size:10px}.peWorkspaceHead small{display:block;color:#8d989f;font-size:8px;margin-top:2px}.peWorkspaceHead button{height:34px;border:1px solid #3b464e;border-radius:8px;background:#0d1419;color:#dfe5e8;padding:0 9px;font-size:8px;font-weight:900}.peWorkspaceFrame{width:100%;height:min(72vh,860px);border:0;background:#080d11;display:block}.peIntegratedTag{display:inline-flex;align-items:center;gap:5px;border:1px solid #46612e;border-radius:999px;color:#80e68a;background:#0c1c0f;padding:4px 7px;font-size:7px;font-weight:900}.peTechSummary{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.peTechSummary span{border:1px solid #38434a;border-radius:999px;padding:5px 7px;color:#c4cdd2;font-size:7px}.peVisual{margin-top:11px;border-top:1px solid #222d34;padding-top:10px}.peVisualHead{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.peVisualHead b{font-size:9px}.peVisualHead small{display:block;color:#87939b;font-size:7px;margin-top:2px}.peVisualList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:7px}.peVisualItem{display:flex;gap:8px;align-items:flex-start;border:1px solid #2d3941;border-radius:9px;background:#0c1318;padding:8px;color:#dce3e7;text-align:left}.peVisualItem input{margin-top:2px}.peVisualItem span{min-width:0}.peVisualItem b{display:block;font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.peVisualItem small{display:block;color:#82909a;font-size:7px;margin-top:2px}.peVisualState{margin-top:7px;color:#83909a;font-size:8px}.peVisualState.ok{color:#9edc94}@media(max-width:560px){.peData{grid-template-columns:1fr 1fr}.peSearch{grid-template-columns:1fr}.peSearch button{height:40px}.peWorkspaceFrame{height:68vh}.peWorkspaceHead{align-items:flex-start;flex-direction:column}}
`;document.head.appendChild(s)}

function docLeadId(doc){return clean(doc.clientId||doc.leadId)}
function realProposalDocs(){return (ops().generatedDocuments||[]).filter(d=>['proposal_tracking','proposal','commercial_proposal'].includes(clean(d.documentType||d.type).toLowerCase())).slice().sort((a,b)=>String(b.preparedAt||b.createdAt||'').localeCompare(String(a.preparedAt||a.createdAt||''))).slice(0,12)}
function money(v){const n=Number(v);return Number.isFinite(n)&&n>0?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}):'—'}

function build(){
  const screen=$('#proposal'); if(!screen||screen.dataset.officialEntry==='1')return;
  screen.dataset.officialEntry='1';
  const head=screen.querySelector('.pageHead');
  [...screen.children].forEach(child=>{if(child!==head)child.remove()});
  screen.insertAdjacentHTML('beforeend',`
    <section class="peHero">
      <div style="color:#ffd400;font-size:9px;font-weight:900;letter-spacing:.14em">PROPOSTA OFICIAL</div>
      <h2>Do CRM para a cotação sem redigitar cliente.</h2>
      <p>O Sales Execution transfere os dados da conta para o motor oficial de cotação. Veículos, aplicação, preços, frete, condição e suporte técnico continuam sendo validados no sistema oficial antes de salvar.</p>
      <div class="peSearch"><input id="peSearch" placeholder="Buscar empresa, contato, CNPJ ou telefone…"><button id="peSearchBtn">Buscar</button></div>
      <div class="peResults" id="peResults"></div>
      <div id="peSelected"></div>
      <div id="peIntegratedWorkspace"></div>
      <div class="peWarning">A tela antiga de simulação da V3 foi retirada deste fluxo para não transformar valores demonstrativos em proposta real. Salvar uma cotação continua sendo uma ação explícita no motor oficial.</div>
    </section>
    <section class="section"><div class="sectionHead"><h2>Propostas preparadas</h2><button id="peRefresh">Atualizar</button></div><div class="peRecent" id="peRecent"></div></section>
  `);
  $('#peSearch').addEventListener('input',renderResults);
  $('#peSearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderResults()}});
  $('#peSearchBtn').onclick=renderResults;
  $('#peRefresh').onclick=async()=>{await core()?.reload?.();renderRecent();renderSelected()};
  renderRecent();renderSelected();lucide?.createIcons?.();
}

function renderResults(){
  const root=$('#peResults'),q=clean($('#peSearch')?.value).toLowerCase();if(!root)return;
  if(!q){root.innerHTML='';return}
  const rows=leads().filter(l=>[l.empresa,l.nome,l.cnpj,l.telefone,l.cidadeUf].some(v=>clean(v).toLowerCase().includes(q))).slice(0,8);
  root.innerHTML=rows.map(l=>`<button class="peResult" data-pe-lead="${esc(l.id)}"><b>${esc(l.empresa||l.nome||'Conta')}</b><small>${esc([l.nome,l.cidadeUf,l.cnpj,l.telefone].filter(Boolean).join(' · '))}</small></button>`).join('')||'<div class="peEmpty">Nenhuma conta encontrada.</div>';
  $('[data-pe-lead]').forEach(b=>b.onclick=()=>{selectedId=b.dataset.peLead;visualCandidates=[];selectedVisualIds.clear();$('#peResults').innerHTML='';$('#peSearch').value='';renderSelected()});
}

function renderSelected(){
  const root=$('#peSelected');if(!root)return;
  const l=leadById(selectedId);if(!l){root.innerHTML='';return}
  const ps=people(l.id),decision=ps.find(p=>['OWNER','DIRECTOR','FLEET_MANAGER','MAINTENANCE_MANAGER','PROCUREMENT'].includes(clean(p.roleCategory).toUpperCase()))||ps[0]||{};
  root.innerHTML=`<article class="peAccount"><h3>${esc(l.empresa||l.nome||'Conta')}</h3><p>${esc([l.relationshipStatus,l.pipelineStage,l.cidadeUf].filter(Boolean).join(' · '))}</p><div class="peData"><div><small>CONTATO</small><b>${esc(decision.name||l.nome||'—')}</b></div><div><small>CNPJ</small><b>${esc(l.cnpj||'—')}</b></div><div><small>TELEFONE</small><b>${esc(decision.phone||l.telefone||'—')}</b></div><div><small>FROTA</small><b>${esc(l.fleetSize||'A validar')}</b></div></div><div class="peVisual"><div class="peVisualHead"><div><b>IMAGENS APROVADAS PARA ESTA PROPOSTA</b><small>Seleção manual · até 2 imagens. Só materiais marcados como PROPOSAL_ALLOWED aparecem aqui.</small></div></div><div class="peVisualState" id="peVisualState">Carregando materiais aprovados…</div><div class="peVisualList" id="peVisualList"></div></div><div class="peActions"><button class="primary" id="peOfficial">Abrir cotação oficial</button><button id="peAccount">Abrir Cliente 360°</button><button id="peFollow">Agendar follow-up</button></div></article>`;
  $('#peOfficial').onclick=()=>{try{globalThis.DUTRA_QUOTE_HANDOFF.launch(l,decision,{visuals:selectedProposalVisuals()})}catch(e){notifyError(e)}};
  $('#peAccount').onclick=()=>core()?.selectClient?.(l.id);
  $('#peFollow').onclick=()=>globalThis.DUTRA_ACTION_CENTER?.open?.(l,'PROPOSAL_FOLLOW_UP',{reason:'Acompanhar preparação ou decisão da proposta.'});
  loadProposalVisuals(l);
}

function proposalAssetRef(lead){
  const companyId=clean(lead?.companyId||lead?.company_id||lead?.canonicalCompanyId);
  return /^[0-9a-f-]{36}$/i.test(companyId)?{companyId}:{legacyLeadId:clean(lead?.id)};
}
function selectedProposalVisuals(){
  return visualCandidates.filter(item=>selectedVisualIds.has(item.id)).slice(0,2).map(item=>({
    assetId:item.id,
    versionId:item.currentVersion?.id||item.current_version_id,
    category:item.business_category,
    title:item.title||item.currentVersion?.original_filename||'Imagem da conta',
    usagePolicy:item.usage_policy,
    sensitivityLevel:item.sensitivity_level
  })).filter(item=>item.assetId&&item.versionId);
}
function renderProposalVisuals(){
  const list=$('#peVisualList'),status=$('#peVisualState');if(!list||!status)return;
  if(!visualCandidates.length){
    list.innerHTML='';
    status.className='peVisualState';
    status.textContent='Nenhuma imagem explicitamente aprovada para proposta nesta conta. A cotação seguirá sem imagem da conta.';
    return;
  }
  list.innerHTML=visualCandidates.map(item=>`<label class="peVisualItem"><input type="checkbox" data-pe-visual="${esc(item.id)}" ${selectedVisualIds.has(item.id)?'checked':''}><span><b>${esc(item.title||item.currentVersion?.original_filename||item.business_category||'Imagem')}</b><small>${esc([item.business_category,item.is_primary?'principal':'',item.source_type].filter(Boolean).join(' · '))}</small></span></label>`).join('');
  $('[data-pe-visual]',list).forEach(input=>input.addEventListener('change',()=>{
    const id=input.dataset.peVisual;
    if(input.checked&&selectedVisualIds.size>=2){
      input.checked=false;
      if(typeof globalThis.showToast==='function')globalThis.showToast('Selecione no máximo 2 imagens para manter a proposta objetiva.');
      return;
    }
    if(input.checked)selectedVisualIds.add(id);else selectedVisualIds.delete(id);
    status.className='peVisualState '+(selectedVisualIds.size?'ok':'');
    status.textContent=selectedVisualIds.size?selectedVisualIds.size+' imagem(ns) será(ão) enviada(s) ao motor oficial.':'Selecione manualmente as imagens que realmente devem aparecer na proposta.';
  }));
  status.className='peVisualState '+(selectedVisualIds.size?'ok':'');
  status.textContent=selectedVisualIds.size?selectedVisualIds.size+' imagem(ns) selecionada(s).':'Selecione manualmente as imagens que realmente devem aparecer na proposta.';
}
async function loadProposalVisuals(lead){
  const token=++visualLoadToken,status=$('#peVisualState'),list=$('#peVisualList');
  if(status)status.textContent='Carregando materiais aprovados…';
  if(list)list.innerHTML='';
  try{
    const params=new URLSearchParams(proposalAssetRef(lead));params.set('limit','60');
    const data=await core().request('/assets?'+params.toString(),{timeoutMs:10000});
    if(token!==visualLoadToken||String(selectedId)!==String(lead.id))return;
    visualCandidates=(data.items||[]).filter(item=>
      item.media_kind==='IMAGE'
      && item.usage_policy==='PROPOSAL_ALLOWED'
      && item.visibility_class!=='RESTRICTED'
      && item.sensitivity_level!=='CONFIDENTIAL'
      && item.currentVersion?.id
    ).slice(0,12);
    for(const id of [...selectedVisualIds])if(!visualCandidates.some(item=>item.id===id))selectedVisualIds.delete(id);
    renderProposalVisuals();
  }catch(error){
    if(token!==visualLoadToken)return;
    visualCandidates=[];selectedVisualIds.clear();
    if(list)list.innerHTML='';
    if(status)status.textContent=error?.status===404?'Conta ainda não reconciliada com a Company canônica. A proposta seguirá sem imagem da memória visual.':'Memória visual indisponível agora. A cotação oficial continua funcionando sem imagens da conta.';
  }
}
function notifyError(error){if(typeof globalThis.showToast==='function')globalThis.showToast(error?.message||'Não foi possível abrir a cotação.');else console.error(error)}
function integratedUrl(){return '/legacy/?tab=cotacao&handoff=1&embedded=1';}
function renderIntegratedWorkspace(){
  const root=$('#peIntegratedWorkspace');if(!root)return;
  const payload=handoffPayload||globalThis.DUTRA_QUOTE_HANDOFF?.read?.();
  if(!payload){root.innerHTML='';return}
  handoffPayload=payload;
  const tech=payload.technical||null,client=payload.client||{};
  root.innerHTML=`<section class="peWorkspace">
    <div class="peWorkspaceHead"><div><span class="peIntegratedTag">INTEGRADO NO DUTRA OS</span><b style="display:block;margin-top:6px">${esc(client.company||client.name||'Cotação')}</b><small>O motor oficial antigo está sendo executado dentro da interface nova enquanto suas funções são migradas para componentes V3.</small>${tech?'<div class="peTechSummary"><span>'+esc(tech.qty+'× '+tech.vehicleName)+'</span><span>'+esc((tech.psi||'—')+' PSI')+'</span><span>'+esc(tech.totalTires+' pneus')+'</span><span>'+esc(tech.lines.length+' itens')+'</span></div>':''}</div><button id="peCloseWorkspace">Fechar editor</button></div>
    <iframe class="peWorkspaceFrame" id="peWorkspaceFrame" src="${integratedUrl()}" title="Cotação oficial integrada"></iframe>
  </section>`;
  $('#peCloseWorkspace').onclick=()=>{root.innerHTML='';handoffPayload=null};
}
function renderRecent(){
  const root=$('#peRecent');if(!root)return;
  const docs=realProposalDocs();
  root.innerHTML=docs.length?docs.map(d=>{const l=leadById(docLeadId(d)),snap=d.snapshot||d.proposalSnapshot||{},commercial=snap.commercial||{};return`<article class="peDoc"><div><b>${esc(l?.empresa||l?.nome||snap.client?.company||'Proposta')}</b><small>${esc([d.id,d.status,new Date(d.preparedAt||d.createdAt||Date.now()).toLocaleString('pt-BR')].filter(Boolean).join(' · '))}</small></div><strong>${money(commercial.totalValue||d.totalValue)}</strong></article>`}).join(''):'<div class="peEmpty">Nenhuma proposta oficial preparada foi encontrada no estado atual.</div>';
}

function boot(){
  addStyles();build();
  handoffPayload=globalThis.DUTRA_QUOTE_HANDOFF?.read?.()||null;
  if(handoffPayload)renderIntegratedWorkspace();
  window.addEventListener('dutra:state',()=>{renderRecent();renderSelected()});
  window.addEventListener('dutra:quote-handoff',e=>{handoffPayload=e.detail?.payload||globalThis.DUTRA_QUOTE_HANDOFF?.read?.()||null;renderIntegratedWorkspace()});
  window.addEventListener('dutra:navigate',e=>{if(e.detail?.id==='proposal'&&(handoffPayload||globalThis.DUTRA_QUOTE_HANDOFF?.read?.()))renderIntegratedWorkspace()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();