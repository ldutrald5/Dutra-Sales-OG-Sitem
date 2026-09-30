import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const URL = Deno.env.get("SUPABASE_URL") || "";
const secretMap = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
const ADMIN_KEY = secretMap.default || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const TRANSCRIPTION_MODEL = Deno.env.get("OG_TRANSCRIPTION_MODEL") || "gpt-4o-transcribe-diarize";
const STORAGE_BUCKET = "call-recordings";
const TOKEN_NAME = "call_intelligence_gateway";
const MAX_MANUAL_TRANSCRIPT = 200000;
const admin = createClient(URL, ADMIN_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}
function safeUuid(value: unknown, label = "id") {
  const v = String(value || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error(label + " inválido");
  return v;
}
function optionalUuid(value: unknown, label: string) {
  const v = String(value || "").trim();
  return v ? safeUuid(v, label) : null;
}
function safeSession(value: unknown) {
  const v = String(value || "").trim().slice(0, 160);
  if (!v || !/^[A-Za-z0-9._:-]+$/.test(v)) throw new Error("callSessionId inválido");
  return v;
}
function clampInt(value: unknown, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}
function normalizeMime(value: unknown) {
  const raw = String(value || "audio/webm").split(";")[0].trim().toLowerCase();
  const allowed = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"]);
  if (!allowed.has(raw)) throw new Error("Formato de áudio não suportado");
  return raw;
}
function extensionForMime(mime: string) {
  if (mime === "audio/ogg") return "ogg";
  if (mime === "audio/mp4") return "m4a";
  if (mime === "audio/mpeg") return "mp3";
  if (mime === "audio/wav" || mime === "audio/x-wav") return "wav";
  return "webm";
}
async function sha256(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(v => v.toString(16).padStart(2, "0")).join("");
}
async function authorized(req: Request) {
  const token = req.headers.get("x-og-call-intelligence-token") || "";
  if (token.length < 32) return false;
  const hash = await sha256(token);
  const { data, error } = await admin.from("internal_service_tokens")
    .select("token_hash,active")
    .eq("name", TOKEN_NAME)
    .maybeSingle();
  return !error && Boolean(data?.active) && data?.token_hash === hash;
}
function providerReady() {
  return Boolean(OPENAI_API_KEY);
}

function objectionSignals(text: string) {
  const rules = [
    ["PRICE", /\b(caro|car[aá]|pre[cç]o|valor alto|muito valor|investimento alto)\b/gi],
    ["BUDGET_CUT", /\b(cortando custos|reduzir custos|reduzindo custos|sem or[cç]amento|or[cç]amento apertado)\b/gi],
    ["NO_INTEREST", /\b(sem interesse|n[aã]o tenho interesse|n[aã]o interessa|n[aã]o quero)\b/gi],
    ["ALREADY_HAS_SOLUTION", /\b(j[aá] uso|j[aá] usamos|j[aá] temos|j[aá] utiliza|j[aá] utilizamos)\b/gi],
    ["NEEDS_APPROVAL", /\b(falar com|consultar|aprova[cç][aã]o|financeiro|diretoria|compras|gestor|gerente)\b/gi],
    ["TIMING", /\b(agora n[aã]o|mais pra frente|mais para frente|retornar depois|falar depois|outro momento)\b/gi]
  ] as const;
  const found: Array<{type:string,count:number}> = [];
  for (const [type, re] of rules) {
    const matches = text.match(re) || [];
    if (matches.length) found.push({ type, count: matches.length });
  }
  return found;
}
function keywordCounts(text: string) {
  const groups: Record<string, RegExp> = {
    pneus:/\bpneus?\b/gi,
    frota:/\bfrota\b/gi,
    caminhoes:/\bcaminh(?:a|ã)o(?:es|ões)?\b/gi,
    carretas:/\bcarretas?\b/gi,
    diesel:/\bdiesel\b/gi,
    seguranca:/\bseguran[cç]a\b/gi,
    manutencao:/\bmanuten[cç][aã]o\b/gi,
    garantia:/\bgarantia\b/gi,
    preco:/\b(pre[cç]o|valor|investimento)\b/gi,
    proposta:/\bproposta\b/gi,
    reuniao:/\breuni[aã]o\b/gi,
    economia:/\beconomia\b/gi
  };
  const out: Record<string, number> = {};
  for (const [key, re] of Object.entries(groups)) {
    const count = (text.match(re) || []).length;
    if (count) out[key] = count;
  }
  return out;
}
function numericCandidates(text: string) {
  const patterns = [
    /R\$\s?[\d.]+(?:,\d{1,2})?/gi,
    /\b\d+(?:[.,]\d+)?\s*(?:caminh(?:a|ã)o(?:es|ões)?|carretas?|pneus?|equipamentos?|ve[ií]culos?|psi|parcelas?|dias?|meses?)\b/gi,
    /\b\d+(?:[.,]\d+)?\s*%/g
  ];
  const values: string[] = [];
  for (const re of patterns) for (const match of text.match(re) || []) if (!values.includes(match)) values.push(match);
  return values.slice(0, 40);
}
function extractedCandidates(text: string, numeric: string[]) {
  const candidates: Array<Record<string, unknown>> = [];
  for (const value of numeric.slice(0, 20)) {
    const index = text.toLowerCase().indexOf(value.toLowerCase());
    const start = Math.max(0, index - 70);
    const end = Math.min(text.length, index + value.length + 90);
    candidates.push({
      type: /R\$/.test(value) ? "commercial_number" : /%/.test(value) ? "percentage" : "operational_number",
      value,
      excerpt: text.slice(start, end).trim(),
      review_required: true
    });
  }
  return candidates;
}
function speakerMap(segments: any[]) {
  const map: Record<string, number> = {};
  for (const segment of segments || []) {
    const speaker = String(segment?.speaker || "UNKNOWN").slice(0, 40);
    const start = Math.max(0, Number(segment?.start) || 0);
    const end = Math.max(start, Number(segment?.end) || start);
    map[speaker] = (map[speaker] || 0) + Math.round((end - start) * 1000);
  }
  return map;
}
function metricPayload(recording: any, transcriptId: string | null, text: string, segments: any[]) {
  const sellerMs = Number(recording?.seller_active_ms || 0);
  const customerMs = Number(recording?.customer_active_ms || 0);
  const spoken = sellerMs + customerMs;
  const objections = objectionSignals(text);
  const numeric = numericCandidates(text);
  return {
    recording_id: recording.id,
    transcript_id: transcriptId,
    analysis_version: "call-intelligence-v1",
    duration_ms: Number(recording.duration_ms || 0) || null,
    word_count: text.trim() ? text.trim().split(/\s+/).length : 0,
    question_count: (text.match(/\?/g) || []).length,
    seller_talk_ms: sellerMs || null,
    customer_talk_ms: customerMs || null,
    overlap_ms: Number(recording?.overlap_ms || 0) || null,
    seller_talk_ratio: spoken ? sellerMs / spoken : null,
    customer_talk_ratio: spoken ? customerMs / spoken : null,
    objection_count: objections.reduce((sum, item) => sum + item.count, 0),
    objections,
    keyword_counts: keywordCounts(text),
    numeric_mentions: numeric,
    extracted_candidates: extractedCandidates(text, numeric),
    speaker_map: speakerMap(segments),
    metadata: {
      source: transcriptId ? "transcript" : "capture_only",
      capture_mode: recording.capture_mode,
      metrics_are_advisory: true,
      crm_fact_mutation: false
    },
    updated_at: new Date().toISOString()
  };
}

async function saveMetrics(recording: any, transcriptId: string | null, text: string, segments: any[]) {
  const payload = metricPayload(recording, transcriptId, text, segments);
  const { data, error } = await admin.from("call_conversation_metrics")
    .upsert(payload, { onConflict: "recording_id" })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function initRecording(payload: Record<string, unknown>) {
  const companyId = safeUuid(payload.companyId, "companyId");
  const callSessionId = safeSession(payload.callSessionId);
  const captureMode = String(payload.captureMode || "").toUpperCase();
  if (!["MICROPHONE", "COMPUTER_MIX"].includes(captureMode)) throw new Error("captureMode inválido");
  const mimeType = normalizeMime(payload.mimeType);
  const existing = await admin.from("call_recordings")
    .select("*")
    .eq("call_session_id", callSessionId)
    .maybeSingle();
  if (existing.error) throw existing.error;

  const path = existing.data?.storage_path ||
    companyId + "/" + callSessionId.replace(/[^A-Za-z0-9._-]/g, "_") + "/" + crypto.randomUUID() + "." + extensionForMime(mimeType);

  const row = {
    company_id: companyId,
    contact_id: optionalUuid(payload.contactId, "contactId"),
    opportunity_id: optionalUuid(payload.opportunityId, "opportunityId"),
    prospecting_session_id: optionalUuid(payload.prospectingSessionId, "prospectingSessionId"),
    lead_list_member_id: optionalUuid(payload.listMemberId, "listMemberId"),
    call_session_id: callSessionId,
    storage_bucket: STORAGE_BUCKET,
    storage_path: path,
    capture_mode: captureMode,
    mime_type: mimeType,
    recording_status: "PENDING_UPLOAD",
    transcription_status: "NOT_REQUESTED",
    transcription_error: null,
    user_initiated: true,
    metadata: {
      source: "dutra_os_call_ai",
      browser_capture: true,
      started_by_explicit_user_action: true
    },
    updated_at: new Date().toISOString()
  };

  let recording: any;
  if (existing.data) {
    const updated = await admin.from("call_recordings").update(row).eq("id", existing.data.id).select("*").single();
    if (updated.error) throw updated.error;
    recording = updated.data;
  } else {
    const inserted = await admin.from("call_recordings").insert(row).select("*").single();
    if (inserted.error) throw inserted.error;
    recording = inserted.data;
  }

  const signed = await admin.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (signed.error || !signed.data?.signedUrl) throw signed.error || new Error("signed_upload_unavailable");
  return {
    recording,
    signedUploadUrl: signed.data.signedUrl,
    uploadPath: signed.data.path,
    expiresInSeconds: 7200,
    providerReady: providerReady()
  };
}

async function objectExists(storagePath: string) {
  const parts = storagePath.split("/");
  const file = parts.pop() || "";
  const folder = parts.join("/");
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).list(folder, { search: file, limit: 10 });
  if (error) throw error;
  return (data || []).some(item => item.name === file);
}

async function completeRecording(payload: Record<string, unknown>) {
  const callSessionId = safeSession(payload.callSessionId);
  const current = await admin.from("call_recordings").select("*").eq("call_session_id", callSessionId).maybeSingle();
  if (current.error) throw current.error;
  if (!current.data) throw new Error("Gravação não encontrada");
  if (!(await objectExists(current.data.storage_path))) throw new Error("Arquivo de áudio ainda não foi localizado no Storage");

  const autoTranscribe = payload.autoTranscribe !== false;
  const update = {
    size_bytes: clampInt(payload.sizeBytes, 0, 104857600),
    duration_ms: clampInt(payload.durationMs, 0, 8 * 60 * 60 * 1000),
    seller_active_ms: clampInt(payload.sellerActiveMs, 0, 8 * 60 * 60 * 1000),
    customer_active_ms: clampInt(payload.customerActiveMs, 0, 8 * 60 * 60 * 1000),
    overlap_ms: clampInt(payload.overlapMs, 0, 8 * 60 * 60 * 1000),
    started_at: payload.startedAt || null,
    ended_at: payload.endedAt || new Date().toISOString(),
    recording_status: "UPLOADED",
    transcription_status: autoTranscribe && providerReady() ? "QUEUED" : "NOT_REQUESTED",
    transcription_provider: providerReady() ? "openai" : null,
    transcription_model: providerReady() ? TRANSCRIPTION_MODEL : null,
    transcription_error: null,
    metadata: {
      ...(current.data.metadata || {}),
      capture_metrics_version: "browser-v1",
      uploaded_at: new Date().toISOString()
    },
    updated_at: new Date().toISOString()
  };
  const saved = await admin.from("call_recordings").update(update).eq("id", current.data.id).select("*").single();
  if (saved.error) throw saved.error;

  await saveMetrics(saved.data, null, "", []);

  if (autoTranscribe && providerReady()) {
    const task = transcribeRecording(saved.data.id);
    const runtime = (globalThis as any).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(task);
    else await task;
  }
  return { recording: saved.data, providerReady: providerReady(), transcriptionQueued: autoTranscribe && providerReady() };
}

async function transcribeRecording(recordingId: string) {
  const rec = await admin.from("call_recordings").select("*").eq("id", recordingId).single();
  if (rec.error) throw rec.error;
  if (!OPENAI_API_KEY) {
    await admin.from("call_recordings").update({
      transcription_status: "UNAVAILABLE",
      transcription_error: "OPENAI_API_KEY não configurada no runtime",
      updated_at: new Date().toISOString()
    }).eq("id", recordingId);
    throw new Error("Transcrição automática ainda não está configurada");
  }

  await admin.from("call_recordings").update({
    recording_status: "PROCESSING",
    transcription_status: "PROCESSING",
    transcription_provider: "openai",
    transcription_model: TRANSCRIPTION_MODEL,
    transcription_error: null,
    updated_at: new Date().toISOString()
  }).eq("id", recordingId);

  try {
    const downloaded = await admin.storage.from(STORAGE_BUCKET).download(rec.data.storage_path);
    if (downloaded.error || !downloaded.data) throw downloaded.error || new Error("audio_download_failed");
    const blob = downloaded.data;
    const form = new FormData();
    form.append("file", blob, rec.data.storage_path.split("/").pop() || "call.webm");
    form.append("model", TRANSCRIPTION_MODEL);
    form.append("language", "pt");
    if (TRANSCRIPTION_MODEL.includes("diarize")) {
      form.append("response_format", "diarized_json");
      form.append("chunking_strategy", "auto");
    } else {
      form.append("response_format", "json");
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + OPENAI_API_KEY },
      body: form
    });
    const raw = await response.text();
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { text: raw }; }
    if (!response.ok) throw new Error("OpenAI transcription HTTP " + response.status + ": " + raw.slice(0, 1200));

    const transcriptText = String(parsed?.text || "").trim();
    if (!transcriptText) throw new Error("Transcrição retornou vazia");
    const segments = Array.isArray(parsed?.segments) ? parsed.segments.slice(0, 5000) : [];
    const durationMs = Math.round((Number(parsed?.duration) || Number(rec.data.duration_ms || 0) / 1000) * 1000);

    const transcript = await admin.from("call_transcripts").upsert({
      recording_id: recordingId,
      provider: "openai",
      model: TRANSCRIPTION_MODEL,
      language: "pt",
      transcript_text: transcriptText,
      segments,
      provider_usage: parsed?.usage || {},
      duration_ms: durationMs || rec.data.duration_ms || null,
      updated_at: new Date().toISOString()
    }, { onConflict: "recording_id" }).select("*").single();
    if (transcript.error) throw transcript.error;

    const metrics = await saveMetrics(rec.data, transcript.data.id, transcriptText, segments);

    const done = await admin.from("call_recordings").update({
      recording_status: "READY",
      transcription_status: "READY",
      transcription_error: null,
      updated_at: new Date().toISOString()
    }).eq("id", recordingId).select("*").single();
    if (done.error) throw done.error;
    return { recording: done.data, transcript: transcript.data, metrics };
  } catch (error) {
    await admin.from("call_recordings").update({
      recording_status: "UPLOADED",
      transcription_status: "FAILED",
      transcription_error: error instanceof Error ? error.message.slice(0, 1800) : String(error).slice(0, 1800),
      updated_at: new Date().toISOString()
    }).eq("id", recordingId);
    throw error;
  }
}

