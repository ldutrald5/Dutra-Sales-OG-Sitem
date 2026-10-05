/* Artificial isolated data only; optional installed developer Playwright/Chromium. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const dataDir=await mkdtemp(path.join(os.tmpdir(),'dutra-prospect-'));
const artifacts=process.env.OG_PROSPECT_ARTIFACTS;
if(artifacts) await mkdir(artifacts,{recursive:true});
const port=await new Promise(resolve=>{const socket=net.createServer();socket.listen(0,'127.0.0.1',()=>{const port=socket.address().port;socket.close(()=>resolve(port));});});
const server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,OG_PORT:String(port),OG_HOST:'127.0.0.1',OG_DATA_DIR:dataDir},stdio:'pipe'});
let browser;
const base=`http://127.0.0.1:${port}`;
const isoDay=delta=>{const date=new Date();date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10)+'T10:00';};
const leads=[
{id:'QA-A',empresa:'QA Alpha',nome:'Contato original',telefone:'44999990001',status:'novo',priority:'alta',nextAction:'Ligar para QA Alpha',followUpAt:isoDay(-1),interactions:[],sourceChannel:'Lista'},
{id:'QA-B',empresa:'QA Beta',telefone:'44999990002',status:'novo',priority:'media',interactions:[],sourceChannel:'Lista'},
{id:'QA-C',empresa:'QA Terminal',status:'perdido',priority:'alta',interactions:[]}
];
try {
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server timeout')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Sistema OG no computador')){clearTimeout(timer);resolve();}});server.once('error',reject);});
 browser=await chromium.launch({executablePath:process.env.OG_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(({leads})=>{if(!localStorage.getItem('og_leads_crm')) localStorage.setItem('og_leads_crm',JSON.stringify(leads));window.open=url=>{window.__qaOpened=String(url);return null;};},{leads});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/#prospeccao');await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')));
 await page.locator('button[data-prospect-view="inbox"]').click();
 await page.locator('#prospect-bulk-input').fill('QA Alpha, Novo Contato, 44999990001');await page.locator('#prospect-process').click();
 await page.locator('[data-preview-action]').selectOption('link');await page.locator('[data-preview-target="0"]').selectOption('QA-A');
 page.once('dialog',d=>d.accept());await page.locator('#prospect-import').click();await page.waitForFunction(()=>!document.querySelector('#prospect-import'));
 assert.equal((await stored()).length,3);assert.equal((await stored()).find(x=>x.id==='QA-A').nome,'Contato original');
 console.log('Explicit existing CRM link preserves identity/data PASS');
 await page.locator('button[data-prospect-view="inbox"]').click();await page.locator('#prospect-bulk-input').fill('QA New, Carla, 44988880003\nQA New, Carla, 44988880003');await page.locator('#prospect-process').click();
 let dialogs=0;const cancelBatch=d=>{dialogs++;dialogs===1?d.accept():d.dismiss();};page.on('dialog',cancelBatch);await page.locator('#prospect-import').click();page.off('dialog',cancelBatch);
 assert.equal((await stored()).length,3,'cancel ambiguous batch must not partially import');assert.equal(dialogs,2);
 await page.locator('#prospect-bulk-input').fill('QA New, Carla, 44988880003');await page.locator('#prospect-process').click();page.once('dialog',d=>d.accept());await page.locator('#prospect-import').click();await page.waitForFunction(()=>!document.querySelector('#prospect-import'));
 assert.equal((await stored()).length,4);assert.equal((await stored()).find(x=>x.empresa==='QA New').importMeta.verification,'imported_not_independently_confirmed');
 console.log('Intra-batch duplicate cancellation atomic; new prospect canonical/provenance PASS');
 await page.locator('button[data-prospect-view="queue"]').click();assert.equal(await page.locator('[data-prospect-open]').first().getAttribute('data-prospect-open'),'QA-A');
 await page.locator('[data-prospect-open="QA-A"]').click();
 assert.equal(await page.locator('.prospect-next-best b').textContent(),await page.evaluate(()=>OG_LEAD_INTELLIGENCE.nextBestAction(JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.id==='QA-A')).action));
 await page.locator('[data-session-whatsapp]').click();assert.equal((await stored()).find(x=>x.id==='QA-A').interactions.filter(x=>x.type==='resultado_contato').length,0);
 // Composer preparation may remain visible; the focus owner stays accessible.
 await page.locator('#prospect-result').selectOption('falar_depois');await page.locator('#prospect-next-action').fill('QA Stage4 retorno confirmado');await page.locator('#prospect-follow-mode').selectOption('tomorrow');
 await page.locator('#prospect-save-next').evaluate(b=>{b.click();b.click();});await page.waitForFunction(()=>!document.querySelector('.prospect-focus h1')?.textContent.includes('QA Alpha'));
 const result=(await stored()).find(x=>x.id==='QA-A');assert.equal(result.interactions.filter(x=>x.type==='resultado_contato').length,1);assert.equal(result.nextAction,'QA Stage4 retorno confirmado');
 await page.goto(base+'/#dia');await page.waitForFunction(()=>document.querySelector('#day-opportunity-list [data-desk-lead="QA-A"]'));await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');assert.equal((await stored()).find(x=>x.id==='QA-A').nextAction,'QA Stage4 retorno confirmado');
 console.log('Canonical priority/NBA/result/idempotency/next action/Mission Control/refresh PASS');
 await page.goto(base+'/#prospeccao');await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await page.locator('button[data-prospect-view="queue"]').click();await page.locator('[data-prospect-open="QA-B"]').click();
 for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.locator('.prospect-focus').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`${width} overflow`);
 const sizes=await page.locator('.prospect-focus-actions :is(button,a),#prospect-save-next').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect().height));assert.ok(sizes.every(h=>h>=44),`${width} touch target`);
 if(artifacts)await page.screenshot({path:path.join(artifacts,`${width}x${height}-focus.png`),fullPage:true});
 for(const view of ['queue','inbox']){await page.locator(`button[data-prospect-view="${view}"]`).click();await page.evaluate(()=>scrollTo(0,0));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`${width} ${view} overflow`);if(artifacts)await page.screenshot({path:path.join(artifacts,`${width}x${height}-${view}.png`),fullPage:true});}
 await page.locator('button[data-prospect-view="queue"]').click();await page.locator('[data-prospect-open="QA-B"]').click();console.log(`${width}x${height} focus/navigation/overflow/touch PASS`);
 }
 await context.setOffline(true);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');await page.locator('#prospect-result').selectOption('nao_atendeu');await page.locator('#prospect-next-action').fill('QA Stage4 offline retorno');await page.locator('#prospect-follow-mode').selectOption('tomorrow');await page.locator('#prospect-save-next').click();
 assert.equal((await stored()).find(x=>x.id==='QA-B').nextAction,'QA Stage4 offline retorno');await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 assert.ok(await page.evaluate(async()=>JSON.stringify(await(await fetch('/api/state')).json()).includes('QA Stage4 offline retorno')));
 console.log('Offline result durable; real reconnect publishes existing outbox PASS');
 await page.locator('button[data-prospect-view="inbox"]').click();await page.route('**/api/prospects/research',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'provider_unavailable',message:'QA provider disconnected'})}));await page.locator('#research-run').click();await page.waitForFunction(()=>!document.querySelector('#research-run').disabled);assert.equal((await stored()).length,4);assert.ok((await page.locator('#research-status').textContent()).length>0);
 console.log('Research 503 reports real failure; no fictional CRM data PASS');

 await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 await page.evaluate(async()=>{const remote=await(await fetch('/api/state')).json();remote.leads.find(x=>x.id==='QA-A').nextAction='QA other device';const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(remote)});if(!r.ok)throw Error('isolated remote conflict setup failed');});
 await page.locator('#prospect-bulk-input').fill('QA Conflict New, Carlos, 44988881111');await page.locator('#prospect-process').click();page.once('dialog',d=>d.accept());await page.locator('#prospect-import').click();
 await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));assert.ok((await stored()).some(x=>x.empresa==='QA Conflict New'));
 await page.reload();await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));assert.ok((await stored()).some(x=>x.empresa==='QA Conflict New'));
 assert.equal(await page.locator('#og-sync-status').getAttribute('data-mode'),'conflict');console.log('Real concurrent HTTP409, conversion retained after refresh, review/no overwrite PASS');
 assert.deepEqual(errors,[]);await context.close();

 const adversarial=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await adversarial.addInitScript(()=>{window.open=url=>{window.__qaOpened=String(url);return null;};localStorage.setItem('og_leads_crm',JSON.stringify(Array.from({length:24},(_,i)=>({id:'ADV-'+i,empresa:i<2?'QA Ambiguous':('QA Long enterprise '+('context '.repeat(15))+i),nome:i<2?'Preserve original':'',telefone:'4497000'+String(i).padStart(4,'0'),status:'novo',priority:'alta',sourceChannel:i===0?'Lista':i===1?'Evento':'sistema_og',interactions:[]}))));localStorage.setItem('og_prospect_research_results',JSON.stringify([{id:'QA-RESEARCH',providerId:'QA-PUBLIC',candidates:[{companyName:'QA Discovered',city:'Maringá',state:'PR',segment:'transportadora',contact:'44998887777',importAllowed:true,reviewStatus:'ready_for_review',sources:[{url:'https://example.org/qa-evidence'}],sourceSnippet:'Artificial QA source',fitReasons:['QA']}]}]));});
 const ap=await adversarial.newPage();await ap.route('**/api/state',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:0,leads:[],history:[],operations:{}})}));
 await ap.goto(base+'/#prospeccao');await ap.waitForFunction(()=>document.body.dataset.shellReady==='true');
 await ap.locator('#prospect-bulk-input').fill('QA Ambiguous, New Contact, 44991112222');await ap.locator('#prospect-process').click();await ap.locator('[data-preview-action]').selectOption('update');assert.equal(await ap.locator('[data-preview-target="0"] option').count(),3);
 ap.once('dialog',d=>d.accept());await ap.locator('#prospect-import').click();assert.equal(await ap.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).length),24);assert.equal(await ap.locator('[data-preview-target="0"]').inputValue(),'');
 await ap.locator('[data-preview-target="0"]').selectOption('ADV-1');ap.once('dialog',d=>d.accept());await ap.locator('#prospect-import').click();await ap.waitForFunction(()=>!document.querySelector('#prospect-import'));
 assert.equal(await ap.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.id==='ADV-1').nome),'Preserve original');
 await ap.locator('button[data-prospect-view="inbox"]').click();ap.once('dialog',d=>d.accept());await ap.locator('[data-research-import="0"]').click();await ap.waitForFunction(()=>JSON.parse(localStorage.getItem('og_leads_crm')).some(x=>x.empresa==='QA Discovered'));
 assert.deepEqual(await ap.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.empresa==='QA Discovered').importMeta.sourceUrls),['https://example.org/qa-evidence']);
 const researchId=await ap.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.empresa==='QA Discovered').id);
 await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator(`[data-prospect-open="${researchId}"]`).click();await ap.locator('#prospect-result').selectOption('falar_depois');await ap.locator('#prospect-next-action').fill('Research real canonical mutation');await ap.locator('#prospect-save-next').click();
 assert.equal(await ap.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.empresa==='QA Discovered').nextAction),'Research real canonical mutation');

 // Recovery guard: filter changes must invalidate both visible context and stale handlers.
 await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator('[data-prospect-filter="origin"]').selectOption('Lista');assert.equal(await ap.locator('[data-prospect-open]').count(),1);await ap.locator('[data-prospect-open="ADV-0"]').click();
 await ap.evaluate(()=>{window.__qaStale=[...document.querySelectorAll('[data-session-whatsapp],[data-session-call-ai],[data-session-delay],[data-session-call],#prospect-save-next')];window.__qaOpened=null;});
 const beforeEmpty=await ap.evaluate(()=>localStorage.getItem('og_leads_crm'));
 await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator('[data-prospect-filter="priority"]').selectOption('baixa');await ap.locator('button[data-prospect-view="focus"]').click();
 assert.equal(await ap.locator('.prospect-focus').count(),0);assert.equal(await ap.locator('#prospect-save-next').count(),0);assert.equal(await ap.locator('#prospecting-root .prospect-session-metrics').count(),0);assert.match(await ap.locator('#prospecting-root').textContent(),/Fila concluída/);
 let staleDialogs=0;const refuseStale=d=>{staleDialogs++;d.dismiss();};ap.on('dialog',refuseStale);await ap.evaluate(()=>window.__qaStale.forEach(button=>button.click()));ap.off('dialog',refuseStale);
 assert.equal(await ap.evaluate(()=>localStorage.getItem('og_leads_crm')),beforeEmpty,'stale detached actions must not mutate CRM');assert.equal(await ap.evaluate(()=>window.__qaOpened),null,'stale detached actions must not open external flows');assert.equal(staleDialogs,0,'stale detached actions must not prompt');
 await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator('[data-prospect-filter="priority"]').selectOption('all');await ap.locator('button[data-prospect-view="focus"]').click();assert.match(await ap.locator('.prospect-identity').textContent(),/ADV-0/);
 await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator('[data-prospect-filter="origin"]').selectOption('Evento');await ap.locator('button[data-prospect-view="focus"]').click();assert.match(await ap.locator('.prospect-identity').textContent(),/ADV-1/);
 await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator('[data-prospect-filter="origin"]').selectOption('all');
 console.log('Recovery: one-to-zero clears focus/actions/counter; stale DOM is inert; zero-to-items restores valid context; filtered-out selection switches deterministically PASS');
 for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]]){await ap.setViewportSize({width,height});await ap.locator('button[data-prospect-view="queue"]').click();assert.equal(await ap.locator('[data-prospect-open]').count(),24);assert.ok(await ap.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1,`${width} many long names overflow`);await ap.locator('[data-prospect-filter="priority"]').selectOption('baixa');assert.equal(await ap.locator('[data-prospect-open]').count(),0);assert.match(await ap.locator('#prospecting-root').textContent(),/Fila concluída/);await ap.locator('button[data-prospect-view="focus"]').click();assert.match(await ap.locator('#prospecting-root').textContent(),/Fila concluída/);await ap.locator('button[data-prospect-view="queue"]').click();await ap.locator('[data-prospect-filter="priority"]').selectOption('all');}
 console.log('Ambiguous two matches require target; update nooverwrite; researched provenance + canonical result; many/long/empty 8 viewports PASS');await adversarial.close();
 // Isolated read fixture checks reviewed normalized identity, without Supabase writes.
 const normalized=await browser.newContext({serviceWorkers:'block'});
 await normalized.addInitScript(({leads})=>localStorage.setItem('og_leads_crm',JSON.stringify([
   leads[0],{...leads[1],id:'QA-N',empresa:'QA Normalized',salesExecution:{companyId:'QA-COMPANY',contactId:'QA-CONTACT'}}
 ])),{leads});
 const np=await normalized.newPage();
 await np.route('**/api/state',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:0,leads:[],history:[],operations:{}})}));
 await np.goto(base+'/#dia');await np.waitForFunction(()=>document.body.dataset.shellReady==='true');
 await np.locator('[data-desk-select="QA-A"]').click();await np.locator('[data-client-call-ai]').click();
 await np.locator('#call-ai-prepare').click();await np.waitForFunction(()=>!document.querySelector('#call-ai-workspace').classList.contains('hidden'));
 await np.locator('#call-ai-notes').fill('QA anotação que não deve ser descartada');
 await np.goto(base+'/#prospeccao');await np.locator('button[data-prospect-view="queue"]').click();await np.locator('[data-prospect-open="QA-N"]').click();
 np.once('dialog',dialog=>dialog.dismiss());await np.locator('#prospect-save-next').click();
 assert.equal(await np.locator('#call-ai-notes').inputValue(),'QA anotação que não deve ser descartada');
 assert.ok(!(await np.locator('#call-ai-review').isVisible()),'cancelled account switch must not open review for prior identity');
 await np.goto(base+'/#prospeccao');await np.locator('button[data-prospect-view="queue"]').click();await np.locator('[data-prospect-open="QA-N"]').click();
 np.once('dialog',dialog=>dialog.accept());await np.locator('#prospect-save-next').click();
 assert.ok(await np.locator('#call-ai-review').isVisible());
 assert.match(await np.locator('#call-ai-summary').inputValue(),/QA Normalized/);
 console.log('Normalized owner bridge: cancel preserves prior notes; accepted switch reviews exact canonical account, no external mutation PASS');
 await normalized.close();
}finally{await browser?.close();server.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});}
