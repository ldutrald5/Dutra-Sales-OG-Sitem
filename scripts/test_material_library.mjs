import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const model = require('../apps/sistema-og/operations-model.js');

const [html, app, store, sw] = await Promise.all([
  readFile('apps/sistema-og/index.html', 'utf8'),
  readFile('apps/sistema-og/app.js', 'utf8'),
  readFile('apps/sistema-og/material-store.js', 'utf8'),
  readFile('apps/sistema-og/service-worker.js', 'utf8')
]);

assert.ok(html.includes('data-tab="biblioteca"'), 'Navegação da Biblioteca ausente');
assert.ok(html.includes('id="tab-biblioteca"'), 'Tela da Biblioteca ausente');
assert.ok(html.includes('id="library-form"'), 'Cadastro de material ausente');
assert.ok(html.includes('customer_authorized'), 'Permissão de uso com cliente ausente');
assert.ok(app.includes('renderMaterialLibrary'), 'Renderização da galeria ausente');
assert.ok(app.includes('OG_MATERIAL_STORE.put'), 'Arquivo não usa armazenamento local');
assert.ok(app.includes('Nenhum envio foi feito'), 'Confirmação de não envio ausente');
assert.ok(store.includes("const DB_NAME = 'og-commercial-library'"), 'IndexedDB da biblioteca ausente');
assert.ok(sw.includes("'/material-store.js'"), 'Armazenamento local não está no shell offline');
assert.ok(!html.includes('material de demonstração'), 'Não versionar conteúdo comercial fictício');

const internal = { id: 'mat-1', title: 'Ficha técnica', mediaType: 'pdf', status: 'draft', audience: 'internal' };
assert.equal(model.validateMaterial(internal).valid, true);
assert.equal(model.validateMaterial({ ...internal, audience: 'customer_authorized' }).valid, false, 'Material para cliente exige autorização');
const saved = model.upsertMaterial(model.createEmptyOperations(), internal);
const updated = model.upsertMaterial(saved, { ...internal, title: 'Ficha técnica revisada' });
assert.equal(updated.materials.length, 1, 'Atualização não pode duplicar material');
assert.equal(updated.materials[0].title, 'Ficha técnica revisada');

console.log('Material library checks: PASS');
