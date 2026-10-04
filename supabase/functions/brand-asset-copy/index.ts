import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

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

function extensionFromMime(mime: string): string {
  const m = mime.split(";")[0].trim().toLowerCase();
  if (m === "image/svg+xml") return "svg";
  if (m === "image/png") return "png";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/webp") return "webp";
  if (m === "image/x-icon" || m === "image/vnd.microsoft.icon") return "ico";
  return "bin";
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

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

  let assetId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    assetId = body?.asset_id ?? null;

    let asset: any = null;
    let company: any = null;

    if (assetId) {
      const { data, error } = await supabase
        .from("company_brand_assets")
        .select("id, company_id, asset_type, source_url, attempts")
        .eq("id", assetId)
        .single();

      if (error) throw error;
      asset = data;

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id, name, domain, sector")
        .eq("id", asset.company_id)
        .single();

      if (companyError) throw companyError;
      company = companyData;
    } else {
      const { data: claimed, error: claimError } = await supabase.rpc(
        "claim_brand_asset_v1",
        { p_worker: "brand-asset-copy", p_lease_minutes: 10 },
      );
      if (claimError) throw claimError;

      if (!claimed?.asset) {
        return Response.json({ ok: true, claimed: false, asset: null });
      }

      asset = claimed.asset;
      company = claimed.company;
      assetId = asset.id;
    }

    if (!asset?.source_url) {
      throw new Error("brand asset source_url is missing");
    }

    const source = new URL(asset.source_url);
    if (!["http:", "https:"].includes(source.protocol)) {
      throw new Error("unsupported source protocol");
    }

    const response = await fetch(source.toString(), {
      redirect: "follow",
      headers: {
        "User-Agent": "OG-Proposal-Engine/1.0",
        "Accept": "image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`source returned HTTP ${response.status}`);
    }

    const mime = (response.headers.get("content-type") ?? "")
      .split(";")[0]
      .trim()
      .toLowerCase();

    if (!mime.startsWith("image/")) {
      throw new Error(`source content-type is not an image: ${mime || "unknown"}`);
    }

    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > 15 * 1024 * 1024) {
      throw new Error("brand asset exceeds 15 MB limit");
    }

    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > 15 * 1024 * 1024) {
      throw new Error("brand asset exceeds 15 MB limit");
    }

    const ext = extensionFromMime(mime);
    if (ext === "bin") {
      throw new Error(`unsupported image MIME type: ${mime}`);
    }

    const companySlug = String(company?.id ?? asset.company_id);
    const path = `${companySlug}/${asset.asset_type}/${asset.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("company-assets")
      .upload(path, bytes, {
        contentType: mime,
        cacheControl: "86400",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: completed, error: completeError } = await supabase.rpc(
      "complete_brand_asset_v1",
      {
        p_asset_id: asset.id,
        p_storage_path: path,
        p_mime_type: mime,
        p_size_bytes: bytes.byteLength,
        p_metadata: {
          copied_from: asset.source_url,
          copied_at: new Date().toISOString(),
          source_host: source.hostname,
        },
      },
    );

    if (completeError) throw completeError;

    return Response.json({
      ok: true,
      claimed: true,
      asset_id: asset.id,
      company_id: asset.company_id,
      storage_path: path,
      mime_type: mime,
      size_bytes: bytes.byteLength,
      pipeline: completed,
    });
  } catch (error) {
    console.error(error);

    if (assetId) {
      try {
        await supabase.rpc("fail_brand_asset_v1", {
          p_asset_id: assetId,
          p_error: error instanceof Error ? error.message : String(error),
        });
      } catch (failError) {
        console.error("Failed to record brand asset failure", failError);
      }
    }

    return Response.json({
      error: "brand_asset_copy_failed",
      asset_id: assetId,
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});