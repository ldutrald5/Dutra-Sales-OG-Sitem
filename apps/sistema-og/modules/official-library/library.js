const catalogUrl = new URL('./catalog.json', import.meta.url);
const official = 'https://www.olhodegato.com';
const categories = {
  flagra: 'Flagras na Estrada',
  'ogw-frotas': 'OGW Frotas',
  'formula-truck': 'Fórmula Truck',
  instalacao: 'Instalação',
  manutencao: 'Manutenção e benefícios',
  depoimentos: 'Depoimentos',
  institucional: 'Institucional e curiosidades',
};
const scopes = { overview: 'Segmentos e regiões', photo: 'Fotos', video: 'Vídeos', ogw: 'OGW Frotas' };
const normalize = value => (value ?? '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-BR');

export function filterMedia(items, { region, segment, company, category, query }) {
  const term = normalize(query?.trim());
  return items.filter(item =>
    (!region || item.region === region) &&
    (!segment || item.segmentId === segment) &&
    (!company || item.companyName === company) &&
    (!category || item.videoCategory === category) &&
    (!term || normalize([item.title, item.companyName, item.headquarters, item.subjectDetail, item.region].join(' ')).includes(term))
  );
}

function validMediaUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value, official);
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return '';
    if (url.origin === official && url.pathname.startsWith('/media/')) return url.href;
    if (['youtu.be', 'youtube.com', 'www.youtube.com', 'i.ytimg.com'].includes(url.hostname)) return url.href;
  } catch { /* Catalog link malformed. */ }
  return '';
}

function renderingUrl(value) {
  const url = new URL(value);
  const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : (url.searchParams.get('v') || url.pathname.split('/').at(-1));
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : '';
}

