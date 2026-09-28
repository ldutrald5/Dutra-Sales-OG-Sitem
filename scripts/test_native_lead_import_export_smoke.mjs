import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require=createRequire(import.meta.url);
const importer=require('../apps/sistema-og/services/spreadsheet-import-service.js');
const exporter=require('../apps/sistema-og/services/spreadsheet-export-service.js');
const builder=require('../apps/sistema-og/services/spreadsheet-xlsx-builder.js');

const initialLeads=[
  {
    id:'SMOKE-EXIST-1',
    internalCode:'1001',
    empresa:'Frota Alfa',
    nome:'Carlos',
    telefone:'44999990001',
    cnpj:'11111111000191',
    cidadeUf:'Maringá / PR',
    status:'novo',
    priority:'media',
    priorityBand:'media',
    conversationStage:'first_contact',
    temperature:'morno',
    potential:'medio',
    observacoes:'Registro existente deve ser atualizado sem perder identidade.',
    interactions:[],contacts:[],additionalPhones:[],referrals:[]
  },
  {
    id:'SMOKE-EXIST-2',
    internalCode:'2002',
    empresa:'Frota Beta',
    nome:'Marina',
    telefone:'44999990002',
    cnpj:'22222222000182',
    cidadeUf:'Londrina / PR',
    status:'contatado',
    priority:'alta',
    priorityBand:'alta',
    conversationStage:'talked',
    interactions:[],contacts:[],additionalPhones:[],referrals:[]
  }
];

const csv=[
  'Código OG;Empresa;Contato;Telefone;CNPJ;Cidade / UF;Status;Situação da conversa;Prioridade;Temperatura;Potencial;Próxima ação;Data de retorno;Observações',
  '3003;Frota Nova;Ana;44999990003;33333333000173;Cascavel / PR;Novo;Primeiro contato;Alta;Quente;Alto;Ligar amanhã;2026-09-29T09:00:00-03:00;Lead sintético novo',
  '1001;Frota Alfa Atualizada;Carlos;44999990001;11111111000191;Maringá / PR;Contatado;Já conversei;Urgente;Quente;Alto;Enviar proposta;2026-09-29T15:00:00-03:00;Observação da planilha não deve sobrescrever sem decisão explícita',
  '2002;Conflito Sintético;Teste;44999990004;11111111000191;Curitiba / PR;Novo;Primeiro contato;Média;Morno;Médio;Revisar cadastro;;Duplicidade proposital'
].join('\n');

const workbook=importer.csvToWorkbook(csv);
const source=importer.detectTabularSource(workbook);
assert.equal(source.sheetName,'CSV');
assert.ok(Object.keys(source.mapping).length>=10,'mapeamento automático deve reconhecer os campos principais');

const rows=importer.rowsFromSource(workbook,source);
assert.equal(rows.length,3);

const preview=importer.preview(rows,initialLeads);
const summary=importer.summarizePreview(preview);
assert.equal(summary.total,3);
assert.equal(summary.newCount,1,'um lead deve ser classificado como novo');
assert.equal(summary.updateCount,0,'a linha de atualização contém observação protegida e deve exigir revisão');
assert.equal(summary.duplicateCount,2,'uma atualização protegida + uma duplicidade ambígua devem exigir revisão');

const [newItem,updateItem,duplicateItem]=preview;
assert.equal(newItem.status,'NEW');
assert.equal(updateItem.status,'CONFLICT');
assert.equal(updateItem.matchedLeadId,'SMOKE-EXIST-1');
assert.equal(duplicateItem.status,'POSSIBLE_DUPLICATE');
assert.equal(duplicateItem.candidates.length,2,'conflito deve mostrar os dois clientes candidatos');

const decisions={
  [String(newItem.row.sourceRow)]:{action:'create',fields:{}},
  [String(updateItem.row.sourceRow)]:{
    action:'update',
    targetLeadId:'SMOKE-EXIST-1',
    fields:{notes:'keep'}
  },
  [String(duplicateItem.row.sourceRow)]:{action:'ignore',fields:{}}
};

