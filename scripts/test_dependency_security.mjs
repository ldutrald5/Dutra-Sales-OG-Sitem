import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const fromCore = createRequire(require.resolve('@aiox-squads/core/package.json'));
const Handlebars = fromCore('handlebars');
const {TemplateRenderer} = require('../.aiox-core/product/templates/engine/renderer.js');

// Exercise the existing consumer, not just the package's version string.
const renderer = new TemplateRenderer();
assert.equal(renderer.render('{{uppercase name}}:{{#each items}}{{this}}{{/each}}', {
  name: 'dutra', items: ['A', 'B'],
}), 'DUTRA:AB');
assert.equal(Handlebars.compile('{{name}}')({name: '<client>'}), '&lt;client&gt;');

// GHSA-8r5x-fm3f-whwj: malformed AST fields must not enter generated code.
// The probe is deliberately limited to an in-memory boolean (no I/O or shell).
const ast = Handlebars.parse('{{#missingHelper}}{{/missingHelper}}');
const probeKey = '__dutraDependencySecurityProbe';
assert.equal(Object.hasOwn(globalThis, probeKey), false);
ast.body[0].program.blockParams = {
  length: '(()=>{globalThis.__dutraDependencySecurityProbe=true;return 0})()',
};
try {
  assert.throws(() => Handlebars.compile(ast)({}), /Invalid AST/);
  assert.equal(Object.hasOwn(globalThis, probeKey), false, 'AST payload must not execute');
} finally {
  delete globalThis[probeKey];
}

// Resolve through Miniflare to cover the actual overridden transitive consumer.
const fromMiniflare = createRequire(require.resolve('miniflare'));
const sharp = fromMiniflare('sharp');
const appSharp = require('sharp');
assert.equal(appSharp, sharp, 'asset optimizer and Miniflare should resolve the patched library');
assert.equal(sharp.versions.sharp, '0.35.5');
const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="4"><rect width="8" height="4" fill="#ffde17"/></svg>');
const webp = await sharp(svg).resize({width: 4, withoutEnlargement: true})
  .webp({quality: 82, effort: 5, alphaQuality: 90}).toBuffer();
const webpInfo = await sharp(webp).metadata();
assert.deepEqual([webpInfo.format, webpInfo.width, webpInfo.height], ['webp', 4, 2]);
const png = await sharp(webp).resize(3, 3, {fit: 'cover', position: 'centre'})
  .png({compressionLevel: 9}).toBuffer();
const pngInfo = await sharp(png).metadata();
assert.deepEqual([pngInfo.format, pngInfo.width, pngInfo.height], ['png', 3, 3]);

// Boot the unchanged Miniflare/Workerd pair locally after overriding its Sharp.
const {Miniflare, convertV4MiniflareOptions} = require('miniflare');
const options = await convertV4MiniflareOptions({
  modules: true,
  compatibilityDate: '2026-09-19',
  script: 'export default { fetch() { return new Response("dependency-smoke"); } };',
});
const mf = new Miniflare(options);
try {
  const response = await mf.dispatchFetch('http://localhost/');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'dependency-smoke');
} finally {
  await mf.dispose();
}

console.log(`Dependency security regression: PASS (Handlebars ${Handlebars.VERSION}, Sharp ${sharp.versions.sharp}, libvips ${sharp.versions.vips})`);
