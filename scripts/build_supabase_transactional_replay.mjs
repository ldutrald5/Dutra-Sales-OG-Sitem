import fs from 'node:fs';
import path from 'node:path';

const [migrationDirArg, outputArg, fingerprintOutputArg] = process.argv.slice(2);
if (!migrationDirArg || !outputArg) {
  console.error('usage: node scripts/build_supabase_transactional_replay.mjs <migration-dir> <output.sql> [fingerprint-output.json]');
  process.exit(2);
}
const migrationDir = path.resolve(migrationDirArg);
const output = path.resolve(outputArg);
const fingerprintOutput = fingerprintOutputArg ? path.resolve(fingerprintOutputArg) : null;
const migrationFiles = fs.readdirSync(migrationDir).filter(name => name.endsWith('.sql')).sort();
if (migrationFiles.length !== 25) throw new Error(`expected 25 canonical migrations, got ${migrationFiles.length}`);

const snapshot = JSON.parse(fs.readFileSync(path.resolve('supabase/recovery/20261003/remote-public-tables.json'), 'utf8'));
const tableNames = (snapshot.tables || []).map(item => {
  const name = String(item.name || '');
  return name.startsWith('public.') ? name.slice(7) : name;
}).filter(Boolean).sort();
if (!tableNames.length) throw new Error('remote public table snapshot is empty');

const extensionSnapshot = JSON.parse(fs.readFileSync(path.resolve('supabase/recovery/20261003/remote-extensions.json'), 'utf8'));
const installedExtensions = (extensionSnapshot.extensions || []).filter(item => item.installed_version).map(item => String(item.name)).sort();
if (!installedExtensions.length) throw new Error('remote installed extension snapshot is empty');

const catalogSnapshot = JSON.parse(fs.readFileSync(path.resolve('supabase/recovery/20261003/remote-catalog.json'), 'utf8'));
const capturedGrantees = [...new Set((catalogSnapshot.grants || []).map(item => String(item.grantee || '')).filter(Boolean))].sort();
if (!capturedGrantees.length) throw new Error('remote captured grant snapshot is empty');

const quote = value => "'" + String(value).replaceAll("'", "''") + "'";
const expectedArray = 'array[' + tableNames.map(quote).join(',') + ']::text[]';
const extensionArray = 'array[' + installedExtensions.map(quote).join(',') + ']::text[]';
const granteeArray = 'array[' + capturedGrantees.map(quote).join(',') + ']::text[]';

const supplementPath = path.resolve('supabase/recovery/20261003/untracked-live-baseline.sql');
if (!fs.existsSync(supplementPath)) throw new Error('missing untracked live baseline supplement');
const supplement = fs.readFileSync(supplementPath, 'utf8');
const phaseMarker = '-- DUTRA REPLAY PHASE: POST_MIGRATIONS';
const phaseParts = supplement.split(phaseMarker);
if (phaseParts.length !== 2) throw new Error('untracked live baseline must contain exactly one replay phase marker');
const preMigrations = phaseParts[0].trimEnd();
const postMigrations = phaseParts[1].trimStart();

let sql = "\\set ON_ERROR_STOP on\nBEGIN;\n";
sql += "\n-- BEGIN untracked-live-baseline PRE\n" + preMigrations + "\n-- END untracked-live-baseline PRE\n";
for (const file of migrationFiles) {
  sql += `\n-- BEGIN ${file}\n`;
  sql += fs.readFileSync(path.join(migrationDir, file), 'utf8').trimEnd() + "\n";
  sql += `-- END ${file}\n`;
}
sql += "\n-- BEGIN untracked-live-baseline POST\n" + postMigrations.trimEnd() + "\n-- END untracked-live-baseline POST\n";
sql += `
DO $dutra_replay$
declare
  expected text[] := ${expectedArray};
  item text;
  missing text[] := array[]::text[];
begin
  foreach item in array expected loop
    if to_regclass('public.' || quote_ident(item)) is null then
      missing := array_append(missing, item);
    end if;
  end loop;
  if cardinality(missing) > 0 then
    raise exception 'missing expected public tables after replay: %', missing;
  end if;

  if to_regprocedure('public.claim_enrichment_job_v1(text,integer)') is null then
    raise exception 'claim_enrichment_job_v1 missing after replay';
  end if;
  if to_regprocedure('public.apply_company_discovery_v2(uuid,text,text,text,text,text[],text,text,numeric,jsonb,jsonb,text)') is null then
    raise exception 'apply_company_discovery_v2 missing after replay';
  end if;
end
$dutra_replay$;
`;

