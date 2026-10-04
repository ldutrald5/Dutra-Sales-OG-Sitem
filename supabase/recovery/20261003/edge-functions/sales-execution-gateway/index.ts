import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL") || "";
const secretMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const ADMIN_KEY = secretMap.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const admin = createClient(URL, ADMIN_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function uuid(value: unknown) {
  const v = String(value || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("ID inválido");
  return v;
}
async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, "0")).join("");
}
async function authorized(req: Request) {
  const token = req.headers.get("x-og-gateway-token") || "";
  if (token.length < 32) return false;
  const hash = await sha256(token);
  const { data, error } = await admin
    .from("internal_service_tokens")
    .select("token_hash,active")
    .eq("name", "sales_execution_gateway")
    .maybeSingle();
  if (error || !data?.active) return false;
  return data.token_hash === hash;
}

async function listLists() {
  return admin.from("lead_lists")
    .select("id,name,source,status,total_count,worked_count,meetings_count,proposals_count,sales_count,created_at,updated_at")
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: false })
    .limit(100);
}

async function startSession(payload: Record<string, unknown>) {
  const listId = uuid(payload.listId);
  const externalId = String(payload.externalId || "").trim().slice(0, 180);
  const targetCalls = Math.max(1, Math.min(10000, Number(payload.targetCalls) || 25));
  const rawSeller = String(payload.sellerId || "").trim();
  const sellerId = /^[0-9a-f-]{36}$/i.test(rawSeller) ? rawSeller : null;

  if (externalId) {
    const existing = await admin.from("prospecting_sessions").select("*").eq("external_id", externalId).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) return existing.data;
  }

  const { data, error } = await admin.from("prospecting_sessions").insert({
    list_id: listId,
    seller_id: sellerId,
    status: "ACTIVE",
    target_calls: targetCalls,
    external_id: externalId || null
  }).select("*").single();
  if (error) throw error;
  return data;
}

async function sessionQueue(payload: Record<string, unknown>) {
  const sessionId = uuid(payload.sessionId);
  const sessionResult = await admin.from("prospecting_sessions")
    .select("id,list_id,current_member_id,status,target_calls,started_at,finished_at")
    .eq("id", sessionId).maybeSingle();
  if (sessionResult.error) throw sessionResult.error;
  if (!sessionResult.data) throw new Error("Sessão não encontrada");

  const members = await admin.from("lead_list_members")
    .select("id,list_id,company_id,primary_contact_id,position,work_status,enrichment_status,briefing_cache,briefing_valid_until,last_attempt_at,worked_at")
    .eq("list_id", sessionResult.data.list_id)
    .in("work_status", ["AVAILABLE", "IN_PROGRESS"])
    .order("position", { ascending: true, nullsFirst: false })
    .limit(500);
  if (members.error) throw members.error;
  return { session: sessionResult.data, members: members.data || [] };
}

async function accountContext(payload: Record<string, unknown>) {
  const companyId = uuid(payload.companyId);
  const [company, contacts, opportunities, activities, briefings] = await Promise.all([
    admin.from("companies").select("*").eq("id", companyId).maybeSingle(),
    admin.from("crm_contacts").select("*").eq("company_id", companyId).order("influence_level", { ascending: false }).limit(20),
    admin.from("sales_opportunities").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }).limit(10),
    admin.from("crm_activities").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20),
    admin.from("ai_briefings").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5)
  ]);
  const error = company.error || contacts.error || opportunities.error || activities.error || briefings.error;
  if (error) throw error;
  if (!company.data) throw new Error("Empresa não encontrada");
  return {
    company: company.data,
    contacts: contacts.data || [],
    opportunities: opportunities.data || [],
    recentActivities: activities.data || [],
    briefings: briefings.data || []
  };
}

async function recordCallResult(payload: Record<string, unknown>) {
  const { data, error } = await admin.rpc("record_sales_execution_result_v1", { p_command: payload });
  if (error) throw error;
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json(405, { error: "Método não permitido" });
  if (!URL || !ADMIN_KEY) return json(503, { error: "Supabase admin environment unavailable" });
  if (!(await authorized(req))) return json(401, { error: "Gateway token inválido" });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "");
    const payload = body?.payload && typeof body.payload === "object" ? body.payload : {};
    let data: unknown;
    if (action === "health") data = { ok: true, service: "sales-execution-gateway" };
    else if (action === "list_lists") data = await listLists();
    else if (action === "start_session") data = await startSession(payload);
    else if (action === "session_queue") data = await sessionQueue(payload);
    else if (action === "account_context") data = await accountContext(payload);
    else if (action === "record_call_result") data = await recordCallResult(payload);
    else return json(400, { error: "Ação inválida" });
    return json(200, { ok: true, data });
  } catch (error) {
    return json(400, { error: error instanceof Error ? error.message : String(error) });
  }
});
