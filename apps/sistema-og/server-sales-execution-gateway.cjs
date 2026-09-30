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
async function startSession(body={}, env) {
  const listId=safeId(body.listId);
  const sellerId=String(body.sellerId||'').trim().slice(0,160);
  if(!sellerId) throw new Error('sellerId é obrigatório');
  return request('prospecting_sessions',{method:'POST',headers:{Prefer:'return=representation'},body:{list_id:listId,seller_id:sellerId,status:'ACTIVE',external_id:String(body.externalId||'').trim()||undefined}},env);
}
module.exports={cfg,request,listLists,sessionQueue,accountContext,startSession};
