import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const core = require("../apps/sistema-og/services/command-core-service.js");

assert.ok(core.agentRegistry.list().length >= 9, "agent registry should expose the initial team");
assert.ok(core.integrationRegistry.get("crm"), "CRM integration must exist");

const day = core.routeMission({ id: "m1", capability: "day.prepare", requestedBy: "lucas" });
assert.equal(day.status, "routed");
assert.equal(day.agent.id, "account-analyst");
assert.equal(day.requiresApproval, false);

const unknown = core.routeMission({ capability: "moon.launch" });
assert.equal(unknown.status, "unsupported");

assert.equal(core.requiresApproval({ autonomy: core.AUTONOMY.PREPARE }), false);
assert.equal(core.requiresApproval({ autonomy: core.AUTONOMY.EXTERNAL_WRITE }), true);
assert.equal(core.requiresApproval({ external: true }), true);

const safe = core.createApprovalRequest({ autonomy: core.AUTONOMY.PREPARE }, {});
assert.equal(safe, null);

const risky = core.createApprovalRequest({ autonomy: core.AUTONOMY.EXTERNAL_WRITE, type: "email.send" }, { accountId: "a1" });
assert.equal(risky.status, "pending");
assert.equal(risky.action.type, "email.send");

assert.throws(() => core.normalizeMission({}), /capability/);

const log = core.createExecutionLog();
log.append({ missionId: "m1", agentId: "account-analyst", status: "started" });
assert.equal(log.forMission("m1").length, 1);

const queue = core.createApprovalQueue();
const approval = queue.enqueue({ autonomy: core.AUTONOMY.EXTERNAL_WRITE, type: "email.send" }, { accountId: "a1" });
assert.equal(queue.pending().length, 1);
queue.approve(approval.id, "lucas", "2026-09-28T12:00:00.000Z");
assert.equal(queue.pending().length, 0);

const adapter = core.createAdapter({
  id: "test-mail",
  operations: ["read", "external_write"],
  read: async () => ({ ok: true }),
  execute: async () => ({ sent: true })
});
assert.deepEqual(await adapter.read({}), { ok: true });
await assert.rejects(() => adapter.execute({ approved: false }), /approval/);
assert.deepEqual(await adapter.execute({ approved: true }), { sent: true });

console.log("command core tests: ok");
