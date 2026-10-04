
create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  cnpj text unique,
  domain text,
  website text,
  sector text,
  subsector text,
  logo_url text,
  city text,
  state text,
  enrichment_status text not null default 'pending'
    check (enrichment_status in ('pending','enriched','partial','needs_review','failed')),
  enrichment_confidence numeric(5,4)
    check (enrichment_confidence is null or (enrichment_confidence >= 0 and enrichment_confidence <= 1)),
  enrichment_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_domain_unique
  on public.companies (lower(domain))
  where domain is not null;

create index if not exists companies_sector_idx
  on public.companies (sector);

create table if not exists public.vehicle_profiles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  tires_per_vehicle integer not null check (tires_per_vehicle > 0),
  equalizers_per_vehicle numeric(12,4)
    check (equalizers_per_vehicle is null or equalizers_per_vehicle >= 0),
  supports_per_vehicle numeric(12,4)
    check (supports_per_vehicle is null or supports_per_vehicle >= 0),
  avg_monthly_km numeric(14,2)
    check (avg_monthly_km is null or avg_monthly_km >= 0),
  avg_consumption_km_l numeric(10,4)
    check (avg_consumption_km_l is null or avg_consumption_km_l > 0),
  default_tire_price numeric(14,2)
    check (default_tire_price is null or default_tire_price >= 0),
  config_status text not null default 'needs_configuration'
    check (config_status in ('ready','needs_configuration','inactive')),
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_parameter_sets (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  currency text not null default 'BRL',
  diesel_price numeric(12,4)
    check (diesel_price is null or diesel_price >= 0),
  tire_price numeric(14,2)
    check (tire_price is null or tire_price >= 0),
  diesel_savings_min numeric(7,6) not null default 0.02
    check (diesel_savings_min between 0 and 1),
  diesel_savings_default numeric(7,6) not null default 0.02
    check (diesel_savings_default between 0 and 1),
  diesel_savings_max numeric(7,6) not null default 0.06
    check (diesel_savings_max between 0 and 1),
  tire_life_gain numeric(7,6) not null default 0.20
    check (tire_life_gain between 0 and 1),
  equalizer_unit_price numeric(14,2)
    check (equalizer_unit_price is null or equalizer_unit_price >= 0),
  support_unit_price numeric(14,2)
    check (support_unit_price is null or support_unit_price >= 0),
  installation_cost numeric(14,2) not null default 0
    check (installation_cost >= 0),
  annual_operational_cost numeric(14,2) not null default 0
    check (annual_operational_cost >= 0),
  valid_from date not null default current_date,
  valid_until date,
  active boolean not null default true,
  assumptions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (diesel_savings_min <= diesel_savings_default),
  check (diesel_savings_default <= diesel_savings_max),
  check (valid_until is null or valid_until >= valid_from)
);

create table if not exists public.reference_clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  sector text not null,
  subsector text,
  logo_url text,
  website text,
  priority integer not null default 0,
  approved_for_marketing boolean not null default false,
  approval_note text,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reference_clients_sector_priority_idx
  on public.reference_clients (sector, approved_for_marketing, active, priority desc);

