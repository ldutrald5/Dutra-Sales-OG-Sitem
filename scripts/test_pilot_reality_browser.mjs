/* Private Stage 6.7 inputs stay outside Git. This exercises the real CRM,
 * client bridges, technical engine, quotation and durable sync contracts.
 * Live execution may create one explicitly marked test quotation; it never
 * fabricates call outcomes or contacts an external customer/provider. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const { chromium } = createRequire(import.meta.url)('playwright');
const seedFile = process.env.OG_PILOT_SEED_FILE;
assert.ok(seedFile, 'OG_PILOT_SEED_FILE must identify a private prepared pilot seed');
const seed = JSON.parse(await readFile(seedFile, 'utf8'));
assert.ok(Array.isArray(seed.leads) && seed.fallbackState?.history, 'Prepared seed must include recoverable original work');
const live = Boolean(process.env.OG_PILOT_BASE_URL);
const restartOnly = process.argv.includes('--restart-only');
assert.ok(!restartOnly || !live, 'Restart-only proof uses a private local fixture, never a hosted runtime claim');
let base = process.env.OG_PILOT_BASE_URL?.replace(/\/$/, '');
if (live) assert.equal(new URL(base).origin, 'https://dutra-os-uxr01-preview-production.up.railway.app', 'Only the authorized pilot may receive the live test quotation');
const bearer = live
  ? (await readFile(process.env.OG_PILOT_TOKEN_FILE, 'utf8')).trim()
  : randomBytes(32).toString('hex');
assert.ok(bearer.length >= 32, 'A private strong API credential is required');
const localPin = randomBytes(12).toString('hex');
const quoteLabel = 'VALIDAÇÃO PILOTO: cotação de teste não enviada';
const vehicleName = 'VALIDAÇÃO PILOTO Rodotrem Volvo';
const realLead = lead => lead.importMeta?.pilotReal === true && !/^DEMO-/i.test(String(lead.id));
const subsetPreserved = (before, after, label) => {
  for (const item of before || []) {
    const found = (after || []).find(other => String(other.id) === String(item.id));
    assert.ok(found, `${label}: an original ID was lost`);
    for (const [key, value] of Object.entries(item)) assert.deepEqual(found[key], value, `${label}: an original field changed`);
  }
};
function variedSample(leads, count = 20) {
  const eligible = leads.filter(realLead).sort((a, b) => String(a.id).localeCompare(String(b.id)));
  assert.ok(eligible.length >= count, 'The real pilot requires at least twenty imported canonical entities');
  const selected = [], seen = new Set();
  const add = lead => { if (lead && !seen.has(lead.id)) { selected.push(lead); seen.add(lead.id); } };
  for (const key of ['cnpj', 'telefone', 'email', 'cidadeUf', 'interactions']) {
    const has = lead => Array.isArray(lead[key]) ? lead[key].length > 0 : Boolean(lead[key]);
    add(eligible.find(has)); add(eligible.find(lead => !has(lead)));
  }
  for (const status of new Set(eligible.map(lead => lead.status))) add(eligible.find(lead => lead.status === status));
  for (const lead of eligible) { if (selected.length >= count) break; add(lead); }
  return selected.slice(0, count);
}

let server, browser, dataDir;
async function startLocal() {
  const port = await new Promise(resolve => {
    const socket = net.createServer();
    socket.listen(0, '127.0.0.1', () => { const value = socket.address().port; socket.close(() => resolve(value)); });
  });
  base = `http://localhost:${port}`;
  server = spawn(process.execPath, ['scripts/start-og-hosted.mjs'], {
    cwd: new URL('../', import.meta.url),
    env: {
      ...process.env, PORT: String(port), OG_HOST: '127.0.0.1', OG_DATA_DIR: dataDir,
      OG_LOCAL_ACCESS_TOKEN: bearer, OG_ACCESS_PIN: localPin, OG_PERSISTENT_AUTH: 'true',
      OG_ISOLATED_PREVIEW: 'true', OG_PILOT_REAL_DATA: 'true',
      // This is a local filesystem fixture, not evidence of Railway persistence.
      RAILWAY_VOLUME_MOUNT_PATH: dataDir, OG_PILOT_SEED_ID: seed.seedId,
      OG_PILOT_SOURCE_SHA256: seed.sourceSha256,
      OG_STATE_SEED_GZIP_B64: gzipSync(JSON.stringify(seed)).toString('base64'),
      OG_SALES_EXECUTION_EDGE_URL: '', OG_SALES_EXECUTION_EDGE_TOKEN: '',
      OG_CALL_INTELLIGENCE_EDGE_URL: '', OG_CALL_INTELLIGENCE_EDGE_TOKEN: '',
      OG_LOCAL_WHISPER_URL: '', OG_LOCAL_WHISPER_TOKEN: '', OG_SUPABASE_URL: ''
    }, stdio: ['ignore', 'pipe', 'pipe']
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Private pilot fixture startup timed out')), 15000);
    server.stdout.on('data', value => { if (String(value).includes('Sistema OG no computador')) { clearTimeout(timer); resolve(); } });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Private pilot fixture exited ${code}`)); });
  });
}
async function stopLocal() {
  if (server && !server.killed) await new Promise(resolve => { server.once('exit', resolve); server.kill('SIGTERM'); });
}
const apiState = async context => {
  // Native fetch honors the managed environment's network proxy. Playwright's
  // API client bypasses it and can include bearer headers in connection errors.
  const response = await fetch(base + '/api/state', { headers: { Authorization: `Bearer ${bearer}` }, signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, 'Canonical pilot state must be readable');
  return response.json();
};
async function navigate(page, tab) {
  if (await page.locator('#nav-tabs-container').isVisible()) await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
  else {
    const button = page.locator(`.og-mobile-nav [data-mobile-tab="${tab}"]`);
    if (!await button.isVisible()) await page.locator('[data-mobile-more]').click();
    await button.click();
  }
  await page.waitForURL(`**/#${tab}`);
}
async function openSheet(page, lead) {
  await navigate(page, 'crm');
  await page.locator('#crm-search-input').fill(lead.empresa || lead.nome);
  const button = page.locator(`#crm-leads-tbody .crm-client-name[data-open-client-sheet="${lead.id}"]`);
  await button.click();
  assert.ok((await page.locator('#client-sheet-title').textContent()).trim() === (lead.empresa || lead.nome), 'Canonical sheet company mismatch');
  assert.ok(await page.locator('#client-sheet-form [name=empresa]').inputValue() === (lead.empresa || ''), 'Canonical sheet fields mismatch');
}
async function noCredentialStorage(page) {
  assert.equal(await page.evaluate(() => sessionStorage.getItem('og_cloud_access_token')), null);
  assert.equal(await page.evaluate(() => localStorage.getItem('og_cloud_access_token')), null);
  assert.ok(!(await page.evaluate(() => document.cookie)).includes('__Host-og_session'), 'Session must remain HttpOnly');
  if (!live) assert.ok(!(await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }))).includes(localPin), 'No raw PIN may be retained by the browser');
}
async function localLogin(page, context) {
  if (live) return;
  await page.locator('#access-session-dialog').waitFor({ state: 'visible' });
  await page.locator('#access-session-dialog [name=pin]').fill(localPin);
  await page.locator('#access-session-dialog button').click();
  await page.locator('#access-session-dialog').waitFor({ state: 'hidden' });
  const cookie = (await context.cookies(base)).find(item => item.name === '__Host-og_session');
  assert.ok(cookie?.httpOnly && cookie.secure && cookie.sameSite === 'Strict');
  assert.ok(cookie.expires > Date.now() / 1000 + 29 * 86400, 'Remembered session must last thirty days');
}
async function settled(page) {
  await page.waitForFunction(() => document.querySelector('#og-sync-status')?.dataset.mode === 'ok');
  await page.waitForFunction(async () => !(await OG_SYNC_BRIDGE.readQueuedState()));
}

