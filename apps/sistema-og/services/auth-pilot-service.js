(function attachAuthPilot(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_AUTH_PILOT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAuthPilot() {
  'use strict';

  const FEATURE_FLAG = 'og_auth_pilot';
  const CONFIG_KEY = 'og_supabase_public_config';

  function clean(value) { return String(value ?? '').trim(); }
  function safeSessionStorage(storage) {
    try { return storage || null; } catch { return null; }
  }
  function readFlag(storage) {
    const target = safeSessionStorage(storage);
    return target?.getItem(FEATURE_FLAG) === 'enabled';
  }
  function readPublicConfig(storage) {
    const target = safeSessionStorage(storage);
    if (!target) return null;
    try {
      const parsed = JSON.parse(target.getItem(CONFIG_KEY) || 'null');
      const url = clean(parsed?.url);
      const publishableKey = clean(parsed?.publishableKey || parsed?.anonKey);
      if (!/^https:\/\/[^/]+\.supabase\.co$/i.test(url) || !publishableKey) return null;
      return { url, publishableKey };
    } catch {
      return null;
    }
  }
  function normalizeMembership(row) {
    if (!row) return null;
    const organizationId = clean(row.organization_id || row.organizationId);
    const role = clean(row.role);
    const status = clean(row.status);
    if (!organizationId || !['owner', 'admin', 'member'].includes(role) || status !== 'active') return null;
    return { organizationId, role, status };
  }
  async function resolveContext(client) {
    if (!client?.auth?.getUser || !client?.from) throw new Error('Cliente Supabase inválido');
    const { data: userData, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    const user = userData?.user;
    if (!user?.id) return { authenticated: false, user: null, profile: null, memberships: [], activeOrganizationId: null };

    const [{ data: profile, error: profileError }, { data: rows, error: membershipError }] = await Promise.all([
      client.from('profiles').select('id,display_name').eq('id', user.id).maybeSingle(),
      client.from('organization_members').select('organization_id,role,status').eq('user_id', user.id).eq('status', 'active')
    ]);
    if (profileError) throw profileError;
    if (membershipError) throw membershipError;
    const memberships = (Array.isArray(rows) ? rows : []).map(normalizeMembership).filter(Boolean);
    const uniqueOrganizationIds = [...new Set(memberships.map(item => item.organizationId))];
    return {
      authenticated: true,
      user: { id: user.id, email: clean(user.email) || null },
      profile: profile || null,
      memberships,
      activeOrganizationId: uniqueOrganizationIds.length === 1 ? uniqueOrganizationIds[0] : null
    };
  }
  async function bootstrap(options = {}) {
    const storage = safeSessionStorage(options.storage);
    if (!readFlag(storage)) return { mode: 'legacy', reason: 'feature_disabled', context: null };
    const config = readPublicConfig(storage);
    if (!config) return { mode: 'legacy', reason: 'config_missing', context: null };
    if (typeof options.createClient !== 'function') return { mode: 'legacy', reason: 'client_factory_missing', context: null };
    const client = options.createClient(config.url, config.publishableKey);
    const context = await resolveContext(client);
    if (!context.authenticated) return { mode: 'auth_required', reason: 'no_user', client, context };
    if (!context.memberships.length) return { mode: 'blocked', reason: 'membership_missing', client, context };
    if (!context.activeOrganizationId) return { mode: 'blocked', reason: 'organization_selection_required', client, context };
    return { mode: 'pilot', reason: 'ready', client, context };
  }

  return { FEATURE_FLAG, CONFIG_KEY, readFlag, readPublicConfig, normalizeMembership, resolveContext, bootstrap };
}));
