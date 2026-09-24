import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contextService = require('../apps/sistema-og/services/call-ai-context.js');
const knowledgeSelector = require('../apps/sistema-og/services/knowledge-selector.js');
const prompts = require('../apps/sistema-og/services/call-ai-prompts.js');
const aiService = require('../apps/sistema-og/services/ai-service.js');

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
assert.ok(html.includes('call-ai-copilot'), 'Central contextual deve existir');
assert.ok(html.includes('call-ai-size-toggle'), 'Central deve alternar entre compacto e expandido');
assert.ok(app.includes("OG_AI_SERVICE.generate"), 'Call AI deve usar a abstração central de IA');
assert.ok(app.includes("data-ai-save-note"), 'Resposta deve permitir nota confirmada');
assert.ok(app.includes("data-ai-next-action"), 'Resposta deve permitir próxima ação confirmada');
assert.ok(server.includes("/api/knowledge/status"));
assert.ok(server.includes("/api/knowledge/search"));
assert.ok(ignore.includes('apps/sistema-og/.data/'));
assert.ok(ignore.includes('apps/sistema-og/imports/*.json'));

const leadA = { id:'A', empresa:'Empresa A', nome:'Ana', telefone:'44999999999', status:'negociacao', pain:'custo', interactions:Array.from({length:12},(_,i)=>({at:`2026-09-${String(i+1).padStart(2,'0')}T10:00:00Z`,type:'nota',note:`Nota A ${i}`})) };
const leadB = { id:'B', empresa:'Empresa B', nome:'Beto', status:'novo', interactions:[{at:'2026-09-24T10:00:00Z',type:'nota',note:'Somente B'}] };
const contextA = contextService.build(leadA, { intent:'handle_objection' });
const contextB = contextService.build(leadB, { intent:'prepare_call' });
assert.equal(contextA.recentInteractions.length, contextService.BUDGET.maxRecentInteractions, 'Histórico deve respeitar orçamento');
assert.equal(contextA.contact.phone, undefined, 'Telefone não deve ser enviado quando desnecessário');
assert.equal(contextA.company.id, 'A');
assert.equal(contextB.company.id, 'B');
assert.doesNotMatch(JSON.stringify(contextB), /Empresa A|Nota A/, 'Troca de conta não pode vazar contexto');
assert.notEqual(contextService.cacheKey(contextA,'prepare_call'), contextService.cacheKey(contextB,'prepare_call'));
assert.deepEqual(knowledgeSelector.select('handle_objection'), ['objeções','ROI','economia']);
assert.equal(prompts.INTENTS.prepare_call.tier, 2);
assert.equal(prompts.INTENTS.post_call.tier, 1);
const request = prompts.build('handle_objection', contextA, 'Está caro', []);
const response = await aiService.generate(request, { cacheKey:contextService.cacheKey(contextA,'handle_objection') });
assert.ok(response.recommendedResponse && response.question && response.objective, 'Resposta deve ser estruturada');
const cached = await aiService.generate(request, { cacheKey:contextService.cacheKey(contextA,'handle_objection') });
assert.equal(cached.cached, true, 'Resposta idêntica deve usar cache');
const postCall = await aiService.structure(prompts.build('post_call', contextB, 'Beto pediu retorno sexta', []));
assert.equal(postCall.crmSuggestion.summary, 'Beto pediu retorno sexta');
assert.equal(aiService.getMetrics().length, 3, 'Métricas devem registrar execução e cache');

console.log('Call AI static checks: PASS');
