(function attachWhatsappService(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_WHATSAPP_SERVICE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createWhatsappService() {
  'use strict';

  const TEMPLATES = Object.freeze([
    { id: 'nao_atendeu', name: 'Não atendeu', subject: 'Retorno de contato', body: 'Olá, {{primeiro_nome}}! Aqui é o {{vendedor}}, da Olho de Gato. Tentei falar com você sobre {{assunto}}. Qual horário fica melhor para conversarmos?' },
    { id: 'pos_ligacao', name: 'Pós-ligação', subject: 'Nossa conversa', body: 'Olá, {{primeiro_nome}}! Obrigado pela conversa. Conforme combinamos sobre {{assunto}}, sigo à disposição e retorno no próximo passo acertado.' },
    { id: 'apresentacao', name: 'Enviar apresentação', subject: 'Apresentação Olho de Gato', body: 'Olá, {{primeiro_nome}}! Separei a apresentação da Olho de Gato para a {{empresa}}. Posso esclarecer qualquer ponto depois que você analisar.' },
    { id: 'follow_up', name: 'Follow-up', subject: 'Acompanhamento', body: 'Olá, {{primeiro_nome}}! Estou retomando nosso contato sobre {{assunto}}. Conseguiu analisar? Posso ajudar em alguma dúvida para avançarmos?' },
    { id: 'orcamento', name: 'Orçamento', subject: 'Orçamento Olho de Gato', body: 'Olá, {{primeiro_nome}}! Preparei o orçamento solicitado para a {{empresa}}. Revise os dados e me diga se deseja ajustar algum ponto.' }
  ]);

  function normalizeBrazilianPhone(value) {
    let phone = String(value || '').replace(/\D/g, '');
    phone = phone.replace(/^00/, '');
    if ((phone.length === 10 || phone.length === 11) && !phone.startsWith('55')) phone = `55${phone}`;
    if (!/^55\d{10,11}$/.test(phone)) return '';
    return phone;
  }

  function getTemplate(id) { return TEMPLATES.find(item => item.id === id) || null; }

  function fillTemplate(templateOrId, variables = {}) {
    const template = typeof templateOrId === 'string' ? getTemplate(templateOrId) : templateOrId;
    if (!template) throw new Error('Template não encontrado');
    const missing = [];
    const text = template.body.replace(/{{([a-z0-9_]+)}}/gi, (_, key) => {
      const value = String(variables[key] || '').trim();
      if (!value) missing.push(key);
      return value || `[${key}]`;
    });
    return { text, missing: [...new Set(missing)], template };
  }

  function buildLink(phone, message = '') {
    const normalized = normalizeBrazilianPhone(phone);
    if (!normalized) throw new Error('Telefone brasileiro inválido');
    return `https://wa.me/${normalized}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  }

  function createEmailDraft(input = {}) {
    return { recipient: input.recipient || '', subject: input.subject || '', body: input.body || '', templateId: input.templateId || '', companyId: input.companyId || '', contactId: input.contactId || '', opportunityId: input.opportunityId || '' };
  }

  return { TEMPLATES, normalizeBrazilianPhone, getTemplate, fillTemplate, buildLink, createEmailDraft };
}));
