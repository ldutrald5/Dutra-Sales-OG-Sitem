import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { applyHostedSeed, mergeSeedLeads } from '../scripts/apply-hosted-seed.mjs';

const merged = mergeSeedLeads(
  [{ id:'EXIST', empresa:'Existente', telefone:'44999990000', internalCode:'000123', observacoes:'Humana', interactions:[{id:'I1'}] }],
  [
    { id:'IMP1', empresa:'Importada', telefone:'44999990000', internalCode:'123', cidadeUf:'Maringá/PR', observacoes:'Importada', interactions:[{id:'I2'}] },
    { id:'IMP2', empresa:'Nova', telefone:'44988887777', internalCode:'456', conversationStage:'first_contact' }
  ]
);
assert.equal(merged.leads.length,2);
assert.equal(merged.matched,1);
assert.equal(merged.added,1);
assert.equal(merged.leads[0].id,'EXIST');
assert.equal(merged.leads[0].observacoes,'Humana','texto humano existente deve prevalecer');
assert.equal(merged.leads[0].cidadeUf,'Maringá/PR','campo vazio pode ser enriquecido');
assert.deepEqual(merged.leads[0].interactions,[{id:'I1'}],'interações existentes não podem ser inventadas/substituídas');

const conflictingCode = mergeSeedLeads(
  [{ id:'CODE-A', empresa:'JOSE CARLOS', internalCode:'8374' }],
  [{ id:'CODE-B', empresa:'VERBO DA VIDA TRANSPORTES RODOVIARIOS LTDA', internalCode:'008374' }]
);
assert.equal(conflictingCode.leads.length,2,'mesmo código com empresas incompatíveis deve ficar separado para revisão');
assert.equal(conflictingCode.matched,0);
assert.equal(conflictingCode.ambiguous,1);
assert.equal(conflictingCode.leads[1].importMeta.seedConflictingCodeMatch,true);

const compatibleCode = mergeSeedLeads(
  [{ id:'CODE-C', empresa:'TIRAFINATRANSPORTESLTDA', internalCode:'009359' }],
  [{ id:'CODE-D', empresa:'TIRAFINA TRANSPORTES LTDA', internalCode:'9359', email:'contato@example.com' }]
);
assert.equal(compatibleCode.leads.length,1,'mesmo código com grafia compatível deve conciliar');
assert.equal(compatibleCode.matched,1);
assert.equal(compatibleCode.leads[0].email,'contato@example.com');

const compatibleContactIdentity = mergeSeedLeads(
  [{ id:'CODE-E', empresa:'CÉSAR MULLER', internalCode:'13486' }],
  [{ id:'CODE-F', empresa:'COM BEBIDAS CEOLATO L', nome:'CÉSAR MULLER', internalCode:'13486', email:'compras@example.com' }]
);
assert.equal(compatibleContactIdentity.leads.length,1,'contato conhecido com mesmo código deve conciliar com a empresa');
assert.equal(compatibleContactIdentity.matched,1);
assert.equal(compatibleContactIdentity.leads[0].email,'compras@example.com');

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'og-seed-'));
const volume=path.join(tmp,'volume');
fs.mkdirSync(volume,{recursive:true});
const fallback={
  revision:1,updatedAt:'2026-09-27T05:30:21.617Z',
  leads:[{id:'OLD1',empresa:'Scratch',telefone:'111'}],
  history:[],
  operations:{schemaVersion:2,activityEvents:[{id:'E1'}]}
};
const payload={
  seedId:'crm-og-test',
  sourceSha256:'abc',
  fallbackState:fallback,
  leads:[{id:'NEW1',empresa:'Cliente A',telefone:'222',conversationStage:'first_contact'}],
  reviewSummary:{orphanContacts:1}
};
const b64=zlib.gzipSync(Buffer.from(JSON.stringify(payload))).toString('base64');
const env={RAILWAY_VOLUME_MOUNT_PATH:volume,OG_STATE_SEED_GZIP_B64_1:b64.slice(0,Math.ceil(b64.length/2)),OG_STATE_SEED_GZIP_B64_2:b64.slice(Math.ceil(b64.length/2))};
const applied=applyHostedSeed({env});
assert.equal(applied.status,'applied');
assert.equal(applied.baseRevision,1);
assert.equal(applied.finalLeadCount,2);
assert.equal(applied.revision,2);
const state=JSON.parse(fs.readFileSync(path.join(volume,'shared-state.json'),'utf8'));
assert.equal(state.leads.length,2);
assert.equal(state.leads[0].id,'OLD1');
assert.equal(state.leads[1].id,'NEW1');
assert.equal(state.operations.activityEvents[0].id,'E1');
assert.ok(fs.existsSync(applied.backupFile),'backup pré-seed deve existir');
const second=applyHostedSeed({env});
assert.equal(second.status,'already_applied','seed deve ser idempotente');
assert.equal(JSON.parse(fs.readFileSync(path.join(volume,'shared-state.json'),'utf8')).revision,2,'reboot não reaplica seed');

