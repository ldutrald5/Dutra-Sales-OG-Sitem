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

  function commercialMoment(lead = {}) {
    const stage=key(lead.conversationStage);
    const status=key(lead.status);
    if (stage === 'loyal_customer') return 'loyal_customer';
    if (stage === 'customer' || status === 'fechado' || key(lead.operationalStatus) === 'customer') return 'customer';
    if (stage === 'negotiation' || status === 'negociacao') return 'negotiation';
    if (stage === 'proposal' || status === 'proposta_enviada') return 'proposal';
    if (stage === 'interested') return 'interested';
    if (stage === 'no_reply') return 'no_reply';
    if (stage === 'waiting_response') return 'waiting_response';
    if (stage === 'not_interested' || status === 'perdido') return 'not_interested';
    if (stage === 'talked' || status === 'contatado' || (Array.isArray(lead.interactions) && lead.interactions.length)) return 'talked';
    return 'first_contact';
  }

  const MOMENT_PLAYBOOK = Object.freeze({
    first_contact:Object.freeze({
      label:'Ainda não conhece / primeiro contato',
      objective:'Abrir conversa, entender a operação e conquistar permissão para diagnosticar.',
      approach:'Não despeje produto. Faça o cliente falar primeiro sobre rotina de pneus, frota e responsabilidade pela manutenção.',
      opening:'Aqui é o Lucas, da Olho de Gato. Antes de te explicar qualquer coisa, posso entender rapidinho como vocês controlam pressão e desgaste dos pneus hoje?',
      whatsapp:'Olá! Aqui é o Lucas, da Olho de Gato. Trabalho com operação de pneus em caminhões e carretas. Antes de te mandar apresentação, queria entender como vocês fazem hoje o controle de pressão e desgaste da frota.',
      nextStep:'Confirmar frota, dor e responsável pela decisão; só então escolher demonstração, validação técnica ou proposta.'
    }),
    talked:Object.freeze({
      label:'Já conversei / retomada',
      objective:'Retomar pelo contexto real e descobrir o que mudou desde o último contato.',
      approach:'Não reapresente tudo. Comece pelo último ponto conhecido, confirme se continua válido e procure a lacuna que impediu avanço.',
      opening:'Estou retomando nosso contato para não repetir apresentação. O que mudou na operação desde a última vez que conversamos?',
      whatsapp:'Olá! Retomando nosso contato: em vez de repetir toda a apresentação, queria entender o que mudou aí desde nossa última conversa e qual ponto ainda falta esclarecer.',
      nextStep:'Atualizar contexto, objeção e próxima ação com data.'
    }),
    no_reply:Object.freeze({
      label:'Não respondeu / recuperação',
      objective:'Reabrir contato sem cobrança e descobrir se é falta de timing, prioridade ou interesse.',
      approach:'Use uma mensagem curta com motivo concreto. Evite “viu minha mensagem?” e não pressione sem novo valor.',
      opening:'Quero ser objetivo: estou retomando porque posso ajustar a conversa ao momento de vocês. Isso ainda faz sentido ou ficou fora de prioridade?',
      whatsapp:'Olá! Passando de forma objetiva: isso ainda faz sentido para a operação de vocês ou ficou para outro momento? Se fizer, eu retomo pelo ponto certo sem repetir tudo.',
      nextStep:'Classificar momento real: retomar, agendar, pausar ou encerrar sem insistência.'
    }),
    waiting_response:Object.freeze({
      label:'Aguardando resposta / follow-up',
      objective:'Transformar espera em decisão ou próximo passo concreto.',
      approach:'Leve um motivo novo para o contato: aplicação revisada, pergunta pendente, cenário, referência ou decisão específica.',
      opening:'Quero fechar contigo um ponto que ficou pendente para sabermos se avançamos ou ajustamos o caminho.',
      whatsapp:'Olá! Separei o ponto que ficou pendente da nossa conversa e queria alinhar contigo para definirmos o próximo passo, sem deixar isso solto.',
      nextStep:'Sair com resposta, responsável e data — não apenas “vou ver”.'
    }),
    interested:Object.freeze({
      label:'Interessado / qualificação',
      objective:'Transformar interesse em escopo concreto de avaliação.',
      approach:'Aprofunde frota, dor, impacto, decisor e primeiro grupo de veículos. Evite proposta genérica cedo demais.',
      opening:'Como já existe interesse, quero usar nossa conversa para definir onde faz mais sentido validar primeiro e o que precisa estar claro para vocês decidirem.',
      whatsapp:'Olá! Como você demonstrou interesse, quero avançar de forma prática: definir os veículos prioritários, validar a aplicação e montar o próximo passo com base na operação real.',
      nextStep:'Definir veículo/conjunto, aplicação a validar e participantes da decisão.'
    }),
    proposal:Object.freeze({
      label:'Proposta enviada',
      objective:'Descobrir o que está impedindo a decisão e tratar a objeção real.',
      approach:'Não pergunte apenas se “analisou a proposta”. Separe investimento, aplicação, prioridade interna e processo de decisão.',
      opening:'Quero fechar contigo um ponto daquela proposta: hoje, o que pesa mais para decidir — investimento, aplicação, prioridade ou aprovação interna?',
      whatsapp:'Olá! Sobre a proposta: em vez de só perguntar se conseguiu olhar, queria entender qual ponto ainda precisa ficar claro para vocês decidirem com segurança.',
      nextStep:'Registrar objeção real e combinar ação específica: revisão, reunião, ajuste ou decisão.'
    }),
    negotiation:Object.freeze({
      label:'Negociação',
      objective:'Conduzir decisão sem ceder antes de entender o bloqueio.',
      approach:'Classifique a objeção antes de responder. Proteja margem e não ofereça desconto como primeira reação.',
      opening:'Antes de mexermos em condição, quero entender exatamente o que está travando a decisão para tratarmos o ponto certo.',
      whatsapp:'Olá! Quero avançar na negociação pelo ponto correto. O que hoje está travando mais: condição, aplicação, prazo ou aprovação?',
      nextStep:'Resolver um bloqueio por vez e fechar compromisso objetivo com data.'
    }),
    customer:Object.freeze({
      label:'Cliente / pós-venda',
      objective:'Validar resultado, suporte e oportunidade de expansão sem transformar pós-venda em venda agressiva.',
      approach:'Comece pela experiência real. Só depois explore frota ainda não coberta, reposição ou indicação.',
      opening:'Quero primeiro saber como o equipamento está se comportando na operação de vocês e se existe algum ponto que eu precise acompanhar.',
      whatsapp:'Olá! Passando no pós-venda para saber como o equipamento está se comportando e se tem algo que eu possa acompanhar por aí. Depois, se fizer sentido, vemos os próximos veículos.',
      nextStep:'Registrar satisfação/evidência e só então avaliar expansão, reposição ou indicação.'
    }),
    loyal_customer:Object.freeze({
      label:'Cliente fidelizado',
      objective:'Manter relacionamento, antecipar reposição/expansão e gerar indicação com contexto.',
      approach:'Trate como parceria. Use histórico, cobertura da frota e necessidades futuras em vez de reapresentar produto.',
      opening:'Quero fazer uma revisão rápida da operação com vocês: o que mudou na frota e onde posso ajudar antes de virar urgência?',
      whatsapp:'Olá! Fazendo uma revisão rápida da operação: mudou algo na frota ou surgiu alguma necessidade de reposição/expansão em que eu possa me antecipar?',
      nextStep:'Mapear mudança de frota, cobertura, reposição e oportunidade de indicação.'
    }),
    not_interested:Object.freeze({
      label:'Sem interesse registrado',
      objective:'Entender se o “não” é definitivo, de timing ou de encaixe — sem insistência.',
      approach:'Respeite o registro. Faça no máximo uma checagem contextual quando houver motivo real novo.',
      opening:'Tenho registrado que não fazia sentido naquele momento. Só quero confirmar se continua assim para eu respeitar a prioridade de vocês.',
      whatsapp:'Olá! Tenho aqui que isso não fazia sentido naquele momento. Só confirmando se continua assim para eu não insistir sem motivo.',
      nextStep:'Confirmar pausa/encerramento ou registrar novo motivo concreto para reabrir.'
    })
  });

  function technicalPrep(lead = {}) {
    const items=[];
    const vehicleText=clean(lead.vehicle || lead.vehicleModel || lead.vehicleConfig || lead.fleetComposition || lead.vehicles);
    if (vehicleText) items.push({status:'known',label:'Veículo/configuração',value:vehicleText});
    else items.push({status:'missing',label:'Veículo/configuração',value:'Confirmar marca, modelo, ano e configuração do conjunto antes de indicar aplicação.'});
    const pressure=clean(lead.pressure || lead.tirePressure || lead.operatingPressure);
    if (pressure) items.push({status:'known',label:'Pressão de trabalho',value:pressure});
    else items.push({status:'missing',label:'Pressão de trabalho',value:'Confirmar pressão usada na operação; não escolher libragem por suposição.'});
    const application=clean(lead.technicalApplication || lead.applicationStatus || lead.ogApplication);
    if (application) items.push({status:'known',label:'Aplicação OG',value:application});
    else items.push({status:'missing',label:'Aplicação OG',value:'Necessária validação técnica de eixo/posição/suporte antes da proposta final.'});
    if (!Number(lead.fleetSize)) items.push({status:'missing',label:'Escala da frota',value:'Confirmar quantidade de veículos/conjuntos para dimensionar piloto ou expansão.'});
    return items.slice(0,4);
  }

  function playbookForLead(lead = {}) {
    const moment=commercialMoment(lead);
    const base=MOMENT_PLAYBOOK[moment] || MOMENT_PLAYBOOK.first_contact;
    const company=clean(lead.empresa || lead.nome || '');
    const contact=clean(lead.nome || '');
    let whatsapp=base.whatsapp;
    if (company) whatsapp=whatsapp.replace('a operação de vocês','a operação da '+company);
    if (contact) whatsapp=whatsapp.replace(/^Olá!/, 'Olá, '+contact+'!');
    return Object.freeze({
      moment,
      label:base.label,
      objective:base.objective,
      approach:base.approach,
      opening:base.opening,
      whatsapp,
      nextStep:base.nextStep,
      technicalPrep:Object.freeze(technicalPrep(lead).map(Object.freeze))
    });
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
      doNotSay:Object.freeze([...new Set(doNotSay)].slice(0,7)),
      playbook:playbookForLead(lead)
    });
  }

  return Object.freeze({ build, commercialMoment, playbookForLead });
}));
