import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contextService = require('../apps/sistema-og/services/call-ai-context.js');
const knowledgeSelector = require('../apps/sistema-og/services/knowledge-selector.js');
const prompts = require('../apps/sistema-og/services/call-ai-prompts.js');
const aiService = require('../apps/sistema-og/services/ai-service.js');
const interactions = require('../apps/sistema-og/services/interaction-service.js');
const leadIntelligence = require('../apps/sistema-og/modules/lead-intelligence.js');

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
assert.ok(app.includes("syncApprovedCallToSalesExecution"), 'Call AI aprovado deve ter ponte explícita para Sales Execution');
assert.ok(app.includes("OG_SALES_EXECUTION_CLIENT.recordCallResult"), 'Call AI deve usar o comando canônico de resultado');
assert.ok(app.includes("sales_execution.sync_failed"), 'Falha de sincronização deve ser observável e preservar fallback local');
assert.ok(app.includes("advanceSalesExecutionAfterCall"), 'Call AI aprovado deve avançar para o próximo prospect normalizado');
assert.ok(app.includes("switchTab('prospeccao')"), 'Fluxo aprovado deve conseguir retornar à prospecção');
assert.ok(app.includes("data-ai-save-note"), 'Resposta deve permitir nota confirmada');
assert.ok(app.includes("data-ai-next-action"), 'Resposta deve permitir próxima ação confirmada');
const saveReviewBlock = app.slice(app.indexOf('function saveCallAIReview()'), app.indexOf('function setCallRecordingStatus'));
assert.match(saveReviewBlock, /OG_INTERACTION_SERVICE\.setNextAction\(lead, reviewedNextAction, reviewedFollowUp, \{ now \}\)/, 'Revisão Call AI deve usar o contrato central de próxima ação');
assert.doesNotMatch(saveReviewBlock, /lead\.nextAction\s*=/, 'Revisão Call AI não pode escrever nextAction diretamente');
assert.doesNotMatch(saveReviewBlock, /lead\.followUpAt\s*=/, 'Revisão Call AI não pode escrever followUpAt diretamente');
assert.match(saveReviewBlock, /if \(result === 'sem_interesse'\)[\s\S]*OG_INTERACTION_SERVICE\.recordResult\(lead, result, summary/, 'Call AI Review deve usar recordResult para sem_interesse');
assert.match(saveReviewBlock, /type: 'call_ai'[\s\S]*sessionId[\s\S]*idempotencyKey: sessionId/, 'Call AI Review deve preservar tipo call_ai, sessionId e chave idempotente');
const semInteresseBranch = saveReviewBlock.slice(saveReviewBlock.indexOf("if (result === 'sem_interesse')"), saveReviewBlock.indexOf("} else {", saveReviewBlock.indexOf("if (result === 'sem_interesse')")));
assert.doesNotMatch(semInteresseBranch, /lead\.interactions\.push|setNextAction\(/, 'sem_interesse não pode registrar a mesma ligação ou próxima ação uma segunda vez');

const callAIReviewLead = {
  id: 'CALL-SEM-1',
  status: 'negociacao',
  nextAction: 'Ligar amanhã',
  followUpAt: '2026-09-28T09:00',
  nextActionReason: 'Retorno combinado',
  nextActionObjective: 'Validar proposta',
  nextActionExpectedResult: 'Obter decisão',
  interactions: []
};
const callSessionId = 'CALL-AI-SESSION-SEM-1';
interactions.recordResult(callAIReviewLead, 'sem_interesse', 'Cliente informou que não possui interesse.', {
  now: '2026-09-27T15:30:00.000Z',
  interaction: {
    id: 'INT-CALL-SEM-1',
    type: 'call_ai',
    sessionId: callSessionId,
    objective: 'followup_proposta',
    signals: ['sem_interesse'],
    idempotencyKey: callSessionId
  }
});
assert.equal(callAIReviewLead.status, 'perdido', 'Call AI Review sem_interesse deve aplicar o estado comercial do contrato');
assert.equal(callAIReviewLead.nextAction, '', 'sem_interesse deve limpar próxima ação antiga');
assert.equal(callAIReviewLead.followUpAt, '', 'sem_interesse deve limpar follow-up antigo');
assert.equal(callAIReviewLead.interactions.length, 1, 'Call AI Review sem_interesse deve registrar uma única ligação');
assert.equal(callAIReviewLead.interactions[0].type, 'call_ai');
assert.equal(callAIReviewLead.interactions[0].sessionId, callSessionId);
assert.equal(callAIReviewLead.interactions[0].idempotencyKey, callSessionId);
const callAIReviewNextBest = leadIntelligence.nextBestAction(callAIReviewLead, new Date('2026-09-27T15:31:00.000Z'));
assert.equal(callAIReviewNextBest.action, '', 'Call AI Review sem_interesse não deve gerar ação automática');
assert.equal(callAIReviewNextBest.actionRequired, false, 'Call AI Review sem_interesse deve deixar de exigir próxima ação');
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

const cacheLead = {
  id:'CACHE', empresa:'Cache Frota', status:'negociacao', conversationStage:'negotiation',
  updatedAt:'2026-09-20T10:00:00.000Z',
  nextAction:'Ligar para validar proposta',
  followUpAt:'2026-09-28T09:00',
  nextActionReason:'Retorno combinado',
  nextActionObjective:'Validar aprovação',
  nextActionExpectedResult:'Obter decisão',
  interactions:Array.from({length:8},(_,i)=>({at:`2026-09-${String(i+1).padStart(2,'0')}T10:00:00Z`,type:'nota',note:`Histórico ${i}`}))
};
const cacheBefore = contextService.build(cacheLead, { intent:'prepare_call' });
const keyBefore = contextService.cacheKey(cacheBefore, 'prepare_call');
interactions.setNextAction(cacheLead, 'Enviar apresentação', '2026-09-28T09:00', { now:'2026-09-27T15:20:00.000Z' });
const cacheAfter = contextService.build(cacheLead, { intent:'prepare_call' });
const keyAfter = contextService.cacheKey(cacheAfter, 'prepare_call');
assert.equal(cacheBefore.recentInteractions.length, contextService.BUDGET.maxRecentInteractions);
assert.equal(cacheAfter.recentInteractions.length, contextService.BUDGET.maxRecentInteractions, 'janela cheia não pode mascarar mudança comercial');
assert.notEqual(cacheBefore.contextVersion, cacheAfter.contextVersion, 'mudança de próxima ação deve alterar contextVersion mesmo com timestamp-base e janela iguais');
assert.notEqual(keyBefore, keyAfter, 'cache do Call AI deve ser invalidado por mudança no contexto comercial');

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
