const token = String(process.env.OG_LOCAL_ACCESS_TOKEN || process.env.OG_ACCESS_TOKEN || '');
if (token.length < 16) {
  throw new Error('OG_LOCAL_ACCESS_TOKEN com pelo menos 16 caracteres é obrigatório no ambiente hospedado.');
}
const port = Number(process.env.PORT || process.env.OG_PORT || 4321);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT/OG_PORT inválido para o ambiente hospedado.');
}
process.env.OG_LOCAL_ACCESS_TOKEN = token;
process.env.OG_HOST = process.env.OG_HOST || '0.0.0.0';
process.env.OG_PORT = String(port);
process.env.OG_DATA_DIR = process.env.OG_DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || '/data/sistema-og';

await import('../apps/sistema-og/server.mjs');
