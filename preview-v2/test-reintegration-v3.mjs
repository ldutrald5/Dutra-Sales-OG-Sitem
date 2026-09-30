import assert from 'node:assert/strict';
import fs from 'node:fs';

const handoff=fs.readFileSync('./quote-handoff-v3.js','utf8');
const proposal=fs.readFileSync('./proposal-entry-v3.js','utf8');
const prospecting=fs.readFileSync('./prospecting-execution-v3.js','utf8');
const operational=fs.readFileSync('./operational-crm-v3.js','utf8');
const server=fs.readFileSync('./server.mjs','utf8');

assert.match(handoff,/dutra:quote-handoff/,'handoff deve comunicar com o shell V3');
assert.match(handoff,/go\("proposal"\)/,'cotação deve permanecer no shell V3');
assert.match(proposal,/peWorkspaceFrame/,'proposta deve hospedar o motor oficial na própria tela');
assert.match(proposal,/embedded=1/,'motor legado deve rodar em modo embutido durante a migração');
assert.match(server,/dutraEmbedded/,'modo embutido deve esconder navegação duplicada do legado');

assert.match(operational,/summarizeCrmViews/,'V3 deve reutilizar agrupamento inteligente de leads');
assert.match(operational,/matchesCrmView/,'V3 deve usar o mesmo critério de visão do CRM legado');

assert.match(prospecting,/proposalLeadIds/,'fechamento deve ser atribuído a propostas do mesmo universo');
assert.match(prospecting,/Math\.min\(100,rate\(sales,proposals\)\)/,'taxa de fechamento não pode ultrapassar 100%');

assert.match(server,/technical-application-core-v3\.js/,'shell deve carregar motor técnico compartilhado');
console.log('V3 reintegration tests: PASS');
