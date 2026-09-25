import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const operationsModel = require('./operations-model.js');

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '.data');
const dataFile = path.join(dataDir, 'shared-state.json');
const knowledgeFile = path.join(dataDir, 'knowledge', 'index.json');
const port = Number(process.env.OG_PORT || 4321);
const host = process.env.OG_HOST || '127.0.0.1';
const localAccessToken = String(process.env.OG_LOCAL_ACCESS_TOKEN || '');
const lanMode = !['127.0.0.1', 'localhost', '::1'].includes(host);
const writeWindows = new Map();
if (lanMode && localAccessToken.length < 16) throw new Error('OG_LOCAL_ACCESS_TOKEN com pelo menos 16 caracteres é obrigatório no modo LAN.');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
};

fs.mkdirSync(dataDir, { recursive: true });

function sendJson(res, status, value) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY'
  });
  res.end(JSON.stringify(value));
}

function readSharedState() {
  try {
    const stored = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return { ...stored, operations: operationsModel.migrateOperations(stored.operations || {}) };
  } catch {
    return { revision: 0, updatedAt: null, leads: [], history: [], operations: operationsModel.createEmptyOperations() };
  }
}

function isAuthorized(req) {
  if (!lanMode) return true;
  return req.headers.authorization === `Bearer ${localAccessToken}`;
}

function allowWrite(req) {
  const key = req.socket.remoteAddress || 'unknown', now = Date.now();
  const recent = (writeWindows.get(key) || []).filter(time => now - time < 60_000);
  if (recent.length >= 30) return false;
  recent.push(now); writeWindows.set(key, recent); return true;
}

function validateStatePayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Estado inválido.');
  if (!Number.isInteger(Number(body.revision)) || Number(body.revision) < 0) throw new Error('Revisão inválida.');
  if (!Array.isArray(body.leads) || body.leads.length > 10000) throw new Error('Lista de clientes inválida.');
  if (!Array.isArray(body.history) || body.history.length > 5000) throw new Error('Histórico inválido.');
  for (const item of [...body.leads, ...body.history]) {
    if (!item || typeof item !== 'object' || Array.isArray(item) || !item.id || String(item.id).length > 160) throw new Error('Registro inválido.');
    if (Object.keys(item).some(key => ['__proto__','prototype','constructor'].includes(key))) throw new Error('Chave não permitida.');
  }
  if (body.operations != null && (typeof body.operations !== 'object' || Array.isArray(body.operations))) throw new Error('Operações inválidas.');
  return true;
}

