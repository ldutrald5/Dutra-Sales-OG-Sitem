/* Deterministic recovery safety regressions. Only disposable synthetic state. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import store from '../apps/sistema-og/server-state-store.cjs';
import model from '../apps/sistema-og/operations-model.js';
const repo=fileURLToPath(new URL('../',import.meta.url));
const root=fs.mkdtempSync(path.join(os.tmpdir(),'og-review-adversarial-'));
const state=(id,revision=1)=>({revision,updatedAt:null,leads:[{id,empresa:'EMPRESA FICTICIA '+id}],history:[],operations:model.createEmptyOperations('2026-11-09T00:00:00Z')});
const a=state('SYN-A'),foreign=state('SYN-B',9),results=[];
const portable=path.join(root,'a.json');fs.writeFileSync(portable,JSON.stringify(store.createRecoveryBackup(a)));
function test(name,finding,fn){const evidence={};try{fn(evidence);results.push({name,finding,status:'PASS',evidence});console.log(name+' PASS');}catch(error){results.push({name,finding,status:'FAIL',message:error.message,evidence});console.log(name+' FAIL: '+error.message);}}
function controlledRestore(target,onMarker){const original=fs.openSync;let injected=false,result,error;fs.openSync=(file,...args)=>{if(!injected&&String(file).startsWith(path.join(target,'shared-state.json')+'.initialized.tmp.')){injected=true;onMarker();}return original(file,...args);};try{result=store.restoreBackup(portable,target);}catch(e){error=e.code||e.message;}finally{fs.openSync=original;}return{injected,result,error};}
try{
 test('Concurrent creation after empty check must not overwrite a different destination','F01',e=>{const target=path.join(root,'race-target');fs.mkdirSync(target);const file=path.join(target,'shared-state.json');Object.assign(e,controlledRestore(target,()=>fs.writeFileSync(file,JSON.stringify(foreign))));e.injectedOwner=foreign.leads[0].id;e.after=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(e.injected,true);assert.equal(e.error,'STATE_RECOVERY_REFUSED');assert.deepEqual(e.after,foreign);assert.equal(e.after.leads[0].id,foreign.leads[0].id,'a concurrent different company was overwritten by restore');});
 test('Directory symlink replacement after validation must not overwrite another directory','F01',e=>{const target=path.join(root,'swap-target'),victim=path.join(root,'separate-fixture');fs.mkdirSync(target);fs.mkdirSync(victim);const victimFile=path.join(victim,'shared-state.json');fs.writeFileSync(victimFile,JSON.stringify(foreign));Object.assign(e,controlledRestore(target,()=>{fs.renameSync(target,target+'.before-swap');fs.symlinkSync(victim,target,'dir');}));e.targetIsNowSymlink=fs.lstatSync(target).isSymbolicLink();e.after=JSON.parse(fs.readFileSync(victimFile,'utf8'));assert.equal(e.injected,true);assert.equal(e.error,'STATE_RECOVERY_REFUSED');assert.deepEqual(e.after,foreign);assert.equal(e.after.leads[0].id,foreign.leads[0].id,'restore followed the changed directory and overwrote its existing state');});
 const cli=(args,extra={})=>spawnSync(process.execPath,[path.join(repo,'scripts/crm-state-recovery.mjs'),...args],{cwd:repo,env:{PATH:process.env.PATH,HOME:'/home/qa',TMPDIR:'/tmp',LANG:'C.UTF-8',...extra},encoding:'utf8'});
 test('CLI must reject every hosted signal recognized by the existing server','F02',e=>{const source=path.join(root,'source');fs.mkdirSync(source);fs.writeFileSync(path.join(source,'shared-state.json'),JSON.stringify(a));const expr=/^const hostedMode = (.+);$/m.exec(fs.readFileSync(path.join(repo,'apps/sistema-og/server.mjs'),'utf8'))[1];e.cases=[];for(const key of [...new Set([...expr.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map(match=>match[1]))]){const environment={[key]:'synthetic.invalid'};const output=path.join(root,key+'.json'),r=cli(['export','--source-dir',source,'--backup-file',output,'--confirm-local'],environment);e.cases.push({key,serverHosted:vm.runInNewContext(expr,{process:{env:environment}}),cliExit:r.status,exportCreated:fs.existsSync(output),stdout:r.stdout.trim()});}assert.ok(e.cases.length>=4,'the server hosted predicate must supply actual cases');assert.ok(e.cases.every(x=>x.serverHosted&&x.cliExit!==0&&!x.exportCreated),'CLI exported while the actual server predicate classified the environment as hosted');});
 test('Removing a checksummed explicit-null timestamp must not change restored metadata','F03',e=>{const b=store.createRecoveryBackup(a);e.originalTimestamp=store.stateFromBackup(b).updatedAt;e.integrityBefore=b.integrity.value;delete b.stateUpdatedAt;try{const restored=store.stateFromBackup(b);e.accepted=true;e.restoredTimestamp=restored.updatedAt;e.integrityAfter=b.integrity.value;}catch(error){e.accepted=false;e.error=error.code;}assert.ok(!e.accepted||e.restoredTimestamp===e.originalTimestamp,'unchanged checksum accepted a different restored updatedAt');});
 test('Control: known full hosted flags and missing confirmation do refuse without writes',null,e=>{e.cases=[];for(const environment of [{RAILWAY_ENVIRONMENT_ID:'synthetic'},{RAILWAY_PROJECT_ID:'synthetic'},{NODE_ENV:'production'}]){const output=path.join(root,'must-not-exist-'+e.cases.length+'.json'),r=cli(['restore','--backup-file',portable,'--target-dir',output,'--confirm-local'],environment);e.cases.push({keys:Object.keys(environment),exit:r.status,created:fs.existsSync(output)});assert.notEqual(r.status,0);assert.equal(fs.existsSync(output),false);}const target=path.join(root,'no-confirm'),r=cli(['restore','--backup-file',portable,'--target-dir',target]);assert.notEqual(r.status,0);assert.equal(fs.existsSync(target),false);});
 test('Unsupported atomic publication fails closed and retains initialization evidence',null,e=>{
  e.cases=[];
  for(const failAt of ['marker','state']) {
   const target=path.join(root,'unsupported-'+failAt),original=fs.linkSync;let caught;
   fs.linkSync=(source,destination,...args)=>{
    const marker=String(destination).endsWith('.initialized');
    if(marker===(failAt==='marker'))throw Object.assign(new Error('Synthetic unsupported hardlink'),{code:'EOPNOTSUPP'});
    return original(source,destination,...args);
   };
   try{store.restoreBackup(portable,target);}catch(error){caught=error.code;}finally{fs.linkSync=original;}
   assert.equal(caught,'STATE_RECOVERY_REFUSED');
   assert.equal(fs.existsSync(path.join(target,'shared-state.json')),false);
   if(failAt==='state')assert.throws(()=>store.createStateStore(target).read(),{code:'STATE_STORAGE_UNAVAILABLE'});
   e.cases.push({failAt,error:caught,files:fs.readdirSync(target)});
  }
 });
 test('Control: newly restored private directory/file permissions are 0700/0600',null,e=>{const target=path.join(root,'mode-check');store.restoreBackup(portable,target);e.directoryMode=(fs.statSync(target).mode&0o777).toString(8);e.stateMode=(fs.statSync(path.join(target,'shared-state.json')).mode&0o777).toString(8);e.markerMode=(fs.statSync(path.join(target,'shared-state.json.initialized')).mode&0o777).toString(8);assert.equal(e.directoryMode,'700');assert.equal(e.stateMode,'600');assert.equal(e.markerMode,'600');});
}finally{if(process.env.OG_STORAGE_ARTIFACTS){fs.mkdirSync(process.env.OG_STORAGE_ARTIFACTS,{recursive:true});fs.writeFileSync(path.join(process.env.OG_STORAGE_ARTIFACTS,'review-result.json'),JSON.stringify({classification:'SYNTHETIC_RECOVERY_REVIEW_REGRESSIONS',results},null,2));}console.log(JSON.stringify({classification:'SYNTHETIC_RECOVERY_REVIEW_REGRESSIONS',results}));fs.rmSync(root,{recursive:true,force:true});}
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
