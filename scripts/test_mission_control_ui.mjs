import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../apps/sistema-og/index.html', import.meta.url), 'utf8');
const app = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../apps/sistema-og/service-worker.js', import.meta.url), 'utf8');

assert.ok(html.includes('id="btn-hero-start"'), 'Meu Dia precisa manter CTA principal');
assert.ok(html.includes('INICIAR PRÓXIMA MISSÃO'), 'CTA deve assumir linguagem de Mission Control');
assert.ok(html.includes('id="signal-center"'), 'Signal Center deve existir no Meu Dia');
assert.ok(html.includes('modules/signal-center.js'), 'Signal Center precisa carregar no shell');
assert.ok(app.includes('function renderSignalCenter()'), 'renderização do Signal Center ausente');
assert.ok(app.includes('function startNextMission()'), 'ação de próxima missão ausente');
assert.ok(app.includes('OG_SIGNAL_CENTER.nextMission'), 'Mission Control deve reutilizar o motor determinístico');
assert.ok(app.includes('OG_LEAD_INTELLIGENCE.score'), 'Mission Control deve reutilizar o score canônico');
assert.ok(sw.includes('/modules/signal-center.js'), 'novo módulo precisa funcionar offline');
assert.ok(!app.includes('missionScore'), 'não deve surgir um segundo score comercial');

console.log('Mission Control UI tests: PASS');
