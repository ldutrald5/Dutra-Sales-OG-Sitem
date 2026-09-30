(() => {
  'use strict';

  const STORAGE_KEY = 'dutra_v3_access_pin';
  const CACHE_KEY = 'dutra_v3_snapshot_cache_v1';
  const PENDING_SAVE_KEY = 'dutra_v3_pending_save_v1';
  const state = {
    snapshot: null,
    leads: [],
    selectedLeadId: null,
    pin: sessionStorage.getItem(STORAGE_KEY) || '',
    connectionStatus: 'CONNECTING',
    lastSyncedAt: '',
    reconnectTimer: null,
    flushingPending: false,
    pendingMutationCount: 0,
    saveFeedbackTimer: null,
    connectionUnsubscribe: null
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clean = value => String(value ?? '').trim();
  const formatMoney = value => Number(value || 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
  const normalize = lead => globalThis.OG_CRM_SERVICE?.normalizeLead ? globalThis.OG_CRM_SERVICE.normalizeLead(lead) : lead;
  const connectionState = () => globalThis.OG_CONNECTION_STATE;
  const syncBridge = () => globalThis.OG_SYNC_BRIDGE;

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('timeout'), Number(options.timeoutMs || 9000));
    let response;
    try {
      response = await fetch('/core-api' + path, {
        ...options,
        headers: authHeaders(options.headers || {}),
        cache: 'no-store',
        signal: options.signal || controller.signal
      });
    } catch (error) {
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        const timeoutError = new Error('A base demorou para responder. O DUTRA OS continuará com o cache local.');
        timeoutError.code = 'NETWORK_TIMEOUT';
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
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
      .dutra-connection{position:fixed;right:12px;top:12px;z-index:170;padding:7px 9px;border-radius:999px;border:1px solid #29402d;background:#0b1710ee;color:#72e77c;font-size:9px;font-weight:800;box-shadow:0 8px 28px #0007;cursor:pointer;max-width:min(82vw,390px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;backdrop-filter:blur(12px)}
      .dutra-connection[data-status="CONNECTING"],.dutra-connection[data-status="SYNCING"]{border-color:#645818;background:#171506ee;color:#ffd400}
      .dutra-connection[data-status="OFFLINE"]{border-color:#4d3434;background:#1b0f0fee;color:#ff9a9a}
      .dutra-connection[data-status="ERROR"]{border-color:#69432c;background:#21140dee;color:#ffb27f}
      .dutra-connection[data-status="CONNECTED"]{border-color:#29402d;background:#0b1710ee;color:#72e77c}
      .dutra-save-feedback{position:fixed;right:12px;top:48px;z-index:169;border:1px solid #34404a;border-radius:9px;background:#091015ee;color:#dce3e7;padding:7px 10px;font-size:8px;font-weight:900;box-shadow:0 8px 28px #0007;backdrop-filter:blur(12px);display:none;cursor:default}
      .dutra-save-feedback.show{display:block}.dutra-save-feedback[data-phase="SAVING"]{color:#ffd400;border-color:#645818}.dutra-save-feedback[data-phase="SAVED"]{color:#72e77c;border-color:#29402d}.dutra-save-feedback[data-phase="QUEUED"],.dutra-save-feedback[data-phase="FAILED"]{color:#ffb27f;border-color:#69432c;cursor:pointer}
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
    indicator.className = 'dutra-connection';
    indicator.dataset.status = 'CONNECTING';
    indicator.textContent = 'CONECTANDO À BASE…';
    indicator.title = 'Toque para tentar sincronizar novamente.';
    indicator.addEventListener('click', () => flushPendingSave(true));
    document.body.appendChild(indicator);

    const saveFeedback = document.createElement('button');
    saveFeedback.id = 'dutra-save-feedback';
    saveFeedback.className = 'dutra-save-feedback';
    saveFeedback.type = 'button';
    saveFeedback.addEventListener('click', () => {
      const phase = saveFeedback.dataset.phase;
      if (phase === 'FAILED' || phase === 'QUEUED') flushPendingSave(true);
    });
    document.body.appendChild(saveFeedback);

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
    setConnectionStatus('CONNECTING','BASE AGUARDANDO AUTENTICAÇÃO');
  }

  function hideLogin() {
    $('#dutra-login')?.classList.remove('open');
  }

  function renderConnectionSnapshot(value = {}) {
    state.connectionStatus = value.status || state.connectionStatus;
    state.lastSyncedAt = value.lastSyncedAt || state.lastSyncedAt;
    state.pendingMutationCount = Math.max(0,Number(value.pendingCount ?? state.pendingMutationCount)||0);

    const el = $('#dutra-connection');
    if (el) {
      const pending = state.pendingMutationCount;
      const labels = {
        CONNECTING:'◌ CONECTANDO À BASE…',
        CONNECTED:pending ? '● BASE CONECTADA · '+pending+' PENDENTE'+(pending===1?'':'S') : '● BASE CONECTADA · TUDO SALVO',
        OFFLINE:'○ OFFLINE · '+pending+' ALTERAÇÃO'+(pending===1?'':'ÕES')+' PENDENTE'+(pending===1?'':'S'),
        SYNCING:'↻ SINCRONIZANDO'+(pending?' '+pending:'')+'…',
        ERROR:'! SINCRONIZAÇÃO PENDENTE'+(pending?' · '+pending:'')
      };
      el.dataset.status = value.status || state.connectionStatus;
      el.textContent = value.detail || labels[value.status || state.connectionStatus] || state.connectionStatus;
      el.title = (value.status || state.connectionStatus) === 'CONNECTED'
        ? ('Última confirmação: ' + (state.lastSyncedAt ? new Date(state.lastSyncedAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}) : 'agora'))
        : 'Toque para tentar sincronizar novamente.';
    }

    const feedback = $('#dutra-save-feedback');
    const save = value.save || {};
    if (feedback) {
      clearTimeout(state.saveFeedbackTimer);
      feedback.dataset.phase = save.phase || 'IDLE';
      feedback.textContent = save.message || '';
      feedback.classList.toggle('show', Boolean(save.message) && save.phase !== 'IDLE');
      if (save.phase === 'SAVED') {
        state.saveFeedbackTimer = setTimeout(() => feedback.classList.remove('show'), 1800);
      }
    }
  }

  function bindConnectionState() {
    if (state.connectionUnsubscribe || !connectionState()?.subscribe) return;
    state.connectionUnsubscribe = connectionState().subscribe(renderConnectionSnapshot);
  }

  function setConnectionStatus(status, detail = '') {
    const service = connectionState();
    if (service?.transition) return service.transition(status,{detail,pendingCount:state.pendingMutationCount,lastSyncedAt:state.lastSyncedAt});
    renderConnectionSnapshot({status,detail,pendingCount:state.pendingMutationCount,lastSyncedAt:state.lastSyncedAt});
    window.dispatchEvent(new CustomEvent('dutra:connection',{detail:{status,lastSyncedAt:state.lastSyncedAt,pendingCount:state.pendingMutationCount}}));
  }

  function connection(online) { setConnectionStatus(online ? 'CONNECTED' : 'OFFLINE'); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function statePayload() {
    if (!state.snapshot) return null;
    return {revision:Number(state.snapshot.revision||0),leads:state.leads,history:state.snapshot.history||[],operations:state.snapshot.operations||{}};
  }
  function cacheSnapshot(snapshot = state.snapshot) {
    if (!snapshot) return;
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({savedAt:new Date().toISOString(),snapshot:{...clone(snapshot),leads:clone(state.leads)}})); }
    catch (error) { console.warn('[DUTRA] cache local indisponível', error); }
  }
  function readCachedSnapshot() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)||'null')?.snapshot || null; }
    catch { return null; }
  }
  function legacyPendingSave() {
    try { return JSON.parse(localStorage.getItem(PENDING_SAVE_KEY)||'null'); } catch { return null; }
  }
  function clearLegacyPendingSave() { try { localStorage.removeItem(PENDING_SAVE_KEY); } catch {} }

  async function queuePendingSave(payload, reason = 'offline') {
    const bridge=syncBridge();
    if(bridge?.queueState){
      try{
        const mutations=bridge.listMutations?await bridge.listMutations():[];
        const record=await bridge.queueState(payload,{
          mutationIds:mutations.map(item=>item.id)
        });
        clearLegacyPendingSave();
        return {queuedAt:record.queuedAt,reason,payload:clone(record.body),recordId:record.id,mutationIds:record.mutationIds||[]};
      }catch(error){
        console.warn('[DUTRA] outbox IndexedDB indisponível; usando fallback legado',error);
      }
    }
    try{
      const fallback={queuedAt:new Date().toISOString(),reason,payload:clone(payload),legacy:true};
      localStorage.setItem(PENDING_SAVE_KEY,JSON.stringify(fallback));
      return fallback;
    }catch(error){
      console.warn('[DUTRA] fila local indisponível',error);
      return null;
    }
  }

  async function pendingSave() {
    const bridge=syncBridge();
    if(bridge?.readQueuedState){
      try{
        const record=await bridge.readQueuedState();
        if(record?.body){
          return {queuedAt:record.queuedAt,reason:'indexeddb',payload:clone(record.body),recordId:record.id,mutationIds:record.mutationIds||[]};
        }
      }catch(error){console.warn('[DUTRA] leitura do outbox IndexedDB falhou',error);}
    }
    const legacy=legacyPendingSave();
    if(!legacy?.payload)return null;
    if(bridge?.queueState){
      try{
        const migrated=await queuePendingSave(legacy.payload,legacy.reason||'legacy');
        if(migrated)return migrated;
      }catch(error){console.warn('[DUTRA] migração do pending save legado falhou',error);}
    }
    return legacy;
  }

  async function clearPendingSave() {
    const bridge=syncBridge();
    if(bridge?.clearQueuedState){
      try{await bridge.clearQueuedState();}catch(error){console.warn('[DUTRA] limpeza do outbox IndexedDB falhou',error);}
    }
    clearLegacyPendingSave();
  }

  async function pendingMutations() {
    try { return syncBridge()?.listMutations ? await syncBridge().listMutations() : []; }
    catch (error) { console.warn('[DUTRA] mutations indisponíveis', error); return []; }
  }
  async function refreshPendingMutationCount() {
    const rows = await pendingMutations();
    state.pendingMutationCount = rows.length;
    connectionState()?.setPendingCount?.(rows.length);
    return rows.length;
  }
  async function enqueueBusinessMutation(meta = {}, message = 'Alteração') {
    const bridge = syncBridge();
    if (!bridge?.enqueueMutation) return null;
    const mutation = await bridge.enqueueMutation({
      id:meta.id,
      idempotencyKey:meta.idempotencyKey,
      action:meta.action || 'STATE_COMMIT',
      entityType:meta.entityType || (state.selectedLeadId ? 'lead' : 'state'),
      entityId:meta.entityId || state.selectedLeadId || '',
      label:meta.label || message || 'Alteração',
      metadata:{source:'dutra-v3',...(meta.metadata||{})}
    });
    await refreshPendingMutationCount();
    return mutation;
  }
  async function markPendingMutationAttempts(error = '') {
    const bridge = syncBridge();
    if (!bridge?.markMutationAttempt) return;
    const rows = await pendingMutations();
    await Promise.all(rows.map(row => bridge.markMutationAttempt(row.id,error).catch(()=>null)));
  }
  async function acknowledgePendingMutations() {
    const bridge = syncBridge();
    if (!bridge?.ackMutations) return 0;
    const rows = await pendingMutations();
    if (rows.length) await bridge.ackMutations(rows.map(row=>row.id));
    return refreshPendingMutationCount();
  }
  function restoreCachedState() {
    const cached=readCachedSnapshot(); if(!cached) return false;
    state.snapshot=cached; state.leads=(cached.leads||[]).map(normalize);
    if(!state.selectedLeadId||!state.leads.some(item=>String(item.id)===String(state.selectedLeadId))) state.selectedLeadId=pickFocusLead()?.id||state.leads[0]?.id||null;
    renderAll();
    window.dispatchEvent(new CustomEvent('dutra:state',{detail:{snapshot:state.snapshot,leads:state.leads,source:'cache'}}));
    return true;
  }
  function networkLikeError(error) { return !error?.status || error?.code==='NETWORK_TIMEOUT'; }
  function scheduleReconnect(delay=5000) {
    clearTimeout(state.reconnectTimer); if(!state.pin) return;
    state.reconnectTimer=setTimeout(()=>flushPendingSave(false),delay);
  }
  async function flushPendingSave(force=false) {
    if(state.flushingPending||!state.pin) return false;
    const queued=await pendingSave();
    state.flushingPending=true;
    await refreshPendingMutationCount();
    if (queued?.payload) {
      connectionState()?.beginSave?.({status:'SYNCING',label:'Sincronização',message:'SALVANDO…'});
      setConnectionStatus('SYNCING');
    } else setConnectionStatus('CONNECTING');
    try {
      if(queued?.payload) {
        await markPendingMutationAttempts();
        const next=await api('/state',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(queued.payload)});
        state.snapshot=next;
        state.leads=(next.leads||[]).map(normalize);
        state.lastSyncedAt=new Date().toISOString();
        await clearPendingSave();
        const pendingCount=await acknowledgePendingMutations();
        cacheSnapshot(next);
        renderAll();
        window.dispatchEvent(new CustomEvent('dutra:state',{detail:{snapshot:state.snapshot,leads:state.leads,source:'sync'}}));
        connectionState()?.saveSucceeded?.({pendingCount,label:'Sincronização',message:'SALVO ✓'});
        setConnectionStatus('CONNECTED');
        if(force) toast('Alterações pendentes sincronizadas.');
        return true;
      }
      await loadState({silent:true});
      return true;
    } catch(error) {
      await markPendingMutationAttempts(error?.message||String(error));
      const pendingCount=await refreshPendingMutationCount();
      if(error.status===409) {
        connectionState()?.saveFailed?.({status:'ERROR',pendingCount,error:error.message,detail:'CONFLITO DE SINCRONIZAÇÃO · DADOS PRESERVADOS'});
        setConnectionStatus('ERROR','CONFLITO DE SINCRONIZAÇÃO · DADOS PRESERVADOS');
        if(force) toast('A base mudou em outro dispositivo. Seus dados locais foram preservados para revisão.');
      } else if(networkLikeError(error)) {
        connectionState()?.saveQueued?.({status:'OFFLINE',pendingCount});
        setConnectionStatus('OFFLINE');
        scheduleReconnect(force?5000:10000);
      } else if(Number(error.status)>=500) {
        connectionState()?.saveFailed?.({status:'ERROR',pendingCount,error:error.message,message:'TENTAR NOVAMENTE'});
        setConnectionStatus('ERROR','BASE INDISPONÍVEL · TENTAR NOVAMENTE');
        scheduleReconnect(force?5000:10000);
      } else if(error.message!=='unauthorized') {
        connectionState()?.saveFailed?.({status:'ERROR',pendingCount,error:error.message,message:'TENTAR NOVAMENTE'});
        setConnectionStatus('ERROR');
      }
      return false;
    } finally {
      state.flushingPending=false;
    }
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

  async function loadState(options = {}) {
    setConnectionStatus('CONNECTING');
    const snapshot = await api('/state');
    state.snapshot = snapshot;
    state.leads = (snapshot.leads || []).map(normalize);
    if (!state.selectedLeadId || !state.leads.some(item => String(item.id) === String(state.selectedLeadId))) {
      state.selectedLeadId = pickFocusLead()?.id || state.leads[0]?.id || null;
    }
    state.lastSyncedAt = new Date().toISOString();
    cacheSnapshot(snapshot);
    setConnectionStatus('CONNECTED');
    renderAll();
    window.dispatchEvent(new CustomEvent('dutra:state',{detail:{snapshot:state.snapshot,leads:state.leads}}));
    return snapshot;
  }

  async function saveState(message = 'Alterações salvas.', mutationMeta = {}) {
    if (!state.snapshot) throw new Error('Base ainda não carregada.');
    const payload = statePayload();
    cacheSnapshot({...state.snapshot,...payload});
    await queuePendingSave(payload,'saving');

    let mutation=null;
    try {
      mutation=await enqueueBusinessMutation(mutationMeta,message);
      await queuePendingSave(payload,'saving');
    } catch (error) {
      console.warn('[DUTRA] mutation granular indisponível; snapshot recovery preservado',error);
    }

    connectionState()?.beginSave?.({mutationId:mutation?.id||'',label:mutationMeta.label||message,message:'SALVANDO…'});
    setConnectionStatus('SYNCING');

    if (typeof navigator!=='undefined' && navigator.onLine===false) {
      await queuePendingSave(payload,'offline');
      const pendingCount=await refreshPendingMutationCount();
      connectionState()?.saveQueued?.({mutationId:mutation?.id||'',label:mutationMeta.label||message,pendingCount});
      setConnectionStatus('OFFLINE');
      toast('Sem conexão. Alteração salva neste aparelho e será sincronizada automaticamente.');
      scheduleReconnect();
      return state.snapshot;
    }

    try {
      await markPendingMutationAttempts();
      const next = await api('/state', {
        method:'PUT',
        headers:{'content-type':'application/json'},
        body:JSON.stringify(payload)
      });
      state.snapshot = next;
      state.leads = (next.leads || []).map(normalize);
      state.lastSyncedAt = new Date().toISOString();
      await clearPendingSave();
      const pendingCount=await acknowledgePendingMutations();
      cacheSnapshot(next);
      connectionState()?.saveSucceeded?.({mutationId:mutation?.id||'',label:mutationMeta.label||message,pendingCount,message:'SALVO ✓'});
      setConnectionStatus('CONNECTED');
      renderAll();
      window.dispatchEvent(new CustomEvent('dutra:state',{detail:{snapshot:state.snapshot,leads:state.leads}}));
      toast(message);
      return next;
    } catch (error) {
      await markPendingMutationAttempts(error?.message||String(error));
      const pendingCount=await refreshPendingMutationCount();
      if (error.status === 409) {
        await queuePendingSave(payload,'conflict');
        cacheSnapshot({...state.snapshot,...payload});
        connectionState()?.saveFailed?.({mutationId:mutation?.id||'',label:mutationMeta.label||message,pendingCount,status:'ERROR',error:error.message,detail:'CONFLITO DE SINCRONIZAÇÃO · DADOS PRESERVADOS'});
        setConnectionStatus('ERROR','CONFLITO DE SINCRONIZAÇÃO · DADOS PRESERVADOS');
        toast('A base mudou em outro dispositivo. Mantive suas alterações locais para não perder nada.');
        return state.snapshot;
      }
      if (networkLikeError(error)) {
        await queuePendingSave(payload,'offline');
        cacheSnapshot({...state.snapshot,...payload});
        connectionState()?.saveQueued?.({mutationId:mutation?.id||'',label:mutationMeta.label||message,pendingCount,status:'OFFLINE'});
        setConnectionStatus('OFFLINE');
        toast('Sem conexão. Alteração salva neste aparelho e será sincronizada automaticamente.');
        scheduleReconnect();
        return state.snapshot;
      }
      await queuePendingSave(payload,'error');
      cacheSnapshot({...state.snapshot,...payload});
      connectionState()?.saveFailed?.({mutationId:mutation?.id||'',label:mutationMeta.label||message,pendingCount,status:'ERROR',error:error.message,message:'TENTAR NOVAMENTE'});
      setConnectionStatus('ERROR',Number(error.status)>=500?'BASE INDISPONÍVEL · TENTAR NOVAMENTE':'SINCRONIZAÇÃO PENDENTE');
      if(Number(error.status)>=500) scheduleReconnect(10000);
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
      await saveState('Rascunho oficial salvo na base real.',{
        action:'SAVE_PROPOSAL_DRAFT',
        entityType:'proposal',
        entityId:quoteId,
        label:'Proposta'
      });

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
    bindConnectionState();
    await refreshPendingMutationCount();
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
      if (await pendingSave()) flushPendingSave(false);
    } catch (error) {
      if (error.message === 'unauthorized') return;
      console.error(error);
      if (restoreCachedState()) {
        hideLogin();
        setConnectionStatus('OFFLINE');
        toast('Sem conexão. Abri a última versão salva neste aparelho.');
        scheduleReconnect();
      } else {
        hideLogin();
        setConnectionStatus('OFFLINE','SEM CONEXÃO · TENTE NOVAMENTE');
      }
    }
    window.addEventListener('online',()=>flushPendingSave(true));
    window.addEventListener('offline',async()=>{
      const pendingCount=await refreshPendingMutationCount();
      if(pendingCount) connectionState()?.saveQueued?.({status:'OFFLINE',pendingCount});
      else setConnectionStatus('OFFLINE');
    });
  }

  window.DUTRA_CORE = {
    reload:loadState,
    save:saveState,
    getState:()=>state.snapshot,
    getLeads:()=>state.leads,
    getSelectedLead:()=>selectedLead(),
    getConnectionStatus:()=>connectionState()?.snapshot?.()||({status:state.connectionStatus,lastSyncedAt:state.lastSyncedAt,pendingCount:state.pendingMutationCount,pending:state.pendingMutationCount>0}),
    getPendingMutations:()=>pendingMutations(),
    retrySync:()=>flushPendingSave(true),
    commit:async(payload={},message='Alterações salvas.',mutationMeta={})=>{if(Array.isArray(payload.leads))state.leads=payload.leads.map(normalize);if(payload.operations&&typeof payload.operations==='object'){if(!state.snapshot)throw new Error('Base ainda não carregada.');state.snapshot.operations=payload.operations;}return saveState(message,mutationMeta);},
    request:(path,options={})=>api(path,options),
    selectClient:id=>{state.selectedLeadId=id;renderClient();window.dispatchEvent(new CustomEvent('dutra:client',{detail:{lead:selectedLead()}}));globalThis.go?.('clients');}
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();