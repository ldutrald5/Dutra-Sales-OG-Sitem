/* Optional developer browser gate: requires an installed Playwright + Chromium.
 * No product/browser dependency, real CRM data or hosted runtime is used. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const { chromium } = createRequire(import.meta.url)('playwright');
const artifacts = process.env.OG_SHELL_ARTIFACTS;
if (artifacts) await mkdir(artifacts, { recursive: true });
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-shell-'));
const port = await new Promise(resolve => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1', () => { const value = socket.address().port; socket.close(() => resolve(value)); });
});
const server = spawn(process.execPath, ['apps/sistema-og/server.mjs'], {
  cwd: new URL('../', import.meta.url), env: { ...process.env, OG_PORT: String(port), OG_HOST: '127.0.0.1', OG_DATA_DIR: dataDir }, stdio: 'pipe'
});
const base = `http://127.0.0.1:${port}`;
let browser;
const results = [];
try {
  await new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error('Isolated local server did not start')), 15000);
    server.stdout.on('data', chunk => { if (String(chunk).includes('Sistema OG no computador')) { clearTimeout(deadline); resolve(); } });
    server.once('error', reject);
  });
  browser = await chromium.launch({ executablePath: process.env.OG_CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const viewports = [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]];
  for (const [width,height] of viewports) {
    const context = await browser.newContext({ viewport: { width,height }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
    assert.equal(await page.locator('.og-mobile-nav').count(), 1);
    assert.equal(await page.locator('#og-sync-status').count(), 1);
    const desktop = width >= 1024;
    assert.equal(await page.locator('#nav-tabs-container').isVisible(), desktop);
    assert.equal(await page.locator('.og-mobile-nav').isVisible(), !desktop);
    const workspace = await page.locator('#dutra-workspace').boundingBox();
    if (desktop) assert.ok(workspace.width > width * .7, 'Desktop workspace must use available screen');
    const navigate = async tab => {
      if (desktop) await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
      else {
        const button = page.locator(`.og-mobile-nav [data-mobile-tab="${tab}"]`);
        if (!(await button.isVisible())) await page.locator('[data-mobile-more]').click();
        await button.click();
      }
      await page.waitForURL(`**/#${tab}`);
      assert.ok(await page.locator(`#tab-${tab}`).isVisible());
      assert.equal(await page.locator('.tab-content:visible').count(), 1, 'Only one canonical workspace is visible');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${width} ${tab}: horizontal overflow ${overflow}`);
    };
    for (const tab of ['dia','crm','prospeccao','cotacao','guia','call-ai','comunicacao','catalogo','transportadoras','scripts','biblioteca','operacoes','historico']) await navigate(tab);
    await navigate('crm'); await navigate('guia'); await page.goBack();
    await page.waitForURL('**/#crm');
    await page.reload(); await page.waitForFunction(() => document.body.dataset.shellReady === 'true');
    assert.ok(await page.locator('#tab-crm').isVisible(), 'Refresh restores canonical route before remote sync');
    if (!desktop) {
      await page.locator('[data-mobile-more]').click();
      assert.equal(await page.locator('[data-mobile-more]').getAttribute('aria-expanded'), 'true');
      const drawer = await page.locator('.og-mobile-more-sheet').boundingBox();
      assert.ok(drawer.x >= 0 && drawer.x + drawer.width <= width && drawer.y >= 0 && drawer.y + drawer.height <= height);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-mobile-more]').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.evaluate(() => document.activeElement.hasAttribute('data-mobile-more')), true);
    } else {
      await page.locator('.nav-tab[data-tab="dia"]').focus();
      await page.keyboard.press('Enter'); await page.waitForURL('**/#dia');
    }
    await context.setOffline(true);
    await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
    await context.setOffline(false);
    await page.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
    await navigate('dia');
    // Existing quick-lead modal: no save, no real customer data, controller unchanged.
    await page.locator('#tab-dia [data-quick-lead="dia"]:visible').first().click();
    const modal = page.locator('#modal-quick-lead');
    assert.ok(await modal.isVisible(), 'Existing quick-lead dialog must open');
    {
      const box = await modal.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width && box.y >= 0 && box.y + box.height <= height);
      await page.keyboard.press('Escape');
      assert.ok(!(await modal.isVisible()));
    }
    const targets = await page.locator(desktop ? '#nav-tabs-container button' : '.og-mobile-nav > button').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().height));
    assert.ok(targets.every(height => height >= 44));
    assert.deepEqual(errors, [], `Uncaught errors at ${width}`);
    if (artifacts) await page.screenshot({path: path.join(artifacts, `${width}x${height}.png`)});
    results.push(`${width}x${height}: navigation/history/refresh/drawer/offline/reconnect/targets PASS`);
    console.log(results.at(-1));
    await context.close();
  }
  // Reproduce the black-screen risk: hold ALL domain scripts, retain static shell.
  const startupContext = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const startupPage = await startupContext.newPage();
  await startupPage.route('**/*.js', route => {
    const url = route.request().url();
    return /app-shell\.js|vendor\/tailwindcss\.js/.test(url) ? route.continue() : route.abort();
  });
  await startupPage.goto(base);
  assert.ok(await startupPage.locator('.brand-header').isVisible());
  assert.ok(await startupPage.locator('.og-mobile-nav').isVisible());
  assert.ok(await startupPage.locator('#shell-startup').isVisible());
  await startupPage.waitForFunction(() => document.querySelector('#shell-startup').dataset.state === 'error', null, {timeout:16000});
  assert.ok(await startupPage.getByRole('button',{name:'Tentar novamente',exact:true}).isVisible());
  results.push('First paint with domain scripts unavailable + localized startup recovery: PASS');
  await startupContext.close();
  // A real renderer failure stays local; next canonical route and retry remain usable.
  const failureContext = await browser.newContext({serviceWorkers:'block'});
  const failurePage = await failureContext.newPage();
  await failurePage.goto(base);
  await failurePage.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await failurePage.evaluate(() => {
    const grid = document.getElementById('catalog-grid');
    Object.defineProperty(grid, 'innerHTML', {configurable:true, set() {throw new Error('QA injected renderer failure');}});
  });
  await failurePage.locator('.nav-tab[data-tab="catalogo"]').click();
  await failurePage.waitForURL('**/#catalogo');
  assert.ok(await failurePage.locator('#shell-error-catalogo').isVisible());
  await failurePage.locator('.nav-tab[data-tab="crm"]').click();
  assert.ok(await failurePage.locator('#tab-crm').isVisible());
  await failurePage.evaluate(() => { delete document.getElementById('catalog-grid').innerHTML; });
  await failurePage.locator('.nav-tab[data-tab="catalogo"]').click();
  assert.ok(!(await failurePage.locator('#shell-error-catalogo').count()));
  results.push('Renderer exception: localized error + usable CRM navigation + recovery PASS');
  await failureContext.close();
  const pwaContext = await browser.newContext({viewport:{width:390,height:844}});
  const pwaPage = await pwaContext.newPage();
  await pwaPage.goto(base);
  await pwaPage.waitForFunction(() => document.body.dataset.shellReady === 'true');
  await pwaPage.evaluate(() => navigator.serviceWorker.ready);
  await pwaPage.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await pwaContext.setOffline(true);
  await pwaPage.reload();
  await pwaPage.waitForFunction(() => document.body.dataset.shellReady === 'true');
  assert.ok(await pwaPage.locator('.brand-header').isVisible());
  assert.ok(await pwaPage.locator('.og-mobile-nav').isVisible());
  assert.ok(await pwaPage.locator('#mission-control .mission-now').isVisible(), 'Meu Dia projection must render from precached owners offline');
  await pwaPage.locator('[data-mobile-tab="crm"]').click();
  assert.ok(await pwaPage.locator('#tab-crm').isVisible());
  await pwaPage.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'offline');
  await pwaContext.setOffline(false);
  // Chromium/Playwright does not emit online after this SW offline navigation.
  // Prove transport is actually restored, then exercise the real event contract.
  // The app must still obtain its own real /api/state acknowledgement; no status is mocked.
  assert.equal(await pwaPage.evaluate(async () => (await fetch('/api/state')).status), 200);
  assert.equal(await pwaPage.evaluate(() => navigator.onLine), true);
  await pwaPage.evaluate(() => window.dispatchEvent(new Event('online')));
  await pwaPage.waitForFunction(() => document.querySelector('#og-sync-status').dataset.mode === 'ok');
  results.push('PWA installed cache: offline reload + CRM + explicit online event / real API acknowledgement PASS');
  await pwaContext.close();
  console.log(results.join('\n'));
  if (artifacts) await writeFile(path.join(artifacts,'results.txt'), results.join('\n')+'\n');
} finally {
  await browser?.close(); server.kill(); await rm(dataDir,{recursive:true,force:true});
}
