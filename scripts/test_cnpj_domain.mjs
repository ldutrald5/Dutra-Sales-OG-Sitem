import assert from 'node:assert/strict';
import cnpj from '../apps/sistema-og/domain/cnpj.js';

assert.equal(cnpj.normalize('12.ABC.345/01DE-35'), '12ABC34501DE35');
assert.equal(cnpj.format('12ABC34501DE35'), '12.ABC.345/01DE-35');
assert.equal(cnpj.root('12.ABC.345/01DE-35'), '12ABC345');
assert.equal(cnpj.order('12.ABC.345/01DE-35'), '01DE');
assert.equal(cnpj.calculateCheckDigits('12ABC34501DE'), '35');
assert.equal(cnpj.isValid('12.ABC.345/01DE-35'), true);
assert.equal(cnpj.isValid('12.ABC.345/01DE-34'), false);

assert.equal(cnpj.normalize('12.345.678/0001-95'), '12345678000195');
assert.equal(cnpj.calculateCheckDigits('123456780001'), '95');
assert.equal(cnpj.isValid('12.345.678/0001-95'), true);
assert.equal(cnpj.format('12345678000195'), '12.345.678/0001-95');

assert.equal(cnpj.isShape('AB.CDE.FGH/12IJ-34'), true);
assert.equal(cnpj.isShape('AB.CDE.FGH/12IJ-KL'), false, 'dígitos verificadores continuam numéricos');
assert.equal(cnpj.isValid('00.000.000/0000-00'), false, 'sequência trivial não pode ser aceita como CNPJ');
assert.equal(cnpj.normalize('AB_CD'), 'AB_CD', 'normalização não deve apagar símbolo inválido silenciosamente');
assert.equal(cnpj.isShape('AB_CD'), false);

console.log('CNPJ alphanumeric domain contract: PASS');
