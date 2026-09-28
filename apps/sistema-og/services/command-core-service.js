(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.OG_COMMAND_CORE = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const AUTONOMY = Object.freeze({
    READ: "read",
    PREPARE: "prepare",
    INTERNAL_WRITE: "internal_write",
    EXTERNAL_WRITE: "external_write"
  });

  const DEFAULT_AGENTS = Object.freeze([
    { id: "orchestrator", capabilities: ["mission.route"], tools: [], autonomy: AUTONOMY.READ },
    { id: "account-analyst", capabilities: ["account.analyze", "day.prepare"], tools: ["crm", "signals", "tasks"], autonomy: AUTONOMY.READ },
    { id: "prospecting-researcher", capabilities: ["prospect.research"], tools: ["public-web"], autonomy: AUTONOMY.PREPARE },
    { id: "sales-coach", capabilities: ["call.prepare", "message.prepare"], tools: ["knowledge", "crm"], autonomy: AUTONOMY.PREPARE },
    { id: "technical-specialist", capabilities: ["technical.application"], tools: ["knowledge"], autonomy: AUTONOMY.PREPARE },
    { id: "roi-analyst", capabilities: ["roi.calculate"], tools: ["crm"], autonomy: AUTONOMY.PREPARE },
    { id: "proposal-builder", capabilities: ["proposal.prepare"], tools: ["crm", "knowledge"], autonomy: AUTONOMY.PREPARE },
    { id: "follow-up-planner", capabilities: ["followup.plan"], tools: ["crm", "tasks"], autonomy: AUTONOMY.INTERNAL_WRITE },
    { id: "reviewer", capabilities: ["result.review"], tools: [], autonomy: AUTONOMY.READ }
  ]);

  const DEFAULT_INTEGRATIONS = Object.freeze([
    { id: "crm", operations: ["read", "prepare", "internal_write"], health: "local" },
    { id: "knowledge", operations: ["read"], health: "local" },
    { id: "signals", operations: ["read"], health: "local" },
    { id: "tasks", operations: ["read", "internal_write"], health: "local" },
    { id: "public-web", operations: ["read"], health: "provider_required" },
    { id: "gmail", operations: ["read", "prepare", "external_write"], health: "connector_required" },
    { id: "calendar", operations: ["read", "prepare", "external_write"], health: "connector_required" },
    { id: "drive", operations: ["read", "prepare"], health: "connector_required" },
    { id: "github", operations: ["read", "prepare", "external_write"], health: "connector_required" }
  ]);

  function createRegistry(items) {
    const map = new Map((items || []).map((item) => [item.id, Object.freeze({ ...item })]));
    return Object.freeze({
      get(id) { return map.get(id) || null; },
      list() { return Array.from(map.values()); },
      findByCapability(capability) { return Array.from(map.values()).filter((item) => (item.capabilities || []).includes(capability)); }
    });
  }

  const agentRegistry = createRegistry(DEFAULT_AGENTS);
  const integrationRegistry = createRegistry(DEFAULT_INTEGRATIONS);

  function normalizeMission(input) {
    if (!input || typeof input !== "object") throw new TypeError("mission must be an object");
    const capability = String(input.capability || "").trim();
    if (!capability) throw new TypeError("mission.capability is required");
    return Object.freeze({
      id: String(input.id || ("mission-" + Date.now())),
      capability,
      accountId: input.accountId ? String(input.accountId) : null,
      requestedBy: String(input.requestedBy || "user"),
      payload: input.payload && typeof input.payload === "object" ? { ...input.payload } : {},
      createdAt: input.createdAt || new Date().toISOString()
    });
  }

  function routeMission(input) {
    const mission = normalizeMission(input);
    const candidates = agentRegistry.findByCapability(mission.capability);
    if (!candidates.length) {
      return Object.freeze({ mission, status: "unsupported", agent: null, requiresApproval: false });
    }
    const agent = candidates[0];
    return Object.freeze({
      mission,
      status: "routed",
      agent,
      requiresApproval: agent.autonomy === AUTONOMY.EXTERNAL_WRITE
    });
  }

  function requiresApproval(action) {
    if (!action) return false;
    return action.autonomy === AUTONOMY.EXTERNAL_WRITE || action.external === true || action.irreversible === true;
  }

  function createApprovalRequest(action, context) {
    if (!requiresApproval(action)) return null;
    return Object.freeze({
      id: "approval-" + Date.now(),
      status: "pending",
      action: { ...action },
      context: context ? { ...context } : {},
      createdAt: new Date().toISOString()
    });
  }

  function createAdapter(spec) {
    if (!spec || !spec.id) throw new TypeError("adapter.id is required");
    const allowed = new Set(spec.operations || []);
    function guard(operation) {
      if (!allowed.has(operation)) throw new Error("operation not allowed: " + operation);
    }
    return Object.freeze({
      id: String(spec.id),
      operations: Object.freeze(Array.from(allowed)),
      health: typeof spec.health === "function" ? spec.health : async () => ({ status: "unknown" }),
      read: async (request) => { guard("read"); return spec.read ? spec.read(request) : null; },
      prepare: async (request) => { guard("prepare"); return spec.prepare ? spec.prepare(request) : null; },
      execute: async (request) => {
        guard("external_write");
        if (!request || request.approved !== true) throw new Error("explicit approval required");
        return spec.execute ? spec.execute(request) : null;
      }
    });
  }

  function createExecutionLog(initial) {
    const entries = Array.isArray(initial) ? initial.slice() : [];
    return Object.freeze({
      append(entry) {
        if (!entry || !entry.missionId || !entry.status) throw new TypeError("execution entry requires missionId and status");
        const record = Object.freeze({
          id: String(entry.id || ("execution-" + Date.now() + "-" + entries.length)),
          missionId: String(entry.missionId),
          accountId: entry.accountId ? String(entry.accountId) : null,
          agentId: entry.agentId ? String(entry.agentId) : null,
          integrationId: entry.integrationId ? String(entry.integrationId) : null,
          status: String(entry.status),
          evidence: Array.isArray(entry.evidence) ? entry.evidence.slice() : [],
          startedAt: entry.startedAt || new Date().toISOString(),
          finishedAt: entry.finishedAt || null,
          errorCode: entry.errorCode || null
        });
        entries.push(record);
        return record;
      },
      list() { return entries.slice(); },
      forMission(missionId) { return entries.filter((item) => item.missionId === String(missionId)); }
    });
  }

  function createApprovalQueue(initial) {
    const requests = Array.isArray(initial) ? initial.map((item) => ({ ...item })) : [];
    function find(id) {
      const item = requests.find((request) => request.id === String(id));
      if (!item) throw new Error("approval request not found");
      return item;
    }
    return Object.freeze({
      enqueue(action, context) {
        const request = createApprovalRequest(action, context);
        if (!request) return null;
        requests.push({ ...request });
        return { ...request };
      },
      approve(id, actor, at) {
        const item = find(id);
        if (item.status !== "pending") throw new Error("approval request already decided");
        item.status = "approved";
        item.decidedBy = String(actor || "user");
        item.decidedAt = at || new Date().toISOString();
        return { ...item };
      },
      reject(id, actor, at) {
        const item = find(id);
        if (item.status !== "pending") throw new Error("approval request already decided");
        item.status = "rejected";
        item.decidedBy = String(actor || "user");
        item.decidedAt = at || new Date().toISOString();
        return { ...item };
      },
      pending() { return requests.filter((item) => item.status === "pending").map((item) => ({ ...item })); },
      list() { return requests.map((item) => ({ ...item })); }
    });
  }

  return Object.freeze({
    AUTONOMY,
    agentRegistry,
    integrationRegistry,
    normalizeMission,
    routeMission,
    requiresApproval,
    createApprovalRequest,
    createAdapter,
    createExecutionLog,
    createApprovalQueue
  });
});
