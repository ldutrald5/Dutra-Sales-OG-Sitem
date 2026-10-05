(function attachCompanyRegistryContract(root,factory){
  const cnpjDomain=typeof module!=='undefined'&&module.exports?require('../domain/cnpj.js'):root.OG_CNPJ;
  const addressNormalizer=typeof module!=='undefined'&&module.exports?require('./address-normalizer.js'):root.OG_ADDRESS_NORMALIZER;
  const api=factory(cnpjDomain,addressNormalizer);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_COMPANY_REGISTRY=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createCompanyRegistryContract(cnpjDomain,addressNormalizer){
  'use strict';

  const ESTABLISHMENT_ROLES=Object.freeze(['HEADQUARTERS','BRANCH','UNKNOWN']);
  const clean=value=>String(value??'').trim();

  function requireProviderId(value){
    const id=clean(value).toLowerCase();
    if(!/^[a-z0-9][a-z0-9_-]{1,48}$/.test(id))throw new Error('provider id inválido');
    return id;
  }

  function normalizeRole(value){
    const role=clean(value).toUpperCase();
    return ESTABLISHMENT_ROLES.includes(role)?role:'UNKNOWN';
  }

  function normalizeDate(value){
    if(!value)return null;
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return null;
    return date.toISOString();
  }

  function normalizeRegistryRecord(record={},context={}){
    const cnpj=cnpjDomain.normalize(record.cnpj??context.cnpj);
    if(!cnpjDomain.isValid(cnpj))throw new Error('registry record exige CNPJ válido');

    const provider=requireProviderId(record.provider??context.provider);
    const observedAt=normalizeDate(record.observedAt??context.observedAt??new Date().toISOString());
    if(!observedAt)throw new Error('observedAt inválido');

    const address=addressNormalizer.normalizeAddress(record.address??record);

    return Object.freeze({
      provider,
      providerReference:clean(record.providerReference??record.reference??'')||null,
      observedAt,
      cnpj,
      cnpjRoot:cnpjDomain.root(cnpj),
      legalName:clean(record.legalName??record.razaoSocial??'')||null,
      tradeName:clean(record.tradeName??record.nomeFantasia??'')||null,
      establishmentRole:normalizeRole(record.establishmentRole??record.role),
      registryStatus:clean(record.registryStatus??record.status??'')||null,
      primaryCnae:clean(record.primaryCnae??record.cnae??'')||null,
      openedAt:normalizeDate(record.openedAt??record.openingDate),
      address,
      raw:record.raw&&typeof record.raw==='object'?record.raw:null
    });
  }

  function createProvider(spec={}){
    const id=requireProviderId(spec.id);
    if(typeof spec.lookup!=='function')throw new Error('provider exige lookup(cnpj, options)');
    return Object.freeze({
      id,
      serverOnly:spec.serverOnly!==false,
      lookup:spec.lookup
    });
  }

  async function lookup(provider,cnpjValue,options={}){
    if(!provider||typeof provider.lookup!=='function')throw new Error('provider inválido');
    if(provider.serverOnly!==false&&options.runtime==='browser')throw new Error('company registry provider não pode usar segredo no browser');

    const cnpj=cnpjDomain.normalize(cnpjValue);
    if(!cnpjDomain.isValid(cnpj))throw new Error('CNPJ inválido');

    const raw=await provider.lookup(cnpj,options);
    if(raw==null)throw new Error('provider retornou vazio');

    return normalizeRegistryRecord(raw,{
      provider:provider.id,
      cnpj,
      observedAt:options.observedAt
    });
  }

  function createMockProvider(fixtures={}){
    const normalized=new Map();
    for(const [key,value] of Object.entries(fixtures)){
      const cnpj=cnpjDomain.normalize(key);
      normalized.set(cnpj,value);
    }
    return createProvider({
      id:'mock',
      serverOnly:false,
      async lookup(cnpj){
        if(!normalized.has(cnpj))throw new Error('mock registry record not found');
        return normalized.get(cnpj);
      }
    });
  }

  function toEstablishmentDraft(record,ids={}){
    const normalized=normalizeRegistryRecord(record,{provider:record.provider,cnpj:record.cnpj,observedAt:record.observedAt});
    return Object.freeze({
      id:ids.establishmentId??null,
      companyId:ids.companyId??null,
      cnpj:normalized.cnpj,
      legalName:normalized.legalName,
      tradeName:normalized.tradeName,
      role:normalized.establishmentRole,
      registryStatus:normalized.registryStatus,
      primaryCnae:normalized.primaryCnae,
      openedAt:normalized.openedAt,
      registryProvider:normalized.provider,
      registryObservedAt:normalized.observedAt
    });
  }

  function toRegisteredLocationDraft(record,ids={}){
    const normalized=normalizeRegistryRecord(record,{provider:record.provider,cnpj:record.cnpj,observedAt:record.observedAt});
    const a=normalized.address;
    return Object.freeze({
      id:ids.locationId??null,
      companyId:ids.companyId??null,
      establishmentId:ids.establishmentId??null,
      purpose:'REGISTERED_ADDRESS',
      label:'Endereço cadastral',
      addressRaw:a.addressRaw,
      street:a.street,
      streetNumber:a.streetNumber,
      complement:a.complement,
      district:a.district,
      postalCode:a.postalCode,
      city:a.city,
      cityIbgeCode:a.cityIbgeCode,
      state:a.state,
      countryCode:a.countryCode,
      formattedAddress:a.formattedAddress,
      addressSource:'CNPJ_REGISTRY',
      sourceProvider:normalized.provider,
      sourceReference:normalized.providerReference,
      sourceObservedAt:normalized.observedAt,
      geocodePrecision:'UNKNOWN',
      geocodeConfidence:null,
      verificationStatus:'UNVERIFIED',
      isPrimary:true,
      isActive:true
    });
  }

  function createRegistryJobInput({companyId,cnpj,reason='company_registry_refresh',requestedAt}={}){
    const normalizedCnpj=cnpjDomain.normalize(cnpj);
    if(!cnpjDomain.isValid(normalizedCnpj))throw new Error('CNPJ inválido');
    if(!clean(companyId))throw new Error('companyId obrigatório');
    const at=normalizeDate(requestedAt??new Date().toISOString());
    return Object.freeze({
      kind:'company_registry_v1',
      company_id:clean(companyId),
      cnpj:normalizedCnpj,
      reason:clean(reason)||'company_registry_refresh',
      requested_at:at
    });
  }

  return Object.freeze({
    ESTABLISHMENT_ROLES,
    createProvider,
    createMockProvider,
    lookup,
    normalizeRegistryRecord,
    toEstablishmentDraft,
    toRegisteredLocationDraft,
    createRegistryJobInput
  });
}));
