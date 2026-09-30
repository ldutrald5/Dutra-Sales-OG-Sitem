import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';

export const E2E_VERSION = '1.0.0';
export const DEFAULT_SUPABASE_URL = 'https://hlyffyguxqxmgxlevfeq.supabase.co';

function clean(value) {
  return String(value ?? '').trim();
}

function envBool(env, name, fallback = false) {
  const value = clean(env[name]).toLowerCase();
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

export function isLegacyJwtKey(key) {
  return clean(key).startsWith('eyJ');
}

export function buildAdminHeaders(key, extra = {}) {
  const headers = {
    apikey: key,
    ...extra,
  };
  if (isLegacyJwtKey(key)) headers.Authorization = `Bearer ${key}`;
  return headers;
}

export function buildConfig(env = process.env) {
  const supabaseUrl = clean(env.OG_WHATSAPP_E2E_SUPABASE_URL || env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
  const apiKey = clean(
    env.OG_WHATSAPP_E2E_API_KEY ||
    env.OG_WHATSAPP_INGEST_API_KEY ||
    env.SUPABASE_SECRET_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!/^https:\/\//i.test(supabaseUrl)) {
    throw new Error('OG_WHATSAPP_E2E_SUPABASE_URL deve usar HTTPS.');
  }
  if (!apiKey) {
    throw new Error(
      'Defina OG_WHATSAPP_E2E_API_KEY (preferencialmente sb_secret_...), OG_WHATSAPP_INGEST_API_KEY ou SUPABASE_SERVICE_ROLE_KEY somente no ambiente local.'
    );
  }

  return {
    supabaseUrl,
    apiKey,
    keepData: envBool(env, 'OG_WHATSAPP_E2E_KEEP', false) || process.argv.includes('--keep'),
    json: process.argv.includes('--json'),
  };
}

export function createRunIdentity(now = Date.now(), random = randomBytes(4).toString('hex')) {
  const suffix = `${now}-${random}`;
  return {
    runId: suffix,
    positiveCompany: `[E2E] DUTRA OG POSITIVE ${suffix}`,
    negativeCompany: `[E2E] DUTRA OG NEGATIVE ${suffix}`,
    positiveThread: `e2e-positive-thread-${suffix}`,
    negativeThread: `e2e-negative-thread-${suffix}`,
    positiveContact: `e2e-positive-contact-${suffix}`,
    negativeContact: `e2e-negative-contact-${suffix}`,
    positiveMessage: `e2e-positive-message-${suffix}`,
    negativeMessage: `e2e-negative-message-${suffix}`,
    positiveEvent: `e2e:${suffix}:positive`,
    negativeEvent: `e2e:${suffix}:negative`,
  };
}

function confirmed(value, confidence = 0.99) {
  return { value, confidence, confirmed: true };
}

function unconfirmed(value, confidence = 0.99) {
  return { value, confidence, confirmed: false };
}

export function buildPositivePayload(identity, now = Date.now()) {
  const dueAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  return {
    event_id: identity.positiveEvent,
    event_type: 'message.upsert',
    provider: 'e2e',
    contact: {
      external_id: identity.positiveContact,
      full_name: 'Cliente Sintético E2E',
      role_title: 'Gestor de Frota',
      decision_level: 'decision_maker',
      metadata: {
        e2e: true,
        run_id: identity.runId,
      },
    },
    conversation: {
      external_thread_id: identity.positiveThread,
      chat_type: 'direct',
      title: identity.positiveCompany,
      metadata: {
        e2e: true,
        run_id: identity.runId,
      },
    },
    message: {
      external_message_id: identity.positiveMessage,
      direction: 'inbound',
      sender_external_id: identity.positiveContact,
      sender_name: 'Cliente Sintético E2E',
      body: 'Temos 3 caminhões rodotrem de 9 eixos. Pode preparar a proposta.',
      message_type: 'text',
      sent_at: new Date(now).toISOString(),
      raw_payload: {
        source: 'og_e2e_self_test',
        run_id: identity.runId,
      },
    },
    insight: {
      insight_type: 'deterministic_explicit_fact',
      facts: {
        company_name: confirmed(identity.positiveCompany, 1),
        fleet_size: confirmed(3, 0.99),
        vehicle_profile_code: confirmed('rodotrem_9_eixos', 0.99),
        primary_pain: confirmed('controle e economia operacional dos pneus', 0.99),
        next_action_due_at: confirmed(dueAt, 0.99),
      },
      hypotheses: {},
      objections: [],
      buying_signals: ['cliente solicitou proposta'],
      open_questions: [],
      next_action: 'Preparar e revisar proposta solicitada pelo cliente',
      confidence: 0.99,
      model_name: 'deterministic-e2e',
      model_version: E2E_VERSION,
      source_message_ids: [identity.positiveMessage],
      metadata: {
        source_mode: 'deterministic_explicit',
        e2e: true,
        run_id: identity.runId,
      },
    },
    raw_event: {
      source: 'og_e2e_self_test',
      e2e: true,
      run_id: identity.runId,
    },
  };
}

export function buildNegativePayload(identity, companyId, now = Date.now()) {
  return {
    event_id: identity.negativeEvent,
    event_type: 'message.upsert',
    provider: 'e2e',
    company_id: companyId,
    contact: {
      external_id: identity.negativeContact,
      full_name: 'Contato Hipótese E2E',
      metadata: {
        e2e: true,
        run_id: identity.runId,
      },
    },
    conversation: {
      external_thread_id: identity.negativeThread,
      chat_type: 'direct',
      title: identity.negativeCompany,
      metadata: {
        e2e: true,
        run_id: identity.runId,
      },
    },
    message: {
      external_message_id: identity.negativeMessage,
      direction: 'inbound',
      sender_external_id: identity.negativeContact,
      sender_name: 'Contato Hipótese E2E',
      body: 'Talvez a frota tenha 777 veículos e talvez seja rodotrem de 9 eixos.',
      message_type: 'text',
      sent_at: new Date(now + 1000).toISOString(),
      raw_payload: {
        source: 'og_e2e_self_test',
        run_id: identity.runId,
      },
    },
    insight: {
      insight_type: 'ai_suggestion_e2e',
      facts: {
        fleet_size: unconfirmed(777, 0.99),
        vehicle_profile_code: unconfirmed('rodotrem_9_eixos', 0.99),
      },
      hypotheses: {
        fleet_size: 777,
        vehicle_profile_code: 'rodotrem_9_eixos',
      },
      objections: [],
      buying_signals: [],
      open_questions: ['Confirmar tamanho da frota e configuração veicular'],
      next_action: null,
      confidence: 0.99,
      model_name: 'synthetic-ai-e2e',
      model_version: E2E_VERSION,
      source_message_ids: [identity.negativeMessage],
      metadata: {
        source_mode: 'ai_suggestion',
        e2e: true,
        run_id: identity.runId,
      },
    },
    raw_event: {
      source: 'og_e2e_self_test',
      e2e: true,
      run_id: identity.runId,
    },
  };
}

function encodeFilter(value) {
  return encodeURIComponent(String(value));
}

function expect(condition, name, detail = '') {
  if (!condition) {
    const error = new Error(detail ? `${name}: ${detail}` : name);
    error.checkName = name;
    throw error;
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 2000) };
  }
}

