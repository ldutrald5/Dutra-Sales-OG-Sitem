(function attachSalesExecutionController(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_EXECUTION_CONTROLLER = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesExecutionControllerModule(root) {
  'use strict';

  const ACTIVE_SESSION_KEY = 'og_sales_execution_active_session';

  function clean(value, max = 600) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function uniqueId(prefix) {
    const random = root?.crypto?.randomUUID ? root.crypto.randomUUID() : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
    return prefix + ':' + random;
  }

  function create(options = {}) {
    const state = options.state;
    const service = options.service || root.OG_SALES_EXECUTION;
    const ui = options.ui || root.OG_SALES_EXECUTION_UI;
    if (!state || !service || !ui) throw new Error('Sales Execution Controller exige state, service e UI.');

    const deps = {
      request: options.request,
      getLegacyQueue: options.getLegacyQueue || (() => []),
      saveLeads: options.saveLeads || (() => {}),
      saveOperations: options.saveOperations || (() => {}),
      showNotification: options.showNotification || (() => {}),
      openMessageComposer: options.openMessageComposer || (() => {}),
      openCallAI: options.openCallAI || (() => {}),
      renderProspecting: options.renderProspecting || (() => {}),
      setProspectingView: options.setProspectingView || (() => {}),
      openAppDialog: options.openAppDialog || ((node) => node?.classList?.remove('hidden')),
      closeAppDialog: options.closeAppDialog || ((node) => node?.remove()),
      bindAppDialog: options.bindAppDialog || (() => {}),
      operations: options.operations || (() => state.operations)
    };

    service.configure({ request: deps.request });

    function executionState() {
      state.salesExecution ||= {
        lists: [],
        loading: false,
        error: '',
        session: null,
        current: null,
        briefing: null,
        prepared: null,
        busy: false,
        pending: null
      };
      return state.salesExecution;
    }

    function legacyLead(current = executionState().current) {
      return service.legacyLeadForCurrent(state.leads, current);
    }

    function persistSessionId(session) {
      try {
        if (session?.id && session.status === 'ACTIVE') root.localStorage?.setItem(ACTIVE_SESSION_KEY, session.id);
        else root.localStorage?.removeItem(ACTIVE_SESSION_KEY);
      } catch (_) {}
    }

    function readSessionId() {
      try { return clean(root.localStorage?.getItem(ACTIVE_SESSION_KEY), 80); }
      catch { return ''; }
    }

    function applyPayload(payload) {
      const sx = executionState();
      sx.session = payload?.session || sx.session || null;
      sx.current = payload?.current || null;
      sx.briefing = payload?.briefing || null;
      sx.prepared = sx.current
        ? service.prepareMember(payload, legacyLead(payload.current), deps.operations())
        : null;
      sx.error = '';
      persistSessionId(sx.session);
      return sx;
    }

    function applyLegacy(payload, externalId, targetLead = null) {
      const projection = payload?.legacyProjection;
      const lead = targetLead || legacyLead();
      if (!lead || !projection) return false;
      const changed = service.applyLegacyProjection(lead, projection, {
        interactions: root.OG_INTERACTION_SERVICE,
        externalId,
        mode: executionState().prepared?.mode
      });
      if (changed) deps.saveLeads();
      return changed;
    }

    function feedback(message, mode = 'info') {
      const node = root.document?.querySelector('[data-sales-feedback]');
      if (node) {
        node.textContent = message;
        node.dataset.state = mode;
      }
    }

    function pendingId(key, prefix) {
      const sx = executionState();
      if (sx.pending?.key === key && sx.pending.externalId) return sx.pending.externalId;
      const externalId = uniqueId(prefix);
      sx.pending = { key, externalId };
      return externalId;
    }

    function clearPending(externalId) {
      const sx = executionState();
      if (sx.pending?.externalId === externalId) sx.pending = null;
    }

    async function loadLists(options = {}) {
      const sx = executionState();
      sx.loading = true;
      sx.error = '';
      if (options.render !== false) deps.renderProspecting();
      try {
        sx.lists = await service.getLists();
      } catch (error) {
        sx.error = error?.message || 'Sales Execution indisponível.';
        if (options.notify !== false) deps.showNotification(sx.error, 'warning');
      } finally {
        sx.loading = false;
        if (options.render !== false) deps.renderProspecting();
      }
      return sx.lists;
    }

    async function start(listId, targetCalls, button) {
      const sx = executionState();
      if (sx.busy) return;
      sx.busy = true;
      if (button) button.disabled = true;
      try {
        const day = new Date().toISOString().slice(0, 10);
        const payload = await service.startSession({
          listId,
          targetCalls,
          externalId: service.clientExternalId('dutra-session', listId + ':' + day)
        });
        applyPayload(payload);
        deps.setProspectingView('focus');
        deps.showNotification(payload.resumed ? 'Sessão retomada.' : 'Sessão iniciada.', 'success');
      } catch (error) {
        deps.showNotification(error?.message || 'Não foi possível iniciar a sessão.', 'warning');
      } finally {
        sx.busy = false;
        if (button?.isConnected) button.disabled = false;
      }
    }

    async function resume(sessionId, button) {
      const sx = executionState();
      if (sx.busy) return;
      sx.busy = true;
      if (button) button.disabled = true;
      try {
        const payload = await service.resumeSession(sessionId);
        applyPayload(payload);
        deps.setProspectingView('focus');
      } catch (error) {
        if (error?.status === 404 || error?.code === 'session_not_found') {
          persistSessionId(null);
        }
        deps.showNotification(error?.message || 'Não foi possível retomar a sessão.', 'warning');
      } finally {
        sx.busy = false;
        if (button?.isConnected) button.disabled = false;
      }
    }

    async function restore() {
      const sessionId = readSessionId();
      if (!sessionId) return false;
      try {
        const payload = await service.resumeSession(sessionId);
        if (payload?.session?.status === 'ACTIVE' && payload.current) {
          applyPayload(payload);
          state.prospecting.view = 'focus';
          return true;
        }
        persistSessionId(null);
      } catch (error) {
        if (error?.status !== 503) persistSessionId(null);
      }
      return false;
    }

    async function importPilot(input, button) {
      const sx = executionState();
      if (sx.busy) return;
      const queue = deps.getLegacyQueue().slice(0, Math.max(1, Math.min(200, Number(input.count) || 10)));
      if (!queue.length) return deps.showNotification('Não há prospects disponíveis para montar a lista.', 'info');
      sx.busy = true;
      if (button) button.disabled = true;
      try {
        const imported = await service.importList({
          name: input.name,
          source: 'DUTRA OS · fila local',
          sourceOwner: 'Lucas Dutra',
          externalId: service.clientExternalId('dutra-list', clean(input.name, 100) + ':' + new Date().toISOString().slice(0, 10)),
          leads: queue
        });
        if (imported.partial && imported.issues?.length) {
          deps.showNotification(imported.linked + ' contato(s) vinculados; ' + imported.issues.length + ' exigem revisão de identidade.', 'warning');
        } else {
          deps.showNotification(imported.linked + ' contato(s) vinculados à lista.', 'success');
        }
        await loadLists({ render: false, notify: false });
        deps.renderProspecting();
      } catch (error) {
        deps.showNotification(error?.message || 'Não foi possível criar a lista piloto.', 'warning');
      } finally {
        sx.busy = false;
        if (button?.isConnected) button.disabled = false;
      }
    }

    function telHref() {
      const sx = executionState();
      const lead = legacyLead();
      const phone = sx.current?.contact?.phone_e164 || lead?.telefone || '';
      const normalized = root.OG_WHATSAPP_SERVICE?.normalizeBrazilianPhone?.(phone) || '';
      return normalized ? '+' + normalized : '';
    }

    function whatsapp() {
      const lead = legacyLead();
      if (lead) return deps.openMessageComposer(lead, 'follow_up');
      const sx = executionState();
      const contact = sx.current?.contact;
      const phone = contact?.whatsapp_e164 || contact?.phone_e164 || '';
      try {
        const message = sx.prepared?.cta
          ? 'Olá' + (contact?.full_name ? ', ' + contact.full_name : '') + '! Aqui é o Lucas, da Olho de Gato. ' + sx.prepared.cta
          : 'Olá! Aqui é o Lucas, da Olho de Gato. Qual é o melhor horário para conversarmos rapidamente?';
        const url = root.OG_WHATSAPP_SERVICE.buildLink(phone, message);
        root.open(url, '_blank', 'noopener,noreferrer');
      } catch (error) {
        deps.showNotification('Telefone inválido para WhatsApp. Corrija o contato antes de continuar.', 'warning');
      }
    }

    function callAI() {
      const sx = executionState();
      const lead = legacyLead();
      if (!lead) return deps.showNotification('Este contato ainda não possui vínculo com o CRM legado necessário para abrir o Call AI.', 'warning');
      deps.openCallAI(lead, executionContext());
    }

    function executionContext() {
      const sx = executionState();
      return {
        company: sx.current?.company || null,
        contact: sx.current?.contact || null,
        opportunity: sx.current?.opportunity || null,
        listMember: sx.current?.member || null,
        session: sx.session || null,
        briefing: sx.prepared || sx.briefing || null,
        mode: sx.prepared?.mode || sx.briefing?.mode || null
      };
    }

    async function result(input, button) {
      const sx = executionState();
      if (sx.busy) return;
      if (!input.outcome) return feedback('Escolha o resultado antes de salvar.', 'warning');
      const memberId = sx.current?.member?.id;
      const leadBefore = legacyLead();
      if (!memberId || !sx.session?.id) return feedback('Sessão ou contato atual indisponível.', 'warning');
      const key = 'result:' + memberId + ':' + input.outcome;
      const externalId = pendingId(key, 'sales-result');
      sx.busy = true;
      if (button) button.disabled = true;
      feedback('Salvando resultado…', 'loading');
      try {
        const payload = await service.recordResult(sx.session.id, {
          memberId,
          outcome: input.outcome,
          notes: clean(input.notes, 2000),
          nextAction: clean(input.nextAction, 260),
          followUpAt: input.followUpAt || null,
          mode: sx.prepared?.mode || null,
          phone: sx.current?.contact?.phone_e164 || legacyLead()?.telefone || '',
          externalId
        });
        applyLegacy(payload, externalId, leadBefore);
        applyPayload(payload);
        clearPending(externalId);
        feedback(payload.duplicate ? 'Resultado já havia sido salvo. Estado restaurado.' : 'Resultado salvo ✓', 'success');
        deps.showNotification(payload.current ? 'Resultado salvo. Próximo passo carregado.' : 'Meta da sessão concluída.', 'success');
        deps.renderProspecting();
      } catch (error) {
        feedback(error?.message || 'Falha ao salvar. Você pode tentar novamente sem duplicar o resultado.', 'error');
      } finally {
        sx.busy = false;
        if (button?.isConnected) button.disabled = false;
      }
    }

    async function skip(button) {
      const sx = executionState();
      if (sx.busy || !sx.session?.id) return;
      sx.busy = true;
      if (button) button.disabled = true;
      try {
        const payload = await service.advance(sx.session.id, { action: 'SKIP' });
        applyPayload(payload);
        deps.renderProspecting();
      } catch (error) {
        deps.showNotification(error?.message || 'Não foi possível pular este contato.', 'warning');
      } finally {
        sx.busy = false;
        if (button?.isConnected) button.disabled = false;
      }
    }

    function mountDialog(html) {
      root.document.querySelector('.sales-execution-modal')?.remove();
      const holder = root.document.createElement('div');
      holder.innerHTML = html;
      const modal = holder.firstElementChild;
      root.document.body.appendChild(modal);
      deps.bindAppDialog(modal);
      modal.querySelectorAll('[data-sales-dialog-close]').forEach(button => button.addEventListener('click', () => {
        deps.closeAppDialog(modal, { restoreFocus: true });
        modal.remove();
      }));
      deps.openAppDialog(modal);
      return modal;
    }

    function decisionMaker() {
      const sx = executionState();
      if (!sx.current) return;
      const modal = mountDialog(ui.decisionMakerDialog(sx.current));
      const form = modal.querySelector('[data-sales-decision-form]');
      form?.addEventListener('submit', async event => {
        event.preventDefault();
        if (sx.busy) return;
        const data = new FormData(form);
        const name = clean(data.get('name'), 180);
        if (!name) return;
        const externalId = pendingId('decision:' + sx.current.member.id + ':' + name.toLowerCase(), 'sales-decision');
        sx.busy = true;
        const submit = form.querySelector('[type="submit"]');
        const status = form.querySelector('[data-sales-dialog-status]');
        submit.disabled = true;
        status.textContent = 'Salvando decisor…';
        try {
          const payload = await service.saveDecisionMaker(sx.session.id, {
            memberId: sx.current.member.id,
            name,
            roleTitle: data.get('roleTitle'),
            roleCategory: data.get('roleCategory'),
            phone: data.get('phone'),
            whatsapp: data.get('whatsapp'),
            email: data.get('email'),
            notes: data.get('notes'),
            externalId
          });
          applyLegacy(payload, externalId);
          applyPayload(payload);
          clearPending(externalId);
          status.textContent = 'Decisor salvo ✓';
          deps.showNotification('Decisor identificado e oportunidade atualizada.', 'success');
          setTimeout(() => { modal.remove(); deps.renderProspecting(); }, 350);
        } catch (error) {
          status.textContent = error?.message || 'Falha ao salvar decisor.';
        } finally {
          sx.busy = false;
          if (submit?.isConnected) submit.disabled = false;
        }
      });
    }

    function meeting() {
      const sx = executionState();
      if (!sx.current) return;
      const modal = mountDialog(ui.meetingDialog(sx.current));
      const form = modal.querySelector('[data-sales-meeting-form]');
      form?.addEventListener('submit', async event => {
        event.preventDefault();
        if (sx.busy) return;
        const data = new FormData(form);
        const scheduledAt = clean(data.get('scheduledAt'), 80);
        if (!scheduledAt) return;
        const externalId = pendingId('meeting:' + sx.current.member.id + ':' + scheduledAt, 'sales-meeting');
        sx.busy = true;
        const submit = form.querySelector('[type="submit"]');
        const status = form.querySelector('[data-sales-dialog-status]');
        submit.disabled = true;
        status.textContent = 'Marcando reunião…';
        try {
          const leadBefore = legacyLead();
          const payload = await service.scheduleMeeting(sx.session.id, {
            memberId: sx.current.member.id,
            scheduledAt,
            durationMinutes: Number(data.get('durationMinutes') || 30),
            mode: data.get('mode'),
            objective: data.get('objective'),
            notes: data.get('notes'),
            externalId
          });
          applyLegacy(payload, externalId, leadBefore);
          applyPayload(payload);
          clearPending(externalId);
          status.textContent = 'REUNIÃO MARCADA ✓';
          deps.showNotification('REUNIÃO MARCADA ✓ Próximo contato preparado.', 'success');
          setTimeout(() => { modal.remove(); deps.renderProspecting(); }, 500);
        } catch (error) {
          status.textContent = error?.message || 'Falha ao marcar reunião.';
        } finally {
          sx.busy = false;
          if (submit?.isConnected) submit.disabled = false;
        }
      });
    }

    async function recordCallAIResult(input = {}) {
      const sx = executionState();
      if (!sx.session?.id || !sx.current?.member?.id) throw new Error('Sessão Sales Execution indisponível.');
      if (!input.outcome) throw new Error('Escolha um resultado.');
      const externalId = clean(input.externalId, 180) || pendingId('call-ai:' + sx.current.member.id + ':' + input.outcome, 'sales-call-ai');
      const leadBefore = legacyLead();
      const payload = await service.recordResult(sx.session.id, {
        memberId: sx.current.member.id,
        contactId: sx.current.contact?.id || null,
        outcome: input.outcome,
        notes: input.notes,
        nextAction: input.nextAction,
        followUpAt: input.followUpAt || null,
        mode: sx.prepared?.mode || null,
        phone: sx.current.contact?.phone_e164 || legacyLead()?.telefone || '',
        externalId
      });
      applyLegacy(payload, externalId, leadBefore);
      applyPayload(payload);
      clearPending(externalId);
      return payload;
    }

    function render(rootNode) {
      const sx = executionState();
      if (state.prospecting.view === 'lists') {
        rootNode.innerHTML = ui.renderLists({
          lists: sx.lists,
          loading: sx.loading,
          error: sx.error,
          localQueueCount: deps.getLegacyQueue().length
        });
        ui.bindLists(rootNode, {
          retry: () => loadLists(),
          start,
          continue: resume,
          import: importPilot
        });
        if (!sx.loading && !sx.error && !sx.lists.length && !sx._listsRequested) {
          sx._listsRequested = true;
          loadLists();
        }
        return true;
      }
      if (state.prospecting.view === 'focus' && sx.session) {
        rootNode.innerHTML = ui.renderFocus({
          session: sx.session,
          current: sx.current,
          prepared: sx.prepared,
          legacyLead: legacyLead(),
          telHref: telHref()
        });
        ui.bindFocus(rootNode, {
          back: () => deps.setProspectingView('lists'),
          call: () => {},
          whatsapp,
          callAI,
          decisionMaker,
          meeting,
          result,
          skip
        });
        return true;
      }
      return false;
    }

    async function init() {
      executionState();
      await restore();
      if (state.prospecting.view === 'lists') await loadLists({ notify: false });
      deps.renderProspecting();
    }

    return Object.freeze({
      init,
      render,
      loadLists,
      start,
      resume,
      restore,
      importPilot,
      result,
      skip,
      decisionMaker,
      meeting,
      recordCallAIResult,
      legacyLead,
      executionContext,
      getState: executionState
    });
  }

  return Object.freeze({ create, ACTIVE_SESSION_KEY });
}));
