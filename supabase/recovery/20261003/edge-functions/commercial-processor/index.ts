import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const PROCESSOR_VERSION = "1.0.0";
const AUTO_APPLY = 0.90;
const FOLLOW_UP_THRESHOLD = 0.85;

function isInternalAuthorized(req: Request): boolean {
  const supplied = req.headers.get("apikey") ?? "";
  if (!supplied) return false;
  const valid: string[] = [];
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      for (const value of Object.values(parsed)) {
        if (typeof value === "string" && value) valid.push(value);
      }
    } catch {}
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) valid.push(legacy);
  return valid.includes(supplied);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
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

function stringValue(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function numberValue(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseDate(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function factEnvelope(facts: Record<string, unknown>, key: string, fallbackConfidence: number | null) {
  const raw = facts[key];
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const confidence = numberValue(obj.confidence);
    return {
      value: Object.prototype.hasOwnProperty.call(obj, "value") ? obj.value : null,
      confidence: confidence !== null ? confidence : fallbackConfidence,
      confirmed: obj.confirmed === true,
    };
  }
  return { value: raw, confidence: fallbackConfidence, confirmed: false };
}

function mayWrite(
  currentValue: unknown,
  provenance: Record<string, unknown>,
  field: string,
  newConfidence: number | null,
  confirmed: boolean,
): boolean {
  if (!confirmed) return false;
  if (newConfidence === null || newConfidence < AUTO_APPLY) return false;
  if (currentValue === null || currentValue === undefined || currentValue === "") return true;

  const prev = provenance[field];
  if (!prev || typeof prev !== "object" || Array.isArray(prev)) {
    // Existing value without AI provenance is treated as human/confirmed data.
    return false;
  }

  const prevConfidence = numberValue((prev as Record<string, unknown>).confidence) ?? 1;
  return newConfidence > prevConfidence;
}

function stageRank(stage: string): number {
  const ranks: Record<string, number> = {
    lead: 1,
    qualified: 2,
    discovery: 3,
    proposal: 4,
    negotiation: 5,
    won: 6,
    lost: 6,
    dormant: 0,
  };
  return ranks[stage] ?? 0;
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) return json({ error: "unauthorized" }, 401);
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = adminKey();
  if (!url || !key) return json({ error: "backend_not_configured" }, 500);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let runId: string | null = null;

  try {
    const body = await req.json();
    const insightId = stringValue(body?.insight_id);
    if (!insightId) return json({ error: "invalid_insight_id" }, 400);

    const { data: previousRun, error: previousRunError } = await supabase
      .from("crm_processor_runs")
      .select("id,status,decision,actions")
      .eq("insight_id", insightId)
      .eq("processor_version", PROCESSOR_VERSION)
      .maybeSingle();
    if (previousRunError) throw previousRunError;

    if (previousRun?.status === "processed" || previousRun?.status === "skipped") {
      return json({
        ok: true,
        duplicate: true,
        run_id: previousRun.id,
        decision: previousRun.decision,
        actions: previousRun.actions,
      });
    }

    if (previousRun?.id) {
      runId = previousRun.id;
      const { error } = await supabase
        .from("crm_processor_runs")
        .update({
          status: "started",
          decision: null,
          actions: [],
          error_message: null,
          started_at: new Date().toISOString(),
          completed_at: null,
        })
        .eq("id", runId);
      if (error) throw error;
    } else {
      const { data: run, error } = await supabase
        .from("crm_processor_runs")
        .insert({
          insight_id: insightId,
          processor_version: PROCESSOR_VERSION,
          status: "started",
        })
        .select("id")
        .single();
      if (error) throw error;
      runId = run.id;
    }

    const { data: insight, error: insightError } = await supabase
      .from("crm_insights")
      .select("*")
      .eq("id", insightId)
      .single();
    if (insightError) throw insightError;

    const confidence = numberValue(insight.confidence);
    const facts = (insight.facts && typeof insight.facts === "object" && !Array.isArray(insight.facts))
      ? insight.facts as Record<string, unknown>
      : {};
    const actions: Record<string, unknown>[] = [];

    if (confidence === null || confidence < 0.75) {
      await supabase.from("crm_processor_runs").update({
        status: "skipped",
        decision: "low_confidence",
        actions,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);

      return json({ ok: true, run_id: runId, decision: "low_confidence", actions });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("crm_conversations")
      .select("id,company_id,contact_id")
      .eq("id", insight.conversation_id)
      .single();
    if (conversationError) throw conversationError;

    let companyId: string | null = conversation.company_id ?? null;
    const contactId: string | null = conversation.contact_id ?? null;

    const companyFact = factEnvelope(facts, "company_name", confidence);
    const companyName = stringValue(companyFact.value);

    if (!companyId && companyName && companyFact.confirmed && (companyFact.confidence ?? 0) >= AUTO_APPLY) {
      const { data: existingCompany, error: companyLookupError } = await supabase
        .from("companies")
        .select("id,name")
        .ilike("name", companyName)
        .limit(1)
        .maybeSingle();
      if (companyLookupError) throw companyLookupError;

      if (existingCompany?.id) {
        companyId = existingCompany.id;
      } else {
        const { data: createdCompany, error: companyCreateError } = await supabase
          .from("companies")
          .insert({ name: companyName, enrichment_status: "pending" })
          .select("id,name")
          .single();
        if (companyCreateError) throw companyCreateError;
        companyId = createdCompany.id;
        actions.push({ type: "company_created", company_id: companyId });
      }

      const { error: linkError } = await supabase
        .from("crm_conversations")
        .update({ company_id: companyId, updated_at: new Date().toISOString() })
        .eq("id", conversation.id);
      if (linkError) throw linkError;

      if (contactId) {
        const { error: contactLinkError } = await supabase
          .from("crm_contacts")
          .update({ company_id: companyId, updated_at: new Date().toISOString() })
          .eq("id", contactId)
          .is("company_id", null);
        if (contactLinkError) throw contactLinkError;
      }
    }

    let opportunity: Record<string, any> | null = null;

    if (insight.opportunity_id) {
      const { data, error } = await supabase
        .from("sales_opportunities")
        .select("*")
        .eq("id", insight.opportunity_id)
        .maybeSingle();
      if (error) throw error;
      opportunity = data;
    }

    if (!opportunity) {
      const { data, error } = await supabase
        .from("sales_opportunities")
        .select("*")
        .eq("source_conversation_id", conversation.id)
        .neq("stage", "won")
        .neq("stage", "lost")
        .neq("stage", "dormant")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      opportunity = data;
    }

    if (!opportunity && companyId) {
      const { data, error } = await supabase
        .from("sales_opportunities")
        .insert({
          company_id: companyId,
          primary_contact_id: contactId,
          source_conversation_id: conversation.id,
          source: "whatsapp",
          stage: "lead",
          metadata: { created_from_insight_id: insightId },
        })
        .select("*")
        .single();
      if (error) throw error;
      opportunity = data;
      actions.push({ type: "opportunity_created", opportunity_id: opportunity.id });
    }

    if (!companyId) {
      await supabase.from("crm_activities").upsert({
        conversation_id: conversation.id,
        contact_id: contactId,
        source_insight_id: insightId,
        activity_type: "task",
        status: "pending",
        title: "Identificar empresa do contato",
        description: "A conversa ainda não possui empresa confirmada para criar a oportunidade.",
        metadata: { reason: "missing_company" },
      }, { onConflict: "source_insight_id,activity_type" });

      actions.push({ type: "review_task_created", reason: "missing_company" });

      await supabase.from("crm_processor_runs").update({
        status: "processed",
        decision: "needs_company",
        actions,
        completed_at: new Date().toISOString(),
      }).eq("id", runId);

      return json({ ok: true, run_id: runId, decision: "needs_company", actions });
    }

    if (!opportunity) throw new Error("opportunity_not_resolved");

    const provenance = (
      opportunity.data_provenance &&
      typeof opportunity.data_provenance === "object" &&
      !Array.isArray(opportunity.data_provenance)
    ) ? opportunity.data_provenance as Record<string, unknown> : {};

    const patch: Record<string, unknown> = {};
    const nextProvenance: Record<string, unknown> = { ...provenance };

    const fleetFact = factEnvelope(facts, "fleet_size", confidence);
    const fleetSize = numberValue(fleetFact.value);
    if (
      fleetSize !== null &&
      Number.isInteger(fleetSize) &&
      fleetSize > 0 &&
      fleetSize <= 100000 &&
      mayWrite(opportunity.fleet_size, provenance, "fleet_size", fleetFact.confidence, fleetFact.confirmed)
    ) {
      patch.fleet_size = fleetSize;
      patch.fleet_source = "whatsapp_fact";
      patch.fleet_confidence = fleetFact.confidence;
      nextProvenance.fleet_size = {
        source: "crm_insight",
        insight_id: insightId,
        confidence: fleetFact.confidence,
        confirmed: fleetFact.confirmed,
        updated_at: new Date().toISOString(),
      };
      actions.push({ type: "field_updated", field: "fleet_size", value: fleetSize });
    }

    const painFact = factEnvelope(facts, "primary_pain", confidence);
    const primaryPain = stringValue(painFact.value);
    if (
      primaryPain &&
      mayWrite(opportunity.primary_pain, provenance, "primary_pain", painFact.confidence, painFact.confirmed)
    ) {
      patch.primary_pain = primaryPain.slice(0, 2000);
      nextProvenance.primary_pain = {
        source: "crm_insight",
        insight_id: insightId,
        confidence: painFact.confidence,
        confirmed: painFact.confirmed,
        updated_at: new Date().toISOString(),
      };
      actions.push({ type: "field_updated", field: "primary_pain" });
    }

    const profileFact = factEnvelope(facts, "vehicle_profile_code", confidence);
    const vehicleProfileCode = stringValue(profileFact.value);
    let resolvedProfile: { id: string; code: string; name: string } | null = null;

    if (vehicleProfileCode && (profileFact.confidence ?? 0) >= AUTO_APPLY) {
      const { data, error } = await supabase
        .from("vehicle_profiles")
        .select("id,code,name")
        .eq("code", vehicleProfileCode)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      resolvedProfile = data;

      if (
        resolvedProfile &&
        mayWrite(opportunity.vehicle_profile_id, provenance, "vehicle_profile_id", profileFact.confidence, profileFact.confirmed)
      ) {
        patch.vehicle_profile_id = resolvedProfile.id;
        nextProvenance.vehicle_profile_id = {
          source: "crm_insight",
          insight_id: insightId,
          confidence: profileFact.confidence,
          confirmed: profileFact.confirmed,
          code: resolvedProfile.code,
          updated_at: new Date().toISOString(),
        };
        actions.push({ type: "field_updated", field: "vehicle_profile_id", code: resolvedProfile.code });
      }
    }

    const objections = Array.isArray(insight.objections) ? insight.objections : [];
    if (objections.length > 0 && confidence >= AUTO_APPLY && insight.review_status === "approved") {
      const current = Array.isArray(opportunity.objections) ? opportunity.objections : [];
      const merged = Array.from(new Set([...current, ...objections].map((v) => JSON.stringify(v))))
        .map((v) => JSON.parse(v));
      patch.objections = merged;
      actions.push({ type: "objections_merged", count: objections.length });
    }

    const projectedFleet = (patch.fleet_size as number | undefined) ?? opportunity.fleet_size ?? null;
    const projectedProfileId = (patch.vehicle_profile_id as string | undefined) ?? opportunity.vehicle_profile_id ?? null;

    if (Object.keys(patch).length > 0) {
      patch.data_provenance = nextProvenance;
      patch.updated_at = new Date().toISOString();

      const { data: updatedOpportunity, error } = await supabase
        .from("sales_opportunities")
        .update(patch)
        .eq("id", opportunity.id)
        .select("*")
        .single();
      if (error) throw error;
      opportunity = updatedOpportunity;
    }

    const nextAction = stringValue(insight.next_action);
    const dueFact = factEnvelope(facts, "next_action_due_at", confidence);
    const dueAt = parseDate(dueFact.value);

    const sourceMode = insight.metadata && typeof insight.metadata === "object" ? insight.metadata.source_mode : null;
    if (nextAction && confidence >= FOLLOW_UP_THRESHOLD && (sourceMode === "deterministic_explicit" || insight.review_status === "approved")) {
      const { error } = await supabase.from("crm_activities").upsert({
        company_id: companyId,
        contact_id: contactId,
        conversation_id: conversation.id,
        opportunity_id: opportunity.id,
        source_insight_id: insightId,
        activity_type: "follow_up",
        status: "pending",
        title: nextAction.slice(0, 500),
        description: "Próxima ação extraída da conversa do WhatsApp.",
        due_at: dueAt,
        metadata: {
          confidence,
          insight_id: insightId,
          source: "commercial-processor",
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "source_insight_id,activity_type" });
      if (error) throw error;
      actions.push({ type: "follow_up_created", due_at: dueAt });
    }

    const effectiveFleet = opportunity.fleet_size ?? null;
    let effectiveProfileId = opportunity.vehicle_profile_id ?? null;
    let effectiveProfileCode: string | null = resolvedProfile?.code ?? null;

    if (effectiveProfileId && !effectiveProfileCode) {
      const { data, error } = await supabase
        .from("vehicle_profiles")
        .select("id,code,name")
        .eq("id", effectiveProfileId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        effectiveProfileCode = data.code;
        resolvedProfile = data;
      }
    }

    let proposalGenerated = false;

    if (
      companyId &&
      effectiveFleet &&
      effectiveProfileId &&
      effectiveProfileCode &&
      !opportunity.latest_proposal_id &&
      !opportunity.proposal_triggered_at &&
      confidence >= AUTO_APPLY
    ) {
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id,name")
        .eq("id", companyId)
        .single();
      if (companyError) throw companyError;

      const e2eMode = Boolean(
        insight.metadata &&
        typeof insight.metadata === "object" &&
        insight.metadata.e2e === true
      );

      const response = await fetch(url + "/functions/v1/proposal-engine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          ...(e2eMode ? { "x-og-e2e": "1" } : {}),
        },
        body: JSON.stringify({
          company_name: company.name,
          fleet_size: effectiveFleet,
          vehicle_profile_code: effectiveProfileCode,
        }),
      });

      const proposalResult = await response.json();
      if (!response.ok || !proposalResult?.proposal_id) {
        throw new Error("proposal_engine_failed:" + JSON.stringify(proposalResult));
      }

      const { error: opportunityProposalError } = await supabase
        .from("sales_opportunities")
        .update({
          latest_proposal_id: proposalResult.proposal_id,
          proposal_triggered_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", opportunity.id);
      if (opportunityProposalError) throw opportunityProposalError;

      const { error: activityError } = await supabase.from("crm_activities").upsert({
        company_id: companyId,
        contact_id: contactId,
        conversation_id: conversation.id,
        opportunity_id: opportunity.id,
        source_insight_id: insightId,
        activity_type: "proposal",
        status: "completed",
        title: "Proposta OG gerada automaticamente",
        description: "Proposta/ROI criada após empresa, frota e perfil de veículo atingirem os critérios mínimos.",
        completed_at: new Date().toISOString(),
        metadata: {
          proposal_id: proposalResult.proposal_id,
          processor_version: PROCESSOR_VERSION,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "source_insight_id,activity_type" });
      if (activityError) throw activityError;

      proposalGenerated = true;
      actions.push({
        type: "proposal_generated",
        proposal_id: proposalResult.proposal_id,
        fleet_size: effectiveFleet,
        vehicle_profile_code: effectiveProfileCode,
      });
    }

    if (!effectiveProfileId && effectiveFleet) {
      const { error } = await supabase.from("crm_activities").upsert({
        company_id: companyId,
        contact_id: contactId,
        conversation_id: conversation.id,
        opportunity_id: opportunity.id,
        source_insight_id: insightId,
        activity_type: "task",
        status: "pending",
        title: "Confirmar configuração do veículo",
        description: "A frota foi identificada, mas falta o perfil do veículo para gerar a proposta.",
        metadata: { reason: "missing_vehicle_profile" },
        updated_at: new Date().toISOString(),
      }, { onConflict: "source_insight_id,activity_type" });
      if (error) throw error;
      actions.push({ type: "review_task_created", reason: "missing_vehicle_profile" });
    }

    const decision = proposalGenerated
      ? "proposal_generated"
      : actions.length > 0
      ? "crm_updated"
      : "no_safe_change";

    if (actions.length > 0 && sourceMode === "deterministic_explicit") {
      const { error } = await supabase
        .from("crm_insights")
        .update({ review_status: "auto_applied" })
        .eq("id", insightId);
      if (error) throw error;
    }

    const { error: finishError } = await supabase
      .from("crm_processor_runs")
      .update({
        status: "processed",
        decision,
        actions,
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);
    if (finishError) throw finishError;

    return json({
      ok: true,
      duplicate: false,
      run_id: runId,
      decision,
      opportunity_id: opportunity.id,
      actions,
    });
  } catch (error) {
    console.error(error);
    if (runId) {
      try {
        await supabase.from("crm_processor_runs").update({
          status: "failed",
          error_message: error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000),
          completed_at: new Date().toISOString(),
        }).eq("id", runId);
      } catch {}
    }

    return json({
      error: "commercial_processor_failed",
      message: error instanceof Error ? error.message : String(error),
      run_id: runId,
    }, 500);
  }
});