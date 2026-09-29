import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../apps/sistema-og/styles.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../apps/sistema-og/service-worker.js', import.meta.url), 'utf8');
const manifest = JSON.parse(fs.readFileSync(new URL('../apps/sistema-og/manifest.webmanifest', import.meta.url), 'utf8'));

assert.match(app, /async function initServiceWorkerUpdates\(\)/, 'PWA precisa de controlador explícito de atualização');
assert.match(app, /navigator\.serviceWorker\.addEventListener\('controllerchange'/, 'troca de versão precisa ser detectada');
assert.match(app, /showPwaUpdateNotice\(\)/, 'nova versão precisa ser comunicada ao usuário');
assert.match(app, /data-pwa-update-now/, 'atualização deve exigir ação explícita');
assert.match(app, /data-pwa-update-later/, 'usuário deve poder adiar atualização');
assert.match(app, /pwaReloadRequested = true;\s*location\.reload\(\)/, 'reload deve acontecer somente após confirmação');
assert.doesNotMatch(app, /controllerchange[\s\S]{0,220}location\.reload\(\)/, 'controllerchange não pode recarregar a tela silenciosamente');
assert.match(app, /aria-controls="og-mobile-more-sheet"/, 'menu Mais precisa apontar para a folha controlada');
assert.match(app, /aria-haspopup="menu"/, 'menu Mais precisa declarar popup');
assert.match(app, /event\.key === 'Escape'/, 'menu Mais deve fechar com Escape');
assert.match(app, /moreButton\?\.focus\(\)/, 'fechamento por teclado deve devolver foco ao acionador');
assert.match(app, /document\.addEventListener\('pointerdown'/, 'toque fora deve fechar a folha Mais');

assert.match(css, /input, select, textarea, button \{ min-height: 44px; \}/, 'alvos móveis principais devem ter no mínimo 44px');
assert.match(css, /\.og-mobile-more-sheet[\s\S]*max-height: min\(68vh, 560px\)/, 'folha Mais deve caber em telas móveis curtas');
assert.match(css, /\.og-update-banner/, 'banner de atualização precisa de estilo próprio');
assert.match(css, /\.og-update-actions button \{ min-height:44px;/, 'ações do update precisam respeitar alvo móvel');

assert.match(sw, /const SW_VERSION = 'v63';/, 'RC2C precisa invalidar o cache PWA anterior');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, '/');
assert.ok(String(manifest.start_url || '').startsWith('/'), 'PWA deve iniciar dentro do escopo');

console.log('PWA release experience tests: PASS');
