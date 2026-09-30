(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
let selectedId='';
let handoffPayload=null;
let proposalDraft=null;

function core(){return globalThis.DUTRA_CORE}
function leads(){return core()?.getLeads?.()||[]}
function ops(){return core()?.getState?.()?.operations||{}}
function people(id){return (ops().contacts||[]).filter(c=>String(c.leadId||c.companyId)===String(id))}
function leadById(id){return leads().find(l=>String(l.id)===String(id))||null}

function addStyles(){if($('#proposal-entry-v3-style'))return;const s=document.createElement('style');s.id='proposal-entry-v3-style';s.textContent=`
.peHero{border:1px solid #5c4e18;border-radius:18px;padding:18px;background:radial-gradient(circle at 90% 0,#68510f55,transparent 34%),linear-gradient(145deg,#201b08,#091015 66%)}.peHero h2{font-size:25px;margin:5px 0}.peHero p{font-size:10px;color:#9da7af;line-height:1.5;margin:0}.peSearch{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:13px}.peSearch input{background:#080d11;color:#fff;border:1px solid #38434b;border-radius:10px;padding:11px}.peSearch button,.peBtn{border:1px solid #ffd400;border-radius:10px;background:#ffd400;color:#111;font-size:9px;font-weight:900;padding:0 13px}.peResults{display:grid;gap:5px;margin-top:7px}.peResult{border:1px solid #29343b;border-radius:9px;background:#0b1217;padding:9px;text-align:left;color:#e7ecef}.peResult b{display:block;font-size:10px}.peResult small{display:block;color:#84909a;font-size:8px;margin-top:2px}.peAccount{margin-top:12px;border:1px solid #2b353d;border-radius:14px;background:#091015;padding:14px}.peAccount h3{margin:0;font-size:16px}.peAccount p{margin:4px 0 0;color:#8d99a2;font-size:9px}.peData{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.peData div{border:1px solid #222d34;border-radius:8px;padding:8px}.peData small{display:block;font-size:7px;color:#7f8a93}.peData b{display:block;font-size:9px;margin-top:3px}.peActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.peActions button{height:40px;border:1px solid #34404a;border-radius:9px;background:#0d1419;color:#e5ebee;padding:0 11px;font-size:9px;font-weight:900}.peActions .primary{background:#ffd400;color:#111;border-color:#ffd400}.peWarning{margin-top:10px;padding:10px;border:1px solid #54491e;border-radius:10px;background:#171609;color:#d9cd83;font-size:8px;line-height:1.5}.peRecent{display:grid;gap:7px}.peDoc{border:1px solid #263138;border-radius:11px;background:#091015;padding:10px;display:grid;grid-template-columns:1fr auto;gap:8px}.peDoc b{font-size:10px}.peDoc small{display:block;color:#83909a;font-size:8px;margin-top:3px}.peDoc strong{font-size:11px;color:#ffd400}.peEmpty{padding:18px;text-align:center;border:1px dashed #334049;border-radius:11px;color:#8a969f;font-size:9px}.peWorkspace{margin-top:12px;border:1px solid #5c4e18;border-radius:14px;background:#070c10;overflow:hidden}.peWorkspaceHead{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #29343b;background:#101207}.peWorkspaceHead b{font-size:10px}.peWorkspaceHead small{display:block;color:#8d989f;font-size:8px;margin-top:2px}.peWorkspaceHead button{height:34px;border:1px solid #3b464e;border-radius:8px;background:#0d1419;color:#dfe5e8;padding:0 9px;font-size:8px;font-weight:900}.peWorkspaceFrame{width:100%;height:min(72vh,860px);border:0;background:#080d11;display:block}.peIntegratedTag{display:inline-flex;align-items:center;gap:5px;border:1px solid #46612e;border-radius:999px;color:#80e68a;background:#0c1c0f;padding:4px 7px;font-size:7px;font-weight:900}.peTechSummary{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.peTechSummary span{border:1px solid #38434a;border-radius:999px;padding:5px 7px;color:#c4cdd2;font-size:7px}@media(max-width:560px){.peData{grid-template-columns:1fr 1fr}.peSearch{grid-template-columns:1fr}.peSearch button{height:40px}.peWorkspaceFrame{height:68vh}.peWorkspaceHead{align-items:flex-start;flex-direction:column}}
`;s.textContent+=`.peEditor{padding:12px}.peEditorGrid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:7px}.peEditor input{width:100%;border:1px solid #34404a;border-radius:8px;background:#080d11;color:#fff;padding:9px;font-size:9px}.peItem{display:grid;grid-template-columns:minmax(150px,1fr) 74px 112px 105px 34px;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid #202a31}.peItem b{font-size:9px}.peItem small{display:block;color:#87939b;font-size:7px;margin-top:2px}.peItem strong{text-align:right;font-size:9px}.peItem button{height:34px;border:1px solid #4c3333;border-radius:7px;background:#1b0d0d;color:#ff9a9a}.peTotals{display:flex;justify-content:flex-end;gap:20px;padding:12px 0}.peTotals small{display:block;color:#8b969e;font-size:7px}.peTotals strong{display:block;color:#ffd400;font-size:17px;margin-top:3px}.peSaveState{font-size:8px;color:#8e9aa2;margin-top:8px}@media(max-width:680px){.peEditorGrid{grid-template-columns:1fr}.peItem{grid-template-columns:1fr 64px 90px}.peItem strong{grid-column:2}.peItem button{grid-column:3;grid-row:2}}`;document.head.appendChild(s)}

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
  $$('[data-pe-lead]').forEach(b=>b.onclick=()=>{selectedId=b.dataset.peLead;$('#peResults').innerHTML='';$('#peSearch').value='';renderSelected()});
}

