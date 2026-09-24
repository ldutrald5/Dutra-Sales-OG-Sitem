import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const XLSX=require('xlsx');
const service=require('../apps/sistema-og/services/spreadsheet-import-service.js');
const wb=XLSX.utils.book_new();
for(const name of service.CRM_SHEETS){const data=name==='📋 CRM'?[["meta"],["meta"],["meta"],["meta"],["meta"],["meta"],service.CRM_HEADERS,['0012','Rodolog','04499999999','novo','Morno','Ligar amanhã','','Alta','','Nota humana','','Prospect','Lista','WhatsApp','','Observação protegida','','12345678000190','','PJ','Maringá / PR','João','1']]:[['fixture']];XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(data),name);}
const validation=service.validateWorkbook(wb);assert.equal(validation.valid,true);
const rows=service.readCrmRows(wb);assert.equal(rows[0].externalCode,'0012');assert.equal(rows[0].phone,'04499999999');
let preview=service.preview(rows,[]);assert.equal(preview[0].status,'NEW');
const leads=[{id:'L1',internalCode:'0012',empresa:'Rodolog',telefone:'04499999999',status:'novo',nextAction:'Ligar amanhã',priority:'Alta',observacoes:'Texto diferente'}];
preview=service.preview(rows,leads);assert.equal(preview[0].status,'CONFLICT');assert.equal(preview[0].matchKey,'external_code');
const sameRows=[{...rows[0],notes:'Texto diferente'}];assert.equal(service.preview(sameRows,leads)[0].status,'UNCHANGED');
const contract=service.protectedContract();assert.ok(contract.formula.includes('📋 CRM!Q:Q'));assert.ok(contract.manual.includes('📋 CRM!P:P'));
assert.equal(typeof service.readArrayBuffer,'function');
console.log('Spreadsheet CRM read-only preview checks: PASS');
