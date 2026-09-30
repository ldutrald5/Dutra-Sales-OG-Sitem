'use strict';

const DEFAULT_TIMEOUT = 8000;
function cfg(env = process.env) {
  const base = String(env.OG_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = String(env.OG_SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return { base, key, enabled: Boolean(base && key) };
}
function headers(key, extra = {}) {
  return { apikey:key, authorization:'Bearer '+key, 'content-type':'application/json', ...extra };
}
async function request(path, options = {}, env = process.env) {
  const c = cfg(env);
  if (!c.enabled) return { configured:false, status:503, data:null, error:'Sales Execution gateway não configurado.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(env.OG_SUPABASE_TIMEOUT_MS || DEFAULT_TIMEOUT));
  try {
    const response = await fetch(c.base + '/rest/v1/' + path, {
      method:options.method || 'GET', headers:headers(c.key, options.headers),
      body:options.body === undefined ? undefined : JSON.stringify(options.body), signal:controller.signal
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;
    return { configured:true, status:response.status, data, error:response.ok ? null : (data?.message || data?.hint || 'Supabase HTTP '+response.status) };
  } finally { clearTimeout(timer); }
}
function safeId(value) {
  const v=String(value||'').trim();
  if(!/^[0-9a-f-]{36}$/i.test(v)) throw new Error('ID inválido');
  return v;
}
async function listLists(env) {
  return request('lead_lists?select=id,name,status,created_at,updated_at&order=created_at.desc&limit=100',{},env);
}
async function sessionQueue(sessionId, env) {
  const sid=safeId(sessionId);
  const s=await request('prospecting_sessions?id=eq.'+encodeURIComponent(sid)+'&select=id,list_id,current_member_id,status,started_at,ended_at&limit=1',{},env);
  if(s.error || !s.data?.[0]) return s.error?s:{...s,status:404,error:'Sessão não encontrada'};
  const session=s.data[0];
  const q=await request('lead_list_members?list_id=eq.'+encodeURIComponent(session.list_id)+'&work_status=in.(AVAILABLE,IN_PROGRESS)&select=id,list_id,company_id,primary_contact_id,position,work_status,enrichment_status,briefing_cache,briefing_valid_until,last_attempt_at,worked_at&order=position.asc&limit=500',{},env);
  return q.error?q:{configured:true,status:200,data:{session,members:q.data||[]},error:null};
}
async function accountContext(companyId, env) {
  const id=safeId(companyId);
  const company=await request('companies?id=eq.'+id+'&select=*&limit=1',{},env);
  if(company.error || !company.data?.[0]) return company.error?company:{...company,status:404,error:'Empresa não encontrada'};
  const [contacts,opps,activities,briefings]=await Promise.all([
    request('crm_contacts?company_id=eq.'+id+'&select=*&order=influence_level.desc&limit=20',{},env),
    request('sales_opportunities?company_id=eq.'+id+'&select=*&order=updated_at.desc&limit=10',{},env),
    request('crm_activities?company_id=eq.'+id+'&select=*&order=created_at.desc&limit=20',{},env),
    request('ai_briefings?company_id=eq.'+id+'&select=*&order=created_at.desc&limit=5',{},env)
  ]);
  const failed=[contacts,opps,activities,briefings].find(x=>x.error);
  if(failed) return failed;
  return {configured:true,status:200,data:{company:company.data[0],contacts:contacts.data||[],opportunities:opps.data||[],recentActivities:activities.data||[],briefings:briefings.data||[]},error:null};
}
const RESULT_STAGE = Object.freeze({
  NO_ANSWER:'CONTACT_ATTEMPTED', INVALID_NUMBER:'CONTACT_ATTEMPTED', GATEKEEPER:'CONNECTED',
  DECISION_MAKER_IDENTIFIED:'DECISION_MAKER_IDENTIFIED', DECISION_MAKER_REACHED:'DECISION_MAKER_CONTACTED',
  RETURN_LATER:'CONNECTED', QUALIFIED:'QUALIFIED', MEETING_BOOKED:'MEETING_SCHEDULED',
  SEND_MATERIAL:'CONNECTED', PROPOSAL:'PROPOSAL', NOT_INTERESTED:'LOST'
});
function normalizeCallCommand(body={}) {
  const result=String(body.result||'').trim().toUpperCase();
  if(!Object.hasOwn(RESULT_STAGE,result)) throw new Error('Resultado de ligação inválido');
  const externalId=String(body.externalId||body.idempotencyKey||'').trim().slice(0,180);
  if(!externalId) throw new Error('externalId/idempotencyKey é obrigatório');
  return {
    externalId, result, companyId:safeId(body.companyId), sessionId:body.sessionId?safeId(body.sessionId):null,
    memberId:body.memberId?safeId(body.memberId):null, contactId:body.contactId?safeId(body.contactId):null,
    opportunityId:body.opportunityId?safeId(body.opportunityId):null,
    note:String(body.note||'').trim().slice(0,2000),
    nextActionType:String(body.nextActionType||'').trim().toUpperCase().slice(0,60),
    nextActionAt:body.nextActionAt||null,
    meeting:body.meeting&&typeof body.meeting==='object'?body.meeting:null
  };
}
async function recordCallResult(body={}, env) {
  const cmd=normalizeCallCommand(body);
  const existing=await request('call_attempts?external_id=eq.'+encodeURIComponent(cmd.externalId)+'&select=*&limit=1',{},env);
  if(existing.error) return existing;
  if(existing.data?.[0]) return {configured:true,status:200,data:{duplicate:true,callAttempt:existing.data[0]},error:null};

  const attemptBody={external_id:cmd.externalId,company_id:cmd.companyId,contact_id:cmd.contactId,session_id:cmd.sessionId,member_id:cmd.memberId,result:cmd.result,
    connected:['GATEKEEPER','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','SEND_MATERIAL','PROPOSAL'].includes(cmd.result),
    decision_maker_reached:['DECISION_MAKER_REACHED','QUALIFIED','MEETING_BOOKED','PROPOSAL'].includes(cmd.result),
    qualified:['QUALIFIED','MEETING_BOOKED','PROPOSAL'].includes(cmd.result),notes:cmd.note||null};
  const inserted=await request('call_attempts',{method:'POST',headers:{Prefer:'return=representation'},body:attemptBody},env);
  if(inserted.error) return inserted;

  // P0 deliberately stops after the canonical attempt fact. Opportunity/activity/meeting
  // mutation is enabled only after a server-side transactional RPC exists.
  return {configured:true,status:201,data:{duplicate:false,callAttempt:inserted.data?.[0]||null,
    proposedStage:RESULT_STAGE[cmd.result],pendingMutations:{opportunity:Boolean(cmd.opportunityId),activity:true,meeting:cmd.result==='MEETING_BOOKED'}},error:null};
}

async function startSession(body={}, env) {
  const listId=safeId(body.listId);
  const sellerId=String(body.sellerId||'').trim().slice(0,160);
  if(!sellerId) throw new Error('sellerId é obrigatório');
  return request('prospecting_sessions',{method:'POST',headers:{Prefer:'return=representation'},body:{list_id:listId,seller_id:sellerId,status:'ACTIVE',external_id:String(body.externalId||'').trim()||undefined}},env);
}
module.exports={cfg,request,listLists,sessionQueue,accountContext,startSession,normalizeCallCommand,recordCallResult,RESULT_STAGE};
