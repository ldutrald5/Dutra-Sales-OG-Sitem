(function attachMorningCommand(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_MORNING_COMMAND = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMorningCommand() {
  'use strict';

  const clean = value => String(value ?? '').trim();
  const asDate = value => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const dayKey = value => {
    const d = asDate(value);
    return d ? [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-') : '';
  };
  const terminal = lead => ['perdido'].includes(clean(lead?.status).toLowerCase());

  function leadName(lead = {}) {
    return clean(lead.company || lead.companyName || lead.nome || lead.name || lead.razaoSocial || lead.id);
  }

  function buildMorningCommand(input = {}) {
    const leads = Array.isArray(input.leads) ? input.leads : [];
    const operations = input.operations && typeof input.operations === 'object' ? input.operations : {};
    const now = asDate(input.now) || new Date();
    const signalCenter = input.signalCenter;
    const leadIntelligence = input.leadIntelligence;
    const automationEngine = input.automationEngine;
    if (!signalCenter?.buildSignalCenter || !signalCenter?.nextMission) throw new Error('Signal Center é obrigatório');
    if (!leadIntelligence?.score || !leadIntelligence?.nextBestAction) throw new Error('Lead Intelligence é obrigatório');

    const active = leads.filter(lead => lead?.id && !terminal(lead));
    const signals = signalCenter.buildSignalCenter(active, now, operations);
    const automationSuggestions = automationEngine?.buildSuggestions
      ? automationEngine.buildSuggestions(active, operations, now)
      : [];
    const mission = signalCenter.nextMission(active, now, (lead, ref) => leadIntelligence.score(lead, ref), operations);
    const today = dayKey(now);

    const tasks = (Array.isArray(operations.tasks) ? operations.tasks : [])
      .filter(task => !['done','completed','cancelled'].includes(clean(task.status).toLowerCase()))
      .map(task => ({ ...task, dueDate: dayKey(task.dueAt || task.dueDate || task.date) }))
      .filter(task => task.dueDate && task.dueDate <= today)
      .sort((a,b) => String(a.dueDate).localeCompare(String(b.dueDate)));

    const priorityLeadIds = new Set(signals.filter(s => ['critical','high'].includes(s.severity)).map(s => clean(s.leadId)));
    const priorityAccounts = active
      .filter(lead => priorityLeadIds.has(clean(lead.id)))
      .map(lead => {
        const nba = leadIntelligence.nextBestAction(lead, now);
        const leadSignals = signals.filter(signal => clean(signal.leadId) === clean(lead.id));
        return Object.freeze({
          leadId: clean(lead.id),
          name: leadName(lead),
          score: nba.score,
          importance: nba.importance,
          reason: leadSignals[0]?.reason || nba.reason,
          action: leadSignals[0]?.recommendedAction || nba.action,
          signalCount: leadSignals.length
        });
      })
      .sort((a,b) => b.score - a.score || a.name.localeCompare(b.name, 'pt-BR'));

    const summary = Object.freeze({
      activeAccounts: active.length,
      criticalSignals: signals.filter(s => s.severity === 'critical').length,
      highSignals: signals.filter(s => s.severity === 'high').length,
      dueTasks: tasks.length,
      automationSuggestions: automationSuggestions.length,
      priorityAccounts: priorityAccounts.length
    });

    return Object.freeze({
      generatedAt: now.toISOString(),
      summary,
      mission: mission ? Object.freeze({
        leadId: mission.leadId,
        name: leadName(active.find(lead => clean(lead.id) === clean(mission.leadId)) || {}),
        score: mission.score,
        reason: mission.reason,
        action: mission.recommendedAction,
        signal: mission.signal || null
      }) : null,
      priorityAccounts: Object.freeze(priorityAccounts.slice(0, 10)),
      signals: Object.freeze(signals.slice(0, 25)),
      dueTasks: Object.freeze(tasks.slice(0, 25)),
      automationSuggestions: Object.freeze(automationSuggestions.slice(0, 25))
    });
  }

  return { buildMorningCommand };
}));
