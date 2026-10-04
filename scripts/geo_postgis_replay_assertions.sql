-- GEO-02R disposable replay assertions.
-- Runs inside the rollback-only transaction created by build_supabase_transactional_replay.mjs.

do $geo_assert$
declare
  v_count integer;
  v_cross_company_blocked boolean := false;
begin
  if not exists (select 1 from pg_extension where extname='postgis') then
    raise exception 'PostGIS extension missing after GEO migration';
  end if;

  if to_regclass('public.company_establishments') is null then
    raise exception 'company_establishments missing';
  end if;
  if to_regclass('public.company_locations') is null then
    raise exception 'company_locations missing';
  end if;

  if not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public'
      and c.relname='company_locations'
      and c.relrowsecurity
  ) then
    raise exception 'company_locations RLS not enabled';
  end if;

  if has_table_privilege('anon','public.company_locations','select')
     or has_table_privilege('authenticated','public.company_locations','select') then
    raise exception 'browser roles unexpectedly have direct company_locations privileges';
  end if;

  if not has_table_privilege('service_role','public.company_locations','select') then
    raise exception 'service_role missing company_locations select';
  end if;

  if to_regprocedure('public.company_locations_nearby_v1(double precision,double precision,double precision,integer)') is null then
    raise exception 'nearby RPC missing';
  end if;

  if to_regprocedure('public.company_locations_in_view_v1(double precision,double precision,double precision,double precision,integer)') is null then
    raise exception 'viewport RPC missing';
  end if;

  if not public.is_valid_cnpj_v1('12.ABC.345/01DE-35') then
    raise exception 'alphanumeric CNPJ validation failed in database';
  end if;

  if public.is_valid_cnpj_v1('12.ABC.345/01DE-34') then
    raise exception 'invalid CNPJ accepted by database';
  end if;

  insert into public.companies(id,name)
  values
    ('00000000-0000-4000-8000-000000000201','GEO Replay A'),
    ('00000000-0000-4000-8000-000000000202','GEO Replay B');

  insert into public.company_establishments(
    id,company_id,cnpj,legal_name,establishment_role
  ) values (
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000201',
    '12ABC34501DE35',
    'GEO Replay A LTDA',
    'HEADQUARTERS'
  );

  insert into public.company_locations(
    id,company_id,establishment_id,purpose,label,city,state,
    geo,address_source,geocode_precision,geocode_confidence,verification_status,is_primary
  ) values (
    '00000000-0000-4000-8000-000000000221',
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000211',
    'GARAGE',
    'Garagem Replay',
    'Maringá',
    'PR',
    extensions.st_setsrid(extensions.st_point(-51.933056,-23.420999),4326)::extensions.geography,
    'SELLER',
    'MANUAL',
    1,
    'VERIFIED_BY_SELLER',
    true
  );

  select count(*) into v_count
  from public.company_locations_nearby_v1(-23.420999,-51.933056,100,20)
  where location_id='00000000-0000-4000-8000-000000000221';

  if v_count <> 1 then
    raise exception 'nearby RPC failed to return replay location';
  end if;

  begin
    insert into public.company_locations(
      id,company_id,establishment_id,purpose,address_source
    ) values (
      '00000000-0000-4000-8000-000000000222',
      '00000000-0000-4000-8000-000000000202',
      '00000000-0000-4000-8000-000000000211',
      'OFFICE',
      'SELLER'
    );
  exception
    when check_violation then
      v_cross_company_blocked := true;
  end;

  if not v_cross_company_blocked then
    raise exception 'cross-company establishment link was not blocked';
  end if;
end
$geo_assert$;
