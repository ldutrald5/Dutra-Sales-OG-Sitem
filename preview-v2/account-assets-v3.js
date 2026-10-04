(() => {
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clean=v=>String(v??'').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={FLEET:'Frota',VEHICLE:'Veículo',TIRE:'Pneu',EQUIPMENT:'Equipamento',FACILITY:'Estrutura',VISIT:'Visita',BUSINESS_CARD:'Cartão',CONVERSATION:'Conversa',COMMERCIAL_DOCUMENT:'Documento',LOGO:'Logo',COVER:'Capa',PROPOSAL_MATERIAL:'Proposta',REFERENCE:'Referência',OTHER:'Outro'};
let state={items:[],nextCursor:null,filter:'',loading:false,leadId:''};

function core(){return globalThis.DUTRA_CORE}
function selected(){return core()?.getSelectedLead?.()||null}
function notify(m){if(typeof globalThis.showToast==='function')globalThis.showToast(m)}
function refParams(lead){
  const id=clean(lead?.companyId||lead?.company_id||lead?.canonicalCompanyId);
  return /^[0-9a-f-]{36}$/i.test(id)?{companyId:id}:{legacyLeadId:clean(lead?.id)};
}
function addStyles(){
  if($('#account-assets-v3-style'))return;
  const s=document.createElement('style');s.id='account-assets-v3-style';
  s.textContent='.assetHead{display:flex;gap:8px;align-items:center;margin-bottom:10px}.assetHead>div{flex:1}.assetHead h2{margin:0;font-size:18px}.assetHead small{color:#8b969f;font-size:9px}.assetBtn{height:42px;border:1px solid #3a4650;border-radius:10px;background:#0b1217;color:#eef2f4;padding:0 12px;font-size:9px;font-weight:900}.assetBtn.primary{background:#ffd400;border-color:#ffd400;color:#111}.assetFilters{display:flex;gap:6px;overflow:auto;margin-bottom:10px}.assetChip{flex:0 0 auto;height:31px;border:1px solid #2f3b43;border-radius:999px;background:#091015;color:#aeb8bf;padding:0 9px;font-size:8px}.assetChip.active{border-color:#776315;color:#ffd400;background:#211b08}.assetComposer{display:none;padding:11px;border:1px solid #35414a;border-radius:12px;background:#091015;margin-bottom:10px}.assetComposer.open{display:block}.assetComposerRow{display:grid;grid-template-columns:1fr 1fr;gap:7px}.assetComposer select,.assetComposer input{height:42px;border:1px solid #303b44;border-radius:9px;background:#070c10;color:#fff;padding:0 9px;font-size:10px}.assetPickers{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:8px}.assetGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.assetCard{border:1px solid #27323a;border-radius:11px;overflow:hidden;background:#091015;cursor:pointer}.assetThumb{aspect-ratio:4/3;background:#11191e;display:grid;place-items:center;overflow:hidden;color:#78858e;font-size:20px}.assetThumb img{width:100%;height:100%;object-fit:cover}.assetMeta{padding:8px}.assetMeta b{display:block;font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.assetMeta small{display:block;color:#83909a;font-size:7px;margin-top:3px}.assetEmpty{padding:17px;border:1px dashed #344049;border-radius:11px;text-align:center;color:#8b979f;font-size:9px;line-height:1.5}.assetPrimary{color:#ffd400}.assetMore{width:100%;margin-top:9px}.assetBusy{opacity:.55;pointer-events:none}@media(max-width:560px){#clients .tabs{display:flex;overflow:auto}#clients .tabBtn{flex:0 0 90px}.assetGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.assetComposerRow{grid-template-columns:1fr}}';
  document.head.appendChild(s);
}
function shell(){
  addStyles();
  const panel=$('[data-client-panel="media"]');if(!panel)return null;
  let root=$('#assetMemoryRoot',panel);
  if(!root){root=document.createElement('div');root.id='assetMemoryRoot';panel.querySelector('.section')?.appendChild(root)}
  return root;
}
function render(){
  const root=shell();if(!root)return;
  const lead=selected();
  if(!lead){root.innerHTML='<div class="assetEmpty">Selecione uma empresa para abrir a memória visual.</div>';return}
  const filters=['','FLEET','VEHICLE','TIRE','EQUIPMENT','VISIT','CONVERSATION','COMMERCIAL_DOCUMENT','LOGO'];
  const categories=Object.entries(labels).map(([v,l])=>'<option value="'+esc(v)+'">'+esc(l)+'</option>').join('');
  root.innerHTML='<div class="assetHead"><div><h2>Memória visual</h2><small>'+esc(lead.empresa||lead.nome||'Conta')+' · mídia e documentos da conta</small></div><button class="assetBtn primary" id="assetAdd">+ Adicionar</button></div>'+
  '<div class="assetFilters">'+filters.map(v=>'<button class="assetChip '+(state.filter===v?'active':'')+'" data-asset-filter="'+esc(v)+'">'+esc(v?(labels[v]||v):'Todos')+'</button>').join('')+'</div>'+
  '<div class="assetComposer" id="assetComposer"><div class="assetComposerRow"><select id="assetCategory">'+categories+'</select><input id="assetNote" maxlength="240" placeholder="Observação opcional"></div><div class="assetPickers"><button class="assetBtn" data-asset-pick="camera">Câmera</button><button class="assetBtn" data-asset-pick="gallery">Galeria</button><button class="assetBtn" data-asset-pick="document">Documento</button></div><input type="file" id="assetInput" hidden></div>'+
  '<div id="assetList">'+renderList()+'</div>';
  $('#assetAdd',root)?.addEventListener('click',()=>$('#assetComposer',root)?.classList.toggle('open'));
  $$('[data-asset-filter]',root).forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.assetFilter||'';load(true)}));
  $$('[data-asset-pick]',root).forEach(b=>b.addEventListener('click',()=>pick(b.dataset.assetPick)));
  $('#assetInput',root)?.addEventListener('change',upload);
  bindCards();
}
function renderList(){
  if(state.loading)return '<div class="assetEmpty">Carregando memória visual…</div>';
  if(!state.items.length)return '<div class="assetEmpty">Nenhum material salvo nesta conta.<br>Adicione uma foto, documento ou evidência.</div>';
  return '<div class="assetGrid">'+state.items.map(x=>{
    const v=x.currentVersion||{},title=x.title||labels[x.business_category]||v.original_filename||'Material';
    return '<article class="assetCard" data-asset-id="'+esc(x.id)+'"><div class="assetThumb" data-thumb="'+esc(x.id)+'">'+(x.media_kind==='IMAGE'?'▧':'▤')+'</div><div class="assetMeta"><b>'+esc(title)+(x.is_primary?' <span class="assetPrimary">★</span>':'')+'</b><small>'+esc([labels[x.business_category]||x.business_category,v.mime_type||'',fmt(x.captured_at||x.created_at)].filter(Boolean).join(' · '))+'</small></div></article>'
  }).join('')+'</div>'+(state.nextCursor?'<button class="assetBtn assetMore" id="assetMore">Carregar mais</button>':'');
}
function bindCards(){
  const root=shell();if(!root)return;
  $$('[data-asset-id]',root).forEach(card=>{
    card.addEventListener('click',()=>openAsset(card.dataset.assetId));
    const item=state.items.find(x=>x.id===card.dataset.assetId);
    if(item?.media_kind==='IMAGE')preview(card.querySelector('[data-thumb]'),item.id);
  });
  $('#assetMore',root)?.addEventListener('click',()=>load(false));
}
async function preview(box,id){
  if(!box||box.dataset.done)return;box.dataset.done='1';
  try{const a=await core().request('/assets/'+encodeURIComponent(id)+'/access?ttl=600');const img=new Image();img.loading='lazy';img.alt='';img.src=a.url;img.onload=()=>{box.innerHTML='';box.appendChild(img)}}catch{}
}
async function openAsset(id){
  try{const a=await core().request('/assets/'+encodeURIComponent(id)+'/access?ttl=300');window.open(a.url,'_blank','noopener,noreferrer')}catch(e){notify('Não foi possível abrir: '+e.message)}
}
async function load(reset){
  const lead=selected();if(!lead||state.loading)return;
  if(reset){state.items=[];state.nextCursor=null}
  if(!reset&&!state.nextCursor)return;
  state.loading=true;render();
  try{
    const p=new URLSearchParams(refParams(lead));p.set('limit','24');if(state.filter)p.set('category',state.filter);if(!reset&&state.nextCursor)p.set('cursor',state.nextCursor);
    const d=await core().request('/assets?'+p.toString(),{timeoutMs:12000});
    state.items=reset?(d.items||[]):state.items.concat(d.items||[]);state.nextCursor=d.nextCursor||null;
  }catch(e){
    state.items=[];state.nextCursor=null;
    const root=shell();if(root)root.innerHTML='<div class="assetEmpty">'+esc(e.status===404?'Conta ainda não reconciliada com a Company canônica.':e.message==='Asset Gateway não configurado.'?'Memória visual pronta para ativação segura do Storage.':'Falha ao carregar: '+e.message)+'</div>';
    state.loading=false;return;
  }
  state.loading=false;render();
}
function pick(mode){
  const input=$('#assetInput');if(!input)return;input.value='';input.removeAttribute('capture');
  if(mode==='camera'){input.accept='image/*';input.setAttribute('capture','environment');input.dataset.source='CAMERA'}
  else if(mode==='gallery'){input.accept='image/jpeg,image/png,image/webp,image/heic,image/heif';input.dataset.source='MANUAL_UPLOAD'}
  else{input.accept='application/pdf';input.dataset.source='MANUAL_UPLOAD'}
  input.click();
}
async function upload(e){
  const file=e.target.files?.[0],lead=selected();if(!file||!lead)return;
  const root=shell();root?.classList.add('assetBusy');
  try{
    const p=new URLSearchParams(refParams(lead));p.set('category',$('#assetCategory')?.value||'OTHER');p.set('sourceType',e.target.dataset.source||'MANUAL_UPLOAD');const note=clean($('#assetNote')?.value);if(note)p.set('title',note);
    await core().request('/assets/upload?'+p.toString(),{method:'POST',headers:{'content-type':file.type||'application/octet-stream','x-file-name':encodeURIComponent(file.name||'arquivo')},body:file,timeoutMs:35000});
    notify('Material salvo ✓');await load(true);
  }catch(err){notify('Falha no upload: '+err.message)}
  finally{root?.classList.remove('assetBusy')}
}
function fmt(v){const d=new Date(v||'');return Number.isNaN(d.getTime())?'':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'})}
function active(){return $('[data-client-tab="media"]')?.classList.contains('active')}
function onClient(){const lead=selected();if(!lead)return;if(String(lead.id)!==state.leadId){state.leadId=String(lead.id);state.items=[];state.nextCursor=null}if(active())load(true)}
function boot(){render();$('[data-client-tab="media"]')?.addEventListener('click',()=>load(true));window.addEventListener('dutra:client',onClient);window.addEventListener('dutra:state',()=>{if(active())onClient()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();