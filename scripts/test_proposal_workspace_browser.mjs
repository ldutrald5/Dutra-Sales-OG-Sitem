import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm,mkdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const dataDir=await mkdtemp(path.join(os.tmpdir(),'dutra-proposal-stage8-'));
const port=await new Promise(resolve=>{const socket=net.createServer();socket.listen(0,'127.0.0.1',()=>{const port=socket.address().port;socket.close(()=>resolve(port));});});
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{env:{...process.env,OG_HOST:'127.0.0.1',OG_PORT:String(port),OG_DATA_DIR:dataDir,OG_ISOLATED_PILOT:'1'},stdio:'ignore'});
let browser;
try {
  for(let i=0;i<100;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(resolve=>setTimeout(resolve,50));}
  const empty=await(await fetch(base+'/api/state')).json();
  const privateFile=process.env.OG_PROPOSAL_REAL_SEED_FILE;
  const supplied=privateFile ? JSON.parse(await readFile(privateFile,'utf8')) : null;
  const seed=supplied || {...empty,leads:[{id:'FAKE-PROPOSAL-A',nome:'Cliente A',empresa:'Empresa sintética A',status:'contatado',interactions:[]},{id:'FAKE-PROPOSAL-B',nome:'Cliente B',empresa:'Empresa sintética B',status:'contatado',interactions:[]}],history:[]};
  const eligible=seed.leads.filter(lead=>privateFile ? lead.importMeta?.pilotReal===true&&!/^DEMO-/.test(lead.id) : true);
  assert.ok(eligible.length>=2);
  const [clientA,clientB]=eligible;
  const initialHistory=seed.history || [];
  const originalDocs=seed.operations?.generatedDocuments || [];
  const response=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...seed,baseRevision:empty.revision,revision:empty.revision})});assert.equal(response.status,200);
  browser=await chromium.launch({headless:true,executablePath:process.env.OG_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  let offline=false,conflicting=false,external=0,puts=0,failures=0,conflicts=0,releasePublish,publishStarted;
  let publishStartedResolve;publishStarted=new Promise(resolve=>publishStartedResolve=resolve);
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base){external++;return route.abort();}
    if(url.pathname==='/api/proposals/publish'&&request.method()==='POST'){
      publishStartedResolve();await new Promise(resolve=>releasePublish=resolve);
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({publishedAt:'2026-10-08T16:00:00Z',publicUrl:base+'/p/FAKE-NOT-SENT'})});
    }
    if(url.pathname==='/api/state'&&request.method()==='PUT'){
      puts++;
      if(offline){failures++;return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Offline fixture"}'});}
      if(conflicting){conflicting=false;const payload=request.postDataJSON();return route.continue({postData:JSON.stringify({...payload,baseRevision:0,revision:0})});}
    }
    return route.continue();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  page.on('response',response=>{if(response.url()===base+'/api/state'&&response.status()===409)conflicts++;});
  await page.addInitScript(()=>{window.open=()=>{throw new Error('External launch forbidden in isolated acceptance');};});
  const nav=async tab=>{await page.evaluate(tab=>{location.hash=tab;},tab);await page.waitForFunction(tab=>document.querySelector(`#tab-${tab}`)?.classList.contains('hidden')===false,tab);};
  const fill=async(selector,value)=>{await page.locator(selector).fill(String(value));await page.locator(selector).press('Tab');};
  const settled=async()=>{await page.waitForFunction(()=>document.querySelector('#og-sync-status')?.dataset.mode==='ok');await page.waitForFunction(async()=>!await OG_SYNC_BRIDGE.readQueuedState());};
  const operations=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_operations_state')));
  const documents=async()=> (await operations()).generatedDocuments.filter(doc=>doc.documentType==='proposal_tracking'&&!originalDocs.some(original=>original.id===doc.id));
  const history=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_cotacoes_history')) || []);
  await page.goto(base+'/#guia');await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();
  await page.locator('#technical-client').selectOption(clientA.id);
  await page.locator('[data-technical-scope="cavalo"]').click();await page.locator('#technical-vehicle').selectOption('toco_4x2');await page.locator('#consultant-libras-select').selectOption('120');await page.locator('#consultant-include-dianteira').uncheck();await page.locator('[data-qid="brand"][data-val="volvo"]').click();await fill('#technical-name','Cavalo · cenário de teste');await fill('#technical-qty',2);
  await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');await settled();
  await page.locator('#btn-add-vehicle-slot').click();await page.waitForURL('**/#guia');await page.locator('[data-technical-scope="carreta"]').click();await page.locator('#technical-vehicle').selectOption('trucado_carreta3');await page.locator('#consultant-libras-select').selectOption('120');await fill('#technical-name','Carreta · cenário de teste');await fill('#technical-qty',3);await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');await settled();
  await page.locator('#client-tier').selectOption('lead_ie');
  const root=page.locator('#proposal-workspace');
  assert.equal(await root.locator('[data-proposal-client-id]').getAttribute('data-proposal-client-id'),clientA.id);
  assert.equal(await root.locator('[data-proposal-roi-status]').getAttribute('data-proposal-roi-status'),'validate');
  assert.equal(await root.locator('[data-proposal-scope="cavalo"]').count(),1);assert.equal(await root.locator('[data-proposal-scope="carreta"]').count(),1);
  await root.locator('[data-proposal-prepare]').click();await settled();
  const first=(await documents())[0],firstFrozen=structuredClone(first),firstHistory=(await history())[0];
  assert.equal(first.clientId,clientA.id);assert.equal(first.snapshot.commercial.totalValue,6490);assert.equal(first.version,1);assert.equal(first.snapshot.roi.status,'validate');
  await root.locator('[data-proposal-current]').click();
  await root.locator('[data-proposal-term="paymentTerms"]').fill('Condição revisada do cenário');await root.locator('[data-proposal-term="paymentTerms"]').press('Tab');
  for(const [key,value] of Object.entries({tirePrice:2000,lifeMonths:24,lifeGainPct:25})) await fill(`[data-roi-field="${key}"]`,value);
  await fill('[data-roi-source]','Simulação explicitamente revisada para aceitação local');await root.locator('[data-roi-review]').check();
  assert.equal(await root.locator('[data-proposal-roi-status]').getAttribute('data-proposal-roi-status'),'ready');
  await root.locator('[data-proposal-prepare]').click();await settled();
  const second=(await documents())[0];assert.equal(second.version,2);assert.equal(second.quoteId,first.quoteId);assert.notEqual(second.id,first.id);assert.equal(second.snapshot.roi.status,'ready');
  assert.deepEqual((await documents()).find(doc=>doc.id===first.id),firstFrozen);
  assert.equal((await history()).length,initialHistory.length+1,'Commercial revision does not create duplicate quote history');
  assert.deepEqual((await history()).find(quote=>quote.id===firstHistory.id),firstHistory,'Saved quotation remains unchanged');
  const reopen=async()=>{await nav('historico');const index=await page.evaluate(id=>(JSON.parse(localStorage.getItem('og_cotacoes_history'))||[]).findIndex(row=>row.id===id),first.quoteId);await page.locator(`.btn-load-hist[data-load="${index}"]`).click();await page.waitForURL('**/#cotacao');await settled();};
  await nav('dia');await reopen();await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();await reopen();
  assert.equal(await root.locator('[data-proposal-roi-status]').getAttribute('data-proposal-roi-status'),'ready');assert.deepEqual((await documents()).find(doc=>doc.id===second.id),second);
  const artifacts=process.env.OG_BROWSER_ARTIFACT_DIR;if(artifacts)await mkdir(artifacts,{recursive:true});
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,900]]){
    await page.setViewportSize({width,height});await root.scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}: no horizontal overflow`);
    assert.equal(await root.locator('[data-proposal-vehicle-id]').count(),2);
    const detail=root.locator('[data-proposal-scope="carreta"] details').first();await detail.locator('summary').click();assert.match(await detail.textContent(),/Regra do motor: trucado_carreta3/);await detail.locator('summary').click();
    if(artifacts)await page.screenshot({path:path.join(artifacts,`${width}x${height}.png`)});
  }
  if (!privateFile) {
    const preservedHistory=await history(),preservedDocuments=await documents();
    await page.locator('#client-company').fill(clientB.empresa);
    assert.ok(await root.locator('[data-proposal-prepare]').isDisabled(),'Foreign canonical client cannot prepare vehicles owned by A');
    await page.locator('#btn-save-quote').click();
    assert.deepEqual(await history(),preservedHistory,'Rejected identity writes no quotation');
    assert.deepEqual(await documents(),preservedDocuments,'Rejected identity writes no proposal');
    await page.locator('#client-company').fill(clientA.empresa);await reopen();
  }
  // A late response may update its original document only, never the active B.
  const staleSource=await root.locator('[data-roi-source]').elementHandle();
  await page.locator('#btn-publish-proposal').click();await publishStarted;
  await nav('guia');await page.locator('#technical-client').selectOption(clientB.id);await page.locator('[data-technical-scope="cavalo"]').click();await page.locator('#technical-vehicle').selectOption('toco_4x2');await page.locator('#consultant-libras-select').selectOption('120');await page.locator('#consultant-include-dianteira').uncheck();await page.locator('[data-qid="brand"][data-val="volvo"]').click();await fill('#technical-name','Outra conta · cenário isolado');await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');
  await staleSource.evaluate(node=>{node.value='STALE MUST NOT APPLY';node.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await root.locator('[data-proposal-client-id]').getAttribute('data-proposal-client-id'),clientB.id);assert.equal(await root.locator('[data-roi-source]').inputValue(),'');
  await root.locator('[data-proposal-prepare]').click();await settled();
  const bFirst=(await documents()).find(doc=>doc.clientId===clientB.id);assert.equal(bFirst.snapshot.roi.status,'validate');assert.equal(bFirst.publication.publicEnabled,false);
  releasePublish();await settled();
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('og_operations_state')).generatedDocuments.find(doc=>doc.id===id)?.publication?.publicEnabled===true,second.id);
  assert.equal((await documents()).find(doc=>doc.id===first.id).publication.publicEnabled,false);
  assert.deepEqual((await documents()).find(doc=>doc.id===bFirst.id),bFirst,'Late A response leaves newly prepared B document unchanged');
  await root.locator('[data-proposal-current]').click();
  offline=true;const failedPut=page.waitForResponse(response=>response.url()===base+'/api/state'&&response.status()===503);await fill('[data-proposal-term="notes"]','Observação local offline, preservada');await root.locator('[data-proposal-prepare]').click();
  await failedPut;await page.waitForFunction(async()=>Boolean(await OG_SYNC_BRIDGE.readQueuedState()));
  const bOffline=(await documents()).find(doc=>doc.clientId===clientB.id&&doc.version===2);assert.ok(bOffline);assert.equal(bOffline.snapshot.commercial.notes,'Observação local offline, preservada');
  await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');assert.deepEqual((await documents()).find(doc=>doc.id===bOffline.id),bOffline);
  offline=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await settled();assert.ok(failures>0,'Actual failed PUT enters durable queue and reconnects');
  const persisted=await(await fetch(base+'/api/state')).json();assert.deepEqual(persisted.operations.generatedDocuments.find(doc=>doc.id===bOffline.id),bOffline);
  await nav('cotacao');conflicting=true;await fill('[data-proposal-term="notes"]','Conflito local não sobrescreve servidor');await page.waitForFunction(()=>document.querySelector('#og-sync-status')?.dataset.mode==='conflict');assert.ok(conflicts>0);
  assert.deepEqual((await(await fetch(base+'/api/state')).json()).operations.generatedDocuments.find(doc=>doc.id===bOffline.id),bOffline,'409 does not overwrite saved version');
  assert.equal((await operations()).activityEvents.filter(event=>event.type==='proposal.sent'&&!originalDocs.some(doc=>doc.id===event.proposalId)).length,0);
  assert.deepEqual(errors,[]);assert.equal(external,0);assert.ok(puts<50,'No infinite retry loop');
  assert.ok(Buffer.byteLength(JSON.stringify(second.snapshot))<30_000);
  console.log(`Proposal browser ${privateFile ? 'REAL canonical local fixture' : 'synthetic'}: two native applications, split/path, canonical prices, explicit ROI, v1/v2, reload/reopen, stale controls/late publish identity, offline/reconnect and actual409 PASS; four viewports; no external requests`);
  await context.close();
} finally {await browser?.close();server.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});}
