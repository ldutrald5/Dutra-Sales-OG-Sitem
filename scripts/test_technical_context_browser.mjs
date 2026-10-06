/* Independent Stage 6 regressions for reproduced context and durable sync bugs.
 * All business records are synthetic. The loopback server, HTTP revisions,
 * canonical callbacks, quotation UI and IndexedDB outbox remain real. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';

const { chromium } = createRequire(import.meta.url)('playwright');
const dataDir = await mkdtemp(path.join(os.tmpdir(), 'dutra-technical-context-'));
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
  env: { ...process.env, OG_PORT:String(port), OG_HOST:'127.0.0.1', OG_DATA_DIR:dataDir,
    OG_SALES_EXECUTION_EDGE_URL:'', OG_SALES_EXECUTION_EDGE_TOKEN:'', OG_CALL_INTELLIGENCE_EDGE_URL:'',
    OG_CALL_INTELLIGENCE_EDGE_TOKEN:'', OG_LOCAL_WHISPER_URL:'', OG_LOCAL_WHISPER_TOKEN:'', OG_SUPABASE_URL:'' },
  stdio:'pipe'
});
const leads = [
  { id:'QA-CONTEXT-A', internalCode:'QA-CODE-A', empresa:'QA Context Alpha', nome:'QA Alpha', cnpj:'12345678000191',
    ie:'QA-IE-A', socioAdmin:'QA Administrator Alpha', telefone:'44999995101', cidadeUf:'QA Cidade Alpha', segmentId:'agricola', status:'novo', interactions:[] },
  { id:'QA-CONTEXT-B', internalCode:'QA-CODE-B', empresa:'QA Context Beta', nome:'QA Beta', cnpj:'98765432000112',
    ie:'', socioAdmin:'', telefone:'44999995102', cidadeUf:'QA Cidade Beta', segmentId:'transportadora', status:'novo', interactions:[] }
];
const pieces = [{code:'EQ-120',qty:2,customPrice:null},{code:'EQ-1145',qty:2,customPrice:null},
  {code:'EQ-1040',qty:2,customPrice:null},{code:'EQ-1043',qty:2,customPrice:null}];
const technicalDraft = {
  id:'TECH-DRAFT-QA-UNLINKED', source:'technical_workspace', status:'technical_draft', clientId:null,
  createdAt:'2026-10-06T12:00:00Z', updatedAt:'2026-10-06T12:00:00Z',
  technicalContext:{id:'TECH-DRAFT-QA-UNLINKED',leadId:'',selectedVehicleId:'toco_4x2',answers:{brand:'volvo'},
    libras:120,includeDianteira:false,targetVehicleName:'QA unlinked saved vehicle',qty:2,notes:'QA operations only',manualItems:null,
    manualConfirmed:false,handoffId:'veh_QA_UNLINKED'},
  payload:{client:{},vehicles:[{id:'veh_QA_UNLINKED',name:'QA unlinked saved vehicle',vehicleTypeId:'toco_4x2',libras:120,
    includeDianteira:false,qty:2,items:pieces}]}
};
const deferred = () => {
  let resolve;
  const promise=new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('Controlled technical transport gate timed out')),15000);
    resolve=value=>{clearTimeout(timer);done(value);};
  });
  return {promise,resolve};
};
const errors = [];
let browser;

async function readRemote() { const response=await fetch(`${base}/api/state`); assert.ok(response.ok); return response.json(); }
async function seedRemote(value) {
  const current=await readRemote();
  const response=await fetch(`${base}/api/state`,{method:'PUT',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...current,leads:value.leads||[],history:value.history||[],operations:value.operations||{}})});
  assert.ok(response.ok, `isolated remote seed failed ${response.status}`);
}
async function newSession(seed = {}) {
  const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
  await context.addInitScript(seed => {
    if(localStorage.getItem('og_leads_crm')===null) {
      localStorage.setItem('og_leads_crm',JSON.stringify(seed.leads||[]));
      localStorage.setItem('og_cotacoes_history',JSON.stringify([]));
      localStorage.setItem('og_operations_state',JSON.stringify(seed.operations||{}));
    }
    window.open=()=>null;
    window.__qaTechnical={hooks:null,controller:null,readCompletions:0};
    let workspaceApi;
    Object.defineProperty(window,'OG_TECHNICAL_WORKSPACE',{configurable:true,get:()=>workspaceApi,set(api) {
      workspaceApi={...api,create(hooks) {
        __qaTechnical.hooks=hooks;
        const controller=api.create(hooks);
        __qaTechnical.controller=controller;
        return controller;
      }};
    }});
    let syncApi;
    Object.defineProperty(window,'OG_SYNC_BRIDGE',{configurable:true,get:()=>syncApi,set(api) {
      syncApi={...api,async readQueuedState(...args) {
        const result=await api.readQueuedState(...args);
        __qaTechnical.readCompletions++;
        return result;
      }};
    }});
  },seed);
  await context.route('**/*',route => new URL(route.request().url()).origin===base ? route.continue() : route.abort());
  const page=await context.newPage();
  page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(15000);
  page.on('pageerror',error=>errors.push(error.message));
  return {context,page};
}
async function open(page) {
  await page.goto(`${base}/#guia`);
  await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
}
async function idle(page) {
  await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
  await page.waitForFunction(async()=>!(await OG_SYNC_BRIDGE.readQueuedState()));
}
async function navigate(page,tab) {
  await page.locator(`.nav-tab[data-tab="${tab}"]`).click();
  await page.waitForURL(`**/#${tab}`);
}
async function selectClient(page,id) {
  const accept=dialog=>dialog.accept();page.on('dialog',accept);
  try { await page.locator('#technical-client').selectOption(id); }
  finally { page.off('dialog',accept); }
}
async function fill(page,selector,value) { await page.locator(selector).fill(String(value));await page.locator(selector).press('Tab'); }
async function configure(page,name='QA Toco Volvo',qty=1) {
  await page.locator('#technical-vehicle').selectOption('toco_4x2');
  await page.locator('#consultant-libras-select').selectOption('120');
  await page.locator('#consultant-include-dianteira').uncheck();
  await fill(page,'#technical-name',name);await fill(page,'#technical-qty',qty);
  await page.locator('[data-qid="brand"][data-val="volvo"]').click();
  assert.equal(await page.locator('#technical-state').getAttribute('data-state'),'result');
}
async function save(page) {
  await page.locator('#technical-save-draft').click();
  await page.waitForFunction(()=>!document.querySelector('#technical-save-draft').disabled);
  assert.match(await page.locator('#technical-feedback').textContent(),/salvo/i);
}
const records=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_operations_state')).quotes.filter(item=>item.source==='technical_workspace'));
const queue=page=>page.evaluate(()=>OG_SYNC_BRIDGE.readQueuedState());
async function quoteClient(page) {
  // Observe the actual canonical quotation snapshot through its user action,
  // rather than adding a test-only state getter to the presentation contract.
  const previousTab=new URL(page.url()).hash.slice(1);
  if(previousTab!=='cotacao') await navigate(page,'cotacao');
  await page.locator('#btn-save-quote').click();
  const client=await page.evaluate(()=>JSON.parse(localStorage.getItem('og_cotacoes_history'))[0].payload.client);
  if(previousTab!=='cotacao') await navigate(page,previousTab);
  return client;
}
async function handoff(page,accept=true) {
  const dialogs=[];const handler=dialog=>{dialogs.push(dialog.message());return accept?dialog.accept():dialog.dismiss();};
  page.on('dialog',handler);
  try {
    await page.locator('#btn-inject-consultant-to-quote').click();
    await page.waitForFunction(()=>!document.querySelector('#technical-save-draft').disabled);
    if(accept) await page.waitForURL('**/#cotacao');
  } finally { page.off('dialog',handler); }
  return dialogs;
}

