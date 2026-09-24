(function attachKnowledgeSelector(root, factory) {
  const api = factory(); if (typeof module !== 'undefined' && module.exports) module.exports = api; root.OG_KNOWLEDGE_SELECTOR = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createKnowledgeSelector() {
  'use strict';
  const MAP = Object.freeze({ prepare_call: ['produto','segmentos','vendas'], live_call: ['vendas','objeções'], handle_objection: ['objeções','ROI','economia'], reach_decision_maker: ['vendas','scripts'], create_message: ['scripts','vendas'], create_email: ['scripts','vendas'], follow_up: ['scripts','fechamento'], negotiate: ['objeções','ROI','fechamento'], close: ['fechamento','vendas'], next_action: ['vendas'], post_call: ['vendas'], personalize_message: ['scripts','vendas'] });
  const PURPOSE_TAGS = Object.freeze({ PRICE_TOO_HIGH:['preço','valor','objeção','ROI'], COST_REDUCTION:['custo','diesel','pneu','ROI'], DECISION_MAKER:['dono','gestor','decisor'], FIRST_CONTACT:['ligação','valor'], FOLLOW_UP:['encerramento','valor'], REFERRAL:['indicação','gestor'] });
  const EXTERNAL_SAFE = new Set(['VALIDADO','REGRA_SEGURANCA']);
  function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
  function select(intent, limit = 3) { return (MAP[intent] || ['vendas']).slice(0, Math.max(1, Math.min(limit, 3))); }
  function query(intent, context, input = '') { return [context?.company?.segmentId, ...select(intent), input].filter(Boolean).join(' ').slice(0, 500); }
  function selectRecords(records, request = {}, limit = 3) {
    const terms = [...(PURPOSE_TAGS[request.messagePurpose] || []), request.intent, request.channel, request.persona, request.stage, ...(request.objections || [])].filter(Boolean).map(normalize);
    return (records || []).map(record => {
      const haystack = normalize([record.category,record.title,record.text,...(record.tags||[])].join(' '));
      const score = terms.reduce((total,term)=>total+(term && haystack.includes(term)?1:0),0);
      return { ...record, score, externalSafe:EXTERNAL_SAFE.has(record.status) };
    }).filter(record=>record.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
  }
  function forPrompt(record) { return { id:record.knowledge_id||record.id, title:record.title, text:record.text, status:record.status, originalStatus:record.originalStatus, confidence:record.confidence, source:record.source, externalSafe:EXTERNAL_SAFE.has(record.status) }; }
  return { MAP, PURPOSE_TAGS, EXTERNAL_SAFE, select, query, selectRecords, forPrompt };
}));
