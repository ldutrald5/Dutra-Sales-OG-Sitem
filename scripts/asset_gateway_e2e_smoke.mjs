import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const gateway=require('../apps/sistema-og/server-asset-gateway.cjs');

const CONFIRM='YES_I_AM_USING_A_DISPOSABLE_BRANCH';
const legacyLeadId=String(process.env.OG_ASSET_E2E_LEGACY_LEAD_ID||'').trim();

if(process.env.OG_ASSET_E2E_ALLOW_WRITE!==CONFIRM){
  throw new Error('E2E bloqueado. Defina OG_ASSET_E2E_ALLOW_WRITE='+CONFIRM+' somente em branch Supabase descartável.');
}
if(!legacyLeadId.startsWith('ASSET-E2E-')){
  throw new Error('OG_ASSET_E2E_LEGACY_LEAD_ID deve começar com ASSET-E2E-.');
}
const cfg=gateway.cfg(process.env);
if(!cfg.enabled)throw new Error('OG_SUPABASE_URL e OG_SUPABASE_SERVICE_ROLE_KEY são obrigatórios.');
if(!/\.supabase\.co$/i.test(new URL(cfg.base).hostname))throw new Error('OG_SUPABASE_URL inválida.');

const png=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlEeKkAAAAASUVORK5CYII=',
  'base64'
);
const pngV2=Buffer.concat([png,Buffer.from('asset-e2e-v2')]);

const health=await gateway.health(process.env);
assert.equal(health.error,null,'Asset Gateway health deve estar saudável antes do smoke.');

const created=await gateway.createAssetWithUpload(
  {legacyLeadId},
  {
    mimeType:'image/png',
    originalFilename:'asset-e2e.png',
    businessCategory:'FLEET',
    sourceType:'MANUAL_UPLOAD',
    title:'Asset E2E',
    usagePolicy:'INTERNAL_REFERENCE',
    sensitivityLevel:'NORMAL'
  },
  png,
  process.env
);
assert.equal(created.status,201,created.error||'Falha ao criar Asset E2E.');
const assetId=created.data.asset.id;
assert.ok(assetId);

const listed=await gateway.listAssets({legacyLeadId},{limit:10},process.env);
assert.equal(listed.error,null);
const row=listed.data.items.find(item=>item.id===assetId);
assert.ok(row,'Asset criado deve aparecer na listagem.');
assert.equal(Object.hasOwn(row.currentVersion||{},'storage_path'),false,'Listagem não pode expor storage_path.');
assert.equal(Object.hasOwn(row.currentVersion||{},'sha256'),false,'Listagem não pode expor sha256.');

const signed=await gateway.signAsset(assetId,{ttl:120},process.env);
assert.equal(signed.error,null);
assert.match(signed.data.url,/^https?:\/\//);
assert.equal(signed.data.expiresIn,120);

const replaced=await gateway.replaceAssetFile(
  assetId,
  {mimeType:'image/png',originalFilename:'asset-e2e-v2.png'},
  pngV2,
  process.env
);
assert.equal(replaced.error,null);
assert.equal(Number(replaced.data.version.version_number),2);

const primary=await gateway.setPrimary(assetId,process.env);
assert.equal(primary.error,null);
assert.equal(primary.data.is_primary,true);

const archived=await gateway.setStatus(assetId,'ARCHIVED',process.env);
assert.equal(archived.error,null);
assert.equal(archived.data.status,'ARCHIVED');

const deleted=await gateway.setStatus(assetId,'DELETED',process.env);
assert.equal(deleted.error,null);
assert.equal(deleted.data.status,'DELETED');

console.log(JSON.stringify({
  ok:true,
  assetId,
  legacyLeadId,
  version:replaced.data.version.version_number,
  signedUrlTtl:signed.data.expiresIn,
  finalStatus:deleted.data.status
},null,2));
