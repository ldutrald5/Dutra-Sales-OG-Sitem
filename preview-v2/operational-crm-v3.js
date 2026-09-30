(() => {
'use strict';

const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const clean=v=>String(v??'').trim();
const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=v=>esc(v).replace(/`/g,'&#96;');
const core=()=>globalThis.DUTRA_CORE;
const snapshot=()=>core()?.getState?.()||null;
const leads=()=>core()?.getLeads?.()||[];
const selected=()=>core()?.getSelectedLead?.()||null;
const ops=()=>snapshot()?.operations||{};
const arr=(key)=>Array.isArray(ops()[key])?ops()[key]:[];
const money=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const fmtDate=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})};
const notify=msg=>typeof globalThis.showToast==='function'?globalThis.showToast(msg):console.log('[DUTRA]',msg);
const PRIVACY_KEY='dutra_home_privacy_v1';
let homePrivacy=localStorage.getItem(PRIVACY_KEY)==='1';
let clientSmartView='all';

function applyHomePrivacy(){
  document.body.classList.toggle('dutra-home-private',homePrivacy);
  const btn=$('#homePrivacyToggle');
  if(btn){
    btn.innerHTML='<i data-lucide="'+(homePrivacy?'eye-off':'eye')+'"></i>';
    btn.title=homePrivacy?'Mostrar indicadores':'Ocultar indicadores';
    btn.setAttribute('aria-label',btn.title);
    btn.classList.toggle('active',homePrivacy);
  }
  window.lucide?.createIcons?.();
}
function ensureHomePrivacyToggle(){
  const profile=$('#home .profile');if(!profile||$('#homePrivacyToggle'))return;
  const bell=$('#home .profile .iconBtn');
  const btn=document.createElement('button');
  btn.id='homePrivacyToggle';
  btn.className='iconBtn homePrivacyBtn';
  btn.type='button';
  btn.onclick=()=>{homePrivacy=!homePrivacy;localStorage.setItem(PRIVACY_KEY,homePrivacy?'1':'0');applyHomePrivacy();};
  if(bell)profile.insertBefore(btn,bell);else profile.appendChild(btn);
  applyHomePrivacy();
}

function addStyles(){
  if($('#operational-crm-v3-style'))return;
  const s=document.createElement('style');s.id='operational-crm-v3-style';s.textContent=`
    .realOnly{opacity:1}.homeLiveEmpty{padding:15px;border:1px dashed #34404a;border-radius:12px;color:#8d99a2;font-size:10px;text-align:center}
    .homeStateTag{font-size:7px;font-weight:900;border:1px solid #4c421b;border-radius:7px;color:#ffd400;padding:4px 6px;white-space:nowrap}.homeStateTag.over{color:#ff8389;border-color:#5c2529}.homeStateTag.today{color:#ffd400}
    .homeAgendaMeta{display:flex;gap:5px;align-items:center}.homeAgendaMeta time{font-size:8px}
    .clientPicker{position:relative;margin:0 0 10px}.clientSmartViews{margin:0 0 10px}.clientSmartViewScroll{display:flex;gap:6px;overflow:auto;padding:2px 0 7px;scrollbar-width:none}.clientSmartViewScroll::-webkit-scrollbar{display:none}.clientSmartChip{flex:0 0 auto;border:1px solid #34404a;border-radius:999px;background:#0a1116;color:#b9c2c8;padding:7px 9px;font-size:8px;font-weight:900}.clientSmartChip.active{border-color:#806b18;background:#1a1707;color:#ffd400}.clientSmartChip b{margin-left:4px;color:#fff}.clientSmartSummary{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:1px 1px 7px;color:#83909a;font-size:8px}.clientSmartSummary strong{color:#e7ecef;font-size:9px}.clientSmartList{display:grid;gap:6px;max-height:270px;overflow:auto;border:1px solid #27323a;border-radius:12px;background:#080d11;padding:6px}.clientSmartAccount{display:grid;grid-template-columns:34px 1fr auto;gap:8px;align-items:center;border:1px solid #202a31;border-radius:9px;background:#0b1217;color:#e7ecef;text-align:left;padding:8px}.clientSmartAccount:hover,.clientSmartAccount.active{border-color:#6e5c17;background:#171507}.clientSmartAccount .thumb{width:34px;height:34px}.clientSmartAccount b{display:block;font-size:9px}.clientSmartAccount small{display:block;color:#7f8b94;font-size:7px;margin-top:2px}.clientSmartStage{font-size:6px;font-weight:900;border:1px solid #3c474f;border-radius:999px;padding:4px 5px;color:#b8c1c7;white-space:nowrap}.clientPicker{position:relative;margin:0 0 12px}.clientPickerInput{height:46px;width:100%;border:1px solid #303a43;border-radius:11px;background:#080d11;color:#fff;padding:0 42px 0 12px;outline:0}.clientPickerIcon{position:absolute;right:12px;top:12px;color:#79858e}.clientPickerResults{display:none;position:absolute;left:0;right:0;top:51px;z-index:80;max-height:320px;overflow:auto;border:1px solid #354049;border-radius:12px;background:#091015;box-shadow:0 18px 60px #000}.clientPickerResults.open{display:block}.clientPickRow{display:flex;gap:10px;align-items:center;padding:10px;border-bottom:1px solid #1e282f;cursor:pointer}.clientPickRow:hover{background:#101820}.clientPickRow b{display:block;font-size:11px}.clientPickRow small{display:block;color:#84909a;font-size:8px;margin-top:2px}.clientPickRow .thumb{width:38px;height:38px}
    .clientBadgeDynamic{font-size:8px;font-weight:900;padding:5px 7px;border-radius:999px;border:1px solid #3d4850;color:#b9c3ca}.clientBadgeDynamic.relationship{border-color:#6e5d16;color:#ffd400;background:#211c08}.clientBadgeDynamic.pipeline{border-color:#285a31;color:#72e77c;background:#0b2110}
    .clientOverviewGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px}.clientRealCard{border:1px solid #27323a;border-radius:12px;background:#091015;padding:12px}.clientRealCard label{display:block;color:#818d96;font-size:7px;font-weight:900;letter-spacing:.08em}.clientRealCard strong{display:block;font-size:13px;margin-top:5px}.clientRealCard p{margin:5px 0 0;color:#919ca4;font-size:9px;line-height:1.45}
    .clientPeople{margin-top:12px;border:1px solid #27323a;border-radius:13px;background:#091015;padding:12px}.clientPeopleHead{display:flex;align-items:center;justify-content:space-between;gap:8px}.clientPeopleHead h3{margin:0;font-size:13px}.clientPeopleHead button{border:0;background:transparent;color:#ffd400;font-size:8px;font-weight:900}.clientPerson{display:grid;grid-template-columns:1fr auto;gap:8px;padding:9px 0;border-top:1px solid #202a31}.clientPerson:first-of-type{margin-top:8px}.clientPerson b{display:block;font-size:10px}.clientPerson small{display:block;color:#85919a;font-size:8px;margin-top:2px}.clientRole{font-size:7px;font-weight:900;color:#ffd400;border:1px solid #544819;border-radius:7px;padding:4px 6px;height:max-content}
    .clientHistoryItem{display:grid;grid-template-columns:36px 1fr auto;gap:9px;align-items:start;padding:10px;border:1px solid #202a31;border-radius:10px;background:#080d11;margin:7px 0}.clientHistoryIcon{width:34px;height:34px;border-radius:9px;background:#171806;color:#ffd400;display:grid;place-items:center;font-size:13px}.clientHistoryItem b{display:block;font-size:10px}.clientHistoryItem small{display:block;color:#87929a;font-size:8px;line-height:1.4;margin-top:3px}.clientHistoryItem time{font-size:7px;color:#73808a;white-space:nowrap}
    .clientProposalItem{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px;border:1px solid #27323a;border-radius:10px;background:#091015;margin:8px 0}.clientProposalItem b{font-size:10px}.clientProposalItem small{display:block;color:#84909a;font-size:8px;margin-top:3px}.clientProposalItem strong{font-size:11px;color:#ffd400}.clientProposalItem button{grid-column:1/-1;height:34px;border:1px solid #34404a;border-radius:8px;background:#0d1419;color:#dce3e7;font-size:8px;font-weight:900}
    .clientFleetFacts{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.clientFleetFact{border:1px solid #27323a;border-radius:10px;background:#091015;padding:11px}.clientFleetFact small{display:block;color:#82909a;font-size:7px}.clientFleetFact strong{display:block;font-size:12px;margin-top:4px}
    .clientNoData{padding:16px;border:1px dashed #34404a;border-radius:11px;color:#87939c;font-size:9px;text-align:center}
    .clientAction[data-real-action],.contactBtns button[data-real-action]{cursor:pointer}.homeBell{position:relative}.homeBellCount{position:absolute;right:-4px;top:-5px;min-width:17px;height:17px;padding:0 4px;border-radius:999px;background:#ffd400;color:#111;display:grid;place-items:center;font-size:7px;font-weight:900;border:2px solid #080d11}.homePrivacyBtn{transition:.18s ease}.homePrivacyBtn.active{color:#ffd400;border-color:#6a5918;background:#171506}.dutra-home-private #home .metric strong,.dutra-home-private #home .pipeNum strong{color:transparent!important;position:relative;user-select:none}.dutra-home-private #home .metric strong::after{content:'••••';position:absolute;left:0;top:0;color:#f7f8f9;letter-spacing:.08em}.dutra-home-private #home .pipeNum strong::after{content:'••';position:absolute;left:0;top:0;color:#f7f8f9;letter-spacing:.08em}
    @media(max-width:560px){.clientOverviewGrid{grid-template-columns:1fr}.clientHistoryItem{grid-template-columns:34px 1fr}.clientHistoryItem time{grid-column:2}.clientFleetFacts{grid-template-columns:1fr 1fr}}
  `;document.head.appendChild(s);
}

function proposalDocsFor(leadId){
  return arr('generatedDocuments').filter(d=>String(d.clientId||d.leadId)===String(leadId)&&['proposal_tracking','proposal','commercial_proposal'].includes(clean(d.documentType||d.type).toLowerCase())).sort((a,b)=>clean(b.preparedAt||b.createdAt).localeCompare(clean(a.preparedAt||a.createdAt)));
}
function contactsFor(leadId){return arr('contacts').filter(c=>String(c.leadId||c.companyId)===String(leadId))}
function meetingsFor(leadId){return arr('meetings').filter(m=>String(m.leadId||m.companyId)===String(leadId)).sort((a,b)=>clean(b.scheduledAt||b.createdAt).localeCompare(clean(a.scheduledAt||a.createdAt)))}
function opportunitiesFor(leadId){return arr('opportunities').filter(o=>String(o.clientId||o.leadId)===String(leadId)).sort((a,b)=>clean(b.updatedAt||b.createdAt).localeCompare(clean(a.updatedAt||a.createdAt)))}
function actionQueue(){
  if(globalThis.DUTRA_SALES_EXECUTION?.actionQueue)return globalThis.DUTRA_SALES_EXECUTION.actionQueue(leads(),ops(),new Date());
  return leads().filter(l=>clean(l.nextAction)).map(l=>({leadId:l.id,company:l.empresa||l.nome,action:l.nextAction,type:l.nextActionType||'FOLLOW_UP',reason:l.nextActionReason||'',dueAt:l.followUpAt||null,state:l.followUpAt&&new Date(l.followUpAt)<new Date()?'OVERDUE':'UPCOMING',priority:l.priorityBand||'media'}));
}
function relationshipLabel(lead){
  const map={UNKNOWN:'DESCONHECIDO',COLD:'FRIO',KNOWS_OG:'CONHECE OG',PREVIOUS_CONTACT:'CONTATO ANTERIOR',PREVIOUS_PROPOSAL:'PROPOSTA ANTERIOR',NEGOTIATION:'NEGOCIAÇÃO',CUSTOMER:'CLIENTE',INACTIVE_CUSTOMER:'CLIENTE INATIVO'};
  return map[clean(lead.relationshipStatus||lead.relationship_status).toUpperCase()]||clean(lead.relationshipStatus||lead.status||'ATIVO').toUpperCase();
}
function pipelineLabel(lead){
  const map={PROSPECT:'PROSPECT',CONTACT_ATTEMPTED:'TENTATIVA',CONNECTED:'CONECTADO',DECISION_MAKER_IDENTIFIED:'DECISOR IDENTIFICADO',DECISION_MAKER_CONTACTED:'DECISOR CONTATADO',QUALIFIED:'QUALIFICADO',MEETING_TO_SCHEDULE:'REUNIÃO A MARCAR',MEETING_SCHEDULED:'REUNIÃO AGENDADA',MEETING_COMPLETED:'REUNIÃO REALIZADA',PROPOSAL:'PROPOSTA',NEGOTIATION:'NEGOCIAÇÃO',WON:'GANHO',LOST:'PERDIDO'};
  const raw=clean(lead.pipelineStage||lead.pipeline_stage).toUpperCase();
  return map[raw]||globalThis.OG_LEAD_INTELLIGENCE?.stageDefinition?.(lead)?.label?.toUpperCase()||clean(lead.status||'ATIVO').toUpperCase();
}
function fleetValue(lead){
  const n=Number(lead.fleetSize||lead.fleet_size||0);
  return n>0?n:null;
}
function lastTouch(lead){
  const own=(lead.interactions||[]).map(i=>i.at).filter(Boolean);
  const activities=arr('activities').filter(a=>String(a.clientId||a.leadId)===String(lead.id)).map(a=>a.at||a.createdAt).filter(Boolean);
  return [...own,...activities].sort().reverse()[0]||lead.lastContactAt||lead.updatedAt||lead.createdDate||null;
}
function topRecent(){
  return leads().slice().sort((a,b)=>clean(lastTouch(b)).localeCompare(clean(lastTouch(a)))).slice(0,4);
}
function homeFocus(){
  const queue=actionQueue();
  const urgent=queue.find(x=>x.state==='OVERDUE')||queue.find(x=>x.state==='TODAY')||queue[0];
  if(urgent){const lead=leads().find(l=>String(l.id)===String(urgent.leadId));if(lead)return{lead,item:urgent}}
  const sorted=globalThis.OG_LEAD_INTELLIGENCE?.filterSort?.(leads(),{},new Date())||leads();
  const lead=sorted.find(l=>!['perdido','fechado'].includes(clean(l.status).toLowerCase()))||sorted[0];
  return lead?{lead,item:null}:null;
}
function groupPipeline(){
  const counts={entry:0,connected:0,qualified:0,proposal:0};
  for(const lead of leads()){
    const p=clean(lead.pipelineStage||lead.pipeline_stage).toUpperCase();
    if(['PROPOSAL','NEGOTIATION'].includes(p)||['proposta_enviada','negociacao'].includes(clean(lead.status).toLowerCase()))counts.proposal++;
    else if(['QUALIFIED','MEETING_TO_SCHEDULE','MEETING_SCHEDULED','MEETING_COMPLETED'].includes(p))counts.qualified++;
    else if(['CONNECTED','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_CONTACTED'].includes(p))counts.connected++;
    else if(!['WON','LOST'].includes(p)&&!['fechado','perdido'].includes(clean(lead.status).toLowerCase()))counts.entry++;
  }
  return counts;
}

function neutralize(){
  const focus=$('#home .focus');if(focus){$('b',focus).textContent='Conectando à base real…';$('small',focus).textContent='Carregando prioridades comerciais';}
  $$('#home .clientrow').forEach(row=>row.style.visibility='hidden');
  const client=$('#clients');if(client){$('.clientInfo h2',client).textContent='Selecione um cliente';$('.clientInfo p',client).textContent='Aguardando base real';}
}

function renderHome(){
  if(!snapshot())return;
  ensureHomePrivacyToggle();
  applyHomePrivacy();
  const ls=leads(),queue=actionQueue(),pipe=groupPipeline();
  const total=ls.filter(l=>clean(l.status).toLowerCase()!=='perdido').length;
  const newCount=ls.filter(l=>clean(l.pipelineStage||l.pipeline_stage).toUpperCase()==='PROSPECT'||clean(l.conversationStage).toLowerCase()==='first_contact'||clean(l.status).toLowerCase()==='novo').length;
  const advancing=pipe.connected+pipe.qualified+pipe.proposal;
  const metrics=$$('#home .metric');
  const metricValues=[
    [total,'contas na operação'],
    [newCount,'primeiro contato'],
    [advancing,'em avanço comercial'],
    [queue.length,'próximas ações']
  ];
  metrics.forEach((box,i)=>{if(!metricValues[i])return;$('strong',box).textContent=String(metricValues[i][0]);$('small',box).textContent=metricValues[i][1]});

  const focus=homeFocus(),focusBox=$('#home .focus');
  if(focusBox){
    if(focus){
      const {lead,item}=focus;focusBox.dataset.leadId=lead.id;
      $('b',focusBox).textContent=lead.empresa||lead.nome||'Conta';
      $('small',focusBox).textContent=item?[item.action,item.reason,item.dueAt?fmtDate(item.dueAt):''].filter(Boolean).join(' · '):[lead.nextAction||pipelineLabel(lead),fleetValue(lead)?fleetValue(lead)+' veículos':''].filter(Boolean).join(' · ');
    }else{
      delete focusBox.dataset.leadId;$('b',focusBox).textContent='Sem conta em foco';$('small',focusBox).textContent='Crie ou importe uma conta para começar.';
    }
  }

  const recentSection=$$('#home .section').find(s=>$('.sectionHead h2',s)?.textContent?.includes('Clientes recentes'));
  if(recentSection){
    const head=$('.sectionHead',recentSection)?.outerHTML||'';
    const recent=topRecent();
    recentSection.innerHTML=head+(recent.length?recent.map(lead=>`<div class="clientrow" data-core-lead="${attr(lead.id)}"><div class="thumb">${esc(clean(lead.empresa||lead.nome).slice(0,1).toUpperCase()||'C')}</div><div class="rowBody"><b>${esc(lead.empresa||lead.nome||'Conta')}</b><small>${esc([lead.nome&&lead.nome!==lead.empresa?lead.nome:'',lead.cidadeUf||'',lead.nextAction||'Sem próxima ação'].filter(Boolean).join(' · '))}</small></div><span class="status gray">${esc(pipelineLabel(lead))}</span></div>`).join(''):'<div class="homeLiveEmpty">Nenhuma conta na base real.</div>');
    const viewAll=$('.sectionHead button',recentSection);
    if(viewAll)viewAll.onclick=e=>{e.preventDefault();globalThis.go?.('clients');setTimeout(()=>$('#clientPickerInput')?.focus(),80)};
  }

  const agenda=$('#home .agenda');
  if(agenda){
    const items=queue.slice(0,5);
    agenda.innerHTML=items.length?items.map(item=>`<div class="agendaItem" data-core-lead="${attr(item.leadId)}"><div class="agendaIcon"><i data-lucide="${item.type==='CALL'?'phone-call':item.type==='MEETING'?'calendar-check':item.type==='WHATSAPP'?'message-circle':'list-checks'}"></i></div><div><b>${esc(item.company||'Conta')}</b><small>${esc(item.action||'Próxima ação')}</small></div><div class="homeAgendaMeta"><span class="homeStateTag ${item.state==='OVERDUE'?'over':item.state==='TODAY'?'today':''}">${esc(item.state==='OVERDUE'?'VENCIDO':item.state==='TODAY'?'HOJE':'PRÓXIMO')}</span><time>${esc(item.dueAt?fmtDate(item.dueAt):'sem data')}</time></div></div>`).join(''):'<div class="homeLiveEmpty">Nenhuma próxima ação pendente.</div>';
  }

  const nums=$$('#home .pipeNum strong'),labels=$$('#home .pipeNum small');
  const pv=[pipe.entry,pipe.connected,pipe.qualified,pipe.proposal],pl=['ENTRADA','CONECTADOS','QUALIFICADOS','PROPOSTA'];
  nums.forEach((n,i)=>n.textContent=String(pv[i]||0));labels.forEach((n,i)=>n.textContent=pl[i]);
  const active=Object.values(pipe).reduce((a,b)=>a+b,0),progress=active?Math.round(((pipe.qualified+pipe.proposal)/active)*100):0;
  const track=$('#home .pipeTrack span');if(track)track.style.width=Math.max(4,progress)+'%';

  const spotlight=$('#home .spotlight');
  if(spotlight){
    const meeting=arr('meetings').filter(m=>['MEETING_SCHEDULED','MEETING_CONFIRMED','RESCHEDULED'].includes(clean(m.meetingStatus).toUpperCase())&&new Date(m.scheduledAt)>=new Date()).sort((a,b)=>clean(a.scheduledAt).localeCompare(clean(b.scheduledAt)))[0];
    if(meeting){
      const lead=leads().find(l=>String(l.id)===String(meeting.leadId||meeting.companyId));
      spotlight.dataset.coreLead=lead?.id||'';
      spotlight.innerHTML=`<div class="thumb">${esc(clean(lead?.empresa||lead?.nome||'R').slice(0,1).toUpperCase())}</div><div><b>Próxima reunião · ${esc(lead?.empresa||lead?.nome||'Conta')}</b><small>${esc(fmtDate(meeting.scheduledAt))} · ${esc(meeting.decisionMaker||meeting.objective||'Reunião comercial')}</small></div>`;
    }else{
      const top=queue[0],lead=top&&leads().find(l=>String(l.id)===String(top.leadId));
      if(top&&lead){spotlight.dataset.coreLead=lead.id;spotlight.innerHTML=`<div class="thumb">${esc(clean(lead.empresa||lead.nome).slice(0,1).toUpperCase())}</div><div><b>${esc(top.action)}</b><small>${esc(lead.empresa||lead.nome||'Conta')} · ${esc(top.reason||'próxima ação comercial')}</small></div>`;}
      else spotlight.innerHTML='<div><b>Operação organizada</b><small>Nenhuma reunião ou ação crítica pendente.</small></div>';
    }
  }

  const central=$$('#home .sectionHead button').find(b=>b.textContent.includes('Central operacional'));
  if(central){central.dataset.go='day';central.onclick=e=>{e.preventDefault();globalThis.go?.('day')}}
  const prospection=$('#home .module').find(m=>$('b',m)?.textContent?.includes('Prospecção'));
  if(prospection){prospection.dataset.go='prospecting';prospection.onclick=e=>{e.preventDefault();globalThis.go?.('prospecting')}}
  const topButtons=$('#home .top .iconBtn');
  const bell=topButtons.find(b=>b.querySelector('[data-lucide="bell"]'));
  if(bell){
    bell.classList.add('homeBell');
    let badge=$('.homeBellCount',bell);
    if(!badge){badge=document.createElement('span');badge.className='homeBellCount';bell.appendChild(badge)}
    badge.textContent=String(Math.min(99,queue.filter(x=>x.state==='OVERDUE'||x.state==='TODAY').length));
    badge.style.display=badge.textContent==='0'?'none':'grid';
    bell.onclick=e=>{e.preventDefault();globalThis.go?.('executionQueue');globalThis.DUTRA_ACTION_CENTER?.render?.()};
    bell.title='Próximas ações';
  }
  const primaryClient=$('#home .buttons .btn').find(b=>b.dataset.go==='clients');
  if(primaryClient)primaryClient.innerHTML='<i data-lucide="users"></i> Cliente 360°';
  lucide?.createIcons?.();
}

function combinedHistory(lead){
  const items=[];
  for(const x of lead.interactions||[])items.push({id:x.id||Math.random(),at:x.at||x.createdAt,type:x.type||'interaction',title:x.result||x.type||'Interação',note:x.note||''});
  for(const x of arr('activities').filter(a=>String(a.clientId||a.leadId)===String(lead.id)))items.push({id:x.id,at:x.at||x.createdAt||x.dueAt,type:x.type||'activity',title:x.title||x.result||x.type||'Atividade',note:x.note||x.reason||''});
  for(const x of arr('callAttempts').filter(a=>String(a.leadId||a.companyId)===String(lead.id)))items.push({id:x.id,at:x.endedAt||x.createdAt||x.startedAt,type:'call',title:'Ligação · '+clean(x.outcome||'tentativa'),note:x.notes||''});
  for(const x of meetingsFor(lead.id))items.push({id:x.id,at:x.scheduledAt||x.createdAt,type:'meeting',title:'Reunião · '+clean(x.meetingStatus||'agendada'),note:x.objective||x.notes||''});
  for(const x of proposalDocsFor(lead.id))items.push({id:x.id,at:x.preparedAt||x.createdAt,type:'proposal',title:'Proposta · '+clean(x.status||'preparada'),note:x.publicUrl?'Link rastreável disponível':''});
  const seen=new Set();
  return items.filter(x=>{const key=clean(x.id)||[x.at,x.title,x.note].join('|');if(seen.has(key))return false;seen.add(key);return true}).sort((a,b)=>clean(b.at).localeCompare(clean(a.at)));
}
function preferredContact(lead){
  const ps=contactsFor(lead.id);
  return ps.find(p=>['OWNER','DIRECTOR','FLEET_MANAGER','MAINTENANCE_MANAGER','PROCUREMENT'].includes(clean(p.roleCategory||p.role_category).toUpperCase()))||ps[0]||null;
}
function nextActionFor(lead){
  const item=actionQueue().find(x=>String(x.leadId)===String(lead.id));
  if(item)return item;
  const nba=globalThis.OG_LEAD_INTELLIGENCE?.nextBestAction?.(lead);
  return{action:nba?.action||lead.nextAction||'Definir próxima ação',reason:nba?.reason||lead.nextActionReason||'Sem motivo registrado.',dueAt:lead.followUpAt||null,type:lead.nextActionType||'FOLLOW_UP'};
}

function smartViews(){
  const intel=globalThis.OG_LEAD_INTELLIGENCE;
  return Array.isArray(intel?.CRM_ACCOUNT_VIEWS)&&intel.CRM_ACCOUNT_VIEWS.length?intel.CRM_ACCOUNT_VIEWS:[
    {id:'all',label:'Todos'},{id:'customers',label:'Clientes'},{id:'prospects',label:'Prospects'},{id:'proposals',label:'Propostas'},{id:'strategic',label:'Estratégicas'},{id:'talked',label:'Já conversados'}
  ];
}
function smartViewCounts(){
  const intel=globalThis.OG_LEAD_INTELLIGENCE;
  if(intel?.summarizeCrmViews)return intel.summarizeCrmViews(leads());
  const ls=leads();return{all:ls.length};
}
function smartViewLeads(){
  const intel=globalThis.OG_LEAD_INTELLIGENCE;
  const rows=leads().filter(l=>clientSmartView==='all'||!intel?.matchesCrmView||intel.matchesCrmView(l,clientSmartView));
  return intel?.filterSort?intel.filterSort(rows,{},new Date()):rows;
}
function ensureClientSmartViews(){
  const picker=$('#clientPicker');if(!picker||$('#clientSmartViews'))return;
  const wrap=document.createElement('section');wrap.id='clientSmartViews';wrap.className='clientSmartViews';
  wrap.innerHTML='<div class="clientSmartViewScroll" id="clientSmartViewScroll"></div><div class="clientSmartSummary"><strong id="clientSmartTitle">Base CRM</strong><span id="clientSmartCount">0 contas</span></div><div class="clientSmartList" id="clientSmartList"></div>';
  picker.after(wrap);
  wrap.addEventListener('click',e=>{
    const chip=e.target.closest('[data-crm-view]');
    if(chip){clientSmartView=chip.dataset.crmView||'all';renderClientSmartViews();return}
    const account=e.target.closest('[data-smart-client]');
    if(account){core()?.selectClient?.(account.dataset.smartClient);return}
  });
}
function renderClientSmartViews(){
  ensureClientSmartViews();
  const chips=$('#clientSmartViewScroll'),list=$('#clientSmartList'),title=$('#clientSmartTitle'),count=$('#clientSmartCount');
  if(!chips||!list)return;
  const views=smartViews(),counts=smartViewCounts(),active=views.find(v=>v.id===clientSmartView)||views[0]||{id:'all',label:'Todos'};
  if(!views.some(v=>v.id===clientSmartView))clientSmartView=active.id;
  chips.innerHTML=views.map(v=>'<button class="clientSmartChip '+(v.id===clientSmartView?'active':'')+'" data-crm-view="'+attr(v.id)+'">'+esc(v.label)+' <b>'+Number(counts[v.id]||0)+'</b></button>').join('');
  const rows=smartViewLeads().slice(0,30);
  if(title)title.textContent=active.label||'Base CRM';
  if(count)count.textContent=(counts[clientSmartView]??rows.length)+' conta(s)';
  list.innerHTML=rows.length?rows.map(l=>'<button class="clientSmartAccount '+(String(selected()?.id)===String(l.id)?'active':'')+'" data-smart-client="'+attr(l.id)+'"><div class="thumb">'+esc(clean(l.empresa||l.nome).slice(0,1).toUpperCase()||'C')+'</div><div><b>'+esc(l.empresa||l.nome||'Conta')+'</b><small>'+esc([l.nome&&l.nome!==l.empresa?l.nome:'',l.cidadeUf||'',l.nextAction||'Sem próxima ação'].filter(Boolean).join(' · '))+'</small></div><span class="clientSmartStage">'+esc(pipelineLabel(l))+'</span></button>').join(''):'<div class="clientNoData">Nenhuma conta nesta visão.</div>';
}
function ensureClientPicker(){
  const screen=$('#clients'),head=$('.pageHead',screen);if(!screen||!head||$('#clientPicker',screen))return;
  const wrap=document.createElement('div');wrap.id='clientPicker';wrap.className='clientPicker';wrap.innerHTML='<input class="clientPickerInput" id="clientPickerInput" placeholder="Trocar cliente: busque empresa, CNPJ, telefone ou cidade…"><i class="clientPickerIcon" data-lucide="search"></i><div class="clientPickerResults" id="clientPickerResults"></div>';
  head.after(wrap);
  ensureClientSmartViews();
  const input=$('#clientPickerInput'),results=$('#clientPickerResults');
  input.addEventListener('input',()=>{
    const q=clean(input.value).toLowerCase();
    if(q.length<2){results.classList.remove('open');results.innerHTML='';return}
    const crm=globalThis.OG_CRM_SERVICE;
    const matches=leads().filter(l=>crm?.matchesSearch?crm.matchesSearch(l,q):[l.empresa,l.nome,l.cnpj,l.telefone,l.cidadeUf].some(v=>clean(v).toLowerCase().includes(q))).slice(0,12);
    results.innerHTML=matches.map(l=>`<div class="clientPickRow" data-pick-client="${attr(l.id)}"><div class="thumb">${esc(clean(l.empresa||l.nome).slice(0,1).toUpperCase())}</div><div><b>${esc(l.empresa||l.nome||'Conta')}</b><small>${esc([l.nome,l.cidadeUf,l.cnpj].filter(Boolean).join(' · '))}</small></div></div>`).join('')||'<div class="clientNoData">Nenhuma conta encontrada.</div>';
    results.classList.add('open');
  });
  results.addEventListener('click',e=>{const row=e.target.closest('[data-pick-client]');if(!row)return;input.value='';results.classList.remove('open');core()?.selectClient?.(row.dataset.pickClient)});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))results.classList.remove('open')});
}

function renderClient(){
  if(!snapshot())return;
  ensureClientPicker();
  renderClientSmartViews();
  const lead=selected(),screen=$('#clients');if(!screen)return;
  const clientMenu=$('.pageHead > .iconBtn:last-child',screen);
  if(clientMenu){clientMenu.style.display='none';clientMenu.setAttribute('aria-hidden','true')}
  const appMenu=$('#application .pageHead > .iconBtn:last-child');
  if(appMenu){appMenu.style.display='none';appMenu.setAttribute('aria-hidden','true')}
  if(!lead){$('.clientInfo h2',screen).textContent='Nenhum cliente selecionado';$('.clientInfo p',screen).textContent='Use a busca acima para abrir uma conta.';return}

  const title=$('.clientInfo h2',screen),subtitle=$('.clientInfo p',screen),avatar=$('.bigAvatar',screen);
  title.textContent=lead.empresa||lead.nome||'Conta';
  subtitle.textContent=[lead.nome&&lead.nome!==lead.empresa?lead.nome:'',lead.cidadeUf||'',lead.cnpj?lead.cnpj:'',lead.internalCode?'OG '+lead.internalCode:''].filter(Boolean).join(' · ')||'Conta da base real';
  avatar.textContent=clean(lead.empresa||lead.nome).slice(0,1).toUpperCase()||'C';

  const badges=$('.clientBadges',screen);
  if(badges)badges.innerHTML=`<span class="clientBadgeDynamic relationship">${esc(relationshipLabel(lead))}</span><span class="clientBadgeDynamic pipeline">${esc(pipelineLabel(lead))}</span>`;

  const contact=preferredContact(lead),phone=contact?.phone||contact?.whatsapp||lead.telefone,email=contact?.email||lead.email;
  const topBtns=$$('.contactBtns .iconBtn',screen);
  topBtns.forEach((b,i)=>{b.dataset.realAction=i===0?'call':i===1?'whatsapp':'email';b.title=i===0?'Ligar':i===1?'WhatsApp':'E-mail';b.disabled=i===2?!email:!phone});

  const proposals=proposalDocsFor(lead.id),people=contactsFor(lead.id),opportunities=opportunitiesFor(lead.id),meetings=meetingsFor(lead.id),nba=nextActionFor(lead),fleet=fleetValue(lead);
  const stats=$$('.miniStat',screen),vals=[
    [fleet||'—','Veículos'],
    [people.length,'Pessoas'],
    [proposals.length,'Propostas'],
    [opportunities.filter(o=>!['won','lost','closed'].includes(clean(o.stage).toLowerCase())).length,'Oportunidades']
  ];
  stats.forEach((box,i)=>{if(!vals[i])return;$('strong',box).textContent=String(vals[i][0]);$('small',box).textContent=vals[i][1]});

  const actions=$$('.clientAction',screen);
  const actionTypes=['call','whatsapp','next','proposal'];
  actions.forEach((b,i)=>{b.dataset.realAction=actionTypes[i];if(i===3)b.removeAttribute('data-go')});

  const overview=$('[data-client-panel="overview"]',screen);
  if(overview){
    const latestMeeting=meetings[0],opp=opportunities.find(o=>!['won','lost','closed'].includes(clean(o.stage).toLowerCase()))||opportunities[0];
    overview.innerHTML=`
      <div class="clientOverviewGrid">
        <div class="clientRealCard"><label>PRÓXIMA MELHOR AÇÃO</label><strong>${esc(nba.action)}</strong><p>${esc(nba.reason||'Sem motivo registrado.')}${nba.dueAt?'<br>Prazo: '+esc(fmtDate(nba.dueAt)):''}</p></div>
        <div class="clientRealCard"><label>RELACIONAMENTO OG</label><strong>${esc(relationshipLabel(lead))}</strong><p>Pipeline: ${esc(pipelineLabel(lead))}. ${esc(lead.accountSummary||lead.pain||'Sem resumo operacional registrado.')}</p></div>
        <div class="clientRealCard"><label>OPORTUNIDADE</label><strong>${esc(opp?.title||opp?.stage||'Nenhuma oportunidade estruturada')}</strong><p>${esc(opp?.nextAction||lead.nextAction||'Mapeie diagnóstico e próximo compromisso.')}</p></div>
        <div class="clientRealCard"><label>REUNIÃO</label><strong>${latestMeeting?esc(latestMeeting.meetingStatus||'Agendada'):'Nenhuma reunião'}</strong><p>${latestMeeting?esc(fmtDate(latestMeeting.scheduledAt)+' · '+(latestMeeting.objective||latestMeeting.decisionMaker||'')):'Converta uma conversa qualificada em reunião quando fizer sentido.'}</p></div>
      </div>
      <div class="clientPeople"><div class="clientPeopleHead"><h3>Pessoas da conta</h3><button id="clientAddPerson">+ mapear pessoa</button></div>
      ${people.length?people.map(p=>`<div class="clientPerson"><div><b>${esc(p.name||'Contato')}</b><small>${esc([p.role,p.phone||p.whatsapp,p.email].filter(Boolean).join(' · '))}</small></div><span class="clientRole">${esc(p.roleCategory||p.role_category||'UNKNOWN')}</span></div>`).join(''):'<div class="clientNoData" style="margin-top:8px">Nenhuma pessoa mapeada nesta conta.</div>'}
      </div>`;
    $('#clientAddPerson',overview)?.addEventListener('click',()=>{globalThis.go?.('prospecting');notify('Abra ou crie uma lista com esta conta para mapear pessoas pelo Call Mode.');});
  }

  const fleetPanel=$('[data-client-panel="fleet"]',screen);
  if(fleetPanel){
    const section=$('.section',fleetPanel);
    section.innerHTML=`<div class="sectionHead"><h2>Frota do cliente</h2><button data-real-action="application">Aplicação técnica →</button></div>
    <div class="clientFleetFacts">
      <div class="clientFleetFact"><small>TAMANHO CONHECIDO</small><strong>${esc(fleet?fleet+' veículos':'A mapear')}</strong></div>
      <div class="clientFleetFact"><small>SEGMENTO</small><strong>${esc(lead.segmentId||lead.segmento||'Não informado')}</strong></div>
      <div class="clientFleetFact"><small>DOR REGISTRADA</small><strong>${esc(lead.pain||'Não informada')}</strong></div>
      <div class="clientFleetFact"><small>POTENCIAL</small><strong>${esc(lead.potential||'A qualificar')}</strong></div>
    </div>
    <div class="clientRealCard" style="margin-top:9px"><label>CONTEXTO DA OPERAÇÃO</label><strong>${esc(lead.accountSummary||'Sem resumo estruturado')}</strong><p>O DUTRA OS não inventa composição de frota. Veículos e aplicações técnicas devem ser confirmados antes de entrar em proposta.</p></div>`;
  }

  const proposalsPanel=$('[data-client-panel="proposals"]',screen);
  if(proposalsPanel){
    const section=$('.section',proposalsPanel);
    section.innerHTML='<div class="sectionHead"><h2>Propostas oficiais</h2><button data-real-action="proposal">Nova proposta →</button></div>'+
      (proposals.length?proposals.slice(0,10).map(p=>{const snap=p.snapshot||p.proposalSnapshot||{},commercial=snap.commercial||{};return`<div class="clientProposalItem"><div><b>${esc(p.id||'Proposta')}</b><small>${esc([p.status||'preparada',fmtDate(p.preparedAt||p.createdAt)].join(' · '))}</small></div><strong>${money(commercial.totalValue||p.totalValue||0)}</strong>${p.publicUrl?'<button data-open-url="'+attr(p.publicUrl)+'">Abrir proposta rastreável</button>':''}</div>`}).join(''):'<div class="clientNoData">Nenhuma proposta oficial preparada para esta conta.</div>')+
      '<button class="btn primary full" data-real-action="proposal"><i data-lucide="file-plus-2"></i> Criar proposta oficial</button>';
  }

  const historyPanel=$('[data-client-panel="history"]',screen);
  if(historyPanel){
    const section=$('.section',historyPanel),history=combinedHistory(lead).slice(0,20);
    section.innerHTML='<div class="sectionHead"><h2>Histórico unificado</h2><button>'+history.length+' registros</button></div>'+
      (history.length?history.map(x=>`<div class="clientHistoryItem"><div class="clientHistoryIcon"><i data-lucide="${x.type==='call'?'phone-call':x.type==='meeting'?'calendar-check':x.type==='proposal'?'file-text':x.type==='message'?'message-circle':'activity'}"></i></div><div><b>${esc(x.title)}</b><small>${esc(x.note||'Sem observação adicional.')}</small></div><time>${esc(fmtDate(x.at))}</time></div>`).join(''):'<div class="clientNoData">Nenhuma atividade registrada para esta conta.</div>');
  }
  lucide?.createIcons?.();
}

function executeAction(action,lead){
  const contact=preferredContact(lead),phone=contact?.phone||contact?.whatsapp||lead.telefone,email=contact?.email||lead.email;
  if(action==='call'){
    try{globalThis.DUTRA_CALL_PROVIDER?.startCall?.(phone,{leadId:lead.id,contactId:contact?.id})||(()=>{throw new Error('Discador não disponível')})()}catch(e){notify(e.message)}
    return;
  }
  if(action==='whatsapp'){
    try{
      const msg=globalThis.DUTRA_WHATSAPP_ACTION?.fillTemplate?.(relationshipLabel(lead)==='CLIENTE'?'reactivation':'presentation',{nome:contact?.name||lead.nome||'',empresa:lead.empresa||''})||'';
      globalThis.DUTRA_WHATSAPP_ACTION?.open?.(phone,msg,{leadId:lead.id,contactId:contact?.id});
    }catch(e){notify(e.message)}return;
  }
  if(action==='email'){
    if(!email){notify('Nenhum e-mail cadastrado para esta conta.');return}
    location.href='mailto:'+encodeURIComponent(email)+'?subject='+encodeURIComponent('Olho de Gato — contato comercial');return;
  }
  if(action==='next'){
    globalThis.DUTRA_ACTION_CENTER?.open?.(lead,lead.nextActionType||'FOLLOW_UP',{reason:lead.nextActionReason||'Definir próximo compromisso no Cliente 360°.'});return;
  }
  if(action==='proposal'){
    try{globalThis.DUTRA_QUOTE_HANDOFF?.launch?.(lead,contact||{}, {target:'_blank'});}catch(e){notify(e.message)}return;
  }
  if(action==='application'){globalThis.go?.('application');return}
}

function bind(){
  document.addEventListener('click',e=>{
    const button=e.target.closest('[data-real-action]');
    if(button){
      const lead=selected();if(!lead)return;
      e.preventDefault();e.stopPropagation();executeAction(button.dataset.realAction,lead);return;
    }
    const url=e.target.closest('[data-open-url]');if(url){e.preventDefault();window.open(url.dataset.openUrl,'_blank','noopener')}
  },true);
}

function boot(){
  addStyles();neutralize();ensureClientPicker();ensureHomePrivacyToggle();bind();
  window.addEventListener('dutra:state',()=>{renderHome();renderClient()});
  window.addEventListener('dutra:client',()=>renderClient());
  if(snapshot()){renderHome();renderClient()}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();