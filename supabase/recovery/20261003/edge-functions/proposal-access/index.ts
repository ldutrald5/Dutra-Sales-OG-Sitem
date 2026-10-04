import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    let key = legacy ?? "";
    const validAdminKeys: string[] = [];

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        key = parsed.default ?? key;
        for (const value of Object.values(parsed)) {
          if (typeof value === "string" && value) validAdminKeys.push(value);
        }
      } catch {}
    }

    if (legacy) validAdminKeys.push(legacy);
    if (!url || !key) throw new Error("Supabase admin configuration missing");

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const suppliedApiKey = req.headers.get("apikey") ?? "";
    const suppliedCronToken = req.headers.get("x-og-cron-token") ?? "";

    let authorized = suppliedApiKey ? validAdminKeys.includes(suppliedApiKey) : false;

    if (!authorized && suppliedCronToken) {
      const { data: tokenRow, error: tokenError } = await supabase
        .from("internal_service_tokens")
        .select("token_hash, active")
        .eq("name", "og_pipeline_cron_token")
        .maybeSingle();

      if (tokenError) throw tokenError;

      authorized =
        tokenRow?.active === true &&
        (await sha256(suppliedCronToken)) === tokenRow.token_hash;
    }

    if (!authorized) {
      return Response.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const proposalId = body?.proposal_id;
    const requestedTtl = Number(body?.expires_in ?? 3600);
    const expiresIn = Math.min(Math.max(requestedTtl, 60), 86400);

    if (!proposalId) {
      return Response.json({ error: "proposal_id_required" }, { status: 400 });
    }

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id, status, pdf_storage_path, company_name_input")
      .eq("id", proposalId)
      .single();

    if (proposalError) throw proposalError;

    if (!proposal.pdf_storage_path) {
      return Response.json({
        error: "pdf_not_ready",
        status: proposal.status,
      }, { status: 409 });
    }

    const safeFilename = String(proposal.company_name_input ?? "Cliente")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9_-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80);

    const { data: signed, error: signedError } = await supabase.storage
      .from("proposal-artifacts")
      .createSignedUrl(proposal.pdf_storage_path, expiresIn, {
        download: `Proposta-OG-${safeFilename || "Cliente"}.pdf`,
      });

    if (signedError) throw signedError;

    return Response.json({
      proposal_id: proposalId,
      status: proposal.status,
      expires_in: expiresIn,
      signed_url: signed.signedUrl,
    });
  } catch (error) {
    console.error(error);
    return Response.json({
      error: "proposal_access_failed",
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});