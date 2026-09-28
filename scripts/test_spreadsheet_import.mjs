import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const service=require('../apps/sistema-og/services/spreadsheet-import-service.js');

const sheets={};
for(const name of service.CRM_SHEETS){
  sheets[name]=name==='📋 CRM'
    ? [['meta'],['meta'],['meta'],['meta'],['meta'],['meta'],service.CRM_HEADERS,['0012','Rodolog','04499999999','novo','Morno','Ligar amanhã','','Alta','','Nota humana','','Prospect','Lista','WhatsApp','','Observação protegida','','12345678000190','','PJ','Maringá / PR','João','1']]
    : [['fixture']];
}
const wb={SheetNames:service.CRM_SHEETS.slice(),sheets};
assert.equal(service.validateWorkbook(wb).valid,true);
const rows=service.readCrmRows(wb);
assert.equal(rows[0].externalCode,'0012');
assert.equal(rows[0].phone,'04499999999');

let preview=service.preview(rows,[]);
assert.equal(preview[0].status,'NEW');

const leads=[{id:'L1',internalCode:'0012',empresa:'Rodolog',telefone:'04499999999',status:'novo',nextAction:'Ligar amanhã',priority:'Alta',observacoes:'Texto diferente'}];
preview=service.preview(rows,leads);
assert.equal(preview[0].status,'CONFLICT');
assert.match(preview[0].matchKey,/Código OG/);
assert.ok(preview[0].changes.some(item=>item.field==='notes'&&item.protected));

const kept=service.applyPreview(preview,leads,{'8':{action:'update',fields:{notes:'keep'}}},{now:'2026-09-24T12:00:00.000Z'});
assert.ok(kept.leads[0].empresa==='Rodolog');
assert.equal(kept.leads[0].observacoes,'Texto diferente');

const merged=service.applyPreview(preview,leads,{'8':{action:'update',fields:{notes:'append'}}},{now:'2026-09-24T12:00:00.000Z'});
assert.ok(merged.applied>=1);
assert.match(merged.leads[0].observacoes,/Observação protegida/);

const created=service.applyPreview(service.preview(rows,[]),[],{'8':{action:'create',fields:{}}},{now:'2026-09-24T12:00:00.000Z',idFactory:()=> 'L2'});
assert.equal(created.leads[0].id,'L2');
assert.equal(service.preview(rows,created.leads)[0].status,'UNCHANGED');

const csv='Código OG;Empresa;Telefone;CNPJ;Cidade / UF;Situação da conversa;Prioridade;Observações\n0015;Trans Paraná;44999998888;12345678000190;Maringá / PR;Aguardando resposta;Urgente;Retornar sexta\n';
const csvBook=service.csvToWorkbook(csv);
const source=service.detectTabularSource(csvBook);
assert.equal(source.canonical,false);
assert.equal(source.sheetName,'CSV');
assert.equal(source.mapping.externalCode,0);
assert.equal(source.mapping.company,1);
assert.equal(source.mapping.phone,2);
assert.equal(source.mapping.conversationStage,5);
const genericRows=service.rowsFromSource(csvBook,source);
assert.equal(genericRows.length,1);
assert.equal(genericRows[0].company,'Trans Paraná');
assert.equal(genericRows[0].priority,'Urgente');

const genericPreview=service.preview(genericRows,[]);
assert.equal(genericPreview[0].status,'NEW');
const genericCreated=service.applyPreview(genericPreview,[],{'2':{action:'create'}},{now:'2026-09-27T12:00:00.000Z',idFactory:()=> 'CSV1'});
assert.equal(genericCreated.leads[0].conversationStage,'waiting_response');
assert.equal(genericCreated.leads[0].priorityBand,'urgente');
assert.equal(genericCreated.leads[0].priority,'alta');

const existing=[
  {id:'A',internalCode:'99',empresa:'Empresa A',telefone:'44911111111'},
  {id:'B',cnpj:'12345678000190',empresa:'Empresa B',telefone:'44922222222'}
];
const ambiguousRow=[{sourceRow:2,externalCode:'99',company:'Empresa C',phone:'',document:'12345678000190'}];
const ambiguous=service.preview(ambiguousRow,existing);
assert.equal(ambiguous[0].status,'POSSIBLE_DUPLICATE');
assert.equal(ambiguous[0].candidates.length,2);

const duplicateFileRows=[
  {sourceRow:2,externalCode:'77',company:'Um',phone:'44955556666'},
  {sourceRow:3,externalCode:'77',company:'Dois',phone:'44977778888'}
];
const duplicatePreview=service.preview(duplicateFileRows,[]);
assert.equal(duplicatePreview[0].status,'POSSIBLE_DUPLICATE');
assert.equal(duplicatePreview[1].status,'POSSIBLE_DUPLICATE');