console.log('Hosted seed import tests: PASS');


const tmpRoot=fs.mkdtempSync(path.join(os.tmpdir(),'og-seed-root-'));
const currentRootState={
  revision:6,updatedAt:'2026-09-27T15:43:05.963Z',
  leads:[{id:'LIVE1',empresa:'Lead vivo',telefone:'44999991111'}],
  history:[],
  operations:{schemaVersion:2,activityEvents:[{id:'LIVE-EVT'}]}
};
fs.writeFileSync(path.join(tmpRoot,'shared-state.json'),JSON.stringify(currentRootState,null,2));
const payloadRoot={
  seedId:'crm-og-root-test',
  sourceSha256:'root',
  leads:[{id:'NEW2',empresa:'Cliente Novo',telefone:'44988882222',conversationStage:'first_contact'}]
};
const b64Root=zlib.gzipSync(Buffer.from(JSON.stringify(payloadRoot))).toString('base64');
const rootResult=applyHostedSeed({env:{RAILWAY_VOLUME_MOUNT_PATH:tmpRoot,OG_STATE_SEED_GZIP_B64:b64Root}});
assert.equal(rootResult.baseRevision,6,'estado persistente atual deve ser preservado');
assert.equal(rootResult.finalLeadCount,2);
const rootState=JSON.parse(fs.readFileSync(path.join(tmpRoot,'shared-state.json'),'utf8'));
assert.equal(rootState.revision,7);
assert.equal(rootState.leads[0].id,'LIVE1');
assert.equal(rootState.operations.activityEvents[0].id,'LIVE-EVT');

console.log('Hosted seed volume-root compatibility: PASS');

const corruptRoot=fs.mkdtempSync(path.join(os.tmpdir(),'og-seed-corrupt-root-'));
const durableState={
  revision:7,
  updatedAt:'2026-09-27T22:19:34.768Z',
  leads:[{id:'LIVE-SAFE',empresa:'Persistido'}],
  history:[],
  operations:{schemaVersion:2,activityEvents:[{id:'SAFE-EVT'}]}
};
const durableFile=path.join(corruptRoot,'shared-state.json');
fs.writeFileSync(durableFile,JSON.stringify(durableState,null,2));
const durableBefore=fs.readFileSync(durableFile,'utf8');
const skipped=applyHostedSeed({
  env:{
    RAILWAY_VOLUME_MOUNT_PATH:corruptRoot,
    OG_STATE_SEED_GZIP_B64_1:'bm90LWEtZ3ppcC1wYXlsb2Fk'
  }
});
assert.equal(skipped.status,'invalid_seed_skipped','seed corrompido não pode derrubar runtime com estado persistente válido');
assert.equal(skipped.reason,'valid_persistent_state_present');
assert.equal(skipped.baseRevision,7);
assert.equal(skipped.finalLeadCount,1);
assert.equal(fs.readFileSync(durableFile,'utf8'),durableBefore,'estado persistente deve permanecer byte a byte intacto');
assert.equal(fs.existsSync(path.join(corruptRoot,'.seed-history')),false,'seed inválido ignorado não cria marcador');
assert.equal(fs.existsSync(path.join(corruptRoot,'backups')),false,'seed inválido ignorado não cria backup desnecessário');

const corruptNoState=fs.mkdtempSync(path.join(os.tmpdir(),'og-seed-corrupt-empty-'));
assert.throws(
  ()=>applyHostedSeed({env:{RAILWAY_VOLUME_MOUNT_PATH:corruptNoState,OG_STATE_SEED_GZIP_B64:'bm90LWEtZ3ppcA=='}}),
  /incorrect header check|invalid block type|unexpected end of file|unknown compression method|invalid distance|invalid stored block lengths/i,
  'sem estado persistente válido o seed corrompido deve continuar falhando de forma explícita'
);

