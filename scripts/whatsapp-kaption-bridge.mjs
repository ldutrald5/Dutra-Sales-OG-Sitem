import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const BRIDGE_VERSION = '1.0.0';

const DEFAULT_INGEST_URL = 'https://hlyffyguxqxmgxlevfeq.supabase.co/functions/v1/whatsapp-ingest';
const DEFAULT_CURSOR_FILE = path.resolve('apps/sistema-og/.data/kaption-sync-cursor.json');

function envInt(env, name, fallback, min, max) {
  const value = Number(env[name]);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function envBool(env, name, fallback = false) {
  const value = String(env[name] ?? '').trim().toLowerCase();
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value);
}

function idValue(value) {
  if (typeof value === 'string') return value.trim() || null;
  if (!value || typeof value !== 'object') return null;
  if (typeof value._serialized === 'string') return value._serialized;
  if (typeof value.id === 'string') return value.id;
  if (typeof value.jid === 'string') return value.jid;
  if (value.user && value.server) return `${value.user}@${value.server}`;
  return null;
}

function firstId(obj, fields) {
  if (!obj || typeof obj !== 'object') return null;
  for (const field of fields) {
    const result = idValue(obj[field]);
    if (result) return result;
  }
  return null;
}

export function toIsoTimestamp(value) {
  if (value == null) return null;
  let date;
  if (typeof value === 'number') {
    const millis = value < 1e12 ? value * 1000 : value;
    date = new Date(millis);
  } else if (typeof value === 'string' && /^\d{10,13}$/.test(value.trim())) {
    const numeric = Number(value);
    date = new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function firstTimestamp(obj, fields) {
  if (!obj || typeof obj !== 'object') return null;
  for (const field of fields) {
    const result = toIsoTimestamp(obj[field]);
    if (result) return result;
  }
  return null;
}

function textValue(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function bodyFromMessage(message) {
  for (const key of ['body', 'text', 'caption', 'content', 'transcription']) {
    const value = textValue(message?.[key]);
    if (value) return value;
  }
  return '';
}

function conversationName(conversation) {
  for (const key of ['name', 'title', 'formattedTitle', 'pushname', 'displayName']) {
    const value = textValue(conversation?.[key]);
    if (value) return value.slice(0, 300);
  }
  return null;
}

function phoneFromJid(jid) {
  if (typeof jid !== 'string' || !jid.endsWith('@c.us')) return null;
  const digits = jid.split('@')[0].replace(/\D/g, '');
  return digits.length >= 10 ? `+${digits}` : null;
}

function phoneDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function buildCanonicalPhoneIndex(leads = []) {
  const index = new Map();
  for (const lead of Array.isArray(leads) ? leads : []) {
    if (!lead || typeof lead !== 'object') continue;
    const phones = [
      lead.telefone,
      ...(Array.isArray(lead.additionalPhones) ? lead.additionalPhones.map((item) => item?.phone ?? item) : []),
      ...(Array.isArray(lead.contacts) ? lead.contacts.map((item) => item?.phone ?? item?.telefone) : []),
    ];
    for (const phone of phones) {
      const key = phoneDigits(phone);
      if (key.length >= 10 && !index.has(key)) index.set(key, lead);
    }
  }
  return index;
}

export function enrichInsightWithCanonicalLead(insight, lead) {
  if (!insight || !lead || typeof lead !== 'object') return insight;
  const facts = { ...(insight.facts || {}) };
  const companyName = textValue(lead.empresa || lead.company || lead.nome);
  const fleetSize = Number(lead.fleetSize);
  const pain = textValue(lead.pain);

  if (companyName) facts.company_name = fact(companyName, 1);
  if (!facts.fleet_size && Number.isInteger(fleetSize) && fleetSize > 0 && fleetSize <= 100000) {
    facts.fleet_size = fact(fleetSize, 1);
  }
  if (!facts.primary_pain && pain) facts.primary_pain = fact(pain.slice(0, 2000), 1);

  return {
    ...insight,
    facts,
    confidence: Math.max(Number(insight.confidence) || 0, companyName ? 1 : 0),
    metadata: {
      ...(insight.metadata || {}),
      canonical_source: 'state.leads',
      canonical_lead_id: lead.id || null,
    },
  };
}

async function loadCanonicalPhoneIndex(config) {
  if (!config.crmLookup) return new Map();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const headers = config.crmAccessToken
      ? { Authorization: `Bearer ${config.crmAccessToken}` }
      : {};
    const response = await fetch(config.crmStateUrl, { headers, signal: controller.signal });
    if (!response.ok) throw new Error(`CRM state HTTP ${response.status}`);
    const state = await response.json();
    return buildCanonicalPhoneIndex(state?.leads || []);
  } finally {
    clearTimeout(timer);
  }
}

function fromMe(message) {
  for (const key of ['fromMe', 'from_me', 'isFromMe']) {
    if (typeof message?.[key] === 'boolean') return message[key];
  }
  if (typeof message?.id?.fromMe === 'boolean') return message.id.fromMe;
  return false;
}

function messageId(message) {
  return firstId(message, ['id', 'message_id', 'messageId', 'key']) ||
    firstId(message?._data, ['id']) ||
    null;
}

function conversationId(conversation) {
  return firstId(conversation, ['id', 'jid', 'chatId', 'conversation_id', 'conversationId']) || null;
}

function messageTimestamp(message) {
  return firstTimestamp(message, ['sent_at', 'sentAt', 'timestamp', 't', 'date', 'createdAt']) ||
    firstTimestamp(message?._data, ['t', 'timestamp']);
}

function conversationTimestamp(conversation) {
  return firstTimestamp(conversation, [
    'last_message_at',
    'lastMessageAt',
    'timestamp',
    't',
    'updatedAt',
    'lastActivityAt',
  ]) ||
    firstTimestamp(conversation?.lastMessage, ['timestamp', 't', 'sentAt']);
}

function unwrapContentText(result) {
  const content = result?.content;
  if (!Array.isArray(content)) return null;
  const textParts = content
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text);
  if (!textParts.length) return null;
  const joined = textParts.join('\n').trim();
  if (!joined) return null;
  try {
    return JSON.parse(joined);
  } catch {
    return joined;
  }
}

export function normalizeToolResult(result) {
  if (result?.isError) {
    const detail = unwrapContentText(result);
    throw new Error(`Kaption tool error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  if (result?.structuredContent?.result !== undefined) return result.structuredContent.result;
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const parsed = unwrapContentText(result);
  if (parsed && typeof parsed === 'object' && Object.prototype.hasOwnProperty.call(parsed, 'result')) {
    return parsed.result;
  }
  return parsed ?? result;
}

function arrayFrom(payload, keys) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(payload[key])) return payload[key];
  }
  if (payload.result !== undefined) return arrayFrom(payload.result, keys);
  if (payload.data !== undefined) return arrayFrom(payload.data, keys);
  return [];
}

function messagesFrom(payload) {
  const direct = arrayFrom(payload, ['messages', 'items', 'results']);
  if (direct.length) return direct;
  if (payload?.conversation) return arrayFrom(payload.conversation, ['messages', 'items']);
  if (payload?.chat) return arrayFrom(payload.chat, ['messages', 'items']);
  return [];
}

function sessionsFrom(payload) {
  return arrayFrom(payload, ['sessions', 'items', 'results']);
}

function conversationsFrom(payload) {
  return arrayFrom(payload, ['conversations', 'chats', 'items', 'results']);
}

function fact(value, confidence = 0.99) {
  return { value, confidence, confirmed: true };
}

export function extractDeterministicInsight(text, direction = 'inbound') {
  if (direction !== 'inbound') return null;
  const source = textValue(text);
  if (!source) return null;

  const facts = {};
  const objections = [];
  let nextAction = null;
  let confidence = 0;

  const fleetPatterns = [
    /\b(?:tenho|temos|possuo|possu[ií]mos)\s+(\d{1,5})\s+(?:caminh(?:ão|ões|oes)|caminhoes|carretas?|ve[ií]culos?|conjuntos?|rodotrens?)\b/i,
    /\b(?:minha|nossa)\s+frota\s+(?:é|e|tem|possui)\s+(?:de\s+)?(\d{1,5})\s+(?:caminh(?:ão|ões|oes)|caminhoes|carretas?|ve[ií]culos?|conjuntos?|rodotrens?)\b/i,
    /\bfrota\s+(?:é|e|tem|possui|de)\s+(\d{1,5})\s+(?:caminh(?:ão|ões|oes)|caminhoes|carretas?|ve[ií]culos?|conjuntos?|rodotrens?)\b/i,
    /\b(\d{1,5})\s+(?:caminh(?:ão|ões|oes)|caminhoes|carretas?|ve[ií]culos?|conjuntos?|rodotrens?)\s+(?:na|em\s+minha|em\s+nossa)\s+frota\b/i,
  ];

  for (const pattern of fleetPatterns) {
    const match = source.match(pattern);
    if (!match) continue;
    const value = Number(match[1]);
    if (Number.isInteger(value) && value > 0 && value <= 100000) {
      facts.fleet_size = fact(value, 0.99);
      confidence = Math.max(confidence, 0.99);
      break;
    }
  }

  if (/\brodotrem\b/i.test(source) && /\b9\s*(?:eixos?|eixo)\b/i.test(source)) {
    facts.vehicle_profile_code = fact('rodotrem_9_eixos', 0.99);
    confidence = Math.max(confidence, 0.99);
  }

  if (/\b(?:muito\s+caro|est[aá]\s+caro|ficou\s+caro|pre[cç]o\s+(?:alto|caro)|investimento\s+(?:alto|caro))\b/i.test(source)) {
    objections.push('preço/investimento');
    confidence = Math.max(confidence, 0.96);
  }

  if (/\b(?:me\s+(?:chama|liga|ligue)|pode\s+(?:me\s+)?ligar|fala\s+comigo|entre\s+em\s+contato)\b/i.test(source)) {
    nextAction = 'Retornar contato conforme solicitação do cliente';
    confidence = Math.max(confidence, 0.96);
  } else if (/\b(?:manda|mande|envia|envie)\b.{0,24}\b(?:proposta|or[cç]amento|cotação|cotacao)\b/i.test(source)) {
    nextAction = 'Preparar e revisar proposta solicitada pelo cliente';
    confidence = Math.max(confidence, 0.96);
  }

  if (!Object.keys(facts).length && !objections.length && !nextAction) return null;

  return {
    insight_type: 'deterministic_explicit_fact',
    facts,
    hypotheses: {},
    objections,
    buying_signals: nextAction ? ['cliente solicitou próxima ação explícita'] : [],
    open_questions: [],
    next_action: nextAction,
    confidence: confidence || 0.96,
    model_name: 'deterministic',
    model_version: BRIDGE_VERSION,
    metadata: {
      source_mode: 'deterministic_explicit',
      extractor_version: BRIDGE_VERSION,
    },
  };
}

class McpStdioClient {
  constructor() {
    this.child = null;
    this.pending = new Map();
    this.nextId = 1;
  }

  async start() {
    const command = process.platform === 'win32'
      ? (process.env.ComSpec || 'cmd.exe')
      : 'npx';
    const args = process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npx.cmd -y @kaptionai/mcp-extension@latest']
      : ['-y', '@kaptionai/mcp-extension@latest'];
    this.child = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
      windowsHide: true,
    });

    this.child.stderr.on('data', (chunk) => {
      const line = String(chunk).trim();
      if (line) process.stderr.write(`[kaption] ${line}\n`);
    });

    const lines = createInterface({ input: this.child.stdout });
    lines.on('line', (line) => this.handleLine(line));

    this.child.once('exit', (code, signal) => {
      const error = new Error(`Kaption MCP encerrou (code=${code}, signal=${signal})`);
      for (const pending of this.pending.values()) pending.reject(error);
      this.pending.clear();
    });

    await this.request('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'dutra-og-whatsapp-bridge', version: BRIDGE_VERSION },
    });
    this.notify('notifications/initialized', {});

    const listed = await this.request('tools/list', {});
    const names = Array.isArray(listed?.tools) ? listed.tools.map((tool) => tool?.name) : [];
    if (!names.includes('query')) {
      throw new Error('Kaption MCP não expôs a ferramenta obrigatória "query".');
    }
  }

  handleLine(line) {
    const trimmed = String(line).trim();
    if (!trimmed.startsWith('{')) return;
    let message;
    try {
      message = JSON.parse(trimmed);
    } catch {
      return;
    }
    if (message.id == null) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    clearTimeout(pending.timer);
    if (message.error) pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
    else pending.resolve(message.result);
  }

  request(method, params, timeoutMs = 30000) {
    if (!this.child?.stdin?.writable) return Promise.reject(new Error('Kaption MCP não está disponível.'));
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timeout MCP em ${method}`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  notify(method, params) {
    if (!this.child?.stdin?.writable) return;
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  async callTool(name, args) {
    const result = await this.request('tools/call', { name, arguments: args }, 60000);
    return normalizeToolResult(result);
  }

  close() {
    if (!this.child) return;
    try { this.child.stdin.end(); } catch {}
    try { this.child.kill(); } catch {}
  }
}

async function loadState(file, lookbackMinutes) {
  try {
    const parsed = JSON.parse(await readFile(file, 'utf8'));
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {}
  return {
    version: 1,
    initial_after: new Date(Date.now() - lookbackMinutes * 60_000).toISOString(),
    conversations: {},
  };
}

async function saveState(file, state) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  await writeFile(tmp, JSON.stringify(state, null, 2), 'utf8');
  await rename(tmp, file);
}

function cursorKey(sessionId, chatId) {
  return `${sessionId}::${chatId}`;
}

async function postIngest(url, apiKey, payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 1000) }; }
    if (!response.ok) {
      throw new Error(`whatsapp-ingest HTTP ${response.status}: ${JSON.stringify(data)}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function sessionIdOf(session) {
  return firstId(session, ['id', 'session_id', 'sessionId', 'wid']) ||
    textValue(session?.name) ||
    null;
}

function senderIdOf(message) {
  return firstId(message, ['author', 'from', 'senderId', 'sender_id']) ||
    firstId(message?.sender, ['id', 'jid']) ||
    null;
}

function senderNameOf(message) {
  for (const key of ['senderName', 'notifyName', 'pushName', 'pushname', 'authorName']) {
    const value = textValue(message?.[key]);
    if (value) return value.slice(0, 300);
  }
  return null;
}

function messageTypeOf(message) {
  for (const key of ['type', 'messageType', 'message_type']) {
    const value = textValue(message?.[key]);
    if (value) return value.slice(0, 100);
  }
  return 'text';
}

async function syncConversation({ client, sessionId, conversation, state, config, crmIndex }) {
  const chatId = conversationId(conversation);
  if (!chatId) return { scanned: 0, ingested: 0, skipped: 0 };

  const isGroup = chatId.endsWith('@g.us');
  if (isGroup && !config.includeGroups) return { scanned: 0, ingested: 0, skipped: 1 };

  const key = cursorKey(sessionId, chatId);
  const directPhone = phoneDigits(phoneFromJid(chatId));
  const canonicalLead = directPhone ? crmIndex.get(directPhone) || null : null;
  const cursor = state.conversations[key]?.after || state.initial_after;
  const lastActivity = conversationTimestamp(conversation);

  if (lastActivity && Date.parse(lastActivity) <= Date.parse(cursor)) {
    return { scanned: 0, ingested: 0, skipped: 1 };
  }

  const payload = await client.callTool('query', {
    id: chatId,
    after: cursor,
    limit: config.messageLimit,
    target_session: sessionId,
  });

  const messages = messagesFrom(payload)
    .map((message) => ({ message, at: messageTimestamp(message) }))
    .filter((item) => item.at && Date.parse(item.at) > Date.parse(cursor))
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  let ingested = 0;
  let newest = cursor;

  for (const { message, at } of messages) {
    const externalMessageId = messageId(message);
    if (!externalMessageId) continue;

    const direction = fromMe(message) ? 'outbound' : 'inbound';
    const body = bodyFromMessage(message);
    const baseInsight = extractDeterministicInsight(body, direction);
    const insight = enrichInsightWithCanonicalLead(baseInsight, canonicalLead);
    const chatName = conversationName(conversation);
    const eventId = `kaption:${sessionId}:${externalMessageId}`;

    const ingestPayload = {
      event_id: eventId,
      event_type: 'message.upsert',
      provider: 'kaption',
      contact: isGroup ? null : {
        external_id: chatId,
        full_name: textValue(canonicalLead?.nome) || chatName,
        phone_e164: phoneFromJid(chatId),
        metadata: {
          session_id: sessionId,
          canonical_lead_id: canonicalLead?.id || null,
        },
      },
      conversation: {
        external_thread_id: chatId,
        chat_type: isGroup ? 'group' : 'direct',
        title: chatName,
        metadata: {
          session_id: sessionId,
          bridge_version: BRIDGE_VERSION,
          canonical_lead_id: canonicalLead?.id || null,
        },
      },
      message: {
        external_message_id: externalMessageId,
        direction,
        sender_external_id: senderIdOf(message),
        sender_name: senderNameOf(message),
        body: body || null,
        message_type: messageTypeOf(message),
        sent_at: at,
        raw_payload: {
          source: 'kaption_bridge',
          session_id: sessionId,
          bridge_version: BRIDGE_VERSION,
        },
      },
      insight,
      raw_event: {
        source: 'kaption_bridge',
        session_id: sessionId,
        bridge_version: BRIDGE_VERSION,
      },
    };

    await postIngest(config.ingestUrl, config.apiKey, ingestPayload);
    ingested += 1;
    if (Date.parse(at) > Date.parse(newest)) newest = at;

    state.conversations[key] = {
      after: newest,
      last_success_at: new Date().toISOString(),
    };
    await saveState(config.cursorFile, state);
  }

  return { scanned: messages.length, ingested, skipped: 0 };
}

let lastCrmWarningAt = 0;

async function runPass(client, state, config) {
  let crmIndex = new Map();
  try {
    crmIndex = await loadCanonicalPhoneIndex(config);
  } catch (error) {
    const now = Date.now();
    if (now - lastCrmWarningAt > 300000) {
      console.error(`[wa-bridge] CRM canônico indisponível; sincronização continua sem vínculo automático: ${error instanceof Error ? error.message : String(error)}`);
      lastCrmWarningAt = now;
    }
  }

  let sessionIds = [];
  if (config.sessionId) {
    sessionIds = [config.sessionId];
  } else {
    const sessionPayload = await client.callTool('query', { entity: 'session', limit: 100 });
    sessionIds = sessionsFrom(sessionPayload).map(sessionIdOf).filter(Boolean);
  }

  if (!sessionIds.length) {
    throw new Error('Nenhuma sessão WhatsApp foi encontrada no Kaption. Abra o Kaption/WhatsApp e confirme a ponte local.');
  }

  const totals = { sessions: sessionIds.length, conversations: 0, scanned: 0, ingested: 0, skipped: 0 };

  for (const sessionId of sessionIds) {
    const conversationPayload = await client.callTool('query', {
      entity: 'conversations',
      limit: config.maxConversations,
      exclude_archived: true,
      target_session: sessionId,
    });
    const conversations = conversationsFrom(conversationPayload);
    totals.conversations += conversations.length;

    for (const conversation of conversations) {
      const result = await syncConversation({ client, sessionId, conversation, state, config, crmIndex });
      totals.scanned += result.scanned;
      totals.ingested += result.ingested;
      totals.skipped += result.skipped;
    }
  }

  state.last_pass_at = new Date().toISOString();
  await saveState(config.cursorFile, state);
  return totals;
}

export function buildConfig(env = process.env) {
  const ingestUrl = String(env.OG_WHATSAPP_INGEST_URL || DEFAULT_INGEST_URL).trim();
  const apiKey = String(env.OG_WHATSAPP_INGEST_API_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const crmStateUrl = String(env.OG_WHATSAPP_CRM_STATE_URL || 'http://127.0.0.1:4321/api/state').trim();
  if (!/^https:\/\//i.test(ingestUrl)) throw new Error('OG_WHATSAPP_INGEST_URL deve usar HTTPS.');
  if (!apiKey) throw new Error('Defina OG_WHATSAPP_INGEST_API_KEY (ou SUPABASE_SERVICE_ROLE_KEY) somente no ambiente local.');

  let parsedCrmUrl;
  try { parsedCrmUrl = new URL(crmStateUrl); } catch { throw new Error('OG_WHATSAPP_CRM_STATE_URL inválida.'); }
  const loopback = ['127.0.0.1', 'localhost', '::1'].includes(parsedCrmUrl.hostname);
  if (parsedCrmUrl.protocol !== 'https:' && !(parsedCrmUrl.protocol === 'http:' && loopback)) {
    throw new Error('OG_WHATSAPP_CRM_STATE_URL remota deve usar HTTPS.');
  }

  return {
    ingestUrl,
    apiKey,
    crmLookup: envBool(env, 'OG_WHATSAPP_CRM_LOOKUP', true),
    crmStateUrl,
    crmAccessToken: String(env.OG_WHATSAPP_CRM_ACCESS_TOKEN || env.OG_LOCAL_ACCESS_TOKEN || env.OG_ACCESS_TOKEN || '').trim(),
    pollMs: envInt(env, 'OG_WHATSAPP_POLL_MS', 30000, 10000, 3600000),
    lookbackMinutes: envInt(env, 'OG_WHATSAPP_LOOKBACK_MINUTES', 30, 1, 1440),
    maxConversations: envInt(env, 'OG_WHATSAPP_MAX_CONVERSATIONS', 500, 1, 5000),
    messageLimit: envInt(env, 'OG_WHATSAPP_MESSAGE_LIMIT', 500, 1, 5000),
    cursorFile: path.resolve(String(env.OG_WHATSAPP_CURSOR_FILE || DEFAULT_CURSOR_FILE)),
    includeGroups: envBool(env, 'OG_WHATSAPP_INCLUDE_GROUPS', false),
    once: envBool(env, 'OG_WHATSAPP_ONCE', false) || process.argv.includes('--once'),
    sessionId: String(env.OG_WHATSAPP_SESSION_ID || '').trim() || null,
  };
}

async function main() {
  const config = buildConfig();
  const state = await loadState(config.cursorFile, config.lookbackMinutes);
  const client = new McpStdioClient();

  const stop = () => {
    client.close();
    process.exit(0);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);

  await client.start();
  console.log(`[wa-bridge] Kaption conectado. Poll=${config.pollMs}ms grupos=${config.includeGroups ? 'on' : 'off'}`);

  do {
    try {
      const totals = await runPass(client, state, config);
      console.log(
        `[wa-bridge] ${new Date().toISOString()} sessões=${totals.sessions} conversas=${totals.conversations} novas=${totals.ingested} examinadas=${totals.scanned}`
      );
    } catch (error) {
      console.error(`[wa-bridge] falha no ciclo: ${error instanceof Error ? error.message : String(error)}`);
      if (config.once) throw error;
    }

    if (config.once) break;
    await new Promise((resolve) => setTimeout(resolve, config.pollMs));
  } while (true);

  client.close();
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entry && import.meta.url === entry) {
  main().catch((error) => {
    console.error(`[wa-bridge] fatal: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
