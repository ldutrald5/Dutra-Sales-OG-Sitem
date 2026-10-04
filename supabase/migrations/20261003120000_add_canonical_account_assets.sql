-- ASSET-01 — Canonical Visual Memory foundation
-- Additive only. Browser access remains disabled until Auth + Organization
-- is active end-to-end on the canonical Company boundary.

begin;

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,

  title text,
  description text,

  media_kind text not null
    check (media_kind in ('IMAGE','DOCUMENT','VIDEO','AUDIO','ARCHIVE','OTHER')),
  business_category text not null default 'OTHER'
    check (business_category in (
      'LOGO','COVER','FLEET','VEHICLE','TIRE','EQUIPMENT','FACILITY','VISIT',
      'BUSINESS_CARD','CONVERSATION','COMMERCIAL_DOCUMENT','PROPOSAL_MATERIAL',
      'MAP','MARKETING','REFERENCE','SOCIAL_PROOF','OTHER'
    )),
  source_type text not null default 'MANUAL_UPLOAD'
    check (source_type in (
      'MANUAL_UPLOAD','CAMERA','WHATSAPP','CLIENT','VISIT','WEBSITE','GOOGLE_MAPS',
      'PUBLIC_WEB','PROPOSAL','SYSTEM_GENERATED','AI_GENERATED','IMPORT','OTHER'
    )),

  visibility_class text not null default 'INTERNAL'
    check (visibility_class in ('INTERNAL','RESTRICTED','SHAREABLE','PUBLIC_SOURCE')),
  sensitivity_level text not null default 'NORMAL'
    check (sensitivity_level in ('NORMAL','PERSONAL_DATA','COMMERCIAL_SENSITIVE','CONFIDENTIAL')),
  usage_policy text not null default 'INTERNAL_REFERENCE'
    check (usage_policy in ('INTERNAL_REFERENCE','PROPOSAL_ALLOWED','MARKETING_ALLOWED','RESTRICTED')),

  source_url text,
  created_by uuid references auth.users(id) on delete set null,
  captured_at timestamptz,

  current_version_id uuid,
  is_primary boolean not null default false,
  is_verified boolean not null default false,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','ARCHIVED','DELETED')),
  deleted_at timestamptz,

  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (title is null or length(btrim(title)) between 1 and 240),
  check (description is null or length(description) <= 5000),
  check (source_url is null or length(source_url) <= 2000),
  check ((status = 'DELETED' and deleted_at is not null) or status <> 'DELETED')
);

create table if not exists public.asset_versions (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  version_number integer not null check (version_number > 0),

  storage_bucket text not null default 'account-assets'
    check (storage_bucket = 'account-assets'),
  storage_path text not null
    check (length(btrim(storage_path)) between 1 and 1000),

  original_filename text,
  mime_type text not null
    check (length(btrim(mime_type)) between 3 and 160),
  file_extension text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-fA-F]{64}$'),

  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  page_count integer check (page_count is null or page_count > 0),

  processing_status text not null default 'PENDING_UPLOAD'
    check (processing_status in ('PENDING_UPLOAD','READY','FAILED','DELETED')),
  uploaded_by uuid references auth.users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),

  unique (asset_id, version_number),
  unique (storage_bucket, storage_path),
  check (original_filename is null or length(original_filename) between 1 and 500),
  check (file_extension is null or file_extension ~ '^[a-zA-Z0-9]{1,12}$')
);

alter table public.assets
  add constraint assets_current_version_id_fkey
  foreign key (current_version_id)
  references public.asset_versions(id)
  on delete set null
  deferrable initially deferred;

create or replace function public.assert_asset_current_version_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $asset_current_version$
begin
  if new.current_version_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.asset_versions v
    where v.id = new.current_version_id
      and v.asset_id = new.id
      and v.processing_status <> 'DELETED'
  ) then
    raise exception 'current_version_id must reference a live version owned by the same asset'
      using errcode = '23514';
  end if;

  return new;
end;
$asset_current_version$;

revoke all on function public.assert_asset_current_version_ownership() from public;
grant execute on function public.assert_asset_current_version_ownership() to service_role;

create trigger assets_current_version_ownership_guard
before insert or update of current_version_id on public.assets
for each row
execute function public.assert_asset_current_version_ownership();

create index if not exists assets_company_status_created_idx
  on public.assets (company_id, status, created_at desc, id desc);

create index if not exists assets_company_category_idx
  on public.assets (company_id, business_category, status, created_at desc, id desc);

create index if not exists assets_usage_policy_idx
  on public.assets (company_id, usage_policy, status)
  where status = 'ACTIVE';

create unique index if not exists assets_one_active_primary_per_category_uq
  on public.assets (company_id, business_category)
  where is_primary = true and status = 'ACTIVE';

create index if not exists asset_versions_asset_version_idx
  on public.asset_versions (asset_id, version_number desc);

create index if not exists asset_versions_sha256_idx
  on public.asset_versions (lower(sha256))
  where sha256 is not null;

