'use strict';

const { randomUUID, createHash } = require('node:crypto');

const BUCKET = 'account-assets';
const DEFAULT_TIMEOUT = 10000;
const DEFAULT_MAX_BYTES = 15 * 1024 * 1024;
const MAX_LIST_LIMIT = 60;

const MEDIA_KINDS = new Set(['IMAGE','DOCUMENT','VIDEO','AUDIO','ARCHIVE','OTHER']);
const BUSINESS_CATEGORIES = new Set([
  'LOGO','COVER','FLEET','VEHICLE','TIRE','EQUIPMENT','FACILITY','VISIT',
  'BUSINESS_CARD','CONVERSATION','COMMERCIAL_DOCUMENT','PROPOSAL_MATERIAL',
  'MAP','MARKETING','REFERENCE','SOCIAL_PROOF','OTHER'
]);
const SOURCE_TYPES = new Set([
  'MANUAL_UPLOAD','CAMERA','WHATSAPP','CLIENT','VISIT','WEBSITE','GOOGLE_MAPS',
  'PUBLIC_WEB','PROPOSAL','SYSTEM_GENERATED','AI_GENERATED','IMPORT','OTHER'
]);
const VISIBILITY_CLASSES = new Set(['INTERNAL','RESTRICTED','SHAREABLE','PUBLIC_SOURCE']);
const SENSITIVITY_LEVELS = new Set(['NORMAL','PERSONAL_DATA','COMMERCIAL_SENSITIVE','CONFIDENTIAL']);
const USAGE_POLICIES = new Set(['INTERNAL_REFERENCE','PROPOSAL_ALLOWED','MARKETING_ALLOWED','RESTRICTED']);

const MIME = Object.freeze({
  'image/jpeg': { ext:'jpg', mediaKind:'IMAGE' },
  'image/png': { ext:'png', mediaKind:'IMAGE' },
  'image/webp': { ext:'webp', mediaKind:'IMAGE' },
  'image/heic': { ext:'heic', mediaKind:'IMAGE' },
  'image/heif': { ext:'heif', mediaKind:'IMAGE' },
  'application/pdf': { ext:'pdf', mediaKind:'DOCUMENT' },
  'video/mp4': { ext:'mp4', mediaKind:'VIDEO' },
  'video/webm': { ext:'webm', mediaKind:'VIDEO' },
  'audio/mpeg': { ext:'mp3', mediaKind:'AUDIO' },
  'audio/mp4': { ext:'m4a', mediaKind:'AUDIO' },
  'audio/wav': { ext:'wav', mediaKind:'AUDIO' },
  'audio/x-wav': { ext:'wav', mediaKind:'AUDIO' }
});

function clean(value) { return String(value ?? '').trim(); }
function upper(value) { return clean(value).toUpperCase(); }

function cfg(env = process.env) {
  const base = clean(env.OG_SUPABASE_URL || env.SUPABASE_URL).replace(/\/$/, '');
  const key = clean(env.OG_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
  const maxBytes = Math.max(1024, Math.min(100 * 1024 * 1024, Number(env.OG_ASSET_MAX_BYTES) || DEFAULT_MAX_BYTES));
  return { base, key, maxBytes, enabled:Boolean(base && key), bucket:BUCKET };
}

function authHeaders(key, extra = {}) {
  return { apikey:key, authorization:'Bearer ' + key, ...extra };
}

async function withTimeout(fn, env = process.env) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(env.OG_SUPABASE_TIMEOUT_MS) || DEFAULT_TIMEOUT));
  try { return await fn(controller.signal); }
  finally { clearTimeout(timer); }
}

async function parseResponse(response) {
  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); }
    catch { data = raw; }
  }
  const message = typeof data === 'object' && data
    ? (data.message || data.error || data.hint || data.msg)
    : null;
  return { status:response.status, ok:response.ok, data, error:response.ok ? null : clean(message) || ('Supabase HTTP ' + response.status) };
}

async function rest(path, options = {}, env = process.env) {
  const c = cfg(env);
  if (!c.enabled) return { configured:false, status:503, data:null, error:'Asset Gateway não configurado.' };
  return withTimeout(async signal => {
    const response = await fetch(c.base + '/rest/v1/' + path, {
      method:options.method || 'GET',
      headers:authHeaders(c.key, { 'content-type':'application/json', ...(options.headers || {}) }),
      body:options.body === undefined ? undefined : JSON.stringify(options.body),
      signal
    });
    return { configured:true, ...(await parseResponse(response)) };
  }, env);
}

