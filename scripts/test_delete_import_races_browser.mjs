/* Deterministic transport gates over the native CRM UI; synthetic isolated data only. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crm from '../apps/sistema-og/services/crm-service.js';
const {chromium}=createRequire(import.meta.url)('playwright');
const dir=await mkdtemp(path.join(os.tmpdir(),'dutra-race-'));
const artifacts=process.env.OG_RACE_ARTIFACTS||path.join(os.tmpdir(),'dutra-race-evidence');await mkdir(artifacts,{recursive:true});
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://localhost:${port}`,pin=randomBytes(16).toString('hex'),token=randomBytes(32).toString('hex');
const env=Object.fromEntries(['PATH','HOME','USER','LANG','TMPDIR','NODE_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{OG_HOST:'127.0.0.1',OG_PORT:String(port),OG_DATA_DIR:dir,OG_ISOLATED_PREVIEW:'true',OG_PERSISTENT_AUTH:'true',OG_LOCAL_ACCESS_PIN:pin,OG_LOCAL_ACCESS_TOKEN:token});
const server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env,stdio:['ignore','pipe','pipe']});
const ready=new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('server startup timeout')),15000);server.stdout.on('data',x=>{if(String(x).includes('Sistema OG no computador')){clearTimeout(timer);resolve();}});server.once('error',reject);});
const request=(url,options={})=>fetch(base+url,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}});
const remote=async()=>{const r=await request('/api/state');assert.equal(r.status,200);return r.json();};
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const result={classification:'AUTOMATED_NATIVE_CHROMIUM_SYNTHETIC_FIXED_DATE_CONTROLLED_NETWORK_ORDER',cases:[],trace:[],pageErrors:[],externalRequests:0};
const gates=[];let browser,page,getGate,putGate;
const persist=()=>writeFile(path.join(artifacts,'result.json'),JSON.stringify(result,null,2));
const pass=async(name)=>{result.cases.push({name,status:'PASS'});console.log(name+' PASS');await persist();};
const makeGate=()=>{const g={arrived:deferred(),release:deferred()};gates.push(g);return g;};
const arrived=async gate=>{let timer;try{await Promise.race([gate.arrived.promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('controlled response gate not reached within 15s')),15000);})]);}finally{clearTimeout(timer);}};
try{
 await ready;const initial=await remote();const leads=[{id:'RACE-DELETE',empresa:'EMPRESA ALFA FICTICIA',nome:'CONTATO ALFA FICTICIO',interactions:[]},{id:'RACE-SURVIVOR',empresa:'EMPRESA OMEGA FICTICIA',observacoes:'HISTORICO FICTICIO PRESERVADO',interactions:[{id:'RACE-HISTORY',type:'nota',note:'NOTA FICTICIA'}]}].map(lead=>crm.normalizeLead({...lead,sourceChannel:"fixture",sourceLabel:"Cenario sintetico autorizado"}));
 const seeded=await request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...initial,leads,baseRevision:initial.revision})});assert.equal(seeded.status,200);
 browser=await chromium.launch({executablePath:process.env.OG_BROWSER_EXECUTABLE||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});
 await context.addInitScript(()=>{const NativeDate=Date,now=NativeDate.parse('2026-11-07T12:00:00Z');window.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};});
 await context.route('**/*',async route=>{
  const req=route.request();if(new URL(req.url()).origin!==base){result.externalRequests++;return route.abort();}
  if(req.url()!==base+'/api/state')return route.continue();
  result.trace.push({event:'state_request',method:req.method()});
  const method=req.method(),gate=method==='GET'?getGate:method==='PUT'?putGate:null;
  if(gate){if(method==='GET')getGate=null;else putGate=null;const response=await route.fetch();gate.body=await response.json();result.trace.push({event:'server_response_held',method,status:response.status(),revision:gate.body.revision,ids:gate.body.leads?.map(x=>x.id)});gate.arrived.resolve();await gate.release.promise;await route.fulfill({response});result.trace.push({event:'response_released',method,revision:gate.body.revision});return;}
  return route.continue();
 });
 page=await context.newPage();page.on('pageerror',e=>result.pageErrors.push(e.message));page.on('dialog',d=>d.accept());
 const stored=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm'))||[]);
 const settled=async()=>{await page.waitForFunction(()=>document.querySelector('#og-sync-status')?.dataset.mode==='ok');await page.waitForFunction(async()=>!await OG_SYNC_BRIDGE.readQueuedState());};
 const checkpoint=async label=>{const local=await stored(),serverState=await remote();assert.deepEqual(local,serverState.leads,label+' local equals server ACK state');result.trace.push({event:label,revision:serverState.revision,ids:local.map(x=>x.id),uiIds:await page.locator('#crm-leads-tbody [data-lead-id]').evaluateAll(xs=>xs.map(x=>x.dataset.leadId))});return serverState;};
 const openLegacy=async text=>{const tools=page.locator('details.crm-tools-menu').filter({has:page.locator('#btn-crm-import-modal')});if(!await tools.evaluate(e=>e.open))await tools.locator('summary').click();await page.locator('#btn-crm-import-modal').click();await page.locator('#textarea-leads-import').fill(text);await page.locator('#btn-process-import').click();await page.waitForFunction(expected=>document.querySelector('#crm-excel-preview-body tr td:nth-child(2) b')?.textContent===expected,text.split(';')[1]);await page.waitForFunction(()=>!document.querySelector('#crm-excel-apply').disabled);result.trace.push({event:'review_ready',text,preview:await page.locator('#crm-excel-preview-body').innerText()});};
 const alpha='CONTATO ALFA FICTICIO;EMPRESA ALFA FICTICIA;;CIDADE FICTICIA / PR';
 await page.goto(base+'/#dia');await page.locator('#access-session-dialog').waitFor({state:'visible'});await page.locator('[name=pin]').fill(pin);await page.locator('#access-session-dialog button').click();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();await page.evaluate(()=>location.hash='crm');await page.locator('#tab-crm').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>navigator.onLine),true);const before=await checkpoint('initial');
 // Capture an actual old GET on a genuine offline/reconnect, then let local work advance.
 getGate=makeGate();const oldRead=getGate;await context.setOffline(true);await context.setOffline(false);await arrived(oldRead);assert.ok(oldRead.body.leads.some(x=>x.id==='RACE-DELETE'));
 await page.locator('#crm-search-input').fill('EMPRESA ALFA FICTICIA');await page.locator('[data-lead-id="RACE-DELETE"]').check();await page.locator('#btn-batch-delete').click();await settled();const deleted=await checkpoint('delete_ack');assert.ok(!deleted.leads.some(x=>x.id==='RACE-DELETE'));assert.deepEqual(deleted.leads.find(x=>x.id==='RACE-SURVIVOR'),before.leads.find(x=>x.id==='RACE-SURVIVOR'));await pass('Confirmed delete reaches real server ACK and preserves survivor/history');
 await page.locator('#crm-search-input').fill('');await openLegacy(alpha);assert.deepEqual(await stored(),deleted.leads,'preview never writes');await page.locator('#crm-excel-apply').click();await settled();const reimported=await checkpoint('reimport_ack');const newAlpha=reimported.leads.find(x=>x.empresa==='EMPRESA ALFA FICTICIA');assert.ok(newAlpha);assert.notEqual(newAlpha.id,'RACE-DELETE');assert.equal(new Set(reimported.leads.map(x=>x.id)).size,reimported.leads.length);assert.ok(await page.locator(`[data-lead-id="${newAlpha.id}"]`).count());await page.locator('#crm-excel-close').click();await pass('Fixed-date reimport creates distinct ID; local, real ACK and UI agree');
 // Observe completion of the actual async guard after the held response, without changing its result.
 await page.evaluate(()=>{window.__raceReadCompleted=0;const original=OG_SYNC_BRIDGE.readQueuedState;OG_SYNC_BRIDGE.readQueuedState=async(...args)=>{const value=await original(...args);setTimeout(()=>window.__raceReadCompleted++,0);return value;};});oldRead.release.resolve();await page.waitForFunction(()=>window.__raceReadCompleted>0);assert.deepEqual(await stored(),reimported.leads);assert.ok(await page.locator(`[data-lead-id="${newAlpha.id}"]`).count());assert.equal(await page.locator('[data-lead-id="RACE-DELETE"]').count(),0);await pass('Older GET released after delete/import ACK cannot resurrect client or replace new UI state');
 // Hold a genuine PUT ACK after persistence, then import newer work while it is in flight.
 putGate=makeGate();const oldAck=putGate;await openLegacy('CONTATO BETA;EMPRESA BETA FICTICIA;;CIDADE FICTICIA / PR');await page.locator('#crm-excel-apply').click();await page.locator('#crm-excel-close').click();result.trace.push({event:'beta_local_before_ack',leads:await stored(),sync:await page.locator('#og-sync-status').getAttribute('data-mode'),preview:await page.locator('#crm-excel-review-note').textContent()});await persist();await arrived(oldAck);assert.notEqual(await page.locator('#og-sync-status').getAttribute('data-mode'),'ok');assert.ok(oldAck.body.revision>reimported.revision);
 await openLegacy('CONTATO GAMA;EMPRESA GAMA FICTICIA;;CIDADE FICTICIA / PR');await page.locator('#crm-excel-apply').click();await page.locator('#crm-excel-close').click();const newer=await stored();assert.ok(newer.some(x=>x.empresa==='EMPRESA GAMA FICTICIA'));assert.ok(!oldAck.body.leads.some(x=>x.empresa==='EMPRESA GAMA FICTICIA'));oldAck.release.resolve();await settled();const final=await checkpoint('new_generation_ack');assert.deepEqual(final.leads,newer);assert.ok(final.revision>oldAck.body.revision);assert.deepEqual(final.leads.find(x=>x.id==='RACE-SURVIVOR'),before.leads.find(x=>x.id==='RACE-SURVIVOR'));await pass('Delayed old PUT ACK never clears newer intent: final generation persists before OK');
 await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();assert.deepEqual(await stored(),final.leads);await checkpoint('reload');assert.deepEqual(result.pageErrors,[]);assert.equal(result.externalRequests,0);await page.screenshot({path:path.join(artifacts,'final-desktop.png'),fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(artifacts,'final-mobile.png'),fullPage:true});await pass('Reload retains final IDs/history with zero JavaScript errors or external requests');result.status='PASS';await persist();
}catch(error){result.status='FAIL';result.failure=error.stack;if(page){result.diagnostic=await page.evaluate(()=>({hash:location.hash,sync:document.querySelector('#og-sync-status')?.dataset.mode,input:document.querySelector('#textarea-leads-import')?.value,preview:document.querySelector('#crm-excel-preview-body')?.innerText,visibleTabs:[...document.querySelectorAll('.tab-content')].filter(x=>getComputedStyle(x).display!=='none').map(x=>x.id)})).catch(()=>null);await page.screenshot({path:path.join(artifacts,'failure.png'),fullPage:true}).catch(()=>{});}await persist();throw error;}
finally{for(const gate of gates)gate.release.resolve();await browser?.close();server.kill('SIGTERM');await rm(dir,{recursive:true,force:true});}
