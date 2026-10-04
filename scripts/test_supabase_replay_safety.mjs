import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationRoot=path.resolve('supabase/migrations');
const files=fs.readdirSync(migrationRoot).filter(name=>name.endsWith('.sql')).sort();

const allowedProjectUrlFile='20260929210734_enable_cron_net_and_internal_token.sql';
const allowedCronFile='20260929210824_schedule_pipeline_recovery_cron_v2.sql';
const productionHost='hlyffyguxqxmgxlevfeq.supabase.co';

for(const file of files){
  const sql=fs.readFileSync(path.join(migrationRoot,file),'utf8');
  const urls=[...sql.matchAll(/https?:\/\/([A-Za-z0-9.-]+)/g)].map(match=>match[1]);
  if(urls.length){
    assert.equal(file,allowedProjectUrlFile,`unexpected literal URL introduced in migration: ${file}`);
    assert.deepEqual([...new Set(urls)],[productionHost],`unexpected URL host in ${file}`);
  }
  if(/\bnet\.http_(?:post|get|delete)\s*\(/i.test(sql)){
    assert.equal(file,allowedCronFile,`direct network-capable SQL introduced outside reviewed cron migration: ${file}`);
    assert.match(sql,/cron\.schedule\s*\(/i);
    assert.match(sql,/\$cron\$[\s\S]*net\.http_post[\s\S]*\$cron\$/i,'network call must remain inside cron command body');
  }
  if(/\bcron\.schedule\s*\(/i.test(sql)){
    assert.equal(file,allowedCronFile,`unexpected cron schedule introduced in migration: ${file}`);
  }
}
console.log('Supabase transactional replay safety scan: PASS');
