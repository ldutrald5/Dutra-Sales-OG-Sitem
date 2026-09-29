import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const coreBase = String(process.env.OG_CORE_BASE_URL || 'https://sistema-og-production.up.railway.app').replace(/\/$/, '');

const types = {
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.svg':'image/svg+xml',
  '.webmanifest':'application/manifest+json'
};

function sendFile(res, file, method='GET') {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
    return res.end('Arquivo não encontrado');
  }
  res.writeHead(200, {
    'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff'
  });
  if (method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function proxy(req, res, targetPath) {
  try {
    const target = new URL(targetPath, coreBase);
    const headers = new Headers();
    for (const name of ['authorization','content-type','accept','if-none-match']) {
      const value = req.headers[name];
      if (value) headers.set(name, value);
    }
    headers.set('x-dutra-v3-proxy', '1');
    const body = ['GET','HEAD'].includes(req.method || 'GET') ? undefined : await readBody(req);
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
      redirect:'manual'
    });
    const outHeaders = {
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      'cache-control':'no-store',
      'x-content-type-options':'nosniff'
    };
    const location = upstream.headers.get('location');
    if (location) outHeaders.location = location.replace(coreBase, '');
    res.writeHead(upstream.status, outHeaders);
    if (req.method === 'HEAD') return res.end();
    let bytes = Buffer.from(await upstream.arrayBuffer());
    if ((req.url || '').startsWith('/legacy') && targetPath === '/' && (upstream.headers.get('content-type') || '').includes('text/html')) {
      const html = bytes.toString('utf8').replace('</body>', `<script>(()=>{const tab=new URLSearchParams(location.search).get('tab');if(!tab)return;const open=()=>{const btn=document.querySelector('[data-tab="'+tab.replace(/"/g,'')+'"]');if(btn){btn.click();btn.scrollIntoView({block:'nearest',inline:'center'});return true}return false};let tries=0;const timer=setInterval(()=>{if(open()||++tries>20)clearInterval(timer)},120)})();</script></body>`);
      bytes = Buffer.from(html, 'utf8');
    }
    res.end(bytes);
  } catch (error) {
    res.writeHead(502, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    res.end(JSON.stringify({error:'core_unavailable',message:error.message}));
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');

  if (url.pathname === '/health') {
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    return res.end(JSON.stringify({ok:true,service:'dutra-os-v3-premium',core:coreBase}));
  }

  if (url.pathname.startsWith('/core-api/')) {
    const suffix = url.pathname.slice('/core-api'.length) + url.search;
    return proxy(req, res, '/api' + suffix);
  }

  if (url.pathname.startsWith('/api/')) {
    return proxy(req, res, url.pathname + url.search);
  }

  if (url.pathname.startsWith('/core/')) {
    const target = '/' + url.pathname.slice('/core/'.length) + url.search;
    return proxy(req, res, target);
  }

  if (url.pathname === '/legacy' || url.pathname === '/legacy/') {
    return proxy(req, res, '/');
  }

  if (url.pathname.startsWith('/legacy/')) {
    const target = '/' + url.pathname.slice('/legacy/'.length) + url.search;
    return proxy(req, res, target);
  }

  if (!['GET','HEAD'].includes(req.method || 'GET')) {
    res.writeHead(405, {'content-type':'application/json; charset=utf-8'});
    return res.end(JSON.stringify({error:'Método não permitido'}));
  }

  if (url.pathname === '/' || url.pathname === '/index.html') {
    return sendFile(res, path.join(dir, 'index.html'), req.method);
  }
  if (url.pathname === '/core-bridge.js') {
    return sendFile(res, path.join(dir, 'core-bridge.js'), req.method);
  }

  res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
  res.end('DUTRA OS V3 — rota não encontrada');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`DUTRA OS V3 premium on ${port} · core ${coreBase}`);
});