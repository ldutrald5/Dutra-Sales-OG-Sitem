import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateSimulation, defaultSimulation } from '../apps/sistema-og/modules/meeting/simulators.js';
import { sections, slides } from '../apps/sistema-og/modules/meeting/content.js';

assert.equal(slides.length - 1, 19);
for (const { items } of sections) {
  for (const [page, label] of items) assert.equal(slides[page].chapter, label);
}

const tires = defaultSimulation('tires');
assert.deepEqual(calculateSimulation('tires', tires), { trucks: 35, tires: 630, capital: 1260000, saved: 126, annual: 252000 });
assert.equal(calculateSimulation('tires', { ...tires, trucks: 10, rate: 10 }).annual, 36000);
assert.equal(calculateSimulation('tires', { ...tires, mode: 'types', counts: { 0: 3, 2: 2 } }).annual, 12800);
assert.equal(calculateSimulation('tires', { ...tires, trucks: 0 }).annual, 0);

const diesel = defaultSimulation('diesel');
assert.deepEqual(calculateSimulation('diesel', diesel), { total: 1050000, monthly: 52500, annual: 630000 });
assert.equal(calculateSimulation('diesel', { ...diesel, cost: 25000 }).annual, 525000);

const readApp = file => readFileSync(new URL('../apps/sistema-og/' + file, import.meta.url), 'utf8');
const index = readApp('index.html');
const app = readApp('app.js');
const worker = readApp('service-worker.js');
assert.match(index, /data-tab="reuniao"/);
assert.match(index, /id="tab-reuniao" class="tab-content hidden"/);
assert.match(app, /data-mobile-tab="reuniao"/);
assert.match(app, /import\('\.\/modules\/meeting\/meeting\.js'\)/);
for (const file of ['meeting.js', 'meeting.css', 'content.js', 'simulators.js', 'board.js', 'icons.js']) {
  assert.ok(worker.includes(`'/modules/meeting/${file}'`), `${file} precisa estar disponível no shell offline`);
}
console.log('OG-19: navegação, 19 telas, simuladores e arquivos PWA verificados.');
