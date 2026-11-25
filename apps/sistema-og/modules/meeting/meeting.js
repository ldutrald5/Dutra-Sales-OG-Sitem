import { sections, slides } from './content.js';
import { icon } from './icons.js';
import { defaultSimulation, numericField, simulatorMarkup, simulatorResults, formatMoney, formatNumber } from './simulators.js';
import { boardMarkup, activateBoard } from './board.js';

const storageKey = 'og_meeting_draft_v1';
const maxSlide = slides.length - 1;
const mountedMeetings = new WeakMap();

export function mountMeeting(root) {
  if (mountedMeetings.has(root)) return mountedMeetings.get(root);
  root.innerHTML = `
    <header class="meeting-toolbar">
      <div>
        <span class="og-kicker">OLHO DE GATO</span>
        <h1>Reunião</h1>
      </div>
      <div class="meeting-actions">
        <button class="og-button og-button-ghost" type="button" data-meeting-new>Nova reunião</button>
        <button class="og-button og-button-ghost" type="button" data-meeting-present aria-pressed="false"></button>
      </div>
    </header>
    <div class="meeting-layout">
      <nav class="meeting-chapters" aria-label="Capítulos da reunião">
        ${sections.map(({ title, items }) => `<div class="meeting-chapter-group"><h2>${title}</h2>
          ${items.map(([page, label, symbol]) => `<button type="button" data-meeting-page="${page}" data-meeting-chapter>${icon(symbol, 17)}<span>${label}</span></button>`).join('')}
        </div>`).join('')}
      </nav>
      <div class="meeting-stage">
        <label class="meeting-chapter-select">Capítulo
          <select data-meeting-select aria-label="Capítulo">
            ${sections.map(({ title, items }) => `<optgroup label="${title}">${items.map(([page, label]) => `<option value="${page}">${label}</option>`).join('')}</optgroup>`).join('')}
          </select>
        </label>
        <div class="stage-meta"><span data-meeting-current></span><span data-meeting-step></span></div>
        <progress class="stage-progress" aria-label="Progresso da apresentação" max="${maxSlide}"></progress>
        <article class="slide" data-meeting-slide aria-labelledby="slide-title"></article>
        <footer class="stage-footer" aria-label="Controles da apresentação">
          <button type="button" class="og-button og-button-ghost" data-meeting-prev>${icon('left', 17)} Anterior</button>
          <p class="keyboard-hint">Use ← → para navegar</p>
          <button type="button" class="og-button og-button-primary" data-meeting-next></button>
        </footer>
      </div>
    </div>`;
  const $ = selector => root.querySelector(selector);
  const slide = $('[data-meeting-slide]');
  const present = $('[data-meeting-present]');
  const chapterSelect = $('[data-meeting-select]');
  let current = 1;

  function newDraft(saved = {}) {
    return {
      profile: saved.profile ?? {},
      costs: saved.costs ?? {},
      tires: { ...defaultSimulation('tires'), ...saved.tires },
      diesel: { ...defaultSimulation('diesel'), ...saved.diesel },
      board: saved.board ?? [],
      notes: saved.notes ?? '',
    };
  }

  function readDraft() {
    try {
      return newDraft(JSON.parse(sessionStorage.getItem(storageKey)) ?? {});
    } catch {
      return newDraft();
    }
  }

  let state = readDraft();
  function persist(updates) {
    Object.assign(state, updates);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Keep the draft in memory if browser storage is unavailable.
    }
  }

  const profile = [
    ['segment', 'Segmento da empresa', 'Ex. transporte rodoviário'],
    ['size', 'Quantidade de veículos', 'Ex. 35 caminhões'],
    ['type', 'Tipo de frota', 'Ex. carretas e bitrens'],
    ['role', 'Cargo do responsável', 'Ex. gestor de frotas'],
    ['shop', 'Estrutura de borracharia', 'Ex. equipe própria'],
    ['interval', 'Frequência de calibragem', 'Ex. a cada duas semanas'],
  ];

  function heading(data) {
    return `<header class="slide-heading"><h2 id="slide-title" tabindex="-1">${data.title}</h2><p>${data.description}</p></header>`;
  }

  function hero() {
    return `<div class="og-command-hero meeting-hero">
      <div class="og-command-copy">
        <h2 id="slide-title" tabindex="-1">Onde sua frota pode <em>economizar?</em></h2>
        <p>Use o diagnóstico e os simuladores de diesel e pneus para discutir a economia da sua frota.</p>
        <div class="og-hero-actions">
          <button type="button" class="og-button og-button-primary" data-meeting-page="2">Iniciar diagnóstico ${icon('right', 17)}</button>
          <button type="button" class="og-button og-button-ghost" data-meeting-page="16">Abrir simulador ${icon('chevron', 16)}</button>
        </div>
      </div>
    </div>
    <div class="quick-grid" aria-label="Atalhos da reunião">
      ${[
        [4, 'fuel', 'Combustível'],
        [7, 'tire', 'Pneus e desgaste'],
        [9, 'gauge', 'Equalização'],
        [19, 'pen', 'Quadro de anotações'],
      ].map(([page, symbol, label]) => `<button type="button" class="quick-card" data-meeting-page="${page}">
        ${icon(symbol, 20)}<strong>${label}</strong>${icon('chevron', 15)}
      </button>`).join('')}
    </div>`;
  }

  function cards(items) {
    return `<div class="info-grid">${items.map(([symbol, title, description]) => `<section class="info-card"><span class="quick-icon">${icon(symbol, 23)}</span><h3>${title}</h3><p>${description}</p></section>`).join('')}</div>`;
  }

  function comparison() {
    const entered = state.costs.diesel;
    return `<div class="comparison-grid">
      <section class="comparison-tile"><span>Exemplo da apresentação</span><strong>${formatMoney(25000)}</strong><span>por caminhão / mês</span></section>
      <section class="comparison-tile"><span>Sua operação</span><strong>${entered === undefined ? '—' : formatMoney(entered)}</strong><button class="text-button" type="button" data-meeting-page="4">Editar custo informado ${icon('chevron', 15)}</button></section>
    </div>`;
  }

  function chart() {
    const values = [25, 37, 57, 78, 94, 100, 98, 86, 70, 55, 50];
    return `<figure class="chart"><figcaption>Vida útil relativa à pressão recomendada</figcaption>
      <div class="bar-grid">${values.map((value, index) => {
        const deviation = (index - 5) * 10;
        const label = `${deviation > 0 ? '+' : ''}${deviation}%`;
        return `<div class="bar-item ${deviation === 0 ? 'target' : ''}"><div class="bar-track"><div class="bar" style="--height:${value}%"><span>${value}%</span></div></div><span>${label}</span></div>`;
      }).join('')}</div>
      <p>Desvio da pressão recomendada. Série ilustrativa da <a class="text-button" href="https://olhodegatovendas2.netlify.app/#15" target="_blank" rel="noopener noreferrer">apresentação original</a>.</p>
    </figure>`;
  }

  function content(data) {
    switch (data.type) {
      case 'profile':
        return `<div class="form-surface form-grid">${profile.map(([id, label, placeholder]) => `<label class="field"><span>${label}</span><input data-profile="${id}" maxlength="100" placeholder="${placeholder}"></label>`).join('')}
          <label class="field full"><span>O que precisa melhorar na rotina de calibragem?</span><textarea data-profile="improve" maxlength="1200" rows="3" placeholder="Registre os principais pontos da conversa"></textarea></label>
        </div>`;
      case 'video':
        return `<div class="video-panel" id="video-panel"><button type="button" class="video-play" data-video="${data.video}" aria-label="Reproduzir ${data.videoLabel}"><span>${icon('play', 29)}</span>${data.videoLabel}</button></div>
          <a class="text-button video-source" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/watch?v=${data.video}">Abrir no YouTube ${icon('external', 16)}</a>`;
      case 'cost':
        return `<div class="form-surface cost-input">${numericField('Valor mensal', data.cost, state.costs[data.cost] ?? '', { max: 99999999, step: 0.01, prefix: 'R$' })}
        <button class="text-button" type="button" data-meeting-page="${data.cost === 'diesel' ? 17 : 16}">Abrir simulador ${icon('right', 17)}</button></div>`;
      case 'comparison': return comparison();
      case 'cards': return cards(data.cards);
      case 'status':
        return `<div class="info-grid">${[
          ['normal', 'Pressão adequada', 'Mantenha as verificações de rotina.'],
          ['attention', 'Atenção à pressão', 'Confira a pressão e programe a calibragem do conjunto.'],
          ['check', 'Inspeção imediata', 'Investigue a perda de pressão e verifique o pneu antes de seguir.'],
        ].map(([status, label, description]) => `<section class="info-card status-card"><span class="quick-icon ${status}">${icon('eye', 23)}</span><h3>${label}</h3><p>${description}</p></section>`).join('')}</div>`;
      case 'chart': return chart();
      case 'sim': return simulatorMarkup(data.sim, state[data.sim], Object.hasOwn(state.costs, 'diesel'));
      case 'field':
        return cards([
          ['gauge', 'Acompanhe a pressão', 'Compare as leituras antes e depois da instalação em condições semelhantes.'],
          ['shield', 'Inspecione o conjunto', 'Observe fixação, vedação e funcionamento após as rotas mais exigentes.'],
          ['clipboard', 'Registre os resultados', 'Compare os dados com a rotina anterior e consulte as condições de garantia do fabricante.'],
        ]) + '<a class="text-button video-source" href="https://olhodegatovendas2.netlify.app/#18" target="_blank" rel="noopener noreferrer">Ver o caso apresentado na referência ' + icon('external', 16) + '</a>';
      case 'board': return boardMarkup;
    }
  }

  function updateResults(kind) {
    $('#rate-value').textContent = formatNumber(state[kind].rate) + '%';
    $('#sim-result').innerHTML = simulatorResults(kind, state[kind]);
  }

  function render(focus = false) {
    const data = slides[current];
    $('[data-meeting-current]').textContent = data.chapter;
    $('[data-meeting-step]').textContent = `${String(current).padStart(2, '0')} / ${maxSlide}`;
    $('.stage-progress').value = current;
    $('[data-meeting-prev]').disabled = current === 1;
    $('[data-meeting-next]').innerHTML = current === maxSlide
      ? 'Voltar ao início ' + icon('reset', 17)
      : 'Próximo ' + icon('right', 17);
    for (const button of root.querySelectorAll('[data-meeting-chapter]')) {
      if (button.textContent.trim() === data.chapter) {
        button.setAttribute('aria-current', 'location');
        chapterSelect.value = button.dataset.meetingPage;
      } else button.removeAttribute('aria-current');
    }
    slide.className = data.type === 'hero' ? 'slide slide-hero' : 'slide slide-panel';
    slide.innerHTML = data.type === 'hero' ? hero() : heading(data) + content(data);
    if (data.cost && state.costs[data.cost] === undefined) slide.querySelector('[data-key]').value = '';
    if (data.type === 'sim') updateResults(data.sim);
    for (const input of slide.querySelectorAll('[data-profile]')) input.value = state.profile[input.dataset.profile] ?? '';
    if (data.type === 'board') activateBoard(slide, state.board, state.notes, persist);
    if (focus) $('#slide-title').focus({ preventScroll: true });
  }

  function navigate(target) {
    if (!Number.isInteger(target) || target < 1 || target > maxSlide) return;
    current = target;
    render(true);
    root.scrollIntoView({ block: 'start' });
  }

  function parsedValue(input) {
    return Math.min(Number(input.max), Math.max(Number(input.min), input.valueAsNumber || 0));
  }

  slide.addEventListener('input', event => {
    const input = event.target;
    const { key, profile: profileKey } = input.dataset;
    const { sim, cost } = slides[current];
    if (profileKey) {
      state.profile[profileKey] = input.value;
      persist();
    }
    if (key && cost) {
      if (input.value === '') delete state.costs[cost];
      else state.costs[cost] = parsedValue(input);
      persist();
    }
    if (key && sim) {
      const values = state[sim];
      const value = input.step === '1' ? Math.floor(parsedValue(input)) : parsedValue(input);
      if (key.startsWith('type-')) values.counts[key.slice(5)] = value;
      else values[key] = value;
      persist();
      updateResults(sim);
    }
  });

  slide.addEventListener('change', event => {
    const input = event.target;
    if (input.type !== 'number' || !input.dataset.key || input.value === '') return;
    const value = parsedValue(input);
    input.value = input.step === '1' ? Math.floor(value) : value;
  });

  slide.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const { sim, videoLabel } = slides[current];
    if (button.hasAttribute('data-reset')) {
      persist({ [sim]: defaultSimulation(sim) });
      render();
      $('[data-reset]').focus();
    }
    if (button.dataset.mode && state[sim].mode !== button.dataset.mode) {
      state[sim].mode = button.dataset.mode;
      persist();
      render();
      slide.querySelector('[aria-pressed="true"]').focus();
    }
    if (button.hasAttribute('data-import')) {
      state.diesel.cost = state.costs.diesel;
      persist();
      render();
      $('[data-import]').focus();
    }
    if (button.dataset.video) {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.video}?autoplay=1`;
      iframe.title = videoLabel;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      $('#video-panel').replaceChildren(iframe);
      iframe.focus();
    }
  });

  function updatePresentation(active) {
    root.classList.toggle('meeting-presenting', active);
    present.innerHTML = icon(active ? 'collapse' : 'expand', 18) + (active ? ' Sair da apresentação' : ' Modo apresentação');
    present.setAttribute('aria-pressed', String(active));
  }

  async function closePresentation() {
    updatePresentation(false);
    if (document.fullscreenElement === root) await document.exitFullscreen().catch(() => {});
  }

  present.addEventListener('click', async () => {
    if (root.classList.contains('meeting-presenting')) {
      await closePresentation();
    } else {
      updatePresentation(true);
      try {
        await root.requestFullscreen();
      } catch {
        // Presentation mode also works in browsers without fullscreen support.
      }
    }
  });

  document.addEventListener('fullscreenchange', () => {
    updatePresentation(document.fullscreenElement === root);
  });

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.meetingPage) navigate(Number(button.dataset.meetingPage));
    if (button.hasAttribute('data-meeting-prev')) navigate(current - 1);
    if (button.hasAttribute('data-meeting-next')) navigate(current === maxSlide ? 1 : current + 1);
    if (button.hasAttribute('data-meeting-new') && window.confirm('Iniciar uma nova reunião e limpar o rascunho desta sessão?')) {
      state = newDraft();
      persist();
      navigate(1);
    }
  });

  chapterSelect.addEventListener('change', () => navigate(Number(chapterSelect.value)));

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && root.classList.contains('meeting-presenting')) closePresentation();
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable]')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      navigate(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  const instance = {
    deactivate() {
      if (slide.querySelector('iframe')) render();
      if (root.classList.contains('meeting-presenting')) closePresentation();
    },
  };
  mountedMeetings.set(root, instance);
  updatePresentation(false);
  render();
  return instance;
}
