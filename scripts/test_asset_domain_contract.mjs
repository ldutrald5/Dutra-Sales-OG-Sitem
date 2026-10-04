import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20261003120000_add_canonical_account_assets.sql', 'utf8');
const adr = fs.readFileSync('docs/architecture/ADR-ASSET-01-CANONICAL-VISUAL-MEMORY.md', 'utf8');

assert.match(migration, /create table if not exists public\.assets\s*\(/i);
assert.match(migration, /create table if not exists public\.asset_versions\s*\(/i);
assert.match(migration, /company_id uuid not null references public\.companies\(id\) on delete restrict/i);
assert.match(migration, /asset_id uuid not null references public\.assets\(id\) on delete cascade/i);
assert.match(migration, /unique \(asset_id, version_number\)/i);
assert.match(migration, /unique \(storage_bucket, storage_path\)/i);
assert.match(migration, /where is_primary = true and status = 'ACTIVE'/i);
assert.match(migration, /storage_bucket text not null default 'account-assets'/i);
assert.doesNotMatch(migration, /insert into storage\.buckets|update storage\.buckets|delete from storage\.buckets/i, 'Storage deve ser provisionado pela API, não por mutação direta do schema storage');
assert.match(migration, /alter table public\.assets enable row level security/i);
assert.match(migration, /alter table public\.asset_versions enable row level security/i);
assert.match(migration, /revoke all on public\.assets from anon, authenticated/i);
assert.match(migration, /revoke all on public\.asset_versions from anon, authenticated/i);
assert.doesNotMatch(migration, /create policy/i, 'ASSET-01 não deve liberar acesso browser antes de Auth\/Organization');
assert.doesNotMatch(migration, /organization_id/i, 'ASSET-01 não deve simular multitenancy somente em Assets');
assert.doesNotMatch(migration, /alter table public\.company_brand_assets/i, 'Brand enrichment deve permanecer separado');
assert.doesNotMatch(migration, /alter table public\.proposal_artifacts/i, 'Artefatos finais de proposta devem permanecer separados');
assert.match(adr, /gateway-only/i);
assert.match(adr, /company_brand_assets/i);
assert.match(adr, /proposal_artifacts/i);
assert.match(adr, /Organization não será simulada apenas em Assets/i);
assert.match(adr, /TERR-01A/i);

console.log('Asset domain contract tests: PASS');
