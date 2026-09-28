import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('apps/sistema-og/app.js','utf8');
const styles = fs.readFileSync('apps/sistema-og/styles.css','utf8');
const sw = fs.readFileSync('apps/sistema-og/service-worker.js','utf8');
const directive = fs.readFileSync('docs/product/DUTRA_OS_PRODUCT_DIRECTIVE_2026-09-28.md','utf8');
const baseline = fs.readFileSync('docs/roadmap/BASELINE_2026-09-28.md','utf8');
const context = fs.readFileSync('EXECUTION_CONTEXT.md','utf8');
const claude = fs.readFileSync('.claude/CLAUDE.md','utf8');

assert.match(app,/ACCOUNT 360/);
assert.match(app,/OG_LEAD_INTELLIGENCE\?\.nextBestAction/);
assert.match(app,/OG_SIGNAL_CENTER\?\.signalsForLead/);
assert.match(app,/data-account-signal-severity/);
assert.match(app,/COMMAND CENTER 2\.0/);
assert.match(app,/call\s\*ai/);
assert.match(app,/brain\|sales\\s\*brain\|conhecimento\|pesquisar/);
assert.match(app,/\/api\/knowledge\/search/);
assert.match(app,/data-command-knowledge/);
assert.match(app,/state\.communication\.selectedLeadId = lead\.id/);
assert.match(app,/refreshQuoteClientSheetAccess\(\)/);

assert.match(styles,/CIC-03 — Account 360 \+ Command Center 2\.0/);
assert.match(styles,/\.account-360-now/);
assert.match(styles,/\.command-section-title/);
assert.match(sw,/SW_VERSION = 'v42'/);

assert.match(directive,/Sales Operating System vertical/);
assert.match(directive,/Não criar segunda fonte de verdade/);
assert.match(baseline,/Mission Control/);
assert.match(baseline,/Proposal Tracking seguro/);
assert.match(context,/Volume: `sistema-og-data` montado em `\/data`/);
assert.match(claude,/DUTRA OS — PROJECT OVERLAY/);
assert.match(claude,/Node: `>=24 <25`/);

console.log('CIC-03 baseline smoke: PASS');
