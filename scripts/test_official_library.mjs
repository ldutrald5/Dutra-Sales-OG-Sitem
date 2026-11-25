import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { filterMedia } from '../apps/sistema-og/modules/official-library/library.js';

const source = new URL('../apps/sistema-og/', import.meta.url);
const read = filename => readFileSync(new URL(filename, source), 'utf8');
const catalog = JSON.parse(read('modules/official-library/catalog.json'));
assert.equal(catalog.source, 'https://www.olhodegato.com/');
assert.equal(catalog.segments.length, 11);
assert.equal(catalog.regions.length, 5);
assert.equal(catalog.companies.length, 67);
assert.equal(filterMedia(catalog.videos, { region: 'Sul' }).filter(item => item.segmentId !== 'geral').length, 1);
assert.equal(catalog.photos.length, 79);
assert.equal(catalog.videos.length, 36);
assert.equal(new Set([...catalog.photos, ...catalog.videos].map(item => item.id)).size, 115);
for (const item of [...catalog.photos, ...catalog.videos]) {
  const preview = catalog.previews[item.thumbnailUrl || item.url];
  assert.match(preview, /^\/assets\/official-library\/[a-f0-9]{16}\.(?:webp|jpg|png)$/);
  assert.ok(statSync(new URL(preview.slice(1), source)).size > 0);
}
assert.equal(filterMedia(catalog.photos, { region: 'Sul' }).length, 24);
assert.equal(filterMedia(catalog.photos, { segment: 'bau', company: 'Lemar Transportes' }).length, 1);
assert.equal(filterMedia(catalog.videos, { category: 'ogw-frotas' }).length, 1);
assert.equal(filterMedia(catalog.videos, { query: 'instalacao', category: 'instalacao' }).length, 1);
assert.equal(filterMedia(catalog.photos, { query: 'empresa sem material' }).length, 0);
assert.match(read('index.html'), /id="official-library"/);
assert.match(read('index.html'), /<details>\s*<summary>Materiais internos já cadastrados<\/summary>/);
assert.match(read('service-worker.js'), /modules\/official-library\/catalog\.json/);
assert.match(read('service-worker.js'), /OG_REFRESH_SHELL/);
console.log('OG-20: acervo oficial completo, filtros e materiais internos preservados.');
