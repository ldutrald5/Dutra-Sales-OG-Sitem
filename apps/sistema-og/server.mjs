import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, '.data');
const dataFile = path.join(dataDir, 'shared-state.json');
const port = Number(process.env.OG_PORT || 4321);
const host = process.env.OG_HOST || '0.0.0.0';
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
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(value));
}

function readSharedState() {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    return { revision: 0, updatedAt: null, leads: [], history: [] };
  }
}

function writeSharedState(next) {
  const temporary = `${dataFile}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(next, null, 2));
  fs.renameSync(temporary, dataFile);
}

function cleanArray(value, max) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function leadTime(lead) {
  const candidates = [lead?.updatedAt, lead?.lastContactAt, lead?.createdDate, lead?.followUpAt];
  for (const value of candidates) {
    const t = Date.parse(value || '');
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

function unionById(a = [], b = [], idKey = 'id') {
  const map = new Map();
  for (const item of [...a, ...b]) {
    if (!item || item[idKey] == null) continue;
    const key = String(item[idKey]);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function pickScalar(newer, older, key) {
  const n = newer?.[key];
  const o = older?.[key];
  if (n !== undefined && n !== null && n !== '') return n;
  if (o !== undefined && o !== null && o !== '') return o;
  return n ?? o ?? '';
}

function mergeLead(a, b) {
  const aT = leadTime(a);
  const bT = leadTime(b);
  const newer = aT >= bT ? a : b;
  const older = aT >= bT ? b : a;
  const scalarKeys = [
    'nome', 'empresa', 'telefone', 'cnpj', 'cidadeUf', 'segmentId', 'status',
    'priority', 'pain', 'decisionMaker', 'nextAction', 'followUpAt', 'lastContactAt',
    'observacoes', 'createdDate', 'updatedAt'
  ];
  const merged = { ...older, ...newer };
  for (const key of scalarKeys) {
    merged[key] = pickScalar(newer, older, key);
  }
  merged.fleetSize = Number.isFinite(Number(newer.fleetSize)) && Number(newer.fleetSize) > 0
    ? Number(newer.fleetSize)
    : (Number.isFinite(Number(older.fleetSize)) ? Number(older.fleetSize) : 0);
  merged.interactions = unionById(a.interactions || [], b.interactions || [], 'id')
    .sort((x, y) => Date.parse(x.at || 0) - Date.parse(y.at || 0));
  if (!merged.source) merged.source = newer.source || older.source;
  merged.updatedAt = new Date(Math.max(aT, bT, Date.now())).toISOString();
  return merged;
}

function mergeLeads(local = [], remote = []) {
  const map = new Map();
  for (const lead of remote) {
    if (lead?.id != null) map.set(String(lead.id), lead);
  }
  for (const lead of local) {
    if (lead?.id == null) continue;
    const key = String(lead.id);
    map.set(key, map.has(key) ? mergeLead(map.get(key), lead) : lead);
  }
  return [...map.values()].slice(0, 10000);
}

function mergeHistory(local = [], remote = []) {
  return unionById(local, remote, 'id')
    .sort((a, b) => Date.parse(b.date || 0) - Date.parse(a.date || 0))
    .slice(0, 5000);
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

  if (url.pathname === '/api/state' && req.method === 'GET') {
    return sendJson(res, 200, readSharedState());
  }

  if (url.pathname === '/api/state' && req.method === 'PUT') {
    try {
      const body = await readBody(req);
      const current = readSharedState();
      const clientRevision = Number(body.revision);
      const serverRevision = Number(current.revision || 0);
      const forceMerge = body.forceMerge === true || url.searchParams.get('merge') === '1';

      if (Number.isFinite(clientRevision) && clientRevision !== serverRevision && !forceMerge) {
        return sendJson(res, 409, {
          error: 'revision_conflict',
          message: 'Base desatualizada. Faça merge e tente de novo.',
          revision: serverRevision,
          updatedAt: current.updatedAt,
          leads: current.leads || [],
          history: current.history || []
        });
      }

      const leads = mergeLeads(body.leads, current.leads || []);
      const history = mergeHistory(body.history, current.history || []);

      const next = {
        revision: serverRevision + 1,
        updatedAt: new Date().toISOString(),
        leads: cleanArray(leads, 10000),
        history: cleanArray(history, 5000)
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
    tip: 'No celular use a mesma Wi-Fi do PC. O Google Drive nao executa o sistema — use o link abaixo e Adicionar a tela inicial.'
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
