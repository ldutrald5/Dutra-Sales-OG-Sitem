import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const service=require('../apps/sistema-og/services/spreadsheet-export-service.js');
const importer=require('../apps/sistema-og/services/spreadsheet-import-service.js');

assert.equal(service.CRM_HEADERS.length,23);
assert.equal(service.EXPORT_HEADERS[0],'Código cliente');
assert.equal(service.EXPORT_HEADERS[22],'Nº contatos');
assert.ok(service.EXPORT_HEADERS.includes('Situação da conversa'));
assert.ok(service.EXPORT_HEADERS.includes('Objeções'));

const lead={
  id:'L1',internalCode:'0012',empresa:'Rodolog Transportes',nome:'João',telefone:'44999999999',
  additionalPhones:[{phone:'4433334444'},'44988887777'],email:'joao@example.com',cnpj:'12345678000190',
  cidadeUf:'Maringá / PR',segmentId:'transportadora',status:'negociacao',conversationStage:'waiting_response',
  priorityBand:'urgente',priority:'alta',temperature:'quente',potential:'alto',decisionMaker:'João',fleetSize:30,
  pain:'Desgaste irregular',objections:['preço','prazo'],nextAction:'Ligar sexta',followUpAt:'2026-09-28T14:00:00-03:00',
  accountSummary:'Falou com o gestor',observacoes:'Cliente estratégico',sourceLabel:'Indicação',sourceChannel:'whatsapp',
  sourceList:'Carteira setembro',referrals:[{name:'Carlos',company:'ABC',phone:'44911112222'}],
  interactions:[{at:'2026-09-27T10:00:00-03:00',note:'Pediu retorno'}],
  contacts:[{name:'Maria',phone:'44977776666',email:'maria@example.com',role:'Financeiro'}],
  createdAt:'2026-09-20T12:00:00.000Z',updatedAt:'2026-09-27T12:00:00.000Z'
};
const payload=service.buildPayload([lead],{scope:'current',generatedAt:'2026-09-27T12:00:00.000Z',scoreFn:()=>155});
assert.equal(payload.scope,'current');
assert.equal(payload.scopeLabel,'Visão atual');
assert.equal(payload.crmRows.length,1);
assert.equal(payload.crmRows[0][0],'0012');
assert.equal(payload.crmRows[0][1],'Rodolog Transportes');
assert.equal(payload.crmRows[0][16],155);
assert.equal(payload.crmRows[0][18],'Rodolog Transportes');
assert.equal(payload.crmRows[0][19],'PJ');
assert.equal(payload.crmRows[0][22],2);
assert.equal(payload.crmRows[0][23],'4433334444 | 44988887777');
assert.equal(payload.crmRows[0][25],'waiting_response');
assert.equal(payload.crmRows[0][29],'preço | prazo');
assert.equal(payload.contactRows.length,2);
assert.match(payload.contactRows[0].join(' '),/João/);
assert.match(payload.contactRows[1].join(' '),/Maria/);

const crmWorkbook={
  SheetNames:importer.CRM_SHEETS.slice(),
  sheets:{
    '🚀 HOJE':[['fixture']],
    '📋 CRM':[
      ['DUTRA OS — CRM MASTER'],['Escopo'],['Gerado'],['Total'],['Fonte'],[],
      payload.headers,
      payload.crmRows[0]
    ],
    '📥 LISTA':[['fixture']],
    '👥 CONTATOS':[['fixture']]
  }
};
const roundTrip=importer.readCrmRows(crmWorkbook)[0];
assert.equal(roundTrip.externalCode,'0012');
assert.equal(roundTrip.company,'Rodolog Transportes');
assert.equal(roundTrip.conversationStage,'waiting_response');
assert.equal(roundTrip.decisionMaker,'João');
assert.equal(roundTrip.fleetSize,'30');
assert.equal(roundTrip.pain,'Desgaste irregular');
assert.equal(roundTrip.objections,'preço | prazo');
assert.equal(service.safeFilename('all','2026-09-27T12:34:56.000Z'),'DUTRA_OS_Leads_Todos_20260927123456.xlsx');
assert.equal(service.safeFilename('current','2026-09-27T12:34:56.000Z'),'DUTRA_OS_Leads_Visao_Atual_20260927123456.xlsx');
assert.throws(()=>service.buildPayload(new Array(service.MAX_EXPORT_ROWS+1).fill({})),/limitada/);

console.log('Spreadsheet export tests: PASS');
