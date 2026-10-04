import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20260930103929_call_intelligence_v1.sql','utf8');
const edge = fs.readFileSync('supabase/functions/call-intelligence/index.ts','utf8');
const app = fs.readFileSync('apps/sistema-og/app.js','utf8');
const html = fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw = fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
const client = fs.readFileSync('apps/sistema-og/services/call-intelligence-client.js','utf8');
const server = fs.readFileSync('apps/sistema-og/server.mjs','utf8');

for (const table of ['call_recordings','call_transcripts','call_conversation_metrics']) {
  assert.match(migration, new RegExp('create table if not exists public\\.' + table));
  assert.match(migration, new RegExp('alter table public\\.' + table + ' enable row level security'));
}
assert.match(migration, /'call-recordings'[\s\S]*false/, 'bucket de áudio deve ser privado');
assert.match(migration, /100 MB|104857600/, 'limite de arquivo deve ser explícito');
assert.match(edge, /TOKEN_NAME = "call_intelligence_gateway"/);
assert.match(edge, /createSignedUploadUrl/, 'upload deve usar URL assinada server-side');
assert.match(edge, /api\.openai\.com\/v1\/audio\/transcriptions/, 'transcrição automática deve ficar server-side');
assert.match(edge, /gpt-4o-transcribe-diarize/, 'modelo diarizado deve ser o padrão');
assert.match(edge, /review_required: true/, 'extrações devem exigir revisão');
assert.match(edge, /crm_fact_mutation: false/, 'análise não pode promover fatos de CRM automaticamente');
assert.doesNotMatch(edge, /from\("companies"\)\.update/, 'análise de áudio não deve editar empresa');
assert.doesNotMatch(edge, /from\("sales_opportunities"\)\.update/, 'análise de áudio não deve editar oportunidade');
assert.match(edge, /manual_transcript/, 'fallback de transcrição colada deve existir');
assert.match(edge, /prepare_external_transcription/, 'Edge deve emitir download assinado para fallback local');
assert.match(edge, /external_transcript/, 'Edge deve aceitar retorno do Whisper local pelo gateway confiável');
assert.match(edge, /provider !== "faster-whisper"/, 'provider externo deve ser explicitamente limitado');

assert.match(client, /uploadSigned/);
assert.match(client, /method:'PUT'/);
assert.match(client, /'content-type': blob\.type \|\| 'audio\/webm'/, 'upload assinado deve preservar o MIME real');
assert.match(client, /body:blob/, 'upload assinado deve enviar o áudio bruto');
assert.doesNotMatch(client, /new FormData\(\)/, 'signed upload não deve encapsular o áudio em multipart');
assert.match(edge, /\.not\("call_session_id", "like", "TEST-%"\)/, 'dashboard não deve contaminar métricas com validações sintéticas');
assert.match(edge, /objection_count: objections\.length/, 'objection_count deve contar categorias e não duplicar menções');
assert.match(edge, /caminh\(\?:ão\|ões\)/, 'quantidades de caminhão/caminhões devem ser reconhecidas');
assert.match(server, /\/api\/call-intelligence\/recordings\/init/);
assert.match(server, /\/api\/call-intelligence\/recordings\/manual-transcript/);
assert.match(app, /persistCallRecording/);
assert.match(app, /sellerActiveMs/);
assert.match(app, /customerActiveMs/);
assert.match(app, /OG_CALL_INTELLIGENCE_CLIENT\.linkResult/);
assert.match(html, /call-ai-recording-save/);
assert.match(html, /call-ai-manual-transcript/);
assert.match(html, /call-ai-conversation-metrics/);
assert.match(sw, /call-intelligence-client\.js/);
assert.match(sw, /sales-execution-client\.js/);

console.log('call-intelligence-contract: durable audio + reviewable intelligence ok');