try {
  if (!live) { dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-private-pilot-')); await startLocal(); }
  const proxy = live && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
  const proxyUrl = proxy ? new URL(proxy) : null;
  browser = await chromium.launch({ executablePath: process.env.OG_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'], ...(proxyUrl ? { proxy: { server: proxyUrl.origin, ...(proxyUrl.username ? { username: decodeURIComponent(proxyUrl.username), password: decodeURIComponent(proxyUrl.password) } : {}) } } : {}) });
  let savedQuoteId;
  for (const [width, height] of restartOnly ? [] : [[390, 844], [1440, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: 'block', ...(live ? { extraHTTPHeaders: { Authorization: `Bearer ${bearer}` } } : {}) });
    // Credentials and real data never travel to another origin. Do not call or
    // stub a provider; this task needs only existing local technical capability.
    await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
    const before = await apiState(context);
    assert.equal(new Set(before.leads.map(lead => lead.id)).size, before.leads.length, 'Canonical IDs must be unique');
    subsetPreserved(seed.fallbackState.history, before.history, 'Backup quotation');
    const samples = variedSample(before.leads);
    const target = samples.find(lead => !['perdido', 'fechado'].includes(lead.status)) || before.leads.find(lead => realLead(lead) && !['perdido', 'fechado'].includes(lead.status));
    assert.ok(target, 'A nonterminal real entity is required for the explicitly authorized quotation proof');
    const page = await context.newPage(), errors = [];
    let externalActions = 0;
    page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', async dialog => dialog.type() === 'confirm' ? dialog.accept() : dialog.dismiss());
    await context.addInitScript(() => { window.open = () => { window.__pilotExternalAttempts = (window.__pilotExternalAttempts || 0) + 1; return null; }; });
    await page.goto(base + '/#dia');
    await localLogin(page, context);
    await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
    await settled(page);
    assert.equal(await page.locator('#og-sync-status').getAttribute('data-runtime'), 'isolated-pilot');
    assert.match(await page.locator('#og-sync-status').textContent(), /Piloto DUTRA OS · Dados reais · Ambiente isolado/);
    await noCredentialStorage(page);
    console.log(`Pilot ${width}x${height}: authenticated canonical dataset, auditing 20 identities`);
    for (const lead of samples) {
      await openSheet(page, lead);
      await page.locator('[data-sheet-call-ai]').click();
      await page.waitForURL('**/#call-ai');
      assert.ok(await page.locator('#call-ai-copilot-account').textContent() === (lead.empresa || lead.nome), 'Call AI company mismatch');
      await page.locator('#call-ai-review-open').click();
      assert.equal(await page.locator('#call-ai-review').getAttribute('data-lead-id'), lead.id, 'Call AI review must use the exact CRM identity');
      await page.locator('#call-ai-review-close').click();
      // Reviewing without approval must neither fabricate a call nor persist
      // a result. Return through the ordinary CRM sheet to the technical bridge.
      await openSheet(page, lead);
      await page.locator('[data-sheet-technical]').click();
      await page.waitForURL('**/#guia');
      assert.equal(await page.locator('#technical-client').inputValue(), lead.id, 'Technical bridge must use the exact CRM identity');
    }
    console.log(`Pilot ${width}x${height}: 20 CRM/Call AI/technical identity checks PASS`);
    await settled(page);
    const readOnly = await apiState(context);
    for (const lead of samples) assert.deepEqual(readOnly.leads.find(item => item.id === lead.id).interactions || [], lead.interactions || [], 'Unapproved call review must not create a commercial result');
    assert.deepEqual(readOnly.history, before.history, 'Context audit must not replace existing quotations');

    // Exactly one marked quotation per prepared dataset. Rerunning the live
    // smoke reuses it rather than adding repeated test history to real clients.
    const priorQuote = readOnly.history.find(item => realLead(readOnly.leads.find(lead => lead.id === item.clientId) || {}) && JSON.stringify(item.payload?.vehicles || []).includes(quoteLabel));
    if (!priorQuote) {
      assert.ok(readOnly.history.length < 50, 'Do not save a test quotation when mature history retention would evict prior user work');
      await openSheet(page, target);
      await page.locator('[data-sheet-technical]').click(); await page.waitForURL('**/#guia');
      await page.locator('#technical-vehicle').selectOption('rodotrem_9eixos');
      await page.locator('#consultant-libras-select').selectOption('120');
      await page.locator('#consultant-include-dianteira').uncheck();
      for (const [selector, value] of [['#technical-name', vehicleName], ['#technical-qty', '1'], ['#technical-notes', quoteLabel]]) {
        await page.locator(selector).fill(value); await page.locator(selector).press('Tab');
      }
      for (const [id, value] of [['brand', 'volvo'], ['has_reduction', 'nao']]) await page.locator(`[data-qid="${id}"][data-val="${value}"]`).click();
      assert.equal(await page.locator('#technical-state').getAttribute('data-state'), 'result');
      const parts = await page.locator('[data-technical-item]').evaluateAll(nodes => nodes.map(node => ({ code: node.dataset.code, qty: Number(node.dataset.qty) })));
      assert.ok(parts.length > 0 && parts.every(item => item.qty > 0), 'Existing technical engine must produce a real composition');
      await page.locator('#btn-inject-consultant-to-quote').click(); await page.waitForURL('**/#cotacao');
      assert.ok(await page.locator('#client-company').inputValue() === target.empresa, 'Quotation company mismatch');
      assert.equal(await page.locator('.input-veh-name').inputValue(), vehicleName);
      assert.equal(await page.locator('.input-veh-multiplier').inputValue(), '1');
      const quantities = await page.locator('.vehicle-body tbody tr').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.querySelector('td:first-child span').textContent.trim(), Number(node.querySelector('.input-veh-item-qty').value)])));
      assert.deepEqual(quantities, Object.fromEntries(parts.map(item => [item.code, item.qty])));
      await page.locator('#btn-save-quote').click(); await settled(page);
      const saved = (await apiState(context)).history.find(item => !readOnly.history.some(previous => previous.id === item.id));
      assert.ok(saved && saved.clientId === target.id, 'Saved quotation must retain exact canonical CRM identity');
      assert.equal(saved.payload.vehicles[0].clientId, target.id);
      assert.equal(saved.payload.vehicles[0].qty, 1);
      assert.deepEqual(Object.fromEntries(saved.payload.vehicles[0].items.map(item => [item.code, Number(item.qty)])), quantities);
      assert.ok(JSON.stringify(saved.payload.vehicles[0]).includes(quoteLabel), 'The real-client test quotation must be explicitly marked unsent');
      savedQuoteId = saved.id;
    } else savedQuoteId = priorQuote.id;
    await navigate(page, 'dia');
    await context.setOffline(true); await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
    await context.setOffline(false); await settled(page);
    await page.reload(); await page.waitForFunction(() => document.body.dataset.shellReady === 'true'); await settled(page);
    assert.equal(await page.locator('#access-session-dialog:modal').count(), 0, 'Reload must not ask for PIN again');
    await noCredentialStorage(page);
    const after = await apiState(context);
    assert.ok(after.history.some(item => item.id === savedQuoteId), 'Saved quotation must survive reload');
    for (const lead of samples) assert.ok(after.leads.some(item => item.id === lead.id), 'Real canonical entity lost on reload');
    subsetPreserved(before.history, after.history, 'Prior quotation');
    for (const key of ['quotes', 'activityEvents', 'generatedDocuments']) subsetPreserved(before.operations?.[key], after.operations?.[key], `Prior operations.${key}`);
    for (const lead of before.leads) subsetPreserved(lead.interactions, after.leads.find(item => item.id === lead.id)?.interactions, 'Prior interaction');
    for (const tab of ['crm', 'prospeccao', 'call-ai', 'guia', 'cotacao', 'dia']) { await navigate(page, tab); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Operational viewport must not overflow horizontally'); }
    externalActions += await page.evaluate(() => window.__pilotExternalAttempts || 0);
    assert.equal(externalActions, 0, 'The pilot proof may not launch WhatsApp or an external customer action');
    assert.deepEqual(errors, [], 'No critical browser bootstrap or navigation errors');
    if (process.env.OG_PILOT_ARTIFACTS) {
      await mkdir(process.env.OG_PILOT_ARTIFACTS, { recursive: true });
      await page.screenshot({ path: path.join(process.env.OG_PILOT_ARTIFACTS, `${width}-pilot.png`) });
    }
    console.log(`Pilot ${width}x${height}: 20 real CRM→Call AI→technical identities, one marked unsent quotation, original work/reload/reconnect/no raw PIN PASS (${live ? 'API bearer smoke; original live PIN not verified; cookie login tested locally' : 'normal PIN cookie; local filesystem fixture'})`);
    await context.close();
  }
  if (!live) {
    const beforeRestart = JSON.parse(await readFile(path.join(dataDir, 'shared-state.json'), 'utf8'));
    await stopLocal(); await startLocal();
    const probe = await browser.newContext();
    const afterRestart = await apiState(probe);
    assert.deepEqual(afterRestart.leads, beforeRestart.leads, 'A process restart/idempotent seed must retain all current real entities');
    assert.deepEqual(afterRestart.history, beforeRestart.history, 'A process restart/idempotent seed must retain the newly saved quotation and original history');
    assert.deepEqual(afterRestart.operations, beforeRestart.operations, 'A process restart must retain technical and sales relationships');
    await probe.close();
    console.log('Pilot persistent local filesystem: process restart + repeated hosted seed preserves exact current state PASS (Railway volume tested separately)');
  }
} catch (error) {
  // Test failure output must not reproduce private API credentials or client
  // payloads from library call logs/deep equality diagnostics.
  const message = String(error?.message || error).split('\n')[0].replaceAll(bearer, '[REDACTED]').replaceAll(localPin, '[REDACTED]');
  const location = String(error?.stack || '').match(/test_pilot_reality_browser\.mjs:\d+:\d+/)?.[0] || '';
  console.error(`Pilot reality failure: ${message}${location ? ' (' + location + ')' : ''}`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  await stopLocal();
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
}
