import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const [actualPathArg, reportPathArg, normalizedActualPathArg, normalizedExpectedPathArg] = process.argv.slice(2);
if (!actualPathArg || !reportPathArg) {
  console.error('usage: node scripts/check_supabase_schema_parity.mjs <actual-fingerprint.json> <report.json> [normalized-actual.json] [normalized-expected.json]');
  process.exit(2);
}

const ROOT = process.cwd();
const SNAPSHOT_DIR = path.resolve(ROOT, 'supabase/recovery/20261003');
const actualPath = path.resolve(actualPathArg);
const reportPath = path.resolve(reportPathArg);
const normalizedActualPath = normalizedActualPathArg ? path.resolve(normalizedActualPathArg) : null;
const normalizedExpectedPath = normalizedExpectedPathArg ? path.resolve(normalizedExpectedPathArg) : null;

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const publicTables = readJson(path.join(SNAPSHOT_DIR, 'remote-public-tables.json'));
const remoteCatalog = readJson(path.join(SNAPSHOT_DIR, 'remote-catalog.json'));
const remoteExtensions = readJson(path.join(SNAPSHOT_DIR, 'remote-extensions.json'));
const actualRaw = readJson(actualPath);

const normalizeText = value => {
  if (value === null || value === undefined) return null;
  return String(value).replace(/\r\n/g, '\n').split('\n').map(line => line.replace(/[ \t]+$/g, '')).join('\n').trim();
};
const normalizeDefault = value => normalizeText(value);
const bool = value => value === true || value === 'true' || value === 't';
const sortRows = (rows, keyFn) => [...rows].sort((a, b) => keyFn(a).localeCompare(keyFn(b)) || JSON.stringify(a).localeCompare(JSON.stringify(b)));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
};
const stableStringify = value => JSON.stringify(stable(value));

const evidenceGaps = [];
for (const required of ['tables']) {
  if (!Array.isArray(publicTables[required])) evidenceGaps.push(`remote-public-tables.json missing ${required}`);
}
for (const required of ['views', 'grants', 'indexes', 'matviews', 'policies', 'triggers', 'functions', 'constraints']) {
  if (!Array.isArray(remoteCatalog[required])) evidenceGaps.push(`remote-catalog.json missing ${required}`);
}
if (!Array.isArray(remoteExtensions.extensions)) evidenceGaps.push('remote-extensions.json missing extensions');

const tableNameParts = full => {
  const value = String(full || '');
  const idx = value.indexOf('.');
  return idx === -1 ? ['public', value] : [value.slice(0, idx), value.slice(idx + 1)];
};

const expectedTables = (publicTables.tables || []).map(table => {
  const [schema_name, table_name] = tableNameParts(table.name);
  if (typeof table.rls_enabled !== 'boolean') evidenceGaps.push(`${table.name}: rls_enabled absent`);
  return { schema_name, table_name, rls_enabled: bool(table.rls_enabled) };
});

const expectedColumns = [];
const expectedIdentityOwners = new Map();
const expectedSequenceRows = [];
for (const table of publicTables.tables || []) {
  const [schema_name, table_name] = tableNameParts(table.name);
  if (!Array.isArray(table.columns)) {
    evidenceGaps.push(`${table.name}: columns absent`);
    continue;
  }
  for (const column of table.columns) {
    const nullable = Array.isArray(column.options) && column.options.includes('nullable');
    const identity_generation = column.identity_generation || null;
    expectedColumns.push({
      schema_name,
      table_name,
      column_name: column.name,
      data_type: column.data_type,
      format: column.format,
      nullable,
      default_value: normalizeDefault(column.default_value ?? null),
      identity_generation,
    });
    const ownerKey = `${schema_name}.${table_name}.${column.name}`;
    if (identity_generation) {
      expectedIdentityOwners.set(ownerKey, identity_generation);
      expectedSequenceRows.push({
        schema_name,
        sequence_name: null,
        owner_schema: schema_name,
        owner_table: table_name,
        owner_column: column.name,
        identity_generation,
      });
    }
    const match = String(column.default_value || '').match(/nextval\('(?:([^']+)\.)?([^'.]+)'::regclass\)/i);
    if (match) {
      expectedSequenceRows.push({
        schema_name: match[1] || schema_name,
        sequence_name: match[2],
        owner_schema: schema_name,
        owner_table: table_name,
        owner_column: column.name,
        identity_generation: null,
      });
    }
  }
}

