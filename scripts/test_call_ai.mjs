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
assert.ok(html.includes('call-ai-record-start'), 'Botão de iniciar gravação deve existir');
assert.ok(html.includes('call-ai-record-stop'), 'Botão de encerrar gravação deve existir');
assert.ok(html.includes('call-ai-audio-source'), 'Seletor da fonte de áudio deve existir');
assert.ok(app.includes("getElementById('call-ai-record-start')?.addEventListener('click', startCallRecording)"), 'Gravação deve começar somente após clique explícito');
assert.ok(app.includes('navigator.mediaDevices.getDisplayMedia'), 'Captura opcional do áudio do computador deve existir');
assert.ok(app.includes('navigator.mediaDevices.getUserMedia'), 'Captura do microfone deve existir');
assert.ok(app.includes('URL.createObjectURL(blob)'), 'Gravação deve gerar reprodução local');
assert.ok(html.includes('call-ai-return'), 'Call AI deve retornar à operação de origem');
assert.ok(app.includes('OG_CALL_AI_CONTEXT.build(lead)'), 'Call AI deve usar contexto compacto por conta');
assert.ok(app.includes('sem carregar o CRM inteiro'), 'A interface deve informar o escopo compacto');
assert.ok(server.includes("/api/knowledge/status"));
assert.ok(server.includes("/api/knowledge/search"));
assert.ok(ignore.includes('apps/sistema-og/.data/'));
assert.ok(ignore.includes('apps/sistema-og/imports/*.json'));

console.log('Call AI static checks: PASS');
