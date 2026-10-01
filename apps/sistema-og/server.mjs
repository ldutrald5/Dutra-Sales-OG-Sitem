import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const operationsModel = require('./operations-model.js');
const proposalIntelligence = require('./services/proposal-intelligence-service.js');
const proposalStore = require('./server-proposal-store.cjs');
const salesExecutionGateway = require('./server-sales-execution-gateway.cjs');
const callIntelligenceGateway = require('./server-call-intelligence-gateway.cjs');

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.OG_DATA_DIR ? path.resolve(process.env.OG_DATA_DIR) : path.join(root, '.data');
const dataFile = path.join(dataDir, 'shared-state.json');
const knowledgeFile = path.join(dataDir, 'knowledge', 'index.json');
const proposalStoreFile = path.join(dataDir, 'public-proposals.json');
const port = Number(process.env.OG_PORT || 4321);
const host = process.env.OG_HOST || '127.0.0.1';
const localAccessToken = String(process.env.OG_LOCAL_ACCESS_TOKEN || '');
const localAccessPin = String(process.env.OG_LOCAL_ACCESS_PIN || '');
const lanMode = !['127.0.0.1', 'localhost', '::1'].includes(host);
const hostedMode = Boolean(process.env.RAILWAY_ENVIRONMENT_ID || process.env.RAILWAY_PROJECT_ID || process.env.RAILWAY_PUBLIC_DOMAIN || process.env.OG_PUBLIC_DOMAIN);
const writeWindows = new Map();
const publicEventWindows = new Map();
const prospectResearchWindows = new Map();
if (lanMode && localAccessToken.length < 16) throw new Error('OG_LOCAL_ACCESS_TOKEN com pelo menos 16 caracteres é obrigatório no modo LAN/hospedado.');
if (hostedMode && localAccessPin && localAccessPin.length < 6) throw new Error('OG_LOCAL_ACCESS_PIN deve ter pelo menos 6 caracteres quando configurado.');
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

function readWhisperSelfTestStatus() {
  try {
    const file = path.join(dataDir, 'whisper-self-test.json');
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return {
      ok:Boolean(parsed.ok),
      phase:String(parsed.phase || ''),
      provider:String(parsed.provider || ''),
      model:String(parsed.model || ''),
      wordCount:Number(parsed.wordCount || 0),
      durationMs:Number(parsed.durationMs || 0),
      localFallbackReady:Boolean(parsed.localFallbackReady),
      validatedAt:parsed.validatedAt || null,
      error:parsed.ok ? null : String(parsed.error || '').slice(0,240)
    };
  } catch {
    return null;
  }
}

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
  const authorization = req.headers.authorization;
  if (authorization === `Bearer ${localAccessToken}`) return true;
  return Boolean(hostedMode && localAccessPin && authorization === `Bearer ${localAccessPin}`);
}

function allowWrite(req) {
  const key = req.socket.remoteAddress || 'unknown', now = Date.now();
  const recent = (writeWindows.get(key) || []).filter(time => now - time < 60_000);
  if (recent.length >= 30) return false;
  recent.push(now); writeWindows.set(key, recent); return true;
}

function allowProspectResearch(req) {
  const key = req.socket.remoteAddress || 'unknown', now = Date.now();
  const recent = (prospectResearchWindows.get(key) || []).filter(time => now - time < 60_000);
  if (recent.length >= 6) return false;
  recent.push(now); prospectResearchWindows.set(key, recent); return true;
}

function normalizeProspectCriteria(body = {}) {
  const city=String(body.city||'').trim().slice(0,80), state=String(body.state||'').trim().toUpperCase().slice(0,2);
  const segment=String(body.segment||'').trim().slice(0,80), minFleet=Math.max(0,Math.min(10000,Number(body.minFleet)||0));
  const requestedCount=Math.max(1,Math.min(25,Number(body.requestedCount)||10));
  const keywords=cleanArray(body.keywords,12).map(v=>String(v||'').trim().slice(0,60)).filter(Boolean);
  if (!city || !/^[A-Z]{2}$/.test(state) || !segment) throw new Error('Cidade, UF e segmento são obrigatórios.');
  return { city,state,segment,minFleet,requestedCount,keywords };
}

function buildProspectSearchQuery(criteria) {
  return [criteria.segment, criteria.city, criteria.state, criteria.minFleet ? `frota ${criteria.minFleet} caminhões` : 'frota caminhões', ...criteria.keywords].filter(Boolean).join(' ');
}

