import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { preparePilotImport, readPilotWorkbook } from './prepare-pilot-import.mjs';
import { applyHostedSeed } from './apply-hosted-seed.mjs';
const require = createRequire(import.meta.url);
const importer = require('../apps/sistema-og/services/spreadsheet-import-service.js');
const XLSX = require('../apps/sistema-og/assets/vendor/xlsx.full.min.js');
const now = '2026-10-07T10:00:00.000Z';
const headers = importer.CRM_HEADERS;
const primary = (code, company, phone, status = 'Em conversa') => [code, company, phone, status, 'Morno', 'Diagnóstico', '2026-10-10T10:00:00.000Z', 'Alta', '2026-10-06T09:00:00.000Z', 'Histórico sintético', 'Alto', 'transportadora', 'Fixture', '', '', 'Nota sintética'];
const ods = { SheetNames: importer.CRM_SHEETS, sheets: {
  '🚀 HOJE': [], '📋 CRM': [...Array.from({ length: 6 }, () => []), headers,
    primary('0007', 'Fixture existente', '11900000001'), primary('8', 'Fixture nova', '11900000002', 'Cliente fidelizado'), primary('9', 'Fixture encerrada', '', 'Não tem interesse')],
  '📥 LISTA': [...Array.from({ length: 6 }, () => []), ['Código', 'Empresa / Nome', 'Contato', 'WhatsApp', 'Cidade / UF', 'Vendedor / Origem', 'Potencial', 'Histórico de pedidos / Observações', 'Prioridade'],
    ['8', 'Fixture nova', 'Contato sintético', '11900000002', '', 'Fixture', 'Alto', 'Nota da lista', 'Alta'], ['7', 'Outra identidade sintética', '', '', '', 'Fixture', 'Alto', 'Revisar namespace', 'Alta']],
  '👥 CONTATOS': [...Array.from({ length: 6 }, () => []), ['Código cliente', 'Empresa / Nome', 'Contato', 'Cargo / Papel', 'WhatsApp / Telefone', 'Tipo de contato', 'Canal', 'Observações'], ['8', 'Fixture nova', 'Contato adicional sintético', 'Comprador', '11900000003', 'Decisor', 'telefone', 'Fonte sintética']]
} };
const xlsx = { SheetNames: ['Pós-Venda'], sheets: { 'Pós-Venda': [['Código', 'Razão Social', 'Número do cliente', 'Email', 'UF'], ['0008', 'Fixture nova', '11900000002', 'fixture@example.invalid', 'SP'], ['7', 'Outra empresa do secundário', '', 'unrelated@example.invalid', ''], ['333', 'Não pertence ao seed primário', '', 'other@example.invalid', '']] } };
const backup = { format: 'sistema-og-backup', version: 1, revision: 12, createdAt: now, data: {
  leads: [{ id: 'CANONICAL-EXISTING', internalCode: '7', empresa: 'Fixture existente', telefone: '11900000001', status: 'negociacao', accountSummary: 'Resumo manual protegido', observacoes: 'Nota manual protegida', interactions: [{ id: 'INTERACTION-EXISTING', note: 'Trabalho existente' }], opportunities: [{ id: 'OPP-EXISTING' }] }],
  history: [{ id: 'HISTORY-EXISTING', leadId: 'CANONICAL-EXISTING' }], operations: { technicalDrafts: [{ id: 'DRAFT-EXISTING', clientId: 'CANONICAL-EXISTING', items: [{ sku: 'FIXTURE-PART', quantity: 4 }] }], quotes: [{ id: 'QUOTE-EXISTING', clientId: 'CANONICAL-EXISTING', items: [{ sku: 'FIXTURE-PART', quantity: 4 }] }], activityEvents: [{ id: 'EVENT-EXISTING' }] }
} };
const result = preparePilotImport({ backup, ods, xlsx, now });
assert.equal(result.state.leads.length, 3);
assert.deepEqual(result.state.history, backup.data.history);
assert.deepEqual(result.state.operations, backup.data.operations);
assert.equal(result.state.leads[0].id, 'CANONICAL-EXISTING');
assert.equal(result.state.leads[0].status, 'negociacao');
assert.equal(result.state.leads[0].accountSummary, 'Resumo manual protegido');
assert.equal(result.state.leads[0].observacoes, 'Nota manual protegida');
assert.deepEqual(result.state.leads[0].interactions, backup.data.leads[0].interactions);
assert.deepEqual(result.state.leads[0].opportunities, backup.data.leads[0].opportunities);
const added = result.state.leads.find(lead => lead.empresa === 'Fixture nova');
assert.equal(added.status, 'fechado');
assert.equal(added.conversationStage, 'loyal_customer');
assert.equal(added.email, 'fixture@example.invalid');
assert.equal(added.contacts.length, 1);
assert.equal(added.importMeta.pilotReal, true);
const terminal = result.state.leads.find(lead => lead.empresa === 'Fixture encerrada');
assert.equal(terminal.status, 'perdido'); assert.equal(terminal.conversationStage, 'not_interested');
assert.equal(result.report.metrics.primaryReview, 1);
assert.equal(result.report.metrics.secondaryReview, 1);
assert.equal(result.report.metrics.secondaryUnmatched, 1);
assert.ok(result.review.some(item => item.reason === 'primary_code_namespace_collision'));
assert.equal(result.state.leads.some(lead => lead.empresa === 'Outra identidade sintética'), false);
assert.equal(result.state.leads.some(lead => lead.email === 'unrelated@example.invalid'), false);
assert.deepEqual(result.seed.fallbackState.leads, backup.data.leads);
assert.deepEqual(result.seed.fallbackState.history, backup.data.history);
assert.deepEqual(result.seed.fallbackState.operations, backup.data.operations);
const repeat = preparePilotImport({ backup: { ...backup, data: { ...backup.data, leads: result.state.leads } }, ods, xlsx, now });
assert.equal(repeat.state.leads.length, result.state.leads.length);
assert.deepEqual(repeat.state.leads.map(lead => lead.id), result.state.leads.map(lead => lead.id));
assert.equal(repeat.state.leads.find(lead => lead.id === added.id).contacts.length, 1);
assert.equal(repeat.state.leads.find(lead => lead.id === added.id).importMeta.pilotSources.length, added.importMeta.pilotSources.length);
assert.equal(preparePilotImport({ backup, ods, xlsx, now }).seed.seedId, result.seed.seedId);
assert.throws(() => preparePilotImport({ backup: {}, ods, xlsx }), /backup/);
assert.throws(() => preparePilotImport({ backup: { ...backup, data: { ...backup.data, leads: [...backup.data.leads, ...backup.data.leads] } }, ods, xlsx }), /duplicate canonical IDs/);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-reader-fixture-'));
try {
  const environment = { OG_DATA_DIR: path.join(temp, 'isolated-store'), OG_STATE_SEED_GZIP_B64: zlib.gzipSync(JSON.stringify(result.seed)).toString('base64') };
  const hosted = applyHostedSeed({ env: environment });
  assert.equal(hosted.status, 'applied');
  assert.equal(hosted.ambiguous, 0);
  const stored = JSON.parse(fs.readFileSync(path.join(environment.OG_DATA_DIR, 'shared-state.json')));
  assert.deepEqual(stored.leads.map(lead => lead.id), result.state.leads.map(lead => lead.id));
  assert.deepEqual(stored.history, backup.data.history);
  assert.deepEqual(stored.operations, backup.data.operations);
  assert.equal(stored.leads.find(lead => lead.id === added.id).email, added.email);
  assert.equal(applyHostedSeed({ env: environment }).status, 'already_applied');
  const workbook = XLSX.utils.book_new();
  for (const name of ods.SheetNames) {
    const rows = ods.sheets[name].map(row => [...row]);
    if (rows.length) rows[0] = ['Fixture template'];
    if (name === '📋 CRM') rows[7][6] = new Date('2026-10-10T00:00:00.000Z');
    const sheet = XLSX.utils.aoa_to_sheet(rows, { cellDates: true });
    if (rows.length) sheet['!ref'] = `A1:W${rows.length}`;
    XLSX.utils.book_append_sheet(workbook, sheet, name.replace(/ (HOJE|CRM|LISTA|CONTATOS)$/, '_$1'));
  }
  const file = path.join(temp, 'fixture.ods'); fs.writeFileSync(file, XLSX.write(workbook, { bookType: 'ods', type: 'buffer' }));
  const read = readPilotWorkbook(file);
  assert.deepEqual(read.workbook.SheetNames, ods.SheetNames);
  assert.equal(importer.readCrmRows(read.workbook).length, 3);
  assert.equal(read.workbook.sheets['📋 CRM'][7][6], '2026-10-10T00:00:00');
  assert.equal(read.fingerprint.length, 64);
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
console.log('Pilot import: PASS (synthetic fixtures; backup/quotes preserved, canonical identity, fill-only enrichment, namespace review, ODS reuse and idempotence)');
