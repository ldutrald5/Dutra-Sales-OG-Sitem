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

  function priorityLane(lead = {}, leadSignals = [], now = new Date(), intelligence = {}) {
    const signalTypes = new Set((leadSignals || []).map(item => item.type));
    const stage = intelligence.conversationStage ? intelligence.conversationStage(lead) : clean(lead.conversationStage || lead.status);
    const due = asDate(lead.followUpAt);
    const dueNow = due && due.getTime() <= now.getTime() + 86400000;
    const hasCommitment = Boolean(clean(lead.nextActionReason) || clean(lead.nextActionObjective) || clean(lead.nextActionExpectedResult));

    if (signalTypes.has('installation_pending') || signalTypes.has('replacement_review_due')) {
      return Object.freeze({ id:'protect', label:'PROTEGER', reason:'Existe uma obrigação ou cuidado ativo com cliente.' });
    }
    if (hasCommitment && dueNow) {
      return Object.freeze({ id:'fulfill', label:'CUMPRIR', reason:'Existe compromisso comercial estruturado vencido ou nas próximas 24h.' });
    }
    if (['proposal','negotiation'].includes(stage) || signalTypes.has('proposal_reopened') || signalTypes.has('proposal_without_next_action')) {
      return Object.freeze({ id:'close', label:'FECHAR', reason:'A conta está em proposta/negociação ou mostrou intenção recente.' });
    }
    if (signalTypes.has('fleet_expansion_gap') || signalTypes.has('satisfied_without_referral') || signalTypes.has('test_ending')) {
      return Object.freeze({ id:'expand', label:'EXPANDIR', reason:'Existe sinal confirmado de expansão, teste ou indicação.' });
    }
    if (['first_contact','no_reply'].includes(stage) || clean(lead.status) === 'novo') {
      return Object.freeze({ id:'prospect', label:'PROSPECTAR', reason:'A conta ainda está em início de prospecção.' });
    }
    return Object.freeze({ id:'relate', label:'RELACIONAR', reason:'A conta precisa de continuidade sem urgência comercial maior registrada.' });
  }

  function build(input = {}, deps = {}) {
    const leads = Array.isArray(input.leads) ? input.leads : [];
    const operations = input.operations && typeof input.operations === 'object' ? input.operations : {};
    const now = asDate(input.now) || new Date();
    const salesDesk = deps.salesDesk;
    const intelligence = deps.leadIntelligence;
    const signalCenter = deps.signalCenter;
    const automation = deps.automationEngine;
    const customerJourney = deps.customerJourney;

    if (!salesDesk?.selectQueue) throw new Error('Sales Desk é obrigatório');
    if (!intelligence?.score) throw new Error('Lead Intelligence é obrigatório');
    if (!signalCenter?.buildSignalCenter || !signalCenter?.nextMission) throw new Error('Signal Center é obrigatório');

    const all = salesDesk.selectQueue(leads,'all','',now);
    const overdue = salesDesk.selectQueue(leads,'overdue','',now);
    const today = salesDesk.selectQueue(leads,'today','',now);
    const priority = salesDesk.selectQueue(leads,'priority','',now);
    const noAction = salesDesk.selectQueue(leads,'no-action','',now);
    const signals = signalCenter.buildSignalCenter(leads,now,operations);
    const signalsByLead = new Map();
    for (const item of signals) {
      if (!signalsByLead.has(item.leadId)) signalsByLead.set(item.leadId, []);
      signalsByLead.get(item.leadId).push(item);
    }
    const laneOrder={protect:0,fulfill:1,close:2,expand:3,prospect:4,relate:5};
    const workQueue = all.map(lead => {
      const lane=priorityLane(lead,signalsByLead.get(clean(lead.id)) || [],now,intelligence);
      return Object.freeze({
        leadId:clean(lead.id), label:leadLabel(lead), lane,
        action:clean(lead.nextAction) || 'Definir próximo movimento',
        followUpAt:clean(lead.followUpAt) || null,
        score:intelligence.score(lead,now)
      });
    }).sort((a,b) => laneOrder[a.lane.id]-laneOrder[b.lane.id] || b.score-a.score);
    const laneCounts = Object.freeze(Object.fromEntries(['protect','fulfill','close','expand','prospect','relate'].map(id => [id,workQueue.filter(item=>item.lane.id===id).length])));

    const mission = signalCenter.nextMission(leads,now,(lead,reference)=>intelligence.score(lead,reference),operations);
    const suggestions = automation?.buildSuggestions ? automation.buildSuggestions(leads,operations,now) : [];
    const customerActions = customerJourney?.snapshot ? leads.filter(lead => ['fechado','customer','loyal_customer'].includes(clean(lead.status)) || ['customer','loyal_customer'].includes(clean(lead.conversationStage))).map(lead => { const journey=customerJourney.snapshot(lead,operations); return Object.freeze({leadId:clean(lead.id),label:leadLabel(lead),...journey.next,referralReadiness:journey.referralReadiness}); }).filter(item => item.action) : [];

    const commitments = all
      .filter(lead => clean(lead.nextActionReason) || clean(lead.nextActionObjective) || clean(lead.nextActionExpectedResult))
      .map(lead => {
        const when = asDate(lead.followUpAt);
        const delta = when ? when.getTime() - now.getTime() : null;
        const state = !when ? 'unscheduled' : delta < 0 ? 'overdue' : delta <= 86400000 ? 'today' : 'upcoming';
        return Object.freeze({
          leadId:clean(lead.id),
          label:leadLabel(lead),
          action:clean(lead.nextAction) || 'Próxima ação',
          followUpAt:clean(lead.followUpAt) || null,
          reason:clean(lead.nextActionReason),
          objective:clean(lead.nextActionObjective),
          expectedResult:clean(lead.nextActionExpectedResult),
          state,
          score:intelligence.score(lead,now)
        });
      })
      .sort((a,b) => {
        const band={overdue:0,today:1,upcoming:2,unscheduled:3};
        if (band[a.state] !== band[b.state]) return band[a.state]-band[b.state];
        const ad=asDate(a.followUpAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const bd=asDate(b.followUpAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return ad-bd || b.score-a.score;
      });

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
      calendar:calendarEvents.length,
      commitments:commitments.length,
      commitmentOverdue:commitments.filter(item=>item.state==='overdue').length,
      commitmentToday:commitments.filter(item=>item.state==='today').length,
      customerActions:customerActions.length,
      lanes:laneCounts
    });

    const lines = [];
    if (counts.commitments) lines.push(`${counts.commitments} compromisso(s) comercial(is) estruturado(s) estão na carteira.`);
    if (counts.overdue) lines.push(`${counts.overdue} retorno(s) vencido(s) precisam de decisão.`);
    if (counts.today) lines.push(`${counts.today} retorno(s) estão marcados para hoje.`);
    if (counts.signals) lines.push(`${counts.signals} sinal(is) comercial(is) estão ativos.`);
    if (counts.automations) lines.push(`${counts.automations} rotina(s) podem virar próxima ação.`);
    if (counts.customerActions) lines.push(`${counts.customerActions} cliente(s) têm próximo passo de pós-venda definido.`);
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
      customerActions:Object.freeze(customerActions.slice(0,8)),
      commitments:Object.freeze(commitments.slice(0,10)),
      workQueue:Object.freeze(workQueue.slice(0,20)),
      calendar:Object.freeze({
        connected:calendarConnected,
        events:Object.freeze(calendarEvents),
        note:calendarConnected ? 'Agenda externa incluída no briefing.' : 'Agenda externa não conectada ao runtime do DUTRA OS.'
      })
    });
  }

  return Object.freeze({ build, priorityLane });
}));
