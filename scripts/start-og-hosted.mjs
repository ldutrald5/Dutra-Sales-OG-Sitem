import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const hostedScriptDir = path.dirname(fileURLToPath(import.meta.url));
let whisperChild = null;
let whisperRestartCount = 0;

function localWhisperConfigured() {
  const url = String(process.env.OG_LOCAL_WHISPER_URL || '').trim();
  const token = String(process.env.OG_LOCAL_WHISPER_TOKEN || '').trim();
  return /^http:\/\/(127\.0\.0\.1|localhost):8765\/?$/.test(url) && token.length >= 32;
}

function startEmbeddedWhisper() {
  if (!localWhisperConfigured()) return;
  const cwd = path.resolve(hostedScriptDir, '../apps/local-whisper-worker');
  whisperChild = spawn('uvicorn', ['app:app', '--host', '127.0.0.1', '--port', '8765'], {
    cwd,
    env: process.env,
    stdio: 'inherit'
  });
  console.log('Whisper local iniciado em loopback: 127.0.0.1:8765');
  whisperChild.on('error', error => {
    whisperChild = null;
    console.error('Falha ao iniciar Whisper local:', error.message);
  });
  whisperChild.on('exit', (code, signal) => {
    whisperChild = null;
    if (signal === 'SIGTERM' || signal === 'SIGINT') return;
    whisperRestartCount += 1;
    if (whisperRestartCount <= 3) {
      console.warn(`Whisper local encerrou (code=${code}). Nova tentativa ${whisperRestartCount}/3 em 5s.`);
      setTimeout(startEmbeddedWhisper, 5000).unref();
    } else {
      console.error('Whisper local indisponível após 3 reinícios; Sistema OG continuará sem fallback local.');
    }
  });
}

startEmbeddedWhisper();

const token = String(process.env.OG_LOCAL_ACCESS_TOKEN || process.env.OG_ACCESS_TOKEN || '');
if (token.length < 16) {
  throw new Error('OG_LOCAL_ACCESS_TOKEN com pelo menos 16 caracteres é obrigatório no ambiente hospedado.');
}
const pin = String(process.env.OG_ACCESS_PIN || '');
if (pin && pin.length < 6) {
  throw new Error('OG_ACCESS_PIN deve ter pelo menos 6 caracteres quando configurado.');
}
const port = Number(process.env.PORT || process.env.OG_PORT || 4321);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT/OG_PORT inválido para o ambiente hospedado.');
}
process.env.OG_LOCAL_ACCESS_TOKEN = token;
if (pin) process.env.OG_LOCAL_ACCESS_PIN = pin;
process.env.OG_HOST = process.env.OG_HOST || '0.0.0.0';
process.env.OG_PORT = String(port);
const volumeMount = String(process.env.RAILWAY_VOLUME_MOUNT_PATH || '').trim().replace(/\/+$/, '');
process.env.OG_DATA_DIR = process.env.OG_DATA_DIR || volumeMount || '/data';

const { applyHostedSeed } = await import('./apply-hosted-seed.mjs');
const seedResult = applyHostedSeed({ env: process.env });
if (seedResult.status === 'applied') {
  console.log(`Seed hospedado aplicado: ${seedResult.added} novos, ${seedResult.matched} conciliados, ${seedResult.finalLeadCount} clientes no total.`);
} else if (seedResult.status === 'already_applied') {
  console.log(`Seed hospedado já aplicado anteriormente: ${seedResult.seedId}.`);
} else if (seedResult.status === 'invalid_seed_skipped') {
  console.warn(`Seed hospedado inválido ignorado porque já existe estado persistente válido (revisão ${seedResult.baseRevision}, ${seedResult.finalLeadCount} leads). O servidor continuará sem alterar o estado salvo.`);
}
for (const key of Object.keys(process.env)) {
  if (key === 'OG_STATE_SEED_GZIP_B64' || /^OG_STATE_SEED_GZIP_B64_\d+$/.test(key)) delete process.env[key];
}

await import('../apps/sistema-og/server.mjs');
