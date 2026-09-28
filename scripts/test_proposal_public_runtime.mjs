import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const store = require('../apps/sistema-og/server-proposal-store.cjs');
const operationsModel = require('../apps/sistema-og/operations-model.js');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dutra-proposal-'));
const storeFile = path.join(temp, 'unit-public-proposals.json');
const snapshot = {
  schemaVersion:1,
  quoteId:'COT-PUBLIC-1',
  clientId:'LEAD-SECRET-1',
  preparedAt:'2026-09-28T15:00:00.000Z',
  templateId:'vendruscolo',
  client:{name:'Lucas',company:'Transportadora Teste',cnpj:'12.345.678/0001-90',city:'Maringá - PR',internalCode:'15517'},
  commercial:{totalValue:41518,totalPieces:161,freightText:'Incluso',paymentTerms:'6x'},
  vehicles:[{id:'v1',name:'Rodotrem 9 eixos',libras:120,qty:2,items:[{code:'EQ-120',qty:8}]}],
  extraItems:[{code:'EQ-700',qty:1}]
};

const deterministicToken='A'.repeat(43);
const published=store.publish(storeFile,{proposalId:'PROP-COT-PUBLIC-1',clientId:'LEAD-SECRET-1',quoteId:'COT-PUBLIC-1',snapshot},{token:deterministicToken,now:'2026-09-28T15:00:00.000Z',ttlDays:90});
assert.equal(published.token,deterministicToken);
const persisted=fs.readFileSync(storeFile,'utf8');
assert.ok(!persisted.includes(deterministicToken),'token público bruto nunca pode ser persistido');
assert.ok(store.findByToken(storeFile,deterministicToken,{now:'2026-09-28T15:01:00.000Z'}));
assert.equal(store.findByToken(storeFile,'B'.repeat(43),{now:'2026-09-28T15:01:00.000Z'}),null);

let engagement=store.recordEngagement(storeFile,deterministicToken,{type:'open',sessionId:'session_A_123'},{now:'2026-09-28T15:02:00.000Z',id:'PEVT-1'});
assert.equal(engagement.event.type,'proposal.opened');
engagement=store.recordEngagement(storeFile,deterministicToken,{type:'open',sessionId:'session_A_123'},{now:'2026-09-28T15:03:00.000Z',id:'PEVT-DUP'});
assert.equal(engagement.duplicate,true);
engagement=store.recordEngagement(storeFile,deterministicToken,{type:'open',sessionId:'session_B_456'},{now:'2026-09-28T15:04:00.000Z',id:'PEVT-2'});
assert.equal(engagement.event.type,'proposal.reopened');
engagement=store.recordEngagement(storeFile,deterministicToken,{type:'contact_clicked',sessionId:'session_B_456'},{now:'2026-09-28T15:05:00.000Z',id:'PEVT-3'});
assert.equal(engagement.event.type,'proposal.contact_clicked');
const unitEvents=store.listEvents(storeFile);
assert.equal(unitEvents.length,3);
assert.ok(unitEvents.every(item=>item.source==='trusted_server'));
assert.ok(unitEvents.every(item=>!('metadata' in item)),'API interna de eventos não deve devolver sessionId');
store.revoke(storeFile,'PROP-COT-PUBLIC-1',{now:'2026-09-28T15:06:00.000Z'});
assert.equal(store.findByToken(storeFile,deterministicToken,{now:'2026-09-28T15:07:00.000Z'}),null);

const runtimeDir=path.join(temp,'runtime');
fs.mkdirSync(runtimeDir,{recursive:true});
const ops=operationsModel.createEmptyOperations('2026-09-28T15:00:00.000Z');
ops.generatedDocuments.push({
  id:'PROP-COT-RUNTIME-1',
  documentType:'proposal_tracking',
  clientId:'LEAD-RUNTIME-SECRET',
  quoteId:'COT-RUNTIME-1',
  status:'internal_draft',
  version:1,
  preparedAt:'2026-09-28T15:00:00.000Z',
  snapshot:{...snapshot,quoteId:'COT-RUNTIME-1',clientId:'LEAD-RUNTIME-SECRET'},
  publication:{publicEnabled:false,publicToken:null,publicUrl:null,publishedAt:null,revokedAt:null}
});
fs.writeFileSync(path.join(runtimeDir,'shared-state.json'),JSON.stringify({
  revision:0,updatedAt:null,leads:[],history:[],operations:ops
},null,2));

