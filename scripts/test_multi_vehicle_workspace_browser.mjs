/* Independent Stage 7 browser gate. Business records are synthetic; technical
 * fixtures reuse the mature engine. The quotation, loopback HTTP revisions and
 * IndexedDB recovery queue stay real. Private pilot proof is a separate gate. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const { chromium } = createRequire(import.meta.url)('playwright');
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-multi-qa-'));
const artifacts = process.env.OG_MULTI_VEHICLE_ARTIFACTS;
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
    OG_LOCAL_ACCESS_TOKEN: '', OG_LOCAL_ACCESS_PIN: '', OG_PERSISTENT_AUTH: 'false',
    OG_SALES_EXECUTION_EDGE_URL: '', OG_SALES_EXECUTION_EDGE_TOKEN: '',
    OG_CALL_INTELLIGENCE_EDGE_URL: '', OG_CALL_INTELLIGENCE_EDGE_TOKEN: '',
    OG_LOCAL_WHISPER_URL: '', OG_LOCAL_WHISPER_TOKEN: '', OG_SUPABASE_URL: ''
  }, stdio: 'pipe'
});
const leads = [
  { id: 'QA-MULTI-A', internalCode: 'QA-MULTI-CODE-A', empresa: 'QA Multi Alpha', nome: 'QA Alpha',
    cnpj: '12345678000191', ie: 'QA-IE-A', telefone: '44999995201', cidadeUf: 'QA Alpha - PR',
    segmentId: 'transportadora', status: 'contatado', priority: 'alta', nextAction: 'QA original Alpha', interactions: [] },
  { id: 'QA-MULTI-B', internalCode: 'QA-MULTI-CODE-B', empresa: 'QA Multi Beta', nome: 'QA Beta',
    cnpj: '98765432000112', ie: '', telefone: '44999995202', cidadeUf: 'QA Beta - SC',
    segmentId: 'agricola', status: 'novo', priority: 'media', nextAction: 'QA original Beta', interactions: [] }
];
const priorHistory = [{ id: 'QA-MULTI-PRIOR-QUOTE', date: '2026-10-01T10:00:00Z', clientId: null,
  clientName: 'QA previous contact', clientCompany: 'QA previous saved quotation', totalValue: 10, totalPecas: 1,
  payload: { client: { nome: 'QA previous contact', empresa: 'QA previous saved quotation', tier: 'lead_ie',
    paymentMethod: 'faturado', parcelasCount: 6 }, vehicles: [], extraItems: [{ code: 'EQ-700', qty: 1, customPrice: 10 }] } }];
const priorOperations = {
  activityEvents: [{ id: 'QA-MULTI-PRIOR-FACT', type: 'proposal.prepared', proposalId: 'QA-MULTI-PRIOR-PROPOSAL', clientId: leads[0].id, at: '2026-10-01T10:00:00Z' }],
  generatedDocuments: [{ id: 'QA-MULTI-PRIOR-DOCUMENT', documentType: 'proposal_tracking', clientId: leads[0].id }]
};
const rodotrem = { 'EQ-120': 16, 'EQ-1145': 4, 'EQ-1135': 12, 'EQ-1040': 16, 'EQ-1043': 16 };
const toco = { 'EQ-120': 2, 'EQ-1145': 2, 'EQ-1040': 2, 'EQ-1043': 2 };
const fleet = { 'EQ-120': 38, 'EQ-1145': 14, 'EQ-1135': 24, 'EQ-1040': 38, 'EQ-1043': 38 };
const viewports = [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]];
const results = [];
const log = label => { results.push(`${label}: PASS`); console.log(results.at(-1)); };
const errors = [];
let failedPuts = 0;
let conflictResponses = 0;
let browser, context, page;

const history = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_cotacoes_history')) || []);
const operations = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_operations_state')) || {});
const storedLeads = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_leads_crm')) || []);
const records = async () => (await operations()).quotes.filter(item => item.source === 'technical_workspace');
const queued = () => page.evaluate(() => OG_SYNC_BRIDGE.readQueuedState());
const remote = () => page.evaluate(async () => (await fetch('/api/state')).json());
const itemMap = items => Object.fromEntries(items.map(item => [item.code, Number(item.qty)]));
const technicalRows = () => page.locator('[data-technical-item]').evaluateAll(nodes => nodes.map(node => ({ code: node.dataset.code, qty: Number(node.dataset.qty) })));
const cards = () => page.locator('#vehicles-accordion-container .vehicle-card[data-vehicle-id]');
const card = id => page.locator(`#vehicles-accordion-container .vehicle-card[data-vehicle-id="${id}"]`);
const state = () => page.locator('#technical-state').getAttribute('data-state');
const summary = () => page.locator('#multi-vehicle-workspace [data-consolidated-code]').evaluateAll(nodes => Object.fromEntries(nodes.map(node => [node.dataset.consolidatedCode, Number(node.dataset.consolidatedQty)])));
const vehicles = () => cards().evaluateAll(nodes => nodes.map(node => ({
  id: node.dataset.vehicleId,
  name: node.querySelector('.input-veh-name').value,
  qty: Number(node.querySelector('.input-veh-multiplier').value),
  items: [...node.querySelectorAll('.vehicle-body tbody tr')].map(row => ({
    code: row.querySelector('td:first-child span').textContent.trim(),
    qty: Number(row.querySelector('.input-veh-item-qty').value),
    price: Number(row.querySelector('.input-veh-item-price').value)
  }))
})));
const consolidated = values => {
  const totals = {};
  for (const value of values) for (const item of value.items) totals[item.code] = (totals[item.code] || 0) + item.qty * value.qty;
  return totals;
};

async function navigate(tab) {
  if (await page.locator('#nav-tabs-container').isVisible()) await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
  else {
    const button = page.locator(`.og-mobile-nav [data-mobile-tab="${tab}"]`);
    if (!await button.isVisible()) await page.locator('[data-mobile-more]').click();
    await button.click();
  }
  await page.waitForURL(`**/#${tab}`);
}
async function fill(selector, value) {
  const control = typeof selector === 'string' ? page.locator(selector) : selector;
  const vehicleControl = await control.evaluate(node => Boolean(node.closest('.vehicle-card')));
  const handle = vehicleControl ? await control.elementHandle() : null;
  await control.fill(String(value));
  await control.press('Tab');
  if (handle) await page.waitForFunction(node => !node.isConnected, handle);
}
async function withDialogs(action, accept = true) {
  const dialogs = [];
  const handler = dialog => { dialogs.push(dialog.message()); return accept ? dialog.accept() : dialog.dismiss(); };
  page.on('dialog', handler);
  try { await action(); }
  finally { page.off('dialog', handler); }
  return dialogs;
}
async function clickVehicle(control, accept = true) {
  const handle = await control.elementHandle();
  const dialogs = await withDialogs(() => control.click(), accept);
  if (accept) await page.waitForFunction(node => !node.isConnected, handle);
  return dialogs;
}
async function chooseClient(id, accept = true) { return withDialogs(() => page.locator('#technical-client').selectOption(id), accept); }
async function configure(id, name, qty) {
  await withDialogs(() => page.locator('#technical-vehicle').selectOption(id));
  await page.locator('#consultant-libras-select').selectOption('120');
  await page.locator('#consultant-include-dianteira').uncheck();
  await fill('#technical-name', name);
  await fill('#technical-qty', qty);
  await page.locator('[data-qid="brand"][data-val="volvo"]').click();
  if (id === 'rodotrem_9eixos') await page.locator('[data-qid="has_reduction"][data-val="nao"]').click();
  assert.equal(await state(), 'result');
}
async function saveDraft() {
  await page.locator('#technical-save-draft').evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => !document.querySelector('#technical-save-draft').disabled);
  assert.match(await page.locator('#technical-feedback').textContent(), /salv[oa]/i);
}
async function handoff(accept = true, double = false) {
  const dialogs = await withDialogs(async () => {
    if (double) await page.locator('#btn-inject-consultant-to-quote').evaluate(button => { button.click(); button.click(); });
    else await page.locator('#btn-inject-consultant-to-quote').click();
    await page.waitForFunction(() => !document.querySelector('#technical-save-draft').disabled);
  }, accept);
  if (accept) await page.waitForURL('**/#cotacao');
  return dialogs;
}
async function begin() {
  await withDialogs(() => page.locator('#btn-add-vehicle-slot').click());
  await page.waitForURL('**/#guia');
}
async function edit(id) {
  await withDialogs(() => card(id).locator(`[data-edit-vehicle="${id}"]`).click());
  await page.waitForURL('**/#guia');
}
async function expand(id) {
  if (!await card(id).locator('.vehicle-body').isVisible()) await clickVehicle(card(id).locator('[data-toggle-vidx]'));
}
async function commercialSave() {
  await page.locator('#btn-save-quote').click();
  return (await history())[0];
}
async function reopen(id) {
  await navigate('historico');
  const index = (await history()).findIndex(item => item.id === id);
  assert.ok(index >= 0, 'saved quote remains in existing history');
  await page.locator(`.btn-load-hist[data-load="${index}"]`).click();
  await page.waitForURL('**/#cotacao');
}
async function idle() {
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  await page.waitForFunction(async () => !(await OG_SYNC_BRIDGE.readQueuedState()));
}
async function installQueueProbe() {
  await page.evaluate(() => {
    const original = OG_SYNC_BRIDGE.queueState;
    OG_SYNC_BRIDGE.queueState = async (...args) => {
      const result = await original(...args);
      __multiQA.queued++;
      if (__multiQA.holdNext) {
        __multiQA.holdNext = false; __multiQA.held = true;
        await new Promise(resolve => { __multiQA.release = resolve; });
      }
      return result;
    };
  });
}

