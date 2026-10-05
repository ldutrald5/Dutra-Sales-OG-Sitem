-- GEO-05R rollback-only geocoding assertions.

do $geo05$
declare
  v_company uuid := '00000000-0000-4000-8000-000000000501';
  v_location uuid := '00000000-0000-4000-8000-000000000511';
  v_stale_location uuid := '00000000-0000-4000-8000-000000000512';
  v_verified_geo uuid := '00000000-0000-4000-8000-000000000513';
  v_verified_no_geo uuid := '00000000-0000-4000-8000-000000000514';
  v_job uuid;
  v_claim jsonb;
  v_result jsonb;
  v_before geography;
  v_status text;
begin
  insert into public.companies(id,name)
  values (v_company,'GEO-05 Replay');

  insert into public.company_locations(
    id,company_id,purpose,street,street_number,district,postal_code,city,state,country_code,
    formatted_address,address_source,verification_status,is_active
  ) values (
    v_location,v_company,'REGISTERED_ADDRESS','Avenida Brasil','1000','Centro','87000000','Maringá','PR','BR',
    'Avenida Brasil, 1000, Centro, Maringá - PR, 87000000','SELLER','UNVERIFIED',true
  );

  select (public.enqueue_location_geocode_job_v1(v_location,false)->>'job_id')::uuid into v_job;
  if v_job is null then raise exception 'geocode job was not created'; end if;

  if exists (
    select 1 from public.enrichment_jobs
    where id=v_job and (job_type<>'LOCATION_GEOCODE' or proposal_id is not null)
  ) then
    raise exception 'geocode job typed/proposal boundary failed';
  end if;

  v_claim := public.claim_enrichment_job_v2('LOCATION_GEOCODE','geo05-replay',15);
  if v_claim#>>'{job,id}' <> v_job::text then raise exception 'typed geocode claim failed'; end if;

  v_result := public.apply_location_geocode_v1(
    v_job,
    jsonb_build_object(
      'provider','geoapify',
      'providerRef','fixture-1',
      'lat',-23.420999,
      'lng',-51.933056,
      'precision','ADDRESS',
      'internalConfidence',0.95,
      'providerSignal',0.98,
      'componentScore',0.94,
      'verificationStatus','AUTO_ACCEPTED',
      'attribution','fixture attribution'
    )
  );

  if (v_result->>'applied')::boolean is distinct from true then
    raise exception 'valid geocode was not applied';
  end if;

  if not exists (
    select 1 from public.company_locations
    where id=v_location
      and geo is not null
      and geocode_provider='geoapify'
      and geocode_provider_ref='fixture-1'
      and geocode_precision='ADDRESS'
      and geocode_confidence=0.95
      and verification_status='AUTO_ACCEPTED'
  ) then
    raise exception 'geocode persistence fields are incorrect';
  end if;

  -- Stale address protection.
  insert into public.company_locations(
    id,company_id,purpose,street,street_number,city,state,country_code,address_source,verification_status,is_active
  ) values (
    v_stale_location,v_company,'OFFICE','Rua Antiga','10','Maringá','PR','BR','SELLER','UNVERIFIED',true
  );

  select (public.enqueue_location_geocode_job_v1(v_stale_location,false)->>'job_id')::uuid into v_job;
  update public.company_locations set street='Rua Nova' where id=v_stale_location;

  perform public.apply_location_geocode_v1(
    v_job,
    jsonb_build_object(
      'provider','geoapify','providerRef','fixture-stale','lat',-23.42,'lng',-51.93,
      'precision','ADDRESS','internalConfidence',0.92,'providerSignal',0.95,'componentScore',0.90,
      'verificationStatus','AUTO_ACCEPTED'
    )
  );

  if exists (select 1 from public.company_locations where id=v_stale_location and geo is not null) then
    raise exception 'stale-address geocode was incorrectly applied';
  end if;
  if not exists (
    select 1 from public.enrichment_jobs
    where id=v_job and status='completed' and (output->>'stale')::boolean is true
  ) then
    raise exception 'stale-address job was not recorded safely';
  end if;

  -- Existing verified coordinates are protected from automatic re-geocoding.
  insert into public.company_locations(
    id,company_id,purpose,street,street_number,city,state,country_code,address_source,
    verification_status,geo,is_active
  ) values (
    v_verified_geo,v_company,'GARAGE','Rua Confirmada','20','Maringá','PR','BR','VISIT',
    'VERIFIED_BY_VISIT',
    extensions.st_setsrid(extensions.st_point(-51.90,-23.40),4326)::extensions.geography,
    true
  );

  v_result := public.enqueue_location_geocode_job_v1(v_verified_geo,false);
  if coalesce((v_result->>'skipped')::boolean,false) is distinct from true
     or v_result->>'reason' <> 'verified_geo_protected' then
    raise exception 'verified geocode protection failed';
  end if;

  -- A verified address without coordinates may receive only a high-confidence geocode,
  -- while retaining the human verification status.
  insert into public.company_locations(
    id,company_id,purpose,street,street_number,city,state,country_code,address_source,
    verification_status,is_active
  ) values (
    v_verified_no_geo,v_company,'VISIT_POINT','Rua Visitada','30','Maringá','PR','BR','VISIT',
    'VERIFIED_BY_VISIT',true
  );

  select (public.enqueue_location_geocode_job_v1(v_verified_no_geo,false)->>'job_id')::uuid into v_job;
  perform public.claim_enrichment_job_v2('LOCATION_GEOCODE','geo05-replay-verified',15);

  perform public.apply_location_geocode_v1(
    v_job,
    jsonb_build_object(
      'provider','geoapify','providerRef','fixture-verified','lat',-23.41,'lng',-51.91,
      'precision','ADDRESS','internalConfidence',0.94,'providerSignal',0.97,'componentScore',0.93,
      'verificationStatus','AUTO_ACCEPTED'
    )
  );

  select verification_status into v_status from public.company_locations where id=v_verified_no_geo;
  if v_status <> 'VERIFIED_BY_VISIT' then
    raise exception 'human verification status was overwritten by geocoder';
  end if;
  if not exists (select 1 from public.company_locations where id=v_verified_no_geo and geo is not null) then
    raise exception 'high-confidence geocode was not added to verified address';
  end if;
end
$geo05$;
