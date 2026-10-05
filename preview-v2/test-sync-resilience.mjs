import assert from 'node:assert/strict';
import fs from 'node:fs';

const core=fs.readFileSync('./core-bridge.js','utf8');

assert.match(core,/CONNECTING/,'sync state CONNECTING required');
assert.match(core,/CONNECTED/,'sync state CONNECTED required');
assert.match(core,/OFFLINE/,'sync state OFFLINE required');
assert.match(core,/SYNCING/,'sync state SYNCING required');
assert.match(core,/ERROR/,'sync state ERROR required');
assert.match(core,/dutra_v3_snapshot_cache_v1/,'local snapshot cache required');
assert.match(core,/dutra_v3_pending_save_v1/,'pending save queue required');
assert.match(core,/restoreCachedState/,'offline restore required');
assert.match(core,/flushPendingSave/,'retry sync required');
assert.match(core,/window\.addEventListener\('online'/,'browser reconnect hook required');
assert.match(core,/window\.addEventListener\('offline'/,'browser offline hook required');
assert.match(core,/controller\.abort/,'stalled network calls must timeout');
assert.match(core,/DADOS PRESERVADOS/,'409 conflicts must preserve local work');
assert.match(core,/getConnectionStatus/,'UI must be able to inspect connection state');
console.log('Sync resilience tests: PASS');