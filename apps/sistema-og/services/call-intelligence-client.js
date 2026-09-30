(function attachCallIntelligenceClient(root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.OG_CALL_INTELLIGENCE_CLIENT = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createCallIntelligenceClient(root) {
  'use strict';
  const PREFIX = '/api/call-intelligence';
  let fetcher = (url, options) => root.fetch(url, options);

  function configure(options = {}) {
    if (typeof options.fetcher === 'function') fetcher = options.fetcher;
    return api;
  }

  async function request(path, options = {}) {
    const response = await fetcher(PREFIX + path, {
      method: options.method || 'GET',
      headers: Object.assign({ 'Content-Type':'application/json' }, options.headers || {}),
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || ('Call Intelligence HTTP ' + response.status));
    return payload;
  }

  async function uploadSigned(signedUrl, blob) {
    if (!signedUrl || !blob) throw new Error('Upload de áudio incompleto.');
    const form = new FormData();
    form.append('cacheControl', '3600');
    form.append('', blob, 'call-recording.' + (blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm'));
    const response = await root.fetch(signedUrl, {
      method:'PUT',
      headers:{ 'x-upsert':'true' },
      body:form
    });
    if (!response.ok) {
      const message = await response.text().catch(() => '');
      throw new Error(message || ('Storage upload HTTP ' + response.status));
    }
    return true;
  }

  const api = {
    configure,
    health: () => request('/health'),
    initRecording: body => request('/recordings/init', { method:'POST', body }),
    uploadSigned,
    completeRecording: body => request('/recordings/complete', { method:'POST', body }),
    status: callSessionId => request('/recordings/' + encodeURIComponent(callSessionId) + '/status'),
    transcribe: body => request('/recordings/transcribe', { method:'POST', body }),
    manualTranscript: body => request('/recordings/manual-transcript', { method:'POST', body }),
    linkResult: body => request('/recordings/link-result', { method:'POST', body }),
    dashboard: (days = 30) => request('/dashboard?days=' + encodeURIComponent(days))
  };
  return api;
}));
