import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { createDesktopUpdater, isDesktopRequest, validArchiveEntry } from '../apps/sistema-og/server-desktop-update.mjs';

const exec = promisify(execFile);
const sha = 'a'.repeat(40);
const badSha = 'b'.repeat(40);
const repo = 'Dutra-Sales-OG-Sitem';
const temporary = await mkdtemp(path.join(os.tmpdir(), 'og-update-test-'));
const portServer = createServer().listen(0, '127.0.0.1');
await once(portServer, 'listening');
const { port } = portServer.address();
await new Promise(resolve => portServer.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const request = { headers: { host: `127.0.0.1:${port}`, origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json' }, socket: { remoteAddress: '127.0.0.1' } };
assert.equal(isDesktopRequest(request, port, true), true);
assert.equal(isDesktopRequest({ ...request, headers: { ...request.headers, origin: 'https://example.com' } }, port, true), false);
assert.equal(isDesktopRequest({ ...request, headers: { ...request.headers, origin: undefined } }, port, true), false);
assert.equal(isDesktopRequest({ ...request, socket: { remoteAddress: '192.168.1.2' } }, port, true), false);
assert.equal(validArchiveEntry('app/app.js', 'app'), true);
assert.equal(validArchiveEntry('app/.data/customer.json', 'app'), false);
assert.equal(validArchiveEntry('other/index.html', 'app'), false);
assert.equal(validArchiveEntry('app/imports/.gitkeep', 'app'), true);

const fixtureServer = `
import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
const { OG_PORT, OG_RELEASE_SHA, OG_DATA_DIR } = process.env;
let ready = false;
process.on('message', message => { if (message?.type === 'og-desktop-ready') ready = true; });
const server = http.createServer(async (request, response) => {
  response.setHeader('content-type', 'application/json');
  if (request.url.startsWith('/stage/')) {
    if (!ready) { response.writeHead(503).end(); return; }
    ready = false;
    response.once('finish', () => process.send({ type: 'og-desktop-update', sha: request.url.slice(7) }));
  }
  response.end(JSON.stringify({ service: 'sistema-og', release: OG_RELEASE_SHA || null, ready,
    data: await readFile(path.join(OG_DATA_DIR, 'sentinel.txt'), 'utf8') }));
});
server.listen(Number(OG_PORT), '127.0.0.1');
`;
let launcher;

async function poll(check, milliseconds = 18000) {
  const expires = Date.now() + milliseconds;
  while (Date.now() < expires) {
    try { if (await check()) return; } catch { /* Transient during restart. */ }
    await delay(150);
  }
  throw new Error('Estado esperado da atualização não foi alcançado.');
}

try {
  const install = path.join(temporary, 'installation');
  const app = path.join(install, 'apps', 'sistema-og');
  const updates = path.join(install, '.og-updates');
  const sharedData = path.join(install, 'data-local');
  const archiveSource = path.join(temporary, `${repo}-${sha}`, 'apps', 'sistema-og');
  await Promise.all([mkdir(app, { recursive: true }), mkdir(sharedData, { recursive: true }), mkdir(archiveSource, { recursive: true }), mkdir(path.join(install, 'scripts'), { recursive: true })]);
  await writeFile(path.join(sharedData, 'sentinel.txt'), 'dados preservados');
  await writeFile(path.join(install, '.env'), 'LOCAL_CONFIG=fixture\n');
  await writeFile(path.join(app, 'server.mjs'), fixtureServer);
  await writeFile(path.join(archiveSource, 'server.mjs'), fixtureServer);
  for (const file of ['index.html', 'app.js', 'styles.css', 'service-worker.js', '.assetsignore']) {
    await writeFile(path.join(archiveSource, file), '');
  }
  const archive = path.join(temporary, 'release.tgz');
  await exec(process.platform === 'win32' ? 'tar.exe' : 'tar', ['-czf', archive, '-C', temporary, `${repo}-${sha}`]);
  const bytes = await readFile(archive);
  const seen = [];
  const updater = createDesktopUpdater({
    directory: updates,
    current: null,
    fetchFn: async (url, options) => {
      seen.push(url);
      assert.equal(options.redirect, 'error');
      return url.endsWith('/commits/main') ? Response.json({ sha }) : new Response(bytes);
    },
  });

  assert.deepEqual(await updater.check(), { current: null, latest: sha, available: true });
  await assert.rejects(updater.prepare(badSha), /versão no GitHub mudou/);
  const preparing = updater.prepare(sha);
  await assert.rejects(updater.prepare(sha), /andamento/);
  assert.deepEqual(await preparing, { current: null, latest: sha, available: true });
  assert.deepEqual(seen, [
    `https://api.github.com/repos/ldutrald5/${repo}/commits/main`,
    `https://api.github.com/repos/ldutrald5/${repo}/commits/main`,
    `https://api.github.com/repos/ldutrald5/${repo}/commits/main`,
    `https://codeload.github.com/ldutrald5/${repo}/tar.gz/${sha}`,
  ]);

  const badApp = path.join(updates, 'releases', badSha, 'apps', 'sistema-og');
  await mkdir(badApp, { recursive: true });
  await writeFile(path.join(badApp, 'server.mjs'), 'process.exit(1);');
  await cp(new URL('./start-og-desktop.mjs', import.meta.url), path.join(install, 'scripts', 'start-og-desktop.mjs'));
  let logs = '';
  launcher = spawn(process.execPath, [path.join(install, 'scripts', 'start-og-desktop.mjs')], {
    cwd: temporary,
    env: { ...process.env, OG_PORT: String(port), OG_DATA_DIR: 'data-local', OG_RELEASE_SHA: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  launcher.stdout.on('data', line => { logs += line; });
  launcher.stderr.on('data', line => { logs += line; });
  const readHealth = async () => (await fetch(origin + '/api/health')).json();

  await poll(async () => { const health = await readHealth(); return health.ready && health.release === null; });
  await fetch(origin + '/stage/' + sha);
  await poll(async () => {
    const health = await readHealth();
    return health.ready && health.release === sha && JSON.parse(await readFile(path.join(updates, 'active.json'), 'utf8')).sha === sha;
  });
  await fetch(origin + '/stage/' + badSha);
  await poll(async () => logs.includes('Voltando para a versão anterior') && (await readHealth()).release === sha);
  assert.equal(JSON.parse(await readFile(path.join(updates, 'active.json'), 'utf8')).sha, sha);
  assert.equal((await readHealth()).data, 'dados preservados');
  assert.equal(await readFile(path.join(install, '.env'), 'utf8'), 'LOCAL_CONFIG=fixture\n');
  assert.equal(await readFile(path.join(app, 'server.mjs'), 'utf8'), fixtureServer);
} finally {
  if (launcher && launcher.exitCode === null && launcher.signalCode === null) {
    const closed = once(launcher, 'exit');
    launcher.kill();
    await closed;
  }
  await rm(temporary, { recursive: true, force: true });
}
console.log('OG-20: origem local, download fixado em main, instalação sem Git e rollback com dados preservados.');
