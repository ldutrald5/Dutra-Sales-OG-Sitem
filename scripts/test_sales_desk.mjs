import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const crm = require('../apps/sistema-og/services/crm-service.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');
const whatsapp = require('../apps/sistema-og/services/whatsapp-service.js');
const callContext = require('../apps/sistema-og/services/call-ai-context.js');
const desk = require('../apps/sistema-og/modules/sales-desk.js');

assert.equal(whatsapp.normalizeBrazilianPhone('(44) 99999-1234'), '5544999991234');
assert.equal(whatsapp.normalizeBrazilianPhone('55 44 3333-1234'), '554433331234');
assert.equal(whatsapp.normalizeBrazilianPhone('123'), '');
assert.equal(whatsapp.buildLink('(44) 99999-1234', 'Olá'), 'https://wa.me/5544999991234?text=Ol%C3%A1');

const filled = whatsapp.fillTemplate('follow_up', { primeiro_nome: 'João', empresa: 'Rodolog', vendedor: 'Lucas', assunto: 'a frota' });
assert.match(filled.text, /João/);
assert.equal(filled.missing.length, 0);
assert.deepEqual(whatsapp.fillTemplate('orcamento', { primeiro_nome: 'Ana' }).missing.sort(), ['empresa']);

const legacy = crm.normalizeLead({ id: 'L1', empresa: 'Rodolog', telefone: '(44) 3333-0000' });
assert.equal(legacy.id, 'L1');
assert.deepEqual(legacy.interactions, []);
assert.equal(legacy.priority, 'media');
const prospect = crm.createProspect({ empresa: 'Nova Frota', telefone: '44999991234', nome: 'João' }, { id: 'L2', now: '2026-09-24T12:00:00.000Z' });
assert.equal(prospect.id, 'L2');
assert.equal(crm.findPossibleDuplicates([legacy, prospect], { empresa: 'nova frota' }).length, 1);
assert.equal(crm.findPossibleDuplicates([legacy], { telefone: '4433330000' }).length, 1);

const note = interactions.addInteraction(prospect, { note: 'Frota com 80 veículos.', type: 'nota' }, { now: '2026-09-24T13:00:00.000Z' });
assert.equal(note.entityId, 'L2');
assert.equal(prospect.interactions.length, 1);
interactions.recordResult(prospect, 'negociacao', '', { now: '2026-09-24T14:00:00.000Z' });
assert.equal(prospect.status, 'negociacao');
interactions.setNextAction(prospect, 'Ligar para João', '2026-09-25T09:00', { now: '2026-09-24T14:01:00.000Z' });
assert.equal(prospect.nextAction, 'Ligar para João');
assert.equal(prospect.followUpAt, '2026-09-25T09:00');

const queue = desk.selectQueue([legacy, prospect], 'all', 'nova', new Date('2026-09-24T15:00:00.000Z'));
assert.equal(queue.length, 1);
assert.equal(queue[0].id, 'L2');

const context = callContext.build(prospect);
assert.equal(context.company.id, 'L2');
assert.equal(context.recentInteractions.length, 3);
assert.equal(Object.hasOwn(context, 'knowledge'), false);

const appSource = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const htmlSource = fs.readFileSync(new URL('../apps/sistema-og/index.html', import.meta.url), 'utf8');
assert.match(appSource, /message_prepared/);
assert.match(appSource, /whatsapp_opened/);
assert.doesNotMatch(appSource, /message_sent.*openDeskWhatsApp/);
assert.match(htmlSource, /id="sales-desk-client"/);

console.log('Sales Desk critical flows: PASS');
