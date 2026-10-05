import assert from 'node:assert/strict';
import normalizer from '../apps/sistema-og/services/address-normalizer.js';

const a=normalizer.normalizeAddress({
  addressRaw:' Av.  Colombo,  5790 ',
  street:' Av. Colombo ',
  number:' 5790 ',
  bairro:'Zona 7',
  cep:'87.020-900',
  city:'Maringá',
  uf:'pr'
});

assert.equal(a.addressRaw,'Av. Colombo, 5790');
assert.equal(a.street,'Av. Colombo');
assert.equal(a.streetNumber,'5790');
assert.equal(a.postalCode,'87020900');
assert.equal(a.state,'PR');
assert.equal(a.countryCode,'BR');
assert.equal(a.readyForGeocoding,true);
assert.match(a.formattedAddress,/Maringá - PR/);
assert.equal(normalizer.normalizeNumber('sem número'),'S/N');
assert.equal(normalizer.normalizePostalCode('1234'),'');
assert.equal(normalizer.normalizeState('Paraná'),'','não inferir UF a partir de texto livre');
assert.equal(normalizer.normalizeAddress({city:'Maringá',uf:'PR'}).readyForGeocoding,false,'cidade+UF sem rua/CEP não deve parecer endereço pronto');
assert.equal(normalizer.normalizeAddress({street:'Rodovia PR 317',city:'Maringá',uf:'PR'}).readyForGeocoding,true);

console.log('GEO address normalization contract: PASS');
