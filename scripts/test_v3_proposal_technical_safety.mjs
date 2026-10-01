import fs from 'node:fs';import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../preview-v2/core-bridge.js',import.meta.url),'utf8');
const block=src.slice(src.indexOf('function publishProposal()'),src.indexOf('function bindProposal()',src.indexOf('function publishProposal()')));
for(const forbidden of ["id:'rodotrem'","vehicleTypeId:'rodotrem'","libras:120","code:'EQ-120'","qty * 16"])assert.equal(block.includes(forbidden),false,'technical default leaked: '+forbidden);
assert.match(block,/DUTRA_QUOTE_HANDOFF/);assert.match(block,/handoff\.launch/);console.log('V3 proposal technical safety: OK');