import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, app, data, sw] = await Promise.all([
  readFile('apps/sistema-og/index.html', 'utf8'),
  readFile('apps/sistema-og/app.js', 'utf8'),
  readFile('apps/sistema-og/data.js', 'utf8'),
  readFile('apps/sistema-og/service-worker.js', 'utf8')
]);

for (const origin of ['dia', 'crm', 'call-ai']) {
  assert.ok(html.includes(`data-quick-lead="${origin}"`), `Cadastro rápido ausente em ${origin}`);
}
assert.ok(html.includes('id="quick-lead-form"'), 'Formulário de cadastro rápido ausente');
assert.ok(app.includes("quickLeadOrigin === 'call-ai'"), 'Novo cliente do Call AI deve voltar selecionado');
assert.ok(app.includes('OG_PROPOSAL_INTELLIGENCE.calculateRoi'), 'Cotação e simulador usam o mesmo ROI explícito');
assert.ok(!app.includes('TIRE_LIFE_GAIN_RATE'), 'Não presumir ganho universal sem premissa revisada');
assert.ok(data.includes('id: "micro_onibus"'), 'Segmento micro-ônibus ausente');
assert.ok(data.includes('id: "van"'), 'Segmento vans ausente');
assert.ok(!data.includes('Suporte Micro-ônibus'), 'Não deve inventar suporte de micro-ônibus');
assert.ok(/SW_VERSION = 'v\d+'/.test(sw), 'Cache PWA precisa ter versão explícita');

console.log('Product evolution static checks: PASS');
