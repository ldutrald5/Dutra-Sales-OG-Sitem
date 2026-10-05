import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import {
  normalizeGeoapifyResult,
  normalizeMapboxResult,
  selectBestGeocode,
} from "../_shared/geocoding.mjs";

function adminKey(): string {
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

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizedInput(location: any) {
  return {
    addressRaw: clean(location?.address_raw),
    street: clean(location?.street),
    number: clean(location?.street_number),
    complement: clean(location?.complement),
    district: clean(location?.district),
    postalCode: clean(location?.postal_code),
    city: clean(location?.city),
    state: clean(location?.state),
    countryCode: clean(location?.country_code || "BR"),
    formattedAddress: clean(location?.formatted_address),
  };
}

async function fetchJson(url: string): Promise<any> {
  let attempt = 0;

  while (true) {
    attempt += 1;
    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });
    const text = await response.text();
    let payload: any = null;
    try { payload = JSON.parse(text); } catch { payload = { raw: text }; }

    if (response.ok) return payload;

    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt >= 3) {
      const error = new Error(`geocoder_http_${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    const retryAfter = Number(response.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(5000, 500 * (2 ** (attempt - 1)));
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

function hasStructuredAddress(input: any): boolean {
  return Boolean(input.street || input.postalCode || input.city);
}

async function geocodeGeoapify(input: any) {
  const key = Deno.env.get("GEOAPIFY_API_KEY") ?? "";
  if (!key) throw new Error("geoapify_api_key_missing");

  const params = new URLSearchParams();
  if (hasStructuredAddress(input)) {
    if (input.number) params.set("housenumber", input.number);
    if (input.street) params.set("street", input.street);
    if (input.postalCode) params.set("postcode", input.postalCode);
    if (input.city) params.set("city", input.city);
    if (input.state) params.set("state", input.state);
    params.set("country", "Brazil");
  } else {
    const text = input.formattedAddress || input.addressRaw;
    if (!text) throw new Error("location_address_missing");
    params.set("text", text);
  }

  params.set("filter", "countrycode:br");
  params.set("lang", "pt");
  params.set("limit", "3");
  params.set("format", "json");
  params.set("apiKey", key);

  const payload = await fetchJson(
    "https://api.geoapify.com/v1/geocode/search?" + params.toString(),
  );
  return (payload?.results ?? [])
    .map(normalizeGeoapifyResult)
    .filter(Boolean);
}

async function geocodeMapboxPermanent(input: any) {
  const token = Deno.env.get("MAPBOX_ACCESS_TOKEN") ?? "";
  if (!token) throw new Error("mapbox_access_token_missing");
  if (Deno.env.get("MAPBOX_PERMANENT_ALLOWED") !== "1") {
    throw new Error("mapbox_permanent_not_explicitly_allowed");
  }

  const params = new URLSearchParams();
  if (input.number) params.set("address_number", input.number);
  if (input.street) params.set("street", input.street);
  if (input.city) params.set("place", input.city);
  if (input.state) params.set("region", input.state);
  if (input.postalCode) params.set("postcode", input.postalCode);
  params.set("country", "br");
  params.set("types", "address,street,postcode,place");
  params.set("language", "pt");
  params.set("limit", "3");
  params.set("permanent", "true");
  params.set("access_token", token);

  const payload = await fetchJson(
    "https://api.mapbox.com/search/geocode/v6/forward?" + params.toString(),
  );
  return (payload?.features ?? [])
    .map(normalizeMapboxResult)
    .filter(Boolean);
}

function providerName(): "geoapify" | "mapbox_permanent" {
  const value = clean(Deno.env.get("GEOCODING_PROVIDER")).toLowerCase();
  if (value === "geoapify") return "geoapify";
  if (value === "mapbox_permanent") return "mapbox_permanent";
  throw new Error("geocoding_provider_not_selected");
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = adminKey();
  if (!url || !key) {
    return Response.json({ error: "backend_not_configured" }, { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let jobId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    jobId = body?.job_id ?? null;
    const worker = String(body?.worker ?? "location-geocode");

    let job: any = null;
    if (!jobId) {
      const { data, error } = await supabase.rpc("claim_enrichment_job_v2", {
        p_job_type: "LOCATION_GEOCODE",
        p_worker: worker,
        p_lease_minutes: 15,
      });
      if (error) throw error;
      if (!data?.job) return Response.json({ ok: true, claimed: false });
      job = data.job;
      jobId = job.id;
    } else {
      const { data, error } = await supabase
        .from("enrichment_jobs")
        .select("id,company_id,job_type,status,input")
        .eq("id", jobId)
        .single();
      if (error) throw error;
      if (data.job_type !== "LOCATION_GEOCODE") throw new Error("wrong_job_type");
      job = data;
    }

    const locationId = String(job?.input?.location_id ?? "");
    if (!locationId) throw new Error("location_id_missing");

    const { data: location, error: locationError } = await supabase
      .from("company_locations")
      .select(
        "id,company_id,address_raw,street,street_number,complement,district,postal_code,city,state,country_code,formatted_address,geo,verification_status,is_active",
      )
      .eq("id", locationId)
      .single();
    if (locationError) throw locationError;
    if (!location.is_active) throw new Error("location_inactive");

    const input = normalizedInput(location);
    const provider = providerName();

    const candidates = provider === "geoapify"
      ? await geocodeGeoapify(input)
      : await geocodeMapboxPermanent(input);

    const best = selectBestGeocode(input, candidates);

    const normalizedResult = best
      ? {
        provider: best.candidate.provider,
        providerRef: best.candidate.providerRef,
        lat: best.candidate.lat,
        lng: best.candidate.lng,
        precision: best.score.precision,
        internalConfidence: best.score.internalConfidence,
        providerSignal: best.score.providerSignal,
        componentScore: best.score.componentScore,
        verificationStatus: best.score.verificationStatus,
        attribution: best.candidate.attribution,
        providerMatch: best.candidate.providerMatch,
        formattedAddress: best.candidate.formattedAddress,
      }
      : {
        provider,
        precision: "UNKNOWN",
        verificationStatus: "UNVERIFIED",
      };

    const { data: applied, error: applyError } = await supabase.rpc(
      "apply_location_geocode_v1",
      {
        p_job_id: jobId,
        p_result: normalizedResult,
      },
    );
    if (applyError) throw applyError;

    return Response.json({
      ok: true,
      claimed: true,
      job_id: jobId,
      location_id: locationId,
      provider,
      candidate_count: candidates.length,
      result: applied,
    });
  } catch (error) {
    console.error(error);

    if (jobId) {
      try {
        const status = Number((error as any)?.status ?? 0);
        const message = error instanceof Error ? error.message : String(error);
        const retryable =
          status === 429 ||
          status >= 500 ||
          (status === 0 && /fetch|network|timeout|connection/i.test(message));
        const retryMinutes = status === 429 ? 60 : retryable ? 30 : 0;

        await supabase.rpc("fail_enrichment_job_v2", {
          p_job_id: jobId,
          p_error: message,
          p_retryable: retryable,
          p_retry_minutes: retryMinutes,
        });
      } catch (recordError) {
        console.error("failed_to_record_geocode_error", recordError);
      }
    }

    return Response.json({
      error: "location_geocode_failed",
      job_id: jobId,
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});
