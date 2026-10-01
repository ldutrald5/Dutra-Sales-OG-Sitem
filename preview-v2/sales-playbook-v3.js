(() => {
'use strict';

const clean = value => String(value ?? '').trim();
const upper = value => clean(value).toUpperCase();

const RELATIONSHIP_LABELS = {
  UNKNOWN: 'Não conhece / não confirmado',
  COLD: 'Não conhece a OG',
  KNOWS_OG: 'Já conhece a OG',
  PREVIOUS_CONTACT: 'Já teve contato',
  PREVIOUS_PROPOSAL: 'Já recebeu proposta',
  NEGOTIATION: 'Em negociação',
  CUSTOMER: 'Cliente OG',
  INACTIVE_CUSTOMER: 'Cliente inativo'
};

function relationshipKey(lead = {}, context = {}) {
  const relationship = upper(lead.relationshipStatus || lead.relationship_status);
  const pipeline = upper(lead.pipelineStage || lead.pipeline_stage);
  const status = upper(lead.status);

  if (['CUSTOMER','INACTIVE_CUSTOMER'].includes(relationship) || pipeline === 'WON' || ['FECHADO','CLIENTE'].includes(status)) {
    return relationship === 'INACTIVE_CUSTOMER' ? 'INACTIVE_CUSTOMER' : 'CUSTOMER';
  }
  if (relationship === 'NEGOTIATION' || pipeline === 'NEGOTIATION') return 'NEGOTIATION';
  if (relationship === 'PREVIOUS_PROPOSAL' || pipeline === 'PROPOSAL' || context.hasProposal) return 'PREVIOUS_PROPOSAL';
  if (relationship === 'PREVIOUS_CONTACT' || ['CONNECTED','DECISION_MAKER_IDENTIFIED','DECISION_MAKER_CONTACTED','QUALIFIED','MEETING_TO_SCHEDULE','MEETING_SCHEDULED','MEETING_COMPLETED'].includes(pipeline)) {
    return 'PREVIOUS_CONTACT';
  }
  if (relationship === 'KNOWS_OG') return 'KNOWS_OG';
  return relationship === 'COLD' ? 'COLD' : 'UNKNOWN';
}

function contactRole(context = {}) {
  return upper(context.preferredContact?.roleCategory || context.preferredContact?.role_category || context.preferredContact?.role);
}

function buildAttackBrief(lead = {}, context = {}) {
  const relationship = relationshipKey(lead, context);
  const role = contactRole(context);
  const fleetKnown = Number(context.fleetSize || lead.fleetSize || lead.fleet_size || 0) > 0;
  const hasPain = Boolean(clean(lead.pain));
  const hasObjection = Boolean(clean(lead.objections || lead.objection));
  const hasSummary = Boolean(clean(lead.accountSummary || lead.summary));
  const company = clean(lead.empresa || lead.nome || 'esta conta');

  if (relationship === 'CUSTOMER' || relationship === 'INACTIVE_CUSTOMER') {
    return {
      relationship,
      awareness: RELATIONSHIP_LABELS[relationship],
      mode: 'CUSTOMER',
      objective: relationship === 'INACTIVE_CUSTOMER'
        ? 'Reativar a relação e descobrir o que mudou desde a última compra.'
        : 'Validar a experiência atual e mapear expansão, reposição ou indicação.',
      opening: 'Quero entender como está a experiência com o que já foi instalado e se mudou algo na frota.',
      questions: [
        'Como o equipamento está performando na rotina?',
        'Entraram veículos novos ou existe reposição pendente?',
        'Existe outra parte da frota onde faria sentido avaliar a aplicação?'
      ],
      preparation: [
        'Revisar última compra, instalação e ocorrências registradas.',
        fleetKnown ? 'Levar o tamanho de frota já conhecido para confirmar se continua atual.' : 'Confirmar a frota atual antes de sugerir expansão.',
        'Separar qualquer problema técnico pendente antes de falar em nova venda.'
      ],
      avoid: 'Não tratar cliente existente como lead frio nem pedir indicação antes de checar a experiência.'
    };
  }

  if (relationship === 'PREVIOUS_PROPOSAL' || relationship === 'NEGOTIATION') {
    return {
      relationship,
      awareness: RELATIONSHIP_LABELS[relationship],
      mode: 'PROPOSAL',
      objective: 'Descobrir o bloqueio real da decisão e sair com um próximo passo concreto.',
      opening: 'Quero revisar o que ficou pendente na proposta e entender o que precisa acontecer para a decisão avançar.',
      questions: [
        'O bloqueio hoje é técnico, financeiro ou de timing?',
        'Quem mais precisa aprovar essa decisão?',
        'Qual informação ou condição falta para avançarmos?'
      ],
      preparation: [
        'Abrir a proposta anterior e conferir configuração, valores e validade.',
        fleetKnown ? 'Confirmar se a frota usada na proposta continua a mesma.' : 'Confirmar veículos e configuração antes de recalcular.',
        hasObjection ? 'Revisar a objeção já registrada para não reiniciar a venda.' : 'Preparar uma pergunta para revelar a objeção ainda não registrada.'
      ],
      avoid: 'Não perguntar apenas “conseguiu analisar?” e não refazer a apresentação do zero.'
    };
  }

  if (relationship === 'PREVIOUS_CONTACT' || relationship === 'KNOWS_OG') {
    return {
      relationship,
      awareness: RELATIONSHIP_LABELS[relationship],
      mode: 'FOLLOW_UP',
      objective: 'Retomar do ponto certo, completar diagnóstico e conquistar o próximo compromisso.',
      opening: relationship === 'KNOWS_OG'
        ? 'Antes de eu repetir apresentação, quero entender o que você já conhece da Olho de Gato e como isso se encaixa na sua operação.'
        : 'Estou retomando exatamente do ponto que combinamos para avançar o que ainda ficou em aberto.',
      questions: [
        hasSummary ? 'O que mudou desde a nossa última conversa?' : 'O que você chegou a avaliar da Olho de Gato até agora?',
        fleetKnown ? 'Essa configuração de frota continua atual?' : 'Quantos veículos e quais configurações vocês têm hoje?',
        hasPain ? 'Essa dor que você comentou ainda é prioridade?' : 'Hoje o que mais pesa em pneus: pressão, desgaste, parada ou custo?'
      ],
      preparation: [
        'Ler o último resumo e a próxima ação antes de ligar.',
        fleetKnown ? 'Revisar a frota já conhecida e marcar o que ainda precisa validar.' : 'Preparar perguntas de frota: marca, modelo, configuração, eixos e PSI quando aplicável.',
        'Definir um único avanço desejado para a conversa.'
      ],
      avoid: 'Não reiniciar a venda do zero e não mandar follow-up sem motivo.'
    };
  }

  const gatekeeper = ['GATEKEEPER','RECEPTION','RECEPCAO','ATENDENTE'].includes(role);
  return {
    relationship,
    awareness: RELATIONSHIP_LABELS[relationship],
    mode: gatekeeper ? 'GATEKEEPER' : 'COLD',
    objective: gatekeeper
      ? 'Chegar ao responsável por frota, manutenção, compras ou proprietário.'
      : 'Criar curiosidade, entender a operação e identificar o decisor sem despejar apresentação.',
    opening: gatekeeper
      ? 'Preciso falar com quem cuida da frota ou da manutenção dos pneus. Você consegue me orientar?'
      : 'Posso te fazer duas perguntas rápidas sobre a frota antes de eu te explicar qualquer coisa?',
    questions: gatekeeper ? [
      'Quem cuida dessa parte?',
      'Fica com frota, manutenção ou proprietário?',
      'Existe ramal ou WhatsApp comercial dessa pessoa?'
    ] : [
      'Como vocês controlam hoje pressão e desgaste dos pneus?',
      'Quantos veículos e quais configurações rodam mais?',
      'Quem responde por frota, manutenção ou decisão de compra?'
    ],
    preparation: [
      'Pesquisar o básico da empresa e segmento antes da ligação.',
      'Não calcular aplicação sem confirmar veículo/configuração.',
      'Definir o próximo passo desejado: decisor, diagnóstico ou reunião.'
    ],
    avoid: gatekeeper
      ? 'Não fazer apresentação técnica completa para recepção.'
      : 'Não começar com catálogo, preço ou uma explicação longa do produto.'
  };
}

const api = { buildAttackBrief, relationshipKey, RELATIONSHIP_LABELS };
globalThis.DUTRA_SALES_PLAYBOOK = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();