function createApi(config, fetchImpl = fetch) {
  const restHeaders = buildAdminHeaders(config.apiKey, {
    'Content-Type': 'application/json',
  });

  async function request(url, options = {}) {
    const response = await fetchImpl(url, options);
    const data = await readJson(response);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${url}: ${JSON.stringify(data)}`);
    }
    return data;
  }

  return {
    async ingest(payload) {
      return request(`${config.supabaseUrl}/functions/v1/whatsapp-ingest`, {
        method: 'POST',
        headers: buildAdminHeaders(config.apiKey, {
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      });
    },

    async insert(table, row) {
      const data = await request(`${config.supabaseUrl}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          ...restHeaders,
          Prefer: 'return=representation',
        },
        body: JSON.stringify(row),
      });
      return Array.isArray(data) ? data[0] : data;
    },

    async select(table, filters = {}, columns = '*') {
      const params = new URLSearchParams({ select: columns });
      for (const [key, value] of Object.entries(filters)) {
        params.set(key, `eq.${value}`);
      }
      const data = await request(`${config.supabaseUrl}/rest/v1/${table}?${params.toString()}`, {
        headers: restHeaders,
      });
      return Array.isArray(data) ? data : [];
    },

    async deleteEq(table, filters = {}) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value == null || value === '') return;
        params.set(key, `eq.${value}`);
      }
      if ([...params.keys()].length === 0) {
        throw new Error(`Cleanup recusado em ${table}: filtro vazio.`);
      }
      await request(`${config.supabaseUrl}/rest/v1/${table}?${params.toString()}`, {
        method: 'DELETE',
        headers: {
          ...restHeaders,
          Prefer: 'return=minimal',
        },
      });
    },
  };
}