create table if not exists public.sector_assets (
  id uuid primary key default gen_random_uuid(),
  sector text not null unique,
  cover_image_url text,
  page2_image_url text,
  page3_image_url text,
  page4_image_url text,
  page5_image_url text,
  visual_theme jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version text not null,
  renderer text not null default 'html_pdf'
    check (renderer in ('html_pdf','apitemplate','bannerbear','placid','other')),
  template_path text,
  schema_version text not null default '1.0.0',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (code, version)
);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete restrict,
  company_name_input text not null,
  fleet_size integer not null check (fleet_size > 0),
  vehicle_profile_id uuid references public.vehicle_profiles(id) on delete restrict,
  financial_parameter_set_id uuid references public.financial_parameter_sets(id) on delete restrict,
  proposal_template_id uuid references public.proposal_templates(id) on delete restrict,
  calculation_version text not null default '1.0.0',
  template_version text not null default '1.0.0',
  status text not null default 'draft'
    check (status in ('draft','enriching','calculating','rendering','ready','sent','failed','archived')),
  total_tires integer check (total_tires is null or total_tires >= 0),
  total_equalizers numeric(14,4) check (total_equalizers is null or total_equalizers >= 0),
  total_supports numeric(14,4) check (total_supports is null or total_supports >= 0),
  investment_total numeric(16,2) check (investment_total is null or investment_total >= 0),
  protected_asset_value numeric(16,2) check (protected_asset_value is null or protected_asset_value >= 0),
  annual_tire_savings numeric(16,2) check (annual_tire_savings is null or annual_tire_savings >= 0),
  annual_fuel_savings numeric(16,2) check (annual_fuel_savings is null or annual_fuel_savings >= 0),
  annual_total_savings numeric(16,2) check (annual_total_savings is null or annual_total_savings >= 0),
  roi_percent numeric(14,4),
  payback_months numeric(14,4) check (payback_months is null or payback_months >= 0),
  proposal_snapshot jsonb not null default '{}'::jsonb,
  pdf_url text,
  error_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists proposals_company_idx
  on public.proposals (company_id, created_at desc);

create index if not exists proposals_status_idx
  on public.proposals (status, created_at desc);

create table if not exists public.proposal_references (
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  reference_client_id uuid not null references public.reference_clients(id) on delete restrict,
  position smallint not null default 1 check (position > 0),
  created_at timestamptz not null default now(),
  primary key (proposal_id, reference_client_id)
);

alter table public.companies enable row level security;
alter table public.vehicle_profiles enable row level security;
alter table public.financial_parameter_sets enable row level security;
alter table public.reference_clients enable row level security;
alter table public.sector_assets enable row level security;
alter table public.proposal_templates enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_references enable row level security;

revoke all on table public.companies from anon, authenticated;
revoke all on table public.vehicle_profiles from anon, authenticated;
revoke all on table public.financial_parameter_sets from anon, authenticated;
revoke all on table public.reference_clients from anon, authenticated;
revoke all on table public.sector_assets from anon, authenticated;
revoke all on table public.proposal_templates from anon, authenticated;
revoke all on table public.proposals from anon, authenticated;
revoke all on table public.proposal_references from anon, authenticated;

grant select, insert, update, delete on table public.companies to service_role;
grant select, insert, update, delete on table public.vehicle_profiles to service_role;
grant select, insert, update, delete on table public.financial_parameter_sets to service_role;
grant select, insert, update, delete on table public.reference_clients to service_role;
grant select, insert, update, delete on table public.sector_assets to service_role;
grant select, insert, update, delete on table public.proposal_templates to service_role;
grant select, insert, update, delete on table public.proposals to service_role;
grant select, insert, update, delete on table public.proposal_references to service_role;

insert into public.vehicle_profiles (
  code, name, tires_per_vehicle, config_status, notes
)
values (
  'rodotrem_9_eixos',
  'Rodotrem — 9 eixos',
  36,
  'needs_configuration',
  '36 pneus confirmados no projeto OG. Quantidades de equalizadores e suportes devem ser configuradas antes de cálculo de investimento.'
)
on conflict (code) do nothing;

insert into public.financial_parameter_sets (
  version,
  diesel_savings_min,
  diesel_savings_default,
  diesel_savings_max,
  tire_life_gain,
  assumptions
)
values (
  '2026.09-initial',
  0.02,
  0.02,
  0.06,
  0.20,
  jsonb_build_object(
    'source', 'OG project baseline',
    'note', 'Preços de diesel, pneu, equalizador e suporte permanecem nulos até validação comercial.'
  )
)
on conflict (version) do nothing;

insert into public.proposal_templates (
  code, version, renderer, schema_version, metadata
)
values (
  'og-premium-5-pages',
  '1.0.0',
  'html_pdf',
  '1.0.0',
  jsonb_build_object(
    'pages', 5,
    'status', 'structure_created_visual_template_pending'
  )
)
on conflict (code, version) do nothing;