try {
  await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('Isolated technical context server timeout')),15000);
    server.stdout.on('data',chunk=>{if(String(chunk).includes('Sistema OG no computador')){clearTimeout(timer);resolve();}});
    server.once('error',reject);
  });
  browser=await chromium.launch({executablePath:process.env.OG_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});

  // Hold a genuine server GET snapshot while a subsequent save reaches the real outbox.
  await seedRemote({leads});
  {
    const {context,page}=await newSession({leads});
    const captured=deferred(),release=deferred();let held=false;let rejectPuts=true;
    await page.route('**/api/state',async route=>{
      if(route.request().method()==='PUT'&&rejectPuts) return route.fulfill({status:503,contentType:'application/json',body:'{"error":"QA temporary transport failure"}'});
      if(route.request().method()==='GET'&&!held) {
        held=true;const response=await route.fetch();const body=await response.text();captured.resolve();
        await release.promise;return route.fulfill({response,body});
      }
      return route.continue();
    });
    await open(page);await captured.promise;
    await selectClient(page,leads[0].id);await configure(page,'QA held GET draft');
    await fill(page,'#technical-notes','QA new durable draft after old GET');await save(page);
    const saved=(await records(page))[0];
    assert.ok(JSON.stringify((await queue(page)).body).includes('QA new durable draft after old GET'));
    const readCount=await page.evaluate(()=>__qaTechnical.readCompletions);release.resolve();
    await page.waitForFunction(count=>__qaTechnical.readCompletions>count,readCount);
    assert.equal((await records(page))[0].id,saved.id,'old GET cannot replace durable operations');
    assert.equal(await page.locator('#technical-name').inputValue(),'QA held GET draft');
    assert.ok(JSON.stringify((await queue(page)).body).includes('QA new durable draft after old GET'));
    await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
    assert.equal((await records(page))[0].id,saved.id,'immediate refresh retains queued local draft');
    assert.equal(await page.locator('#technical-name').inputValue(),'QA held GET draft');
    assert.ok(await queue(page));rejectPuts=false;
    console.log('Real held bootstrap GET cannot overwrite durable newer draft; queued refresh preserves exact context: PASS');
    await context.close();
  }

  // Drafts can be the only operations collection; no CRM/proposal facts are invented.
  await seedRemote({operations:{quotes:[technicalDraft]}});
  {
    const {context,page}=await newSession();await open(page);await idle(page);
    assert.equal((await records(page))[0].id,technicalDraft.id,'operations-only server state is applied');
    assert.equal(await page.locator('#technical-name').inputValue(),technicalDraft.technicalContext.targetVehicleName,'new device can recover the remote saved draft');
    assert.equal(await page.locator('#technical-client').inputValue(),'');
    assert.equal(await page.locator('[data-technical-item]').count(),4);
    assert.deepEqual((await readRemote()).leads,[]);
    console.log('Remote technical draft with no CRM/history/events reaches canonical local state and visible recovery: PASS');
    await context.close();
  }
  await seedRemote({});
  {
    const {context,page}=await newSession({operations:{quotes:[technicalDraft]}});await open(page);
    await page.waitForFunction(async()=>{
      const remote=await(await fetch('/api/state')).json();return remote.operations.quotes.some(item=>item.id==='TECH-DRAFT-QA-UNLINKED');
    });
    await idle(page);
    const remote=await readRemote();assert.equal(remote.operations.quotes[0].id,technicalDraft.id);
    assert.deepEqual(remote.leads,[]);assert.deepEqual(remote.history,[]);assert.deepEqual(remote.operations.activityEvents,[]);
    console.log('Local operations-only recovery is genuinely PUT/ACKed without inventing CRM/proposal facts: PASS');
    await context.close();
  }

  // Recovery may contain newer canonical localStorage than a prior outbox body.
  // This is a startup fixture, not a local edit during an in-flight request.
  await seedRemote({operations:{quotes:[technicalDraft]}});
  {
    const {context,page}=await newSession();await open(page);await idle(page);
    await page.evaluate(async()=>{
      const remote=await(await fetch('/api/state')).json();
      await OG_SYNC_BRIDGE.queueState({leads:remote.leads,history:remote.history,operations:remote.operations,revision:remote.revision});
      const recovered=JSON.parse(localStorage.getItem('og_operations_state'));
      recovered.quotes[0].technicalContext.notes='QA newer local recovery before writer starts';
      localStorage.setItem('og_operations_state',JSON.stringify(recovered));
    });
    const acknowledged=deferred();
    page.on('response',response=>{if(response.url()===`${base}/api/state`&&response.request().method()==='PUT'&&response.status()===200) acknowledged.resolve();});
    await page.reload();await acknowledged.promise;
    await page.waitForFunction(async()=>{
      const remote=await(await fetch('/api/state')).json();return remote.operations.quotes[0]?.technicalContext.notes==='QA newer local recovery before writer starts';
    });
    await idle(page);
    assert.equal(await queue(page),null,'ACK of recomposed current recovery state clears the original unchanged queue');
    assert.equal(await page.locator('#technical-notes').inputValue(),'QA newer local recovery before writer starts');
    assert.equal(await page.locator('#og-sync-conflict-banner').count(),0,'valid recovery ACK must not create a new false 409');
    console.log('Prior outbox plus newer canonical startup recovery ACKs the current snapshot without stale queue/false conflict: PASS');
    await context.close();
  }

  for (const writer of ['scheduled','queued-reconnect','human-review']) {
    await seedRemote({leads});
    const {context,page}=await newSession({leads});await open(page);await idle(page);
    await selectClient(page,leads[0].id);await configure(page,`QA ${writer} ACK vehicle`);
    if(writer==='human-review') {
      await fill(page,'#technical-notes','QA prior human review base');await save(page);await idle(page);
      const concurrent=await readRemote();concurrent.leads[0].nextAction='QA genuine other-device concurrent update';
      await seedRemote(concurrent);
      await fill(page,'#technical-notes','QA local actual409 review draft');await save(page);
      await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));
      page.once('dialog',dialog=>dialog.accept());await page.locator('[data-sync-review]').click();
      await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-review-banner')));
    }
    const oldCaptured=deferred(),oldRelease=deferred(),newCaptured=deferred(),newRelease=deferred();
    let puts=0,rejectLater=false,failedPuts=0,initialOffline=writer==='queued-reconnect';
    page.on('requestfailed',request=>{if(request.url()===`${base}/api/state`&&request.method()==='PUT') failedPuts++;});
    await page.route('**/api/state',async route=>{
      if(route.request().method()!=='PUT') return route.continue();
      if(initialOffline) return route.continue();
      if(rejectLater) return route.fulfill({status:503,contentType:'application/json',body:'{"error":"QA later write temporarily blocked"}'});
      puts++;
      if(puts===1) {
        const response=await route.fetch();assert.ok(response.ok(),'first old PUT really reaches server');
        const body=await response.text();oldCaptured.resolve();await oldRelease.promise;return route.fulfill({response,body});
      }
      if(puts===2) {
        newCaptured.resolve();await newRelease.promise;
        return route.fulfill({status:503,contentType:'application/json',body:'{"error":"QA newer write temporarily blocked"}'});
      }
      return route.continue();
    });
    if(writer==='queued-reconnect') await context.setOffline(true);
    await fill(page,'#technical-notes',`QA ${writer} old acknowledged snapshot`);await save(page);
    if(writer==='human-review') {
      page.once('dialog',dialog=>dialog.accept());await page.locator('[data-send-review]').click();
    }
    if(writer==='queued-reconnect') {
      await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');
      // A real offline sender fails before the reconnect foreground writer starts.
      while(!failedPuts) await page.waitForEvent('requestfailed',{predicate:request=>request.url()===`${base}/api/state`&&request.method()==='PUT'});
      initialOffline=false;
      await context.setOffline(false);
    }
    await oldCaptured.promise;
    await fill(page,'#technical-notes',`QA ${writer} newer DURABLE snapshot`);await save(page);
    assert.ok(JSON.stringify((await queue(page)).body).includes(`QA ${writer} newer DURABLE snapshot`));
    oldRelease.resolve();await newCaptured.promise;
    assert.ok(JSON.stringify((await queue(page)).body).includes(`QA ${writer} newer DURABLE snapshot`),'old ACK must never clear newer outbox');
    assert.notEqual(await page.locator('#og-sync-status').getAttribute('data-mode'),'ok','old ACK cannot certify newer write');
    assert.ok(JSON.stringify((await readRemote()).operations.quotes).includes(`QA ${writer} old acknowledged snapshot`));
    assert.ok(!JSON.stringify((await readRemote()).operations.quotes).includes(`QA ${writer} newer DURABLE snapshot`));
    rejectLater=true;newRelease.resolve();
    await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');
    await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
    assert.equal(await page.locator('#technical-notes').inputValue(),`QA ${writer} newer DURABLE snapshot`,'refresh in ACK gap recovers newer saved draft');
    assert.ok(JSON.stringify((await queue(page)).body).includes(`QA ${writer} newer DURABLE snapshot`));
    rejectLater=false;await context.setOffline(true);await context.setOffline(false);await idle(page);
    assert.ok(JSON.stringify((await readRemote()).operations.quotes).includes(`QA ${writer} newer DURABLE snapshot`));
    console.log(`Real ${writer} old PUT ACK preserves newer durable outbox through blocked next PUT/refresh and later real ACK: PASS`);
    await context.close();
  }

  await seedRemote({});
  {
    const {context,page}=await newSession();await open(page);await idle(page);await navigate(page,'cotacao');
    await fill(page,'#client-name','QA manual contact');await fill(page,'#client-company','QA manual client outside CRM');
    await fill(page,'#client-ie','QA manual IE');await page.locator('#client-tier').selectOption('revenda');
    const before=await quoteClient(page);const priorVehicles=await page.locator('.input-veh-name').count();
    await navigate(page,'guia');await configure(page,'QA vehicle for current manual client');
    assert.match(await page.locator('#technical-client-context').textContent(),/QA manual client outside CRM/,'unlinked workspace exposes its actual manual quote context');
    await handoff(page);
    const after=await quoteClient(page);
    for(const field of ['nome','empresa','ie','tier']) assert.equal(after[field],before[field],`unlinked handoff must retain current manual ${field}`);
    assert.equal(await page.locator('#client-company').inputValue(),before.empresa);
    assert.equal(await page.locator('.input-veh-name').count(),priorVehicles+1,'current manual quotation remains the explicit owner');
    assert.equal((await records(page))[0].clientId,null);
    assert.deepEqual((await readRemote()).leads,[],'manual technical flow never invents a CRM customer');
    console.log('Unlinked handoff preserves existing manual client identity/billing and creates no CRM: PASS');
    await context.close();
  }

  await seedRemote({leads});
  {
    const {context,page}=await newSession({leads});await open(page);await idle(page);
    await selectClient(page,leads[0].id);await configure(page,'QA saved Alpha vehicle',1);await handoff(page);
    await page.locator('#client-tier').selectOption('revenda');await page.locator('#client-parcelas').selectOption('12');
    await fill(page,'#client-frete-texto','QA special Alpha freight');
    const alphaRecord=(await records(page)).find(item=>item.clientId===leads[0].id);
    await navigate(page,'guia');await selectClient(page,leads[1].id);await configure(page,'QA saved Beta vehicle',2);await handoff(page);
    const client=await quoteClient(page);
    for(const field of ['internalCode','nome','empresa','cnpj','ie','socioAdmin','telefone','cidadeUf','segmentId']) assert.equal(client[field],leads[1][field],`Beta must own ${field}`);
    assert.equal(client.tier,'lead_ie');assert.equal(client.parcelasCount,6);assert.equal(client.paymentMethod,'faturado');
    assert.notEqual(client.freteTexto,'QA special Alpha freight');
    assert.equal(await page.locator('#client-company').inputValue(),leads[1].empresa);assert.equal(await page.locator('#client-cnpj').inputValue(),leads[1].cnpj);
    assert.equal(await page.locator('#client-ie').inputValue(),'');assert.equal(await page.locator('#client-tier').inputValue(),'lead_ie');
    assert.equal(await page.locator('#client-parcelas').inputValue(),'6');assert.equal(await page.locator('.input-veh-name').count(),1);
    const eqRow=page.locator('.vehicle-body tbody tr').filter({has:page.locator('td:first-child span',{hasText:'EQ-120'})});
    assert.equal(await eqRow.locator('.input-veh-item-price').inputValue(),'213.00','actual quotation uses Beta default commercial tier');
    await page.locator('#btn-save-quote').click();
    const history=await page.evaluate(()=>JSON.parse(localStorage.getItem('og_cotacoes_history')));
    assert.equal(history[0].clientId,leads[1].id);assert.equal(history[0].payload.client.internalCode,leads[1].internalCode);
    assert.equal(history[0].payload.client.ie,'');assert.equal(history[0].payload.client.tier,'lead_ie');
    console.log('A→B handoff replaces full identity/billing in state, inputs, actual prices and saved canonical quote: PASS');

    await navigate(page,'guia');await selectClient(page,leads[0].id);
    assert.equal(await page.locator('#technical-name').inputValue(),alphaRecord.technicalContext.targetVehicleName);
    assert.equal(await page.locator('#technical-qty').inputValue(),'1');assert.equal(await page.locator('[data-technical-item]').count(),4);
    await selectClient(page,leads[1].id);assert.equal(await page.locator('#technical-name').inputValue(),'QA saved Beta vehicle');
    assert.match(await page.locator('#technical-client-context').textContent(),/cadastro canônico do CRM/,'linked workspace explicitly discloses CRM ownership');
    assert.equal(await page.locator('#technical-client').inputValue(),leads[1].id);
    assert.equal(await page.locator('#technical-client option:checked').textContent(),leads[1].empresa,'visible selected label belongs to the exact Beta CRM identity');
    console.log('A saved → B saved → explicit A/B selection recovers each exact canonical draft: PASS');

    await navigate(page,'cotacao');await fill(page,'.input-veh-multiplier',7);await fill(page,'.input-veh-name','QA manual quote name override');
    const quoteBefore=await quoteClient(page);await navigate(page,'guia');const declined=await handoff(page,false);
    assert.equal(declined.length,1,'name/quantity differences alone require a confirmation');assert.match(page.url(),/#guia$/);
    assert.equal(await page.locator('.input-veh-multiplier').inputValue(),'7');assert.equal(await page.locator('.input-veh-name').inputValue(),'QA manual quote name override');
    assert.deepEqual(await quoteClient(page),quoteBefore,'declining does not partially mutate quote/client');
    const accepted=await handoff(page,true);assert.equal(accepted.length,1);
    assert.equal(await page.locator('.input-veh-multiplier').inputValue(),'2');assert.equal(await page.locator('.input-veh-name').inputValue(),'QA saved Beta vehicle');
    console.log('Quote manual name/quantity survive declined replacement; explicit acceptance updates existing vehicle once: PASS');
    await context.close();
  }
  assert.deepEqual(errors,[],'context regressions must not cause browser exceptions');
  console.log('Stage6 independent technical context browser QA: PASS');
} finally {
  await browser?.close();server.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});
}
