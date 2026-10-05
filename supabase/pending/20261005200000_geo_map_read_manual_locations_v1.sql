-- GEO-06R — Manual Location management, audit trail and commercial map read model.
-- PENDING / NOT APPLIED TO PRODUCTION.
-- Depends on GEO-02R, GEO-03R and GEO-05R pending migrations.

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  entity_type text not null,
  entity_id text not null,
  action text not null
    check (action in ('INSERT','UPDATE','DELETE','ENRICH','VERIFY','ARCHIVE','OTHER')),
  actor_id text,
  source text not null default 'database',
  old_values jsonb,
  new_values jsonb,
  job_id uuid references public.enrichment_jobs(id) on delete set null,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_entity_idx
  on public.audit_events (entity_type, entity_id, created_at desc);
create index if not exists audit_events_created_idx
  on public.audit_events (created_at desc);
create index if not exists audit_events_job_idx
  on public.audit_events (job_id)
  where job_id is not null;

alter table public.audit_events enable row level security;
revoke all on table public.audit_events from anon, authenticated;
grant select, insert on table public.audit_events to service_role;

create or replace function public.audit_company_location_change_v1()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor text := nullif(current_setting('app.actor_id', true),'');
  v_source text := coalesce(nullif(current_setting('app.audit_source', true),''),'company_location_trigger');
  v_job_raw text := nullif(current_setting('app.job_id', true),'');
  v_job uuid;
  v_entity_id text;
begin
  if v_job_raw is not null then
    begin
      v_job := v_job_raw::uuid;
    exception when others then
      v_job := null;
    end;
  end if;

  v_entity_id := coalesce(new.id, old.id)::text;

  insert into public.audit_events(
    entity_type,entity_id,action,actor_id,source,old_values,new_values,job_id
  )
  values (
    'company_location',
    v_entity_id,
    tg_op,
    v_actor,
    v_source,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end,
    v_job
  );

  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.audit_company_location_change_v1() from public,anon,authenticated;

drop trigger if exists company_locations_audit_v1 on public.company_locations;
create trigger company_locations_audit_v1
after insert or update or delete
on public.company_locations
for each row execute function public.audit_company_location_change_v1();