const updateSource=[{sourceRow:2,externalCode:'99',company:'Empresa A atualizada',phone:'44911111111'}];
const updatePreview=service.preview(updateSource,existing);
assert.equal(updatePreview[0].status,'SAFE_UPDATE');
const updated=service.applyPreview(updatePreview,existing,{'2':{action:'update'}},{now:'2026-09-27T12:00:00.000Z'});
assert.equal(updated.leads[0].empresa,'Empresa A atualizada');
assert.equal(updated.leads.length,2);

const ignored=service.applyPreview(updatePreview,existing,{'2':{action:'ignore'}},{now:'2026-09-27T12:00:00.000Z'});
assert.equal(ignored.applied,0);
assert.equal(ignored.leads[0].empresa,'Empresa A');

const summary=service.summarizePreview([...genericPreview,...ambiguous]);
assert.equal(summary.total,2);
assert.equal(summary.newCount,1);
assert.equal(summary.duplicateCount,1);

const newRecommendation=service.recommendDecision(genericPreview[0]);
assert.equal(newRecommendation.action,'create');
assert.equal(newRecommendation.needsReview,false);

const safeUpdateRecommendation=service.recommendDecision(updatePreview[0]);
assert.equal(safeUpdateRecommendation.action,'update');
assert.equal(safeUpdateRecommendation.targetLeadId,'A');

const conflictRecommendation=service.recommendDecision(preview[0]);
assert.equal(conflictRecommendation.action,'update');
assert.equal(conflictRecommendation.targetLeadId,'L1');
assert.match(conflictRecommendation.reason,/histórico protegido/);

const duplicateRecommendation=service.recommendDecision(ambiguous[0]);
assert.equal(duplicateRecommendation.action,'ignore');
assert.equal(duplicateRecommendation.needsReview,true);

const plan=service.recommendedDecisionMap([genericPreview[0],updatePreview[0],preview[0],ambiguous[0]]);
assert.equal(plan['2'].action,'ignore','source rows duplicated across fixtures must resolve to the last explicit fixture in this isolated map');

const uniquePlan=service.recommendedDecisionMap([
  {...genericPreview[0],row:{...genericPreview[0].row,sourceRow:21}},
  {...updatePreview[0],row:{...updatePreview[0].row,sourceRow:22}},
  {...preview[0],row:{...preview[0].row,sourceRow:23}},
  {...ambiguous[0],row:{...ambiguous[0].row,sourceRow:24}}
]);
assert.equal(uniquePlan['21'].action,'create');
assert.equal(uniquePlan['22'].action,'update');
assert.equal(uniquePlan['23'].action,'update');
assert.equal(uniquePlan['23'].fields.notes,'keep');
assert.equal(uniquePlan['24'].action,'ignore');

const recommendationSummary=service.summarizeRecommendations([
  genericPreview[0],updatePreview[0],preview[0],ambiguous[0]
]);
assert.equal(recommendationSummary.ready,3);
assert.equal(recommendationSummary.create,1);
assert.equal(recommendationSummary.update,2);
assert.equal(recommendationSummary.manualReview,1);

const appSource=fs.readFileSync(new URL('../apps/sistema-og/app.js',import.meta.url),'utf8');
const htmlSource=fs.readFileSync(new URL('../apps/sistema-og/index.html',import.meta.url),'utf8');
assert.match(appSource,/recommendDecision\(item\)/);
assert.match(appSource,/crm-import-reset-recommendations/);
assert.match(htmlSource,/Decisões recomendadas já vêm prontas/);
assert.match(htmlSource,/crm-import-auto-note/);

assert.throws(()=>service.preflightFile({name:'dados.xls',size:100}),/\.xlsx ou \.csv/);
assert.equal(service.preflightFile({name:'dados.csv',type:'text/csv',size:100}),true);
assert.throws(()=>service.preflightFile({name:'dados.xlsx',size:5_000_001}),/5 MB/);
assert.throws(()=>service.validateSanitizedWorkbook({SheetNames:['x'],sheets:{x:'bad'}}),/limite de linhas/);
assert.throws(()=>service.validateSanitizedWorkbook({SheetNames:['x'],sheets:{x:[["x".repeat(10_001)]]}}),/limite de texto/);
assert.throws(()=>service.validateSanitizedWorkbook(null),/inválido/);
assert.equal(service.IMPORT_LIMITS.maxCells,100000);

console.log('Spreadsheet import tests: PASS');
