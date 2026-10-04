
create or replace function public.normalize_company_name_v1(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            coalesce(p_name,''),
            'ÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇáàãâäéèêëíìîïóòõôöúùûüç',
            'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc'
          )
        ),
        '\m(ltda|eireli|me|epp|s\/a|sa)\M',
        ' ',
        'g'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    )
  );
$$;

alter table public.companies
  add column if not exists normalized_name text;

update public.companies
set normalized_name = public.normalize_company_name_v1(name)
where normalized_name is null or normalized_name = '';

create index if not exists companies_normalized_name_idx
  on public.companies (normalized_name);

create or replace function public.create_proposal_v1(
  p_company_name text,
  p_fleet_size integer,
  p_vehicle_profile_code text default 'rodotrem_9_eixos',
  p_financial_version text default null,
  p_monthly_diesel_cost_per_vehicle numeric default null,
  p_monthly_km numeric default null,
  p_consumption_km_l numeric default null,
  p_diesel_price numeric default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_proposal_id uuid;
  v_company_norm text;
  v_calc jsonb;
  v_profile_id uuid;
  v_financial_id uuid;
  v_template_id uuid;
  v_template_version text := '1.0.0';
  v_proposal_status text;
begin
  if nullif(trim(p_company_name), '') is null then
    raise exception 'company_name is required';
  end if;

  if p_fleet_size is null or p_fleet_size <= 0 then
    raise exception 'fleet_size must be greater than zero';
  end if;

  v_company_norm := public.normalize_company_name_v1(p_company_name);

  select id
  into v_company_id
  from public.companies
  where normalized_name = v_company_norm
  order by
    case when enrichment_status = 'enriched' then 0 else 1 end,
    created_at asc
  limit 1;

  if v_company_id is null then
    insert into public.companies (
      name,
      normalized_name,
      enrichment_status
    )
    values (
      trim(p_company_name),
      v_company_norm,
      'pending'
    )
    returning id into v_company_id;
  end if;

  v_calc := public.calculate_proposal_v2(
    p_fleet_size := p_fleet_size,
    p_vehicle_profile_code := p_vehicle_profile_code,
    p_financial_version := p_financial_version,
    p_monthly_km := p_monthly_km,
    p_consumption_km_l := p_consumption_km_l,
    p_diesel_price := p_diesel_price,
    p_monthly_diesel_cost_per_vehicle := p_monthly_diesel_cost_per_vehicle,
    p_tire_price := null,
    p_tire_replacement_factor := null
  );

  select id
  into v_profile_id
  from public.vehicle_profiles
  where code = p_vehicle_profile_code
    and active = true
  limit 1;

  select id
  into v_financial_id
  from public.financial_parameter_sets
  where version = v_calc#>>'{input,financial_version}'
  limit 1;

  select id, version
  into v_template_id, v_template_version
  from public.proposal_templates
  where code = 'og-premium-5-pages'
    and active = true
  order by created_at desc
  limit 1;

  v_proposal_status :=
    case
      when v_calc#>>'{engine,status}' = 'needs_configuration' then 'draft'
      else 'calculating'
    end;

  insert into public.proposals (
    company_id,
    company_name_input,
    fleet_size,
    vehicle_profile_id,
    financial_parameter_set_id,
    proposal_template_id,
    calculation_version,
    template_version,
    status,
    total_tires,
    total_equalizers,
    total_supports,
    investment_total,
    protected_asset_value,
    annual_tire_savings,
    annual_fuel_savings,
    annual_total_savings,
    roi_percent,
    payback_months,
    proposal_snapshot
  )
  values (
    v_company_id,
    trim(p_company_name),
    p_fleet_size,
    v_profile_id,
    v_financial_id,
    v_template_id,
    coalesce(v_calc#>>'{engine,version}', '2.0.0'),
    coalesce(v_template_version, '1.0.0'),
    v_proposal_status,
    nullif(v_calc#>>'{fleet,total_tires}', '')::integer,
    nullif(v_calc#>>'{fleet,total_equalizers}', '')::numeric,
    nullif(v_calc#>>'{fleet,total_supports}', '')::numeric,
    nullif(v_calc#>>'{investment,total}', '')::numeric,
    nullif(v_calc#>>'{roi,protected_asset_value}', '')::numeric,
    nullif(v_calc#>>'{roi,annual_tire_savings}', '')::numeric,
    nullif(v_calc#>>'{roi,annual_fuel_savings_default}', '')::numeric,
    nullif(v_calc#>>'{roi,annual_total_savings}', '')::numeric,
    nullif(v_calc#>>'{roi,roi_percent}', '')::numeric,
    nullif(v_calc#>>'{roi,payback_months}', '')::numeric,
    jsonb_build_object(
      'company',
      jsonb_build_object(
        'id', v_company_id,
        'name_input', trim(p_company_name)
      )
    ) ||
    v_calc ||
    jsonb_build_object(
      'metadata',
      jsonb_build_object(
        'created_by', 'create_proposal_v1',
        'template_code', 'og-premium-5-pages',
        'template_version', coalesce(v_template_version, '1.0.0')
      )
    )
  )
  returning id into v_proposal_id;

  return jsonb_build_object(
    'proposal_id', v_proposal_id,
    'company_id', v_company_id,
    'company_name', trim(p_company_name),
    'fleet_size', p_fleet_size,
    'calculation', v_calc,
    'pipeline', public.pipeline_status_v1(v_proposal_id)
  );
end;
$$;

revoke all on function public.normalize_company_name_v1(text) from public, anon, authenticated;
revoke all on function public.create_proposal_v1(
  text, integer, text, text, numeric, numeric, numeric, numeric
) from public, anon, authenticated;

grant execute on function public.normalize_company_name_v1(text) to service_role;
grant execute on function public.create_proposal_v1(
  text, integer, text, text, numeric, numeric, numeric, numeric
) to service_role;
