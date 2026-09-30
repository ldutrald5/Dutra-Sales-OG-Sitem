(function attachSalesExecutionClient(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_SALES_EXECUTION_CLIENT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createSalesExecutionClient(root) {
  'use strict';
  const PREFIX = '/api/sales-execution';
  let fetcher = (url, options) => root.fetch(url, options);

  function configure(options = {}) {
    if (typeof options.fetcher === 'function') fetcher = options.fetcher;
    return api;
  }

  async function request(path, options = {}) {
    const response = await fetcher(PREFIX + path, {
      method: options.method || 'GET',
      headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || ('Sales Execution HTTP ' + response.status));
    return payload;
  }

  const api = {
    configure,
    health: () => request('/health'),
    lists: () => request('/lists'),
    startSession: body => request('/sessions', { method: 'POST', body }),
    queue: sessionId => request('/sessions/' + encodeURIComponent(sessionId) + '/queue'),
    accountContext: companyId => request('/accounts/' + encodeURIComponent(companyId) + '/context'),
    recordCallResult: body => request('/commands/record-call-result', { method: 'POST', body })
  };
  return api;
}));