function renderSelected(){
  const root=$('#peSelected');if(!root)return;
  const l=leadById(selectedId);if(!l){root.innerHTML='';return}
  const ps=people(l.id),decision=ps.find(p=>['OWNER','DIRECTOR','FLEET_MANAGER','MAINTENANCE_MANAGER','PROCUREMENT'].includes(clean(p.roleCategory).toUpperCase()))||ps[0]||{};
  root.innerHTML=`<article class="peAccount"><h3>${esc(l.empresa||l.nome||'Conta')}</h3><p>${esc([l.relationshipStatus,l.pipelineStage,l.cidadeUf].filter(Boolean).join(' · '))}</p><div class="peData"><div><small>CONTATO</small><b>${esc(decision.name||l.nome||'—')}</b></div><div><small>CNPJ</small><b>${esc(l.cnpj||'—')}</b></div><div><small>TELEFONE</small><b>${esc(decision.phone||l.telefone||'—')}</b></div><div><small>FROTA</small><b>${esc(l.fleetSize||'A validar')}</b></div></div><div class="peActions"><button class="primary" id="peOfficial">Abrir cotação oficial</button><button id="peAccount">Abrir Cliente 360°</button><button id="peFollow">Agendar follow-up</button></div></article>`;
  $('#peOfficial').onclick=()=>{try{globalThis.DUTRA_QUOTE_HANDOFF.launch(l,decision,{})}catch(e){notifyError(e)}};
  $('#peAccount').onclick=()=>core()?.selectClient?.(l.id);
  $('#peFollow').onclick=()=>globalThis.DUTRA_ACTION_CENTER?.open?.(l,'PROPOSAL_FOLLOW_UP',{reason:'Acompanhar preparação ou decisão da proposta.'});
}

