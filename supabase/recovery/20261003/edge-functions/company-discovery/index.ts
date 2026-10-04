import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

async function continuePipeline(
  supabaseUrl: string,
  adminKey: string,
  supabase: any,
  companyId: string,
  proposalId: string,
) {
  try {
    const { data: logoAsset } = await supabase
      .from("company_brand_assets")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("asset_type", "logo")
      .eq("is_primary", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (logoAsset?.id && logoAsset.status === "pending_copy") {
      try {
        const copyRes = await fetch(`${supabaseUrl}/functions/v1/brand-asset-copy`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": adminKey,
          },
          body: JSON.stringify({ asset_id: logoAsset.id }),
        });
        const copyText = await copyRes.text();
        if (!copyRes.ok) {
          console.error("brand-asset-copy failed", copyRes.status, copyText);
        }
      } catch (error) {
        console.error("brand-asset-copy background error", error);
      }
    }

    const renderRes = await fetch(`${supabaseUrl}/functions/v1/proposal-pdf-premium`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": adminKey,
      },
      body: JSON.stringify({ proposal_id: proposalId }),
    });

    const renderText = await renderRes.text();
    if (!renderRes.ok) {
      console.error("proposal-pdf-premium failed", renderRes.status, renderText);
      return;
    }

    console.log("proposal-pdf-premium completed", renderText.slice(0, 1000));
  } catch (error) {
    console.error("continuePipeline error", error);
  }
}


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

