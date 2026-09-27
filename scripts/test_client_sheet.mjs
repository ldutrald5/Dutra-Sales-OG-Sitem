import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const crm=require('../apps/sistema-og/services/crm-service.js');

const base=crm.normalizeLead({
  id:'L1',
  empresa:'Transportes Alfa',
  nome:'Carlos',
  telefone:'44 99999-0000',
  internalCode:'4626261',
  status:'novo',
  additionalPhones:[
    {label:'Financeiro',phone:'44 3222-1000'},
    {label:'Duplicado',phone:'44 3222-1000'}
  ],
  referrals:[{name:'João',company:'Beta Log',phone:'44 98888-7777',note:'Indicação do Carlos'}]
});

assert.equal(base.internalCode,'4626261');
assert.equal(base.additionalPhones.length,1,'telefones extras duplicados devem ser removidos');
assert.equal(base.additionalPhones[0].phone,'4432221000');
assert.equal(base.referrals[0].company,'Beta Log');
assert.equal(crm.matchesSearch(base,'4626261'),true,'código OG deve localizar cliente');
assert.equal(crm.matchesSearch(base,'32221000'),true,'telefone extra deve localizar cliente');
assert.equal(crm.matchesSearch(base,'Beta Log'),true,'indicação deve localizar cliente');
assert.equal(crm.matchesSearch(base,'cliente inexistente'),false);

const other=crm.normalizeLead({id:'L2',empresa:'Outra',internalCode:'9001'});
assert.equal(crm.findInternalCodeConflict([base,other],'9001','L1')?.id,'L2');
assert.equal(crm.findInternalCodeConflict([base,other],'4626261','L1'),null,'o próprio código não é conflito');

const updated=crm.updateLeadProfile(base,{
  internalCode:'7007',
  status:'novo',
  additionalPhones:[{label:'Oficina',phone:'44911112222'}],
  referrals:[{name:'Marcos',company:'Gamma',phone:'44999998888',note:'Falar amanhã'}],
  pain:'Desgaste irregular'
},{now:'2026-09-27T04:45:00.000Z'});
assert.equal(updated.id,'L1');
assert.equal(updated.internalCode,'7007');
assert.equal(updated.status,'novo','ter código OG não pode transformar prospect em venda');
assert.equal(updated.additionalPhones[0].label,'Oficina');
assert.equal(base.internalCode,'4626261','edição não deve mutar objeto original');
const changed=crm.diffProfile(base,updated);
assert.ok(changed.includes('internalCode'));
assert.ok(changed.includes('additionalPhones'));
assert.ok(changed.includes('referrals'));
assert.ok(changed.includes('pain'));

const app=fs.readFileSync(new URL('../apps/sistema-og/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../apps/sistema-og/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../apps/sistema-og/styles.css',import.meta.url),'utf8');

assert.match(app,/function openClientSheet\(leadId\)/,'ficha lateral deve existir');
assert.match(app,/data-client-crm.*openClientSheet|\[data-client-crm\].*openClientSheet/s,'Meu Dia deve abrir ficha lateral');
assert.match(app,/client\.profile\.updated/,'edição deve deixar trilha');
assert.match(app,/client\.og_code\.updated/,'alteração de código OG deve deixar trilha');
assert.match(app,/findInternalCodeConflict/,'código OG duplicado deve ser bloqueado');
assert.match(app,/data-add-extra-phone/,'ficha deve permitir número adicional');
assert.match(app,/data-add-referral/,'ficha deve permitir indicação');
assert.match(app,/Código de cadastro OG; independente do status de compra/,'código OG não pode implicar compra');
assert.match(app,/OG_CRM_SERVICE\.matchesSearch\(lead, state\.leadSearchQuery\)/,'CRM deve pesquisar por perfil completo');
assert.match(app,/OG_CRM_SERVICE\.matchesSearch\(lead, input\.value\)/,'Call AI deve aceitar busca por código');
assert.match(html,/Buscar nome, código OG, telefone, CNPJ/,'campo CRM deve comunicar busca por código');
assert.match(html,/Código OG/,'CRM deve exibir código OG');
assert.doesNotMatch(html,/id="crm-lead-inspector"/,'inspector antigo não deve competir com a ficha lateral');
assert.match(css,/\.client-sheet-overlay/,'estilos da ficha lateral ausentes');
assert.match(css,/\.crm-client-row/,'novo CRM visual ausente');

console.log('Client sheet + CRM workspace tests: PASS');