async function searchPublicProspects(criteria) {
  const endpoint=String(process.env.OG_PROSPECT_SEARCH_ENDPOINT||'').trim();
  const token=String(process.env.OG_PROSPECT_SEARCH_TOKEN||'').trim();
  if (!endpoint) return { available:false, provider:'unconfigured', candidates:[], message:'Provider de pesquisa pública ainda não configurado no servidor.' };
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
  try {
    const response=await fetch(endpoint,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({query:buildProspectSearchQuery(criteria),limit:criteria.requestedCount}),signal:controller.signal});
    if (!response.ok) throw new Error(`Provider respondeu HTTP ${response.status}`);
    const raw=await response.json(); const rows=raw?.data?.web||raw?.web||raw?.results||[];
    const candidates=cleanArray(rows,criteria.requestedCount).map(row=>({companyName:String(row.title||row.name||'').replace(/\s+[|–—-]\s+.*$/,'').trim(),sourceSnippet:String(row.description||row.snippet||'').slice(0,500),sources:row.url?[{url:String(row.url).slice(0,2048),title:String(row.title||row.url).slice(0,200),observedAt:new Date().toISOString(),supports:['public_search']}]:[]})).filter(x=>x.companyName&&x.sources.length);
    return { available:true,provider:endpoint.includes('api.firecrawl.dev')?'firecrawl_v2_search':'server_public_search',candidates };
  } finally { clearTimeout(timer); }
}

