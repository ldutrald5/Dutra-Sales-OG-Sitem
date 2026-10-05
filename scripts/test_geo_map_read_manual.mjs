import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/pending/20261005200000_geo_map_read_manual_locations_v1.sql','utf8');

assert.match(migration,/create table if not exists public\.audit_events/i);
assert.match(migration,/company_locations_audit_v1/i);
assert.match(migration,/upsert_manual_company_location_v1/i);
assert.match(migration,/archive_company_location_v1/i);
assert.match(migration,/company_locations_for_company_v1/i);
assert.match(migration,/map_accounts_in_view_v1/i);
assert.match(migration,/forked_from_location_id/i,'editing automatic provenance must fork rather than erase source history');
assert.match(migration,/address_source in \('CNPJ_REGISTRY','COMPANY_WEBSITE','AI_SUGGESTED','IMPORT'\)/i);
assert.match(migration,/geocode_precision=v_precision/i);
assert.match(migration,/v_precision := 'MANUAL'/i);
assert.match(migration,/v_address_changed/i,'manual location updates must distinguish address edits from label\/metadata edits');
assert.match(migration,/v_geo := v_existing\.geo/i,'non-address edit must preserve an existing valid point');
assert.match(migration,/operator\(extensions\.&&\)/i,'viewport query must use spatial bounding operator');
assert.match(migration,/left join lateral[\s\S]*?sales_opportunities/i);
assert.match(migration,/last_activity_at/i);
assert.match(migration,/overdue_action/i);
assert.match(migration,/UNTOUCHED/);
assert.match(migration,/CONTACTING/);
assert.match(migration,/NEGOTIATION/);
assert.match(migration,/revoke all on function public\.map_accounts_in_view_v1/i);
assert.match(migration,/grant execute on function public\.map_accounts_in_view_v1[\s\S]*?service_role/i);
assert.doesNotMatch(migration,/grant execute on function public\.map_accounts_in_view_v1[\s\S]*?authenticated/i);

console.log('GEO-06R manual location + map read static contract: PASS');
