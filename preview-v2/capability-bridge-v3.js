(() => {
  'use strict';

  // One stable browser contract for optional DUTRA agent capabilities.
  // External engines remain isolated; the CRM keeps working without them.
  const adapters = new Map();
  const clean = v => String(v ?? '').trim();

  function register(name, adapter) {
    name = clean(name);
    if (!name) throw new Error('Capability name is required.');
    if (!adapter || typeof adapter.execute !== 'function') throw new Error('Adapter must expose execute(payload, context).');
    adapters.set(name, { ...adapter, name });
    window.dispatchEvent(new CustomEvent('dutra:capability-registered', { detail: { name } }));
    return api;
  }

  function unregister(name) { adapters.delete(clean(name)); return api; }
  function has(name) { return adapters.has(clean(name)); }

  function status(name) {
    const item = adapters.get(clean(name));
    if (!item) return { name: clean(name), available: false, mode: 'UNAVAILABLE' };
    let health = {};
    try { health = typeof item.status === 'function' ? (item.status() || {}) : {}; } catch (error) { health = { error: error.message }; }
    return { name: item.name, available: true, mode: item.mode || 'ADAPTER', ...health };
  }

  function list() {
    return ['quote','prospect-research','call-intelligence','content-studio'].map(status);
  }

  async function execute(name, payload = {}, context = {}) {
    const item = adapters.get(clean(name));
    if (!item) {
      const error = new Error('Capability unavailable: ' + name);
      error.code = 'CAPABILITY_UNAVAILABLE';
      throw error;
    }
    const startedAt = new Date().toISOString();
    const result = await item.execute(payload, { ...context, startedAt });
    return {
      capability: item.name,
      engine: item.engine || 'dutra-core',
      startedAt,
      completedAt: new Date().toISOString(),
      result
    };
  }

  function installCoreAdapters() {
    register('quote', {
      engine: 'DUTRA_QUOTE_HANDOFF',
      mode: 'CORE',
      status: () => ({ ready: Boolean(globalThis.DUTRA_QUOTE_HANDOFF?.launch) }),
      execute: ({ lead, contact, options } = {}) => {
        if (!globalThis.DUTRA_QUOTE_HANDOFF?.launch) throw new Error('Cotação oficial ainda não carregou.');
        if (!lead) throw new Error('Cliente obrigatório para iniciar cotação.');
        return globalThis.DUTRA_QUOTE_HANDOFF.launch(lead, contact || {}, options || { target: '_blank' });
      }
    });

    register('prospect-research', {
      engine: 'DUTRA_PROSPECT_RESEARCH',
      mode: 'CORE_OR_OPTIONAL_WORKER',
      status: () => ({ ready: Boolean(globalThis.DUTRA_PROSPECT_RESEARCH?.research || globalThis.OG_PROSPECTING_RESEARCH?.research) }),
      execute: async payload => {
        const provider = globalThis.DUTRA_PROSPECT_RESEARCH || globalThis.OG_PROSPECTING_RESEARCH;
        if (!provider?.research) throw new Error('Provider de pesquisa não configurado. O CRM permanece disponível.');
        return provider.research(payload);
      }
    });

    register('call-intelligence', {
      engine: 'DUTRA_CALL_INTELLIGENCE',
      mode: 'CORE_OR_OPTIONAL_TRANSCRIBER',
      status: () => ({ ready: Boolean(globalThis.DUTRA_CALL_INTELLIGENCE?.analyze || globalThis.OG_CALL_AI?.analyze) }),
      execute: async payload => {
        const provider = globalThis.DUTRA_CALL_INTELLIGENCE || globalThis.OG_CALL_AI;
        if (!provider?.analyze) throw new Error('Call Intelligence não configurada neste runtime.');
        return provider.analyze(payload);
      }
    });

    register('content-studio', {
      engine: 'DUTRA_CONTENT_STUDIO',
      mode: 'OPTIONAL_MEDIA_WORKER',
      status: () => ({ ready: Boolean(globalThis.DUTRA_CONTENT_STUDIO?.create) }),
      execute: async payload => {
        if (!globalThis.DUTRA_CONTENT_STUDIO?.create) throw new Error('Worker de mídia não configurado. Nenhuma função do CRM foi afetada.');
        return globalThis.DUTRA_CONTENT_STUDIO.create(payload);
      }
    });
  }

  const api = Object.freeze({ register, unregister, has, status, list, execute, installCoreAdapters });
  globalThis.DUTRA_CAPABILITIES = api;
  installCoreAdapters();
})();
