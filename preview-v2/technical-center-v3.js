(() => {
'use strict';

const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clean=v=>String(v??'').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const D=()=>typeof OG_DATA!=='undefined'?OG_DATA:(globalThis.OG_DATA||{});
const E=()=>globalThis.DUTRA_TECHNICAL_QUOTE;
const C=()=>globalThis.DUTRA_CORE;
const selected=()=>C()?.getSelectedLead?.()||null;
const people=id=>(C()?.getState?.()?.operations?.contacts||[]).filter(p=>String(p.leadId||p.companyId)===String(id));
const notify=m=>typeof globalThis.showToast==='function'?globalThis.showToast(m):console.log('[TECH]',m);

let state={
  mode:'guided',
  ruleId:'',
  answers:{},
  qty:1,
  psi:120,
  includeFront:false,
  tierKey:'lead_ie',
  installments:6,
  search:'',
  catalogSearch:'',
  catalogCategory:'all',
  lineOverrides:{},
  manualLines:[],
  manualVehicleName:'',
  manualTires:0,
  manualNote:''
};

function id(prefix='M'){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function rules(){return D().vehicleConsultantRules||[]}
function rule(){return rules().find(r=>r.id===state.ruleId)||null}
function tier(){return D().pricingTiers?.[state.tierKey]||D().pricingTiers?.lead_ie||{}}
function clientContact(){
  const lead=selected();if(!lead)return{};
  const ps=people(lead.id);
  return ps.find(p=>['OWNER','DIRECTOR','FLEET_MANAGER','MAINTENANCE_MANAGER','PROCUREMENT'].includes(clean(p.roleCategory).toUpperCase()))||ps[0]||{};
}

function addStyles(){
  if($('#technical-center-v3-style'))return;
  const s=document.createElement('style');s.id='technical-center-v3-style';s.textContent=`
  .tcHero{border:1px solid #584b19;border-radius:18px;padding:17px;background:radial-gradient(circle at 90% 0,#6a520d55,transparent 34%),linear-gradient(145deg,#211b08,#081014 68%)}
  .tcHeroTop{display:flex;justify-content:space-between;gap:12px;align-items:start}.tcHero h2{margin:5px 0;font-size:25px;line-height:1.18}.tcHero p{margin:0;color:#9ca7af;font-size:10px;line-height:1.5}.tcClient{font-size:8px;font-weight:900;border:1px solid #5a4d1b;border-radius:999px;color:#ffd400;padding:6px 8px;white-space:nowrap}
  .tcMode{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:13px}.tcMode button{height:41px;border:1px solid #34404a;border-radius:10px;background:#0b1217;color:#aeb8bf;font-size:9px;font-weight:900}.tcMode button.active{background:#ffd400;color:#111;border-color:#ffd400}
  .tcSteps{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:9px}.tcStep{border:1px solid #2d3840;border-radius:10px;background:#091015;padding:9px}.tcStep small{display:block;color:#78858e;font-size:7px}.tcStep b{display:block;font-size:10px;margin-top:3px}.tcStep.active{border-color:#7a6515;background:#181506}.tcStep.active b{color:#ffd400}
  .tcSection{margin-top:18px}.tcSectionHead{display:flex;justify-content:space-between;gap:10px;align-items:end;margin-bottom:9px}.tcSectionHead h2{margin:0;font-size:18px}.tcSectionHead p{margin:0;color:#7f8b94;font-size:8px;text-align:right}
  .tcSearch{height:44px;width:100%;border:1px solid #334049;border-radius:10px;background:#080d11;color:#fff;padding:0 11px;outline:0}
  .tcVehicleGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:9px}.tcVehicle{border:1px solid #28333b;border-radius:13px;background:#091015;color:#e8edf0;padding:12px;text-align:left;min-height:104px}.tcVehicle:hover,.tcVehicle.active{border-color:#8b7315;background:#181506}.tcVehicle small{display:block;color:#7f8b94;font-size:7px;text-transform:uppercase;font-weight:900;letter-spacing:.06em}.tcVehicle b{display:block;font-size:12px;margin-top:4px}.tcVehicle p{margin:5px 0 0;color:#8b969e;font-size:8px;line-height:1.4}.tcVehicle .ax{margin-top:7px;display:flex;gap:4px;flex-wrap:wrap}
  .tcChip{font-size:7px;border:1px solid #354149;border-radius:999px;color:#aeb8bf;padding:4px 6px}.tcChip.yellow{color:#ffd400;border-color:#5c4d19}.tcFallback{margin-top:8px;border:1px dashed #4e441d;border-radius:11px;padding:11px;background:#141408}.tcFallback b{display:block;font-size:10px}.tcFallback p{margin:4px 0 9px;color:#8f999f;font-size:8px;line-height:1.4}.tcFallback button{height:36px;border:1px solid #ffd400;border-radius:8px;background:#ffd400;color:#111;font-size:8px;font-weight:900;padding:0 10px}
  .tcControls{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;border:1px solid #27323a;border-radius:13px;background:#091015;padding:11px}.tcField label{display:block;color:#7f8b94;font-size:7px;margin-bottom:4px;font-weight:900}.tcField input,.tcField select{height:39px;width:100%;border:1px solid #34404a;border-radius:8px;background:#080d11;color:#fff;padding:0 8px}.tcCheck{height:39px;border:1px solid #34404a;border-radius:8px;background:#080d11;color:#c7d0d6;display:flex;align-items:center;gap:7px;padding:0 8px;font-size:8px}.tcCheck input{accent-color:#ffd400}
  .tcQuestions{display:grid;gap:9px}.tcQuestion{border:1px solid #27323a;border-radius:12px;background:#091015;padding:11px}.tcQuestion label{display:block;font-size:10px;font-weight:800;margin-bottom:8px}.tcOptions{display:flex;gap:6px;flex-wrap:wrap}.tcOption{border:1px solid #344049;border-radius:9px;background:#0b1217;color:#c7d0d6;padding:8px 9px;font-size:8px;font-weight:800;text-align:left}.tcOption.active{background:#ffd400;color:#111;border-color:#ffd400}.tcOption span{display:block;font-size:7px;font-weight:600;opacity:.72;margin-top:3px}
  .tcResultGrid{display:grid;grid-template-columns:1.05fr .95fr;gap:9px}.tcVehicleVisual{min-height:245px;border:1px solid #2b363e;border-radius:14px;padding:14px;position:relative;overflow:hidden;background:linear-gradient(90deg,#05090de8,#05090d78),url('https://raw.githubusercontent.com/ldutrald5/Dutra-Sales-OG-Sitem/dutra-os-ui-v3-premium/apps/sistema-og/assets/premium/04-caminhoes-pesados.png') center/cover}.tcVehicleVisual h3{margin:0;font-size:19px}.tcVehicleVisual p{margin:5px 0;color:#a2acb4;font-size:9px;max-width:75%;line-height:1.45}.tcAxles{position:absolute;left:14px;right:14px;bottom:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.tcAxle{border:1px solid #665619;border-radius:9px;background:#0c0e0ddd;padding:8px}.tcAxle small{display:block;color:#8e998f;font-size:7px}.tcAxle strong{display:block;color:#ffd400;font-size:11px;margin-top:3px}
  .tcSupports{display:grid;gap:7px}.tcSupport{border:1px solid #27323a;border-radius:11px;background:#091015;padding:10px;display:grid;grid-template-columns:1fr auto;gap:8px}.tcSupport b{font-size:10px}.tcSupport small{display:block;color:#85919a;font-size:8px;line-height:1.4;margin-top:3px}.tcSupportCode{font-family:ui-monospace,monospace;color:#ffd400;font-size:12px;font-weight:900}.tcSupport.validate{border-color:#61433a;background:#160e0d}.tcSupport.validate .tcSupportCode{color:#ff8b72}.tcStatus{font-size:7px;font-weight:900;border:1px solid #2e5c35;border-radius:999px;color:#70e87b;padding:4px 6px}.tcStatus.warn{color:#ffb38a;border-color:#6a4030}
  .tcManualBox{border:1px solid #5a4b1a;border-radius:14px;background:linear-gradient(145deg,#191708,#091015);padding:12px}.tcManualGrid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:7px}.tcManualGrid textarea{min-height:76px;resize:vertical}.tcManualHint{margin-top:8px;color:#9a9f8a;font-size:8px;line-height:1.5}
  .tcBudget{border:1px solid #5c4d19;border-radius:15px;background:linear-gradient(145deg,#201b08,#091015);padding:13px}.tcBudgetTop{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.tcBudgetStat{border:1px solid #333c31;border-radius:10px;background:#091015;padding:9px}.tcBudgetStat small{display:block;color:#7f8b94;font-size:7px}.tcBudgetStat strong{display:block;font-size:15px;margin-top:3px}.tcBudgetStat.total strong{color:#ffd400}
  .tcTable{margin-top:10px;border:1px solid #27323a;border-radius:11px;overflow:hidden}.tcLine{display:grid;grid-template-columns:82px minmax(120px,1fr) 70px 92px 84px 30px;gap:7px;align-items:center;padding:9px;border-bottom:1px solid #202a31;background:#091015}.tcLine:last-child{border-bottom:0}.tcLine b{font-size:9px}.tcLine small{display:block;color:#7f8b94;font-size:7px;margin-top:2px}.tcLine .code{font-family:ui-monospace,monospace;color:#ffd400;font-size:9px;font-weight:900}.tcLine input{height:34px;width:100%;border:1px solid #34404a;border-radius:7px;background:#080d11;color:#fff;padding:0 6px;font-size:8px}.tcLine .val{text-align:right;font-size:9px}.tcLine .remove{height:30px;border:1px solid #4f2a2d;border-radius:7px;background:#160c0d;color:#ff858b}.tcLine.warn{background:#160e0d}.tcLine.manual{background:#0d1216}.tcLineEdited{color:#ffd400;font-size:6px;font-weight:900}
  .tcBudgetToolbar{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.tcBudgetToolbar button{height:34px;border:1px solid #36424a;border-radius:8px;background:#0c1318;color:#cad2d7;padding:0 9px;font-size:8px;font-weight:900}.tcBudgetToolbar button.yellow{border-color:#6c5a18;color:#ffd400;background:#171506}
  .tcCatalogBar{display:grid;grid-template-columns:1fr 150px;gap:7px}.tcCatalog{display:grid;grid-template-columns:repeat(2,1fr);gap:7px;margin-top:8px;max-height:330px;overflow:auto}.tcPart{border:1px solid #27323a;border-radius:10px;background:#091015;padding:9px;display:grid;grid-template-columns:1fr auto;gap:7px}.tcPart b{font-size:9px}.tcPart small{display:block;color:#7f8b94;font-size:7px;margin-top:2px}.tcPart button{height:31px;border:1px solid #665619;border-radius:7px;background:#171506;color:#ffd400;font-size:8px;font-weight:900}
  .tcCustom{display:grid;grid-template-columns:100px 1fr 70px 100px auto;gap:6px;margin-top:8px}.tcCustom input{height:37px;border:1px solid #34404a;border-radius:8px;background:#080d11;color:#fff;padding:0 7px;font-size:8px}.tcCustom button{border:1px solid #ffd400;border-radius:8px;background:#ffd400;color:#111;font-size:8px;font-weight:900;padding:0 10px}
  .tcActions{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.tcActions button{height:43px;border:1px solid #34404a;border-radius:9px;background:#0d1419;color:#fff;font-size:8px;font-weight:900}.tcActions .primary{background:#ffd400;color:#111;border-color:#ffd400}.tcNotice{margin-top:8px;color:#8c979f;font-size:7px;line-height:1.5}.tcEmpty{padding:17px;border:1px dashed #34404a;border-radius:11px;color:#87939c;font-size:9px;text-align:center}
  .tcSticky{position:sticky;bottom:74px;z-index:40;margin:12px 0 4px;border:1px solid #665719;border-radius:13px;background:#0b0f11f2;backdrop-filter:blur(12px);padding:9px 10px;display:flex;justify-content:space-between;gap:10px;align-items:center;box-shadow:0 14px 40px #0009}.tcSticky small{display:block;color:#87939c;font-size:7px}.tcSticky strong{display:block;color:#ffd400;font-size:16px}.tcSticky button{height:38px;border:1px solid #ffd400;border-radius:8px;background:#ffd400;color:#111;padding:0 11px;font-size:8px;font-weight:900}
  @media(max-width:620px){.tcVehicleGrid,.tcCatalog{grid-template-columns:1fr}.tcControls{grid-template-columns:1fr 1fr}.tcResultGrid{grid-template-columns:1fr}.tcBudgetTop{grid-template-columns:1fr 1fr}.tcActions{grid-template-columns:1fr 1fr}.tcCatalogBar{grid-template-columns:1fr}.tcAxles{grid-template-columns:repeat(2,1fr)}.tcLine{grid-template-columns:68px 1fr 58px 76px 28px}.tcLine .val{grid-column:2/5;text-align:left}.tcLine .remove{grid-column:5;grid-row:1/3}.tcCustom{grid-template-columns:1fr 1fr}.tcCustom input:nth-child(2){grid-column:1/-1}.tcCustom button{height:38px}.tcManualGrid{grid-template-columns:1fr 1fr}.tcManualGrid .wide{grid-column:1/-1}}
  `;document.head.appendChild(s);
}

function axleChips(r){
  const a=E()?.adjustedAxles?.(r,state.answers)||r.axles||{};
  return Object.entries(a).filter(([,n])=>Number(n)>0).map(([k,n])=>`<span class="tcChip">${esc(k)} × ${n}</span>`).join('');
}
function ensureScreen(){
  const screen=$('#application');if(!screen||screen.dataset.tc==='2')return;
  screen.dataset.tc='2';
  const head=$('.pageHead',screen);[...screen.children].forEach(ch=>{if(ch!==head)ch.remove()});
  if(head){$('.titles h1',head).textContent='Aplicação + Peças';$('.titles p',head).textContent='Assistido quando ajuda. Manual quando você precisar.';const menu=$('.iconBtn:last-child',head);if(menu)menu.style.display='none'}
  screen.insertAdjacentHTML('beforeend','<div id="tcRoot"></div>');
  screen.addEventListener('click',handleClick);
  screen.addEventListener('change',handleChange);
  screen.addEventListener('input',handleInput);
}

function restoreFromClient(){
  const draft=selected()?.technicalDraft;if(!draft)return;
  state={
    ...state,
    ...draft,
    mode:draft.mode||'guided',
    answers:{...(draft.answers||{})},
    lineOverrides:{...(draft.lineOverrides||{})},
    manualLines:Array.isArray(draft.manualLines)?draft.manualLines.map(x=>({...x})):(Array.isArray(draft.extras)?draft.extras.map(x=>catalogManualLine(x.code,x.qty)):[])
  };
}

function catalogManualLine(code,qty=1){
  const item=E()?.catalogItem?.(D(),code),unit=E()?.tierUnitPrice?.(item,tier())||Number(item?.priceBase||0);
  return{id:id('MAN'),code:clean(code).toUpperCase(),name:item?.name||clean(code)||'Item manual',category:item?.category||'manual',internalCode:item?.internalCode||'',qty:Math.max(1,Number(qty)||1),unitPrice:unit,position:'extra',manual:true};
}
function baseManualQuote(){
  const name=clean(state.manualVehicleName)||clean(state.search)||'Pedido manual';
  const base={ruleId:'manual',vehicleName:name,category:'Manual',applications:[],answers:{},axles:{},qty:Math.max(1,Number(state.qty)||1),psi:Number(state.psi)||null,includeFront:state.includeFront,tierKey:state.tierKey,tierName:tier().name||state.tierKey,installments:state.installments,totalTires:Math.max(0,Number(state.manualTires)||0),positions:[],lines:[],missingAnswers:[],technicallyReady:state.manualLines.length>0,unresolved:[]};
  const q=E().applyManualAdjustments(base,{manualLines:state.manualLines,installments:state.installments});
  q.totalTires=base.totalTires;q.technicallyReady=q.lines.length>0;return q;
}
function currentQuote(){
  if(state.mode==='manual')return baseManualQuote();
  const r=rule();if(!r)return null;
  try{
    const base=E().buildQuote(r,state.answers,{qty:state.qty,psi:state.psi,includeFront:state.includeFront,tierKey:state.tierKey,installments:state.installments},D());
    return E().applyManualAdjustments(base,{overrides:state.lineOverrides,manualLines:state.manualLines,installments:state.installments});
  }catch{return null}
}

function render(){
  ensureScreen();const root=$('#tcRoot');if(!root)return;
  const lead=selected(),r=rule(),q=currentQuote(),ready=q?.technicallyReady;
  const count=rules().length;
  root.innerHTML=`
  <section class="tcHero">
    <div class="tcHeroTop"><div><div style="color:#ffd400;font-size:8px;font-weight:900;letter-spacing:.13em">CONFIGURADOR TÉCNICO OG</div><h2>Veículo → suporte → peças → orçamento.</h2><p>Use o modo assistido para ganhar velocidade. A qualquer momento você pode editar quantidades, preços e itens manualmente para adaptar o pedido ao cliente.</p></div><span class="tcClient">${esc(lead?.empresa||lead?.nome||'SEM CLIENTE')}</span></div>
    <div class="tcMode"><button data-mode="guided" class="${state.mode==='guided'?'active':''}">⚡ Assistido</button><button data-mode="manual" class="${state.mode==='manual'?'active':''}">✍️ Pedido manual</button></div>
    <div class="tcSteps"><div class="tcStep ${state.mode==='guided'&&!r?'active':''}"><small>PASSO 1</small><b>Escolher veículo</b></div><div class="tcStep ${state.mode==='guided'&&r&&!ready?'active':''}"><small>PASSO 2</small><b>Validar aplicação</b></div><div class="tcStep ${(state.mode==='manual'||(r&&ready))?'active':''}"><small>PASSO 3</small><b>Editar e orçar</b></div></div>
  </section>

  ${state.mode==='guided'?renderGuided(r,q,count):renderManual(q)}
  ${q?renderBudget(q):''}
  ${q?renderCatalogSection():''}
  ${q?renderActions(q):''}
  ${q?`<div class="tcSticky"><div><small>TOTAL ATUAL</small><strong>${money(q.total)}</strong></div><button id="tcStickyOfficial">Cotação oficial →</button></div>`:''}
  `;
  renderVehicleGrid();if(q){setValues();renderCatalog();bindActions()}
  lucide?.createIcons?.();
}

function renderGuided(r,q,count){
  const found=E().searchRules(rules(),state.search);
  return `
  <section class="tcSection"><div class="tcSectionHead"><div><h2>1. Qual é o veículo?</h2><p style="text-align:left">Pode escrever como você fala: “Scania traçado com cubo redutor”.</p></div><span class="tcChip yellow">${count} configurações OG</span></div>
  <input class="tcSearch" id="tcVehicleSearch" value="${attr(state.search)}" placeholder="Buscar veículo, marca, cubo redutor, 6x2, Rodotrem…"><div class="tcVehicleGrid" id="tcVehicleGrid"></div>
  </section>
  ${r?`
  <section class="tcSection"><div class="tcSectionHead"><div><h2>2. Configure sem complicação</h2><p style="text-align:left">${esc(r.name)} · ${esc(r.category)}</p></div><span class="tcStatus ${q?.technicallyReady?'':'warn'}">${q?.technicallyReady?'APLICAÇÃO PREENCHIDA':'FALTA VALIDAR'}</span></div>
    <div class="tcControls">
      <div class="tcField"><label>QUANTIDADE</label><input id="tcQty" type="number" min="1" value="${state.qty}"></div>
      <div class="tcField"><label>PRESSÃO</label><select id="tcPsi"><option value="110">110 PSI</option><option value="115">115 PSI</option><option value="120">120 PSI</option></select></div>
      <div class="tcField"><label>TABELA</label><select id="tcTier">${tierOptions()}</select></div>
      <div class="tcField"><label>PARCELAS</label><select id="tcInstallments">${installmentOptions()}</select></div>
      <label class="tcCheck"><input id="tcFront" type="checkbox" ${state.includeFront?'checked':''}> Incluir dianteira</label>
    </div>
    <div class="tcQuestions" style="margin-top:9px">${renderQuestions(r)}</div>
  </section>

  <section class="tcSection"><div class="tcSectionHead"><div><h2>3. Resultado técnico</h2><p style="text-align:left">O que estiver ambíguo fica marcado para validação — nunca chutado.</p></div></div>
    <div class="tcResultGrid">
      <div class="tcVehicleVisual"><h3>${esc(r.name)}</h3><p>${esc((r.applications||[]).join(' · '))}</p><div class="tcAxles">${Object.entries(q?.axles||{}).filter(([,n])=>n>0).map(([k,n])=>`<div class="tcAxle"><small>${esc(k.toUpperCase())}</small><strong>${n} eixo(s)</strong></div>`).join('')}</div></div>
      <div class="tcSupports">${renderSupports(q)}</div>
    </div>
    <div class="tcBudgetToolbar"><button class="yellow" id="tcConvertManual">Usar este cálculo como base manual</button></div>
  </section>`:''}
  `;
}

function renderManual(q){
  return `
  <section class="tcSection"><div class="tcSectionHead"><div><h2>Pedido manual</h2><p style="text-align:left">Para exceções, pedidos especiais, peças avulsas e ajustes cliente a cliente.</p></div><span class="tcChip yellow">VOCÊ CONTROLA</span></div>
    <div class="tcManualBox">
      <div class="tcManualGrid">
        <div class="tcField wide"><label>VEÍCULO / PEDIDO</label><input id="tcManualVehicle" value="${attr(state.manualVehicleName)}" placeholder="Ex.: Scania R450 6x4 + carreta 3 eixos"></div>
        <div class="tcField"><label>QTD. VEÍCULOS</label><input id="tcQty" type="number" min="1" value="${state.qty}"></div>
        <div class="tcField"><label>PNEUS ATENDIDOS</label><input id="tcManualTires" type="number" min="0" value="${state.manualTires}"></div>
        <div class="tcField"><label>TABELA</label><select id="tcTier">${tierOptions()}</select></div>
        <div class="tcField"><label>PARCELAS</label><select id="tcInstallments">${installmentOptions()}</select></div>
        <div class="tcField wide"><label>OBSERVAÇÃO</label><input id="tcManualNote" value="${attr(state.manualNote)}" placeholder="Ex.: pedido especial solicitado pelo cliente, alterar suporte do eixo 2…"></div>
      </div>
      <div class="tcManualHint">Nada aqui é travado pelo sistema. Você pode adicionar código do catálogo, criar item livre, alterar quantidade, alterar preço ou remover uma linha.</div>
    </div>
  </section>`;
}

function tierOptions(){
  return Object.values(D().pricingTiers||{}).filter(x=>x.id!=='locacao').map(t=>`<option value="${attr(t.id)}">${esc(t.name)}</option>`).join('');
}
function installmentOptions(){
  return [1,2,3,4,5,6,8,10].map(n=>`<option value="${n}">${n===1?'À vista':n+'x'}</option>`).join('');
}
function renderVehicleGrid(){
  const root=$('#tcVehicleGrid');if(!root)return;
  const rows=E().searchRules(rules(),state.search);
  root.innerHTML=rows.length?rows.map(r=>`<button class="tcVehicle ${r.id===state.ruleId?'active':''}" data-rule="${attr(r.id)}"><small>${esc(r.category)}</small><b>${esc(r.name)}</b><p>${esc((r.applications||[]).slice(0,4).join(' · '))}</p><div class="ax">${axleChips(r)}</div></button>`).join(''):(state.search?`<div class="tcFallback" style="grid-column:1/-1"><b>Não achei uma configuração exata para “${esc(state.search)}”.</b><p>O trabalho não precisa parar. Monte o pedido manualmente com esse nome e edite as peças como precisar.</p><button data-search-manual>Montar manualmente</button></div>`:'');
}
function renderQuestions(r){
  return E().visibleQuestions(r,state.answers).map(q=>{
    const val=state.answers[q.id];
    return `<div class="tcQuestion"><label>${esc(q.question)}</label><div class="tcOptions">${(q.options||[]).map(o=>`<button class="tcOption ${String(val)===String(o.value)?'active':''}" data-answer-q="${attr(q.id)}" data-answer-v="${attr(o.value)}">${esc(o.label)}${o.hint?'<span>'+esc(o.hint)+'</span>':''}</button>`).join('')}</div></div>`;
  }).join('');
}
function renderSupports(q){
  if(!q)return'<div class="tcEmpty">Sem resultado.</div>';
  return q.positions.length?q.positions.map(p=>{
    const item=p.code?E().catalogItem(D(),p.code):null,qty=p.qtyPerVehicle*q.qty;
    return `<div class="tcSupport ${p.status==='CONFIRMED'?'':'validate'}"><div><div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap"><b>${esc(p.position.toUpperCase())}</b><span class="tcStatus ${p.status==='CONFIRMED'?'':'warn'}">${p.status==='CONFIRMED'?'CONFIRMADO':'VALIDAR'}</span></div><small>${esc(item?.name||p.reason)}${item?.internalCode?' · ERP '+esc(item.internalCode):''}<br>${esc(p.reason||'')}</small></div><div style="text-align:right"><div class="tcSupportCode">${esc(p.code||'—')}</div><small>${qty} un</small></div></div>`;
  }).join(''):'<div class="tcEmpty">Nenhum suporte necessário nesta seleção.</div>';
}

function renderBudget(q){
  const edited=Object.keys(state.lineOverrides).length||state.manualLines.length;
  return `
  <section class="tcSection tcBudget"><div class="tcSectionHead"><div><h2>Orçamento rápido editável</h2><p style="text-align:left">Automação sugere. Você continua no controle do pedido.</p></div><span class="tcStatus ${q.technicallyReady?'':'warn'}">${q.technicallyReady?'PRONTO PARA REVISÃO':'REVISAR TÉCNICA'}</span></div>
    <div class="tcBudgetTop">
      <div class="tcBudgetStat"><small>PNEUS ATENDIDOS</small><strong>${q.totalTires||0}</strong></div>
      <div class="tcBudgetStat"><small>PEÇAS</small><strong>${q.totalPieces||0}</strong></div>
      <div class="tcBudgetStat"><small>CONDIÇÃO</small><strong>${q.installments||1}x ${money(q.installmentValue||0)}</strong></div>
      <div class="tcBudgetStat total"><small>TOTAL ATUAL</small><strong>${money(q.total||0)}</strong></div>
    </div>
    <div class="tcTable">${renderLines(q)}</div>
    <div class="tcBudgetToolbar">${state.mode==='guided'?'<button id="tcResetAuto">Restaurar quantidades/preços automáticos</button>':''}<button id="tcAddFree" class="yellow">+ Item livre</button>${edited?'<span class="tcChip yellow">PEDIDO EDITADO MANUALMENTE</span>':''}</div>
    <div class="tcCustom" id="tcCustomBox" style="display:none">
      <input id="tcCustomCode" placeholder="Código">
      <input id="tcCustomName" placeholder="Descrição do item">
      <input id="tcCustomQty" type="number" min="1" value="1" placeholder="Qtd">
      <input id="tcCustomPrice" type="number" min="0" step="0.01" placeholder="R$ unitário">
      <button id="tcCustomSave">Adicionar</button>
    </div>
  </section>`;
}
function renderLines(q){
  if(!q?.lines?.length)return'<div class="tcEmpty">Nenhum item no pedido. Use o catálogo ou adicione um item livre.</div>';
  return q.lines.map(x=>{
    const key=x.manual?'M:'+x.id:'A:'+x.code;
    return `<div class="tcLine ${x.unresolved?'warn':''} ${x.manual?'manual':''}">
      <div class="code">${esc(x.code)}${x.manualEdited||x.manual?'<div class="tcLineEdited">EDITADO</div>':''}</div>
      <div><b>${esc(x.name)}</b><small>${esc([x.position,x.internalCode?'ERP '+x.internalCode:'',x.unresolved?'VALIDAR APLICAÇÃO':''].filter(Boolean).join(' · '))}</small></div>
      <input data-line-qty="${attr(key)}" type="number" min="0" value="${x.qty}" aria-label="Quantidade">
      <input data-line-price="${attr(key)}" type="number" min="0" step="0.01" value="${Number(x.unitPrice||0).toFixed(2)}" aria-label="Valor unitário">
      <div class="val">${money(x.total)}</div>
      <button class="remove" data-line-remove="${attr(key)}" title="Remover">×</button>
    </div>`;
  }).join('');
}
function renderCatalogSection(){
  return `
  <section class="tcSection"><div class="tcSectionHead"><div><h2>Peças e ferramentas</h2><p style="text-align:left">Busque por código EQ, código ERP ou nome e adicione ao pedido.</p></div></div>
    <div class="tcCatalogBar"><input class="tcSearch" id="tcCatalogSearch" value="${attr(state.catalogSearch)}" placeholder="Ex.: EQ-700, 2218, mangueira, suporte…"><select class="tcSearch" id="tcCatalogCategory"><option value="all">Todas categorias</option>${[...new Set((D().catalog||[]).map(x=>x.category))].map(cat=>`<option value="${attr(cat)}">${esc(cat)}</option>`).join('')}</select></div>
    <div class="tcCatalog" id="tcCatalog"></div>
  </section>`;
}
function renderActions(q){
  return `
  <div class="tcActions">
    <button id="tcSave">Salvar na conta</button>
    <button id="tcCopy">Copiar resumo</button>
    <button id="tcWhatsapp">WhatsApp</button>
    <button class="primary" id="tcOfficial">Abrir cotação oficial</button>
  </div>
  <div class="tcNotice">O modo assistido acelera, mas nunca bloqueia a edição manual. Antes de enviar ao cliente, revise aplicação, estoque, frete, condição e preços no motor oficial. Pontos “VALIDAR” não são tratados como aplicação confirmada.</div>`;
}
function renderCatalog(){
  const root=$('#tcCatalog');if(!root)return;
  const items=E().searchCatalog(D(),state.catalogSearch,state.catalogCategory);
  root.innerHTML=items.map(x=>`<div class="tcPart"><div><b><span style="color:#ffd400;font-family:ui-monospace,monospace">${esc(x.code)}</span> · ${esc(x.name)}</b><small>${esc(x.internalCode?'ERP '+x.internalCode+' · ':'')}${esc(x.category)} · ${money(E().tierUnitPrice(x,tier()))}</small></div><button data-catalog-add="${attr(x.code)}">+ adicionar</button></div>`).join('')||'<div class="tcEmpty">Nenhuma peça encontrada.</div>';
}
function setValues(){
  if($('#tcPsi'))$('#tcPsi').value=String(state.psi);
  if($('#tcTier'))$('#tcTier').value=state.tierKey;
  if($('#tcInstallments'))$('#tcInstallments').value=String(state.installments);
  if($('#tcCatalogCategory'))$('#tcCatalogCategory').value=state.catalogCategory;
}
function bindActions(){
  $('#tcSave')?.addEventListener('click',saveDraft);
  $('#tcCopy')?.addEventListener('click',copySummary);
  $('#tcWhatsapp')?.addEventListener('click',sendWhatsApp);
  $('#tcOfficial')?.addEventListener('click',openOfficial);
  $('#tcStickyOfficial')?.addEventListener('click',openOfficial);
  $('#tcConvertManual')?.addEventListener('click',convertToManual);
  $('#tcResetAuto')?.addEventListener('click',()=>{state.lineOverrides={};render()});
  $('#tcAddFree')?.addEventListener('click',()=>{const box=$('#tcCustomBox');if(box)box.style.display=box.style.display==='none'?'grid':'none'});
  $('#tcCustomSave')?.addEventListener('click',addCustomLine);
}

function convertToManual(){
  const q=currentQuote();if(!q)return;
  state.manualVehicleName=q.vehicleName;
  state.manualTires=q.totalTires;
  state.manualLines=q.lines.filter(x=>!x.unresolved).map(x=>({id:id('MAN'),code:x.code,name:x.name,category:x.category,internalCode:x.internalCode||'',qty:x.qty,unitPrice:x.unitPrice,position:x.position||'manual',manual:true}));
  state.lineOverrides={};state.mode='manual';render();
  notify('Cálculo copiado para o modo manual. Agora você pode alterar qualquer linha.');
}
function addCatalogLine(code){
  const existing=state.manualLines.find(x=>x.code===code);
  if(existing)existing.qty+=1;else state.manualLines.push(catalogManualLine(code,1));
  render();
}
function addCustomLine(){
  const code=clean($('#tcCustomCode')?.value)||'MANUAL';
  const name=clean($('#tcCustomName')?.value)||'Item manual';
  const qty=Math.max(1,Number($('#tcCustomQty')?.value)||1);
  const unitPrice=Math.max(0,Number($('#tcCustomPrice')?.value)||0);
  state.manualLines.push({id:id('MAN'),code,name,category:'manual',internalCode:'',qty,unitPrice,position:'manual',manual:true});
  render();
}
function updateLine(key,field,value){
  if(key.startsWith('M:')){
    const row=state.manualLines.find(x=>String(x.id)===key.slice(2));if(!row)return;
    row[field]=field==='qty'?Math.max(0,Number(value)||0):Math.max(0,Number(value)||0);
    if(row.qty<=0)state.manualLines=state.manualLines.filter(x=>x!==row);
  }else if(key.startsWith('A:')){
    const code=key.slice(2),ov=state.lineOverrides[code]||{};
    ov[field]=field==='qty'?Math.max(0,Number(value)||0):Math.max(0,Number(value)||0);
    state.lineOverrides[code]=ov;
  }
  render();
}
function removeLine(key){
  if(key.startsWith('M:'))state.manualLines=state.manualLines.filter(x=>String(x.id)!==key.slice(2));
  else if(key.startsWith('A:'))state.lineOverrides[key.slice(2)]={...(state.lineOverrides[key.slice(2)]||{}),qty:0};
  render();
}

function handleClick(e){
  const mode=e.target.closest('[data-mode]');if(mode){state.mode=mode.dataset.mode;if(state.mode==='manual'&&!state.manualVehicleName)state.manualVehicleName=rule()?.name||state.search;render();return}
  const manualSearch=e.target.closest('[data-search-manual]');if(manualSearch){state.manualVehicleName=state.search;state.mode='manual';render();return}
  const ruleBtn=e.target.closest('[data-rule]');if(ruleBtn){state.ruleId=ruleBtn.dataset.rule;state.answers={};state.lineOverrides={};render();setTimeout(()=>$('.tcControls')?.scrollIntoView({behavior:'smooth',block:'center'}),50);return}
  const ans=e.target.closest('[data-answer-q]');if(ans){state.answers[ans.dataset.answerQ]=ans.dataset.answerV;state.lineOverrides={};render();return}
  const add=e.target.closest('[data-catalog-add]');if(add){addCatalogLine(add.dataset.catalogAdd);return}
  const rem=e.target.closest('[data-line-remove]');if(rem){removeLine(rem.dataset.lineRemove);return}
}
function handleChange(e){
  if(e.target.id==='tcQty'){state.qty=Math.max(1,Number(e.target.value)||1);if(state.mode==='guided')state.lineOverrides={};render();return}
  if(e.target.id==='tcPsi'){state.psi=Number(e.target.value);if(state.mode==='guided')state.lineOverrides={};render();return}
  if(e.target.id==='tcTier'){state.tierKey=e.target.value;if(state.mode==='guided')state.lineOverrides={};state.manualLines=state.manualLines.map(x=>x.category==='manual'?x:{...x,unitPrice:E().tierUnitPrice(E().catalogItem(D(),x.code),tier())});render();return}
  if(e.target.id==='tcInstallments'){state.installments=Number(e.target.value);render();return}
  if(e.target.id==='tcFront'){state.includeFront=e.target.checked;if(state.mode==='guided')state.lineOverrides={};render();return}
  if(e.target.id==='tcCatalogCategory'){state.catalogCategory=e.target.value;renderCatalog();return}
  if(e.target.matches('[data-line-qty]')){updateLine(e.target.dataset.lineQty,'qty',e.target.value);return}
  if(e.target.matches('[data-line-price]')){updateLine(e.target.dataset.linePrice,'unitPrice',e.target.value);return}
}
function handleInput(e){
  if(e.target.id==='tcVehicleSearch'){state.search=e.target.value;renderVehicleGrid();return}
  if(e.target.id==='tcCatalogSearch'){state.catalogSearch=e.target.value;renderCatalog();return}
  if(e.target.id==='tcManualVehicle'){state.manualVehicleName=e.target.value;return}
  if(e.target.id==='tcManualTires'){state.manualTires=Math.max(0,Number(e.target.value)||0);return}
  if(e.target.id==='tcManualNote'){state.manualNote=e.target.value;return}
}

async function saveDraft(){
  const lead=selected(),q=currentQuote();if(!lead||!q)return notify('Selecione um cliente no Cliente 360° antes de salvar.');
  const draft={
    mode:state.mode,ruleId:state.ruleId,answers:{...state.answers},qty:state.qty,psi:state.psi,includeFront:state.includeFront,tierKey:state.tierKey,installments:state.installments,
    search:state.search,lineOverrides:{...state.lineOverrides},manualLines:state.manualLines.map(x=>({...x})),manualVehicleName:state.manualVehicleName,manualTires:state.manualTires,manualNote:state.manualNote,
    quoteSummary:{vehicleName:q.vehicleName,total:q.total,totalPieces:q.totalPieces,totalTires:q.totalTires,technicallyReady:q.technicallyReady,editedManually:Boolean(Object.keys(state.lineOverrides).length||state.manualLines.length||state.mode==='manual')},
    updatedAt:new Date().toISOString()
  };
  const updated=(C().getLeads()||[]).map(l=>String(l.id)===String(lead.id)?{...l,technicalDraft:draft,vehicleTypes:[...new Set([...(Array.isArray(l.vehicleTypes)?l.vehicleTypes:[]),q.vehicleName])]}:l);
  try{await C().commit({leads:updated},'Configuração técnica salva na conta.');notify('Configuração salva no cliente.')}catch(err){notify('Não foi possível salvar: '+err.message)}
}
async function copySummary(){
  const q=currentQuote();if(!q)return;
  const base=E().summaryText(q,selected()||{}),extra=state.mode==='manual'&&state.manualNote?'\nObservação: '+state.manualNote:'';
  try{await navigator.clipboard.writeText(base+extra);notify('Resumo técnico copiado.')}catch{notify('Não foi possível copiar automaticamente.')}
}
function sendWhatsApp(){
  const q=currentQuote(),lead=selected();if(!q)return;
  const contact=lead?clientContact():{},phone=contact.phone||contact.whatsapp||lead?.telefone||'';
  const msg=E().summaryText(q,lead||{})+(state.manualNote?'\nObservação: '+state.manualNote:'');
  try{globalThis.DUTRA_WHATSAPP_ACTION?.open?.(phone,msg,{leadId:lead?.id||null});}catch(err){notify(err.message)}
}
function openOfficial(){
  const q=currentQuote(),lead=selected();if(!q)return;
  if(!lead)return notify('Selecione um cliente antes de abrir a cotação oficial.');
  if(state.mode==='guided'&&!q.technicallyReady){notify('Ainda existem pontos técnicos marcados como VALIDAR. Corrija ou converta para pedido manual.');return}
  if(!q.lines.length)return notify('Adicione pelo menos um item ao pedido.');
  const technical={
    ruleId:q.ruleId,vehicleName:q.vehicleName,qty:q.qty,psi:q.psi,includeFront:q.includeFront,answers:q.answers||{},
    lines:q.lines.filter(x=>!x.unresolved).map(x=>({code:x.code,qty:x.qty,unitPrice:x.unitPrice,name:x.name,manual:Boolean(x.manual||x.manualEdited)})),
    totalTires:q.totalTires,totalPieces:q.totalPieces,estimatedTotal:q.total,manualMode:state.mode==='manual',note:state.manualNote
  };
  try{globalThis.DUTRA_QUOTE_HANDOFF?.launch?.(lead,clientContact(),{target:'_blank',tier:state.tierKey,installments:state.installments,technical});}catch(err){notify('Não foi possível abrir a cotação oficial: '+err.message)}
}

function boot(){
  addStyles();ensureScreen();restoreFromClient();render();
  window.addEventListener('dutra:state',()=>{if($('#application')?.classList.contains('active'))render()});
  window.addEventListener('dutra:client',()=>{state={...state,mode:'guided',ruleId:'',answers:{},lineOverrides:{},manualLines:[],manualVehicleName:'',manualTires:0,manualNote:''};restoreFromClient();render()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();