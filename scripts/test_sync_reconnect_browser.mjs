/* Artificial isolated data only; optional installed developer Playwright/Chromium. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const dataDir=await mkdtemp(path.join(os.tmpdir(),'dutra-reconnect-'));
const artifacts=process.env.OG_RECONNECT_ARTIFACTS;
if(artifacts) await mkdir(artifacts,{recursive:true});
const port=await new Promise(resolve=>{const socket=net.createServer();socket.listen(0,'127.0.0.1',()=>{const port=socket.address().port;socket.close(()=>resolve(port));});});
const server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,OG_PORT:String(port),OG_HOST:'127.0.0.1',OG_DATA_DIR:dataDir},stdio:'pipe'});
let browser;
const base=`http://127.0.0.1:${port}`;
const isoDay=delta=>{const date=new Date();date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10)+'T10:00';};

const leads=[{id:'QA-RECONNECT',empresa:'QA Reconnect',telefone:'44999993333',status:'contatado',priority:'alta',nextAction:'Retomar conversa',followUpAt:isoDay(-1),interactions:[]}];
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server timeout')),15000);server.stdout.on('data',c=>{if(String(c).includes('Sistema OG no computador')){clearTimeout(timer);resolve();}});server.once('error',reject);});
 browser=await chromium.launch({executablePath:process.env.OG_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
 await context.addInitScript(({leads})=>{if(!localStorage.getItem('og_leads_crm'))localStorage.setItem('og_leads_crm',JSON.stringify(leads));window.__qaListeners={online:0,offline:0};const original=EventTarget.prototype.addEventListener;EventTarget.prototype.addEventListener=function(type,...args){if(this===window&&type in window.__qaListeners)window.__qaListeners[type]++;return original.call(this,type,...args);};},{leads});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let puts=0,gets=0,failedPuts=0,rejectPut=false;
 page.on('requestfailed',r=>{if(r.url().endsWith('/api/state')&&r.method()==='PUT')failedPuts++;});
 await page.route('**/api/state',route=>{if(route.request().method()==='PUT'){puts++;if(rejectPut)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"QA unavailable"}'});}else gets++;return route.continue();});
 await page.goto(base+'/#dia');await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 // Wait for actual remote seed acknowledgement, not an optimistic initial label.
 await page.waitForFunction(async()=>{const remote=await(await fetch('/api/state')).json();return remote.leads.some(x=>x.id==='QA-RECONNECT');});
 await page.waitForFunction(async()=>!(await OG_SYNC_BRIDGE.readQueuedState()));
 await page.evaluate(()=>{window.__qaQueueCompleted=0;const original=OG_SYNC_BRIDGE.queueState;OG_SYNC_BRIDGE.queueState=async(...args)=>{const result=await original(...args);window.__qaQueueCompleted++;if(window.__qaQueueCompleted===window.__qaHoldAfter){window.__qaQueueHeld=true;await new Promise(resolve=>{window.__qaReleaseQueue=resolve;});}return result;};});
 const listeners=await page.evaluate(()=>window.__qaListeners);
 const outcome=async(label)=>{await page.locator('[data-desk-select="QA-RECONNECT"]').click();await page.locator('[data-client-register]').click();await page.locator('#desk-result').selectOption('falar_depois');await page.locator('#desk-next-action').fill(label);await page.locator('#desk-follow-mode').selectOption('tomorrow');await page.locator('#desk-save-stay').click();};
 const queued=()=>page.evaluate(()=>OG_SYNC_BRIDGE.readQueuedState());
 const remote=()=>page.evaluate(async()=>await(await fetch('/api/state')).json());
 await context.setOffline(true);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');assert.equal(await queued(),null);
 await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');assert.equal(await queued(),null);
 console.log('Empty outbox offline/reconnect: genuine healthy GET, no manufactured pending PASS');
 await context.setOffline(true);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');
 const queueBaseline=await page.evaluate(()=>{window.__qaHoldAfter=window.__qaQueueCompleted+2;return window.__qaQueueCompleted;});await outcome('QA deterministic offline result');
 // The second durable write comes from the failed debounced PUT catch, after
 // the command's first outbox write. It proves the historically hanging path.
 await page.waitForFunction(()=>window.__qaQueueHeld===true);assert.ok(failedPuts>0,'offline scheduled PUT must actually fail');assert.ok(await queued());
 // Reconnect while the failed sender still holds its lock after durable queueing.
 await context.setOffline(false);await page.waitForFunction(()=>navigator.onLine && document.querySelector('#og-sync-status').dataset.mode==='busy');
 await page.evaluate(()=>{window.__qaReleaseQueue();window.__qaHoldAfter=null;});
 await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 assert.equal(await queued(),null);assert.equal((await remote()).leads.find(x=>x.id==='QA-RECONNECT').nextAction,'QA deterministic offline result');
 console.log('Unregistered Service Worker: failed scheduled PUT durably queued; real reconnect ACK clears outbox and reaches OK PASS');
 rejectPut=true;const beforeFailure=puts;const failedQueueBefore=await page.evaluate(()=>window.__qaQueueCompleted);await outcome('QA keep pending under503');
 await page.waitForFunction(n=>window.__qaQueueCompleted>=n+2,failedQueueBefore);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');assert.ok(await queued());assert.notEqual(await page.locator('#og-sync-status').getAttribute('data-mode'),'ok');
 await page.waitForTimeout(800);assert.ok(puts-beforeFailure<=2,'503 must not cause infinite request retry');
 rejectPut=false;await context.setOffline(true);await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');assert.equal(await queued(),null);assert.equal((await remote()).leads.find(x=>x.id==='QA-RECONNECT').nextAction,'QA keep pending under503');
 console.log('HTTP503 preserves pending/never fake OK/no request loop; later real reconnect publishes PASS');
 await page.evaluate(async()=>{const state=await(await fetch('/api/state')).json();state.leads.find(x=>x.id==='QA-RECONNECT').nextAction='QA concurrent other device';const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});if(!r.ok)throw Error('remote concurrency fixture setup failed');});
 await outcome('QA local conflict retained');await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));assert.ok(await page.evaluate(()=>OG_SYNC_BRIDGE.loadConflict()));assert.equal(await page.locator('#og-sync-status').getAttribute('data-mode'),'conflict');
 assert.equal((await remote()).leads.find(x=>x.id==='QA-RECONNECT').nextAction,'QA concurrent other device');
 await page.reload();await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));const beforeReview=puts;
 page.once('dialog',d=>d.accept());await page.locator('[data-sync-review]').click();await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-review-banner')));assert.equal(puts,beforeReview,'preparing review must not publish');assert.ok(await page.evaluate(()=>OG_SYNC_BRIDGE.loadReview()));
 page.once('dialog',d=>d.accept());await page.locator('[data-send-review]').click();await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');assert.equal(await queued(),null);assert.equal(await page.evaluate(()=>OG_SYNC_BRIDGE.loadConflict()),null);assert.equal(await page.evaluate(()=>OG_SYNC_BRIDGE.loadReview()),null);
 console.log('Actual HTTP409 durable conflict+refresh+explicit prepare/send review; real ACK clears recovery/outbox PASS');
 const finalListeners=await page.evaluate(()=>window.__qaListeners);
 for(let i=0;i<3;i++){await page.locator('.nav-tab[data-tab="prospeccao"]').click();await page.locator('.nav-tab[data-tab="dia"]').click();const oldGets=gets;await context.setOffline(true);await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');assert.ok(gets-oldGets<=2,'repeated reconnect must not accumulate GET handlers');assert.equal(await queued(),null);}
 assert.deepEqual(await page.evaluate(()=>window.__qaListeners),finalListeners,'navigation must not register extra network listeners');assert.deepEqual(listeners,finalListeners,'reload must register same bounded listeners');assert.deepEqual(errors,[]);
 console.log('Repeated navigation/reconnect: no listener or request accumulation PASS');await context.close();
}finally{await browser?.close();server.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});}
