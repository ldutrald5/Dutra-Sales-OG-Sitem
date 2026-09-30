(() => {
'use strict';
const S=()=>globalThis.DUTRA_SALES_EXECUTION,C=()=>globalThis.DUTRA_CORE;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clean=v=>String(v??'').trim();
let selectedLeadId=null;

function addStyles(){
  if($('#sales-action-style')) return;
  const s=document.createElement('style'); s.id='sales-action-style';
  s.textContent=`
    .aqHero{border:1px solid #5b4d18;border-radius:18px;padding:18px;background:radial-gradient(circle at 90% 0,#66500f55,transparent 34%),linear-gradient(145deg,#201b08,#091015 66%)}
    .aqHero h2{margin:6px 0;font-size:26px}.aqHero p{margin:0;color:#9ca7af;font-size:11px;line-height:1.5}
    .aqStats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:12px}.aqStat{border:1px solid #27323a;border-radius:11px;background:#091015;padding:10px}.aqStat small{display:block;color:#849099;font-size:7px}.aqStat strong{display:block;font-size:20px;margin-top:3px}.aqStat.over strong{color:#ff8187}.aqStat.today strong{color:#ffd400}
    .aqFilters{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0}.aqFilters button{height:34px;border:1px solid #303b43;border-radius:9px;background:#0b1217;color:#9ca7af;padding:0 10px;font-size:8px;font-weight:900}.aqFilters button.active{background:#201b08;color:#ffd400;border-color:#665516}
    .aqList{display:grid;gap:8px}.aqItem{border:1px solid #27323a;border-radius:13px;background:#091015;padding:11px;display:grid;grid-template-columns:1fr auto;gap:10px}.aqItem h3{margin:0;font-size:12px}.aqItem p{margin:4px 0 0;color:#8d99a2;font-size:9px;line-height:1.4}.aqMeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}.aqTag{font-size:7px;font-weight:900;border:1px solid #4e4318;border-radius:7px;color:#ffd400;padding:4px 6px}.aqTag.over{color:#ff858b;border-color:#5c2529}.aqTag.today{color:#ffd400}.aqActions{display:flex;gap:6px;align-items:start}.aqActions button{height:33px;border:1px solid #34404a;border-radius:8px;background:#0d1419;color:#dce3e7;padding:0 8px;font-size:8px;font-weight:900}.aqActions .primary{background:#ffd400;color:#111;border-color:#ffd400}
    .actionModal{position:fixed;inset:0;background:#000b;z-index:280;display:none;align-items:flex-end;justify-content:center}.actionModal.open{display:flex}.actionSheet{width:min(720px,100%);max-height:90vh;overflow:auto;background:#091015;border:1px solid #3a454e;border-bottom:0;border-radius:20px 20px 0 0;padding:18px}
    .actionForm{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.actionForm .full{grid-column:1/-1}.actionForm label{display:block;color:#87939b;font-size:7px;margin-bottom:4px}.actionForm input,.actionForm select,.actionForm textarea{width:100%;background:#080d11;color:#fff;border:1px solid #34404a;border-radius:9px;padding:9px}.actionForm textarea{min-height:80px;resize:vertical}.actionPreview{border:1px solid #4e4318;background:#171609;border-radius:10px;padding:10px;font-size:9px;line-height:1.5;white-space:pre-wrap}.actionFooter{display:flex;gap:7px;margin-top:12px}.actionFooter button{flex:1;height:42px;border:1px solid #34404a;border-radius:9px;background:#0d1419;color:#fff;font-weight:900;font-size:9px}.actionFooter .primary{background:#ffd400;color:#111;border-color:#ffd400}
    @media(max-width:560px){.aqStats{grid-template-columns:1fr 1fr}.aqItem{grid-template-columns:1fr}.aqActions{flex-wrap:wrap}.actionForm{grid-template-columns:1fr}.actionForm .full{grid-column:1}}
  `;
  document.head.appendChild(s);
}

function ensureScreen(){
  if($('#executionQueue')) return;
  const shell=$('.shell'),bottom=shell?.querySelector('.bottom'); if(!shell||!bottom) return;
  const sec=document.createElement('section'); sec.className='screen'; sec.id='executionQueue';
  sec.innerHTML='<div class="pageHead"><button class="iconBtn" id="aqBack"><i data-lucide="arrow-left"></i></button><div class="titles"><h1>Próximas Ações</h1><p>Agora faça isso</p></div><button class="iconBtn" id="aqRefresh"><i data-lucide="refresh-cw"></i></button></div><div id="aqRoot"></div>';
  shell.insertBefore(sec,bottom);
  $('#aqBack').onclick=()=>globalThis.go?.('prospecting');
  $('#aqRefresh').onclick=async()=>{await C()?.reload?.();renderQueue()};
  lucide?.createIcons?.();
}

function ensureModal(){
  if($('#actionFlowModal')) return;
  document.body.insertAdjacentHTML('beforeend',`
  <div class="actionModal" id="actionFlowModal"><div class="actionSheet">
    <div class="sectionHead"><div><small style="color:#ffd400;font-size:8px;font-weight:900">PRÓXIMA MELHOR AÇÃO</small><h2 id="afTitle" style="margin:3px 0 0">Agendar ação</h2></div><button class="iconBtn" id="afClose"><i data-lucide="x"></i></button></div>
    <div class="actionForm">
      <div><label>TIPO</label><select id="afType"><option>CALL</option><option>WHATSAPP</option><option>FOLLOW_UP</option><option>SEND_MATERIAL</option><option>CREATE_PROPOSAL</option><option>PROPOSAL_FOLLOW_UP</option><option>MEETING</option><option>CUSTOMER_EXPANSION</option></select></div>
      <div><label>QUANDO</label><input id="afAt" type="datetime-local"></div>
      <div class="full"><label>AÇÃO</label><input id="afDescription"></div>
      <div class="full"><label>MOTIVO</label><input id="afReason"></div>
      <div><label>PRIORIDADE</label><select id="afPriority"><option>MEDIUM</option><option>HIGH</option><option>URGENT</option><option>LOW</option></select></div>
      <div><label>CONTATO</label><select id="afContact"></select></div>
      <div class="full"><label>OBJETIVO</label><input id="afObjective"></div>
      <div class="full"><label>RESULTADO ESPERADO</label><input id="afExpected"></div>
      <div class="full"><label>NOTA DA LIGAÇÃO / CONTEXTO</label><textarea id="afNote" placeholder="Resumo curto do que foi combinado."></textarea></div>
      <div class="full" id="afDiaryWrap" style="display:none"><label>SINAL EXTRAÍDO DA NOTA</label><div class="actionPreview" id="afDiary"></div></div>
      <div class="full" id="afDraftWrap"><label>MENSAGEM SUGERIDA</label><div class="actionPreview" id="afDraft"></div></div>
    </div>
    <div class="actionFooter"><button id="afSave">Salvar ação</button><button class="primary" id="afExecute">Salvar + executar</button></div>
  </div></div>`);
  $('#afClose').onclick=()=>$('#actionFlowModal').classList.remove('open');
  $('#afType').onchange=refreshDraft;
  $('#afContact').onchange=refreshDraft;
  $('#afSave').onclick=()=>saveAction(false);
  $('#afExecute').onclick=()=>saveAction(true);
  lucide?.createIcons?.();
}

function coreState(){return C()?.getState?.()||{}}
function ops(){return S().ensureOperations(coreState().operations||{})}
function leads(){return C()?.getLeads?.()||[]}
function people(leadId){return ops().contacts.filter(c=>String(c.leadId||c.companyId)===String(leadId))}
function leadById(id){return leads().find(l=>String(l.id)===String(id))||null}

function defaultAt(type){
  const d=new Date();
  if(type==='CALL'||type==='FOLLOW_UP'||type==='WHATSAPP') d.setHours(d.getHours()+2);
  else if(type==='SEND_MATERIAL') d.setMinutes(d.getMinutes()+10);
  else d.setDate(d.getDate()+1);
  d.setSeconds(0,0);
  return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
function defaultAction(type){
  return ({CALL:'Retornar contato',WHATSAPP:'Enviar WhatsApp',FOLLOW_UP:'Fazer follow-up',SEND_MATERIAL:'Enviar material técnico',CREATE_PROPOSAL:'Criar proposta',PROPOSAL_FOLLOW_UP:'Acompanhar proposta',MEETING:'Marcar reunião',CUSTOMER_EXPANSION:'Mapear expansão da frota'})[type]||'Definir próximo passo';
}
function defaultReason(type){
  return ({CALL:'Retorno combinado durante a conversa.',WHATSAPP:'Continuar a conversa no canal combinado.',FOLLOW_UP:'Existe próximo passo comercial pendente.',SEND_MATERIAL:'Cliente solicitou material para análise.',CREATE_PROPOSAL:'Diagnóstico avançou para proposta.',PROPOSAL_FOLLOW_UP:'Proposta precisa de decisão ou próximo compromisso.',MEETING:'Conversa precisa avançar para reunião.',CUSTOMER_EXPANSION:'Cliente atual pode ampliar frota protegida.'})[type]||'Próximo passo comercial.';
}

function openActionFlow(leadOrId,type='FOLLOW_UP',context={}){
  ensureModal();
  const lead=typeof leadOrId==='object'?leadOrId:leadById(leadOrId); if(!lead) return;
  selectedLeadId=lead.id;
  const modal=$('#actionFlowModal'); modal.dataset.sessionId=context.sessionId||''; modal.dataset.memberId=context.memberId||''; modal.dataset.outcome=context.outcome||''; modal.dataset.startedAt=context.startedAt||''; modal.dataset.contactId=context.contactId||'';
  $('#afTitle').textContent=(lead.empresa||lead.nome||'Conta')+' · '+defaultAction(type);
  $('#afType').value=type;
  $('#afAt').value=defaultAt(type);
  $('#afDescription').value=defaultAction(type);
  $('#afReason').value=context.reason||defaultReason(type);
  $('#afPriority').value=context.priority||(['CREATE_PROPOSAL','MEETING','PROPOSAL_FOLLOW_UP'].includes(type)?'HIGH':'MEDIUM');
  $('#afObjective').value=context.objective||'Avançar a conta sem perder o contexto da conversa.';
  $('#afExpected').value=context.expectedResult||'Sair com resposta, compromisso ou próximo passo claro.';
  $('#afNote').value=context.note||'';
  applyDiarySuggestion(context.note||'',type);
  const ps=people(lead.id);
  $('#afContact').innerHTML='<option value="">Contato principal da conta</option>'+ps.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.name)+' · '+esc(p.role||p.roleCategory||'')+'</option>').join('');
  if(context.contactId) $('#afContact').value=context.contactId;
  refreshDraft();
  modal.classList.add('open');
}

function applyDiarySuggestion(note,type){
  const wrap=$('#afDiaryWrap'),box=$('#afDiary'); if(!wrap||!box){return}
  wrap.style.display='none';box.textContent='';
  if(!clean(note)||!globalThis.OG_SMART_DIARY?.preview) return;
  try{
    const preview=globalThis.OG_SMART_DIARY.preview(note,{baseDate:new Date().toISOString()});
    const commitment=preview.candidates?.find(c=>c.field==='commitmentMentioned');
    const fleet=preview.candidates?.find(c=>c.field==='fleetSizeMentioned');
    const pain=preview.candidates?.find(c=>c.field==='painMentioned');
    const lines=[];
    if(commitment?.suggestedFollowUpAt){const d=new Date(commitment.suggestedFollowUpAt);$('#afAt').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);lines.push('Data sugerida: '+d.toLocaleString('pt-BR'))}
    if(fleet) lines.push('Frota mencionada: '+fleet.value+' veículos — revisar antes de gravar como fato.');
    if(pain) lines.push('Dor mencionada: '+pain.value+' — revisar antes de gravar como fato.');
    if(lines.length){box.textContent=lines.join('\n');wrap.style.display='block';}
  }catch(_){}
}
function draftFor(lead,type,contact){
  const vars={first_name:contact?.name||lead.nome||'',contact_name:contact?.name||lead.nome||'',company:lead.empresa||lead.nome||'',seller:'Lucas',next_action:$('#afDescription')?.value||defaultAction(type)};
  const comm=globalThis.OG_COMMUNICATION_SERVICE;
  const objective=type==='SEND_MATERIAL'?'PRESENTATION':type==='PROPOSAL_FOLLOW_UP'?'FOLLOW_UP':type==='WHATSAPP'?'AFTER_CALL':type==='CUSTOMER_EXPANSION'?'AFTER_SALES':type==='CALL'||type==='FOLLOW_UP'?'FOLLOW_UP':type==='CREATE_PROPOSAL'?'QUOTE':'AFTER_CALL';
  const tpl=comm?.templates?.('whatsapp',objective)?.[0];
  if(tpl) return comm.render(tpl,vars).body;
  const fallback=globalThis.DUTRA_WHATSAPP_ACTION;
  const key=type==='SEND_MATERIAL'?'technical_material':type==='PROPOSAL_FOLLOW_UP'?'follow_up':type==='CUSTOMER_EXPANSION'?'reactivation':'post_call';
  return fallback?.fillTemplate?.(key,{nome:vars.first_name,empresa:vars.company,proximo_passo:vars.next_action,assunto:vars.next_action})||'';
}
function refreshDraft(){
  const lead=leadById(selectedLeadId); if(!lead) return;
  const contact=people(lead.id).find(p=>String(p.id)===String($('#afContact').value));
  const type=$('#afType').value;
  $('#afDescription').value=$('#afDescription').value||defaultAction(type);
  $('#afReason').value=$('#afReason').value||defaultReason(type);
  const draft=draftFor(lead,type,contact);
  $('#afDraft').textContent=draft||'Esta ação não exige mensagem externa.';
  $('#afDraftWrap').style.display=['SEND_MATERIAL','PROPOSAL_FOLLOW_UP','WHATSAPP','CUSTOMER_EXPANSION','FOLLOW_UP'].includes(type)?'block':'none';
}

