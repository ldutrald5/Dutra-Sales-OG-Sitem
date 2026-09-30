import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync(new URL('../apps/sistema-og/app.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../apps/sistema-og/index.html', import.meta.url), 'utf8');
const sw = fs.readFileSync(new URL('../apps/sistema-og/service-worker.js', import.meta.url), 'utf8');
const server = fs.readFileSync(new URL('../apps/sistema-og/server.mjs', import.meta.url), 'utf8');
const gateway = fs.readFileSync(new URL('../apps/sistema-og/server-sales-execution-gateway.cjs', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../apps/sistema-og/services/sales-execution-service.js', import.meta.url), 'utf8');
const controller = fs.readFileSync(new URL('../apps/sistema-og/components/sales-execution-controller.js', import.meta.url), 'utf8');
const ui = fs.readFileSync(new URL('../apps/sistema-og/components/sales-execution-ui.js', import.meta.url), 'utf8');

assert.match(html, /data-prospect-view="lists"/, 'Prospecção deve expor Listas sem criar módulo paralelo');
assert.match(html, /services\/sales-execution-service\.js/);
assert.match(html, /components\/sales-execution-controller\.js/);
assert.match(html, /components\/sales-execution-ui\.js/);
assert.match(sw, /sales-execution-service\.js/);
assert.match(sw, /sales-execution-controller\.js/);
assert.match(sw, /sales-execution-ui\.js/);
assert.match(sw, /SW_VERSION = 'v65'/);

for (const route of [
  '/api/sales-execution/lists',
  '/api/sales-execution/lists/import',
  '/api/sales-execution/sessions',
  '/results',
  '/decision-maker',
  '/meetings',
  '/advance'
]) assert.ok(gateway.includes(route), 'Gateway ausente: ' + route);

assert.match(server, /salesExecutionHttpHandler/);
assert.match(server, /if \(await salesExecutionHttpHandler\(req, res, url\)\) return;/);
assert.match(gateway, /OG_SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(service + controller + ui + app, /OG_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY/);
assert.doesNotMatch(service + controller + ui + app, /\/rest\/v1\//);
assert.doesNotMatch(gateway, /session_queue/i, 'P0 não deve criar session_queue');
assert.match(gateway, /work_status: 'in\.\(AVAILABLE,IN_PROGRESS\)'/);
assert.match(gateway, /current_member_id/);
assert.match(gateway, /external_id: externalId/);
assert.match(controller, /service\.recordResult/);
assert.match(controller, /service\.saveDecisionMaker/);
assert.match(controller, /service\.scheduleMeeting/);
assert.doesNotMatch(controller, /lead\.interactions\.push/);
assert.doesNotMatch(service, /lead\.interactions\.push/);
assert.match(controller, /REUNIÃO MARCADA ✓/);
assert.match(ui, /data-sales-call-ai/);
assert.match(ui, /data-sales-meeting/);
assert.match(ui, /data-sales-decision/);
assert.match(ui, /data-sales-save-result/);
assert.match(app, /saveSalesExecutionCallAIReview/);
assert.match(app, /controller\.recordCallAIResult/);
assert.match(app, /salesExecution: execution/);
assert.match(app, /executionBrief/);

console.log('Sales Execution UI/gateway integration checks: PASS');
