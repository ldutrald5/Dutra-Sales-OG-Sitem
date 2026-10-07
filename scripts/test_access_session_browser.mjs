import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
const {chromium}=createRequire(import.meta.url)('playwright');
const dataDir=await mkdtemp(path.join(os.tmpdir(),'og-session-browser-data-'));
const profile=await mkdtemp(path.join(os.tmpdir(),'og-session-browser-profile-'));
const port=await new Promise(resolve=>{const s=net.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://localhost:${port}`;
let server,context;
async function start(){
 server=spawn(process.execPath,['apps/sistema-og/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,OG_PORT:String(port),OG_HOST:'127.0.0.1',OG_DATA_DIR:dataDir,OG_PERSISTENT_AUTH:'true',OG_ISOLATED_PREVIEW:'true',OG_LOCAL_ACCESS_TOKEN:'artificial-browser-test-key-not-production',OG_LOCAL_ACCESS_PIN:'123456'},stdio:'pipe'});
 await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('server startup timeout')),10000);server.stdout.on('data',b=>{if(String(b).includes('Sistema OG no computador')){clearTimeout(t);resolve();}});server.once('exit',code=>{clearTimeout(t);reject(new Error(`server exited ${code}`));});});
}
async function stop(){if(server&&!server.killed)await new Promise(resolve=>{server.once('exit',resolve);server.kill();});}
async function launch(){return chromium.launchPersistentContext(profile,{executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox'],serviceWorkers:'allow',viewport:{width:390,height:844}});}
try {
 await start();
 assert.equal((await fetch(base+'/api/state',{headers:{Authorization:'Bearer 123456'}})).status,401,'PIN must enter rate-limited login, never bearer API in session mode');
 for (const suffix of ['/.data/shared-state.json','/.data/access-sessions.json','/%2edata/access-sessions.json']) assert.equal((await fetch(base+suffix)).status,403,'private store must never be a static asset');
 context=await launch();let page=await context.newPage();
 await page.goto(base+'/#dia');await page.locator('#access-session-dialog').waitFor({state:'visible'});
 assert.equal(await page.locator('#access-session-dialog').count(),1);
 await page.locator('[name=pin]').fill('wrong');await page.locator('#access-session-dialog button').click();await page.getByText('PIN incorreto.',{exact:true}).waitFor();
 await page.locator('[name=pin]').fill('123456');await page.locator('#access-session-dialog button').click();await page.locator('#access-session-dialog').waitFor({state:'hidden'});
 await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 const cookies=await context.cookies(base);const session=cookies.find(c=>c.name==='__Host-og_session');
 assert.ok(session?.httpOnly&&session.secure&&session.sameSite==='Strict');assert.ok(session.expires>Date.now()/1000+29*86400);
 assert.ok(!(await page.evaluate(()=>document.cookie)).includes('__Host-og_session'));
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('og_cloud_access_token')),null);assert.equal(await page.evaluate(()=>localStorage.getItem('og_cloud_access_token')),null);
 for(const [width,height]of [[390,844],[1440,900]]){
 await page.setViewportSize({width,height});await page.reload();await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 assert.equal(await page.locator('#access-session-dialog:modal').count(),0);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 await page.evaluate(()=>location.hash='crm');assert.equal(await page.locator('#access-session-dialog:modal').count(),0);
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 let nativePrompts=0;page.on('dialog',async dialog=>{nativePrompts++;await dialog.dismiss();});
 await context.setOffline(true);await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='offline');
 await page.reload();await page.waitForFunction(()=>document.body.dataset.shellReady==='true');
 assert.ok(await page.evaluate(()=>window.OG_ACCESS_SESSION.enabled()),'installed PWA offline startup retains auth mode');
 assert.equal(await page.evaluate(()=>window.OG_RUNTIME?.isolatedPreview),true,'offline PWA boot must retain the explicit isolated external-action boundary');
 assert.equal(await page.evaluate(()=>window.OG_RUNTIME?.pilotRealData),false,'a preview without validated seed and mount cannot claim a real persistent pilot');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('og_cloud_access_token')),null);assert.equal(nativePrompts,0);
 // CDP offline emulation with a controlling SW can set onLine=true without an
 // online event after navigation. Match the existing shell/PWA harness: drive
 // the real reconnect listener explicitly; no status stub or reload fallback.
 await context.setOffline(false);
 assert.ok(await page.evaluate(()=>navigator.onLine));
 await page.evaluate(()=>window.dispatchEvent(new Event('online')));
 await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 assert.equal(await page.evaluate(async()=>(await fetch('/api/state')).status),200);
 await context.close();context=await launch();page=await context.newPage();await page.goto(base+'/#dia');await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');assert.equal(await page.locator('#access-session-dialog:modal').count(),0);
 await stop();await start();await page.reload();await page.waitForFunction(()=>document.querySelector('#og-sync-status').dataset.mode==='ok');
 const bypass=await fetch(base+'/api/state',{method:'PUT',headers:{cookie:`${session.name}=${session.value}`,Authorization:'Bearer invalid',Origin:'https://evil.example','Content-Type':'application/json'},body:JSON.stringify({revision:0,leads:[],history:[]})});assert.equal(bypass.status,403,'invalid bearer cannot bypass cookie origin protection');
 const forbidden=await page.evaluate(async()=>{const r=await fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:999999,leads:[],history:[]})});return r.status;});assert.equal(forbidden,409,'canonical conflict behavior preserved with cookie');
 await page.evaluate(()=>{ delete window.OG_RUNTIME; });assert.ok(await page.evaluate(()=>window.OG_ACCESS_SESSION.enabled()),'offline missing metadata retains non-secret mode');
 await page.locator('#access-session-logout').click();await page.locator('#access-session-dialog').waitFor({state:'visible'});
 const replay=await fetch(base+'/api/state',{headers:{cookie:`${session.name}=${session.value}`}});assert.equal(replay.status,401);
 console.log('Browser auth + installed PWA offline reload: wrong PIN/login/reload/reopen/navigation/offline/reconnect/restart/logout/HTTP409/390x844/1440x900 PASS');
} finally {if(context)await context.close();await stop();await rm(dataDir,{recursive:true,force:true});await rm(profile,{recursive:true,force:true});}
