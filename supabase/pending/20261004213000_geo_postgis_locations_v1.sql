-- GEO-02R — PostGIS persistence foundation.
-- PENDING / NOT APPLIED TO PRODUCTION.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

create or replace function public.is_valid_cnpj_v1(p_cnpj text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  v text := regexp_replace(upper(p_cnpj), '[./[:space:]-]', '', 'g');
  v_values integer[] := array[]::integer[];
  v_weights_1 integer[] := array[5,4,3,2,9,8,7,6,5,4,3,2];
  v_weights_2 integer[] := array[6,5,4,3,2,9,8,7,6,5,4,3,2];
  v_sum integer := 0;
  v_remainder integer;
  v_first integer;
  v_second integer;
  i integer;
begin
  if v !~ '^[A-Z0-9]{12}[0-9]{2}$' then return false; end if;
  if v ~ '^[0-9]{14}$' and v = repeat(substr(v,1,1),14) then return false; end if;
  for i in 1..12 loop
    v_values := array_append(v_values, ascii(substr(v,i,1)) - 48);
    v_sum := v_sum + v_values[i] * v_weights_1[i];
  end loop;
  v_remainder := v_sum % 11;
  v_first := case when v_remainder < 2 then 0 else 11 - v_remainder end;
  v_values := array_append(v_values, v_first);
  v_sum := 0;
  for i in 1..13 loop
    v_sum := v_sum + v_values[i] * v_weights_2[i];
  end loop;
  v_remainder := v_sum % 11;
  v_second := case when v_remainder < 2 then 0 else 11 - v_remainder end;
  return substr(v,13,2) = (v_first::text || v_second::text);
end;
$$;

create table if not exists public.company_establishments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  cnpj text not null,
  cnpj_root text generated always as (substr(cnpj,1,8)) stored,
  legal_name text,
  trade_name text,
  establishment_role text not null default 'UNKNOWN',
  registry_status text,
  primary_cnae text,
  opened_at date,
  registry_provider text,
  registry_observed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_establishments_cnpj_canonical_check check (cnpj = upper(cnpj) and cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  constraint company_establishments_cnpj_valid_check check (public.is_valid_cnpj_v1(cnpj)),
  constraint company_establishments_role_check check (establishment_role = any (array['HEADQUARTERS'::text,'BRANCH'::text,'UNKNOWN'::text]))
);

create unique index if not exists company_establishments_cnpj_uq on public.company_establishments (cnpj);
create index if not exists company_establishments_company_idx on public.company_establishments (company_id);
create index if not exists company_establishments_root_idx on public.company_establishments (cnpj_root);
create index if not exists company_establishments_role_idx on public.company_establishments (establishment_role);

create table if not exists public.company_locations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  establishment_id uuid references public.company_establishments(id) on delete set null,
  purpose text not null,
  label text,
  address_raw text,
  street text,
  street_number text,
  complement text,
  district text,
  postal_code text,
  city text,
  city_ibge_code text,
  state text,
  country_code text not null default 'BR',
  formatted_address text,
  geo extensions.geography(Point,4326),
  address_source text not null default 'OTHER',
  source_provider text,
  source_reference text,
  source_observed_at timestamptz,
  geocode_provider text,
  geocode_provider_ref text,
  geocoded_at timestamptz,
  geocode_precision text not null default 'UNKNOWN',
  geocode_confidence numeric,
  verification_status text not null default 'UNVERIFIED',
  verified_by text,
  verified_at timestamptz,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_locations_purpose_check check (purpose = any (array['REGISTERED_ADDRESS'::text,'OPERATIONAL_BASE'::text,'GARAGE'::text,'DISTRIBUTION_CENTER'::text,'OFFICE'::text,'VISIT_POINT'::text,'OTHER'::text])),
  constraint company_locations_address_source_check check (address_source = any (array['CNPJ_REGISTRY'::text,'COMPANY_WEBSITE'::text,'CUSTOMER'::text,'SELLER'::text,'VISIT'::text,'IMPORT'::text,'AI_SUGGESTED'::text,'OTHER'::text])),
  constraint company_locations_geocode_precision_check check (geocode_precision = any (array['ROOFTOP'::text,'ADDRESS'::text,'STREET'::text,'POSTAL_CODE'::text,'NEIGHBORHOOD'::text,'CITY'::text,'REGION'::text,'UNKNOWN'::text,'MANUAL'::text])),
  constraint company_locations_geocode_confidence_check check (geocode_confidence is null or (geocode_confidence >= 0 and geocode_confidence <= 1)),
  constraint company_locations_verification_status_check check (verification_status = any (array['UNVERIFIED'::text,'AUTO_ACCEPTED'::text,'NEEDS_REVIEW'::text,'VERIFIED_BY_SELLER'::text,'VERIFIED_BY_CUSTOMER'::text,'VERIFIED_BY_VISIT'::text,'REJECTED'::text,'STALE'::text])),
  constraint company_locations_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint company_locations_geo_quality_check check (geo is not null or (geocode_precision = 'UNKNOWN' and geocode_confidence is null))
);

create index if not exists company_locations_company_idx on public.company_locations (company_id);
create index if not exists company_locations_establishment_idx on public.company_locations (establishment_id);
create index if not exists company_locations_state_city_idx on public.company_locations (state, city);
create index if not exists company_locations_purpose_active_idx on public.company_locations (purpose, is_active);
create index if not exists company_locations_verification_idx on public.company_locations (verification_status);
create unique index if not exists company_locations_primary_purpose_uq on public.company_locations (company_id, purpose) where is_primary and is_active;
create index if not exists company_locations_geo_gist on public.company_locations using gist (geo);
