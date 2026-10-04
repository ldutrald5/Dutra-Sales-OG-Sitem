import fs from 'node:fs';
import assert from 'node:assert/strict';

const handoff=fs.readFileSync('preview-v2/quote-handoff-v3.js','utf8');
const entry=fs.readFileSync('preview-v2/proposal-entry-v3.js','utf8');
const proxy=fs.readFileSync('preview-v2/server.mjs','utf8');
const legacy=fs.readFileSync('apps/sistema-og/app.js','utf8');
const intelligence=fs.readFileSync('apps/sistema-og/services/proposal-intelligence-service.js','utf8');

assert.match(handoff,/safeVisuals/);
assert.match(handoff,/PROPOSAL_ALLOWED/);
assert.doesNotMatch(handoff,/signedUrl\s*:/,'Handoff persistido não deve carregar signed URL');

assert.match(entry,/IMAGENS APROVADAS PARA ESTA PROPOSTA/);
assert.match(entry,/item\.usage_policy==='PROPOSAL_ALLOWED'/);
assert.match(entry,/selectedVisualIds\.size>=2/);
assert.match(entry,/visuals:selectedProposalVisuals\(\)/);

assert.match(proxy,/\/core-api\/assets\//);
assert.match(proxy,/access\?ttl=600/);
assert.match(proxy,/runtimeUrl/);
assert.match(proxy,/dutra:proposal-visuals-ready/);
assert.match(proxy,/sessionStorage\.removeItem\(key\)/);

assert.match(legacy,/function buildProposalVisualHtml\(\)/);
assert.match(legacy,/data-proposal-account-visual/);
assert.match(legacy,/assetRefs:proposalVisualRefsForTracking\(\)/);
assert.match(legacy,/safeProposalVisualUrl/);

assert.match(intelligence,/assetRefs: safeAssetRefs\(input\.assetRefs\)/);
const snapshotBlock=intelligence.slice(intelligence.indexOf('function buildSnapshot'),intelligence.indexOf('function validatePublicSnapshot'));
assert.doesNotMatch(snapshotBlock,/assetRefs/,'Asset UUIDs não devem entrar no snapshot público');

console.log('Proposal visual asset contract: PASS');
