-- GEO-06R rollback-only manual location/read-model assertions.

do $geo06$
declare
  v_company uuid := '00000000-0000-4000-8000-000000000601';
  v_auto uuid := '00000000-0000-4000-8000-000000000611';
  v_manual uuid;
  v_fork jsonb;
  v_result jsonb;
  v_map_count integer;
  v_group text;
  v_lifecycle text;
  v_overdue boolean;
  v_audit_count integer;
begin
  insert into public.companies(id,name,legal_name,cnpj,relationship_status)
  values (v_company,'GEO-06 Replay','GEO-06 Replay LTDA','12345678000195','NEGOTIATION');

  insert into public.company_locations(
    id,company_id,purpose,label,street,street_number,city,state,country_code,
    address_source,source_provider,verification_status,is_primary,is_active
  ) values (
    v_auto,v_company,'REGISTERED_ADDRESS','Cadastro Receita','Rua Automática','10','Maringá','PR','BR',
    'CNPJ_REGISTRY','brasilapi','UNVERIFIED',true,true
  );

  -- Editing an automatic-source record must create a manual fork.
  v_fork := public.upsert_manual_company_location_v1(
    p_company_id=>v_company,
    p_location_id=>v_auto,
    p_purpose=>'GARAGE',
    p_label=>'Garagem confirmada',
    p_address_raw=>'Avenida Manual, 200, Maringá - PR',
    p_street=>'Avenida Manual',
    p_street_number=>'200',
    p_district=>'Industrial',
    p_postal_code=>'87000000',
    p_city=>'Maringá',
    p_state=>'PR',
    p_country_code=>'BR',
    p_formatted_address=>'Avenida Manual, 200, Industrial, Maringá - PR, 87000000',
    p_lat=>-23.420999,
    p_long=>-51.933056,
    p_address_source=>'SELLER',
    p_verification_status=>'VERIFIED_BY_SELLER',
    p_is_primary=>true,
    p_actor_id=>'seller-replay'
  );

  v_manual := (v_fork->>'location_id')::uuid;

  if coalesce((v_fork->>'forked')::boolean,false) is distinct from true then
    raise exception 'automatic location edit did not fork';
  end if;
  if v_manual=v_auto then raise exception 'manual fork reused automatic location id'; end if;

  if not exists (
    select 1 from public.company_locations
    where id=v_auto and address_source='CNPJ_REGISTRY' and street='Rua Automática'
  ) then
    raise exception 'automatic source row was overwritten';
  end if;

  if not exists (
    select 1 from public.company_locations
    where id=v_manual
      and address_source='SELLER'
      and verification_status='VERIFIED_BY_SELLER'
      and geocode_precision='MANUAL'
      and geocode_confidence=1
      and geocode_provider='manual'
      and geo is not null
      and is_primary
  ) then
    raise exception 'manual location persistence is incorrect';
  end if;

  select count(*) into v_audit_count
  from public.audit_events
  where entity_type='company_location'
    and entity_id=v_manual::text
    and action='INSERT'
    and source='manual_location_rpc';

  if v_audit_count<>1 then raise exception 'manual location insert audit missing'; end if;

  -- A non-address edit must preserve an already valid point instead of erasing it.
  perform public.upsert_manual_company_location_v1(
    p_company_id=>v_company,
    p_location_id=>v_manual,
    p_purpose=>'GARAGE',
    p_label=>'Garagem confirmada · principal',
    p_address_raw=>'Avenida Manual, 200, Maringá - PR',
    p_street=>'Avenida Manual',
    p_street_number=>'200',
    p_complement=>null,
    p_district=>'Industrial',
    p_postal_code=>'87000000',
    p_city=>'Maringá',
    p_city_ibge_code=>null,
    p_state=>'PR',
    p_country_code=>'BR',
    p_formatted_address=>'Avenida Manual, 200, Industrial, Maringá - PR, 87000000',
    p_address_source=>'SELLER',
    p_verification_status=>'VERIFIED_BY_SELLER',
    p_is_primary=>true,
    p_actor_id=>'seller-replay'
  );

  if not exists (
    select 1 from public.company_locations
    where id=v_manual
      and geo is not null
      and geocode_provider='manual'
      and geocode_precision='MANUAL'
      and geocode_confidence=1
  ) then
    raise exception 'non-address manual edit erased valid coordinates';
  end if;

  insert into public.sales_opportunities(
    id,company_id,source,stage,fleet_size,next_action,next_action_due_at,pipeline_stage,
    relationship_status,next_action_priority
  ) values (
    '00000000-0000-4000-8000-000000000621',
    v_company,'manual','negotiation',50,'Ligar para decisor',now()-interval '1 day',
    'NEGOTIATION','NEGOTIATION','HIGH'
  );

  insert into public.crm_activities(
    id,company_id,activity_type,status,title,completed_at
  ) values (
    '00000000-0000-4000-8000-000000000631',
    v_company,'call','completed','Ligação anterior',now()-interval '2 days'
  );

  select count(*),max(sales_stage_group),max(account_lifecycle),bool_or(overdue_action)
  into v_map_count,v_group,v_lifecycle,v_overdue
  from public.map_accounts_in_view_v1(
    -24,-53,-22,-50,
    null,'NEGOTIATION','GARAGE','VERIFIED_BY_SELLER','HIGH',100
  )
  where company_id=v_company and location_id=v_manual;

  if v_map_count<>1 then raise exception 'map viewport read did not return manual location'; end if;
  if v_group<>'NEGOTIATION' then raise exception 'sales stage group derivation failed: %',v_group; end if;
  if v_lifecycle<>'PROSPECT' then raise exception 'account lifecycle should remain prospect before CUSTOMER status'; end if;
  if v_overdue is distinct from true then raise exception 'overdue next action was not derived'; end if;

  update public.companies set relationship_status='CUSTOMER' where id=v_company;
  update public.sales_opportunities set relationship_status='CUSTOMER' where company_id=v_company;

  select max(account_lifecycle)
  into v_lifecycle
  from public.map_accounts_in_view_v1(-24,-53,-22,-50,null,null,null,null,null,100)
  where company_id=v_company and location_id=v_manual;

  if v_lifecycle<>'CUSTOMER' then raise exception 'customer lifecycle derivation failed'; end if;

  if (select count(*) from public.company_locations_for_company_v1(v_company,false))<>2 then
    raise exception 'company locations listing did not preserve automatic + manual locations';
  end if;

  -- Full manual address edit without a replacement pin deliberately clears old coordinates.
  perform public.upsert_manual_company_location_v1(
    p_company_id=>v_company,
    p_location_id=>v_manual,
    p_purpose=>'GARAGE',
    p_label=>'Garagem atualizada',
    p_address_raw=>'Avenida Manual Nova, 300, Maringá - PR',
    p_street=>'Avenida Manual Nova',
    p_street_number=>'300',
    p_city=>'Maringá',
    p_state=>'PR',
    p_country_code=>'BR',
    p_address_source=>'SELLER',
    p_verification_status=>'VERIFIED_BY_SELLER',
    p_is_primary=>true,
    p_actor_id=>'seller-replay'
  );

  if exists (select 1 from public.company_locations where id=v_manual and geo is not null) then
    raise exception 'manual address change retained stale coordinates';
  end if;

  if not exists (
    select 1 from public.audit_events
    where entity_type='company_location' and entity_id=v_manual::text and action='UPDATE'
  ) then
    raise exception 'manual location update audit missing';
  end if;

  v_result := public.archive_company_location_v1(v_manual,'seller-replay');
  if coalesce((v_result->>'archived')::boolean,false) is distinct from true then
    raise exception 'manual location archive failed';
  end if;
  if exists (select 1 from public.company_locations_for_company_v1(v_company,false) where location_id=v_manual) then
    raise exception 'archived location leaked into active company locations';
  end if;
end
$geo06$;
