import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const gateway = require('../apps/sistema-og/server-call-intelligence-gateway.cjs');

const enabled = /^(1|true|yes)$/i.test(String(process.env.OG_WHISPER_SELF_TEST || ''));
const companyId = String(process.env.OG_WHISPER_SELF_TEST_COMPANY_ID || '').trim();
const audioUrl = String(process.env.OG_WHISPER_SELF_TEST_AUDIO_URL || 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Pt-Portugues.ogg').trim();
const sessionId = String(process.env.OG_WHISPER_SELF_TEST_SESSION || 'TEST-WHISPER-LOCAL-20261001').trim();
const dataDir = process.env.OG_DATA_DIR ? path.resolve(process.env.OG_DATA_DIR) : '/data';
const statusFile = path.join(dataDir, 'whisper-self-test.json');

function writeStatus(value) {
  try {
    fs.mkdirSync(dataDir, { recursive:true });
    fs.writeFileSync(statusFile, JSON.stringify({ ...value, validatedAt:new Date().toISOString() }, null, 2));
  } catch (error) {
    console.warn('Whisper self-test: não foi possível persistir status sanitizado:', error.message);
  }
}

function requireOk(result, label) {
  if (!result || result.error || Number(result.status || 500) >= 400) {
    throw new Error(label + ': ' + String(result?.error || ('HTTP ' + result?.status) || 'falha desconhecida'));
  }
  return result.data;
}

async function wait(ms) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function runWhisperRuntimeSelfTest() {
  if (!enabled) return { skipped:true };
  if (!/^[0-9a-f-]{36}$/i.test(companyId)) {
    const error = 'OG_WHISPER_SELF_TEST_COMPANY_ID ausente ou inválido';
    writeStatus({ ok:false, phase:'config', error });
    throw new Error(error);
  }

  writeStatus({ ok:false, phase:'starting', provider:'faster-whisper', model:String(process.env.OG_LOCAL_WHISPER_MODEL || 'base') });
  console.log('Whisper self-test: iniciando validação E2E sanitizada.');

  const health = requireOk(await gateway.health(process.env), 'health');
  if (!health.localFallbackReady) {
    throw new Error('fallback local não está pronto: ' + String(health.localWhisperError || 'unknown'));
  }

  const audioResponse = await fetch(audioUrl, { redirect:'follow', signal:AbortSignal.timeout(20_000) });
  if (!audioResponse.ok) throw new Error('download do áudio público falhou: HTTP ' + audioResponse.status);
  const audio = new Uint8Array(await audioResponse.arrayBuffer());
  if (audio.byteLength < 1000 || audio.byteLength > 5_000_000) throw new Error('áudio público fora do tamanho esperado');

  const init = requireOk(await gateway.initRecording({
    callSessionId:sessionId,
    companyId,
    captureMode:'MICROPHONE',
    mimeType:'audio/ogg'
  }, process.env), 'init_recording');

  const upload = await fetch(init.signedUploadUrl, {
    method:'PUT',
    headers:{ 'content-type':'audio/ogg', 'x-upsert':'true' },
    body:audio,
    signal:AbortSignal.timeout(20_000)
  });
  if (!upload.ok) throw new Error('upload assinado falhou: HTTP ' + upload.status);

  const endedAt = new Date();
  const durationMs = 4080;
  const startedAt = new Date(endedAt.getTime() - durationMs);
  requireOk(await gateway.completeRecording({
    callSessionId:sessionId,
    sizeBytes:audio.byteLength,
    durationMs,
    sellerActiveMs:durationMs,
    customerActiveMs:0,
    overlapMs:0,
    startedAt:startedAt.toISOString(),
    endedAt:endedAt.toISOString(),
    autoTranscribe:false
  }, process.env), 'complete_recording');

  const queued = requireOk(await gateway.localTranscribe({ callSessionId:sessionId }, process.env), 'local_transcribe');
  console.log('Whisper self-test: job local enfileirado', String(queued.jobId || '').slice(0, 8));

  const deadline = Date.now() + 120_000;
  let last = null;
  while (Date.now() < deadline) {
    await wait(2500);
    const result = await gateway.status(sessionId, process.env);
    last = requireOk(result, 'recording_status');
    const status = String(last?.recording?.transcription_status || '');
    if (status === 'READY' && last?.transcript?.provider === 'faster-whisper') {
      const text = String(last.transcript.transcript_text || '').trim();
      if (text.length < 2) throw new Error('Whisper local retornou transcrição vazia');
      const summary = {
        ok:true,
        phase:'complete',
        provider:'faster-whisper',
        model:String(last.transcript.model || health.localWhisperModel || 'base'),
        wordCount:Number(last.metrics?.word_count || text.split(/\s+/).filter(Boolean).length),
        durationMs:Number(last.transcript.duration_ms || durationMs),
        localFallbackReady:true
      };
      writeStatus(summary);
      console.log('Whisper self-test: PASS · provider=faster-whisper · words=' + summary.wordCount);
      return summary;
    }
    if (status === 'FAILED') throw new Error(String(last?.recording?.transcription_error || 'transcrição local falhou'));
  }

  throw new Error('timeout aguardando Whisper local');
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runWhisperRuntimeSelfTest().catch(error => {
    const message = String(error?.message || error).slice(0, 1200);
    writeStatus({ ok:false, phase:'failed', provider:'faster-whisper', error:message });
    console.error('Whisper self-test: FAIL · ' + message);
    process.exitCode = 1;
  });
}
