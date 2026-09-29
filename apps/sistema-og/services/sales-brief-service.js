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