function allowPublicEngagement(req) {
  const key = req.socket.remoteAddress || 'unknown', now = Date.now();
  const recent = (publicEventWindows.get(key) || []).filter(time => now - time < 60_000);
  if (recent.length >= 60) return false;
  recent.push(now);
  publicEventWindows.set(key, recent);
  return true;
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

async function readBody(req, maxBytes = 5_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw new Error('Payload muito grande');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function proposalPublicBaseUrl() {
  const domain = String(process.env.RAILWAY_PUBLIC_DOMAIN || process.env.OG_PUBLIC_DOMAIN || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  return domain ? `https://${domain}` : '';
}

function proposalWhatsappDigits() {
  const digits = String(process.env.OG_PROPOSAL_WHATSAPP || '554491658321').replace(/\D/g, '');
  return digits.length >= 12 ? digits.slice(0, 15) : '554491658321';
}

function proposalHeaders() {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, max-age=0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
  };
}

function formatPublicMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString('pt-BR', { style:'currency', currency:'BRL' }) : 'A consultar';
}

function buildPublicProposalPage(publication) {
  const snapshot = publication?.snapshot || {};
  const client = snapshot.client || {};
  const commercial = snapshot.commercial || {};
  const vehicles = Array.isArray(snapshot.vehicles) ? snapshot.vehicles : [];
  const extras = Array.isArray(snapshot.extraItems) ? snapshot.extraItems : [];
  const title = client.company || client.name || 'Proposta Olho de Gato';
  const whats = proposalWhatsappDigits();
  const vehicleHtml = vehicles.length
    ? vehicles.map(vehicle => `<article class="item"><div><b>${escapeHtml(vehicle.name || 'Configuração')}</b><span>${escapeHtml(vehicle.qty || 1)} un. · ${escapeHtml(vehicle.libras || '')} LBS</span></div><strong>${(vehicle.items || []).reduce((sum,item)=>sum+(Number(item.qty)||0),0)} peça(s)</strong></article>`).join('')
    : '<p class="muted">Configuração comercial registrada na proposta.</p>';
  const extrasHtml = extras.length
    ? `<div class="extras"><b>Itens adicionais</b><span>${extras.map(item=>`${escapeHtml(item.code)} × ${escapeHtml(item.qty)}`).join(' · ')}</span></div>`
    : '';
  const location = [client.city, client.cnpj ? `CNPJ ${client.cnpj}` : ''].filter(Boolean).join(' · ');
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<title>${escapeHtml(title)} · Proposta Olho de Gato</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}body{margin:0;background:#06080b;color:#f8fafc;min-height:100vh}
main{width:min(940px,calc(100% - 28px));margin:0 auto;padding:28px 0 52px}
.top{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border-bottom:1px solid #26303a;padding-bottom:22px}
.brand{font-size:12px;letter-spacing:.16em;font-weight:900;color:#ffde17}.badge{font-size:11px;border:1px solid #3b4652;border-radius:999px;padding:7px 10px;color:#cbd5e1}
h1{font-size:clamp(28px,5vw,46px);line-height:1.02;margin:26px 0 8px;letter-spacing:-.035em}.lead{color:#94a3b8;margin:0;line-height:1.6}
.grid{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-top:22px}.card{background:#0c1118;border:1px solid #202a35;border-radius:18px;padding:20px}
.kicker{font-size:10px;letter-spacing:.14em;color:#94a3b8;font-weight:900}.total{font-size:clamp(30px,5vw,50px);font-weight:950;color:#ffde17;margin:8px 0}.meta{display:grid;gap:9px;margin-top:16px}.meta div{display:flex;justify-content:space-between;gap:12px;border-top:1px solid #1f2937;padding-top:9px}.meta span{color:#94a3b8;font-size:12px}.meta b{font-size:12px;text-align:right}
h2{font-size:16px;margin:0 0 13px}.list{display:grid;gap:8px}.item{display:flex;justify-content:space-between;gap:12px;padding:12px;border:1px solid #222d39;border-radius:12px;background:#090d13}.item div{display:grid;gap:3px}.item span,.muted,.extras span{font-size:12px;color:#94a3b8}.item strong{font-size:12px;color:#fef08a}.extras{display:grid;gap:5px;border-top:1px solid #27313b;margin-top:13px;padding-top:13px}
.cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.cta a{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:12px;padding:12px 15px;font-weight:900;font-size:13px}.primary{background:#ffde17;color:#090909}.secondary{border:1px solid #334155;color:#e2e8f0}
.notice{margin-top:18px;padding:12px 14px;border-left:3px solid #ffde17;background:#10151d;color:#94a3b8;font-size:12px;line-height:1.5}
footer{margin-top:28px;border-top:1px solid #202a35;padding-top:16px;color:#64748b;font-size:11px}
@media(max-width:720px){.grid{grid-template-columns:1fr}.top{flex-direction:column}.card{padding:16px}}
</style>
</head>
<body>
<main>
<section class="top"><div><div class="brand">OLHO DE GATO · EQUALIZAÇÃO PASSIVA DE PNEUS</div><h1>${escapeHtml(title)}</h1><p class="lead">${escapeHtml(location || 'Proposta comercial personalizada')}</p></div><span class="badge">Proposta rastreável segura</span></section>
<section class="grid">
<article class="card"><span class="kicker">INVESTIMENTO</span><div class="total">${escapeHtml(formatPublicMoney(commercial.totalValue))}</div><div class="meta"><div><span>Peças</span><b>${escapeHtml(commercial.totalPieces || '—')}</b></div><div><span>Condição</span><b>${escapeHtml(commercial.paymentTerms || 'A confirmar')}</b></div><div><span>Frete</span><b>${escapeHtml(commercial.freightText || 'A confirmar')}</b></div></div></article>
<article class="card"><span class="kicker">VALIDADE DO LINK</span><h2>Canal direto com a Olho de Gato</h2><p class="muted">Este endereço é exclusivo desta proposta e pode ser revogado pelo consultor.</p><div class="cta"><a id="proposal-contact" class="primary" href="https://wa.me/${whats}" rel="noreferrer">Falar no WhatsApp</a></div></article>
</section>
<section class="card" style="margin-top:16px"><h2>Configuração indicada</h2><div class="list">${vehicleHtml}</div>${extrasHtml}</section>
<div class="notice">Valores, estoque, frete, instalação, prazos e condições permanecem sujeitos à confirmação comercial quando indicado na proposta. Este link não expõe o CRM nem dados internos da conta.</div>
<footer>Olho de Gato · Vamos salvar pneus — e dinheiro.</footer>
</main>
<script>
(()=>{const token=location.pathname.split('/').filter(Boolean).pop();if(!/^[A-Za-z0-9_-]{24,160}$/.test(token||''))return;const key='og_prop_session_'+token.slice(0,12);let sid=sessionStorage.getItem(key);if(!sid){sid=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)).replace(/[^A-Za-z0-9_-]/g,'');sessionStorage.setItem(key,sid)}const send=(type)=>fetch('/public-api/proposals/'+encodeURIComponent(token)+'/engagement',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type,sessionId:sid}),keepalive:true,credentials:'same-origin'}).catch(()=>{});setTimeout(()=>{if(document.visibilityState==='visible')send('open')},1800);document.getElementById('proposal-contact')?.addEventListener('click',()=>send('contact_clicked'))})();
</script>
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);

  if (['/health', '/api/health'].includes(url.pathname) && (req.method === 'GET' || req.method === 'HEAD')) {
    const release = String(process.env.OG_RELEASE_SHA || '').trim();
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(JSON.stringify({ ok: true, service: 'sistema-og', release: release || null, whisperSelfTest: readWhisperSelfTestStatus() }));
  }

  const publicProposalMatch = url.pathname.match(/^\/p\/([A-Za-z0-9_-]{24,160})$/);
  if (publicProposalMatch && (req.method === 'GET' || req.method === 'HEAD')) {
    const publication = proposalStore.findByToken(proposalStoreFile, publicProposalMatch[1]);
    if (!publication) {
      res.writeHead(404, proposalHeaders());
      return res.end('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Proposta indisponível</title><body style="font-family:system-ui;background:#070707;color:#fff;padding:40px"><h1>Proposta indisponível</h1><p>O link expirou, foi revogado ou não existe.</p></body></html>');
    }
    const html = buildPublicProposalPage(publication);
    res.writeHead(200, proposalHeaders());
    if (req.method === 'HEAD') return res.end();
    return res.end(html);
  }

  const publicEngagementMatch = url.pathname.match(/^\/public-api\/proposals\/([A-Za-z0-9_-]{24,160})\/engagement$/);
  if (publicEngagementMatch && req.method === 'POST') {
    if (!allowPublicEngagement(req)) return sendJson(res, 429, { error:'Muitas interações. Tente novamente em instantes.' });
    try {
      const body = await readBody(req, 10_000);
      const result = proposalStore.recordEngagement(proposalStoreFile, publicEngagementMatch[1], body);
      if (!result) return sendJson(res, 404, { error:'Proposta indisponível' });
      return sendJson(res, result.duplicate ? 200 : 201, {
        ok:true,
        duplicate:Boolean(result.duplicate),
        type:result.event?.type || null,
        at:result.event?.at || null
      });
    } catch (error) {
      return sendJson(res, /Payload muito grande/.test(error.message) ? 413 : 400, { error:error.message });
    }
  }

  if (url.pathname.startsWith('/api/') && !isAuthorized(req)) return sendJson(res, 401, { error: 'Código de acesso necessário' });

  if (url.pathname === '/api/sales-execution/health' && req.method === 'GET') {
    const result = await salesExecutionGateway.health();
    return sendJson(res, result.status, result.error
      ? { ok:false, configured:result.configured, error:result.error, boundary:'railway_trusted_gateway' }
      : { ...(result.data || {}), boundary:'railway_trusted_gateway' });
  }

  if (url.pathname === '/api/sales-execution/lists' && req.method === 'GET') {
    const result = await salesExecutionGateway.listLists();
    return sendJson(res, result.status, result.error ? { error:result.error, configured:result.configured } : { lists:result.data || [] });
  }

  const salesQueueMatch = url.pathname.match(/^\/api\/sales-execution\/sessions\/([0-9a-f-]{36})\/queue$/i);
  if (salesQueueMatch && req.method === 'GET') {
    try {
      const result = await salesExecutionGateway.sessionQueue(salesQueueMatch[1]);
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  const salesAccountMatch = url.pathname.match(/^\/api\/sales-execution\/accounts\/([0-9a-f-]{36})\/context$/i);
  if (salesAccountMatch && req.method === 'GET') {
    try {
      const result = await salesExecutionGateway.accountContext(salesAccountMatch[1]);
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/sales-execution/sessions' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await salesExecutionGateway.startSession(await readBody(req, 20_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : { session:Array.isArray(result.data)?result.data[0]:result.data });
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/sales-execution/commands/record-call-result' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await salesExecutionGateway.recordCallResult(await readBody(req, 30_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/health' && req.method === 'GET') {
    const result = await callIntelligenceGateway.health();
    return sendJson(res, result.status, result.error
      ? { ok:false, configured:result.configured, error:result.error }
      : { ...(result.data || {}), configured:true, boundary:'railway_trusted_gateway' });
  }

  if (url.pathname === '/api/call-intelligence/recordings/init' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await callIntelligenceGateway.initRecording(await readBody(req, 40_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/recordings/complete' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await callIntelligenceGateway.completeRecording(await readBody(req, 50_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  const callRecordingStatusMatch = url.pathname.match(/^\/api\/call-intelligence\/recordings\/([^/]+)\/status$/);
  if (callRecordingStatusMatch && req.method === 'GET') {
    try {
      const result = await callIntelligenceGateway.status(decodeURIComponent(callRecordingStatusMatch[1]));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/recordings/transcribe' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await callIntelligenceGateway.transcribe(await readBody(req, 20_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/recordings/local-transcribe' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas transcrições. Aguarde um minuto.' });
      const result = await callIntelligenceGateway.localTranscribe(await readBody(req, 20_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/recordings/manual-transcript' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await callIntelligenceGateway.manualTranscript(await readBody(req, 300_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, /Payload muito grande/.test(error.message) ? 413 : 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/recordings/link-result' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const result = await callIntelligenceGateway.linkResult(await readBody(req, 20_000));
      return sendJson(res, result.status, result.error ? { error:result.error } : { linked:result.data });
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/call-intelligence/dashboard' && req.method === 'GET') {
    try {
      const result = await callIntelligenceGateway.dashboard(url.searchParams.get('days'));
      return sendJson(res, result.status, result.error ? { error:result.error } : result.data);
    } catch (error) { return sendJson(res, 400, { error:error.message }); }
  }

  if (url.pathname === '/api/prospects/research' && req.method === 'POST') {
    try {
      if (!allowProspectResearch(req)) return sendJson(res, 429, { error:'Limite de pesquisa atingido. Aguarde um minuto.' });
      const criteria=normalizeProspectCriteria(await readBody(req, 20_000));
      const result=await searchPublicProspects(criteria);
      return sendJson(res, result.available ? 200 : 503, { ...result, criteria, mutationPolicy:'prepare_only', evidencePolicy:'public_sources_required' });
    } catch (error) {
      const status=/Payload muito grande/.test(error.message)?413:(error.name==='AbortError'?504:400);
      return sendJson(res,status,{error:error.name==='AbortError'?'Pesquisa excedeu o tempo limite.':error.message});
    }
  }

  if (url.pathname === '/api/proposals/publish' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const baseUrl = proposalPublicBaseUrl();
      if (!baseUrl) return sendJson(res, 409, { error:'Domínio HTTPS público ainda não está configurado para propostas.' });
      const body = await readBody(req, 50_000);
      const proposalId = String(body.proposalId || '').trim();
      if (!proposalId) throw new Error('proposalId é obrigatório');
      const shared = readSharedState();
      const document = (shared.operations.generatedDocuments || []).find(item =>
        String(item.id) === proposalId && item.documentType === 'proposal_tracking'
      );
      if (!document || !proposalIntelligence.canPublish(document)) return sendJson(res, 404, { error:'Rascunho de proposta publicável não encontrado.' });
      proposalIntelligence.validatePublicSnapshot(document.snapshot);
      const published = proposalStore.publish(proposalStoreFile, {
        proposalId:document.id,
        clientId:document.clientId,
        quoteId:document.quoteId,
        snapshot:document.snapshot
      });
      return sendJson(res, 201, {
        proposalId:document.id,
        publicUrl:`${baseUrl}/p/${published.token}`,
        publishedAt:published.publication.publishedAt,
        expiresAt:published.publication.expiresAt
      });
    } catch (error) {
      return sendJson(res, /Payload muito grande/.test(error.message) ? 413 : 400, { error:error.message });
    }
  }

  if (url.pathname === '/api/proposals/revoke' && req.method === 'POST') {
    try {
      if (!allowWrite(req)) return sendJson(res, 429, { error:'Muitas gravações. Aguarde um minuto.' });
      const body = await readBody(req, 50_000);
      const revoked = proposalStore.revoke(proposalStoreFile, body.proposalId);
      if (!revoked) return sendJson(res, 404, { error:'Publicação não encontrada.' });
      return sendJson(res, 200, { proposalId:revoked.id, revokedAt:revoked.revokedAt, status:revoked.status });
    } catch (error) {
      return sendJson(res, /Payload muito grande/.test(error.message) ? 413 : 400, { error:error.message });
    }
  }

  if (url.pathname === '/api/proposals/events' && req.method === 'GET') {
    const since = String(url.searchParams.get('since') || '').trim();
    if (since && Number.isNaN(Date.parse(since))) return sendJson(res, 400, { error:'since inválido' });
    return sendJson(res, 200, { events:proposalStore.listEvents(proposalStoreFile, { since, limit:500 }) });
  }

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
  const publicDomain = String(process.env.RAILWAY_PUBLIC_DOMAIN || process.env.OG_PUBLIC_DOMAIN || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (publicDomain) {
    const publicUrl = `https://${publicDomain}`;
    return {
      port,
      desktop: publicUrl,
      phoneUrls: [publicUrl],
      primaryPhoneUrl: publicUrl,
      protected: true,
      hosted: true,
      tip: 'Use o mesmo endereço HTTPS no computador e no celular. O código de acesso é solicitado por sessão.'
    };
  }
  const addresses = localAddresses();
  const phoneUrls = addresses.map(ip => `http://${ip}:${port}`);
  return {
    port,
    desktop: `http://127.0.0.1:${port}`,
    phoneUrls,
    primaryPhoneUrl: phoneUrls[0] || null,
    protected: lanMode,
    hosted: false,
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
