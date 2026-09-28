(function attachMorningCommand(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_MORNING_COMMAND = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMorningCommand() {
  'use strict';

  const LIFECYCLE_SIGNAL_TYPES = new Set([
    'installation_pending','test_ending','satisfied_without_referral',
    'fleet_expansion_gap','replacement_review_due'
  ]);

  function clean(value) { return String(value ?? '').trim(); }
  function asDate(value) {
    const date = value instanceof Date ? value : new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function safeCalendarEvent(item = {}) {
    return Object.freeze({
      id:clean(item.id) || null,
      title:clean(item.title || item.summary).slice(0,180),
      start:clean(item.start || item.startAt).slice(0,80),
      end:clean(item.end || item.endAt).slice(0,80),
      accountId:clean(item.accountId) || null
    });
  }
  function leadLabel(lead = {}) { return clean(lead.empresa || lead.nome) || 'Conta'; }

  function build(input = {}, deps = {}) {
    const leads = Array.isArray(input.leads) ? input.leads : [];
    const operations = input.operations && typeof input.operations === 'object' ? input.operations : {};
    const now = asDate(input.now) || new Date();
    const salesDesk = deps.salesDesk;
    const intelligence = deps.leadIntelligence;
    const signalCenter = deps.signalCenter;
    const automation = deps.automationEngine;

    if (!salesDesk?.selectQueue) throw new Error('Sales Desk é obrigatório');
    if (!intelligence?.score) throw new Error('Lead Intelligence é obrigatório');
    if (!signalCenter?.buildSignalCenter || !signalCenter?.nextMission) throw new Error('Signal Center é obrigatório');

    const all = salesDesk.selectQueue(leads,'all','',now);
    const overdue = salesDesk.selectQueue(leads,'overdue','',now);
    const today = salesDesk.selectQueue(leads,'today','',now);
    const priority = salesDesk.selectQueue(leads,'priority','',now);
    const noAction = salesDesk.selectQueue(leads,'no-action','',now);
    const signals = signalCenter.buildSignalCenter(leads,now,operations);
    const mission = signalCenter.nextMission(leads,now,(lead,reference)=>intelligence.score(lead,reference),operations);
    const suggestions = automation?.buildSuggestions ? automation.buildSuggestions(leads,operations,now) : [];

    const proposalEvents = (Array.isArray(operations.activityEvents) ? operations.activityEvents : [])
      .filter(item => ['proposal.sent','proposal.opened','proposal.reopened'].includes(item?.type))
      .filter(item => {
        const at=asDate(item.at);
        return at && now.getTime()-at.getTime() >= 0 && now.getTime()-at.getTime() <= 7*86400000;
      });
    const lifecycleSignals = signals.filter(item => LIFECYCLE_SIGNAL_TYPES.has(item.type));
    const topAccounts = all.slice(0,5).map(lead => Object.freeze({
      leadId:clean(lead.id),
      label:leadLabel(lead),
      score:intelligence.score(lead,now),
      nextAction:clean(lead.nextAction),
      followUpAt:clean(lead.followUpAt) || null,
      priority:clean(lead.priority || lead.priorityBand) || 'media',
      temperature:clean(lead.temperature) || null
    }));

    const calendarConnected = input.calendarConnected === true;
    const calendarEvents = calendarConnected && Array.isArray(input.calendarEvents)
      ? input.calendarEvents.slice(0,10).map(safeCalendarEvent)
      : [];

    const counts = Object.freeze({
      active:all.length,
      overdue:overdue.length,
      today:today.length,
      priority:priority.length,
      noAction:noAction.length,
      signals:signals.length,
      automations:suggestions.length,
      proposalSignals7d:proposalEvents.length,
      lifecycle:lifecycleSignals.length,
      calendar:calendarEvents.length
    });

    const lines = [];
    if (counts.overdue) lines.push(`${counts.overdue} retorno(s) vencido(s) precisam de decisão.`);
    if (counts.today) lines.push(`${counts.today} retorno(s) estão marcados para hoje.`);
    if (counts.signals) lines.push(`${counts.signals} sinal(is) comercial(is) estão ativos.`);
    if (counts.automations) lines.push(`${counts.automations} rotina(s) podem virar próxima ação.`);
    if (counts.lifecycle) lines.push(`${counts.lifecycle} oportunidade(s) de pós-venda/expansão merecem atenção.`);
    if (!lines.length) lines.push('Carteira ativa sem pendência crítica detectada pelos contratos atuais.');

    return Object.freeze({
      generatedAt:now.toISOString(),
      counts,
      briefing:Object.freeze(lines),
      mission:mission ? Object.freeze({...mission}) : null,
      topAccounts:Object.freeze(topAccounts),
      signals:Object.freeze(signals.slice(0,8)),
      automations:Object.freeze(suggestions.slice(0,8)),
      lifecycleSignals:Object.freeze(lifecycleSignals.slice(0,8)),
      calendar:Object.freeze({
        connected:calendarConnected,
        events:Object.freeze(calendarEvents),
        note:calendarConnected ? 'Agenda externa incluída no briefing.' : 'Agenda externa não conectada ao runtime do DUTRA OS.'
      })
    });
  }

  return Object.freeze({ build });
}));
