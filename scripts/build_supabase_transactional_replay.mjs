import fs from 'node:fs';
import path from 'node:path';

const [migrationDirArg,outputArg,tailSqlArg]=process.argv.slice(2);
if(!migrationDirArg||!outputArg){
  console.error('usage: node scripts/build_supabase_transactional_replay.mjs <migration-dir> <output.sql> [tail.sql]');
  process.exit(2);
}
const migrationDir=path.resolve(migrationDirArg);
const output=path.resolve(outputArg);
const migrationFiles=fs.readdirSync(migrationDir).filter(name=>name.endsWith('.sql')).sort();
if(migrationFiles.length!==25)throw new Error(`expected 25 canonical migrations, got ${migrationFiles.length}`);

const snapshot=JSON.parse(fs.readFileSync(path.resolve('supabase/recovery/20261003/remote-public-tables.json'),'utf8'));
const tableNames=(snapshot.tables||[]).map(item=>{const name=String(item.name||'');return name.startsWith('public.')?name.slice(7):name;}).filter(Boolean).sort();
if(!tableNames.length)throw new Error('remote public table snapshot is empty');

const quote=value=>"'" + String(value).replaceAll("'","''") + "'";
const expectedArray='array['+tableNames.map(quote).join(',')+']::text[]';

const supplementPath=path.resolve('supabase/recovery/20261003/untracked-live-baseline.sql');
if(!fs.existsSync(supplementPath))throw new Error('missing untracked live baseline supplement');
const supplement=fs.readFileSync(supplementPath,'utf8');
const phaseMarker='-- DUTRA REPLAY PHASE: POST_MIGRATIONS';
const phaseParts=supplement.split(phaseMarker);
if(phaseParts.length!==2)throw new Error('untracked live baseline must contain exactly one replay phase marker');
const preMigrations=phaseParts[0].trimEnd();
const postMigrations=phaseParts[1].trimStart();

let sql="\\set ON_ERROR_STOP on\nBEGIN;\n";
sql+="\n-- BEGIN untracked-live-baseline PRE\n"+preMigrations+"\n-- END untracked-live-baseline PRE\n";
for(const file of migrationFiles){
  sql+=`\n-- BEGIN ${file}\n`;
  sql+=fs.readFileSync(path.join(migrationDir,file),'utf8').trimEnd()+"\n";
  sql+=`-- END ${file}\n`;
}
sql+="\n-- BEGIN untracked-live-baseline POST\n"+postMigrations.trimEnd()+"\n-- END untracked-live-baseline POST\n";
if(tailSqlArg){
  const tailPath=path.resolve(tailSqlArg);
  if(!fs.existsSync(tailPath))throw new Error('tail SQL file not found: '+tailPath);
  sql+="\n-- BEGIN optional replay tail\n"+fs.readFileSync(tailPath,'utf8').trimEnd()+"\n-- END optional replay tail\n";
}
sql+=`
DO $dutra_replay$
declare
  expected text[] := ${expectedArray};
  item text;
  missing text[] := array[]::text[];
begin
  foreach item in array expected loop
    if to_regclass('public.' || quote_ident(item)) is null then
      missing := array_append(missing,item);
    end if;
  end loop;
  if cardinality(missing)>0 then
    raise exception 'missing expected public tables after replay: %',missing;
  end if;

  if to_regprocedure('public.claim_enrichment_job_v1(text,integer)') is null then
    raise exception 'claim_enrichment_job_v1 missing after replay';
  end if;
  if to_regprocedure('public.apply_company_discovery_v2(uuid,text,text,text,text,text[],text,text,numeric,jsonb,jsonb,text)') is null then
    raise exception 'apply_company_discovery_v2 missing after replay';
  end if;
end
$dutra_replay$;

ROLLBACK;
`;
fs.writeFileSync(output,sql);
console.log(`Transactional replay SQL built from ${migrationFiles.length} migrations; ${tableNames.length} table assertions.`);
