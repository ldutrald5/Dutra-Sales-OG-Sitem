import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

type RGB = { r: number; g: number; b: number };

const A4 = { width: 595.28, height: 841.89 };

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

function safeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ");
}

function hexToRgb(hex: unknown, fallback = "#252525"): RGB {
  const source = /^#[0-9A-Fa-f]{6}$/.test(String(hex ?? "")) ? String(hex) : fallback;
  const n = parseInt(source.slice(1), 16);
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  };
}

function pdfColor(c: RGB) {
  return rgb(c.r, c.g, c.b);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

function money(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "A configurar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function number(value: unknown, digits = 0): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "A configurar";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
  }).format(n);
}

function percent(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? number(n, 1) + "%" : "A configurar";
}

function wrapText(font: any, text: string, size: number, maxWidth: number): string[] {
  const words = safeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawWrapped(page: any, font: any, text: string, x: number, y: number, size: number, maxWidth: number, color: RGB, lineHeight?: number): number {
  const lines = wrapText(font, text, size, maxWidth);
  const lh = lineHeight ?? size * 1.35;
  let yy = y;
  for (const line of lines) {
    page.drawText(line, { x, y: yy, size, font, color: pdfColor(color) });
    yy -= lh;
  }
  return yy;
}

function drawPill(page: any, font: any, text: string, x: number, y: number, fill: RGB, fg: RGB) {
  const size = 8;
  const safe = safeText(text);
  const w = font.widthOfTextAtSize(safe, size) + 18;
  page.drawRectangle({
    x, y: y - 4, width: w, height: 20,
    color: pdfColor(fill),
    borderRadius: 10,
  } as any);
  page.drawText(safe, { x: x + 9, y: y + 2, size, font, color: pdfColor(fg) });
  return w;
}

function drawMetricCard(page: any, fonts: any, opts: {
  x: number; y: number; w: number; h: number;
  label: string; value: string; hint?: string;
  border: RGB; bg: RGB; text: RGB; muted: RGB;
}) {
  page.drawRectangle({
    x: opts.x, y: opts.y - opts.h, width: opts.w, height: opts.h,
    color: pdfColor(opts.bg),
    borderColor: pdfColor(mix(opts.border, { r: 1, g: 1, b: 1 }, 0.5)),
    borderWidth: 0.8,
    borderRadius: 12,
  } as any);
  page.drawRectangle({
    x: opts.x, y: opts.y - opts.h, width: 4, height: opts.h,
    color: pdfColor(opts.border),
  });
  page.drawText(safeText(opts.label).toUpperCase(), {
    x: opts.x + 16, y: opts.y - 21, size: 7.5, font: fonts.bold, color: pdfColor(opts.muted),
  });
  page.drawText(safeText(opts.value), {
    x: opts.x + 16, y: opts.y - 48, size: 20, font: fonts.bold, color: pdfColor(opts.text),
  });
  if (opts.hint) {
    drawWrapped(page, fonts.regular, opts.hint, opts.x + 16, opts.y - 66, 7.5, opts.w - 28, opts.muted, 10);
  }
}

function drawFooter(page: any, fonts: any, pageNo: number, section: string, muted: RGB) {
  page.drawLine({
    start: { x: 42, y: 38 },
    end: { x: 553, y: 38 },
    thickness: 0.6,
    color: pdfColor(mix(muted, { r: 1, g: 1, b: 1 }, 0.55)),
  });
  page.drawText("OLHO DE GATO", {
    x: 42, y: 22, size: 7, font: fonts.bold, color: pdfColor(muted),
  });
  page.drawText(safeText(section), {
    x: 220, y: 22, size: 7, font: fonts.regular, color: pdfColor(muted),
  });
  page.drawText(String(pageNo).padStart(2, "0") + " / 05", {
    x: 510, y: 22, size: 7, font: fonts.regular, color: pdfColor(muted),
  });
}

async function maybeEmbedLogo(pdf: PDFDocument, supabase: any, companyId: string | null) {
  if (!companyId) return null;

  const { data: asset } = await supabase
    .from("company_brand_assets")
    .select("storage_bucket, storage_path, mime_type, status, source_url")
    .eq("company_id", companyId)
    .eq("asset_type", "logo")
    .eq("is_primary", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    let bytes: Uint8Array | null = null;
    let mime = asset?.mime_type ?? "";

    if (asset?.status === "stored" && asset.storage_bucket && asset.storage_path) {
      const { data: blob, error } = await supabase.storage
        .from(asset.storage_bucket)
        .download(asset.storage_path);
      if (!error && blob) {
        bytes = new Uint8Array(await blob.arrayBuffer());
        mime = mime || blob.type;
      }
    } else if (asset?.source_url && /^https?:\/\//i.test(asset.source_url)) {
      const response = await fetch(asset.source_url, { redirect: "follow" });
      if (response.ok) {
        bytes = new Uint8Array(await response.arrayBuffer());
        mime = response.headers.get("content-type") ?? mime;
      }
    }

    if (!bytes) return null;

    mime = mime.split(";")[0].toLowerCase();
    if (mime === "image/png") return await pdf.embedPng(bytes);
    if (mime === "image/jpeg" || mime === "image/jpg") return await pdf.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
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

  if (!supabaseUrl) return Response.json({ error: "supabase_url_missing" }, { status: 500 });

  let adminKey = legacy ?? "";
  if (raw) {
    try { adminKey = JSON.parse(raw).default ?? adminKey; } catch {}
  }
  if (!adminKey) return Response.json({ error: "admin_key_missing" }, { status: 500 });

  const supabase = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let renderJobId: string | null = null;

  try {
    const body = await req.json();
    const proposalId = body?.proposal_id;
    if (!proposalId) {
      return Response.json({ error: "proposal_id_required" }, { status: 400 });
    }

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id, company_id, company_name_input, fleet_size, status, proposal_snapshot")
      .eq("id", proposalId)
      .single();
    if (proposalError) throw proposalError;

    const { data: currentRender, error: renderLookupError } = await supabase
      .from("render_jobs")
      .select("id, status")
      .eq("proposal_id", proposalId)
      .in("status", ["waiting", "pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (renderLookupError) throw renderLookupError;

    if (currentRender?.status === "waiting") {
      return Response.json({
        error: "company_enrichment_not_ready",
        proposal_id: proposalId,
        render_job_id: currentRender.id,
      }, { status: 409 });
    }

    if (currentRender?.id) {
      renderJobId = currentRender.id;
      const { error } = await supabase
        .from("render_jobs")
        .update({
          status: "processing",
          renderer: "pdf_lib_vector_premium",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentRender.id);
      if (error) throw error;
    } else {
      const { data: createdRender, error } = await supabase
        .from("render_jobs")
        .insert({
          proposal_id: proposalId,
          status: "processing",
          renderer: "pdf_lib_vector_premium",
          input: { proposal_id: proposalId, regeneration: true },
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      renderJobId = createdRender.id;
    }

    const [{ data: company, error: companyError }, { data: tokens, error: tokenError }, { data: refs, error: refsError }] =
      await Promise.all([
        proposal.company_id
          ? supabase
              .from("companies")
              .select("id, name, legal_name, sector, subsector, domain, website, enrichment_status")
              .eq("id", proposal.company_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        proposal.company_id
          ? supabase.rpc("resolve_design_tokens_v1", { p_company_id: proposal.company_id })
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from("proposal_references")
          .select("position, reference_clients(company_name, sector, approved_for_marketing, approval_status, active)")
          .eq("proposal_id", proposalId)
          .order("position", { ascending: true }),
      ]);

    if (companyError) throw companyError;
    if (tokenError) throw tokenError;
    if (refsError) throw refsError;

    const snap = proposal.proposal_snapshot ?? {};
    const fleet = snap.fleet ?? {};
    const roi = snap.roi ?? {};
    const investment = snap.investment ?? {};
    const assumptions = snap.assumptions ?? {};
    const engine = snap.engine ?? {};
    const enrich = snap.company_enrichment ?? {};

    const companyName = company?.name ?? enrich?.canonical_name ?? proposal.company_name_input ?? "Cliente";
    const sector = company?.sector ?? enrich?.sector ?? "other";
    const subsector = company?.subsector ?? (Array.isArray(enrich?.subsectors) ? enrich.subsectors.join(" / ") : "");

    const primary = hexToRgb(tokens?.primary, "#252525");
    const secondary = hexToRgb(tokens?.secondary, "#5D5D5D");
    const accent = hexToRgb(tokens?.accent, "#B9974A");
    const background = hexToRgb(tokens?.background, "#F5F5F5");
    const text = hexToRgb(tokens?.text, "#181818");
    const white: RGB = { r: 1, g: 1, b: 1 };
    const black: RGB = { r: 0.05, g: 0.05, b: 0.05 };
    const muted = mix(text, white, 0.48);
    const lightPrimary = mix(primary, white, 0.88);
    const lightAccent = mix(accent, white, 0.84);

    const pdf = await PDFDocument.create();
    const fonts = {
      regular: await pdf.embedFont(StandardFonts.Helvetica),
      bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    };

    const logo = await maybeEmbedLogo(pdf, supabase, proposal.company_id);

    // PAGE 1 — COVER
    {
      const page = pdf.addPage([A4.width, A4.height]);

      page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: pdfColor(black) });
      page.drawRectangle({ x: 0, y: 0, width: 215, height: A4.height, color: pdfColor(primary) });
      page.drawRectangle({ x: 215, y: 0, width: 15, height: A4.height, color: pdfColor(accent), opacity: 0.92 });
      page.drawCircle({ x: 500, y: 720, size: 135, color: pdfColor(secondary), opacity: 0.18 });
      page.drawCircle({ x: 470, y: 130, size: 190, color: pdfColor(primary), opacity: 0.18 });

      page.drawText("OLHO DE GATO", { x: 42, y: 780, size: 12, font: fonts.bold, color: pdfColor(white) });
      page.drawText("PROPOSTA COMERCIAL PERSONALIZADA", { x: 245, y: 780, size: 8, font: fonts.bold, color: pdfColor(mix(white, primary, 0.15)) });

      if (logo) {
        const maxW = 120;
        const maxH = 58;
        const scale = Math.min(maxW / logo.width, maxH / logo.height);
        page.drawImage(logo, {
          x: 410,
          y: 695,
          width: logo.width * scale,
          height: logo.height * scale,
        });
      } else {
        page.drawRectangle({
          x: 400, y: 690, width: 145, height: 62,
          borderColor: pdfColor(mix(white, black, 0.55)),
          borderWidth: 0.7,
          color: pdfColor({ r: 0.1, g: 0.1, b: 0.1 }),
        });
        drawWrapped(page, fonts.bold, companyName, 410, 722, 12, 125, white, 14);
      }

      page.drawText(safeText(sector).toUpperCase(), { x: 245, y: 620, size: 9, font: fonts.bold, color: pdfColor(accent) });
      let yy = drawWrapped(
        page, fonts.bold,
        "Eficiência, controle e proteção para a frota da " + companyName,
        245, 585, 29, 305, white, 32
      );

      if (subsector) {
        yy -= 8;
        drawWrapped(page, fonts.regular, subsector, 245, yy, 10, 290, mix(white, black, 0.3), 13);
      }

      const statY = 310;
      const statW = 94;
      const statGap = 12;
      const stats = [
        ["FROTA", number(proposal.fleet_size)],
        ["PNEUS", number(fleet.total_tires)],
        ["PEÇAS", number(fleet.total_equalizers)],
      ];
      stats.forEach((s, i) => {
        const x = 245 + i * (statW + statGap);
        page.drawRectangle({
          x, y: statY, width: statW, height: 78,
          color: pdfColor({ r: 0.09, g: 0.09, b: 0.09 }),
          borderColor: pdfColor(mix(primary, white, 0.35)),
          borderWidth: 0.6,
        });
        page.drawText(s[0], { x: x + 10, y: statY + 55, size: 7.5, font: fonts.bold, color: pdfColor(mix(white, black, 0.45)) });
        page.drawText(s[1], { x: x + 10, y: statY + 22, size: 22, font: fonts.bold, color: pdfColor(white) });
      });

      page.drawText("PATRIMÔNIO ESTIMADO DE PNEUS ATENDIDO", {
        x: 245, y: 250, size: 8, font: fonts.bold, color: pdfColor(mix(white, black, 0.5))
      });
      page.drawText(money(roi.protected_asset_value), {
        x: 245, y: 215, size: 26, font: fonts.bold, color: pdfColor(accent)
      });

      drawFooter(page, fonts, 1, "Proposta personalizada", mix(white, black, 0.5));
    }

    // PAGE 2 — BENEFITS
    {
      const page = pdf.addPage([A4.width, A4.height]);
      page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: pdfColor(background) });

      page.drawText("02", { x: 42, y: 775, size: 11, font: fonts.bold, color: pdfColor(primary) });
      page.drawText("A SOLUÇÃO", { x: 82, y: 775, size: 9, font: fonts.bold, color: pdfColor(muted) });
      page.drawText("Pressão equilibrada. Menos desperdício.", { x: 42, y: 725, size: 25, font: fonts.bold, color: pdfColor(text) });
      page.drawText("Mais disponibilidade para a operação.", { x: 42, y: 694, size: 25, font: fonts.bold, color: pdfColor(primary) });

      drawWrapped(
        page, fonts.regular,
        "O equalizador atua sobre conjuntos de pneus para apoiar o equilíbrio de pressão, reduzir desvios operacionais e ampliar a previsibilidade da manutenção.",
        42, 650, 10.5, 510, muted, 15
      );

      const cards = [
        { title: "ATÉ 20%", sub: "Vida útil dos pneus", body: "Premissa comercial parametrizada e condicionada ao perfil real de operação e manutenção." },
        { title: "2% A 6%", sub: "Faixa potencial de diesel", body: "O cenário só entra no cálculo quando há base confiável de consumo ou gasto mensal." },
        { title: "REUTILIZÁVEL", sub: "Ativo de longo prazo", body: "A solução pode acompanhar a renovação de pneus conforme o plano operacional da frota." },
        { title: "SUPORTE OG", sub: "Treinamento e assistência", body: "Estrutura preparada para treinamento, peças de reposição e acompanhamento técnico." },
      ];

      const cardW = 245;
      const cardH = 155;
      const positions = [
        [42, 535], [308, 535], [42, 355], [308, 355],
      ];

      cards.forEach((c, i) => {
        const [x, y] = positions[i];
        page.drawRectangle({
          x, y: y - cardH, width: cardW, height: cardH,
          color: pdfColor(i % 2 === 0 ? lightPrimary : lightAccent),
          borderColor: pdfColor(i % 2 === 0 ? primary : accent),
          borderWidth: 0.7,
          borderRadius: 14,
        } as any);
        page.drawText(c.title, { x: x + 18, y: y - 34, size: 22, font: fonts.bold, color: pdfColor(i % 2 === 0 ? primary : accent) });
        page.drawText(c.sub, { x: x + 18, y: y - 58, size: 10, font: fonts.bold, color: pdfColor(text) });
        drawWrapped(page, fonts.regular, c.body, x + 18, y - 84, 9, cardW - 36, muted, 12);
      });

      drawWrapped(
        page, fonts.regular,
        "Importante: percentuais são estimativas e não garantias. A proposta registra as premissas usadas no momento da emissão.",
        42, 135, 8.5, 510, muted, 11
      );
      drawFooter(page, fonts, 2, "Benefícios e funcionamento", muted);
    }

    // PAGE 3 — INVESTMENT
    {
      const page = pdf.addPage([A4.width, A4.height]);
      page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: pdfColor(white) });

      page.drawText("03", { x: 42, y: 775, size: 11, font: fonts.bold, color: pdfColor(primary) });
      page.drawText("INVESTIMENTO", { x: 82, y: 775, size: 9, font: fonts.bold, color: pdfColor(muted) });
      page.drawText("Dimensionamento para " + number(proposal.fleet_size) + " veículos", {
        x: 42, y: 720, size: 24, font: fonts.bold, color: pdfColor(text)
      });

      const tableX = 42;
      const tableTop = 650;
      const rowH = 54;
      const cols = [0, 205, 355, 511];

      page.drawRectangle({ x: tableX, y: tableTop, width: 511, height: 38, color: pdfColor(black) });
      ["ITEM", "BASE", "QUANTIDADE"].forEach((h, i) => {
        page.drawText(h, {
          x: tableX + cols[i] + 10, y: tableTop + 13, size: 8, font: fonts.bold, color: pdfColor(white)
        });
      });

      const supportQty = fleet.total_supports == null ? "A validar" : number(fleet.total_supports);
      const rows = [
        ["Equalizadores / peças", number(fleet.equalizers_per_vehicle, 2) + " por veículo", number(fleet.total_equalizers)],
        ["Suportes / configuração", fleet.supports_per_vehicle == null ? "Tabela técnica pendente" : number(fleet.supports_per_vehicle, 2) + " por veículo", supportQty],
        ["Pneus atendidos", number(fleet.tires_per_vehicle) + " por veículo", number(fleet.total_tires)],
        ["Pacote por veículo", "Tabela comercial vigente", money(investment.package_price_per_vehicle)],
      ];

      rows.forEach((r, i) => {
        const y = tableTop - (i + 1) * rowH;
        const fill = i % 2 === 0 ? { r: 0.98, g: 0.98, b: 0.98 } : background;
        page.drawRectangle({ x: tableX, y, width: 511, height: rowH, color: pdfColor(fill) });
        page.drawLine({ start: { x: tableX, y }, end: { x: tableX + 511, y }, thickness: 0.45, color: pdfColor(mix(muted, white, 0.65)) });
        drawWrapped(page, fonts.bold, r[0], tableX + 10, y + 32, 9.5, 185, text, 12);
        drawWrapped(page, fonts.regular, r[1], tableX + cols[1] + 10, y + 32, 8.5, 130, muted, 11);
        page.drawText(safeText(r[2]), {
          x: tableX + cols[2] + 10, y: y + 22, size: 10, font: fonts.bold, color: pdfColor(text)
        });
      });

      const totalY = 325;
      page.drawRectangle({
        x: 42, y: totalY, width: 511, height: 118,
        color: pdfColor(black),
        borderRadius: 16,
      } as any);
      page.drawText("INVESTIMENTO TOTAL ESTIMADO", {
        x: 64, y: totalY + 83, size: 8, font: fonts.bold, color: pdfColor(mix(white, black, 0.45))
      });
      page.drawText(money(investment.total), {
        x: 64, y: totalY + 42, size: 29, font: fonts.bold, color: pdfColor(accent)
      });
      page.drawText("Baseado no pacote por veículo registrado na versão comercial da proposta.", {
        x: 64, y: totalY + 19, size: 7.5, font: fonts.regular, color: pdfColor(mix(white, black, 0.45))
      });

      const tags = [
        "Treinamento incluso",
        "Manutenção OG",
        "Peças de reposição",
        "Ativo reutilizável",
      ];
      let x = 42;
      for (const tag of tags) {
        const w = drawPill(page, fonts.bold, tag, x, 250, lightPrimary, primary);
        x += w + 8;
        if (x > 500) break;
      }

      drawFooter(page, fonts, 3, "Dimensionamento do investimento", muted);
    }

    // PAGE 4 — ROI
    {
      const page = pdf.addPage([A4.width, A4.height]);
      page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: pdfColor(background) });

      page.drawText("04", { x: 42, y: 775, size: 11, font: fonts.bold, color: pdfColor(primary) });
      page.drawText("RESUMO EXECUTIVO", { x: 82, y: 775, size: 9, font: fonts.bold, color: pdfColor(muted) });
      page.drawText("Impacto financeiro estimado", { x: 42, y: 720, size: 25, font: fonts.bold, color: pdfColor(text) });
      page.drawText("Cenário " + safeText(engine.calculation_scope ?? "parcial"), {
        x: 42, y: 690, size: 10, font: fonts.bold, color: pdfColor(primary)
      });

      const metricW = 245;
      const metricH = 105;
      const gapX = 21;
      const rows = [
        ["Patrimônio de pneus", money(roi.protected_asset_value), "Valor estimado dos pneus atendidos."],
        ["Economia anual em pneus", money(roi.annual_tire_savings), "Premissa baseada em ciclo e ganho de vida útil."],
        ["Economia anual em diesel", money(roi.annual_fuel_savings_default), roi.annual_fuel_savings_default == null ? "Não calculada sem base de consumo confiável." : "Cenário padrão parametrizado."],
        ["Economia anual total", money(roi.annual_total_savings), "Pneus + combustível quando disponível."],
        ["ROI estimado", percent(roi.roi_percent), "Retorno anual calculado sobre o investimento."],
        ["Payback estimado", roi.payback_months == null ? "A configurar" : number(roi.payback_months, 1) + " meses", "Prazo aproximado de recuperação do investimento."],
      ];

      const positions = [
        [42, 635], [308, 635],
        [42, 510], [308, 510],
        [42, 385], [308, 385],
      ];
      const metrics = rows;
      metrics.forEach((m, i) => {
        const [x, y] = positions[i];
        drawMetricCard(page, fonts, {
          x, y, w: metricW, h: metricH,
          label: m[0], value: m[1], hint: m[2],
          border: i % 2 === 0 ? primary : accent,
          bg: white, text, muted,
        });
      });

      page.drawRectangle({
        x: 42, y: 155, width: 511, height: 85,
        color: pdfColor(black),
        borderRadius: 14,
      } as any);
      page.drawText("PREMISSAS CHAVE", { x: 60, y: 215, size: 8, font: fonts.bold, color: pdfColor(accent) });
      page.drawText("Pneu médio: " + money(assumptions.tire_price), { x: 60, y: 190, size: 9, font: fonts.bold, color: pdfColor(white) });
      page.drawText("Ciclo: " + (assumptions.tire_cycle_months == null ? "A configurar" : number(assumptions.tire_cycle_months) + " meses"), { x: 230, y: 190, size: 9, font: fonts.bold, color: pdfColor(white) });
      page.drawText("Ganho vida útil: " + (assumptions.tire_life_gain == null ? "A configurar" : number(Number(assumptions.tire_life_gain) * 100, 0) + "%"), { x: 380, y: 190, size: 9, font: fonts.bold, color: pdfColor(white) });
      page.drawText("Diesel só é incorporado quando existe base operacional confiável do cliente.", { x: 60, y: 169, size: 7.5, font: fonts.regular, color: pdfColor(mix(white, black, 0.4)) });

      drawFooter(page, fonts, 4, "ROI e retorno financeiro", muted);
    }

    // PAGE 5 — SOCIAL PROOF / ESG
    {
      const page = pdf.addPage([A4.width, A4.height]);
      page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: pdfColor(white) });

      page.drawText("05", { x: 42, y: 775, size: 11, font: fonts.bold, color: pdfColor(primary) });
      page.drawText("REFERÊNCIAS & ESG", { x: 82, y: 775, size: 9, font: fonts.bold, color: pdfColor(muted) });
      page.drawText("Experiência aplicada ao contexto do cliente", { x: 42, y: 720, size: 24, font: fonts.bold, color: pdfColor(text) });
      drawWrapped(
        page, fonts.regular,
        "Somente clientes com relacionamento confirmado e autorização explícita para uso comercial podem aparecer nesta página.",
        42, 685, 9.5, 500, muted, 13
      );

      const approvedRefs = (refs ?? []).filter((r: any) => {
        const item = r.reference_clients;
        return item?.approved_for_marketing === true &&
          item?.approval_status === "approved" &&
          item?.active === true;
      }).slice(0, 6);

      let y = 600;
      if (approvedRefs.length === 0) {
        page.drawRectangle({
          x: 42, y: 470, width: 511, height: 120,
          color: pdfColor(lightPrimary),
          borderColor: pdfColor(primary),
          borderWidth: 0.7,
          borderRadius: 14,
        } as any);
        page.drawText("REFERÊNCIAS EM VALIDAÇÃO", { x: 62, y: 548, size: 11, font: fonts.bold, color: pdfColor(primary) });
        drawWrapped(
          page, fonts.regular,
          "Nenhuma marca está aprovada para uso nesta proposta. O sistema mantém a prova social bloqueada até existir autorização de marketing.",
          62, 520, 10, 470, text, 14
        );
        y = 420;
      } else {
        const boxW = 158;
        const boxH = 66;
        approvedRefs.forEach((r: any, i: number) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = 42 + col * 177;
          const yy = 600 - row * 86;
          page.drawRectangle({
            x, y: yy - boxH, width: boxW, height: boxH,
            color: pdfColor(background),
            borderColor: pdfColor(mix(primary, white, 0.55)),
            borderWidth: 0.7,
            borderRadius: 10,
          } as any);
          drawWrapped(page, fonts.bold, r.reference_clients.company_name, x + 12, yy - 26, 10, boxW - 24, text, 12);
        });
        y = 410;
      }

      page.drawRectangle({
        x: 42, y: 120, width: 511, height: 235,
        color: pdfColor(black),
        borderRadius: 18,
      } as any);
      page.drawText("COMPROMISSO ESG", { x: 64, y: 320, size: 9, font: fonts.bold, color: pdfColor(accent) });
      page.drawText("Mais vida útil por ativo.", { x: 64, y: 282, size: 22, font: fonts.bold, color: pdfColor(white) });
      page.drawText("Melhor uso dos recursos.", { x: 64, y: 254, size: 22, font: fonts.bold, color: pdfColor(primary) });
      drawWrapped(
        page, fonts.regular,
        "A proposta conecta gestão de pneus, manutenção preventiva e eficiência operacional. Indicadores ambientais específicos só devem ser apresentados quando houver metodologia e dados rastreáveis.",
        64, 215, 10, 455, mix(white, black, 0.35), 14
      );

      page.drawText("Olho de Gato • solução para operações que exigem controle e disponibilidade.", {
        x: 64, y: 145, size: 8, font: fonts.bold, color: pdfColor(mix(white, black, 0.45))
      });

      drawFooter(page, fonts, 5, "Prova social e compromisso ESG", muted);
    }

    pdf.setTitle("Proposta OG - " + safeText(companyName));
    pdf.setSubject("Proposta comercial automatizada Olho de Gato");
    pdf.setProducer("OG Proposal Engine Premium 1.1");
    pdf.setCreator("OG Proposal Engine");

    const bytes = await pdf.save();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `proposals/${proposalId}/proposal-premium-1.1.0-${stamp}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("proposal-artifacts")
      .upload(path, bytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data: completed, error: completeError } = await supabase.rpc(
      "complete_render_v1",
      {
        p_render_job_id: renderJobId,
        p_storage_path: path,
        p_mime_type: "application/pdf",
        p_size_bytes: bytes.byteLength,
        p_sha256: null,
        p_metadata: {
          renderer: "pdf_lib_vector_premium",
          template_version: "1.1.0",
          pages: 5,
          design_token_source: tokens?.source ?? "sector_fallback",
          sector,
          brand_logo_embedded: !!logo,
        },
      },
    );
    if (completeError) throw completeError;

    return Response.json({
      ok: true,
      proposal_id: proposalId,
      render_job_id: renderJobId,
      storage_path: path,
      bytes: bytes.byteLength,
      template_version: "1.1.0",
      renderer: "pdf_lib_vector_premium",
      pipeline: completed,
    });
  } catch (error) {
    console.error(error);

    if (renderJobId) {
      try {
        await supabase.rpc("fail_render_job_v1", {
          p_job_id: renderJobId,
          p_error: error instanceof Error ? error.message : String(error),
          p_retry_minutes: 15,
        });
      } catch {}
    }

    return Response.json({
      error: "proposal_premium_pdf_failed",
      render_job_id: renderJobId,
      message: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
});