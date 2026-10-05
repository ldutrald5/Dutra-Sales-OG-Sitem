import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration=fs.readFileSync('supabase/pending/20261004221000_geo_company_registry_enrichment_v1.sql','utf8');
const edge=fs.readFileSync('supabase/functions/company-registry/index.ts','utf8');
const discovery=fs.readFileSync('supabase/functions/company-discovery/index.ts','utf8');

assert.match(migration,/add column if not exists job_type text not null default 'COMPANY_DISCOVERY'/i);
assert.match(migration,/COMPANY_REGISTRY/);
assert.match(migration,/LOCATION_GEOCODE/);
assert.match(migration,/claim_enrichment_job_v2/i);
assert.match(migration,/enqueue_company_registry_job_v1/i);
assert.match(migration,/apply_company_registry_v1/i);
assert.match(migration,/fail_enrichment_job_v2/i);
assert.match(migration,/fail_enrichment_job_v2[\s\S]*?set search_path = ''\s*as \$\$[\s\S]*?end;\s*\$\$;/i,'retry function must use valid PLpgSQL dollar delimiters');
assert.match(migration,/proposal_side_effect',false/i);
assert.match(migration,/verification_status not in \('VERIFIED_BY_SELLER','VERIFIED_BY_CUSTOMER','VERIFIED_BY_VISIT'\)/i);
assert.match(migration,/geo=null/i,'registry address change must invalidate stale geocode');
assert.match(migration,/claim_enrichment_job_v2\('COMPANY_DISCOVERY'/i,'legacy claim wrapper must isolate discovery jobs');

assert.match(edge,/claim_enrichment_job_v2/);
assert.match(edge,/COMPANY_REGISTRY/);
assert.match(edge,/CNPJWS_API_TOKEN/);
assert.match(edge,/COMPANY_REGISTRY_PROVIDER/);
assert.match(edge,/fail_enrichment_job_v2/);
assert.match(edge,/p_retryable: retryable/);
assert.doesNotMatch(edge,/proposal-pdf|proposal-engine|continuePipeline/i,'registry worker must not trigger proposal side effects');

assert.match(discovery,/claim_enrichment_job_v1/,'existing discovery worker should remain compatible through filtered v1 wrapper');

console.log('GEO-03R registry pipeline static contract: PASS');