async function one(api, table, filters, columns = '*') {
  const rows = await api.select(table, filters, columns);
  return rows[0] ?? null;
}

async function cleanup(api, identity, state) {
  const companyIds = new Set([
    state.positiveCompanyId,
    state.negativeCompanyId,
  ].filter(Boolean));

  if (!state.positiveCompanyId) {
    const rows = await api.select('companies', { name: identity.positiveCompany }, 'id');
    for (const row of rows) companyIds.add(row.id);
  }
  if (!state.negativeCompanyId) {
    const rows = await api.select('companies', { name: identity.negativeCompany }, 'id');
    for (const row of rows) companyIds.add(row.id);
  }

  for (const companyId of companyIds) {
    await api.deleteEq('crm_activities', { company_id: companyId }).catch(() => {});
    await api.deleteEq('sales_opportunities', { company_id: companyId }).catch(() => {});
    await api.deleteEq('proposals', { company_id: companyId }).catch(() => {});
  }

  for (const conversationId of [state.positiveConversationId, state.negativeConversationId].filter(Boolean)) {
    await api.deleteEq('crm_conversations', { id: conversationId }).catch(() => {});
  }
  for (const contactId of [state.positiveContactId, state.negativeContactId].filter(Boolean)) {
    await api.deleteEq('crm_contacts', { id: contactId }).catch(() => {});
  }

  // Fallbacks use exact synthetic identifiers only.
  await api.deleteEq('crm_conversations', { provider: 'e2e', external_thread_id: identity.positiveThread }).catch(() => {});
  await api.deleteEq('crm_conversations', { provider: 'e2e', external_thread_id: identity.negativeThread }).catch(() => {});
  await api.deleteEq('crm_contacts', { provider: 'e2e', external_contact_id: identity.positiveContact }).catch(() => {});
  await api.deleteEq('crm_contacts', { provider: 'e2e', external_contact_id: identity.negativeContact }).catch(() => {});
  await api.deleteEq('integration_events', { source: 'e2e', external_event_id: identity.positiveEvent }).catch(() => {});
  await api.deleteEq('integration_events', { source: 'e2e', external_event_id: identity.negativeEvent }).catch(() => {});

  for (const companyId of companyIds) {
    await api.deleteEq('companies', { id: companyId }).catch(() => {});
  }
}

function resultRow(name, ok, detail) {
  return { name, ok, detail: detail || '' };
}

