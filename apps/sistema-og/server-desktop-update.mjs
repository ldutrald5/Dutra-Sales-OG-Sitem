import { execFile } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { mkdir, mkdtemp, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';

const repo = 'ldutrald5/Dutra-Sales-OG-Sitem';
const repoName = 'Dutra-Sales-OG-Sitem';
const exec = promisify(execFile);
const archiveLimit = 128 * 1024 * 1024;
export const isReleaseSha = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);

export function isDesktopRequest(req, port, write = false) {
  const host = req.headers.host;
  const remote = req.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote)) return false;
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host)) return false;
  const origin = `http://${host}`;
  if (req.headers.origin && req.headers.origin !== origin) return false;
  if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return false;
  return !write || (
    req.headers.origin === origin &&
    req.headers['content-type']?.split(';')[0].trim() === 'application/json'
  );
}

export function validArchiveEntry(entry, subtree) {
  const normalized = entry.replace(/\/$/, '');
  if (normalized !== subtree && !normalized.startsWith(subtree + '/')) return false;
  return normalized.split('/').every(part =>
    part &&
    (!part.startsWith('.') || ['.gitkeep', '.assetsignore'].includes(part)) &&
    !/[<>:"\\|?*\x00-\x1f]|[. ]$/.test(part) &&
    !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part)
  );
}

async function findMain(fetchFn) {
  const response = await fetchFn(`https://api.github.com/repos/${repo}/commits/main`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'DUTRA-OS-Desktop' },
    redirect: 'error',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('O GitHub não respondeu à consulta de versão.');
  const { sha } = await response.json();
  if (!isReleaseSha(sha)) throw new Error('O GitHub retornou uma versão inválida.');
  return sha;
}

async function download(fetchFn, sha, file) {
  const signal = AbortSignal.timeout(120000);
  const response = await fetchFn(`https://codeload.github.com/${repo}/tar.gz/${sha}`, {
    headers: { 'User-Agent': 'DUTRA-OS-Desktop' },
    redirect: 'error',
    signal,
  });
  if (!response.ok || !response.body) throw new Error('Não foi possível baixar a atualização do GitHub.');
  if (Number(response.headers.get('content-length')) > archiveLimit) throw new Error('O pacote do GitHub excede o tamanho permitido.');
  let size = 0;
  await pipeline(Readable.fromWeb(response.body), new Transform({
    transform(chunk, _encoding, done) {
      size += chunk.length;
      if (size > archiveLimit) done(new Error('O pacote do GitHub excede o tamanho permitido.'));
      else done(null, chunk);
    },
  }), createWriteStream(file, { flags: 'wx' }), { signal });
}

async function extractApplication(archive, output, sha) {
  const tar = process.platform === 'win32' ? 'tar.exe' : 'tar';
  const options = { timeout: 60000, maxBuffer: 2 * 1024 * 1024, windowsHide: true };
  const subtree = `${repoName}-${sha}/apps/sistema-og`;
  const names = await exec(tar, ['-tzf', archive, subtree], options);
  const details = await exec(tar, ['-tvzf', archive, subtree], options);
  const entries = names.stdout.trimEnd().split(/\r?\n/);
  const lines = details.stdout.trimEnd().split(/\r?\n/);
  const unique = new Set(entries.map(entry => entry.replace(/\/$/, '').toLowerCase()));
  if (entries.length !== lines.length || unique.size !== entries.length ||
      entries.some(entry => !validArchiveEntry(entry, subtree)) ||
      lines.some(line => !/^[d-]/.test(line))) {
    throw new Error('O pacote contém arquivos incompatíveis com a atualização local.');
  }

  await mkdir(output);
  await exec(tar, ['-xzf', archive, '--strip-components', '1', '-C', output, subtree], options);
  const app = path.join(output, 'apps', 'sistema-og');
  for (const name of ['index.html', 'app.js', 'styles.css', 'service-worker.js', 'server.mjs']) {
    if (!(await stat(path.join(app, name))).isFile()) throw new Error('O pacote do GitHub está incompleto.');
  }
  await exec(process.execPath, ['--check', path.join(app, 'server.mjs')], options);
}

export function createDesktopUpdater({ directory, current, fetchFn = fetch }) {
  let busy = false;

  return {
    async check() {
      const latest = await findMain(fetchFn);
      return { current, latest, available: latest !== current };
    },

    async prepare(expected) {
      if (busy) throw new Error('Uma atualização já está em andamento.');
      if (!isReleaseSha(expected)) throw new Error('Verifique a versão no GitHub antes de instalar.');
      busy = true;
      let staging;
      try {
        const latest = await findMain(fetchFn);
        if (latest !== expected) throw new Error('A versão no GitHub mudou. Verifique novamente.');
        if (latest === current) return { current, latest, available: false };

        const releases = path.join(directory, 'releases');
        await mkdir(releases, { recursive: true });
        staging = await mkdtemp(path.join(releases, '.stage-'));
        const archive = path.join(staging, 'release.tgz');
        const output = path.join(staging, 'app');
        await download(fetchFn, latest, archive);
        await extractApplication(archive, output, latest);
        const destination = path.join(releases, latest);
        await rm(destination, { recursive: true, force: true });
        await rename(output, destination);
        return { current, latest, available: true };
      } finally {
        try {
          if (staging) await rm(staging, { recursive: true, force: true });
        } finally {
          busy = false;
        }
      }
    },
  };
}
