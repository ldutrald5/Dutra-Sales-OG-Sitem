import assert from 'node:assert/strict';
import fs from 'node:fs';

const operational=fs.readFileSync('./operational-crm-v3.js','utf8');
const bridge=fs.readFileSync('./core-bridge.js','utf8');
const server=fs.readFileSync('./server.mjs','utf8');

assert.match(server,/operational-crm-v3\.js/,'V3 deve carregar a camada operacional de Home e Cliente 360');
assert.doesNotMatch(bridge,/prompt\(/,'Cliente 360 não pode depender de prompt nativo');
assert.match(bridge,/\$\$\('\.moduleRow'\)\.forEach/,'menu Mais deve bindar todos os módulos sem erro de querySelector');
assert.match(bridge,/getSelectedLead/,'camada premium precisa acessar a conta selecionada');
assert.match(bridge,/dutra:client/,'mudança de conta deve emitir evento para telas premium');
assert.match(operational,/actionQueue\(/,'Home deve usar próximas ações reais');
assert.match(operational,/generatedDocuments/,'Cliente 360 deve contar propostas oficiais reais');
assert.match(operational,/callAttempts/,'Histórico deve incluir tentativas de ligação');
assert.match(operational,/meetingsFor/,'Cliente 360 deve incluir reuniões reais');
assert.match(operational,/contactsFor/,'Cliente 360 deve usar mapa real de pessoas');
assert.match(operational,/clientPickerInput/,'Cliente 360 precisa permitir trocar de conta sem sair da tela');
assert.match(operational,/DUTRA_QUOTE_HANDOFF/,'proposta do Cliente 360 deve abrir o motor oficial');
assert.match(operational,/DUTRA_ACTION_CENTER/,'próxima ação deve usar fluxo estruturado');
for (const fake of ['Lorentrans','Biener','Vendruscolo','Aragão']) {
  assert.doesNotMatch(operational,new RegExp(fake,'i'),'camada operacional não pode depender de cliente fictício/fixo: '+fake);
}
console.log('Operational Home + Client 360 tests: PASS');