const expected = {
  tables: sortRows(expectedTables, row => `${row.schema_name}.${row.table_name}`),
  columns: sortRows(expectedColumns, row => `${row.schema_name}.${row.table_name}.${row.column_name}`),
  constraints: sortRows((remoteCatalog.constraints || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    constraint_name: row.constraint_name,
    constraint_type: row.constraint_type,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.table_name}.${row.constraint_name}`),
  indexes: sortRows((remoteCatalog.indexes || []).map(row => ({
    schema_name: row.schemaname,
    table_name: row.tablename,
    index_name: row.indexname,
    definition: normalizeText(row.indexdef),
  })), row => `${row.schema_name}.${row.table_name}.${row.index_name}`),
  views: sortRows((remoteCatalog.views || []).map(row => ({
    schema_name: row.schema_name ?? row.schemaname ?? 'public',
    view_name: row.view_name ?? row.viewname ?? row.name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.view_name}`),
  matviews: sortRows((remoteCatalog.matviews || []).map(row => ({
    schema_name: row.schema_name ?? row.schemaname ?? 'public',
    view_name: row.view_name ?? row.matviewname ?? row.name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.view_name}`),
  routines: sortRows((remoteCatalog.functions || []).map(row => ({
    schema_name: 'public',
    routine_name: row.function_name,
    identity_args: normalizeText(row.identity_args || ''),
    routine_kind: /^CREATE\s+OR\s+REPLACE\s+PROCEDURE\b/i.test(row.definition || '') ? 'PROCEDURE' : 'FUNCTION',
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.routine_name}(${row.identity_args})`),
  triggers: sortRows((remoteCatalog.triggers || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    trigger_name: row.trigger_name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.table_name}.${row.trigger_name}`),
  policies: sortRows((remoteCatalog.policies || []).map(row => ({
    schema_name: row.schema_name ?? row.schemaname ?? 'public',
    table_name: row.table_name ?? row.tablename,
    policy_name: row.policy_name ?? row.policyname,
    permissive: row.permissive ?? null,
    roles: Array.isArray(row.roles) ? [...row.roles].sort() : [],
    command: row.command ?? row.cmd ?? null,
    using_expression: normalizeText(row.using_expression ?? row.qual ?? null),
    check_expression: normalizeText(row.check_expression ?? row.with_check ?? null),
  })), row => `${row.schema_name}.${row.table_name}.${row.policy_name}`),
  grants: sortRows((remoteCatalog.grants || []).map(row => ({
    schema_name: row.table_schema,
    table_name: row.table_name,
    grantee: row.grantee,
    privilege_type: row.privilege_type,
  })), row => `${row.schema_name}.${row.table_name}.${row.grantee}.${row.privilege_type}`),
  extensions: sortRows((remoteExtensions.extensions || []).filter(row => row.installed_version).map(row => ({
    name: row.name,
    schema_name: row.schema,
    installed_version: row.installed_version,
  })), row => row.name),
  sequences: sortRows(expectedSequenceRows, row => `${row.owner_schema}.${row.owner_table}.${row.owner_column}.${row.sequence_name || '<identity>'}`),
};

const actual = {
  tables: sortRows((actualRaw.tables || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    rls_enabled: bool(row.rls_enabled),
  })), row => `${row.schema_name}.${row.table_name}`),
  columns: sortRows((actualRaw.columns || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    column_name: row.column_name,
    data_type: row.data_type,
    format: row.format,
    nullable: bool(row.nullable),
    default_value: normalizeDefault(row.default_value),
    identity_generation: row.identity_generation || null,
  })), row => `${row.schema_name}.${row.table_name}.${row.column_name}`),
  constraints: sortRows((actualRaw.constraints || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    constraint_name: row.constraint_name,
    constraint_type: row.constraint_type,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.table_name}.${row.constraint_name}`),
  indexes: sortRows((actualRaw.indexes || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    index_name: row.index_name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.table_name}.${row.index_name}`),
  views: sortRows((actualRaw.views || []).map(row => ({
    schema_name: row.schema_name,
    view_name: row.view_name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.view_name}`),
  matviews: sortRows((actualRaw.matviews || []).map(row => ({
    schema_name: row.schema_name,
    view_name: row.view_name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.view_name}`),
  routines: sortRows((actualRaw.routines || []).map(row => ({
    schema_name: row.schema_name,
    routine_name: row.routine_name,
    identity_args: normalizeText(row.identity_args || ''),
    routine_kind: row.routine_kind,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.routine_name}(${row.identity_args})`),
  triggers: sortRows((actualRaw.triggers || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    trigger_name: row.trigger_name,
    definition: normalizeText(row.definition),
  })), row => `${row.schema_name}.${row.table_name}.${row.trigger_name}`),
  policies: sortRows((actualRaw.policies || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    policy_name: row.policy_name,
    permissive: row.permissive ?? null,
    roles: Array.isArray(row.roles) ? [...row.roles].sort() : [],
    command: row.command ?? null,
    using_expression: normalizeText(row.using_expression),
    check_expression: normalizeText(row.check_expression),
  })), row => `${row.schema_name}.${row.table_name}.${row.policy_name}`),
  grants: sortRows((actualRaw.grants || []).map(row => ({
    schema_name: row.schema_name,
    table_name: row.table_name,
    grantee: row.grantee,
    privilege_type: row.privilege_type,
  })), row => `${row.schema_name}.${row.table_name}.${row.grantee}.${row.privilege_type}`),
  extensions: sortRows((actualRaw.extensions || []).map(row => ({
    name: row.name,
    schema_name: row.schema_name,
    installed_version: row.installed_version,
  })), row => row.name),
  sequences: [],
};

