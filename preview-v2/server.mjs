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
    for (const name of ['authorization','content-type','accept','if-none-match','x-file-name']) {
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
      const html = bytes.toString('utf8').replace('</body>', `<script>(()=>{const qs=new URLSearchParams(location.search),tab=qs.get('tab'),handoff=qs.get('handoff')==='1',embedded=qs.get('embedded')==='1';if(embedded){const style=document.createElement('style');style.textContent='header,footer{display:none!important}body{padding:0!important;min-height:auto!important}main{max-width:none!important;padding:10px!important}.tab-content{scroll-margin-top:0!important}';document.head.appendChild(style);document.documentElement.dataset.dutraEmbedded='1';}const set=(id,value)=>{const el=document.getElementById(id);if(!el||value==null||String(value).trim()==='')return;el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};const apply=()=>{let opened=!tab;if(tab){const btn=document.querySelector('[data-tab="'+tab.replace(/"/g,'')+'"]');if(btn){btn.click();btn.scrollIntoView({block:'nearest',inline:'center'});opened=true}}if(handoff){try{const key='dutra_quote_handoff_v1',payload=JSON.parse(sessionStorage.getItem(key)||'null'),client=payload?.client||{},commercial=payload?.commercial||{};if(payload?.schemaVersion===1){set('client-name',client.name);set('client-company',client.company);set('client-cnpj',client.cnpj);set('client-ie',client.ie);set('client-phone',client.phone);set('client-parcelas',commercial.installments);set('client-tier',commercial.tier);set('client-frete-texto',commercial.freightText);set('client-prazo-entrega',commercial.deliveryText);window.__DUTRA_QUOTE_HANDOFF__=payload;sessionStorage.removeItem(key);const visualRefs=Array.isArray(payload.visuals?.items)?payload.visuals.items:[];if(visualRefs.length){const pin=sessionStorage.getItem('dutra_v3_access_pin')||'';Promise.all(visualRefs.map(async item=>{try{const response=await fetch('/core-api/assets/'+encodeURIComponent(item.assetId)+'/access?ttl=600',{headers:pin?{authorization:'Bearer '+pin}:{}});if(!response.ok)return item;const access=await response.json();return{...item,runtimeUrl:String(access.url||'')}}catch{return item}})).then(items=>{if(window.__DUTRA_QUOTE_HANDOFF__===payload){payload.visuals={items};try{window.dispatchEvent(new CustomEvent('dutra:proposal-visuals-ready',{detail:{count:items.filter(item=>item.runtimeUrl).length}}))}catch{}}})}const notice=document.createElement('div');notice.style.cssText='position:fixed;right:14px;bottom:14px;z-index:99999;max-width:380px;padding:12px 14px;border:1px solid #8c7414;border-radius:12px;background:#10130d;color:#f6e66a;font:700 12px system-ui;box-shadow:0 18px 50px #0008';const tech=payload.technical;notice.textContent=tech?.vehicleName?'Configuração carregada: '+tech.qty+'× '+tech.vehicleName+' · '+(tech.psi||'—')+' PSI · '+tech.totalTires+' pneus · '+tech.lines.length+' itens técnicos. Revise aplicação, preços, frete e condição antes de salvar.':'Cliente carregado pelo Sales Execution. Revise frota, aplicação, preços e condição antes de salvar a proposta.';document.body.appendChild(notice);setTimeout(()=>notice.remove(),7000);return opened&&Boolean(document.getElementById('client-company'))}}catch(e){console.warn('DUTRA quote handoff',e)}}return opened};let tries=0;const timer=setInterval(()=>{if(apply()||++tries>30)clearInterval(timer)},120)})();</script></body>`);
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

  const localCoreServices = {
    '/core/services/connection-state-service.js': path.join(dir, 'p0-services', 'connection-state-service.js'),
    '/core/services/sync-bridge-service.js': path.join(dir, 'p0-services', 'sync-bridge-service.js')
  };
  if (localCoreServices[url.pathname]) {
    return sendFile(res, localCoreServices[url.pathname], req.method);
  }

  if (url.pathname.startsWith('/core/')) {
    const target = '/' + url.pathname.slice('/core/'.length) + url.search;
    return proxy(req, res, target);
  }

  if (url.pathname === '/workers/spreadsheet-worker.js') {
    return proxy(req, res, '/workers/spreadsheet-worker.js');
  }

  if (url.pathname === '/assets/vendor/xlsx.full.min.js') {
    return proxy(req, res, '/assets/vendor/xlsx.full.min.js');
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
    const file = path.join(dir, 'index.html');
    const html = fs.readFileSync(file, 'utf8').replace('</body>', '<script defer src="/feature-loader-v3.js"></script><script defer src="/core-pricing.js"></script><script defer src="/sales-execution-service.js"></script><script defer src="/call-provider-v3.js"></script><script defer src="/calendar-provider-v3.js"></script><script defer src="/quote-handoff-v3.js"></script><script defer src="/technical-application-core-v3.js"></script><script defer src="/technical-quote-service-v3.js"></script><script defer src="/whatsapp-action-service-v3.js"></script><script defer src="/operational-crm-v3.js"></script><script defer src="/proposal-entry-v3.js"></script><script defer src="/sales-action-center-v3.js"></script><script defer src="/prospecting-execution-v3.js"></script><script defer src="/meu-dia-v3.js"></script><script defer src="/technical-center-v3.js"></script></body>');
    res.writeHead(200, {'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
    if (req.method === 'HEAD') return res.end();
    return res.end(html);
  }
  if (['/core-bridge.js','/account-assets-v3.js','/core-pricing.js','/meu-dia-v3.js','/sales-execution-service.js','/call-provider-v3.js','/calendar-provider-v3.js','/quote-handoff-v3.js','/technical-application-core-v3.js','/technical-quote-service-v3.js','/whatsapp-action-service-v3.js','/feature-loader-v3.js','/prospecting-execution-v3.js','/sales-action-center-v3.js','/proposal-entry-v3.js','/operational-crm-v3.js','/technical-center-v3.js'].includes(url.pathname)) {
    return sendFile(res, path.join(dir, url.pathname.slice(1)), req.method);
  }

  res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
  res.end('DUTRA OS V3 — rota não encontrada');
});

server.listen(port, '0.0.0.0', async () => {
  console.log(`DUTRA OS V3 premium on ${port} · core ${coreBase}`);
  try {
    const response = await fetch(coreBase + '/health', { cache:'no-store' });
    console.log(`DUTRA OS core health: ${response.status} ${response.ok ? 'OK' : 'WARN'}`);
  } catch (error) {
    console.warn('DUTRA OS core health: indisponível', error.message);
  }
});