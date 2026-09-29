import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('./prospecting-execution-v3.js','utf8');
const server=fs.readFileSync('./server.mjs','utf8');
const bridge=fs.readFileSync('./core-bridge.js','utf8');

assert.match(server,/spreadsheet-import-service\.js/,'V3 deve carregar o importador XLSX existente');
assert.match(server,/\/workers\/spreadsheet-worker\.js/,'V3 deve expor o worker XLSX isolado');
assert.match(server,/\/assets\/vendor\/xlsx\.full\.min\.js/,'V3 deve expor apenas o bundle XLSX isolado ao worker');
assert.match(ui,/accept="\.csv,\.xlsx/,'importação de listas deve aceitar CSV e XLSX');
assert.match(ui,/rowsFromFile\(/,'XLSX deve passar pelo importador canônico');
assert.match(ui,/Buscar prospects/,'pesquisa pública deve estar ligada ao módulo');
assert.match(ui,/selectedContactByLead/,'sessão deve persistir a pessoa atual por conta');
assert.match(ui,/Preparar 60 contatos/,'pré-processamento em lote deve existir');
assert.match(ui,/Conversão operacional/,'dashboard deve priorizar conversão');
assert.match(ui,/GATEKEEPER/,'Call Mode precisa suportar gatekeeper');
assert.match(ui,/MARCAR REUNIÃO/,'Call AI deve mudar objetivo para reunião');
assert.match(bridge,/\['Meu Dia','Prospecção'\]/,'Prospecção premium não deve cair no legacy fallback');
console.log('Sales Execution UI integration: PASS');