const applied=importer.applyPreview(preview,initialLeads,decisions,{
  now:'2026-09-27T21:40:00-03:00',
  idFactory:()=> 'SMOKE-NEW-1'
});
assert.equal(applied.applied,2,'deve criar um lead e atualizar um existente');
assert.equal(applied.leads.length,3,'duplicidade ignorada não pode criar quarto registro');

const updated=applied.leads.find(lead=>lead.id==='SMOKE-EXIST-1');
assert.equal(updated.empresa,'Frota Alfa Atualizada');
assert.equal(updated.priorityBand,'urgente');
assert.equal(updated.priority,'alta');
assert.equal(updated.conversationStage,'talked');
assert.equal(updated.observacoes,'Registro existente deve ser atualizado sem perder identidade.','observação protegida deve permanecer intacta');

const created=applied.leads.find(lead=>lead.id==='SMOKE-NEW-1');
assert.equal(created.empresa,'Frota Nova');
assert.equal(created.conversationStage,'first_contact');
assert.equal(created.temperature,'quente');

const duplicateWasCreated=applied.leads.some(lead=>lead.empresa==='Conflito Sintético');
assert.equal(duplicateWasCreated,false,'duplicidade ignorada nunca deve ser gravada silenciosamente');

const allPayload=exporter.buildPayload(applied.leads,{
  scope:'all',
  generatedAt:'2026-09-27T21:41:00-03:00',
  scoreFn:lead=>lead.id==='SMOKE-NEW-1'?120:80
});
assert.equal(allPayload.crmRows.length,3);
assert.equal(allPayload.scopeLabel,'Todos os leads');

const currentView=[created];
const currentPayload=exporter.buildPayload(currentView,{
  scope:'current',
  generatedAt:'2026-09-27T21:41:00-03:00',
  scoreFn:()=>120
});
assert.equal(currentPayload.crmRows.length,1,'exportação da visão atual deve conter somente o recorte recebido');
assert.equal(currentPayload.scopeLabel,'Visão atual');
assert.equal(currentPayload.crmRows[0][1],'Frota Nova');

const bytes=builder.buildXlsx(allPayload);
assert.ok(bytes instanceof Uint8Array);
assert.equal(bytes[0],0x50);
assert.equal(bytes[1],0x4B);

const vendor=fs.readFileSync(new URL('../apps/sistema-og/assets/vendor/xlsx.full.min.js',import.meta.url),'utf8');
const sandbox={console,Uint8Array,ArrayBuffer,TextDecoder,TextEncoder,Buffer,setTimeout,clearTimeout};
sandbox.self=sandbox;
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(vendor,sandbox);
const parsed=sandbox.XLSX.read(Buffer.from(bytes),{type:'buffer'});
assert.deepEqual(Array.from(parsed.SheetNames),['🚀 HOJE','📋 CRM','📥 LISTA','👥 CONTATOS']);

const crmSheet=parsed.Sheets['📋 CRM'];
const aoa=sandbox.XLSX.utils.sheet_to_json(crmSheet,{header:1,raw:false,defval:''});
assert.equal(aoa[6][0],'Código cliente','cabeçalho CRM deve permanecer na linha 7');
assert.equal(aoa.slice(7).filter(row=>row.some(Boolean)).length,3,'XLSX final deve conter exatamente os três leads confirmados');

const exportedWorkbook={
  SheetNames:Array.from(parsed.SheetNames),
  sheets:Object.fromEntries(Array.from(parsed.SheetNames).map(name=>[
    name,
    sandbox.XLSX.utils.sheet_to_json(parsed.Sheets[name],{header:1,raw:false,defval:''})
  ]))
};
const roundTripRows=importer.readCrmRows(exportedWorkbook);
assert.equal(roundTripRows.length,3,'arquivo exportado deve voltar a ser legível pelo importador');
assert.ok(roundTripRows.some(row=>row.externalCode==='3003'&&row.company==='Frota Nova'));
assert.ok(roundTripRows.some(row=>row.externalCode==='1001'&&row.company==='Frota Alfa Atualizada'));

console.log('Native lead import/export smoke: PASS');
