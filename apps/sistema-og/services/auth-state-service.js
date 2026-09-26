(function attachAuthState(globalScope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  globalScope.OG_AUTH_STATE = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createAuthState() {
  'use strict';

  let snapshot = Object.freeze({ mode: 'legacy', reason: 'not_started', context: null });
  const listeners = new Set();

  function publicSnapshot(result) {
    const context = result?.context;
    return Object.freeze({
      mode: String(result?.mode || 'legacy'),
      reason: String(result?.reason || 'unknown'),
      context: context ? Object.freeze({
        authenticated: Boolean(context.authenticated),
        user: context.user ? Object.freeze({ id: String(context.user.id), email: context.user.email || null }) : null,
        profile: context.profile ? Object.freeze({ ...context.profile }) : null,
        memberships: Object.freeze((context.memberships || []).map(item => Object.freeze({ ...item }))),
        activeOrganizationId: context.activeOrganizationId || null
      }) : null
    });
  }

  function publish(result) {
    snapshot = publicSnapshot(result);
    listeners.forEach(listener => {
      try { listener(snapshot); } catch (error) { console.error('Auth state listener failed', error); }
    });
    return snapshot;
  }

  function getSnapshot() { return snapshot; }

  function subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('listener deve ser função');
    listeners.add(listener);
    listener(snapshot);
    return () => listeners.delete(listener);
  }

  async function initialize(options = {}) {
    const pilot = options.pilot || globalScope.OG_AUTH_PILOT;
    if (!pilot?.bootstrap) return publish({ mode: 'legacy', reason: 'pilot_unavailable', context: null });
    try {
      return publish(await pilot.bootstrap({
        storage: options.storage || globalScope.sessionStorage,
        createClient: options.createClient
      }));
    } catch (error) {
      console.warn('Auth pilot bootstrap failed; legacy mode preserved.', error);
      return publish({ mode: 'legacy', reason: 'bootstrap_error', context: null });
    }
  }

  return { initialize, getSnapshot, subscribe };
}));
