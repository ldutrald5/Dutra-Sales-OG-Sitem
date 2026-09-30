import assert from 'node:assert/strict';
import fs from 'node:fs';

const core=fs.readFileSync(new URL('../preview-v2/core-bridge.js',import.meta.url),'utf8');
const connection=fs.readFileSync(new URL('../apps/sistema-og/services/connection-state-service.js',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../preview-v2/index.html',import.meta.url),'utf8');
const server=fs.readFileSync(new URL('../preview-v2/server.mjs',import.meta.url),'utf8');
const actions=fs.readFileSync(new URL('../preview-v2/sales-action-center-v3.js',import.meta.url),'utf8');
const technical=fs.readFileSync(new URL('../preview-v2/technical-center-v3.js',import.meta.url),'utf8');
const day=fs.readFileSync(new URL('../preview-v2/meu-dia-v3.js',import.meta.url),'utf8');

const connectionScript=index.indexOf('/core/services/connection-state-service.js');
const syncScript=index.indexOf('/core/services/sync-bridge-service.js');
const bridgeScript=index.indexOf('/core-bridge.js');
assert.ok(connectionScript>=0&&syncScript>connectionScript&&bridgeScript>syncScript,'serviços P0 devem carregar antes do core bridge');

assert.match(server,/localCoreServices/);
assert.match(server,/connection-state-service\.js/);
assert.match(server,/sync-bridge-service\.js/);

assert.match(core,/function enqueueBusinessMutation/);
assert.match(core,/function acknowledgePendingMutations/);
assert.match(core,/getPendingMutations/);
assert.match(core,/navigator\.onLine===false/);
assert.match(connection,/SALVO NESTE APARELHO · SINCRONIZAÇÃO PENDENTE/);
assert.match(connection,/SALVO ✓/);
assert.match(connection,/TENTAR NOVAMENTE/);
assert.match(core,/TENTAR NOVAMENTE/);
assert.match(core,/BASE INDISPONÍVEL · TENTAR NOVAMENTE/);

const saveStart=core.indexOf('async function saveState');
const saveEnd=core.indexOf('\n  function sortedLeads',saveStart);
const saveBlock=core.slice(saveStart,saveEnd);
const localQueue=saveBlock.indexOf("queuePendingSave(payload,'saving')");
const mutationQueue=saveBlock.indexOf('enqueueBusinessMutation');
const networkWrite=saveBlock.indexOf("api('/state'");
const ack=saveBlock.indexOf('acknowledgePendingMutations');
assert.ok(localQueue>=0,'snapshot deve ser persistido antes da tentativa de rede');
assert.ok(mutationQueue>localQueue,'mutation granular deve ser registrada depois do snapshot recovery');
assert.ok(networkWrite>mutationQueue,'rede só deve ser tentada depois da persistência local');
assert.ok(ack>networkWrite,'mutation só pode ser confirmada depois da resposta do backend');

const flushStart=core.indexOf('async function flushPendingSave');
const flushEnd=core.indexOf('\n  async function loginFromForm',flushStart);
const flushBlock=core.slice(flushStart,flushEnd);
assert.ok(flushBlock.indexOf("api('/state'")>=0,'replay deve reutilizar PUT /state');
assert.ok(flushBlock.indexOf('acknowledgePendingMutations')>flushBlock.indexOf("api('/state'"),'replay só confirma mutations após PUT');
assert.match(flushBlock,/saveQueued/);
assert.match(flushBlock,/saveFailed/);
assert.match(flushBlock,/scheduleReconnect/);

assert.match(actions,/RECORD_CALL_OUTCOME_AND_NEXT_ACTION/);
assert.match(actions,/SCHEDULE_NEXT_ACTION/);
assert.match(actions,/COMPLETE_NEXT_ACTION/);
assert.match(technical,/SAVE_TECHNICAL_CONFIG/);
assert.match(day,/APPLY_AUTOMATION_NEXT_ACTION/);
assert.match(core,/SAVE_PROPOSAL_DRAFT/);

console.log('V3 P0 connection/sync/save contract: PASS');