async function requestTranscription(payload: Record<string, unknown>) {
  const callSessionId = safeSession(payload.callSessionId);
  const rec = await admin.from("call_recordings").select("id").eq("call_session_id", callSessionId).maybeSingle();
  if (rec.error) throw rec.error;
  if (!rec.data) throw new Error("Gravação não encontrada");
  if (!providerReady()) throw new Error("Transcrição automática ainda não está configurada");
  await transcribeRecording(rec.data.id);
  return statusForSession(callSessionId);
}

async function saveManualTranscript(payload: Record<string, unknown>) {
  const callSessionId = safeSession(payload.callSessionId);
  const text = String(payload.text || "").trim().slice(0, MAX_MANUAL_TRANSCRIPT);
  if (text.length < 8) throw new Error("Transcrição muito curta");
  const rec = await admin.from("call_recordings").select("*").eq("call_session_id", callSessionId).maybeSingle();
  if (rec.error) throw rec.error;
  if (!rec.data) throw new Error("Gravação não encontrada");

  const transcript = await admin.from("call_transcripts").upsert({
    recording_id: rec.data.id,
    provider: "manual",
    model: "manual",
    language: "pt",
    transcript_text: text,
    segments: [],
    provider_usage: {},
    duration_ms: rec.data.duration_ms || null,
    updated_at: new Date().toISOString()
  }, { onConflict: "recording_id" }).select("*").single();
  if (transcript.error) throw transcript.error;

  const metrics = await saveMetrics(rec.data, transcript.data.id, text, []);
  const saved = await admin.from("call_recordings").update({
    recording_status: "READY",
    transcription_status: "READY",
    transcription_provider: "manual",
    transcription_model: "manual",
    transcription_error: null,
    updated_at: new Date().toISOString()
  }).eq("id", rec.data.id).select("*").single();
  if (saved.error) throw saved.error;
  return { recording: saved.data, transcript: transcript.data, metrics, providerReady: providerReady() };
}

