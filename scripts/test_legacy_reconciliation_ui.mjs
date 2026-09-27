import fs from 'node:fs';
import assert from 'node:assert/strict';

const app=fs.readFileSync(new URL('../apps/sistema-og/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../apps/sistema-og/index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../apps/sistema-og/service-worker.js',import.meta.url),'utf8');

assert.ok(html.includes('services/legacy-reconciliation-service.js'),'serviço 05R não carregado');
assert.ok(sw.includes("'/services/legacy-reconciliation-service.js'"),'serviço 05R fora do shell offline');
assert.ok(app.includes('Gerar prévia dry-run'),'prévia 05R ausente');
assert.ok(app.includes('Nenhuma seleção vem marcada por padrão.'),'aprovação não pode vir pré-selecionada');
assert.ok(app.includes('Aplicar selecionados com checkpoint'),'aplicação controlada ausente');
assert.ok(app.includes('createLegacyReconciliationCheckpoint'),'checkpoint obrigatório ausente');
assert.ok(app.includes("OG_DATA_SAFETY.saveLocalSnapshot(backup)"),'checkpoint deve persistir em IndexedDB');
assert.ok(app.includes("OG_LEGACY_RECONCILIATION.applyApproved("),'apply deve passar pelo serviço guardado');
assert.ok(app.includes("confirmed: true"),'apply deve registrar confirmação explícita');
assert.ok(app.includes('pendingSyncConflict() || pendingSyncReview()'),'reconciliação deve bloquear com sync pendente');
assert.ok(app.includes('Desfazer última aplicação'),'rollback explícito ausente');
assert.ok(app.includes("type: 'legacy.reconciliation.rolled_back'"),'rollback deve deixar trilha de auditoria');
assert.ok(app.includes("localStorage.removeItem(LEGACY_RECONCILIATION_ROLLBACK_MARKER)"),'rollback concluído deve limpar marker');
assert.ok(app.includes('Exportar plano'),'plano dry-run deve ser exportável para auditoria');
assert.ok(!app.includes('data-reconcile-select') || !app.includes('data-reconcile-select=\"') || app.includes("actionable ? '' : 'disabled'"),'linhas não elegíveis devem ser bloqueadas');
console.log('Legacy reconciliation UI checks: PASS');
