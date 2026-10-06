/* Independent Stage 6 browser QA. CRM fixtures and explicit manual display
 * stress items are synthetic; application expectations reuse existing parity
 * fixtures. No physical mapping, hosted runtime or product dependency is added.
 * The loopback /api/state, IndexedDB outbox and HTTP409 flow stay real. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const { chromium } = createRequire(import.meta.url)('playwright');
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-technical-qa-'));
const artifacts = process.env.OG_TECHNICAL_ARTIFACTS;
if (artifacts) await mkdir(artifacts, { recursive: true });
const port = await new Promise(resolve => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1', () => {
    const value = socket.address().port;
    socket.close(() => resolve(value));
  });
});
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['apps/sistema-og/server.mjs'], {
  cwd: new URL('../', import.meta.url),
  env: {
    ...process.env, OG_PORT: String(port), OG_HOST: '127.0.0.1', OG_DATA_DIR: dataDir,
    OG_SALES_EXECUTION_EDGE_URL: '', OG_SALES_EXECUTION_EDGE_TOKEN: '',
    OG_CALL_INTELLIGENCE_EDGE_URL: '', OG_CALL_INTELLIGENCE_EDGE_TOKEN: '',
    OG_LOCAL_WHISPER_URL: '', OG_LOCAL_WHISPER_TOKEN: '', OG_SUPABASE_URL: ''
  }, stdio: 'pipe'
});
const leads = [
  { id: 'QA-TECH-A', empresa: 'QA Technical Alpha', nome: 'QA Alpha', telefone: '44999995001', status: 'contatado', priority: 'alta', nextAction: 'QA original Alpha', interactions: [] },
  { id: 'QA-TECH-B', empresa: 'QA Technical Beta', nome: 'QA Beta', telefone: '44999995002', status: 'novo', priority: 'media', nextAction: 'QA original Beta', interactions: [] },
  { id: 'QA-TECH-L', empresa: 'QA Technical nome longo ' + 'contexto '.repeat(18), nome: '', telefone: '', status: 'novo', priority: 'baixa', interactions: [] }
];
const operationsFixture = {
  activityEvents: [{ id: 'QA-TECH-EXISTING-FACT', type: 'proposal.prepared', proposalId: 'QA-PRIOR-PROPOSAL', clientId: 'QA-TECH-A', at: '2026-10-01T10:00:00Z' }],
  generatedDocuments: [{ id: 'QA-PRIOR-DOCUMENT', documentType: 'proposal_tracking', clientId: 'QA-TECH-A' }]
};
const parityPieces = { 'EQ-120': 16, 'EQ-1145': 4, 'EQ-1135': 12, 'EQ-1040': 16, 'EQ-1043': 16 };
const viewports = [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]];
const results = [];
const log = label => { results.push(`${label}: PASS`); console.log(results.at(-1)); };
let browser;
let context;
let page;
const errors = [];
let failedPuts = 0;
let conflictResponses = 0;

const operations = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_operations_state')) || {});
const storedLeads = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_leads_crm')) || []);
const history = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_cotacoes_history')) || []);
const drafts = async () => (await operations()).quotes.filter(item => item.source === 'technical_workspace' && item.status === 'technical_draft');
const latestDraft = async () => (await drafts()).at(-1);
const remote = () => page.evaluate(async () => (await fetch('/api/state')).json());
const queued = () => page.evaluate(() => OG_SYNC_BRIDGE.readQueuedState());
const rows = () => page.locator('[data-technical-item]').evaluateAll(nodes => nodes.map(node => ({ code: node.dataset.code, qty: Number(node.dataset.qty) })));
const itemMap = items => Object.fromEntries(items.map(item => [item.code, Number(item.qty)]));
const state = () => page.locator('#technical-state').getAttribute('data-state');

async function navigate(tab) {
  if (await page.locator('#nav-tabs-container').isVisible()) await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
  else {
    const button = page.locator(`.og-mobile-nav [data-mobile-tab="${tab}"]`);
    if (!(await button.isVisible())) await page.locator('[data-mobile-more]').click();
    await button.click();
  }
  await page.waitForURL(`**/#${tab}`);
}
async function fill(selector, value) {
  await page.locator(selector).fill(String(value));
  await page.locator(selector).press('Tab');
}
async function answer(id, value) {
  await page.locator(`#consultant-questions-container [data-qid="${id}"][data-val="${value}"]`).click();
}
async function selectClient(id, accept = true) {
  const handler = dialog => accept ? dialog.accept() : dialog.dismiss();
  page.on('dialog', handler);
  try { await page.locator('#technical-client').selectOption(id); }
  finally { page.off('dialog', handler); }
}
async function selectVehicle(id, accept = true) {
  const handler = dialog => accept ? dialog.accept() : dialog.dismiss();
  page.on('dialog', handler);
  try { await page.locator('#technical-vehicle').selectOption(id); }
  finally { page.off('dialog', handler); }
}
async function configureRodotrem() {
  await selectVehicle('rodotrem_9eixos');
  await page.locator('#consultant-libras-select').selectOption('120');
  await page.locator('#consultant-include-dianteira').uncheck();
  await fill('#technical-name', 'QA Rodotrem Volvo atual');
  await fill('#technical-qty', 2);
  await answer('brand', 'volvo');
  await answer('has_reduction', 'nao');
  assert.equal(await state(), 'result', await page.locator('#technical-state').textContent() + ' ' + await page.evaluate(() => JSON.stringify(__technicalEngine.hooks.draft())));
}
async function configureToco() {
  await selectVehicle('toco_4x2');
  await page.locator('#consultant-libras-select').selectOption('120');
  await page.locator('#consultant-include-dianteira').uncheck();
  await fill('#technical-name', 'QA Toco Volvo atual');
  await fill('#technical-qty', 1);
  await answer('brand', 'volvo');
  assert.equal(await state(), 'result');
}
async function saveDraft() {
  await page.locator('#technical-save-draft').evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => !document.querySelector('#technical-save-draft').disabled);
}
async function installQueueProbe() {
  await page.evaluate(() => {
    window.__technicalQueue = { completed: 0, holdNext: false, held: false, release: null };
    const original = OG_SYNC_BRIDGE.queueState;
    OG_SYNC_BRIDGE.queueState = async (...args) => {
      const result = await original(...args);
      const qa = window.__technicalQueue;
      qa.completed++;
      if (qa.holdNext) {
        qa.holdNext = false; qa.held = true;
        await new Promise(resolve => { qa.release = resolve; });
      }
      return result;
    };
  });
}

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Isolated technical QA server timeout')), 15000);
    server.stdout.on('data', chunk => { if (String(chunk).includes('Sistema OG no computador')) { clearTimeout(timer); resolve(); } });
    server.once('error', reject);
  });
  browser = await chromium.launch({ executablePath: process.env.OG_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.addInitScript(({ leads, operationsFixture }) => {
    if (!localStorage.getItem('og_leads_crm')) {
      localStorage.setItem('og_leads_crm', JSON.stringify(leads));
      localStorage.setItem('og_operations_state', JSON.stringify(operationsFixture));
    }
    window.open = () => null;
    // Capture the public presentation adapter's existing hooks. The wrapper
    // always delegates to the actual mature engine unless a named error test
    // deliberately throws; no rule or product state is exposed by the app.
    window.__technicalEngine = { calls: 0, fail: false, hooks: null, controller: null };
    let workspaceApi;
    Object.defineProperty(window, 'OG_TECHNICAL_WORKSPACE', {
      configurable: true,
      get() { return workspaceApi; },
      set(api) {
        workspaceApi = { ...api, create(hooks) {
          __technicalEngine.hooks = hooks;
          const controller = api.create({ ...hooks, build(...args) {
            __technicalEngine.calls++;
            if (__technicalEngine.fail) throw new Error('QA deliberately unavailable existing engine');
            return hooks.build(...args);
          } });
          __technicalEngine.controller = controller;
          return controller;
        } };
      }
    });
  }, { leads, operationsFixture });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.url() === `${base}/api/state` && request.method() === 'PUT') failedPuts++; });
  page.on('response', response => { if (response.url() === `${base}/api/state` && response.status() === 409) conflictResponses++; });
  await page.goto(`${base}/#guia`);
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  assert.ok(await page.locator('#technical-workspace').isVisible());
  assert.equal(await page.locator('#technical-workspace').count(), 1);
  assert.equal(await page.locator('.tab-content:visible').count(), 1);
  assert.equal((await rows()).length, 0, 'initial empty input must not expose sample application');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  await page.waitForFunction(async () => (await (await fetch('/api/state')).json()).leads.some(item => item.id === 'QA-TECH-A'));
  await page.waitForFunction(async () => !(await OG_SYNC_BRIDGE.readQueuedState()));
  await installQueueProbe();
  const initialLeads = await storedLeads();
  const initialHistory = await history();
  const initialOps = await operations();
  log('Single native shell workspace; empty application contains no fabricated items');

  await selectClient('QA-TECH-A');
  const incompleteCalls = await page.evaluate(() => __technicalEngine.calls);
  await selectVehicle('rodotrem_9eixos');
  assert.equal((await rows()).length, 0);
  assert.ok(['empty', 'validate'].includes(await state()));
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  assert.equal(await page.evaluate(() => __technicalEngine.calls), incompleteCalls, 'incomplete input must not call engine with inferred defaults');
  await configureRodotrem();
  assert.deepEqual(itemMap(await rows()), parityPieces, 'current mature rodotrem parity fixture, quantities per vehicle');
  await saveDraft();
  const originalDraft = await latestDraft();
  assert.ok(originalDraft.id.startsWith('TECH-DRAFT-'));
  assert.equal(originalDraft.clientId, 'QA-TECH-A');
  assert.equal(originalDraft.payload.vehicles[0].vehicleTypeId, 'rodotrem_9eixos');
  assert.equal(originalDraft.payload.vehicles[0].qty, 2);
  assert.deepEqual(itemMap(originalDraft.payload.vehicles[0].items), parityPieces);
  assert.deepEqual(await storedLeads(), initialLeads, 'technical draft must not fabricate a CRM contact/result');
  assert.deepEqual(await history(), initialHistory, 'draft must not become a saved commercial quotation');
  assert.deepEqual((await operations()).activityEvents, initialOps.activityEvents, 'draft must not create proposal/sales facts');
  assert.deepEqual((await operations()).generatedDocuments, initialOps.generatedDocuments);
  await saveDraft();
  assert.equal((await drafts()).length, 1, 'same current draft save is stable, not another vehicle');
  assert.equal((await latestDraft()).id, originalDraft.id);
  log('Current mature engine parity/codes/per-vehicle quantities; stable draft owner; no Stage3/proposal/CRM facts');

  await navigate('dia');
  assert.equal(await page.locator('[data-mission-proposal]').count(), 1, 'only original proposal remains in Mission Control');
  await navigate('guia');
  assert.deepEqual(itemMap(await rows()), parityPieces);
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  assert.equal(await page.locator('#technical-client').inputValue(), 'QA-TECH-A');
  assert.equal(await page.locator('#technical-vehicle').inputValue(), 'rodotrem_9eixos');
  assert.deepEqual(itemMap(await rows()), parityPieces);
  await installQueueProbe();
  log('Back/navigation/refresh restores exact canonical client and vehicle draft');

  await fill('[data-technical-item][data-code="EQ-120"] [data-technical-qty]', 15);
  assert.equal(itemMap(await rows())['EQ-120'], 15);
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled(), 'unreviewed manual change must remain VALIDAR');
  await fill('#technical-qty', 3);
  assert.equal(itemMap(await rows())['EQ-120'], 15, 'automatic input recalculation preserves manual quantity');
  page.once('dialog', dialog => dialog.dismiss());
  await page.locator('#technical-reset-manual').click();
  assert.equal(itemMap(await rows())['EQ-120'], 15, 'cancelled explicit recalculation preserves manual items');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#technical-reset-manual').click();
  assert.deepEqual(itemMap(await rows()), parityPieces, 'accepted explicit recalculation restores original engine output');
  await fill('#technical-notes', 'QA manual reviewed observation');
  await fill('[data-technical-item][data-code="EQ-120"] [data-technical-qty]', 15);
  await page.locator('.technical-manual-tools summary').click();
  await page.locator('#technical-add-code').selectOption('EQ-700');
  await fill('#technical-add-qty', 1);
  await page.locator('#technical-add-item').click();
  await page.locator('#technical-confirm-manual').check();
  await saveDraft();
  const manualDraft = await latestDraft();
  assert.equal(itemMap(manualDraft.payload.vehicles[0].items)['EQ-120'], 15);
  assert.equal(itemMap(manualDraft.payload.vehicles[0].items)['EQ-700'], 1);
  assert.equal(manualDraft.payload.vehicles[0].qty, 3);
  assert.ok(JSON.stringify(manualDraft).includes('QA manual reviewed observation'));
  log('Manual edit/add/provenance/VALIDAR review; no silent overwrite; explicit recalculation confirmation');

  await fill('[data-technical-item][data-code="EQ-120"] [data-technical-qty]', 0);
  assert.equal(itemMap(await rows())['EQ-120'], 15, 'invalid manual quantity keeps its prior value and editor');
  assert.match(await page.locator('#technical-feedback').textContent(), /inteiro positivo/);
  while (await page.locator('[data-technical-remove]').count()) await page.locator('[data-technical-remove]').first().click();
  assert.equal((await rows()).length, 0, 'manual empty composition must never resurrect automatic pieces');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  assert.ok(await page.locator('#technical-add-item').isEnabled(), 'empty manual composition remains repairable');
  await page.locator('#technical-add-code').selectOption('EQ-700');
  await fill('#technical-add-qty', 2);
  await page.locator('#technical-add-item').click();
  assert.deepEqual(itemMap(await rows()), {'EQ-700':2}, 'explicit new manual piece repairs empty composition without auto fallback');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled(), 'new manual composition still requires review');
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  assert.match(await page.locator('#technical-feedback').textContent(), /Rascunho salvo recuperado/);
  assert.equal(itemMap(await rows())['EQ-120'], 15, 'refresh restores previously saved reviewed composition only');
  await installQueueProbe();
  log('Invalid manual qty preserves editor; all-remove is recoverable without automatic resurrection; saved restore is explicit');


  page.once('dialog', dialog => dialog.accept());
  await page.locator('#btn-inject-consultant-to-quote').evaluate(button => { button.click(); button.click(); });
  await page.waitForURL('**/#cotacao');
  assert.equal(await page.locator('#client-company').inputValue(), 'QA Technical Alpha');
  assert.equal(await page.locator('.input-veh-name').count(), 1, 'handoff must not retain example vehicles or double-submit');
  assert.equal(await page.locator('.input-veh-multiplier').inputValue(), '3');
  const quoteMap = await page.locator('.vehicle-body tbody tr').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.querySelector('td:first-child span').textContent.trim(), Number(node.querySelector('.input-veh-item-qty').value)])));
  assert.deepEqual(quoteMap, itemMap(manualDraft.payload.vehicles[0].items), 'actual quotation receives reviewed codes and per-vehicle quantities');
  await page.locator('#btn-save-quote').click();
  const handed = (await history())[0];
  assert.equal(handed.clientId, 'QA-TECH-A');
  assert.equal(handed.payload.vehicles[0].qty, 3);
  assert.deepEqual(itemMap(handed.payload.vehicles[0].items), quoteMap);
  assert.ok(JSON.stringify(handed.payload.vehicles[0]).includes('QA manual reviewed observation'));
  log('Real existing quotation handoff preserves exact CRM/vehicle/codes/qty/manual notes; double submission bounded');

  await navigate('guia');
  await page.evaluate(() => { window.__technicalStale = [...document.querySelectorAll('[data-qid],[data-technical-remove],[data-technical-qty]')]; });
  await selectClient('QA-TECH-B');
  assert.equal(await page.locator('#technical-client').inputValue(), 'QA-TECH-B');
  assert.equal((await rows()).length, 0, 'client switch must clear Alpha result');
  const beforeStale = await operations();
  await page.evaluate(() => __technicalStale.forEach(node => {
    if (node.tagName === 'INPUT') { node.value = '999'; node.dispatchEvent(new Event('change', { bubbles: true })); }
    else node.click();
  }));
  assert.deepEqual(await operations(), beforeStale, 'detached Alpha controls are inert in Beta');
  assert.match(page.url(), /#guia$/);
  await configureToco();
  assert.deepEqual(itemMap(await rows()), { 'EQ-120': 2, 'EQ-1145': 2, 'EQ-1040': 2, 'EQ-1043': 2 });
  await page.evaluate(() => { __technicalQueue.holdNext = true; __technicalQueue.held = false; });
  await page.locator('#btn-inject-consultant-to-quote').click();
  await page.waitForFunction(() => __technicalQueue.held);
  assert.ok(await page.locator('#technical-client').isDisabled(), 'native client changes are blocked while durable write awaits');
  assert.ok(await page.locator('#technical-vehicle').isDisabled());
  // Exercise the owner check even if an external canonical refresh replaces
  // context while the local write is awaiting its durable acknowledgement.
  await page.evaluate(() => {
    __technicalEngine.hooks.replaceDraft(__technicalEngine.hooks.empty('QA-TECH-A'));
    __technicalEngine.controller.render();
  });
  await page.evaluate(() => __technicalQueue.release());
  await page.waitForFunction(() => !document.querySelector('#technical-save-draft').disabled);
  assert.match(page.url(), /#guia$/, 'late Beta handoff must not navigate or apply in Alpha');
  assert.equal(await page.locator('#technical-client').inputValue(), 'QA-TECH-A');
  assert.equal((await rows()).length, 0);
  log('A→B reset, stale detached controls inert; durable awaited Beta handoff cannot contaminate Alpha');

  await selectVehicle('3_4');
  await page.locator('#consultant-libras-select').selectOption('120');
  await answer('wheel_size', '19');
  assert.equal((await rows()).length, 0, 'missing Truck answer must not use a default configuration');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  await answer('has_truck_3_4', 'nao');
  assert.equal(itemMap(await rows())['EQ-1155'], 2);
  assert.equal(itemMap(await rows())['EQ-1340'], 2);
  await page.evaluate(() => {
    const select = document.querySelector('#technical-vehicle');
    select.add(new Option('QA invalid uncovered configuration', 'QA-INVALID-CONFIG'));
  });
  const beforeInvalid = itemMap(await rows());
  await selectVehicle('QA-INVALID-CONFIG');
  assert.deepEqual(itemMap(await rows()), beforeInvalid, 'unsupported UI value is rejected without changing valid context');
  const invalidCalls = await page.evaluate(() => {
    const qa = __technicalEngine;
    const before = qa.calls;
    qa.hooks.replaceDraft({ ...qa.hooks.draft(), selectedVehicleId: 'QA-INVALID-CONFIG' });
    qa.controller.render();
    return before;
  });
  assert.equal((await rows()).length, 0, 'uncovered configuration must not fall back to first supported vehicle');
  assert.ok(['empty', 'validate', 'error'].includes(await state()));
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  assert.equal(await page.evaluate(() => __technicalEngine.calls), invalidCalls, 'invalid persisted input never reaches engine');
  log('Incomplete input and invalid configuration show explicit validation with no invented parts/default engine output');

  await selectClient('QA-TECH-B');
  await configureToco();
  await page.evaluate(() => { __technicalEngine.fail = true; __technicalEngine.controller.render(); });
  assert.equal(await state(), 'error');
  assert.equal((await rows()).length, 0, 'actual build-hook exception must not use fictional fallback pieces');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  await page.evaluate(() => { __technicalEngine.fail = false; __technicalEngine.controller.render(); });
  assert.equal(await state(), 'result');
  log('Existing engine error is explicit/no fictional fallback; current valid context recovers');
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  await page.waitForFunction(async () => !(await OG_SYNC_BRIDGE.readQueuedState()));
  await context.setOffline(true);
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
  await fill('#technical-notes', 'QA technical offline durable note');
  const offlineQueueBefore = await page.evaluate(() => __technicalQueue.completed);
  await saveDraft();
  assert.ok(await queued(), 'offline technical save must durably use existing outbox');
  assert.ok(JSON.stringify(await latestDraft()).includes('QA technical offline durable note'));
  await page.waitForFunction(count => __technicalQueue.completed >= count + 2, offlineQueueBefore);
  assert.ok(failedPuts > 0, 'actual scheduled PUT must fail while offline');
  await context.setOffline(false);
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  assert.equal(await queued(), null);
  assert.ok(JSON.stringify((await remote()).operations.quotes).includes('QA technical offline durable note'));
  log('Local deterministic application/offline durable draft; actual failed PUT and real reconnect ACK/outbox clearance');

  await page.evaluate(async () => {
    const value = await (await fetch('/api/state')).json();
    value.leads.find(lead => lead.id === 'QA-TECH-A').nextAction = 'QA actual concurrent remote device';
    const result = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    if (!result.ok) throw new Error('Remote concurrency fixture setup failed');
  });
  await fill('#technical-notes', 'QA technical local 409 preserved');
  await saveDraft();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.ok(conflictResponses > 0, 'must exercise actual server HTTP409');
  assert.ok(JSON.stringify(await latestDraft()).includes('QA technical local 409 preserved'));
  assert.ok(!(JSON.stringify((await remote()).operations.quotes).includes('QA technical local 409 preserved')), 'conflict may not silently overwrite remote');
  await page.reload();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.equal(await page.locator('#og-sync-status').getAttribute('data-mode'), 'conflict');
  assert.ok(JSON.stringify(await latestDraft()).includes('QA technical local 409 preserved'));
  assert.equal(await page.locator('#technical-client').inputValue(), 'QA-TECH-B');
  assert.equal(await page.locator('#technical-vehicle').inputValue(), 'toco_4x2');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-sync-review]').click();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-review-banner')));
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-send-review]').click();
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  assert.equal(await queued(), null);
  assert.ok(JSON.stringify((await remote()).operations.quotes).includes('QA technical local 409 preserved'));
  log('Actual HTTP409 preserves local technical draft across refresh; explicit existing conflict review/real ACK converges');

  // Explicitly synthetic MANUAL catalog options stress display only. They add no
  // compatibility/support mapping and never run through an application fixture.
  const stressCodes = Array.from({ length: 22 }, (_, index) => `QA-MANUAL-${index}-` + (index === 0 ? '1234567890'.repeat(16) : 'LONGCODE'.repeat(5)));
  await page.evaluate(codes => {
    OG_DATA.catalog.push(...codes.map((code, index) => ({ code, name: `QA artificial manual display item ${index} ` + 'nome extenso '.repeat(12), category: 'manual', priceBase: 0 })));
  }, stressCodes);
  await fill('#technical-name', 'QA veículo nome longo ' + 'identificação manual '.repeat(14));
  await fill('#technical-notes', 'QA notas extensas ' + 'observação manual '.repeat(40));
  if (!(await page.locator('.technical-manual-tools').evaluate(node => node.open))) await page.locator('.technical-manual-tools summary').click();
  for (const code of stressCodes) {
    await page.locator('#technical-add-code').selectOption(code);
    await fill('#technical-add-qty', 1);
    await page.locator('#technical-add-item').click();
  }
  assert.equal((await rows()).length, 26);
  await page.locator('#technical-confirm-manual').check();
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    assert.ok(await page.locator('#technical-workspace').isVisible());
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `${width}x${height}: destructive horizontal overflow ${overflow}`);
    const targets = await page.locator('#technical-workspace button:visible,#technical-workspace select:visible,#technical-workspace input:not([type="checkbox"]):visible').evaluateAll(nodes => nodes.map(node => ({ label: node.id || node.dataset.qid || node.dataset.code || node.textContent.trim(), height: node.getBoundingClientRect().height })));
    assert.ok(targets.every(target => target.height >= 44), `${width}x${height}: touch targets ${JSON.stringify(targets.filter(target => target.height < 44))}`);
    await page.locator('#technical-save-draft').focus();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'technical-save-draft');
    await page.locator('[data-technical-item]').last().scrollIntoViewIfNeeded();
    assert.ok(await page.locator('[data-technical-item]').last().isVisible(), 'many items remain reachable');
    if (artifacts) await page.screenshot({ path: path.join(artifacts, `${width}x${height}-technical-many.png`), fullPage: true });
    log(`${width}x${height} technical result/long codes/many manual items/navigation/touch/overflow`);
  }
  assert.deepEqual(errors, [], 'no uncaught browser exceptions');
  if (artifacts) await writeFile(path.join(artifacts, 'results.txt'), results.join('\n') + '\n');
  console.log('Stage6 independent technical browser QA: PASS');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(dataDir, { recursive: true, force: true });
}
