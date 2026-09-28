(function attachCommandExecution(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_COMMAND_EXECUTION = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCommandExecution() {
  'use strict';

  const EVENT_TYPES = Object.freeze({
    MISSION_STARTED:'command.mission.started',
    MISSION_COMPLETED:'command.mission.completed',
    MISSION_FAILED:'command.mission.failed',
    MISSION_UNSUPPORTED:'command.mission.unsupported',
    APPROVAL_REQUESTED:'command.approval.requested',
    APPROVAL_RESOLVED:'command.approval.resolved'
  });

  const SENSITIVE_KEYS = new Set([
    'password','passwd','secret','token','access_token','accesstoken','authorization',
    'api_key','apikey','cookie','session','sessionid','refresh_token','refreshtoken'
  ]);

  function clean(value) { return String(value ?? '').trim(); }
  function iso(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    if (Number.isNaN(date.getTime())) throw new Error('Data inválida');
    return date.toISOString();
  }
  function key(value) {
    return clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'_');
  }
  function clone(value) { return JSON.parse(JSON.stringify(value ?? null)); }

  function sanitize(value, depth = 0) {
    if (depth > 7) return '[depth-limit]';
    if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return value.slice(0, 4000);
    if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitize(item, depth + 1));
    if (typeof value !== 'object') return clean(value).slice(0, 1000);
    const output = {};
    for (const [name, child] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key(name))) {
        output[name] = '[redacted]';
        continue;
      }
      output[name] = sanitize(child, depth + 1);
    }
    return output;
  }

  function requireModel(options = {}) {
    const model = options.operationsModel;
    if (!model?.migrateOperations || !model?.appendActivity) throw new Error('Operations Model é obrigatório');
    return model;
  }

  function append(operations, event, options = {}) {
    const model = requireModel(options);
    return model.appendActivity(model.migrateOperations(operations), event);
  }

  function eventId(prefix, subject, at) {
    const suffix = clean(subject).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80) || 'unknown';
    return `${prefix}-${suffix}-${Date.parse(at)}`;
  }

  function startMission(operations, route, options = {}) {
    const mission = route?.mission;
    if (!mission?.id) throw new Error('Rota exige mission.id');
    const at = iso(options.now);
    const unsupported = route.status === 'unsupported';
    const event = {
      id:clean(options.eventId) || eventId('CMD', mission.id + (unsupported ? '-UNSUPPORTED' : '-START'), at),
      type:unsupported ? EVENT_TYPES.MISSION_UNSUPPORTED : EVENT_TYPES.MISSION_STARTED,
      at,
      missionId:clean(mission.id),
      accountId:clean(mission.accountId) || null,
      capability:clean(mission.capability),
      requestedBy:clean(mission.requestedBy) || 'user',
      agentId:clean(route?.agent?.id) || null,
      status:unsupported ? 'unsupported' : 'started',
      payload:sanitize(mission.payload || {}),
      source:'command_core'
    };
    return append(operations,event,options);
  }

  function finishMission(operations, input = {}, options = {}) {
    const missionId = clean(input.missionId);
    if (!missionId) throw new Error('missionId é obrigatório');
    const status = input.status === 'failed' ? 'failed' : 'completed';
    const at = iso(options.now);
    return append(operations,{
      id:clean(options.eventId) || eventId('CMD', missionId + '-' + status.toUpperCase(), at),
      type:status === 'failed' ? EVENT_TYPES.MISSION_FAILED : EVENT_TYPES.MISSION_COMPLETED,
      at,
      missionId,
      accountId:clean(input.accountId) || null,
      capability:clean(input.capability) || null,
      agentId:clean(input.agentId) || null,
      status,
      summary:clean(input.summary).slice(0,1200),
      result:sanitize(input.result || {}),
      source:'command_core'
    },options);
  }

  function requestApproval(operations, action = {}, context = {}, options = {}) {
    const core = options.commandCore;
    if (!core?.requiresApproval) throw new Error('Command Core é obrigatório');
    if (!core.requiresApproval(action)) throw new Error('Ação não exige aprovação');
    const at = iso(options.now);
    const approvalId = clean(options.approvalId) || `approval-${Date.parse(at)}-${clean(action.type || action.id || 'action').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,48)}`;
    const pending = pendingApprovals(operations);
    if (pending.some(item => item.id === approvalId)) return requireModel(options).migrateOperations(operations);
    return append(operations,{
      id:eventId('CMD-APPROVAL-REQUEST',approvalId,at),
      type:EVENT_TYPES.APPROVAL_REQUESTED,
      at,
      approvalId,
      missionId:clean(context.missionId) || null,
      accountId:clean(context.accountId) || null,
      status:'pending',
      action:sanitize(action),
      context:sanitize(context),
      source:'command_core'
    },options);
  }

  function resolveApproval(operations, approvalId, decision, options = {}) {
    const id = clean(approvalId);
    if (!id) throw new Error('approvalId é obrigatório');
    const normalizedDecision = key(decision);
    if (!['approved','rejected'].includes(normalizedDecision)) throw new Error('Decisão deve ser approved ou rejected');
    const pending = pendingApprovals(operations).find(item => item.id === id);
    if (!pending) throw new Error('Aprovação pendente não encontrada');
    const at = iso(options.now);
    return append(operations,{
      id:eventId('CMD-APPROVAL-RESOLVE',id + '-' + normalizedDecision,at),
      type:EVENT_TYPES.APPROVAL_RESOLVED,
      at,
      approvalId:id,
      missionId:pending.missionId,
      accountId:pending.accountId,
      status:normalizedDecision,
      resolvedBy:clean(options.resolvedBy) || 'user',
      note:clean(options.note).slice(0,800),
      source:'command_core'
    },options);
  }

  function commandEvents(operations = {}) {
    return (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .filter(item => Object.values(EVENT_TYPES).includes(item?.type))
      .slice()
      .sort((a,b)=>(new Date(b.at).getTime()||0)-(new Date(a.at).getTime()||0));
  }

  function pendingApprovals(operations = {}) {
    const events = commandEvents(operations).slice().reverse();
    const map = new Map();
    for (const event of events) {
      if (event.type === EVENT_TYPES.APPROVAL_REQUESTED) {
        map.set(clean(event.approvalId),{
          id:clean(event.approvalId),
          missionId:clean(event.missionId) || null,
          accountId:clean(event.accountId) || null,
          createdAt:event.at,
          status:'pending',
          action:clone(event.action || {}),
          context:clone(event.context || {})
        });
      } else if (event.type === EVENT_TYPES.APPROVAL_RESOLVED) {
        map.delete(clean(event.approvalId));
      }
    }
    return [...map.values()].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
  }

  function executionLog(operations = {}, limit = 50) {
    return commandEvents(operations)
      .filter(item => item.type.startsWith('command.mission.'))
      .slice(0,Math.max(1,Math.min(Number(limit)||50,200)))
      .map(item => Object.freeze({
        id:item.id,
        at:item.at,
        missionId:item.missionId,
        accountId:item.accountId || null,
        capability:item.capability || null,
        agentId:item.agentId || null,
        status:item.status,
        summary:item.summary || '',
        type:item.type
      }));
  }

  function createAdapter(definition = {}) {
    const id = clean(definition.id);
    if (!id) throw new Error('Adapter exige id');
    const operations = Array.isArray(definition.operations) ? [...new Set(definition.operations.map(clean).filter(Boolean))] : [];
    const handlers = {};
    for (const op of ['read','prepare','execute','health']) {
      if (definition[op] != null && typeof definition[op] !== 'function') throw new Error(`Adapter ${id}: ${op} deve ser função`);
      if (typeof definition[op] === 'function') handlers[op] = definition[op];
    }
    return Object.freeze({ id, operations:Object.freeze(operations), ...handlers });
  }

  async function invokeAdapter(adapter, operation, input, options = {}) {
    if (!adapter?.id) throw new Error('Adapter inválido');
    const op = clean(operation);
    if (!['read','prepare','execute','health'].includes(op)) throw new Error('Operação de adapter inválida');
    if (typeof adapter[op] !== 'function') throw new Error(`Adapter ${adapter.id} não implementa ${op}`);
    if (op !== 'health' && adapter.operations?.length && !adapter.operations.includes(op)) throw new Error(`Operação ${op} não permitida para ${adapter.id}`);
    if (op === 'execute' && options.approved !== true) throw new Error('Execução externa exige aprovação explícita');
    return adapter[op](sanitize(input || {}), Object.freeze({ approved:options.approved === true }));
  }

  return Object.freeze({
    EVENT_TYPES,
    sanitize,
    startMission,
    finishMission,
    requestApproval,
    resolveApproval,
    pendingApprovals,
    executionLog,
    createAdapter,
    invokeAdapter
  });
}));