function encodedObjectPath(path) {
  return clean(path).split('/').filter(Boolean).map(encodeURIComponent).join('/');
}

async function storageRequest(path, options = {}, env = process.env) {
  const c = cfg(env);
  if (!c.enabled) return { configured:false, status:503, data:null, error:'Asset Gateway não configurado.' };
  return withTimeout(async signal => {
    const response = await fetch(c.base + '/storage/v1/' + path, {
      method:options.method || 'GET',
      headers:authHeaders(c.key, options.headers || {}),
      body:options.body,
      signal
    });
    return { configured:true, ...(await parseResponse(response)) };
  }, env);
}

function safeUuid(value, label = 'ID') {
  const id = clean(value);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error(label + ' inválido');
  return id.toLowerCase();
}

function safeEnum(value, allowed, fallback, label) {
  const normalized = upper(value || fallback);
  if (!allowed.has(normalized)) throw new Error(label + ' inválido');
  return normalized;
}

function safeText(value, max, label) {
  const v = clean(value);
  if (!v) return null;
  if (v.length > max) throw new Error(label + ' excede ' + max + ' caracteres');
  return v;
}

function normalizeMime(value) { return clean(value).toLowerCase().split(';')[0]; }

function mediaForMime(mime) {
  const normalized = normalizeMime(mime);
  const spec = MIME[normalized];
  if (!spec) throw new Error('Tipo de arquivo não permitido no MVP: ' + (normalized || 'desconhecido'));
  return { mimeType:normalized, ...spec };
}

function safeFilename(value, ext) {
  const raw = clean(value).replace(/[\u0000-\u001f\u007f]/g, '');
  const leaf = raw.split(/[\\/]/).pop() || ('arquivo.' + ext);
  return leaf.slice(0, 500);
}

function buildStoragePath(companyId, assetId, versionId, ext) {
  return 'companies/' + safeUuid(companyId,'companyId')
    + '/assets/' + safeUuid(assetId,'assetId')
    + '/versions/' + safeUuid(versionId,'versionId')
    + '.' + clean(ext).toLowerCase().replace(/[^a-z0-9]/g,'');
}

function encodeCursor(item) {
  if (!item?.created_at || !item?.id) return null;
  return Buffer.from(JSON.stringify({ createdAt:item.created_at, id:item.id }), 'utf8').toString('base64url');
}

function decodeCursor(value) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    if (Number.isNaN(Date.parse(parsed.createdAt))) throw new Error();
    return { createdAt:new Date(parsed.createdAt).toISOString(), id:safeUuid(parsed.id,'cursor.id') };
  } catch {
    throw new Error('Cursor inválido');
  }
}

async function resolveCompany(ref = {}, env = process.env) {
  let query;
  if (ref.companyId) {
    const id = safeUuid(ref.companyId,'companyId');
    query = 'companies?id=eq.' + encodeURIComponent(id) + '&select=id,name,legacy_lead_id&limit=1';
  } else {
    const legacy = safeText(ref.legacyLeadId, 160, 'legacyLeadId');
    if (!legacy) throw new Error('companyId ou legacyLeadId é obrigatório');
    query = 'companies?legacy_lead_id=eq.' + encodeURIComponent(legacy) + '&select=id,name,legacy_lead_id&limit=2';
  }
  const result = await rest(query, {}, env);
  if (result.error) return result;
  const rows = Array.isArray(result.data) ? result.data : [];
  if (!rows.length) return { configured:true, status:404, data:null, error:'Company canônica não encontrada' };
  if (rows.length > 1) return { configured:true, status:409, data:null, error:'legacyLeadId ambíguo; revisão necessária' };
  return { configured:true, status:200, data:rows[0], error:null };
}