const emptyStateRoot=fs.mkdtempSync(path.join(os.tmpdir(),'og-seed-corrupt-empty-state-'));
fs.writeFileSync(path.join(emptyStateRoot,'shared-state.json'),JSON.stringify({revision:0,updatedAt:null,leads:[],history:[],operations:{}},null,2));
assert.throws(
  ()=>applyHostedSeed({env:{RAILWAY_VOLUME_MOUNT_PATH:emptyStateRoot,OG_STATE_SEED_GZIP_B64:'bm90LWEtZ3ppcA=='}}),
  /incorrect header check|invalid block type|unexpected end of file|unknown compression method|invalid distance|invalid stored block lengths/i,
  'estado vazio inicial não deve esconder seed corrompido durante uma migração'
);

console.log('Hosted corrupt-seed guard tests: PASS');

// An operations-only pilot store is user work, even without a lead/revision yet.
const opsOnlyRoot=fs.mkdtempSync(path.join(os.tmpdir(),'og-seed-ops-only-'));
try {
  const existing={revision:0,updatedAt:null,leads:[],history:[],operations:{quotes:[{id:'QA-QUOTE',clientId:'QA-CUSTOMER',items:[{id:'QA-PIECE',quantity:2}]}]}};
  fs.writeFileSync(path.join(opsOnlyRoot,'shared-state.json'),JSON.stringify(existing));
  const payload={seedId:'QA-OPS-PRESERVE',leads:[],fallbackState:{revision:2,leads:[{id:'QA-FALLBACK'}],history:[],operations:{quotes:[]}}};
  const result=applyHostedSeed({env:{OG_DATA_DIR:opsOnlyRoot,RAILWAY_VOLUME_MOUNT_PATH:opsOnlyRoot,OG_STATE_SEED_GZIP_B64:zlib.gzipSync(JSON.stringify(payload)).toString('base64')}});
  const state=JSON.parse(fs.readFileSync(path.join(opsOnlyRoot,'shared-state.json')));
  assert.notEqual(result.baseSource,'fallbackState');
  assert.deepEqual(state.operations,existing.operations);
  assert.equal(state.leads.length,0,'fallback may not replace a quote-only store');
  const replay=applyHostedSeed({env:{OG_DATA_DIR:opsOnlyRoot,OG_STATE_SEED_GZIP_B64:zlib.gzipSync(JSON.stringify(payload)).toString('base64')}});
  assert.equal(replay.status,'already_applied');
  console.log('Hosted operations-only preservation + repeat marker: PASS');
}finally{fs.rmSync(opsOnlyRoot,{recursive:true,force:true});}

const noIdentifiers=mergeSeedLeads([{id:'QA-ID-ONLY',empresa:'QA Empresa',interactions:[{id:'QA-HUMAN'}]}],[{id:'QA-ID-ONLY',empresa:'QA Empresa importada',email:'qa@example.invalid'}]);
assert.equal(noIdentifiers.leads.length,1,'canonical ID must make identifier-free import idempotent');
assert.equal(noIdentifiers.matched,1);assert.equal(noIdentifiers.leads[0].empresa,'QA Empresa');
assert.deepEqual(noIdentifiers.leads[0].interactions,[{id:'QA-HUMAN'}]);
assert.equal(noIdentifiers.leads[0].email,'qa@example.invalid');
assert.equal(mergeSeedLeads(noIdentifiers.leads,[{id:'QA-ID-ONLY',empresa:'QA Empresa importada'}]).leads.length,1);
console.log('Hosted canonical ID priority/idempotent enrichment: PASS');

const manualContacts = [{name:'Pessoa A',phone:'000001',notes:'manual A'}, {name:'Pessoa B',phone:'000001',notes:'manual B'}];
const sharedPhoneLead = {id:'SHARED-CENTRAL',contacts:manualContacts,additionalPhones:[{phone:'000001',notes:'manual1'},{phone:'000001',notes:'manual2'}]};
const incomingContacts = {...sharedPhoneLead,contacts:[...manualContacts,{name:'Pessoa C',phone:'000001',notes:'source'}]};
const contactRestore = mergeSeedLeads([sharedPhoneLead],[incomingContacts]);
assert.deepEqual(contactRestore.leads[0].contacts,[...manualContacts,incomingContacts.contacts[2]],'distinct people sharing a switchboard and all existing notes must survive restoration');
assert.deepEqual(contactRestore.leads[0].additionalPhones,sharedPhoneLead.additionalPhones,'existing phone records must remain intact');
assert.deepEqual(mergeSeedLeads(contactRestore.leads,[incomingContacts]).leads[0].contacts,contactRestore.leads[0].contacts,'retry must not append contacts a second time');
console.log('Hosted seed existing contact/switchboard preservation and retry: PASS');
