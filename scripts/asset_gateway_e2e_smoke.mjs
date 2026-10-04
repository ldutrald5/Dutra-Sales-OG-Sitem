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

const host=new URL(cfg.base).hostname;
const disposableHost=/^(127\.0\.0\.1|localhost)$/i.test(host)||/\.supabase\.co$/i.test(host);
if(!disposableHost)throw new Error('OG_SUPABASE_URL inválida para smoke descartável.');

const anonKey=String(process.env.OG_ASSET_E2E_ANON_KEY||'').trim();
if(!anonKey)throw new Error('OG_ASSET_E2E_ANON_KEY é obrigatório para validar bloqueio de browser.');

const CONTACT_ID='33333333-3333-4333-8333-333333333333';
const OPPORTUNITY_ID='44444444-4444-4444-8444-444444444444';
const PROPOSAL_ID='55555555-5555-4555-8555-555555555555';
const OTHER_COMPANY_PROPOSAL_ID='66666666-6666-4666-8666-666666666666';
const ACTIVITY_ID='77777777-7777-4777-8777-777777777777';

const png=Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlEeKkAAAAASUVORK5CYII=',
  'base64'
);
const pngV2=Buffer.concat([png,Buffer.from('asset-e2e-v2')]);

const health=await gateway.health(process.env);
assert.equal(health.error,null,'Asset Gateway health deve estar saudável antes do smoke.');

const mismatch=await gateway.createAssetWithUpload(
  {legacyLeadId},
  {mimeType:'application/pdf',originalFilename:'nao-e-pdf.pdf',businessCategory:'COMMERCIAL_DOCUMENT'},
  png,
  process.env
);
assert.equal(mismatch.status,400);
assert.match(mismatch.error,/não corresponde/i);

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

const duplicate=await gateway.createAssetWithUpload(
  {legacyLeadId},
  {
    mimeType:'image/png',
    originalFilename:'asset-e2e-duplicate.png',
    businessCategory:'FLEET'
  },
  png,
  process.env
);
assert.equal(duplicate.status,409);
assert.equal(duplicate.data.duplicateAssetId,assetId);

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

const signedRead=await fetch(signed.data.url);
assert.equal(signedRead.ok,true,'Signed URL deve ler o objeto privado.');
const signedBytes=Buffer.from(await signedRead.arrayBuffer());
assert.equal(signedBytes.equals(png),true,'Signed URL deve devolver os bytes corretos.');

const internalVersion=await gateway.rest(
  'asset_versions?id=eq.'+encodeURIComponent(created.data.asset.current_version_id)
  +'&select=id,storage_bucket,storage_path&limit=1',
  {},
  process.env
);
assert.equal(internalVersion.error,null);
const privateVersion=internalVersion.data?.[0];
assert.ok(privateVersion?.storage_path);

const objectPath=privateVersion.storage_path.split('/').map(encodeURIComponent).join('/');
const anonStorage=await fetch(
  cfg.base+'/storage/v1/object/'+encodeURIComponent(privateVersion.storage_bucket)+'/'+objectPath,
  {headers:{apikey:anonKey,authorization:'Bearer '+anonKey}}
);
assert.equal(anonStorage.ok,false,'Objeto privado não pode ser lido diretamente como anon.');

const anonDb=await fetch(
  cfg.base+'/rest/v1/assets?select=id&limit=1',
  {headers:{apikey:anonKey,authorization:'Bearer '+anonKey}}
);
assert.equal(anonDb.ok,false,'Tabela assets não pode ser lida diretamente como anon.');

const replaced=await gateway.replaceAssetFile(
  assetId,
  {mimeType:'image/png',originalFilename:'asset-e2e-v2.png'},
  pngV2,
  process.env
);
assert.equal(replaced.error,null);
assert.equal(Number(replaced.data.version.version_number),2);
assert.ok(replaced.data.version.id);

const contactLink=await gateway.createAssetLink(assetId,{
  contactId:CONTACT_ID,
  role:'REFERENCE'
},process.env);
assert.equal(contactLink.status,201,contactLink.error||'Falha no link de Contact.');

const opportunityLink=await gateway.createAssetLink(assetId,{
  opportunityId:OPPORTUNITY_ID,
  role:'EVIDENCE'
},process.env);
assert.equal(opportunityLink.status,201,opportunityLink.error||'Falha no link de Opportunity.');

const proposalLink=await gateway.createAssetLink(assetId,{
  proposalId:PROPOSAL_ID,
  role:'PROPOSAL_INPUT'
},process.env);
assert.equal(proposalLink.status,201,proposalLink.error||'Falha no link de Proposal.');
assert.equal(
  proposalLink.data.pinned_version_id,
  replaced.data.version.id,
  'Proposal precisa fixar exatamente a versão atual utilizada.'
);

const activityLink=await gateway.createAssetLink(assetId,{
  activityId:ACTIVITY_ID,
  role:'VISIT_PHOTO'
},process.env);
assert.equal(activityLink.status,201,activityLink.error||'Falha no link de Activity.');

const temporaryLink=await gateway.createAssetLink(assetId,{
  contactId:CONTACT_ID,
  role:'OTHER'
},process.env);
assert.equal(temporaryLink.status,201);
const removedLink=await gateway.deleteAssetLink(temporaryLink.data.id,process.env);
assert.equal(removedLink.status,200);

const links=await gateway.listAssetLinks(assetId,process.env);
assert.equal(links.error,null);
assert.equal(links.data.length,4);
assert.equal(links.data.filter(link=>link.proposal_id).length,1);

const crossCompany=await gateway.createAssetLink(assetId,{
  proposalId:OTHER_COMPANY_PROPOSAL_ID,
  role:'PROPOSAL_INPUT'
},process.env);
assert.notEqual(crossCompany.error,null,'Link para Proposal de outra Company deve ser rejeitado.');
assert.ok([400,409].includes(Number(crossCompany.status))||Number(crossCompany.status)>=400);

const primary=await gateway.setPrimary(assetId,process.env);
assert.equal(primary.error,null);
assert.equal(primary.data.is_primary,true);

const archived=await gateway.setStatus(assetId,'ARCHIVED',process.env);
assert.equal(archived.error,null);
assert.equal(archived.data.status,'ARCHIVED');

const signedArchived=await gateway.signAsset(assetId,{ttl:60},process.env);
assert.notEqual(signedArchived.error,null,'Asset arquivado não deve emitir nova signed URL.');

const afterArchive=await gateway.listAssets({legacyLeadId},{limit:10},process.env);
assert.equal(afterArchive.error,null);
assert.equal(afterArchive.data.items.some(item=>item.id===assetId),false,'Asset arquivado não deve aparecer na galeria padrão.');

const deleted=await gateway.setStatus(assetId,'DELETED',process.env);
assert.equal(deleted.error,null);
assert.equal(deleted.data.status,'DELETED');

console.log(JSON.stringify({
  ok:true,
  assetId,
  legacyLeadId,
  version:replaced.data.version.version_number,
  signedUrlTtl:signed.data.expiresIn,
  contextualLinks:links.data.length,
  anonDbBlocked:!anonDb.ok,
  anonStorageBlocked:!anonStorage.ok,
  crossCompanyBlocked:Boolean(crossCompany.error),
  finalStatus:deleted.data.status
},null,2));
