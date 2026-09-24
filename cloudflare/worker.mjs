function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

function isAuthorized(request, env) {
  if (env.OG_TEMP_MODE === 'true') return true;
  const header = request.headers.get('authorization') || '';
  return Boolean(env.OG_ACCESS_TOKEN) && header === `Bearer ${env.OG_ACCESS_TOKEN}`;
}

function recordTime(item) { return Date.parse(item?.updatedAt || item?.createdAt || item?.at || 0) || 0; }
function unionById(local = [], remote = []) {
  const map = new Map();
  for (const item of [...remote, ...local]) {
    if (!item?.id) continue;
    const existing = map.get(String(item.id));
    map.set(String(item.id), !existing || recordTime(item) >= recordTime(existing) ? item : existing);
  }
  return [...map.values()];
}
function mergeOperations(local, remote) {
  const next = { ...(remote || {}), ...(local || {}) };
  const keys = new Set([...Object.keys(remote || {}), ...Object.keys(local || {})]);
  for (const key of keys) if (Array.isArray(local?.[key]) || Array.isArray(remote?.[key])) next[key] = unionById(local?.[key] || [], remote?.[key] || []);
  next.updatedAt = new Date().toISOString();
  return next;
}
function mergeState(local, remote) {
  return { leads: unionById(local.leads || [], remote.leads || []), history: unionById(local.history || [], remote.history || []), operations: mergeOperations(local.operations, remote.operations) };
}
async function keepServerBackup(env, current) {
  if (!env.OG_DATA || !current?.updatedAt) return;
  const id = `backup:${current.updatedAt}:${current.revision || 0}`;
  await env.OG_DATA.put(id, JSON.stringify(current), { expirationTtl: 60 * 60 * 24 * 30 });
  const index = await env.OG_DATA.get('backup-index', 'json') || [];
  const next = [{ id, createdAt: current.updatedAt, revision: current.revision || 0, leads: current.leads?.length || 0 }, ...index.filter(item => item.id !== id)].slice(0, 20);
  await env.OG_DATA.put('backup-index', JSON.stringify(next));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return json({ ok: true, storage: env.OG_DATA ? 'cloudflare-kv' : 'temporary-browser-only', persistent: Boolean(env.OG_DATA) });

    if (url.pathname === '/api/backups' && request.method === 'GET') {
      if (!isAuthorized(request, env)) return json({ error: 'Código de acesso necessário' }, 401);
      return json({ persistent: Boolean(env.OG_DATA), backups: env.OG_DATA ? await env.OG_DATA.get('backup-index', 'json') || [] : [] });
    }

    if (url.pathname === '/api/state') {
      if (!isAuthorized(request, env)) return json({ error: 'Código de acesso necessário' }, 401);

      if (request.method === 'GET') {
        if (!env.OG_DATA) return json({ revision: 0, updatedAt: null, leads: [], history: [], operations: null, temporary: true });
        const state = await env.OG_DATA.get('shared-state', 'json');
        return json(state || { revision: 0, updatedAt: null, leads: [], history: [] });
      }

      if (request.method === 'PUT') {
        let body;
        try { body = await request.json(); }
        catch { return json({ error: 'Conteúdo inválido' }, 400); }
        const current = env.OG_DATA ? await env.OG_DATA.get('shared-state', 'json') || { revision: 0 } : { revision: Number(body.revision || 0) };
        const clientRevision = Number(body.revision || 0), serverRevision = Number(current.revision || 0);
        const forceMerge = body.forceMerge === true || url.searchParams.get('merge') === '1';
        if (env.OG_DATA && clientRevision !== serverRevision && !forceMerge) return json({ error: 'revision_conflict', revision: serverRevision, updatedAt: current.updatedAt, leads: current.leads || [], history: current.history || [], operations: current.operations || null }, 409);
        const payload = forceMerge ? mergeState(body, current) : body;
        const next = {
          revision: serverRevision + 1,
          updatedAt: new Date().toISOString(),
          leads: Array.isArray(payload.leads) ? payload.leads.slice(0, 10000) : [],
          history: Array.isArray(payload.history) ? payload.history.slice(0, 5000) : [],
          operations: payload.operations && typeof payload.operations === 'object' ? payload.operations : null
        };
        if (env.OG_DATA) { await keepServerBackup(env, current); await env.OG_DATA.put('shared-state', JSON.stringify(next)); }
        return json(next);
      }

      return json({ error: 'Método não permitido' }, 405);
    }

    return env.ASSETS.fetch(request);
  }
};
