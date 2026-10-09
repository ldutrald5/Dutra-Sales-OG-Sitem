import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,rm,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const impacto=process.env.OG_DOCUMENT_THEME==='impacto-og';
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
  const seed=supplied || {...empty,leads:[{id:'FAKE-PROPOSAL-A',nome:'Cliente A',empresa:impacto?'Transportadora Horizonte · CENÁRIO ILUSTRATIVO':'Empresa sintética A',status:'contatado',interactions:[]},{id:'FAKE-PROPOSAL-B',nome:'Cliente B',empresa:'Empresa sintética B',status:'contatado',interactions:[]}],history:[]};
  const eligible=seed.leads.filter(lead=>privateFile ? lead.importMeta?.pilotReal===true&&!/^DEMO-/.test(lead.id) : true);
  assert.ok(eligible.length>=2);
  const [clientA,clientB]=eligible;
  seed.operations ||= {};seed.operations.materials ||= [];
  seed.operations.materials.push({id:'QA-CLIENT-LOGO',clientId:clientA.id,title:'Logo QA sintético autorizado (fixture)',mediaType:'image',status:'approved',audience:'customer_authorized',consentRef:'Autorização sintética de fixture isolada',contentVersion:'qa-1',localAsset:{id:'QA-CLIENT-LOGO',type:'image/png'}});
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
  {if(!await root.locator('.proposal-presentation-settings').evaluate(el=>el.open))await root.locator('.proposal-presentation-settings summary').click();await root.locator('[data-presentation-theme]').selectOption('classic');}
  assert.equal(await root.locator('[data-presentation-theme]').inputValue(),'classic');
  assert.equal(await root.locator('[data-proposal-client-id]').getAttribute('data-proposal-client-id'),clientA.id);
  assert.equal(await root.locator('[data-proposal-roi-status]').getAttribute('data-proposal-roi-status'),'validate');
  assert.equal(await root.locator('[data-proposal-scope="cavalo"]').count(),1);assert.equal(await root.locator('[data-proposal-scope="carreta"]').count(),1);
  await root.locator('[data-proposal-prepare]').click();await settled();
  const first=(await documents())[0],firstFrozen=structuredClone(first),firstHistory=(await history())[0];
  assert.equal(first.clientId,clientA.id);assert.equal(first.snapshot.commercial.totalValue,6490);assert.equal(first.version,1);assert.equal(first.snapshot.roi.status,'validate');
  await root.locator('[data-proposal-current]').click();
  await root.locator('[data-proposal-term="paymentTerms"]').fill('Condição revisada do cenário');await root.locator('[data-proposal-term="paymentTerms"]').press('Tab');
  if(impacto){await root.locator('[data-presentation-theme]').selectOption('impacto-og');await root.locator('[data-roi-channel="fuel"]').check();}
  for(const [key,value] of Object.entries(impacto?{tirePrice:2000,lifeMonths:18,lifeGainPct:20,fuelMonthlyCost:10000,fuelSavingPct:2}:{tirePrice:2000,lifeMonths:24,lifeGainPct:25})) await fill(`[data-roi-field="${key}"]`,value);
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
  const artifacts=process.env.OG_BROWSER_ARTIFACT_DIR||'/tmp/dutra-stage81-export';await mkdir(artifacts,{recursive:true});
  const preserved=structuredClone(second),preservedHistory=await history();
  await page.evaluate(async()=>{const canvas=document.createElement('canvas');canvas.width=300;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#bd1724';ctx.fillRect(0,0,300,80);ctx.fillStyle='#fff';ctx.font='bold 32px Arial';ctx.fillText('LOGO QA',45,52);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));await OG_MATERIAL_STORE.put('QA-CLIENT-LOGO',blob);});
  if(!await root.locator('.proposal-presentation-settings').evaluate(el=>el.open))await root.locator('.proposal-presentation-settings summary').click();
  await root.locator('[data-presentation-logo]').selectOption('QA-CLIENT-LOGO');
  await page.waitForFunction(()=>document.querySelector('[data-presentation-logo-status]')?.textContent.includes('conteúdo verificado'));
  assert.equal(await root.locator('.proposal-preview img[alt="Logo autorizado do cliente"]').count(),1);
  await root.locator('[data-proposal-prepare]').click();await settled();
  const logoVersion=(await documents())[0];assert.equal(logoVersion.version,3);assert.match(logoVersion.snapshot.presentation.branding.sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(logoVersion.snapshot.vehicles,second.snapshot.vehicles);assert.deepEqual(logoVersion.snapshot.commercial,second.snapshot.commercial);assert.deepEqual(logoVersion.snapshot.roi,second.snapshot.roi);assert.deepEqual((await documents()).find(d=>d.id===second.id),preserved);
  await fill('[data-presentation-text="title"]','Proposta profissional · revisão de apresentação');
  await fill('[data-presentation-text="introduction"]','Composição revisada para o cliente, preservando a cotação original.');
  await root.locator('[data-presentation-template]').selectOption('executivo');
  assert.equal(await root.locator('.client-document').getAttribute('data-template'),'executivo');
  assert.equal(await root.locator('[data-proposal-scope]').count(),0);
  await root.locator('[data-presentation-section="roi"]').uncheck();assert.equal(await root.locator('[data-proposal-roi-status]').count(),0);
  await root.locator('[data-presentation-template]').selectOption('compacto');assert.equal(await root.locator('.client-document').getAttribute('data-template'),'compacto');
  await root.locator('[data-presentation-template]').selectOption('tecnico');assert.equal(await root.locator('[data-proposal-scope]').count(),2);assert.equal(await root.locator('[data-proposal-roi-status]').getAttribute('data-proposal-roi-status'),'ready');
  if(impacto)await fill('[data-presentation-text="title"]','');
  await root.locator('[data-presentation-section="assumptions"]').uncheck();assert.equal(await root.locator('.proposal-preview [data-section="assumptions"]').count(),0);
  await root.locator('[data-proposal-prepare]').click();await settled();
  const visualVersion=(await documents())[0];assert.equal(visualVersion.version,4);assert.equal(visualVersion.snapshot.presentation.text.title,impacto?'':'Proposta profissional · revisão de apresentação');assert.deepEqual(visualVersion.snapshot.commercial,second.snapshot.commercial);assert.deepEqual(visualVersion.snapshot.roi,second.snapshot.roi);assert.deepEqual(visualVersion.snapshot.vehicles,second.snapshot.vehicles);assert.deepEqual(await history(),preservedHistory);
  await nav('dia');await reopen();await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');await settled();await reopen();
  assert.equal(await root.locator('[data-presentation-template]').inputValue(),'tecnico');assert.equal(await root.locator('[data-presentation-text="title"]').inputValue(),visualVersion.snapshot.presentation.text.title);assert.equal(await root.locator('[data-presentation-section="assumptions"]').isChecked(),false);assert.deepEqual((await documents()).find(d=>d.id===visualVersion.id),visualVersion);
  await page.waitForFunction(()=>document.querySelector('[data-presentation-logo-status]')?.textContent.includes('conteúdo verificado'));
  // White preview and Ctrl+P share exactly the same snapshot-derived document.
  assert.equal(await root.locator('.proposal-preview .client-document').innerHTML(),await page.locator('#official-proposal-print .client-document').innerHTML());
  if(impacto){
    await root.locator('details:has(.proposal-version-list) summary').click();
    await root.locator(`[data-proposal-open="${first.id}"]`).click();
    assert.equal(await root.locator('.client-document').getAttribute('data-theme'),null,'Legacy version is never silently restyled');
    assert.deepEqual((await documents()).find(doc=>doc.id===first.id),firstFrozen);
    await root.locator('details:has(.proposal-version-list) summary').click();
    await root.locator(`[data-proposal-open="${visualVersion.id}"]`).click();
    await page.waitForFunction(()=>document.querySelector('.proposal-preview .impacto-hero')?.src.startsWith('data:image'));
  }
  for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]]){
    await page.setViewportSize({width,height});await root.locator('.proposal-preview').scrollIntoViewIfNeeded();
    const fits=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);if(!fits){await page.screenshot({path:path.join(artifacts,`${width}-overflow.png`)});await writeFile(path.join(artifacts,'overflow.json'),JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,class:el.className?.baseVal??el.className,left:r.left,right:r.right,width:r.width,scroll:el.scrollWidth};}).filter(r=>r.width&&r.right>innerWidth+1)),null,2));}assert.ok(fits,`${width}: no horizontal overflow`);
    const dimensions=await root.locator('.proposal-preview').evaluate(el=>({width:el.getBoundingClientRect().width,background:getComputedStyle(el.querySelector('.client-document')).backgroundColor}));assert.equal(dimensions.background,'rgb(255, 255, 255)');if(width>=1440)assert.ok(dimensions.width>600,`${width}: productive preview width`);
    await page.screenshot({path:path.join(artifacts,`${width}x${height}-preview.png`)});
    await root.locator('[data-proposal-prepare]').click();
    if(width<1024){const toast=page.locator('.og-toast');assert.ok(await toast.isVisible());const toastBox=await toast.boundingBox(),navBox=await page.locator('.og-mobile-nav').boundingBox();assert.ok(toastBox.y+toastBox.height<navBox.y,'Feedback does not overlap bottom nav');assert.equal(await toast.evaluate(el=>getComputedStyle(el).position),'static');assert.ok(await toast.evaluate(el=>el.parentElement.classList.contains('brand-header')));await page.screenshot({path:path.join(artifacts,`${width}x${height}-feedback.png`)});}
  }
  await page.setViewportSize({width:1440,height:900});await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.brand-header').isVisible(),false);assert.equal(await page.locator('.og-mobile-nav').isVisible(),false);assert.equal(await page.locator('#official-proposal-print').isVisible(),true);
  await page.pdf({path:path.join(artifacts,'proposal-white.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});await page.emulateMedia({media:'screen'});
  // PNG's actual UI path renders finite A4 images, without app chrome or sends.
  if(impacto){
    assert.equal(visualVersion.snapshot.presentation.themeVersion,1);
    assert.equal(visualVersion.snapshot.roi.assumptions.fields.lifeMonths.value,18);
    assert.equal(visualVersion.snapshot.roi.assumptions.fields.lifeGainPct.value,20);
    assert.ok(Math.abs(visualVersion.snapshot.roi.monthlySavings-1014.8148148148148)<0.000001);
    assert.match(await root.locator('[data-proposal-payback]').innerText(),/6,40 meses/);
    assert.equal(await root.locator('.impacto-premise').count(),5,'Premises cannot disappear when optional detailed method is hidden');
    assert.equal(await root.locator('[data-media-kind="tractor"] .impacto-vehicle-art').count(),1);
    assert.equal(await root.locator('[data-media-kind="trailer"] svg.impacto-trailer').count(),1);
    assert.ok(!JSON.stringify(visualVersion.snapshot).includes('data:image'));
    await writeFile(path.join(artifacts,'snapshot.json'),JSON.stringify(visualVersion.snapshot,null,2));
    await page.waitForFunction(()=>!document.querySelector('.og-toast'));
    for(const [width,height,label] of [[390,844,'mobile'],[1440,900,'desktop']]){
      await page.setViewportSize({width,height});
      for(const [selector,name] of [['.impacto-opening','opening'],['.impacto-vehicle-card','composition'],['[data-kind=roi]','return']]){await root.locator(selector).first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(artifacts,`${label}-${name}.png`)});}
    }
    await page.setViewportSize({width:1440,height:900});
  }
  const exportsBefore=await documents();await root.locator('[data-proposal-png]').click();await page.waitForFunction(()=>document.querySelector('[data-proposal-export-status]')?.textContent.includes('imagem(ns) pronta'));
  const pages=await root.locator('[data-proposal-export-page] option').count();assert.ok(pages>=2&&pages<=24,'Technical document paginated rather than giant bitmap');
  for(let i=0;i<pages;i++){if(pages>1)await root.locator('[data-proposal-export-page]').selectOption(String(i));const downloaded=page.waitForEvent('download');await root.locator('[data-proposal-download-png]').click();await (await downloaded).saveAs(path.join(artifacts,`proposal-page-${i+1}.png`));}
  assert.deepEqual(await documents(),exportsBefore,'Export neither creates a version nor sends');assert.equal((await operations()).activityEvents.filter(e=>e.type==='proposal.sent').length,0);
  // Verify rendered bitmap pixels: white page, actual text and client raster logo.
  const pngs=await Promise.all(Array.from({length:pages},(_,i)=>readFile(path.join(artifacts,`proposal-page-${i+1}.png`))));
  const pixels=await page.evaluate(async data=>{const results=[];for(const src of data){const image=new Image();image.src='data:image/png;base64,'+src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;let dark=0,red=0,yellow=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]<100&&pixels[i+1]<100&&pixels[i+2]<100)dark++;if(pixels[i]>220&&pixels[i+1]>170&&pixels[i+2]<70)yellow++;if(pixels[i]>140&&pixels[i+1]<80&&pixels[i+2]<90)red++;}results.push({width:image.width,height:image.height,white:[...pixels.slice(0,4)],dark,red,yellow});}return results;},pngs.map(p=>p.toString('base64')));
  for(const result of pixels){assert.equal(result.width,1588);assert.equal(result.height,2246);assert.deepEqual(result.white,[255,255,255,255]);assert.ok(result.dark>1000,'Raster contains real rendered text');assert.ok(result.red>1000,'Raster preserves approved client logo');}
  // Capture the actual UI print iframe before opening a native dialog.
  await page.evaluate(()=>{window.__printCalls=0;const append=Element.prototype.append;Element.prototype.append=function(...nodes){const result=append.apply(this,nodes);for(const node of nodes)if(node.tagName==='IFRAME'&&node.title==='Impressão da proposta'){node.contentWindow.print=()=>{window.__printCalls++;window.__printDocument=node.contentDocument.documentElement.outerHTML;};}return result;};});
  await root.locator('[data-proposal-pdf]').click();await page.waitForFunction(()=>window.__printCalls===1);
  const printedHtml=await page.evaluate(()=>window.__printDocument);await writeFile(path.join(artifacts,'proposal-export.html'),printedHtml);assert.ok(printedHtml.includes('background:#fff'));assert.ok(!printedHtml.includes('<button'));assert.ok(!printedHtml.includes('og-mobile-nav'));
  const printPage=await context.newPage();await printPage.setContent(printedHtml);await printPage.emulateMedia({media:'print'});await printPage.evaluate(async()=>Promise.all(Array.from(document.images,image=>image.decode())));
  assert.equal(await printPage.locator('.client-paper-page').count(),pages);
  await printPage.pdf({path:path.join(artifacts,'proposal-print-pages.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
  const pdfBytes=await readFile(path.join(artifacts,'proposal-print-pages.pdf'));
  assert.equal((pdfBytes.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,pages,'Each logical print page produces exactly one PDF page');
  const printedText=await printPage.locator('body').innerText();assert.match(printedText,/EQ-1135/);assert.match(printedText,/6.490,00/);assert.match(printedText,impacto?/1.014,81/:/733,33/);await printPage.close();
  await page.locator('iframe[title="Impressão da proposta"]').evaluateAll(nodes=>nodes.forEach(node=>node.remove()));
  if(impacto){
    const additional=await page.evaluate(async record=>{
      const api=OG_PROPOSAL_DOCUMENT;
      const media=await api.resolveMedia(record.snapshot.presentation);
      const host=document.createElement('div');host.style.cssText='width:390px;background:white';document.body.append(host);
      const cases=[];
      for(const type of ['toco_4x2','bitrem_7eixos','trucado_carreta3','rodotrem']){
        const snapshot=structuredClone(record.snapshot);
        snapshot.vehicles[0].vehicleTypeId=type;
        host.innerHTML=api.documentHtml(snapshot,record,{media});
        cases.push({type,kind:host.querySelector('[data-media-kind]')?.dataset.mediaKind,fallback:!!host.querySelector('[data-media-unavailable]')});
      }
      host.innerHTML=api.documentHtml(record.snapshot,record,{media:{hero:'',tractor:''}});
      const missing={fallback:!!host.querySelector('[data-media-unavailable]'),total:host.querySelector('[data-proposal-total]').textContent,images:host.querySelectorAll('img').length};
      const long=structuredClone(record.snapshot);
      long.presentation.text.observation='Observação comercial de teste de paginação. '.repeat(40);
      // Repeating existing bounded presentation rows stresses pagination without a parallel calculation.
      long.vehicles=Array.from({length:8},(_,i)=>({...structuredClone(record.snapshot.vehicles[i%2]),id:`LONG-ISOLATED-${i}`}));
      const paginated=api.paginate(long,{...record,id:'QA-PAGINATION-ONLY'},{media});
      host.remove();
      const oversized=structuredClone(long);oversized.vehicles=Array.from({length:40},(_,i)=>({...structuredClone(long.vehicles[i%8]),id:`CAP-${i}`}));
      let cap='';try{api.paginate(oversized,record,{media});}catch(error){cap=error.message;}
      return {cases,missing,pages:paginated.pages,cap};
    },visualVersion);
    assert.equal(additional.cases[0].kind,'tractor');assert.ok(additional.cases.slice(1).every(item=>item.fallback));
    assert.equal(additional.missing.images,0);assert.match(additional.missing.total,/6.490,00/);
    assert.ok(additional.pages.length>pages&&additional.pages.length<=24);assert.match(additional.cap,/excede 24 páginas/);
    const longPage=await context.newPage();await longPage.setContent(`<style>${await page.evaluate(()=>OG_PROPOSAL_DOCUMENT.css)}</style>${additional.pages.join('')}`);
    await longPage.evaluate(async()=>Promise.all(Array.from(document.images,image=>image.decode())));
    await longPage.pdf({path:path.join(artifacts,'proposal-long-pagination.pdf'),format:'A4',printBackground:true,preferCSSPageSize:true});
    const longPdf=await readFile(path.join(artifacts,'proposal-long-pagination.pdf'));
    assert.equal((longPdf.toString('latin1').match(/\/Type\s*\/Page\b/g)||[]).length,additional.pages.length);
    await longPage.close();await writeFile(path.join(artifacts,'additional-cases.json'),JSON.stringify({...additional,pages:additional.pages.length},null,2));
    assert.ok(pixels.some(page=>page.yellow>10000),'Rendered PNG retains yellow identity');
  }
  // Missing and overwritten local assets never silently replace historical branding.
  const branding=visualVersion.snapshot.presentation.branding;
  const assetBefore=await page.evaluate(async()=>{const asset=await OG_MATERIAL_STORE.get('QA-CLIENT-LOGO');return [...new Uint8Array(await asset.blob.arrayBuffer())];});
  await page.evaluate(async()=>OG_MATERIAL_STORE.put('QA-CLIENT-LOGO',new Blob(['bad-image'],{type:'image/png'})));
  const changed=await page.evaluate(async ref=>OG_PROPOSAL_DOCUMENT.resolveLogo(ref,JSON.parse(localStorage.getItem('og_operations_state')).materials,OG_MATERIAL_STORE),branding);assert.equal(changed.data,'');assert.match(changed.status,/Conteúdo.*alterado/);
  await page.evaluate(async()=>OG_MATERIAL_STORE.remove('QA-CLIENT-LOGO'));
  const missing=await page.evaluate(async ref=>OG_PROPOSAL_DOCUMENT.resolveLogo(ref,JSON.parse(localStorage.getItem('og_operations_state')).materials,OG_MATERIAL_STORE),branding);assert.equal(missing.data,'');
  await page.evaluate(async data=>OG_MATERIAL_STORE.put('QA-CLIENT-LOGO',new Blob([new Uint8Array(data)],{type:'image/png'})),assetBefore);
  // Held export for A cannot produce a download in the new B context.
  const staleText=await root.locator('[data-presentation-text="title"]').elementHandle();
  await page.evaluate(()=>{const get=OG_MATERIAL_STORE.get;window.__getOriginal=get;OG_MATERIAL_STORE.get=async id=>{window.__exportWaiting=true;await new Promise(resolve=>window.__releaseExport=resolve);return get(id);};});
  await root.locator('[data-proposal-png]').click();await page.waitForFunction(()=>window.__exportWaiting===true);
  await nav('guia');await page.locator('#technical-client').selectOption(clientB.id);await page.locator('[data-technical-scope="cavalo"]').click();await page.locator('#technical-vehicle').selectOption('toco_4x2');await page.locator('#consultant-libras-select').selectOption('120');await page.locator('#consultant-include-dianteira').uncheck();await page.locator('[data-qid="brand"][data-val="volvo"]').click();await page.locator('#btn-inject-consultant-to-quote').click();await page.waitForURL('**/#cotacao');await settled();
  await staleText.evaluate(node=>{node.value='STALE TEXT';node.dispatchEvent(new Event('change',{bubbles:true}));});await page.evaluate(()=>{OG_MATERIAL_STORE.get=window.__getOriginal;window.__releaseExport();});
  assert.equal(await root.locator('[data-proposal-client-id]').getAttribute('data-proposal-client-id'),clientB.id);assert.equal(await root.locator('[data-presentation-text="title"]').inputValue(),'');assert.equal(await root.locator('[data-proposal-download-png]').isVisible(),false);
  assert.deepEqual((await documents()).find(d=>d.id===visualVersion.id),visualVersion);assert.deepEqual((await documents()).find(d=>d.id===second.id),preserved);assert.ok(Buffer.byteLength(JSON.stringify(visualVersion.snapshot))<35000);assert.deepEqual(errors,[]);assert.equal(external,0);
  await writeFile(path.join(artifacts,'result.json'),JSON.stringify({status:'PASS',realFixture:Boolean(privateFile),viewports:8,pages,pixels,investment:visualVersion.snapshot.commercial.totalValue,roiPreserved:true,versionsImmutable:true,theme:impacto?'impacto-og':'classic',externalRequests:external},null,2));
  console.log(`Proposal export browser ${privateFile?'REAL isolated canonical fixture':'synthetic'}: three templates, scoped/fingerprinted logo, visibility/text, immutable v4/reopen/reload, white PDF, ${pages} PNG pages/pixels, eight views/toast/nav, stale export/client safety and no sends PASS`);
  await context.close();
} finally {await browser?.close();server.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});}
