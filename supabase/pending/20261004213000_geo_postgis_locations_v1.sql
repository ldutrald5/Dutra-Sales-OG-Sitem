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


create or replace function public.enforce_company_location_establishment_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.establishment_id is not null and not exists (
    select 1 from public.company_establishments e
    where e.id = new.establishment_id
      and e.company_id = new.company_id
  ) then
    raise exception 'company_location establishment must belong to the same company'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger company_locations_establishment_guard
before insert or update of company_id, establishment_id
on public.company_locations
for each row execute function public.enforce_company_location_establishment_v1();

create or replace function public.touch_geo_updated_at_v1()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger company_establishments_touch_updated_at
before update on public.company_establishments
for each row execute function public.touch_geo_updated_at_v1();

create trigger company_locations_touch_updated_at
before update on public.company_locations
for each row execute function public.touch_geo_updated_at_v1();

alter table public.company_establishments enable row level security;
alter table public.company_locations enable row level security;

revoke all on table public.company_establishments from anon, authenticated;
revoke all on table public.company_locations from anon, authenticated;
grant select, insert, update, delete on table public.company_establishments to service_role;
grant select, insert, update, delete on table public.company_locations to service_role;

revoke all on function public.is_valid_cnpj_v1(text) from public, anon, authenticated;
grant execute on function public.is_valid_cnpj_v1(text) to service_role;
revoke all on function public.enforce_company_location_establishment_v1() from public, anon, authenticated;
revoke all on function public.touch_geo_updated_at_v1() from public, anon, authenticated;

create or replace function public.company_locations_nearby_v1(
  p_lat double precision,
  p_long double precision,
  p_radius_meters double precision default null,
  p_limit integer default 100
)
returns table (
  location_id uuid,
  company_id uuid,
  establishment_id uuid,
  purpose text,
  label text,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  geocode_precision text,
  geocode_confidence numeric,
  verification_status text,
  distance_meters double precision
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_origin extensions.geography;
  v_limit integer := least(greatest(coalesce(p_limit,100),1),5000);
begin
  if p_lat < -90 or p_lat > 90 or p_long < -180 or p_long > 180 then
    raise exception 'invalid latitude/longitude';
  end if;
  if p_radius_meters is not null and (p_radius_meters < 0 or p_radius_meters > 1000000) then
    raise exception 'invalid radius';
  end if;

  v_origin := extensions.st_setsrid(extensions.st_point(p_long,p_lat),4326)::extensions.geography;

  return query
  select
    l.id,
    l.company_id,
    l.establishment_id,
    l.purpose,
    l.label,
    l.city,
    l.state,
    extensions.st_y(l.geo::extensions.geometry),
    extensions.st_x(l.geo::extensions.geometry),
    l.geocode_precision,
    l.geocode_confidence,
    l.verification_status,
    extensions.st_distance(l.geo,v_origin)
  from public.company_locations l
  where l.is_active
    and l.geo is not null
    and (p_radius_meters is null or extensions.st_dwithin(l.geo,v_origin,p_radius_meters))
  order by l.geo operator(extensions.<->) v_origin
  limit v_limit;
end;
$$;

create or replace function public.company_locations_in_view_v1(
  p_min_lat double precision,
  p_min_long double precision,
  p_max_lat double precision,
  p_max_long double precision,
  p_limit integer default 5000
)
returns table (
  location_id uuid,
  company_id uuid,
  establishment_id uuid,
  purpose text,
  label text,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  geocode_precision text,
  geocode_confidence numeric,
  verification_status text
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_limit integer := least(greatest(coalesce(p_limit,5000),1),10000);
  v_box extensions.geometry;
begin
  if p_min_lat < -90 or p_max_lat > 90 or p_min_long < -180 or p_max_long > 180
     or p_min_lat >= p_max_lat or p_min_long >= p_max_long then
    raise exception 'invalid viewport bounds';
  end if;

  v_box := extensions.st_makeenvelope(p_min_long,p_min_lat,p_max_long,p_max_lat,4326);

  return query
  select
    l.id,
    l.company_id,
    l.establishment_id,
    l.purpose,
    l.label,
    l.city,
    l.state,
    extensions.st_y(l.geo::extensions.geometry),
    extensions.st_x(l.geo::extensions.geometry),
    l.geocode_precision,
    l.geocode_confidence,
    l.verification_status
  from public.company_locations l
  where l.is_active
    and l.geo is not null
    and l.geo::extensions.geometry operator(extensions.&&) v_box
  order by l.updated_at desc, l.id
  limit v_limit;
end;
$$;

revoke all on function public.company_locations_nearby_v1(double precision,double precision,double precision,integer) from public, anon, authenticated;
revoke all on function public.company_locations_in_view_v1(double precision,double precision,double precision,double precision,integer) from public, anon, authenticated;
grant execute on function public.company_locations_nearby_v1(double precision,double precision,double precision,integer) to service_role;
grant execute on function public.company_locations_in_view_v1(double precision,double precision,double precision,double precision,integer) to service_role;

comment on table public.company_establishments is 'Legal CNPJ establishments linked to canonical CRM companies.';
comment on table public.company_locations is 'Physical commercial locations. PostGIS geo is the canonical coordinate source.';
