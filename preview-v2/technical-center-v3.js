(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clean=v=>String(v??'').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const D=()=>globalThis.OG_DATA||{};
const E=()=>globalThis.DUTRA_TECHNICAL_QUOTE;
const C=()=>globalThis.DUTRA_CORE;
const selected=()=>C()?.getSelectedLead?.()||null;
const people=id=>(C()?.getState?.()?.operations?.contacts||[]).filter(p=>String(p.leadId||p.companyId)===String(id));
const notify=m=>typeof globalThis.showToast==='function'?globalThis.showToast(m):console.log('[TECH]',m);

let state={ruleId:'',answers:{},qty:1,psi:120,includeFront:false,tierKey:'lead_ie',installments:6,extras:[],search:'',catalogSearch:'',catalogCategory:'all'};

function addStyles(){
 if($('#technical-center-v3-style'))return;
 const s=document.createElement('style');s.id='technical-center-v3-style';s.textContent=`
 .tcHero{border:1px solid #584b19;border-radius:18px;padding:17px;background:radial-gradient(circle at 90% 0,#6a520d55,transparent 34%),linear-gradient(145deg,#211b08,#081014 68%)}.tcHeroTop{display:flex;justify-content:space-between;gap:12px;align-items:start}.tcHero h2{margin:5px 0;font-size:25px}.tcHero p{margin:0;color:#9ca7af;font-size:10px;line-height:1.5}.tcClient{font-size:8px;font-weight:900;border:1px solid #5a4d1b;border-radius:999px;color:#ffd400;padding:6px 8px;white-space:nowrap}
 .tcSteps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:13px}.tcStep{border:1px solid #2d3840;border-radius:10px;background:#091015;padding:9px}.tcStep small{display:block;color:#78858e;font-size:7px}.tcStep b{display:block;font-size:10px;margin-top:3px}.tcStep.active{border-color:#7a6515;background:#181506}.tcStep.active b{color:#ffd400}
 .tcSection{margin-top:18px}.tcSectionHead{display:flex;justify-content:space-between;gap:10px;align-items:end;margin-bottom:9px}.tcSectionHead h2{margin:0;font-size:18px}.tcSectionHead p{margin:0;color:#7f8b94;font-size:8px;text-align:right}.tcSearch{height:44px;width:100%;border:1px solid #334049;border-radius:10px;background:#080d11;color:#fff;padding:0 11px;outline:0}
 .tcVehicleGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:9px}.tcVehicle{border:1px solid #28333b;border-radius:13px;background:#091015;color:#e8edf0;padding:12px;text-align:left;min-height:104px}.tcVehicle:hover,.tcVehicle.active{border-color:#8b7315;background:#181506}.tcVehicle small{display:block;color:#7f8b94;font-size:7px;text-transform:uppercase;font-weight:900;letter-spacing:.06em}.tcVehicle b{display:block;font-size:12px;margin-top:4px}.tcVehicle p{margin:5px 0 0;color:#8b969e;font-size:8px;line-height:1.4}.tcVehicle .ax{margin-top:7px;display:flex;gap:4px;flex-wrap:wrap}.tcChip{font-size:7px;border:1px solid #354149;border-radius:999px;color:#aeb8bf;padding:4px 6px}.tcChip.yellow{color:#ffd400;border-color:#5c4d19}
 .tcControls{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;border:1px solid #27323a;border-radius:13px;background:#091015;padding:11px}.tcField label{display:block;color:#7f8b94;font-size:7px;margin-bottom:4px;font-weight:900}.tcField input,.tcField select{height:39px;width:100%;border:1px solid #34404a;border-radius:8px;background:#080d11;color:#fff;padding:0 8px}.tcCheck{height:39px;border:1px solid #34404a;border-radius:8px;background:#080d11;color:#c7d0d6;display:flex;align-items:center;gap:7px;padding:0 8px;font-size:8px}.tcCheck input{accent-color:#ffd400}
 .tcQuestions{display:grid;gap:9px}.tcQuestion{border:1px solid #27323a;border-radius:12px;background:#091015;padding:11px}.tcQuestion label{display:block;font-size:10px;font-weight:800;margin-bottom:8px}.tcOptions{display:flex;gap:6px;flex-wrap:wrap}.tcOption{border:1px solid #344049;border-radius:9px;background:#0b1217;color:#c7d0d6;padding:8px 9px;font-size:8px;font-weight:800;text-align:left}.tcOption.active{background:#ffd400;color:#111;border-color:#ffd400}.tcOption span{display:block;font-size:7px;font-weight:600;opacity:.72;margin-top:3px}
 .tcResultGrid{display:grid;grid-template-columns:1.05fr .95fr;gap:9px}.tcVehicleVisual{min-height:245px;border:1px solid #2b363e;border-radius:14px;padding:14px;position:relative;overflow:hidden;background:linear-gradient(90deg,#05090de8,#05090d78),url('https://raw.githubusercontent.com/ldutrald5/Dutra-Sales-OG-Sitem/dutra-os-ui-v3-premium/apps/sistema-og/assets/premium/04-caminhoes-pesados.png') center/cover}.tcVehicleVisual h3{margin:0;font-size:19px}.tcVehicleVisual p{margin:5px 0;color:#a2acb4;font-size:9px;max-width:75%;line-height:1.45}.tcAxles{position:absolute;left:14px;right:14px;bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.tcAxle{border:1px solid #665619;border-radius:9px;background:#0c0e0ddd;padding:8px}.tcAxle small{display:block;color:#8e998f;font-size:7px}.tcAxle strong{display:block;color:#ffd400;font-size:11px;margin-top:3px}
 .tcSupports{display:grid;gap:7px}.tcSupport{border:1px solid #27323a;border-radius:11px;background:#091015;padding:10px;display:grid;grid-template-columns:1fr auto;gap:8px}.tcSupport b{font-size:10px}.tcSupport small{display:block;color:#85919a;font-size:8px;line-height:1.4;margin-top:3px}.tcSupportCode{font-family:ui-monospace,monospace;color:#ffd400;font-size:12px;font-weight:900}.tcSupport.validate{border-color:#61433a;background:#160e0d}.tcSupport.validate .tcSupportCode{color:#ff8b72}
 .tcStatus{font-size:7px;font-weight:900;border:1px solid #2e5c35;border-radius:999px;color:#70e87b;padding:4px 6px}.tcStatus.warn{color:#ffb38a;border-color:#6a4030}
 .tcBudget{border:1px solid #5c4d19;border-radius:15px;background:linear-gradient(145deg,#201b08,#091015);padding:13px}.tcBudgetTop{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.tcBudgetStat{border:1px solid #333c31;border-radius:10px;background:#091015;padding:9px}.tcBudgetStat small{display:block;color:#7f8b94;font-size:7px}.tcBudgetStat strong{display:block;font-size:15px;margin-top:3px}.tcBudgetStat.total strong{color:#ffd400}
 .tcTable{margin-top:10px;border:1px solid #27323a;border-radius:11px;overflow:hidden}.tcLine{display:grid;grid-template-columns:90px 1fr 60px 90px;gap:7px;align-items:center;padding:9px;border-bottom:1px solid #202a31;background:#091015}.tcLine:last-child{border-bottom:0}.tcLine b{font-size:9px}.tcLine small{display:block;color:#7f8b94;font-size:7px;margin-top:2px}.tcLine .code{font-family:ui-monospace,monospace;color:#ffd400;font-size:9px;font-weight:900}.tcLine .qty{text-align:center}.tcLine .val{text-align:right;font-size:9px}.tcLine.warn{background:#160e0d}
 .tcCatalogBar{display:grid;grid-template-columns:1fr 150px;gap:7px}.tcCatalog{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:8px;max-height:330px;overflow:auto}.tcPart{border:1px solid #27323a;border-radius:10px;background:#091015;padding:9px;display:grid;grid-template-columns:1fr auto;gap:7px}.tcPart b{font-size:9px}.tcPart small{display:block;color:#7f8b94;font-size:7px;margin-top:2px}.tcPart button{height:31px;border:1px solid #665619;border-radius:7px;background:#171506;color:#ffd400;font-size:8px;font-weight:900}.tcExtras{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}.tcExtra{border:1px solid #4c421a;border-radius:999px;background:#171506;color:#e7dc8b;padding:5px 7px;font-size:7px}.tcExtra button{border:0;background:transparent;color:#ff8d8d;margin-left:5px}
 .tcActions{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.tcActions button{height:43px;border:1px solid #34404a;border-radius:9px;background:#0d1419;color:#fff;font-size:8px;font-weight:900}.tcActions .primary{background:#ffd400;color:#111;border-color:#ffd400}.tcNotice{margin-top:8px;color:#8c979f;font-size:7px;line-height:1.5}
 .tcEmpty{padding:17px;border:1px dashed #34404a;border-radius:11px;color:#87939c;font-size:9px;text-align:center}
 @media(max-width:620px){.tcVehicleGrid,.tcCatalog{grid-template-columns:1fr}.tcControls{grid-template-columns:1fr 1fr}.tcResultGrid{grid-template-columns:1fr}.tcBudgetTop{grid-template-columns:1fr 1fr}.tcLine{grid-template-columns:72px 1fr 45px}.tcLine .val{grid-column:2/4;text-align:left}.tcActions{grid-template-columns:1fr 1fr}.tcCatalogBar{grid-template-columns:1fr}.tcAxles{grid-template-columns:repeat(2,1fr)}}
 `;document.head.appendChild(s);
}

function rules(){return D().vehicleConsultantRules||[]}
function rule(){return rules().find(r=>r.id===state.ruleId)||null}
function clientContact(){
 const lead=selected();if(!lead)return{};
 const ps=people(lead.id);
 return ps.find(p=>['OWNER','DIRECTOR','FLEET_MANAGER','MAINTENANCE_MANAGER','PROCUREMENT'].includes(clean(p.roleCategory).toUpperCase()))||ps[0]||{};
}
function restoreFromClient(){
 const lead=selected(),draft=lead?.technicalDraft;
 if(!draft)return;
 state={...state,...draft,answers:{...(draft.answers||{})},extras:Array.isArray(draft.extras)?draft.extras.map(x=>({...x})):[]};
}
function currentQuote(){
 const r=rule();if(!r)return null;
 try{return E().buildQuote(r,state.answers,{qty:state.qty,psi:state.psi,includeFront:state.includeFront,tierKey:state.tierKey,installments:state.installments,extras:state.extras},D())}catch{return null}
}
function axleChips(r){
 const a=E()?.adjustedAxles?.(r,state.answers)||r.axles||{};
 return Object.entries(a).filter(([,n])=>Number(n)>0).map(([k,n])=>`<span class="tcChip">${esc(k)} × ${n}</span>`).join('');
}
function ensureScreen(){
 const screen=$('#application');if(!screen||screen.dataset.tc==='1')return;
 screen.dataset.tc='1';
 const head=$('.pageHead',screen);[...screen.children].forEach(ch=>{if(ch!==head)ch.remove()});
 if(head){$('.titles h1',head).textContent='Aplicação + Peças';$('.titles p',head).textContent='Do veículo ao orçamento em poucos passos';const menu=$('.iconBtn:last-child',head);if(menu)menu.style.display='none'}
 screen.insertAdjacentHTML('beforeend','<div id="tcRoot"></div>');
 screen.addEventListener('click',handleClick);
 screen.addEventListener('change',handleChange);
 screen.addEventListener('input',handleInput);
}

function render(){
 ensureScreen();const root=$('#tcRoot');if(!root)return;
 const lead=selected(),r=rule(),q=currentQuote(),ready=q?.technicallyReady;
 root.innerHTML=`
 <section class="tcHero">
   <div class="tcHeroTop"><div><div style="color:#ffd400;font-size:8px;font-weight:900;letter-spacing:.13em">CONFIGURADOR TÉCNICO OG</div><h2>Veículo → suporte → peças → orçamento.</h2><p>Escolha o conjunto, responda somente o necessário e deixe o sistema organizar códigos, quantidades e pré-orçamento.</p></div><span class="tcClient">${esc(lead?.empresa||lead?.nome||'SEM CLIENTE')}</span></div>
   <div class="tcSteps"><div class="tcStep ${!r?'active':''}"><small>PASSO 1</small><b>Escolher veículo</b></div><div class="tcStep ${r&&!ready?'active':''}"><small>PASSO 2</small><b>Validar aplicação</b></div><div class="tcStep ${r&&ready?'active':''}"><small>PASSO 3</small><b>Orçar e enviar</b></div></div>
 </section>

 <section class="tcSection"><div class="tcSectionHead"><div><h2>1. Qual é o veículo?</h2><p style="text-align:left">Busque por 6x2, Rodotrem, 3/4, carreta...</p></div><span class="tcChip yellow">${rules().length} configurações OG</span></div>
 <input class="tcSearch" id="tcVehicleSearch" value="${attr(state.search)}" placeholder="Buscar veículo, configuração ou aplicação…"><div class="tcVehicleGrid" id="tcVehicleGrid"></div></section>

 ${r?`
 <section class="tcSection"><div class="tcSectionHead"><div><h2>2. Configure sem complicação</h2><p style="text-align:left">${esc(r.name)} · ${esc(r.category)}</p></div><span class="tcStatus ${ready?'':'warn'}">${ready?'APLICAÇÃO PREENCHIDA':'FALTA VALIDAR'}</span></div>
 <div class="tcControls">
   <div class="tcField"><label>QUANTIDADE</label><input id="tcQty" type="number" min="1" value="${state.qty}"></div>
   <div class="tcField"><label>PRESSÃO</label><select id="tcPsi"><option value="110">110 PSI</option><option value="115">115 PSI</option><option value="120">120 PSI</option></select></div>
   <div class="tcField"><label>TABELA</label><select id="tcTier">${Object.values(D().pricingTiers||{}).filter(x=>x.id!=='locacao').map(t=>`<option value="${attr(t.id)}">${esc(t.name)}</option>`).join('')}</select></div>
   <div class="tcField"><label>PARCELAS</label><select id="tcInstallments">${[1,2,3,4,5,6,8,10].map(n=>`<option value="${n}">${n===1?'À vista':n+'x'}</option>`).join('')}</select></div>
   <label class="tcCheck"><input id="tcFront" type="checkbox" ${state.includeFront?'checked':''}> Incluir dianteira</label>
 </div>
 <div class="tcQuestions" style="margin-top:9px">${renderQuestions(r)}</div></section>

 <section class="tcSection"><div class="tcSectionHead"><div><h2>3. Resultado técnico</h2><p style="text-align:left">Só códigos sustentados pela base técnica; casos ambíguos ficam marcados para validação.</p></div></div>
 <div class="tcResultGrid">
   <div class="tcVehicleVisual"><h3>${esc(r.name)}</h3><p>${esc((r.applications||[]).join(' · '))}</p><div class="tcAxles">${Object.entries(q?.axles||{}).filter(([,n])=>n>0).map(([k,n])=>`<div class="tcAxle"><small>${esc(k.toUpperCase())}</small><strong>${n} eixo(s)</strong></div>`).join('')}</div></div>
   <div class="tcSupports">${renderSupports(q)}</div>
 </div></section>

 <section class="tcSection tcBudget"><div class="tcSectionHead"><div><h2>Orçamento rápido</h2><p style="text-align:left">Cálculo operacional baseado nas tabelas atuais do DUTRA OS.</p></div><span class="tcStatus ${ready?'':'warn'}">${ready?'PRONTO PARA REVISÃO':'REVISAR SUPORTES'}</span></div>
 <div class="tcBudgetTop">
   <div class="tcBudgetStat"><small>PNEUS ATENDIDOS</small><strong>${q?.totalTires||0}</strong></div>
   <div class="tcBudgetStat"><small>PEÇAS</small><strong>${q?.totalPieces||0}</strong></div>
   <div class="tcBudgetStat"><small>CONDIÇÃO</small><strong>${q?.installments||1}x ${money(q?.installmentValue||0)}</strong></div>
   <div class="tcBudgetStat total"><small>TOTAL ESTIMADO</small><strong>${money(q?.total||0)}</strong></div>
 </div>
 <div class="tcTable">${renderLines(q)}</div>
 ${state.extras.length?'<div class="tcExtras">'+state.extras.map(x=>`<span class="tcExtra">${esc(x.code)} × ${x.qty}<button data-extra-remove="${attr(x.code)}">×</button></span>`).join('')+'</div>':''}
 </section>

 <section class="tcSection"><div class="tcSectionHead"><div><h2>Adicionar peça / ferramenta</h2><p style="text-align:left">Busque pelo código ERP, código EQ ou nome.</p></div></div>
 <div class="tcCatalogBar"><input class="tcSearch" id="tcCatalogSearch" value="${attr(state.catalogSearch)}" placeholder="Ex.: EQ-700, mangueira, chave…"><select class="tcSearch" id="tcCatalogCategory"><option value="all">Todas categorias</option>${[...new Set((D().catalog||[]).map(x=>x.category))].map(cat=>`<option value="${attr(cat)}">${esc(cat)}</option>`).join('')}</select></div>
 <div class="tcCatalog" id="tcCatalog"></div></section>

 <div class="tcActions">
   <button id="tcSave">Salvar na conta</button>
   <button id="tcCopy">Copiar resumo</button>
   <button id="tcWhatsapp">WhatsApp</button>
   <button class="primary" id="tcOfficial">Abrir cotação oficial</button>
 </div>
 <div class="tcNotice">Este é um pré-orçamento para agilizar a operação. Antes de enviar ao cliente, revise aplicação, estoque, frete, condição e preços no motor oficial de cotação. Pontos marcados “VALIDAR” não são tratados como aplicação confirmada.</div>
 `:'<section class="tcSection"><div class="tcEmpty">Escolha um tipo de veículo acima. O restante da tela aparece automaticamente.</div></section>'}
 `;
 renderVehicleGrid();if(r){setValues();renderCatalog();bindActions()}
 lucide?.createIcons?.();
}

function renderVehicleGrid(){
 const root=$('#tcVehicleGrid');if(!root)return;const q=clean(state.search).toLowerCase();
 const rows=rules().filter(r=>!q||[r.name,r.category,...(r.keywords||[]),...(r.applications||[])].some(v=>clean(v).toLowerCase().includes(q)));
 root.innerHTML=rows.length?rows.map(r=>`<button class="tcVehicle ${r.id===state.ruleId?'active':''}" data-rule="${attr(r.id)}"><small>${esc(r.category)}</small><b>${esc(r.name)}</b><p>${esc((r.applications||[]).slice(0,4).join(' · '))}</p><div class="ax">${axleChips(r)}</div></button>`).join(''):'<div class="tcEmpty">Nenhuma configuração encontrada.</div>';
}
function renderQuestions(r){
 return E().visibleQuestions(r,state.answers).map(q=>{
  const val=state.answers[q.id];
  return `<div class="tcQuestion"><label>${esc(q.question)}</label><div class="tcOptions">${(q.options||[]).map(o=>`<button class="tcOption ${String(val)===String(o.value)?'active':''}" data-answer-q="${attr(q.id)}" data-answer-v="${attr(o.value)}">${esc(o.label)}${o.hint?'<span>'+esc(o.hint)+'</span>':''}</button>`).join('')}</div></div>`
 }).join('');
}
function renderSupports(q){
 if(!q)return'<div class="tcEmpty">Sem resultado.</div>';
 return q.positions.length?q.positions.map(p=>{
   const item=p.code?E().catalogItem(D(),p.code):null,qty=p.qtyPerVehicle*q.qty;
   return `<div class="tcSupport ${p.status==='CONFIRMED'?'':'validate'}"><div><div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap"><b>${esc(p.position.toUpperCase())}</b><span class="tcStatus ${p.status==='CONFIRMED'?'':'warn'}">${p.status==='CONFIRMED'?'CONFIRMADO':'VALIDAR'}</span></div><small>${esc(item?.name||p.reason)}${item?.internalCode?' · ERP '+esc(item.internalCode):''}<br>${esc(p.reason||'')}</small></div><div style="text-align:right"><div class="tcSupportCode">${esc(p.code||'—')}</div><small>${qty} un</small></div></div>`
 }).join(''):'<div class="tcEmpty">Nenhum suporte necessário nesta seleção.</div>';
}
function renderLines(q){
 if(!q?.lines?.length)return'<div class="tcEmpty">Nenhum item calculado.</div>';
 return q.lines.map(x=>`<div class="tcLine ${x.unresolved?'warn':''}"><div class="code">${esc(x.code)}</div><div><b>${esc(x.name)}</b><small>${esc([x.position,x.internalCode?'ERP '+x.internalCode:''].filter(Boolean).join(' · '))}</small></div><div class="qty">× ${x.qty}</div><div class="val">${money(x.total)}</div></div>`).join('');
}
function renderCatalog(){
 const root=$('#tcCatalog');if(!root)return;
 const items=E().searchCatalog(D(),state.catalogSearch,state.catalogCategory);
 root.innerHTML=items.map(x=>`<div class="tcPart"><div><b><span style="color:#ffd400;font-family:ui-monospace,monospace">${esc(x.code)}</span> · ${esc(x.name)}</b><small>${esc(x.internalCode?'ERP '+x.internalCode+' · ':'')}${esc(x.category)} · ${money(E().tierUnitPrice(x,D().pricingTiers?.[state.tierKey]||{}))}</small></div><button data-extra-add="${attr(x.code)}">+ adicionar</button></div>`).join('')||'<div class="tcEmpty">Nenhuma peça encontrada.</div>';
}
function setValues(){
 if($('#tcPsi'))$('#tcPsi').value=String(state.psi);
 if($('#tcTier'))$('#tcTier').value=state.tierKey;
 if($('#tcInstallments'))$('#tcInstallments').value=String(state.installments);
 if($('#tcCatalogCategory'))$('#tcCatalogCategory').value=state.catalogCategory;
}
function handleClick(e){
 const ruleBtn=e.target.closest('[data-rule]');if(ruleBtn){state.ruleId=ruleBtn.dataset.rule;state.answers={};render();setTimeout(()=>$('.tcControls')?.scrollIntoView({behavior:'smooth',block:'center'}),50);return}
 const ans=e.target.closest('[data-answer-q]');if(ans){state.answers[ans.dataset.answerQ]=ans.dataset.answerV;render();return}
 const add=e.target.closest('[data-extra-add]');if(add){const code=add.dataset.extraAdd,found=state.extras.find(x=>x.code===code);if(found)found.qty++;else state.extras.push({code,qty:1});render();return}
 const rem=e.target.closest('[data-extra-remove]');if(rem){state.extras=state.extras.filter(x=>x.code!==rem.dataset.extraRemove);render();return}
}
function handleChange(e){
 if(e.target.id==='tcQty'){state.qty=Math.max(1,Number(e.target.value)||1);render()}
 if(e.target.id==='tcPsi'){state.psi=Number(e.target.value);render()}
 if(e.target.id==='tcTier'){state.tierKey=e.target.value;render()}
 if(e.target.id==='tcInstallments'){state.installments=Number(e.target.value);render()}
 if(e.target.id==='tcFront'){state.includeFront=e.target.checked;render()}
 if(e.target.id==='tcCatalogCategory'){state.catalogCategory=e.target.value;renderCatalog()}
}
function handleInput(e){
 if(e.target.id==='tcVehicleSearch'){state.search=e.target.value;renderVehicleGrid()}
 if(e.target.id==='tcCatalogSearch'){state.catalogSearch=e.target.value;renderCatalog()}
}
function bindActions(){
 $('#tcSave')?.addEventListener('click',saveDraft);
 $('#tcCopy')?.addEventListener('click',copySummary);
 $('#tcWhatsapp')?.addEventListener('click',sendWhatsApp);
 $('#tcOfficial')?.addEventListener('click',openOfficial);
}
async function saveDraft(){
 const lead=selected(),q=currentQuote();if(!lead||!q)return notify('Selecione um cliente no Cliente 360° antes de salvar.');
 const draft={ruleId:state.ruleId,answers:{...state.answers},qty:state.qty,psi:state.psi,includeFront:state.includeFront,tierKey:state.tierKey,installments:state.installments,extras:state.extras.map(x=>({...x})),quoteSummary:{total:q.total,totalPieces:q.totalPieces,totalTires:q.totalTires,technicallyReady:q.technicallyReady},updatedAt:new Date().toISOString()};
 const updated=(C().getLeads()||[]).map(l=>String(l.id)===String(lead.id)?{...l,technicalDraft:draft,vehicleTypes:[...new Set([...(Array.isArray(l.vehicleTypes)?l.vehicleTypes:[]),q.vehicleName])]}:l);
 try{await C().commit({leads:updated},'Configuração técnica salva na conta.');notify('Configuração técnica salva.')}catch(err){notify('Não foi possível salvar: '+err.message)}
}
async function copySummary(){
 const q=currentQuote();if(!q)return;const text=E().summaryText(q,selected()||{});
 try{await navigator.clipboard.writeText(text);notify('Resumo técnico copiado.')}catch{notify('Não foi possível copiar automaticamente.')}
}
function sendWhatsApp(){
 const q=currentQuote(),lead=selected();if(!q)return;
 const contact=lead?clientContact():{},phone=contact.phone||contact.whatsapp||lead?.telefone||'';
 try{globalThis.DUTRA_WHATSAPP_ACTION?.open?.(phone,E().summaryText(q,lead||{}),{leadId:lead?.id||null});}catch(err){notify(err.message)}
}
function openOfficial(){
 const q=currentQuote(),lead=selected();if(!q)return;
 if(!lead)return notify('Selecione um cliente antes de abrir a cotação oficial.');
 if(!q.technicallyReady){notify('Ainda existem suportes ou respostas para validar antes da cotação oficial.');return}
 const technical={ruleId:q.ruleId,vehicleName:q.vehicleName,qty:q.qty,psi:q.psi,includeFront:q.includeFront,answers:q.answers,lines:q.lines.filter(x=>!x.unresolved).map(x=>({code:x.code,qty:x.qty})),totalTires:q.totalTires,totalPieces:q.totalPieces,estimatedTotal:q.total};
 try{globalThis.DUTRA_QUOTE_HANDOFF?.launch?.(lead,clientContact(),{target:'_blank',tier:state.tierKey,installments:state.installments,technical});}catch(err){notify('Não foi possível abrir a cotação oficial: '+err.message)}
}
function boot(){
 addStyles();ensureScreen();restoreFromClient();render();
 window.addEventListener('dutra:state',()=>{if($('#application')?.classList.contains('active'))render()});
 window.addEventListener('dutra:client',()=>{state.ruleId='';state.answers={};state.extras=[];restoreFromClient();render()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();