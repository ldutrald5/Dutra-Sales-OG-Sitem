import assert from 'node:assert/strict';
import registry from '../apps/sistema-og/services/company-registry-provider.js';

const fixture={
  provider:'mock',
  providerReference:'fixture-1',
  observedAt:'2026-10-04T12:00:00Z',
  cnpj:'12.ABC.345/01DE-35',
  legalName:'ALPHA TRANSPORTES LTDA',
  tradeName:'Alpha',
  establishmentRole:'BRANCH',
  registryStatus:'ATIVA',
  primaryCnae:'4930202',
  openedAt:'2026-09-01',
  address:{
    addressRaw:'Rodovia PR 317, S/N, Maringá - PR',
    street:'Rodovia PR 317',
    number:'S/N',
    district:'Industrial',
    cep:'87000000',
    city:'Maringá',
    uf:'PR'
  },
  raw:{source:'fixture'}
};

const provider=registry.createMockProvider({'12ABC34501DE35':fixture});
const result=await registry.lookup(provider,'12.ABC.345/01DE-35',{runtime:'test'});
assert.equal(result.cnpj,'12ABC34501DE35');
assert.equal(result.cnpjRoot,'12ABC345');
assert.equal(result.establishmentRole,'BRANCH');
assert.equal(result.address.streetNumber,'S/N');
assert.equal(result.address.readyForGeocoding,true);

const establishment=registry.toEstablishmentDraft(result,{companyId:'COMP-1',establishmentId:'EST-1'});
assert.equal(establishment.companyId,'COMP-1');
assert.equal(establishment.cnpj,'12ABC34501DE35');
assert.equal(establishment.registryProvider,'mock');

const location=registry.toRegisteredLocationDraft(result,{companyId:'COMP-1',establishmentId:'EST-1',locationId:'LOC-1'});
assert.equal(location.purpose,'REGISTERED_ADDRESS');
assert.equal(location.addressSource,'CNPJ_REGISTRY');
assert.equal(location.verificationStatus,'UNVERIFIED');
assert.equal(location.geocodeConfidence,null);

const job=registry.createRegistryJobInput({companyId:'COMP-1',cnpj:'12.ABC.345/01DE-35',requestedAt:'2026-10-04T15:00:00Z'});
assert.deepEqual(job,{
  kind:'company_registry_v1',
  company_id:'COMP-1',
  cnpj:'12ABC34501DE35',
  reason:'company_registry_refresh',
  requested_at:'2026-10-04T15:00:00.000Z'
});

const serverOnly=registry.createProvider({id:'server-test',async lookup(){return fixture;}});
await assert.rejects(()=>registry.lookup(serverOnly,'12.ABC.345/01DE-35',{runtime:'browser'}),/não pode usar segredo no browser/);
await assert.rejects(()=>registry.lookup(provider,'12.ABC.345/01DE-34',{runtime:'test'}),/CNPJ inválido/);
assert.throws(()=>registry.normalizeRegistryRecord({...fixture,cnpj:'12.ABC.345/01DE-34'}),/CNPJ válido/);

console.log('GEO company registry provider contract: PASS');