async function linkResult(payload: Record<string, unknown>) {
  const callSessionId = safeSession(payload.callSessionId);
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.callAttemptId) update.call_attempt_id = safeUuid(payload.callAttemptId, "callAttemptId");
  if (payload.opportunityId) update.opportunity_id = safeUuid(payload.opportunityId, "opportunityId");
  const result = await admin.from("call_recordings").update(update).eq("call_session_id", callSessionId).select("id,call_session_id,call_attempt_id,opportunity_id").maybeSingle();
  if (result.error) throw result.error;
  return result.data || null;
}

async function statusForSession(callSessionIdInput: unknown) {
  const callSessionId = safeSession(callSessionIdInput);
  const rec = await admin.from("call_recordings").select("*").eq("call_session_id", callSessionId).maybeSingle();
  if (rec.error) throw rec.error;
  if (!rec.data) return { found: false, providerReady: providerReady() };
  const [transcript, metrics] = await Promise.all([
    admin.from("call_transcripts").select("*").eq("recording_id", rec.data.id).maybeSingle(),
    admin.from("call_conversation_metrics").select("*").eq("recording_id", rec.data.id).maybeSingle()
  ]);
  if (transcript.error) throw transcript.error;
  if (metrics.error) throw metrics.error;
  return {
    found: true,
    providerReady: providerReady(),
    recording: rec.data,
    transcript: transcript.data || null,
    metrics: metrics.data || null
  };
}

