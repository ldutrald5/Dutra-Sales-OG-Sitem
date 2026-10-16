import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Offline textual-contract checks. No provider, application, env loader or model is imported.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const gitBlob = bytes => createHash('sha1').update(`blob ${bytes.length}`).update(Buffer.from([0])).update(bytes).digest('hex');
const manifest = JSON.parse(read('docs/integrations/marketing-skills.sources.json'));
const names = ['grill-me', 'grilling', 'ig-audience-insights', 'ig-caption-writer',
  'ig-carousel-planner', 'ig-content-planner', 'ig-hashtag-strategist', 'ig-hook-extractor',
  'ig-humanizer', 'ig-profile-optimizer', 'ig-repurposer', 'og-ad-multiplier-handoff'];
let passed = 0;
function check(label, fn) {
  fn(); passed += 1; console.log(`PASSOU ${label}`);
}
function safePath(base, relative) {
  assert.equal(typeof relative, 'string');
  assert.ok(relative.length && !path.isAbsolute(relative));
  assert.ok(!relative.split(/[\\/]/).includes('..'));
  const target = path.resolve(base, relative);
  assert.ok(target.startsWith(path.resolve(base) + path.sep));
  // Reject symlinks in any existing component, including directory parents.
  let current = path.resolve(base);
  for (const part of relative.split('/')) {
    current = path.join(current, part);
    if (fs.existsSync(current)) assert.ok(!fs.lstatSync(current).isSymbolicLink(), current);
  }
  return target;
}
function listFiles(base, relative = '') {
  return fs.readdirSync(path.join(base, relative), { withFileTypes: true }).flatMap(entry => {
    const next = path.join(relative, entry.name);
    assert.ok(!entry.isSymbolicLink(), next);
    return entry.isDirectory() ? listFiles(base, next) : [next.split(path.sep).join('/')];
  });
}
check('manifesto explícito, sem providers/dependências', () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.mode, 'DRAFT_ONLY');
  assert.equal(manifest.implicitInvocation, false);
  assert.equal(manifest.externalActionsEnabled, false);
  assert.deepEqual(manifest.runtimeDependencies, []);
  assert.deepEqual(manifest.skills.map(x => x.name).sort(), [...names].sort());
  assert.equal(new Set(manifest.newFiles).size, manifest.newFiles.length);
  assert.equal(manifest.baseSha, 'ea63126b5b1d105fe06011c60ee592f2074e6c1c');
  assert.equal(manifest.sources[0].commit, '49dd158d1076134a641b33efb035946536778336');
  assert.equal(manifest.sources[1].commit, '6a124481d0ebe9b6d3ac1323ed2a2abc40c7e1d7');
});
check('33 contratos anteriores preservados', () => {
  assert.equal(manifest.preservedSkills.length, 33);
  for (const item of manifest.preservedSkills) {
    assert.equal(digest(fs.readFileSync(safePath(root, item.path))), item.sha256, item.path);
  }
});
check('licenças MIT exatas e hashes upstream', () => {
  for (const source of manifest.sources.filter(x => x.repository)) {
    assert.equal(source.license, 'MIT');
    assert.match(source.commit, /^[a-f0-9]{40}$/);
    assert.match(source.tree, /^[a-f0-9]{40}$/);
    const bytes = fs.readFileSync(safePath(root, source.localLicense));
    const upstream = source.files.find(f => f.path === 'LICENSE');
    assert.equal(digest(bytes), upstream.sha256);
    assert.equal(gitBlob(bytes), upstream.git_blob_sha1);
    assert.match(bytes.toString(), /MIT License/);
    assert.ok(bytes.toString().includes(source.copyright));
    for (const item of source.files) {
      assert.match(item.git_blob_sha1, /^[a-f0-9]{40}$/);
      assert.match(item.sha256, /^[a-f0-9]{64}$/);
    }
  }
});
const existingNames = new Set();
for (const directory of ['.codex/skills', '.claude/skills']) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    const file = path.join(root, directory, entry.name, 'SKILL.md');
    if (!entry.isDirectory() || !fs.existsSync(file)) continue;
    const match = fs.readFileSync(file, 'utf8').match(/^name:\s*["']?([a-z0-9-]+)/m);
    if (match) existingNames.add(match[1]);
  }
}
for (const name of names) {
  check(`skill ${name}: estrutura, invocação e limites declarados`, () => {
    const base = `.agents/skills/${name}`;
    const skill = read(`${base}/SKILL.md`);
    const yaml = read(`${base}/agents/openai.yaml`);
    assert.ok(!existingNames.has(name), `colisão ${name}`);
    assert.match(skill, new RegExp(`^---\\nname: ${name}\\n`));
    assert.match(skill, /^description:\s*".+"$/m);
    assert.match(skill, /^disable-model-invocation: true$/m);
    assert.match(skill, /^user-invocable: true$/m);
    assert.match(yaml, /^policy:\n  allow_implicit_invocation: false$/m);
    for (const field of ['display_name', 'short_description', 'default_prompt']) {
      assert.match(yaml, new RegExp(`^  ${field}: ".+"$`, 'm'));
    }
    assert.ok(yaml.includes(`$${name}`));
    assert.match(skill, /DRAFT_ONLY/);
    assert.match(skill, /RASCUNHO — NÃO PUBLICADO/);
    for (const term of ['publicar', 'agendar', 'créditos', 'scraping', 'privados', 'CRM', 'VALIDAR']) {
      assert.ok(skill.includes(term), `${name}: cláusula ${term}`);
    }
    assert.match(skill, /não confiáv|dados, não instruções/i);
    assert.match(skill, /aprovação humana/i);
    assert.match(skill, /sandbox/);
    assert.ok(skill.length < 12000, `skill excessiva ${name}`);
    assert.doesNotMatch(skill, /```(?:sh|bash|python|javascript|js)\b/);
    const source = manifest.skills.find(x => x.name === name);
    if (source.sourceCommit) assert.ok(skill.includes(source.sourceCommit));
  });
}
check('arquivos novos limitados a texto e referências locais válidas', () => {
  for (const relative of manifest.newFiles) {
    const target = safePath(root, relative);
    assert.ok(fs.statSync(target).isFile(), relative);
    const text = fs.readFileSync(target, 'utf8');
    assert.ok(!text.includes('\0'), `binário inesperado ${relative}`);
    if (relative.startsWith('.agents/')) {
      assert.ok(/\.(md|yaml|txt)$/.test(relative), relative);
      assert.equal(fs.statSync(target).mode & 0o111, 0, `executável ${relative}`);
    }
    if (!relative.endsWith('.md')) continue;
    for (const match of text.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const link = match[1];
      if (/^https?:\/\//.test(link)) {
        assert.equal(new URL(link).protocol, 'https:', link);
        assert.ok(!new URL(link).username && !new URL(link).password, link);
      } else if (!link.startsWith('#')) {
        const resolved = path.resolve(path.dirname(target), link.split('#')[0]);
        assert.ok(resolved.startsWith(root + path.sep));
        assert.ok(fs.existsSync(resolved), `${relative}: link ausente ${link}`);
      }
    }
  }
  assert.deepEqual(listFiles(path.join(root, '.agents')).map(p => `.agents/${p}`).sort(),
    manifest.newFiles.filter(p => p.startsWith('.agents/')).sort());
});
check('grill-me tem dependência local resolvível e fallback', () => {
  const text = read('.agents/skills/grill-me/SKILL.md');
  assert.match(text, /\[grilling\]\(\.\.\/grilling\/SKILL\.md\)/);
  assert.match(text, /HANDOFF MANUAL NECESSÁRIO/);
  assert.match(text, /Não invoque uma ferramenta chamada `Skill`/);
});
check('humanizer mantém fontes, ressalvas e escolha do autor', () => {
  const text = read('.agents/skills/ig-humanizer/SKILL.md');
  assert.match(text, /citaç|fontes/);
  assert.match(text, /limitaç|ressalv/);
  assert.match(text, /preferência|escolha|voz do autor/);
  assert.doesNotMatch(text, /Wikipedia|three studies|hundreds of|oaicite/i);
});
check('handoff Higgsfield não afirma integração operacional', () => {
  const text = read('.agents/skills/og-ad-multiplier-handoff/SKILL.md');
  assert.match(text, /não é o conector Higgsfield/);
  assert.match(text, /DURAÇÃO NÃO VERIFICADA/);
  assert.match(text, /Preço desconhecido = não executar/);
  assert.ok(!names.includes('ad-multiplier'), 'não sombrear skill do provider');
});
check('cenários fictícios cobrem todas as entradas e ameaças', () => {
  const cases = JSON.parse(read('tests/fixtures/marketing-skills/activation-cases.json'));
  assert.equal(cases.hostDiscoveryClaim, false);
  assert.deepEqual(cases.cases.map(x => x.skill).sort(), [...names].sort());
  assert.ok(cases.adversarialReview.length >= 5);
  assert.ok(cases.cases.every(x => x.request && x.expectation));
});
check('rollback remove somente arquivos novos em fixture isolada', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'og-marketing-rollback-'));
  try {
    const original = new Map([['existing-note.txt', 'PRESERVAR']]);
    for (const item of manifest.preservedSkills) original.set(item.path, read(item.path));
    for (const [relative, text] of original) {
      const target = safePath(temporary, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, text);
    }
    for (const relative of manifest.newFiles) {
      assert.ok(!original.has(relative));
      const target = safePath(temporary, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true }); fs.copyFileSync(safePath(root, relative), target);
    }
    for (const relative of manifest.newFiles) fs.unlinkSync(safePath(temporary, relative));
    assert.deepEqual(listFiles(temporary).sort(), [...original.keys()].sort());
    for (const [relative, text] of original) assert.equal(fs.readFileSync(safePath(temporary, relative), 'utf8'), text);
    assert.throws(() => safePath(temporary, '../fora'));
    assert.throws(() => safePath(temporary, '/fora'));
    fs.symlinkSync(os.tmpdir(), path.join(temporary, 'atalho'));
    assert.throws(() => safePath(temporary, 'atalho/arquivo'));
    fs.unlinkSync(path.join(temporary, 'atalho'));
  } finally {
    // Only the uniquely allocated disposable fixture is cleaned, never the repository/data.
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});
console.log(`\nMarketing Skills V1: ${passed} verificações PASSOU. Ativação nativa/modelo/providers: NÃO TESTADO por este script.`);
