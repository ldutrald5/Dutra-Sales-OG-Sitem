import assert from 'node:assert/strict';
import authState from '../apps/sistema-og/services/auth-state-service.js';

assert.equal(authState.getSnapshot().mode, 'legacy');
const seen = [];
const unsubscribe = authState.subscribe(value => seen.push(value));
const legacy = await authState.initialize({ pilot: { bootstrap: async () => ({ mode: 'legacy', reason: 'feature_disabled', context: null }) }, storage: {} });
assert.equal(legacy.reason, 'feature_disabled');

const pilot = await authState.initialize({ pilot: { bootstrap: async () => ({
  mode: 'pilot', reason: 'ready', client: { secret: 'must-not-leak' },
  context: { authenticated: true, user: { id: 'U1', email: 'u@test' }, profile: { id: 'U1' }, memberships: [{ organizationId: 'O1', role: 'owner', status: 'active' }], activeOrganizationId: 'O1' }
}) }, storage: {} });
assert.equal(pilot.mode, 'pilot');
assert.equal(pilot.context.activeOrganizationId, 'O1');
assert.equal('client' in pilot, false, 'Snapshot público não deve expor cliente Supabase');
assert.equal(Object.isFrozen(pilot), true);
assert.equal(Object.isFrozen(pilot.context.memberships), true);

const failed = await authState.initialize({ pilot: { bootstrap: async () => { throw new Error('network'); } }, storage: {} });
assert.equal(failed.mode, 'legacy');
assert.equal(failed.reason, 'bootstrap_error');
unsubscribe();
const count = seen.length;
await authState.initialize({ pilot: { bootstrap: async () => ({ mode: 'legacy', reason: 'after_unsubscribe', context: null }) }, storage: {} });
assert.equal(seen.length, count);

console.log('Auth state service test: PASS');
