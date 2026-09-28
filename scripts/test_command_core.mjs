import fs from "node:fs";
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
console.log("command core tests: ok");

const html=fs.readFileSync("apps/sistema-og/index.html","utf8");
const sw=fs.readFileSync("apps/sistema-og/service-worker.js","utf8");
assert.match(html,/command-core-service\.js/,"Command Core must load in the app shell");
assert.match(sw,/command-core-service\.js/,"Command Core must be cached for offline use");
