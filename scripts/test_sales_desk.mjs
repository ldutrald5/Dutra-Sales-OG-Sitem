import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const crm = require('../apps/sistema-og/services/crm-service.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');
const whatsapp = require('../apps/sistema-og/services/whatsapp-service.js');
const callContext = require('../apps/sistema-og/services/call-ai-context.js');
const intelligence = require('../apps/sistema-og/modules/lead-intelligence.js');
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
interactions.setNextAction(prospect, 'Ligar para João', '2026-09-25T09:00', {
  now: '2026-09-24T14:01:00.000Z',
  reason: 'Retorno combinado após negociação',
  objective: 'Confirmar o próximo passo',
  expectedResult: 'Nova data ou avanço confirmado'
});
assert.equal(prospect.nextAction, 'Ligar para João');
assert.equal(prospect.followUpAt, '2026-09-25T09:00');
assert.equal(prospect.nextActionReason, 'Retorno combinado após negociação');
assert.equal(prospect.nextActionObjective, 'Confirmar o próximo passo');
assert.equal(prospect.nextActionExpectedResult, 'Nova data ou avanço confirmado');

// Mudança somente de data preserva o contexto da mesma ação.
interactions.setNextAction(prospect, 'Ligar para João', '2026-09-26T09:00', { now: '2026-09-24T14:02:00.000Z' });
assert.equal(prospect.nextActionReason, 'Retorno combinado após negociação');
assert.equal(prospect.nextActionObjective, 'Confirmar o próximo passo');
assert.equal(prospect.nextActionExpectedResult, 'Nova data ou avanço confirmado');

// Mudança material da ação sem novos metadados invalida o contexto anterior.
interactions.setNextAction(prospect, 'Enviar apresentação', '2026-09-26T10:00', { now: '2026-09-24T14:03:00.000Z' });
assert.equal(prospect.nextActionReason, '');
assert.equal(prospect.nextActionObjective, '');
assert.equal(prospect.nextActionExpectedResult, '');

const noInterestLead = crm.createProspect({ empresa:'Sem Interesse', nome:'Maria' }, { id:'L3', now:'2026-09-24T12:00:00.000Z' });
noInterestLead.conversationStage = 'interested';
interactions.recordResult(noInterestLead, 'sem_interesse', 'Cliente informou que não tem interesse agora.', { now:'2026-09-24T14:04:00.000Z' });
assert.equal(noInterestLead.status, 'perdido');
assert.equal(intelligence.nextBestAction(noInterestLead, new Date('2026-09-24T15:00:00.000Z')).action, '', 'resultado sem interesse não pode gerar ação genérica');
assert.equal(intelligence.conversationStage(noInterestLead), 'not_interested', 'status perdido deve neutralizar estágio antigo para a inteligência');

const queue = desk.selectQueue([legacy, prospect], 'all', 'nova', new Date('2026-09-24T15:00:00.000Z'));
assert.equal(queue.length, 1);
assert.equal(queue[0].id, 'L2');

const queueNow = new Date('2026-09-27T12:00:00-03:00');
const queueCandidates = [
  { id:'Q1', priorityBand:'urgente', priority:'alta', conversationStage:'negotiation', followUpAt:'2026-09-27T09:00:00-03:00', nextAction:'Ligar' },
  { id:'Q2', priority:'alta', conversationStage:'waiting_response', followUpAt:'2026-09-28T09:00:00-03:00', nextAction:'Retornar' }
];
assert.equal(desk.score(queueCandidates[0], queueNow), intelligence.score(queueCandidates[0], queueNow), 'Mesa deve usar exatamente o score canônico');
assert.deepEqual(
  desk.selectQueue(queueCandidates, 'all', '', queueNow).map(item=>item.id),
  intelligence.filterSort(queueCandidates, {}, queueNow).map(item=>item.id),
  'Fila do Meu Dia e motor canônico devem produzir a mesma ordem'
);

const context = callContext.build(prospect);
assert.equal(context.company.id, 'L2');
assert.equal(context.recentInteractions.length, 5, 'as duas mudanças de próxima ação também devem permanecer no histórico recente');
assert.equal(context.nextAction.reason, '');
assert.equal(context.nextAction.objective, '');
assert.equal(context.nextAction.expectedResult, '');
assert.equal(Object.hasOwn(context, 'knowledge'), false);

const appSource = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const htmlSource = fs.readFileSync(new URL('../apps/sistema-og/index.html', import.meta.url), 'utf8');
assert.match(appSource, /message_prepared/);
assert.match(appSource, /whatsapp_opened/);
assert.doesNotMatch(appSource, /message_sent.*openDeskWhatsApp/);
assert.match(htmlSource, /id="sales-desk-client"/);
assert.match(appSource, /sales-desk-now/,'Meu Dia deve destacar uma única próxima ação');
assert.match(appSource, /Registrar conversa \/ retorno/,'registro operacional deve ficar em divulgação progressiva');
assert.match(appSource, /sales-desk-history.*Histórico recente/s,'histórico não deve competir com a ação principal no mobile');

console.log('Sales Desk critical flows: PASS');
