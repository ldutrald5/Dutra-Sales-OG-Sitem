import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const goldenPath = path.join(root, 'scripts/fixtures/glob-compat-baseline.json');
// Generation only: use a separately installed historical dependency, never ship it.
const baselinePath = process.env.DUTRA_GLOB_BASELINE;
const fg = baselinePath ? require(path.resolve(baselinePath)) : require('fast-glob');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'dutra-glob-qa-'));
const portable = p => p.replaceAll('\\', '/');
const write = (p, text = 'fixture') => { fs.mkdirSync(path.dirname(p), {recursive: true}); fs.writeFileSync(p, text); };
const snapshots = {};
function check(name, patterns, options = {}, ordered = false, cwd = temp) {
  const values = fg.sync(patterns, {cwd, ...options}).map(p => portable(path.isAbsolute(p) ? path.relative(cwd, p) : p));
  snapshots[name] = ordered ? values : [...values].sort();
}
try {
  for (const file of ['top.yaml', 'top.md', '.hidden.md', 'a/tool.yaml', 'z/tool.yaml', 'a/deep/tool.yaml',
    'z/deep/tool.yaml', 'a/one.js', 'a/two.mjs', 'a/.secret.yaml', 'docs/stories/story-002.md',
    'docs/stories/deep/story-012.md', 'docs/stories/deep/other.md']) write(path.join(temp, file));
  check('tool-resolver-order', '**/tool.yaml', {}, true);
  check('tool-resolver-all-yaml', '**/*.yaml');
  check('entity-registry-brace-exts', '**/*.{js,mjs,yaml,md}', {onlyFiles: true, absolute: true});
  check('elicitation-story', 'docs/stories/**/story-*.md');
  check('enterprise-dot-unique', ['**/*', '**/*.yaml'], {dot: true, onlyFiles: true, unique: true});
  check('negative-patterns', ['**/*.{md,yaml}', '!a/**']);
  check('ignore', '**/*', {ignore: ['a/**']});
  check('dot-false', '**/*.md', {dot: false});
  check('dot-true', '**/*.{md,yaml}', {dot: true});
  check('absolute', portable(path.join(temp, '**/*.yaml')), {absolute: true});
  check('cwd', '**/*.yaml', {}, false, path.join(temp, 'a'));
  check('duplicates-order', ['z/**/*.yaml', '**/tool.yaml', '**/tool.yaml'], {}, true);
  check('missing-dir', 'not-present/**/*.yaml');
  check('directories', '**/*', {onlyFiles: false});
  let symlinkSkipped = false;
  try { fs.symlinkSync(path.join(temp, 'a'), path.join(temp, 'linked'), process.platform === 'win32' ? 'junction' : 'dir'); }
  catch (error) { if (process.platform === 'win32' && error.code === 'EPERM') symlinkSkipped = true; else throw error; }
  if (!symlinkSkipped) {
    check('symlink-follow', 'linked/**/*.yaml', {followSymbolicLinks: true});
    check('symlink-no-follow', '**/*.yaml', {followSymbolicLinks: false});
  }
  const source = fs.readFileSync(path.join(root, '.aiox-core/development/scripts/populate-entity-registry.js'), 'utf8');
  // Extract literal scan declarations without loading the generator or modifying registry.
  const configs = [...source.matchAll(/basePath: '([^']+)', glob: '([^']+)'/g)];
  assert.ok(configs.length >= 10, 'real registry scan configs must be covered');
  for (const [, base, pattern] of configs) {
    const files = fg.sync(`${portable(path.join(root, base))}/${pattern}`, {onlyFiles: true, absolute: true})
      .map(p => portable(path.relative(root, p))).sort();
    snapshots[`real-registry:${base}`] = {count: files.length, sha256: createHash('sha256').update(JSON.stringify(files)).digest('hex')};
  }
  for (const base of ['.aiox-core/infrastructure/tools', '.aiox-core/development/tools'])
    check(`real-tools:${base}`, `${base}/**/tool.yaml`, {}, true, root);
  if (baselinePath) {
    const version = require(path.join(path.resolve(baselinePath), 'package.json')).version;
    assert.equal(version, '3.3.3');
    fs.mkdirSync(path.dirname(goldenPath), {recursive: true});
    fs.writeFileSync(goldenPath, JSON.stringify({provenance: {package: 'fast-glob', version,
      purpose: 'Differential expectations generated against temporary 3.3.3 baseline; no baseline dependency required at test time'}, snapshots}, null, 2) + '\n');
    console.log('Generated fast-glob 3.3.3 baseline fixture');
  } else {
    const sourceAdapter = fs.readFileSync(path.join(root, 'tools/fast-glob-compat/index.cjs'), 'utf8');
    assert.equal(fs.readFileSync(require.resolve('fast-glob'), 'utf8'), sourceAdapter, 'root installed adapter must match source, not stale npm file cache');
    assert.equal(require('fast-glob/package.json').version, require('../tools/fast-glob-compat/package.json').version);
    const guardOptions = {cwd: temp};
    assert.throws(() => fg.sync('x'.repeat(4097), guardOptions), /length exceeds 4096/);
    assert.throws(() => fg.sync('{'.repeat(33) + 'x' + '}'.repeat(33), guardOptions), /nesting exceeds 32/);
    assert.throws(() => fg.sync('('.repeat(33) + 'x' + ')'.repeat(33), guardOptions), /nesting exceeds 32/);
    assert.throws(() => fg.sync('{)'.repeat(33) + 'x', guardOptions), /nesting exceeds 32|mismatched|unbalanced/i);
    assert.throws(() => fg.sync('*', {...guardOptions, ignore: ['x'.repeat(4097)]}), /length exceeds 4096/);
    assert.throws(() => fg.sync(['*', '!' + '{'.repeat(33)], guardOptions), /nesting exceeds 32/);
    assert.throws(() => fg.sync('*', {...guardOptions, ignore: '*.yaml'}), /ignore must be an array/);
    assert.throws(() => fg.sync('*', {...guardOptions, unique: false}), /requires unique/);
    assert.throws(() => fg.sync('*', {...guardOptions, markDirectories: true}), /unsupported option/);
    assert.throws(() => fg.sync([42], guardOptions), /non-empty glob strings/);
    assert.doesNotThrow(() => fg.sync(String.raw`\{`.repeat(33) + '*', guardOptions), 'escaped opening delimiters are literals');
    const expected = JSON.parse(fs.readFileSync(goldenPath, 'utf8')).snapshots;
    if (symlinkSkipped) for (const key of ['symlink-follow', 'symlink-no-follow']) delete expected[key];
    for (const [name, value] of Object.entries(snapshots)) assert.deepEqual(value, expected[name], name);
    for (const [name, rel] of Object.entries({resolver: '.aiox-core/infrastructure/scripts/tool-resolver.js',
      elicitation: '.aiox-core/product/templates/engine/elicitation.js', registry: '.aiox-core/development/scripts/populate-entity-registry.js',
      enterprise: 'node_modules/@aiox-squads/core/packages/installer/src/enterprise/enterprise-upgrader.js'})) {
      const consumer = createRequire(path.join(root, rel));
      assert.equal(consumer('fast-glob/package.json').name, '@dutra/fast-glob-compat', `${name} must resolve the adapter`);
      assert.deepEqual(consumer('fast-glob').sync('**/tool.yaml', {cwd: temp}), fg.sync('**/tool.yaml', {cwd: temp}), `${name} installed adapter behavior`);
    }
    const {expandEntryPaths} = require('../node_modules/@aiox-squads/core/packages/installer/src/enterprise/enterprise-upgrader.js');
    assert.deepEqual(expandEntryPaths(temp, 'a'), ['a/.secret.yaml', 'a/deep/tool.yaml', 'a/one.js', 'a/tool.yaml', 'a/two.mjs']);
    const {VariableElicitation} = require('../.aiox-core/product/templates/engine/elicitation.js');
    const originalCwd = process.cwd();
    try {
      process.chdir(temp);
      assert.equal(await new VariableElicitation().getNextNumber('story'), 13);
      const ToolResolver = require('../.aiox-core/infrastructure/scripts/tool-resolver.js').constructor;
      const resolver = new ToolResolver(); resolver.basePaths = ['a', 'z'];
      for (const [file, id] of [['a/tool.yaml', 'first-tool'], ['z/tool.yaml', 'second-tool'], ['a/deep/tool.yaml', 'deep-tool']])
        write(path.join(temp, file), `id: ${id}\ntype: local\nname: Fixture\nversion: 1.0.0\ndescription: QA fixture\n`);
      assert.equal((await resolver.resolveTool('tool')).id, 'first-tool');
    } finally { process.chdir(originalCwd); }
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    for (const key of Object.keys(lock.packages)) assert.ok(!/(?:^|\/)(?:braces|micromatch)$/.test(key), `forbidden lock entry: ${key}`);
    const seen = new Set();
    function inspectModules(dir) {
      if (!fs.existsSync(dir)) return;
      const real = fs.realpathSync(dir); if (seen.has(real)) return; seen.add(real);
      for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
        if (entry.name.startsWith('.')) continue;
        const p = path.join(dir, entry.name);
        if (entry.name.startsWith('@')) { inspectModules(p); continue; }
        assert.ok(!['braces', 'micromatch'].includes(entry.name), `forbidden installed package: ${p}`);
        if (entry.isDirectory() || entry.isSymbolicLink()) inspectModules(path.join(p, 'node_modules'));
      }
    }
    inspectModules(path.join(root, 'node_modules'));
    const nestedModules = path.join(root, '.aiox-core/node_modules');
    if (process.env.DUTRA_REQUIRE_STANDALONE === '1' || fs.existsSync(nestedModules)) {
      const standalone = createRequire(path.join(root, '.aiox-core/package.json'));
      const adapterPath = standalone.resolve('fast-glob');
      assert.ok(adapterPath.startsWith(nestedModules + path.sep), 'standalone adapter must not come from ancestor node_modules');
      assert.equal(fs.readFileSync(adapterPath, 'utf8'), sourceAdapter, 'standalone installed adapter must match source');
      assert.equal(standalone('fast-glob/package.json').version, require('../tools/fast-glob-compat/package.json').version);
      const fromAdapter = createRequire(adapterPath);
      assert.ok(fromAdapter.resolve('glob').startsWith(nestedModules + path.sep), 'standalone glob must be independently installed');
      assert.equal(standalone('fast-glob/package.json').name, '@dutra/fast-glob-compat');
      assert.deepEqual(standalone('fast-glob').sync('**/tool.yaml', {cwd: temp}), fg.sync('**/tool.yaml', {cwd: temp}));
      inspectModules(nestedModules);
      const nestedLock = JSON.parse(fs.readFileSync(path.join(root, '.aiox-core/package-lock.json'), 'utf8'));
      for (const key of Object.keys(nestedLock.packages)) assert.ok(!/(?:^|\/)(?:braces|micromatch)$/.test(key), `forbidden standalone lock entry: ${key}`);
      console.log('Standalone .aiox-core local dependency resolution: PASS');
    }
    const {RegistryUpdater} = require('../.aiox-core/core/ids/registry-updater.js');
    const repo = path.join(temp, 'watch-repo');
    const watchDir = path.join(repo, '.aiox-core/development/tasks'); fs.mkdirSync(watchDir, {recursive: true});
    const events = [];
    const updater = new RegistryUpdater({repoRoot: repo, registryPath: path.join(repo, 'unused-registry.yaml')});
    updater._queueUpdate = (action, p) => events.push({action, name: path.basename(p)});
    const watcher = updater.startWatcher(); assert.ok(watcher);
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    async function until(test, label, timeout = 8000) {
      const start = Date.now(); while (!test()) { assert.ok(Date.now() - start < timeout, `timeout: ${label}`); await wait(40); }
    }
    try {
      await new Promise((resolve, reject) => { const timer = setTimeout(() => reject(new Error('watch ready timeout')), 8000);
        watcher.once('ready', () => { clearTimeout(timer); resolve(); }); watcher.once('error', error => { clearTimeout(timer); reject(error); }); });
      assert.deepEqual(events, [], 'ignoreInitial');
      const file = path.join(watchDir, 'qa-event.md'); write(file, 'add');
      await until(() => events.some(e => e.action === 'add' && e.name === 'qa-event.md'), 'add');
      write(file, 'changed contents');
      await until(() => events.some(e => e.action === 'change' && e.name === 'qa-event.md'), 'change');
      fs.unlinkSync(file);
      await until(() => events.some(e => e.action === 'unlink' && e.name === 'qa-event.md'), 'unlink');
      const nestedFile = path.join(watchDir, 'created-after-ready/deeper/qa-nested.md');
      write(nestedFile, 'nested add');
      await until(() => events.some(e => e.action === 'add' && e.name === 'qa-nested.md'), 'recursive add in new subdirectory');
      write(nestedFile, 'nested changed contents');
      await until(() => events.some(e => e.action === 'change' && e.name === 'qa-nested.md'), 'recursive change');
      fs.unlinkSync(nestedFile);
      await until(() => events.some(e => e.action === 'unlink' && e.name === 'qa-nested.md'), 'recursive unlink');
      write(path.join(watchDir, 'README.md')); write(path.join(watchDir, 'ignored.test.js'));
      write(path.join(watchDir, 'node_modules/ignored.js')); await wait(750);
      assert.ok(events.every(e => ['qa-event.md', 'qa-nested.md'].includes(e.name)), 'excluded entries must not emit updates');
    } finally { await updater.stopWatcher(); }
    assert.equal(updater._watcher, null);
    const count = events.length; write(path.join(watchDir, 'after-close.md')); await wait(350);
    assert.equal(events.length, count, 'closed watcher must not emit');
    assert.equal(fs.existsSync(path.join(repo, 'unused-registry.yaml')), false, 'must never write registry');
    console.log(`Glob compatibility: PASS (${Object.keys(snapshots).length} baseline cases, 4 consumer resolutions, watcher lifecycle, forbidden-package checks)`);
  }
} finally { fs.rmSync(temp, {recursive: true, force: true}); }