create or replace function public.upsert_manual_company_location_v1(
  p_company_id uuid,
  p_location_id uuid default null,
  p_establishment_id uuid default null,
  p_purpose text default 'OTHER',
  p_label text default null,
  p_address_raw text default null,
  p_street text default null,
  p_street_number text default null,
  p_complement text default null,
  p_district text default null,
  p_postal_code text default null,
  p_city text default null,
  p_city_ibge_code text default null,
  p_state text default null,
  p_country_code text default 'BR',
  p_formatted_address text default null,
  p_lat double precision default null,
  p_long double precision default null,
  p_address_source text default 'SELLER',
  p_verification_status text default 'VERIFIED_BY_SELLER',
  p_is_primary boolean default false,
  p_actor_id text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_existing public.company_locations%rowtype;
  v_id uuid := p_location_id;
  v_forked_from uuid;
  v_created boolean := false;
  v_geo extensions.geography;
  v_precision text;
  v_confidence numeric;
  v_geocode_provider text;
  v_geocode_provider_ref text;
  v_geocoded_at timestamptz;
  v_verified boolean;
  v_address_changed boolean := true;
begin
  if not exists (select 1 from public.companies where id=p_company_id) then
    raise exception 'company not found: %',p_company_id;
  end if;

  if p_purpose not in ('REGISTERED_ADDRESS','OPERATIONAL_BASE','GARAGE','DISTRIBUTION_CENTER','OFFICE','VISIT_POINT','OTHER') then
    raise exception 'invalid location purpose';
  end if;
  if p_address_source not in ('SELLER','VISIT','CUSTOMER','OTHER') then
    raise exception 'manual location source must be SELLER, VISIT, CUSTOMER or OTHER';
  end if;
  if p_verification_status not in ('UNVERIFIED','NEEDS_REVIEW','VERIFIED_BY_SELLER','VERIFIED_BY_CUSTOMER','VERIFIED_BY_VISIT') then
    raise exception 'invalid manual verification status';
  end if;
  if (p_lat is null) <> (p_long is null) then
    raise exception 'latitude and longitude must be supplied together';
  end if;
  if p_lat is not null and (p_lat < -90 or p_lat > 90 or p_long < -180 or p_long > 180) then
    raise exception 'invalid manual coordinates';
  end if;

  if p_establishment_id is not null and not exists (
    select 1 from public.company_establishments
    where id=p_establishment_id and company_id=p_company_id
  ) then
    raise exception 'establishment does not belong to company';
  end if;

  perform set_config('app.actor_id',coalesce(nullif(trim(p_actor_id),''),'system'),true);
  perform set_config('app.audit_source','manual_location_rpc',true);

  if v_id is not null then
    select *
    into v_existing
    from public.company_locations
    where id=v_id
    for update;

    if not found then raise exception 'company location not found: %',v_id; end if;
    if v_existing.company_id <> p_company_id then raise exception 'location does not belong to company'; end if;

    if v_existing.address_source in ('CNPJ_REGISTRY','COMPANY_WEBSITE','AI_SUGGESTED','IMPORT') then
      v_forked_from := v_existing.id;
      v_id := null;
    else
      v_address_changed :=
        nullif(trim(p_address_raw),'') is distinct from v_existing.address_raw
        or nullif(trim(p_street),'') is distinct from v_existing.street
        or nullif(trim(p_street_number),'') is distinct from v_existing.street_number
        or nullif(trim(p_complement),'') is distinct from v_existing.complement
        or nullif(trim(p_district),'') is distinct from v_existing.district
        or nullif(trim(p_postal_code),'') is distinct from v_existing.postal_code
        or nullif(trim(p_city),'') is distinct from v_existing.city
        or nullif(trim(p_city_ibge_code),'') is distinct from v_existing.city_ibge_code
        or upper(nullif(trim(p_state),'')) is distinct from v_existing.state
        or upper(coalesce(nullif(trim(p_country_code),''),'BR')) is distinct from v_existing.country_code
        or nullif(trim(p_formatted_address),'') is distinct from v_existing.formatted_address;
    end if;
  end if;

  if p_is_primary then
    update public.company_locations
    set is_primary=false
    where company_id=p_company_id
      and purpose=p_purpose
      and is_primary
      and is_active
      and (v_id is null or id<>v_id);
  end if;

  if p_lat is not null then
    v_geo := extensions.st_setsrid(extensions.st_point(p_long,p_lat),4326)::extensions.geography;
    v_precision := 'MANUAL';
    v_confidence := 1;
    v_geocode_provider := 'manual';
    v_geocoded_at := now();
  elsif v_id is not null and not v_address_changed then
    v_geo := v_existing.geo;
    v_precision := v_existing.geocode_precision;
    v_confidence := v_existing.geocode_confidence;
    v_geocode_provider := v_existing.geocode_provider;
    v_geocode_provider_ref := v_existing.geocode_provider_ref;
    v_geocoded_at := v_existing.geocoded_at;
  else
    v_geo := null;
    v_precision := 'UNKNOWN';
    v_confidence := null;
    v_geocode_provider := null;
    v_geocode_provider_ref := null;
    v_geocoded_at := null;
  end if;

  v_verified := p_verification_status in ('VERIFIED_BY_SELLER','VERIFIED_BY_CUSTOMER','VERIFIED_BY_VISIT');

  if v_id is null then
    insert into public.company_locations(
      company_id,establishment_id,purpose,label,address_raw,street,street_number,complement,
      district,postal_code,city,city_ibge_code,state,country_code,formatted_address,geo,
      address_source,source_provider,source_reference,source_observed_at,
      geocode_provider,geocode_provider_ref,geocoded_at,geocode_precision,geocode_confidence,
      verification_status,verified_by,verified_at,is_primary,is_active,metadata
    )
    values (
      p_company_id,p_establishment_id,p_purpose,nullif(trim(p_label),''),nullif(trim(p_address_raw),''),
      nullif(trim(p_street),''),nullif(trim(p_street_number),''),nullif(trim(p_complement),''),
      nullif(trim(p_district),''),nullif(trim(p_postal_code),''),nullif(trim(p_city),''),
      nullif(trim(p_city_ibge_code),''),upper(nullif(trim(p_state),'')),
      upper(coalesce(nullif(trim(p_country_code),''),'BR')),nullif(trim(p_formatted_address),''),
      v_geo,p_address_source,'manual',null,null,
      v_geocode_provider,v_geocode_provider_ref,v_geocoded_at,v_precision,v_confidence,
      p_verification_status,case when v_verified then p_actor_id else null end,
      case when v_verified then now() else null end,p_is_primary,true,
      case when v_forked_from is null then '{}'::jsonb
           else jsonb_build_object('forked_from_location_id',v_forked_from) end
    )
    returning id into v_id;
    v_created := true;
  else
    update public.company_locations
    set
      establishment_id=p_establishment_id,
      purpose=p_purpose,
      label=nullif(trim(p_label),''),
      address_raw=nullif(trim(p_address_raw),''),
      street=nullif(trim(p_street),''),
      street_number=nullif(trim(p_street_number),''),
      complement=nullif(trim(p_complement),''),
      district=nullif(trim(p_district),''),
      postal_code=nullif(trim(p_postal_code),''),
      city=nullif(trim(p_city),''),
      city_ibge_code=nullif(trim(p_city_ibge_code),''),
      state=upper(nullif(trim(p_state),'')),
      country_code=upper(coalesce(nullif(trim(p_country_code),''),'BR')),
      formatted_address=nullif(trim(p_formatted_address),''),
      geo=v_geo,
      address_source=p_address_source,
      source_provider='manual',
      source_reference=null,
      source_observed_at=now(),
      geocode_provider=v_geocode_provider,
      geocode_provider_ref=v_geocode_provider_ref,
      geocoded_at=v_geocoded_at,
      geocode_precision=v_precision,
      geocode_confidence=v_confidence,
      verification_status=p_verification_status,
      verified_by=case when v_verified then p_actor_id else null end,
      verified_at=case when v_verified then now() else null end,
      is_primary=p_is_primary,
      is_active=true
    where id=v_id;
  end if;

  return jsonb_build_object(
    'location_id',v_id,
    'created',v_created,
    'forked',v_forked_from is not null,
    'forked_from_location_id',v_forked_from,
    'manual_coordinates',p_lat is not null,
    'verification_status',p_verification_status
  );
end;
$$;

create or replace function public.archive_company_location_v1(
  p_location_id uuid,
  p_actor_id text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_company_id uuid;
begin
  perform set_config('app.actor_id',coalesce(nullif(trim(p_actor_id),''),'system'),true);
  perform set_config('app.audit_source','manual_location_archive_rpc',true);

  update public.company_locations
  set is_active=false,is_primary=false
  where id=p_location_id
    and is_active
  returning company_id into v_company_id;

  if v_company_id is null then
    raise exception 'active company location not found: %',p_location_id;
  end if;

  return jsonb_build_object('location_id',p_location_id,'company_id',v_company_id,'archived',true);
end;
$$;

create or replace function public.company_locations_for_company_v1(
  p_company_id uuid,
  p_include_inactive boolean default false
)
returns table (
  location_id uuid,
  establishment_id uuid,
  purpose text,
  label text,
  address_raw text,
  formatted_address text,
  city text,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  address_source text,
  geocode_provider text,
  geocode_precision text,
  geocode_confidence numeric,
  verification_status text,
  is_primary boolean,
  is_active boolean,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    l.id,
    l.establishment_id,
    l.purpose,
    l.label,
    l.address_raw,
    l.formatted_address,
    l.city,
    l.state,
    l.postal_code,
    case when l.geo is null then null else extensions.st_y(l.geo::extensions.geometry) end,
    case when l.geo is null then null else extensions.st_x(l.geo::extensions.geometry) end,
    l.address_source,
    l.geocode_provider,
    l.geocode_precision,
    l.geocode_confidence,
    l.verification_status,
    l.is_primary,
    l.is_active,
    l.updated_at
  from public.company_locations l
  where l.company_id=p_company_id
    and (coalesce(p_include_inactive,false) or l.is_active)
  order by l.is_active desc,l.is_primary desc,l.updated_at desc,l.id;
$$;

create or replace function public.map_accounts_in_view_v1(
  p_min_lat double precision,
  p_min_long double precision,
  p_max_lat double precision,
  p_max_long double precision,
  p_relationship_status text default null,
  p_pipeline_stage text default null,
  p_purpose text default null,
  p_verification_status text default null,
  p_priority text default null,
  p_limit integer default 5000
)
returns table (
  location_id uuid,
  company_id uuid,
  company_name text,
  legal_name text,
  cnpj text,
  sector text,
  location_purpose text,
  location_label text,
  city text,
  state text,
  latitude double precision,
  longitude double precision,
  address_source text,
  geocode_precision text,
  geocode_confidence numeric,
  verification_status text,
  account_lifecycle text,
  relationship_status text,
  opportunity_id uuid,
  pipeline_stage text,
  sales_stage_group text,
  fleet_size integer,
  next_action text,
  next_action_due_at timestamptz,
  next_action_priority text,
  last_activity_at timestamptz,
  overdue_action boolean
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_box extensions.geometry;
  v_limit integer := least(greatest(coalesce(p_limit,5000),1),10000);
begin
  if p_min_lat < -90 or p_max_lat > 90 or p_min_long < -180 or p_max_long > 180
     or p_min_lat >= p_max_lat or p_min_long >= p_max_long then
    raise exception 'invalid viewport bounds';
  end if;

  v_box := extensions.st_makeenvelope(p_min_long,p_min_lat,p_max_long,p_max_lat,4326);

  return query
  select
    l.id,
    c.id,
    c.name,
    c.legal_name,
    c.cnpj,
    c.sector,
    l.purpose,
    l.label,
    l.city,
    l.state,
    extensions.st_y(l.geo::extensions.geometry),
    extensions.st_x(l.geo::extensions.geometry),
    l.address_source,
    l.geocode_precision,
    l.geocode_confidence,
    l.verification_status,
    case
      when coalesce(o.relationship_status,c.relationship_status,'UNKNOWN')='CUSTOMER' then 'CUSTOMER'
      when coalesce(o.relationship_status,c.relationship_status,'UNKNOWN')='INACTIVE_CUSTOMER' then 'INACTIVE_CUSTOMER'
      else 'PROSPECT'
    end,
    coalesce(o.relationship_status,c.relationship_status,'UNKNOWN'),
    o.id,
    coalesce(o.pipeline_stage,'PROSPECT'),
    case coalesce(o.pipeline_stage,'PROSPECT')
      when 'PROSPECT' then 'UNTOUCHED'
      when 'CONTACT_ATTEMPTED' then 'CONTACTING'
      when 'CONNECTED' then 'CONTACTING'
      when 'DECISION_MAKER_IDENTIFIED' then 'CONTACTING'
      when 'DECISION_MAKER_CONTACTED' then 'CONTACTING'
      when 'QUALIFIED' then 'QUALIFYING'
      when 'MEETING_TO_SCHEDULE' then 'MEETING'
      when 'MEETING_SCHEDULED' then 'MEETING'
      when 'MEETING_COMPLETED' then 'MEETING'
      when 'PROPOSAL' then 'PROPOSAL'
      when 'NEGOTIATION' then 'NEGOTIATION'
      when 'WON' then 'CLOSED'
      when 'LOST' then 'CLOSED'
      else 'UNTOUCHED'
    end,
    o.fleet_size,
    o.next_action,
    o.next_action_due_at,
    o.next_action_priority,
    a.last_activity_at,
    coalesce(o.next_action_due_at < now() and coalesce(o.pipeline_stage,'PROSPECT') not in ('WON','LOST'),false)
  from public.company_locations l
  join public.companies c on c.id=l.company_id
  left join lateral (
    select so.*
    from public.sales_opportunities so
    where so.company_id=c.id
    order by
      case when coalesce(so.pipeline_stage,'PROSPECT') in ('WON','LOST') then 1 else 0 end,
      so.updated_at desc,
      so.created_at desc,
      so.id
    limit 1
  ) o on true
  left join lateral (
    select max(coalesce(ca.completed_at,ca.created_at)) as last_activity_at
    from public.crm_activities ca
    where ca.company_id=c.id
  ) a on true
  where l.is_active
    and l.geo is not null
    and l.geo::extensions.geometry operator(extensions.&&) v_box
    and (p_relationship_status is null or coalesce(o.relationship_status,c.relationship_status,'UNKNOWN')=p_relationship_status)
    and (p_pipeline_stage is null or coalesce(o.pipeline_stage,'PROSPECT')=p_pipeline_stage)
    and (p_purpose is null or l.purpose=p_purpose)
    and (p_verification_status is null or l.verification_status=p_verification_status)
    and (p_priority is null or o.next_action_priority=p_priority)
  order by
    case o.next_action_priority when 'URGENT' then 1 when 'HIGH' then 2 when 'MEDIUM' then 3 when 'LOW' then 4 else 5 end,
    o.next_action_due_at nulls last,
    c.name,
    l.id
  limit v_limit;
end;
$$;

revoke all on function public.upsert_manual_company_location_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,double precision,double precision,text,text,boolean,text) from public,anon,authenticated;
revoke all on function public.archive_company_location_v1(uuid,text) from public,anon,authenticated;
revoke all on function public.company_locations_for_company_v1(uuid,boolean) from public,anon,authenticated;
revoke all on function public.map_accounts_in_view_v1(double precision,double precision,double precision,double precision,text,text,text,text,text,integer) from public,anon,authenticated;

grant execute on function public.upsert_manual_company_location_v1(uuid,uuid,uuid,text,text,text,text,text,text,text,text,text,text,text,text,text,double precision,double precision,text,text,boolean,text) to service_role;
grant execute on function public.archive_company_location_v1(uuid,text) to service_role;
grant execute on function public.company_locations_for_company_v1(uuid,boolean) to service_role;
grant execute on function public.map_accounts_in_view_v1(double precision,double precision,double precision,double precision,text,text,text,text,text,integer) to service_role;
