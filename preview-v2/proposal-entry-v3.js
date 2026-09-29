(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
let selectedId='';

function core(){return globalThis.DUTRA_CORE}
function leads(){return core()?.getLeads?.()||[]}
function ops(){return core()?.getState?.()?.operations||{}}
function people(id){return (ops().contacts||[]).filter(c=>String(c.leadId||c.companyId)===String(id))}
function leadById(id){return leads().find(l=>String(l.id)===String(id))||null}

function addStyles(){if($('#proposal-entry-v3-style'))return;const s=document.createElement('style');s.id='proposal-entry-v3-style';s.textContent=`
.peHero{border:1px solid #5c4e18;border-radius:18px;padding:18px;background:radial-gradient(circle at 90% 0,#68510f55,transparent 34%),linear-gradient(145deg,#201b08,#091015 66%)}.peHero h2{font-size:25px;margin:5px 0}.peHero p{font-size:10px;color:#9da7af;line-height:1.5;margin:0}.peSearch{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:13px}.peSearch input{background:#080d11;color:#fff;border:1px solid #38434b;border-radius:10px;padding:11px}.peSearch button,.peBtn{border:1px solid #ffd400;border-radius:10px;background:#ffd400;color:#111;font-size:9px;font-weight:900;padding:0 13px}.peResults{display:grid;gap:5px;margin-top:7px}.peResult{border:1px solid #29343b;border-radius:9px;background:#0b1217;padding:9px;text-align:left;color:#e7ecef}.peResult b{display:block;font-size:10px}.peResult small{display:block;color:#84909a;font-size:8px;margin-top:2px}.peAccount{margin-top:12px;border:1px solid #2b353d;border-radius:14px;background:#091015;padding:14px}.peAccount h3{margin:0;font-size:16px}.peAccount p{margin:4px 0 0;color:#8d99a2;font-size:9px}.peData{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.peData div{border:1px solid #222d34;border-radius:8px;padding:8px}.peData small{display:block;font-size:7px;color:#7f8a93}.peData b{display:block;font-size:9px;margin-top:3px}.peActions{display:flex;gap:7px;flex-wrap:wrap;margin-top:11px}.peActions button{height:40px;border:1px solid #34404a;border-radius:9px;background:#0d1419;color:#e5ebee;padding:0 11px;font-size:9px;font-weight:900}.peActions .primary{background:#ffd400;color:#111;border-color:#ffd400}.peWarning{margin-top:10px;padding:10px;border:1px solid #54491e;border-radius:10px;background:#171609;color:#d9cd83;font-size:8px;line-height:1.5}.peRecent{display:grid;gap:7px}.peDoc{border:1px solid #263138;border-radius:11px;background:#091015;padding:10px;display:grid;grid-template-columns:1fr auto;gap:8px}.peDoc b{font-size:10px}.peDoc small{display:block;color:#83909a;font-size:8px;margin-top:3px}.peDoc strong{font-size:11px;color:#ffd400}.peEmpty{padding:18px;text-align:center;border:1px dashed #334049;border-radius:11px;color:#8a969f;font-size:9px}@media(max-width:560px){.peData{grid-template-columns:1fr 1fr}.peSearch{grid-template-columns:1fr}.peSearch button{height:40px}}
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
  $('#peOfficial').onclick=()=>{try{globalThis.DUTRA_QUOTE_HANDOFF.launch(l,decision,{target:'_blank'})}catch(e){alert(e.message)}};
  $('#peAccount').onclick=()=>core()?.selectClient?.(l.id);
  $('#peFollow').onclick=()=>globalThis.DUTRA_ACTION_CENTER?.open?.(l,'PROPOSAL_FOLLOW_UP',{reason:'Acompanhar preparação ou decisão da proposta.'});
}

function renderRecent(){
  const root=$('#peRecent');if(!root)return;
  const docs=realProposalDocs();
  root.innerHTML=docs.length?docs.map(d=>{const l=leadById(docLeadId(d)),snap=d.snapshot||d.proposalSnapshot||{},commercial=snap.commercial||{};return`<article class="peDoc"><div><b>${esc(l?.empresa||l?.nome||snap.client?.company||'Proposta')}</b><small>${esc([d.id,d.status,new Date(d.preparedAt||d.createdAt||Date.now()).toLocaleString('pt-BR')].filter(Boolean).join(' · '))}</small></div><strong>${money(commercial.totalValue||d.totalValue)}</strong></article>`}).join(''):'<div class="peEmpty">Nenhuma proposta oficial preparada foi encontrada no estado atual.</div>';
}

function boot(){addStyles();build();window.addEventListener('dutra:state',()=>{renderRecent();renderSelected()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();