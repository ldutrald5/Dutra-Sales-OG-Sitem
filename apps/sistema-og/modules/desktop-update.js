const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function request(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Abra o Sistema OG pelo atalho atualizado do Windows.');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Não foi possível consultar a atualização.');
  return result;
}

async function awaitLocalVersion(expected) {
  const deadline = Date.now() + 35000;
  while (Date.now() < deadline) {
    try {
      const health = await request('/api/health', { signal: AbortSignal.timeout(1500) });
      if (health.release === expected) return;
    } catch { /* Local service is restarting. */ }
    await wait(650);
  }
  throw new Error('A nova versão não iniciou. O sistema tenta retornar à versão anterior.');
}

async function refreshPublishedShell() {
  const registration = await navigator.serviceWorker?.getRegistration();
  if (!registration) return;
  await registration.update();
  const installing = registration.installing || registration.waiting;
  if (installing) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('O navegador ainda está preparando a atualização.')), 20000);
      function finish(error) {
        installing.removeEventListener('statechange', onStateChange);
        clearTimeout(timer);
        if (error) reject(error); else resolve();
      }
      function onStateChange() {
        if (installing.state === 'activated') finish();
        else if (installing.state === 'redundant') finish(new Error('O navegador não conseguiu preparar a atualização.'));
      }
      installing.addEventListener('statechange', onStateChange);
      onStateChange();
    });
  }
  const worker = registration.active;
  if (!worker) return;
  await new Promise((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => finish(new Error('O navegador não confirmou o download da versão publicada.')), 15000);
    function finish(error) {
      clearTimeout(timer);
      channel.port1.close();
      if (error) reject(error); else resolve();
    }
    channel.port1.onmessage = event => finish(event.data?.ok ? undefined : new Error('Não foi possível baixar os arquivos da versão publicada.'));
    worker.postMessage({ type: 'OG_REFRESH_SHELL' }, [channel.port2]);
  });
}

export async function updateApp(button, { notify, reload }) {
  button.disabled = true;
  const original = button.textContent;
  button.textContent = 'Verificando…';
  try {
    if (location.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(location.hostname)) {
      const status = await request('/api/desktop-update', { signal: AbortSignal.timeout(15000) });
      if (!status.available) return notify('Você já está na versão mais recente do GitHub.', 'success');
      const release = status.latest.slice(0, 7);
      if (!confirm(`Instalar a versão ${release} do GitHub e reiniciar o DUTRA OS? Seus dados locais serão mantidos.`)) return;
      button.textContent = 'Atualizando…';
      const result = await request('/api/desktop-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sha: status.latest }),
        signal: AbortSignal.timeout(330000),
      });
      if (result.available) await awaitLocalVersion(status.latest);
    } else if (!confirm('Verificar a versão publicada e recarregar o DUTRA OS?')) {
      return;
    }
    await refreshPublishedShell();
    reload();
  } catch (error) {
    notify(error.message || 'Não foi possível atualizar agora.', 'warning');
  } finally {
    button.textContent = original;
    button.disabled = false;
  }
}
