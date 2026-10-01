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


  const ROUTE_APPROACHES = Object.freeze({
    first_contact:Object.freeze({
      label:'Primeiro contato',
      objective:'Entender a operação, validar uma dor real e descobrir quem participa da decisão antes de apresentar a solução.',
      opening:'Olá, {{contact}}. Aqui é o Lucas, da Olho de Gato. Antes de te explicar qualquer coisa, quero entender como vocês cuidam de pressão e desgaste dos pneus hoje. Posso te fazer duas perguntas rápidas?',
      primaryQuestion:'Como vocês controlam a pressão dos pneus hoje e quem acompanha isso no dia a dia?',
      desiredNextStep:'Sair com processo/dor confirmados, responsável identificado e um veículo ou conjunto para aprofundar.'
    }),
    relationship:Object.freeze({
      label:'Retomada com contexto',
      objective:'Retomar do ponto real sem reiniciar a venda e descobrir o que mudou desde o último contato.',
      opening:'Olá, {{contact}}. Aqui é o Lucas, da Olho de Gato. Vi que já tivemos contato e não quero te repetir apresentação. Queria retomar do ponto em que ficou e entender o que mudou por aí.',
      primaryQuestion:'Do que vocês chegaram a avaliar, o que fez sentido e o que ficou pendente?',
      desiredNextStep:'Atualizar contexto, objeção e combinar uma próxima ação com responsável e data.'
    }),
    follow_up:Object.freeze({
      label:'Follow-up',
      objective:'Retomar o combinado, identificar a pendência atual e evitar um follow-up vazio.',
      opening:'Olá, {{contact}}. Estou retomando exatamente do ponto que combinamos para não deixar essa conversa solta.',
      primaryQuestion:'O que mudou desde nosso último contato e o que falta hoje para avançarmos?',
      desiredNextStep:'Resolver a pendência ou sair com um novo compromisso objetivo e datado.'
    }),
    diagnosis:Object.freeze({
      label:'Diagnóstico do interesse',
      objective:'Transformar interesse em diagnóstico concreto de frota, dor e processo de decisão.',
      opening:'Olá, {{contact}}. Como já existe interesse, prefiro não fazer uma apresentação genérica. Quero entender onde isso faria mais sentido na operação de vocês.',
      primaryQuestion:'Qual veículo ou conjunto você escolheria primeiro para validar a solução e por quê?',
      desiredNextStep:'Definir veículo/conjunto prioritário e os dados necessários para validação técnica.'
    }),
    proposal_followup:Object.freeze({
      label:'Proposta / negociação',
      objective:'Descobrir a barreira real da decisão em vez de perguntar apenas se a proposta foi vista.',
      opening:'Olá, {{contact}}. Quero alinhar um ponto daquela proposta. Hoje, o que pesa mais para vocês avançarem: investimento, aplicação na frota ou prioridade interna?',
      primaryQuestion:'O que precisaria ficar mais claro ou mudar para vocês conseguirem tomar uma decisão?',
      desiredNextStep:'Isolar a objeção principal e combinar a ação que destrava a decisão.'
    }),
    customer_reactivation:Object.freeze({
      label:'Reativação de cliente',
      objective:'Retomar a relação de cliente, entender o cenário atual e identificar necessidade real antes de oferecer algo novo.',
      opening:'Olá, {{contact}}. Aqui é o Lucas, da Olho de Gato. Estou retomando seu atendimento e quero primeiro entender como está a operação hoje antes de falar em qualquer nova compra.',
      primaryQuestion:'O que mudou na frota ou na rotina de pneus desde a última vez que vocês compraram com a gente?',
      desiredNextStep:'Atualizar frota, pendências e necessidade atual; só então avaliar reposição ou expansão.'
    }),
    post_sale:Object.freeze({
      label:'Pós-venda / expansão',
      objective:'Validar a experiência real, resolver pendências e só depois mapear expansão, reposição ou indicação.',
      opening:'Olá, {{contact}}. Antes de falar em ampliar qualquer coisa, quero saber como está a experiência de vocês e se ficou alguma pendência de uso, instalação ou manutenção.',
      primaryQuestion:'Como o equipamento está se comportando na operação e o que vocês perceberam desde a instalação?',
      desiredNextStep:'Registrar resultado ou problema real e, se fizer sentido, abrir expansão, reposição ou indicação.'
    }),
    erp_review:Object.freeze({
      label:'Conferir ERP antes de abordar',
      objective:'Validar os dados conflitantes ou incompletos antes de qualquer contato comercial.',
      opening:'Não abordar o cliente antes da conferência. Resolva primeiro a divergência no ERP.',
      primaryQuestion:'Pedido, cliente, telefone, valor e situação estão confirmados no ERP?',
      desiredNextStep:'Eliminar a divergência e somente depois liberar a conta para abordagem.'
    })
  });

  function approachFor(routeId = 'first_contact', lead = {}) {
    const id=key(routeId) || 'first_contact';
    const base=ROUTE_APPROACHES[id] || ROUTE_APPROACHES.first_contact;
    const contact=clean(lead.nome).split(/\s+/)[0] || 'tudo bem';
    return Object.freeze({
      id,
      label:base.label,
      objective:base.objective,
      opening:base.opening.replaceAll('{{contact}}',contact),
      primaryQuestion:base.primaryQuestion,
      desiredNextStep:base.desiredNextStep
    });
  }

  function eventsForLead(operations = {}, leadId) {
    return (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .filter(item => clean(item.clientId || item.leadId) === clean(leadId))
      .slice()
      .sort((a,b)=>String(b.at || '').localeCompare(String(a.at || '')));
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
      facts:Object.freeze(facts.slice(0,10).map(Object.freeze)),
      gaps:Object.freeze([...new Set(gaps)].slice(0,8)),
      questions:Object.freeze([...new Set(questions)].slice(0,7)),
      doNotSay:Object.freeze([...new Set(doNotSay)].slice(0,7))
    });
  }

  return Object.freeze({ build });
}));
