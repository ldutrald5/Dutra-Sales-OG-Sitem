-- GEO-05R — Safe location geocoding application contract.
-- PENDING / NOT APPLIED TO PRODUCTION.
-- Depends on GEO-02R and GEO-03R pending migrations.

create or replace function public.company_location_address_fingerprint_v1(
  p_location_id uuid
)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select md5(concat_ws(
    '|',
    upper(coalesce(l.country_code,'BR')),
    upper(coalesce(l.state,'')),
    lower(coalesce(l.city,'')),
    regexp_replace(coalesce(l.postal_code,''),'[^0-9]','','g'),
    lower(coalesce(l.street,'')),
    lower(coalesce(l.street_number,'')),
    lower(coalesce(l.complement,'')),
    lower(coalesce(l.district,'')),
    lower(coalesce(l.formatted_address,'')),
    lower(coalesce(l.address_raw,''))
  ))
  from public.company_locations l
  where l.id = p_location_id;
$$;

create or replace function public.enqueue_location_geocode_job_v1(
  p_location_id uuid,
  p_force boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_location public.company_locations%rowtype;
  v_fingerprint text;
  v_key text;
  v_job public.enrichment_jobs%rowtype;
begin
  select *
  into v_location
  from public.company_locations
  where id = p_location_id
  for update;

  if not found then raise exception 'company location not found: %', p_location_id; end if;
  if not v_location.is_active then raise exception 'company location is inactive'; end if;

  if coalesce(
    nullif(trim(v_location.street),''),
    nullif(trim(v_location.formatted_address),''),
    nullif(trim(v_location.address_raw),''),
    nullif(trim(v_location.postal_code),''),
    nullif(trim(v_location.city),'')
  ) is null then
    raise exception 'company location has no geocodable address';
  end if;

  if v_location.geo is not null
     and v_location.verification_status in ('VERIFIED_BY_SELLER','VERIFIED_BY_CUSTOMER','VERIFIED_BY_VISIT') then
    return jsonb_build_object(
      'created',false,
      'skipped',true,
      'reason','verified_geo_protected',
      'location_id',v_location.id
    );
  end if;

  v_fingerprint := public.company_location_address_fingerprint_v1(v_location.id);
  v_key := v_location.id::text || ':' || v_fingerprint;

  if not coalesce(p_force,false) then
    select *
    into v_job
    from public.enrichment_jobs
    where company_id = v_location.company_id
      and job_type = 'LOCATION_GEOCODE'
      and idempotency_key = v_key
      and status in ('pending','processing')
    order by created_at desc
    limit 1;

    if found then
      return jsonb_build_object(
        'created',false,
        'job_id',v_job.id,
        'status',v_job.status,
        'location_id',v_location.id,
        'address_fingerprint',v_fingerprint
      );
    end if;
  end if;

  insert into public.enrichment_jobs (
    company_id,
    proposal_id,
    job_type,
    status,
    idempotency_key,
    input
  )
  values (
    v_location.company_id,
    null,
    'LOCATION_GEOCODE',
    'pending',
    v_key,
    jsonb_build_object(
      'location_id',v_location.id,
      'address_fingerprint',v_fingerprint,
      'address',jsonb_build_object(
        'addressRaw',v_location.address_raw,
        'street',v_location.street,
        'number',v_location.street_number,
        'complement',v_location.complement,
        'district',v_location.district,
        'postalCode',v_location.postal_code,
        'city',v_location.city,
        'state',v_location.state,
        'countryCode',v_location.country_code,
        'formattedAddress',v_location.formatted_address
      )
    )
  )
  returning * into v_job;

  return jsonb_build_object(
    'created',true,
    'job_id',v_job.id,
    'status',v_job.status,
    'location_id',v_location.id,
    'address_fingerprint',v_fingerprint
  );
end;
$$;

create or replace function public.apply_location_geocode_v1(
  p_job_id uuid,
  p_result jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.enrichment_jobs%rowtype;
  v_location public.company_locations%rowtype;
  v_location_id uuid;
  v_expected_fingerprint text;
  v_current_fingerprint text;
  v_provider text;
  v_provider_ref text;
  v_precision text;
  v_status text;
  v_attribution text;
  v_lat double precision;
  v_long double precision;
  v_confidence numeric;
  v_provider_signal numeric;
  v_component_score numeric;
  v_verified_protected boolean;
begin
  if jsonb_typeof(coalesce(p_result,'{}'::jsonb)) <> 'object' then
    raise exception 'geocode result must be a JSON object';
  end if;

  select *
  into v_job
  from public.enrichment_jobs
  where id = p_job_id
  for update;

  if not found then raise exception 'enrichment job not found: %', p_job_id; end if;
  if v_job.job_type <> 'LOCATION_GEOCODE' then raise exception 'wrong enrichment job type'; end if;

  v_location_id := nullif(v_job.input->>'location_id','')::uuid;
  v_expected_fingerprint := nullif(v_job.input->>'address_fingerprint','');
  if v_location_id is null or v_expected_fingerprint is null then
    raise exception 'geocode job input is incomplete';
  end if;

  select *
  into v_location
  from public.company_locations
  where id = v_location_id
  for update;

  if not found then
    update public.enrichment_jobs
    set status='failed',
        error_message='location_missing',
        locked_by=null,
        locked_until=null,
        completed_at=now(),
        updated_at=now()
    where id=p_job_id;
    return jsonb_build_object('job_id',p_job_id,'applied',false,'reason','location_missing');
  end if;

  if v_location.company_id <> v_job.company_id then
    raise exception 'geocode job company differs from location company';
  end if;

  v_current_fingerprint := public.company_location_address_fingerprint_v1(v_location.id);
  if v_current_fingerprint is distinct from v_expected_fingerprint then
    update public.enrichment_jobs
    set
      status='completed',
      output=jsonb_build_object(
        'applied',false,
        'stale',true,
        'reason','address_changed',
        'location_id',v_location.id,
        'expected_fingerprint',v_expected_fingerprint,
        'current_fingerprint',v_current_fingerprint
      ),
      error_message=null,
      next_attempt_at=null,
      locked_by=null,
      locked_until=null,
      completed_at=now(),
      updated_at=now()
    where id=p_job_id;

    return jsonb_build_object(
      'job_id',p_job_id,
      'location_id',v_location.id,
      'applied',false,
      'stale',true,
      'reason','address_changed'
    );
  end if;

  v_provider := nullif(trim(p_result->>'provider'),'');
  v_provider_ref := nullif(trim(p_result->>'providerRef'),'');
  v_precision := coalesce(nullif(trim(p_result->>'precision'),''),'UNKNOWN');
  v_status := coalesce(nullif(trim(p_result->>'verificationStatus'),''),'UNVERIFIED');
  v_attribution := nullif(trim(p_result->>'attribution'),'');
  v_lat := nullif(p_result->>'lat','')::double precision;
  v_long := nullif(p_result->>'lng','')::double precision;
  v_confidence := nullif(p_result->>'internalConfidence','')::numeric;
  v_provider_signal := nullif(p_result->>'providerSignal','')::numeric;
  v_component_score := nullif(p_result->>'componentScore','')::numeric;

  if v_precision not in ('ROOFTOP','ADDRESS','STREET','POSTAL_CODE','NEIGHBORHOOD','CITY','REGION','UNKNOWN') then
    raise exception 'invalid geocode precision';
  end if;
  if v_status not in ('AUTO_ACCEPTED','NEEDS_REVIEW','UNVERIFIED') then
    raise exception 'invalid geocode verification status';
  end if;
  if v_confidence is not null and (v_confidence < 0 or v_confidence > 1) then
    raise exception 'invalid internal geocode confidence';
  end if;

  if v_lat is null or v_long is null then
    update public.enrichment_jobs
    set
      provider=v_provider,
      status='needs_review',
      output=jsonb_build_object('applied',false,'no_result',true,'location_id',v_location.id,'provider',v_provider),
      error_message=null,
      next_attempt_at=null,
      locked_by=null,
      locked_until=null,
      completed_at=now(),
      updated_at=now()
    where id=p_job_id;

    return jsonb_build_object('job_id',p_job_id,'location_id',v_location.id,'applied',false,'no_result',true);
  end if;

  if v_lat < -90 or v_lat > 90 or v_long < -180 or v_long > 180 then
    raise exception 'invalid geocode coordinates';
  end if;

  v_verified_protected :=
    v_location.verification_status in ('VERIFIED_BY_SELLER','VERIFIED_BY_CUSTOMER','VERIFIED_BY_VISIT');

  if v_verified_protected and v_location.geo is not null then
    update public.enrichment_jobs
    set
      provider=v_provider,
      status='completed',
      output=jsonb_build_object('applied',false,'protected',true,'reason','verified_geo_protected','location_id',v_location.id),
      error_message=null,
      next_attempt_at=null,
      locked_by=null,
      locked_until=null,
      completed_at=now(),
      updated_at=now()
    where id=p_job_id;

    return jsonb_build_object('job_id',p_job_id,'location_id',v_location.id,'applied',false,'protected',true);
  end if;

  if v_verified_protected and v_status <> 'AUTO_ACCEPTED' then
    update public.enrichment_jobs
    set
      provider=v_provider,
      status='needs_review',
      output=jsonb_build_object(
        'applied',false,
        'protected',true,
        'reason','verified_address_requires_high_confidence_geocode',
        'location_id',v_location.id,
        'candidate',p_result
      ),
      error_message=null,
      next_attempt_at=null,
      locked_by=null,
      locked_until=null,
      completed_at=now(),
      updated_at=now()
    where id=p_job_id;

    return jsonb_build_object(
      'job_id',p_job_id,
      'location_id',v_location.id,
      'applied',false,
      'protected',true,
      'needs_review',true
    );
  end if;

  update public.company_locations
  set
    geo=extensions.st_setsrid(extensions.st_point(v_long,v_lat),4326)::extensions.geography,
    geocode_provider=v_provider,
    geocode_provider_ref=v_provider_ref,
    geocoded_at=now(),
    geocode_precision=v_precision,
    geocode_confidence=v_confidence,
    verification_status=case
      when v_verified_protected then verification_status
      when v_status='AUTO_ACCEPTED' then 'AUTO_ACCEPTED'
      when v_status='NEEDS_REVIEW' then 'NEEDS_REVIEW'
      else 'UNVERIFIED'
    end,
    metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object(
      'geocode',jsonb_build_object(
        'provider',v_provider,
        'provider_ref',v_provider_ref,
        'attribution',v_attribution,
        'provider_signal',v_provider_signal,
        'component_score',v_component_score,
        'job_id',p_job_id
      )
    )
  where id=v_location.id;

  update public.enrichment_jobs
  set
    provider=v_provider,
    status=case when v_status='AUTO_ACCEPTED' then 'completed' else 'needs_review' end,
    output=jsonb_build_object(
      'applied',true,
      'location_id',v_location.id,
      'provider',v_provider,
      'provider_ref',v_provider_ref,
      'precision',v_precision,
      'internal_confidence',v_confidence,
      'verification_status',v_status
    ),
    error_message=null,
    next_attempt_at=null,
    locked_by=null,
    locked_until=null,
    completed_at=now(),
    updated_at=now()
  where id=p_job_id;

  return jsonb_build_object(
    'job_id',p_job_id,
    'location_id',v_location.id,
    'applied',true,
    'precision',v_precision,
    'internal_confidence',v_confidence,
    'verification_status',v_status
  );
end;
$$;

revoke all on function public.company_location_address_fingerprint_v1(uuid) from public,anon,authenticated;
revoke all on function public.enqueue_location_geocode_job_v1(uuid,boolean) from public,anon,authenticated;
revoke all on function public.apply_location_geocode_v1(uuid,jsonb) from public,anon,authenticated;

grant execute on function public.company_location_address_fingerprint_v1(uuid) to service_role;
grant execute on function public.enqueue_location_geocode_job_v1(uuid,boolean) to service_role;
grant execute on function public.apply_location_geocode_v1(uuid,jsonb) to service_role;