if (fingerprintOutput) {
  const out = fingerprintOutput.replaceAll('\\', '\\\\').replaceAll("'", "''");
  sql += `
-- BEGIN deterministic structural fingerprint capture
\\pset tuples_only on
\\pset format unaligned
\\o '${out}'
WITH
  fp_tables AS (
    SELECT n.nspname AS schema_name,
           c.relname AS table_name,
           c.relrowsecurity AS rls_enabled
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind IN ('r', 'p')
  ),
  fp_columns AS (
    SELECT c.table_schema AS schema_name,
           c.table_name,
           c.column_name,
           c.data_type,
           c.udt_name AS format,
           (c.is_nullable = 'YES') AS nullable,
           c.column_default AS default_value,
           NULLIF(c.identity_generation, '') AS identity_generation
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
  ),
  fp_constraints AS (
    SELECT n.nspname AS schema_name,
           cls.relname AS table_name,
           con.conname AS constraint_name,
           con.contype::text AS constraint_type,
           pg_get_constraintdef(con.oid, true) AS definition
    FROM pg_constraint con
    JOIN pg_class cls ON cls.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = cls.relnamespace
    WHERE n.nspname = 'public'
  ),
  fp_indexes AS (
    SELECT schemaname AS schema_name,
           tablename AS table_name,
           indexname AS index_name,
           indexdef AS definition
    FROM pg_indexes
    WHERE schemaname = 'public'
  ),
  fp_views AS (
    SELECT schemaname AS schema_name,
           viewname AS view_name,
           definition
    FROM pg_views
    WHERE schemaname = 'public'
  ),
  fp_matviews AS (
    SELECT schemaname AS schema_name,
           matviewname AS view_name,
           definition
    FROM pg_matviews
    WHERE schemaname = 'public'
  ),
  fp_routines AS (
    SELECT n.nspname AS schema_name,
           p.proname AS routine_name,
           pg_get_function_identity_arguments(p.oid) AS identity_args,
           CASE p.prokind WHEN 'p' THEN 'PROCEDURE' ELSE 'FUNCTION' END AS routine_kind,
           pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
  ),
  fp_triggers AS (
    SELECT n.nspname AS schema_name,
           cls.relname AS table_name,
           t.tgname AS trigger_name,
           pg_get_triggerdef(t.oid, true) AS definition
    FROM pg_trigger t
    JOIN pg_class cls ON cls.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = cls.relnamespace
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
  ),
  fp_policies AS (
    SELECT schemaname AS schema_name,
           tablename AS table_name,
           policyname AS policy_name,
           permissive,
           roles,
           cmd AS command,
           qual AS using_expression,
           with_check AS check_expression
    FROM pg_policies
    WHERE schemaname = 'public'
  ),
  fp_grants AS (
    SELECT table_schema AS schema_name,
           table_name,
           grantee,
           privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = ANY (${granteeArray})
  ),
  fp_extensions AS (
    SELECT e.extname AS name,
           n.nspname AS schema_name,
           e.extversion AS installed_version
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = ANY (${extensionArray})
  ),
  fp_sequences AS (
    SELECT seq_ns.nspname AS schema_name,
           seq.relname AS sequence_name,
           owner_ns.nspname AS owner_schema,
           owner_cls.relname AS owner_table,
           owner_att.attname AS owner_column
    FROM pg_class seq
    JOIN pg_namespace seq_ns ON seq_ns.oid = seq.relnamespace
    LEFT JOIN pg_depend dep
      ON dep.classid = 'pg_class'::regclass
     AND dep.objid = seq.oid
     AND dep.refclassid = 'pg_class'::regclass
     AND dep.deptype IN ('a', 'i')
    LEFT JOIN pg_class owner_cls ON owner_cls.oid = dep.refobjid
    LEFT JOIN pg_namespace owner_ns ON owner_ns.oid = owner_cls.relnamespace
    LEFT JOIN pg_attribute owner_att
      ON owner_att.attrelid = owner_cls.oid
     AND owner_att.attnum = dep.refobjsubid
    WHERE seq.relkind = 'S'
      AND (seq_ns.nspname = 'public' OR owner_ns.nspname = 'public')
  )
SELECT jsonb_build_object(
  'tables', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name) FROM fp_tables x), '[]'::jsonb),
  'columns', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name, x.column_name) FROM fp_columns x), '[]'::jsonb),
  'constraints', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name, x.constraint_name) FROM fp_constraints x), '[]'::jsonb),
  'indexes', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name, x.index_name) FROM fp_indexes x), '[]'::jsonb),
  'views', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.view_name) FROM fp_views x), '[]'::jsonb),
  'matviews', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.view_name) FROM fp_matviews x), '[]'::jsonb),
  'routines', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.routine_name, x.identity_args) FROM fp_routines x), '[]'::jsonb),
  'triggers', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name, x.trigger_name) FROM fp_triggers x), '[]'::jsonb),
  'policies', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name, x.policy_name) FROM fp_policies x), '[]'::jsonb),
  'grants', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.schema_name, x.table_name, x.grantee, x.privilege_type) FROM fp_grants x), '[]'::jsonb),
  'extensions', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM fp_extensions x), '[]'::jsonb),
  'sequences', COALESCE((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.owner_schema, x.owner_table, x.owner_column, x.schema_name, x.sequence_name) FROM fp_sequences x), '[]'::jsonb)
)::text;
\\o
-- END deterministic structural fingerprint capture
`;
}

sql += '\nROLLBACK;\n';
fs.writeFileSync(output, sql);
console.log(`Transactional replay SQL built from ${migrationFiles.length} migrations; ${tableNames.length} table assertions${fingerprintOutput ? '; fingerprint capture enabled' : ''}.`);
