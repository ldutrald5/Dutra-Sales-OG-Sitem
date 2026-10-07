import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn } from 'node:child_process';

async function freePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(error => error ? reject(error) : resolve(port));
    });
  });
}

async function waitForReady(child, port) {
  const deadline = Date.now() + 12_000;
  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Hosted runtime exited early: ${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`, { cache: 'no-store' });
      if (response.ok) return output;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Hosted runtime did not become ready. Output: ${output}`);
}

const port = await freePort();
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'og-hosted-'));
const token = 'hosted-test-token-0123456789';

const child = spawn(process.execPath, ['scripts/start-og-hosted.mjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    RAILWAY_VOLUME_MOUNT_PATH: dataDir,
    RAILWAY_PUBLIC_DOMAIN: 'sistema-og-preview.up.railway.app',
    OG_ACCESS_TOKEN: token,
    OG_ISOLATED_PREVIEW: 'false',
    OG_RELEASE_SHA: 'test-release-sha'
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  await waitForReady(child, port);

  let response = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(response.status, 200);
  let healthBody = await response.json();
  assert.equal(healthBody.ok, true);
  assert.equal(healthBody.service, 'sistema-og');
  assert.equal(healthBody.release, 'test-release-sha');
  assert.equal(healthBody.whisperSelfTest, null);
  assert.equal(healthBody.persistent, true, 'dataDir matches the explicit local volume fixture');

  response = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(response.status, 200, '/api/health deve permanecer público para diagnóstico');
  healthBody = await response.json();
  assert.equal(healthBody.ok, true);
  assert.equal(healthBody.service, 'sistema-og');
  assert.equal(healthBody.release, 'test-release-sha');
  assert.equal(healthBody.whisperSelfTest, null);

  response = await fetch(`http://127.0.0.1:${port}/runtime-config.js`);
  assert.equal(response.status,200);
  const runtimeText = await response.text();
  assert.match(runtimeText, /"isolatedPreview":false/, 'Standard hosted runtime must not inherit preview semantics');
  assert.match(runtimeText, /"pilotRealData":false/, 'Mount alone does not certify real pilot data');
  assert.match(response.headers.get('cache-control'), /no-store/);

  response = await fetch(`http://127.0.0.1:${port}/api/state`);
  assert.equal(response.status, 401, 'API hosted deve exigir código de acesso');

  response = await fetch(`http://127.0.0.1:${port}/api/state`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(response.status, 200);
  const state = await response.json();
  assert.equal(state.revision, 0);
  assert.ok(state.operations && typeof state.operations === 'object');

  response = await fetch(`http://127.0.0.1:${port}/api/access`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(response.status, 200);
  const access = await response.json();
  assert.equal(access.hosted, true);
  assert.equal(access.desktop, 'https://sistema-og-preview.up.railway.app');
  assert.equal(access.primaryPhoneUrl, 'https://sistema-og-preview.up.railway.app');

  response = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Sistema OG|DUTRA/i);

  assert.ok(fs.existsSync(dataDir), 'diretório persistente configurável deve existir');
  console.log('Hosted runtime smoke test: PASS');
} finally {
  child.kill('SIGTERM');
  await new Promise(resolve => {
    const timeout = setTimeout(resolve, 1500);
    child.once('exit', () => { clearTimeout(timeout); resolve(); });
  });
  fs.rmSync(dataDir, { recursive: true, force: true });
}
