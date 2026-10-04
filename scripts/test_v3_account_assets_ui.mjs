import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync('preview-v2/account-assets-v3.js','utf8');
const html=fs.readFileSync('preview-v2/index.html','utf8');

assert.match(html,/data-client-tab="media"/);
assert.match(html,/data-client-panel="media"/);
assert.match(html,/account-assets-v3\.js/);

assert.match(ui,/DUTRA_CORE/);
assert.match(ui,/\.request\('\/assets/);
assert.match(ui,/\/assets\/upload/);
assert.match(ui,/x-file-name/);
assert.match(ui,/capture','environment/);
assert.match(ui,/application\/pdf/);
assert.match(ui,/image\/heic/);
assert.match(ui,/nextCursor/);
assert.match(ui,/ttl=600/);
assert.match(ui,/assetMakePrimary/);
assert.match(ui,/\/primary/);
assert.match(ui,/\/archive/);
assert.match(ui,/method:'DELETE'/);
assert.match(ui,/usage_policy/);
assert.match(ui,/sensitivity_level/);
assert.doesNotMatch(ui,/SUPABASE_SERVICE_ROLE_KEY|service_role/i);
assert.doesNotMatch(ui,/supabase\.co|createClient\(/i);

console.log('V3 account assets UI contract: PASS');
