import assert from 'node:assert/strict';
import {
  buildAdminHeaders,
  buildConfig,
  buildNegativePayload,
  buildPositivePayload,
  createRunIdentity,
  isLegacyJwtKey,
} from './whatsapp-e2e-self-test.mjs';

const identity = createRunIdentity(1234567890, 'abcd1234');
assert.match(identity.positiveCompany, /^\[E2E\]/);
assert.match(identity.negativeCompany, /^\[E2E\]/);
assert.notEqual(identity.positiveEvent, identity.negativeEvent);

const positive = buildPositivePayload(identity, 1700000000000);
assert.equal(positive.provider, 'e2e');
assert.equal(positive.message.direction, 'inbound');
assert.equal(positive.insight.facts.fleet_size.value, 3);
assert.equal(positive.insight.facts.fleet_size.confirmed, true);
assert.equal(positive.insight.facts.vehicle_profile_code.value, 'rodotrem_9_eixos');
assert.equal(positive.insight.metadata.e2e, true);
assert.equal(positive.insight.metadata.source_mode, 'deterministic_explicit');

const negative = buildNegativePayload(identity, 'company-test-id', 1700000000000);
assert.equal(negative.company_id, 'company-test-id');
assert.equal(negative.insight.facts.fleet_size.value, 777);
assert.equal(negative.insight.facts.fleet_size.confirmed, false);
assert.equal(negative.insight.facts.vehicle_profile_code.confirmed, false);
assert.equal(negative.insight.metadata.source_mode, 'ai_suggestion');

assert.equal(isLegacyJwtKey('eyJabc'), true);
assert.equal(isLegacyJwtKey('sb_secret_example'), false);

const modernHeaders = buildAdminHeaders('sb_secret_example', { 'Content-Type': 'application/json' });
assert.equal(modernHeaders.apikey, 'sb_secret_example');
assert.equal(modernHeaders.Authorization, undefined);

const legacyHeaders = buildAdminHeaders('eyJlegacy', {});
assert.equal(legacyHeaders.apikey, 'eyJlegacy');
assert.equal(legacyHeaders.Authorization, 'Bearer eyJlegacy');

assert.throws(
  () => buildConfig({
    OG_WHATSAPP_E2E_SUPABASE_URL: 'https://example.test',
  }),
  /OG_WHATSAPP_E2E_API_KEY/,
);

assert.throws(
  () => buildConfig({
    OG_WHATSAPP_E2E_SUPABASE_URL: 'http://example.test',
    OG_WHATSAPP_E2E_API_KEY: 'secret',
  }),
  /HTTPS/,
);

const config = buildConfig({
  OG_WHATSAPP_E2E_SUPABASE_URL: 'https://example.test',
  OG_WHATSAPP_E2E_API_KEY: 'sb_secret_test',
  OG_WHATSAPP_E2E_KEEP: 'false',
});
assert.equal(config.supabaseUrl, 'https://example.test');
assert.equal(config.apiKey, 'sb_secret_test');
assert.equal(config.keepData, false);

console.log('WhatsApp E2E self-test harness: PASS');
