import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dependency compatibility smoke, not an application/data/provider test.
// Execute in a disposable, secret-free sandbox with networking disabled externally.
// Only synthetic buffers and a newly created temporary directory are writable.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRequire = createRequire(path.join(root, 'package.json'));
const temporaryRoot = mkdtempSync(path.join(tmpdir(), 'og-ci-dependency-smoke-'));
const cliDirectory = path.join(temporaryRoot, 'empty-cli-project');
const configDirectory = path.join(temporaryRoot, 'config');
const cacheDirectory = path.join(temporaryRoot, 'cache');
for (const directory of [cliDirectory, configDirectory, cacheDirectory]) {
  mkdirSync(directory, { recursive: true });
}

let passed = 0;
let failed = 0;
async function check(label, run) {
  try {
    const detail = await run();
    passed += 1;
    console.log(`PASSOU ${label}${detail ? ` (${detail})` : ''}`);
  } catch (error) {
    failed += 1;
    // Never dump inherited environment, provider responses or child-process output.
    console.error(`FALHOU ${label}: ${error.code || error.name || 'erro'}`);
  }
}

function packageInfo(localRequire, name) {
  const filename = localRequire.resolve(`${name}/package.json`);
  const metadata = JSON.parse(readFileSync(filename, 'utf8'));
  return { filename, directory: path.dirname(filename), metadata };
}

