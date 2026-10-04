import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

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

type ContactInput = {
  external_id?: string | null;
  full_name?: string | null;
  phone_e164?: string | null;
  email?: string | null;
  role_title?: string | null;
  decision_level?: "decision_maker" | "influencer" | "user" | "gatekeeper" | "unknown";
  metadata?: Record<string, unknown>;
};

type ConversationInput = {
  external_thread_id: string;
  chat_type?: "direct" | "group" | "unknown";
  title?: string | null;
  metadata?: Record<string, unknown>;
};

type MessageInput = {
  external_message_id: string;
  direction: "inbound" | "outbound" | "system";
  sender_external_id?: string | null;
  sender_name?: string | null;
  body?: string | null;
  message_type?: string | null;
  sent_at: string;
  raw_payload?: Record<string, unknown>;
};

type InsightInput = {
  opportunity_id?: string | null;
  insight_type?: string;
  facts?: Record<string, unknown>;
  hypotheses?: Record<string, unknown>;
  objections?: unknown[];
  buying_signals?: unknown[];
  open_questions?: unknown[];
  next_action?: string | null;
  confidence?: number | null;
  model_name?: string | null;
  model_version?: string | null;
  source_message_ids?: string[];
  metadata?: Record<string, unknown>;
};

type RequestBody = {
  event_id: string;
  event_type?: string;
  provider?: string;
  company_id?: string | null;
  contact?: ContactInput | null;
  conversation: ConversationInput;
  message: MessageInput;
  insight?: InsightInput | null;
  raw_event?: Record<string, unknown>;
};

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers });
}

function cleanString(value: unknown, max = 5000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function validConfidence(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1) return null;
  return n;
}

