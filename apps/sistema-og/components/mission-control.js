(function attach(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_MISSION_CONTROL = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Readonly presentation adapter. Ranking, NBA and mutations belong to existing owners.
  function project(leads, operations, owners, now = new Date()) {
    const seen = new Set();
    const population = (leads || []).filter(lead => {
      if (!lead?.id || seen.has(String(lead.id))) return false;
      seen.add(String(lead.id));
      return true;
    });
    const queue = owners.salesDesk.selectQueue(population, 'all', '', now);
    const groups = { all: queue };
    for (const filter of ['overdue', 'today', 'priority', 'no-action']) groups[filter] = owners.salesDesk.selectQueue(population, filter, '', now);
    const scheduled = new Set([...groups.overdue, ...groups.today].map(lead => lead.id));
    groups.upcoming = queue.filter(lead => lead.followUpAt && Number.isFinite(Date.parse(lead.followUpAt)) && !scheduled.has(lead.id));
    const byId = new Map(population.map(lead => [String(lead.id), lead]));
    const describe = lead => {
      const nba = owners.intelligence.nextBestAction(lead, now);
      return { lead, nba, action: nba.explicitAction ? nba.action : 'REVISAR / COMPLETAR CONTEXTO', reason: nba.reason, last: owners.salesDesk.lastInteraction(lead) };
    };
    const activities = operations?.activityEvents || [];
    const bookings = new Map();
    for (const event of activities) {
      if (event.type !== 'call.saved' || event.result !== 'reuniao_agendada' || !byId.has(String(event.clientId))) continue;
      const key = event.callSessionId || event.id;
      if (!key) continue;
      // Only explicit reviewed meeting metadata. Never infer date from a follow-up.
      bookings.set(key, { ...event, lead: byId.get(String(event.clientId)), scheduledAt: event.meeting?.scheduledAt || '' });
    }
    const meetings = [...bookings.values()].sort((a, b) => String(a.scheduledAt || '9999').localeCompare(String(b.scheduledAt || '9999')));
    const proposalFacts = new Map();
    for (const event of [...activities].sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')))) {
      const type = owners.proposal.normalizeProposalEventType(event.type);
      if (!type.startsWith('proposal.') || !event.proposalId || !byId.has(String(event.clientId))) continue;
      const key = `${event.clientId}:${event.proposalId}`;
      const facts = proposalFacts.get(key) || { lead: byId.get(String(event.clientId)), proposalId: event.proposalId, quoteId: event.quoteId, sent: false, closed: false, type: 'proposal.prepared', at: event.at };
      if (type === 'proposal.sent' && event.source === 'user_confirmed') facts.sent = true;
      if (['proposal.accepted', 'proposal.revoked'].includes(type)) facts.closed = true;
      facts.type = type; facts.at = event.at;
      proposalFacts.set(key, facts);
    }
    const proposals = [...proposalFacts.values()].filter(fact => !fact.closed);
    // Open task records remain in their canonical collection; company mapping is explicit.
    const tasks = (operations?.tasks || []).filter(task => !['done', 'completed', 'cancelled', 'closed'].includes(String(task.status || '').toLowerCase())).map(task => ({ ...task,
      lead: byId.get(String(task.clientId)) || population.find(lead => lead.salesExecution?.companyId === task.companyId)
    }));
    return { population, queue, groups, describe, now: queue[0] ? describe(queue[0]) : null, meetings, proposals, tasks };
  }
  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'}[char]));
  function dateLabel(value) {
    const date = new Date(value);
    return value && Number.isFinite(date.getTime()) ? date.toLocaleString('pt-BR', { dateStyle:'short', timeStyle:'short' }) : 'Data não disponível';
  }
  function render(view) {
    const item = view.now;
    const action = (lead, label, kind = 'select') => `<button type="button" class="og-button og-button-secondary" data-mission-${kind}="${escape(lead.id)}">${escape(label)}</button>`;
    const commitment = (lead, prefix = '') => `<li>${action(lead, lead.empresa || lead.nome)}<span>${escape(prefix)}${escape(lead.nextAction || 'REVISAR / COMPLETAR CONTEXTO')}</span><time>${escape(dateLabel(lead.followUpAt))}</time></li>`;
    const follow = (title, items) => `<details class="mission-section" ${title === 'Atrasados' && items.length ? 'open' : ''}><summary>${title} · ${items.length}</summary><ul>${items.map(lead => commitment(lead)).join('') || '<li class="mission-empty">Nenhum follow-up neste período.</li>'}</ul></details>`;
    return `<section class="mission-now clean-card" aria-labelledby="mission-now-title"><span class="og-kicker">AGORA · PRÓXIMA AÇÃO</span><h2 id="mission-now-title">${escape(item ? item.lead.empresa || item.lead.nome : 'Sua fila está em dia')}</h2>${item ? `<p class="mission-action">${escape(item.action)}</p><p class="mission-reason">Por que agora: ${escape(item.reason || 'Revisar contexto registrado')}</p><p class="mission-context">${escape(item.lead.status || 'novo')} · ${escape(dateLabel(item.nba.dueAt))}${item.last?.note ? ` · ${escape(item.last.note)}` : ''}</p><div class="mission-quick-actions">${action(item.lead, 'Agir / registrar resultado', 'act')}${action(item.lead, 'WhatsApp', 'whatsapp')}${action(item.lead, 'Abrir cliente', 'sheet')}</div>` : '<p>Nenhum cliente ativo. Cadastre um prospect para começar.</p>'}</section>
      <section class="mission-commitments" aria-label="Compromissos operacionais"><div class="clean-card"><h2>Follow-ups</h2>${follow('Atrasados', view.groups.overdue)}${follow('Hoje', view.groups.today)}${follow('Próximos', view.groups.upcoming)}</div>
      <div class="clean-card"><h2>Reuniões</h2><p class="mission-hint">Compromissos confirmados no CRM. Calendário externo não conectado.</p><ul class="mission-facts">${view.meetings.map(event => `<li>${action(event.lead, event.lead.empresa || event.lead.nome)}<span>${escape(dateLabel(event.scheduledAt))}${event.meeting?.mode ? ` · ${escape(event.meeting.mode)}` : ''}${event.scheduledAt && Date.parse(event.scheduledAt) < Date.now() ? ' · Revisar resultado do compromisso' : ''}</span></li>`).join('') || '<li class="mission-empty">Nenhuma reunião confirmada registrada.</li>'}</ul></div>
      <div class="clean-card"><h2>Propostas em movimento</h2><ul class="mission-facts">${view.proposals.map(fact => `<li>${action(fact.lead, 'Abrir proposta · ' + (fact.lead.empresa || fact.lead.nome), 'proposal').replace('data-mission-proposal=', `data-mission-proposal-id="${escape(fact.proposalId)}" data-mission-proposal=`)}<span>${fact.sent ? 'Envio confirmado · aguardando retorno' : 'Salva / preparada · envio não confirmado'}</span><small>${escape(fact.proposalId)}</small></li>`).join('') || '<li class="mission-empty">Nenhuma proposta com evento registrado. Status do CRM não comprova envio.</li>'}</ul></div>
      <div class="clean-card"><h2>Tarefas operacionais</h2><ul class="mission-facts">${view.tasks.map(task => `<li>${task.lead ? action(task.lead, task.lead.empresa || task.lead.nome) : '<span>Conta não vinculada · revisar em Operações</span>'}<strong>${escape(task.title)}</strong><time>${escape(dateLabel(task.dueAt))}</time></li>`).join('') || '<li class="mission-empty">Nenhuma tarefa aberta registrada.</li>'}</ul></div></section>`;
  }
  return { project, render, dateLabel };
}));