function versionCommand(executable, args) {
  // Deliberately do not spread process.env: no tokens, .env loader, proxy,
  // NODE_OPTIONS, NODE_PATH or Cloudflare credentials are passed to either CLI.
  const result = spawnSync(executable, args, {
    cwd: cliDirectory,
    env: {
      CI: 'true',
      LANG: 'C.UTF-8',
      NO_COLOR: '1',
      TMPDIR: temporaryRoot,
      XDG_CONFIG_HOME: configDirectory,
      XDG_CACHE_HOME: cacheDirectory,
      WRANGLER_LOG_PATH: path.join(temporaryRoot, 'wrangler.log'),
      WRANGLER_SEND_METRICS: 'false',
      CLOUDFLARE_SEND_METRICS: 'false',
      WRANGLER_CHECK_NEW_VERSION: 'false',
    },
    encoding: 'utf8',
    timeout: 30_000,
    maxBuffer: 1024 * 1024,
    shell: false,
    windowsHide: true,
  });
  assert.ifError(result.error);
  if (result.status !== 0) {
    const diagnostic = result.stderr.match(/MINIFLARE_SMOKE_ERROR ([A-Z][A-Z0-9_]{0,79})\b/);
    if (diagnostic) throw Object.assign(new Error('isolated Miniflare smoke failed'), { code: diagnostic[1] });
  }
  assert.equal(result.status, 0, 'version command must exit successfully');
  assert.equal(result.signal, null, 'version command must not be terminated');
  // Keep output internal: only validated package versions are printed by checks.
  return result.stdout.replace(/\u001b\[[0-9;]*m/g, '').trim();
}

try {
  await check('AIOX renderer / Handlebars: template e helpers reais', () => {
    const rendererPath = path.join(root, '.aiox-core/product/templates/engine/renderer.js');
    const rendererRequire = createRequire(rendererPath);
    const { TemplateRenderer } = projectRequire(rendererPath);
    const renderer = new TemplateRenderer();
    const context = {
      customer: 'empresa fictícia qa',
      vehicles: [
        { label: 'Configuração A', quantity: 2, units: 3 },
        { label: 'Configuração B', quantity: 1, units: 4 },
      ],
    };
    const before = structuredClone(context);
    const template = '{{uppercase customer}}\n{{#each vehicles}}{{label}} × {{quantity}} = {{multiply quantity units}};{{/each}}';
    assert.equal(renderer.renderString(template, context),
      'EMPRESA FICTÍCIA QA\nConfiguração A × 2 = 6;Configuração B × 1 = 4;');
    assert.deepEqual(context, before, 'renderer must not mutate input data');
    assert.equal(renderer.validateSyntax('{{#if enabled}}OK{{/if}}').isValid, true);
    assert.equal(renderer.validateSyntax('{{#if enabled}}').isValid, false);
    return `handlebars ${packageInfo(rendererRequire, 'handlebars').metadata.version}`;
  });

  await check('Sharp: pixels sintéticos → PNG → resize/WebP → metadata', async () => {
    const { filename: wranglerManifest } = packageInfo(projectRequire, 'wrangler');
    const wranglerRequire = createRequire(wranglerManifest);
    const { filename: miniflareManifest } = packageInfo(wranglerRequire, 'miniflare');
    const miniflareRequire = createRequire(miniflareManifest);
    const sharp = miniflareRequire('sharp');
    const pixels = Buffer.from([
      255, 220, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255,
      0, 0, 0, 255, 255, 220, 0, 255, 255, 255, 255, 255,
    ]);
    const png = await sharp(pixels, { raw: { width: 3, height: 2, channels: 4 } }).png().toBuffer();
    assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const pngMetadata = await sharp(png).metadata();
    assert.equal(pngMetadata.format, 'png');
    assert.equal(pngMetadata.width, 3);
    assert.equal(pngMetadata.height, 2);
    const webp = await sharp(png).resize(2, 2, { fit: 'fill' }).webp({ quality: 80 }).toBuffer();
    assert.equal(webp.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(webp.subarray(8, 12).toString('ascii'), 'WEBP');
    const webpMetadata = await sharp(webp).metadata();
    assert.equal(webpMetadata.format, 'webp');
    assert.equal(webpMetadata.width, 2);
    assert.equal(webpMetadata.height, 2);
    return `sharp ${sharp.versions.sharp}`;
  });

  await check('esbuild: transformação nativa e execução do resultado sintético', async () => {
    const { filename } = packageInfo(projectRequire, 'wrangler');
    const wranglerRequire = createRequire(filename);
    const esbuild = wranglerRequire('esbuild');
    const result = esbuild.transformSync('export const next = (value) => value + 1;', {
      loader: 'js', format: 'esm', target: 'node24',
    });
    assert.deepEqual(result.warnings, []);
    const transformed = await import(`data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`);
    assert.equal(transformed.next(41), 42);
    return `esbuild ${esbuild.version}`;
  });

  await check('workerd: binário da plataforma executa somente --version', () => {
    const { filename } = packageInfo(projectRequire, 'wrangler');
    const wranglerRequire = createRequire(filename);
    const workerd = wranglerRequire('workerd');
    assert.equal(typeof workerd.default, 'string');
    assert.ok(path.isAbsolute(workerd.default));
    const output = versionCommand(workerd.default, ['--version']);
    assert.ok(output.includes(workerd.compatibilityDate));
    return `workerd ${workerd.version}`;
  });

  await check('Wrangler: CLI --version sem projeto, credenciais ou telemetria', () => {
    const { directory, metadata } = packageInfo(projectRequire, 'wrangler');
    const relativeBin = typeof metadata.bin === 'string' ? metadata.bin : metadata.bin.wrangler;
    assert.equal(typeof relativeBin, 'string');
    const executable = path.resolve(directory, relativeBin);
    assert.ok(executable.startsWith(`${directory}${path.sep}`));
    const output = versionCommand(process.execPath, [executable, '--version']);
    assert.ok(output.split(/\r?\n/).some(line => line.trim() === metadata.version));
    return `wrangler ${metadata.version}`;
  });

  await check('Miniflare: SDK inicia worker sintético e dispatchFetch local', () => {
    const { filename: wranglerManifest } = packageInfo(projectRequire, 'wrangler');
    const wranglerRequire = createRequire(wranglerManifest);
    const { metadata } = packageInfo(wranglerRequire, 'miniflare');
    const miniflareModule = wranglerRequire.resolve('miniflare');
    // Miniflare merges its process environment into workerd's. Run this SDK
    // check in a separate Node process with versionCommand's same allowlist.
    // No project config, provider credentials, persistent bindings or disk
    // assets are supplied. The outer test sandbox must still deny networking.
    const source = `
      const assert = require('node:assert/strict');
      const path = require('node:path');
      const { Miniflare, MiniflareOptionsSchema, Log, LogLevel } = require(${JSON.stringify(miniflareModule)});
      async function bounded(promise, milliseconds) {
        let timer;
        try {
          return await Promise.race([
            promise,
            new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error('local smoke timeout')), milliseconds);
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }
      }
      // Also bound child shutdown if the SDK fails to release a native handle.
      // Miniflare's process-exit hook disposes its runtime on process exit.
      const watchdog = setTimeout(() => process.exit(1), 25_000);
      watchdog.unref();
      (async () => {
        let mf;
        try {
          // Miniflare 5's exported constructor accepts workers/config/dev,
          // not the legacy single-worker options still shown in its README.
          const options = {
            host: '127.0.0.1',
            port: 0,
            workers: [{
              config: {
                name: 'ci121-synthetic',
                compatibilityDate: '2026-10-12',
                manifest: {
                  mainModule: 'worker.mjs',
                  modulesRoot: process.cwd(),
                  modules: {
                    'worker.mjs': {
                      type: 'esm',
                      contents: 'export default { fetch(request) { return Response.json({ marker: "ci121-synthetic", method: request.method, path: new URL(request.url).pathname }); } };',
                    },
                  },
                },
              },
              dev: {
                rootPath: process.cwd(),
                cacheAPI: false,
                unsafeRegisterWorker: false,
                outboundService: {
                  type: 'fetcher',
                  handler: () => { throw new Error('outbound requests forbidden'); },
                },
              },
            }],
            cf: false,
            logRequests: false,
            log: new Log(LogLevel.ERROR),
            telemetry: { enabled: false },
            unsafeDevRegistryPath: path.join(process.env.TMPDIR, 'miniflare-registry'),
            resourceTmpPath: path.join(process.env.TMPDIR, 'miniflare-resources'),
          };
          assert.equal(MiniflareOptionsSchema.safeParse(options).success, true);
          mf = new Miniflare(options);
          const response = await bounded(mf.dispatchFetch('http://localhost/ci121-probe'), 10_000);
          assert.equal(response.status, 200);
          assert.match(response.headers.get('content-type'), /application\\/json/);
          assert.deepEqual(await bounded(response.json(), 5_000), {
            marker: 'ci121-synthetic', method: 'GET', path: '/ci121-probe',
          });
        } finally {
          if (mf) await bounded(mf.dispose(), 5_000);
        }
        clearTimeout(watchdog);
        process.stdout.write('MINIFLARE_SMOKE_OK');
      })().catch(error => {
        const code = typeof error.code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(error.code)
          ? error.code : 'MINIFLARE_SMOKE_FAILED';
        process.stderr.write('MINIFLARE_SMOKE_ERROR ' + code);
        process.exit(1);
      });
    `;
    const output = versionCommand(process.execPath, ['--input-type=commonjs', '--eval', source]);
    assert.equal(output, 'MINIFLARE_SMOKE_OK');
    return `miniflare ${metadata.version}`;
  });
} finally {
  // Never remove a repository path, data directory or user cache.
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(`Dependency compatibility smoke: ${failed ? 'FALHOU' : 'PASSOU'} (${passed}/6; ${failed} falhas)`);
if (failed) process.exitCode = 1;
