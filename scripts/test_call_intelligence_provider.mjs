import assert from 'node:assert/strict';
import { providerRequest, ProviderError } from '../supabase/functions/call-intelligence/provider-request.ts';

const form = new FormData();
form.append('model', 'test');
const ok = await providerRequest(form, 'test-secret', 'test-trace', async (_, init) => {
  assert.equal(init.headers['X-Client-Request-Id'], 'test-trace');
  return Response.json({ text: 'Teste autorizado' }, { headers: { 'x-request-id': 'req-test' } });
});
assert.equal(ok.requestId, 'req-test');
assert.equal(ok.result.text, 'Teste autorizado');
await assert.rejects(providerRequest(form, 'test-secret', 'test-trace', async () =>
  new Response('test-secret private transcript', { status: 429, headers: { 'x-request-id': 'req-error' } })), error => {
  assert.ok(error instanceof ProviderError);
  assert.equal(error.code, 'provider_http_429');
  assert.equal(error.requestId, 'req-error');
  assert.doesNotMatch(error.message, /test-secret|private transcript/);
  return true;
});
await assert.rejects(providerRequest(form, 'test-secret', 'test-trace', async () => {
  throw new Error('network leaked test-secret');
}), /provider_network_error/);
await assert.rejects(providerRequest(form, 'test-secret', 'test-trace', async (_, init) =>
  new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('abort')), { once: true })), 5), /provider_timeout/);
await assert.rejects(providerRequest(form, 'test-secret', 'test-trace', async () => new Response('invalid')), /provider_invalid_json/);
console.log('call-intelligence-provider: tracing, timeout and sanitized failures ok');