try {
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Isolated multi-vehicle QA server timeout')), 15000);
    server.stdout.on('data', chunk => { if (String(chunk).includes('Sistema OG no computador')) { clearTimeout(timer); resolve(); } });
    server.once('error', error => { clearTimeout(timer); reject(error); });
  });
  browser = await chromium.launch({ executablePath: process.env.OG_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  await context.addInitScript(({ leads, priorHistory, priorOperations }) => {
    if (localStorage.getItem('og_leads_crm') === null) {
      localStorage.setItem('og_leads_crm', JSON.stringify(leads));
      localStorage.setItem('og_cotacoes_history', JSON.stringify(priorHistory));
      localStorage.setItem('og_operations_state', JSON.stringify(priorOperations));
    }
    window.open = () => null;
    window.__multiQA = { hooks: null, controller: null, calls: 0, holdNext: false, held: false, release: null, queued: 0 };
    let workspaceApi;
    Object.defineProperty(window, 'OG_TECHNICAL_WORKSPACE', { configurable: true, get: () => workspaceApi, set(api) {
      workspaceApi = { ...api, create(hooks) {
        __multiQA.hooks = hooks;
        const controller = api.create({ ...hooks, build(...args) { __multiQA.calls++; return hooks.build(...args); } });
        __multiQA.controller = controller;
        return controller;
      } };
    } });
  }, { leads, priorHistory, priorOperations });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.url() === `${base}/api/state` && request.method() === 'PUT') failedPuts++; });
  page.on('response', response => { if (response.url() === `${base}/api/state` && response.status() === 409) conflictResponses++; });
  await page.goto(`${base}/#guia`);
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await page.waitForFunction(async () => (await (await fetch('/api/state')).json()).leads.some(item => item.id === 'QA-MULTI-A'));
  await idle();
  await installQueueProbe();
  const initialLeads = await storedLeads();
  const initialOperations = await operations();
  assert.equal(await technicalRows().then(items => items.length), 0);
  await chooseClient(leads[0].id);
  await configure('rodotrem_9eixos', 'QA Rodotrem Volvo', 2);
  assert.deepEqual(itemMap(await technicalRows()), rodotrem);
  await saveDraft();
  assert.deepEqual(await storedLeads(), initialLeads, 'technical draft never invents CRM outcomes');
  assert.deepEqual(await history(), priorHistory, 'technical draft is not a commercial saved quotation');
  assert.deepEqual((await operations()).activityEvents, initialOperations.activityEvents);
  assert.deepEqual((await operations()).generatedDocuments, initialOperations.generatedDocuments);
  await handoff(true, true);
  assert.equal((await vehicles()).length, 1, 'first handoff replaces another client/sample composition once');
  const rodId = (await vehicles())[0].id;
  const beforeAdd = await page.evaluate(() => __multiQA.calls);
  await begin();
  assert.equal(await page.locator('#technical-client').inputValue(), leads[0].id);
  assert.equal(await page.locator('#technical-vehicle').inputValue(), '');
  assert.equal((await technicalRows()).length, 0, 'Add starts an empty application, not a prefilled 3/4');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  assert.equal(await page.evaluate(() => __multiQA.calls), beforeAdd);
  log('01 Add: empty native editor, exact current client, no inferred engine result or commercial facts');

  await withDialogs(() => page.locator('#technical-vehicle').selectOption('toco_4x2'));
  await page.locator('#consultant-libras-select').selectOption('120');
  assert.equal((await technicalRows()).length, 0, 'missing brand must not invoke a default application');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  const beforeInvalid = await page.evaluate(() => {
    const calls = __multiQA.calls;
    __multiQA.hooks.replaceDraft({ ...__multiQA.hooks.draft(), selectedVehicleId: 'QA-INVALID-CONFIG' });
    __multiQA.controller.render();
    return calls;
  });
  assert.equal((await technicalRows()).length, 0);
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  assert.equal(await page.evaluate(() => __multiQA.calls), beforeInvalid);
  await configure('toco_4x2', 'QA Toco Volvo', 3);
  await fill('#technical-qty', 0);
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  await fill('#technical-qty', 1.5);
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  await fill('#technical-qty', 3);
  log('05 Incomplete/unsupported configuration and noninteger vehicle quantity remain explicit VALIDAR');
  await handoff(true, true);
  const pair = await vehicles();
  assert.equal(pair.length, 2);
  const tocoId = pair.find(item => item.id !== rodId).id;
  assert.deepEqual(itemMap(pair.find(item => item.id === rodId).items), rodotrem);
  assert.deepEqual(itemMap(pair.find(item => item.id === tocoId).items), toco);
  assert.deepEqual(consolidated(pair), fleet);
  assert.deepEqual(await summary(), fleet, 'visible fleet summary uses the canonical per-vehicle multipliers once');
  assert.match(await page.locator('#metric-total').textContent(), /11210\.00/);
  assert.match(await page.locator('#metric-pecas').textContent(), /152 peças.*76 pneus.*5 veículos/);
  log('08 Quantities stay per vehicle: two Rodotrems plus three Tocos produce exactly 152 pieces/76 tires');
  await navigate('guia');
  await handoff(true, true);
  assert.deepEqual(await vehicles(), pair, 'repeating an unchanged handoff updates the stable vehicle instead of appending');
  log('10 Consolidation uses canonical vehicle IDs, includes both configurations and bounds double submission');

  assert.match(await page.locator('#metric-condicao').textContent(), /6x de R\$ 1868\.33/);
  await page.locator('#client-tier').selectOption('revenda');
  assert.match(await page.locator('#metric-total').textContent(), /9006\.00/);
  await page.locator('#client-tier').selectOption('lead_ie');
  await page.locator('#client-parcelas').selectOption('1');
  assert.match(await page.locator('#metric-total').textContent(), /11210\.00/, 'one installment does not silently replace the mature principal with preview discount semantics');
  await page.locator('#client-parcelas').selectOption('6');
  await expand(tocoId);
  const tocoEqualizer = () => card(tocoId).locator('.vehicle-body tbody tr').filter({ has: page.locator('td:first-child span', { hasText: /^EQ-120$/ }) });
  await fill(tocoEqualizer().locator('.input-veh-item-price'), 220);
  assert.match(await page.locator('#metric-total').textContent(), /11252\.00/);
  await page.locator('#client-tier').selectOption('revenda');
  assert.equal(await tocoEqualizer().locator('.input-veh-item-price').inputValue(), '220.00');
  await page.locator('#client-tier').selectOption('lead_ie');
  await clickVehicle(tocoEqualizer().locator('.btn-reset-veh-price'));
  assert.match(await page.locator('#metric-total').textContent(), /11210\.00/);
  log('11 Browser finance reuses mature tier/installment/custom-price contracts and exact totals; card is covered by the real-calculator unit gate');

  await clickVehicle(card(tocoId).locator(`[data-duplicate-vehicle="${tocoId}"]`));
  const duplicated = await vehicles();
  assert.equal(duplicated.length, 3);
  assert.equal(new Set(duplicated.map(item => item.id)).size, 3);
  const duplicateId = duplicated.find(item => item.id !== rodId && item.id !== tocoId).id;
  const duplicateBefore = duplicated.find(item => item.id === duplicateId);
  assert.equal(duplicateBefore.qty, 3);
  assert.deepEqual(duplicateBefore.items, duplicated.find(item => item.id === tocoId).items);
  const duplicatedSaved = await commercialSave();
  const copiedVehicle = duplicatedSaved.payload.vehicles.find(item => item.id === duplicateId);
  const sourceVehicle = duplicatedSaved.payload.vehicles.find(item => item.id === tocoId);
  assert.notEqual(copiedVehicle.technicalContext.id, sourceVehicle.technicalContext.id);
  assert.equal(copiedVehicle.technicalContext.handoffId, duplicateId);
  log('02 Duplicate creates distinct vehicle/draft IDs and deep independent composition');

  await edit(duplicateId);
  assert.equal(await page.locator('#technical-qty').inputValue(), '3');
  assert.deepEqual(itemMap(await technicalRows()), toco);
  await fill('#technical-name', 'QA independent duplicate');
  await fill('#technical-notes', 'QA reviewed duplicate notes');
  await fill('[data-technical-item][data-code="EQ-120"] [data-technical-qty]', 3);
  await page.locator('[data-technical-item][data-code="EQ-1145"] [data-technical-code]').selectOption('EQ-1135');
  await page.locator('[data-technical-item][data-code="EQ-1043"] [data-technical-remove]').click();
  if (!await page.locator('.technical-manual-tools').evaluate(node => node.open)) await page.locator('.technical-manual-tools summary').click();
  await page.locator('#technical-add-code').selectOption('EQ-700');
  await fill('#technical-add-qty', 1);
  await page.locator('#technical-add-item').click();
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  const manualMap = itemMap(await technicalRows());
  assert.deepEqual(manualMap, { 'EQ-120': 3, 'EQ-1135': 2, 'EQ-1040': 2, 'EQ-700': 1 });
  await fill('#technical-qty', 2);
  assert.deepEqual(itemMap(await technicalRows()), manualMap, 'input changes preserve explicit manual per-vehicle composition');
  await withDialogs(() => page.locator('#technical-reset-manual').click(), false);
  assert.deepEqual(itemMap(await technicalRows()), manualMap);
  await page.locator('#technical-confirm-manual').check();
  await handoff(true, true);
  const edited = await vehicles();
  assert.deepEqual(edited.find(item => item.id === tocoId), duplicated.find(item => item.id === tocoId), 'editing clone cannot change original');
  assert.equal(edited.find(item => item.id === duplicateId).name, 'QA independent duplicate');
  assert.equal(edited.find(item => item.id === duplicateId).qty, 2);
  assert.deepEqual(itemMap(edited.find(item => item.id === duplicateId).items), manualMap);
  assert.deepEqual(await summary(), consolidated(edited), 'manual item replacement/add/removal updates the visible summary immediately');
  log('03 Edit changes the selected stable vehicle once and leaves the source vehicle intact');
  log('06 Manual replace/add/remove/notes stay explicit and require review before consolidation');
  const manualSaved = await commercialSave();
  const manualSavedVehicle = manualSaved.payload.vehicles.find(item => item.id === duplicateId);
  assert.deepEqual(itemMap(manualSavedVehicle.items), manualMap);
  assert.deepEqual(itemMap(manualSavedVehicle.technicalContext.manualItems), manualMap);
  assert.equal(manualSavedVehicle.technicalContext.notes, 'QA reviewed duplicate notes');
  assert.equal(manualSavedVehicle.technicalContext.manualConfirmed, true);
  await idle();
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await reopen(manualSaved.id);
  assert.equal((await vehicles()).find(item => item.id === duplicateId).qty, 2);
  assert.deepEqual(itemMap((await vehicles()).find(item => item.id === duplicateId).items), manualMap);
  await installQueueProbe();
  await edit(duplicateId);
  assert.equal(await page.locator('#technical-notes').inputValue(), 'QA reviewed duplicate notes');
  assert.deepEqual(itemMap(await technicalRows()), manualMap, 'saved manual composition and notes survive actual reload/reopen');
  await withDialogs(() => page.locator('#technical-reset-manual').click());
  assert.deepEqual(itemMap(await technicalRows()), toco);
  await handoff();
  log('07 Manual overrides survive input recalculation/cancel; accepted reset uses the unchanged mature engine');

  const beforeDelete = await vehicles();
  const cancelled = await clickVehicle(card(duplicateId).locator('[data-del-vidx]'), false);
  assert.equal(cancelled.length, 1);
  assert.deepEqual(await vehicles(), beforeDelete);
  await page.evaluate(() => { window.__multiStale = [...document.querySelectorAll('#vehicles-accordion-container button,#vehicles-accordion-container input')]; });
  await clickVehicle(card(duplicateId).locator('[data-del-vidx]'));
  assert.equal((await vehicles()).length, 2);
  const afterDelete = await vehicles();
  assert.deepEqual(await summary(), fleet, 'deleting a vehicle removes its contribution from the visible consolidation');
  await page.evaluate(() => __multiStale.forEach(node => {
    if (node.tagName === 'INPUT') { node.value = '999'; node.dispatchEvent(new Event('change', { bubbles: true })); }
    else node.click();
  }));
  assert.deepEqual(await vehicles(), afterDelete, 'detached quote controls must be inert after indices change');
  assert.match(page.url(), /#cotacao$/);
  await edit(rodId);
  await fill('#technical-notes', 'QA original vehicle save held after durable write');
  assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled(), 'changing a reopened composition requires explicit review');
  await page.locator('#technical-confirm-manual').check();
  await page.evaluate(() => { __multiQA.holdNext = true; __multiQA.held = false; });
  await page.locator('#btn-inject-consultant-to-quote').click();
  await page.waitForFunction(() => __multiQA.held);
  assert.ok(await page.locator('#technical-client').isDisabled());
  assert.ok(await page.locator('#technical-vehicle').isDisabled());
  await page.evaluate(() => {
    __multiQA.hooks.replaceDraft(__multiQA.hooks.empty('QA-MULTI-B'));
    __multiQA.controller.render();
    __multiQA.release();
  });
  await page.waitForFunction(() => !document.querySelector('#technical-save-draft').disabled);
  assert.match(page.url(), /#guia$/, 'late Alpha handoff must not navigate or apply in Beta');
  assert.equal(await page.locator('#technical-client').inputValue(), leads[1].id);
  assert.equal((await technicalRows()).length, 0);
  await navigate('cotacao');
  assert.deepEqual(await vehicles(), afterDelete);
  log('09 Stale detached quote controls and a durable awaited old-client handoff cannot mutate the current owner');

  await page.locator('#client-tier').selectOption('lead_ie');
  await page.locator('#client-parcelas').selectOption('6');
  const saved = await commercialSave();
  const savedPayload = JSON.parse(JSON.stringify(saved.payload));
  assert.equal(saved.clientId, leads[0].id);
  assert.deepEqual(itemMap(saved.payload.vehicles.find(item => item.id === rodId).items), rodotrem);
  await fill('#client-company', 'QA temporary wrong quote identity');
  await fill('.input-veh-name[data-vidx="0"]', 'QA temporary wrong vehicle name');
  await reopen(saved.id);
  assert.equal(await page.locator('#client-company').inputValue(), leads[0].empresa);
  assert.equal(await page.locator('#client-cnpj').inputValue(), leads[0].cnpj);
  assert.equal(await page.locator('#client-ie').inputValue(), leads[0].ie);
  assert.equal(await page.locator('#client-tier').inputValue(), 'lead_ie');
  assert.deepEqual(consolidated(await vehicles()), fleet);
  await fill('.input-veh-name[data-vidx="0"]', 'QA edit after reopening saved snapshot');
  await fill('.input-veh-multiplier[data-vidx="0"]', 7);
  assert.deepEqual((await history()).find(item => item.id === saved.id).payload, savedPayload, 'reopened editor must not alias the saved history snapshot');
  assert.deepEqual((await history()).find(item => item.id === priorHistory[0].id), priorHistory[0]);
  for (const prior of initialOperations.activityEvents) assert.deepEqual((await operations()).activityEvents.find(item => item.id === prior.id), prior);
  for (const prior of initialOperations.generatedDocuments) assert.deepEqual((await operations()).generatedDocuments.find(item => item.id === prior.id), prior);
  await reopen(saved.id);
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await reopen(saved.id);
  assert.equal(await page.locator('#client-company').inputValue(), leads[0].empresa);
  assert.deepEqual(consolidated(await vehicles()), fleet);
  log('12 Save/reopen/reload retains all canonical vehicles/client inputs and protects prior saved records from alias mutation');

  await fill('.input-veh-name[data-vidx="1"]', 'QA veículo nome longo ' + 'identificação revisada '.repeat(18));
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => scrollTo(0, 0));
    assert.equal(await page.locator('.tab-content:visible').count(), 1);
    assert.equal((await vehicles()).length, 2);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 1, `${width}x${height}: destructive horizontal overflow ${overflow}`);
    const targets = await page.locator('#vehicles-accordion-container button:visible,#vehicles-accordion-container select:visible,#vehicles-accordion-container input:visible,#btn-add-vehicle-slot').evaluateAll(nodes => nodes.map(node => ({ label: node.getAttribute('aria-label') || node.title || node.className, height: node.getBoundingClientRect().height })));
    assert.ok(targets.every(target => target.height >= 44), `${width}x${height}: undersized vehicle controls ${JSON.stringify(targets.filter(target => target.height < 44))}`);
    await card(tocoId).locator(`[data-edit-vehicle="${tocoId}"]`).focus();
    assert.equal(await page.evaluate(() => document.activeElement.dataset.editVehicle), tocoId);
    await card(tocoId).scrollIntoViewIfNeeded();
    assert.ok(await card(tocoId).isVisible());
    if (artifacts) await page.screenshot({ path: path.join(artifacts, `${width}x${height}-multi.png`), fullPage: true });
    log(`${width}x${height} two-model fleet/long name/reachable actions/keyboard/touch/no page overflow`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const value of await vehicles()) await clickVehicle(card(value.id).locator('[data-del-vidx]'));
  assert.equal((await vehicles()).length, 0);
  assert.deepEqual(await summary(), {}, 'last vehicle removal empties the visible consolidation');
  assert.match(await page.locator('#metric-total').textContent(), /0\.00/);
  await navigate('guia'); await navigate('cotacao');
  assert.equal((await vehicles()).length, 0, 'navigation must not resurrect deleted/example vehicles');
  log('04 Remove cancellation preserves the fleet; deleting the last vehicle keeps a genuine empty quotation');
  await reopen(saved.id);

  // A fleet edit must reach the existing durable queue before a fresh page can
  // pull the older server composition. Reject actual PUTs through two reloads;
  // do not sleep for the debounce or manufacture a queue/status acknowledgement.
  await idle();
  let rejectedFleetPuts = 0;
  await page.route('**/api/state', route => {
    if (route.request().method() === 'PUT') {
      rejectedFleetPuts++;
      return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"QA held fleet transport"}' });
    }
    return route.continue();
  });
  await fill(card(tocoId).locator('.input-veh-multiplier'), 4);
  await page.waitForFunction(async id => {
    const pending = await OG_SYNC_BRIDGE.readQueuedState();
    return pending?.body?.operations?.quotes?.some(record => record.source === 'quote_workspace'
      && record.payload?.vehicles?.some(vehicle => vehicle.id === id && vehicle.qty === 4));
  }, tocoId);
  const fleetRecovery = (await queued()).body.operations.quotes.find(record => record.source === 'quote_workspace'
    && record.payload?.vehicles?.some(vehicle => vehicle.id === tocoId && vehicle.qty === 4));
  assert.ok(fleetRecovery?.id.startsWith('FLEET-DRAFT-'));
  for (let reload = 0; reload < 2; reload++) {
    await page.reload();
    await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
    await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
    assert.equal((await vehicles()).find(vehicle => vehicle.id === tocoId).qty, 4);
    assert.match(await page.locator('#metric-total').textContent(), /11800\.00/);
    const restored = (await operations()).quotes.find(record => record.id === fleetRecovery.id);
    assert.equal(restored.payload.vehicles.find(vehicle => vehicle.id === tocoId).qty, 4);
    assert.equal((await queued()).body.operations.quotes.find(record => record.id === fleetRecovery.id)
      .payload.vehicles.find(vehicle => vehicle.id === tocoId).qty, 4);
  }
  assert.ok(rejectedFleetPuts > 0, 'real fleet PUT attempts must receive the temporary 503');
  assert.ok(!(await remote()).operations.quotes.some(record => record.source === 'quote_workspace'
    && record.payload?.vehicles?.some(vehicle => vehicle.id === tocoId && vehicle.qty === 4)), 'failed fleet transport cannot claim remote application');
  await page.unroute('**/api/state');
  await context.setOffline(true);
  await context.setOffline(false);
  await idle();
  assert.equal((await remote()).operations.quotes.find(record => record.id === fleetRecovery.id)
    .payload.vehicles.find(vehicle => vehicle.id === tocoId).qty, 4);
  await fill(card(tocoId).locator('.input-veh-multiplier'), 3);
  await page.waitForFunction(() => document.querySelector('#metric-total').textContent.includes('11210.00'));
  await idle();
  log('13 Fleet-row mutation immediately reaches the real outbox, survives two reloads under actual 503, and converges after real reconnect ACK');

  await edit(rodId);
  await idle();
  await installQueueProbe();
  await context.setOffline(true);
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
  await fill('#technical-notes', 'QA multi offline durable original vehicle');
  const offlineQueueBefore = await page.evaluate(() => __multiQA.queued);
  await saveDraft();
  assert.ok(await queued());
  assert.ok(JSON.stringify(await records()).includes('QA multi offline durable original vehicle'));
  await page.waitForFunction(count => __multiQA.queued >= count + 2, offlineQueueBefore);
  assert.ok(failedPuts > 0, 'scheduled technical PUT must actually fail while offline');
  await context.setOffline(false);
  await idle();
  assert.equal(await queued(), null);
  assert.ok(JSON.stringify((await remote()).operations.quotes).includes('QA multi offline durable original vehicle'));
  await page.evaluate(async () => {
    const value = await (await fetch('/api/state')).json();
    value.leads.find(lead => lead.id === 'QA-MULTI-B').nextAction = 'QA actual other device revision';
    const response = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    if (!response.ok) throw Error('Concurrent multi-vehicle revision fixture failed');
  });
  await fill('#technical-notes', 'QA multi actual409 local work preserved');
  await saveDraft();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.ok(conflictResponses > 0);
  assert.ok(JSON.stringify(await records()).includes('QA multi actual409 local work preserved'));
  assert.ok(!JSON.stringify((await remote()).operations.quotes).includes('QA multi actual409 local work preserved'));
  await page.reload();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.equal(await page.locator('#og-sync-status').getAttribute('data-mode'), 'conflict');
  assert.ok(JSON.stringify(await records()).includes('QA multi actual409 local work preserved'));
  await withDialogs(() => page.locator('[data-sync-review]').click());
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-review-banner')));
  await withDialogs(() => page.locator('[data-send-review]').click());
  await idle();
  assert.equal(await queued(), null);
  assert.ok(JSON.stringify((await remote()).operations.quotes).includes('QA multi actual409 local work preserved'));
  log('13 Offline actual failed PUT/durable queue/reconnect ACK and actual HTTP409/refresh/explicit existing review preserve work');

  await navigate('crm');
  await page.locator('#crm-search-input').fill(leads[1].empresa);
  await page.locator(`#crm-leads-tbody [data-open-client-sheet="${leads[1].id}"]`).first().click();
  assert.equal((await page.locator('#client-sheet-title').textContent()).trim(), leads[1].empresa);
  await page.locator('[data-sheet-technical]').click();
  await page.waitForURL('**/#guia');
  assert.equal(await page.locator('#technical-client').inputValue(), leads[1].id);
  assert.equal((await technicalRows()).length, 0, 'Alpha composition must not leak into Beta CRM entry');
  await configure('toco_4x2', 'QA Beta marked UNSENT technical quotation', 1);
  await fill('#technical-notes', 'QA TEST: quotation not sent; no physical OG certification');
  await handoff();
  assert.equal(await page.locator('#client-company').inputValue(), leads[1].empresa);
  assert.equal(await page.locator('#client-ie').inputValue(), '');
  assert.equal(await page.locator('#client-tier').inputValue(), 'lead_ie');
  assert.equal((await vehicles()).length, 1);
  const betaSaved = await commercialSave();
  assert.equal(betaSaved.clientId, leads[1].id);
  assert.equal(betaSaved.payload.client.internalCode, leads[1].internalCode);
  assert.equal(betaSaved.payload.vehicles[0].clientId, leads[1].id);
  assert.ok(JSON.stringify(betaSaved.payload.vehicles[0]).includes('quotation not sent'));
  assert.equal((await storedLeads()).length, initialLeads.length, 'workflow must not fabricate another CRM entity');
  const events = (await operations()).activityEvents;
  assert.ok(!events.some(item => /sent|sale\.confirmed|order\.confirmed/.test(item.type || '')), 'saving a quotation must not invent a sent/sale outcome');
  log('14 Canonical CRM sheet→technical→quotation identity and unsent facts (synthetic; private real-pilot gate remains separate)');
  await idle();
  await page.evaluate(async () => {
    const value = await (await fetch('/api/state')).json();
    value.operations.quotes = [];
    const response = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
    if (!response.ok) throw Error('Empty server composition conflict fixture failed');
  });
  const conflictsBeforeServerChoice = conflictResponses;
  await fill(card(betaSaved.payload.vehicles[0].id).locator('.input-veh-multiplier'), 2);
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.ok(conflictResponses > conflictsBeforeServerChoice, 'server-choice recovery must start from actual HTTP409');
  await withDialogs(() => page.locator('[data-sync-server]').click());
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok'
    && !document.querySelector('#og-sync-conflict-banner'));
  assert.equal((await vehicles()).length, 0, 'explicit server choice with no composition discards the local fleet');
  assert.deepEqual(await summary(), {});
  assert.deepEqual((await operations()).quotes, []);
  assert.ok((await queued()) === null, 'explicit server choice retires the discarded local recovery intention');
  await navigate('guia');
  await navigate('cotacao');
  assert.equal((await vehicles()).length, 0, 'navigation cannot resurrect the discarded fleet');
  assert.deepEqual((await remote()).operations.quotes, []);
  log('13 Actual409 explicit server choice with no composition clears local fleet/outbox without resurrecting discarded work');
  assert.deepEqual(errors, [], 'multi-vehicle lifecycle must not produce uncaught browser exceptions');
  if (artifacts) await writeFile(path.join(artifacts, 'results.txt'), results.join('\n') + '\n');
  console.log('Stage7 independent multi-vehicle browser QA: PASS');
} finally {
  try { await browser?.close(); }
  finally {
    server.kill('SIGTERM');
    await rm(dataDir, { recursive: true, force: true });
  }
}
