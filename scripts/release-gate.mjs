import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
assert.equal(Number(process.versions.node.split('.')[0]),24,'Release exige Node 24');
const npmVersion=process.platform==='win32'
  ? execFileSync(process.env.ComSpec||'cmd.exe',['/d','/s','/c','npm.cmd --version'],{encoding:'utf8'}).trim()
  : execFileSync('npm',['--version'],{encoding:'utf8'}).trim();
assert.ok(Number(npmVersion.split('.')[0])>=11,'Release exige npm 11+');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.ok(!pkg.dependencies?.xlsx,'xlsx vulnerável não pode permanecer como dependência npm');
for(const file of ['EXECUTION_CONTEXT.md','CONTEXT_MANIFEST.md','IMPLEMENTATION_PACKAGE_00R_REPORT.md','docs/audits/GITHUB_RECONCILIATION_00R.md','docs/architecture/CANONICAL_MIGRATION_DECISIONS.md','docs/governance/DEFINITION_OF_DONE.md','docs/second-brain/BRAIN_INDEX.md','.github/workflows/package-00r-ci.yml'])assert.ok(fs.existsSync(file),`Arquivo obrigatório ausente: ${file}`);
const app=fs.readFileSync('apps/sistema-og/app.js','utf8');
assert.doesNotMatch(app,/localStorage\.getItem\('og_cloud_access_token'/);
assert.doesNotMatch(app,/forceMerge:true|\/api\/state\?merge=1/);
console.log(`Release gate: PASS (Node ${process.versions.node}, npm ${npmVersion})`);
