import assert from 'node:assert/strict';
import {
  chooseRegistryProvider,
  isAlphanumericCnpj,
  isCnpjShape,
  normalizeAddress,
  normalizeBrasilApiPayload,
  normalizeCnpj,
  normalizeCnpjWsPayload,
} from '../supabase/functions/_shared/company-registry.mjs';

assert.equal(normalizeCnpj('12.ABC.345/01DE-35'),'12ABC34501DE35');
assert.equal(isCnpjShape('12.ABC.345/01DE-35'),true);
assert.equal(isAlphanumericCnpj('12.ABC.345/01DE-35'),true);
assert.equal(isAlphanumericCnpj('12.345.678/0001-95'),false);

assert.equal(
  chooseRegistryProvider('12.345.678/0001-95',{preferred:'auto',hasCnpjWsToken:true}),
  'cnpjws'
);
assert.equal(
  chooseRegistryProvider('12.ABC.345/01DE-35',{preferred:'auto',hasCnpjWsToken:true}),
  'brasilapi'
);
assert.throws(
  ()=>chooseRegistryProvider('12.ABC.345/01DE-35',{preferred:'cnpjws',hasCnpjWsToken:true}),
  /provider_does_not_support_alphanumeric_cnpj/
);

const address=normalizeAddress({
  tipoLogradouro:'Rodovia',
  logradouro:'PR-317',
  numero:'S/N',
  bairro:'Zona Rural',
  cep:'87000-000',
  cidade:'Maringá',
  uf:'pr',
});
assert.equal(address.street,'Rodovia PR-317');
assert.equal(address.number,'S/N');
assert.equal(address.postalCode,'87000000');
assert.equal(address.state,'PR');
assert.equal(address.countryCode,'BR');
assert.match(address.formattedAddress,/Rodovia PR-317, S\/N/);

const brasil=normalizeBrasilApiPayload({
  cnpj:'12ABC34501DE35',
  razao_social:'ALPHA TRANSPORTES LTDA',
  nome_fantasia:'Alpha',
  descricao_identificador_matriz_filial:'MATRIZ',
  descricao_situacao_cadastral:'ATIVA',
  data_inicio_atividade:'2026-07-31',
  cnae_fiscal:4930202,
  logradouro:'AVENIDA TESTE',
  numero:'100',
  complemento:'GALPAO 2',
  bairro:'INDUSTRIAL',
  cep:'87000000',
  municipio:'MARINGA',
  codigo_municipio_ibge:4115200,
  uf:'PR',
},'2026-10-04T23:00:00.000Z');

assert.equal(brasil.provider,'brasilapi');
assert.equal(brasil.establishmentRole,'HEADQUARTERS');
assert.equal(brasil.cnpj,'12ABC34501DE35');
assert.equal(brasil.address.cityIbgeCode,'4115200');
assert.equal(brasil.primaryCnae,'4930202');

const cnpjws=normalizeCnpjWsPayload({
  razao_social:'BETA LOGISTICA LTDA',
  estabelecimento:{
    cnpj:'12345678000195',
    tipo:'Filial',
    nome_fantasia:'Beta Unidade',
    situacao_cadastral:'Ativa',
    data_inicio_atividade:'2020-01-01',
    tipo_logradouro:'Rua',
    logradouro:'Exemplo',
    numero:'10',
    bairro:'Centro',
    cep:'87000000',
    atividade_principal:{id:'4930202'},
    cidade:{nome:'Maringá',ibge_id:4115200},
    estado:{sigla:'PR'},
    pais:{iso2:'BR'},
  }
},'2026-10-04T23:00:00.000Z');

assert.equal(cnpjws.provider,'cnpjws');
assert.equal(cnpjws.establishmentRole,'BRANCH');
assert.equal(cnpjws.address.city,'Maringá');
assert.equal(cnpjws.address.state,'PR');

console.log('Company registry provider contract: PASS');