export async function runE2E(config, options = {}) {
  const api = createApi(config, options.fetchImpl || fetch);
  const identity = options.identity || createRunIdentity();
  const state = {};
  const results = [];
  const record = (name, fn) => {
    try {
      const detail = fn();
      results.push(resultRow(name, true, detail));
    } catch (error) {
      results.push(resultRow(name, false, error instanceof Error ? error.message : String(error)));
      throw error;
    }
  };

  try {
    const negativeCompany = await api.insert('companies', {
      name: identity.negativeCompany,
      enrichment_status: 'pending',
    });
    expect(negativeCompany?.id, 'negative_company_fixture');
    state.negativeCompanyId = negativeCompany.id;

    const positivePayload = buildPositivePayload(identity);
    const first = await api.ingest(positivePayload);

    state.positiveContactId = first?.contact_id ?? null;
    state.positiveConversationId = first?.conversation_id ?? null;
    state.positiveMessageId = first?.message_id ?? null;
    state.positiveInsightId = first?.insight_id ?? null;
    state.positiveOpportunityId = first?.processor?.opportunity_id ?? null;

    record('01 ingestão', () => {
      expect(first?.ok === true, 'ingest_ok');
      expect(first?.duplicate === false, 'first_event_not_duplicate');
      expect(state.positiveMessageId, 'message_id');
      return 'evento aceito pelo whatsapp-ingest';
    });

    const positiveOpportunity = await one(
      api,
      'sales_opportunities',
      { id: state.positiveOpportunityId },
      'id,company_id,fleet_size,vehicle_profile_id,latest_proposal_id,stage,proposal_triggered_at'
    );
    expect(positiveOpportunity, 'positive_opportunity_missing');
    state.positiveCompanyId = positiveOpportunity.company_id;
    state.positiveProposalId = positiveOpportunity.latest_proposal_id;

    const profile = await one(
      api,
      'vehicle_profiles',
      { id: positiveOpportunity.vehicle_profile_id },
      'id,code,name'
    );

    record('02 oportunidade', () => {
      expect(positiveOpportunity?.id, 'opportunity_created');
      expect(positiveOpportunity.company_id, 'company_linked');
      return `opportunity=${positiveOpportunity.id}`;
    });

    record('03 fato de frota', () => {
      expect(Number(positiveOpportunity.fleet_size) === 3, 'fleet_size_expected_3');
      return 'fleet_size=3';
    });

    record('04 perfil veicular', () => {
      expect(profile?.code === 'rodotrem_9_eixos', 'vehicle_profile_expected');
      return profile?.code;
    });

    const followUps = await api.select(
      'crm_activities',
      { opportunity_id: positiveOpportunity.id, activity_type: 'follow_up' },
      'id,status,title,due_at'
    );
    record('05 follow-up', () => {
      expect(followUps.length === 1, 'single_follow_up_expected');
      expect(followUps[0].status === 'pending', 'follow_up_should_be_pending');
      return followUps[0].title;
    });

    const proposal = await one(
      api,
      'proposals',
      { id: positiveOpportunity.latest_proposal_id },
      'id,status,company_id,fleet_size,investment_total,annual_total_savings,roi_percent,payback_months,proposal_snapshot'
    );
    record('06 proposta/ROI', () => {
      expect(proposal?.id, 'proposal_created');
      expect(['draft', 'calculating'].includes(proposal.status), 'proposal_must_be_internal_draft');
      expect(Number(proposal.fleet_size) === 3, 'proposal_fleet_size');
      expect(proposal.proposal_snapshot?.metadata?.e2e === true, 'proposal_e2e_marker');
      return `status=${proposal.status} roi=${proposal.roi_percent ?? 'n/a'} payback=${proposal.payback_months ?? 'n/a'}`;
    });

    const processorRun = await one(
      api,
      'crm_processor_runs',
      { insight_id: state.positiveInsightId },
      'id,status,decision,actions'
    );
    record('07 auditoria do processador', () => {
      expect(processorRun?.status === 'processed', 'processor_processed');
      expect(processorRun?.decision === 'proposal_generated', 'processor_decision');
      return processorRun.decision;
    });

    const duplicate = await api.ingest(positivePayload);
    record('08 idempotência', () => {
      expect(duplicate?.ok === true && duplicate?.duplicate === true, 'duplicate_expected');
      return 'retry reconhecido sem reprocessar';
    });

    const messageRows = await api.select(
      'crm_messages',
      { provider: 'e2e', external_message_id: identity.positiveMessage },
      'id'
    );
    const insightRows = await api.select(
      'crm_insights',
      { message_id: state.positiveMessageId },
      'id'
    );
    const proposalRows = await api.select(
      'proposals',
      { company_id: state.positiveCompanyId },
      'id'
    );
    record('09 ausência de duplicatas', () => {
      expect(messageRows.length === 1, 'message_duplicate_detected');
      expect(insightRows.length === 1, 'insight_duplicate_detected');
      expect(proposalRows.length === 1, 'proposal_duplicate_detected');
      return 'mensagem=1 insight=1 proposta=1';
    });

    const negativePayload = buildNegativePayload(identity, state.negativeCompanyId);
    const negative = await api.ingest(negativePayload);
    state.negativeContactId = negative?.contact_id ?? null;
    state.negativeConversationId = negative?.conversation_id ?? null;
    state.negativeMessageId = negative?.message_id ?? null;
    state.negativeInsightId = negative?.insight_id ?? null;
    state.negativeOpportunityId = negative?.processor?.opportunity_id ?? null;

    const negativeOpportunity = await one(
      api,
      'sales_opportunities',
      { id: state.negativeOpportunityId },
      'id,company_id,fleet_size,vehicle_profile_id,latest_proposal_id'
    );
    const negativeInsight = await one(
      api,
      'crm_insights',
      { id: state.negativeInsightId },
      'id,review_status,facts,hypotheses'
    );

    record('10 hipótese não vira fato', () => {
      expect(negativeOpportunity?.id, 'negative_opportunity_created');
      expect(negativeOpportunity.fleet_size == null, 'unconfirmed_fleet_must_not_apply');
      expect(negativeOpportunity.vehicle_profile_id == null, 'unconfirmed_profile_must_not_apply');
      expect(negativeInsight?.review_status === 'pending', 'ai_suggestion_must_remain_pending');
      return 'frota/perfil preservados para revisão';
    });

    record('11 hipótese não gera proposta', () => {
      expect(negativeOpportunity.latest_proposal_id == null, 'unconfirmed_data_must_not_generate_proposal');
      return 'latest_proposal_id=null';
    });

    const positiveEvent = await one(
      api,
      'integration_events',
      { source: 'e2e', external_event_id: identity.positiveEvent },
      'id,processing_status,processed_at'
    );
    const negativeEvent = await one(
      api,
      'integration_events',
      { source: 'e2e', external_event_id: identity.negativeEvent },
      'id,processing_status,processed_at'
    );

    record('12 trilha de integração', () => {
      expect(positiveEvent?.processing_status === 'processed', 'positive_event_processed');
      expect(negativeEvent?.processing_status === 'processed', 'negative_event_processed');
      return '2 eventos processados e auditáveis';
    });

    return {
      ok: results.every((item) => item.ok),
      identity,
      results,
      cleanup: config.keepData ? 'kept' : 'pending',
    };
  } finally {
    if (!config.keepData) {
      await cleanup(api, identity, state);
    }
  }
}

function printReport(report) {
  console.log('');
  console.log('DUTRA OS — WhatsApp E2E Self-Test');
  console.log('=================================');
  for (const item of report.results) {
    console.log(`${item.ok ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
  }
  const passed = report.results.filter((item) => item.ok).length;
  console.log('');
  console.log(`${passed}/${report.results.length} PASS`);
  console.log(report.cleanup === 'kept'
    ? 'Dados E2E preservados por OG_WHATSAPP_E2E_KEEP/--keep.'
    : 'Cleanup automático executado.');
}

async function main() {
  const config = buildConfig();
  let report;
  try {
    report = await runE2E(config);
    report.cleanup = config.keepData ? 'kept' : 'done';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (config.json) {
      console.log(JSON.stringify({ ok: false, error: message }, null, 2));
    } else {
      console.error(`❌ E2E falhou: ${message}`);
      console.error(config.keepData
        ? 'Dados de diagnóstico foram preservados.'
        : 'Cleanup automático foi tentado antes da saída.');
    }
    process.exitCode = 1;
    return;
  }

  if (config.json) console.log(JSON.stringify(report, null, 2));
  else printReport(report);

  if (!report.ok) process.exitCode = 1;
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entry && import.meta.url === entry) {
  await main();
}
