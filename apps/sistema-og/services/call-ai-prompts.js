(function attachCallAiPrompts(root, factory) {
  const api = factory(); if (typeof module !== 'undefined' && module.exports) module.exports = api; root.OG_CALL_AI_PROMPTS = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCallAiPrompts() {
  'use strict';
  const INTENTS = Object.freeze({ prepare_call:{label:'Preparar ligação',icon:'📞',tier:2}, live_call:{label:'Durante a ligação',icon:'🎧',tier:2}, handle_objection:{label:'Objeção',icon:'🚧',tier:2}, reach_decision_maker:{label:'Chegar ao decisor',icon:'👤',tier:2}, create_message:{label:'Criar mensagem',icon:'💬',tier:1}, create_email:{label:'Criar e-mail',icon:'📧',tier:1}, follow_up:{label:'Follow-up',icon:'🔄',tier:1}, negotiate:{label:'Negociação',icon:'🤝',tier:2}, close:{label:'Fechamento',icon:'🎯',tier:2}, next_action:{label:'Próxima ação',icon:'💡',tier:1}, post_call:{label:'Pós-ligação',icon:'📝',tier:1}, personalize_message:{label:'Personalizar mensagem',icon:'✨',tier:1} });
  const FIXED_RULES = ['Responda em português do Brasil, de forma curta e operacional.','Use apenas fatos do contexto e do conhecimento fornecido.','Não invente preço, garantia, prazo, desconto, economia ou condição comercial.','Diferencie fato, hipótese e sugestão.','A IA sugere; qualquer mudança no CRM exige confirmação do usuário.'];
  function build(intent, context, input, knowledge = []) { if (!INTENTS[intent]) throw new Error('Intenção Call AI inválida.'); return { intent, modelTier: INTENTS[intent].tier, responseFormat:'structured_json', rules:FIXED_RULES, context, knowledge:knowledge.slice(0,3), input:String(input||'').slice(0,1200) }; }
  return { INTENTS, FIXED_RULES, build };
}));
