import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const service = require('../apps/sistema-og/services/account-knowledge-service.js');

const lead = {
  segmentId: 'transportadora',
  pain: 'desgaste irregular de pneus',
  objection: 'preço',
  nextAction: 'validar ROI com gestor',
  vehicleTypes: ['rodotrem 9 eixos'],
  interactions: [
    { note: 'cliente quer reduzir custo por km' },
    { note: 'gestor pediu prova de economia' }
  ]
};

const query = service.queryForLead(lead);
assert.match(query,/transportadora/i);
assert.match(query,/desgaste irregular/i);
assert.match(query,/rodotrem 9 eixos/i);
assert.match(query,/reduzir custo por km/i);
assert.ok(query.length <= 500);
assert.match(service.commandForLead(lead),/^brain /);
assert.match(service.contextSummary(lead),/Dor:/);

const empty = service.commandForLead({});
assert.equal(empty,'brain produto vendas');

const app = fs.readFileSync('apps/sistema-og/app.js','utf8');
const html = fs.readFileSync('apps/sistema-og/index.html','utf8');
const sw = fs.readFileSync('apps/sistema-og/service-worker.js','utf8');

assert.match(app,/data-account-brain/);
assert.match(app,/OG_ACCOUNT_KNOWLEDGE\?\.commandForLead/);
assert.match(app,/openCommandCenter\(command\)/);
assert.match(html,/services\/account-knowledge-service\.js/);
assert.match(sw,/account-knowledge-service\.js/);
assert.match(sw,/SW_VERSION = 'v\d+'/);

console.log('KCC-01 contextual knowledge tests: PASS');
