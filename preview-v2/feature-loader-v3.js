(() => {
'use strict';

const loaded = new Map();

function loadScript(src) {
  if (loaded.has(src)) return loaded.get(src);
  if ([...document.scripts].some(s => new URL(s.src || '', location.href).pathname === src)) {
    const done = Promise.resolve(src);
    loaded.set(src, done);
    return done;
  }
  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(src);
    script.onerror = () => reject(new Error('Falha ao carregar ' + src));
    document.head.appendChild(script);
  });
  loaded.set(src, promise);
  return promise;
}

async function loadMany(paths) {
  const results = await Promise.allSettled(paths.map(loadScript));
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length) console.warn('[DUTRA] módulos opcionais indisponíveis', failed.map(x => x.reason?.message));
  window.dispatchEvent(new CustomEvent('dutra:features',{detail:{paths,failed:failed.length}}));
}

const groups = {
  day: [
    '/core/modules/signal-center.js',
    '/core/services/automation-engine-service.js',
    '/core/services/customer-journey-service.js',
    '/core/modules/sales-desk.js',
    '/core/services/morning-command-service.js'
  ],
  prospecting: [
    '/core/modules/prospecting-engine.js',
    '/core/services/sales-brief-service.js',
    '/core/services/communication-service.js',
    '/core/services/smart-diary-service.js',
    '/core/services/spreadsheet-import-service.js'
  ]
};

let activeGroup = new Set();

function ensureGroup(id) {
  if (!groups[id] || activeGroup.has(id)) return;
  activeGroup.add(id);
  loadMany(groups[id]);
}

window.addEventListener('dutra:navigate', e => ensureGroup(e.detail?.id));

document.addEventListener('DOMContentLoaded', () => {
  const current = document.querySelector('.screen.active')?.id;
  ensureGroup(current);
  const warm = () => {
    if (!activeGroup.has('prospecting')) {
      // Warm only the small communication helpers after the first paint.
      loadMany(['/core/services/communication-service.js','/core/services/smart-diary-service.js']);
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(warm,{timeout:4500});
  else setTimeout(warm,3500);
});

window.DUTRA_FEATURE_LOADER = { loadScript, loadMany, ensureGroup, loaded };
})();