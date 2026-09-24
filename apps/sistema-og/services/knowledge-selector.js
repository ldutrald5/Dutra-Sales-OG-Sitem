(function attachKnowledgeSelector(root, factory) {
  const api = factory(); if (typeof module !== 'undefined' && module.exports) module.exports = api; root.OG_KNOWLEDGE_SELECTOR = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createKnowledgeSelector() {
  'use strict';
  const MAP = Object.freeze({ prepare_call: ['produto','segmentos','vendas'], live_call: ['vendas','objeções'], handle_objection: ['objeções','ROI','economia'], reach_decision_maker: ['vendas','scripts'], create_message: ['scripts','vendas'], create_email: ['scripts','vendas'], follow_up: ['scripts','fechamento'], negotiate: ['objeções','ROI','fechamento'], close: ['fechamento','vendas'], next_action: ['vendas'], post_call: ['vendas'], personalize_message: ['scripts','vendas'] });
  function select(intent, limit = 3) { return (MAP[intent] || ['vendas']).slice(0, Math.max(1, Math.min(limit, 3))); }
  function query(intent, context, input = '') { return [context?.company?.segmentId, ...select(intent), input].filter(Boolean).join(' ').slice(0, 500); }
  return { MAP, select, query };
}));
