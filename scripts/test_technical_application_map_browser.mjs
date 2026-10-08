import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const dir=await mkdtemp(path.join(os.tmpdir(),'dutra-map-qa-'));
const artifacts=process.env.OG_MAP_ARTIFACTS;
if(artifacts) await mkdir(artifacts,{recursive:true});
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,OG_PORT:String(port),OG_HOST:'127.0.0.1',OG_DATA_DIR:dir,OG_ACCESS_PIN:'',OG_ACCESS_TOKEN:'',OG_STATE_SEED_GZIP_B64:'',OG_CALL_INTELLIGENCE_EDGE_URL:'',OG_SALES_EXECUTION_EDGE_URL:'',OG_SUPABASE_URL:''},stdio:'pipe'});
server.stdout.resume();server.stderr.resume();
let browser;
const plain=v=>JSON.parse(JSON.stringify(v));
try {
  for(let attempt=0;attempt<100;attempt++) {try{if((await fetch(base+'/health')).ok)break;}catch{} await new Promise(resolve=>setTimeout(resolve,50));}
  const seed=await(await fetch(base+'/api/state')).json();
  const put=await fetch(base+'/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...seed,baseRevision:seed.revision,leads:[{id:'FAKE-LEAD-0000',empresa:'Empresa 0000',nome:'Cliente 0000',status:'contatado',interactions:[]}],history:[]})});
  assert.equal(put.status,200);
  browser=await chromium.launch({headless:true,executablePath:process.env.OG_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:390,height:844}});
  let writes=0,failed=0,external=0,conflictResponses=0,offline=false,conflicting=false;
  await context.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url());
    if(url.origin!==base){external++;return route.abort();}
    if(url.pathname==='/api/state'&&request.method()==='PUT'){
      writes++;
      if(offline){failed++;return route.fulfill({status:503,contentType:'application/json',body:'{"error":"QA offline"}'});}
      if(conflicting){conflicting=false;const payload=request.postDataJSON();return route.continue({postData:JSON.stringify({...payload,baseRevision:1,revision:1})});}
    }
    return route.continue();
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url()===base+'/api/state'&&r.status()===409)conflictResponses++;});page.on('dialog',d=>d.accept());
  const nav=async tab=>{await page.evaluate(tab=>{location.hash=tab;},tab);await page.waitForFunction(tab=>document.querySelector(`#tab-${tab}`)?.classList.contains('hidden')===false,tab);};
  const fill=async(selector,value)=>{await page.locator(selector).fill(String(value));await page.locator(selector).press('Tab');};
  const settled=async()=>{await page.waitForFunction(()=>document.querySelector('#og-sync-status')?.dataset.mode==='ok');await page.waitForFunction(async()=>!await OG_SYNC_BRIDGE.readQueuedState());};
  const current=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_operations_state')));
  await page.goto(base+'/#guia');await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();
  const beforeQuery=await(await fetch(base+'/api/state')).json(),writesBefore=writes;
  await page.locator('#technical-query-mode').check();
  await page.locator('[data-technical-scope="carreta"]').click();
  await page.locator('#technical-vehicle').selectOption('trucado_carreta3');
  await page.locator('#consultant-libras-select').selectOption('120');
  assert.equal(await page.locator('[data-qid]').count(),0);
  assert.ok(await page.locator('#technical-save-draft').isDisabled());assert.ok(await page.locator('#btn-inject-consultant-to-quote').isDisabled());
  assert.equal(await page.locator('#technical-application-map [data-application-scope="carreta"]').count(),1);
  assert.equal(await page.locator('#technical-application-map [data-application-scope="cavalo"]').count(),0);
  assert.equal(writes,writesBefore,'Read-only query emits no state writes');
  const afterQuery=await(await fetch(base+'/api/state')).json();assert.deepEqual(afterQuery,beforeQuery,'Query creates no CRM/quote/history/operation');
  await page.locator('#technical-query-mode').uncheck();await page.locator('#technical-client').selectOption('FAKE-LEAD-0000');
  await page.locator('[data-technical-scope="cavalo"]').click();
  await page.locator('#technical-vehicle').selectOption('toco_4x2');await page.locator('#consultant-libras-select').selectOption('120');
  await page.locator('[data-qid="brand"][data-val="volvo"]').click();await fill('#technical-name','Cavalo 0000');await fill('#technical-qty',2);
  assert.equal(await page.locator('#technical-application-map [data-map-position="dianteiro"]').count(),3);
  await fill('[data-technical-item][data-code="EQ-1250"] [data-technical-qty]',3);
  await page.locator('[data-technical-item][data-code="EQ-1250"] [data-manual-scope]').selectOption('cavalo');
  assert.ok(await page.locator('#technical-application-map').textContent().then(t=>t.includes('VALIDAR')));
  const staleScope = await page.locator('[data-technical-item][data-code="EQ-1250"] [data-manual-scope]').elementHandle();
  await page.locator('#technical-confirm-manual').check();await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');await settled();
  const first=(await current()).quotes.filter(q=>q.source==='quote_workspace').at(-1).payload.vehicles[0];
  assert.equal(first.items.find(x=>x.code==='EQ-1250').applicationScope,'cavalo');
  await page.locator('#btn-add-vehicle-slot').click();await page.waitForURL('**/#guia');
  await page.locator('[data-technical-scope="carreta"]').click();await page.locator('#technical-vehicle').selectOption('trucado_carreta3');await page.locator('#consultant-libras-select').selectOption('120');
  await fill('#technical-name','Carreta 0000');await fill('#technical-qty',3);
  await staleScope.evaluate(control=>{control.value='outro';control.dispatchEvent(new Event('change',{bubbles:true}));});
  assert.equal(await page.locator('#technical-application-map [data-application-scope="outro"]').count(),0,'Old manual scope control cannot classify the new vehicle');
  assert.equal(await page.locator('#technical-application-map [data-application-scope="carreta"]').count(),1,'New vehicle retains canonical trailer classification');
  await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');await settled();
  const composition=(await current()).quotes.filter(q=>q.source==='quote_workspace').at(-1).payload;
  assert.equal(composition.vehicles.length,2);assert.deepEqual(composition.vehicles.find(v=>v.id===first.id).items,first.items,'Sibling application preserves manual override');
  assert.equal(composition.vehicles[1].technicalContext.applicationScope,'carreta');
  const total=await page.locator('#metric-total').textContent();
  await page.locator('#btn-save-quote').click();await settled();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('og_cotacoes_history'))[0]);
  assert.equal(saved.clientId,'FAKE-LEAD-0000');assert.equal(saved.payload.vehicles.length,2);
  assert.ok(!['leads','history','operations','state'].some(key=>Object.hasOwn(saved.payload,key)));
  assert.ok(Buffer.byteLength(JSON.stringify(saved.payload))<20_000);
  const reopen=async()=>{await nav('historico');await page.locator('.btn-load-hist').first().click();await page.waitForURL('**/#cotacao');await settled();};
  await nav('dia');await reopen();await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();await reopen();
  assert.equal(await page.locator('#metric-total').textContent(),total);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_cotacoes_history'))[0]),saved);
  assert.equal(await page.locator('#multi-vehicle-workspace [data-application-scope="carreta"] [data-map-code="EQ-1135"]').getAttribute('data-map-qty'),'18');
  for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]]){
    await page.setViewportSize({width,height});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}: no horizontal overflow`);
    const detail=page.locator('#multi-vehicle-workspace [data-map-code="EQ-1135"] summary').first();await detail.click();
    assert.match(await detail.locator('..').textContent(),/Regra do motor: trucado_carreta3/);
    await detail.click();if(artifacts)await page.screenshot({path:path.join(artifacts,`${width}x${height}.png`)});
    console.log(`${width}x${height}: independent scope/manual/path/reopen/no overflow PASS`);
  }
  offline=true;await page.locator('.input-veh-multiplier').last().fill('4');await page.locator('.input-veh-multiplier').last().press('Tab');
  await page.waitForFunction(async()=>Boolean(await OG_SYNC_BRIDGE.readQueuedState()));
  await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await nav('cotacao');
  assert.equal(await page.locator('#multi-vehicle-workspace [data-application-scope="carreta"] [data-map-code="EQ-1135"]').getAttribute('data-map-qty'),'24');
  assert.equal((await current()).quotes.filter(q=>q.source==='quote_workspace').at(-1).payload.vehicles[1].technicalContext.manualItems,null,'Vehicle multiplier does not convert calculated application into manual override');
  offline=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')));await settled();assert.ok(failed>0);
  conflicting=true;await page.locator('.input-veh-multiplier').last().fill('5');await page.locator('.input-veh-multiplier').last().press('Tab');
  await page.waitForFunction(()=>document.querySelector('#og-sync-status')?.dataset.mode==='conflict');
  assert.equal(await page.locator('#multi-vehicle-workspace [data-application-scope="carreta"] [data-map-code="EQ-1135"]').getAttribute('data-map-qty'),'30');
  assert.ok(conflictResponses>0,'Actual server HTTP409 remains explicit');assert.equal(errors.length,0);assert.equal(external,0);
  await context.close();
  console.log('Technical map browser: read-only canonical query, two independent contexts, manual choice, bounded history, reload/reopen, actual failed PUT/reconnect and HTTP409 PASS');
} finally {await browser?.close();server.kill('SIGTERM');await rm(dir,{recursive:true,force:true});}