async function saveAction(execute){
  const lead=leadById(selectedLeadId); if(!lead) return;
  const modal=$('#actionFlowModal'),type=$('#afType').value,at=$('#afAt').value,contactId=$('#afContact').value||modal.dataset.contactId||null;
  let baseLeads=leads(),baseOps=ops(),leadId=lead.id,session=null;
  if(modal.dataset.outcome&&modal.dataset.sessionId&&modal.dataset.memberId){
    const recorded=S().recordOutcome(baseLeads,baseOps,modal.dataset.sessionId,modal.dataset.memberId,modal.dataset.outcome,{startedAt:modal.dataset.startedAt||null,phone:lead.telefone,contactId,notes:$('#afNote').value},new Date());
    baseLeads=recorded.leads;baseOps=recorded.operations;leadId=recorded.lead.id;session=recorded.session;
  }
  const result=S().scheduleAction(baseLeads,baseOps,leadId,{
    type,dueAt:at?new Date(at):null,description:$('#afDescription').value,reason:$('#afReason').value,priority:$('#afPriority').value,
    objective:$('#afObjective').value,expectedResult:$('#afExpected').value,contactId,sessionId:modal.dataset.sessionId||null
  },new Date());
  if(session){
    const next=S().nextMember(result.operations,session);
    if(next){session.currentMemberId=next.id;next.workStatus='IN_PROGRESS';}
  }
  await C().commit(
    {leads:result.leads,operations:result.operations},
    modal.dataset.outcome?'Resultado salvo, próxima ação criada e próximo contato preparado.':'Próxima ação salva no CRM.',
    {
      action:modal.dataset.outcome?'RECORD_CALL_OUTCOME_AND_NEXT_ACTION':'SCHEDULE_NEXT_ACTION',
      entityType:'lead',
      entityId:result.lead.id,
      label:modal.dataset.outcome?'Resultado + próxima ação':'Próxima ação',
      metadata:{type,contactId:contactId||null,sessionId:modal.dataset.sessionId||null}
    }
  );
  $('#actionFlowModal').classList.remove('open');
  if(execute) executeAction(result.lead,type,contactId);
  if(modal.dataset.outcome){globalThis.go?.('prospecting');}
  else renderQueue();
}

