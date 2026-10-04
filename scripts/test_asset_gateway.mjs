import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const gateway=require('../apps/sistema-og/server-asset-gateway.cjs');

assert.equal(gateway.cfg({}).enabled,false);
assert.equal(gateway.cfg({OG_SUPABASE_URL:'https://demo.supabase.co',OG_SUPABASE_SERVICE_ROLE_KEY:'server-secret'}).enabled,true);
assert.throws(()=>gateway.safeUuid('lead-1'),/inválido/);
assert.equal(gateway.mediaForMime('image/jpeg').mediaKind,'IMAGE');
assert.equal(gateway.mediaForMime('application/pdf').mediaKind,'DOCUMENT');
assert.throws(()=>gateway.mediaForMime('text/html'),/não permitido/);
assert.throws(()=>gateway.mediaForMime('image/heic'),/não permitido/);
assert.equal(gateway.validateContentSignature(Buffer.from([0xff,0xd8,0xff,0xdb]),'image/jpeg'),true);
assert.equal(gateway.validateContentSignature(Buffer.from('%PDF-1.7\n'),'application/pdf'),true);
assert.throws(()=>gateway.validateContentSignature(Buffer.from('not-a-pdf'),'application/pdf'),/não corresponde/);

assert.equal(
  gateway.buildStoragePath(
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    'jpg'
  ),
  'companies/11111111-1111-4111-8111-111111111111/assets/22222222-2222-4222-8222-222222222222/versions/33333333-3333-4333-8333-333333333333.jpg'
);

const cursor=gateway.encodeCursor({
  created_at:'2026-10-04T10:00:00.000Z',
  id:'44444444-4444-4444-8444-444444444444'
});
assert.deepEqual(gateway.decodeCursor(cursor),{
  createdAt:'2026-10-04T10:00:00.000Z',
  id:'44444444-4444-4444-8444-444444444444'
});

const whatsapp=gateway.normalizeMetadata({sourceType:'WHATSAPP'},'image/png');
assert.equal(whatsapp.businessCategory,'CONVERSATION');
assert.equal(whatsapp.sourceType,'WHATSAPP');

