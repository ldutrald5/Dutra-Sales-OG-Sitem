import fs from 'node:fs';
import assert from 'node:assert/strict';

const app = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../apps/sistema-og/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../apps/sistema-og/styles.css', import.meta.url), 'utf8');

assert.ok(html.includes('services/company-360-service.js'), 'Company 360 service não carregado');
assert.ok(app.includes('function buildCompany360BetaPanel(lead)'), 'Painel Company 360 ausente');
assert.ok(app.includes("item?.entityType === 'company'"), 'UI deve exigir Company canônica');
assert.ok(app.includes("String(item.legacyLeadId || '') === String(lead.id)"), 'Ponte explícita legacyLeadId ausente');
assert.ok(app.includes('Nenhuma Company canônica será criada automaticamente.'), 'Fallback legado deve declarar não migração');
assert.ok(app.includes("inspector.insertAdjacentHTML('beforeend', buildCompany360BetaPanel(lead))"), 'Painel não integrado ao inspector');
assert.ok(!app.includes('createCompany({ legacyLeadId: lead.id'), 'UI não pode criar Company automaticamente');
assert.ok(css.includes('.company-360-beta'), 'Estilo Company 360 ausente');

console.log('Company 360 UI integration test: PASS');