function executeAction(lead,type,contactId){
  const contact=people(lead.id).find(p=>String(p.id)===String(contactId));
  const phone=contact?.phone||contact?.whatsapp||lead.telefone;
  if(type==='CALL'){try{globalThis.DUTRA_CALL_PROVIDER.startCall(phone,{leadId:lead.id,contactId})}catch(e){alert(e.message)}return}
  if(['WHATSAPP','SEND_MATERIAL','PROPOSAL_FOLLOW_UP','CUSTOMER_EXPANSION','FOLLOW_UP'].includes(type)){
    const msg=draftFor(lead,type,contact);
    try{globalThis.DUTRA_WHATSAPP_ACTION.open(phone,msg,{leadId:lead.id,contactId})}catch(e){alert(e.message)}
    return;
  }
  if(type==='CREATE_PROPOSAL'){
    const contact=people(lead.id).find(p=>String(p.id)===String(contactId))||people(lead.id)[0]||{};
    try{globalThis.DUTRA_QUOTE_HANDOFF?.launch?.(lead,contact,{target:'_blank'});}catch(e){alert('Não foi possível abrir a cotação oficial: '+e.message)}
    return;
  }
  if(type==='MEETING'){globalThis.go?.('prospecting');}
}

async function completeQueueItem(leadId){
  const lead=leadById(leadId); if(!lead) return;
  const completedType=clean(lead.nextActionType).toUpperCase();
  if(!confirm('Marcar “'+(lead.nextAction||'próxima ação')+'” como concluída?')) return;
  let x=S().completeAction(leads(),ops(),lead.id,{result:'completed_from_action_queue'},new Date());
  let message='Próxima ação concluída.';
  if(completedType==='SEND_MATERIAL'){
    const due=new Date();due.setDate(due.getDate()+2);
    x=S().scheduleAction(x.leads,x.operations,lead.id,{type:'FOLLOW_UP',dueAt:due,description:'Confirmar recebimento do material',reason:'Material marcado como enviado; validar recebimento e reação do cliente.',priority:'MEDIUM',objective:'Descobrir se o material foi visto e avançar o próximo passo.',expectedResult:'Obter resposta e definir avanço comercial.'},new Date());
    message='Material concluído e follow-up de recebimento criado automaticamente.';
  }
  await C().commit(
    {leads:x.leads,operations:x.operations},
    message,
    {action:'COMPLETE_NEXT_ACTION',entityType:'lead',entityId:lead.id,label:'Próxima ação concluída',metadata:{completedType}}
  );
  renderQueue();
}