function normalizeMetadata(input = {}, mimeType) {
  const spec = mediaForMime(mimeType);
  const sourceType = safeEnum(input.sourceType, SOURCE_TYPES, 'MANUAL_UPLOAD', 'sourceType');
  let businessCategory = safeEnum(input.businessCategory, BUSINESS_CATEGORIES, 'OTHER', 'businessCategory');
  if (sourceType === 'WHATSAPP' && businessCategory === 'OTHER') businessCategory = 'CONVERSATION';
  return {
    title:safeText(input.title, 240, 'title'),
    description:safeText(input.description, 5000, 'description'),
    mediaKind:safeEnum(input.mediaKind || spec.mediaKind, MEDIA_KINDS, spec.mediaKind, 'mediaKind'),
    businessCategory,
    sourceType,
    visibilityClass:safeEnum(input.visibilityClass, VISIBILITY_CLASSES, 'INTERNAL', 'visibilityClass'),
    sensitivityLevel:safeEnum(input.sensitivityLevel, SENSITIVITY_LEVELS, 'NORMAL', 'sensitivityLevel'),
    usagePolicy:safeEnum(input.usagePolicy, USAGE_POLICIES, 'INTERNAL_REFERENCE', 'usagePolicy'),
    sourceUrl:safeText(input.sourceUrl, 2000, 'sourceUrl'),
    capturedAt:input.capturedAt && !Number.isNaN(Date.parse(input.capturedAt)) ? new Date(input.capturedAt).toISOString() : null,
    originalFilename:safeFilename(input.originalFilename, spec.ext),
    mimeType:spec.mimeType,
    ext:spec.ext
  };
}

function validateBytes(bytes, env = process.env) {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes || []);
  const maxBytes = cfg(env).maxBytes;
  if (!buffer.length) throw new Error('Arquivo vazio');
  if (buffer.length > maxBytes) throw new Error('Arquivo excede o limite de ' + Math.ceil(maxBytes / 1024 / 1024) + ' MB');
  return buffer;
}

function validateContentSignature(buffer, mimeType) {
  const b = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer || []);
  const mime = normalizeMime(mimeType);
  const ascii = (start, end) => b.subarray(start,end).toString('ascii');
  let ok = true;

  if (mime === 'image/jpeg') ok = b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  else if (mime === 'image/png') ok = b.length >= 8 && b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));
  else if (mime === 'image/webp') ok = b.length >= 12 && ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP';
  else if (mime === 'application/pdf') ok = b.length >= 5 && ascii(0,5) === '%PDF-';
  else if (mime === 'image/heic' || mime === 'image/heif') {
    const brand = ascii(8,16).toLowerCase();
    ok = b.length >= 12 && ascii(4,8) === 'ftyp' && /(heic|heix|hevc|hevx|mif1|msf1|heif|heis)/.test(brand);
  } else if (mime === 'video/mp4' || mime === 'audio/mp4') ok = b.length >= 12 && ascii(4,8) === 'ftyp';
  else if (mime === 'video/webm') ok = b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3;
  else if (mime === 'audio/mpeg') ok = (b.length >= 3 && ascii(0,3) === 'ID3') || (b.length >= 2 && b[0] === 0xff && (b[1] & 0xe0) === 0xe0);
  else if (mime === 'audio/wav' || mime === 'audio/x-wav') ok = b.length >= 12 && ascii(0,4) === 'RIFF' && ascii(8,12) === 'WAVE';

  if (!ok) throw new Error('Conteúdo do arquivo não corresponde ao MIME informado');
  return true;
}

function publicVersion(version) {
  if (!version) return null;
  return {
    id:version.id,
    asset_id:version.asset_id,
    version_number:version.version_number,
    original_filename:version.original_filename,
    mime_type:version.mime_type,
    file_extension:version.file_extension,
    file_size_bytes:version.file_size_bytes,
    width:version.width,
    height:version.height,
    duration_ms:version.duration_ms,
    page_count:version.page_count,
    processing_status:version.processing_status,
    created_at:version.created_at
  };
}

async function uploadObject(path, bytes, mimeType, env) {
  return storageRequest('object/' + BUCKET + '/' + encodedObjectPath(path), {
    method:'POST',
    headers:{ 'content-type':mimeType, 'x-upsert':'false', 'cache-control':'3600' },
    body:bytes
  }, env);
}

async function removeObject(path, env) {
  return storageRequest('object/' + BUCKET, {
    method:'DELETE',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({ prefixes:[path] })
  }, env);
}

