import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile('supabase/pending/20260926233000_auth_organization_pilot.sql', 'utf8');
const readme = await readFile('supabase/README.md', 'utf8');

for (const table of ['organizations', 'profiles', 'organization_members']) {
  assert.match(sql, new RegExp(`create table if not exists public\\.${table}`, 'i'), `${table} ausente`);
  assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, 'i'), `RLS ausente em ${table}`);
}
assert.match(sql, /profiles[\s\S]*references auth\.users\(id\) on delete cascade/i);
assert.match(sql, /organization_members[\s\S]*user_id uuid not null references auth\.users\(id\) on delete cascade/i);
assert.match(sql, /primary key \(organization_id, user_id\)/i);
assert.match(sql, /status = 'active'/i);
assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
assert.match(sql, /revoke all on function public\.is_active_organization_member\(uuid\) from public/i);
assert.match(sql, /grant execute on function public\.is_active_organization_member\(uuid\) to authenticated/i);
assert.match(sql, /organizations_select_member[\s\S]*is_active_organization_member\(id\)/i);
assert.match(sql, /profiles_select_self[\s\S]*auth\.uid\(\)[\s\S]*= id/i);
assert.match(sql, /organization_members_select_self[\s\S]*auth\.uid\(\)[\s\S]*= user_id/i);
assert.doesNotMatch(sql, /to anon[\s\S]*using\s*\(true\)/i);
assert.doesNotMatch(sql, /service_role/i, 'Migration do cliente não deve depender de service_role');
assert.match(readme, /não é aplicada automaticamente/i);
assert.match(readme, /não recebe `service_role`/i);
assert.match(readme, /OQ-PKG02-001/);

console.log('Auth organization contract test: PASS');