function renderQueue(filter='all'){
  ensureScreen();
  const root=$('#aqRoot'); if(!root) return;
  const all=S().actionQueue(leads(),ops(),new Date());
  const items=filter==='all'?all:all.filter(x=>x.state===filter);
  const overdue=all.filter(x=>x.state==='OVERDUE').length,today=all.filter(x=>x.state==='TODAY').length;
  root.innerHTML=`
    <section class="aqHero"><div style="color:#ffd400;font-size:9px;font-weight:900;letter-spacing:.14em">SALES EXECUTION QUEUE</div><h2>Agora faça isso.</h2><p>A fila reúne os próximos compromissos do CRM e ordena urgência, vencimento e prioridade. Abrir uma ação não envia nada sozinho.</p>
      <div class="aqStats"><div class="aqStat over"><small>VENCIDOS</small><strong>${overdue}</strong></div><div class="aqStat today"><small>HOJE</small><strong>${today}</strong></div><div class="aqStat"><small>FILA</small><strong>${all.length}</strong></div><div class="aqStat"><small>SEM DATA</small><strong>${all.filter(x=>!x.dueAt).length}</strong></div></div>
    </section>
    <div class="aqFilters"><button class="${filter==='all'?'active':''}" data-aq-filter="all">Tudo</button><button class="${filter==='OVERDUE'?'active':''}" data-aq-filter="OVERDUE">Vencidos</button><button class="${filter==='TODAY'?'active':''}" data-aq-filter="TODAY">Hoje</button><button class="${filter==='UPCOMING'?'active':''}" data-aq-filter="UPCOMING">Próximos</button></div>
    <div class="aqList">${items.length?items.map(item=>`<article class="aqItem"><div><h3>${esc(item.company||'Conta')}</h3><p><b>${esc(item.action)}</b><br>${esc(item.reason||'Sem motivo registrado')}</p><div class="aqMeta"><span class="aqTag ${item.state==='OVERDUE'?'over':item.state==='TODAY'?'today':''}">${esc(item.state)}</span><span class="aqTag">${esc(item.type)}</span><span class="aqTag">${esc(item.priority)}</span>${item.dueAt?'<span class="aqTag">'+esc(new Date(item.dueAt).toLocaleString('pt-BR'))+'</span>':''}</div></div><div class="aqActions"><button data-aq-open="${esc(item.leadId)}">Conta</button><button data-aq-edit="${esc(item.leadId)}">Editar</button><button class="primary" data-aq-run="${esc(item.leadId)}">Executar</button><button data-aq-done="${esc(item.leadId)}">Concluir</button></div></article>`).join(''):'<div class="pxEmpty">Nenhuma próxima ação nesta faixa.</div>'}</div>`;
  $$('[data-aq-filter]').forEach(b=>b.onclick=()=>renderQueue(b.dataset.aqFilter));
  $$('[data-aq-open]').forEach(b=>b.onclick=()=>C()?.selectClient?.(b.dataset.aqOpen));
  $$('[data-aq-edit]').forEach(b=>{b.onclick=()=>{const l=leadById(b.dataset.aqEdit);openActionFlow(l,l?.nextActionType||'FOLLOW_UP',{reason:l?.nextActionReason||''});}});
  $$('[data-aq-run]').forEach(b=>{b.onclick=()=>{const l=leadById(b.dataset.aqRun);executeAction(l,l?.nextActionType||'FOLLOW_UP',null);}});
  $$('[data-aq-done]').forEach(b=>b.onclick=()=>completeQueueItem(b.dataset.aqDone));
  lucide?.createIcons?.();
}

