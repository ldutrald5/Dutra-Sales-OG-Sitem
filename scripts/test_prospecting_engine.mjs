import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const parser = require('../apps/sistema-og/services/prospect-parser.js');
const crm = require('../apps/sistema-og/services/crm-service.js');
const engine = require('../apps/sistema-og/modules/prospecting-engine.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');

const tab = parser.parseLine('014508\tAJBAM SOLUÇÕES\tBeatriz\t5544991426479');
assert.equal(tab.codigo, '014508'); assert.equal(tab.empresa, 'AJBAM SOLUÇÕES'); assert.equal(tab.contato, 'Beatriz'); assert.equal(tab.telefone, '5544991426479');
const comma = parser.parseLine('Lucas Transportes, CNPJ 12.345.678/0001-90, João, 44999999999, falou com recepção');
assert.equal(comma.cnpj, '12345678000190'); assert.equal(comma.telefone, '44999999999'); assert.equal(comma.empresa, 'Lucas Transportes');
const pipe = parser.parseLine('Transportadora XPTO | cód 12877 | Marcos | 11999999999');
assert.equal(pipe.codigo, '12877'); assert.equal(pipe.telefone, '11999999999');
const incomplete = parser.parseLine('014508 AJBAM 5544991426479');
assert.ok(incomplete.empresa); assert.equal(incomplete.confidence, 'review');
assert.equal(parser.parseBulk('A 44999999999\n\nB 11999999999').length, 2);

const p1 = crm.createProspect({ empresa: 'A', telefone: '44999999999', cnpj: '12345678000190', codigo: '014508', operationalStatus: 'NEW_PROSPECT' }, { id: 'A', now: '2026-09-20T12:00:00Z' });
const p2 = crm.createProspect({ empresa: 'B', telefone: '11999999999', priority: 'alta', operationalStatus: 'NEW_PROSPECT' }, { id: 'B', now: '2026-09-21T12:00:00Z' });
assert.equal(crm.findPossibleDuplicates([p1], { cnpj: '12.345.678/0001-90' }).length, 1);
assert.equal(crm.findPossibleDuplicates([p1], { codigo: '014508' }).length, 1);
assert.equal(engine.prospectQueue([p1, p2])[0].id, 'B');
assert.equal(engine.nextProspect([p1, p2], 'B', []).id, 'A');
assert.equal(engine.nextProspect([p1, p2], 'B', ['A']).id, 'B');
assert.equal(engine.nextBestAction(p1).code, 'FIRST_CONTACT');
interactions.recordResult(p1, 'nao_atendeu', 'Sem resposta', { now: '2026-09-24T12:00:00Z' });
assert.equal(engine.wasProspected(p1), true); assert.equal(engine.nextBestAction(p1).code, 'RETRY');
const metrics = engine.sessionMetrics([{ type: 'processed', result: 'nao_atendeu' }, { type: 'attempt', channel: 'call' }, { type: 'processed', result: 'enviar_orcamento' }]);
assert.deepEqual(metrics, { processed: 2, calls: 1, whatsappActions: 0, interested: 0, quotes: 1, noAnswers: 1 });
const command = parser.parseNaturalCommand('Rodolog, falei com Carlos, pediu apresentação, retornar amanhã', new Date('2026-09-24T12:00:00Z'));
assert.equal(command.result, 'enviar_apresentacao'); assert.equal(command.contact, 'Carlos'); assert.ok(command.followUpAt);
const appSource = (await import('node:fs')).readFileSync('apps/sistema-og/app.js','utf8');
assert.ok(appSource.includes('renderSalesExecutionLauncher'), 'Prospecção deve expor o launcher Sales Execution');
assert.ok(appSource.includes('startSalesExecutionSession'), 'Prospecção deve iniciar sessão normalizada');
assert.ok(appSource.includes('materializeSalesExecutionMember'), 'Fila normalizada deve materializar contexto para o Call AI');
assert.ok(appSource.includes("state.callAI.returnTab = 'prospeccao'"), 'Call AI deve preservar origem na prospecção');
console.log('Prospecting engine critical flows: PASS');

// Stage 4 deterministic identity safety: presentation must never own another matcher.
const identity = crm.normalizeLead({id:'IDENTITY',empresa:'Frota Ágil Ltda',telefone:'5544999999999',cnpj:'12345678000190',email:'Vendas@Example.com',website:'https://www.example.com/contato',additionalPhones:[{phone:'5511999998888'}]});
for (const candidate of [{telefone:'(44) 99999-9999'}, {telefone:'11999998888'}, {email:' vendas@example.com '}, {site:'example.com/outro'}, {empresa:'Frota Agil Ltda'}, {id:'IDENTITY'}]) assert.deepEqual(crm.findPossibleDuplicates([identity],candidate).map(x=>x.id),['IDENTITY']);
assert.equal(crm.findPossibleDuplicates([identity],{}).length,0,'missing identity must never match everyone');
assert.equal(crm.findPossibleDuplicates([identity],{email:'other@example.com',site:'notexample.com',telefone:'11911111111',empresa:'Outra conta'}).length,0);
const ambiguous=crm.normalizeLead({...identity,id:'OTHER'});
assert.equal(crm.findPossibleDuplicates([identity,ambiguous],{cnpj:'12.345.678/0001-90'}).length,2,'matcher returns all possibilities, never picks first');
const discovery=crm.createProspect({empresa:'Descoberta',email:'found@example.com',website:'https://example.com',observacoes:'Trecho não confirmado',importMeta:{verification:'imported_not_independently_confirmed'}},{id:'DISCOVERY'});
assert.equal(discovery.importMeta.verification,'imported_not_independently_confirmed');assert.equal(discovery.observacoes,'Trecho não confirmado');assert.equal(discovery.email,'found@example.com');
console.log('Stage 4 canonical deterministic identity/provenance: PASS');
