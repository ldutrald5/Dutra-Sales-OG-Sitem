import assert from 'node:assert/strict';
import fs from 'node:fs';

const pairs=[
  ['apps/sistema-og/services/connection-state-service.js','preview-v2/p0-services/connection-state-service.js'],
  ['apps/sistema-og/services/sync-bridge-service.js','preview-v2/p0-services/sync-bridge-service.js'],
];

for(const [canonical,mirror] of pairs){
  const a=fs.readFileSync(new URL('../'+canonical,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  const b=fs.readFileSync(new URL('../'+mirror,import.meta.url),'utf8').replace(/\r\n/g,'\n');
  assert.equal(b,a,mirror+' deve permanecer byte-a-byte equivalente ao serviço canônico '+canonical);
}

const server=fs.readFileSync(new URL('../preview-v2/server.mjs',import.meta.url),'utf8');
assert.match(server,/path\.join\(dir, 'p0-services', 'connection-state-service\.js'\)/);
assert.match(server,/path\.join\(dir, 'p0-services', 'sync-bridge-service\.js'\)/);

console.log('V3 P0 deploy mirror parity: PASS');
