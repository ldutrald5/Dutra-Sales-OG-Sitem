-- GEO-03R — typed enrichment jobs + company registry application.
-- PENDING / NOT APPLIED TO PRODUCTION.
-- Depends on GEO-02R company_establishments/company_locations.

alter table public.enrichment_jobs
  add column if not exists job_type text not null default 'COMPANY_DISCOVERY',
  add column if not exists idempotency_key text;

alter table public.enrichment_jobs
  drop constraint if exists enrichment_jobs_job_type_check;

alter table public.enrichment_jobs
  add constraint enrichment_jobs_job_type_check
  check (job_type = any (array[
    'COMPANY_DISCOVERY'::text,
    'COMPANY_REGISTRY'::text,
    'LOCATION_GEOCODE'::text
  ]));

create index if not exists enrichment_jobs_type_status_idx
  on public.enrichment_jobs (job_type, status, next_attempt_at, created_at);

create unique index if not exists enrichment_jobs_active_idempotency_uq
  on public.enrichment_jobs (job_type, company_id, idempotency_key)
  where idempotency_key is not null
    and status in ('pending','processing');

create or replace function public.claim_enrichment_job_v2(
  p_job_type text,
  p_worker text default 'dutra-worker',
  p_lease_minutes integer default 10
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.enrichment_jobs%rowtype;
  v_company public.companies%rowtype;
  v_proposal public.proposals%rowtype;
begin
  if p_job_type not in ('COMPANY_DISCOVERY','COMPANY_REGISTRY','LOCATION_GEOCODE') then
    raise exception 'unsupported enrichment job type: %', p_job_type;
  end if;
  if p_lease_minutes < 1 or p_lease_minutes > 120 then
    raise exception 'lease minutes must be between 1 and 120';
  end if;

  select *
  into v_job
  from public.enrichment_jobs
  where job_type = p_job_type
    and status in ('pending','processing')
    and (next_attempt_at is null or next_attempt_at <= now())
    and (locked_until is null or locked_until <= now())
  order by created_at asc
  for update skip locked
  limit 1;

  if not found then
    return jsonb_build_object('job', null);
  end if;

  update public.enrichment_jobs
  set
    status = 'processing',
    attempts = attempts + 1,
    locked_by = p_worker,
    locked_until = now() + make_interval(mins => p_lease_minutes),
    started_at = coalesce(started_at, now()),
    updated_at = now()
  where id = v_job.id
  returning * into v_job;

  select * into v_company
  from public.companies
  where id = v_job.company_id;

  if v_job.proposal_id is not null then
    select * into v_proposal
    from public.proposals
    where id = v_job.proposal_id;
  end if;

  return jsonb_build_object(
    'job', jsonb_build_object(
      'id', v_job.id,
      'job_type', v_job.job_type,
      'status', v_job.status,
      'attempts', v_job.attempts,
      'locked_by', v_job.locked_by,
      'locked_until', v_job.locked_until,
      'idempotency_key', v_job.idempotency_key,
      'input', v_job.input
    ),
    'company', jsonb_build_object(
      'id', v_company.id,
      'name', v_company.name,
      'legal_name', v_company.legal_name,
      'cnpj', v_company.cnpj,
      'domain', v_company.domain,
      'website', v_company.website,
      'sector', v_company.sector,
      'subsector', v_company.subsector,
      'logo_url', v_company.logo_url
    ),
    'proposal', case when v_job.proposal_id is null then null else jsonb_build_object(
      'id', v_proposal.id,
      'company_name_input', v_proposal.company_name_input,
      'fleet_size', v_proposal.fleet_size,
      'status', v_proposal.status
    ) end
  );
end;
$$;

-- Compatibility wrapper: existing company-discovery workers must never claim
-- registry/geocode jobs.
create or replace function public.claim_enrichment_job_v1(
  p_worker text default 'make',
  p_lease_minutes integer default 10
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select public.claim_enrichment_job_v2('COMPANY_DISCOVERY', p_worker, p_lease_minutes);
$$;

create or replace function public.enqueue_company_registry_job_v1(
  p_company_id uuid,
  p_cnpj text,
  p_force boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cnpj text := regexp_replace(upper(coalesce(p_cnpj,'')), '[./[:space:]-]', '', 'g');
  v_job public.enrichment_jobs%rowtype;
begin
  if not public.is_valid_cnpj_v1(v_cnpj) then
    raise exception 'invalid CNPJ';
  end if;

  if not exists (select 1 from public.companies where id = p_company_id) then
    raise exception 'company not found: %', p_company_id;
  end if;

  select *
  into v_job
  from public.enrichment_jobs
  where company_id = p_company_id
    and job_type = 'COMPANY_REGISTRY'
    and idempotency_key = v_cnpj
    and status in ('pending','processing')
  order by created_at desc
  limit 1;

  if found then
    return jsonb_build_object('created', false, 'job_id', v_job.id, 'status', v_job.status);
  end if;

  insert into public.enrichment_jobs (
    company_id,
    proposal_id,
    job_type,
    status,
    idempotency_key,
    input,
    provider
  )
  values (
    p_company_id,
    null,
    'COMPANY_REGISTRY',
    'pending',
    v_cnpj,
    jsonb_build_object('cnpj', v_cnpj, 'force', coalesce(p_force,false)),
    null
  )
  returning * into v_job;

  return jsonb_build_object('created', true, 'job_id', v_job.id, 'status', v_job.status);
end;
$$;


create or replace function public.fail_enrichment_job_v2(
  p_job_id uuid,
  p_error text,
  p_retryable boolean default true,
  p_retry_minutes integer default 15
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_status text;
begin
  if p_retry_minutes < 0 or p_retry_minutes > 10080 then
    raise exception 'retry minutes must be between 0 and 10080';
  end if;

  update public.enrichment_jobs
  set
    status = case
      when not coalesce(p_retryable,true) then 'failed'
      when attempts >= 3 then 'failed'
      else 'pending'
    end,
    error_message = left(coalesce(p_error,'unknown error'),4000),
    next_attempt_at = case
      when not coalesce(p_retryable,true) or attempts >= 3 then null
      else now() + make_interval(mins => p_retry_minutes)
    end,
    locked_by = null,
    locked_until = null,
    completed_at = case
      when not coalesce(p_retryable,true) or attempts >= 3 then now()
      else completed_at
    end,
    updated_at = now()
  where id = p_job_id
  returning status into v_status;

  if v_status is null then raise exception 'enrichment job not found: %', p_job_id; end if;
  return jsonb_build_object('job_id',p_job_id,'status',v_status,'retryable',coalesce(p_retryable,true));
end;
$$;

create or replace function public.apply_company_registry_v1(
  p_job_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_job public.enrichment_jobs%rowtype;
  v_cnpj text;
  v_provider text;
  v_observed_at timestamptz;
  v_establishment_id uuid;
  v_existing_company_id uuid;
  v_address jsonb;
  v_location_id uuid;
  v_location_action text := 'none';
  v_street text;
  v_number text;
  v_complement text;
  v_district text;
  v_postal_code text;
  v_city text;
  v_city_ibge_code text;
  v_state text;
  v_country_code text;
  v_raw text;
  v_formatted text;
begin
  if jsonb_typeof(coalesce(p_payload,'{}'::jsonb)) <> 'object' then
    raise exception 'registry payload must be a JSON object';
  end if;

  select *
  into v_job
  from public.enrichment_jobs
  where id = p_job_id
  for update;

  if not found then raise exception 'enrichment job not found: %', p_job_id; end if;
  if v_job.job_type <> 'COMPANY_REGISTRY' then raise exception 'wrong enrichment job type'; end if;

  v_cnpj := regexp_replace(upper(coalesce(p_payload->>'cnpj','')), '[./[:space:]-]', '', 'g');
  if not public.is_valid_cnpj_v1(v_cnpj) then raise exception 'registry payload contains invalid CNPJ'; end if;

  if nullif(v_job.input->>'cnpj','') is not null
     and regexp_replace(upper(v_job.input->>'cnpj'), '[./[:space:]-]', '', 'g') <> v_cnpj then
    raise exception 'registry payload CNPJ differs from requested CNPJ';
  end if;

  v_provider := nullif(trim(p_payload->>'provider'),'');
  v_observed_at := coalesce(nullif(p_payload->>'observedAt','')::timestamptz, now());

  select company_id,id
  into v_existing_company_id,v_establishment_id
  from public.company_establishments
  where cnpj = v_cnpj
  limit 1;

  if v_establishment_id is not null and v_existing_company_id <> v_job.company_id then
    raise exception 'CNPJ already belongs to another company';
  end if;

  if v_establishment_id is null then
    insert into public.company_establishments (
      company_id,cnpj,legal_name,trade_name,establishment_role,
      registry_status,primary_cnae,opened_at,registry_provider,registry_observed_at,metadata
    )
    values (
      v_job.company_id,
      v_cnpj,
      nullif(trim(p_payload->>'legalName'),''),
      nullif(trim(p_payload->>'tradeName'),''),
      coalesce(nullif(trim(p_payload->>'establishmentRole'),''),'UNKNOWN'),
      nullif(trim(p_payload->>'registryStatus'),''),
      nullif(trim(p_payload->>'primaryCnae'),''),
      nullif(p_payload->>'openedAt','')::date,
      v_provider,
      v_observed_at,
      jsonb_build_object('registry_provider',v_provider)
    )
    returning id into v_establishment_id;
  else
    update public.company_establishments
    set
      legal_name = coalesce(nullif(trim(p_payload->>'legalName'),''),legal_name),
      trade_name = coalesce(nullif(trim(p_payload->>'tradeName'),''),trade_name),
      establishment_role = coalesce(nullif(trim(p_payload->>'establishmentRole'),''),establishment_role),
      registry_status = coalesce(nullif(trim(p_payload->>'registryStatus'),''),registry_status),
      primary_cnae = coalesce(nullif(trim(p_payload->>'primaryCnae'),''),primary_cnae),
      opened_at = coalesce(nullif(p_payload->>'openedAt','')::date,opened_at),
      registry_provider = coalesce(v_provider,registry_provider),
      registry_observed_at = v_observed_at,
      metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('registry_provider',v_provider)
    where id = v_establishment_id;
  end if;

  update public.companies
  set
    cnpj = coalesce(nullif(cnpj,''),v_cnpj),
    legal_name = coalesce(nullif(legal_name,''),nullif(trim(p_payload->>'legalName'),'')),
    updated_at = now()
  where id = v_job.company_id;

  v_address := coalesce(p_payload->'address','{}'::jsonb);
  v_street := nullif(trim(v_address->>'street'),'');
  v_number := nullif(trim(v_address->>'number'),'');
  v_complement := nullif(trim(v_address->>'complement'),'');
  v_district := nullif(trim(v_address->>'district'),'');
  v_postal_code := nullif(trim(v_address->>'postalCode'),'');
  v_city := nullif(trim(v_address->>'city'),'');
  v_city_ibge_code := nullif(trim(v_address->>'cityIbgeCode'),'');
  v_state := nullif(trim(v_address->>'state'),'');
  v_country_code := coalesce(nullif(trim(v_address->>'countryCode'),''),'BR');
  v_raw := nullif(trim(v_address->>'raw'),'');
  v_formatted := nullif(trim(v_address->>'formattedAddress'),'');

  if coalesce(v_street,v_city,v_postal_code,v_raw) is not null then
    select id
    into v_location_id
    from public.company_locations
    where company_id = v_job.company_id
      and establishment_id = v_establishment_id
      and purpose = 'REGISTERED_ADDRESS'
      and address_source = 'CNPJ_REGISTRY'
      and verification_status not in ('VERIFIED_BY_SELLER','VERIFIED_BY_CUSTOMER','VERIFIED_BY_VISIT')
      and is_active
    order by updated_at desc
    limit 1
    for update;

    if v_location_id is null then
      insert into public.company_locations (
        company_id,establishment_id,purpose,label,address_raw,street,street_number,
        complement,district,postal_code,city,city_ibge_code,state,country_code,
        formatted_address,address_source,source_provider,source_reference,source_observed_at,
        geocode_precision,geocode_confidence,verification_status,is_primary,is_active,metadata
      )
      values (
        v_job.company_id,v_establishment_id,'REGISTERED_ADDRESS','Endereço cadastral',
        v_raw,v_street,v_number,v_complement,v_district,v_postal_code,v_city,v_city_ibge_code,
        upper(v_state),upper(v_country_code),v_formatted,'CNPJ_REGISTRY',v_provider,v_cnpj,v_observed_at,
        'UNKNOWN',null,'UNVERIFIED',false,true,jsonb_build_object('registry_job_id',p_job_id)
      )
      returning id into v_location_id;
      v_location_action := 'inserted';
    else
      update public.company_locations
      set
        address_raw=v_raw,
        street=v_street,
        street_number=v_number,
        complement=v_complement,
        district=v_district,
        postal_code=v_postal_code,
        city=v_city,
        city_ibge_code=v_city_ibge_code,
        state=upper(v_state),
        country_code=upper(v_country_code),
        formatted_address=v_formatted,
        source_provider=v_provider,
        source_reference=v_cnpj,
        source_observed_at=v_observed_at,
        geo=null,
        geocode_provider=null,
        geocode_provider_ref=null,
        geocoded_at=null,
        geocode_precision='UNKNOWN',
        geocode_confidence=null,
        verification_status='UNVERIFIED',
        metadata=coalesce(metadata,'{}'::jsonb) || jsonb_build_object('registry_job_id',p_job_id)
      where id=v_location_id;
      v_location_action := 'updated';
    end if;
  end if;

  insert into public.company_discovery_sources (
    company_id,enrichment_job_id,source_type,provider,source_url,is_official,confidence,extracted
  )
  values (
    v_job.company_id,p_job_id,'registry',coalesce(v_provider,'registry'),null,false,null,p_payload
  );

  update public.enrichment_jobs
  set
    provider=v_provider,
    status='completed',
    output=jsonb_build_object(
      'cnpj',v_cnpj,
      'establishment_id',v_establishment_id,
      'location_id',v_location_id,
      'location_action',v_location_action,
      'provider',v_provider,
      'observed_at',v_observed_at
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
    'company_id',v_job.company_id,
    'cnpj',v_cnpj,
    'establishment_id',v_establishment_id,
    'location_id',v_location_id,
    'location_action',v_location_action,
    'proposal_side_effect',false
  );
end;
$$;

revoke all on function public.claim_enrichment_job_v2(text,text,integer) from public,anon,authenticated;
revoke all on function public.enqueue_company_registry_job_v1(uuid,text,boolean) from public,anon,authenticated;
revoke all on function public.apply_company_registry_v1(uuid,jsonb) from public,anon,authenticated;
revoke all on function public.fail_enrichment_job_v2(uuid,text,boolean,integer) from public,anon,authenticated;

grant execute on function public.claim_enrichment_job_v2(text,text,integer) to service_role;
grant execute on function public.enqueue_company_registry_job_v1(uuid,text,boolean) to service_role;
grant execute on function public.apply_company_registry_v1(uuid,jsonb) to service_role;
grant execute on function public.fail_enrichment_job_v2(uuid,text,boolean,integer) to service_role;
