import assert from 'node:assert/strict';
import authPilot from '../apps/sistema-og/services/auth-pilot-service.js';

function storage(seed = {}) {
  const map = new Map(Object.entries(seed));
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)) };
}
const disabled = await authPilot.bootstrap({ storage: storage() });
assert.deepEqual(disabled, { mode: 'legacy', reason: 'feature_disabled', context: null });

const enabledNoConfig = await authPilot.bootstrap({ storage: storage({ [authPilot.FEATURE_FLAG]: 'enabled' }) });
assert.equal(enabledNoConfig.mode, 'legacy');
assert.equal(enabledNoConfig.reason, 'config_missing');

const configured = storage({
  [authPilot.FEATURE_FLAG]: 'enabled',
  [authPilot.CONFIG_KEY]: JSON.stringify({ url: 'https://example.supabase.co', publishableKey: 'public-test-key' })
});
let captured = null;
const makeClient = (url, key) => {
  captured = { url, key };
  return {
    auth: { getUser: async () => ({ data: { user: { id: 'USER-1', email: 'lucas@example.test' } }, error: null }) },
    from(table) {
      const query = {
        select() { return query; },
        eq() { return query; },
        maybeSingle: async () => ({ data: table === 'profiles' ? { id: 'USER-1', display_name: 'Lucas' } : null, error: null }),
        then(resolve) {
          return Promise.resolve({ data: table === 'organization_members' ? [{ organization_id: 'ORG-1', role: 'owner', status: 'active' }] : [], error: null }).then(resolve);
        }
      };
      return query;
    }
  };
};
const ready = await authPilot.bootstrap({ storage: configured, createClient: makeClient });
assert.deepEqual(captured, { url: 'https://example.supabase.co', key: 'public-test-key' });
assert.equal(ready.mode, 'pilot');
assert.equal(ready.context.activeOrganizationId, 'ORG-1');
assert.equal(ready.context.memberships[0].role, 'owner');

const noMembershipClient = makeClient('https://example.supabase.co', 'public-test-key');
noMembershipClient.from = table => {
  const query = { select(){ return query; }, eq(){ return query; }, maybeSingle: async () => ({ data: table === 'profiles' ? { id: 'USER-1' } : null, error: null }), then(resolve){ return Promise.resolve({ data: [], error: null }).then(resolve); } };
  return query;
};
const blocked = await authPilot.bootstrap({ storage: configured, createClient: () => noMembershipClient });
assert.equal(blocked.mode, 'blocked');
assert.equal(blocked.reason, 'membership_missing');

const multiOrgClient = makeClient('https://example.supabase.co', 'public-test-key');
multiOrgClient.from = table => {
  const query = {
    select(){ return query; }, eq(){ return query; },
    maybeSingle: async () => ({ data: table === 'profiles' ? { id: 'USER-1' } : null, error: null }),
    then(resolve){ return Promise.resolve({ data: table === 'organization_members' ? [
      { organization_id: 'ORG-1', role: 'owner', status: 'active' },
      { organization_id: 'ORG-2', role: 'member', status: 'active' }
    ] : [], error: null }).then(resolve); }
  };
  return query;
};
const multiOrg = await authPilot.bootstrap({ storage: configured, createClient: () => multiOrgClient });
assert.equal(multiOrg.mode, 'blocked');
assert.equal(multiOrg.reason, 'organization_selection_required');


const signedOutClient = { auth: { getUser: async () => ({ data: { user: null }, error: null }) }, from(){ throw new Error('não deve consultar tabelas sem usuário'); } };
const signedOut = await authPilot.bootstrap({ storage: configured, createClient: () => signedOutClient });
assert.equal(signedOut.mode, 'auth_required');

assert.equal(authPilot.readPublicConfig(storage({ [authPilot.CONFIG_KEY]: JSON.stringify({ url: 'http://inseguro.test', publishableKey: 'x' }) })), null);
assert.equal(authPilot.normalizeMembership({ organization_id: 'ORG-X', role: 'owner', status: 'suspended' }), null);

console.log('Auth pilot service test: PASS');
