import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  return toHex(await crypto.subtle.digest("SHA-256", bytes));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const token = req.headers.get("x-og-cron-token") ?? "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl) {
    return Response.json({ error: "supabase_url_missing" }, { status: 500 });
  }

  let adminKey = legacy ?? "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      adminKey = parsed.default ?? adminKey;
    } catch {}
  }

  if (!adminKey) {
    return Response.json({ error: "admin_key_missing" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: expected, error: tokenError } = await supabase
    .from("internal_service_tokens")
    .select("token_hash, active")
    .eq("name", "og_pipeline_cron_token")
    .maybeSingle();

  if (tokenError) {
    console.error(tokenError);
    return Response.json({ error: "token_validation_failed" }, { status: 500 });
  }

  const suppliedHash = token ? await sha256(token) : "";
  if (!expected?.active || !token || suppliedHash !== expected.token_hash) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    enrichment: "none",
    brand_asset: "none",
    render: "none",
  };

  let enrichmentClaimed = false;

  // 1) Resume at most one enrichment job.
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/company-discovery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": adminKey,
      },
      body: JSON.stringify({ worker: "cron-recovery" }),
    });

    const payload = await res.json().catch(() => ({}));
    enrichmentClaimed = payload?.claimed === true;
    results.enrichment = {
      ok: res.ok,
      status: res.status,
      claimed: payload?.claimed ?? null,
      job_id: payload?.job_id ?? null,
      error: payload?.error ?? null,
    };
  } catch (error) {
    results.enrichment = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 2) Resume at most one pending brand asset copy.
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/brand-asset-copy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": adminKey,
      },
      body: JSON.stringify({}),
    });

    const payload = await res.json().catch(() => ({}));
    results.brand_asset = {
      ok: res.ok,
      status: res.status,
      claimed: payload?.claimed ?? null,
      asset_id: payload?.asset_id ?? null,
      error: payload?.error ?? null,
    };
  } catch (error) {
    results.brand_asset = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 3) Resume a render job only when this run did not just start an enrichment.
  // Fresh enrichment owns its own continuation pipeline, avoiding duplicate renders.
  if (!enrichmentClaimed) try {
    const { data: claimed, error: claimError } = await supabase.rpc(
      "claim_render_job_v1",
      { p_worker: "cron-recovery", p_lease_minutes: 15 },
    );

    if (claimError) throw claimError;

    if (claimed?.job && claimed?.proposal?.id) {
      const res = await fetch(`${supabaseUrl}/functions/v1/proposal-pdf-premium`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": adminKey,
        },
        body: JSON.stringify({ proposal_id: claimed.proposal.id }),
      });

      const payload = await res.json().catch(() => ({}));
      results.render = {
        ok: res.ok,
        status: res.status,
        proposal_id: claimed.proposal.id,
        render_job_id: claimed.job.id,
        storage_path: payload?.storage_path ?? null,
        error: payload?.error ?? null,
      };
    }
  } catch (error) {
    results.render = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } else {
    results.render = {
      skipped: true,
      reason: "fresh_enrichment_owns_render_continuation",
    };
  }

  return Response.json({
    ok: true,
    worker: "pipeline-recovery",
    results,
    checked_at: new Date().toISOString(),
  });
});