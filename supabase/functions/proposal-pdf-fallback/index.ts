import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

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


const A4 = { width: 595.28, height: 841.89 };

function money(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "A configurar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);
}

function num(value: unknown, digits = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "A configurar";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
  }).format(n);
}

function pct(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? num(n, 1) + "%" : "A configurar";
}

function safeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrap(text: string, max = 72): string[] {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (req.method !== "POST") {
    return Response.json({ error: "method_not_allowed" }, { status: 405 });
  }

  try {
    const body = await req.json();
    const proposalId = body?.proposal_id;
    if (!proposalId) {
      return Response.json({ error: "proposal_id_required" }, { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl) throw new Error("SUPABASE_URL missing");

    let adminKey = legacyServiceRole ?? "";
    if (secretKeysRaw) {
      try {
        const keys = JSON.parse(secretKeysRaw);
        adminKey = keys.default ?? adminKey;
      } catch {}
    }
    if (!adminKey) throw new Error("Admin key missing");

    const supabase = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [{ data: proposal, error: proposalError }, { data: renderJob, error: renderError }] =
      await Promise.all([
        supabase
          .from("proposals")
          .select("id, company_id, company_name_input, fleet_size, proposal_snapshot, status")
          .eq("id", proposalId)
          .single(),
        supabase
          .from("render_jobs")
          .select("id, status")
          .eq("proposal_id", proposalId)
          .in("status", ["pending", "processing"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    if (proposalError) throw proposalError;
    if (renderError) throw renderError;

    let activeRenderJob = renderJob;
    if (!activeRenderJob) {
      const { data, error } = await supabase
        .from("render_jobs")
        .insert({
          proposal_id: proposalId,
          status: "processing",
          renderer: "pdf_lib_fallback",
          input: { proposal_id: proposalId },
        })
        .select("id, status")
        .single();
      if (error) throw error;
      activeRenderJob = data;
    } else {
      const { error } = await supabase
        .from("render_jobs")
        .update({
          status: "processing",
          renderer: "pdf_lib_fallback",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeRenderJob.id);
      if (error) throw error;
    }

    const { data: company } = proposal.company_id
      ? await supabase
          .from("companies")
          .select("name, legal_name, sector, subsector, logo_url, website")
          .eq("id", proposal.company_id)
          .maybeSingle()
      : { data: null };

    const { data: refs, error: refsError } = await supabase
      .from("proposal_references")
      .select("position, reference_clients(company_name, sector, approved_for_marketing, active)")
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true });
    if (refsError) throw refsError;

    const snap = proposal.proposal_snapshot ?? {};
    const fleet = snap.fleet ?? {};
    const roi = snap.roi ?? {};
    const investment = snap.investment ?? {};
    const assumptions = snap.assumptions ?? {};
    const engine = snap.engine ?? {};

    const companyName = company?.name ?? snap?.company?.name ?? proposal.company_name_input;
    const sector = company?.sector ?? snap?.company_enrichment?.sector ?? "frotas e logistica";

    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const addPage = (title: string, subtitle: string, dark = false) => {
      const page = pdf.addPage([A4.width, A4.height]);
      if (dark) page.drawRectangle({ x: 0, y: 0, width: A4.width, height: A4.height, color: rgb(0.06, 0.06, 0.06) });
      const fg = dark ? rgb(1, 1, 1) : rgb(0.08, 0.08, 0.08);
      const muted = dark ? rgb(0.72, 0.72, 0.72) : rgb(0.4, 0.4, 0.4);
      page.drawText(safeText(title), { x: 48, y: 770, size: 25, font: bold, color: fg });
      page.drawText(safeText(subtitle), { x: 48, y: 742, size: 10, font: regular, color: muted });
      return { page, fg, muted };
    };

    // Page 1
    {
      const { page, fg, muted } = addPage("OLHO DE GATO", "Proposta tecnica personalizada", true);
      page.drawText(safeText(companyName), { x: 48, y: 610, size: 29, font: bold, color: fg });
      page.drawText(safeText(sector), { x: 48, y: 582, size: 12, font: regular, color: muted });
      page.drawText(num(proposal.fleet_size) + " veiculos", { x: 48, y: 475, size: 22, font: bold, color: fg });
      page.drawText(num(fleet.total_tires) + " pneus atendidos", { x: 48, y: 438, size: 18, font: bold, color: fg });
      page.drawText(money(roi.protected_asset_value) + " em patrimonio estimado", { x: 48, y: 401, size: 16, font: bold, color: fg });
      page.drawText("01 / 05", { x: 500, y: 34, size: 8, font: regular, color: muted });
    }

    // Page 2
    {
      const { page, fg, muted } = addPage("Beneficios da solucao", "Equalizacao e gestao de pneus");
      const items = [
        ["Vida util", "Premissa comercial de ganho de ate 20% na vida util dos pneus."],
        ["Combustivel", "Faixa parametrizada de 2% a 6%, exibida somente quando existe base de consumo confiavel."],
        ["Reutilizacao", "O equipamento pode acompanhar a renovacao dos pneus conforme politica de manutencao."],
        ["Suporte OG", "Treinamento, assistencia e estrutura de manutencao podem ser incorporados a proposta."],
      ];
      let y = 650;
      for (const [head, text] of items) {
        page.drawText(head, { x: 48, y, size: 17, font: bold, color: fg });
        y -= 22;
        for (const line of wrap(text, 78)) {
          page.drawText(line, { x: 48, y, size: 10.5, font: regular, color: muted });
          y -= 15;
        }
        y -= 24;
      }
      page.drawText("02 / 05", { x: 500, y: 34, size: 8, font: regular, color: muted });
    }

    // Page 3
    {
      const { page, fg, muted } = addPage("Investimento", "Dimensionamento calculado para a frota informada");
      const rows = [
        ["Veiculos", num(proposal.fleet_size)],
        ["Pneus", num(fleet.total_tires)],
        ["Pecas / equalizadores", num(fleet.total_equalizers)],
        ["Suportes", num(fleet.total_supports)],
        ["Pacote por veiculo", money(investment.package_price_per_vehicle)],
        ["Investimento total", money(investment.total)],
      ];
      let y = 660;
      for (const [label, value] of rows) {
        page.drawText(label, { x: 48, y, size: 11, font: regular, color: muted });
        page.drawText(value, { x: 345, y, size: 13, font: bold, color: fg });
        page.drawLine({ start: { x: 48, y: y - 10 }, end: { x: 545, y: y - 10 }, thickness: 0.5, color: rgb(0.84,0.84,0.84) });
        y -= 52;
      }
      page.drawText("03 / 05", { x: 500, y: 34, size: 8, font: regular, color: muted });
    }

    // Page 4
    {
      const { page, fg, muted } = addPage("Resumo executivo de ROI", "Calculos versionados e premissas registradas no snapshot");
      const rows = [
        ["Patrimonio protegido", money(roi.protected_asset_value)],
        ["Economia anual em pneus", money(roi.annual_tire_savings)],
        ["Economia anual diesel (padrao)", money(roi.annual_fuel_savings_default)],
        ["Economia anual total", money(roi.annual_total_savings)],
        ["ROI estimado", pct(roi.roi_percent)],
        ["Payback", roi.payback_months == null ? "A configurar" : num(roi.payback_months, 1) + " meses"],
      ];
      let y = 660;
      for (const [label, value] of rows) {
        page.drawText(label, { x: 48, y, size: 11, font: regular, color: muted });
        page.drawText(value, { x: 325, y, size: 14, font: bold, color: fg });
        y -= 54;
      }
      page.drawText("Escopo do calculo: " + safeText(engine.calculation_scope ?? "incompleto"), { x: 48, y: 260, size: 10, font: regular, color: muted });
      page.drawText("Preco medio pneu: " + money(assumptions.tire_price), { x: 48, y: 240, size: 10, font: regular, color: muted });
      page.drawText("04 / 05", { x: 500, y: 34, size: 8, font: regular, color: muted });
    }

    // Page 5
    {
      const { page, fg, muted } = addPage("Referencias e ESG", "Referencias aprovadas para o setor e compromisso com eficiencia");
      let y = 650;
      const approvedRefs = (refs ?? []).filter((r: any) => r.reference_clients?.approved_for_marketing && r.reference_clients?.active);
      if (approvedRefs.length === 0) {
        page.drawText("Nenhuma referencia aprovada vinculada a esta proposta.", { x: 48, y, size: 11, font: regular, color: muted });
        y -= 35;
      } else {
        for (const r of approvedRefs.slice(0, 6)) {
          page.drawText("- " + safeText(r.reference_clients.company_name), { x: 48, y, size: 13, font: bold, color: fg });
          y -= 30;
        }
      }
      y -= 30;
      page.drawText("Compromisso ESG", { x: 48, y, size: 18, font: bold, color: fg });
      y -= 30;
      for (const line of wrap("Mais vida util por ativo, menor desperdicio e melhor uso dos recursos. Indicadores ambientais especificos devem ser calculados apenas com metodologia e dados rastreaveis.", 78)) {
        page.drawText(line, { x: 48, y, size: 10.5, font: regular, color: muted });
        y -= 16;
      }
      page.drawText("05 / 05", { x: 500, y: 34, size: 8, font: regular, color: muted });
    }

    pdf.setTitle("Proposta OG - " + safeText(companyName));
    pdf.setSubject("Proposta comercial automatizada Olho de Gato");
    pdf.setProducer("OG Proposal Engine");

    const bytes = await pdf.save();
    const path = `proposals/${proposalId}/proposal-fallback-v1.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("proposal-artifacts")
      .upload(path, bytes, {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: complete, error: completeError } = await supabase.rpc(
      "complete_render_v1",
      {
        p_render_job_id: activeRenderJob.id,
        p_storage_path: path,
        p_mime_type: "application/pdf",
        p_size_bytes: bytes.byteLength,
        p_sha256: null,
        p_metadata: {
          renderer: "pdf_lib_fallback",
          visual_fidelity: "functional_fallback",
          pages: 5,
        },
      },
    );
    if (completeError) throw completeError;

    return Response.json({
      ok: true,
      proposal_id: proposalId,
      render_job_id: activeRenderJob.id,
      storage_path: path,
      bytes: bytes.byteLength,
      pipeline: complete,
      note: "Fallback PDF generated. Replace renderer with HTML/Chromium for pixel-perfect production output.",
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      {
        error: "fallback_pdf_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
});