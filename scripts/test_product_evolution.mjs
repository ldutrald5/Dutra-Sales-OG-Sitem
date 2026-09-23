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
assert.ok(app.includes('TIRE_BASE_LIFE_MONTHS = 18'), 'ROI deve usar ciclo-base de 18 meses');
assert.ok(app.includes('12 / TIRE_BASE_LIFE_MONTHS'), 'ROI deve anualizar o ciclo de reposição');
assert.ok(app.includes('12 / vidaUtilComOgMeses'), 'ROI deve comparar o ciclo ampliado');
assert.ok(data.includes('id: "micro_onibus"'), 'Segmento micro-ônibus ausente');
assert.ok(data.includes('id: "van"'), 'Segmento vans ausente');
assert.ok(!data.includes('Suporte Micro-ônibus'), 'Não deve inventar suporte de micro-ônibus');
assert.ok(/SW_VERSION = 'v\d+'/.test(sw), 'Cache PWA precisa ter versão explícita');

console.log('Product evolution static checks: PASS');
