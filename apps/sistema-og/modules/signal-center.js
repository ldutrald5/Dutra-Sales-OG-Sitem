(function attachSignalCenter(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SIGNAL_CENTER = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSignalCenter() {
  'use strict';

  const SEVERITY_WEIGHT = Object.freeze({ critical: 4, high: 3, medium: 2, low: 1 });
  const TERMINAL_STATUSES = new Set(['fechado', 'perdido']);

  const clean = value => String(value ?? '').trim();
  const key = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const asDate = value => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  function isTerminal(lead = {}) {
    return TERMINAL_STATUSES.has(key(lead.status));
  }

  function isCustomerLifecycle(lead = {}) {
    const status = key(lead.status);
    const conversation = key(lead.conversationStage);
    return status === 'fechado' || ['customer','loyal_customer','cliente','cliente_fidelizado'].includes(conversation);
  }

  function canonicalEventType(value) {
    const normalized = key(value);
    const aliases = {
      proposal_prepared:'proposal.prepared',
      proposal_sent:'proposal.sent',
      proposal_opened:'proposal.opened',
      proposal_reopened:'proposal.reopened',
      proposal_contact_clicked:'proposal.contact_clicked',
      proposal_accepted:'proposal.accepted',
      proposal_revoked:'proposal.revoked',
      installation_completed:'installation.completed',
      customer_satisfaction_confirmed:'customer.satisfaction.confirmed',
      referral_requested:'referral.requested',
      referral_received:'referral.received',
      test_completed:'test.completed',
      test_cancelled:'test.cancelled'
    };
    return aliases[normalized] || clean(value);
  }

  function eventsForLead(operations = {}, leadId) {
    return (Array.isArray(operations?.activityEvents) ? operations.activityEvents : [])
      .filter(item => clean(item.clientId || item.leadId) === clean(leadId))
      .map(item => ({ ...item, type:canonicalEventType(item.type) }))
      .sort((a,b)=>(asDate(b.at)?.getTime()||0)-(asDate(a.at)?.getTime()||0));
  }

  function interactionDate(lead = {}) {
    const interactions = Array.isArray(lead.interactions) ? lead.interactions : [];
    const latestInteraction = interactions
      .map(item => asDate(item?.at || item?.createdAt))
      .filter(Boolean)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;
    return latestInteraction
      || asDate(lead.lastContactAt)
      || asDate(lead.updatedAt)
      || asDate(lead.enteredAt)
      || asDate(lead.createdDate)
      || null;
  }

  function makeSignal(lead, type, severity, title, reason, recommendedAction, extra = {}) {
    return Object.freeze({
      id: `${clean(lead.id)}:${type}`,
      leadId: clean(lead.id),
      type,
      severity,
      severityWeight: SEVERITY_WEIGHT[severity] || 0,
      title,
      reason,
      recommendedAction,
      ...extra
    });
  }

  function fleetSize(lead = {}) {
    const raw = lead.fleetSize ?? lead.estimatedFleetSize ?? lead.confirmedFleetSize ?? lead.vehicleCount;
    const value = Number(String(raw ?? '').replace(/[^0-9.,-]/g, '').replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  }

  function signalsForLead(lead = {}, now = new Date(), operations = {}) {
    if (!lead?.id || key(lead.status) === 'perdido') return Object.freeze([]);
    const reference = asDate(now) || new Date();
    const signals = [];
    const customerLifecycle = isCustomerLifecycle(lead);
    const events = eventsForLead(operations, lead.id);
    const due = asDate(lead.followUpAt);
    const nextAction = clean(lead.nextAction);
    const priority = key(lead.priorityBand || lead.sourcePriority || lead.priority);
    const conversation = key(lead.conversationStage || lead.status);
    const proposalStage = ['proposal', 'proposta', 'proposta_enviada'].includes(conversation)
      || key(lead.status) === 'proposta_enviada';

    if (!customerLifecycle) {
    if (due) {
      const delta = due.getTime() - reference.getTime();
      if (delta < 0) {
        const days = Math.max(1, Math.ceil(Math.abs(delta) / 86400000));
        signals.push(makeSignal(
          lead,
          'followup_overdue',
          'critical',
          'Follow-up vencido',
          `Retorno atrasado há ${days} dia${days === 1 ? '' : 's'}.`,
          nextAction || 'Retomar o contato e combinar um próximo passo',
          { dueAt: due.toISOString(), ageDays: days }
        ));
      } else if (delta <= 86400000) {
        signals.push(makeSignal(
          lead,
          'followup_today',
          'high',
          'Retorno para hoje',
          'Existe um retorno agendado nas próximas 24 horas.',
          nextAction || 'Executar o retorno combinado',
          { dueAt: due.toISOString() }
        ));
      }
    }

    if (proposalStage && !nextAction) {
      signals.push(makeSignal(
        lead,
        'proposal_without_next_action',
        'high',
        'Proposta sem próxima ação',
        'A conta está em proposta, mas não existe próximo passo registrado.',
        'Definir quando e como a proposta será retomada'
      ));
    } else if (!nextAction && ['urgente', 'alta', 'high'].includes(priority)) {
      signals.push(makeSignal(
        lead,
        'priority_without_next_action',
        'high',
        'Conta prioritária sem próximo passo',
        'A conta está marcada como prioritária e pode esfriar sem uma ação explícita.',
        'Definir a próxima ação e uma data'
      ));
    } else if (!nextAction) {
      signals.push(makeSignal(
        lead,
        'missing_next_action',
        'medium',
        'Sem próxima ação',
        'Não existe um movimento comercial registrado para esta conta.',
        'Definir a próxima ação'
      ));
    }

    const size = fleetSize(lead);
    if (size >= 30 && !clean(lead.decisionMaker)) {
      signals.push(makeSignal(
        lead,
        'large_account_without_decision_maker',
        'medium',
        'Conta grande sem decisor',
        `Frota registrada com ${Math.round(size)} veículo${Math.round(size) === 1 ? '' : 's'} e nenhum decisor confirmado.`,
        'Descobrir quem participa da decisão',
        { fleetSize: size }
      ));
    }

    const progressed = !['novo', 'new', 'first_contact'].includes(conversation)
      && !['novo', 'new'].includes(key(lead.status));
    if (progressed && !clean(lead.pain)) {
      signals.push(makeSignal(
        lead,
        'missing_validated_pain',
        'medium',
        'Conversa sem dor validada',
        'A oportunidade avançou, mas a dor principal ainda não está registrada.',
        'Usar a próxima conversa para validar impacto, frequência e urgência'
      ));
    }

    const last = interactionDate(lead);
    if (last) {
      const idleDays = Math.floor((reference.getTime() - last.getTime()) / 86400000);
      if (idleDays >= 14 && (!due || due.getTime() < reference.getTime())) {
        signals.push(makeSignal(
          lead,
          'stalled_account',
          idleDays >= 28 ? 'high' : 'medium',
          'Conta parada',
          `Sem atividade confirmada há ${idleDays} dias.`,
          nextAction || 'Retomar contexto e combinar um próximo passo',
          { idleDays, lastActivityAt: last.toISOString() }
        ));
      }
    }
    }

    // Sinais pós-venda e de intenção: só nascem de campos/eventos explícitos.
    const proposalReopened = events.find(item => item.type === 'proposal.reopened');
    const proposalClosedAfter = proposalReopened && events.some(item =>
      ['proposal.accepted','proposal.revoked'].includes(item.type)
      && (asDate(item.at)?.getTime()||0) >= (asDate(proposalReopened.at)?.getTime()||0)
    );
    if (proposalReopened && !proposalClosedAfter) {
      const reopenedAt = asDate(proposalReopened.at);
      signals.push(makeSignal(
        lead,
        'proposal_reopened',
        'high',
        'Proposta reaberta',
        reopenedAt ? `A proposta foi reaberta em ${reopenedAt.toLocaleString('pt-BR')}.` : 'Existe uma reabertura confirmada da proposta.',
        'Retomar a proposta enquanto o interesse está ativo',
        { proposalId:proposalReopened.proposalId || null, reopenedAt:reopenedAt?.toISOString() || null }
      ));
    }

    const installationStatus = key(lead.installationStatus || lead.installStatus);
    if (['pending','pendente','not_installed','nao_instalou','aguardando_instalacao','waiting_installation'].includes(installationStatus)) {
      signals.push(makeSignal(
        lead,
        'installation_pending',
        'medium',
        'Instalação pendente',
        'A conta está marcada explicitamente com instalação ainda pendente.',
        'Confirmar data, responsável e condição para concluir a instalação'
      ));
    }

    const testEnd = asDate(lead.testEndsAt || lead.trialEndsAt);
    const testStatus = key(lead.testStatus || lead.trialStatus);
    const testClosedByEvent = events.some(item => ['test.completed','test.cancelled'].includes(item.type));
    if (testEnd && !['completed','concluido','cancelled','cancelado'].includes(testStatus) && !testClosedByEvent) {
      const daysUntil = Math.ceil((testEnd.getTime() - reference.getTime()) / 86400000);
      if (daysUntil <= 14 && daysUntil >= -7) {
        signals.push(makeSignal(
          lead,
          'test_ending',
          daysUntil <= 2 ? 'high' : 'medium',
          daysUntil < 0 ? 'Teste terminou sem fechamento registrado' : 'Teste perto do fechamento',
          daysUntil < 0 ? `O teste terminou há ${Math.abs(daysUntil)} dia(s).` : `O teste termina em ${daysUntil} dia(s).`,
          'Revisar resultado do teste e definir expansão, ajuste ou próximo passo',
          { testEndsAt:testEnd.toISOString(), daysUntil }
        ));
      }
    }

    const satisfaction = key(lead.satisfactionStatus || lead.customerSatisfaction || lead.satisfaction);
    const referralDone = Boolean(
      clean(lead.referralRequestedAt || lead.referralReceivedAt || lead.referredAt)
      || (Array.isArray(lead.referrals) && lead.referrals.length > 0)
      || events.some(item => ['referral.requested','referral.received'].includes(item.type))
    );
    if (['satisfied','satisfeito','satisfeita','positive','positivo','confirmada','confirmed'].includes(satisfaction) && !referralDone) {
      signals.push(makeSignal(
        lead,
        'satisfied_without_referral',
        'medium',
        'Cliente satisfeito sem indicação registrada',
        'A satisfação está confirmada e ainda não existe pedido/recebimento de indicação depois disso.',
        'Pedir uma indicação de outra frota ou gestor'
      ));
    }

    const size = fleetSize(lead);
    const equippedRaw = lead.equippedVehicles ?? lead.protectedVehicleCount ?? lead.installedVehicleCount ?? lead.vehiclesProtected;
    const equippedKnown = equippedRaw !== undefined && equippedRaw !== null && clean(equippedRaw) !== '';
    const equipped = equippedKnown ? Number(String(equippedRaw).replace(/[^0-9.,-]/g,'').replace(',','.')) : Number.NaN;
    if (customerLifecycle && size > 0 && equippedKnown && Number.isFinite(equipped) && equipped >= 0 && equipped < size) {
      const gap = Math.max(0, Math.round(size - equipped));
      signals.push(makeSignal(
        lead,
        'fleet_expansion_gap',
        gap >= 10 ? 'high' : 'medium',
        'Frota com espaço para expansão',
        `${Math.round(equipped)} de ${Math.round(size)} veículo(s) estão registrados como protegidos/equipados.`,
        `Mapear expansão para os ${gap} veículo(s) restantes`,
        { fleetSize:size, equippedVehicles:equipped, gap }
      ));
    }

    const replacementAt = asDate(lead.replacementReviewAt || lead.reorderDueAt || lead.nextReplacementReviewAt);
    if (customerLifecycle && replacementAt) {
      const daysUntil = Math.ceil((replacementAt.getTime() - reference.getTime()) / 86400000);
      if (daysUntil <= 14) {
        signals.push(makeSignal(
          lead,
          'replacement_review_due',
          daysUntil <= 0 ? 'high' : 'medium',
          'Revisão de reposição próxima',
          daysUntil < 0 ? `A revisão de reposição está vencida há ${Math.abs(daysUntil)} dia(s).` : `A revisão de reposição vence em ${daysUntil} dia(s).`,
          'Revisar reposição, peças e oportunidade de recompra',
          { replacementReviewAt:replacementAt.toISOString(), daysUntil }
        ));
      }
    }

    return Object.freeze(signals.sort((a, b) =>
      b.severityWeight - a.severityWeight
      || String(a.dueAt || '').localeCompare(String(b.dueAt || ''))
      || a.type.localeCompare(b.type)
    ));
  }

  function buildSignalCenter(leads = [], now = new Date(), operations = {}) {
    const output = [];
    for (const lead of Array.isArray(leads) ? leads : []) {
      for (const signal of signalsForLead(lead, now, operations)) output.push(signal);
    }
    return output.sort((a, b) =>
      b.severityWeight - a.severityWeight
      || String(a.dueAt || '').localeCompare(String(b.dueAt || ''))
      || a.leadId.localeCompare(b.leadId)
      || a.type.localeCompare(b.type)
    );
  }

  function nextMission(leads = [], now = new Date(), scoreFn = () => 0, operations = {}) {
    const candidates = (Array.isArray(leads) ? leads : [])
      .filter(lead => lead?.id && !isTerminal(lead))
      .map(lead => {
        const signals = signalsForLead(lead, now, operations);
        const score = Number(scoreFn(lead, now)) || 0;
        return { lead, score, signals, topSignal: signals[0] || null };
      })
      .sort((a, b) =>
        b.score - a.score
        || (b.topSignal?.severityWeight || 0) - (a.topSignal?.severityWeight || 0)
        || String(b.lead.updatedAt || b.lead.lastContactAt || '').localeCompare(String(a.lead.updatedAt || a.lead.lastContactAt || ''))
        || String(a.lead.id).localeCompare(String(b.lead.id))
      );
    const mission = candidates[0];
    if (!mission) return null;
    const fallbackAction = clean(mission.lead.nextAction) || 'Definir o próximo movimento comercial';
    return Object.freeze({
      leadId: clean(mission.lead.id),
      score: mission.score,
      signal: mission.topSignal,
      signals: Object.freeze(mission.signals),
      reason: mission.topSignal?.reason || 'Maior prioridade comercial da fila atual.',
      recommendedAction: mission.topSignal?.recommendedAction || fallbackAction
    });
  }

  return {
    SEVERITY_WEIGHT,
    signalsForLead,
    buildSignalCenter,
    nextMission
  };
}));
