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
process.env.OG_DATA_DIR = process.env.OG_DATA_DIR || (volumeMount ? `${volumeMount}/sistema-og` : '/data/sistema-og');

const { applyHostedSeed } = await import('./apply-hosted-seed.mjs');
const seedResult = applyHostedSeed({ env: process.env });
if (seedResult.status === 'applied') {
  console.log(`Seed hospedado aplicado: ${seedResult.added} novos, ${seedResult.matched} conciliados, ${seedResult.finalLeadCount} clientes no total.`);
} else if (seedResult.status === 'already_applied') {
  console.log(`Seed hospedado já aplicado anteriormente: ${seedResult.seedId}.`);
}
for (const key of Object.keys(process.env)) {
  if (key === 'OG_STATE_SEED_GZIP_B64' || /^OG_STATE_SEED_GZIP_B64_\d+$/.test(key)) delete process.env[key];
}

await import('../apps/sistema-og/server.mjs');
