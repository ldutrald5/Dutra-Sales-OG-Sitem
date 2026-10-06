/* Optional developer browser regression. Synthetic fixtures and a temporary
 * loopback server only; installed Playwright/Chromium are not product deps.
 * AI, transcription and normalized commands use controllable client contracts.
 * The existing /api/state transport, IndexedDB outbox and conflict flow stay real.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const { chromium } = createRequire(import.meta.url)('playwright');
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-call-qa-'));
const artifacts = process.env.OG_CALL_AI_ARTIFACTS;
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
    OG_LOCAL_WHISPER_URL: '', OG_LOCAL_WHISPER_TOKEN: '', OG_SUPABASE_URL: '',
    OG_WHISPER_SELF_TEST: ''
  },
  stdio: 'pipe'
});
const day = delta => {
  const value = new Date();
  value.setDate(value.getDate() + delta);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T10:00`;
};
const refs = {
  companyId: '11111111-1111-4111-8111-111111111111',
  contactId: '22222222-2222-4222-8222-222222222222',
  opportunityId: '33333333-3333-4333-8333-333333333333',
  sessionId: null, listMemberId: null
};
const leads = [
  { id: 'QA-CALL-A', empresa: 'QA Call Alpha', nome: 'Contato Alpha', telefone: '44999990001', status: 'contatado', priority: 'alta', nextAction: 'QA ação original Alpha', followUpAt: day(-1), pain: 'QA dor confirmada Alpha', interactions: [] },
  { id: 'QA-CALL-B', empresa: 'QA Call Beta', nome: 'Contato Beta', telefone: '44999990002', status: 'novo', priority: 'media', nextAction: 'QA ação original Beta', followUpAt: day(0), interactions: [] },
  { id: 'QA-CALL-N', empresa: 'QA Call Normalized', nome: 'Contato Normalized', telefone: '44999990003', status: 'contatado', priority: 'alta', nextAction: 'QA ação original Normalized', followUpAt: day(0), interactions: [], salesExecution: refs },
  { id: 'QA-CALL-E', empresa: 'QA contexto incompleto com nome longo ' + 'contexto comercial '.repeat(9), nome: '', telefone: '', status: 'novo', priority: 'baixa', interactions: [] }
];
const transcript = 'Cliente QA: queremos entender a rotina de pneus de doze caminhões. Pedi material e um retorno amanhã às dez. Preço e garantia não foram combinados.';
const analysis = marker => ({
  source: 'qa_fixture_provider', summary: marker,
  recommendedResponse: 'QA orientação que exige revisão', question: 'QA pergunta de diagnóstico?',
  objective: 'QA objetivo', suggestedNextAction: 'QA sugestão não aprovada',
  crmSuggestion: { summary: marker, nextAction: 'QA sugestão não aprovada', fleet: 999, suggestedStage: 'negociacao' }
});
const canonicalReply = {
  duplicate: false, callAttemptId: '44444444-4444-4444-8444-444444444444',
  activityId: '55555555-5555-4555-8555-555555555555', opportunityId: refs.opportunityId,
  meetingId: null, pipelineStage: 'CONNECTED', nextMemberId: null
};
let browser;
let context;
let page;
const errors = [];
let puts = 0;
let failedPuts = 0;
let unavailable = false;

async function installClients() {
  await page.evaluate(() => {
    const qa = window.__callQA = { ai: [], ci: [], sales: [], pending: {}, plans: {}, queueCompleted: 0, audioBytes: 0, recorderStarts: 0 };
    if (!window.__qaRecorderStart) {
      window.__qaRecorderStart = MediaRecorder.prototype.start;
      MediaRecorder.prototype.start = function (...args) {
        window.__callQA.recorderStarts++;
        this.addEventListener('dataavailable', event => { window.__callQA.audioBytes += event.data?.size || 0; });
        return window.__qaRecorderStart.apply(this, args);
      };
    }
    qa.response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
    qa.contract = (channel, request, fallback) => {
      qa[channel].push(JSON.parse(JSON.stringify(request)));
      const routed = `${channel}:${request.path?.split('/').at(-1)}`;
      const key = qa.plans[routed] ? routed : channel;
      const plan = qa.plans[key];
      qa.plans[key] = null;
      if (plan?.hold) return new Promise((resolve, reject) => { qa.pending[plan.hold] = { resolve, reject, channel }; });
      if (plan?.reject) return Promise.reject(new Error(plan.reject));
      const body = plan?.merge ? { ...fallback, ...plan.body, recording: { ...fallback.recording, ...plan.body.recording } } : plan?.body ?? fallback;
      return Promise.resolve(body);
    };
    qa.resolve = (key, body, status = 200) => {
      const pending = qa.pending[key];
      if (!pending) throw new Error(`Missing deferred QA contract ${key}`);
      delete qa.pending[key];
      pending.resolve(pending.channel === 'ai' ? body : qa.response(body, status));
    };
    OG_AI_SERVICE.clearCache();
    OG_AI_SERVICE.configure({ generate: request => qa.contract('ai', request, {
      source: 'qa_fixture_provider', summary: 'QA default analysis', recommendedResponse: 'QA review required',
      crmSuggestion: { summary: 'QA default analysis' }
    }) });
    OG_SALES_EXECUTION_CLIENT.configure({ fetcher: async (url, options) => {
      const request = { path: url, method: options.method, body: options.body ? JSON.parse(options.body) : null };
      if (!url.endsWith('/commands/record-call-result')) return qa.response({ configured: false, lists: [], members: [] });
      if (!navigator.onLine) { qa.sales.push(request); throw new Error('QA normalized command unavailable while offline'); }
      const result = await qa.contract('sales', request, { duplicate: false, callAttemptId: '44444444-4444-4444-8444-444444444444', opportunityId: '33333333-3333-4333-8333-333333333333', nextMemberId: null });
      return result instanceof Response ? result : qa.response(result);
    } });
    OG_CALL_INTELLIGENCE_CLIENT.configure({ fetcher: async (url, options) => {
      const request = { path: url, method: options.method, body: options.body ? JSON.parse(options.body) : null };
      const session = request.body?.callSessionId || decodeURIComponent(url.split('/recordings/')[1]?.split('/')[0] || '');
      const fallback = url.endsWith('/init')
        ? { signedUploadUrl: location.origin + '/qa-signed-audio', recording: { id: 'QA-RECORDING', call_session_id: session } }
        : { recording: { id: 'QA-RECORDING', call_session_id: session, transcription_status: 'UNAVAILABLE' }, providerReady: false, localFallbackReady: false, transcript: null, metrics: null };
      const result = await qa.contract('ci', request, fallback);
      return result instanceof Response ? result : qa.response(result);
    } });
    const queue = OG_SYNC_BRIDGE.queueState;
    OG_SYNC_BRIDGE.queueState = async (...args) => {
      const result = await queue(...args);
      qa.queueCompleted++;
      return result;
    };
  });
}
const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_leads_crm')));
const operations = () => page.evaluate(() => JSON.parse(localStorage.getItem('og_operations_state')) || {});
const queued = () => page.evaluate(() => OG_SYNC_BRIDGE.readQueuedState());
const remote = () => page.evaluate(async () => (await fetch('/api/state')).json());
const currentLead = id => stored().then(rows => rows.find(row => row.id === id));
const plan = (channel, value) => page.evaluate(({ channel, value }) => {
  if (channel === 'ai') OG_AI_SERVICE.clearCache();
  window.__callQA.plans[channel] = value;
}, { channel, value });
const resolve = (key, body, status = 200) => page.evaluate(({ key, body, status }) => window.__callQA.resolve(key, body, status), { key, body, status });
const log = label => console.log(`${label}: PASS`);
async function readableField(selector) {
  const ratio = await page.locator(selector).evaluate(node => {
    const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = values => values.map(value => {
      const normalized = value / 255;
      return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = luminance(rgb(getComputedStyle(node).color));
    let ancestor = node;
    while (ancestor.parentElement && /rgba\([^)]*,\s*0\)|transparent/.test(getComputedStyle(ancestor).backgroundColor)) ancestor = ancestor.parentElement;
    const background = luminance(rgb(getComputedStyle(ancestor).backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  assert.ok(ratio >= 4.5, `${selector}: normal text contrast ${ratio.toFixed(2)} must be >=4.5`);
}

async function navigate(tab) {
  if (await page.locator('#nav-tabs-container').isVisible()) await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
  else {
    const button = page.locator(`.og-mobile-nav [data-mobile-tab="${tab}"]`);
    if (!(await button.isVisible())) await page.locator('[data-mobile-more]').click();
    await button.click();
  }
  await page.waitForURL(`**/#${tab}`);
}
async function select(id, accept = true) {
  if (!(await page.locator('#tab-call-ai').isVisible())) await navigate('call-ai');
  const lead = leads.find(item => item.id === id);
  const handle = dialog => accept ? dialog.accept() : dialog.dismiss();
  page.on('dialog', handle);
  try {
    await page.locator('#call-ai-client-search').fill(lead.empresa);
    await page.locator(`[data-call-client="${id}"]`).click();
  } finally { page.off('dialog', handle); }
}
async function prepare() {
  if (!(await page.locator('#tab-call-ai').isVisible())) await navigate('call-ai');
  await page.locator('#call-ai-prepare').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-prepare').disabled);
  assert.ok(await page.locator('#call-ai-workspace').isVisible());
}
async function importText(text) {
  const details = page.locator('.call-ai-text-entry');
  if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  await page.locator('#call-ai-text-import').fill(text);
  await page.locator('#call-ai-text-use').click();
}
async function manualText(text) {
  const details = page.locator('details.call-ai-manual-transcript');
  if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  await page.locator('#call-ai-manual-transcript').fill(text);
}
async function review({ summary, nextAction, result = 'retornar_depois', date = day(1) }) {
  await page.locator('#call-ai-review-open').click();
  assert.ok(await page.locator('#call-ai-review').isVisible());
  await page.locator('#call-ai-result').selectOption(result);
  await page.locator('#call-ai-summary').fill(summary);
  await page.locator('#call-ai-next-action').fill(nextAction);
  await page.locator('#call-ai-follow-up').fill(date);
}
async function saveReview() {
  await page.locator('#call-ai-save').evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => document.querySelector('#call-ai-review').classList.contains('hidden'));
}
async function record() {
  await prepare();
  await page.evaluate(() => { __callQA.audioBytes = 0; });
  await page.locator('#call-ai-record-start').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-recording-status').dataset.state === 'recording');
  // Let the actual encoder produce a nonempty chunk; immediate start/stop can
  // legitimately yield an empty Blob on synthetic Chromium media devices.
  await page.waitForFunction(() => __callQA.audioBytes > 0);
  await page.locator('#call-ai-record-stop').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-recording-status').dataset.state === 'ready');
  assert.match(await page.locator('#call-ai-recording-playback').getAttribute('src'), /^blob:/);
}
async function upload() {
  await page.locator('#call-ai-recording-save').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-recording-save').disabled);
}
async function checkIsolation(marker) {
  assert.ok(!(await page.locator('#tab-call-ai').textContent()).includes(marker), `${marker} must not contaminate the new account`);
  assert.match(await page.locator('#call-ai-client-context').textContent(), /QA Call Beta/);
  assert.ok(!(await page.locator('#call-ai-generate').isDisabled()));
}

