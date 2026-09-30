import assert from 'node:assert/strict';
import {
  buildConfig,
  extractDeterministicInsight,
  normalizeToolResult,
  toIsoTimestamp,
} from './whatsapp-kaption-bridge.mjs';

const fleet = extractDeterministicInsight('Temos 85 caminhões na frota', 'inbound');
assert.equal(fleet.facts.fleet_size.value, 85);
assert.equal(fleet.facts.fleet_size.confirmed, true);
assert.equal(fleet.metadata.source_mode, 'deterministic_explicit');

const profile = extractDeterministicInsight('Aqui usamos rodotrem de 9 eixos', 'inbound');
assert.equal(profile.facts.vehicle_profile_code.value, 'rodotrem_9_eixos');
assert.equal(profile.facts.vehicle_profile_code.confirmed, true);

const objection = extractDeterministicInsight('Ficou muito caro para nós', 'inbound');
assert.deepEqual(objection.objections, ['preço/investimento']);

const callback = extractDeterministicInsight('Pode me ligar depois', 'inbound');
assert.match(callback.next_action, /Retornar contato/);

const proposal = extractDeterministicInsight('Me envie a proposta por favor', 'inbound');
assert.match(proposal.next_action, /proposta/);

assert.equal(extractDeterministicInsight('Vocês têm 85 caminhões?', 'outbound'), null);
assert.equal(extractDeterministicInsight('Se eu tivesse 85 caminhões seria interessante', 'inbound'), null);
assert.equal(extractDeterministicInsight('rodotrem', 'inbound'), null);

assert.equal(toIsoTimestamp(1790000000), new Date(1790000000 * 1000).toISOString());
assert.deepEqual(
  normalizeToolResult({ structuredContent: { result: { sessions: [{ id: 's1' }] } } }),
  { sessions: [{ id: 's1' }] },
);
assert.deepEqual(
  normalizeToolResult({ content: [{ type: 'text', text: '{"result":{"ok":true}}' }] }),
  { ok: true },
);

assert.throws(
  () => buildConfig({ OG_WHATSAPP_INGEST_URL: 'http://localhost', OG_WHATSAPP_INGEST_API_KEY: 'x' }),
  /HTTPS/,
);
assert.throws(
  () => buildConfig({ OG_WHATSAPP_INGEST_URL: 'https://example.test' }),
  /OG_WHATSAPP_INGEST_API_KEY/,
);

const config = buildConfig({
  OG_WHATSAPP_INGEST_URL: 'https://example.test/functions/v1/whatsapp-ingest',
  OG_WHATSAPP_INGEST_API_KEY: 'secret-test',
  OG_WHATSAPP_POLL_MS: '1000',
  OG_WHATSAPP_INCLUDE_GROUPS: 'true',
});
assert.equal(config.pollMs, 10000);
assert.equal(config.includeGroups, true);

console.log('WhatsApp Kaption bridge deterministic tests: PASS');
