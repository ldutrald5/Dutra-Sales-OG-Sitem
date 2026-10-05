/* Artificial isolated data only; optional installed developer Playwright/Chromium. */
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const dataDir=await mkdtemp(path.join(os.tmpdir(),'dutra-day-'));
const artifacts=process.env.OG_DAY_ARTIFACTS;
if(artifacts) await mkdir(artifacts,{recursive:true});
const port=await new Promise(resolve=>{const socket=net.createServer();socket.listen(0,'127.0.0.1',()=>{const port=socket.address().port;socket.close(()=>resolve(port));});});
const server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,OG_PORT:String(port),OG_HOST:'127.0.0.1',OG_DATA_DIR:dataDir},stdio:'pipe'});
let browser;
const base=`http://127.0.0.1:${port}`;
const isoDay=delta=>{const date=new Date();date.setUTCDate(date.getUTCDate()+delta);return date.toISOString().slice(0,10)+'T10:00';};
const leads=[
 {id:'QA-A',empresa:'QA Frota Prioritária',nome:'Contato QA',telefone:'44999990001',status:'contatado',priority:'alta',priorityBand:'urgente',conversationStage:'negotiation',nextAction:'Confirmar diagnóstico',nextActionReason:'Retorno combinado vencido',followUpAt:isoDay(-1),interactions:[]},
 {id:'QA-B',empresa:'QA Frota Hoje',nome:'Contato Hoje',telefone:'44999990002',status:'contatado',priority:'alta',priorityBand:'urgente',conversationStage:'negotiation',nextAction:'Retomar conversa',followUpAt:isoDay(0),interactions:[]},
 {id:'QA-C',empresa:'QA Contexto Incompleto',nome:'',telefone:'',status:'novo',priority:'baixa',nextAction:'',followUpAt:'',interactions:[]},
 {id:'QA-D',empresa:'QA Terminal',status:'perdido',priority:'alta',nextAction:'Ação antiga não executar',followUpAt:isoDay(-2),interactions:[]}
];
const ops={tasks:[{id:'QA-TASK',title:'Confirmar placa',status:'open',clientId:'QA-A'}],activityEvents:[
 {id:'QA-P',type:'proposal.prepared',at:new Date().toISOString(),clientId:'QA-A',proposalId:'QA-PREPARED'},
 {id:'QA-M',type:'call.saved',result:'reuniao_agendada',callSessionId:'QA-CALL',clientId:'QA-B',at:new Date().toISOString(),meeting:{scheduledAt:isoDay(1),mode:'online',source:'user_confirmed'}}
]};
try {
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('server timeout')),15000);server.stdout.on('data',chunk=>{if(String(chunk).includes('Sistema OG no computador')){clearTimeout(timer);resolve();}});server.once('error',reject);});
 browser=await chromium.launch({executablePath:process.env.OG_CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(({leads,ops})=>{
   if(!localStorage.getItem('og_leads_crm')) {localStorage.setItem('og_leads_crm',JSON.stringify(leads));localStorage.setItem('og_operations_state',JSON.stringify(ops));}
   window.open=(url)=>{window.__qaOpened=String(url);return null;};
 },{leads,ops});
 const page=await context.newPage(); const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/#dia');await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
 await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 assert.match(await page.locator('#mission-now-title').textContent(),/QA Frota Prioritária/);
 assert.equal(await page.locator('#day-opportunity-list [data-desk-lead]').count(),3);
 assert.equal(await page.locator('#kpi-overdue').textContent(),'1');
 assert.match(await page.locator('#day-commitments').textContent(),/Salva \/ preparada · envio não confirmado/);
 assert.match(await page.locator('#day-commitments').textContent(),/Reuniões/);
 assert.ok(!(await page.locator('#day-opportunity-list').textContent()).includes('QA Terminal'));
 await page.locator('[data-mission-whatsapp]').click();
 assert.match(await page.evaluate(()=>window.__qaOpened),/^https:\/\/wa.me\//);
 const wa=await page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.id==='QA-A'));
 assert.equal(wa.status,'contatado');assert.equal(wa.interactions.filter(x=>x.type==='whatsapp_opened').length,1);
 await page.locator('[data-mission-act]').click();
 await page.locator('#desk-result').selectOption('falar_depois');
 await page.locator('#desk-note').fill('QA retorno confirmado após diagnóstico');
 await page.locator('#desk-next-action').fill('QA confirmar diagnóstico amanhã');
 await page.locator('#desk-follow-mode').selectOption('tomorrow');
 // Native clicks on the same captured DOM button reproduce a stale/double submission.
 await page.locator('#desk-save-advance').evaluate(button=>{button.click();button.click();});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.id==='QA-A'));
 assert.equal(saved.interactions.filter(x=>x.type==='resultado_contato').length,1);
 assert.equal(saved.interactions.filter(x=>x.type==='proxima_acao').length,1);
 assert.equal(saved.nextAction,'QA confirmar diagnóstico amanhã');
 assert.equal(await page.locator('#kpi-overdue').textContent(),'0');
 await page.waitForFunction(()=>document.querySelector('#sales-desk-client h2')?.textContent.includes('QA Frota Hoje'));
 const order=await page.locator('#day-opportunity-list [data-desk-lead]').evaluateAll(nodes=>nodes.map(n=>n.dataset.deskLead));
 assert.equal(order[0],'QA-B','queue must react to canonical result/date score');
 await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.id==='QA-A').nextAction),'QA confirmar diagnóstico amanhã');
 assert.equal(await page.locator('#day-opportunity-list [data-desk-lead]').count(),3);
 await context.setOffline(true);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');
 await page.locator('[data-desk-select="QA-B"]').click();await page.locator('[data-client-register]').click();
 await page.locator('#desk-result').selectOption('nao_atendeu');await page.locator('#desk-next-action').fill('QA novo retorno offline');
 await page.locator('#desk-follow-mode').selectOption('tomorrow');await page.locator('#desk-save-stay').click();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(x=>x.id==='QA-B').nextAction),'QA novo retorno offline');
 await context.setOffline(false);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 const remote=await page.evaluate(async()=>{const r=await fetch('/api/state');return r.json();});
 assert.ok(JSON.stringify(remote).includes('QA novo retorno offline'),'real reconnect must publish supported operation');
 // Explicit terminal outcome clears stale commitments and removes client from queue.
 await page.locator('[data-desk-select="QA-A"]').click();await page.locator('[data-client-register]').click();
 await page.locator('#desk-result').selectOption('venda');await page.locator('#desk-save-stay').click();
 await page.waitForFunction(()=>!document.querySelector('[data-desk-lead="QA-A"]'));
 assert.ok(!(await page.locator('.mission-now').textContent()).includes('QA Frota Prioritária'));
 await page.locator('[data-desk-select="QA-C"]').click();assert.match(await page.locator('.sales-desk-now').textContent(),/REVISAR \/ COMPLETAR CONTEXTO/);
 console.log('Functional: priority/action/result/NBA/reorder/refresh/offline/reconnect/double-click/dedup/terminal/proposal facts PASS');
 for(const [width,height] of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1280,720],[1440,900],[1920,1080]]) {
   await page.setViewportSize({width,height});await page.evaluate(()=>scrollTo(0,0));
   assert.ok(await page.locator('.mission-now').isVisible());
   const mainAction=await page.locator('[data-mission-act]').boundingBox();
   assert.ok(mainAction.y+mainAction.height < height-(width<1024?80:0), `${width}: primary action must be visible above navigation at entry`);
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);assert.ok(overflow<=1,`${width}: overflow ${overflow}`);
   assert.equal(await page.locator('#nav-tabs-container').isVisible(),width>=1024);
   assert.equal(await page.locator('.og-mobile-nav').isVisible(),width<1024);
   if(artifacts) await page.screenshot({path:path.join(artifacts,`${width}-home.png`)});
   await page.locator('[data-client-register]').click();
   const heights=await page.locator('.sales-desk-primary-actions :is(button,a),.mission-quick-actions button,#desk-save-stay,#desk-save-advance').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height>0).map(n=>n.getBoundingClientRect().height));
   assert.ok(heights.every(h=>h>=44),`${width}: quick actions >=44px`);
   await page.locator('#desk-result').focus();assert.equal(await page.evaluate(()=>document.activeElement.id),'desk-result');
   if(artifacts){await page.screenshot({path:path.join(artifacts,`${width}x${height}.png`)});await page.locator('#sales-desk-client').screenshot({path:path.join(artifacts,`${width}-context.png`)});}
   console.log(`${width}x${height}: queue/context/navigation/overflow/actions/focus PASS`);
 }
 // A remote concurrent edit must produce review, never overwrite this device.
 await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 await page.evaluate(async()=>{
   const remote=await (await fetch('/api/state')).json();
   remote.leads.find(lead=>lead.id==='QA-B').nextAction='QA alteração em outro aparelho';
   const saved=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(remote)});
   if(!saved.ok)throw new Error('Unable to create isolated remote edit');
 });
 await page.locator('[data-desk-select="QA-B"]').click();await page.locator('[data-client-register]').click();
 await page.locator('#desk-result').selectOption('falar_depois');await page.locator('#desk-next-action').fill('QA manter alteração local em conflito');
 await page.locator('#desk-follow-mode').selectOption('tomorrow');await page.locator('#desk-save-stay').click();
 await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(lead=>lead.id==='QA-B').nextAction),'QA manter alteração local em conflito');
 assert.equal(await page.locator('#og-sync-status').getAttribute('data-mode'),'conflict');
 await page.reload();await page.waitForFunction(()=>Boolean(document.querySelector('#og-sync-conflict-banner')));
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('og_leads_crm')).find(lead=>lead.id==='QA-B').nextAction),'QA manter alteração local em conflito');
 console.log('Concurrent remote edit: actual HTTP409, durable conflict review + refresh, no silent overwrite PASS');
 assert.deepEqual(errors,[]);await context.close();

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
 await np.locator('.nav-tab[data-tab="dia"]').click();await np.locator('[data-desk-select="QA-N"]').click();
 np.once('dialog',dialog=>dialog.dismiss());await np.locator('[data-client-register]').click();
 assert.ok(!(await np.locator('#call-ai-review').isVisible()),'cancelled account switch must not open review for prior identity');
 await np.locator('.nav-tab[data-tab="dia"]').click();
 np.once('dialog',dialog=>dialog.accept());await np.locator('[data-client-register]').click();
 assert.ok(await np.locator('#call-ai-review').isVisible());
 assert.match(await np.locator('#call-ai-summary').inputValue(),/QA Normalized/);
 console.log('Normalized owner bridge: cancel preserves prior notes; accepted switch reviews exact canonical account, no external mutation PASS');
 await normalized.close();
} finally {await browser?.close();server.kill('SIGTERM');await rm(dataDir,{recursive:true,force:true});}
