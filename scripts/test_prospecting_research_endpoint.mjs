import assert from 'node:assert/strict'; import fs from 'node:fs';
const server=fs.readFileSync(new URL('../apps/sistema-og/server.mjs',import.meta.url),'utf8');
assert.match(server,/\/api\/prospects\/research/); assert.match(server,/allowProspectResearch/);
assert.match(server,/OG_PROSPECT_SEARCH_ENDPOINT/); assert.match(server,/OG_PROSPECT_SEARCH_TOKEN/);
assert.match(server,/requestedCount=Math\.max\(1,Math\.min\(25/); assert.match(server,/setTimeout\(\(\)=>controller\.abort\(\),8000\)/);
assert.match(server,/mutationPolicy:'prepare_only'/); assert.match(server,/evidencePolicy:'public_sources_required'/);
assert.doesNotMatch(server,/OG_PROSPECT_SEARCH_TOKEN[^\n]*console/);
console.log('DUTRA-PROSPECT-06 secure research endpoint: PASS');