function wireEntrances(){
  const cmd=$('.cmdItems');
  if(cmd&&!$('#cmdActionQueue')){const i=document.createElement('div');i.id='cmdActionQueue';i.className='cmdItem';i.innerHTML='<i data-lucide="list-checks"></i> Abrir próximas ações';i.onclick=()=>{globalThis.go?.('executionQueue');renderQueue();$('#command')?.classList.remove('open')};cmd.prepend(i)}
  const more=$('#more .section');if(more&&!$('#moreActionQueue')){const row=document.createElement('div');row.id='moreActionQueue';row.className='moduleRow';row.innerHTML='<i data-lucide="list-checks"></i><div class="rowBody"><b>Próximas Ações</b><small>Fila de retornos, materiais, propostas e compromissos.</small></div><i data-lucide="chevron-right"></i>';row.onclick=()=>{globalThis.go?.('executionQueue');renderQueue()};const prospect=[...more.querySelectorAll('.moduleRow')].find(r=>r.querySelector('b')?.textContent?.trim()==='Prospecção');prospect?.after(row)}
  const root=$('#prospectContent');
  if(root&&!$('#openActionQueue')){
    const hero=root.querySelector('.pxHero .pxActions');
    if(hero){const b=document.createElement('button');b.id='openActionQueue';b.innerHTML='<i data-lucide="list-checks"></i> Próximas ações';b.onclick=()=>{globalThis.go?.('executionQueue');renderQueue()};hero.appendChild(b)}
  }
  lucide?.createIcons?.();
}

function observeProspecting(){
  const node=$('#prospectContent'); if(!node) return;
  const obs=new MutationObserver(()=>wireEntrances()); obs.observe(node,{childList:true,subtree:true});
  wireEntrances();
}
function boot(){
  addStyles();ensureScreen();ensureModal();observeProspecting();
  window.DUTRA_ACTION_CENTER={open:openActionFlow,render:renderQueue};
  window.addEventListener('dutra:state',()=>{if($('#executionQueue')?.classList.contains('active'))renderQueue()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();