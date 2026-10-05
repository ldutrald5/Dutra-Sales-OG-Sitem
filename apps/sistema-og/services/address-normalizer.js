(function attachAddressNormalizer(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.OG_ADDRESS_NORMALIZER=api;
}(typeof globalThis!=='undefined'?globalThis:this,function createAddressNormalizer(){
  'use strict';

  const BRAZIL_STATES=Object.freeze(new Set([
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ]));

  const clean=value=>String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim();
  const upper=value=>clean(value).toUpperCase();
  const postalDigits=value=>clean(value).replace(/\D/g,'');
  const collapsePunctuation=value=>clean(value).replace(/\s*[,;]+\s*/g,', ').replace(/\s*[-–—]\s*/g,' - ').replace(/\s+/g,' ').trim();

  function normalizePostalCode(value){
    const digits=postalDigits(value);
    return digits.length===8?digits:'';
  }

  function formatPostalCode(value){
    const digits=normalizePostalCode(value);
    return digits?digits.replace(/^(\d{5})(\d{3})$/,'$1-$2'):'';
  }

  function normalizeState(value){
    const state=upper(value).replace(/[^A-Z]/g,'');
    return BRAZIL_STATES.has(state)?state:'';
  }

  function normalizeNumber(value){
    const text=upper(value);
    if(!text)return'';
    if(/^(S\/?N|SN|SEM NUMERO|SEM NÚMERO)$/.test(text))return'S/N';
    return clean(value);
  }

  function normalizeStreet(value){
    return collapsePunctuation(value);
  }

  function normalizeAddress(input={}){
    const addressRaw=clean(input.addressRaw??input.raw??'');
    const street=normalizeStreet(input.street??input.logradouro??'');
    const streetNumber=normalizeNumber(input.streetNumber??input.number??input.numero??'');
    const complement=clean(input.complement??input.complemento??'');
    const district=clean(input.district??input.neighborhood??input.bairro??'');
    const postalCode=normalizePostalCode(input.postalCode??input.zipCode??input.cep??'');
    const city=clean(input.city??input.municipio??'');
    const cityIbgeCode=postalDigits(input.cityIbgeCode??input.municipioIbge??input.codigoMunicipio??'');
    const state=normalizeState(input.state??input.uf??'');
    const countryCode=upper(input.countryCode??input.country??'BR')||'BR';

    const formattedAddress=[
      [street,streetNumber].filter(Boolean).join(', '),
      complement,
      district,
      [city,state].filter(Boolean).join(' - '),
      formatPostalCode(postalCode),
      countryCode&&countryCode!=='BR'?countryCode:''
    ].filter(Boolean).join(' · ');

    const componentsPresent={
      street:Boolean(street),
      streetNumber:Boolean(streetNumber),
      complement:Boolean(complement),
      district:Boolean(district),
      postalCode:Boolean(postalCode),
      city:Boolean(city),
      state:Boolean(state)
    };

    const readyForGeocoding=Boolean(
      state&&city&&(postalCode||street)
    );

    const addressKey=[
      upper(street),
      upper(streetNumber),
      upper(complement),
      upper(district),
      postalCode,
      upper(city),
      state,
      countryCode
    ].join('|');

    return Object.freeze({
      addressRaw,
      street,
      streetNumber,
      complement,
      district,
      postalCode,
      city,
      cityIbgeCode,
      state,
      countryCode,
      formattedAddress,
      addressKey,
      componentsPresent:Object.freeze(componentsPresent),
      readyForGeocoding
    });
  }

  return Object.freeze({
    BRAZIL_STATES,
    clean,
    normalizePostalCode,
    formatPostalCode,
    normalizeState,
    normalizeNumber,
    normalizeStreet,
    normalizeAddress
  });
}));
