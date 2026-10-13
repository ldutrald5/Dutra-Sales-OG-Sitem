/* P0-A: native commercial bridges, isolated fictional data, no provider credentials. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {randomBytes} from 'node:crypto';
const {chromium}=createRequire(import.meta.url)('playwright');
const artifacts=process.env.OG_COMMERCIAL_IDENTITY_ARTIFACTS || path.join(os.tmpdir(),'dutra-p0a-browser-evidence');
await mkdir(artifacts,{recursive:true});
const dir=await mkdtemp(path.join(os.tmpdir(),'dutra-p0a-commercial-'));
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://localhost:${port}`,pin=randomBytes(16).toString('hex'),token=randomBytes(32).toString('hex');
const env=Object.fromEntries(['PATH','HOME','USER','LANG','LC_ALL','TMPDIR','NODE_PATH'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{OG_HOST:'127.0.0.1',OG_PORT:String(port),OG_DATA_DIR:dir,OG_ISOLATED_PREVIEW:'true',OG_PERSISTENT_AUTH:'true',OG_LOCAL_ACCESS_PIN:pin,OG_LOCAL_ACCESS_TOKEN:token});
const startServer=()=>spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env,stdio:'ignore'});
let server=startServer();
const request=(url,options={})=>fetch(base+url,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}});
let browser,page;
const result={classification:'AUTOMATED_CHROMIUM_LOCAL_ISOLATED_FICTIONAL',cases:[],pageErrors:[],externalRequests:0,externalLaunches:0};
const stateResponses=[];
const leads=[
 {id:'P0-A',internalCode:'P0-CODE-A',empresa:'Empresa FICTICIA A',nome:'Contato FICTICIO A',cnpj:'00000000000000',status:'contatado',observacoes:'REGISTRO PRIVADO FICTICIO A',interactions:[{id:'P0-HISTORY-A',at:'2026-10-01T12:00:00Z',type:'nota',note:'HISTORICO FICTICIO A'}]},
 {id:'P0-B',internalCode:'P0-CODE-B',empresa:'Empresa FICTICIA B',nome:'Contato FICTICIO B',status:'novo',interactions:[]},
 {id:'P0-H-A',internalCode:'P0-HOMONYM-A',empresa:'Homonima FICTICIA',nome:'Contato FICTICIO HA',cidadeUf:'Cidade A / SP',status:'novo',interactions:[]},
 {id:'P0-H-B',internalCode:'P0-HOMONYM-B',empresa:'Homonima FICTICIA',nome:'Contato FICTICIO HB',cidadeUf:'Cidade B / PR',status:'novo',interactions:[]}
];
try {
 for(let i=0;i<150;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,50));}
 const empty=await(await request('/api/state')).json();
 const seed={...empty,leads,history:[],operations:{...empty.operations,materials:[{id:'P0-LOGO-A',clientId:'P0-A',title:'Asset FICTICIO autorizado A',mediaType:'image',status:'approved',audience:'customer_authorized',consentRef:'Fixture isolada',contentVersion:'p0a-1',localAsset:{id:'P0-LOGO-A',type:'image/png'}}]}};
 assert.equal((await request('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...seed,baseRevision:empty.revision})})).status,200);
 browser=await chromium.launch({headless:true,executablePath:process.env.OG_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():(result.externalRequests++,route.abort()));
 await context.exposeBinding('__p0aRecordExternalLaunch',()=>{result.externalLaunches++;});
 await context.addInitScript(()=>{window.open=()=>{window.__p0aRecordExternalLaunch();return null;};});
 page=await context.newPage();let acceptDialogs=true;page.on('pageerror',error=>result.pageErrors.push(error.message));page.on('dialog',dialog=>acceptDialogs?dialog.accept():dialog.dismiss());
 page.on('response',response=>{if(response.url()===base+'/api/state')stateResponses.push({method:response.request().method(),status:response.status()});});
 const nav=async tab=>{await page.evaluate(tab=>location.hash=tab,tab);await page.waitForFunction(tab=>!document.querySelector('#tab-'+tab)?.classList.contains('hidden'),tab);};
 const fill=async(selector,value)=>{await page.locator(selector).fill(String(value));await page.locator(selector).press('Tab');};
 const settled=async()=>{await page.waitForFunction(()=>document.querySelector('#og-sync-status')?.dataset.mode==='ok');await page.waitForFunction(async()=>!await OG_SYNC_BRIDGE.readQueuedState());};
 const restartIsolatedServer=async()=>{await settled();const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill('SIGTERM');await stopped;server=startServer();for(let i=0;i<150;i++){try{if((await fetch(base+'/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,50));}await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');assert.equal(await page.locator('#access-session-dialog').isVisible(),false);await settled();};
 const operations=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_operations_state')));
 const storedLeads=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')));
 const history=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('og_cotacoes_history'))||[]);
 const activeDraft=async()=>{const records=(await operations()).quotes.filter(q=>q.source==='quote_workspace'&&q.status==='composition_draft');return records.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];};
 const workspace=page.locator('#proposal-workspace');
 const casePass=async(name,details={})=>{result.cases.push({name,status:'PASS',...details});await writeFile(path.join(artifacts,'result.json'),JSON.stringify(result,null,2));console.log(name+' PASS');};
 await page.goto(base+'/#guia');await page.locator('#access-session-dialog').waitFor({state:'visible'});await page.locator('[name=pin]').fill(pin);await page.locator('#access-session-dialog button').click();await page.locator('#access-session-dialog').waitFor({state:'hidden'});await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();
 const configure=async(clientId,{trailer=false,name='',quantity=1}={})=>{
  await nav('guia');if(await page.locator('#technical-client').inputValue()!==clientId)await page.locator('#technical-client').selectOption(clientId);await page.locator(`[data-technical-scope="${trailer?'carreta':'cavalo'}"]`).click();await page.locator('#technical-vehicle').selectOption(trailer?'trucado_carreta3':'toco_4x2');await page.locator('#consultant-libras-select').selectOption('120');
  if(!trailer){await page.locator('#consultant-include-dianteira').uncheck();await page.locator('[data-qid="brand"][data-val="volvo"]').click();}
  await fill('#technical-name',name||`${trailer?'Carreta':'Cavalo'} FICTICIO`);await fill('#technical-qty',quantity);await page.locator('#btn-inject-consultant-to-quote').click();
  const next=await Promise.race([page.waitForURL('**/#cotacao').then(()=> 'quote'),page.locator('#quote-client-transition').waitFor({state:'visible'}).then(()=> 'transition')]);
  if(next==='transition')await page.locator('[data-quote-transition="clean"]').click();await page.waitForURL('**/#cotacao');await settled();
 };
 const openSheetQuote=async id=>{if(await page.locator('#client-sheet-overlay').count())await page.locator('#client-sheet-overlay [data-client-sheet-close]').first().click();await nav('crm');await page.locator('#crm-search-input').fill(leads.find(x=>x.id===id).empresa);await page.locator(`[data-open-client-sheet="${id}"]`).first().click();await page.locator('[data-sheet-quote]').click();};
 const transition=async action=>{await page.locator('#quote-client-transition').waitFor({state:'visible'});await page.locator(`[data-quote-transition="${action}"]`).click();};
 const assertCurrentClient=async(id,{empty=false,forbidden=[]}={})=>{
  await settled();const draft=await activeDraft();assert.equal(draft.clientId,id);assert.equal(draft.payload.client.clientId,id);assert.equal(draft.payload.client.internalCode,leads.find(x=>x.id===id).internalCode);assert.equal(await page.locator('#client-company').inputValue(),leads.find(x=>x.id===id).empresa);
  for(const vehicle of draft.payload.vehicles){assert.equal(vehicle.clientId,id);if(vehicle.technicalContext?.leadId)assert.equal(vehicle.technicalContext.leadId,id);}
  if(empty){assert.deepEqual(draft.payload.vehicles,[]);assert.deepEqual(draft.payload.extraItems,[]);}
  const serialized=JSON.stringify(draft.payload);for(const marker of forbidden)assert.ok(!serialized.includes(marker),`Client ${id} cannot retain ${marker}`);
  return draft;
 };
 let dirtyVersion=0;const dirtyA=async()=>{
  await configure('P0-A',{name:'VEICULO PRIVADO FICTICIO A'});await fill('[data-proposal-term="notes"]','NOTA PRIVADA FICTICIA A');await fill('[data-proposal-term="paymentTerms"]','CONDICAO PRIVADA FICTICIA A');
  for(const [key,value] of Object.entries({tirePrice:4321,lifeMonths:18,lifeGainPct:20}))await fill(`[data-roi-field="${key}"]`,value);await fill('[data-roi-source]','FONTE PRIVADA FICTICIA A');await workspace.locator('[data-roi-review]').check();
  await fill('#client-frete-texto',`FRETE PRIVADO FICTICIO A · revisão ${++dirtyVersion}`);await fill('#client-prazo-entrega','PRAZO PRIVADO FICTICIO A');
  if(!await workspace.locator('.proposal-presentation-settings').evaluate(e=>e.open))await workspace.locator('.proposal-presentation-settings summary').click();
  await fill('[data-presentation-text="title"]','TITULO PRIVADO FICTICIO A');
  await page.evaluate(async()=>{const c=document.createElement('canvas');c.width=32;c.height=16;const b=await new Promise(r=>c.toBlob(r,'image/png'));await OG_MATERIAL_STORE.put('P0-LOGO-A',b);});
  await workspace.locator('[data-presentation-logo]').selectOption('P0-LOGO-A');await page.waitForFunction(()=>document.querySelector('[data-presentation-logo-status]')?.textContent.includes('conteúdo verificado'));await settled();return activeDraft();
 };
 const forbiddenA=['P0-CODE-A','P0-LOGO-A','Contato FICTICIO A','NOTA PRIVADA FICTICIA A','CONDICAO PRIVADA FICTICIA A','FONTE PRIVADA FICTICIA A','TITULO PRIVADO FICTICIO A','FRETE PRIVADO FICTICIO A','PRAZO PRIVADO FICTICIO A'];
 await dirtyA();await workspace.locator('[data-proposal-prepare]').click();await settled();
 const historicalA=structuredClone((await operations()).generatedDocuments.filter(d=>d.documentType==='proposal_tracking'&&d.clientId==='P0-A'));
 assert.ok(historicalA.length);await workspace.locator('[data-proposal-current]').click();await fill('[data-proposal-term="notes"]','NOTA PRIVADA FICTICIA A · revisão não salva');await fill('#client-frete-texto','FRETE PRIVADO FICTICIO A · revisão não salva');const draftA=await activeDraft();
 await openSheetQuote('P0-B');await transition('cancel');await nav('cotacao');assert.deepEqual((await activeDraft()).payload,draftA.payload);await casePass('A→B cancellation preserves complete A draft');
 await openSheetQuote('P0-B');await transition('clean');await page.waitForURL('**/#cotacao');await assertCurrentClient('P0-B',{empty:true,forbidden:[...forbiddenA,'VEICULO PRIVADO FICTICIO A']});await casePass('A→B starts clean canonical B, no A commercial/ROI/assets/vehicles');
 await configure('P0-B',{quantity:2});await page.locator('#btn-add-vehicle-slot').click();await configure('P0-B',{trailer:true,quantity:3});await page.locator('#btn-save-quote').click();await settled();
 const savedB=(await history())[0];assert.equal(savedB.clientId,'P0-B');assert.equal(savedB.clientCompany,'Empresa FICTICIA B');assert.equal(savedB.totalValue,6490);assert.equal(savedB.totalPecas,88);assert.equal(savedB.payload.vehicles.length,2);for(const v of savedB.payload.vehicles)assert.equal(v.clientId,'P0-B');for(const marker of forbiddenA)assert.ok(!JSON.stringify(savedB.payload).includes(marker));
 const docsB=(await operations()).generatedDocuments.filter(d=>d.documentType==='proposal_tracking'&&d.clientId==='P0-B');assert.ok(docsB.length);assert.equal(docsB[0].snapshot.commercial.totalValue,6490);assert.equal(docsB[0].status,'internal_draft');const immutableB=structuredClone(docsB);
 await nav('dia');await nav('historico');await page.locator('.btn-load-hist[data-load="0"]').click();await page.waitForURL('**/#cotacao');await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();await nav('historico');await page.locator('.btn-load-hist[data-load="0"]').click();await page.waitForURL('**/#cotacao');await settled();
 assert.equal(await workspace.locator('[data-proposal-client-id]').getAttribute('data-proposal-client-id'),'P0-B');assert.deepEqual((await history())[0],savedB);assert.deepEqual((await operations()).generatedDocuments.filter(d=>d.documentType==='proposal_tracking'&&d.clientId==='P0-B'),immutableB);
 // Evidence must not display real source-code example contacts in placeholders.
 await page.evaluate(()=>document.querySelectorAll('[placeholder]').forEach(e=>e.setAttribute('placeholder','Exemplo FICTICIO')));
 for(const [label,width,height] of [['mobile',390,844],['desktop',1440,900]]){
  await page.setViewportSize({width,height});
  await page.locator('#client-company').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,`${label}-quote-client-b.png`)});
  await workspace.locator('.proposal-preview .client-doc-header').first().evaluate(el=>el.scrollIntoView({block:'start'}));await page.evaluate(()=>window.scrollBy(0,-110));await page.screenshot({path:path.join(artifacts,`${label}-canonical-b.png`)});
  await page.locator('#multi-vehicle-workspace .fleet-heading').evaluate(el=>el.scrollIntoView({block:'start'}));await page.evaluate(()=>window.scrollBy(0,-110));await page.screenshot({path:path.join(artifacts,`${label}-vehicles-b.png`)});
 }
 await page.emulateMedia({media:'print'});await page.pdf({path:path.join(artifacts,'fictional-client-b.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:'screen'});
 const pdfText=execFileSync('pdftotext',[path.join(artifacts,'fictional-client-b.pdf'),'-'],{encoding:'utf8'});assert.match(pdfText,/Empresa FICTICIA B/);assert.match(pdfText,/6\.490,00/);for(const marker of ['Empresa FICTICIA A',...forbiddenA])assert.ok(!pdfText.includes(marker));assert.ok((await readFile(path.join(artifacts,'fictional-client-b.pdf'))).subarray(0,4).equals(Buffer.from('%PDF')));
 await casePass('B save→reopen→reload→proposal→actual PDF preserves client, two vehicles, canonical parts/prices',{clientId:savedB.clientId,vehicles:savedB.payload.vehicles.map(v=>({id:v.id,clientId:v.clientId,qty:v.qty})),totalValue:savedB.totalValue,totalPecas:savedB.totalPecas});
 for(const bridge of ['Meu Dia / Mesa','Command Center']){
  await dirtyA();
  if(bridge==='Meu Dia / Mesa'){await nav('dia');await page.locator('[data-desk-select="P0-B"]').click();await page.locator('[data-client-proposal]').click();}
  else {await page.keyboard.press('Control+k');await page.locator('#command-input').fill('cotar Empresa FICTICIA B');await page.locator('[data-command-lead="P0-B"]').click();}
  await transition('clean');await page.waitForURL('**/#cotacao');await assertCurrentClient('P0-B',{empty:true,forbidden:forbiddenA});await casePass(bridge+' uses the same clean canonical transition');
 }
 result.coverageLimits=['Legacy CRM inspector button is not mounted by the current normal CRM render; its callback needs service/VM coverage.'];
 // A separate real process lifecycle keeps this deliberately dense regression fixture
 // below the unchanged 30 writes/IP/minute production boundary.
 await restartIsolatedServer();
 // Reopen the valid B quote so a header edit probes persistence, not an empty draft.
 await nav('historico');await page.locator('.btn-load-hist[data-load="0"]').click();await page.waitForURL('**/#cotacao');await workspace.locator('[data-proposal-current]').click();
 // Deliberately invalid all-zero document belongs only to isolated fixture A.
 // The CNPJ input avoids the company-transition dialog while probing the save guard.
 await fill('#client-cnpj','00000000000000');const historyBefore=await history();await page.locator('#btn-save-quote').click();await settled();assert.deepEqual(await history(),historyBefore,'Conflicting canonical document cannot persist');await fill('#client-cnpj','');await casePass('Edited document belonging to A cannot persist under canonical B');
 await dirtyA();const beforeManual=await activeDraft();await fill('#client-company','Empresa FICTICIA B');await transition('cancel');await settled();assert.deepEqual((await activeDraft()).payload,beforeManual.payload);assert.equal(await page.locator('#client-company').inputValue(),'Empresa FICTICIA A');await casePass('Manual company change requires confirmation; cancellation restores complete A context');
 await fill('#client-company','Empresa FICTICIA B');await transition('clean');await assertCurrentClient('P0-B',{empty:true,forbidden:[...forbiddenA,'VEICULO PRIVADO FICTICIO A']});await casePass('Confirmed manual company change starts clean canonical B');
 await dirtyA();const reuseA=await activeDraft();await openSheetQuote('P0-B');await transition('reuse');await page.waitForURL('**/#cotacao');const reuseB=await assertCurrentClient('P0-B',{forbidden:[...forbiddenA,'VEICULO PRIVADO FICTICIO A']});assert.equal(reuseB.payload.vehicles.length,reuseA.payload.vehicles.length);assert.deepEqual(reuseB.payload.vehicles.map(v=>v.items),reuseA.payload.vehicles.map(v=>v.items));assert.ok(reuseB.payload.vehicles.every(v=>v.clientReviewRequired));const beforeReuseSave=await history();await page.locator('#btn-save-quote').click();assert.deepEqual(await history(),beforeReuseSave,'Unreviewed reused technical composition cannot be saved as a commercial quotation');await casePass('Explicit technical-only reuse requires review, preserves parts and clears commercial/ROI/media');
 await openSheetQuote('P0-H-A');await transition('clean');await page.waitForURL('**/#cotacao');await configure('P0-H-A');await fill('[data-proposal-term="notes"]','NOTA PRIVADA HOMONIMO A');await openSheetQuote('P0-H-B');await transition('clean');await page.waitForURL('**/#cotacao');await assertCurrentClient('P0-H-B',{empty:true,forbidden:['P0-HOMONYM-A','NOTA PRIVADA HOMONIMO A']});await casePass('Same company name, distinct canonical IDs, explicit transition remains isolated');
 // Language interpretation is not an identity decision: ambiguity must be reviewed separately.
 const openNatural=async()=>{await page.keyboard.press('Control+k');await page.locator('#command-input').fill('Homonima FICTICIA; Falei com Teste; retornar amanhã');await page.locator('#command-natural').click();};
 const prior=await storedLeads();await openNatural();await page.locator('[data-command-identity="cancel"]').waitFor({state:'visible'});assert.deepEqual(await storedLeads(),prior,'Interpretation confirmation alone must not write to a homonym');await page.locator('[data-command-identity="cancel"]').click();assert.deepEqual(await storedLeads(),prior);await casePass('Natural command ambiguity and cancellation produce zero writes');
 await openNatural();await page.locator('[data-command-identity="P0-H-B"]').click();await settled();const after=await storedLeads();assert.deepEqual(after.find(x=>x.id==='P0-H-A'),prior.find(x=>x.id==='P0-H-A'));assert.ok(after.find(x=>x.id==='P0-H-B').interactions.length>prior.find(x=>x.id==='P0-H-B').interactions.length);await casePass('Explicit homonym B choice writes only B');
 // Split high-throughput fixtures into two real process lifecycles; preserve production's
 // 30 writes/minute limit instead of bypassing it or fabricating acknowledgements.
 await settled();const beforeRestart=await storedLeads();await restartIsolatedServer();assert.deepEqual(await storedLeads(),beforeRestart);assert.deepEqual((await history()).find(q=>q.id===savedB.id),savedB);await casePass('Actual isolated process restart retains signed session, leads and immutable quotation');
 // The actual CSV review UI must preserve punctuation-bearing identities and commit atomically.
 await nav('crm');
 const csv={name:'P0-A_FICTIONAL.csv',mimeType:'text/csv',buffer:Buffer.from('Código OG;Empresa;E-mail\nP0-EMAIL-A;Import EMAIL FICTICIO A;a.b@p0a.invalid\nP0-EMAIL-B;Import EMAIL FICTICIO B;a-b@p0a.invalid\n')};
 const openCsv=async()=>{await page.locator('#crm-excel-file').setInputFiles(csv);await page.locator('#crm-excel-preview-panel').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelectorAll('#crm-excel-preview-body tr').length===2);};
 const beforeCsv=await storedLeads();await openCsv();assert.deepEqual(await storedLeads(),beforeCsv);acceptDialogs=false;await page.locator('#crm-excel-apply').click();acceptDialogs=true;assert.deepEqual(await storedLeads(),beforeCsv,'Cancellation after review must not write a partial batch');await casePass('CSV review and cancellation are read-only/atomic');
 await page.locator('#crm-excel-apply').click();await settled();const imported=(await storedLeads()).filter(x=>x.internalCode==='P0-EMAIL-A'||x.internalCode==='P0-EMAIL-B');assert.equal(imported.length,2);assert.notEqual(imported[0].id,imported[1].id);assert.deepEqual(new Set(imported.map(x=>x.email)),new Set(['a.b@p0a.invalid','a-b@p0a.invalid']));
 await page.locator('#crm-excel-close').click();await openCsv();const beforeRepeat=await storedLeads();await page.locator('#crm-excel-apply').click();assert.deepEqual(await storedLeads(),beforeRepeat,'Repeated CSV cannot duplicate or overwrite existing entities');await page.locator('#crm-excel-close').click();await casePass('Native CSV separates a.b/a-b emails and repeat import is idempotent');
 const openLegacy=async text=>{const tools=page.locator('details.crm-tools-menu').filter({has:page.locator('#btn-crm-import-modal')});if(!await tools.evaluate(e=>e.open))await tools.locator('summary').click();await page.locator('#btn-crm-import-modal').click();await page.locator('#textarea-leads-import').fill(text);await page.locator('#btn-process-import').click();await page.locator('#crm-excel-preview-panel').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelectorAll('#crm-excel-preview-body tr').length===1);};
 const legacyText='Contato FICTICIO IMPORT;Empresa IMPORT FICTICIA;;Cidade FICTICIA / PR';const beforeLegacy=await storedLeads();await openLegacy(legacyText);assert.deepEqual(await storedLeads(),beforeLegacy,'Legacy Process button is preview only');await page.locator('#crm-excel-close').click();assert.deepEqual(await storedLeads(),beforeLegacy);await casePass('Legacy text Process and preview cancellation produce no write');
 await openLegacy(legacyText);await page.locator('#crm-excel-apply').click();await settled();const legacy=(await storedLeads()).filter(x=>x.empresa==='Empresa IMPORT FICTICIA');assert.equal(legacy.length,1);assert.equal(legacy[0].nome,'Contato FICTICIO IMPORT');await page.locator('#crm-excel-close').click();await openLegacy(legacyText);const beforeLegacyRepeat=await storedLeads();await page.locator('#crm-excel-apply').click();assert.deepEqual(await storedLeads(),beforeLegacyRepeat);await page.locator('#crm-excel-close').click();await casePass('Native legacy text uses shared preview; repeated company is never silently duplicated');
 const deleted=imported.find(x=>x.internalCode==='P0-EMAIL-B');await page.locator('#crm-search-input').fill(deleted.empresa);await page.locator(`[data-lead-id="${deleted.id}"]`).check();await page.locator('#btn-batch-delete').click();await settled();assert.ok(!(await storedLeads()).some(x=>x.id===deleted.id));await page.locator('#crm-search-input').fill('');const survivors=new Set((await storedLeads()).map(x=>x.id));await openLegacy('Contato FICTICIO NOVO;Empresa IMPORT APOS DELETE;;Cidade FICTICIA / PR');await page.locator('#crm-excel-apply').click();await settled();const createdAfterDelete=(await storedLeads()).find(x=>x.empresa==='Empresa IMPORT APOS DELETE');assert.ok(createdAfterDelete);assert.ok(!survivors.has(createdAfterDelete.id));assert.notEqual(createdAfterDelete.id,deleted.id);const allIds=(await storedLeads()).map(x=>x.id);assert.equal(new Set(allIds).size,allIds.length);await page.locator('#crm-excel-close').click();await casePass('Delete followed by native import preserves surviving IDs and creates a distinct canonical ID');
 const originals=(await storedLeads()).find(x=>x.id==='P0-A');assert.equal(originals.observacoes,'REGISTRO PRIVADO FICTICIO A');assert.ok(originals.interactions.some(i=>i.id==='P0-HISTORY-A'));assert.deepEqual((await operations()).generatedDocuments.filter(d=>d.documentType==='proposal_tracking'&&d.clientId==='P0-A'),historicalA);assert.deepEqual((await operations()).generatedDocuments.filter(d=>d.documentType==='proposal_tracking'&&d.clientId==='P0-B'),immutableB);await casePass('Prior CRM history and historical A/B proposals remain unchanged');
 assert.deepEqual(result.pageErrors,[]);assert.equal(result.externalRequests,0);assert.equal(result.externalLaunches,0);result.status='PASS';await writeFile(path.join(artifacts,'result.json'),JSON.stringify(result,null,2));console.log('Commercial identity native browser regressions PASS');
}catch(error){result.status='FAIL';result.failure=error.message;result.stateResponses=stateResponses.slice(-10);if(page)try{result.diagnostic=await page.evaluate(async()=>{const queued=await OG_SYNC_BRIDGE.readQueuedState();return {hash:location.hash,sync:{mode:document.querySelector('#og-sync-status')?.dataset.mode,text:document.querySelector('#og-sync-status')?.textContent},leadIds:(JSON.parse(localStorage.getItem('og_leads_crm'))||[]).map(x=>x.id),queued:queued?{keys:Object.keys(queued),revision:queued.revision,leadIds:queued.payload?.leads?.map(x=>x.id)}:null};});}catch{}await writeFile(path.join(artifacts,'result.json'),JSON.stringify(result,null,2));throw error;}
finally{await browser?.close();server.kill('SIGTERM');await rm(dir,{recursive:true,force:true});}
