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
assert.equal(migrated.schemaVersion, 1);
assert.equal(model.validateOperations(migrated).valid, true);
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

console.log('Operations foundation checks: PASS');
