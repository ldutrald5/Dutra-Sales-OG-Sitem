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

  const APPROACH_PROFILES = Object.freeze({
    first_contact:Object.freeze({
      id:'first_contact',
      label:'Primeiro contato',
      awareness:'Conhecimento da OG não confirmado',
      objective:'Entender a operação e descobrir se existe uma dor real antes de apresentar produto.',
      opening:'Antes de eu te explicar a Olho de Gato, quero entender como vocês cuidam de pressão e desgaste dos pneus hoje.',
      primaryQuestion:'Como vocês fazem hoje o controle de pressão e quem acompanha isso no dia a dia?',
      desiredNextStep:'Sair com uma dor/processo confirmado e um veículo ou conjunto para aprofundar.'
    }),
    talked:Object.freeze({
      id:'talked',
      label:'Retomada com contexto',
      awareness:'Já houve contato com a OG',
      objective:'Retomar do ponto real sem repetir apresentação e descobrir o que mudou.',
      opening:'Antes de eu repetir apresentação, quero retomar exatamente de onde paramos e entender o que mudou desde então.',
      primaryQuestion:'Do que você chegou a conhecer ou avaliar, o que fez mais sentido e o que ficou pendente?',
      desiredNextStep:'Atualizar dor, momento e próximo passo com data/responsável.'
    }),
    no_reply:Object.freeze({
      id:'no_reply',
      label:'Recuperação de contato',
      awareness:'Contato anterior registrado; resposta atual não confirmada',
      objective:'Recuperar o timing sem pressionar e obter um próximo passo objetivo.',
      opening:'Quero só alinhar contigo se esse assunto continua fazendo sentido agora ou se é melhor retomarmos em outro momento.',
      primaryQuestion:'Hoje isso ainda é prioridade para vocês ou mudou alguma coisa na operação?',
      desiredNextStep:'Confirmar interesse/timing ou combinar um retorno exato.'
    }),
    waiting_response:Object.freeze({
      id:'waiting_response',
      label:'Follow-up combinado',
      awareness:'Já houve conversa; aguardando continuidade',
      objective:'Retomar o combinado e remover a pendência que impede o avanço.',
      opening:'Estou retomando o ponto que ficou combinado para não deixar a conversa solta.',
      primaryQuestion:'O que falta hoje para conseguirmos avançar para o próximo passo?',
      desiredNextStep:'Resolver a pendência ou remarcar ação, responsável e data.'
    }),
    interested:Object.freeze({
      id:'interested',
      label:'Interesse → diagnóstico',
      awareness:'Interesse registrado; entendimento técnico ainda deve ser confirmado',
      objective:'Transformar interesse em diagnóstico concreto de frota/aplicação.',
      opening:'Como já existe interesse, quero evitar uma apresentação genérica e dimensionar onde isso faria mais sentido na sua operação.',
      primaryQuestion:'Qual veículo ou conjunto você usaria primeiro para validar a solução?',
      desiredNextStep:'Definir veículo/conjunto e dados necessários para validação técnica.'
    }),
    proposal:Object.freeze({
      id:'proposal',
      label:'Follow-up de proposta',
      awareness:'Proposta/Orçamento registrado',
      objective:'Descobrir a barreira real da decisão em vez de perguntar apenas se a proposta foi vista.',
      opening:'Quero fechar contigo um ponto daquela proposta: o que hoje pesa mais para decidir — investimento, aplicação ou prioridade interna?',
      primaryQuestion:'O que precisaria ficar mais claro ou mudar para vocês conseguirem tomar uma decisão?',
      desiredNextStep:'Isolar objeção principal e combinar a ação que destrava a decisão.'
    }),
    negotiation:Object.freeze({
      id:'negotiation',
      label:'Negociação',
      awareness:'Negociação em andamento',
      objective:'Isolar a objeção principal, preservar valor e avançar a decisão.',
      opening:'Quero separar o ponto principal da negociação para não ficar girando em várias coisas ao mesmo tempo.',
      primaryQuestion:'Hoje o principal obstáculo é investimento, condição, aplicação técnica ou prioridade?',
      desiredNextStep:'Sair com objeção classificada e decisão/contrapartida clara.'
    }),
    customer:Object.freeze({
      id:'customer',
      label:'Pós-venda e expansão',
      awareness:'Relação de cliente registrada',
      objective:'Validar experiência real antes de falar em expansão, reposição ou indicação.',
      opening:'Antes de falar em ampliar qualquer coisa, quero entender como o equipamento e a rotina estão se comportando para vocês.',
      primaryQuestion:'O que vocês perceberam na operação desde a instalação/uso e o que ainda precisa melhorar?',
      desiredNextStep:'Registrar evidência de satisfação/problema e então avaliar expansão, reposição ou acompanhamento.'
    }),
    loyal_customer:Object.freeze({
      id:'loyal_customer',
      label:'Fidelização e expansão',
      awareness:'Cliente fidelizado registrado',
      objective:'Usar a relação existente para mapear expansão, recompra e indicação sem pular o pós-venda.',
      opening:'Quero revisar rapidamente como está a operação e ver se existe algum ponto em que eu possa ajudar mais vocês.',
      primaryQuestion:'Existe parte da frota, reposição ou outra operação que ainda ficou fora da solução?',
      desiredNextStep:'Mapear expansão/reposição e, se houver satisfação explícita, abrir espaço para indicação.'
    }),
    not_interested:Object.freeze({
      id:'not_interested',
      label:'Reativação respeitosa',
      awareness:'Sem interesse registrado anteriormente',
      objective:'Checar se o contexto mudou sem pressionar ou tratar a negativa antiga como inválida.',
      opening:'Da última vez não fazia sentido seguir. Estou te procurando só para entender se o cenário mudou ou se continua igual.',
      primaryQuestion:'Mudou alguma coisa na frota, na manutenção ou na prioridade desde nosso último contato?',
      desiredNextStep:'Confirmar que continua sem interesse ou registrar um motivo real para reabrir.'
    })
  });

  function eventsForLead(operations = {}, leadId) {
    return (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .filter(item => clean(item.clientId || item.leadId) === clean(leadId))
      .slice()
      .sort((a,b)=>String(b.at || '').localeCompare(String(a.at || '')));
  }

  function stageForLead(lead = {}) {
    const explicit=key(lead.conversationStage);
    if (APPROACH_PROFILES[explicit]) return explicit;
    const status=key(lead.status);
    const operational=key(lead.operationalStatus);
    if (status === 'perdido') return 'not_interested';
    if (status === 'proposta_enviada') return 'proposal';
    if (status === 'negociacao') return 'negotiation';
    if (status === 'fechado' || operational === 'customer') return 'customer';
    if (Array.isArray(lead.interactions) && lead.interactions.length) return 'talked';
    if (has(lead.lastContactAt) || has(lead.accountSummary) || has(lead.pain)) return 'talked';
    return 'first_contact';
  }

  function approachForLead(lead = {}) {
    const stage=stageForLead(lead);
    return APPROACH_PROFILES[stage] || APPROACH_PROFILES.first_contact;
  }

  function technicalPreparation(lead = {}) {
    const items=[];
    if (!Number(lead.fleetSize)) items.push('Confirmar quantidade e composição da frota antes de dimensionar cobertura ou investimento.');
    items.push('Confirmar marca, modelo, ano, configuração/eixos e pressão do veículo ou conjunto que será avaliado.');
    items.push('Só informar código de suporte/aplicação quando houver regra OG validada para aquele veículo.');
    if (!has(lead.pain)) items.push('Validar primeiro a dor operacional; não escolher argumento técnico apenas por plausibilidade.');
    if (!has(lead.decisionMaker)) items.push('Descobrir quem valida tecnicamente e quem aprova comercialmente.');
    return [...new Set(items)].slice(0,5);
  }

  function build(lead = {}, operations = {}) {
    if (!lead?.id) throw new Error('Briefing exige cliente identificado');
    const facts=[];
    const gaps=[];
    const questions=[];
    const doNotSay=[];
    const approach=approachForLead(lead);

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

    if (approach.primaryQuestion && !questions.includes(approach.primaryQuestion)) questions.unshift(approach.primaryQuestion);

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
      approach:Object.freeze({ ...approach, preparation:Object.freeze(technicalPreparation(lead)) }),
      facts:Object.freeze(facts.slice(0,10).map(Object.freeze)),
      gaps:Object.freeze([...new Set(gaps)].slice(0,8)),
      questions:Object.freeze([...new Set(questions)].slice(0,7)),
      doNotSay:Object.freeze([...new Set(doNotSay)].slice(0,7))
    });
  }

  return Object.freeze({ build, approachForLead, stageForLead });
}));