async function hardDeleteAsset(assetId, env) {
  return rest('assets?id=eq.' + encodeURIComponent(safeUuid(assetId,'assetId')), {
    method:'DELETE', headers:{ Prefer:'return=minimal' }
  }, env);
}

async function hardDeleteVersion(versionId, env) {
  return rest('asset_versions?id=eq.' + encodeURIComponent(safeUuid(versionId,'versionId')), {
    method:'DELETE', headers:{ Prefer:'return=minimal' }
  }, env);
}

async function findDuplicateAsset(companyId, sha256, env = process.env) {
  const versions = await rest(
    'asset_versions?sha256=eq.' + encodeURIComponent(sha256)
    + '&processing_status=eq.READY&select=asset_id,version_number&limit=30',
    {}, env
  );
  if (versions.error) return versions;
  const ids = [...new Set((versions.data || []).map(v => v.asset_id).filter(Boolean))];
  if (!ids.length) return { configured:true, status:200, data:null, error:null };

  const assets = await rest(
    'assets?id=in.(' + ids.join(',') + ')'
    + '&company_id=eq.' + encodeURIComponent(safeUuid(companyId,'companyId'))
    + '&status=eq.ACTIVE&select=id,title,business_category,current_version_id&limit=30',
    {}, env
  );
  if (assets.error) return assets;
  return { configured:true, status:200, data:assets.data?.[0] || null, error:null };
}

async function createAssetWithUpload(ref = {}, input = {}, bytes, env = process.env) {
  const c = cfg(env);
  if (!c.enabled) return { configured:false, status:503, data:null, error:'Asset Gateway não configurado.' };

  let normalized, buffer;
  try {
    normalized = normalizeMetadata(input, input.mimeType);
    buffer = validateBytes(bytes, env);
    validateContentSignature(buffer, normalized.mimeType);
  } catch (error) {
    return { configured:true, status:400, data:null, error:error.message };
  }

  let company;
  try { company = await resolveCompany(ref, env); }
  catch (error) { return { configured:true,status:400,data:null,error:error.message }; }
  if (company.error) return company;

  const assetId = randomUUID();
  const versionId = randomUUID();
  const storagePath = buildStoragePath(company.data.id, assetId, versionId, normalized.ext);
  const now = new Date().toISOString();
  const hash = createHash('sha256').update(buffer).digest('hex');
  const duplicate = await findDuplicateAsset(company.data.id, hash, env);
  if (duplicate.error) return duplicate;
  if (duplicate.data) {
    return { configured:true, status:409, data:{ duplicateAssetId:duplicate.data.id }, error:'Arquivo já existe nesta conta.' };
  }
  const assetRow = {
    id:assetId, company_id:company.data.id,
    title:normalized.title, description:normalized.description,
    media_kind:normalized.mediaKind, business_category:normalized.businessCategory, source_type:normalized.sourceType,
    visibility_class:normalized.visibilityClass, sensitivity_level:normalized.sensitivityLevel, usage_policy:normalized.usagePolicy,
    source_url:normalized.sourceUrl, captured_at:normalized.capturedAt, current_version_id:null,
    is_primary:false, is_verified:false, status:'ACTIVE',
    metadata:input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata) ? input.metadata : {},
    created_at:now, updated_at:now
  };

  let assetCreated=false, objectUploaded=false;
  const cleanup=[];
  try {
    const asset=await rest('assets',{method:'POST',headers:{Prefer:'return=representation'},body:assetRow},env);
    if(asset.error) return asset;
    assetCreated=true;

    const version=await rest('asset_versions',{
      method:'POST',headers:{Prefer:'return=representation'},
      body:{
        id:versionId,asset_id:assetId,version_number:1,storage_bucket:BUCKET,storage_path:storagePath,
        original_filename:normalized.originalFilename,mime_type:normalized.mimeType,file_extension:normalized.ext,
        file_size_bytes:buffer.length,sha256:hash,processing_status:'PENDING_UPLOAD',metadata:{}
      }
    },env);
    if(version.error) throw new Error(version.error);

    const uploaded=await uploadObject(storagePath,buffer,normalized.mimeType,env);
    if(uploaded.error) throw new Error(uploaded.error);
    objectUploaded=true;

    const ready=await rest('asset_versions?id=eq.'+encodeURIComponent(versionId),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:{processing_status:'READY'}
    },env);
    if(ready.error) throw new Error(ready.error);

    const current=await rest('assets?id=eq.'+encodeURIComponent(assetId),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:{current_version_id:versionId,updated_at:new Date().toISOString()}
    },env);
    if(current.error) throw new Error(current.error);

    let currentAsset=current.data?.[0]||assetRow;
    if(input.isPrimary){
      const primary=await setPrimary(assetId,env);
      if(primary.error) return {configured:true,status:502,data:{asset:currentAsset},error:'Asset salvo, mas não foi possível defini-lo como principal: '+primary.error};
      currentAsset=primary.data||currentAsset;
    }
    return {configured:true,status:201,data:{asset:currentAsset,version:publicVersion(ready.data?.[0]),company:company.data},error:null};
  } catch(error) {
    if(objectUploaded){
      const removed=await removeObject(storagePath,env);
      cleanup.push({step:'storage',ok:!removed.error,error:removed.error||null});
    }
    if(assetCreated){
      const deleted=await hardDeleteAsset(assetId,env);
      cleanup.push({step:'asset_row',ok:!deleted.error,error:deleted.error||null});
    }
    return {configured:true,status:502,data:{cleanup},error:'Upload não concluído: '+error.message};
  }
}

