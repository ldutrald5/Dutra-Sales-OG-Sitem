/* Sistema OG — Service Worker
 * Estratégias:
 *  - Shell crítico: precache na instalação (app abre offline)
 *  - Imagens premium: cache sob demanda (não bloqueiam install)
 *  - Navegação: network-first → fallback index.html
 *  - API (/api/*): sempre rede (nunca cache)
 *  - Demais GET same-origin: stale-while-revalidate
 */
const SW_VERSION = 'v23';
const CACHE_SHELL = `sistema-og-shell-${SW_VERSION}`;
const CACHE_RUNTIME = `sistema-og-runtime-${SW_VERSION}`;
const SYNC_DB = 'sistema-og-sync';
const SYNC_STORE = 'outbox';
const SYNC_TAG = 'og-sync-state';

const SHELL_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/data.js',
  '/operations-model.js',
  '/services/crm-service.js',
  '/services/interaction-service.js',
  '/services/whatsapp-service.js',
  '/services/call-ai-context.js',
  '/services/knowledge-selector.js',
  '/services/call-ai-prompts.js',
  '/services/ai-service.js',
  '/services/communication-service.js',
  '/knowledge/og-sales-brain.json',
  '/services/prospect-parser.js',
  '/modules/sales-desk.js',
  '/modules/prospecting-engine.js',
  '/components/ui-components.js',
  '/material-store.js',
  '/sales-materials.js',
  '/performance-engine.js',
  '/manifest.webmanifest',
  '/assets/vendor/tailwindcss.js',
  '/assets/vendor/xlsx.full.min.js',
  '/services/spreadsheet-import-service.js',
  '/assets/logo-olho-de-gato.jpg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

const PREFETCH_MEDIA = [
  '/assets/premium/optimized/hero-desktop-1280.webp',
  '/assets/premium/optimized/hero-mobile-640.webp',
  '/assets/premium/optimized/produto-og-768.webp',
  '/assets/premium/optimized/caminhoes-pesados-960.webp',
  '/assets/premium/optimized/caminhoes-medios-960.webp'
];

const MEDIA_EXT = /\.(webp|png|jpe?g|gif|svg|ico|woff2?)$/i;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_SHELL);
    await Promise.all(
      SHELL_URLS.map(async url => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) await cache.put(url, res);
        } catch (_) {}
      })
    );
    self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([CACHE_SHELL, CACHE_RUNTIME]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
    caches.open(CACHE_RUNTIME).then(cache => {
      PREFETCH_MEDIA.forEach(url => {
        fetch(url, { cache: 'no-cache' })
          .then(res => (res.ok ? cache.put(url, res) : null))
          .catch(() => {});
      });
    });
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'FLUSH_OUTBOX') {
    event.waitUntil(flushOutbox().then(ok => {
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ ok });
    }));
  }
});

self.addEventListener('sync', event => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushOutbox());
  }
});

function openSyncDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SYNC_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SYNC_STORE)) db.createObjectStore(SYNC_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function readOutbox() {
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readonly');
    const req = tx.objectStore(SYNC_STORE).get('state');
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function clearOutbox() {
  const db = await openSyncDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE, 'readwrite');
    tx.objectStore(SYNC_STORE).delete('state');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function flushOutbox() {
  const pending = await readOutbox();
  if (!pending || !pending.body) return true;
  const body = { ...pending.body, forceMerge: true };
  const response = await fetch(pending.url || '/api/state', {
    method: pending.method || 'PUT',
    headers: pending.headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (response.status === 409) throw new Error('Background sync: conflito de revision');
  if (!response.ok) throw new Error(`Background sync falhou: ${response.status}`);
  await clearOutbox();
  const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clientsList.forEach(client => client.postMessage({ type: 'OG_SYNC_COMPLETE', revision: null }));
  return true;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(req));
    return;
  }
  if (MEDIA_EXT.test(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(req, CACHE_RUNTIME));
    return;
  }
  event.respondWith(staleWhileRevalidate(req));
});

async function networkFirstNavigation(req) {
  try {
    const fresh = await fetch(req);
    if (fresh && fresh.ok) {
      const cache = await caches.open(CACHE_SHELL);
      cache.put('/index.html', fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch (_) {
    const cached = (await caches.match(req)) || (await caches.match('/index.html')) || (await caches.match('/'));
    if (cached) return cached;
    return offlineFallbackPage();
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) {
    fetch(req).then(async res => {
      if (res && res.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(req, res);
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (_) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_SHELL);
  const cached = await cache.match(req);
  const networkPromise = fetch(req).then(async res => {
    if (res && res.ok) await cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (cached) {
    networkPromise.catch(() => {});
    return cached;
  }
  const fresh = await networkPromise;
  if (fresh) return fresh;
  if (req.headers.get('accept')?.includes('text/html')) {
    return (await caches.match('/index.html')) || offlineFallbackPage();
  }
  return new Response('Recurso indisponível offline', {
    status: 503,
    statusText: 'Offline',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

function offlineFallbackPage() {
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sistema OG — Offline</title>
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#070707;color:#f8fafc;font-family:system-ui,sans-serif;padding:1.5rem;text-align:center}
h1{font-size:1.25rem;margin:0 0 .5rem;color:#ffde17}p{color:#94a3b8;font-size:.9rem;max-width:28rem;line-height:1.5}
button{margin-top:1.25rem;padding:.65rem 1.2rem;border:0;border-radius:.6rem;background:#ffde17;color:#0b0f14;font-weight:700;cursor:pointer}</style></head>
<body><div><h1>Sistema OG</h1><p>Você está offline e o cache ainda não tem esta tela. Conecte-se uma vez para sincronizar o aplicativo.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