const port=43871;
const child=spawn(process.execPath,['apps/sistema-og/server.mjs'],{
  cwd:path.resolve('.'),
  env:{...process.env,OG_HOST:'127.0.0.1',OG_PORT:String(port),OG_DATA_DIR:runtimeDir,OG_PUBLIC_DOMAIN:'proposal.example.test'},
  stdio:['ignore','pipe','pipe']
});
let childOutput='';
child.stdout.on('data',chunk=>{childOutput+=chunk;});
child.stderr.on('data',chunk=>{childOutput+=chunk;});

async function waitHealth(){
  for(let attempt=0;attempt<50;attempt+=1){
    try{
      const response=await fetch(`http://127.0.0.1:${port}/health`);
      if(response.ok)return;
    }catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Servidor de teste não iniciou: '+childOutput);
}

try{
  await waitHealth();
  let response=await fetch(`http://127.0.0.1:${port}/api/proposals/publish`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({proposalId:'PROP-COT-RUNTIME-1'})
  });
  assert.equal(response.status,201);
  const publication=await response.json();
  assert.match(publication.publicUrl,/^https:\/\/proposal\.example\.test\/p\/[A-Za-z0-9_-]{24,160}$/);
  assert.ok(!('token' in publication),'API de publicação não deve devolver token em campo separado');
  const token=new URL(publication.publicUrl).pathname.split('/').pop();
  const disk=fs.readFileSync(path.join(runtimeDir,'public-proposals.json'),'utf8');
  assert.ok(!disk.includes(token),'runtime também deve persistir apenas hash do token');

  response=await fetch(`http://127.0.0.1:${port}/p/${token}`);
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-security-policy')||'',/default-src 'none'/);
  assert.match(response.headers.get('x-robots-tag')||'',/noindex/);
  const html=await response.text();
  assert.match(html,/Transportadora Teste/);
  assert.match(html,/Proposta rastreável segura/);
  assert.ok(!html.includes('LEAD-RUNTIME-SECRET'),'página pública não pode expor clientId');
  assert.ok(!html.includes('15517'),'página pública não pode expor Código OG');
  assert.ok(!html.includes(token),'token deve existir apenas na URL, não ser embutido no HTML');

  response=await fetch(`http://127.0.0.1:${port}/public-api/proposals/${token}/engagement`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'open',sessionId:'public_session_1'})
  });
  assert.equal(response.status,201);
  assert.equal((await response.json()).type,'proposal.opened');

  response=await fetch(`http://127.0.0.1:${port}/public-api/proposals/${token}/engagement`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'open',sessionId:'public_session_2'})
  });
  assert.equal(response.status,201);
  assert.equal((await response.json()).type,'proposal.reopened');

  response=await fetch(`http://127.0.0.1:${port}/public-api/proposals/${token}/engagement`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({type:'contact_clicked',sessionId:'public_session_2'})
  });
  assert.equal(response.status,201);
  assert.equal((await response.json()).type,'proposal.contact_clicked');

  response=await fetch(`http://127.0.0.1:${port}/api/proposals/events`);
  assert.equal(response.status,200);
  const events=(await response.json()).events;
  assert.ok(events.some(item=>item.type==='proposal.opened'));
  assert.ok(events.some(item=>item.type==='proposal.reopened'));
  assert.ok(events.some(item=>item.type==='proposal.contact_clicked'));
  assert.ok(events.every(item=>!('metadata' in item)));

  response=await fetch(`http://127.0.0.1:${port}/api/proposals/revoke`,{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({proposalId:'PROP-COT-RUNTIME-1'})
  });
  assert.equal(response.status,200);
  response=await fetch(`http://127.0.0.1:${port}/p/${token}`);
  assert.equal(response.status,404);
}finally{
  child.kill('SIGTERM');
  await new Promise(resolve=>{child.once('exit',resolve);setTimeout(resolve,1000);});
  fs.rmSync(temp,{recursive:true,force:true});
}

const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
const htmlSource=fs.readFileSync('apps/sistema-og/index.html','utf8');
const server=fs.readFileSync('apps/sistema-og/server.mjs','utf8');
assert.match(app,/publishActiveProposal/);
assert.match(app,/confirmActiveProposalSent/);
assert.match(app,/syncProposalTrackingEvents/);
assert.match(app,/publicToken:null/);
assert.doesNotMatch(app,/publicToken\s*:\s*result\./,'token público não pode entrar no estado do browser');
assert.match(htmlSource,/id="btn-publish-proposal"/);
assert.match(htmlSource,/id="proposal-tracking-status"/);
assert.match(server,/server-proposal-store\.cjs/);
assert.match(server,/\/api\/proposals\/events/);

console.log('PROP-01B public proposal runtime tests: PASS');
