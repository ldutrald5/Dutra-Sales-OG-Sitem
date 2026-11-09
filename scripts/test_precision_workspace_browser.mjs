/* Precision Workspace: real local browser, fictional identities, isolated storage. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const {chromium} = createRequire(import.meta.url)('playwright');
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-precision-'));
const artifacts = process.env.OG_PRECISION_ARTIFACTS;
if (artifacts) await mkdir(artifacts, {recursive:true});
const port = await new Promise(resolve => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1', () => {
    const available = socket.address().port;
    socket.close(() => resolve(available));
  });
});
const base = `http://127.0.0.1:${port}`;
// Never inherit hosting/provider configuration or use the application's real .data.
const env = Object.fromEntries(['PATH', 'HOME', 'USER', 'LANG', 'LC_ALL', 'TMPDIR', 'NODE_PATH']
  .filter(key => process.env[key]).map(key => [key, process.env[key]]));
Object.assign(env, {OG_PORT:String(port), OG_HOST:'127.0.0.1', OG_DATA_DIR:dataDir, OG_ISOLATED_PREVIEW:'true'});
const server = spawn(process.execPath, ['apps/sistema-og/server.mjs'], {
  cwd:new URL('../', import.meta.url), env, stdio:['ignore', 'pipe', 'pipe']
});
let browser;
let page;
let serverError;
let serverOutput = '';
server.on('error', error => { serverError = error; });
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { serverOutput = (serverOutput + chunk).slice(-6000); });

const dateAt = delta => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10) + 'T10:00';
};
const leads = [
  {id:'PRECISION-A', internalCode:'FICTICIO-A', empresa:'Frota FICTICIA Homonima', nome:'Contato FICTICIO A', telefone:'44999990001', cidadeUf:'Cidade FICTICIA A / PR', sourceChannel:'sistema_og', sourceLabel:'QA synthetic fixture', status:'contatado', priority:'alta', priorityBand:'urgente', conversationStage:'negotiation', nextAction:'Confirmar diagnóstico FICTICIO A', nextActionReason:'Retorno FICTICIO combinado', followUpAt:dateAt(-1), interactions:[]},
  {id:'PRECISION-B', internalCode:'FICTICIO-B', empresa:'Frota FICTICIA Homonima', nome:'Contato FICTICIO B', telefone:'44999990002', cidadeUf:'Cidade FICTICIA B / SP', sourceChannel:'sistema_og', sourceLabel:'QA synthetic fixture', status:'contatado', priority:'alta', priorityBand:'urgente', conversationStage:'negotiation', nextAction:'Revisar proposta FICTICIA B', followUpAt:dateAt(0), interactions:[]},
  {id:'PRECISION-C', empresa:'Contexto FICTICIO incompleto', nome:'', telefone:'', sourceChannel:'sistema_og', sourceLabel:'QA synthetic fixture', status:'novo', priority:'baixa', nextAction:'', followUpAt:'', interactions:[]},
  {id:'PRECISION-TERMINAL', empresa:'Terminal FICTICIO', status:'perdido', priority:'alta', nextAction:'Não executar ação antiga', followUpAt:dateAt(-2), interactions:[]}
];
const operations = {
  tasks:[{id:'PRECISION-TASK', title:'Confirmar placa FICTICIA', status:'open', clientId:'PRECISION-A'}],
  activityEvents:[{id:'PRECISION-PREPARED', type:'proposal.prepared', at:new Date().toISOString(), clientId:'PRECISION-B', proposalId:'PRECISION-DRAFT'}]
};
const viewports = [[320,568], [360,800], [390,844], [430,932], [768,1024], [1280,720], [1440,900], [1920,1080]];
const report = {classification:'LOCAL_CHROMIUM_SYNTHETIC_ISOLATED', viewports:[], checks:[], pageErrors:[], externalRequests:[], externalLaunches:[]};
report.coverageLimits = ['Automated Chromium CSS viewport reflow; physical devices, native browser zoom and assistive technology were not manually tested.'];
const screenshot = async name => {
  if (artifacts) await page.screenshot({path:path.join(artifacts, name + '.png'), animations:'disabled'});
};
const record = (name, details = {}) => {
  report.checks.push({name, status:'PASS', ...details});
  console.log(name + ' PASS');
};
const writeReport = async () => {
  if (artifacts) await writeFile(path.join(artifacts, 'result.json'), JSON.stringify(report, null, 2) + '\n');
};
const nav = async tab => {
  await page.evaluate(tab => { location.hash = tab; }, tab);
  await page.waitForFunction(tab => !document.querySelector('#tab-' + tab)?.classList.contains('hidden'), tab);
};
const showQueue = async () => {
  if (page.viewportSize().width < 768) {
    await page.locator('button[data-desk-view="queue"]').click();
    await page.waitForFunction(() => document.querySelector('#tab-dia').dataset.deskView === 'queue');
  }
};
const showFocus = async () => {
  if (page.viewportSize().width < 768) {
    await page.locator('button[data-desk-view="focus"]').click();
    await page.waitForFunction(() => document.querySelector('#tab-dia').dataset.deskView === 'focus');
  }
};
const select = async id => {
  await showQueue();
  await page.locator(`[data-desk-select="${id}"]`).click();
  await page.waitForFunction(id => document.querySelector('#sales-desk-client')?.dataset.clientId === id, id);
  if (page.viewportSize().width < 768) {
    assert.equal(await page.locator('#tab-dia').getAttribute('data-desk-view'), 'focus', 'selecting a mobile row reveals its account');
  }
};
const overflow = async label => {
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(extra <= 1, `${label}: page overflow ${extra}px`);
};
const readableType = async width => {
  const typography = await page.locator('#tab-dia').evaluate(root => {
    const visible = element => {
      const style = getComputedStyle(element);
      if (!element.checkVisibility() || !element.getClientRects().length || style.visibility === 'hidden' || style.display === 'none') return false;
      // Chromium can retain boxes for content skipped by a closed details. Check
      // every ancestor, because an inner summary can itself be inside closed support.
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor.tagName !== 'DETAILS' || ancestor.open) continue;
        const summary = [...ancestor.children].find(child => child.tagName === 'SUMMARY');
        if (!summary?.contains(element)) return false;
      }
      return true;
    };
    const text = [...root.querySelectorAll('*')].filter(element => visible(element) && !element.closest('[aria-hidden="true"]') &&
      [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()) &&
      parseFloat(getComputedStyle(element).fontSize) < 12).map(element => ({selector:element.id || element.className || element.tagName, text:element.textContent.trim().slice(0, 70), size:getComputedStyle(element).fontSize}));
    const fields = [...root.querySelectorAll('input,select,textarea')].filter(visible)
      .map(element => ({id:element.id, size:parseFloat(getComputedStyle(element).fontSize)}));
    return {text, fields};
  });
  assert.deepEqual(typography.text, [], `${width}: visible workspace text must be at least 12px`);
  if (width < 768) {
    assert.ok(typography.fields.every(field => field.size >= 16), `${width}: mobile inputs avoid text zoom: ${JSON.stringify(typography.fields)}`);
  }
};
const touchTargets = async width => {
  const sizes = await page.locator('#tab-dia button[data-desk-view],#tab-dia [data-client-register],#tab-dia [data-client-proposal],#tab-dia [data-client-crm],#tab-dia [data-client-call],#tab-dia [data-client-whatsapp],#tab-dia [data-desk-select],#tab-dia #desk-save-stay,#tab-dia #desk-save-advance')
    .evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).map(node => ({selector:node.id || node.getAttribute('data-desk-view') || node.className, height:node.getBoundingClientRect().height})));
  assert.ok(sizes.every(item => item.height >= 44), `${width}: recurring controls need 44px height: ${JSON.stringify(sizes.filter(item => item.height < 44))}`);
};
const contrast = async selectors => {
  const pairs = await page.evaluate(selectors => {
    const rgba = value => {
      const parts = value.match(/[\d.]+/g)?.map(Number);
      if (!parts || parts.length < 3) throw new Error('Unresolved computed color ' + value);
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    };
    const over = (front, back) => [0, 1, 2].map(i => front[i] * front[3] + back[i] * (1 - front[3])).concat(1);
    const luminance = color => color.slice(0, 3).map(value => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
    return selectors.flatMap(selector => [...document.querySelectorAll(selector)].filter(element => element.getClientRects().length && !element.disabled).map(element => {
      const ancestors = [];
      for (let current = element; current; current = current.parentElement) ancestors.unshift(current);
      let background = [255, 255, 255, 1];
      for (const ancestor of ancestors) background = over(rgba(getComputedStyle(ancestor).backgroundColor), background);
      const style = getComputedStyle(element);
      const foreground = over(rgba(style.color), background);
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
      return {selector, text:element.textContent.trim().slice(0, 60), color:style.color, background:background.slice(0, 3), ratio:(values[0] + 0.05) / (values[1] + 0.05), minimum:large ? 3 : 4.5};
    }));
  }, selectors);
  assert.ok(pairs.length > 0, 'contrast checks must inspect rendered elements');
  for (const pair of pairs) assert.ok(pair.ratio >= pair.minimum, `${pair.selector}: contrast ${pair.ratio.toFixed(2)} < ${pair.minimum}: ${JSON.stringify(pair)}`);
  return pairs.map(pair => ({selector:pair.selector, ratio:Number(pair.ratio.toFixed(2))}));
};
const color = locator => locator.evaluate(element => getComputedStyle(element).backgroundColor);

try {
  const until = Date.now() + 15000;
  while (true) {
    if (serverError) throw serverError;
    if (server.exitCode !== null) throw new Error('Isolated server exited: ' + serverOutput);
    try { if ((await fetch(base + '/health')).ok) break; } catch {}
    if (Date.now() > until) throw new Error('Isolated server startup timeout: ' + serverOutput);
    await new Promise(resolve => setTimeout(resolve, 75));
  }
  browser = await chromium.launch({executablePath:process.env.OG_CHROMIUM_PATH || '/usr/bin/chromium', headless:true, args:['--no-sandbox']});
  const context = await browser.newContext({viewport:{width:390, height:844}, serviceWorkers:'block'});
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === base || url.protocol === 'data:' || url.protocol === 'blob:') return route.continue();
    report.externalRequests.push(url.origin + url.pathname);
    return route.abort();
  });
  await context.exposeBinding('__precisionExternalLaunch', (_, url) => { report.externalLaunches.push(String(url)); });
  await context.addInitScript(({leads, operations}) => {
    if (!localStorage.getItem('og_leads_crm')) {
      localStorage.setItem('og_leads_crm', JSON.stringify(leads));
      localStorage.setItem('og_operations_state', JSON.stringify(operations));
    }
    window.open = url => { window.__precisionExternalLaunch(String(url)); return null; };
  }, {leads, operations});
  page = await context.newPage();
  page.on('pageerror', error => { report.pageErrors.push(error.message); });
  await page.goto(base + '/#dia');
  await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await page.waitForFunction(() => document.querySelector('#og-sync-status')?.dataset.mode === 'ok');
  assert.ok(await page.locator('#tab-dia').evaluate(element => element.classList.contains('precision-workspace')));
  assert.equal(await page.locator('#tab-dia').getAttribute('data-desk-view'), 'focus');
  assert.equal(await page.locator('#day-opportunity-list [data-desk-lead]').count(), 3);
  assert.equal(await page.locator('[data-desk-lead="PRECISION-TERMINAL"]').count(), 0);
  assert.equal(await page.locator('#sales-desk-client').getAttribute('data-client-id'), 'PRECISION-A');
  record('Canonical queue, terminal exclusion and initial mobile focus');

  await showQueue();
  assert.ok(await page.locator('#sales-desk-search').isVisible());
  assert.equal(await page.locator('#sales-desk-client').isVisible(), false);
  await page.locator('#sales-desk-search').fill('Homonima');
  await page.waitForFunction(() => document.querySelectorAll('#day-opportunity-list [data-desk-lead]').length === 2);
  await select('PRECISION-B');
  assert.match(await page.locator('.sales-desk-code').textContent(), /FICTICIO-B/);
  assert.match(await page.locator('.sales-desk-client-head').textContent(), /Contato FICTICIO B/);
  assert.equal(await page.locator('[data-desk-select="PRECISION-B"]').getAttribute('aria-current'), 'true');
  const sheetTrigger = page.locator('[data-client-crm]');
  await sheetTrigger.focus();
  await page.keyboard.press('Enter');
  await page.locator('#client-sheet-overlay').waitFor({state:'visible'});
  assert.match(await page.locator('#client-sheet-title').textContent(), /Frota FICTICIA Homonima/);
  assert.match(await page.locator('.client-sheet-code').textContent(), /FICTICIO-B/);
  await page.waitForFunction(() => document.querySelector('#client-sheet-overlay')?.contains(document.activeElement));
  await page.keyboard.press('Escape');
  await page.locator('#client-sheet-overlay').waitFor({state:'hidden'});
  await page.waitForFunction(() => document.activeElement?.hasAttribute('data-client-crm'));
  assert.equal(await page.locator('#sales-desk-search').inputValue(), 'Homonima');
  assert.equal(await page.locator('#sales-desk-client').getAttribute('data-client-id'), 'PRECISION-B');
  record('Mobile queue → exact homonym B → sheet → Escape preserves query, identity and focus');

  await page.locator('[data-client-proposal]').click();
  const quoteEntry = await Promise.race([
    page.waitForURL('**/#cotacao').then(() => 'quote'),
    page.locator('#quote-client-transition').waitFor({state:'visible'}).then(() => 'review')
  ]);
  if (quoteEntry === 'review') await page.locator('[data-quote-transition="clean"]').click();
  await page.waitForURL('**/#cotacao');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('og_operations_state') || '{}').quotes?.some(quote => quote.source === 'quote_workspace' && quote.clientId === 'PRECISION-B'));
  const draft = await page.evaluate(() => JSON.parse(localStorage.getItem('og_operations_state')).quotes
    .filter(quote => quote.source === 'quote_workspace' && quote.status === 'composition_draft')
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]);
  assert.equal(draft.clientId, 'PRECISION-B');
  assert.equal(draft.payload.client.clientId, 'PRECISION-B');
  assert.equal(draft.payload.client.internalCode, 'FICTICIO-B');
  assert.ok(!JSON.stringify(draft.payload).includes('FICTICIO-A'));
  await nav('dia');
  assert.equal(await page.locator('#sales-desk-search').inputValue(), 'Homonima');
  assert.equal(await page.locator('#sales-desk-client').getAttribute('data-client-id'), 'PRECISION-B');
  await showQueue();
  await page.locator('#sales-desk-search').fill('');
  await page.waitForFunction(() => document.querySelectorAll('#day-opportunity-list [data-desk-lead]').length === 3);
  await select('PRECISION-A');
  assert.match(await page.locator('.sales-desk-code').textContent(), /FICTICIO-A/);
  record('Proposta direct action uses canonical B quote and returns to the same day context');

  const beforeSave = await page.evaluate(() => JSON.parse(localStorage.getItem('og_leads_crm')).map(lead => OG_CRM_SERVICE.normalizeLead(lead)));
  const closedPrimary = await color(page.locator('[data-client-register]'));
  assert.notEqual(closedPrimary, await color(page.locator('[data-client-proposal]')));
  await page.locator('[data-client-register]').click();
  await page.waitForFunction(() => document.activeElement?.id === 'desk-result');
  assert.equal(await page.locator('.sales-desk-register').evaluate(element => element.open), true);
  assert.ok(await page.locator('[data-client-register]').isVisible());
  assert.equal(await color(page.locator('[data-client-register]')), await color(page.locator('[data-client-proposal]')), 'open register remains a neutral action, including pointer hover');
  assert.notEqual(await color(page.locator('[data-client-register]')), await color(page.locator('#desk-save-advance')), 'open register promotes Save and next to the sole primary action');
  assert.equal(await color(page.locator('#desk-save-advance')), closedPrimary);
  await page.locator('#desk-result').selectOption('falar_depois');
  await page.locator('#desk-note').fill('Resultado FICTICIO exclusivamente para A');
  await page.locator('#desk-next-action').fill('Retorno FICTICIO A amanhã');
  await page.locator('#desk-follow-mode').selectOption('tomorrow');
  const saving = await page.locator('#desk-save-stay').evaluate(button => {
    button.click();
    const state = [...document.querySelectorAll('#desk-save-stay,#desk-save-advance')].map(item => item.disabled);
    button.click();
    return state;
  });
  assert.deepEqual(saving, [true, true], 'saving disables both submissions synchronously');
  await page.waitForFunction(() => !document.querySelector('.sales-desk-register')?.open);
  const afterSave = await page.evaluate(() => JSON.parse(localStorage.getItem('og_leads_crm')).map(lead => OG_CRM_SERVICE.normalizeLead(lead)));
  assert.equal(afterSave.find(lead => lead.id === 'PRECISION-A').interactions.filter(item => item.type === 'resultado_contato').length, 1);
  assert.equal(afterSave.find(lead => lead.id === 'PRECISION-A').nextAction, 'Retorno FICTICIO A amanhã');
  assert.deepEqual(afterSave.find(lead => lead.id === 'PRECISION-B'), beforeSave.find(lead => lead.id === 'PRECISION-B'), 'homonym B remains untouched by A save');
  assert.equal(await page.locator('#sales-desk-client').getAttribute('data-client-id'), 'PRECISION-A');
  record('Primary hierarchy, keyboard entry, real saving lock and one exact-identity outcome');

  for (const [width, height] of viewports) {
    await page.setViewportSize({width, height});
    await showFocus();
    const register = page.locator('.sales-desk-register');
    if (await register.evaluate(element => element.open)) await register.locator('summary').click();
    await page.evaluate(() => scrollTo(0, 0));
    await overflow(`${width} focus`);
    await readableType(width);
    await touchTargets(width);
    assert.equal(await page.locator('#nav-tabs-container').isVisible(), width >= 1024);
    assert.equal(await page.locator('.og-mobile-nav').isVisible(), width < 1024);
    const ratios = await contrast(['.sales-desk-client-head h2', '.sales-desk-client-head p', '.sales-desk-code', '.sales-desk-now strong', '.sales-desk-now-meta small', '[data-client-register]', '[data-client-proposal]']);
    await screenshot(`${width}x${height}-focus`);
    await showQueue();
    assert.ok(await page.locator('#sales-desk-search').isVisible());
    assert.ok(await page.locator('#day-opportunity-list').isVisible());
    await overflow(`${width} queue`);
    await readableType(width);
    await contrast(['#sales-desk-search', '.sales-desk-row.selected b', '.sales-desk-row.selected small', '.sales-desk-row.selected time', '.sales-desk-row.selected em', '.og-chip[data-day-filter].active']);
    await screenshot(`${width}x${height}-queue`);
    await showFocus();
    await page.locator('[data-client-register]').click();
    await page.waitForFunction(() => document.activeElement?.id === 'desk-result');
    await overflow(`${width} register`);
    await readableType(width);
    await touchTargets(width);
    await contrast(['#desk-save-advance', '#desk-save-stay', '.sales-desk-register summary', '.sales-desk-registration-route']);
    await screenshot(`${width}x${height}-register`);
    await register.locator('summary').click();
    report.viewports.push({width, height, status:'PASS', contrast:ratios});
    console.log(`${width}x${height}: focus/queue/register, typography, contrast, touch and overflow PASS`);
  }

  assert.ok(await page.evaluate(() => Boolean(document.querySelector('.sales-desk-layout').compareDocumentPosition(document.querySelector('.og-kpi-grid')) & Node.DOCUMENT_POSITION_FOLLOWING)), 'Mesa precedes KPI controls in DOM and keyboard order');
  await page.setViewportSize({width:390, height:844});
  await showQueue();
  await page.locator('[data-desk-skip]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('#tab-dia').dataset.deskView === 'focus' && document.activeElement?.id === 'sales-desk-client');
  assert.equal(new URL(page.url()).hash, '#dia', 'skip action preserves the application route');
  await showQueue();
  const missionSupport = page.locator('.mission-reference').filter({has:page.locator('#btn-hero-start')});
  if (!await missionSupport.evaluate(element => element.open)) await missionSupport.locator('summary').click();
  await page.locator('#btn-hero-start').click();
  await page.waitForFunction(() => document.querySelector('#tab-dia').dataset.deskView === 'focus');
  assert.ok(await page.locator('#sales-desk-client').isVisible());
  if (await missionSupport.evaluate(element => element.open)) await missionSupport.locator('summary').click();
  await showQueue();
  const signalSupport = page.locator('.sales-desk-side');
  if (!await signalSupport.evaluate(element => element.open)) await signalSupport.locator(':scope > summary').click();
  const signal = page.locator('[data-signal-lead]').first();
  assert.ok(await signal.isVisible(), 'synthetic fixture exposes a real canonical signal');
  const signalId = await signal.getAttribute('data-signal-lead');
  await signal.click();
  await page.waitForFunction(id => document.querySelector('#tab-dia').dataset.deskView === 'focus' && document.querySelector('#sales-desk-client').dataset.clientId === id, signalId);
  if (await signalSupport.evaluate(element => element.open)) await signalSupport.locator(':scope > summary').click();
  record('Mobile keyboard skip, next mission and canonical signal reveal focus; Mesa precedes KPI controls');

  // 720×450 CSS pixels is the available layout area of 1440×900 at 200% zoom.
  // This proves responsive reflow, without claiming native/device zoom coverage.
  await page.setViewportSize({width:720, height:450});
  await showFocus();
  await overflow('200% equivalent focus reflow');
  await readableType(720);
  await screenshot('720x450-reflow-200pct-equivalent-focus');
  await showQueue();
  await overflow('200% equivalent queue reflow');
  await readableType(720);
  await screenshot('720x450-reflow-200pct-equivalent-queue');
  await showFocus();
  record('720×450 CSS viewport reflow, equivalent layout area to 1440×900 at 200%');

  await page.setViewportSize({width:1440, height:900});
  await page.locator('#sales-desk-search').focus();
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    return {inside:document.querySelector('#tab-dia').contains(element), outline:style.outlineStyle, width:parseFloat(style.outlineWidth), shadow:style.boxShadow};
  });
  assert.ok(focus.inside, 'Tab stays within the workspace controls');
  assert.ok((focus.outline !== 'none' && focus.width >= 2) || focus.shadow !== 'none', 'keyboard focus has a visible indicator');
  await page.locator('[data-desk-select="PRECISION-B"]').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#sales-desk-client').getAttribute('data-client-id'), 'PRECISION-B');
  record('Keyboard Tab indicator and Enter select the canonical row');

  for (const selector of ['.sales-desk-side', '.sales-desk-history', '.mission-reference']) {
    for (const section of await page.locator(selector).all()) {
      await section.locator(':scope > summary').first().click();
      await readableType(1440);
      await overflow('expanded support');
      await section.locator(':scope > summary').first().click();
    }
  }
  record('Expanded supporting sections retain readable metadata and reflow');

  await page.emulateMedia({reducedMotion:'reduce'});
  const moving = await page.locator('#tab-dia,#tab-dia *').evaluateAll(nodes => nodes.filter(node => node.getClientRects().length).flatMap(node => {
    const style = getComputedStyle(node);
    const seconds = value => value.split(',').map(part => parseFloat(part) * (part.trim().endsWith('ms') ? 0.001 : 1));
    return [...seconds(style.animationDuration), ...seconds(style.transitionDuration)].some(value => value > 0.01) ? [{element:node.id || node.className, animation:style.animationDuration, transition:style.transitionDuration}] : [];
  }));
  assert.deepEqual(moving, [], 'reduced motion suppresses workspace animation and transitions');
  await screenshot('reduced-motion');
  await page.emulateMedia({forcedColors:'active', reducedMotion:'reduce'});
  assert.equal(await page.evaluate(() => matchMedia('(forced-colors: active)').matches), true);
  await overflow('forced colors');
  assert.ok(await page.locator('[data-client-register]').isVisible());
  await page.locator('[data-client-register]').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.activeElement?.id === 'desk-result');
  await screenshot('forced-colors');
  await page.emulateMedia({forcedColors:'none', reducedMotion:'no-preference'});
  record('Reduced motion and forced colors retain the outcome workflow');

  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.externalRequests, [], 'browser made no external network requests');
  assert.deepEqual(report.externalLaunches, [], 'QA performed no external launches');
  await writeReport();
  console.log('Precision Workspace browser: all checks PASS; synthetic storage removed on exit.');
} catch (error) {
  report.failure = error.message;
  await screenshot('failure').catch(() => {});
  await writeReport();
  throw error;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
  await rm(dataDir, {recursive:true, force:true});
}
