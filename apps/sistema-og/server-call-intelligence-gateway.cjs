'use strict';

const DEFAULT_TIMEOUT = 12000;

function cfg(env = process.env) {
  const edgeUrl = String(env.OG_CALL_INTELLIGENCE_EDGE_URL || '').trim().replace(/\/$/, '');
  const edgeToken = String(env.OG_CALL_INTELLIGENCE_EDGE_TOKEN || '').trim();
  return { edgeUrl, edgeToken, enabled:Boolean(edgeUrl && edgeToken) };
}

async function edgeRequest(action, payload = {}, env = process.env, timeoutMs = DEFAULT_TIMEOUT) {
  const c = cfg(env);
  if (!c.enabled) return { configured:false, status:503, data:null, error:'Call Intelligence não configurado no servidor.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || DEFAULT_TIMEOUT));
  try {
    const response = await fetch(c.edgeUrl, {
      method:'POST',
      headers:{ 'content-type':'application/json', 'x-og-call-intelligence-token':c.edgeToken },
      body:JSON.stringify({ action, payload }),
      signal:controller.signal
    });
    const raw = await response.text();
    let parsed = {};
    try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { error:raw || 'Resposta inválida do Call Intelligence' }; }
    return {
      configured:true,
      status:response.status,
      data:parsed?.data ?? null,
      error:response.ok && parsed?.ok !== false ? null : (parsed?.error || 'Call Intelligence HTTP '+response.status)
    };
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    return { configured:true, status:timeout ? 504 : 502, data:null, error:timeout ? 'Call Intelligence excedeu o tempo limite.' : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

function safeSession(value) {
  const session = String(value || '').trim().slice(0,160);
  if (!session || !/^[A-Za-z0-9._:-]+$/.test(session)) throw new Error('callSessionId inválido');
  return session;
}

module.exports = {
  cfg,
  edgeRequest,
  health: env => edgeRequest('health', {}, env),
  initRecording: (body, env) => edgeRequest('init_recording', body, env),
  completeRecording: (body, env) => edgeRequest('complete_recording', body, env, 20000),
  status: (callSessionId, env) => edgeRequest('recording_status', { callSessionId:safeSession(callSessionId) }, env),
  transcribe: (body, env) => edgeRequest('transcribe', { ...body, callSessionId:safeSession(body?.callSessionId) }, env, 20000),
  manualTranscript: (body, env) => edgeRequest('manual_transcript', { ...body, callSessionId:safeSession(body?.callSessionId) }, env, 20000),
  linkResult: (body, env) => edgeRequest('link_result', { ...body, callSessionId:safeSession(body?.callSessionId) }, env),
  dashboard: (days, env) => edgeRequest('dashboard', { days:Math.max(1,Math.min(365,Number(days)||30)) }, env)
};