function notifyError(error){if(typeof globalThis.showToast==='function')globalThis.showToast(error?.message||'Não foi possível abrir a cotação.');else console.error(error)}
function draftFromPayload(payload){
  const technical=payload?.technical||{},commercial=payload?.commercial||{};
  return {leadId:payload?.leadId,sourceAt:payload?.createdAt,quoteId:'Q-V1-'+clean(payload?.leadId||'CONTA')+'-'+clean(payload?.createdAt||new Date().toISOString()).replace(/[^0-9]/g,'').slice(0,14),installments:Math.max(1,Number(commercial.installments)||1),freightText:clean(commercial.freightText),deliveryText:clean(commercial.deliveryText),vehicle:{id:clean(technical.ruleId)||'manual',name:clean(technical.vehicleName)||'Aplicação técnica',vehicleTypeId:clean(technical.ruleId)||'manual',libras:Number(technical.psi)||0,includeDianteira:Boolean(technical.includeFront),qty:Math.max(1,Number(technical.qty)||1)},items:(technical.lines||[]).map((line,index)=>({id:'ITEM-'+index,code:clean(line.code),name:clean(line.name)||clean(line.code),qty:Math.max(0,Number(line.qty)||0),unitPrice:Math.max(0,Number(line.unitPrice)||0),manual:Boolean(line.manual)})).filter(item=>item.code&&item.qty)};
}
function draftTotal(){return (proposalDraft?.items||[]).reduce((sum,item)=>sum+(Number(item.qty)||0)*(Number(item.unitPrice)||0),0)}
function renderEditorItems(){
  const root=$('#peEditorItems');if(!root||!proposalDraft)return;
  root.innerHTML=proposalDraft.items.map(item=>`<div class="peItem"><div><b>${esc(item.code)} · ${esc(item.name)}</b><small>${item.manual?'Item ajustado/manual':'Aplicação técnica'}</small></div><input data-pe-qty="${esc(item.id)}" inputmode="numeric" value="${item.qty}" aria-label="Quantidade ${esc(item.code)}"><input data-pe-price="${esc(item.id)}" inputmode="decimal" value="${item.unitPrice.toFixed(2)}" aria-label="Preço ${esc(item.code)}"><strong>${money(item.qty*item.unitPrice)}</strong><button data-pe-remove="${esc(item.id)}" aria-label="Remover ${esc(item.code)}">×</button></div>`).join('')||'<div class="peEmpty">Adicione ao menos um item antes de salvar a proposta.</div>';
}
function refreshEditorTotals(){const total=draftTotal(),installments=Math.max(1,Number(proposalDraft?.installments)||1);if($('#peDraftTotal'))$('#peDraftTotal').textContent=money(total);if($('#peDraftCondition'))$('#peDraftCondition').textContent=installments+'x de '+money(total/installments)}
function bindEditorItems(){
  const root=$('#peEditorItems');if(!root)return;
  $$('[data-pe-qty]',root).forEach(input=>input.onchange=()=>{const item=proposalDraft.items.find(x=>x.id===input.dataset.peQty);if(item){item.qty=Math.max(0,Number(input.value)||0);renderEditorItems();bindEditorItems();refreshEditorTotals()}});
  $$('[data-pe-price]',root).forEach(input=>input.onchange=()=>{const item=proposalDraft.items.find(x=>x.id===input.dataset.pePrice);if(item){item.unitPrice=Math.max(0,Number(String(input.value).replace(',','.'))||0);renderEditorItems();bindEditorItems();refreshEditorTotals()}});
  $$('[data-pe-remove]',root).forEach(button=>button.onclick=()=>{proposalDraft.items=proposalDraft.items.filter(x=>x.id!==button.dataset.peRemove);renderEditorItems();bindEditorItems();refreshEditorTotals()});
}
async function saveProposalDraft(){
  const payload=handoffPayload,lead=leadById(payload?.leadId);if(!payload||!lead||!proposalDraft)return notifyError(new Error('Cliente ou aplicação não disponível.'));
  if(!proposalDraft.items.length)return notifyError(new Error('A proposta precisa de pelo menos um item.'));
  const service=globalThis.OG_PROPOSAL_INTELLIGENCE,model=globalThis.OG_OPERATIONS_MODEL;if(!service?.prepareTrackingDraft||!model)return notifyError(new Error('Motor oficial de propostas não carregou.'));
  const total=draftTotal(),vehicle={...proposalDraft.vehicle,items:proposalDraft.items.map(item=>({code:item.code,name:item.name,qty:item.qty,customPrice:item.unitPrice,unitPrice:item.unitPrice,total:item.qty*item.unitPrice,manual:item.manual}))};
  const quoteState={client:{nome:payload.client?.name,empresa:payload.client?.company,cnpj:payload.client?.cnpj,cidadeUf:payload.client?.city,internalCode:payload.client?.internalCode,freteTexto:proposalDraft.freightText,deliveryText:proposalDraft.deliveryText,condicaoPagamento:proposalDraft.installments+'x de '+money(total/proposalDraft.installments)},installments:proposalDraft.installments,vehicles:[vehicle],extraItems:[]};
  const quote={id:proposalDraft.quoteId,clientId:lead.id,clientName:payload.client?.name,clientCompany:payload.client?.company,clientInternalCode:payload.client?.internalCode,totalValue:total,totalPecas:proposalDraft.items.reduce((sum,item)=>sum+item.qty,0),payload:quoteState};
  try{const next=service.prepareTrackingDraft(ops(),{clientId:lead.id,quoteId:quote.id,quote,quoteState,owner:'Lucas'},{operationsModel:model,now:new Date().toISOString()});await core().commit({operations:next},'Rascunho de proposta salvo.',{action:'SAVE_PROPOSAL_DRAFT',entityType:'proposal',entityId:'PROP-'+quote.id.replace(/[^a-zA-Z0-9_-]/g,'').slice(-32),idempotencyKey:'proposal:'+quote.id,label:'Proposta'});if($('#peSaveState'))$('#peSaveState').textContent='SALVO ✓ · proposta vinculada a '+(lead.empresa||lead.nome);renderRecent()}catch(error){notifyError(error)}
}
function renderIntegratedWorkspace(){
  const root=$('#peIntegratedWorkspace');if(!root)return;const payload=handoffPayload||globalThis.DUTRA_QUOTE_HANDOFF?.read?.();if(!payload){root.innerHTML='';return}handoffPayload=payload;if(!proposalDraft||proposalDraft.leadId!==payload.leadId||proposalDraft.sourceAt!==payload.createdAt)proposalDraft=draftFromPayload(payload);
  const tech=payload.technical||null,client=payload.client||{};
  root.innerHTML=`<section class="peWorkspace"><div class="peWorkspaceHead"><div><span class="peIntegratedTag">EDITOR V1 INTEGRADO</span><b style="display:block;margin-top:6px">${esc(client.company||client.name||'Cotação')}</b><small>Itens vieram da aplicação técnica e permanecem editáveis antes de salvar.</small>${tech?'<div class="peTechSummary"><span>'+esc(tech.qty+'× '+tech.vehicleName)+'</span><span>'+esc((tech.psi||'—')+' PSI')+'</span><span>'+esc(tech.totalTires+' pneus')+'</span><span>'+esc(tech.lines.length+' itens')+'</span></div>':''}</div><button id="peCloseWorkspace">Fechar editor</button></div><div class="peEditor"><div class="peEditorGrid"><label><small>PARCELAS</small><input id="peInstallments" inputmode="numeric" value="${proposalDraft.installments}"></label><label><small>FRETE</small><input id="peFreight" value="${esc(proposalDraft.freightText)}" placeholder="A confirmar"></label><label><small>ENTREGA</small><input id="peDelivery" value="${esc(proposalDraft.deliveryText)}" placeholder="A confirmar"></label></div><div id="peEditorItems"></div><div class="peTotals"><div><small>CONDIÇÃO</small><strong id="peDraftCondition"></strong></div><div><small>TOTAL</small><strong id="peDraftTotal"></strong></div></div><div class="peActions"><button class="primary" id="peSaveDraft">Salvar rascunho</button><button id="peOpenLegacy">Abrir editor legado</button></div><div class="peSaveState" id="peSaveState">DRAFT · ainda não enviado</div></div></section>`;
  renderEditorItems();bindEditorItems();refreshEditorTotals();$('#peInstallments').onchange=e=>{proposalDraft.installments=Math.max(1,Number(e.target.value)||1);refreshEditorTotals()};$('#peFreight').oninput=e=>proposalDraft.freightText=e.target.value;$('#peDelivery').oninput=e=>proposalDraft.deliveryText=e.target.value;$('#peSaveDraft').onclick=saveProposalDraft;$('#peOpenLegacy').onclick=()=>globalThis.DUTRA_QUOTE_HANDOFF?.launchLegacy?.(leadById(payload.leadId),{}, {technical:payload.technical,installments:proposalDraft.installments,tier:payload.commercial?.tier});$('#peCloseWorkspace').onclick=()=>{root.innerHTML='';handoffPayload=null;proposalDraft=null};
}
function renderRecent(){
  const root=$('#peRecent');if(!root)return;
  const docs=realProposalDocs();
  root.innerHTML=docs.length?docs.map(d=>{const l=leadById(docLeadId(d)),snap=d.snapshot||d.proposalSnapshot||{},commercial=snap.commercial||{};return`<article class="peDoc"><div><b>${esc(l?.empresa||l?.nome||snap.client?.company||'Proposta')}</b><small>${esc([d.id,d.proposalStatus||d.status,new Date(d.updatedAt||d.preparedAt||d.createdAt||Date.now()).toLocaleString('pt-BR')].filter(Boolean).join(' · '))}</small></div><strong>${money(d.total||commercial.totalValue||d.totalValue)}</strong></article>`}).join(''):'<div class="peEmpty">Nenhuma proposta oficial preparada foi encontrada no estado atual.</div>';
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