async function dashboard(payload: Record<string, unknown>) {
  const days = Math.max(1, Math.min(365, Number(payload.days) || 30));
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const recordings = await admin.from("call_recordings")
    .select("id,call_attempt_id,duration_ms,seller_active_ms,customer_active_ms,transcription_status,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);
  if (recordings.error) throw recordings.error;
  const rows = recordings.data || [];
  const ids = rows.map(row => row.id);
  const metrics = ids.length
    ? await admin.from("call_conversation_metrics").select("*").in("recording_id", ids)
    : { data: [], error: null };
  if (metrics.error) throw metrics.error;
  const attemptIds = rows.map(row => row.call_attempt_id).filter(Boolean);
  const attempts = attemptIds.length
    ? await admin.from("call_attempts").select("id,outcome,connected,decision_maker_reached,qualified").in("id", attemptIds)
    : { data: [], error: null };
  if (attempts.error) throw attempts.error;

  const metricRows = metrics.data || [];
  const totalDuration = rows.reduce((sum, row) => sum + Number(row.duration_ms || 0), 0);
  const talkRows = metricRows.filter(row => row.seller_talk_ratio != null && row.customer_talk_ratio != null);
  const objectionTotals: Record<string, number> = {};
  for (const row of metricRows) {
    for (const item of Array.isArray(row.objections) ? row.objections : []) {
      const key = String(item?.type || "OTHER");
      objectionTotals[key] = (objectionTotals[key] || 0) + Number(item?.count || 0);
    }
  }
  const outcomes: Record<string, number> = {};
  for (const row of attempts.data || []) outcomes[row.outcome] = (outcomes[row.outcome] || 0) + 1;

  return {
    days,
    calls: rows.length,
    audioMinutes: Math.round(totalDuration / 600) / 100,
    avgCallSeconds: rows.length ? Math.round(totalDuration / rows.length / 1000) : 0,
    transcribed: rows.filter(row => row.transcription_status === "READY").length,
    transcriptionCoveragePct: rows.length ? Math.round(rows.filter(row => row.transcription_status === "READY").length * 1000 / rows.length) / 10 : 0,
    avgSellerTalkPct: talkRows.length ? Math.round(talkRows.reduce((sum,row)=>sum+Number(row.seller_talk_ratio),0) * 1000 / talkRows.length) / 10 : null,
    avgCustomerTalkPct: talkRows.length ? Math.round(talkRows.reduce((sum,row)=>sum+Number(row.customer_talk_ratio),0) * 1000 / talkRows.length) / 10 : null,
    words: metricRows.reduce((sum,row)=>sum+Number(row.word_count||0),0),
    questions: metricRows.reduce((sum,row)=>sum+Number(row.question_count||0),0),
    objections: objectionTotals,
    outcomes,
    providerReady: providerReady()
  };
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
    if (action === "health") data = { ok: true, service: "call-intelligence", providerReady: providerReady(), model: providerReady() ? TRANSCRIPTION_MODEL : null };
    else if (action === "init_recording") data = await initRecording(payload);
    else if (action === "complete_recording") data = await completeRecording(payload);
    else if (action === "recording_status") data = await statusForSession(payload.callSessionId);
    else if (action === "transcribe") data = await requestTranscription(payload);
    else if (action === "manual_transcript") data = await saveManualTranscript(payload);
    else if (action === "link_result") data = await linkResult(payload);
    else if (action === "dashboard") data = await dashboard(payload);
    else return json(400, { error: "Ação inválida" });
    return json(200, { ok: true, data });
  } catch (error) {
    console.error(error);
    return json(400, { error: error instanceof Error ? error.message : String(error) });
  }
});
