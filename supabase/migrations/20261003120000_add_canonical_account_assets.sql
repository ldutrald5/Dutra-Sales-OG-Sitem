-- ASSET-01 — Canonical Visual Memory foundation
-- Additive only. This migration is intentionally server/gateway-only until
-- Supabase Auth + Organization is active across the canonical Company model.

begin;

create extension if not exists pgcrypto;

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  asset_type text not null
    check (asset_type in ('IMAGE','DOCUMENT','VIDEO','OTHER')),
  category text not null default 'OTHER'
    check (category in ('LOGO','COVER','FLEET','VEHICLE','INSTALLATION','VISIT','WHATSAPP','PROPOSAL_INPUT','DOCUMENT','OTHER')),
  title text,
  description text,
  source_type text not null default 'UPLOAD'
    check (source_type in ('UPLOAD','CAMERA','WHATSAPP','ENRICHMENT','PROPOSAL','IMPORT','SYSTEM')),
  source_reference text,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE','ARCHIVED','DELETED')),
  is_primary boolean not null default false,
  captured_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (title is null or length(btrim(title)) between 1 and 240),
  check (description is null or length(description) <= 5000),
  check (source_reference is null or length(source_reference) <= 2000)
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
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-fA-F]{64}$'),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  page_count integer check (page_count is null or page_count > 0),
  status text not null default 'PENDING_UPLOAD'
    check (status in ('PENDING_UPLOAD','READY','FAILED','DELETED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (asset_id, version_number),
  unique (storage_bucket, storage_path),
  check (original_filename is null or length(original_filename) between 1 and 500)
);

create index if not exists assets_company_status_created_idx
  on public.assets (company_id, status, created_at desc);

create index if not exists assets_company_category_idx
  on public.assets (company_id, category, status, created_at desc);

create unique index if not exists assets_one_active_primary_per_category_uq
  on public.assets (company_id, category)
  where is_primary = true and status = 'ACTIVE';

create index if not exists asset_versions_asset_version_idx
  on public.asset_versions (asset_id, version_number desc);

create index if not exists asset_versions_sha256_idx
  on public.asset_versions (lower(sha256))
  where sha256 is not null;

alter table public.assets enable row level security;
alter table public.asset_versions enable row level security;

-- Defense in depth: the MVP is gateway-only. No browser grants/policies are
-- created here. service_role remains the trusted server path.
revoke all on public.assets from anon, authenticated;
revoke all on public.asset_versions from anon, authenticated;
grant all on public.assets to service_role;
grant all on public.asset_versions to service_role;

-- The private `account-assets` bucket is provisioned separately through the
-- Supabase Storage API. Do not mutate storage.buckets/storage.objects directly here.

comment on table public.assets is 'Canonical Company-owned visual/commercial memory. Browser access remains disabled until Auth/Organization RLS is active.';
comment on column public.assets.company_id is 'Canonical Company root. Never replace with a legacy lead id.';
comment on column public.assets.is_primary is 'At most one ACTIVE primary Asset per Company/category.';
comment on table public.asset_versions is 'Immutable binary revisions for canonical Assets. Storage objects are managed by a trusted backend.';
comment on column public.asset_versions.storage_path is 'Backend-generated object path; never trust a raw browser path.';

commit;
