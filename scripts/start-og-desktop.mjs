import { fork } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const updates = path.join(root, '.og-updates');
const pointer = path.join(updates, 'active.json');
const port = Number(process.env.OG_PORT || 4321);
const dataDir = process.env.OG_DATA_DIR
  ? path.resolve(root, process.env.OG_DATA_DIR)
  : path.join(root, 'apps', 'sistema-og', '.data');
const isSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const originalSha = isSha(process.env.OG_RELEASE_SHA) ? process.env.OG_RELEASE_SHA : '';

let running;
let active = '';
let switching = false;
let stopping = false;

function start(sha) {
  const source = sha && sha !== originalSha ? path.join(updates, 'releases', sha) : root;
  const child = fork(path.join(source, 'apps', 'sistema-og', 'server.mjs'), [], {
    cwd: root,
    env: { ...process.env, OG_DATA_DIR: dataDir, OG_DESKTOP_UPDATE_DIR: updates, OG_RELEASE_SHA: sha },
  });
  running = child;
  child.on('message', message => {
    if (child === running && message?.type === 'og-desktop-update' && isSha(message.sha)) {
      activate(message.sha).catch(error => console.error(error.message));
    }
  });
  child.on('error', error => console.error(error.message));
  child.on('exit', code => {
    if (!switching && !stopping && child === running) process.exitCode = code || 1;
  });
  return child;
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, 'exit');
  child.kill();
  const cutoff = setTimeout(() => child.kill('SIGKILL'), 3500);
  try { await exited; } finally { clearTimeout(cutoff); }
}

async function waitForHealth(child, sha) {
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(900) });
      const health = response.ok ? await response.json() : {};
      if (health.service === 'sistema-og' && (health.release || '') === sha) return;
    } catch { /* The child may still be binding its port. */ }
    await delay(250);
  }
  throw new Error('O Sistema OG não iniciou a versão esperada.');
}

function announceReady() {
  if (!stopping && running?.connected) running.send({ type: 'og-desktop-ready' }, () => {});
}

async function activate(sha) {
  if (switching || stopping || sha === active) return;
  switching = true;
  const previous = active;
  try {
    await stop(running);
    await waitForHealth(start(sha), sha);
    if (stopping) return;
    await mkdir(updates, { recursive: true });
    const temporary = pointer + '.tmp';
    await writeFile(temporary, JSON.stringify({ sha }) + '\n');
    await rename(temporary, pointer);
    active = sha;
  } catch {
    console.error('A nova versão falhou. Voltando para a versão anterior do Sistema OG.');
    await stop(running);
    if (!stopping) await waitForHealth(start(previous), previous);
  } finally {
    switching = false;
    announceReady();
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopping = true;
    stop(running).catch(error => console.error(error.message));
  });
}

try {
  const stored = JSON.parse(await readFile(pointer, 'utf8'));
  if (isSha(stored.sha)) active = stored.sha;
} catch { /* First start from the original installation. */ }

active ||= originalSha;
switching = true;
try {
  await waitForHealth(start(active), active);
} catch (error) {
  await stop(running);
  if (stopping || active === originalSha) throw error;
  console.error('A versão instalada falhou. Iniciando a instalação original.');
  active = originalSha;
  await waitForHealth(start(active), active);
  await rm(pointer, { force: true });
} finally {
  switching = false;
  announceReady();
}
