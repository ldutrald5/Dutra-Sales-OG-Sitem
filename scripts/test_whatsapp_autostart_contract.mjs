import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  launcher: 'scripts/run-whatsapp-bridge.ps1',
  install: 'scripts/install-whatsapp-bridge-autostart.ps1',
  status: 'scripts/status-whatsapp-bridge-autostart.ps1',
  uninstall: 'scripts/uninstall-whatsapp-bridge-autostart.ps1',
};

const content = Object.fromEntries(
  await Promise.all(
    Object.entries(files).map(async ([key, file]) => [key, await readFile(file, 'utf8')]),
  ),
);

assert.match(content.launcher, /og:whatsapp:bridge/);
assert.match(content.launcher, /apps\\sistema-og\\\.data/);
assert.match(content.launcher, /OG_WHATSAPP_INGEST_API_KEY/);
assert.match(content.launcher, /SUPABASE_SERVICE_ROLE_KEY/);

assert.match(content.install, /DUTRA-OS-WhatsApp-Bridge/);
assert.match(content.install, /New-ScheduledTaskTrigger -AtLogOn/);
assert.match(content.install, /RestartCount 999/);
assert.match(content.install, /RestartInterval/);
assert.match(content.install, /run-whatsapp-bridge\.ps1/);

assert.match(content.status, /Get-ScheduledTask/);
assert.match(content.status, /whatsapp-bridge-\*\.log/);
assert.match(content.uninstall, /Unregister-ScheduledTask/);

const forbiddenPatterns = [
  /sb_secret_[A-Za-z0-9_-]{12,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
  /x-og-e2e-token\s*['":=]+\s*[a-f0-9]{32,}/i,
];

for (const [name, text] of Object.entries(content)) {
  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(text), false, `${name} contém padrão de segredo proibido: ${pattern}`);
  }
}

console.log('WhatsApp AutoStart Windows contract: PASS');
