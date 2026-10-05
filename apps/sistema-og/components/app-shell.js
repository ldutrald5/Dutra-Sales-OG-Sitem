/* Presentation only. Routing, auth, persistence and sync belong to app.js/services. */
(() => {
  const startup = document.getElementById('shell-startup');
  const area = document.getElementById('shell-area');
  const labels = Object.fromEntries([...document.querySelectorAll('.nav-tab')]
    .map(button => [button.dataset.tab, button.querySelector('span:last-child')?.textContent.trim()]));
  const timer = setTimeout(() => {
    if (!startup || startup.hidden) return;
    startup.dataset.state = 'error';
    startup.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = 'As ferramentas demoraram a abrir';
    const text = document.createElement('span');
    text.textContent = 'Seus dados locais permanecem neste aparelho.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Tentar novamente';
    retry.addEventListener('click', () => location.reload());
    startup.append(title, text, retry);
  }, 12000);

  window.OG_APP_SHELL = Object.freeze({
    ready() { clearTimeout(timer); startup.hidden = true; document.body.dataset.shellReady = 'true'; },
    select(tab) { area.textContent = labels[tab] || 'Meu Dia'; },
    clearError(tab) { document.getElementById(`shell-error-${tab}`)?.remove(); },
    showError(tab) {
      const panel = document.getElementById(`tab-${tab}`);
      if (!panel || document.getElementById(`shell-error-${tab}`)) return;
      const feedback = document.createElement('aside');
      feedback.id = `shell-error-${tab}`;
      feedback.className = 'shell-feedback';
      feedback.dataset.state = 'error';
      feedback.setAttribute('role', 'alert');
      const copy = document.createElement('strong');
      copy.textContent = 'Não foi possível abrir esta ferramenta. As outras áreas continuam disponíveis.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Tentar novamente';
      retry.addEventListener('click', () => document.querySelector(`.nav-tab[data-tab="${tab}"]`)?.click());
      feedback.append(copy, retry);
      panel.prepend(feedback);
    }
  });
})();