async function getAsset(assetId, env) {
  let id;
  try { id=safeUuid(assetId,'assetId'); }
  catch(error){ return {configured:cfg(env).enabled,status:400,data:null,error:error.message}; }
  const result=await rest(
    'assets?id=eq.'+encodeURIComponent(id)
    +'&select=id,company_id,title,description,media_kind,business_category,source_type,visibility_class,sensitivity_level,usage_policy,source_url,current_version_id,is_primary,is_verified,status,deleted_at,metadata,captured_at,created_at,updated_at&limit=1',
    {},env
  );
  if(result.error) return result;
  const row=Array.isArray(result.data)?result.data[0]:null;
  return row?{...result,data:row}:{...result,status:404,data:null,error:'Asset não encontrado'};
}

async function listAssets(ref = {}, options = {}, env = process.env) {
  let company;
  try { company=await resolveCompany(ref,env); }
  catch(error){ return {configured:cfg(env).enabled,status:400,data:null,error:error.message}; }
  if(company.error) return company;

  let category=null,cursor=null;
  try {
    category=options.businessCategory?safeEnum(options.businessCategory,BUSINESS_CATEGORIES,'OTHER','businessCategory'):null;
    cursor=decodeCursor(options.cursor);
  } catch(error){ return {configured:true,status:400,data:null,error:error.message}; }

  const limit=Math.max(1,Math.min(MAX_LIST_LIMIT,Number(options.limit)||24));
  const params=new URLSearchParams();
  params.set('company_id','eq.'+company.data.id);
  params.set('status','eq.ACTIVE');
  if(category) params.set('business_category','eq.'+category);
  if(cursor) params.set('or','(created_at.lt.'+cursor.createdAt+',and(created_at.eq.'+cursor.createdAt+',id.lt.'+cursor.id+'))');
  params.set('select','id,company_id,title,description,media_kind,business_category,source_type,visibility_class,sensitivity_level,usage_policy,source_url,current_version_id,is_primary,is_verified,status,deleted_at,metadata,captured_at,created_at,updated_at');
  params.set('order','created_at.desc,id.desc');
  params.set('limit',String(limit+1));

  const assets=await rest('assets?'+params.toString(),{},env);
  if(assets.error) return assets;
  const rows=Array.isArray(assets.data)?assets.data:[];
  const hasMore=rows.length>limit;
  const page=rows.slice(0,limit);
  const versionIds=[...new Set(page.map(x=>x.current_version_id).filter(Boolean))];
  let versionsById=new Map();

  if(versionIds.length){
    const vp=new URLSearchParams();
    vp.set('id','in.('+versionIds.join(',')+')');
    vp.set('select','id,asset_id,version_number,original_filename,mime_type,file_extension,file_size_bytes,width,height,duration_ms,page_count,processing_status,created_at');
    const versions=await rest('asset_versions?'+vp.toString(),{},env);
    if(versions.error) return versions;
    versionsById=new Map((versions.data||[]).map(v=>[v.id,v]));
  }

  return {
    configured:true,status:200,error:null,
    data:{
      company:company.data,
      items:page.map(asset=>({...asset,currentVersion:publicVersion(versionsById.get(asset.current_version_id))})),
      nextCursor:hasMore?encodeCursor(page[page.length-1]):null
    }
  };
}

