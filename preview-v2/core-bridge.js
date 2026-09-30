(() => {
  'use strict';

  const STORAGE_KEY = 'dutra_v3_access_pin';
  const state = {
    snapshot: null,
    leads: [],
    selectedLeadId: null,
    pin: sessionStorage.getItem(STORAGE_KEY) || ''
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clean = value => String(value ?? '').trim();
  const formatMoney = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const normalize = lead => globalThis.OG_CRM_SERVICE?.normalizeLead ? globalThis.OG_CRM_SERVICE.normalizeLead(lead) : lead;

  function toast(message) {
    if (typeof globalThis.showToast === 'function') return globalThis.showToast(message);
    console.log('[DUTRA V3]', message);
  }

  function authHeaders(extra = {}) {
    const headers = { ...extra };
    if (state.pin) headers.authorization = `Bearer ${state.pin}`;
    return headers;
  }

  async function api(path, options = {}) {
    const response = await fetch('/core-api' + path, {
      ...options,
      headers: authHeaders(options.headers || {}),
      cache: 'no-store'
    });
    if (response.status === 401) {
      showLogin('Informe o mesmo código de acesso usado no DUTRA OS.');
      throw new Error('unauthorized');
    }
    const type = response.headers.get('content-type') || '';
    const body = type.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      const error = new Error(body?.message || body?.error || `Erro ${response.status}`);
      error.status = response.status;
      error.payload = body;
      throw error;
    }
    return body;
  }

  function injectLogin() {
    if ($('#dutra-login')) return;
    const style = document.createElement('style');
    style.textContent = `
      .dutra-login{position:fixed;inset:0;z-index:500;background:radial-gradient(circle at 50% 0,#3f310d55,transparent 32%),#05090cf5;backdrop-filter:blur(18px);display:none;align-items:center;justify-content:center;padding:20px}
      .dutra-login.open{display:flex}.dutra-login-card{width:min(420px,100%);border:1px solid #3b4650;border-radius:20px;background:#0a1014;padding:24px;box-shadow:0 30px 90px #000}
      .dutra-login-card h2{margin:10px 0 8px;font-size:26px}.dutra-login-card p{color:#9ca6af;line-height:1.55;font-size:13px}
      .dutra-login-card input{width:100%;height:54px;border:1px solid #3b4650;border-radius:12px;background:#080d11;color:#fff;padding:0 14px;font-size:18px;letter-spacing:.16em;outline:0}
      .dutra-login-card button{width:100%;height:54px;margin-top:12px;border:0;border-radius:12px;background:#ffd400;color:#111;font-weight:900}
      .dutra-login-status{min-height:18px;margin-top:9px;color:#ff9b9b;font-size:11px}
      .dutra-connection{position:fixed;right:12px;bottom:92px;z-index:70;padding:7px 9px;border-radius:999px;border:1px solid #29402d;background:#0b1710e8;color:#72e77c;font-size:9px;font-weight:800;box-shadow:0 8px 28px #0007}
      .dutra-connection.off{border-color:#4d3434;background:#1b0f0fe8;color:#ff8e8e}
      .core-client-result{padding:10px 12px;border-radius:10px;display:flex;justify-content:space-between;gap:10px;cursor:pointer}
      .core-client-result:hover{background:#121a20}.core-client-result b{font-size:12px}.core-client-result small{display:block;color:#8e99a2;font-size:9px;margin-top:3px}
    `;
    document.head.appendChild(style);

    const wrap = document.createElement('div');
    wrap.id = 'dutra-login';
    wrap.className = 'dutra-login';
    wrap.innerHTML = `
      <div class="dutra-login-card">
        <div style="color:#ffd400;font-size:11px;font-weight:900;letter-spacing:.14em">DUTRA OS · V3 PREMIUM</div>
        <h2>Conectar à base real</h2>
        <p>Use o mesmo código de acesso do DUTRA OS. A V3 passa a ler e gravar na base operacional existente, sem duplicar o CRM.</p>
        <input id="dutra-login-pin" type="password" inputmode="numeric" autocomplete="one-time-code" placeholder="Código de acesso">
        <button id="dutra-login-submit">Entrar na operação</button>
        <div class="dutra-login-status" id="dutra-login-status"></div>
      </div>`;
    document.body.appendChild(wrap);

    const indicator = document.createElement('div');
    indicator.id = 'dutra-connection';
    indicator.className = 'dutra-connection off';
    indicator.textContent = 'BASE DESCONECTADA';
    document.body.appendChild(indicator);

    $('#dutra-login-submit').addEventListener('click', loginFromForm);
    $('#dutra-login-pin').addEventListener('keydown', e => {
      if (e.key === 'Enter') loginFromForm();
    });
  }

  function showLogin(message = '') {
    injectLogin();
    $('#dutra-login').classList.add('open');
    $('#dutra-login-status').textContent = message;
    setTimeout(() => $('#dutra-login-pin')?.focus(), 60);
    connection(false);
  }

  function hideLogin() {
    $('#dutra-login')?.classList.remove('open');
  }

  function connection(online) {
    const el = $('#dutra-connection');
    if (!el) return;
    el.classList.toggle('off', !online);
    el.textContent = online ? 'BASE REAL CONECTADA' : 'BASE DESCONECTADA';
  }

  async function loginFromForm() {
    const input = $('#dutra-login-pin');
    const status = $('#dutra-login-status');
    const pin = clean(input?.value);
    if (pin.length < 6) {
      status.textContent = 'O código deve ter pelo menos 6 caracteres.';
      return;
    }
    status.textContent = 'Conectando…';
    state.pin = pin;
    try {
      await loadState();
      sessionStorage.setItem(STORAGE_KEY, pin);
      hideLogin();
      status.textContent = '';
      if (input) input.value = '';
      toast('V3 conectada à base real do DUTRA OS.');
    } catch (error) {
      if (error.message !== 'unauthorized') status.textContent = error.message;
      state.pin = '';
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  async function loadState() {
    const snapshot = await api('/state');
    state.snapshot = snapshot;
    state.leads = (snapshot.leads || []).map(normalize);
    if (!state.selectedLeadId || !state.leads.some(item => String(item.id) === String(state.selectedLeadId))) {
      state.selectedLeadId = pickFocusLead()?.id || state.leads[0]?.id || null;
    }
    connection(true);
    renderAll();
    window.dispatchEvent(new CustomEvent('dutra:state',{detail:{snapshot:state.snapshot,leads:state.leads}}));
    return snapshot;
  }

  async function saveState(message = 'Alterações salvas.') {
    if (!state.snapshot) throw new Error('Base ainda não carregada.');
    const payload = {
      revision: Number(state.snapshot.revision || 0),
      leads: state.leads,
      history: state.snapshot.history || [],
      operations: state.snapshot.operations || {}
    };
    try {
      const next = await api('/state', {
        method:'PUT',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(payload)
      });
      state.snapshot = next;
      state.leads = (next.leads || []).map(normalize);
      connection(true);
      renderAll();
      window.dispatchEvent(new CustomEvent('dutra:state',{detail:{snapshot:state.snapshot,leads:state.leads}}));
      toast(message);
      return next;
    } catch (error) {
      if (error.status === 409) {
        await loadState();
        toast('A base mudou em outro dispositivo. Recarreguei os dados para evitar conflito.');
      }
      throw error;
    }
  }

  function sortedLeads() {
    const intel = globalThis.OG_LEAD_INTELLIGENCE;
    if (intel?.filterSort) return intel.filterSort(state.leads, {}, new Date());
    return state.leads.slice().sort((a,b) => clean(b.updatedAt || b.lastContactAt).localeCompare(clean(a.updatedAt || a.lastContactAt)));
  }

  function pickFocusLead() {
    return sortedLeads().find(lead => !['perdido','fechado'].includes(clean(lead.status).toLowerCase())) || sortedLeads()[0] || null;
  }

  function renderHome() {
    const leads = state.leads;
    const intel = globalThis.OG_LEAD_INTELLIGENCE;
    const summary = intel?.summarize ? intel.summarize(leads) : { total:leads.length, stages:{} };
    const metrics = $$('#home .metric strong');
    const followUps = leads.filter(l => clean(l.nextAction) || clean(l.followUpAt)).length;
    const advancing = ['talked','interested','proposal','negotiation','waiting_response'].reduce((sum,key)=>sum+(summary.stages?.[key]||0),0);
    const values = [summary.total || leads.length, summary.stages?.first_contact || 0, advancing, followUps];
    metrics.forEach((el,index) => { if (values[index] != null) el.textContent = String(values[index]); });

    const focus = pickFocusLead();
    const focusBox = $('#home .focus');
    if (focusBox && focus) {
      const b = $('b', focusBox), small = $('small', focusBox);
      if (b) b.textContent = focus.empresa || focus.nome || 'Cliente';
      const nba = intel?.nextBestAction ? intel.nextBestAction(focus) : null;
      if (small) small.textContent = [nba?.action || focus.nextAction || focus.status, focus.fleetSize ? `${focus.fleetSize} veículos` : ''].filter(Boolean).join(' · ');
      focusBox.dataset.leadId = focus.id;
    }

    const recentSection = $$('#home .section').find(section => section.textContent.includes('Clientes recentes'));
    if (recentSection) {
      const rows = $$('.clientrow', recentSection);
      const recent = leads.slice().sort((a,b)=>clean(b.updatedAt || b.lastContactAt || b.createdDate).localeCompare(clean(a.updatedAt || a.lastContactAt || a.createdDate))).slice(0,3);
      rows.forEach((row,index) => {
        const lead = recent[index];
        if (!lead) { row.style.display='none'; return; }
        row.style.display='flex';
        row.dataset.leadId = lead.id;
        const thumb = $('.thumb',row), body = $('.rowBody',row), status = $('.status',row);
        if (thumb) thumb.textContent = clean(lead.empresa || lead.nome).slice(0,1).toUpperCase() || 'C';
        if (body) body.innerHTML = `<b>${escapeHtml(lead.empresa || lead.nome || 'Cliente')}</b><small>${escapeHtml([lead.fleetSize ? lead.fleetSize+' veículos' : '', lead.nextAction || lead.status || 'Sem próxima ação'].filter(Boolean).join(' · '))}</small>`;
        if (status) status.textContent = stageLabel(lead);
      });
    }

    const agenda = $('#home .agenda');
    if (agenda) {
      const top = sortedLeads().slice(0,3);
      agenda.innerHTML = top.map(lead => {
        const nba = intel?.nextBestAction ? intel.nextBestAction(lead) : {};
        return `<div class="agendaItem" data-core-lead="${escapeAttr(lead.id)}"><div class="agendaIcon">◎</div><div><b>${escapeHtml(lead.empresa || lead.nome || 'Cliente')}</b><small>${escapeHtml(nba.action || lead.nextAction || 'Definir próxima ação')}</small></div><time>${escapeHtml(nba.importance || '')}</time></div>`;
      }).join('');
    }

    const nums = $$('#home .pipeNum strong');
    const pipeValues = [summary.stages?.first_contact || 0, advancing, followUps, sortedLeads().slice(0,4).length];
    nums.forEach((el,index)=>{ if (pipeValues[index] != null) el.textContent=String(pipeValues[index]); });
  }

  function stageLabel(lead) {
    const intel = globalThis.OG_LEAD_INTELLIGENCE;
    return intel?.stageDefinition ? intel.stageDefinition(lead).label.toUpperCase() : clean(lead.status || 'ATIVO').toUpperCase();
  }

  function selectedLead() {
    return state.leads.find(item => String(item.id) === String(state.selectedLeadId)) || null;
  }

  function renderClient() {
    const lead = selectedLead();
    if (!lead) return;
    const panel = $('#clients');
    if (!panel) return;

    const title = $('.clientInfo h2',panel), subtitle = $('.clientInfo p',panel), avatar = $('.bigAvatar',panel);
    if (title) title.textContent = lead.empresa || lead.nome || 'Cliente';
    if (subtitle) subtitle.textContent = [lead.nome && lead.nome !== lead.empresa ? lead.nome : '', lead.cidadeUf || '', lead.internalCode ? 'Código OG '+lead.internalCode : ''].filter(Boolean).join(' · ') || 'Cliente da base real';
    if (avatar) avatar.textContent = clean(lead.empresa || lead.nome).slice(0,1).toUpperCase() || 'C';

    const stats = $$('.miniStat',panel);
    const openOps = (state.snapshot?.operations?.opportunities || []).filter(item => String(item.clientId) === String(lead.id) && !['won','lost','closed'].includes(clean(item.stage).toLowerCase()));
    const quotes = (state.snapshot?.operations?.quotes || []).filter(item => String(item.clientId) === String(lead.id));
    const values = [
      {v:lead.fleetSize || '—',s:'Veículos'},
      {v:(lead.interactions || []).length,s:'Interações'},
      {v:quotes.length,s:'Propostas'},
      {v:openOps.length,s:'Oportunidades'}
    ];
    stats.forEach((box,index)=>{
      if (!values[index]) return;
      $('strong',box).textContent=values[index].v;
      $('small',box).textContent=values[index].s;
    });

    const overview = $('[data-client-panel="overview"]',panel);
    if (overview) {
      const cards = $$('.insightCard',overview);
      const nba = globalThis.OG_LEAD_INTELLIGENCE?.nextBestAction?.(lead);
      if (cards[0]) {
        $('strong',cards[0]).textContent = nba?.action || lead.nextAction || 'Definir próxima ação';
        $('p',cards[0]).textContent = nba?.reason || lead.nextActionReason || 'Sem motivo registrado.';
      }
      if (cards[1]) {
        $('strong',cards[1]).textContent = lead.potential ? `Potencial ${lead.potential}` : (lead.fleetSize ? `${lead.fleetSize} veículos na frota` : 'Mapear potencial');
        $('p',cards[1]).textContent = lead.pain || lead.accountSummary || 'Complete a ficha para enriquecer a oportunidade.';
      }
    }

    const historyPanel = $('[data-client-panel="history"]',panel);
    if (historyPanel) {
      const section = $('.section',historyPanel);
      if (section) {
        const head = $('.sectionHead',section)?.outerHTML || '<div class="sectionHead"><h2>Atividades recentes</h2></div>';
        const interactions = (lead.interactions || []).slice().sort((a,b)=>clean(b.at).localeCompare(clean(a.at))).slice(0,8);
        section.innerHTML = head + (interactions.length ? interactions.map(item => `<div class="listRow"><div class="agendaIcon">•</div><div class="rowBody"><b>${escapeHtml(item.type || 'Interação')}</b><small>${escapeHtml(item.note || '')}<br>${escapeHtml(formatDate(item.at))}</small></div></div>`).join('') : '<div class="listRow"><div class="rowBody"><b>Nenhuma interação registrada</b><small>Use as ações do Cliente 360° para iniciar o histórico.</small></div></div>');
      }
    }

    const fleetPanel = $('[data-client-panel="fleet"]',panel);
    if (fleetPanel) {
      const body = $('.section',fleetPanel);
      if (body) {
        const head = $('.sectionHead',body)?.outerHTML || '<div class="sectionHead"><h2>Frota do cliente</h2></div>';
        body.innerHTML = head + `<div class="listRow"><div class="thumb">🚚</div><div class="rowBody"><b>${escapeHtml(lead.fleetSize ? lead.fleetSize+' veículos cadastrados' : 'Frota a mapear')}</b><small>${escapeHtml(lead.accountSummary || lead.pain || 'Complete a ficha técnica do cliente para detalhar a frota.')}</small></div></div>`;
      }
    }

    const proposalsPanel = $('[data-client-panel="proposals"]',panel);
    if (proposalsPanel) {
      const section = $('.section',proposalsPanel);
      if (section) {
        const head = $('.sectionHead',section)?.outerHTML || '<div class="sectionHead"><h2>Últimas propostas</h2></div>';
        const leadQuotes = quotes.slice().sort((a,b)=>clean(b.preparedAt || b.updatedAt).localeCompare(clean(a.preparedAt || a.updatedAt))).slice(0,6);
        const html = leadQuotes.length ? leadQuotes.map(q => `<div class="proposalRow"><div class="agendaIcon">▤</div><div class="rowBody"><b>${escapeHtml(q.id || 'Proposta')}</b><small>${escapeHtml(q.status || 'salva')} · ${escapeHtml(formatDate(q.preparedAt))}</small><strong>${formatMoney(q.totalValue || 0)}</strong></div></div>`).join('') : '<div class="proposalRow"><div class="rowBody"><b>Nenhuma proposta salva</b><small>Crie a primeira proposta para este cliente.</small></div></div>';
        section.innerHTML = head + html + '<button class="btn primary full" id="coreNewProposal"><span>＋</span> Nova proposta para este cliente</button>';
        $('#coreNewProposal',section)?.addEventListener('click',()=>prepareProposalForLead(lead));
      }
    }

    const clientInput = $('#proposalClient');
    if (clientInput) clientInput.value = lead.empresa || lead.nome || '';
  }

  function renderCommandClients() {
    const items = $('.cmdItems');
    const input = $('#cmdInput');
    if (!items || !input || items.dataset.coreBound) return;
    items.dataset.coreBound = '1';
    const dynamic = document.createElement('div');
    dynamic.id = 'core-client-results';
    items.appendChild(dynamic);

    input.addEventListener('input', () => {
      const q = clean(input.value);
      if (q.length < 2) { dynamic.innerHTML=''; return; }
      const crm = globalThis.OG_CRM_SERVICE;
      const matches = state.leads.filter(lead => crm?.matchesSearch ? crm.matchesSearch(lead,q) : JSON.stringify(lead).toLowerCase().includes(q.toLowerCase())).slice(0,6);
      dynamic.innerHTML = matches.map(lead => `<div class="core-client-result" data-core-lead="${escapeAttr(lead.id)}"><div><b>${escapeHtml(lead.empresa || lead.nome || 'Cliente')}</b><small>${escapeHtml([lead.nome,lead.internalCode,lead.cidadeUf].filter(Boolean).join(' · '))}</small></div><span>›</span></div>`).join('');
    });
  }

  function prepareProposalForLead(lead) {
    state.selectedLeadId = lead.id;
    renderClient();
    const input = $('#proposalClient');
    if (input) input.value = lead.empresa || lead.nome || '';
    if (typeof globalThis.go === 'function') globalThis.go('proposal');
  }

  function bindRealActions() {
    document.addEventListener('click', async event => {
      const leadTarget = event.target.closest('[data-core-lead], .clientrow[data-lead-id], .focus[data-lead-id]');
      if (leadTarget) {
        const id = leadTarget.dataset.coreLead || leadTarget.dataset.leadId;
        if (id && state.leads.some(item => String(item.id) === String(id))) {
          state.selectedLeadId = id;
          renderClient();
          window.dispatchEvent(new CustomEvent('dutra:client',{detail:{lead:selectedLead()}}));
          if (typeof globalThis.go === 'function') globalThis.go('clients');
          return;
        }
      }

      const clientCall = event.target.closest('.clientAction');
      if (clientCall && $('#clients')?.classList.contains('active')) {
        const actions = $$('.clientAction',$('#clients'));
        const index = actions.indexOf(clientCall);
        const lead = selectedLead();
        if (!lead) return;
        if (index === 0) {
          const digits = clean(lead.telefone).replace(/\D/g,'');
          if (!digits) return toast('Cliente sem telefone cadastrado.');
          location.href = 'tel:+' + (digits.startsWith('55') ? digits : '55'+digits);
        }
        if (index === 1) {
          try {
            const url = globalThis.OG_WHATSAPP_SERVICE?.buildLink(lead.telefone, `Olá, ${lead.nome || lead.empresa || ''}! Aqui é o Lucas, da Olho de Gato.`);
            if (!url) throw new Error('Telefone inválido');
            window.open(url,'_blank','noopener');
          } catch (error) { toast(error.message); }
        }
        if (index === 2) {
          if (globalThis.DUTRA_ACTION_CENTER?.open) {
            globalThis.DUTRA_ACTION_CENTER.open(lead, lead.nextActionType || 'FOLLOW_UP', {
              reason: lead.nextActionReason || 'Definir próximo compromisso pelo Cliente 360°.'
            });
          } else {
            toast('Centro de próximas ações ainda não carregou.');
          }
        }
        if (index === 3) {
          prepareProposalForLead(lead);
        }
      }
    });

    $$('.moduleRow').forEach(row => {
      const label=$('b',row)?.textContent?.trim()||'';
      if (row.dataset.go || row.id === 'openRoi2' || ['Meu Dia','Prospecção'].includes(label)) return;
      row.addEventListener('click', () => {
        window.open('/legacy/','_blank','noopener');
      });
    });
  }

  async function publishProposal() {
    const lead = selectedLead();
    if (!lead) return toast('Selecione um cliente antes de gerar a proposta.');
    if (!state.snapshot) return toast('Base real ainda não carregada.');

    const qty = Math.max(1, Number($('#proposalQty')?.value) || 1);
    const installments = Math.max(1, Number($('#proposalInstallments')?.value) || 1);
    const tires = Math.max(0, Number($('#proposalTires')?.value) || 0);
    const totalText = $('#proposalTotal')?.textContent || '0';
    const total = parseMoney(totalText);
    const units = qty * 16;
    const quoteId = `Q-V3-${Date.now()}`;
    const client = {
      nome: lead.nome || '',
      empresa: lead.empresa || lead.nome || '',
      cnpj: lead.cnpj || '',
      cidadeUf: lead.cidadeUf || '',
      internalCode: lead.internalCode || '',
      freteTexto:'Incluso / a confirmar',
      condicaoPagamento:`${installments}x de ${formatMoney(total/installments)}`
    };
    const quoteState = {
      client,
      activePdfTemplate:'default',
      vehicles:[{
        id:'rodotrem',
        name:'Rodotrem',
        vehicleTypeId:'rodotrem',
        libras:120,
        includeDianteira:false,
        qty,
        items:[{code:'EQ-120',qty:units,customPrice:null}]
      }],
      extraItems:[]
    };
    const quote = {
      id:quoteId,
      clientId:lead.id,
      clientName:lead.nome || '',
      clientCompany:lead.empresa || '',
      clientInternalCode:lead.internalCode || '',
      totalValue:total,
      totalPecas:units,
      payload:quoteState
    };

    try {
      const proposalService = globalThis.OG_PROPOSAL_INTELLIGENCE;
      const operationsModel = globalThis.OG_OPERATIONS_MODEL;
      if (!proposalService?.prepareTrackingDraft || !operationsModel) throw new Error('Motor oficial de propostas não carregou.');
      const nextOps = proposalService.prepareTrackingDraft(state.snapshot.operations || {}, {
        clientId:lead.id,
        quoteId,
        quote,
        quoteState
      }, { operationsModel, now:new Date().toISOString() });
      state.snapshot.operations = nextOps;
      await saveState('Rascunho oficial salvo na base real.');

      const proposalId = `PROP-${quoteId.replace(/[^a-zA-Z0-9_-]/g,'').slice(-32)}`;
      const published = await api('/proposals/publish', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({proposalId})
      });
      if (published?.publicUrl) {
        toast('Proposta publicada com link rastreável.');
        window.open(published.publicUrl,'_blank','noopener');
      }
    } catch (error) {
      toast('Não foi possível publicar: ' + error.message);
    }
  }

  function bindProposal() {
    const button = $('#generateProposal');
    if (!button || button.dataset.coreBound) return;
    button.dataset.coreBound='1';
    button.addEventListener('click', event => {
      event.preventDefault();
      publishProposal();
    });
  }

  function bindTechnicalData() {
    const data = typeof OG_DATA !== 'undefined' ? OG_DATA : null;
    if (!data?.vehicleConsultantRules?.length) return;
    const filters = $$('#application .filters select');
    const typeSelect = filters[4];
    if (typeSelect) {
      const current = typeSelect.value;
      typeSelect.innerHTML = data.vehicleConsultantRules.map(rule => `<option value="${escapeAttr(rule.id)}">${escapeHtml(rule.name)}</option>`).join('');
      if ([...typeSelect.options].some(o=>o.value===current)) typeSelect.value=current;
    }
    const button = $('#application .filterAction');
    if (button && !button.dataset.coreBound) {
      button.dataset.coreBound='1';
      button.addEventListener('click', () => {
        const rule = data.vehicleConsultantRules.find(item=>item.id===typeSelect?.value) || data.vehicleConsultantRules[0];
        const rulesPanel = $('[data-app-panel="rules"]');
        if (rulesPanel && rule) {
          rulesPanel.innerHTML = `
            <div class="techRule"><b>Aplicação: ${escapeHtml(rule.name)}</b><p>${escapeHtml(rule.category || '')} · ${escapeHtml((rule.applications || []).join(', '))}</p></div>
            ${(rule.questions || []).map(q=>`<div class="techRule"><b>${escapeHtml(q.question)}</b><p>${escapeHtml((q.options || []).map(o=>o.label + (o.hint?' — '+o.hint:'')).join(' | '))}</p></div>`).join('')}
            <button class="btn primary full" data-go="proposal">Usar esta aplicação na proposta</button>`;
          $('[data-app-tab="rules"]')?.click();
          rulesPanel.querySelector('[data-go="proposal"]')?.addEventListener('click',()=>globalThis.go?.('proposal'));
        }
        toast('Regra técnica carregada da base oficial do DUTRA OS.');
      });
    }
  }

  function renderAll() {
    renderHome();
    renderClient();
    renderCommandClients();
    bindTechnicalData();
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? clean(value) : date.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  }

  function parseMoney(value) {
    const raw = clean(value).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');
    return Number(raw) || 0;
  }

  function escapeHtml(value) {
    return clean(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function escapeAttr(value) { return escapeHtml(value); }

  async function boot() {
    injectLogin();
    bindRealActions();
    bindProposal();
    renderCommandClients();
    bindTechnicalData();

    if (!state.pin) {
      showLogin();
      return;
    }
    try {
      await loadState();
      hideLogin();
    } catch (error) {
      if (error.message !== 'unauthorized') {
        console.error(error);
        showLogin('Não consegui conectar à base real. Tente novamente.');
      }
    }
  }

  window.DUTRA_CORE = {
    reload:loadState,
    save:saveState,
    getState:()=>state.snapshot,
    getLeads:()=>state.leads,
    getSelectedLead:()=>selectedLead(),
    commit:async(payload={},message='Alterações salvas.')=>{if(Array.isArray(payload.leads))state.leads=payload.leads.map(normalize);if(payload.operations&&typeof payload.operations==='object'){if(!state.snapshot)throw new Error('Base ainda não carregada.');state.snapshot.operations=payload.operations;}return saveState(message);},
    request:(path,options={})=>api(path,options),
    selectClient:id=>{state.selectedLeadId=id;renderClient();globalThis.go?.('clients');}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();