create table if not exists public.asset_links (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,

  contact_id uuid references public.crm_contacts(id) on delete cascade,
  opportunity_id uuid references public.sales_opportunities(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete cascade,
  activity_id uuid references public.crm_activities(id) on delete cascade,

  role text not null default 'ATTACHMENT'
    check (role in ('ATTACHMENT','EVIDENCE','VISIT_PHOTO','PROPOSAL_INPUT','REFERENCE','OTHER')),
  pinned_version_id uuid references public.asset_versions(id) on delete restrict,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  check (num_nonnulls(contact_id, opportunity_id, proposal_id, activity_id) = 1),
  check (proposal_id is null or pinned_version_id is not null)
);

create index if not exists asset_links_asset_idx
  on public.asset_links (asset_id, created_at desc);

create index if not exists asset_links_contact_idx
  on public.asset_links (contact_id)
  where contact_id is not null;

create index if not exists asset_links_opportunity_idx
  on public.asset_links (opportunity_id)
  where opportunity_id is not null;

create index if not exists asset_links_proposal_idx
  on public.asset_links (proposal_id)
  where proposal_id is not null;

create index if not exists asset_links_activity_idx
  on public.asset_links (activity_id)
  where activity_id is not null;

create unique index if not exists asset_links_unique_contact_role_uq
  on public.asset_links (asset_id, contact_id, role)
  where contact_id is not null;

create unique index if not exists asset_links_unique_opportunity_role_uq
  on public.asset_links (asset_id, opportunity_id, role)
  where opportunity_id is not null;

create unique index if not exists asset_links_unique_proposal_role_uq
  on public.asset_links (asset_id, proposal_id, role)
  where proposal_id is not null;

create unique index if not exists asset_links_unique_activity_role_uq
  on public.asset_links (asset_id, activity_id, role)
  where activity_id is not null;

create or replace function public.assert_asset_link_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $asset_link_integrity$
declare
  asset_company uuid;
  target_company uuid;
begin
  select a.company_id into asset_company
  from public.assets a
  where a.id = new.asset_id;

  if asset_company is null then
    raise exception 'asset link requires a canonical asset/company'
      using errcode = '23514';
  end if;

  if new.pinned_version_id is not null and not exists (
    select 1
    from public.asset_versions v
    where v.id = new.pinned_version_id
      and v.asset_id = new.asset_id
      and v.processing_status <> 'DELETED'
  ) then
    raise exception 'pinned_version_id must belong to the linked asset'
      using errcode = '23514';
  end if;

  if new.contact_id is not null then
    select c.company_id into target_company from public.crm_contacts c where c.id = new.contact_id;
  elsif new.opportunity_id is not null then
    select o.company_id into target_company from public.sales_opportunities o where o.id = new.opportunity_id;
  elsif new.proposal_id is not null then
    select p.company_id into target_company from public.proposals p where p.id = new.proposal_id;
  elsif new.activity_id is not null then
    select a.company_id into target_company from public.crm_activities a where a.id = new.activity_id;
  end if;

  if target_company is null or target_company <> asset_company then
    raise exception 'asset link target must belong to the same canonical company'
      using errcode = '23514';
  end if;

  return new;
end;
$asset_link_integrity$;

revoke all on function public.assert_asset_link_integrity() from public;
grant execute on function public.assert_asset_link_integrity() to service_role;

create trigger asset_links_integrity_guard
before insert or update on public.asset_links
for each row
execute function public.assert_asset_link_integrity();

alter table public.assets enable row level security;
alter table public.asset_versions enable row level security;
alter table public.asset_links enable row level security;

revoke all on public.assets from anon, authenticated;
revoke all on public.asset_versions from anon, authenticated;
revoke all on public.asset_links from anon, authenticated;
grant all on public.assets to service_role;
grant all on public.asset_versions to service_role;
grant all on public.asset_links to service_role;

-- Provision the private account-assets bucket through the Storage API.
-- Never INSERT/UPDATE/DELETE storage.buckets or storage.objects from this migration.

comment on table public.assets is 'Canonical Company-owned visual/commercial memory. Browser access disabled until Auth/Organization RLS is active.';
comment on column public.assets.company_id is 'Canonical Company root. Never replace with a legacy lead id.';
comment on column public.assets.current_version_id is 'Current immutable binary revision selected by the trusted Asset Gateway.';
comment on column public.assets.usage_policy is 'Controls reuse intent; PUBLIC_SOURCE visibility does not imply proposal/marketing permission.';
comment on column public.assets.is_primary is 'At most one ACTIVE primary Asset per Company/business_category.';
comment on table public.asset_versions is 'Immutable binary revisions for canonical Assets. Storage objects are managed through the Storage API.';
comment on column public.asset_versions.storage_path is 'Backend-generated object path; never trust a raw browser path.';
comment on table public.asset_links is 'Secondary canonical links from a Company-owned Asset to CRM context. Proposal links pin an exact AssetVersion.';

commit;