Deno.serve(async (req: Request) => {
  if (!isInternalAuthorized(req)) {
    return json({ error: "unauthorized" }, 401);
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  let eventRowId: number | null = null;

  try {
    const body = (await req.json()) as RequestBody;
    const provider = cleanString(body.provider, 100) ?? "kaption";
    const eventId = cleanString(body.event_id, 500);
    const eventType = cleanString(body.event_type, 200) ?? "message.upsert";
    const threadId = cleanString(body.conversation?.external_thread_id, 1000);
    const messageId = cleanString(body.message?.external_message_id, 1000);
    const sentAt = new Date(body.message?.sent_at ?? "");

    if (!eventId) return json({ error: "invalid_event_id" }, 400);
    if (!threadId) return json({ error: "invalid_external_thread_id" }, 400);
    if (!messageId) return json({ error: "invalid_external_message_id" }, 400);
    if (!["inbound", "outbound", "system"].includes(body.message?.direction)) {
      return json({ error: "invalid_direction" }, 400);
    }
    if (Number.isNaN(sentAt.getTime())) {
      return json({ error: "invalid_sent_at" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");

    let adminKey = legacyServiceRole ?? "";
    if (secretKeysRaw) {
      try {
        const secretKeys = JSON.parse(secretKeysRaw);
        adminKey = secretKeys.default ?? adminKey;
      } catch {}
    }
    if (!adminKey) throw new Error("No Supabase admin key is available");

    const supabase = createClient(supabaseUrl, adminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingEvent, error: existingEventError } = await supabase
      .from("integration_events")
      .select("id, processing_status")
      .eq("source", provider)
      .eq("external_event_id", eventId)
      .maybeSingle();

    if (existingEventError) throw existingEventError;

    if (existingEvent?.processing_status === "processed") {
      return json({ ok: true, duplicate: true, event_id: eventId });
    }

    if (existingEvent?.id) {
      eventRowId = Number(existingEvent.id);
      const { error } = await supabase
        .from("integration_events")
        .update({
          event_type: eventType,
          processing_status: "received",
          error_message: null,
          raw_payload: body.raw_event ?? {},
        })
        .eq("id", eventRowId);
      if (error) throw error;
    } else {
      const { data: createdEvent, error } = await supabase
        .from("integration_events")
        .insert({
          source: provider,
          external_event_id: eventId,
          event_type: eventType,
          processing_status: "received",
          raw_payload: body.raw_event ?? {},
        })
        .select("id")
        .single();
      if (error) throw error;
      eventRowId = Number(createdEvent.id);
    }

    let contactId: string | null = null;
    const contact = body.contact ?? null;
    const externalContactId = cleanString(contact?.external_id, 1000);
    const phone = cleanString(contact?.phone_e164, 50);

    if (contact) {
      let existingContact: { id: string } | null = null;

      if (phone) {
        const { data, error } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("phone_e164", phone)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        existingContact = data;
      }

      if (!existingContact && externalContactId) {
        const { data, error } = await supabase
          .from("crm_contacts")
          .select("id")
          .eq("provider", provider)
          .eq("external_contact_id", externalContactId)
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        existingContact = data;
      }

      const contactPayload = {
        company_id: body.company_id ?? undefined,
        provider,
        external_contact_id: externalContactId,
        full_name: cleanString(contact.full_name, 300),
        phone_e164: phone,
        email: cleanString(contact.email, 320),
        role_title: cleanString(contact.role_title, 300),
        decision_level: contact.decision_level ?? "unknown",
        source: "whatsapp",
        source_metadata: contact.metadata ?? {},
        last_contact_at: sentAt.toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (existingContact?.id) {
        const { data, error } = await supabase
          .from("crm_contacts")
          .update(contactPayload)
          .eq("id", existingContact.id)
          .select("id")
          .single();
        if (error) throw error;
        contactId = data.id;
      } else {
        const { data, error } = await supabase
          .from("crm_contacts")
          .insert(contactPayload)
          .select("id")
          .single();
        if (error) throw error;
        contactId = data.id;
      }
    }

    const conversationPayload = {
      provider,
      channel: "whatsapp",
      external_thread_id: threadId,
      company_id: body.company_id ?? undefined,
      contact_id: contactId ?? undefined,
      chat_type: body.conversation.chat_type ?? "direct",
      title: cleanString(body.conversation.title, 500),
      last_message_at: sentAt.toISOString(),
      metadata: body.conversation.metadata ?? {},
      updated_at: new Date().toISOString(),
    };

    const { data: conversation, error: conversationError } = await supabase
      .from("crm_conversations")
      .upsert(conversationPayload, { onConflict: "provider,external_thread_id" })
      .select("id")
      .single();

    if (conversationError) throw conversationError;

    const messagePayload = {
      conversation_id: conversation.id,
      provider,
      external_message_id: messageId,
      direction: body.message.direction,
      sender_external_id: cleanString(body.message.sender_external_id, 1000),
      sender_name: cleanString(body.message.sender_name, 300),
      body: cleanString(body.message.body, 20000),
      message_type: cleanString(body.message.message_type, 100) ?? "text",
      sent_at: sentAt.toISOString(),
      raw_payload: body.message.raw_payload ?? {},
    };

    const { data: message, error: messageError } = await supabase
      .from("crm_messages")
      .upsert(messagePayload, { onConflict: "provider,external_message_id" })
      .select("id")
      .single();

    if (messageError) throw messageError;

    let insightId: string | null = null;
    if (body.insight) {
      const { data: insight, error: insightError } = await supabase
        .from("crm_insights")
        .upsert({
          conversation_id: conversation.id,
          message_id: message.id,
          opportunity_id: body.insight.opportunity_id ?? null,
          insight_type: cleanString(body.insight.insight_type, 200) ?? "conversation_snapshot",
          facts: body.insight.facts ?? {},
          hypotheses: body.insight.hypotheses ?? {},
          objections: body.insight.objections ?? [],
          buying_signals: body.insight.buying_signals ?? [],
          open_questions: body.insight.open_questions ?? [],
          next_action: cleanString(body.insight.next_action, 2000),
          confidence: validConfidence(body.insight.confidence),
          review_status: "pending",
          model_name: cleanString(body.insight.model_name, 200),
          model_version: cleanString(body.insight.model_version, 200),
          source_message_ids: body.insight.source_message_ids ?? [messageId],
          metadata: body.insight.metadata ?? {},
        }, { onConflict: "message_id,insight_type" })
        .select("id")
        .single();

      if (insightError) throw insightError;
      insightId = insight.id;
    }

    let processorResult: unknown = null;

    if (insightId) {
      const processorResponse = await fetch(
        supabaseUrl + "/functions/v1/commercial-processor",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": adminKey,
          },
          body: JSON.stringify({ insight_id: insightId }),
        },
      );

      processorResult = await processorResponse.json();

      if (!processorResponse.ok) {
        throw new Error(
          "commercial_processor_failed:" + JSON.stringify(processorResult),
        );
      }
    }

    const { error: eventUpdateError } = await supabase
      .from("integration_events")
      .update({
        processing_status: "processed",
        processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", eventRowId);

    if (eventUpdateError) throw eventUpdateError;

    return json({
      ok: true,
      duplicate: false,
      event_id: eventId,
      contact_id: contactId,
      conversation_id: conversation.id,
      message_id: message.id,
      insight_id: insightId,
      processor: processorResult,
    });
  } catch (error) {
    console.error(error);

    try {
      if (eventRowId !== null) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
        const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        let adminKey = legacyServiceRole ?? "";
        if (secretKeysRaw) {
          try {
            const parsed = JSON.parse(secretKeysRaw);
            adminKey = parsed.default ?? adminKey;
          } catch {}
        }

        if (supabaseUrl && adminKey) {
          const supabase = createClient(supabaseUrl, adminKey, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await supabase
            .from("integration_events")
            .update({
              processing_status: "failed",
              error_message: error instanceof Error ? error.message.slice(0, 2000) : String(error).slice(0, 2000),
            })
            .eq("id", eventRowId);
        }
      }
    } catch {}

    return json({
      error: "whatsapp_ingest_failed",
      message: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});