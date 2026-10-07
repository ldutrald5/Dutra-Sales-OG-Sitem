'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const COOKIE = '__Host-og_session';
const DAYS30 = 30 * 86400;
function equal(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
function createAccessSessions({ dataDir, secret, pin, now = Date.now }) {
  if (String(secret).length < 16 || String(pin).length < 6) throw new Error('Sessão persistente exige chave e PIN server-side válidos.');
  const file = path.join(dataDir, 'access-sessions.json');
  const key = crypto.createHash('sha256').update('dutra-access-session-v1\0' + secret).digest();
  const attempts = new Map();
  const digest = id => crypto.createHash('sha256').update(id).digest('hex');
  const sign = id => crypto.createHmac('sha256', key).update(id).digest('base64url');
  function read() {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  }
  function write(sessions) {
    for (const [id, expiry] of Object.entries(sessions)) if (expiry <= now()) delete sessions[id];
    const temp = file + '.tmp';
    fs.writeFileSync(temp, JSON.stringify(sessions), { mode: 0o600 });
    fs.renameSync(temp, file);
  }
  function token(req) {
    const raw = String(req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || '';
    const [id, mac, extra] = raw.split('.');
    if (extra || !/^[A-Za-z0-9_-]{43}$/.test(id || '') || !equal(mac || '', sign(id))) return null;
    return id;
  }
  function authorized(req) {
    const id = token(req);
    try { return Boolean(id && read()[digest(id)] > now()); }
    catch { return false; } // Fail closed if the session file cannot be read.
  }
  function sameOrigin(req) {
    // Cookie-authenticated writes must originate in the same HTTPS application.
    return req.headers.origin === 'https://' + req.headers.host
      || (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '')
        && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
        && req.headers.origin === 'http://' + req.headers.host);
  }
  function allowLogin(req) {
    const ip = req.socket.remoteAddress || 'unknown';
    const times = (attempts.get(ip) || []).filter(t => now() - t < 60000);
    if (times.length >= 8) return false;
    times.push(now()); attempts.set(ip, times);
    if (attempts.size > 1024) for (const [address, ts] of attempts) if (now() - ts.at(-1) >= 60000) attempts.delete(address);
    return true;
  }
  function issue(credential, remember = false) {
    if (!equal(credential, pin)) return null;
    const id = crypto.randomBytes(32).toString('base64url');
    const sessions = read();
    sessions[digest(id)] = now() + (remember ? DAYS30 : 86400) * 1000;
    write(sessions);
    return `${COOKIE}=${id}.${sign(id)}; Path=/; HttpOnly; Secure; SameSite=Strict${remember ? '; Max-Age=' + DAYS30 : ''}`;
  }
  function revoke(req) {
    const id = token(req);
    if (id) { const sessions = read(); delete sessions[digest(id)]; write(sessions); }
    return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
  }
  return { authorized, sameOrigin, allowLogin, issue, revoke };
}
module.exports = { createAccessSessions };
