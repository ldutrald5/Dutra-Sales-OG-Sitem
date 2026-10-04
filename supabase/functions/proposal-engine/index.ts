import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

async function startDiscoveryPipeline(
  supabaseUrl: string,
  adminKey: string,
  jobId: string,
) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/company-discovery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": adminKey,
      },
      body: JSON.stringify({ job_id: jobId, worker: "proposal-engine" }),
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("company-discovery failed", response.status, text);
      return;
    }

    console.log("company-discovery started/completed", text.slice(0, 1000));
  } catch (error) {
    console.error("background discovery pipeline error", error);
  }
}


function isInternalAuthorized(req: Request): boolean {
  const supplied = req.headers.get("apikey") ?? "";
  if (!supplied) return false;

  const valid: string[] = [];
  const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeysRaw) {
    try {
      const parsed = JSON.parse(secretKeysRaw);
      for (const value of Object.values(parsed)) {
        if (typeof value === "string" && value) valid.push(value);
      }
    } catch {}
  }

  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) valid.push(legacy);

  return valid.includes(supplied);
}


type RequestBody = {
  company_name: string;
  fleet_size: number;
  vehicle_profile_code?: string;
  financial_version?: string | null;
  overrides?: {
    monthly_km?: number | null;
    consumption_km_l?: number | null;
    diesel_price?: number | null;
    monthly_diesel_cost_per_vehicle?: number | null;
    tire_price?: number | null;
    tire_replacement_factor?: number | null;
  };
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  try {
    const body = (await req.json()) as RequestBody;
    const companyName = body.company_name?.trim();
    const fleetSize = Number(body.fleet_size);
    const e2eMode = req.headers.get("x-og-e2e") === "1" &&
      Boolean(companyName?.startsWith("[E2E]"));

    if (!companyName || companyName.length < 2) {
      return json({ error: "invalid_company_name" }, 400);
    }

    if (!Number.isInteger(fleetSize) || fleetSize <= 0 || fleetSize > 100000) {
      return json({ error: "invalid_fleet_size" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");

    let adminKey = legacyServiceRole ?? "";
    if (secretKeysRaw) {
      try {
        const secretKeys = JSON.parse(secretKeysRaw);
        adminKey = secretKeys.default ?? adminKey;
      } catch {}
    }

    if (!adminKey) throw new Error("No Supabase admin key is available");

    const supabase = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const vehicleProfileCode = body.vehicle_profile_code ?? "rodotrem_9_eixos";
    const overrides = body.overrides ?? {};

    let companyId: string | null = null;

    const { data: existingCompany, error: companyLookupError } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", companyName)
      .limit(1)
      .maybeSingle();

    if (companyLookupError) throw companyLookupError;

    if (existingCompany?.id) {
      companyId = existingCompany.id;
    } else {
      const { data: createdCompany, error: companyInsertError } = await supabase
        .from("companies")
        .insert({ name: companyName, enrichment_status: "pending" })
        .select("id")
        .single();

      if (companyInsertError) throw companyInsertError;
      companyId = createdCompany.id;
    }

    const { data: calculation, error: calculationError } = await supabase.rpc(
      "calculate_proposal_v2",
      {
        p_fleet_size: fleetSize,
        p_vehicle_profile_code: vehicleProfileCode,
        p_financial_version: body.financial_version ?? null,
        p_monthly_km: overrides.monthly_km ?? null,
        p_consumption_km_l: overrides.consumption_km_l ?? null,
        p_diesel_price: overrides.diesel_price ?? null,
        p_monthly_diesel_cost_per_vehicle:
          overrides.monthly_diesel_cost_per_vehicle ?? null,
        p_tire_price: overrides.tire_price ?? null,
        p_tire_replacement_factor: overrides.tire_replacement_factor ?? null,
      },
    );

    if (calculationError) throw calculationError;

    const [profileResult, financeResult, templateResult] = await Promise.all([
      supabase.from("vehicle_profiles").select("id").eq("code", vehicleProfileCode).limit(1).maybeSingle(),
      supabase.from("financial_parameter_sets").select("id, version").eq("version", calculation.input.financial_version).limit(1).maybeSingle(),
      supabase.from("proposal_templates").select("id, version").eq("code", "og-premium-5-pages").eq("active", true).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (profileResult.error) throw profileResult.error;
    if (financeResult.error) throw financeResult.error;
    if (templateResult.error) throw templateResult.error;

    const proposalStatus =
      calculation.engine.status === "needs_configuration" ? "draft" : "calculating";

    const proposalSnapshot = {
      company: { id: companyId, name: companyName, enrichment_status: "pending" },
      ...calculation,
      metadata: {
        calculation_version: calculation.engine.version,
        template_code: "og-premium-5-pages",
        template_version: templateResult.data?.version ?? "1.0.0",
        e2e: e2eMode,
      },
    };

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .insert({
        company_id: companyId,
        company_name_input: companyName,
        fleet_size: fleetSize,
        vehicle_profile_id: profileResult.data?.id ?? null,
        financial_parameter_set_id: financeResult.data?.id ?? null,
        proposal_template_id: templateResult.data?.id ?? null,
        calculation_version: calculation.engine.version,
        template_version: templateResult.data?.version ?? "1.0.0",
        status: proposalStatus,
        total_tires: calculation.fleet.total_tires,
        total_equalizers: calculation.fleet.total_equalizers,
        total_supports: calculation.fleet.total_supports,
        investment_total: calculation.investment.total,
        protected_asset_value: calculation.roi.protected_asset_value,
        annual_tire_savings: calculation.roi.annual_tire_savings,
        annual_fuel_savings: calculation.roi.annual_fuel_savings_default,
        annual_total_savings: calculation.roi.annual_total_savings,
        roi_percent: calculation.roi.roi_percent,
        payback_months: calculation.roi.payback_months,
        proposal_snapshot: proposalSnapshot,
      })
      .select("id, status, created_at")
      .single();

    if (proposalError) throw proposalError;

    const { data: enrichmentJob, error: enrichmentJobError } = await supabase
      .from("enrichment_jobs")
      .select("id")
      .eq("proposal_id", proposal.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrichmentJobError) throw enrichmentJobError;

    if (enrichmentJob?.id && e2eMode) {
      const { error: cancelE2EJobError } = await supabase
        .from("enrichment_jobs")
        .update({
          status: "cancelled",
          output: { reason: "e2e_self_test" },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", enrichmentJob.id);

      if (cancelE2EJobError) throw cancelE2EJobError;

      const { error: restoreE2EProposalStatusError } = await supabase
        .from("proposals")
        .update({ status: proposalStatus })
        .eq("id", proposal.id);

      if (restoreE2EProposalStatusError) throw restoreE2EProposalStatusError;
    }

    if (enrichmentJob?.id && !e2eMode) {
      EdgeRuntime.waitUntil(
        startDiscoveryPipeline(supabaseUrl, adminKey, enrichmentJob.id),
      );
    }

    return json({
      proposal_id: proposal.id,
      status: proposal.status,
      created_at: proposal.created_at,
      company_id: companyId,
      calculation,
      pipeline_started: Boolean(enrichmentJob?.id) && !e2eMode,
      enrichment_job_id: enrichmentJob?.id ?? null,
      e2e_mode: e2eMode,
      next_step:
        calculation.engine.status === "needs_configuration"
          ? "complete_blocking_configuration"
          : "pipeline_running",
    });
  } catch (error) {
    console.error(error);
    return json({
      error: "proposal_engine_failed",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});