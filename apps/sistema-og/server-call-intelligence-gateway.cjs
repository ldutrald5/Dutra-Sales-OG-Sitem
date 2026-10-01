'use strict';

const DEFAULT_TIMEOUT = 12000;
const WORKER_TIMEOUT = 15000;

function cfg(env = process.env) {
  const edgeUrl = String(env.OG_CALL_INTELLIGENCE_EDGE_URL || '').trim().replace(/\/$/, '');
  const edgeToken = String(env.OG_CALL_INTELLIGENCE_EDGE_TOKEN || '').trim();
  const localWhisperUrl = String(env.OG_LOCAL_WHISPER_URL || '').trim().replace(/\/$/, '');
  const localWhisperToken = String(env.OG_LOCAL_WHISPER_TOKEN || '').trim();
  const localWhisperModel = String(env.OG_LOCAL_WHISPER_MODEL || 'base').trim() || 'base';
  return {
    edgeUrl,
    edgeToken,
    enabled:Boolean(edgeUrl && edgeToken),
    localWhisperUrl,
    localWhisperToken,
    localWhisperModel,
    localWhisperEnabled:Boolean(localWhisperUrl && localWhisperToken)
  };
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

async function workerRequest(path, options = {}, env = process.env, timeoutMs = WORKER_TIMEOUT) {
  const c = cfg(env);
  if (!c.localWhisperEnabled) return { configured:false, status:503, data:null, error:'Whisper local não configurado.' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || WORKER_TIMEOUT));
  try {
    const response = await fetch(c.localWhisperUrl + path, {
      method:options.method || 'GET',
      headers:{
        'content-type':'application/json',
        'x-og-whisper-token':c.localWhisperToken,
        ...(options.headers || {})
      },
      body:options.body === undefined ? undefined : JSON.stringify(options.body),
      signal:controller.signal
    });
    const raw = await response.text();
    let parsed = {};
    try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = { detail:raw || 'Resposta inválida do Whisper local' }; }
    return {
      configured:true,
      status:response.status,
      data:response.ok ? parsed : null,
      error:response.ok ? null : (parsed?.detail || parsed?.error || 'Whisper local HTTP '+response.status)
    };
  } catch (error) {
    const timeout = error?.name === 'AbortError';
    return { configured:true, status:timeout ? 504 : 502, data:null, error:timeout ? 'Whisper local excedeu o tempo limite.' : String(error?.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

function safeSession(value) {
  const session = String(value || '').trim().slice(0,160);
  if (!session || !/^[A-Za-z0-9._:-]+$/.test(session)) throw new Error('callSessionId inválido');
  return session;
}

async function localHealth(env) {
  const c = cfg(env);
  if (!c.localWhisperEnabled) return { ready:false, model:c.localWhisperModel, error:'unconfigured' };
  const result = await workerRequest('/health', {}, env, 8000);
  return {
    ready:!result.error && Boolean(result.data?.ok),
    model:result.data?.model || c.localWhisperModel,
    modelLoaded:Boolean(result.data?.modelLoaded),
    activeJobs:Number(result.data?.activeJobs || 0),
    error:result.error || result.data?.modelError || null
  };
}

async function health(env) {
  const edge = await edgeRequest('health', {}, env);
  if (edge.error) return edge;
  const local = await localHealth(env);
  return {
    ...edge,
    data:{
      ...(edge.data || {}),
      localFallbackReady:local.ready,
      localWhisperModel:local.model,
      localWhisperLoaded:local.modelLoaded,
      localWhisperError:local.error
    }
  };
}

async function reconcileLocalJob(edgeStatus, env) {
  const recording = edgeStatus?.data?.recording;
  const external = recording?.metadata?.external_transcription;
  const jobId = external?.jobId;
  if (!recording || recording.transcription_provider !== 'faster-whisper' || recording.transcription_status !== 'PROCESSING' || !jobId) return edgeStatus;
  const c = cfg(env);
  if (!c.localWhisperEnabled) return edgeStatus;

  const job = await workerRequest('/jobs/' + encodeURIComponent(jobId), {}, env, 8000);
  if (job.status === 404) {
    await edgeRequest('external_transcription_failed', {
      callSessionId:recording.call_session_id,
      error:'Whisper local reiniciou antes de concluir. Tente novamente.'
    }, env);
    return edgeRequest('recording_status', { callSessionId:recording.call_session_id }, env);
  }
  if (job.error) return edgeStatus;

  if (job.data?.status === 'READY' && job.data?.result?.text) {
    const result = job.data.result;
    const saved = await edgeRequest('external_transcript', {
      callSessionId:recording.call_session_id,
      provider:'faster-whisper',
      model:result.model || c.localWhisperModel,
      text:result.text,
      segments:result.segments || [],
      language:result.language || 'pt',
      languageProbability:result.languageProbability,
      durationMs:result.durationMs,
      audioBytes:result.audioBytes,
      device:result.device || 'cpu',
      computeType:result.computeType || 'int8'
    }, env, 20000);
    if (saved.error) return saved;
    return edgeRequest('recording_status', { callSessionId:recording.call_session_id }, env);
  }

  if (job.data?.status === 'FAILED') {
    await edgeRequest('external_transcription_failed', {
      callSessionId:recording.call_session_id,
      error:job.data?.error || 'Whisper local falhou.'
    }, env);
    return edgeRequest('recording_status', { callSessionId:recording.call_session_id }, env);
  }

  return edgeStatus;
}

async function status(callSessionId, env) {
  const session = safeSession(callSessionId);
  let result = await edgeRequest('recording_status', { callSessionId:session }, env);
  if (result.error) return result;
  result = await reconcileLocalJob(result, env);
  if (result.error) return result;
  const local = await localHealth(env);
  return {
    ...result,
    data:{
      ...(result.data || {}),
      localFallbackReady:local.ready,
      localWhisperModel:local.model,
      localWhisperLoaded:local.modelLoaded
    }
  };
}

async function localTranscribe(body = {}, env) {
  const session = safeSession(body.callSessionId);
  const c = cfg(env);
  if (!c.localWhisperEnabled) return { configured:false, status:503, data:null, error:'Whisper local não configurado.' };

  const prepared = await edgeRequest('prepare_external_transcription', {
    callSessionId:session,
    provider:'faster-whisper',
    model:c.localWhisperModel
  }, env, 20000);
  if (prepared.error) return prepared;

  const job = await workerRequest('/jobs', {
    method:'POST',
    body:{
      audioUrl:prepared.data?.signedDownloadUrl,
      taskId:session,
      language:'pt'
    }
  }, env, 15000);

  if (job.error || !job.data?.id) {
    await edgeRequest('external_transcription_failed', {
      callSessionId:session,
      error:job.error || 'Whisper local não criou o job.'
    }, env);
    return { configured:true, status:job.status || 502, data:null, error:job.error || 'Whisper local não criou o job.' };
  }

  const marked = await edgeRequest('external_transcription_job', {
    callSessionId:session,
    jobId:job.data.id
  }, env);
  if (marked.error) return marked;

  return {
    configured:true,
    status:202,
    data:{
      queued:true,
      provider:'faster-whisper',
      model:c.localWhisperModel,
      jobId:job.data.id,
      localFallbackReady:true,
      recording:marked.data
    },
    error:null
  };
}

module.exports = {
  cfg,
  edgeRequest,
  workerRequest,
  health,
  localHealth,
  initRecording:(body, env) => edgeRequest('init_recording', body, env),
  completeRecording:(body, env) => edgeRequest('complete_recording', body, env, 20000),
  status,
  transcribe:(body, env) => edgeRequest('transcribe', { ...body, callSessionId:safeSession(body?.callSessionId) }, env, 20000),
  localTranscribe,
  manualTranscript:(body, env) => edgeRequest('manual_transcript', { ...body, callSessionId:safeSession(body?.callSessionId) }, env, 20000),
  linkResult:(body, env) => edgeRequest('link_result', { ...body, callSessionId:safeSession(body?.callSessionId) }, env),
  dashboard:(days, env) => edgeRequest('dashboard', { days:Math.max(1,Math.min(365,Number(days)||30)) }, env)
};
