(function attachSalesExecutionUi(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_EXECUTION_UI = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesExecutionUi() {
  'use strict';

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function number(value) {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function listCard(list) {
    const derived = list.derived || {};
    const total = number(derived.total || list.total_count);
    const worked = number(derived.worked || list.worked_count);
    const remaining = number(derived.remaining || Math.max(0, total - worked));
    const active = list.activeSession || null;
    const meetings = number(active?.metrics?.meetingsBooked || list.meetings_count);
    const target = Math.max(1, Math.min(200, remaining || 1, 60));
    return '<article class="sales-execution-list-card" data-sales-list-card="' + escapeHtml(list.id) + '">' +
      '<div class="sales-execution-list-main"><span class="og-kicker">LISTA</span><h3>' + escapeHtml(list.name || 'Lista sem nome') + '</h3>' +
      '<p>' + escapeHtml(list.source || 'Origem não informada') + (list.source_owner ? ' · ' + escapeHtml(list.source_owner) : '') + '</p></div>' +
      '<div class="sales-execution-list-stats">' +
        '<span><small>Total</small><b>' + total + '</b></span>' +
        '<span><small>Trabalhados</small><b>' + worked + '</b></span>' +
        '<span><small>Restantes</small><b>' + remaining + '</b></span>' +
        '<span><small>Reuniões</small><b>' + meetings + '</b></span>' +
      '</div>' +
      (active
        ? '<div class="sales-execution-list-actions"><div><b>Sessão ativa</b><small>' + number(active.progress?.current) + ' / ' + number(active.progress?.target) + ' concluídos</small></div><button type="button" class="og-button og-button-primary" data-sales-continue="' + escapeHtml(active.id) + '">Continuar sessão →</button></div>'
        : '<div class="sales-execution-list-actions"><label>Meta da sessão<input type="number" min="1" max="' + Math.max(1, remaining) + '" value="' + target + '" data-sales-target="' + escapeHtml(list.id) + '"' + (remaining ? '' : ' disabled') + '></label><button type="button" class="og-button og-button-primary" data-sales-start="' + escapeHtml(list.id) + '"' + (remaining ? '' : ' disabled') + '>Iniciar ' + target + '</button></div>') +
    '</article>';
  }

  function renderLists(input = {}) {
    const lists = Array.isArray(input.lists) ? input.lists : [];
    if (input.loading) {
      return '<section class="clean-card sales-execution-loading" aria-busy="true"><span class="og-kicker">SALES EXECUTION</span><h2>Carregando listas…</h2><p>Preparando sessões e fila sem alterar seu CRM local.</p></section>';
    }
    if (input.error) {
      return '<section class="clean-card sales-execution-error"><span class="og-kicker">SALES EXECUTION</span><h2>Não foi possível carregar as listas</h2><p>' + escapeHtml(input.error) + '</p><button type="button" class="og-button og-button-secondary" data-sales-retry>Repetir</button></section>' +
        renderCreateList(input.localQueueCount || 0);
    }
    return '<section class="sales-execution-list-head clean-card"><div><span class="og-kicker">LISTAS · SESSÕES</span><h2>Escolha a lista e trabalhe em sequência.</h2><p>Meta, fila, briefing e Call AI ficam no mesmo fluxo. Nenhuma empresa é duplicada silenciosamente.</p></div><div><b>' + lists.length + '</b><small>lista(s) ativa(s)</small></div></section>' +
      (lists.length ? '<section class="sales-execution-list-grid">' + lists.map(listCard).join('') + '</section>' : '<section class="clean-card sales-execution-empty"><h2>Nenhuma lista Sales Execution ainda</h2><p>Você pode criar uma lista piloto usando prospects já existentes na fila local.</p></section>') +
      renderCreateList(input.localQueueCount || 0);
  }

  function renderCreateList(localQueueCount) {
    return '<section class="clean-card sales-execution-create"><div><span class="og-kicker">PILOTO CONTROLADO</span><h3>Criar lista a partir da fila local</h3><p>Canonicaliza somente os contatos selecionados para esta lista. Nada é migrado em massa.</p></div><div class="sales-execution-create-controls"><label>Nome<input data-sales-import-name value="Piloto Sales Execution"></label><label>Contatos<input data-sales-import-count type="number" min="1" max="200" value="' + Math.max(1, Math.min(10, number(localQueueCount) || 10)) + '"></label><button type="button" class="og-button og-button-secondary" data-sales-import' + (localQueueCount ? '' : ' disabled') + '>Criar lista piloto</button></div><small>' + number(localQueueCount) + ' prospect(s) disponíveis na fila local atual.</small></section>';
  }

  function bindLists(root, handlers = {}) {
    root.querySelector('[data-sales-retry]')?.addEventListener('click', () => handlers.retry?.());
    root.querySelectorAll('[data-sales-start]').forEach(button => button.addEventListener('click', () => {
      const listId = button.dataset.salesStart;
      const target = root.querySelector('[data-sales-target="' + CSS.escape(listId) + '"]');
      handlers.start?.(listId, Math.max(1, Number(target?.value || 1)), button);
    }));
    root.querySelectorAll('[data-sales-target]').forEach(input => input.addEventListener('input', () => {
      const button = root.querySelector('[data-sales-start="' + CSS.escape(input.dataset.salesTarget) + '"]');
      if (button) button.textContent = 'Iniciar ' + Math.max(1, Number(input.value || 1));
    }));
    root.querySelectorAll('[data-sales-continue]').forEach(button => button.addEventListener('click', () => handlers.continue?.(button.dataset.salesContinue, button)));
    root.querySelector('[data-sales-import]')?.addEventListener('click', event => {
      handlers.import?.({
        name: root.querySelector('[data-sales-import-name]')?.value || 'Piloto Sales Execution',
        count: Math.max(1, Math.min(200, Number(root.querySelector('[data-sales-import-count]')?.value || 10)))
      }, event.currentTarget);
    });
  }

  function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('55') && digits.length >= 12) return '+' + digits;
    return value || 'Telefone não informado';
  }

  function sessionMetric(label, value) {
    return '<span><small>' + escapeHtml(label) + '</small><b>' + number(value) + '</b></span>';
  }

  function briefingBlock(prepared = {}) {
    const questions = Array.isArray(prepared.questions) ? prepared.questions : [];
    return '<section class="sales-execution-briefing">' +
      '<header><div><span class="og-kicker">BRIEFING · ' + escapeHtml(prepared.mode || 'CONTEXTO') + '</span><h3>' + escapeHtml(prepared.objective || 'Conduzir a conversa e sair com próximo passo.') + '</h3></div><small data-state="' + escapeHtml(prepared.status || 'MISSING') + '">' + escapeHtml(prepared.status || 'contexto local') + '</small></header>' +
      (prepared.context ? '<p class="sales-execution-context">' + escapeHtml(prepared.context) + '</p>' : '') +
      '<div class="sales-execution-brief-grid">' +
        '<div><b>ABERTURA</b><p>' + escapeHtml(prepared.opening || '') + '</p></div>' +
        '<div><b>PERGUNTAS</b><ol>' + questions.slice(0,4).map(item => '<li>' + escapeHtml(item) + '</li>').join('') + '</ol></div>' +
        '<div><b>GANCHO</b><p>' + escapeHtml(prepared.hook || '') + '</p></div>' +
        '<div class="sales-execution-cta"><b>CTA</b><p>' + escapeHtml(prepared.cta || '') + '</p></div>' +
      '</div>' +
    '</section>';
  }

  function outcomeOptions() {
    const labels = {
      NO_ANSWER:'Não atendeu',
      INVALID_NUMBER:'Número inválido',
      GATEKEEPER:'Falei com gatekeeper',
      DECISION_MAKER_IDENTIFIED:'Decisor identificado',
      DECISION_MAKER_REACHED:'Falei com decisor',
      RETURN_LATER:'Retornar depois',
      QUALIFIED:'Oportunidade qualificada',
      MEETING_BOOKED:'Reunião marcada',
      SEND_MATERIAL:'Enviar material',
      PROPOSAL:'Pediu proposta',
      NOT_INTERESTED:'Sem interesse'
    };
    return '<option value="">Escolha o resultado…</option>' + Object.keys(labels).map(key => '<option value="' + key + '">' + labels[key] + '</option>').join('');
  }

  function renderFocus(input = {}) {
    const session = input.session || {};
    const current = input.current || null;
    if (!current) {
      return '<section class="clean-card prospect-finished sales-execution-finished"><span class="og-kicker">SESSÃO</span><h2>' + (session.status === 'COMPLETED' ? 'Meta concluída ✓' : 'Nenhum contato atual') + '</h2><p>A sessão pode ser revisada na lista sem perder os dados registrados.</p><button type="button" class="og-button og-button-primary" data-sales-back-lists>Voltar às listas</button></section>';
    }
    const company = current.company || {};
    const contact = current.contact || {};
    const opportunity = current.opportunity || {};
    const metrics = session.metrics || {};
    const progress = session.progress || {};
    const target = Math.max(1, number(progress.target || session.target_calls));
    const completed = number(progress.current);
    const percent = Math.max(0, Math.min(100, Math.round((completed / target) * 100)));
    const qualified = opportunity.pipeline_stage === 'QUALIFIED';
    const phone = contact.phone_e164 || input.legacyLead?.telefone || '';
    return '<section class="sales-execution-session-header clean-card">' +
      '<div class="sales-execution-progress-copy"><span class="og-kicker">SESSÃO ATIVA</span><strong>' + Math.min(completed + 1, target) + ' / ' + target + '</strong><div class="sales-execution-progress"><i style="width:' + percent + '%"></i></div><small>' + number(progress.remaining) + ' contato(s) da meta restantes</small></div>' +
      '<div class="sales-execution-session-metrics">' +
        sessionMetric('Reuniões', metrics.meetingsBooked) +
        sessionMetric('Decisores', metrics.decisionMakersReached) +
        sessionMetric('Qualificados', metrics.qualifiedOpportunities) +
        sessionMetric('Ligações', metrics.attemptedCalls) +
      '</div></section>' +
      '<section class="clean-card sales-execution-account">' +
        '<header><div><span class="og-kicker">CONTA ATUAL</span><h1>' + escapeHtml(company.name || input.legacyLead?.empresa || 'Empresa') + '</h1><p>' + escapeHtml([company.city, company.state].filter(Boolean).join(' - ') || input.legacyLead?.cidadeUf || 'Local não informado') + '</p></div><span class="sales-execution-stage">' + escapeHtml(opportunity.pipeline_stage || 'PROSPECT') + '</span></header>' +
        '<div class="sales-execution-account-grid">' +
          '<span><small>Telefone</small><b>' + escapeHtml(formatPhone(phone)) + '</b></span>' +
          '<span><small>Segmento</small><b>' + escapeHtml(company.sector || input.legacyLead?.segmentId || 'Não informado') + '</b></span>' +
          '<span><small>Contato</small><b>' + escapeHtml(contact.full_name || input.legacyLead?.nome || 'Não informado') + '</b></span>' +
          '<span><small>Cargo</small><b>' + escapeHtml(contact.role_title || input.legacyLead?.cargo || contact.role_category || 'Não informado') + '</b></span>' +
          '<span><small>Relacionamento</small><b>' + escapeHtml(opportunity.relationship_status || company.relationship_status || 'UNKNOWN') + '</b></span>' +
        '</div>' +
      '</section>' +
      briefingBlock(input.prepared || {}) +
      '<section class="clean-card sales-execution-actions">' +
        '<div class="sales-execution-primary-actions">' +
          '<a data-sales-call href="tel:' + escapeHtml(input.telHref || '') + '" class="og-button og-button-primary">📞 Ligar</a>' +
          '<button type="button" data-sales-whatsapp>💬 WhatsApp</button>' +
          '<button type="button" data-sales-call-ai>🎧 Call AI</button>' +
          '<button type="button" data-sales-decision>👤 Decisor</button>' +
          '<button type="button" data-sales-meeting class="' + (qualified ? 'og-button og-button-primary' : '') + '">📅 Marcar reunião</button>' +
        '</div>' +
        '<div class="sales-execution-result-form"><label>Resultado<select data-sales-outcome>' + outcomeOptions() + '</select></label><label>Nota rápida<textarea rows="3" data-sales-note placeholder="O que aconteceu e o que ficou combinado?"></textarea></label><label>Próxima ação<input data-sales-next-action placeholder="Ex.: ligar para Marcos"></label><label>Retorno<input data-sales-follow-up type="datetime-local"></label></div>' +
        '<div class="sales-execution-result-actions"><button type="button" data-sales-skip>Pular</button><button type="button" class="og-button og-button-primary" data-sales-save-result>Salvar resultado</button></div>' +
        '<div data-sales-feedback class="sales-execution-feedback" role="status" aria-live="polite"></div>' +
      '</section>';
  }

  function bindFocus(root, handlers = {}) {
    root.querySelector('[data-sales-back-lists]')?.addEventListener('click', () => handlers.back?.());
    root.querySelector('[data-sales-call]')?.addEventListener('click', () => handlers.call?.());
    root.querySelector('[data-sales-whatsapp]')?.addEventListener('click', () => handlers.whatsapp?.());
    root.querySelector('[data-sales-call-ai]')?.addEventListener('click', () => handlers.callAI?.());
    root.querySelector('[data-sales-decision]')?.addEventListener('click', () => handlers.decisionMaker?.());
    root.querySelector('[data-sales-meeting]')?.addEventListener('click', () => handlers.meeting?.());
    root.querySelector('[data-sales-skip]')?.addEventListener('click', event => handlers.skip?.(event.currentTarget));
    root.querySelector('[data-sales-save-result]')?.addEventListener('click', event => handlers.result?.({
      outcome: root.querySelector('[data-sales-outcome]')?.value || '',
      notes: root.querySelector('[data-sales-note]')?.value || '',
      nextAction: root.querySelector('[data-sales-next-action]')?.value || '',
      followUpAt: root.querySelector('[data-sales-follow-up]')?.value || ''
    }, event.currentTarget));
  }

  function decisionMakerDialog(current = {}) {
    const company = current.company || {};
    return '<div class="app-modal-overlay sales-execution-modal" role="dialog" aria-modal="true" aria-labelledby="sales-decision-title" tabindex="-1"><section class="app-modal clean-card"><header><div><span class="og-kicker">DECISOR</span><h2 id="sales-decision-title">Registrar decisor · ' + escapeHtml(company.name || '') + '</h2></div><button type="button" data-sales-dialog-close aria-label="Fechar">✕</button></header><form data-sales-decision-form><div class="sales-execution-form-grid"><label>Nome *<input required name="name"></label><label>Cargo<input name="roleTitle"></label><label>Categoria<select name="roleCategory"><option>FLEET_MANAGER</option><option>MAINTENANCE_MANAGER</option><option>PROCUREMENT</option><option>DIRECTOR</option><option>OWNER</option><option>OPERATIONAL</option><option>UNKNOWN</option></select></label><label>Telefone<input name="phone"></label><label>WhatsApp<input name="whatsapp"></label><label>E-mail<input type="email" name="email"></label><label class="full">Observação<textarea name="notes" rows="3"></textarea></label></div><footer><button type="button" data-sales-dialog-close>Cancelar</button><button type="submit" class="og-button og-button-primary">Salvar decisor</button></footer><div data-sales-dialog-status role="status" aria-live="polite"></div></form></section></div>';
  }

  function meetingDialog(current = {}) {
    const company = current.company || {};
    const contact = current.contact || {};
    return '<div class="app-modal-overlay sales-execution-modal" role="dialog" aria-modal="true" aria-labelledby="sales-meeting-title" tabindex="-1"><section class="app-modal clean-card"><header><div><span class="og-kicker">MEETING MODE</span><h2 id="sales-meeting-title">Marcar reunião</h2></div><button type="button" data-sales-dialog-close aria-label="Fechar">✕</button></header><form data-sales-meeting-form><div class="sales-execution-meeting-context"><b>' + escapeHtml(company.name || '') + '</b><span>' + escapeHtml(contact.full_name || 'Contato não informado') + '</span></div><div class="sales-execution-form-grid"><label>Data e hora *<input required type="datetime-local" name="scheduledAt"></label><label>Duração<select name="durationMinutes"><option value="20">20 min</option><option value="30" selected>30 min</option><option value="45">45 min</option><option value="60">60 min</option></select></label><label>Modo<select name="mode"><option value="ONLINE">Online</option><option value="PRESENCIAL">Presencial</option><option value="PHONE">Telefone</option></select></label><label class="full">Objetivo<input name="objective" value="Validar frota, aplicação, investimento e próximo passo."></label><label class="full">Observações<textarea name="notes" rows="3"></textarea></label></div><footer><button type="button" data-sales-dialog-close>Cancelar</button><button type="submit" class="og-button og-button-primary">Marcar reunião</button></footer><div data-sales-dialog-status role="status" aria-live="polite"></div></form></section></div>';
  }

  return Object.freeze({
    renderLists,
    bindLists,
    renderFocus,
    bindFocus,
    decisionMakerDialog,
    meetingDialog,
    outcomeOptions
  });
}));
