const clean=value=>String(value??'').trim();
const upper=value=>clean(value).toUpperCase();

export function normalizeCnpj(value){
  return upper(value).replace(/[.\/\-\s]/g,'');
}

export function isAlphanumericCnpj(value){
  const cnpj=normalizeCnpj(value);
  return /^[A-Z0-9]{12}\d{2}$/.test(cnpj) && /[A-Z]/.test(cnpj.slice(0,12));
}

export function isCnpjShape(value){
  return /^[A-Z0-9]{12}\d{2}$/.test(normalizeCnpj(value));
}

export function normalizePostalCode(value){
  const digits=clean(value).replace(/\D/g,'');
  return digits.length===8?digits:digits;
}

export function normalizeState(value){
  const state=upper(value);
  return /^[A-Z]{2}$/.test(state)?state:'';
}

export function normalizeCountryCode(value){
  const code=upper(value||'BR');
  return /^[A-Z]{2}$/.test(code)?code:'BR';
}

export function normalizeAddress(input={}){
  const streetType=clean(input.streetType||input.tipoLogradouro);
  const streetName=clean(input.street||input.logradouro);
  const street=[streetType,streetName].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
  const number=clean(input.number||input.numero);
  const complement=clean(input.complement||input.complemento);
  const district=clean(input.district||input.bairro);
  const postalCode=normalizePostalCode(input.postalCode||input.cep);
  const city=clean(input.city||input.municipio||input.cidade);
  const cityIbgeCode=clean(input.cityIbgeCode||input.codigoMunicipioIbge||input.ibgeId);
  const state=normalizeState(input.state||input.uf);
  const countryCode=normalizeCountryCode(input.countryCode||input.paisIso2||'BR');

  const formattedParts=[];
  if(street) formattedParts.push(number?street+', '+number:street);
  if(complement) formattedParts.push(complement);
  if(district) formattedParts.push(district);
  const cityState=[city,state].filter(Boolean).join(' - ');
  if(cityState) formattedParts.push(cityState);
  if(postalCode) formattedParts.push(postalCode);

  const raw=clean(input.raw||input.addressRaw)||formattedParts.join(', ');

  return Object.freeze({
    raw,
    street,
    number,
    complement,
    district,
    postalCode,
    city,
    cityIbgeCode,
    state,
    countryCode,
    formattedAddress:formattedParts.join(', ')
  });
}

function roleFromProvider(value){
  const normalized=upper(value);
  if(['MATRIZ','HEADQUARTERS'].includes(normalized)) return 'HEADQUARTERS';
  if(['FILIAL','BRANCH'].includes(normalized)) return 'BRANCH';
  return 'UNKNOWN';
}

export function normalizeBrasilApiPayload(payload, observedAt=new Date().toISOString()){
  const cnpj=normalizeCnpj(payload?.cnpj);
  if(!isCnpjShape(cnpj)) throw new Error('registry_payload_invalid_cnpj');

  const address=normalizeAddress({
    raw:null,
    logradouro:payload?.logradouro,
    numero:payload?.numero,
    complemento:payload?.complemento,
    bairro:payload?.bairro,
    cep:payload?.cep,
    municipio:payload?.municipio,
    codigoMunicipioIbge:payload?.codigo_municipio_ibge,
    uf:payload?.uf,
    countryCode:'BR'
  });

  return Object.freeze({
    provider:'brasilapi',
    observedAt,
    cnpj,
    cnpjRoot:cnpj.slice(0,8),
    legalName:clean(payload?.razao_social),
    tradeName:clean(payload?.nome_fantasia),
    establishmentRole:roleFromProvider(payload?.descricao_identificador_matriz_filial),
    registryStatus:clean(payload?.descricao_situacao_cadastral||payload?.situacao_cadastral),
    openedAt:clean(payload?.data_inicio_atividade)||null,
    primaryCnae:clean(payload?.cnae_fiscal),
    address
  });
}

export function normalizeCnpjWsPayload(payload, observedAt=new Date().toISOString()){
  const establishment=payload?.estabelecimento||payload;
  const cnpj=normalizeCnpj(establishment?.cnpj);
  if(!isCnpjShape(cnpj)) throw new Error('registry_payload_invalid_cnpj');

  const address=normalizeAddress({
    raw:null,
    tipoLogradouro:establishment?.tipo_logradouro,
    logradouro:establishment?.logradouro,
    numero:establishment?.numero,
    complemento:establishment?.complemento,
    bairro:establishment?.bairro,
    cep:establishment?.cep,
    cidade:establishment?.cidade?.nome,
    ibgeId:establishment?.cidade?.ibge_id,
    uf:establishment?.estado?.sigla,
    paisIso2:establishment?.pais?.iso2||'BR'
  });

  return Object.freeze({
    provider:'cnpjws',
    observedAt,
    cnpj,
    cnpjRoot:cnpj.slice(0,8),
    legalName:clean(payload?.razao_social||establishment?.razao_social),
    tradeName:clean(establishment?.nome_fantasia),
    establishmentRole:roleFromProvider(establishment?.tipo),
    registryStatus:clean(establishment?.situacao_cadastral),
    openedAt:clean(establishment?.data_inicio_atividade)||null,
    primaryCnae:clean(establishment?.atividade_principal?.id),
    address
  });
}

export function chooseRegistryProvider(cnpj,{preferred='auto',hasCnpjWsToken=false}={}){
  const normalized=normalizeCnpj(cnpj);
  if(!isCnpjShape(normalized)) throw new Error('invalid_cnpj_shape');
  const pref=clean(preferred).toLowerCase()||'auto';

  if(pref==='brasilapi') return 'brasilapi';
  if(pref==='cnpjws'){
    if(isAlphanumericCnpj(normalized)) throw new Error('provider_does_not_support_alphanumeric_cnpj');
    if(!hasCnpjWsToken) throw new Error('cnpjws_token_missing');
    return 'cnpjws';
  }
  if(pref!=='auto') throw new Error('unsupported_registry_provider');

  if(!isAlphanumericCnpj(normalized)&&hasCnpjWsToken) return 'cnpjws';
  return 'brasilapi';
}
