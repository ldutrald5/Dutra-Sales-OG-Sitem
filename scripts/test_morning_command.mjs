import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const morning = require('../apps/sistema-og/services/morning-command-service.js');
const signals = require('../apps/sistema-og/modules/signal-center.js');
const intelligence = require('../apps/sistema-og/modules/lead-intelligence.js');
const automation = require('../apps/sistema-og/services/automation-engine-service.js');

const now = new Date('2026-09-28T09:00:00-03:00');
const leads = [
  { id:'oleoplan', company:'OLEOPLAN', status:'negociacao', priorityBand:'urgente', fleetSize:250, followUpAt:'2026-09-27T14:00:00-03:00', nextAction:'Ligar para o gestor', decisionMaker:'Claudemir', pain:'Custo operacional' },
  { id:'biener', company:'BIENER FLORESTAL', status:'negociacao', priorityBand:'alta', fleetSize:30, testEndsAt:'2026-10-01T18:00:00-03:00', nextAction:'Revisar teste', decisionMaker:'Gestor', pain:'Desgaste' },
  { id:'lost', company:'PERDIDO', status:'perdido', priorityBand:'urgente' }
];
const operations = {
  tasks:[{ id:'t1', clientId:'oleoplan', status:'open', dueAt:'2026-09-28T10:00:00-03:00', title:'Retorno' }],
  activityEvents:[]
};
const result = morning.buildMorningCommand({ leads, operations, now, signalCenter:signals, leadIntelligence:intelligence, automationEngine:automation });

assert.equal(result.summary.activeAccounts, 2);
assert.equal(result.summary.dueTasks, 1);
assert.ok(result.summary.criticalSignals >= 1);
assert.equal(result.mission.leadId, 'oleoplan');
assert.match(result.mission.reason, /atrasado/i);
assert.ok(result.priorityAccounts.some(item => item.leadId === 'biener'));
assert.ok(Object.isFrozen(result));
console.log('morning command tests: PASS');
