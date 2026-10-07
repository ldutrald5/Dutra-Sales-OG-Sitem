/* Hosted PIN validation stays server-side; JavaScript never retains the credential. */
(function (global) {
  'use strict';
  let loginPromise = null;
  let generation = 0;
  const MODE_KEY = 'og_access_session_enabled';
  const RUNTIME_KEY = 'og_runtime_mode';
  function enabled() {
    if (typeof global.OG_RUNTIME?.persistentAuth === 'boolean') return global.OG_RUNTIME.persistentAuth;
    // Non-secret last-known mode permits offline startup, never grants server access.
    try { return global.localStorage.getItem(MODE_KEY) === 'true'; } catch { return false; }
  }
  function clearLegacy() {
    for (const name of ['sessionStorage', 'localStorage']) {
      try { global[name].removeItem('og_cloud_access_token'); } catch { /* No retained credential in this module. */ }
    }
  }
  function login() {
    if (loginPromise) return loginPromise;
    loginPromise = new Promise(resolve => {
      let dialog = document.getElementById('access-session-dialog');
      if (!dialog) {
        dialog = document.createElement('dialog');
        dialog.id = 'access-session-dialog';
        dialog.setAttribute('aria-labelledby', 'access-session-title');
        dialog.innerHTML = '<form><h2 id="access-session-title">Acessar DUTRA OS</h2><label>PIN de acesso<input name="pin" type="password" autocomplete="one-time-code" required maxlength="128"></label><label><input name="remember" type="checkbox" checked> Permanecer conectado neste dispositivo (30 dias)</label><p role="status"></p><button type="submit">Entrar</button></form>';
        document.body.append(dialog);
      }
      const form = dialog.querySelector('form');
      const status = form.querySelector('[role=status]');
      status.textContent = '';
      dialog.oncancel = event => event.preventDefault();
      form.onsubmit = async event => {
        event.preventDefault();
        const button = form.querySelector('button');
        if (button.disabled) return;
        button.disabled = true;
        const pin = form.elements.pin.value;
        form.elements.pin.value = '';
        try {
          const response = await fetch('/api/access/login', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify({pin, remember: form.elements.remember.checked}) });
          if (!response.ok) { status.textContent = response.status === 401 ? 'PIN incorreto.' : 'Acesso indisponível. Verifique a conexão e tente novamente.'; return; }
          clearLegacy(); generation++;
          dialog.close(); resolve();
        } catch { status.textContent = 'Sem conexão. Reconecte para autenticar.'; }
        finally { button.disabled = false; }
      };
      dialog.showModal(); form.elements.pin.focus();
    }).finally(() => { loginPromise = null; });
    return loginPromise;
  }
  async function request(url, options = {}) {
    const started = generation;
    const send = () => fetch(url, { ...options, credentials: 'same-origin', headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(options.headers || {}) } });
    const response = await send();
    if (response.status !== 401) return response;
    // Concurrent bootstrap requests share one login, and late 401s reuse that session.
    if (started === generation) await login();
    return send();
  }
  function initialize() {
    try {
      if (global.OG_RUNTIME && typeof global.OG_RUNTIME.isolatedPreview === 'boolean') {
        const metadata = {};
        for (const key of ['isolatedPreview', 'persistentAuth', 'pilotRealData']) metadata[key] = global.OG_RUNTIME[key] === true;
        global.localStorage.setItem(RUNTIME_KEY, JSON.stringify(metadata));
      } else {
        const metadata = JSON.parse(global.localStorage.getItem(RUNTIME_KEY) || 'null');
        if (metadata && typeof metadata.isolatedPreview === 'boolean') global.OG_RUNTIME = Object.freeze(metadata);
      }
      if (typeof global.OG_RUNTIME?.persistentAuth === 'boolean') {
        if (global.OG_RUNTIME.persistentAuth) global.localStorage.setItem(MODE_KEY, 'true');
        else global.localStorage.removeItem(MODE_KEY);
      }
    } catch { /* Storage availability does not determine authorization. */ }
    if (!enabled()) return;
    clearLegacy();
    const button = document.createElement('button');
    button.id = 'access-session-logout'; button.type = 'button'; button.textContent = 'Sair';
    button.onclick = async () => {
      button.disabled = true;
      try {
        const response = await fetch('/api/access/logout', {method:'POST', credentials:'same-origin'});
        if (!response.ok) throw new Error('logout');
        clearLegacy(); location.reload();
      } catch { button.textContent = 'Sem conexão · tentar sair'; button.disabled = false; }
    };
    document.querySelector('.shell-header-status')?.append(button);
  }
  global.OG_ACCESS_SESSION = { request, initialize, enabled };
}(window));
