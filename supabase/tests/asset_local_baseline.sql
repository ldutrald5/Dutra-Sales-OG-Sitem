-- ASSET-E2E local-only canonical baseline.
-- Used only by the free GitHub Actions local Supabase stack.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  legacy_lead_id text unique,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_opportunities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  activity_type text,
  created_at timestamptz not null default now()
);

grant all on public.companies to service_role;
grant all on public.crm_contacts to service_role;
grant all on public.sales_opportunities to service_role;
grant all on public.proposals to service_role;
grant all on public.crm_activities to service_role;
