import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(__dirname,'..');
const playbookSource=fs.readFileSync(path.join(root,'preview-v2/sales-playbook-v3.js'),'utf8');
const sandbox={globalThis:{}};
vm.runInNewContext(playbookSource,sandbox,{filename:'sales-playbook-v3.js'});
const {buildAttackBrief,relationshipKey}=sandbox.globalThis.DUTRA_SALES_PLAYBOOK;

const cold=buildAttackBrief({status:'novo',empresa:'Conta A'},{});
assert.equal(cold.mode,'COLD');
assert.match(cold.objective,/Criar curiosidade/i);
assert.equal(cold.questions.length,3);

const gatekeeper=buildAttackBrief({relationshipStatus:'COLD'},{preferredContact:{roleCategory:'GATEKEEPER'}});
assert.equal(gatekeeper.mode,'GATEKEEPER');
assert.match(gatekeeper.avoid,/recepção/i);

const known=buildAttackBrief({relationshipStatus:'KNOWS_OG',fleetSize:12},{});
assert.equal(known.mode,'FOLLOW_UP');
assert.match(known.opening,/já conhece/i);
assert.match(known.preparation.join(' '),/frota/i);

const proposal=buildAttackBrief({relationshipStatus:'PREVIOUS_PROPOSAL',objections:'Preço'},{hasProposal:true});
assert.equal(proposal.mode,'PROPOSAL');
assert.match(proposal.objective,/bloqueio real/i);
assert.match(proposal.avoid,/conseguiu analisar/i);

const customer=buildAttackBrief({relationshipStatus:'CUSTOMER',fleetSize:20},{});
assert.equal(customer.mode,'CUSTOMER');
assert.match(customer.objective,/expansão/i);
assert.match(customer.avoid,/lead frio/i);

assert.equal(relationshipKey({pipelineStage:'WON'}),'CUSTOMER');
assert.equal(relationshipKey({pipelineStage:'PROPOSAL'}),'PREVIOUS_PROPOSAL');
assert.equal(relationshipKey({pipelineStage:'CONNECTED'}),'PREVIOUS_CONTACT');

const server=fs.readFileSync(path.join(root,'preview-v2/server.mjs'),'utf8');
assert.match(server,/sales-playbook-v3\.js/);
assert.ok(server.indexOf('/sales-playbook-v3.js')<server.indexOf('/operational-crm-v3.js'),'playbook deve carregar antes do CRM');

const crm=fs.readFileSync(path.join(root,'preview-v2/operational-crm-v3.js'),'utf8');
assert.match(crm,/DUTRA_SALES_PLAYBOOK/);
assert.match(crm,/FICHA DE ATAQUE/);
assert.match(crm,/ABERTURA RECOMENDADA/);
assert.match(crm,/PERGUNTAS-CHAVE/);

console.log('V3 Sales Playbook attack brief: PASS');