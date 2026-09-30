import assert from 'node:assert/strict';
import fs from 'node:fs';

const pairs = [
  ['../apps/sistema-og/services/technical-application-service.js', '../preview-v2/technical-application-core-v3.js'],
  ['../apps/sistema-og/services/quote-engine-service.js', '../preview-v2/technical-quote-service-v3.js']
];

for (const [canonicalPath, deployPath] of pairs) {
  const canonical = fs.readFileSync(new URL(canonicalPath, import.meta.url), 'utf8');
  const deploy = fs.readFileSync(new URL(deployPath, import.meta.url), 'utf8');
  assert.equal(deploy, canonical, `${deployPath} deve permanecer byte-a-byte equivalente ao serviço canônico ${canonicalPath}`);
}

console.log('V1 quote engine deploy mirror parity: PASS');
