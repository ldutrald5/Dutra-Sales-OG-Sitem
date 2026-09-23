(function initCallUi(global) {
  const fields = [
    ['summary', 'Resumo comercial', 'textarea'],
    ['decisionMaker', 'Decisor', 'input'],
    ['fleetSize', 'Tamanho da frota', 'number'],
    ['pains', 'Dores', 'textarea'],
    ['objections', 'Objeções', 'textarea'],
    ['competitors', 'Concorrente / solução atual', 'textarea'],
    ['buyingSignals', 'Sinais de compra', 'textarea'],
    ['commitments', 'Compromissos', 'textarea'],
    ['valuesMentioned', 'Valores mencionados', 'textarea'],
    ['nextAction', 'Próxima ação', 'input'],
    ['followUpAt', 'Follow-up', 'datetime-local'],
    ['duration', 'Duração', 'input'],
    ['startedAt', 'Início da ligação', 'datetime-local']
  ];

  function escape(value) {
    return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function valueFor(call, key) {
    return Array.isArray(call[key]) ? call[key].join('\n') : call[key] || '';
  }

  function renderField(call, [key, label, type]) {
    const value = escape(valueFor(call, key));
    const attrs = type === 'textarea' ? `rows="2"` : `type="${type}"`;
    return `<div class="og-field${type === 'textarea' ? ' og-field-full' : ''}"><label for="call-${key}">${label}</label>${type === 'textarea'
      ? `<textarea id="call-${key}" ${attrs} class="call-ai-input">${value}</textarea>`
      : `<input id="call-${key}" ${attrs} value="${value}" class="call-ai-input">`}</div>`;
  }

  function readDraft(container, leadId) {
    const draft = { leadId, id: container.dataset.callId || `CALL-${Date.now()}` };
    fields.forEach(([key]) => {
      const element = container.querySelector(`#call-${key}`);
      draft[key] = element?.value?.trim() || '';
      if (['pains', 'objections', 'competitors', 'buyingSignals', 'commitments', 'valuesMentioned'].includes(key)) {
        draft[key] = draft[key].split(/\r?\n/).map(item => item.trim()).filter(Boolean);
      }
    });
    draft.transcript = container.querySelector('#call-transcript')?.value?.trim() || '';
    draft.status = container.querySelector('#call-status')?.value || 'reviewed';
    draft.analysisMode = container.dataset.analysisMode || 'manual';
    draft.createdAt = container.dataset.createdAt || new Date().toISOString();
    draft.updatedAt = new Date().toISOString();
    return draft;
  }

  function renderHistory(lead, onOpen) {
    const calls = Array.isArray(lead.calls) ? lead.calls : [];
    if (!calls.length) return '<div class="text-xs text-slate-500">Nenhuma ligação salva.</div>';
    return calls.slice().reverse().map(call => `<button type="button" class="call-ai-history-item" data-call-id="${escape(call.id)}">
      <span><b>${escape(call.summary || 'Ligação sem resumo')}</b><small>${escape(call.startedAt ? new Date(call.startedAt).toLocaleString('pt-BR') : 'Data não informada')}</small></span>
      <span>${escape(call.nextAction || 'Sem próxima ação')}</span>
    </button>`).join('');
  }

  function render(lead, host) {
    const root = document.getElementById('call-ai-panel');
    if (!root || !lead) return;
    const calls = Array.isArray(lead.calls) ? lead.calls : [];
    const call = host.draft || {
      leadId: lead.id,
      transcript: '',
      status: 'draft',
      analysisMode: 'manual',
      startedAt: new Date().toISOString().slice(0, 16)
    };
    root.innerHTML = `<section class="call-ai-panel-inner">
      <div class="flex items-start justify-between gap-3"><div><span class="og-kicker">DUTRA SALES AI · LIGHT</span><h3 class="font-bold text-sm text-slate-100 mt-1">Analisar ligação</h3></div><span class="call-ai-badge">Sem API paga</span></div>
      <p class="text-[11px] text-slate-400 mt-2">Cole uma transcrição ou anotação. O resultado é um rascunho heurístico e precisa de revisão humana.</p>
      <div class="og-field og-field-full mt-3"><label for="call-transcript">Transcrição / anotação</label><textarea id="call-transcript" rows="5" class="call-ai-input" placeholder="Cole aqui o que foi dito na ligação...">${escape(call.transcript || '')}</textarea></div>
      <div class="flex flex-wrap gap-2 mt-3"><button type="button" id="btn-analyze-call" class="px-3 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold">Analisar ligação</button><button type="button" id="btn-discard-call" class="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">Descartar</button></div>
      <div id="call-ai-draft" class="${host.draft ? '' : 'hidden'} mt-4 border-t border-slate-800 pt-4">
        <div class="flex items-center justify-between gap-2"><span class="og-kicker">RASCUNHO REVISÁVEL</span><select id="call-status" class="call-ai-input text-xs"><option value="reviewed" ${call.status === 'reviewed' ? 'selected' : ''}>Revisado</option><option value="completed" ${call.status === 'completed' ? 'selected' : ''}>Concluída</option><option value="follow-up" ${call.status === 'follow-up' ? 'selected' : ''}>Aguardando retorno</option></select></div>
        <div class="call-ai-fields mt-3">${fields.map(field => renderField(call, field)).join('')}</div>
        <p class="call-ai-note mt-3">${escape(call.heuristicNote || 'Todos os campos abaixo podem ser editados antes de salvar.')}</p>
        <button type="button" id="btn-save-call" class="w-full mt-3 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold">Salvar ligação revisada</button>
      </div>
      <div class="border-t border-slate-800 mt-5 pt-4"><span class="og-kicker">LIGAÇÕES</span><div id="call-ai-history" class="call-ai-history mt-2">${renderHistory(lead)}</div></div>
    </section>`;
    root.dataset.callId = call.id || '';
    root.dataset.createdAt = call.createdAt || '';
    root.dataset.analysisMode = call.analysisMode || 'manual';
    root.querySelector('#btn-analyze-call')?.addEventListener('click', () => {
      const transcript = root.querySelector('#call-transcript').value.trim();
      if (!transcript) return host.notify('Cole uma transcrição ou anotação antes de analisar.', 'info');
      const draft = new global.LocalHeuristicProvider().analyze({ transcript });
      draft.leadId = lead.id;
      draft.id = `CALL-${Date.now()}`;
      render(lead, { ...host, draft });
    });
    root.querySelector('#btn-discard-call')?.addEventListener('click', () => render(lead, { ...host, draft: null }));
    root.querySelector('#btn-save-call')?.addEventListener('click', () => host.save(readDraft(root, lead.id)));
    root.querySelectorAll('[data-call-id]').forEach(button => button.addEventListener('click', () => {
      const selected = calls.find(item => item.id === button.dataset.callId);
      if (selected) render(lead, { ...host, draft: selected });
    }));
  }

  global.OGCallUI = { render };
})(window);
