-- GEO-03R rollback-only registry pipeline assertions.

do $geo_registry_assert$
declare
  v_company uuid := '00000000-0000-4000-8000-000000000301';
  v_job uuid;
  v_claim jsonb;
  v_apply jsonb;
  v_location uuid;
  v_before text;
  v_after text;
begin
  insert into public.companies(id,name,cnpj)
  values (v_company,'Registry Replay','12ABC34501DE35');

  select (public.enqueue_company_registry_job_v1(v_company,'12.ABC.345/01DE-35',false)->>'job_id')::uuid
  into v_job;

  if v_job is null then raise exception 'registry job was not enqueued'; end if;

  v_claim := public.claim_enrichment_job_v2('COMPANY_REGISTRY','geo-registry-replay',15);
  if v_claim#>>'{job,job_type}' <> 'COMPANY_REGISTRY' then
    raise exception 'typed registry claim failed';
  end if;

  v_apply := public.apply_company_registry_v1(
    v_job,
    jsonb_build_object(
      'provider','brasilapi',
      'observedAt','2026-10-04T23:00:00Z',
      'cnpj','12ABC34501DE35',
      'cnpjRoot','12ABC345',
      'legalName','REGISTRY REPLAY LTDA',
      'tradeName','Registry Replay',
      'establishmentRole','HEADQUARTERS',
      'registryStatus','ATIVA',
      'openedAt','2026-07-31',
      'primaryCnae','4930202',
      'address',jsonb_build_object(
        'raw','Av Teste, 100, Maringá - PR',
        'street','Av Teste',
        'number','100',
        'complement','',
        'district','Industrial',
        'postalCode','87000000',
        'city','Maringá',
        'cityIbgeCode','4115200',
        'state','PR',
        'countryCode','BR',
        'formattedAddress','Av Teste, 100, Industrial, Maringá - PR, 87000000'
      )
    )
  );

  if (v_apply->>'proposal_side_effect')::boolean is distinct from false then
    raise exception 'registry apply unexpectedly reports proposal side effect';
  end if;

  select id into v_location
  from public.company_locations
  where company_id=v_company
    and purpose='REGISTERED_ADDRESS'
    and address_source='CNPJ_REGISTRY'
  limit 1;

  if v_location is null then raise exception 'registered address location missing'; end if;

  update public.company_locations
  set verification_status='VERIFIED_BY_SELLER',
      address_raw='Endereço confirmado manualmente'
  where id=v_location;

  v_before := (select address_raw from public.company_locations where id=v_location);

  select (public.enqueue_company_registry_job_v1(v_company,'12ABC34501DE35',false)->>'job_id')::uuid
  into v_job;
  perform public.claim_enrichment_job_v2('COMPANY_REGISTRY','geo-registry-replay-2',15);

  perform public.apply_company_registry_v1(
    v_job,
    jsonb_build_object(
      'provider','brasilapi',
      'observedAt','2026-10-05T00:00:00Z',
      'cnpj','12ABC34501DE35',
      'legalName','REGISTRY REPLAY LTDA',
      'establishmentRole','HEADQUARTERS',
      'registryStatus','ATIVA',
      'address',jsonb_build_object(
        'raw','Novo endereço automático',
        'street','Rua Nova',
        'number','200',
        'district','Centro',
        'postalCode','87000001',
        'city','Maringá',
        'cityIbgeCode','4115200',
        'state','PR',
        'countryCode','BR',
        'formattedAddress','Rua Nova, 200, Centro, Maringá - PR, 87000001'
      )
    )
  );

  v_after := (select address_raw from public.company_locations where id=v_location);
  if v_after is distinct from v_before then
    raise exception 'verified manual location was overwritten by registry refresh';
  end if;

  if not exists (
    select 1 from public.company_locations
    where company_id=v_company
      and purpose='REGISTERED_ADDRESS'
      and address_source='CNPJ_REGISTRY'
      and address_raw='Novo endereço automático'
      and id<>v_location
  ) then
    raise exception 'registry refresh did not create a reviewable candidate beside verified location';
  end if;

  if exists (
    select 1 from public.enrichment_jobs
    where company_id=v_company
      and job_type='COMPANY_REGISTRY'
      and proposal_id is not null
  ) then
    raise exception 'registry jobs must not attach to proposal pipeline';
  end if;
end
$geo_registry_assert$;