for (const row of actualRaw.sequences || []) {
  const ownerKey = `${row.owner_schema}.${row.owner_table}.${row.owner_column}`;
  const identityGeneration = expectedIdentityOwners.get(ownerKey) || null;
  actual.sequences.push({
    schema_name: row.schema_name,
    sequence_name: identityGeneration ? null : row.sequence_name,
    owner_schema: row.owner_schema || null,
    owner_table: row.owner_table || null,
    owner_column: row.owner_column || null,
    identity_generation: identityGeneration,
  });
}
actual.sequences = sortRows(actual.sequences, row => `${row.owner_schema}.${row.owner_table}.${row.owner_column}.${row.sequence_name || '<identity>'}`);

const categories = Object.keys(expected);
const differences = [];
const categoryResults = [];
for (const category of categories) {
  const e = stableStringify(expected[category]);
  const a = stableStringify(actual[category]);
  if (e === a) {
    categoryResults.push({ category, classification: 'MATCH', expected_count: expected[category].length, actual_count: actual[category].length });
  } else {
    differences.push({
      category,
      classification: 'UNEXPLAINED_DRIFT',
      expected_count: expected[category].length,
      actual_count: actual[category].length,
      expected: expected[category],
      actual: actual[category],
    });
    categoryResults.push({ category, classification: 'UNEXPLAINED_DRIFT', expected_count: expected[category].length, actual_count: actual[category].length });
  }
}

const expectedNormalized = stable(expected);
const actualNormalized = stable(actual);
const expectedSha = sha256(JSON.stringify(expectedNormalized));
const actualSha = sha256(JSON.stringify(actualNormalized));

const report = {
  schema_version: 1,
  source_snapshot: 'supabase/recovery/20261003',
  scope: {
    schema: 'public',
    grants: 'captured anon/authenticated/service_role table privileges',
    extensions: 'installed extensions present in recovered remote evidence',
    sequences: 'public or public-table-owned sequences, matched by captured column identity/default semantics',
    data_rows: 'out_of_scope',
  },
  fingerprints: {
    expected_sha256: expectedSha,
    actual_sha256: actualSha,
    match: expectedSha === actualSha,
  },
  categories: categoryResults,
  differences,
  summary: {
    match: categoryResults.filter(row => row.classification === 'MATCH').length,
    expected_difference: 0,
    unexplained_drift: differences.length,
    not_verifiable_from_current_evidence: evidenceGaps.length,
  },
  evidence_gaps: evidenceGaps,
  structural_parity: differences.length === 0 && evidenceGaps.length === 0 && expectedSha === actualSha ? 'PASS' : 'FAIL',
};

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
if (normalizedActualPath) {
  fs.mkdirSync(path.dirname(normalizedActualPath), { recursive: true });
  fs.writeFileSync(normalizedActualPath, JSON.stringify(actualNormalized, null, 2) + '\n');
}
if (normalizedExpectedPath) {
  fs.mkdirSync(path.dirname(normalizedExpectedPath), { recursive: true });
  fs.writeFileSync(normalizedExpectedPath, JSON.stringify(expectedNormalized, null, 2) + '\n');
}

console.log(`Schema fingerprint expected: ${expectedSha}`);
console.log(`Schema fingerprint actual:   ${actualSha}`);
console.log(`Structural parity: ${report.structural_parity}`);
console.log(`Unexplained drift: ${report.summary.unexplained_drift}`);
console.log(`Not verifiable: ${report.summary.not_verifiable_from_current_evidence}`);
for (const row of categoryResults) console.log(`${row.classification}: ${row.category} (${row.actual_count}/${row.expected_count})`);
for (const gap of evidenceGaps) console.error(`NOT_VERIFIABLE_FROM_CURRENT_EVIDENCE: ${gap}`);

assert.equal(report.summary.unexplained_drift, 0, 'schema parity contains unexplained drift');
assert.equal(report.summary.not_verifiable_from_current_evidence, 0, 'schema parity evidence is incomplete');
assert.equal(report.fingerprints.match, true, 'schema fingerprints differ');
console.log('Supabase structural schema parity: PASS');
