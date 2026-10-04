import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function adminKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  let key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (raw) {
    try {
      key = JSON.parse(raw).default ?? key;
    } catch {}
  }
  return key;
}

function j(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function confirmed(value: unknown, confidence = 0.99) {
  return { value, confidence, confirmed: true };
}

function unconfirmed(value: unknown, confidence = 0.99) {
  return { value, confidence, confirmed: false };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return j({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = adminKey();
  if (!url || !key) return j({ error: "backend_not_configured" }, 500);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = req.headers.get("x-og-e2e-token") ?? "";
  const { data: expected, error: tokenError } = await supabase
    .from("internal_service_tokens")
    .select("token_hash,active")
    .eq("name", "og_e2e_runner_token")
    .maybeSingle();

  if (tokenError) return j({ error: "token_validation_failed" }, 500);

  const suppliedHash = token ? await sha256(token) : "";
  if (!expected?.active || !token || suppliedHash !== expected.token_hash) {
    return j({ error: "unauthorized" }, 401);
  }

  const runId = crypto.randomUUID();
  const positiveCompany = `[E2E] DUTRA OG POSITIVE ${runId}`;
  const negativeCompany = `[E2E] DUTRA OG NEGATIVE ${runId}`;
  const positiveThread = `e2e-positive-thread-${runId}`;
  const negativeThread = `e2e-negative-thread-${runId}`;
  const positiveContact = `e2e-positive-contact-${runId}`;
  const negativeContact = `e2e-negative-contact-${runId}`;
  const positiveMessage = `e2e-positive-message-${runId}`;
  const negativeMessage = `e2e-negative-message-${runId}`;
  const positiveEvent = `e2e:${runId}:positive`;
  const negativeEvent = `e2e:${runId}:negative`;
  const results: Array<Record<string, unknown>> = [];
  const state: Record<string, string | null> = {};

  const push = (name: string, ok: boolean, detail: unknown = null) => {
    results.push({ name, ok, detail });
    if (!ok) throw new Error(`${name}: ${JSON.stringify(detail)}`);
  };

  async function ingest(payload: unknown) {
    const res = await fetch(`${url}/functions/v1/whatsapp-ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`whatsapp-ingest ${res.status}: ${JSON.stringify(data)}`);
    return data;
  }

  async function cleanup() {
    const companyIds = [state.positiveCompanyId, state.negativeCompanyId].filter(Boolean) as string[];

    for (const companyId of companyIds) {
      await supabase.from("crm_activities").delete().eq("company_id", companyId);
      await supabase.from("sales_opportunities").delete().eq("company_id", companyId);
      await supabase.from("proposals").delete().eq("company_id", companyId);
    }

    for (const conversationId of [state.positiveConversationId, state.negativeConversationId].filter(Boolean) as string[]) {
      await supabase.from("crm_conversations").delete().eq("id", conversationId);
    }

    for (const contactId of [state.positiveContactId, state.negativeContactId].filter(Boolean) as string[]) {
      await supabase.from("crm_contacts").delete().eq("id", contactId);
    }

    await supabase.from("integration_events").delete().eq("source", "e2e").eq("external_event_id", positiveEvent);
    await supabase.from("integration_events").delete().eq("source", "e2e").eq("external_event_id", negativeEvent);

    for (const companyId of companyIds) {
      await supabase.from("companies").delete().eq("id", companyId);
    }
  }

  let failed: string | null = null;

  try {
    const { data: negCompany, error: negCompanyError } = await supabase
      .from("companies")
      .insert({ name: negativeCompany, enrichment_status: "pending" })
      .select("id")
      .single();

    if (negCompanyError) throw negCompanyError;
    state.negativeCompanyId = negCompany.id;

    const now = Date.now();
    const dueAt = new Date(now + 86400000).toISOString();

    const positivePayload = {
      event_id: positiveEvent,
      event_type: "message.upsert",
      provider: "e2e",
      contact: {
        external_id: positiveContact,
        full_name: "Cliente Sintético E2E",
        role_title: "Gestor de Frota",
        decision_level: "decision_maker",
        metadata: { e2e: true, run_id: runId },
      },
      conversation: {
        external_thread_id: positiveThread,
        chat_type: "direct",
        title: positiveCompany,
        metadata: { e2e: true, run_id: runId },
      },
      message: {
        external_message_id: positiveMessage,
        direction: "inbound",
        sender_external_id: positiveContact,
        sender_name: "Cliente Sintético E2E",
        body: "Temos 3 caminhões rodotrem de 9 eixos. Pode preparar a proposta.",
        message_type: "text",
        sent_at: new Date(now).toISOString(),
        raw_payload: { source: "og_e2e_runner", run_id: runId },
      },
      insight: {
        insight_type: "deterministic_explicit_fact",
        facts: {
          company_name: confirmed(positiveCompany, 1),
          fleet_size: confirmed(3),
          vehicle_profile_code: confirmed("rodotrem_9_eixos"),
          primary_pain: confirmed("controle e economia operacional dos pneus"),
          next_action_due_at: confirmed(dueAt),
        },
        hypotheses: {},
        objections: [],
        buying_signals: ["cliente solicitou proposta"],
        open_questions: [],
        next_action: "Preparar e revisar proposta solicitada pelo cliente",
        confidence: 0.99,
        model_name: "deterministic-e2e",
        model_version: "1.0.0",
        source_message_ids: [positiveMessage],
        metadata: {
          source_mode: "deterministic_explicit",
          e2e: true,
          run_id: runId,
        },
      },
      raw_event: { source: "og_e2e_runner", e2e: true, run_id: runId },
    };

    const first = await ingest(positivePayload);
    state.positiveContactId = first.contact_id ?? null;
    state.positiveConversationId = first.conversation_id ?? null;
    state.positiveMessageId = first.message_id ?? null;
    state.positiveInsightId = first.insight_id ?? null;
    state.positiveOpportunityId = first.processor?.opportunity_id ?? null;

    push("01 ingestão", first.ok === true && first.duplicate === false && Boolean(first.message_id), first);

    const { data: posOpp, error: posOppError } = await supabase
      .from("sales_opportunities")
      .select("id,company_id,fleet_size,vehicle_profile_id,latest_proposal_id,stage,proposal_triggered_at")
      .eq("id", state.positiveOpportunityId)
      .single();

    if (posOppError) throw posOppError;
    state.positiveCompanyId = posOpp.company_id;
    state.positiveProposalId = posOpp.latest_proposal_id;

    push("02 oportunidade", Boolean(posOpp.id && posOpp.company_id), { id: posOpp.id });
    push("03 fato de frota", Number(posOpp.fleet_size) === 3, { fleet_size: posOpp.fleet_size });

    const { data: profile, error: profileError } = await supabase
      .from("vehicle_profiles")
      .select("id,code,name")
      .eq("id", posOpp.vehicle_profile_id)
      .single();

    if (profileError) throw profileError;
    push("04 perfil veicular", profile.code === "rodotrem_9_eixos", { code: profile.code });

    const { data: followUps, error: followError } = await supabase
      .from("crm_activities")
      .select("id,status,title,due_at")
      .eq("opportunity_id", posOpp.id)
      .eq("activity_type", "follow_up");

    if (followError) throw followError;
    push("05 follow-up", followUps.length === 1 && followUps[0].status === "pending", followUps);

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id,status,company_id,fleet_size,investment_total,annual_total_savings,roi_percent,payback_months,proposal_snapshot")
      .eq("id", posOpp.latest_proposal_id)
      .single();

    if (proposalError) throw proposalError;
    const proposalOk =
      Boolean(proposal.id) &&
      ["draft", "calculating"].includes(proposal.status) &&
      Number(proposal.fleet_size) === 3 &&
      proposal.proposal_snapshot?.metadata?.e2e === true;
    push("06 proposta/ROI", proposalOk, {
      id: proposal.id,
      status: proposal.status,
      roi_percent: proposal.roi_percent,
      payback_months: proposal.payback_months,
    });

    const { data: processorRun, error: processorError } = await supabase
      .from("crm_processor_runs")
      .select("id,status,decision,actions")
      .eq("insight_id", state.positiveInsightId)
      .single();

    if (processorError) throw processorError;
    push("07 auditoria do processador",
      processorRun.status === "processed" && processorRun.decision === "proposal_generated",
      { status: processorRun.status, decision: processorRun.decision }
    );

    const duplicate = await ingest(positivePayload);
    push("08 idempotência", duplicate.ok === true && duplicate.duplicate === true, duplicate);

    const [messages, insights, proposals] = await Promise.all([
      supabase.from("crm_messages").select("id").eq("provider", "e2e").eq("external_message_id", positiveMessage),
      supabase.from("crm_insights").select("id").eq("message_id", state.positiveMessageId),
      supabase.from("proposals").select("id").eq("company_id", state.positiveCompanyId),
    ]);

    if (messages.error) throw messages.error;
    if (insights.error) throw insights.error;
    if (proposals.error) throw proposals.error;

    push("09 ausência de duplicatas",
      messages.data.length === 1 && insights.data.length === 1 && proposals.data.length === 1,
      {
        messages: messages.data.length,
        insights: insights.data.length,
        proposals: proposals.data.length,
      }
    );

    const negativePayload = {
      event_id: negativeEvent,
      event_type: "message.upsert",
      provider: "e2e",
      company_id: state.negativeCompanyId,
      contact: {
        external_id: negativeContact,
        full_name: "Contato Hipótese E2E",
        metadata: { e2e: true, run_id: runId },
      },
      conversation: {
        external_thread_id: negativeThread,
        chat_type: "direct",
        title: negativeCompany,
        metadata: { e2e: true, run_id: runId },
      },
      message: {
        external_message_id: negativeMessage,
        direction: "inbound",
        sender_external_id: negativeContact,
        sender_name: "Contato Hipótese E2E",
        body: "Talvez a frota tenha 777 veículos e talvez seja rodotrem de 9 eixos.",
        message_type: "text",
        sent_at: new Date(now + 1000).toISOString(),
        raw_payload: { source: "og_e2e_runner", run_id: runId },
      },
      insight: {
        insight_type: "ai_suggestion_e2e",
        facts: {
          fleet_size: unconfirmed(777),
          vehicle_profile_code: unconfirmed("rodotrem_9_eixos"),
        },
        hypotheses: {
          fleet_size: 777,
          vehicle_profile_code: "rodotrem_9_eixos",
        },
        objections: [],
        buying_signals: [],
        open_questions: ["Confirmar tamanho da frota e configuração veicular"],
        next_action: null,
        confidence: 0.99,
        model_name: "synthetic-ai-e2e",
        model_version: "1.0.0",
        source_message_ids: [negativeMessage],
        metadata: {
          source_mode: "ai_suggestion",
          e2e: true,
          run_id: runId,
        },
      },
      raw_event: { source: "og_e2e_runner", e2e: true, run_id: runId },
    };

    const negative = await ingest(negativePayload);
    state.negativeContactId = negative.contact_id ?? null;
    state.negativeConversationId = negative.conversation_id ?? null;
    state.negativeMessageId = negative.message_id ?? null;
    state.negativeInsightId = negative.insight_id ?? null;
    state.negativeOpportunityId = negative.processor?.opportunity_id ?? null;

    const [{ data: negOpp, error: negOppError }, { data: negInsight, error: negInsightError }] = await Promise.all([
      supabase
        .from("sales_opportunities")
        .select("id,company_id,fleet_size,vehicle_profile_id,latest_proposal_id")
        .eq("id", state.negativeOpportunityId)
        .single(),
      supabase
        .from("crm_insights")
        .select("id,review_status,facts,hypotheses")
        .eq("id", state.negativeInsightId)
        .single(),
    ]);

    if (negOppError) throw negOppError;
    if (negInsightError) throw negInsightError;

    push("10 hipótese não vira fato",
      Boolean(negOpp.id) &&
      negOpp.fleet_size == null &&
      negOpp.vehicle_profile_id == null &&
      negInsight.review_status === "pending",
      {
        fleet_size: negOpp.fleet_size,
        vehicle_profile_id: negOpp.vehicle_profile_id,
        review_status: negInsight.review_status,
      }
    );

    push("11 hipótese não gera proposta", negOpp.latest_proposal_id == null, {
      latest_proposal_id: negOpp.latest_proposal_id,
    });

    const [{ data: posEvent, error: posEventError }, { data: negEvent, error: negEventError }] = await Promise.all([
      supabase
        .from("integration_events")
        .select("id,processing_status,processed_at")
        .eq("source", "e2e")
        .eq("external_event_id", positiveEvent)
        .single(),
      supabase
        .from("integration_events")
        .select("id,processing_status,processed_at")
        .eq("source", "e2e")
        .eq("external_event_id", negativeEvent)
        .single(),
    ]);

    if (posEventError) throw posEventError;
    if (negEventError) throw negEventError;

    push("12 trilha de integração",
      posEvent.processing_status === "processed" && negEvent.processing_status === "processed",
      {
        positive: posEvent.processing_status,
        negative: negEvent.processing_status,
      }
    );
  } catch (error) {
    failed = error instanceof Error ? error.message : String(error);
  }

  try {
    await cleanup();
  } catch (cleanupError) {
    const cleanupMessage = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
    failed = failed ? `${failed}; cleanup: ${cleanupMessage}` : `cleanup: ${cleanupMessage}`;
  }

  return j({
    ok: failed === null && results.every((x) => x.ok === true),
    run_id: runId,
    passed: results.filter((x) => x.ok === true).length,
    total: 12,
    results,
    error: failed,
    cleanup: "attempted",
    checked_at: new Date().toISOString(),
  }, failed ? 500 : 200);
});