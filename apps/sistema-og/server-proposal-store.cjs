const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SCHEMA_VERSION = 1;
const TOKEN_RE = /^[A-Za-z0-9_-]{24,160}$/;
const SESSION_RE = /^[A-Za-z0-9_-]{8,160}$/;
const OPEN_TYPES = new Set(['proposal.opened', 'proposal.reopened']);

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function iso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) throw new Error('Data inválida');
  return date.toISOString();
}

function emptyStore() {
  return { schemaVersion: SCHEMA_VERSION, publications: [] };
}

function normalizeStore(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyStore();
  const publications = Array.isArray(value.publications) ? value.publications.filter(item => item && typeof item === 'object') : [];
  return { schemaVersion: SCHEMA_VERSION, publications };
}

function readStore(file) {
  try {
    return normalizeStore(JSON.parse(fs.readFileSync(file, 'utf8')));
  } catch {
    return emptyStore();
  }
}

function writeStore(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const next = normalizeStore(value);
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(next, null, 2), 'utf8');
  fs.renameSync(temporary, file);
  return next;
}

function hashToken(token) {
  const clean = String(token || '').trim();
  if (!TOKEN_RE.test(clean)) throw new Error('Token público inválido');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function safePublication(publication) {
  if (!publication) return null;
  return clone({
    id: publication.id,
    clientId: publication.clientId,
    quoteId: publication.quoteId,
    status: publication.status,
    publishedAt: publication.publishedAt,
    expiresAt: publication.expiresAt,
    revokedAt: publication.revokedAt || null,
    snapshot: publication.snapshot,
    eventCount: Array.isArray(publication.events) ? publication.events.length : 0
  });
}

function publish(file, input = {}, options = {}) {
  const proposalId = String(input.proposalId || '').trim();
  const clientId = String(input.clientId || '').trim();
  const quoteId = String(input.quoteId || '').trim();
  if (!proposalId || !clientId || !quoteId || !input.snapshot || typeof input.snapshot !== 'object') {
    throw new Error('Publicação exige proposalId, clientId, quoteId e snapshot');
  }
  const token = String(options.token || generateToken()).trim();
  const tokenHash = hashToken(token);
  const now = new Date(options.now || Date.now());
  if (Number.isNaN(now.getTime())) throw new Error('Data inválida');
  const ttlDays = Math.min(365, Math.max(1, Number(options.ttlDays) || 90));
  const expiresAt = new Date(now.getTime() + ttlDays * 86400000).toISOString();
  const store = readStore(file);
  const index = store.publications.findIndex(item => String(item.id) === proposalId);
  const previous = index >= 0 ? store.publications[index] : null;
  const publication = {
    id: proposalId,
    clientId,
    quoteId,
    status: 'active',
    tokenHash,
    publishedAt: now.toISOString(),
    expiresAt,
    revokedAt: null,
    rotatedAt: previous ? now.toISOString() : null,
    snapshot: clone(input.snapshot),
    events: Array.isArray(previous?.events) ? previous.events.slice(-1000) : []
  };
  if (index >= 0) store.publications.splice(index, 1, publication);
  else store.publications.unshift(publication);
  writeStore(file, store);
  return { token, publication: safePublication(publication) };
}

function active(publication, now = Date.now()) {
  if (!publication || publication.status !== 'active' || publication.revokedAt) return false;
  const expires = Date.parse(publication.expiresAt || '');
  return Number.isFinite(expires) && expires > new Date(now).getTime();
}

function findByToken(file, token, options = {}) {
  let hash;
  try { hash = hashToken(token); } catch { return null; }
  const store = readStore(file);
  const publication = store.publications.find(item => item.tokenHash === hash) || null;
  if (!active(publication, options.now)) return null;
  return safePublication(publication);
}

function findMutableByToken(store, token, now) {
  let hash;
  try { hash = hashToken(token); } catch { return null; }
  const publication = store.publications.find(item => item.tokenHash === hash) || null;
  if (!active(publication, now)) return null;
  return publication;
}

function normalizeSessionId(value) {
  const sessionId = String(value || '').trim();
  if (!SESSION_RE.test(sessionId)) throw new Error('Sessão pública inválida');
  return sessionId;
}

function recordEngagement(file, token, event = {}, options = {}) {
  const type = String(event.type || '').trim();
  if (!['open', 'contact_clicked'].includes(type)) throw new Error('Evento público não permitido');
  const sessionId = normalizeSessionId(event.sessionId);
  const now = iso(options.now);
  const store = readStore(file);
  const publication = findMutableByToken(store, token, now);
  if (!publication) return null;
  publication.events = Array.isArray(publication.events) ? publication.events : [];

  if (type === 'open') {
    const duplicate = publication.events.some(item => OPEN_TYPES.has(item.type) && item.metadata?.sessionId === sessionId);
    if (duplicate) return { duplicate: true, event: null, publication: safePublication(publication) };
  } else {
    const duplicate = publication.events.some(item => item.type === 'proposal.contact_clicked' && item.metadata?.sessionId === sessionId);
    if (duplicate) return { duplicate: true, event: null, publication: safePublication(publication) };
  }

  const canonicalType = type === 'contact_clicked'
    ? 'proposal.contact_clicked'
    : (publication.events.some(item => OPEN_TYPES.has(item.type)) ? 'proposal.reopened' : 'proposal.opened');

  const recorded = {
    id: String(options.id || `PEVT-${crypto.randomUUID()}`),
    proposalId: publication.id,
    clientId: publication.clientId,
    quoteId: publication.quoteId,
    type: canonicalType,
    at: now,
    source: 'trusted_server',
    metadata: { sessionId }
  };
  publication.events.unshift(recorded);
  if (publication.events.length > 1000) publication.events.length = 1000;
  writeStore(file, store);
  return { duplicate: false, event: clone(recorded), publication: safePublication(publication) };
}

function listEvents(file, options = {}) {
  const store = readStore(file);
  const sinceMs = options.since ? Date.parse(options.since) : 0;
  const limit = Math.min(1000, Math.max(1, Number(options.limit) || 500));
  return store.publications
    .flatMap(publication => (Array.isArray(publication.events) ? publication.events : []))
    .filter(event => !sinceMs || (Date.parse(event.at || '') || 0) > sinceMs)
    .sort((a, b) => (Date.parse(b.at || '') || 0) - (Date.parse(a.at || '') || 0))
    .slice(0, limit)
    .map(event => ({
      id: event.id,
      proposalId: event.proposalId,
      clientId: event.clientId,
      quoteId: event.quoteId || null,
      type: event.type,
      at: event.at,
      source: 'trusted_server'
    }));
}

function revoke(file, proposalId, options = {}) {
  const id = String(proposalId || '').trim();
  if (!id) throw new Error('proposalId é obrigatório');
  const store = readStore(file);
  const publication = store.publications.find(item => String(item.id) === id);
  if (!publication) return null;
  const at = iso(options.now);
  publication.status = 'revoked';
  publication.revokedAt = at;
  writeStore(file, store);
  return safePublication(publication);
}

module.exports = {
  SCHEMA_VERSION,
  TOKEN_RE,
  emptyStore,
  readStore,
  writeStore,
  hashToken,
  publish,
  findByToken,
  recordEngagement,
  listEvents,
  revoke
};
