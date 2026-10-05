import assert from 'node:assert/strict';
import fs from 'node:fs';

const index = fs.readFileSync('./index.html','utf8');
const server = fs.readFileSync('./server.mjs','utf8');
const loader = fs.readFileSync('./feature-loader-v3.js','utf8');

assert.ok(index.includes('<script defer src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js"'),'ícones não podem bloquear o primeiro paint');
assert.ok(index.includes('media="print" onload="this.media=\'all\'"'),'fonte remota deve carregar sem bloquear a tela');
for (const src of ['/core/data.js','/core/operations-model.js','/core/services/crm-service.js','/core-bridge.js']) {
  assert.ok(index.includes('<script defer src="'+src+'"></script>'),'core inicial precisa ser deferido: '+src);
}
for (const heavy of ['sales-desk.js','prospecting-engine.js','signal-center.js','spreadsheet-import-service.js','smart-diary-service.js']) {
  assert.ok(!server.includes('<script src="/core/') || !server.includes(heavy),'módulo pesado não deve bloquear shell: '+heavy);
  assert.ok(loader.includes(heavy),'loader deve carregar sob demanda: '+heavy);
}
assert.ok(server.includes('feature-loader-v3.js'),'servidor deve carregar o lazy feature loader');
assert.ok(loader.includes('dutra:navigate'),'loader deve reagir à navegação real');
console.log('Performance shell tests: PASS');
