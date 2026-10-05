import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import {
  chooseRegistryProvider,
  isCnpjShape,
  normalizeBrasilApiPayload,
  normalizeCnpj,
  normalizeCnpjWsPayload,
} from "../_shared/company-registry.mjs";

function internalKey(): string {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.default === "string" && parsed.default) return parsed.default;
    } catch {}
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function isInternalAuthorized(req: Request): boolean {
  const supplied = req.headers.get("apikey") ?? "";
  if (!supplied) return false;
  const valid = new Set<string>();
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      for (const value of Object.values(JSON.parse(raw))) {
        if (typeof value === "string" && value) valid.add(value);
      }
    } catch {}
  }
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) valid.add(legacy);
  return valid.has(supplied);
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload: any = null;
  try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

  if (!response.ok) {
    const error = new Error(`registry_http_${response.status}`);
    (error as any).status = response.status;
    (error as any).payload = payload;
    throw error;
  }
  return payload;
}

async function queryRegistry(cnpj: string) {
  const preferred = Deno.env.get("COMPANY_REGISTRY_PROVIDER") ?? "auto";
  const cnpjWsToken = Deno.env.get("CNPJWS_API_TOKEN") ?? "";
  const provider = chooseRegistryProvider(cnpj, {
    preferred,
    hasCnpjWsToken: Boolean(cnpjWsToken),
  });

  if (provider === "cnpjws") {
    const payload = await fetchJson(
      `https://comercial.cnpj.ws/cnpj/${encodeURIComponent(cnpj)}`,
      {
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${cnpjWsToken}`,
          "x_api_token": cnpjWsToken,
        },
      },
    );
    return normalizeCnpjWsPayload(payload);
  }

  const payload = await fetchJson(
    `https://brasilapi.com.br/api/cnpj/v1/${encodeURIComponent(cnpj)}`,
    {
      headers: {
        "Accept": "application/json",
        "User-Agent": "DUTRA-OS/1.0 company-registry",
      },
    },
  );
  return normalizeBrasilApiPayload(payload);
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const adminKey = internalKey();
  if (!supabaseUrl || !adminKey) {
    return Response.json({ error: "backend_not_configured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let jobId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    jobId = body?.job_id ?? null;
    const worker = String(body?.worker ?? "company-registry");

    let job: any = null;
    let company: any = null;

    if (!jobId) {
      const { data, error } = await supabase.rpc("claim_enrichment_job_v2", {
        p_job_type: "COMPANY_REGISTRY",
        p_worker: worker,
        p_lease_minutes: 15,
      });
      if (error) throw error;
      if (!data?.job) return Response.json({ ok: true, claimed: false });
      job = data.job;
      company = data.company;
      jobId = job.id;
    } else {
      const { data: jobRow, error: jobError } = await supabase
        .from("enrichment_jobs")
        .select("id,company_id,job_type,status,input")
        .eq("id", jobId)
        .single();
      if (jobError) throw jobError;
      if (jobRow.job_type !== "COMPANY_REGISTRY") throw new Error("wrong_job_type");
      job = jobRow;

      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("id,name,legal_name,cnpj")
        .eq("id", job.company_id)
        .single();
      if (companyError) throw companyError;
      company = companyRow;
    }

    const cnpj = normalizeCnpj(job?.input?.cnpj ?? company?.cnpj);
    if (!isCnpjShape(cnpj)) throw new Error("company_registry_cnpj_missing_or_invalid");

    const normalized = await queryRegistry(cnpj);

    const { data: applied, error: applyError } = await supabase.rpc(
      "apply_company_registry_v1",
      {
        p_job_id: jobId,
        p_payload: normalized,
      },
    );
    if (applyError) throw applyError;

    return Response.json({
      ok: true,
      claimed: true,
      job_id: jobId,
      company_id: company.id,
      provider: normalized.provider,
      result: applied,
    });
  } catch (error) {
    console.error(error);

    if (jobId) {
      try {
        const status = Number((error as any)?.status ?? 0);
        const message = error instanceof Error ? error.message : String(error);
        const retryable = status === 429 || status >= 500 || (status === 0 && /fetch|network|timeout|connection/i.test(message));
        const retryMinutes = status === 429 ? 60 : retryable ? 30 : 0;
        await supabase.rpc("fail_enrichment_job_v2", {
          p_job_id: jobId,
          p_error: message,
          p_retryable: retryable,
          p_retry_minutes: retryMinutes,
        });
      } catch (failError) {
        console.error("failed_to_record_registry_error", failError);
      }
    }

    return Response.json({
      error: "company_registry_failed",
      job_id: jobId,
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});
