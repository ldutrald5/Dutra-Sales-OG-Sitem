/* Presentation adapter. Technical mappings remain in the existing application engine. */
(function attach(scope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  scope.OG_TECHNICAL_WORKSPACE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function factory() {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const signature = draft => JSON.stringify(draft);

  function view(draft, data, build) {
    const rule = data?.vehicleConsultantRules?.find(item => item.id === draft.selectedVehicleId);
    const issues = [];
    if (!rule) issues.push('Escolha uma configuração coberta pelo motor.');
    const questions = (rule?.questions || []).filter(question => !question.showIf || Object.entries(question.showIf).every(([key, value]) => draft.answers?.[key] === value));
    for (const question of questions) {
      if (!question.options.some(option => option.value === draft.answers?.[question.id])) issues.push(question.question);
    }
    if (![110,115,120].includes(Number(draft.libras))) issues.push('Confirme a libragem disponível para esta aplicação.');
    if (typeof draft.includeDianteira !== 'boolean') issues.push('Confirme se a dianteira está incluída.');
    if (!Number.isInteger(Number(draft.qty)) || Number(draft.qty) < 1 || Number(draft.qty) > 999) issues.push('Informe uma quantidade de veículos inteira, entre 1 e 999.');
    if (issues.length) return { state: rule ? 'validate' : 'empty', rule, questions, issues, items: [], baseItems: [], resolution: null, ready: false };
    try {
      const calculated = build(rule.id, draft.answers || {}, Number(draft.libras), Boolean(draft.includeDianteira));
      const baseItems = calculated.resultList;
      const items = draft.manualItems === null || draft.manualItems === undefined ? baseItems : draft.manualItems;
      if (!Array.isArray(items) || !items.length || items.some(item => !data.catalog.some(part => part.code === item.code) || !Number.isInteger(Number(item.qty)) || Number(item.qty) < 1)) {
        return { state:'validate', rule, questions, issues:['Peças ou quantidades não determinadas. Revise a composição.'], items:[], baseItems, resolution:calculated.resolution, ready:false };
      }
      const manual = Array.isArray(draft.manualItems);
      return { state:manual ? 'manual' : 'result', rule, questions, issues:manual && !draft.manualConfirmed ? ['Confirme a revisão dos ajustes manuais antes de continuar.'] : [], items, baseItems, resolution:calculated.resolution, ready:!manual || draft.manualConfirmed === true };
    } catch {
      return { state:'error', rule, questions, issues:['O cálculo não foi concluído. Nenhuma peça foi determinada.'], items:[], baseItems:[], resolution:null, ready:false };
    }
  }

  function create(hooks) {
    const root = document.getElementById('technical-workspace');
    if (!root) return null;
    let busy = false;
    let dirty = false;
    let mounted = false;
    let lastSavedId = '';
    const get = id => root.querySelector(`#${id}`);
    const data = () => hooks.data();
    const draft = () => hooks.draft();
    const current = () => view(draft(), data(), hooks.build);
    const targetValid = value => !hooks.validateDraft || hooks.validateDraft(value) !== false;
    const feedback = (message, error = false) => {
      const node = get('technical-feedback');
      node.textContent = message;
      node.dataset.state = error ? 'error' : 'info';
    };
    const ownerValid = () => !draft().leadId || hooks.leads().some(lead => String(lead.id) === String(draft().leadId));
    const captured = node => {
      const token = signature(draft());
      return () => !busy && node.isConnected && root.contains(node) && token === signature(draft()) && ownerValid();
    };
    function change(mutate) {
      if (busy) return;
      mutate(draft());
      if (Array.isArray(draft().manualItems)) draft().manualConfirmed = false;
      dirty = true;
      render();
    }
    function chooseVehicle(id) {
      if (busy || !data()?.vehicleConsultantRules?.some(rule => rule.id === id)) return;
      if (Array.isArray(draft().manualItems) && !window.confirm('Trocar o veículo inicia outra aplicação. Os ajustes atuais permanecem no último rascunho salvo. Continuar?')) return render();
      change(item => { item.selectedVehicleId = id; item.answers = {}; item.targetVehicleName = data().vehicleConsultantRules.find(rule => rule.id === id).name; item.manualItems = null; item.manualConfirmed = false; });
    }
    function editItems(mutate) {
      const computed = current();
      if (!computed.baseItems.length || !ownerValid()) return;
      const existing = Array.isArray(draft().manualItems) ? draft().manualItems : computed.items;
      change(item => { item.manualItems = copy(existing); mutate(item.manualItems); });
    }
    async function save(handoff) {
      if (busy || !ownerValid()) return feedback('O cliente não está disponível no CRM. Revise o vínculo.', true);
      try {
        if (!targetValid(draft())) return feedback('Este veículo foi alterado ou removido. Reabra a aplicação na cotação.', true);
      } catch (error) {
        return feedback(error.message || 'Revise o veículo de origem antes de salvar.', true);
      }
      const computed = current();
      if (handoff && !computed.ready) return feedback('VALIDAR: revise os dados antes de continuar.', true);
      const savedDraft = copy(draft());
      const token = signature(draft());
      busy = true;
      render();
      feedback('Salvando no armazenamento local…');
      try {
        const record = await hooks.save(savedDraft, computed, handoff);
        if (signature(draft()) !== token || !ownerValid() || !targetValid(savedDraft)) return feedback('Rascunho salvo no contexto original. O veículo ou cliente mudou; reabra a aplicação antes de continuar.', true);
        lastSavedId = record.id;
        dirty = false;
        feedback(navigator.onLine ? `${savedDraft.editingVehicleId ? 'Revisão do veículo salva' : 'Rascunho salvo'} neste aparelho. A confirmação remota aparece no status global.` : 'Salvo neste aparelho, offline. Sincronização pendente no fluxo atual.');
        if (handoff && !root.closest('.hidden')) await hooks.openQuote(record);
      } catch (error) {
        feedback(error.message || 'Não foi possível salvar. Os dados desta tela continuam disponíveis.', true);
      } finally {
        busy = false;
        render();
      }
    }
    function restore(options = {}) {
      if (busy || dirty) return;
      const records = hooks.records().filter(record => record.source === 'technical_workspace' && record.status === 'technical_draft' && record.technicalContext);
      const record = options.initial
        ? records.sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]
        : Object.hasOwn(options, 'selectedClient')
          ? records.filter(item => String(item.clientId || '') === String(options.selectedClient)).sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0]
          : records.filter(item => String(item.clientId || '') === String(draft().leadId || '') && item.id === lastSavedId)[0];
      if (!record || (record.clientId && !hooks.leads().some(lead => String(lead.id) === String(record.clientId)))) return;
      if (record.technicalContext.id !== record.id || String(record.technicalContext.leadId || '') !== String(record.clientId || '')) return;
      hooks.replaceDraft(copy(record.technicalContext));
      lastSavedId = record.id;
      const lead = hooks.leads().find(item => String(item.id) === String(record.clientId));
      feedback(`Rascunho salvo recuperado · ${lead?.empresa || lead?.nome || 'sem cliente vinculado'} · ${record.technicalContext.targetVehicleName || 'configuração a confirmar'}. Alterações posteriores precisam ser salvas.`);
    }
    function bind() {
      if (mounted) return;
      mounted = true;
      get('technical-client').addEventListener('change', event => {
        if (busy) return render();
        if (dirty && !window.confirm('Trocar o cliente inicia outro contexto. Salve o rascunho atual para recuperá-lo depois. Continuar?')) return render();
        const id = event.target.value;
        if (id && !hooks.leads().some(lead => String(lead.id) === id)) return render();
        hooks.replaceDraft(hooks.empty(id));
        dirty = false;
        lastSavedId = '';
        restore({selectedClient:id});
        if (!lastSavedId) dirty = true;
        render();
      });
      get('technical-vehicle').addEventListener('change', event => chooseVehicle(event.target.value));
      get('technical-name').addEventListener('change', event => change(item => { item.targetVehicleName = event.target.value.trim(); }));
      get('technical-qty').addEventListener('change', event => change(item => { item.qty = Number(event.target.value); }));
      get('consultant-libras-select').addEventListener('change', event => change(item => { item.libras = Number(event.target.value); }));
      get('consultant-include-dianteira').addEventListener('change', event => change(item => { item.includeDianteira = event.target.checked; }));
      get('technical-notes').addEventListener('change', event => change(item => { item.notes = event.target.value; }));
      get('technical-confirm-manual').addEventListener('change', event => {
        if (busy) return;
        draft().manualConfirmed = event.target.checked;
        dirty = true;
        render();
      });
      get('technical-reset-manual').addEventListener('click', () => {
        if (busy || !Array.isArray(draft().manualItems)) return;
        if (!window.confirm('Substituir os ajustes manuais pelo cálculo do motor para a configuração atual?')) return;
        change(item => { item.manualItems = null; item.manualConfirmed = false; });
      });
      get('technical-add-item').addEventListener('click', () => {
        const code = get('technical-add-code').value;
        const qty = Number(get('technical-add-qty').value);
        if (!data().catalog.some(item => item.code === code) || !Number.isInteger(qty) || qty < 1) return feedback('Escolha uma peça do catálogo e uma quantidade inteira positiva.', true);
        editItems(items => { const found = items.find(item => item.code === code); if (found) found.qty += qty; else items.push({code,qty,customPrice:null}); });
      });
      get('technical-save-draft').addEventListener('click', () => void save(false));
      get('btn-inject-consultant-to-quote').addEventListener('click', () => void save(true));
    }
    function render() {
      const item = draft();
      const computed = current();
      root.dataset.state = computed.state;
      root.dataset.leadId = item.leadId || '';
      root.dataset.vehicleId = item.selectedVehicleId || '';
      root.dataset.editingVehicleId = item.editingVehicleId || '';
      get('technical-title').textContent = item.editingVehicleId ? 'Revisar veículo da cotação' : 'Adicionar veículo à cotação';
      get('btn-inject-consultant-to-quote').textContent = item.editingVehicleId ? 'Atualizar veículo na cotação' : 'Adicionar à cotação';
      get('technical-client').innerHTML = `<option value="">Sem cliente vinculado</option>${hooks.leads().map(lead => `<option value="${escape(lead.id)}">${escape(lead.empresa || lead.nome || lead.id)}</option>`).join('')}`;
      get('technical-client').value = item.leadId || '';
      const quoteClient = hooks.quoteClient?.();
      const quoteName = quoteClient?.empresa || quoteClient?.nome;
      get('technical-client-context').textContent = item.leadId
        ? 'Vínculo com o cadastro canônico do CRM. O rascunho técnico não registra uma venda ou envio.'
        : quoteName ? `Sem vínculo ao CRM. Cotação atual: ${quoteName}. Continuar usa este contexto manual, sem criar cadastro.`
          : 'Sem cliente vinculado. Trabalhar nesta tela não cria outro cadastro.';
      get('technical-vehicle').innerHTML = `<option value="">Escolha a configuração</option>${(data()?.vehicleConsultantRules || []).map(rule => `<option value="${escape(rule.id)}">${escape(rule.name)}</option>`).join('')}`;
      get('technical-vehicle').value = item.selectedVehicleId || '';
      get('technical-name').value = item.targetVehicleName || '';
      get('technical-qty').value = item.qty;
      get('consultant-libras-select').value = item.libras || '';
      get('consultant-include-dianteira').checked = Boolean(item.includeDianteira);
      get('technical-notes').value = item.notes || '';
      get('technical-state').dataset.state = computed.state;
      get('technical-state').innerHTML = `<strong>${busy ? 'Salvando…' : {empty:'Escolha o veículo',validate:'VALIDAR',error:'Cálculo indisponível',result:'Resultado do motor',manual:'Edição manual · VALIDAR'}[computed.state]}</strong><span>${escape(computed.issues.join(' ') || 'Regra operacional do software. Confirme a aplicação com a fonte OG antes do uso técnico.')}</span>`;
      get('consultant-questions-container').innerHTML = computed.questions.map(question => `<fieldset><legend>${escape(question.question)}</legend><div class="technical-options">${question.options.map(option => `<button type="button" data-qid="${escape(question.id)}" data-val="${escape(option.value)}" aria-pressed="${item.answers[question.id] === option.value}">${escape(option.label)}</button>`).join('')}</div></fieldset>`).join('') || '<p class="technical-empty">Selecione uma configuração para ver as perguntas necessárias. Não há aplicação calculada ainda.</p>';
      get('consultant-questions-container').querySelectorAll('[data-qid]').forEach(button => {
        const valid = captured(button);
        button.addEventListener('click', () => { if (valid()) change(value => { value.answers[button.dataset.qid] = button.dataset.val; }); });
      });
      const resolution = computed.resolution;
      get('technical-axles').textContent = resolution ? Object.entries(resolution.axlesCount).map(([position,qty]) => `${position}: ${qty}`).join(' · ') : 'Eixos não determinados';
      get('consultant-resolution-container').innerHTML = computed.items.map((part,index) => `<article data-technical-item data-code="${escape(part.code)}" data-qty="${Number(part.qty)}"><div><span class="technical-code">${escape(part.code)}</span><strong>${escape(data().catalog.find(row => row.code === part.code)?.name || part.code)}</strong><small>${Array.isArray(item.manualItems) ? 'Composição revisada manualmente' : 'Calculado pelo motor atual'} · ${Number(part.qty)} por veículo · ${Number(part.qty) * Number(item.qty)} no total</small></div><div class="technical-item-actions"><label>Peça<select data-technical-code data-index="${index}" aria-label="Substituir ${escape(part.code)}">${data().catalog.map(row => `<option value="${escape(row.code)}" ${row.code === part.code ? 'selected' : ''}>${escape(row.code)} · ${escape(row.name)}</option>`).join('')}</select></label><label>Por veículo<input data-technical-qty data-index="${index}" aria-label="Quantidade ${escape(part.code)}" type="number" min="1" step="1" value="${Number(part.qty)}"></label><button type="button" data-technical-remove data-index="${index}" aria-label="Remover ${escape(part.code)}">Remover</button></div></article>`).join('') || '<p class="technical-empty">Nenhuma peça determinada. Complete ou corrija a configuração; o sistema não inventa itens.</p>';
      get('consultant-resolution-container').querySelectorAll('[data-technical-code],[data-technical-qty],[data-technical-remove]').forEach(control => {
        const valid = captured(control);
        control.addEventListener(control.hasAttribute('data-technical-remove') ? 'click' : 'change', () => {
          if (!valid()) return;
          editItems(items => {
            const index = Number(control.dataset.index);
            if (control.hasAttribute('data-technical-remove')) items.splice(index,1);
            else if (control.hasAttribute('data-technical-code')) items[index].code = control.value;
            else {
              const quantity = Number(control.value);
              if (!Number.isInteger(quantity) || quantity < 1) return feedback('A quantidade da peça deve ser um inteiro positivo. O valor anterior foi preservado.', true);
              items[index].qty = quantity;
            }
          });
        });
      });
      get('technical-add-code').innerHTML = `<option value="">Escolha uma peça</option>${(data()?.catalog || []).map(part => `<option value="${escape(part.code)}">${escape(part.code)} · ${escape(part.name)}</option>`).join('')}`;
      const manual = Array.isArray(item.manualItems);
      get('technical-manual-review').hidden = !manual;
      get('technical-confirm-manual').checked = item.manualConfirmed === true;
      get('technical-reset-manual').disabled = busy || !manual;
      get('technical-add-item').disabled = busy || !computed.baseItems.length;
      get('btn-inject-consultant-to-quote').disabled = busy || !computed.ready || !ownerValid();
      root.querySelectorAll('input,select,textarea,#technical-save-draft').forEach(control => { control.disabled = busy; });
      root.querySelectorAll('[data-qid],[data-technical-remove]').forEach(control => { control.disabled = busy; });
      root.dataset.busy = String(busy);
    }
    bind();
    restore({initial:true});
    render();
    return Object.freeze({render, chooseVehicle, start(value) {
      if (busy || !value || typeof value !== 'object') return false;
      if (dirty && !window.confirm('O rascunho atual tem alterações não salvas. Abrir outra aplicação?')) return false;
      hooks.replaceDraft(copy(value));
      dirty = true;
      lastSavedId = '';
      render();
      feedback(value.editingVehicleId ? 'Editando este veículo da cotação. Revise os ajustes antes de atualizar.' : 'Nova aplicação. Configure e revise as peças antes de adicionar à cotação.');
      return true;
    }, refresh() {
      restore(!lastSavedId && !draft().leadId && !draft().selectedVehicleId ? {initial:true} : {});
      render();
    }, isBusy() { return busy; }});
  }
  return Object.freeze({create,view});
}));
