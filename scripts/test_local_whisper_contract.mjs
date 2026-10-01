import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker = fs.readFileSync('apps/local-whisper-worker/app.py','utf8');
const requirements = fs.readFileSync('apps/local-whisper-worker/requirements.txt','utf8');
const docker = fs.readFileSync('apps/local-whisper-worker/Dockerfile','utf8');
const embeddedDocker = fs.readFileSync('Dockerfile.whisper','utf8');
const hostedStart = fs.readFileSync('scripts/start-og-hosted.mjs','utf8');
const gateway = fs.readFileSync('apps/sistema-og/server-call-intelligence-gateway.cjs','utf8');
const edge = fs.readFileSync('supabase/functions/call-intelligence/index.ts','utf8');
const app = fs.readFileSync('apps/sistema-og/app.js','utf8');
const client = fs.readFileSync('apps/sistema-og/services/call-intelligence-client.js','utf8');
const server = fs.readFileSync('apps/sistema-og/server.mjs','utf8');

assert.match(worker, /faster_whisper import WhisperModel/);
assert.match(requirements, /requests==/, 'faster-whisper runtime precisa de requests para model download');
assert.match(worker, /WHISPER_MODEL.*base/);
assert.match(worker, /compute_type=COMPUTE_TYPE/);
assert.match(worker, /beam_size=1/);
assert.match(worker, /vad_filter=True/);
assert.match(worker, /x_og_whisper_token/);
assert.match(worker, /audio_host_not_allowed/);
assert.match(worker, /parsed\.scheme != "https"/);
assert.match(worker, /MAX_AUDIO_BYTES/);
assert.match(worker, /ThreadPoolExecutor/);
assert.match(worker, /status="PROCESSING"/);
assert.doesNotMatch(worker, /supabase|sales_opportunities|companies/, 'worker local não deve ter acesso ao CRM/Supabase');
assert.match(docker, /python:3\.11-slim/);
assert.match(embeddedDocker, /node:24-bookworm-slim/);
assert.match(embeddedDocker, /python3 -m venv \/opt\/whisper-venv/);
assert.match(embeddedDocker, /WhisperModel\('base'/);
assert.match(embeddedDocker, /OG_LOCAL_WHISPER_URL=http:\/\/127\.0\.0\.1:8765/);
assert.match(hostedStart, /spawn\('uvicorn'/);
assert.match(hostedStart, /127\.0\.0\.1/);
assert.match(hostedStart, /Whisper local iniciado em loopback/);

assert.match(gateway, /OG_LOCAL_WHISPER_URL/);
assert.match(gateway, /OG_LOCAL_WHISPER_TOKEN/);
assert.match(gateway, /prepare_external_transcription/);
assert.match(gateway, /external_transcription_job/);
assert.match(gateway, /external_transcript/);
assert.match(gateway, /external_transcription_failed/);
assert.match(gateway, /reconcileLocalJob/);

assert.match(edge, /createSignedUrl\(rec\.data\.storage_path, 900\)/);
assert.match(edge, /provider !== "faster-whisper"/);
assert.match(edge, /saveExternalTranscript/);
assert.match(edge, /review_required: true/);

assert.match(client, /localTranscribe/);
assert.match(server, /\/api\/call-intelligence\/recordings\/local-transcribe/);
assert.match(app, /OpenAI indisponível\. Iniciando transcrição local/);
assert.match(app, /localFallbackStarted/);
assert.match(app, /provider !== 'faster-whisper'/);

console.log('local-whisper-contract: secure fallback orchestration ok');
