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
const env={RAILWAY_VOLUME_MOUNT_PATH:volume,OG_DATA_DIR:path.join(volume,'sistema-og'),OG_STATE_SEED_GZIP_B64_1:b64.slice(0,Math.ceil(b64.length/2)),OG_STATE_SEED_GZIP_B64_2:b64.slice(Math.ceil(b64.length/2))};
const applied=applyHostedSeed({env});
assert.equal(applied.status,'applied');
assert.equal(applied.baseRevision,1);
assert.equal(applied.finalLeadCount,2);
assert.equal(applied.revision,2);
const state=JSON.parse(fs.readFileSync(path.join(volume,'sistema-og','shared-state.json'),'utf8'));
assert.equal(state.leads.length,2);
assert.equal(state.leads[0].id,'OLD1');
assert.equal(state.leads[1].id,'NEW1');
assert.equal(state.operations.activityEvents[0].id,'E1');
assert.ok(fs.existsSync(applied.backupFile),'backup pré-seed deve existir');
const second=applyHostedSeed({env});
assert.equal(second.status,'already_applied','seed deve ser idempotente');
assert.equal(JSON.parse(fs.readFileSync(path.join(volume,'sistema-og','shared-state.json'),'utf8')).revision,2,'reboot não reaplica seed');

console.log('Hosted seed import tests: PASS');
