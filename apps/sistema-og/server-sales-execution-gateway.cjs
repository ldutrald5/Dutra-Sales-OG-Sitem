'use strict';

const DEFAULT_TIMEOUT = 8000;

function cfg(env = process.env) {
  const edgeUrl = String(env.OG_SALES_EXECUTION_EDGE_URL || '').trim().replace(/\/$/, '');
  const edgeToken = String(env.OG_SALES_EXECUTION_EDGE_TOKEN || '').trim();
  const base = String(env.OG_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = String(env.OG_SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const edgeEnabled = Boolean(edgeUrl && edgeToken);
  const directEnabled = Boolean(base && key);
  return {
    edgeUrl, edgeToken, base, key,
    mode: edgeEnabled ? 'edge' : directEnabled ? 'direct' : 'disabled',
    enabled: edgeEnabled || directEnabled
  };
}

function headers(key, extra = {}) {
  return { apikey:key, authorization:'Bearer '+key, 'content-type':'application/json', ...extra };
}

async function withTimeout(fn, env = process.env) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(env.OG_SUPABASE_TIMEOUT_MS || DEFAULT_TIMEOUT));
  try { return await fn(controller.signal); }
  finally { clearTimeout(timer); }
}

async function request(path, options = {}, env = process.env) {
  const c = cfg(env);
  if (c.mode !== 'direct') return { configured:c.enabled, status:503, data:null, error:'Supabase direct mode não configurado.' };
  return withTimeout(async signal => {
    const response = await fetch(c.base + '/rest/v1/' + path, {
      method:options.method || 'GET',
      headers:headers(c.key, options.headers),
      body:options.body === undefined ? undefined : JSON.stringify(options.body),
      signal
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;
    return { configured:true, status:response.status, data, error:response.ok ? null : (data?.message || data?.hint || 'Supabase HTTP '+response.status) };
  }, env);
}

async function edgeRequest(action, payload = {}, env = process.env) {
  const c = cfg(env);
  if (c.mode !== 'edge') return { configured:c.enabled, status:503, data:null, error:'Sales Execution Edge gateway não configurado.' };
  return withTimeout(async signal => {
    const response = await fetch(c.edgeUrl, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'x-og-gateway-token':c.edgeToken },
      body:JSON.stringify({ action, payload }),
      signal
    });
    const raw = await response.text();
    const parsed = raw ? JSON.parse(raw) : {};
    const data = parsed?.data ?? null;
    return { configured:true, status:response.status, data, error:response.ok && parsed?.ok !== false ? null : (parsed?.error || 'Edge gateway HTTP '+response.status) };
  }, env);
}

function safeId(value) {
  const v=String(value||'').trim();
  if(!/^[0-9a-f-]{36}$/i.test(v)) throw new Error('ID inválido');
  return v;
}

async function health(env) {
  const c=cfg(env);
  if(!c.enabled) return {configured:false,status:200,data:{ok:true,configured:false,mode:'disabled'},error:null};
  if(c.mode==='edge') {
    const result=await edgeRequest('health',{},env);
    return result.error?result:{...result,data:{...(result.data||{}),configured:true,mode:'edge'}};
  }
  return {configured:true,status:200,data:{ok:true,configured:true,mode:'direct'},error:null};
}

async function listLists(env) {
  const c=cfg(env);
  if(c.mode==='edge') return edgeRequest('list_lists',{},env);
  return request('lead_lists?select=id,name,source,status,total_count,worked_count,meetings_count,proposals_count,sales_count,created_at,updated_at&status=eq.ACTIVE&order=created_at.desc&limit=100',{},env);
}

async function sessionQueue(sessionId, env) {
  const sid=safeId(sessionId);
  const c=cfg(env);
  if(c.mode==='edge') return edgeRequest('session_queue',{sessionId:sid},env);

  const s=await request('prospecting_sessions?id=eq.'+encodeURIComponent(sid)+'&select=id,list_id,current_member_id,status,target_calls,started_at,finished_at&limit=1',{},env);
  if(s.error || !s.data?.[0]) return s.error?s:{...s,status:404,error:'Sessão não encontrada'};
  const session=s.data[0];
  const q=await request('lead_list_members?list_id=eq.'+encodeURIComponent(session.list_id)+'&work_status=in.(AVAILABLE,IN_PROGRESS)&select=id,list_id,company_id,primary_contact_id,position,work_status,enrichment_status,briefing_cache,briefing_valid_until,last_attempt_at,worked_at&order=position.asc&limit=500',{},env);
  return q.error?q:{configured:true,status:200,data:{session,members:q.data||[]},error:null};
}

async function accountContext(companyId, env) {
  const id=safeId(companyId);
  const c=cfg(env);
  if(c.mode==='edge') return edgeRequest('account_context',{companyId:id},env);

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
  const payload={
    externalId:cmd.externalId,result:cmd.result,companyId:cmd.companyId,sessionId:cmd.sessionId,
    memberId:cmd.memberId,contactId:cmd.contactId,opportunityId:cmd.opportunityId,note:cmd.note,
    nextActionType:cmd.nextActionType,nextActionAt:cmd.nextActionAt,meeting:cmd.meeting
  };
  const c=cfg(env);
  if(c.mode==='edge') return edgeRequest('record_call_result',payload,env);
  const rpc=await request('rpc/record_sales_execution_result_v1',{
    method:'POST', headers:{Prefer:'return=representation'}, body:{p_command:payload}
  },env);
  return rpc.error?rpc:{configured:true,status:rpc.status||200,data:rpc.data,error:null};
}

async function startSession(body={}, env) {
  const listId=safeId(body.listId);
  const externalId=String(body.externalId||'').trim().slice(0,180);
  const targetCalls=Math.max(1,Math.min(10000,Number(body.targetCalls)||25));
  const rawSeller=String(body.sellerId||'').trim();
  const sellerId=/^[0-9a-f-]{36}$/i.test(rawSeller)?rawSeller:null;
  const c=cfg(env);

  if(c.mode==='edge') return edgeRequest('start_session',{listId,externalId,targetCalls,sellerId},env);

  if (externalId) {
    const existing=await request('prospecting_sessions?external_id=eq.'+encodeURIComponent(externalId)+'&select=*&limit=1',{},env);
    if(existing.error) return existing;
    if(existing.data?.[0]) return {configured:true,status:200,data:[existing.data[0]],error:null};
  }

  return request('prospecting_sessions',{
    method:'POST',
    headers:{Prefer:'return=representation'},
    body:{list_id:listId,seller_id:sellerId,status:'ACTIVE',target_calls:targetCalls,external_id:externalId||null}
  },env);
}

module.exports={cfg,health,request,edgeRequest,listLists,sessionQueue,accountContext,startSession,normalizeCallCommand,recordCallResult,RESULT_STAGE};
