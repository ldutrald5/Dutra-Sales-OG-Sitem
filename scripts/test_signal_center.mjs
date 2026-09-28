import assert from 'node:assert/strict';
import signalCenter from '../apps/sistema-og/modules/signal-center.js';

const now = new Date('2026-09-27T18:00:00-03:00');

const baseLead = {
  id: 'L1',
  empresa: 'Transportes Alfa',
  status: 'negociacao',
  priority: 'alta',
  followUpAt: '2026-09-26T14:00:00-03:00',
  nextAction: 'Ligar para o gestor',
  fleetSize: 42,
  decisionMaker: '',
  pain: '',
  updatedAt: '2026-09-10T12:00:00-03:00',
  interactions: []
};

const signals = signalCenter.signalsForLead(baseLead, now);
assert.ok(signals.some(item => item.type === 'followup_overdue'), 'follow-up vencido deve gerar sinal');
assert.ok(signals.some(item => item.type === 'large_account_without_decision_maker'), 'conta grande sem decisor deve gerar sinal');
assert.ok(signals.some(item => item.type === 'missing_validated_pain'), 'negociação sem dor deve gerar sinal');
assert.ok(signals.some(item => item.type === 'stalled_account'), 'conta parada deve gerar sinal');
assert.equal(signals[0].type, 'followup_overdue', 'sinal crítico deve subir primeiro');
assert.equal(signals[0].recommendedAction, 'Ligar para o gestor');

const proposal = {
  id: 'L2',
  empresa: 'Beta Log',
  status: 'proposta_enviada',
  conversationStage: 'proposal',
  priority: 'media',
  nextAction: '',
  updatedAt: '2026-09-27T12:00:00-03:00'
};
const proposalSignals = signalCenter.signalsForLead(proposal, now);
assert.ok(proposalSignals.some(item => item.type === 'proposal_without_next_action'));
assert.ok(!proposalSignals.some(item => item.type === 'priority_without_next_action'), 'não deve duplicar o mesmo problema como prioridade genérica');

assert.deepEqual(signalCenter.signalsForLead({ ...baseLead, id: 'W', status: 'fechado' }, now), []);
assert.deepEqual(signalCenter.signalsForLead({ ...baseLead, id: 'X', status: 'perdido' }, now), []);

const leads = [
  { ...baseLead, id: 'LOW', priority: 'media', followUpAt: null, nextAction: 'Pesquisar contato', fleetSize: 5, decisionMaker: 'Ana', pain: 'Desgaste', updatedAt: '2026-09-27T15:00:00-03:00' },
  { ...baseLead, id: 'HIGH', empresa: 'Conta prioritária' }
];
const before = JSON.stringify(leads);
const mission = signalCenter.nextMission(leads, now, lead => lead.id === 'HIGH' ? 180 : 70);
assert.equal(mission.leadId, 'HIGH');
assert.equal(mission.score, 180);
assert.ok(mission.reason);
assert.ok(mission.recommendedAction);
assert.equal(JSON.stringify(leads), before, 'Signal Center deve ser derivado e nunca mutar leads');

const center = signalCenter.buildSignalCenter(leads, now);
assert.ok(center.length > 0);
for (let index = 1; index < center.length; index += 1) {
  assert.ok(center[index - 1].severityWeight >= center[index].severityWeight, 'sinais devem vir ordenados por severidade');
}

console.log('Signal Center tests: PASS');
