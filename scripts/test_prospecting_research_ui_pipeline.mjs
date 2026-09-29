import assert from 'node:assert/strict'; import fs from 'node:fs';
const app=fs.readFileSync(new URL('../apps/sistema-og/app.js',import.meta.url),'utf8');
assert.match(app,/DUTRA RESEARCH/); assert.match(app,/id="research-run"/); assert.match(app,/\/api\/prospects\/research/);
assert.match(app,/OG_PROSPECTING_INTAKE\.buildResearchMission/); assert.match(app,/OG_PROSPECTING_RESEARCH\.runResearchJob/);
assert.match(app,/OG_PROSPECTING_REVIEW\?\.reviewInbox/); assert.match(app,/window\.confirm\('Adicionar '/);
assert.match(app,/researchResults=\[completed/); console.log('DUTRA-PROSPECT-07 research UI pipeline: PASS');