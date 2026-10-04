import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  }
  return btoa(binary);
}


function cssHex(value: unknown, fallback: string): string {
  const s = String(value ?? "");
  return /^#[0-9A-Fa-f]{6}$/.test(s) ? s : fallback;
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


function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function money(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "A configurar";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
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
  if (!Number.isFinite(n)) return "A configurar";
  return number(n, 1) + "%";
}

function metric(label: string, value: string, hint = "") {
  return `<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(hint)}</small></div>`;
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    let proposalId = new URL(req.url).searchParams.get("proposal_id");

    if (!proposalId && req.method === "POST") {
      const body = await req.json();
      proposalId = body?.proposal_id ?? null;
    }

    if (!proposalId) {
      return new Response(JSON.stringify({ error: "proposal_id_required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
      } catch {
        // Keep legacy fallback.
      }
    }
    if (!adminKey) throw new Error("Admin key missing");

    const supabase = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select("id, company_id, company_name_input, fleet_size, status, proposal_snapshot, created_at")
      .eq("id", proposalId)
      .single();

    if (proposalError) throw proposalError;

    const { data: company } = proposal.company_id
      ? await supabase
          .from("companies")
          .select("name, legal_name, sector, subsector, logo_url, website")
          .eq("id", proposal.company_id)
          .maybeSingle()
      : { data: null };

    const { data: designTokens } = proposal.company_id
      ? await supabase.rpc("resolve_design_tokens_v1", { p_company_id: proposal.company_id })
      : { data: null };

    const brandPrimary = cssHex(designTokens?.primary, "#252525");
    const brandSecondary = cssHex(designTokens?.secondary, "#5D5D5D");
    const brandAccent = cssHex(designTokens?.accent, "#B9974A");
    const brandBackground = cssHex(designTokens?.background, "#F5F5F5");
    const brandText = cssHex(designTokens?.text, "#181818");

    const { data: refs } = await supabase
      .from("proposal_references")
      .select("position, reference_clients(company_name, logo_url, sector, approved_for_marketing, active)")
      .eq("proposal_id", proposalId)
      .order("position", { ascending: true });

    const snap = proposal.proposal_snapshot ?? {};
    const calc = snap.roi ? snap : (snap.calculation ?? {});
    const fleet = calc.fleet ?? {};
    const roi = calc.roi ?? {};
    const investment = calc.investment ?? {};
    const assumptions = calc.assumptions ?? {};

    const companyName =
      company?.name ??
      snap?.company?.name ??
      proposal.company_name_input ??
      "Cliente";

    let logoUrl = company?.logo_url ?? snap?.company?.logo_url ?? "";

    if (proposal.company_id) {
      const { data: storedLogo } = await supabase
        .from("company_brand_assets")
        .select("storage_bucket, storage_path, mime_type, source_url, status")
        .eq("company_id", proposal.company_id)
        .eq("asset_type", "logo")
        .eq("is_primary", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (storedLogo?.status === "stored" && storedLogo.storage_bucket && storedLogo.storage_path) {
        const { data: logoBlob, error: logoDownloadError } = await supabase.storage
          .from(storedLogo.storage_bucket)
          .download(storedLogo.storage_path);

        if (!logoDownloadError && logoBlob) {
          const bytes = new Uint8Array(await logoBlob.arrayBuffer());
          const mime = storedLogo.mime_type ?? logoBlob.type ?? "image/png";
          logoUrl = `data:${mime};base64,${bytesToBase64(bytes)}`;
        }
      } else if (storedLogo?.source_url) {
        logoUrl = storedLogo.source_url;
      }
    }

    const sector = company?.sector ?? snap?.company?.sector ?? "Frotas e Logística";

    const refCards = (refs ?? [])
      .filter((r: any) => {
        const item = r.reference_clients;
        return item?.approved_for_marketing === true && item?.active === true;
      })
      .slice(0, 6)
      .map((r: any) => {
        const item = r.reference_clients;
        const logo = item?.logo_url
          ? `<img src="${esc(item.logo_url)}" alt="${esc(item.company_name)}">`
          : `<strong>${esc(item?.company_name)}</strong>`;
        return `<div class="reference-logo">${logo}</div>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proposta OG — ${esc(companyName)}</title>
<style>
:root {
  --brand-primary: ${brandPrimary};
  --brand-secondary: ${brandSecondary};
  --brand-accent: ${brandAccent};
  --brand-background: ${brandBackground};
  --brand-text: ${brandText};
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; font-family: Inter, Arial, sans-serif; background: #e9ecef; color: var(--brand-text); }
.page {
  width: 210mm; height: 297mm; position: relative; overflow: hidden;
  background: #fff; page-break-after: always; margin: 0 auto;
}
.page:last-child { page-break-after: auto; }
.pad { padding: 18mm 17mm; height: 100%; }
.eyebrow { font-size: 10px; text-transform: uppercase; letter-spacing: .18em; font-weight: 800; opacity: .65; }
h1 { font-size: 33px; line-height: 1.02; margin: 10px 0 16px; max-width: 160mm; }
h2 { font-size: 25px; margin: 8px 0 14px; }
h3 { font-size: 13px; margin: 0 0 7px; }
p { font-size: 11px; line-height: 1.5; }
.cover {
  background:
    radial-gradient(circle at 82% 18%, var(--brand-primary) 0%, transparent 34%),
    radial-gradient(circle at 18% 82%, var(--brand-secondary) 0%, transparent 32%),
    linear-gradient(145deg, #101010 0%, #202020 48%, #050505 100%);
  color: white;
}
.brand { font-size: 12px; letter-spacing: .16em; font-weight: 900; }
.cover-main { position: absolute; left: 17mm; right: 17mm; bottom: 32mm; }
.logo-box {
  position: absolute; top: 18mm; right: 17mm; width: 50mm; height: 24mm;
  border: 1px solid rgba(255,255,255,.28); border-radius: 10px;
  display: flex; align-items: center; justify-content: center; padding: 5mm;
  background: rgba(255,255,255,.08);
}
.logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
.logo-fallback { font-weight: 800; font-size: 14px; text-align: center; }
.cover-stat { margin-top: 14mm; display: flex; gap: 7mm; }
.cover-stat div { border-top: 1px solid rgba(255,255,255,.35); padding-top: 4mm; min-width: 38mm; }
.cover-stat strong { display: block; font-size: 23px; }
.cover-stat span { font-size: 9px; opacity: .72; text-transform: uppercase; letter-spacing: .08em; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8mm; }
.card { border: 1px solid #ddd; border-radius: 12px; padding: 7mm; background: #fff; }
.card.dark { background: #151515; color: white; border-color: var(--brand-primary); border-top: 4px solid var(--brand-accent); }
.benefits { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 10mm; }
.benefit { min-height: 48mm; border-radius: 11px; padding: 7mm; background: var(--brand-background); border-top: 3px solid var(--brand-accent); }
.benefit strong { display: block; font-size: 18px; margin-bottom: 4mm; }
.table { width: 100%; border-collapse: collapse; margin-top: 9mm; font-size: 10px; table-layout: fixed; }
.table th { text-align: left; padding: 4mm; background: #151515; color: #fff; border-bottom: 3px solid var(--brand-accent); }
.table td { padding: 4mm; border-bottom: 1px solid #ddd; vertical-align: top; }
.table .right { text-align: right; }
.summary-total { margin-top: 9mm; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #111; padding-top: 6mm; }
.summary-total strong { font-size: 25px; }
.metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 8mm; }
.metric { border-radius: 12px; padding: 7mm; background: var(--brand-background); min-height: 38mm; border-left: 4px solid var(--brand-primary); }
.metric span { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: .08em; opacity: .7; }
.metric strong { display: block; font-size: 23px; line-height: 1.15; margin: 3mm 0 2mm; }
.metric small { font-size: 8px; opacity: .7; }
.references { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; margin-top: 9mm; }
.reference-logo {
  height: 30mm; border: 1px solid #e0e0e0; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; padding: 6mm;
  background: #fff; text-align: center;
}
.reference-logo img { max-width: 100%; max-height: 100%; object-fit: contain; }
.esg { margin-top: 12mm; background: #171717; color: white; border-radius: 14px; padding: 9mm; border-top: 5px solid var(--brand-primary); }
.footer { position: absolute; left: 17mm; right: 17mm; bottom: 10mm; display: flex; justify-content: space-between; font-size: 8px; opacity: .55; }
.note { font-size: 8px; opacity: .65; margin-top: 7mm; line-height: 1.45; }
@media print {
  html, body { background: #fff; }
  .page { margin: 0; }
}
</style>
</head>
<body>

<section class="page cover">
  <div class="pad">
    <div class="brand">OLHO DE GATO • PROPOSTA TÉCNICA</div>
    <div class="logo-box">
      ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo ${esc(companyName)}">` : `<div class="logo-fallback">${esc(companyName)}</div>`}
    </div>
    <div class="cover-main">
      <div class="eyebrow">${esc(sector)}</div>
      <h1>Eficiência, controle e proteção para a frota da ${esc(companyName)}</h1>
      <p>Proposta personalizada para gestão de pressão e equalização de pneus.</p>
      <div class="cover-stat">
        <div><strong>${number(proposal.fleet_size)}</strong><span>veículos</span></div>
        <div><strong>${number(fleet.total_tires)}</strong><span>pneus atendidos</span></div>
        <div><strong>${money(roi.protected_asset_value)}</strong><span>patrimônio estimado</span></div>
      </div>
    </div>
    <div class="footer"><span>Olho de Gato</span><span>01 / 05</span></div>
  </div>
</section>

<section class="page">
  <div class="pad">
    <div class="eyebrow">A solução</div>
    <h2>Pressão equilibrada. Menos desperdício. Mais disponibilidade.</h2>
    <p>O sistema de equalização trabalha para manter a pressão equilibrada nos conjuntos atendidos, reduzindo desvios operacionais e apoiando uma gestão mais previsível dos pneus.</p>

    <div class="benefits">
      <div class="benefit"><strong>Até 20%</strong><h3>Vida útil dos pneus</h3><p>Premissa comercial parametrizada no motor de proposta e sujeita ao perfil operacional da frota.</p></div>
      <div class="benefit"><strong>2%–6%</strong><h3>Faixa estimada de combustível</h3><p>O documento separa cenário conservador, padrão e potencial, evitando tratar o máximo como garantia.</p></div>
      <div class="benefit"><strong>Reutilizável</strong><h3>Ativo de longo prazo</h3><p>O equipamento pode ser realocado conforme a substituição dos pneus e a política de manutenção.</p></div>
      <div class="benefit"><strong>Assistência OG</strong><h3>Treinamento e suporte</h3><p>Estrutura comercial preparada para incorporar treinamento, peças de reposição e acompanhamento técnico.</p></div>
    </div>

    <div class="note">Os percentuais apresentados são premissas comerciais parametrizadas e devem ser validados conforme operação, tipo de veículo, manutenção, rotas e dados reais do cliente.</div>
    <div class="footer"><span>Benefícios e funcionamento</span><span>02 / 05</span></div>
  </div>
</section>

<section class="page">
  <div class="pad">
    <div class="eyebrow">Investimento</div>
    <h2>Dimensionamento para ${number(proposal.fleet_size)} veículos</h2>

    <table class="table">
      <thead><tr><th>Item</th><th>Base de cálculo</th><th class="right">Quantidade</th><th class="right">Subtotal</th></tr></thead>
      <tbody>
        <tr><td>Equalizadores</td><td>${number(fleet.equalizers_per_vehicle, 2)} por veículo</td><td class="right">${number(fleet.total_equalizers)}</td><td class="right">Conforme tabela vigente</td></tr>
        <tr><td>Suportes / componentes</td><td>${number(fleet.supports_per_vehicle, 2)} por veículo</td><td class="right">${number(fleet.total_supports)}</td><td class="right">Conforme tabela vigente</td></tr>
        <tr><td>Pneus atendidos</td><td>${number(fleet.tires_per_vehicle)} por veículo</td><td class="right">${number(fleet.total_tires)}</td><td class="right">—</td></tr>
      </tbody>
    </table>

    <div class="summary-total">
      <div><div class="eyebrow">Investimento total</div><p>Configuração versionada no motor financeiro.</p></div>
      <strong>${money(investment.total)}</strong>
    </div>

    <div class="card dark" style="margin-top:14mm">
      <h3>Premissas utilizadas</h3>
      <p>Km/mês: <b>${number(assumptions.monthly_km)}</b> • Consumo: <b>${number(assumptions.consumption_km_l, 2)} km/L</b> • Diesel: <b>${money(assumptions.diesel_price)}</b> • Pneu médio: <b>${money(assumptions.tire_price)}</b></p>
    </div>

    <div class="footer"><span>Dimensionamento do investimento</span><span>03 / 05</span></div>
  </div>
</section>

<section class="page">
  <div class="pad">
    <div class="eyebrow">Resumo executivo</div>
    <h2>Impacto financeiro estimado</h2>

    <div class="metrics">
      ${metric("Patrimônio de pneus atendido", money(roi.protected_asset_value), "Estimativa a partir da quantidade e preço médio parametrizados.")}
      ${metric("Economia anual em pneus", money(roi.annual_tire_savings), "Baseada no fator anual de reposição e ganho de vida útil.")}
      ${metric("Economia anual de diesel — conservador", money(roi.annual_fuel_savings_min), "Cenário mínimo configurado.")}
      ${metric("Economia anual de diesel — potencial", money(roi.annual_fuel_savings_max), "Cenário máximo; não representa garantia.")}
      ${metric("Economia anual padrão", money(roi.annual_total_savings), "Pneus + combustível no cenário padrão.")}
      ${metric("ROI estimado", percent(roi.roi_percent), "Retorno anual sobre o investimento calculado.")}
      ${metric("Payback estimado", roi.payback_months == null ? "A configurar" : number(roi.payback_months, 1) + " meses", "Tempo aproximado para recuperar o investimento.")}
    </div>

    <div class="note">Resultados são estimativas baseadas nas premissas registradas no snapshot da proposta. Dados reais de operação devem substituir parâmetros padrão sempre que disponíveis.</div>
    <div class="footer"><span>ROI e retorno financeiro</span><span>04 / 05</span></div>
  </div>
</section>

<section class="page">
  <div class="pad">
    <div class="eyebrow">Referências e compromisso</div>
    <h2>Experiência aplicada ao contexto de ${esc(sector)}</h2>
    <p>As marcas abaixo só aparecem quando cadastradas como referência e explicitamente aprovadas para uso comercial.</p>

    <div class="references">
      ${refCards || `<div class="card" style="grid-column:1/-1"><strong>Referências em validação</strong><p>Nenhuma marca aprovada para este setor foi vinculada a esta proposta.</p></div>`}
    </div>

    <div class="esg">
      <div class="eyebrow" style="opacity:.7">ESG & eficiência operacional</div>
      <h2 style="margin-top:3mm">Mais vida útil por ativo e melhor uso dos recursos.</h2>
      <p>A proposta conecta eficiência de pneus, consumo energético e manutenção preventiva. Indicadores ambientais específicos devem ser calculados somente quando houver metodologia e dados rastreáveis.</p>
    </div>

    <div class="footer"><span>Prova social e compromisso ESG</span><span>05 / 05</span></div>
  </div>
</section>

</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({
        error: "proposal_html_failed",
        message: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});