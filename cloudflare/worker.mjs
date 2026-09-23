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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return json({ ok: true, storage: 'cloudflare-kv' });

    if (url.pathname === '/api/state') {
      if (!isAuthorized(request, env)) return json({ error: 'Código de acesso necessário' }, 401);

      if (request.method === 'GET') {
        if (!env.OG_DATA) return json({ revision: 0, updatedAt: null, leads: [], history: [], temporary: true });
        const state = await env.OG_DATA.get('shared-state', 'json');
        return json(state || { revision: 0, updatedAt: null, leads: [], history: [] });
      }

      if (request.method === 'PUT') {
        let body;
        try { body = await request.json(); }
        catch { return json({ error: 'Conteúdo inválido' }, 400); }
        const current = env.OG_DATA ? await env.OG_DATA.get('shared-state', 'json') || { revision: 0 } : { revision: Number(body.revision || 0) };
        const next = {
          revision: Number(current.revision || 0) + 1,
          updatedAt: new Date().toISOString(),
          leads: Array.isArray(body.leads) ? body.leads.slice(0, 10000) : [],
          history: Array.isArray(body.history) ? body.history.slice(0, 5000) : []
        };
        if (env.OG_DATA) await env.OG_DATA.put('shared-state', JSON.stringify(next));
        return json(next);
      }

      return json({ error: 'Método não permitido' }, 405);
    }

    return env.ASSETS.fetch(request);
  }
};
