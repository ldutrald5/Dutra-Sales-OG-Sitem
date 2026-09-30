import assert from 'node:assert/strict';
import fs from 'node:fs';

const handoff=fs.readFileSync('./quote-handoff-v3.js','utf8');
const proposal=fs.readFileSync('./proposal-entry-v3.js','utf8');
const prospecting=fs.readFileSync('./prospecting-execution-v3.js','utf8');
const operational=fs.readFileSync('./operational-crm-v3.js','utf8');
const server=fs.readFileSync('./server.mjs','utf8');

assert.match(handoff,/dutra:quote-handoff/,'handoff deve comunicar com o shell V3');
assert.match(handoff,/go\("proposal"\)/,'cotação deve permanecer no shell V3');
assert.match(proposal,/EDITOR V1 INTEGRADO/,'proposta deve usar editor nativo na própria tela');
assert.match(proposal,/prepareTrackingDraft/,'editor nativo deve persistir pelo motor oficial');
assert.match(proposal,/launchLegacy/,'motor legado deve permanecer como fallback explícito durante a migração');
assert.doesNotMatch(proposal,/iframe class="peWorkspaceFrame"/,'fluxo principal não deve depender do iframe legado');
assert.match(server,/dutraEmbedded/,'modo embutido deve esconder navegação duplicada do legado');

assert.match(operational,/summarizeCrmViews/,'V3 deve reutilizar agrupamento inteligente de leads');
assert.match(operational,/matchesCrmView/,'V3 deve usar o mesmo critério de visão do CRM legado');

assert.match(prospecting,/proposalLeadIds/,'fechamento deve ser atribuído a propostas do mesmo universo');
assert.match(prospecting,/Base CRM pronta para trabalhar/,'Prospecção deve reaproveitar as visões inteligentes da base antiga');
assert.match(prospecting,/createListFromCrmView/,'visão CRM deve virar lista operacional sem recriar conta');
assert.match(prospecting,/Math\.min\(100,rate\(sales,proposals\)\)/,'taxa de fechamento não pode ultrapassar 100%');

assert.match(server,/technical-application-core-v3\.js/,'shell deve carregar motor técnico compartilhado');
console.log('V3 reintegration tests: PASS');