export async function mountOfficialLibrary(root) {
  const response = await fetch(catalogUrl);
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Catálogo indisponível');
  const catalog = await response.json();
  const escape = globalThis.OG_UI_COMPONENTS.escape;
  const $ = selector => root.querySelector(selector);
  const defaultFilters = () => ({ region: '', segment: '', company: '', category: '', query: '' });
  let filters = defaultFilters();
  let scope = 'overview';
  let visible = 24;

  const labelBySegment = Object.fromEntries(catalog.segments.map(segment => [segment.id, segment.name]));
  const records = [...catalog.photos, ...catalog.videos];
  const regionalRecords = records.filter(item => Object.hasOwn(labelBySegment, item.segmentId));
  const countBy = field => regionalRecords.reduce((counts, item) => {
    const key = item[field];
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, Object.create(null));
  const segmentCounts = countBy('segmentId');
  const regionCounts = countBy('region');
  const options = (label, items) => `<option value="">${escape(label)}</option>${items.map(([value, name]) => `<option value="${escape(value)}">${escape(name)}</option>`).join('')}`;
  root.innerHTML = `
    <section class="library-hero" aria-labelledby="official-library-title">
      <div><span class="og-kicker">CATÁLOGO OLHO DE GATO</span><h1 id="official-library-title">Biblioteca Comercial</h1><p>Aplicações reais do equalizador em frotas de todo o Brasil.</p></div>
      <a class="og-button og-button-ghost" href="${official}/" target="_blank" rel="noopener noreferrer">Abrir site oficial ↗</a>
    </section>
    <div class="official-nav" aria-label="Seções da biblioteca">
      ${Object.entries(scopes).map(([key, name]) => `<button type="button" class="og-chip" data-collection="${key}">${name}${key === 'photo' ? ' · ' + catalog.photos.length : key === 'video' ? ' · ' + catalog.videos.length : ''}</button>`).join('')}
    </div>
    <div class="official-filters clean-card" aria-label="Filtros da biblioteca">
      <label>Buscar <input type="search" data-filter="query" placeholder="Empresa, frota ou material"></label>
      <label>Região <select data-filter="region">${options('Todas as regiões', catalog.regions.map(({ region }) => [region, region]))}</select></label>
      <label>Segmento <select data-filter="segment">${options('Todos os segmentos', catalog.segments.map(({ id, name }) => [id, name]))}</select></label>
      <label>Empresa <select data-filter="company"></select></label>
    </div>
    <div class="official-results" data-results></div>
    <dialog class="official-dialog" aria-labelledby="official-media-title"><div data-media-detail></div></dialog>`;

  const results = $('[data-results]');
  const companySelect = $('[data-filter="company"]');
  const dialog = $('dialog');
  const detail = $('[data-media-detail]');

  function photo(src, alt = '') {
    const preview = catalog.previews?.[src];
    const url = /^\/assets\/official-library\/[a-f0-9]{16}\.(?:webp|jpg|png)$/.test(preview)
      ? preview : validMediaUrl(src);
    return url ? `<img alt="${escape(alt)}" src="${escape(url)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">` : '';
  }

  function card(item) {
    return `<button class="official-card" type="button" data-media-id="${escape(item.id)}">
      <span class="official-cover">${photo(item.thumbnailUrl || item.url)}${item.kind === 'video' ? `<span class="official-play" aria-hidden="true">▶ ${escape(item.duration || '')}</span>` : ''}</span>
      <span class="official-card-copy"><strong>${escape(item.title)}</strong><small>${escape([item.companyName, item.region].filter(Boolean).join(' · '))}</small></span>
    </button>`;
  }

  function overview() {
    const segments = [...catalog.segments].sort((a, b) => segmentCounts[b.id] - segmentCounts[a.id]);
    const segmentCards = segments.map(segment => `<button class="official-card" type="button" data-segment="${escape(segment.id)}">
      <span class="official-cover">${photo(segment.coverImage)}<span class="official-play">${segmentCounts[segment.id]}</span></span><span class="official-card-copy"><strong>${escape(segment.name)}</strong><small>${escape(segment.axleSpec)}</small></span></button>`);
    const regionCards = catalog.regions.map(region => `<button class="official-card" type="button" data-region="${escape(region.region)}">
      <span class="official-cover">${photo(region.coverUrl)}<span class="official-play">${regionCounts[region.region]}</span></span><span class="official-card-copy"><strong>${escape(region.region)}</strong><small>${escape(region.statesLabel)}</small></span></button>`);
    return `<section><h2>Todos os segmentos <small>${segmentCards.length}</small></h2><div class="official-grid">${segmentCards.join('')}</div></section>
      <section><h2>Regiões <small>${regionCards.length}</small></h2><div class="official-grid">${regionCards.join('')}</div></section>`;
  }

  function render() {
    const source = scope === 'photo' ? catalog.photos : scope === 'video' ? catalog.videos : regionalRecords;
    const companies = new Set(filterMedia(source, { region: filters.region, segment: filters.segment }).map(item => item.companyName));
    if (filters.company && !companies.has(filters.company)) filters.company = '';
    companySelect.innerHTML = options('Todas as empresas', [...companies].filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR')).map(name => [name, name]));
    for (const input of root.querySelectorAll('[data-filter]')) input.value = filters[input.dataset.filter];
    for (const button of root.querySelectorAll('[data-collection]')) button.setAttribute('aria-pressed', String(scope === button.dataset.collection));

    if (scope === 'ogw') {
      const item = catalog.videos.find(video => video.videoCategory === 'ogw-frotas');
      results.innerHTML = `<section><h2>OGW Frotas</h2><p>${escape(item.subjectDetail)}</p><div class="official-grid">${card(item)}</div></section>`;
      return;
    }
    if (scope === 'overview' && !Object.values(filters).some(Boolean)) {
      results.innerHTML = overview();
      return;
    }

    const items = filterMedia(source, filters);
    const videoFilters = scope === 'video' ? `<div class="official-video-filters"><label>Categoria de vídeo
      <select data-category>${options('Todas as categorias', Object.entries(categories))}</select></label></div>` : '';
    results.innerHTML = `<section><div class="official-result-head"><h2 role="status">${items.length} ${items.length === 1 ? 'material' : 'materiais'}</h2>${videoFilters}</div>
      ${items.length ? `<div class="official-grid">${items.slice(0, visible).map(card).join('')}</div>` : '<p>Nenhum material encontrado com esses filtros.</p>'}
      ${items.length > visible ? '<button class="og-button og-button-ghost" type="button" data-more-media>Carregar mais</button>' : ''}</section>`;
    const category = $('[data-category]');
    if (category) category.value = filters.category;
  }

  function showMedia(item) {
    const url = validMediaUrl(item.url);
    if (!url) return;
    const downloadable = item.kind === 'photo' || new URL(url).origin === official;
    const embed = downloadable ? '' : renderingUrl(url);
    const media = item.kind === 'photo'
      ? photo(item.url, item.title)
      : downloadable
        ? `<video controls playsinline preload="metadata" src="${escape(url)}"></video>`
        : embed ? `<iframe title="${escape(item.title)}" src="${embed}" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>` : '';
    detail.innerHTML = `<header><h2 id="official-media-title">${escape(item.title)}</h2><button type="button" class="og-button og-button-ghost" data-close-media>Fechar</button></header>
      <div class="official-media-view">${media}</div>
      <p>${escape(item.subjectDetail || '')}</p>
      <small>${escape([item.companyName, item.headquarters, labelBySegment[item.segmentId]].filter(Boolean).join(' · '))}</small>
      <a class="og-button og-button-primary" href="${escape(url)}" target="_blank" rel="noopener noreferrer">${item.kind === 'photo' ? 'Abrir foto original' : downloadable ? 'Abrir arquivo do vídeo' : 'Assistir no YouTube'} ↗</a>`;
    dialog.showModal();
  }

  root.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }, true);

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.collection) {
      scope = button.dataset.collection;
      filters = defaultFilters();
      visible = 24;
      render();
    } else if (button.dataset.segment || button.dataset.region) {
      filters = { ...defaultFilters(), segment: button.dataset.segment || '', region: button.dataset.region || '' };
      visible = 24;
      render();
      $('[data-filter="query"]').focus();
    } else if (button.dataset.mediaId) {
      showMedia(records.find(item => item.id === button.dataset.mediaId));
    } else if (button.hasAttribute('data-more-media')) {
      const firstNewCard = visible;
      visible += 24;
      render();
      results.querySelectorAll('[data-media-id]')[firstNewCard]?.focus();
    } else if (button.hasAttribute('data-close-media')) dialog.close();
  });
  root.addEventListener('input', event => {
    const key = event.target.dataset.filter;
    if (!key) return;
    if (scope === 'ogw') scope = 'overview';
    filters[key] = event.target.value;
    visible = 24;
    render();
  });
  results.addEventListener('change', event => {
    if (!event.target.hasAttribute('data-category')) return;
    filters.category = event.target.value;
    visible = 24;
    render();
    $('[data-category]')?.focus();
  });
  dialog.addEventListener('close', () => { detail.replaceChildren(); });
  render();
  return { deactivate: () => { if (dialog.open) dialog.close(); } };
}
