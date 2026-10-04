import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve('supabase/recovery/20261003');
const readJson=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
assert.ok(fs.existsSync(root),'recovery snapshot directory missing');

const manifest=readJson('manifest.json');
const migrations=readJson('remote-migrations.json');
const edgeList=readJson('remote-edge-functions-list.json');
const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');

assert.equal(manifest.schema_version,1);
assert.equal(manifest.safety.executable_migration_chain,false);
assert.equal(manifest.safety.secrets_included,false);
assert.equal(manifest.remote_counts.migrations,25);
assert.equal(manifest.remote_counts.edge_functions,13);
assert.equal(migrations.migrations.length,25);
assert.equal(edgeList.functions.length,13);
assert.equal(manifest.edge_functions.length,13);

const liveSlugs=new Set(edgeList.functions.map(item=>item.slug));
for(const fn of manifest.edge_functions){
  assert.ok(liveSlugs.has(fn.slug),`manifest function not present in live list: ${fn.slug}`);
  for(const file of fn.files){
    const target=path.join(root,'edge-functions',fn.slug,file);
    assert.ok(fs.existsSync(target),`missing recovered source: ${fn.slug}/${file}`);
  }
}

for(const slug of ['sales-execution-gateway','call-intelligence']){
  const canonical=fs.readFileSync(path.resolve('supabase/functions',slug,'index.ts'),'utf8');
  const recovered=fs.readFileSync(path.join(root,'edge-functions',slug,'index.ts'),'utf8');
  assert.equal(recovered,canonical,`${slug} recovered source drifted from canonical main source`);
}

assert.match(readme,/not an executable migration chain/i);
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
for(const file of walk(root)){
  const content=fs.readFileSync(file,'utf8');
  for(const re of risky)assert.equal(re.test(content),false,`secret-like content detected in ${path.relative(root,file)}`);
}
console.log('Supabase recovery snapshot: PASS');
