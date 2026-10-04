import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const recoveryRoot=path.resolve('supabase/recovery/20261003');
const canonicalMigrationRoot=path.resolve('supabase/migrations');
const canonicalFunctionRoot=path.resolve('supabase/functions');
const pendingRoot=path.resolve('supabase/pending');
const readJson=name=>JSON.parse(fs.readFileSync(path.join(recoveryRoot,name),'utf8'));

assert.ok(fs.existsSync(recoveryRoot),'recovery snapshot directory missing');

const manifest=readJson('manifest.json');
const migrations=readJson('remote-migrations.json');
const edgeList=readJson('remote-edge-functions-list.json');
const readme=fs.readFileSync(path.join(recoveryRoot,'README.md'),'utf8');

assert.equal(manifest.schema_version,1);
assert.equal(manifest.safety.executable_migration_chain,false);
assert.equal(manifest.safety.secrets_included,false);
assert.equal(manifest.remote_counts.migrations,25);
assert.equal(manifest.remote_counts.edge_functions,13);
assert.equal(migrations.migrations.length,25);
assert.equal(edgeList.functions.length,13);
assert.equal(manifest.edge_functions.length,13);

const expectedMigrations=migrations.migrations
  .map(item=>`${item.version}_${item.name}.sql`)
  .sort();
const recoveredMigrationRoot=path.join(recoveryRoot,'migrations-original');
const recoveredMigrations=fs.readdirSync(recoveredMigrationRoot)
  .filter(name=>name.endsWith('.sql'))
  .sort();
const canonicalMigrations=fs.readdirSync(canonicalMigrationRoot)
  .filter(name=>name.endsWith('.sql'))
  .sort();

assert.deepEqual(recoveredMigrations,expectedMigrations,'recovery must contain the exact remote migration file set');
assert.deepEqual(canonicalMigrations,expectedMigrations,'canonical migrations must match the live remote history exactly');

for(const file of expectedMigrations){
  const recovered=fs.readFileSync(path.join(recoveredMigrationRoot,file),'utf8').replace(/\r\n/g,'\n').trim();
  const canonical=fs.readFileSync(path.join(canonicalMigrationRoot,file),'utf8').replace(/\r\n/g,'\n').trim();
  assert.ok(recovered.length>0,`empty recovered migration SQL: ${file}`);
  assert.equal(canonical,recovered,`canonical migration differs from live recovered SQL: ${file}`);
}

const authPilot='20260926233000_auth_organization_pilot.sql';
assert.equal(expectedMigrations.includes(authPilot),false,'Auth pilot must not be represented as applied live history');
assert.ok(fs.existsSync(path.join(pendingRoot,authPilot)),'unapplied Auth pilot must remain explicit under supabase/pending');
assert.equal(fs.existsSync(path.join(canonicalMigrationRoot,authPilot)),false,'unapplied Auth pilot must not sit in canonical applied migration history');

const liveSlugs=new Set(edgeList.functions.map(item=>item.slug));
for(const fn of manifest.edge_functions){
  assert.ok(liveSlugs.has(fn.slug),`manifest function not present in live list: ${fn.slug}`);
  for(const file of fn.files){
    const recoveredPath=path.join(recoveryRoot,'edge-functions',fn.slug,file);
    const canonicalPath=path.join(canonicalFunctionRoot,fn.slug,file);
    assert.ok(fs.existsSync(recoveredPath),`missing recovered source: ${fn.slug}/${file}`);
    assert.ok(fs.existsSync(canonicalPath),`missing canonical source: ${fn.slug}/${file}`);
    assert.equal(
      fs.readFileSync(canonicalPath,'utf8'),
      fs.readFileSync(recoveredPath,'utf8'),
      `canonical Edge Function differs from live recovered source: ${fn.slug}/${file}`
    );
  }
}

assert.match(readme,/original SQL statements stored by Supabase/i);
assert.match(readme,/Never use .*db reset --linked.*production/i);

const risky=[
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bsb_secret_[A-Za-z0-9_-]{16,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/,
  /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/i
];
function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const target=path.join(dir,entry.name);
    return entry.isDirectory()?walk(target):[target];
  });
}
for(const file of walk(recoveryRoot)){
  const content=fs.readFileSync(file,'utf8');
  for(const re of risky)assert.equal(re.test(content),false,`secret-like content detected in ${path.relative(recoveryRoot,file)}`);
}

console.log('Supabase recovery + canonical alignment: PASS');
