import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../apps/sistema-og/index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../apps/sistema-og/styles.css', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../apps/sistema-og/service-worker.js', import.meta.url), 'utf8');

for (const id of ['modal-quick-lead','modal-import-quote','modal-import-leads','modal-item-pricing','modal-dores-ganchos']) {
  assert.match(html, new RegExp(`id="${id}"[^>]*role="dialog"[^>]*aria-modal="true"`), `${id} precisa de semântica de diálogo`);
}

assert.match(html, /aria-labelledby="import-leads-title"/);
assert.match(html, /aria-labelledby="item-pricing-name"/);
assert.match(html, /aria-labelledby="dores-ganchos-title"/);
assert.match(html, /aria-labelledby="quote-import-title"/);
assert.match(html, /ocr-preview-img[^>]*alt="Prévia da imagem carregada para OCR"/);

assert.match(app, /function openAppDialog\(/, 'controlador compartilhado de abertura ausente');
assert.match(app, /function closeAppDialog\(/, 'controlador compartilhado de fechamento ausente');
assert.match(app, /function bindAppDialog\(/, 'binding compartilhado de diálogo ausente');
assert.match(app, /event\.key === 'Escape'/, 'Escape deve fechar overlays acessíveis');
assert.match(app, /event\.key !== 'Tab'/, 'Tab deve ser tratado para retenção de foco');
assert.match(app, /returnFocus\.focus\(\)/, 'foco deve retornar ao acionador');
assert.match(app, /document\.body\.classList\.add\('og-dialog-open'\)/, 'fundo deve ser bloqueado enquanto diálogo está aberto');
assert.match(css, /body\.og-dialog-open \{ overflow: hidden; \}/);

assert.match(app, /function tabFromLocation\(\)/, 'rota por hash precisa ser recuperável');
assert.match(app, /history\.pushState\(/, 'navegação entre módulos deve criar histórico');
assert.match(app, /history\.replaceState\(/, 'rota inicial deve ser normalizada sem histórico extra');
assert.match(app, /window\.addEventListener\('popstate'/, 'voltar\/avançar deve restaurar módulo');
assert.match(app, /window\.addEventListener\('hashchange'/, 'hash editado externamente deve restaurar módulo');
assert.match(app, /focusTabHeading\(/, 'troca de módulo deve mover foco para o título');
assert.match(app, /function initDesktopNavigation\(\)/, 'desktop precisa consolidar ferramentas secundárias');
assert.match(app, /desktopSecondaryTabs = new Set/, 'lista de módulos secundários precisa ser explícita');
assert.match(css, /\.desktop-nav-more-menu/, 'menu Mais desktop precisa de layout próprio');

assert.match(app, /card\.tabIndex = 0/, 'cards clicáveis do catálogo precisam ser focáveis');
assert.match(app, /card\.setAttribute\('role', 'button'\)/, 'cards clicáveis do catálogo precisam declarar papel');
assert.match(app, /event\.key === 'Enter' \|\| event\.key === ' '/, 'cards do catálogo precisam aceitar teclado');

assert.match(sw, /const SW_VERSION = 'v65';/, 'Sales Execution P0 precisa invalidar o cache RC3');

console.log('DUTRA OS 1.0 RC3 final candidate UX tests: PASS');
