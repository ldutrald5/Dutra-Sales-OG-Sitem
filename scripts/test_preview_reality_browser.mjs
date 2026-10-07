// Synthetic end-to-end proof through existing CRM, review, outbox and technical contracts.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { applyHostedSeed } from './apply-hosted-seed.mjs';
const { chromium } = createRequire(import.meta.url)('playwright');
const fixture=JSON.parse(await readFile(new URL('./fixtures/isolated-preview-seed.json',import.meta.url),'utf8'));
const id='DEMO-DUTRA-CLIENT';
assert(fixture.leads.every(x=>x.id.startsWith('DEMO-')&&!x.telefone&&!x.cnpj&&!x.email));
let server, browser, dir;
let base=process.env.OG_REALITY_BASE_URL;
const token=process.env.OG_REALITY_TOKEN_FILE ? (await readFile(process.env.OG_REALITY_TOKEN_FILE,'utf8')).trim() : '';
try {
 if(!base){dir=await mkdtemp(path.join(os.tmpdir(),'dutra-preview-reality-'));applyHostedSeed({env:{OG_DATA_DIR:dir,OG_STATE_SEED_GZIP_B64:gzipSync(JSON.stringify(fixture)).toString('base64')}});
 const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
 base=`http://127.0.0.1:${port}`;
 server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,OG_DATA_DIR:dir,OG_PORT:String(port),OG_HOST:'127.0.0.1',OG_ISOLATED_PREVIEW:'true',OG_LOCAL_ACCESS_TOKEN:'',OG_LOCAL_ACCESS_PIN:'',OG_SALES_EXECUTION_EDGE_TOKEN:'',OG_CALL_INTELLIGENCE_EDGE_TOKEN:'',OG_SUPABASE_URL:''},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('Preview test server startup failed')),15000);server.stdout.on('data',x=>{if(String(x).includes('Sistema OG no computador')){clearTimeout(t);resolve();}});server.on('error',reject);});}
 const config=await fetch(base+'/runtime-config.js');assert.equal(config.status,200);assert.match(await config.text(),/"isolatedPreview":true/);assert.match(config.headers.get('cache-control'),/no-store/);
 const provider=await fetch(base+'/api/call-intelligence/health');assert.equal(provider.status,503,'Isolated preview cannot use remote providers');
 browser=await chromium.launch({executablePath:process.env.OG_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const [width,height] of [[390,844],[1440,900]]){
  const ctx=await browser.newContext({viewport:{width,height}});if(token)await ctx.addInitScript(token=>sessionStorage.setItem('og_cloud_access_token',token),token);
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{if(d.type()==='confirm')await d.accept();else await d.dismiss();});
  await page.goto(base+'/#dia');await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
  await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
  assert.match(await page.locator('#og-sync-status').textContent(),/Preview isolado · Dados temporários/);
  assert.equal(await page.evaluate(()=>window.open('https://wa.me/DEMO')),null,'Preview must not launch external communication');
  const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm'))||[]);
  assert((await stored()).some(x=>x.id===id));
  const navigate=async tab=>{if(width>=1024)await page.locator(`.nav-tab[data-tab="${tab}"]`).click();else{const b=page.locator(`.og-mobile-nav [data-mobile-tab="${tab}"]`);if(!await b.isVisible())await page.locator('[data-mobile-more]').click();await b.click();}await page.waitForURL(`**/#${tab}`);};
  // Open the exact canonical customer from Meu Dia, independent of queue ranking after a prior run.
  await page.locator(`#day-opportunity-list [data-desk-lead="${id}"]`).click();
  await page.locator('#sales-desk-client [data-client-crm]').click();
  assert.match(await page.locator('#client-sheet-overlay').textContent(),/Transportadora Demo DUTRA/);
  await page.locator('[data-sheet-call-ai]').click();await page.waitForURL('**/#call-ai');
  assert.match(await page.locator('#call-ai-copilot-account').textContent(),/Transportadora Demo DUTRA/);
  await page.locator('#call-ai-review-open').click();assert.equal(await page.locator('#call-ai-review').getAttribute('data-lead-id'),id);
  await page.locator('#call-ai-result').selectOption('retornar_depois');
  await page.locator('#call-ai-summary').fill('DEMO / TESTE / PREVIEW: conversa simulada, nenhuma ligação real.');
  const next='DEMO: confirmar diagnóstico fictício';
  await page.locator('#call-ai-next-action').fill(next);const follow='2026-10-08T10:00';await page.locator('#call-ai-follow-up').fill(follow);
  await page.locator('#call-ai-save').click();await page.waitForFunction(()=>document.querySelector('#call-ai-review').classList.contains('hidden'));
  const lead=(await stored()).find(x=>x.id===id);assert.equal(lead.nextAction,next);assert.equal(lead.followUpAt,follow);assert(lead.interactions.some(x=>x.type==='call_ai'&&x.reviewed&&x.note.includes('DEMO')));
  assert(!(await stored()).find(x=>x.id==='DEMO-DUTRA-PROSPECT').interactions?.some(x=>x.note?.includes('conversa simulada')));
  await navigate('dia');assert.match(await page.locator('#day-opportunity-list').textContent(),/Transportadora Demo DUTRA/);
  await page.locator(`#day-opportunity-list [data-desk-lead="${id}"]`).click();await page.locator('#sales-desk-client [data-client-crm]').click();
  await page.locator('[data-sheet-technical]').click();await page.waitForURL('**/#guia');assert.equal(await page.locator('#technical-client').inputValue(),id);
  await page.locator('#technical-vehicle').selectOption('rodotrem_9eixos');await page.locator('#consultant-libras-select').selectOption('120');await page.locator('#consultant-include-dianteira').uncheck();
  await page.locator('#technical-name').fill('DEMO Rodotrem Volvo');await page.locator('#technical-name').press('Tab');await page.locator('#technical-qty').fill('2');await page.locator('#technical-qty').press('Tab');
  for(const [qid,val] of [['brand','volvo'],['has_reduction','nao']])await page.locator(`[data-qid="${qid}"][data-val="${val}"]`).click();
  assert.equal(await page.locator('#technical-state').getAttribute('data-state'),'result');
  const expected=await page.locator('[data-technical-item]').evaluateAll(nodes=>nodes.map(n=>({code:n.dataset.code,qty:Number(n.dataset.qty)})));
  await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');
  assert.equal(await page.locator('#client-company').inputValue(),'Transportadora Demo DUTRA');
  assert.equal(await page.locator('.input-veh-name').inputValue(),'DEMO Rodotrem Volvo');assert.equal(await page.locator('.input-veh-multiplier').inputValue(),'2');
  const quoteMap=await page.locator('.vehicle-body tbody tr').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.querySelector('td:first-child span').textContent.trim(),Number(n.querySelector('.input-veh-item-qty').value)])));
  assert.deepEqual(quoteMap,Object.fromEntries(expected.map(x=>[x.code,x.qty])));
  const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('og_operations_state')).quotes.filter(x=>x.source==='technical_workspace').at(-1));
  assert.equal(draft.clientId,id);assert.equal(draft.payload.client.internalCode,'DEMO-PREVIEW-001');assert.equal(draft.payload.vehicles[0].clientId,id);
  await navigate('dia');await ctx.setOffline(true);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');assert.match(await page.locator('#og-sync-status').textContent(),/Sem conexão/);await ctx.setOffline(false);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
  assert((await stored()).some(x=>x.id===id&&x.nextAction===next));
  // A real request failure must remain visible, even in the explicit preview runtime.
  await page.route('**/api/state', route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"DEMO test unavailable"}'}));
  await ctx.setOffline(true);await ctx.setOffline(false);
  await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');
  assert.match(await page.locator('#og-sync-status').textContent(),/Preview isolado/);
  assert.doesNotMatch(await page.locator('#og-sync-status').textContent(),/Dados temporários$/,'A sync error cannot masquerade as confirmed preview data');
  await page.unroute('**/api/state');await ctx.setOffline(true);await ctx.setOffline(false);
  await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');

  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
  if(process.env.OG_REALITY_ARTIFACTS){await mkdir(process.env.OG_REALITY_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.OG_REALITY_ARTIFACTS,`${width}-reality.png`)});}
  assert.deepEqual(errors,[]);console.log(`Reality ${width}x${height}: canonical identity/result/follow-up/technical/quote/reconnect PASS`);await ctx.close();
 }
}finally{await browser?.close();server?.kill('SIGTERM');if(dir)await rm(dir,{recursive:true,force:true});}
