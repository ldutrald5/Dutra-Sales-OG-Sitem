#!/usr/bin/env node
/**
 * Gera apps/sistema-og/assets/og-utilities.css a partir de index.html + app.js.
 * Preferência: npx tailwindcss → binário standalone em scripts/ → /tmp/tailwindcss.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ogDir = path.join(root, 'apps', 'sistema-og');
const input = path.join(ogDir, 'tailwind.input.css');
const output = path.join(ogDir, 'assets', 'og-utilities.css');
const config = path.join(ogDir, 'tailwind.config.cjs');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ogDir, encoding: 'utf8', shell: false });
  return r;
}

function tryNpx() {
  const r = run('npx', [
    '--yes',
    'tailwindcss@3.4.17',
    '-i', input,
    '-o', output,
    '-c', config,
    '--minify',
  ]);
  if (r.status === 0) return { ok: true, via: 'npx' };
  return { ok: false, err: (r.stderr || r.stdout || '').slice(0, 500) };
}

function tryBinary(binPath) {
  if (!fs.existsSync(binPath)) return { ok: false, err: 'not found' };
  try {
    fs.accessSync(binPath, fs.constants.X_OK);
  } catch {
    try {
      fs.chmodSync(binPath, 0o755);
    } catch {
      return { ok: false, err: 'not executable' };
    }
  }
  const r = run(binPath, ['-i', input, '-o', output, '-c', config, '--minify']);
  if (r.status === 0) return { ok: true, via: binPath };
  return { ok: false, err: (r.stderr || r.stdout || '').slice(0, 500) };
}

console.log('Sistema OG — build CSS (Tailwind CLI)');
console.log('  content: index.html + app.js');
console.log('  output:', path.relative(root, output));

// Binário local primeiro (evita npx lento/offline); depois npx
const candidates = [
  path.join(root, 'scripts', 'tailwindcss-linux-x64'),
  path.join(root, 'scripts', 'tailwindcss.exe'),
  path.join(root, 'scripts', 'tailwindcss'),
  '/tmp/tailwindcss',
];
let result = { ok: false };
for (const bin of candidates) {
  result = tryBinary(bin);
  if (result.ok) break;
}
if (!result.ok) result = tryNpx();

if (!result.ok) {
  console.error('Falha ao gerar CSS. Instale Tailwind ou rode:');
  console.error('  npm install -D tailwindcss@3.4.17');
  console.error('  npm run og:css');
  if (result.err) console.error(result.err);
  process.exit(1);
}

const size = fs.statSync(output).size;
console.log(`OK via ${result.via} — ${(size / 1024).toFixed(1)} KB`);
