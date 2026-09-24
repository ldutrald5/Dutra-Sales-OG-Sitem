(function attachProspectingEngine(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_PROSPECTING = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createProspectingEngine() {
  'use strict';
  const RELEVANT = new Set(['resultado_contato', 'call', 'call_ai', 'conversation', 'conversa', 'message_sent']);
  function wasProspected(lead) { return (lead.interactions || []).some(item => RELEVANT.has(item.type)); }
  function prospectQueue(leads, filters = {}) {
    return (leads || []).filter(lead => !wasProspected(lead) && !['fechado', 'perdido'].includes(lead.status))
      .filter(lead => !filters.origin || filters.origin === 'all' || lead.sourceChannel === filters.origin)
      .filter(lead => !filters.batch || filters.batch === 'all' || lead.batchTag === filters.batch)
      .filter(lead => !filters.priority || filters.priority === 'all' || lead.priority === filters.priority)
      .sort((a, b) => (a.priority === 'alta' ? -1 : b.priority === 'alta' ? 1 : String(a.enteredAt || a.createdDate || '').localeCompare(String(b.enteredAt || b.createdDate || ''))));
  }
  function nextProspect(leads, currentId, skippedIds = [], filters = {}) {
    const queue = prospectQueue(leads, filters);
    const skipped = new Set(skippedIds.map(String));
    const currentIndex = queue.findIndex(item => String(item.id) === String(currentId));
    return queue.slice(currentIndex + 1).find(item => !skipped.has(String(item.id))) || queue.find(item => !skipped.has(String(item.id))) || null;
  }
  function nextBestAction(lead, now = new Date()) {
    const interactions = (lead?.interactions || []).slice().sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
    const last = interactions[0];
    if (lead?.followUpAt && new Date(lead.followUpAt) <= now) return { code: 'OVERDUE_TASK', label: 'Executar tarefa pendente', reason: lead.nextAction || 'Retorno vencido' };
    if (!last || !wasProspected(lead)) return { code: 'FIRST_CONTACT', label: 'Primeiro contato', reason: 'Prospect ainda não trabalhado' };
    if (last.result === 'nao_atendeu') return { code: 'RETRY', label: 'Tentar novamente', reason: 'Última tentativa sem atendimento' };
    if (last.result === 'enviar_apresentacao') return { code: 'PRESENTATION', label: 'Enviar apresentação', reason: 'Apresentação solicitada' };
    if (last.result === 'enviar_orcamento') return { code: 'QUOTE', label: 'Preparar orçamento', reason: 'Orçamento solicitado' };
    if (lead.status === 'proposta_enviada') return { code: 'FOLLOW_UP', label: 'Fazer follow-up', reason: 'Proposta enviada' };
    return { code: 'FOLLOW_UP', label: lead.nextAction || 'Definir próximo passo', reason: 'Manter avanço comercial' };
  }
  function sessionMetrics(events) {
    const list = events || [];
    return { processed: list.filter(item => item.type === 'processed').length, calls: list.filter(item => item.channel === 'call').length, whatsappActions: list.filter(item => item.channel === 'whatsapp').length, interested: list.filter(item => ['negociacao', 'enviar_apresentacao'].includes(item.result)).length, quotes: list.filter(item => item.result === 'enviar_orcamento').length, noAnswers: list.filter(item => item.result === 'nao_atendeu').length };
  }
  return { wasProspected, prospectQueue, nextProspect, nextBestAction, sessionMetrics };
}));