function readKnowledge() {
  try {
    return JSON.parse(fs.readFileSync(knowledgeFile, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function searchKnowledge(body) {
  const knowledge = readKnowledge();
  if (!knowledge) return { available: false, version: null, results: [] };
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const query = normalizeSearch([body.query, body.objective, ...tags].filter(Boolean).join(' '));
  const tokens = [...new Set(query.split(' ').filter(token => token.length > 2))];
  const limit = Math.min(12, Math.max(1, Number(body.limit) || 6));
  const scored = knowledge.records.map(record => {
    const title = normalizeSearch(record.title);
    const category = normalizeSearch(record.category);
    const tags = normalizeSearch((record.tags || []).join(' '));
    const text = normalizeSearch(record.text);
    let score = 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 5;
      if (category.includes(token)) score += 4;
      if (tags.includes(token)) score += 4;
      if (text.includes(token)) score += 1;
    }
    if (/alta/i.test(record.confidence || '')) score += 1;
    if (/requer validação|premissa/i.test(record.status || '')) score -= 1;
    return { record, score };
  }).filter(item => item.score > 0 || tokens.length === 0);
  scored.sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
  return {
    available: true,
    version: knowledge.version,
    stats: knowledge.stats,
    results: scored.slice(0, limit).map(({ record, score }) => ({ ...record, score }))
  };
}

function writeSharedState(next) {
  const temporary = `${dataFile}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(next, null, 2));
  fs.renameSync(temporary, dataFile);
}

function cleanArray(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 5_000_000) throw new Error('Payload muito grande');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (url.pathname.startsWith('/api/') && !isAuthorized(req)) return sendJson(res, 401, { error: 'Código de acesso necessário' });

  if (url.pathname === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, readSharedState());
  }

  if (url.pathname === '/api/state' && req.method === 'PUT') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error: 'Muitas gravações. Aguarde um minuto.' });
      const body = await readBody(req);
      validateStatePayload(body);
      const current = readSharedState();
      const clientRevision = Number(body.revision);
      const serverRevision = Number(current.revision || 0);
      if (clientRevision !== serverRevision) {
        return sendJson(res, 409, {
          error: 'revision_conflict',
          message: 'Base desatualizada. Faça merge e tente de novo.',
          revision: serverRevision,
          updatedAt: current.updatedAt,
          leads: current.leads || [],
          history: current.history || [],
          operations: operationsModel.migrateOperations(current.operations || {})
        });
      }

      const next = {
        revision: serverRevision + 1,
        updatedAt: new Date().toISOString(),
        leads: cleanArray(body.leads, 10000),
        history: cleanArray(body.history, 5000),
        operations: operationsModel.migrateOperations(body.operations || {})
      };
      writeSharedState(next);
      return sendJson(res, 200, next);
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (url.pathname === '/api/access' && req.method === 'GET') {
    return sendJson(res, 200, buildAccessInfo());
  }

  if (url.pathname === '/api/knowledge/status' && req.method === 'GET') {
    const knowledge = readKnowledge();
    return sendJson(res, 200, knowledge
      ? { available: true, version: knowledge.version, importedAt: knowledge.importedAt, sources: knowledge.sources, stats: knowledge.stats }
      : { available: false, version: null, message: 'Base OG Sales Brain ainda não foi importada neste computador.' });
  }

  if (url.pathname === '/api/knowledge/search' && req.method === 'POST') {
    try {
      return sendJson(res, 200, searchKnowledge(await readBody(req)));
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if ((url.pathname === '/celular' || url.pathname === '/acesso-celular') && (req.method === 'GET' || req.method === 'HEAD')) {
    const html = buildCelularPage();
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(html);
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return sendJson(res, 405, { error: 'Método não permitido' });
  }

  const relative = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) && file !== path.join(root, 'index.html')) {
    res.writeHead(403);
    return res.end('Acesso negado');
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      res.writeHead(404);
      return res.end('Arquivo não encontrado');
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': file.endsWith('service-worker.js') ? 'no-cache' : 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

function localAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter(Boolean)
    .filter(item => item.family === 'IPv4' && !item.internal)
    .map(item => item.address);
}

function buildAccessInfo() {
  const addresses = localAddresses();
  const phoneUrls = addresses.map(ip => `http://${ip}:${port}`);
  return {
    port,
    desktop: `http://127.0.0.1:${port}`,
    phoneUrls,
    primaryPhoneUrl: phoneUrls[0] || null,
    protected: lanMode,
    tip: 'No celular use a mesma Wi-Fi do PC e o código temporário definido ao iniciar o modo LAN.'
  };
}

function buildCelularPage() {
  const info = buildAccessInfo();
  const links = (info.phoneUrls.length ? info.phoneUrls : [`http://127.0.0.1:${port}`])
    .map(u => {
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(u)}`;
      return `<article class="card">
        <a class="url" href="${u}">${u}</a>
        <p class="hint">Abra este link no Chrome do celular (mesma Wi-Fi)</p>
        <img class="qr" src="${qr}" width="200" height="200" alt="QR Code para ${u}">
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sistema OG — Acesso no celular</title>
  <style>
    body{margin:0;min-height:100vh;font-family:system-ui,sans-serif;background:#070707;color:#f8fafc;padding:1.25rem;line-height:1.45}
    h1{color:#ffde17;font-size:1.35rem;margin:0 0 .5rem}
    h2{font-size:1rem;margin:1.5rem 0 .6rem;color:#e2e8f0}
    p,li{color:#94a3b8;font-size:.95rem}
    .card{background:#15171b;border:1px solid #30343a;border-radius:1rem;padding:1.1rem;margin:.75rem 0;text-align:center}
    .url{display:block;color:#ffde17;font-weight:800;font-size:1.05rem;word-break:break-all;text-decoration:none;margin-bottom:.35rem}
    .hint{margin:.25rem 0 .75rem;font-size:.85rem}
    .qr{border-radius:.75rem;background:#fff;padding:.5rem}
    ol{padding-left:1.2rem}
    .warn{border-left:3px solid #f97316;padding-left:.75rem;margin:1rem 0;color:#fdba74}
    a.back{color:#94a3b8}
  </style>
</head>
<body>
  <p><a class="back" href="/">← Voltar ao Sistema OG</a></p>
  <h1>Acesso no celular</h1>
  <p>O Google Drive <strong>não</strong> abre o sistema no celular. Use o link da rede Wi-Fi do PC da empresa (servidor ligado).</p>
  <div class="warn">PC e celular na <strong>mesma Wi-Fi</strong>. Mantenha o Sistema OG aberto no computador.</div>
  ${links}
  <h2>Criar atalho na tela inicial</h2>
  <ol>
    <li>Abra o link acima no <strong>Chrome</strong> do celular.</li>
    <li>Menu <strong>⋮</strong> → <strong>Adicionar à tela inicial</strong> / <strong>Instalar app</strong>.</li>
    <li>Confirme. O ícone <strong>Sistema OG</strong> fica na área de trabalho do celular.</li>
  </ol>
  <p>Depois é só tocar no ícone. Sem o PC ligado na empresa, a base compartilhada não atualiza (até existir a nuvem Cloudflare).</p>
</body>
</html>`;
}

function writeAccessFile(info) {
  try {
    const lines = [
      'Sistema OG — link para o celular',
      '================================',
      'PC e celular na MESMA Wi-Fi. Servidor (INICIAR-SISTEMA-OG) precisa estar aberto.',
      'Google Drive NAO executa o app no celular.',
      '',
      `Computador: ${info.desktop}`,
      ...info.phoneUrls.map(u => `Celular:    ${u}`),
      '',
      'No celular: abra o link no Chrome → menu ⋮ → Adicionar à tela inicial.',
      `Ou no PC abra: ${info.desktop.replace(/\/$/, '')}/celular`,
      ''
    ];
    fs.writeFileSync(path.join(dataDir, 'url-celular.txt'), lines.join('\n'), 'utf8');
  } catch {
    /* ignore */
  }
}

server.listen(port, host, () => {
  const info = buildAccessInfo();
  writeAccessFile(info);
  console.log(`Sistema OG no computador: ${info.desktop}`);
  for (const u of info.phoneUrls) console.log(`Sistema OG no celular:    ${u}`);
  console.log(`Pagina de acesso celular:  ${info.desktop.replace(/\/$/, '')}/celular`);
  console.log('Mantenha este terminal aberto enquanto usar no celular.');
});
