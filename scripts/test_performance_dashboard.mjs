import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const performance = require('../apps/sistema-og/performance-engine.js');
const [html, app, sw] = await Promise.all([
  readFile('apps/sistema-og/index.html', 'utf8'),
  readFile('apps/sistema-og/app.js', 'utf8'),
  readFile('apps/sistema-og/service-worker.js', 'utf8')
]);

const leads = [
  { id: 'l1', empresa: 'A', status: 'novo', segmentId: 'transportadora', cidadeUf: 'Maringá - PR', createdDate: '2026-09-01T10:00:00.000Z', interactions: [{ id: 'i1', at: '2026-09-10T10:00:00.000Z', type: 'call' }] },
  { id: 'l2', empresa: 'B', status: 'fechado', segmentId: 'mineração', cidadeUf: 'Itabira/MG', createdDate: '2026-08-01T10:00:00.000Z', lastContactAt: '2026-09-12T10:00:00.000Z', interactions: [] },
  { id: 'l3', empresa: 'C', status: 'perdido', segmentId: 'transportadora', cidadeUf: 'Curitiba - PR', createdDate: '2026-09-02T10:00:00.000Z', interactions: [] }
];
const operations = { activityEvents: [], materialShares: [{ id: 's1', clientId: 'l1', sentAt: '2026-09-11T10:00:00.000Z', sentConfirmedByUser: true }], sales: [], commissions: [] };
const result = performance.calculate({ leads, operations }, { from: new Date('2026-09-01T00:00:00.000Z'), to: new Date('2026-09-30T23:59:59.999Z') });
assert.equal(result.stageCounts.novo, 1);
assert.equal(result.stageCounts.fechado, 1);
assert.equal(result.activity.total, 2, 'Atividade deve usar interação e envio confirmado');
assert.equal(result.conversion.numerator, 1);
assert.equal(result.conversion.denominator, 2, 'Perdidos não entram na base de oportunidades ativas');
assert.equal(result.conversion.value, 50);
assert.equal(result.limitations.revenue, true, 'Sem Sale não pode inventar faturamento');
assert.equal(performance.stateFromCity('Itabira/MG'), 'MG');
const empty = performance.calculate({ leads: [], operations: {} }, { from: new Date('2026-09-01'), to: new Date('2026-09-30') });
assert.equal(empty.conversion.value, null, 'Conversão sem base deve ser indisponível');

assert.ok(html.includes('id="performance-dashboard"'), 'Dashboard de performance ausente');
assert.ok(html.includes('id="performance-period"'), 'Filtro de período ausente');
assert.ok(app.includes('Como foi calculado'), 'Indicadores sem fórmula e fonte');
assert.ok(app.includes('WhatsApp aberto. Registre a conversa somente depois do contato.'), 'Abertura do WhatsApp deve permanecer sem avanço automático');
assert.ok(app.includes('Dados insuficientes'), 'Estado de dados insuficientes ausente');
assert.ok(sw.includes("'/performance-engine.js'"), 'Motor de performance fora do shell offline');

console.log('Performance dashboard checks: PASS');
