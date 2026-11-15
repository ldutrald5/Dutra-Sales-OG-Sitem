import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const dataDir = await mkdtemp(path.join(os.tmpdir(), 'og-static-boundary-'));
const port = await new Promise(resolve => {
  const socket = net.createServer();
  socket.listen(0, '127.0.0.1', () => {
    const value = socket.address().port;
    socket.close(() => resolve(value));
  });
});
const env = {
  PATH: process.env.PATH,
  HOME: dataDir,
  OG_HOST: '127.0.0.1',
  OG_PORT: String(port),
  OG_DATA_DIR: dataDir,
  OG_ISOLATED_PREVIEW: 'true',
  OG_PERSISTENT_AUTH: 'true',
  OG_ACCESS_TOKEN: randomBytes(24).toString('hex'),
  OG_ACCESS_PIN: randomBytes(8).toString('hex'),
  OG_SESSION_SECRET: randomBytes(32).toString('hex')
};
const server = spawn(process.execPath, ['scripts/start-og-hosted.mjs'], {
  cwd: new URL('../', import.meta.url), env, stdio: 'ignore'
});
const base = `http://127.0.0.1:${port}`;

try {
  const until = Date.now() + 10_000;
  while (Date.now() < until) {
    if (server.exitCode !== null) throw new Error('Servidor de teste encerrou antes do health check');
    try { if ((await fetch(base + '/health')).ok) break; } catch {}
    await new Promise(resolve => setTimeout(resolve, 75));
  }
  assert.equal((await fetch(base + '/health')).status, 200);
  for (const resource of ['/api/state', '/server.mjs', '/server-state-store.cjs', '/knowledge/og-sales-brain.json', '/README.md', '/.data/shared-state.json']) {
    const status = (await fetch(base + resource)).status;
    assert.equal(status, resource === '/api/state' ? 401 : 403, resource);
  }
  for (const resource of ['/', '/index.html', '/app.js', '/components/precision-workspace.css', '/mobile/manifest.json']) {
    assert.equal((await fetch(base + resource)).status, 200, resource);
  }
  console.log('Preview static boundary: sensitive files denied, browser assets available. PASS');
} finally {
  server.kill('SIGTERM');
  await rm(dataDir, { recursive: true, force: true });
}