async function replaceAssetFile(assetId, input = {}, bytes, env = process.env) {
  const asset=await getAsset(assetId,env);
  if(asset.error) return asset;
  if(asset.data.status!=='ACTIVE') return {configured:true,status:409,data:null,error:'Somente Asset ativo pode receber nova versão'};

  let normalized,buffer;
  try {
    normalized=normalizeMetadata({...input,businessCategory:asset.data.business_category},input.mimeType);
    buffer=validateBytes(bytes,env);
    validateContentSignature(buffer, normalized.mimeType);
  } catch(error){ return {configured:true,status:400,data:null,error:error.message}; }

  const latest=await rest(
    'asset_versions?asset_id=eq.'+encodeURIComponent(asset.data.id)+'&select=version_number&order=version_number.desc&limit=1',
    {},env
  );
  if(latest.error) return latest;

  const nextVersion=Number(latest.data?.[0]?.version_number||0)+1;
  const versionId=randomUUID();
  const storagePath=buildStoragePath(asset.data.company_id,asset.data.id,versionId,normalized.ext);
  const hash=createHash('sha256').update(buffer).digest('hex');
  const duplicate=await findDuplicateAsset(asset.data.company_id,hash,env);
  if(duplicate.error)return duplicate;
  if(duplicate.data)return {configured:true,status:409,data:{duplicateAssetId:duplicate.data.id},error:'Este arquivo já existe nesta conta.'};
  let versionCreated=false,objectUploaded=false;
  const cleanup=[];

  try {
    const pending=await rest('asset_versions',{
      method:'POST',headers:{Prefer:'return=representation'},
      body:{
        id:versionId,asset_id:asset.data.id,version_number:nextVersion,storage_bucket:BUCKET,storage_path:storagePath,
        original_filename:normalized.originalFilename,mime_type:normalized.mimeType,file_extension:normalized.ext,
        file_size_bytes:buffer.length,sha256:hash,processing_status:'PENDING_UPLOAD',metadata:{}
      }
    },env);
    if(pending.error) return pending;
    versionCreated=true;

    const uploaded=await uploadObject(storagePath,buffer,normalized.mimeType,env);
    if(uploaded.error) throw new Error(uploaded.error);
    objectUploaded=true;

    const ready=await rest('asset_versions?id=eq.'+encodeURIComponent(versionId),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:{processing_status:'READY'}
    },env);
    if(ready.error) throw new Error(ready.error);

    const updated=await rest('assets?id=eq.'+encodeURIComponent(asset.data.id),{
      method:'PATCH',headers:{Prefer:'return=representation'},body:{current_version_id:versionId,updated_at:new Date().toISOString()}
    },env);
    if(updated.error) throw new Error(updated.error);

    return {configured:true,status:200,data:{asset:updated.data?.[0]||asset.data,version:publicVersion(ready.data?.[0])},error:null};
  } catch(error) {
    if(objectUploaded){
      const removed=await removeObject(storagePath,env);
      cleanup.push({step:'storage',ok:!removed.error,error:removed.error||null});
    }
    if(versionCreated){
      const deleted=await hardDeleteVersion(versionId,env);
      cleanup.push({step:'version_row',ok:!deleted.error,error:deleted.error||null});
    }
    return {configured:true,status:502,data:{cleanup},error:'Substituição não concluída: '+error.message};
  }
}

