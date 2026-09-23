import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('apps/sistema-og/index.html', 'utf8');
const app = fs.readFileSync('apps/sistema-og/app.js', 'utf8');
const server = fs.readFileSync('apps/sistema-og/server.mjs', 'utf8');
const ignore = fs.readFileSync('.gitignore', 'utf8');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs HTML devem ser únicos');

const requiredObjectives = [
  'primeiro_contato', 'qualificacao', 'diagnostico', 'retorno', 'followup_proposta',
  'negociacao', 'proximo_passo', 'pos_venda', 'expansao', 'indicacao'
];
for (const objective of requiredObjectives) assert.match(html, new RegExp(`value="${objective}"`));

for (const stage of ['Abertura', 'Contextualização', 'Diagnóstico', 'Exploração do impacto', 'Conexão com a solução', 'Tratamento de objeção', 'Próximo passo', 'Encerramento']) {
  assert.ok(app.includes(`title: '${stage}'`), `Etapa ausente: ${stage}`);
}

assert.ok(app.includes("sessionId"), 'Gravação precisa de chave idempotente');
assert.ok(app.includes("lead.interactions.some(item => item.sessionId === sessionId)"), 'Duplicação deve ser bloqueada');
assert.ok(!app.includes('getUserMedia('), 'Microfone não deve ser ativado nesta etapa');
assert.ok(server.includes("/api/knowledge/status"));
assert.ok(server.includes("/api/knowledge/search"));
assert.ok(ignore.includes('apps/sistema-og/.data/'));
assert.ok(ignore.includes('apps/sistema-og/imports/*.json'));

console.log('Call AI static checks: PASS');
