import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const gateway = require('../apps/sistema-og/server-call-intelligence-gateway.cjs');

assert.equal(gateway.cfg({}).enabled, false);
assert.equal(gateway.cfg({
  OG_CALL_INTELLIGENCE_EDGE_URL:'https://example.supabase.co/functions/v1/call-intelligence',
  OG_CALL_INTELLIGENCE_EDGE_TOKEN:'x'.repeat(48)
}).enabled, true);

const disabled = await gateway.health({});
assert.equal(disabled.status, 503);
assert.equal(disabled.configured, false);

const originalFetch = global.fetch;
let observed = null;
global.fetch = async (url, options) => {
  observed = { url:String(url), options };
  return new Response(JSON.stringify({ ok:true, data:{ ok:true, providerReady:false } }), {
    status:200,
    headers:{ 'content-type':'application/json' }
  });
};

const env = {
  OG_CALL_INTELLIGENCE_EDGE_URL:'https://example.supabase.co/functions/v1/call-intelligence',
  OG_CALL_INTELLIGENCE_EDGE_TOKEN:'x'.repeat(48)
};
const health = await gateway.health(env);
assert.equal(health.status, 200);
assert.equal(health.data.ok, true);
assert.equal(observed.options.headers['x-og-call-intelligence-token'], 'x'.repeat(48));
assert.match(observed.options.body, /"action":"health"/);

assert.throws(
  () => gateway.status('../unsafe', env),
  /callSessionId inválido/
);

global.fetch = originalFetch;
console.log('call-intelligence-gateway: auth boundary + disabled mode ok');