async function signAsset(assetId, options = {}, env = process.env) {
  const asset=await getAsset(assetId,env);
  if(asset.error) return asset;
  if(asset.data.status!=='ACTIVE') return {configured:true,status:404,data:null,error:'Asset indisponível'};
  if(!asset.data.current_version_id) return {configured:true,status:409,data:null,error:'Asset sem versão pronta'};

  const version=await rest(
    'asset_versions?id=eq.'+encodeURIComponent(asset.data.current_version_id)
    +'&processing_status=eq.READY&select=id,asset_id,storage_bucket,storage_path,original_filename,mime_type,file_size_bytes,version_number&limit=1',
    {},env
  );
  if(version.error) return version;
  const v=version.data?.[0];
  if(!v) return {configured:true,status:409,data:null,error:'Versão atual não está pronta'};

  const ttl=Math.max(60,Math.min(900,Number(options.ttl)||600));
  const payload={expiresIn:ttl};
  if(options.download) payload.download=v.original_filename||true;
  const signed=await storageRequest(
    'object/sign/'+encodeURIComponent(v.storage_bucket)+'/'+encodedObjectPath(v.storage_path),
    {method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)},env
  );
  if(signed.error) return signed;
  const relative=signed.data?.signedURL||signed.data?.signedUrl||signed.data?.url;
  if(!relative) return {configured:true,status:502,data:null,error:'Storage não retornou signed URL'};
  const url=/^https?:\/\//i.test(relative)?relative:cfg(env).base+(relative.startsWith('/')?'':'/')+relative;
  return {configured:true,status:200,data:{url,expiresIn:ttl,assetId:asset.data.id,versionId:v.id,mimeType:v.mime_type,filename:v.original_filename},error:null};
}

async function setPrimary(assetId, env = process.env) {
  const asset=await getAsset(assetId,env);
  if(asset.error) return asset;
  if(asset.data.status!=='ACTIVE') return {configured:true,status:409,data:null,error:'Asset não está ativo'};

  const clear=await rest(
    'assets?company_id=eq.'+encodeURIComponent(asset.data.company_id)
    +'&business_category=eq.'+encodeURIComponent(asset.data.business_category)
    +'&is_primary=eq.true&status=eq.ACTIVE',
    {method:'PATCH',headers:{Prefer:'return=minimal'},body:{is_primary:false,updated_at:new Date().toISOString()}},env
  );
  if(clear.error) return clear;

  const selected=await rest('assets?id=eq.'+encodeURIComponent(asset.data.id),{
    method:'PATCH',headers:{Prefer:'return=representation'},body:{is_primary:true,updated_at:new Date().toISOString()}
  },env);
  return selected.error?selected:{...selected,data:selected.data?.[0]||null};
}

async function setStatus(assetId, status, env = process.env) {
  let id;
  try { id=safeUuid(assetId,'assetId'); }
  catch(error){ return {configured:cfg(env).enabled,status:400,data:null,error:error.message}; }
  const normalized=upper(status);
  if(!['ARCHIVED','DELETED'].includes(normalized)) return {configured:true,status:400,data:null,error:'Status inválido'};
  const now=new Date().toISOString();
  const body={status:normalized,is_primary:false,updated_at:now};
  if(normalized==='DELETED') body.deleted_at=now;
  const result=await rest('assets?id=eq.'+encodeURIComponent(id)+'&status=neq.DELETED',{
    method:'PATCH',headers:{Prefer:'return=representation'},body
  },env);
  if(result.error) return result;
  const row=result.data?.[0];
  return row?{...result,data:row}:{...result,status:404,data:null,error:'Asset não encontrado'};
}

async function health(env = process.env) {
  const c=cfg(env);
  if(!c.enabled) return {configured:false,status:200,data:{ok:true,configured:false,mode:'disabled',bucket:BUCKET},error:null};
  const probe=await rest('assets?select=id&limit=1',{},env);
  return probe.error
    ? {configured:true,status:503,data:{ok:false,configured:true,bucket:BUCKET},error:probe.error}
    : {configured:true,status:200,data:{ok:true,configured:true,bucket:BUCKET},error:null};
}

module.exports={
  BUCKET,MIME,MEDIA_KINDS,BUSINESS_CATEGORIES,SOURCE_TYPES,VISIBILITY_CLASSES,SENSITIVITY_LEVELS,USAGE_POLICIES,
  cfg,safeUuid,mediaForMime,buildStoragePath,encodeCursor,decodeCursor,normalizeMetadata,validateBytes,validateContentSignature,
  rest,storageRequest,resolveCompany,findDuplicateAsset,health,listAssets,createAssetWithUpload,replaceAssetFile,signAsset,setPrimary,setStatus
};
