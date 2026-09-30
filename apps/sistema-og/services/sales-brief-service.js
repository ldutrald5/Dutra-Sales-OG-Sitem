(function attachSalesBrief(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_BRIEF = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesBrief() {
  'use strict';

  function clean(value) { return String(value ?? '').replace(/\s+/g,' ').trim(); }
  function key(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  }
  function has(value) { return clean(value) !== ''; }

  const SEGMENT_QUESTIONS = Object.freeze({
    transportadora:[
      'Em quais veículos ou conjuntos o problema aparece mais?',
      'Quem acompanha pneus e manutenção no dia a dia?',
      'Como vocês conferem pressão hoje e com que frequência?'
    ],
    agronegocio:[
      'A operação é mais rodoviária, mista ou de safra?',
      'Em quais conjuntos o desgaste ou a calibragem mais atrapalham?',
      'Quem responde por pneus/manutenção durante os picos da operação?'
    ],
    onibus:[
      'A operação é urbana, rodoviária ou fretamento?',
      'Como funciona a inspeção de pneus entre as viagens?',
      'Quem valida manutenção e disponibilidade da frota?'
    ],
    revenda:[
      'Qual perfil de frota aparece com mais frequência entre seus clientes?',
      'Qual volume de reposição ou instalação costuma ter recorrência?',
      'Quem aprova a entrada de um novo item no portfólio?'
    ]
  });

  function eventsForLead(operations = {}, leadId) {
    return (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .filter(item => clean(item.clientId || item.leadId) === clean(leadId))
      .slice()
      .sort((a,b)=>String(b.at || '').localeCompare(String(a.at || '')));
  }

  function relationshipMoment(lead = {}, events = []) {
    const stage=key(lead.conversationStage);
    const status=key(lead.status);
    const hasProposalEvent=events.some(item => ['proposal.sent','proposal_sent','proposal.opened','proposal_opened','proposal.reopened','proposal_reopened'].includes(item.type));

    if (stage === 'not_interested' || status === 'perdido') return { id:'not_interested', label:'Sem interesse registrado' };
    if (stage === 'loyal_customer') return { id:'customer', label:'Cliente fidelizado' };
    if (stage === 'customer' || ['fechado','cliente','ganho'].includes(status)) return { id:'customer', label:'Cliente' };
    if (stage === 'negotiation') return { id:'negotiation', label:'Negociação' };
    if (stage === 'proposal' || hasProposalEvent) return { id:'proposal', label:'Proposta em jogo' };
    if (stage === 'interested') return { id:'interested', label:'Interessado' };
    if (['talked','no_reply','waiting_response'].includes(stage)) return { id:'follow_up', label:'Retomada / follow-up' };
    return { id:'first_contact', label:'Primeiro contato' };
  }

  function ogAwareness(lead = {}) {
    const explicit=key(lead.ogAwareness || lead.productAwareness || lead.ogKnowledge);
    if (['nao_conhece','desconhece','novo','nenhum'].includes(explicit)) return { id:'does_not_know', label:'Não conhece · confirmado' };
    if (['conhece','ja_conhece','familiar','basico'].includes(explicit)) return { id:'knows', label:'Já conhece · confirmado' };
    if (['cliente','usuario','usa','ja_comprou'].includes(explicit)) return { id:'customer', label:'Já usa/comprou · confirmado' };
    return { id:'unknown', label:'Não confirmado no CRM' };
  }

  function contactObjective(moment, lead = {}) {
    if (moment.id === 'first_contact') return 'Entender a operação, descobrir o que o cliente já conhece da Olho de Gato e conquistar um próximo passo simples.';
    if (moment.id === 'follow_up') return 'Retomar o contexto sem repetir apresentação, descobrir o que mudou e sair com próxima ação e data.';
    if (moment.id === 'interested') return 'Aprofundar dor, frota e processo de decisão antes de transformar interesse em proposta.';
    if (moment.id === 'proposal') return 'Descobrir o que impede a decisão hoje e combinar um avanço concreto sem pressionar por “sim ou não”.';
    if (moment.id === 'negotiation') return 'Isolar a objeção principal, responder com evidência e alinhar decisão, responsável e prazo.';
    if (moment.id === 'customer') return 'Validar situação atual e identificar suporte, reposição, expansão ou indicação sem presumir necessidade.';
    if (moment.id === 'not_interested') return 'Confirmar se o cenário mudou; se não mudou, respeitar a decisão e registrar o próximo momento adequado.';
    return clean(lead.nextAction) || 'Definir um próximo passo comercial concreto.';
  }

  function suggestedOpening(moment, lead = {}) {
    const contact=clean(lead.nome) || 'tudo bem';
    const company=clean(lead.empresa) || 'sua operação';
    if (moment.id === 'first_contact') return `Olá, ${contact}. Aqui é o Lucas, da Olho de Gato. Antes de te explicar produto, queria entender rapidinho como a ${company} cuida de pressão e desgaste dos pneus. Você consegue falar dois minutos?`;
    if (moment.id === 'follow_up') return `Olá, ${contact}. Aqui é o Lucas, da Olho de Gato. Não quero repetir apresentação; quero retomar exatamente de onde paramos. O que mudou desde nosso último contato?`;
    if (moment.id === 'interested') return `Olá, ${contact}. Quero aproveitar o interesse que você demonstrou e entender melhor a operação antes de montar qualquer aplicação. Posso te fazer três perguntas rápidas?`;
    if (moment.id === 'proposal') return `Olá, ${contact}. Quero fechar contigo um ponto daquela proposta. Hoje o que pesa mais para avançar: investimento, aplicação ou prioridade interna?`;
    if (moment.id === 'negotiation') return `Olá, ${contact}. Quero resolver o principal ponto que ainda está travando essa negociação e sair com um próximo passo objetivo. Qual é o ponto mais pesado hoje?`;
    if (moment.id === 'customer') return `Olá, ${contact}. Estou acompanhando a conta da ${company} e queria entender como está a operação hoje antes de falar em qualquer nova compra. Tem algum ponto de suporte, reposição ou expansão que vale olhar?`;
    return `Olá, ${contact}. Aqui é o Lucas, da Olho de Gato. Quero só confirmar se o cenário mudou desde nosso último contato; se continuar sem prioridade, eu registro e respeito isso.`;
  }

  function technicalPrep(lead = {}) {
    const items=[];
    if (!has(lead.segmentId)) items.push('Confirmar tipo de operação/segmento antes de escolher argumento comercial.');
    if (!Number(lead.fleetSize)) items.push('Levantar quantidade da frota e as configurações mais representativas.');
    if (!has(lead.pain)) items.push('Validar a dor real antes de relacionar benefício, ROI ou economia.');
    if (!has(lead.decisionMaker)) items.push('Descobrir quem valida tecnicamente e quem aprova comercialmente.');
    items.push('Antes de indicar suporte/aplicação, confirmar veículo, eixo, pressão e regra OG; se faltar dado, marcar validação técnica.');
    return [...new Set(items)].slice(0,5);
  }

  function build(lead = {}, operations = {}) {
    if (!lead?.id) throw new Error('Briefing exige cliente identificado');
    const facts=[];
    const gaps=[];
    const questions=[];
    const doNotSay=[];

    if (has(lead.empresa)) facts.push({label:'Empresa',value:clean(lead.empresa)});
    if (has(lead.nome)) facts.push({label:'Contato',value:clean(lead.nome)});
    if (has(lead.cidadeUf)) facts.push({label:'Local',value:clean(lead.cidadeUf)});
    if (has(lead.segmentId)) facts.push({label:'Segmento',value:clean(lead.segmentId)});
    if (Number(lead.fleetSize) > 0) facts.push({label:'Frota registrada',value:`${Number(lead.fleetSize)} veículo(s)`});
    if (has(lead.decisionMaker)) facts.push({label:'Decisor',value:clean(lead.decisionMaker)});
    if (has(lead.pain)) facts.push({label:'Dor registrada',value:clean(lead.pain)});
    if (has(lead.nextAction)) facts.push({label:'Próxima ação',value:clean(lead.nextAction)});

    if (!Number(lead.fleetSize)) {
      gaps.push('Tamanho/composição da frota');
      questions.push('Quantos veículos entram nessa operação e quais configurações são mais representativas?');
      doNotSay.push('Não trate investimento total, cobertura de frota ou ROI como fechado sem confirmar quantidade e composição.');
    }
    if (!has(lead.decisionMaker)) {
      gaps.push('Decisor/processo de decisão');
      questions.push('Além de você, quem participa da avaliação técnica e da aprovação comercial?');
      doNotSay.push('Não presuma que o contato atual é o decisor ou que pode aprovar sozinho.');
    }
    if (!has(lead.pain)) {
      gaps.push('Dor validada');
      questions.push('Qual problema com pressão, desgaste, inspeção ou manutenção mais incomoda a operação hoje?');
      doNotSay.push('Não apresente uma dor como se o cliente já tivesse confirmado que sofre com ela.');
    } else {
      questions.push(`Você mencionou “${clean(lead.pain)}”. Isso continua acontecendo? Onde e com que frequência?`);
    }

    const segment = key(lead.segmentId);
    const segmentQuestions = SEGMENT_QUESTIONS[segment] || SEGMENT_QUESTIONS.transportadora;
    for (const item of segmentQuestions) if (!questions.includes(item)) questions.push(item);

    questions.push('Quando esse problema acontece, qual impacto vocês percebem em pneus, combustível, manutenção ou disponibilidade?');
    questions.push('Qual seria um próximo passo pequeno e seguro para validar a aplicação?');

    doNotSay.push('Não prometa percentual de economia, vida útil, payback ou resultado financeiro como garantia; trate cálculo como cenário com premissas visíveis.');
    doNotSay.push('Não prometa código/suporte/aplicação técnica exata antes de confirmar veículo, eixo, pressão e regra de aplicação.');
    doNotSay.push('Não ofereça desconto, frete, prazo ou condição de pagamento que não esteja explicitamente aprovado/registrado.');

    const events=eventsForLead(operations,lead.id);
    const moment=relationshipMoment(lead,events);
    const awareness=ogAwareness(lead);
    const attack=Object.freeze({
      moment:Object.freeze(moment),
      awareness:Object.freeze(awareness),
      objective:contactObjective(moment,lead),
      opening:suggestedOpening(moment,lead),
      technicalPrep:Object.freeze(technicalPrep(lead))
    });
    const intentEvent=events.find(item => ['proposal.opened','proposal.reopened','proposal_opened','proposal_reopened'].includes(item.type));
    const sentEvent=events.find(item => ['proposal.sent','proposal_sent'].includes(item.type));
    if (intentEvent) {
      facts.push({label:'Sinal interno de proposta',value:intentEvent.type.includes('reopened') ? 'Reabertura confirmada pelo backend' : 'Abertura confirmada pelo backend'});
      doNotSay.push('Não diga “eu vi você abrir a proposta”. Use o sinal apenas para escolher o timing da abordagem.');
    } else if (sentEvent) {
      doNotSay.push('A proposta foi marcada como enviada, mas não há abertura confirmada: não diga ou insinue que o cliente a visualizou.');
    }

    if (!has(lead.nextAction)) gaps.push('Próximo passo');
    if (!has(lead.cidadeUf)) gaps.push('Cidade/UF');
    if (!has(lead.telefone)) gaps.push('Telefone');

    return Object.freeze({
      leadId:clean(lead.id),
      attack,
      facts:Object.freeze(facts.slice(0,10).map(Object.freeze)),
      gaps:Object.freeze([...new Set(gaps)].slice(0,8)),
      questions:Object.freeze([...new Set(questions)].slice(0,7)),
      doNotSay:Object.freeze([...new Set(doNotSay)].slice(0,7))
    });
  }

  return Object.freeze({ build });
}));