function normalizeText(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(ltda|sa|s a|eireli|me|epp|holding|grupo|cooperativa|agroindustrial)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

const blockedHosts = [
  "instagram.com",
  "facebook.com",
  "linkedin.com",
  "youtube.com",
  "wikipedia.org",
  "x.com",
  "twitter.com",
  "tiktok.com",
  "reclameaqui.com.br",
  "econodata.com.br",
  "cnpj.biz",
];

function isBlockedHost(host: string): boolean {
  return blockedHosts.some((blocked) => host === blocked || host.endsWith("." + blocked));
}

function candidateScore(companyName: string, item: any): number {
  const url = String(item?.url ?? "");
  const title = String(item?.title ?? "");
  const host = hostname(url);
  if (!host || isBlockedHost(host)) return -1;

  const normalizedCompany = normalizeText(companyName);
  const normalizedTitle = normalizeText(title);
  const tokens = normalizedCompany
    .split(" ")
    .filter((t) => t.length >= 4);

  let score = 0.10;

  if (url.startsWith("https://")) score += 0.05;
  if (normalizedTitle.includes(normalizedCompany) && normalizedCompany.length >= 4) score += 0.35;

  for (const token of tokens.slice(0, 4)) {
    if (host.includes(token)) score += 0.20;
    if (normalizedTitle.includes(token)) score += 0.08;
  }

  const titleLower = title.toLowerCase();
  if (titleLower.includes("oficial") || titleLower.includes("official")) score += 0.05;

  return Math.min(score, 1);
}

async function firecrawlPost(path: string, body: unknown): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const response = await fetch(`https://api.firecrawl.dev/v2/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok || parsed?.success === false) {
    const message =
      parsed?.error?.message ??
      parsed?.error ??
      parsed?.message ??
      `Firecrawl ${path} failed with HTTP ${response.status}`;
    throw new Error(typeof message === "string" ? message : JSON.stringify(message));
  }

  return parsed;
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

  let jobId: string | null = null;

  try {
    const body = await req.json().catch(() => ({}));
    jobId = body?.job_id ?? null;
    const worker = String(body?.worker ?? "supabase-firecrawl");

    let job: any = null;
    let company: any = null;

    if (!jobId) {
      const { data: claimed, error: claimError } = await supabase.rpc(
        "claim_enrichment_job_v1",
        {
          p_worker: worker,
          p_lease_minutes: 15,
        },
      );

      if (claimError) throw claimError;

      if (!claimed?.job) {
        return Response.json({
          ok: true,
          claimed: false,
          message: "no enrichment jobs available",
        });
      }

      job = claimed.job;
      company = claimed.company;
      jobId = job.id;
    } else {
      const { data: jobRow, error: jobError } = await supabase
        .from("enrichment_jobs")
        .select("id, company_id, proposal_id, status, input")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;
      job = jobRow;

      const { data: companyRow, error: companyError } = await supabase
        .from("companies")
        .select("id, name, legal_name, cnpj, domain, website, sector, subsector, logo_url")
        .eq("id", job.company_id)
        .single();

      if (companyError) throw companyError;
      company = companyRow;
    }

    const companyName = String(company?.name ?? "").trim();
    if (!companyName) throw new Error("company name is missing");

    const search = await firecrawlPost("search", {
      query: `"${companyName}" site oficial empresa Brasil`,
      limit: 8,
      location: "Brazil",
      safe: true,
    });

    const webResults =
      search?.data?.web ??
      search?.web ??
      [];

    if (!Array.isArray(webResults) || webResults.length === 0) {
      throw new Error("no search results found for company");
    }

    const ranked = webResults
      .map((item: any) => ({
        item,
        score: candidateScore(companyName, item),
      }))
      .filter((x: any) => x.score >= 0)
      .sort((a: any, b: any) => b.score - a.score);

    if (ranked.length === 0 || ranked[0].score < 0.35) {
      throw new Error("no sufficiently reliable official-site candidate");
    }

    const officialCandidate = ranked[0];
    const officialUrl = String(officialCandidate.item.url);
    const officialDomain = hostname(officialUrl);

    const scrape = await firecrawlPost("scrape", {
      url: officialUrl,
      formats: [
        "branding",
        {
          type: "json",
          prompt:
            "Extract factual company identity from this official website. Return an object with canonical_name, sector_raw, subsectors (array of short strings), description (1-2 factual sentences), and logo_source_url. For logo_source_url, only return an absolute http/https image URL clearly associated with the company logo; otherwise return null. Do not invent facts.",
        },
      ],
      onlyMainContent: true,
      timeout: 60000,
    });

    const document = scrape?.data ?? {};
    const extracted = document?.json ?? {};
    const branding = document?.branding ?? {};

    const canonicalName =
      typeof extracted?.canonical_name === "string" && extracted.canonical_name.trim()
        ? extracted.canonical_name.trim()
        : String(officialCandidate.item.title ?? companyName)
            .replace(/\s+[|–—-].*$/, "")
            .trim();

    const sectorRaw =
      typeof extracted?.sector_raw === "string"
        ? extracted.sector_raw
        : null;

    const subsectors = Array.isArray(extracted?.subsectors)
      ? extracted.subsectors
          .filter((x: unknown) => typeof x === "string")
          .map((x: string) => x.trim())
          .filter(Boolean)
          .slice(0, 12)
      : [];

    const description =
      typeof extracted?.description === "string"
        ? extracted.description.trim()
        : null;

    let logoSourceUrl =
      typeof extracted?.logo_source_url === "string" &&
      /^https?:\/\//i.test(extracted.logo_source_url)
        ? extracted.logo_source_url
        : null;

    if (!logoSourceUrl) {
      const brandingLogo = branding?.images?.logo ?? branding?.logo;
      if (typeof brandingLogo === "string" && /^https?:\/\//i.test(brandingLogo)) {
        logoSourceUrl = brandingLogo;
      }
    }

    const logoConfidenceRaw =
      branding?.__llm_logo_reasoning?.confidence ??
      branding?.confidence?.overall ??
      0.70;

    const logoConfidence = Math.max(
      0,
      Math.min(1, Number(logoConfidenceRaw) || 0.70),
    );

    const sourceRecords = [
      {
        source_type: "search_result",
        provider: "firecrawl",
        source_url: officialUrl,
        is_official: true,
        confidence: Math.max(0, Math.min(1, officialCandidate.score)),
        extracted: {
          title: officialCandidate.item.title ?? null,
          description: officialCandidate.item.description ?? null,
          candidate_score: officialCandidate.score,
        },
      },
      {
        source_type: "official_site",
        provider: "firecrawl",
        source_url: officialUrl,
        is_official: true,
        confidence: 0.98,
        extracted: {
          canonical_name: canonicalName,
          sector_raw: sectorRaw,
          subsectors,
          description,
          firecrawl_metadata: document?.metadata ?? {},
        },
      },
    ];

    const { data: applied, error: applyError } = await supabase.rpc(
      "apply_company_discovery_v2",
      {
        p_job_id: jobId,
        p_canonical_name: canonicalName,
        p_domain: officialDomain,
        p_website: officialUrl,
        p_sector_raw: sectorRaw,
        p_subsectors: subsectors,
        p_description: description,
        p_logo_source_url: logoSourceUrl,
        p_logo_confidence: logoConfidence,
        p_branding: branding ?? {},
        p_sources: sourceRecords,
        p_provider: "firecrawl",
      },
    );

    if (applyError) throw applyError;

    const renderReleased = applied?.render_released === true;
    const proposalId = applied?.proposal_id ?? job?.proposal_id ?? null;

    if (renderReleased && proposalId) {
      EdgeRuntime.waitUntil(
        continuePipeline(
          supabaseUrl,
          adminKey,
          supabase,
          company.id,
          proposalId,
        ),
      );
    }

    return Response.json({
      ok: true,
      claimed: true,
      job_id: jobId,
      company_id: company.id,
      official_candidate: {
        url: officialUrl,
        domain: officialDomain,
        score: officialCandidate.score,
        title: officialCandidate.item.title ?? null,
      },
      extracted: {
        canonical_name: canonicalName,
        sector_raw: sectorRaw,
        subsectors,
        description,
        logo_source_url: logoSourceUrl,
        logo_confidence: logoConfidence,
      },
      pipeline: applied,
      render_pipeline_started: renderReleased && Boolean(proposalId),
      firecrawl_key_mode: Deno.env.get("FIRECRAWL_API_KEY") ? "authenticated" : "keyless",
    });
  } catch (error) {
    console.error(error);

    if (jobId) {
      try {
        await supabase.rpc("fail_enrichment_job_v1", {
          p_job_id: jobId,
          p_error: error instanceof Error ? error.message : String(error),
          p_retry_minutes: 30,
        });
      } catch (failError) {
        console.error("Failed to record enrichment error", failError);
      }
    }

    return Response.json({
      error: "company_discovery_failed",
      job_id: jobId,
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});