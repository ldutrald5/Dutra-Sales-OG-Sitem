import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const operations = require('../apps/sistema-og/operations-model.js');
const salesMaterials = require('../apps/sistema-og/sales-materials.js');
const [html, app, sw] = await Promise.all([
  readFile('apps/sistema-og/index.html', 'utf8'),
  readFile('apps/sistema-og/app.js', 'utf8'),
  readFile('apps/sistema-og/service-worker.js', 'utf8')
]);

const material = { id: 'mat-1', title: 'Caso mineração', mediaType: 'video', status: 'approved', audience: 'customer_authorized', consentRef: 'autorizacao-1', segmentIds: ['mineração'], painTags: ['desgaste'], salesStages: ['diagnóstico'], decisionMakerRoles: ['manutenção'], vehicleTypeIds: ['caminhão'], externalUrl: 'https://example.test/video', updatedAt: '2026-09-23T10:00:00.000Z' };
const client = { id: 'lead-1', empresa: 'Empresa Teste', nome: 'Contato', segmentId: 'mineração', status: 'diagnóstico', pain: 'Desgaste irregular', decisionMaker: 'Gerente de manutenção', observacoes: 'Frota de caminhão', interactions: [] };
const recommendations = salesMaterials.recommendMaterials([material], client);
assert.equal(recommendations.length, 1);
assert.ok(recommendations[0].score > 0);
assert.ok(recommendations[0].reasons.some(reason => reason.startsWith('segmento:')));
assert.equal(salesMaterials.recommendMaterials([{ ...material, audience: 'internal' }], client).length, 0, 'Material interno não pode ser recomendado para envio');
assert.equal(salesMaterials.recommendMaterials([{ ...material, segmentIds: ['varejo'], painTags: [], salesStages: [], decisionMakerRoles: [], vehicleTypeIds: [] }], client).length, 0, 'Ausência de correspondência deve gerar estado vazio');

let state = operations.upsertMaterial(operations.createEmptyOperations(), material);
const pkg = { id: 'pkg-1', clientId: client.id, title: 'Pacote teste', materialIds: [material.id], messageDraft: 'Olá', status: 'reviewed', createdAt: '2026-09-23T11:00:00.000Z', updatedAt: '2026-09-23T11:00:00.000Z' };
state = operations.upsertMaterialPackage(state, pkg);
assert.equal(state.materialPackages.length, 1);
assert.throws(() => operations.appendMaterialShare(state, { id: 'share-invalid', materialId: material.id, clientId: client.id, channel: 'whatsapp', preparedAt: pkg.createdAt, sentAt: pkg.updatedAt, sentConfirmedByUser: false }), /confirmação explícita/);
state = operations.appendMaterialShare(state, { id: 'share-1', materialId: material.id, clientId: client.id, channel: 'whatsapp', preparedAt: pkg.createdAt, sentAt: pkg.updatedAt, sentConfirmedByUser: true });
assert.equal(state.materialShares.length, 1);
assert.match(salesMaterials.composePackageText(pkg, [material], client), /Caso mineração/);

assert.ok(app.includes('buildClientMaterialsPanel'), 'Integração com CRM/Call AI ausente');
assert.ok(app.includes('Confirmar que enviei'), 'Confirmação explícita de envio ausente');
assert.ok(app.includes('Copiar ou abrir o WhatsApp não confirma envio'), 'Semântica de preparo/envio ausente');
assert.ok(html.includes('sales-materials.js'), 'Motor de recomendação não carregado');
assert.ok(sw.includes("'/sales-materials.js'"), 'Motor de recomendação fora do shell offline');

console.log('Material packages checks: PASS');