try {
  await new Promise((resolveStart, reject) => {
    const deadline = setTimeout(() => reject(new Error('Isolated CallAI server timeout')), 15000);
    server.stdout.on('data', chunk => { if (String(chunk).includes('Sistema OG no computador')) { clearTimeout(deadline); resolveStart(); } });
    server.once('error', reject);
  });
  browser = await chromium.launch({
    executablePath: process.env.OG_CHROMIUM_PATH || '/usr/bin/chromium', headless: true,
    args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
  });
  context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', permissions: ['microphone'] });
  await context.addInitScript(({ leads }) => {
    if (!localStorage.getItem('og_leads_crm')) localStorage.setItem('og_leads_crm', JSON.stringify(leads));
    window.__qaOpened = [];
    window.open = url => { window.__qaOpened.push(String(url)); return null; };
  }, { leads });
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
  page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(15000);
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.url() === `${base}/api/state` && request.method() === 'PUT') failedPuts++; });
  await page.route('**/api/state', route => {
    if (route.request().method() === 'PUT') {
      puts++;
      if (unavailable) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"QA state unavailable"}' });
    }
    return route.continue();
  });
  await page.route('**/qa-signed-audio', route => route.fulfill({ status: 200, body: '' }));
  await page.goto(`${base}/#call-ai`);
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await page.waitForFunction(async () => (await (await fetch('/api/state')).json()).leads.some(item => item.id === 'QA-CALL-A'));
  await page.waitForFunction(async () => !(await OG_SYNC_BRIDGE.readQueuedState()));
  await installClients();

  await select('QA-CALL-A');
  assert.equal(await page.evaluate(() => __callQA.ai.length + __callQA.ci.length + __callQA.sales.length), 0);
  assert.equal((await currentLead('QA-CALL-A')).interactions.length, 0);
  await prepare();
  await page.locator('#call-ai-notes').fill('QA Alpha draft must survive cancellation');
  await select('QA-CALL-B', false);
  assert.match(await page.locator('#call-ai-client-context').textContent(), /QA Call Alpha/);
  assert.equal(await page.locator('#call-ai-notes').inputValue(), 'QA Alpha draft must survive cancellation');
  await select('QA-CALL-B');
  assert.equal(await page.locator('#call-ai-notes').inputValue(), '');
  assert.ok(!(await page.locator('#call-ai-review').isVisible()));
  log('1/13 Exact account + explicit actions; cancelled/accepted draft switch');

  await select('QA-CALL-A');
  const beforeAnalysis = await stored();
  await importText(transcript);
  await readableField('#call-ai-text-import');
  assert.equal(await page.locator('#call-ai-live-input').inputValue(), transcript);
  assert.equal(await page.evaluate(() => __callQA.ai.length + __callQA.ci.length), 0, 'Pasting text must not call a provider or require audio');
  await plan('ai', { body: analysis('QA_UNREVIEWED_ANALYSIS_A') });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-structured-result').textContent.includes('QA_UNREVIEWED_ANALYSIS_A'));
  assert.deepEqual(await stored(), beforeAnalysis, 'Analysis is a candidate, not a commercial mutation');
  const request = await page.evaluate(() => __callQA.ai.at(-1));
  assert.equal(request.context.company.id, 'QA-CALL-A');
  assert.equal(request.input, transcript);
  assert.ok(!JSON.stringify(request).includes('QA Call Beta'), 'Only selected account context is sent');
  log('2/13 Pasted transcript without audio; compact analysis and no CRM mutation');

  await page.locator('[data-ai-save-note]').click();
  assert.ok(await page.locator('#call-ai-review').isVisible());
  assert.match(await page.locator('#call-ai-review-account').textContent(), /QA Call Alpha/);
  await page.locator('#call-ai-summary').fill('QA ignored human draft');
  await page.locator('#call-ai-review-close').click();
  assert.deepEqual(await stored(), beforeAnalysis, 'Ignoring/closing a candidate must preserve CRM');
  await review({ summary: 'QA HUMAN EDIT ALPHA', nextAction: 'QA human approved follow-up Alpha' });
  await saveReview();
  const savedA = await currentLead('QA-CALL-A');
  assert.equal(savedA.nextAction, 'QA human approved follow-up Alpha');
  assert.equal(savedA.followUpAt, day(1));
  assert.equal(Number(savedA.fleetSize || 0), Number(beforeAnalysis.find(item => item.id === 'QA-CALL-A').fleetSize || 0), 'Unreviewed inferred fleet never becomes customer fact');
  assert.equal(savedA.interactions.filter(item => item.type === 'call_ai').length, 1);
  assert.equal(savedA.interactions.find(item => item.type === 'call_ai').note, 'QA HUMAN EDIT ALPHA');
  assert.equal((await currentLead('QA-CALL-B')).nextAction, 'QA ação original Beta');
  await page.reload();
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  assert.equal((await currentLead('QA-CALL-A')).nextAction, 'QA human approved follow-up Alpha');
  await installClients();
  log('3/13 Ignore/edit/explicit local save; double click dedup and immediate refresh');

  await navigate('dia');
  await page.locator('[data-desk-select="QA-CALL-N"]').click();
  await page.locator('[data-client-register]').click();
  assert.match(await page.locator('#call-ai-review-account').textContent(), /QA Call Normalized/);
  await page.locator('#call-ai-result').selectOption('retornar_depois');
  await page.locator('#call-ai-summary').fill('QA HUMAN NORMALIZED SUMMARY');
  await page.locator('#call-ai-next-action').fill('QA human normalized follow-up');
  await page.locator('#call-ai-follow-up').fill(day(1));
  const beforeNormalized = await currentLead('QA-CALL-N');
  await plan('sales', { hold: 'normalized-save' });
  await page.locator('#call-ai-save').evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => Boolean(__callQA.pending['normalized-save']));
  assert.deepEqual(await currentLead('QA-CALL-N'), beforeNormalized, 'Canonical command must finish before projection');
  assert.ok(await page.locator('#call-ai-review').isVisible(), 'Awaiting approval must not advance/claim success');
  assert.ok(await page.locator('#call-ai-summary').isDisabled(), 'Approved submission fields stay fixed while the canonical command is pending');
  assert.equal(await page.evaluate(() => __callQA.sales.length), 1, 'Submission latch must prevent duplicate commands');
  const command = await page.evaluate(() => __callQA.sales[0].body);
  assert.equal(command.companyId, refs.companyId);
  assert.equal(command.contactId, refs.contactId);
  assert.equal(command.opportunityId, refs.opportunityId);
  assert.equal(command.result, 'RETURN_LATER');
  assert.equal(command.note, 'QA HUMAN NORMALIZED SUMMARY');
  assert.equal(command.nextActionType, 'FOLLOW_UP');
  assert.equal(command.nextActionAt, day(1));
  assert.ok(command.externalId);
  await resolve('normalized-save', canonicalReply);
  await page.waitForURL('**/#dia');
  const normalized = await currentLead('QA-CALL-N');
  assert.equal(normalized.nextAction, 'QA human normalized follow-up');
  assert.equal(normalized.interactions.filter(item => item.sessionId === command.externalId).length, 1);
  assert.ok(await page.locator('[data-desk-lead="QA-CALL-N"]').isVisible());
  await page.locator('[data-desk-select="QA-CALL-N"]').click();
  assert.match(await page.locator('#sales-desk-client').textContent(), /QA human normalized follow-up/);
  assert.equal((await operations()).activityEvents.filter(item => item.type === 'call.saved' && item.callSessionId === command.externalId).length, 1);
  log('4/13 Normalized command before projection, correct refs, latch, CRM/Meu Dia date');

  await select('QA-CALL-B');
  await select('QA-CALL-N');
  await review({ summary: 'QA NORMALIZED FAILURE DRAFT', nextAction: 'QA must not apply on failed command' });
  const beforeFailure = await currentLead('QA-CALL-N');
  await plan('sales', { reject: 'QA canonical command unavailable' });
  await page.locator('#call-ai-save').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-save').disabled);
  assert.deepEqual(await currentLead('QA-CALL-N'), beforeFailure);
  assert.ok(await page.locator('#call-ai-review').isVisible());
  assert.ok(!(await page.locator('#call-ai-summary').isDisabled()), 'A rejected canonical command leaves the draft editable');
  assert.match(await page.locator('#call-ai-review-status').textContent(), /QA canonical command unavailable|falh|não|pendente/i);
  const failureCommand = await page.evaluate(() => __callQA.sales.at(-1).body);
  await saveReview();
  assert.equal(await page.evaluate(() => __callQA.sales.at(-1).body.externalId), failureCommand.externalId);
  assert.equal((await currentLead('QA-CALL-N')).interactions.filter(item => item.sessionId === failureCommand.externalId).length, 1);
  await select('QA-CALL-B');
  await select('QA-CALL-N');
  await review({ summary: 'QA normalized missing module draft', nextAction: 'QA missing module must not project' });
  const beforeMissingClient = await currentLead('QA-CALL-N');
  await page.evaluate(() => { window.__qaSalesClient = window.OG_SALES_EXECUTION_CLIENT; window.OG_SALES_EXECUTION_CLIENT = null; });
  await page.locator('#call-ai-save').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-save').disabled);
  assert.deepEqual(await currentLead('QA-CALL-N'), beforeMissingClient, 'Normalized account must not bypass its canonical command when client is unavailable');
  assert.ok(await page.locator('#call-ai-review').isVisible());
  await page.evaluate(() => { window.OG_SALES_EXECUTION_CLIENT = window.__qaSalesClient; });
  await page.locator('#call-ai-summary').fill('QA canonical ACK before storage retry');
  await page.locator('#call-ai-next-action').fill('QA ACK then durable outbox retry');
  await page.evaluate(() => {
    // Abort actual outbox puts, not the compare/delete transaction of an
    // unrelated state ACK. The assertion guards this result's durable write.
    window.__qaOutboxPut = IDBObjectStore.prototype.put;
    __callQA.abortOutbox = true;
    __callQA.outboxAborts = 0;
    IDBObjectStore.prototype.put = function (...args) {
      const request = window.__qaOutboxPut.apply(this, args);
      if (__callQA.abortOutbox && this.name === 'outbox') {
        __callQA.outboxAborts++;
        this.transaction.abort();
      }
      return request;
    };
  });
  await plan('sales', { hold: 'ack-before-outbox' });
  await page.locator('#call-ai-save').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['ack-before-outbox']));
  assert.equal(await page.evaluate(() => __callQA.outboxAborts), 0, 'Local durable write cannot precede the canonical ACK');
  assert.deepEqual(await currentLead('QA-CALL-N'), beforeMissingClient);
  const storageRetryCommand = await page.evaluate(() => __callQA.sales.at(-1).body);
  await resolve('ack-before-outbox', canonicalReply);
  await page.waitForFunction(() => !document.querySelector('#call-ai-save').disabled);
  assert.ok(await page.evaluate(() => __callQA.outboxAborts > 0), 'The real outbox transaction must actually fail');
  assert.ok(await page.locator('#call-ai-review').isVisible(), 'No success/advance before durable outbox persistence');
  assert.equal(await page.locator('#call-ai-review-status').getAttribute('data-state'), 'error');
  assert.equal(await page.locator('#call-ai-summary').inputValue(), 'QA canonical ACK before storage retry');
  assert.ok(await page.locator('#call-ai-summary').isDisabled(), 'An already-confirmed canonical result cannot be edited while finishing its durable local projection');
  await page.locator('#call-ai-review-open').click();
  assert.equal(await page.locator('#call-ai-summary').inputValue(), 'QA canonical ACK before storage retry');
  assert.equal(await page.locator('#call-ai-next-action').inputValue(), 'QA ACK then durable outbox retry');
  assert.equal((await currentLead('QA-CALL-N')).interactions.filter(item => item.sessionId === storageRetryCommand.externalId).length, 1);
  await page.evaluate(() => { __callQA.abortOutbox = false; IDBObjectStore.prototype.put = window.__qaOutboxPut; });
  await plan('sales', { body: { ...canonicalReply, duplicate: true } });
  await saveReview();
  assert.equal(await page.evaluate(() => __callQA.sales.at(-1).body.externalId), storageRetryCommand.externalId);
  assert.equal((await currentLead('QA-CALL-N')).interactions.filter(item => item.sessionId === storageRetryCommand.externalId).length, 1);
  assert.equal((await operations()).activityEvents.filter(item => item.type === 'call.saved' && item.callSessionId === storageRetryCommand.externalId).length, 1);
  assert.equal((await currentLead('QA-CALL-N')).nextAction, 'QA ACK then durable outbox retry');
  await select('QA-CALL-B');
  await select('QA-CALL-N');
  await review({ summary: 'QA explicitly confirmed no interest', nextAction: 'QA stale follow-up must be cleared', result: 'sem_interesse' });
  await saveReview();
  const terminal = await currentLead('QA-CALL-N');
  const terminalCommand = await page.evaluate(() => __callQA.sales.at(-1).body);
  assert.equal(terminalCommand.result, 'NOT_INTERESTED');
  assert.equal(terminalCommand.nextActionType, '');
  assert.equal(terminalCommand.nextActionAt, null);
  assert.equal(terminal.status, 'perdido', 'Terminal CRM state is assigned by the existing Interaction Service owner');
  assert.equal(terminal.nextAction, '');
  assert.equal(terminal.followUpAt, '');
  assert.equal(terminal.interactions.filter(item => item.sessionId === terminalCommand.externalId && item.type === 'call_ai').length, 1);
  await navigate('dia');
  assert.equal(await page.locator('[data-desk-lead="QA-CALL-N"]').count(), 0, 'Terminal result must leave the actionable Meu Dia queue');
  log('5/13 Normalized failure/missing module retain draft; ACK→outbox abort→retry idempotent; terminal result clears follow-up');

  await select('QA-CALL-A');
  await plan('ai', { hold: 'old-analysis' });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['old-analysis']));
  await select('QA-CALL-B');
  await plan('ai', { body: analysis('QA_B_CURRENT_ANALYSIS') });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-structured-result').textContent.includes('QA_B_CURRENT_ANALYSIS'));
  await resolve('old-analysis', analysis('QA_A_LATE_ANALYSIS'));
  await checkIsolation('QA_A_LATE_ANALYSIS');
  assert.match(await page.locator('#call-ai-structured-result').textContent(), /QA_B_CURRENT_ANALYSIS/);
  await select('QA-CALL-A');
  await plan('ai', { hold: 'aba-old-analysis' });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['aba-old-analysis']));
  await select('QA-CALL-B');
  await select('QA-CALL-A');
  await plan('ai', { body: analysis('QA_A_NEW_GENERATION') });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-structured-result').textContent.includes('QA_A_NEW_GENERATION'));
  await resolve('aba-old-analysis', analysis('QA_A_PRIOR_GENERATION'));
  assert.ok(!(await page.locator('#tab-call-ai').textContent()).includes('QA_A_PRIOR_GENERATION'));
  assert.match(await page.locator('#call-ai-structured-result').textContent(), /QA_A_NEW_GENERATION/);
  await select('QA-CALL-B');
  await prepare();
  await importText('QA prior discarded session transcript');
  await page.locator('[data-call-signal="caro"]').click();
  await plan('ai', { hold: 'old-session' });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['old-session']));
  await page.locator('#call-ai-review-open').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#call-ai-discard').click();
  assert.equal(await page.locator('#call-ai-notes').inputValue(), '');
  assert.equal(await page.locator('#call-ai-text-import').inputValue(), '');
  assert.ok(!(await page.locator('#call-ai-suggestion-pending').isVisible()), 'Discarded adaptation must not remain actionable');
  await plan('ai', { body: analysis('QA_NEW_SESSION') });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-structured-result').textContent.includes('QA_NEW_SESSION'));
  await resolve('old-session', analysis('QA_OLD_SESSION'));
  assert.ok(!(await page.locator('#call-ai-structured-result').textContent()).includes('QA_OLD_SESSION'));
  await review({ summary: 'QA fresh session after discard', nextAction: 'QA discard leaves no previous signals' });
  await saveReview();
  const afterDiscardSave = (await currentLead('QA-CALL-B')).interactions.filter(item => item.type === 'call_ai').at(-1);
  assert.deepEqual(afterDiscardSave.signals, []);
  assert.equal(afterDiscardSave.source, 'manual_notes');
  await prepare();
  await importText('QA prior reset session transcript');
  await page.locator('[data-call-signal="sem_tempo"]').click();
  const previousSuggestion = await page.locator('#call-ai-apply-suggestion').elementHandle();
  await plan('ai', { hold: 'reset-session' });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['reset-session']));
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#call-ai-reset').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-prepare').disabled);
  assert.equal(await page.locator('#call-ai-notes').inputValue(), '');
  assert.equal(await page.locator('#call-ai-text-import').inputValue(), '');
  assert.ok(!(await page.locator('#call-ai-suggestion-pending').isVisible()), 'Reset adaptation must not remain actionable');
  await previousSuggestion.evaluate(button => button.click());
  await page.locator('#call-ai-next').click();
  assert.equal(await page.locator('#call-ai-speech').textContent(), 'Quero entender a realidade da QA Call Beta antes de sugerir qualquer aplicação.', 'Detached old suggestion handler must be inert after reset');
  await page.locator('#call-ai-prev').click();
  await plan('ai', { body: analysis('QA_RESET_CURRENT_SESSION') });
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-structured-result').textContent.includes('QA_RESET_CURRENT_SESSION'));
  await resolve('reset-session', analysis('QA_BEFORE_RESET_SESSION'));
  assert.ok(!(await page.locator('#tab-call-ai').textContent()).includes('QA_BEFORE_RESET_SESSION'));
  await review({ summary: 'QA fresh session after reset', nextAction: 'QA reset leaves no previous signals' });
  await saveReview();
  const afterResetSave = (await currentLead('QA-CALL-B')).interactions.filter(item => item.type === 'call_ai').at(-1);
  assert.deepEqual(afterResetSave.signals, []);
  assert.equal(afterResetSave.source, 'manual_notes');
  log('6/13 Deferred A→B/A→B→A and discarded/reset same-account sessions preserve current analysis');

  let heldKnowledge;
  let holdKnowledge = true;
  await page.route('**/api/knowledge/search', route => {
    if (holdKnowledge) { holdKnowledge = false; heldKnowledge = route; return; }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"results":[]}' });
  });
  await select('QA-CALL-A');
  await page.locator('#call-ai-prepare').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-prepare').disabled);
  await select('QA-CALL-B');
  await prepare();
  assert.ok(heldKnowledge, 'Actual preparation request must be held');
  await heldKnowledge.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ id: 'QA-LATE', title: 'QA_A_LATE_KNOWLEDGE', text: 'QA fixture only', status: 'confirmed', source: 'QA' }] }) });
  await checkIsolation('QA_A_LATE_KNOWLEDGE');
  assert.match(await page.locator('#call-ai-speech').textContent(), /Contato Beta/);
  holdKnowledge = true;
  await select('QA-CALL-A');
  await page.locator('#call-ai-prepare').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-prepare').disabled);
  await select('QA-CALL-B');
  await select('QA-CALL-A');
  await prepare();
  await heldKnowledge.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: [{ id: 'QA-OLD-A', title: 'QA_A_PRIOR_KNOWLEDGE', text: 'QA fixture only', status: 'confirmed', source: 'QA' }] }) });
  assert.ok(!(await page.locator('#tab-call-ai').textContent()).includes('QA_A_PRIOR_KNOWLEDGE'));
  assert.match(await page.locator('#call-ai-speech').textContent(), /Contato Alpha/);
  assert.ok(!(await page.locator('#call-ai-prepare').isDisabled()));
  await page.unroute('**/api/knowledge/search');
  log('7/13 Deferred preparation A→B/A→B→A preserves exact current script/source ownership');

  await select('QA-CALL-N');
  await prepare();
  await page.evaluate(() => {
    window.__qaMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('QA permission denied', 'NotAllowedError'); };
  });
  await page.locator('#call-ai-record-start').click();
  await page.waitForFunction(() => document.querySelector('#call-ai-recording-status').dataset.state === 'error');
  assert.ok(!(await page.locator('#call-ai-recording-result').isVisible()));
  assert.equal(await page.evaluate(() => __callQA.ci.filter(item => item.path.includes('/recordings/')).length), 0);
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.__qaMedia; });
  const startsBeforeLateCapture = await page.evaluate(() => __callQA.recorderStarts);
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = async options => {
      const stream = await window.__qaMedia(options);
      window.__qaCaptureStream = stream;
      return new Promise(resolveStream => { window.__qaCaptureResolve = () => resolveStream(stream); });
    };
  });
  await page.locator('#call-ai-record-start').evaluate(button => { button.click(); button.click(); });
  await page.waitForFunction(() => Boolean(window.__qaCaptureResolve));
  await select('QA-CALL-B');
  await select('QA-CALL-N');
  await page.evaluate(() => { window.__qaCaptureResolve(); navigator.mediaDevices.getUserMedia = window.__qaMedia; });
  await page.waitForFunction(() => window.__qaCaptureStream.getTracks().every(track => track.readyState === 'ended'));
  assert.equal(await page.evaluate(() => __callQA.recorderStarts), startsBeforeLateCapture, 'Late permission cannot create a recorder for a new generation of the same account');
  assert.equal(await page.locator('#call-ai-recording-status').getAttribute('data-state'), 'idle');
  assert.ok(!(await page.locator('#call-ai-record-start').isDisabled()));
  assert.ok(!(await page.locator('#call-ai-recording-result').isVisible()));
  await record();
  assert.equal(await page.evaluate(() => __callQA.ci.filter(item => item.path.includes('/recordings/')).length), 0, 'Recording stays local until upload click');
  await upload();
  const init = await page.evaluate(() => __callQA.ci.find(item => item.path.endsWith('/init')).body);
  assert.equal(init.companyId, refs.companyId);
  const complete = await page.evaluate(() => __callQA.ci.find(item => item.path.endsWith('/complete')).body);
  assert.equal(complete.callSessionId, init.callSessionId);
  assert.ok(complete.sizeBytes > 0);
  assert.ok(!(await page.locator('#call-ai-transcript-panel').isVisible()), 'Unavailable provider must not invent a transcript');
  assert.equal(await page.locator('#call-ai-intelligence-status').getAttribute('data-state'), 'error');
  assert.match(await page.locator('#call-ai-intelligence-status').textContent(), /transcrição indisponível|não configurad/i);
  await manualText(transcript);
  await plan('ci', { hold: 'late-manual' });
  await page.locator('#call-ai-manual-transcript-save').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['late-manual']));
  await select('QA-CALL-B');
  await resolve('late-manual', { recording: { id: 'QA-RECORDING', call_session_id: init.callSessionId, transcription_status: 'READY' }, transcript: { provider: 'manual', transcript_text: 'QA_N_LATE_TRANSCRIPT' }, metrics: { word_count: 77 } });
  await checkIsolation('QA_N_LATE_TRANSCRIPT');
  assert.ok(!(await page.locator('#call-ai-transcript-panel').isVisible()));
  await select('QA-CALL-N');
  await record();
  await upload();
  const currentManualSession = await page.evaluate(() => __callQA.ci.filter(item => item.path.endsWith('/init')).at(-1).body.callSessionId);
  const literalTranscript = 'QA transcript literal: 12 caminhões; preço e garantia ainda NÃO confirmados.';
  const beforeManual = await stored();
  await plan('ci', { body: { recording: { id: 'QA-RECORDING', call_session_id: currentManualSession, transcription_status: 'READY' }, transcript: { provider: 'manual', transcript_text: literalTranscript }, metrics: { word_count: 12 } } });
  await manualText(literalTranscript);
  await page.locator('#call-ai-manual-transcript-save').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-transcript-panel').classList.contains('hidden'));
  assert.equal(await page.locator('#call-ai-transcript-text').textContent(), literalTranscript);
  assert.match(await page.locator('#call-ai-transcript-source').textContent(), /manual|revisável/i);
  const providerCount = await page.evaluate(() => __callQA.ai.length + __callQA.ci.length);
  await page.locator('#call-ai-transcript-review').click();
  assert.equal(await page.locator('#call-ai-live-input').inputValue(), literalTranscript, 'Transcript review transfers literal words, not inferred facts');
  assert.equal(await page.locator('#call-ai-notes').inputValue(), literalTranscript);
  await page.locator('#call-ai-review-open').click();
  assert.equal(await page.locator('#call-ai-summary').inputValue(), literalTranscript);
  await page.locator('#call-ai-review-close').click();
  assert.deepEqual(await stored(), beforeManual, 'Transcription and opening review must not mutate CRM');
  assert.equal(await page.evaluate(() => __callQA.ai.length + __callQA.ci.length), providerCount, 'Transcript review must not call an orientation provider');
  await select('QA-CALL-B');
  log('8/13 Real synthetic capture, late permission A→B→A released, local playback/private upload, literal transcript review/late manual isolation');

  await select('QA-CALL-N');
  await record();
  await plan('ci', { hold: 'late-upload-init' });
  await page.locator('#call-ai-recording-save').click();
  await page.waitForFunction(() => Boolean(__callQA.pending['late-upload-init']));
  const oldInit = await page.evaluate(() => __callQA.ci.at(-1).body);
  const ciCount = await page.evaluate(() => __callQA.ci.length);
  await select('QA-CALL-B');
  await resolve('late-upload-init', { signedUploadUrl: base + '/qa-signed-audio', recording: { id: 'QA_OLD_UPLOAD', call_session_id: oldInit.callSessionId } });
  await checkIsolation('QA_OLD_UPLOAD');
  assert.equal(await page.evaluate(() => __callQA.ci.length), ciCount, 'Stale upload must not complete using the new session');
  assert.ok(!(await page.locator('#call-ai-recording-result').isVisible()));
  log('9/13 Deferred upload init does not send/tag/render a new-account recording');

  await select('QA-CALL-N');
  await record();
  await plan('ci:complete', { merge: true, body: { transcriptionQueued: true, recording: { transcription_status: 'PROCESSING' } } });
  await plan('ci:status', { hold: 'late-status' });
  await upload();
  await page.waitForFunction(() => Boolean(__callQA.pending['late-status']));
  const statusPath = await page.evaluate(() => __callQA.ci.at(-1).path);
  const statusSession = decodeURIComponent(statusPath.split('/recordings/')[1].split('/')[0]);
  await select('QA-CALL-B');
  await resolve('late-status', { recording: { id: 'QA-LATE-STATUS', call_session_id: statusSession, transcription_status: 'FAILED', transcription_provider: 'openai' }, localFallbackReady: true, transcript: { transcript_text: 'QA_N_LATE_STATUS' } });
  await checkIsolation('QA_N_LATE_STATUS');
  assert.equal(await page.evaluate(() => __callQA.ci.filter(item => item.path.endsWith('/local-transcribe')).length), 0, 'Stale polling failure cannot start Whisper for B');
  await select('QA-CALL-N');
  await record();
  await plan('ci:complete', { merge: true, body: { transcriptionQueued: true, recording: { transcription_status: 'PROCESSING' } } });
  await plan('ci:status', { merge: true, body: { localFallbackReady: true, recording: { transcription_status: 'FAILED', transcription_provider: 'openai' } } });
  await plan('ci:local-transcribe', { hold: 'late-whisper' });
  await upload();
  await page.waitForFunction(() => Boolean(__callQA.pending['late-whisper']));
  const whisperRequest = await page.evaluate(() => __callQA.ci.at(-1).body);
  assert.ok(whisperRequest.callSessionId);
  await select('QA-CALL-B');
  await resolve('late-whisper', { recording: { id: 'QA-WHISPER', call_session_id: whisperRequest.callSessionId, transcription_status: 'READY', transcription_provider: 'faster-whisper' }, transcript: { provider: 'faster-whisper', transcript_text: 'QA_N_LATE_WHISPER' } });
  await checkIsolation('QA_N_LATE_WHISPER');
  assert.equal(await page.evaluate(() => __callQA.ci.filter(item => item.path.endsWith('/local-transcribe')).length), 1, 'Fallback contract is bounded and stays on the original session');
  log('10/13 Deferred polling/local Whisper contracts preserve session; no stale transcript/fallback');

  await page.evaluate(() => { OG_AI_SERVICE.clearCache(); OG_AI_SERVICE.configure({}); });
  const beforeLocalGuidance = await currentLead('QA-CALL-B');
  const externalCallsBeforeLocal = await page.evaluate(() => __callQA.ai.length);
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-generate').disabled);
  assert.equal(await page.locator('#call-ai-central-state').getAttribute('data-state'), 'local');
  assert.match(await page.locator('#call-ai-central-state').textContent(), /nenhum provedor|orientação local/i);
  assert.match(await page.locator('#call-ai-cost-hint').textContent(), /local.*zero.*externa/i);
  assert.equal(await page.evaluate(() => __callQA.ai.length), externalCallsBeforeLocal);
  assert.deepEqual(await currentLead('QA-CALL-B'), beforeLocalGuidance);
  await context.setOffline(true);
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
  const beforeOffline = await currentLead('QA-CALL-B');
  await page.locator('#call-ai-live-input').fill('QA offline manual guidance');
  await page.locator('#call-ai-generate').click();
  await page.waitForFunction(() => !document.querySelector('#call-ai-generate').disabled);
  assert.match(await page.locator('#call-ai-central-state').textContent(), /local|indisponível|sem.*IA/i);
  assert.notEqual(await page.locator('#call-ai-central-state').getAttribute('data-state'), 'success');
  assert.ok(!(await page.locator('#call-ai-transcript-panel').isVisible()));
  assert.deepEqual(await currentLead('QA-CALL-B'), beforeOffline);
  await review({ summary: 'QA manual offline reviewed result', nextAction: 'QA durable offline follow-up' });
  const queueBefore = await page.evaluate(() => __callQA.queueCompleted);
  await saveReview();
  await page.waitForFunction(count => __callQA.queueCompleted >= count + 2, queueBefore);
  assert.ok(failedPuts > 0, 'Scheduled offline PUT must genuinely fail with blocked SW');
  assert.ok(await queued());
  await context.setOffline(false);
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  assert.equal(await queued(), null);
  assert.equal((await remote()).leads.find(item => item.id === 'QA-CALL-B').nextAction, 'QA durable offline follow-up');
  log('11/13 Offline guidance truthful; durable local result + genuine reconnect ACK/outbox clearance');

  await select('QA-CALL-A');
  await review({ summary: 'QA 503 reviewed draft', nextAction: 'QA 503 retained follow-up' });
  unavailable = true;
  const putsBefore = puts;
  await saveReview();
  await page.waitForFunction(async () => Boolean(await OG_SYNC_BRIDGE.readQueuedState()));
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode !== 'ok');
  await page.waitForTimeout(800);
  assert.ok(puts - putsBefore <= 2, '503 must not create a transport retry loop');
  unavailable = false;
  await context.setOffline(true);
  await context.setOffline(false);
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  assert.equal(await queued(), null);
  await page.evaluate(async () => {
    const state = await (await fetch('/api/state')).json();
    state.leads.find(item => item.id === 'QA-CALL-A').nextAction = 'QA concurrent other-device follow-up';
    const response = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) });
    if (!response.ok) throw new Error('Cannot establish isolated concurrent revision');
  });
  await select('QA-CALL-B');
  await select('QA-CALL-A');
  await review({ summary: 'QA conflict reviewed draft', nextAction: 'QA conflict local follow-up' });
  await saveReview();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.equal((await remote()).leads.find(item => item.id === 'QA-CALL-A').nextAction, 'QA concurrent other-device follow-up');
  await page.reload();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-conflict-banner')));
  assert.equal((await currentLead('QA-CALL-A')).nextAction, 'QA conflict local follow-up');
  const beforeReviewPuts = puts;
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-sync-review]').click();
  await page.waitForFunction(() => Boolean(document.querySelector('#og-sync-review-banner')));
  assert.equal(puts, beforeReviewPuts, 'Preparing conflict review must not publish');
  page.once('dialog', dialog => dialog.accept());
  await page.locator('[data-send-review]').click();
  await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  assert.equal(await queued(), null);
  assert.equal(await page.evaluate(() => OG_SYNC_BRIDGE.loadConflict()), null);
  assert.equal((await remote()).leads.find(item => item.id === 'QA-CALL-A').nextAction, 'QA conflict local follow-up', 'Explicit reviewed resolution must publish the chosen local result');
  log('12/13 HTTP503 honest pending/no loop; actual409 survives refresh and requires review/send');

  await installClients();
  await navigate('dia');
  await page.locator('[data-desk-select="QA-CALL-A"]').click();
  const beforeWA = await currentLead('QA-CALL-A');
  const openedBefore = await page.evaluate(() => __qaOpened.length);
  await page.locator('[data-client-whatsapp]').click();
  const afterWA = await currentLead('QA-CALL-A');
  assert.equal(await page.evaluate(() => __qaOpened.length), openedBefore + 1, 'WhatsApp action must actually open the selected account URL');
  assert.match(await page.evaluate(() => __qaOpened.at(-1)), /wa\.me\/5544999990001|api\.whatsapp\.com.*5544999990001/);
  assert.equal(afterWA.status, beforeWA.status);
  assert.equal(afterWA.lastContactAt, beforeWA.lastContactAt);
  assert.equal(afterWA.interactions.filter(item => item.type === 'resultado_contato').length, beforeWA.interactions.filter(item => item.type === 'resultado_contato').length);
  assert.equal(afterWA.interactions.filter(item => /sent|enviad/i.test(item.type)).length, beforeWA.interactions.filter(item => /sent|enviad/i.test(item.type)).length);
  await select('QA-CALL-E');
  await prepare();
  await importText(transcript.repeat(10));
  await review({ summary: transcript.repeat(8), nextAction: 'QA long reviewed action '.repeat(8) });
  for (const [width, height] of [[320, 568], [360, 800], [390, 844], [430, 932], [768, 1024], [1280, 720], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width, height });
    assert.ok(await page.locator('#call-ai-review').isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, `${width}: CallAI horizontal overflow`);
    const targets = await page.locator('#call-ai-review button,#call-ai-review select,#call-ai-review input,#call-ai-review-open,#call-ai-text-use').evaluateAll(nodes => nodes.filter(node => node.getBoundingClientRect().height > 0).map(node => node.getBoundingClientRect().height));
    assert.ok(targets.every(value => value >= 44), `${width}: primary CallAI targets >=44px`);
    await page.locator('#call-ai-summary').focus();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'call-ai-summary');
    await page.locator('#call-ai-save').scrollIntoViewIfNeeded();
    const save = await page.locator('#call-ai-save').boundingBox();
    assert.ok(save.width > 0 && save.x >= 0 && save.x + save.width <= width, `${width}: approval button usable`);
    if (artifacts) await page.screenshot({ path: path.join(artifacts, `${width}x${height}-call-review.png`), fullPage: true });
    await page.locator('#call-ai-review-close').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, `${width}: CallAI workspace overflow`);
    if (artifacts) await page.screenshot({ path: path.join(artifacts, `${width}x${height}-call-workspace.png`), fullPage: true });
    await review({ summary: transcript.repeat(8), nextAction: 'QA long reviewed action '.repeat(8) });
  }
  await page.locator('#call-ai-save').focus();
  assert.equal(await page.evaluate(() => document.activeElement.id), 'call-ai-save');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#call-ai-review').classList.contains('hidden'));
  const keyboardApproved = await currentLead('QA-CALL-E');
  assert.equal(keyboardApproved.interactions.filter(item => item.type === 'call_ai').length, 1);
  assert.equal(keyboardApproved.interactions.find(item => item.type === 'call_ai').note, transcript.repeat(8));
  assert.equal(keyboardApproved.nextAction, 'QA long reviewed action '.repeat(8).trim());
  log('13/13 WhatsApp opened≠sent; eight viewports, long/incomplete context and keyboard approval');
  assert.deepEqual(errors, [], 'No uncaught browser errors');
} finally {
  await context?.close();
  await browser?.close();
  server.kill('SIGTERM');
  await new Promise(resolveExit => { if (server.exitCode !== null) resolveExit(); else server.once('exit', resolveExit); });
  await rm(dataDir, { recursive: true, force: true });
}
