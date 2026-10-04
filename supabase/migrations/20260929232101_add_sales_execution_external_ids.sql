
alter table public.companies add column if not exists legacy_lead_id text;
create unique index if not exists companies_legacy_lead_id_uq
  on public.companies (legacy_lead_id) where legacy_lead_id is not null and btrim(legacy_lead_id) <> '';

alter table public.crm_contacts add column if not exists legacy_contact_id text;
create unique index if not exists crm_contacts_legacy_contact_id_uq
  on public.crm_contacts (legacy_contact_id) where legacy_contact_id is not null and btrim(legacy_contact_id) <> '';

alter table public.sales_opportunities add column if not exists legacy_opportunity_id text;
create unique index if not exists sales_opportunities_legacy_opportunity_id_uq
  on public.sales_opportunities (legacy_opportunity_id) where legacy_opportunity_id is not null and btrim(legacy_opportunity_id) <> '';

alter table public.crm_activities add column if not exists external_id text;
create unique index if not exists crm_activities_external_id_uq
  on public.crm_activities (external_id) where external_id is not null and btrim(external_id) <> '';

alter table public.lead_lists add column if not exists external_id text;
create unique index if not exists lead_lists_external_id_uq
  on public.lead_lists (external_id) where external_id is not null and btrim(external_id) <> '';

alter table public.lead_list_members add column if not exists external_id text;
create unique index if not exists lead_list_members_external_id_uq
  on public.lead_list_members (external_id) where external_id is not null and btrim(external_id) <> '';

alter table public.prospecting_sessions add column if not exists external_id text;
create unique index if not exists prospecting_sessions_external_id_uq
  on public.prospecting_sessions (external_id) where external_id is not null and btrim(external_id) <> '';

alter table public.call_attempts add column if not exists external_id text;
create unique index if not exists call_attempts_external_id_uq
  on public.call_attempts (external_id) where external_id is not null and btrim(external_id) <> '';

alter table public.meetings add column if not exists external_id text;
create unique index if not exists meetings_external_id_uq
  on public.meetings (external_id) where external_id is not null and btrim(external_id) <> '';

alter table public.ai_briefings add column if not exists external_id text;
create unique index if not exists ai_briefings_external_id_uq
  on public.ai_briefings (external_id) where external_id is not null and btrim(external_id) <> '';