const proposalLink=gateway.normalizeLinkInput(
  {proposalId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',role:'PROPOSAL_INPUT'},
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);
assert.equal(proposalLink.proposal_id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
assert.equal(proposalLink.pinned_version_id,'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
assert.equal(proposalLink.role,'PROPOSAL_INPUT');
assert.throws(
  ()=>gateway.normalizeLinkInput({
    contactId:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    activityId:'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  }),
  /exatamente um alvo/
);

const env={
  OG_SUPABASE_URL:'https://demo.supabase.co',
  OG_SUPABASE_SERVICE_ROLE_KEY:'server-secret',
  OG_SUPABASE_TIMEOUT_MS:'1000'
};

const originalFetch=globalThis.fetch;
const calls=[];

function json(status,data){
  return new Response(data==null?'':JSON.stringify(data),{
    status,
    headers:{'content-type':'application/json'}
  });
}

try {
  globalThis.fetch=async (url,init={})=>{
    calls.push({url:String(url),method:init.method||'GET',body:init.body,headers:init.headers});
    const u=String(url);

    if(u.includes('/rest/v1/companies?')) {
      return json(200,[{
        id:'11111111-1111-4111-8111-111111111111',
        name:'Transportadora Teste',
        legacy_lead_id:'LEAD-1'
      }]);
    }
    if(u.includes('/rest/v1/asset_versions?sha256=eq.') && init.method==='GET') return json(200,[]);
    if(u.endsWith('/rest/v1/assets') && init.method==='POST') {
      return json(201,[JSON.parse(init.body)]);
    }
    if(u.endsWith('/rest/v1/asset_versions') && init.method==='POST') {
      return json(201,[JSON.parse(init.body)]);
    }
    if(u.includes('/storage/v1/object/account-assets/') && init.method==='POST') {
      return json(200,{Key:'ok'});
    }
    if(u.includes('/rest/v1/asset_versions?id=eq.') && init.method==='PATCH') {
      return json(200,[{
        id:u.split('id=eq.')[1],
        processing_status:JSON.parse(init.body).processing_status
      }]);
    }
    if(u.includes('/rest/v1/assets?id=eq.') && init.method==='PATCH') {
      return json(200,[{
        id:u.split('id=eq.')[1],
        company_id:'11111111-1111-4111-8111-111111111111',
        ...JSON.parse(init.body)
      }]);
    }
    throw new Error('Unexpected fetch '+(init.method||'GET')+' '+u);
  };

  const created=await gateway.createAssetWithUpload(
    {legacyLeadId:'LEAD-1'},
    {
      mimeType:'image/jpeg',
      originalFilename:'frota.jpg',
      businessCategory:'FLEET',
      sourceType:'CAMERA'
    },
    Buffer.from([0xff,0xd8,0xff,0xdb,0x00]),
    env
  );

  assert.equal(created.status,201);
  assert.equal(created.error,null);
  assert.ok(created.data.asset.current_version_id);
  assert.ok(calls.some(c=>c.url.includes('/storage/v1/object/account-assets/companies/')));
  assert.ok(
    calls.every(c=>!c.url.includes('LEAD-1/assets/')),
    'Storage path nunca deve usar lead legado'
  );

  calls.length=0;

  globalThis.fetch=async (url,init={})=>{
    calls.push({url:String(url),method:init.method||'GET',body:init.body});
    const u=String(url);

    if(u.includes('/rest/v1/companies?')) {
      return json(200,[{
        id:'11111111-1111-4111-8111-111111111111',
        name:'Transportadora Teste',
        legacy_lead_id:'LEAD-1'
      }]);
    }
    if(u.includes('/rest/v1/asset_versions?sha256=eq.') && init.method==='GET') return json(200,[]);
    if(u.endsWith('/rest/v1/assets') && init.method==='POST') return json(201,[JSON.parse(init.body)]);
    if(u.endsWith('/rest/v1/asset_versions') && init.method==='POST') return json(201,[JSON.parse(init.body)]);
    if(u.includes('/storage/v1/object/account-assets/') && init.method==='POST') return json(500,{message:'storage down'});
    if(u.includes('/rest/v1/assets?id=eq.') && init.method==='DELETE') return new Response(null,{status:204});

    throw new Error('Unexpected compensation fetch '+(init.method||'GET')+' '+u);
  };

  const failed=await gateway.createAssetWithUpload(
    {legacyLeadId:'LEAD-1'},
    {
      mimeType:'application/pdf',
      originalFilename:'doc.pdf',
      businessCategory:'COMMERCIAL_DOCUMENT'
    },
    Buffer.from('%PDF-1.7\n'),
    env
  );

  assert.equal(failed.status,502);
  assert.match(failed.error,/storage down/);
  assert.ok(
    calls.some(c=>c.method==='DELETE'&&c.url.includes('/rest/v1/assets?id=eq.')),
    'Falha de Storage deve compensar o Asset incompleto'
  );

  calls.length=0;
  globalThis.fetch=async (url,init={})=>{
    calls.push({url:String(url),method:init.method||'GET',body:init.body});
    const u=String(url);
    if(u.includes('/rest/v1/companies?')) return json(200,[{id:'11111111-1111-4111-8111-111111111111',name:'Transportadora Teste',legacy_lead_id:'LEAD-1'}]);
    if(u.includes('/rest/v1/asset_versions?sha256=eq.') && init.method==='GET') return json(200,[{asset_id:'55555555-5555-4555-8555-555555555555',version_number:1}]);
    if(u.includes('/rest/v1/assets?id=in.') && init.method==='GET') return json(200,[{id:'55555555-5555-4555-8555-555555555555',title:'Frota',business_category:'FLEET'}]);
    throw new Error('Unexpected duplicate fetch '+(init.method||'GET')+' '+u);
  };
  const duplicate=await gateway.createAssetWithUpload(
    {legacyLeadId:'LEAD-1'},
    {mimeType:'image/jpeg',originalFilename:'frota-duplicada.jpg',businessCategory:'FLEET'},
    Buffer.from([0xff,0xd8,0xff,0xdb,0x01]),
    env
  );
  assert.equal(duplicate.status,409);
  assert.match(duplicate.error,/já existe/i);
  assert.equal(duplicate.data.duplicateAssetId,'55555555-5555-4555-8555-555555555555');

  calls.length=0;
  globalThis.fetch=async (url,init={})=>{
    calls.push({url:String(url),method:init.method||'GET'});
    const u=String(url);
    if(u.includes('/rest/v1/companies?')) return json(200,[{id:'11111111-1111-4111-8111-111111111111',name:'Transportadora Teste',legacy_lead_id:'LEAD-1'}]);
    if(u.includes('/rest/v1/assets?') && u.includes('business_category=in.%28LOGO%2CCOVER%2CFLEET%29')) {
      return json(200,[
        {id:'66666666-6666-4666-8666-666666666666',title:'Logo antiga',business_category:'LOGO',is_primary:false,created_at:'2026-10-01T00:00:00Z'},
        {id:'77777777-7777-4777-8777-777777777777',title:'Logo principal',business_category:'LOGO',is_primary:true,created_at:'2026-10-02T00:00:00Z'},
        {id:'88888888-8888-4888-8888-888888888888',title:'Frota principal',business_category:'FLEET',is_primary:true,created_at:'2026-10-03T00:00:00Z'},
        {id:'99999999-9999-4999-8999-999999999999',title:'Capa',business_category:'COVER',is_primary:false,created_at:'2026-10-04T00:00:00Z'}
      ]);
    }
    throw new Error('Unexpected visual summary fetch '+(init.method||'GET')+' '+u);
  };
  const visual=await gateway.visualSummary({legacyLeadId:'LEAD-1'},env);
  assert.equal(visual.error,null);
  assert.equal(visual.data.logo.id,'77777777-7777-4777-8777-777777777777');
  assert.equal(visual.data.cover.id,'99999999-9999-4999-8999-999999999999');
  assert.equal(visual.data.fleet.id,'88888888-8888-4888-8888-888888888888');

} finally {
  globalThis.fetch=originalFetch;
}

console.log('Asset Gateway tests: PASS');
