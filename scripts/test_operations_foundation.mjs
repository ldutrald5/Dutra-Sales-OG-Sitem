import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const model = require('../apps/sistema-og/operations-model.js');
const [html, app, server, sw] = await Promise.all([
  readFile('apps/sistema-og/index.html', 'utf8'),
  readFile('apps/sistema-og/app.js', 'utf8'),
  readFile('apps/sistema-og/server.mjs', 'utf8'),
  readFile('apps/sistema-og/service-worker.js', 'utf8')
]);

const migrated = model.migrateOperations({}, { now: '2026-09-23T12:00:00.000Z' });
assert.equal(migrated.schemaVersion, 2);
for (const key of ['companies', 'contacts', 'opportunities', 'activities', 'tasks']) assert.deepEqual(migrated[key], [], `${key} deve nascer vazio`);
assert.equal(model.validateOperations(migrated).valid, true);
const legacyV1 = {
  schemaVersion: 1,
  createdAt: '2026-09-22T12:00:00.000Z',
  updatedAt: '2026-09-22T12:00:00.000Z',
  migrationLog: [{ fromVersion: 0, toVersion: 1, at: '2026-09-22T12:00:00.000Z', mode: 'additive' }],
  contacts: [{ id: 'legacy-contact-1', name: 'Contato legado' }],
  activityEvents: [{ id: 'legacy-event-1', type: 'legacy.test', at: '2026-09-22T12:00:00.000Z' }]
};
const migratedV1 = model.migrateOperations(legacyV1, { now: '2026-09-23T12:00:00.000Z' });
assert.equal(migratedV1.schemaVersion, 2);
assert.equal(migratedV1.contacts.length, 1, 'Contato legado deve ser preservado');
assert.equal(migratedV1.activityEvents.length, 1, 'Evento legado deve ser preservado');
assert.deepEqual(migratedV1.companies, [], 'Migração não deve criar empresas a partir de leads/contatos');
assert.ok(migratedV1.migrationLog.some(item => item.fromVersion === 1 && item.toVersion === 2), 'Migração 1→2 deve ser registrada');

const migratedAgain = model.migrateOperations(migrated, { now: '2026-09-24T12:00:00.000Z' });
assert.deepEqual(migratedAgain, migrated, 'Migração deve ser estruturalmente idempotente');
const withActivity = model.appendActivity(migrated, { id: 'evt-1', type: 'client.created', at: '2026-09-23T12:00:00.000Z', clientId: 'lead-1' });
assert.equal(withActivity.activityEvents.length, 1);
assert.equal(model.appendActivity(withActivity, withActivity.activityEvents[0]).activityEvents.length, 1, 'Evento duplicado deve ser ignorado');

assert.ok(html.includes('data-tab="operacoes"'), 'Navegação de operações ausente');
assert.ok(html.includes('id="tab-operacoes"'), 'Tela de operações ausente');
assert.ok(app.includes("localStorage.getItem('og_operations_state')"), 'Migração local ausente');
assert.ok(server.includes('operations:'), 'Servidor não persiste operações');
assert.ok(sw.includes("'/operations-model.js'"), 'Modelo não está no shell offline');
for (const asset of ["'/domain/canonical-domain.js'", "'/services/company-360-service.js'", "'/services/canonical-editor-service.js'", "'/services/auth-pilot-service.js'", "'/services/auth-state-service.js'", "'/services/sync-conflict-service.js'"]) {
  assert.ok(sw.includes(asset), `${asset} não está no shell offline`);
}

console.log('Operations foundation checks: PASS');
