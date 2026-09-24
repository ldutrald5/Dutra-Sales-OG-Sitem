(function attachUiComponents(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_UI_COMPONENTS = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createUiComponents() {
  'use strict';
  function escape(value) { return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]); }
  function clientRow(lead, options = {}) {
    const selected = String(lead.id) === String(options.selectedId || '');
    const last = options.lastInteraction;
    return `<article class="sales-desk-row${selected ? ' selected' : ''}" data-desk-lead="${escape(lead.id)}"><button type="button" class="sales-desk-select" data-desk-select="${escape(lead.id)}"><span><b>${escape(lead.empresa || lead.nome || 'Cliente sem nome')}</b><small>${escape(lead.nome || 'Contato não informado')} · ${escape(lead.status || 'novo')}</small></span><span><strong>${escape(lead.nextAction || 'Definir próximo passo')}</strong><small>${escape(last?.note || 'Sem interação registrada')}</small></span><time>${escape(options.followUpLabel || 'Sem data')}</time></button><button type="button" class="sales-desk-whatsapp" data-desk-whatsapp="${escape(lead.id)}" aria-label="Abrir WhatsApp de ${escape(lead.empresa || lead.nome)}">WhatsApp</button></article>`;
  }
  function timeline(items) {
    if (!items?.length) return '<div class="sales-desk-empty">Nenhuma interação registrada.</div>';
    return items.slice().reverse().slice(0, 6).map(item => `<article class="sales-desk-timeline-item"><time>${escape(new Date(item.at).toLocaleString('pt-BR'))}</time><b>${escape(item.result || item.type || 'registro')}</b><p>${escape(item.note || '')}</p></article>`).join('');
  }
  return { escape, clientRow, timeline };
}));
