import fs from 'node:fs';
import assert from 'node:assert/strict';
const app=fs.readFileSync(new URL('../apps/sistema-og/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../apps/sistema-og/index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../apps/sistema-og/service-worker.js',import.meta.url),'utf8');

assert.ok(html.includes('services/sync-conflict-service.js'),'serviço de conflito não carregado');
assert.ok(sw.includes("'/services/sync-conflict-service.js'"),'serviço de conflito fora do shell offline');
assert.ok(app.includes("OG_SYNC_CONFLICT.createConflict("),'409 deve criar snapshot de conflito');
assert.ok(app.includes("sessionStorage.setItem('og_sync_conflict'"),'conflito deve ser preservado na sessão');
assert.ok(app.includes("if (pendingSyncConflict())"),'novo sync deve parar enquanto conflito estiver pendente');
assert.ok(app.includes('Revisar sem sobrescrever'),'UX de revisão ausente');
assert.ok(app.includes('Usar versão do servidor'),'opção explícita de servidor ausente');
assert.ok(app.includes('Nada será enviado ao servidor até você confirmar novamente.'),'revisão deve declarar ausência de envio automático');
assert.ok(!app.includes("if(response.status===409){\n          const remote=await response.json();\n          const merged=OG_DATA_SAFETY.mergeBackup"),'merge/reenvio silencioso antigo ainda presente');
assert.ok(!app.includes("response=await apiFetch('/api/state',{method:'PUT',body:JSON.stringify({...merged,revision:Number(remote.revision||0)})})"),'reenvio automático após 409 ainda presente');
console.log('Sync conflict UI integration tests: PASS');