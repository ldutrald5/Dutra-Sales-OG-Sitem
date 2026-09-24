(function attachAiService(root, factory) {
  const api = factory(); if (typeof module !== 'undefined' && module.exports) module.exports = api; root.OG_AI_SERVICE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAiService() {
  'use strict';
  const cache = new Map(); const metrics = []; let provider = null;
  function configure(options = {}) { provider = typeof options.generate === 'function' ? options.generate : null; }
  function localResponse(request) {
    const company = request.context?.company?.name || 'o cliente'; const contact = request.context?.contact?.name || 'o contato'; const input = String(request.input || '').trim();
    const missing = 'Informação comercial não cadastrada. Valide antes de prometer condições ou resultados.';
    const common = { summary: input || `Ação comercial para ${company}.`, recommendedResponse:'', question:'', objective:'', suggestedNextAction:'', crmSuggestion:null, source:'safe_local_fallback' };
    const responses = {
      prepare_call:{recommendedResponse:`Olá, ${contact}. Aqui é o Lucas, da Olho de Gato. Posso usar dois minutos para entender como vocês cuidam hoje da pressão e do desgaste dos pneus?`,question:'Como essa rotina funciona hoje e onde aparecem as maiores dificuldades?',objective:'Entender processo, dor, impacto e responsável pela decisão.',suggestedNextAction:'Combinar um próximo compromisso concreto.'},
      live_call:{recommendedResponse:'Entendi. Antes de sugerir qualquer caminho, quero compreender melhor como isso afeta a operação de vocês.',question:'Quando isso acontece, qual é o impacto mais perceptível na rotina?',objective:'Transformar a fala em dor e impacto confirmados.',suggestedNextAction:'Aprofundar uma pergunta e registrar a resposta.'},
      handle_objection:{recommendedResponse:'Entendo sua preocupação. Para eu não responder de forma genérica, quero separar se o ponto principal é investimento, prioridade ou segurança da aplicação.',question:'Qual desses pontos pesa mais para vocês agora?',objective:'Classificar a objeção antes de argumentar.',suggestedNextAction:missing},
      reach_decision_maker:{recommendedResponse:'Obrigado por me orientar. Quero falar com a pessoa certa sem tomar seu tempo: quem acompanha pneus, manutenção ou custos da frota?',question:'Qual é o melhor nome, contato e horário para eu apresentar o assunto de forma objetiva?',objective:'Conseguir a ponte para o responsável preservando o contato atual.',suggestedNextAction:'Registrar decisor e combinar a abordagem.'},
      negotiate:{recommendedResponse:'Quero recapitular o que já fez sentido e entender o que ainda impede o próximo passo.',question:'Qual condição precisa estar clara para vocês avançarem com segurança?',objective:'Identificar a objeção central e o compromisso possível.',suggestedNextAction:missing},
      close:{recommendedResponse:'Pelo que alinhamos, proponho definirmos agora o próximo passo com responsável e data.',question:'Faz mais sentido avançar com validação técnica, dados da frota, orçamento ou conversa com o decisor?',objective:'Sair com compromisso concreto, sem pressão artificial.',suggestedNextAction:'Confirmar ação, responsável e data.'},
      follow_up:{recommendedResponse:`Olá, ${contact}. Retomando nosso contato sobre a operação da ${company}: queria confirmar se conseguiu avaliar o material e qual é o próximo passo mais útil.`,question:'Há alguma dúvida técnica ou comercial que esteja impedindo o avanço?',objective:'Descobrir o bloqueio real.',suggestedNextAction:'Agendar resposta ou reunião.'},
      create_message:{recommendedResponse:`Olá, ${contact}! Aqui é o Lucas, da Olho de Gato. Estou entrando em contato para entender como a ${company} trabalha hoje a gestão dos pneus da frota. Qual é o melhor horário para uma conversa rápida?`,objective:'Abrir diálogo com contexto e CTA claro.',suggestedNextAction:'Revisar e abrir no WhatsApp.'},
      personalize_message:{recommendedResponse:input || `Olá, ${contact}! Posso falar rapidamente sobre a operação da ${company}?`,objective:'Personalizar sem criar fatos.',suggestedNextAction:'Revisar antes de enviar.'},
      create_email:{recommendedResponse:`Assunto: Conversa sobre a operação da ${company}\n\nOlá, ${contact}.\n\nGostaria de entender a rotina atual da frota e verificar se existe espaço para uma avaliação técnica responsável. Podemos marcar uma conversa breve?\n\nAtenciosamente,\nLucas — Olho de Gato`,objective:'Criar e-mail editável com CTA.',suggestedNextAction:'Revisar e copiar; nenhum envio automático.'},
      next_action:{question:'Qual compromisso concreto reduz mais a incerteza desta conta agora?',objective:'Escolher a menor ação que faça a negociação avançar.',suggestedNextAction:request.context?.nextAction?.description || 'Definir ação, responsável e data.'},
      post_call:{objective:'Transformar anotações em preview revisável.',suggestedNextAction:'Revisar antes de salvar.',crmSuggestion:{summary:input,contact:request.context?.contact?.name||'',fleet:request.context?.company?.fleetSize||'',interest:'',objection:'',nextAction:'',suggestedDate:'',suggestedStage:request.context?.stage||'novo'}}
    };
    return { ...common, ...(responses[request.intent] || responses.next_action) };
  }
  function validateResponse(value) { return { ...localResponse({intent:'next_action',context:{}}), ...(value && typeof value === 'object' ? value : {}), source:value?.source || 'provider' }; }
  async function generate(request, options = {}) {
    const started=Date.now(); const key=options.cacheKey||'';
    if (key && cache.has(key)) { metrics.push({intent:request.intent,modelTier:request.modelTier,cached:true,success:true,duration:0}); return {...cache.get(key),cached:true}; }
    let result; let success=true;
    try { result=provider ? validateResponse(await provider(request)) : localResponse(request); } catch (_) { success=false; result=localResponse(request); result.fallbackReason='provider_unavailable'; }
    if (key && success) cache.set(key,result);
    metrics.push({intent:request.intent,modelTier:request.modelTier,inputSize:JSON.stringify(request).length,outputSize:JSON.stringify(result).length,duration:Date.now()-started,success,cached:false});
    return result;
  }
  return { configure, generate, structure:generate, summarize:generate, localResponse, validateResponse, getMetrics:()=>metrics.slice(), clearCache:()=>cache.clear() };
}));
